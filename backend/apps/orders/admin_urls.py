from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import admin_dashboard_stats, AdminOrderViewSet, admin_pricing_config
from .admin_resources import (
    AdminRestaurantViewSet,
    AdminMenuItemViewSet,
    AdminMenuCategoryViewSet,
    AdminDeliveryBoyViewSet,
    AdminCustomerViewSet,
)

router = DefaultRouter()
router.register(r"orders", AdminOrderViewSet, basename="admin-orders")
router.register(r"restaurants", AdminRestaurantViewSet, basename="admin-restaurants")
router.register(r"menu-items", AdminMenuItemViewSet, basename="admin-menu-items")
router.register(r"menu-categories", AdminMenuCategoryViewSet, basename="admin-menu-categories")
router.register(r"delivery-boys", AdminDeliveryBoyViewSet, basename="admin-delivery-boys")
router.register(r"customers", AdminCustomerViewSet, basename="admin-customers")

urlpatterns = [
    path("dashboard-stats/", admin_dashboard_stats),
    path("pricing-config/", admin_pricing_config),
    path("", include(router.urls)),
]

