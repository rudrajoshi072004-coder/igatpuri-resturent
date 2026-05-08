from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Restaurant
from .serializers import RestaurantSerializer
from apps.menu.models import MenuCategory, MenuItem
from apps.menu.serializers import MenuCategorySerializer, MenuItemSerializer

class RestaurantViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Restaurant.objects.filter(is_active=True)
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny] # Customers can view restaurants without logging in

    def get_queryset(self):
        qs = super().get_queryset()
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    @action(detail=True, methods=["get"], url_path="menu", permission_classes=[AllowAny])
    def menu(self, request, pk=None):
        restaurant = self.get_object()
        categories = MenuCategory.objects.filter(restaurant=restaurant).order_by("id").prefetch_related("items")
        items = MenuItem.objects.filter(restaurant=restaurant, is_available=True).order_by("id")
        return Response(
            {
                "restaurant": RestaurantSerializer(restaurant).data,
                "categories": MenuCategorySerializer(categories, many=True).data,
                "items": MenuItemSerializer(items, many=True).data,
            }
        )
