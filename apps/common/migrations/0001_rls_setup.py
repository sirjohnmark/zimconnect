"""
PostgreSQL Row-Level Security (RLS) setup for Sanganai marketplace.

This migration:
  1. Creates helper PL/pgSQL functions that read the per-request session
     variables set by RLSJWTAuthentication / RLSContextMiddleware.
  2. Enables RLS on every table containing user-owned or private data.
  3. Creates PERMISSIVE policies for each access pattern.

Session variables (set via set_config / SET LOCAL inside the ATOMIC_REQUESTS
transaction wrapping each request):
  app.current_user_id   — authenticated user PK as text, '' for anonymous
  app.current_user_role — role string (BUYER/SELLER/ADMIN/MODERATOR), '' for anon
  app.service_role      — 'true' for trusted backend/Celery operations

IMPORTANT — database user privileges:
  RLS is bypassed for roles that have BYPASSRLS or are superusers.
  Supabase's default `postgres` role has BYPASSRLS, which means policies are
  NOT enforced when connecting as postgres. For RLS to be effective at the
  database layer you must connect with a non-superuser role without BYPASSRLS.

  Recommended Supabase setup (run once in SQL editor):
    CREATE ROLE web_user NOINHERIT NOCREATEDB NOCREATEROLE;
    GRANT USAGE ON SCHEMA public TO web_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_user;
  Then set DATABASE_URL to connect as web_user.

Defense-in-depth note:
  The application layer (Django ORM + DRF permission classes) is the primary
  access control layer. RLS here is secondary protection against SQL injection,
  ORM bugs, or direct DB access.
"""

from django.db import migrations

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

CREATE_HELPERS = """
-- Returns the current request's user PK, or NULL for anonymous / service.
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::bigint;
$$;

-- Returns the current request's role string, or NULL for anonymous.
CREATE OR REPLACE FUNCTION app_current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF(current_setting('app.current_user_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT app_current_user_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION app_is_moderator()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT app_current_user_role() IN ('ADMIN', 'MODERATOR');
$$;

CREATE OR REPLACE FUNCTION app_is_seller()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT app_current_user_role() = 'SELLER';
$$;

-- Returns true when the request is a trusted backend/Celery operation.
CREATE OR REPLACE FUNCTION app_is_service_role()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT current_setting('app.service_role', true) = 'true';
$$;
"""

DROP_HELPERS = """
DROP FUNCTION IF EXISTS app_is_service_role();
DROP FUNCTION IF EXISTS app_is_seller();
DROP FUNCTION IF EXISTS app_is_moderator();
DROP FUNCTION IF EXISTS app_is_admin();
DROP FUNCTION IF EXISTS app_current_user_role();
DROP FUNCTION IF EXISTS app_current_user_id();
"""

# ---------------------------------------------------------------------------
# users table
# ---------------------------------------------------------------------------

USERS_RLS = """
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Users can read their own full profile.
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = app_current_user_id());

-- Admins/moderators can read all user profiles.
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (app_is_moderator());

-- Service role can read all users (background tasks, Celery).
CREATE POLICY "users_select_service"
  ON users FOR SELECT
  USING (app_is_service_role());

-- User can update only their own safe profile fields (field-level
-- restrictions are enforced by UserUpdateSerializer in the app layer).
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = app_current_user_id());

-- Admins can update any user (role changes, activation, etc.).
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (app_is_admin());

-- Service role can update any user (Celery tasks, password reset, OTP, etc.).
CREATE POLICY "users_update_service"
  ON users FOR UPDATE
  USING (app_is_service_role());

-- Only service role inserts users (registration path goes through Django).
CREATE POLICY "users_insert_service"
  ON users FOR INSERT
  WITH CHECK (app_is_service_role());

-- Soft-delete only — no hard DELETE via the API.
CREATE POLICY "users_delete_admin"
  ON users FOR DELETE
  USING (app_is_admin());
"""

