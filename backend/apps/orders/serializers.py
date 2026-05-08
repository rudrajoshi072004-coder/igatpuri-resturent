from decimal import Decimal

from rest_framework import serializers

from apps.menu.models import MenuItem
from apps.users.models import User

from .models import Order, OrderItem, PricingConfig, DistanceChargeSlab
from .pricing import compute_charges


class OrderItemCreateSerializer(serializers.Serializer):
    menu_item = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item",
            "item_name_snapshot",
            "price_snapshot",
            "quantity",
            "total_price",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_name",
            "customer_phone",
            "customer_address",
            "customer_landmark",
            "customer_latitude",
            "customer_longitude",
            "restaurant",
            "payment_method",
            "items",
            "food_total",
            "delivery_charge",
            "platform_charge",
            "rain_rush_charge",
            "peak_hour_charge",
            "distance_charge",
            "final_total",
            "payment_status",
            "order_status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "food_total",
            "delivery_charge",
            "platform_charge",
            "rain_rush_charge",
            "peak_hour_charge",
            "distance_charge",
            "final_total",
            "payment_status",
            "order_status",
            "created_at",
        ]

    def validate(self, attrs):
        items = attrs.get("items") or []
        if not items:
            raise serializers.ValidationError({"items": "Cart cannot be empty"})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context.get("request")
        user = getattr(request, "user", None)
        customer = user if (user and user.is_authenticated and user.role == User.Role.CUSTOMER) else None

        restaurant = validated_data["restaurant"]
        menu_ids = [it["menu_item"] for it in items_data]
        menu_items = list(MenuItem.objects.filter(id__in=menu_ids, restaurant=restaurant))
        menu_by_id = {mi.id: mi for mi in menu_items}

        created_items: list[OrderItem] = []
        order = Order.objects.create(customer=customer, **validated_data)

        for it in items_data:
            mi = menu_by_id.get(it["menu_item"])
            if mi is None:
                raise serializers.ValidationError({"items": f"Invalid menu item {it['menu_item']} for this restaurant"})
            if not mi.is_available:
                raise serializers.ValidationError({"items": f"Menu item unavailable: {mi.name}"})
            qty = int(it["quantity"])
            oi = OrderItem.objects.create(
                order=order,
                menu_item=mi,
                item_name_snapshot=mi.name,
                price_snapshot=mi.price,
                quantity=qty,
            )
            created_items.append(oi)

        order.recalculate_totals()

        # Pricing logic (distance not available yet; can be added later).
        charges = compute_charges(distance_km=None)
        order.delivery_charge = charges.delivery_charge
        order.platform_charge = charges.platform_charge
        order.rain_rush_charge = charges.rain_rush_charge
        order.peak_hour_charge = charges.peak_hour_charge
        order.distance_charge = charges.distance_charge
        order.recalculate_totals()

        order.save()
        return order


class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    assigned_delivery_boy_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"

    def get_assigned_delivery_boy_name(self, obj):
        if not obj.assigned_delivery_boy:
            return None
        return (obj.assigned_delivery_boy.get_full_name() or obj.assigned_delivery_boy.username).strip()


class PricingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingConfig
        fields = "__all__"


class DistanceChargeSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistanceChargeSlab
        fields = "__all__"
