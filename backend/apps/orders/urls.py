from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, public_pricing_config

router = DefaultRouter()
router.register(r'', OrderViewSet)

urlpatterns = [
    path('pricing-config/', public_pricing_config),
    path('', include(router.urls)),
]
