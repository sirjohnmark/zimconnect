"""
Shared enums and TextChoices for the TRADLINKAPI platform.

Usage in models:
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.BUYER)
"""

from django.db import models


class UserRole(models.TextChoices):
    BUYER = "BUYER", "Buyer"
    SELLER = "SELLER", "Seller"
    ADMIN = "ADMIN", "Admin"
    MODERATOR = "MODERATOR", "Moderator"


class ListingStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    SOLD = "SOLD", "Sold"
    ARCHIVED = "ARCHIVED", "Archived"
    REJECTED = "REJECTED", "Rejected"


class ListingCondition(models.TextChoices):
    NEW = "NEW", "New"
    LIKE_NEW = "LIKE_NEW", "Like New"
    GOOD = "GOOD", "Good"
    FAIR = "FAIR", "Fair"
    POOR = "POOR", "Poor"


class Currency(models.TextChoices):
    USD = "USD", "US Dollar"
    ZWL = "ZWL", "Zimbabwe Dollar"


class ZimbabweCity(models.TextChoices):
    # Major cities
    HARARE = "HARARE", "Harare"
    BULAWAYO = "BULAWAYO", "Bulawayo"
    MUTARE = "MUTARE", "Mutare"
    GWERU = "GWERU", "Gweru"
    KWEKWE = "KWEKWE", "Kwekwe"
    KADOMA = "KADOMA", "Kadoma"
    MASVINGO = "MASVINGO", "Masvingo"
    CHINHOYI = "CHINHOYI", "Chinhoyi"
    BINDURA = "BINDURA", "Bindura"
    CHEGUTU = "CHEGUTU", "Chegutu"
    MARONDERA = "MARONDERA", "Marondera"
    KAROI = "KAROI", "Karoi"
    VICTORIA_FALLS = "VICTORIA_FALLS", "Victoria Falls"
    HWANGE = "HWANGE", "Hwange"
    BEITBRIDGE = "BEITBRIDGE", "Beitbridge"

    # Provincial towns
    CHITUNGWIZA = "CHITUNGWIZA", "Chitungwiza"
    EPWORTH = "EPWORTH", "Epworth"
    NORTON = "NORTON", "Norton"
    RUWA = "RUWA", "Ruwa"
    ZVISHAVANE = "ZVISHAVANE", "Zvishavane"
    CHIREDZI = "CHIREDZI", "Chiredzi"
    CHIPINGE = "CHIPINGE", "Chipinge"
    RUSAPE = "RUSAPE", "Rusape"
    PLUMTREE = "PLUMTREE", "Plumtree"
    GWANDA = "GWANDA", "Gwanda"
    SHURUGWI = "SHURUGWI", "Shurugwi"
    REDCLIFF = "REDCLIFF", "Redcliff"
    KARIBA = "KARIBA", "Kariba"
    NYANGA = "NYANGA", "Nyanga"
    MVURWI = "MVURWI", "Mvurwi"
    GOKWE = "GOKWE", "Gokwe"
    LUPANE = "LUPANE", "Lupane"
    TRIANGLE = "TRIANGLE", "Triangle"
    PENHALONGA = "PENHALONGA", "Penhalonga"
    OTHER = "OTHER", "Other"