USERS_RLS_DROP = """
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "users_insert_service" ON users;
DROP POLICY IF EXISTS "users_update_service" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_service" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# totp_devices table
# ---------------------------------------------------------------------------

TOTP_RLS = """
ALTER TABLE totp_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_devices FORCE ROW LEVEL SECURITY;

CREATE POLICY "totp_select_own"
  ON totp_devices FOR SELECT
  USING (user_id = app_current_user_id());

CREATE POLICY "totp_select_admin"
  ON totp_devices FOR SELECT
  USING (app_is_admin());

CREATE POLICY "totp_select_service"
  ON totp_devices FOR SELECT
  USING (app_is_service_role());

CREATE POLICY "totp_write_own"
  ON totp_devices FOR ALL
  USING (user_id = app_current_user_id());

CREATE POLICY "totp_write_service"
  ON totp_devices FOR ALL
  USING (app_is_service_role());
"""

TOTP_RLS_DROP = """
DROP POLICY IF EXISTS "totp_write_service" ON totp_devices;
DROP POLICY IF EXISTS "totp_write_own" ON totp_devices;
DROP POLICY IF EXISTS "totp_select_service" ON totp_devices;
DROP POLICY IF EXISTS "totp_select_admin" ON totp_devices;
DROP POLICY IF EXISTS "totp_select_own" ON totp_devices;
ALTER TABLE totp_devices DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# backup_codes table
# ---------------------------------------------------------------------------

BACKUP_CODES_RLS = """
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes FORCE ROW LEVEL SECURITY;

CREATE POLICY "backup_codes_own"
  ON backup_codes FOR ALL
  USING (user_id = app_current_user_id());

CREATE POLICY "backup_codes_service"
  ON backup_codes FOR ALL
  USING (app_is_service_role());
"""

BACKUP_CODES_RLS_DROP = """
DROP POLICY IF EXISTS "backup_codes_service" ON backup_codes;
DROP POLICY IF EXISTS "backup_codes_own" ON backup_codes;
ALTER TABLE backup_codes DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# seller_upgrade_requests table
# ---------------------------------------------------------------------------

SELLER_REQUESTS_RLS = """
ALTER TABLE seller_upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_upgrade_requests FORCE ROW LEVEL SECURITY;

-- Users can read their own upgrade requests.
CREATE POLICY "sur_select_own"
  ON seller_upgrade_requests FOR SELECT
  USING (user_id = app_current_user_id());

-- Admins/moderators can read all upgrade requests.
CREATE POLICY "sur_select_admin"
  ON seller_upgrade_requests FOR SELECT
  USING (app_is_moderator());

CREATE POLICY "sur_select_service"
  ON seller_upgrade_requests FOR SELECT
  USING (app_is_service_role());

-- Users can insert their own upgrade request.
CREATE POLICY "sur_insert_own"
  ON seller_upgrade_requests FOR INSERT
  WITH CHECK (user_id = app_current_user_id());

-- Only admins/moderators and service role can update status fields.
CREATE POLICY "sur_update_admin"
  ON seller_upgrade_requests FOR UPDATE
  USING (app_is_moderator());

CREATE POLICY "sur_update_service"
  ON seller_upgrade_requests FOR UPDATE
  USING (app_is_service_role());
"""

SELLER_REQUESTS_RLS_DROP = """
DROP POLICY IF EXISTS "sur_update_service" ON seller_upgrade_requests;
DROP POLICY IF EXISTS "sur_update_admin" ON seller_upgrade_requests;
DROP POLICY IF EXISTS "sur_insert_own" ON seller_upgrade_requests;
DROP POLICY IF EXISTS "sur_select_service" ON seller_upgrade_requests;
DROP POLICY IF EXISTS "sur_select_admin" ON seller_upgrade_requests;
DROP POLICY IF EXISTS "sur_select_own" ON seller_upgrade_requests;
ALTER TABLE seller_upgrade_requests DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# seller_profiles table  (public shop info — broader read access)
# ---------------------------------------------------------------------------

