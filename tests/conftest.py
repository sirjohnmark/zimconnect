"""
Shared factories and fixtures for the Sanganai API test suite.

Uses factory-boy for model factories and pytest fixtures for
reusable test objects (users with JWT tokens, categories, listings, etc.).
"""

from __future__ import annotations

from decimal import Decimal

import factory
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.categories.models import Category
from apps.common.constants import (
    Currency,
    ListingCondition,
    ListingStatus,
    UserRole,
    ZimbabweCity,
)
from apps.inbox.models import (
    Conversation,
    ConversationParticipant,
    ConversationStatus,
    Message,
    MessageStatus,
    MessageType,
    ParticipantRole,
)
from apps.listings.models import Listing

User = get_user_model()


# ──────────────────────────────────────────────
# Factories
# ──────────────────────────────────────────────


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@test.com")
    username = factory.Sequence(lambda n: f"user{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone = factory.Sequence(lambda n: f"+2637712{n:05d}")
    role = UserRole.BUYER
    is_active = True
    email_verified = True
    phone_verified = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "TestPass123!")
        user = model_class(**kwargs)
        user.set_password(password)
        user.save()
        return user


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")
    is_active = True
    display_order = factory.Sequence(lambda n: n)


class ListingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Listing

    owner = factory.SubFactory(UserFactory, role=UserRole.SELLER)
    title = factory.Sequence(lambda n: f"Listing {n}")
    description = "A test listing description."
    price = Decimal("100.00")
    currency = Currency.USD
    condition = ListingCondition.NEW
    status = ListingStatus.ACTIVE
    category = factory.SubFactory(CategoryFactory)
    location = ZimbabweCity.HARARE


class ConversationFactory(factory.django.DjangoModelFactory):
    """
    Creates a Conversation with optional participants.

    Pass ``participants=[user1, user2]`` as a post-generation kwarg.
    The factory sets buyer/seller/created_by automatically based on participants if listing is given.
    """

    class Meta:
        model = Conversation
        skip_postgeneration_save = True

    status = ConversationStatus.ACTIVE

    @factory.post_generation
    def participants(self, create, extracted, **kwargs):
        if not create or not extracted:
            return
        for user in extracted:
            self.participants.add(user)
        # Set buyer and seller if exactly two participants are given
        if len(extracted) == 2:
            Conversation.objects.filter(pk=self.pk).update(
                buyer=extracted[0],
                seller=extracted[1],
                created_by=extracted[0],
            )
            # Create ConversationParticipant records
            ConversationParticipant.objects.get_or_create(
                conversation=self,
                user=extracted[0],
                defaults={"role": ParticipantRole.BUYER},
            )
            ConversationParticipant.objects.get_or_create(
                conversation=self,
                user=extracted[1],
                defaults={"role": ParticipantRole.SELLER},
            )


class MessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Message

    conversation = factory.SubFactory(ConversationFactory)
    sender = factory.SubFactory(UserFactory)
    content = "Hello, this is a test message."
    message_type = MessageType.TEXT
    status = MessageStatus.SENT


# ──────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────


def _make_auth_client(user: User) -> APIClient:
    """Return an APIClient with a valid JWT Bearer header for *user*."""
    token = RefreshToken.for_user(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return client


# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────


@pytest.fixture(autouse=True)
def clear_django_cache():
    """Clear the Django cache after every test."""
    yield
    from django.core.cache import cache  # noqa: PLC0415
    cache.clear()


@pytest.fixture
def api_client():
    """Unauthenticated DRF APIClient."""
    return APIClient()


@pytest.fixture
def buyer_user(db):
    return UserFactory(role=UserRole.BUYER)


@pytest.fixture
def seller_user(db):
    return UserFactory(role=UserRole.SELLER)


def _enable_2fa(user):
    """Create an enabled TwoFactorDevice for *user* so RequireTwoFactor passes."""
    from apps.accounts.models import TwoFactorDevice
    TwoFactorDevice.objects.update_or_create(
        user=user,
        defaults={"is_enabled": True, "encrypted_secret": "test"},
    )
    return user


@pytest.fixture
def admin_user(db):
    return _enable_2fa(UserFactory(role=UserRole.ADMIN, is_staff=True))


@pytest.fixture
def moderator_user(db):
    return _enable_2fa(UserFactory(role=UserRole.MODERATOR))


@pytest.fixture
def buyer_client(buyer_user):
    return _make_auth_client(buyer_user)


@pytest.fixture
def seller_client(seller_user):
    return _make_auth_client(seller_user)


@pytest.fixture
def admin_client(admin_user):
    return _make_auth_client(admin_user)


@pytest.fixture
def moderator_client(moderator_user):
    return _make_auth_client(moderator_user)


@pytest.fixture
def sample_category(db):
    return CategoryFactory(name="Electronics", slug="electronics")


@pytest.fixture
def child_category(sample_category):
    return CategoryFactory(
        name="Phones",
        slug="phones",
        parent=sample_category,
    )


@pytest.fixture
def sample_listing(seller_user, sample_category):
    return ListingFactory(
        owner=seller_user,
        category=sample_category,
        status=ListingStatus.ACTIVE,
        title="iPhone 15 Pro",
    )


@pytest.fixture
def draft_listing(seller_user, sample_category):
    return ListingFactory(
        owner=seller_user,
        category=sample_category,
        status=ListingStatus.DRAFT,
        title="Draft Laptop",
    )


@pytest.fixture
def sample_conversation(buyer_user, seller_user, sample_listing):
    conv = ConversationFactory(
        participants=[buyer_user, seller_user],
        listing=sample_listing,
        status=ConversationStatus.ACTIVE,
    )
    conv.listing = sample_listing
    conv.save()
    return conv


@pytest.fixture
def sample_message(sample_conversation, buyer_user):
    return MessageFactory(
        conversation=sample_conversation,
        sender=buyer_user,
        content="Is this still available?",
        status=MessageStatus.SENT,
    )
