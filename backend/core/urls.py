from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.auth_urls')),
    path('api/restaurants/', include('apps.restaurants.urls')),
    path('api/menu/', include('apps.menu.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/admin/', include('apps.orders.admin_urls')),
    path('api/delivery/', include('apps.orders.delivery_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