SELLER_PROFILES_RLS = """
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles FORCE ROW LEVEL SECURITY;

-- Public read: seller profiles are public shop info.
CREATE POLICY "seller_profiles_select_all"
  ON seller_profiles FOR SELECT
  USING (true);

-- Only the seller can update their own profile.
CREATE POLICY "seller_profiles_update_own"
  ON seller_profiles FOR UPDATE
  USING (user_id = app_current_user_id());

-- Admins can update any seller profile.
CREATE POLICY "seller_profiles_update_admin"
  ON seller_profiles FOR UPDATE
  USING (app_is_admin());

-- Service role creates the profile when an upgrade request is approved.
CREATE POLICY "seller_profiles_insert_service"
  ON seller_profiles FOR INSERT
  WITH CHECK (app_is_service_role() OR app_is_admin());
"""

SELLER_PROFILES_RLS_DROP = """
DROP POLICY IF EXISTS "seller_profiles_insert_service" ON seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_update_admin" ON seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_update_own" ON seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_select_all" ON seller_profiles;
ALTER TABLE seller_profiles DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# listings table
# ---------------------------------------------------------------------------

LISTINGS_RLS = """
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings FORCE ROW LEVEL SECURITY;

-- Public can read ACTIVE, non-deleted listings.
CREATE POLICY "listings_select_public"
  ON listings FOR SELECT
  USING (status = 'ACTIVE' AND is_deleted = false);

-- Owners can read all their own listings regardless of status.
CREATE POLICY "listings_select_owner"
  ON listings FOR SELECT
  USING (owner_id = app_current_user_id());

-- Admins/moderators can read all listings (moderation queue, etc.).
CREATE POLICY "listings_select_admin"
  ON listings FOR SELECT
  USING (app_is_moderator());

-- Service role can read all listings (search indexing, etc.).
CREATE POLICY "listings_select_service"
  ON listings FOR SELECT
  USING (app_is_service_role());

-- Only sellers/admins can create listings (must be their own).
CREATE POLICY "listings_insert_seller"
  ON listings FOR INSERT
  WITH CHECK (
    owner_id = app_current_user_id()
    AND app_current_user_role() IN ('SELLER', 'ADMIN')
  );

CREATE POLICY "listings_insert_service"
  ON listings FOR INSERT
  WITH CHECK (app_is_service_role());

-- Owners can update their own listings.
CREATE POLICY "listings_update_owner"
  ON listings FOR UPDATE
  USING (owner_id = app_current_user_id());

-- Admins/moderators can update any listing (approve, reject, feature).
CREATE POLICY "listings_update_admin"
  ON listings FOR UPDATE
  USING (app_is_moderator());

CREATE POLICY "listings_update_service"
  ON listings FOR UPDATE
  USING (app_is_service_role());

-- Soft-delete enforced at app layer; block hard DELETE except for admins.
CREATE POLICY "listings_delete_admin"
  ON listings FOR DELETE
  USING (app_is_admin());
"""

LISTINGS_RLS_DROP = """
DROP POLICY IF EXISTS "listings_delete_admin" ON listings;
DROP POLICY IF EXISTS "listings_update_service" ON listings;
DROP POLICY IF EXISTS "listings_update_admin" ON listings;
DROP POLICY IF EXISTS "listings_update_owner" ON listings;
DROP POLICY IF EXISTS "listings_insert_service" ON listings;
DROP POLICY IF EXISTS "listings_insert_seller" ON listings;
DROP POLICY IF EXISTS "listings_select_service" ON listings;
DROP POLICY IF EXISTS "listings_select_admin" ON listings;
DROP POLICY IF EXISTS "listings_select_owner" ON listings;
DROP POLICY IF EXISTS "listings_select_public" ON listings;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# listing_images table
# ---------------------------------------------------------------------------

