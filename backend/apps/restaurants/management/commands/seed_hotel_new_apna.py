"""Seed the full HOTEL NEW APNA (formerly "Dhaba A") menu.

Re-runnable: it renames the restaurant, wipes its existing categories/items and
recreates the complete menu transcribed from the printed card. Prices that are
quoted as Half/Full on the card are stored as the half (base) price, with the
full price noted in the item description so the cart math stays correct.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.restaurants.models import Restaurant
from apps.menu.models import MenuCategory, MenuItem


V = True   # veg
N = False  # non-veg


# (name, price, is_veg, description)
MENU = [
    ("Breakfast", [
        ("Aloo / Gobi / Kanda Paratha", 80, V, "Choice of stuffed paratha"),
        ("Paneer / Mix Paratha", 110, V, "Paneer, kanda and aloo mix"),
        ("Cheese Paratha", 120, V, ""),
        ("Wada Pav", 130, V, "Plate"),
        ("Misal Pav", 80, V, "Spicy Maharashtrian misal"),
        ("Veg Sandwich", 50, V, ""),
        ("Veg & Cheese Grilled Sandwich", 80, V, ""),
        ("Poha", 60, V, ""),
        ("Kanda Bhajiya", 80, V, ""),
        ("Aloo Bhajiya", 80, V, ""),
        ("Mix Bhajiya", 80, V, ""),
        ("Aloo Khichdi", 120, V, ""),
        ("Chole Bhature", 120, V, ""),
        ("Puri Bhaji", 100, V, ""),
        ("Pav Bhaji", 80, V, ""),
        ("Cheese Pakoda", 150, V, ""),
        ("Sandwich", 80, V, ""),
        ("Upma", 80, V, ""),
        ("Paneer Pakoda", 130, V, ""),
    ]),
    ("Hot Drinks", [
        ("Tea", 20, V, ""),
        ("Coffee", 30, V, ""),
        ("Milk", 30, V, ""),
        ("Black Tea", 20, V, ""),
        ("Black Coffee", 20, V, ""),
        ("Lemon Tea", 20, V, ""),
    ]),
    ("Cold Drinks", [
        ("Butter Milk", 40, V, ""),
        ("Lassi", 50, V, ""),
        ("Aerated Water (500 ml)", 70, V, ""),
        ("Aerated Water (200 ml)", 25, V, ""),
        ("Jeera Soda", 25, V, ""),
        ("Bottled Water", 20, V, ""),
        ("Fresh Lime Soda", 40, V, ""),
    ]),
    ("Veg Starters", [
        ("Lasun Fry", 120, V, ""),
        ("Chana Garlic Fry", 140, V, ""),
        ("Chana Koliwada", 160, V, ""),
        ("Green Peas Dry", 110, V, ""),
        ("Aloo Chat", 110, V, ""),
        ("Peanut Chat", 100, V, ""),
        ("Paneer Tikka", 170, V, ""),
        ("Tandoori Aloo Gobi", 200, V, ""),
        ("Cheese Chilly Balls", 270, V, ""),
        ("Cheese Malai Tikka", 220, V, ""),
        ("Aloo Corn Tikki", 120, V, ""),
        ("Peanut Masala", 100, V, ""),
        ("Finger Chips", 110, V, ""),
        ("Hara Bhara Kabab", 180, V, ""),
        ("Paneer Lollipop", 200, V, ""),
        ("Veg Lollipop", 180, V, ""),
        ("Kuch Bhi Dish", 150, V, ""),
    ]),
    ("Chicken Starters", [
        ("Chicken Tandoori", 750, N, "Full"),
        ("Chicken Crispy", 250, N, ""),
        ("Chicken Roast", 200, N, ""),
        ("Chicken Tikka", 300, N, ""),
        ("Chicken Chilly", 300, N, ""),
        ("Chicken Lollypop", 200, N, ""),
        ("Chicken Dry Fry", 200, N, ""),
        ("Chicken Sukha", 180, N, ""),
        ("Chicken Manchurian", 250, N, ""),
    ]),
    ("Chinese", [
        ("Veg Manchurian", 200, V, ""),
        ("Paneer Chilly", 250, V, ""),
        ("Soyabean Chilly", 180, V, ""),
        ("Aloo Chilly", 180, V, ""),
        ("Mushroom Chilly", 180, V, ""),
        ("Paneer Manchurian", 200, V, ""),
        ("Aloo Crispy", 180, V, ""),
        ("Veg Crispy", 180, V, ""),
        ("Paneer Crispy", 200, V, ""),
        ("Paneer 65", 200, V, ""),
        ("Paneer Koliwada", 200, V, ""),
    ]),
    ("Noodles & Fried Rice", [
        ("Hakka Noodles", 160, V, "Half / Full ₹160 / ₹200"),
        ("Veg Fried Rice", 170, V, "Half / Full ₹170 / ₹190"),
        ("Veg Schezwan Rice", 180, V, "Half / Full ₹180 / ₹220"),
        ("Veg Schezwan Noodles", 180, V, "Half / Full ₹180 / ₹220"),
        ("Veg Triple Schezwan Fried Rice", 250, V, "Half / Full ₹250 / ₹300"),
    ]),
    ("Soups", [
        ("Dal Shorba", 100, V, ""),
        ("Palak Shorba", 100, V, ""),
        ("Tomato Shorba", 80, V, ""),
        ("Chicken Shorba", 130, N, ""),
        ("Mutton Shorba", 160, N, ""),
        ("Veg Clear Soup", 100, V, "Half / Full ₹100 / ₹150"),
        ("Veg Manchow Soup", 100, V, "Half / Full ₹100 / ₹150"),
        ("Hot & Sour Soup", 100, V, "Half / Full ₹100 / ₹150"),
        ("Sweet Corn Veg Soup", 100, V, "Half / Full ₹100 / ₹150"),
    ]),
    ("Main Course Veg", [
        ("Apna Special", 300, V, "Chef's special"),
        ("Green Peas Masala", 140, V, ""),
        ("Lasuni Methi", 160, V, ""),
        ("Veg Kolhapuri", 160, V, ""),
        ("Mix Veg", 130, V, ""),
        ("Bhindi Masala", 160, V, ""),
        ("Bhindi Fry", 100, V, ""),
        ("Jeera Aloo", 100, V, ""),
        ("Aloo Jodhpuri", 100, V, ""),
        ("Sev Bhaji", 90, V, ""),
        ("Sev Tamatar", 100, V, ""),
        ("Veg Maratha", 180, V, ""),
        ("Kaju Curry", 220, V, ""),
        ("Kaju Masala", 220, V, ""),
        ("Kaju Butter Masala", 220, V, ""),
        ("Veg Tiranga", 220, V, ""),
        ("Veg Patiyala", 250, V, ""),
        ("Kadhi Pakoda", 120, V, ""),
        ("Baigan Masala", 100, V, ""),
        ("Palak Lasuni", 140, V, ""),
        ("Mushroom Masala", 200, V, ""),
        ("Mushroom Curry", 180, V, ""),
        ("Veg Hariyali", 150, V, ""),
        ("Pithala", 100, V, ""),
        ("Veg Bhuna", 140, V, ""),
        ("Malai Kofta", 180, V, ""),
        ("Veg Kofta", 150, V, ""),
    ]),
    ("Paneer Specialities", [
        ("Paneer Tikka Masala", 280, V, ""),
        ("Paneer Masala", 160, V, ""),
        ("Mutter Paneer", 170, V, ""),
        ("Paneer Bhurji", 190, V, ""),
        ("Palak Paneer", 160, V, ""),
        ("Paneer Handi", 380, V, ""),
        ("Paneer Do Pyaza", 200, V, ""),
        ("Kadai Paneer", 200, V, ""),
        ("Shahi Paneer", 200, V, ""),
        ("Paneer Makhanwala", 200, V, ""),
        ("Paneer Butter Masala", 220, V, ""),
        ("Paneer Kolhapuri", 180, V, ""),
        ("Paneer Pasanda", 200, V, ""),
        ("Paneer Lababdar", 200, V, ""),
        ("Paneer Achari", 180, V, ""),
        ("Paneer Kofta", 220, V, ""),
        ("Paneer Dilruba", 200, V, ""),
        ("Paneer Lajiz", 200, V, ""),
    ]),
    ("Dal", [
        ("Dal Fry", 100, V, ""),
        ("Dal Tadka", 120, V, ""),
        ("Dal Makhni", 180, V, ""),
        ("Aloo Mattar", 100, V, ""),
        ("Aloo Gobi", 110, V, ""),
        ("Aloo Palak", 110, V, ""),
        ("Chana Masala", 110, V, ""),
        ("Akkha Masoor", 90, V, ""),
        ("Dal Lahori", 120, V, ""),
    ]),
    ("Rice & Veg Biryani", [
        ("Steam Rice", 120, V, ""),
        ("Jeera Rice", 130, V, ""),
        ("Dal Khichda", 150, V, "Half / Full ₹150 / ₹240"),
        ("Veg Biryani", 170, V, ""),
        ("Veg Pulao", 180, V, ""),
        ("Paneer Pulao", 200, V, ""),
        ("Butter Dal Khichda", 260, V, ""),
        ("Dal Khichda Tadka", 260, V, ""),
        ("Paneer Biryani", 200, V, ""),
        ("Kaju Paneer Biryani", 220, V, ""),
        ("Mushroom Biryani", 200, V, ""),
    ]),
    ("Biryani (Non-Veg)", [
        ("Chicken Biryani", 220, N, ""),
        ("Chicken Dum Biryani", 230, N, ""),
        ("Chicken Hyderabadi Biryani", 210, N, ""),
        ("Mutton Biryani", 280, N, ""),
        ("Mutton Dum Biryani", 280, N, ""),
        ("Mutton Hyderabadi Biryani", 270, N, ""),
    ]),
    ("Main Course Non-Veg", [
        ("Boiled Egg", 30, N, ""),
        ("Masala Omlet", 80, N, ""),
        ("Egg Bhurji", 90, N, ""),
        ("Egg Curry", 100, N, ""),
        ("Egg Masala", 120, N, ""),
        ("Chicken Masala", 180, N, ""),
        ("Chicken Curry", 180, N, ""),
        ("Chicken Maratha", 250, N, ""),
        ("Butter Chicken Masala", 200, N, ""),
        ("Chicken Lapeta", 180, N, ""),
        ("Chicken Khema Lapeta", 240, N, ""),
        ("Chicken Patiyala", 250, N, ""),
        ("Chicken Achari", 180, N, ""),
        ("Chicken Tikka Masala", 300, N, ""),
        ("Chicken Kadhai", 180, N, ""),
        ("Chicken Do Pyaza", 180, N, ""),
        ("Chicken Makhanwala", 180, N, ""),
        ("Chicken Lasooni", 180, N, ""),
        ("Chicken Kolhapuri", 200, N, ""),
        ("Chicken Handi", 400, N, "Half / Full ₹400 / ₹750"),
        ("Gavthi Chicken", 1000, N, "Full"),
        ("Butter Chicken Handi", 450, N, "Half / Full ₹450 / ₹800"),
        ("Mutton Curry", 220, N, ""),
        ("Mutton Masala", 220, N, ""),
        ("Sukha Mutton", 250, N, ""),
        ("Mutton Rogan Josh", 220, N, ""),
        ("Mutton Kheema Masala", 230, N, ""),
        ("Mutton Gosht", 220, N, ""),
        ("Mutton Handi", 450, N, "Half / Full ₹450 / ₹800"),
    ]),
    ("Roti & Breads", [
        ("Tandoori Roti", 15, V, ""),
        ("Butter Roti", 20, V, ""),
        ("Naan", 35, V, ""),
        ("Butter Naan", 50, V, ""),
        ("Garlic Naan", 60, V, ""),
        ("Cheese Garlic Naan", 80, V, ""),
        ("Kulcha", 50, V, ""),
        ("Butter Kulcha", 60, V, ""),
        ("Lacha Paratha", 50, V, ""),
        ("Butter Lacha Paratha", 60, V, ""),
        ("Chapati", 15, V, ""),
        ("Bhakri", 30, V, ""),
    ]),
    ("Papad, Raita & Salad", [
        ("Papad Roast", 15, V, ""),
        ("Papad Fry", 20, V, ""),
        ("Masala Papad", 50, V, ""),
        ("Nagli Masala Papad", 60, V, ""),
        ("Nagli Roast", 40, V, ""),
        ("Nagli Fry", 30, V, ""),
        ("Boondi Raita", 100, V, ""),
        ("Veg Raita", 80, V, ""),
        ("Green Salad", 60, V, ""),
    ]),
]


class Command(BaseCommand):
    help = "Rename 'Dhaba A' to 'HOTEL NEW APNA' and load its full menu."

    @transaction.atomic
    def handle(self, *args, **options):
        restaurant = (
            Restaurant.objects.filter(name="HOTEL NEW APNA").first()
            or Restaurant.objects.filter(name="Dhaba A").first()
        )
        if restaurant is None:
            restaurant = Restaurant.objects.create(
                name="HOTEL NEW APNA",
                phone="7066267841",
                address="Near S.T. Check Post, Mumbai-Agra National Highway, "
                        "Opp. Petrol Pump, Igatpuri, Dist. Nashik",
            )

        restaurant.name = "HOTEL NEW APNA"
        restaurant.description = "Kerala Dhaba since 1980 - Veg & Non-Veg. Take away service available."
        restaurant.phone = "7066267841"
        restaurant.address = (
            "Near S.T. Check Post, Mumbai-Agra National Highway, "
            "Opp. Petrol Pump, Igatpuri, Dist. Nashik"
        )
        restaurant.is_active = True
        restaurant.is_featured = True
        restaurant.average_preparation_time = 30
        restaurant.save()

        # Wipe existing menu so the command is safely re-runnable.
        MenuItem.objects.filter(restaurant=restaurant).delete()
        MenuCategory.objects.filter(restaurant=restaurant).delete()

        total_items = 0
        for category_name, items in MENU:
            category = MenuCategory.objects.create(restaurant=restaurant, name=category_name)
            for name, price, is_veg, description in items:
                MenuItem.objects.create(
                    restaurant=restaurant,
                    category=category,
                    name=name,
                    description=description,
                    price=price,
                    is_veg=is_veg,
                    is_available=True,
                    preparation_time=15,
                )
                total_items += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"HOTEL NEW APNA seeded: {len(MENU)} categories, {total_items} items "
                f"(restaurant id={restaurant.id})."
            )
        )
