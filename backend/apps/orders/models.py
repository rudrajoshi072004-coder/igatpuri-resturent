from django.db import models
from django.utils import timezone
import uuid
from django.core.validators import MinValueValidator

from apps.users.models import User
from apps.restaurants.models import Restaurant
from apps.menu.models import MenuItem

class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PLACED = 'PLACED', 'Placed'
        ADMIN_REVIEWING = 'ADMIN_REVIEWING', 'Admin Reviewing'
        CONFIRMED_WITH_RESTAURANT = 'CONFIRMED_WITH_RESTAURANT', 'Confirmed With Restaurant'
        PREPARING = 'PREPARING', 'Preparing'
        DELIVERY_ASSIGNED = 'DELIVERY_ASSIGNED', 'Delivery Assigned'
        REACHED_RESTAURANT = 'REACHED_RESTAURANT', 'Reached Restaurant'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        ON_THE_WAY = 'ON_THE_WAY', 'On The Way'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        COD = 'COD', 'Cash on Delivery'
        UPI_ON_DELIVERY = 'UPI_ON_DELIVERY', 'UPI on Delivery'
        ONLINE_PLACEHOLDER = 'ONLINE_PLACEHOLDER', 'Online (Placeholder)'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COLLECTED = 'COLLECTED', 'Collected'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    order_number = models.CharField(max_length=32, unique=True, db_index=True, null=True, blank=True)
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=15)
    customer_address = models.TextField()
    customer_landmark = models.CharField(max_length=255, blank=True)
    customer_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    customer_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    restaurant = models.ForeignKey(Restaurant, on_delete=models.PROTECT, related_name='orders')
    assigned_delivery_boy = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_deliveries'
    )
    
    food_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    platform_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    rain_rush_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    peak_hour_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    distance_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    final_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.COD)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    order_status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PLACED)
    
    admin_notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            ts = timezone.now().strftime("%Y%m%d%H%M%S")
            rand = uuid.uuid4().hex[:6].upper()
            self.order_number = f"IE-{ts}-{rand}"
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        items = list(self.items.all())
        self.food_total = sum((item.total_price for item in items), 0)
        self.final_total = (
            self.food_total
            + self.delivery_charge
            + self.platform_charge
            + self.rain_rush_charge
            + self.peak_hour_charge
            + self.distance_charge
        )
        return self.final_total

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    item_name_snapshot = models.CharField(max_length=255, default="", blank=True)
    price_snapshot = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} for Order #{self.order.id}"

    def save(self, *args, **kwargs):
        if not self.item_name_snapshot:
            self.item_name_snapshot = self.menu_item.name
        if not self.price_snapshot:
            self.price_snapshot = self.menu_item.price
        self.total_price = self.price_snapshot * self.quantity
        super().save(*args, **kwargs)


class PricingConfig(models.Model):
    base_delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=50, validators=[MinValueValidator(0)])
    platform_charge = models.DecimalField(max_digits=10, decimal_places=2, default=10, validators=[MinValueValidator(0)])
    rain_rush_charge = models.DecimalField(max_digits=10, decimal_places=2, default=30, validators=[MinValueValidator(0)])
    peak_hour_charge = models.DecimalField(max_digits=10, decimal_places=2, default=20, validators=[MinValueValidator(0)])
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    free_delivery_above = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    is_rain_mode_enabled = models.BooleanField(default=False)
    is_peak_mode_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "PricingConfig"


class DistanceChargeSlab(models.Model):
    min_km = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    max_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ["min_km"]

    def __str__(self):
        end = "∞" if self.max_km is None else str(self.max_km)
        return f"{self.min_km}-{end} km: ₹{self.charge}"


class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    method = models.CharField(max_length=20, choices=Order.PaymentMethod.choices)
    status = models.CharField(max_length=20, choices=Order.PaymentStatus.choices, default=Order.PaymentStatus.PENDING)
    collected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments_collected")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"


class NotificationLog(models.Model):
    class RecipientType(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        RESTAURANT = "RESTAURANT", "Restaurant"
        DELIVERY_BOY = "DELIVERY_BOY", "Delivery Boy"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="notifications")
    recipient_type = models.CharField(max_length=20, choices=RecipientType.choices)
    recipient_phone = models.CharField(max_length=15)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
