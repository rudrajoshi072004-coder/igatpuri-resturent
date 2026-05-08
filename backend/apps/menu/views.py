from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import MenuItem, MenuCategory
from .serializers import MenuItemSerializer, MenuCategorySerializer

class MenuItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MenuItem.objects.filter(is_available=True)
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['restaurant', 'category', 'is_veg']

class MenuCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
    permission_classes = [AllowAny]
    filterset_fields = ['restaurant']