LISTING_IMAGES_RLS = """
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images FORCE ROW LEVEL SECURITY;

-- Public can view images for ACTIVE, non-deleted listings.
CREATE POLICY "listing_images_select_public"
  ON listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND l.status = 'ACTIVE'
        AND l.is_deleted = false
    )
  );

-- Owners can view images for all their own listings.
CREATE POLICY "listing_images_select_owner"
  ON listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.owner_id = app_current_user_id()
    )
  );

CREATE POLICY "listing_images_select_admin"
  ON listing_images FOR SELECT
  USING (app_is_moderator());

CREATE POLICY "listing_images_select_service"
  ON listing_images FOR SELECT
  USING (app_is_service_role());

-- Owners can add images to their own listings.
CREATE POLICY "listing_images_insert_owner"
  ON listing_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.owner_id = app_current_user_id()
    )
  );

CREATE POLICY "listing_images_insert_service"
  ON listing_images FOR INSERT
  WITH CHECK (app_is_service_role());

-- Owners / admins can delete images.
CREATE POLICY "listing_images_delete_owner"
  ON listing_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.owner_id = app_current_user_id()
    )
  );

CREATE POLICY "listing_images_delete_admin"
  ON listing_images FOR DELETE
  USING (app_is_admin());

CREATE POLICY "listing_images_delete_service"
  ON listing_images FOR DELETE
  USING (app_is_service_role());

-- Allow service role to update images (resizing/WebP conversion task).
CREATE POLICY "listing_images_update_service"
  ON listing_images FOR UPDATE
  USING (app_is_service_role());

CREATE POLICY "listing_images_update_owner"
  ON listing_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.owner_id = app_current_user_id()
    )
  );
"""

LISTING_IMAGES_RLS_DROP = """
DROP POLICY IF EXISTS "listing_images_update_owner" ON listing_images;
DROP POLICY IF EXISTS "listing_images_update_service" ON listing_images;
DROP POLICY IF EXISTS "listing_images_delete_service" ON listing_images;
DROP POLICY IF EXISTS "listing_images_delete_admin" ON listing_images;
DROP POLICY IF EXISTS "listing_images_delete_owner" ON listing_images;
DROP POLICY IF EXISTS "listing_images_insert_service" ON listing_images;
DROP POLICY IF EXISTS "listing_images_insert_owner" ON listing_images;
DROP POLICY IF EXISTS "listing_images_select_service" ON listing_images;
DROP POLICY IF EXISTS "listing_images_select_admin" ON listing_images;
DROP POLICY IF EXISTS "listing_images_select_owner" ON listing_images;
DROP POLICY IF EXISTS "listing_images_select_public" ON listing_images;
ALTER TABLE listing_images DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# saved_listings table
# ---------------------------------------------------------------------------

SAVED_LISTINGS_RLS = """
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings FORCE ROW LEVEL SECURITY;

-- Buyers can only see their own saved listings.
CREATE POLICY "saved_listings_own"
  ON saved_listings FOR ALL
  USING (buyer_id = app_current_user_id());

CREATE POLICY "saved_listings_admin"
  ON saved_listings FOR SELECT
  USING (app_is_admin());

CREATE POLICY "saved_listings_service"
  ON saved_listings FOR ALL
  USING (app_is_service_role());
"""

SAVED_LISTINGS_RLS_DROP = """
DROP POLICY IF EXISTS "saved_listings_service" ON saved_listings;
DROP POLICY IF EXISTS "saved_listings_admin" ON saved_listings;
DROP POLICY IF EXISTS "saved_listings_own" ON saved_listings;
ALTER TABLE saved_listings DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# categories_category table  (public read-only)
# ---------------------------------------------------------------------------

CATEGORIES_RLS = """
ALTER TABLE categories_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_category FORCE ROW LEVEL SECURITY;

-- Everyone can read active categories.
CREATE POLICY "categories_select_all"
  ON categories_category FOR SELECT
  USING (true);

-- Only admins and service role can write categories.
CREATE POLICY "categories_write_admin"
  ON categories_category FOR ALL
  USING (app_is_admin() OR app_is_service_role());
"""

CATEGORIES_RLS_DROP = """
DROP POLICY IF EXISTS "categories_write_admin" ON categories_category;
DROP POLICY IF EXISTS "categories_select_all" ON categories_category;
ALTER TABLE categories_category DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# inbox_conversation table
# ---------------------------------------------------------------------------

CONVERSATIONS_RLS = """
ALTER TABLE inbox_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_conversation FORCE ROW LEVEL SECURITY;

