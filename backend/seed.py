import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.restaurants.models import Restaurant
from apps.menu.models import MenuCategory, MenuItem

def seed_data():
    print("Seeding database...")
    
    # 1. Create Restaurants
    dhabas_data = [
        {"name": "Dhaba A", "address": "Highway 1, Igatpuri", "phone": "9876543210", "prep": 30},
        {"name": "Dhaba B", "address": "Station Road, Igatpuri", "phone": "9876543211", "prep": 45},
        {"name": "Dhaba C", "address": "Bhatsa River Valley, Igatpuri", "phone": "9876543212", "prep": 20},
        {"name": "Dhaba D", "address": "Camel Valley, Igatpuri", "phone": "9876543213", "prep": 35},
    ]
    
    dhabas = []
    for data in dhabas_data:
        restaurant, created = Restaurant.objects.get_or_create(
            name=data["name"],
            defaults={
                "address": data["address"],
                "phone": data["phone"],
                "average_preparation_time": data["prep"],
                "is_active": True
            }
        )
        dhabas.append(restaurant)
        if created:
            print(f"Created Restaurant: {restaurant.name}")

    # 2. Create Menu Categories
    main_dhaba = dhabas[0] # Let's add items to Dhaba A
    
    cat_snacks, _ = MenuCategory.objects.get_or_create(restaurant=main_dhaba, name="Snacks & Fast Food")
    cat_main, _ = MenuCategory.objects.get_or_create(restaurant=main_dhaba, name="Main Course")
    cat_beverages, _ = MenuCategory.objects.get_or_create(restaurant=main_dhaba, name="Beverages")

    # 3. Create Menu Items
    menu_items = [
        {"name": "Misal Pav", "cat": cat_snacks, "price": 80, "veg": True},
        {"name": "Vada Pav", "cat": cat_snacks, "price": 20, "veg": True},
        {"name": "Paneer Butter Masala", "cat": cat_main, "price": 220, "veg": True},
        {"name": "Dal Tadka", "cat": cat_main, "price": 140, "veg": True},
        {"name": "Jeera Rice", "cat": cat_main, "price": 110, "veg": True},
        {"name": "Roti", "cat": cat_main, "price": 15, "veg": True},
        {"name": "Tea", "cat": cat_beverages, "price": 15, "veg": True},
        {"name": "Coffee", "cat": cat_beverages, "price": 25, "veg": True},
    ]

    for item in menu_items:
        obj, created = MenuItem.objects.get_or_create(
            restaurant=main_dhaba,
            name=item["name"],
            defaults={
                "category": item["cat"],
                "price": item["price"],
                "is_veg": item["veg"]
            }
        )
        if created:
            print(f"Added {item['name']} to {main_dhaba.name}")
            
    print("✅ Seeding complete!")

if __name__ == '__main__':
    seed_data()
