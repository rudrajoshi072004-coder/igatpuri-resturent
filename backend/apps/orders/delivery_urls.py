from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DeliveryOrderViewSet

router = DefaultRouter()
router.register(r"orders", DeliveryOrderViewSet, basename="delivery-orders")

urlpatterns = [
    path("", include(router.urls)),
]