-- Participants can read their own conversations.
CREATE POLICY "conversations_select_participant"
  ON inbox_conversation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inbox_conversation_participants p
      WHERE p.conversation_id = id AND p.user_id = app_current_user_id()
    )
  );

CREATE POLICY "conversations_select_admin"
  ON inbox_conversation FOR SELECT
  USING (app_is_moderator());

CREATE POLICY "conversations_select_service"
  ON inbox_conversation FOR SELECT
  USING (app_is_service_role());

-- Authenticated users can create conversations.
CREATE POLICY "conversations_insert_auth"
  ON inbox_conversation FOR INSERT
  WITH CHECK (app_current_user_id() IS NOT NULL OR app_is_service_role());

-- Participants or service can update (e.g. updated_at bump).
CREATE POLICY "conversations_update_participant"
  ON inbox_conversation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inbox_conversation_participants p
      WHERE p.conversation_id = id AND p.user_id = app_current_user_id()
    )
    OR app_is_service_role()
  );
"""

CONVERSATIONS_RLS_DROP = """
DROP POLICY IF EXISTS "conversations_update_participant" ON inbox_conversation;
DROP POLICY IF EXISTS "conversations_insert_auth" ON inbox_conversation;
DROP POLICY IF EXISTS "conversations_select_service" ON inbox_conversation;
DROP POLICY IF EXISTS "conversations_select_admin" ON inbox_conversation;
DROP POLICY IF EXISTS "conversations_select_participant" ON inbox_conversation;
ALTER TABLE inbox_conversation DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# inbox_conversation_participants  (M2M join table)
# ---------------------------------------------------------------------------

PARTICIPANTS_RLS = """
ALTER TABLE inbox_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_conversation_participants FORCE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_own"
  ON inbox_conversation_participants FOR SELECT
  USING (user_id = app_current_user_id());

CREATE POLICY "participants_select_participant"
  ON inbox_conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inbox_conversation_participants p2
      WHERE p2.conversation_id = conversation_id
        AND p2.user_id = app_current_user_id()
    )
  );

CREATE POLICY "participants_select_admin"
  ON inbox_conversation_participants FOR SELECT
  USING (app_is_moderator());

CREATE POLICY "participants_select_service"
  ON inbox_conversation_participants FOR SELECT
  USING (app_is_service_role());

CREATE POLICY "participants_insert_service"
  ON inbox_conversation_participants FOR INSERT
  WITH CHECK (app_is_service_role() OR app_current_user_id() IS NOT NULL);

CREATE POLICY "participants_delete_service"
  ON inbox_conversation_participants FOR DELETE
  USING (app_is_service_role() OR app_is_admin());
"""

PARTICIPANTS_RLS_DROP = """
DROP POLICY IF EXISTS "participants_delete_service" ON inbox_conversation_participants;
DROP POLICY IF EXISTS "participants_insert_service" ON inbox_conversation_participants;
DROP POLICY IF EXISTS "participants_select_service" ON inbox_conversation_participants;
DROP POLICY IF EXISTS "participants_select_admin" ON inbox_conversation_participants;
DROP POLICY IF EXISTS "participants_select_participant" ON inbox_conversation_participants;
DROP POLICY IF EXISTS "participants_select_own" ON inbox_conversation_participants;
ALTER TABLE inbox_conversation_participants DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# inbox_message table
# ---------------------------------------------------------------------------

MESSAGES_RLS = """
ALTER TABLE inbox_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_message FORCE ROW LEVEL SECURITY;

-- Participants in the conversation can read all messages in it.
CREATE POLICY "messages_select_participant"
  ON inbox_message FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inbox_conversation_participants p
      WHERE p.conversation_id = conversation_id
        AND p.user_id = app_current_user_id()
    )
  );

CREATE POLICY "messages_select_admin"
  ON inbox_message FOR SELECT
  USING (app_is_moderator());

