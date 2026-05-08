from django.db import models
from apps.restaurants.models import Restaurant

class MenuCategory(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"

class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_items')
    category = models.ForeignKey(MenuCategory, on_delete=models.SET_NULL, null=True, related_name='items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='menu_items/', null=True, blank=True)
    is_veg = models.BooleanField(default=True)
    is_available = models.BooleanField(default=True)
    preparation_time = models.IntegerField(default=15, help_text="in minutes")

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"
