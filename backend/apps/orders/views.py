from django.utils import timezone
from django.db.models import Count, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.menu.models import MenuItem
from apps.restaurants.models import Restaurant
from apps.users.models import User
from apps.users.permissions import IsAdminUserRole, IsDeliveryBoyRole

from .models import Order, Payment, PricingConfig, DistanceChargeSlab
from .serializers import (
    OrderCreateSerializer,
    OrderReadSerializer,
    PricingConfigSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-created_at")
    permission_classes = [AllowAny]  # guest checkout allowed

    def get_serializer_class(self):
        if self.action in ["create"]:
            return OrderCreateSerializer
        return OrderReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderReadSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path=r"(?P<order_number>[^/]+)/track", permission_classes=[AllowAny])
    def track(self, request, order_number=None):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        data = OrderReadSerializer(order).data
        # keep tracking response small
        return Response(
            {
                "order_number": order.order_number,
                "order_status": order.order_status,
                "payment_status": order.payment_status,
                "restaurant": {"id": order.restaurant_id, "name": order.restaurant.name},
                "final_total": order.final_total,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
            }
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def public_pricing_config(request):
    cfg = PricingConfig.objects.order_by("-updated_at").first() or PricingConfig.objects.create()
    return Response(PricingConfigSerializer(cfg).data)


# ------------------------
# Admin APIs
# ------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUserRole])
def admin_dashboard_stats(request):
    today = timezone.localdate()
    orders_today = Order.objects.filter(created_at__date=today)
    today_orders_count = orders_today.count()
    today_revenue = orders_today.filter(order_status=Order.OrderStatus.DELIVERED, payment_status=Order.PaymentStatus.COLLECTED).aggregate(
        total=Sum("final_total")
    )["total"] or 0
    pending_orders_count = Order.objects.exclude(order_status__in=[Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED]).count()
    active_delivery_boys_count = User.objects.filter(role=User.Role.DELIVERY_BOY, delivery_profile__is_available=True, is_active=True).count()

    return Response(
        {
            "today_orders": today_orders_count,
            "today_revenue": today_revenue,
            "pending_orders": pending_orders_count,
            "active_delivery_boys": active_delivery_boys_count,
        }
    )


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.select_related("restaurant", "assigned_delivery_boy").prefetch_related("items").order_by("-created_at")
    serializer_class = OrderReadSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("order_status")
        if new_status not in Order.OrderStatus.values:
            return Response({"detail": "Invalid order_status"}, status=status.HTTP_400_BAD_REQUEST)
        order.order_status = new_status
        order.save()
        return Response(OrderReadSerializer(order).data)

    @action(detail=True, methods=["patch"], url_path="charges")
    def update_charges(self, request, pk=None):
        order = self.get_object()
        for field in ["delivery_charge", "platform_charge", "rain_rush_charge", "peak_hour_charge", "distance_charge"]:
            if field in request.data:
                setattr(order, field, request.data.get(field) or 0)
        order.recalculate_totals()
        order.save()
        return Response(OrderReadSerializer(order).data)

    @action(detail=True, methods=["patch"], url_path="assign-delivery-boy")
    def assign_delivery_boy(self, request, pk=None):
        order = self.get_object()
        delivery_boy_id = request.data.get("delivery_boy_id")
        if not delivery_boy_id:
            return Response({"detail": "delivery_boy_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        boy = User.objects.filter(id=delivery_boy_id, role=User.Role.DELIVERY_BOY, is_active=True).first()
        if not boy:
            return Response({"detail": "Delivery boy not found"}, status=status.HTTP_404_NOT_FOUND)
        order.assigned_delivery_boy = boy
        order.order_status = Order.OrderStatus.DELIVERY_ASSIGNED
        order.save()
        return Response(OrderReadSerializer(order).data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsAdminUserRole])
def admin_pricing_config(request):
    cfg = PricingConfig.objects.order_by("-updated_at").first() or PricingConfig.objects.create()
    if request.method == "GET":
        return Response(PricingConfigSerializer(cfg).data)
    serializer = PricingConfigSerializer(cfg, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ------------------------
# Delivery APIs
# ------------------------


class DeliveryOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderReadSerializer
    permission_classes = [IsAuthenticated, IsDeliveryBoyRole]

    def get_queryset(self):
        return (
            Order.objects.select_related("restaurant", "assigned_delivery_boy")
            .prefetch_related("items")
            .filter(assigned_delivery_boy=self.request.user)
            .order_by("-created_at")
        )

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("order_status")
        allowed = {
            Order.OrderStatus.REACHED_RESTAURANT,
            Order.OrderStatus.PICKED_UP,
            Order.OrderStatus.ON_THE_WAY,
            Order.OrderStatus.DELIVERED,
        }
        if new_status not in allowed:
            return Response({"detail": "Invalid status for delivery"}, status=status.HTTP_400_BAD_REQUEST)
        order.order_status = new_status
        order.save()
        return Response(OrderReadSerializer(order).data)

    @action(detail=True, methods=["patch"], url_path="payment-collected")
    def payment_collected(self, request, pk=None):
        order = self.get_object()
        if order.payment_method not in [Order.PaymentMethod.COD, Order.PaymentMethod.UPI_ON_DELIVERY]:
            return Response({"detail": "Payment collection not applicable"}, status=status.HTTP_400_BAD_REQUEST)
        order.payment_status = Order.PaymentStatus.COLLECTED
        order.save()
        Payment.objects.create(
            order=order,
            amount=order.final_total,
            method=order.payment_method,
            status=Order.PaymentStatus.COLLECTED,
            collected_by=request.user,
        )
        return Response(OrderReadSerializer(order).data)