CREATE POLICY "messages_select_service"
  ON inbox_message FOR SELECT
  USING (app_is_service_role());

-- Only participants can send messages; sender must be themselves.
CREATE POLICY "messages_insert_participant"
  ON inbox_message FOR INSERT
  WITH CHECK (
    sender_id = app_current_user_id()
    AND EXISTS (
      SELECT 1 FROM inbox_conversation_participants p
      WHERE p.conversation_id = conversation_id
        AND p.user_id = app_current_user_id()
    )
  );

CREATE POLICY "messages_insert_service"
  ON inbox_message FOR INSERT
  WITH CHECK (app_is_service_role());

-- Messages can be marked read only within the conversation.
CREATE POLICY "messages_update_participant"
  ON inbox_message FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inbox_conversation_participants p
      WHERE p.conversation_id = conversation_id
        AND p.user_id = app_current_user_id()
    )
  );

CREATE POLICY "messages_update_service"
  ON inbox_message FOR UPDATE
  USING (app_is_service_role());
"""

MESSAGES_RLS_DROP = """
DROP POLICY IF EXISTS "messages_update_service" ON inbox_message;
DROP POLICY IF EXISTS "messages_update_participant" ON inbox_message;
DROP POLICY IF EXISTS "messages_insert_service" ON inbox_message;
DROP POLICY IF EXISTS "messages_insert_participant" ON inbox_message;
DROP POLICY IF EXISTS "messages_select_service" ON inbox_message;
DROP POLICY IF EXISTS "messages_select_admin" ON inbox_message;
DROP POLICY IF EXISTS "messages_select_participant" ON inbox_message;
ALTER TABLE inbox_message DISABLE ROW LEVEL SECURITY;
"""

# ---------------------------------------------------------------------------
# Performance indexes  (add only if not already present)
# ---------------------------------------------------------------------------

EXTRA_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_rls_users_is_deleted   ON users (is_deleted);
CREATE INDEX IF NOT EXISTS idx_rls_listings_is_deleted ON listings (is_deleted);
CREATE INDEX IF NOT EXISTS idx_rls_conv_participants   ON inbox_conversation_participants (user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_rls_messages_conv       ON inbox_message (conversation_id, is_read);
"""

DROP_EXTRA_INDEXES = """
DROP INDEX IF EXISTS idx_rls_messages_conv;
DROP INDEX IF EXISTS idx_rls_conv_participants;
DROP INDEX IF EXISTS idx_rls_listings_is_deleted;
DROP INDEX IF EXISTS idx_rls_users_is_deleted;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0008_twofactordevice_backupcode"),
        ("listings", "0006_savedlisting"),
        ("inbox", "0001_initial"),
        ("categories", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql=CREATE_HELPERS,
            reverse_sql=DROP_HELPERS,
        ),
        migrations.RunSQL(
            sql=EXTRA_INDEXES,
            reverse_sql=DROP_EXTRA_INDEXES,
        ),
        migrations.RunSQL(
            sql=USERS_RLS,
            reverse_sql=USERS_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=TOTP_RLS,
            reverse_sql=TOTP_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=BACKUP_CODES_RLS,
            reverse_sql=BACKUP_CODES_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=SELLER_REQUESTS_RLS,
            reverse_sql=SELLER_REQUESTS_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=SELLER_PROFILES_RLS,
            reverse_sql=SELLER_PROFILES_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=LISTINGS_RLS,
            reverse_sql=LISTINGS_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=LISTING_IMAGES_RLS,
            reverse_sql=LISTING_IMAGES_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=SAVED_LISTINGS_RLS,
            reverse_sql=SAVED_LISTINGS_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=CATEGORIES_RLS,
            reverse_sql=CATEGORIES_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=CONVERSATIONS_RLS,
            reverse_sql=CONVERSATIONS_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=PARTICIPANTS_RLS,
            reverse_sql=PARTICIPANTS_RLS_DROP,
        ),
        migrations.RunSQL(
            sql=MESSAGES_RLS,
            reverse_sql=MESSAGES_RLS_DROP,
        ),
    ]
