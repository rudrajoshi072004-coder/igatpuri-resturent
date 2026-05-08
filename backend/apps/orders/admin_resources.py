from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsAdminUserRole
from apps.users.serializers import AdminDeliveryBoyCreateSerializer, UserMeSerializer
from apps.restaurants.models import Restaurant
from apps.restaurants.serializers import RestaurantSerializer
from apps.menu.models import MenuItem, MenuCategory
from apps.menu.serializers import MenuItemSerializer, MenuCategorySerializer


User = get_user_model()


class AdminRestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all().order_by("name")
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]


class AdminMenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("restaurant", "category").all().order_by("name")
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filterset_fields = ["restaurant", "category", "is_available", "is_veg"]


class AdminMenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.select_related("restaurant").all().order_by("name")
    serializer_class = MenuCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filterset_fields = ["restaurant"]


class AdminDeliveryBoyViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(role="DELIVERY_BOY").select_related("delivery_profile").order_by("id")
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_serializer_class(self):
        if self.action in ["create"]:
            return AdminDeliveryBoyCreateSerializer
        return UserMeSerializer


class AdminCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role="CUSTOMER").order_by("-created_at")
    serializer_class = UserMeSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]

