from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.users.models import DeliveryBoyProfile, CustomerProfile
from apps.restaurants.models import Restaurant
from apps.menu.models import MenuCategory, MenuItem
from apps.orders.models import PricingConfig, DistanceChargeSlab


User = get_user_model()


class Command(BaseCommand):
    help = "Seed Igatpuri Eats MVP data (admin, delivery boys, restaurants, menu, pricing)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Igatpuri Eats data...")

        admin_email = "admin@igatpurieats.com"
        admin, created = User.objects.get_or_create(
            username=admin_email,
            defaults={"email": admin_email, "role": User.Role.ADMIN, "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password("admin123")
            admin.save()
        else:
            if admin.role != User.Role.ADMIN:
                admin.role = User.Role.ADMIN
                admin.is_staff = True
                admin.is_superuser = True
                admin.save()

        def upsert_delivery(email, phone):
            user, c = User.objects.get_or_create(
                username=email,
                defaults={"email": email, "role": User.Role.DELIVERY_BOY, "phone": phone, "is_active": True},
            )
            if c:
                user.set_password("boy123")
                user.save()
            DeliveryBoyProfile.objects.get_or_create(
                user=user,
                defaults={"phone": phone, "vehicle_number": "MH-00-TEST", "is_available": True},
            )
            return user

        upsert_delivery("boy1@igatpurieats.com", "9876543210")
        upsert_delivery("boy2@igatpurieats.com", "9876543211")

        restaurants = []
        for name in ["Dhaba A", "Dhaba B", "Dhaba C", "Dhaba D"]:
            r, _ = Restaurant.objects.get_or_create(
                name=name,
                defaults={
                    "phone": "9000000000",
                    "address": f"{name}, Igatpuri",
                    "is_active": True,
                    "is_featured": name == "Dhaba A",
                    "average_preparation_time": 30,
                },
            )
            restaurants.append(r)

        menu_seed = [
            ("Misal Pav", 60, True),
            ("Vada Pav", 20, True),
            ("Tea", 15, True),
            ("Coffee", 25, True),
            ("Pakoda", 80, True),
            ("Paneer Butter Masala", 180, True),
            ("Dal Tadka", 140, True),
            ("Jeera Rice", 120, True),
            ("Roti", 15, True),
            ("Veg Thali", 220, True),
        ]

        for r in restaurants:
            cat, _ = MenuCategory.objects.get_or_create(restaurant=r, name="Main")
            for item_name, price, is_veg in menu_seed:
                MenuItem.objects.get_or_create(
                    restaurant=r,
                    category=cat,
                    name=item_name,
                    defaults={
                        "price": price,
                        "is_veg": is_veg,
                        "is_available": True,
                        "preparation_time": 15,
                    },
                )

        cfg = PricingConfig.objects.order_by("-updated_at").first() or PricingConfig.objects.create()
        cfg.base_delivery_charge = 50
        cfg.platform_charge = 10
        cfg.rain_rush_charge = 30
        cfg.peak_hour_charge = 20
        cfg.is_rain_mode_enabled = False
        cfg.is_peak_mode_enabled = False
        cfg.save()

        # Distance slabs
        slabs = [
            (0, 2, 20),
            (2, 5, 40),
            (5, 10, 80),
            (10, None, 120),
        ]
        for min_km, max_km, charge in slabs:
            DistanceChargeSlab.objects.get_or_create(min_km=min_km, max_km=max_km, defaults={"charge": charge})

        self.stdout.write(self.style.SUCCESS("Seed complete."))

