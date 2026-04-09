"""
Seed Zimbabwe-relevant marketplace categories.

Usage:
    python manage.py shell < scripts/seed_categories.py

Or from Django shell:
    exec(open("scripts/seed_categories.py").read())
"""

import django
import os
import sys

# Bootstrap Django if running standalone
if not django.conf.settings.configured:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    django.setup()

from apps.categories.models import Category  # noqa: E402

# ──────────────────────────────────────────────
# Category tree: {root: [subcategories]}
# ──────────────────────────────────────────────
CATEGORY_TREE: dict[tuple[str, str], list[str]] = {
    ("Electronics", "📱"): [
        "Mobile Phones",
        "Laptops & Computers",
        "TVs & Audio",
        "Gaming & Consoles",
        "Accessories & Parts",
    ],
    ("Vehicles", "🚗"): [
        "Cars",
        "Motorcycles & Scooters",
        "Trucks & Buses",
        "Vehicle Parts",
        "Boats & Watercraft",
    ],
    ("Property", "🏠"): [
        "Houses for Sale",
        "Houses for Rent",
        "Land & Plots",
        "Commercial Property",
        "Rooms & Flatshare",
    ],
    ("Fashion", "👗"): [
        "Women's Clothing",
        "Men's Clothing",
        "Shoes & Footwear",
        "Bags & Accessories",
        "Jewellery & Watches",
    ],
    ("Home & Garden", "🏡"): [
        "Furniture",
        "Kitchen & Appliances",
        "Garden & Outdoor",
        "Home Décor",
        "Tools & DIY",
    ],
    ("Agriculture", "🌾"): [
        "Farming Equipment",
        "Livestock",
        "Seeds & Fertiliser",
        "Irrigation & Water",
        "Farm Produce",
    ],
    ("Jobs", "💼"): [
        "Full-Time",
        "Part-Time & Contract",
        "Internships",
        "Remote & Freelance",
    ],
    ("Services", "🔧"): [
        "Repair & Maintenance",
        "Transport & Logistics",
        "Cleaning & Domestic",
        "Education & Tutoring",
        "Health & Beauty",
    ],
    ("Baby & Kids", "👶"): [
        "Baby Clothing",
        "Toys & Games",
        "Prams & Car Seats",
        "Kids Furniture",
    ],
    ("Sports & Outdoors", "⚽"): [
        "Gym & Fitness",
        "Team Sports",
        "Camping & Hiking",
        "Bicycles",
        "Musical Instruments",
    ],
}


def seed() -> None:
    created_roots = 0
    created_children = 0

    for order, ((root_name, icon), children) in enumerate(CATEGORY_TREE.items()):
        root, root_is_new = Category.objects.get_or_create(
            name=root_name,
            defaults={
                "icon": icon,
                "display_order": order * 10,
                "is_active": True,
            },
        )
        if root_is_new:
            created_roots += 1

        for child_order, child_name in enumerate(children):
            _, child_is_new = Category.objects.get_or_create(
                name=child_name,
                parent=root,
                defaults={
                    "display_order": child_order,
                    "is_active": True,
                },
            )
            if child_is_new:
                created_children += 1

    total = created_roots + created_children
    print(
        f"Seeded {created_roots} root categories and "
        f"{created_children} subcategories ({total} total new)."
    )


if __name__ == "__main__":
    seed()
else:
    # When loaded via `exec()` or `shell <`
    seed()
