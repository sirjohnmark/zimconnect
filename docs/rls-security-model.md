# Sanganai — Row-Level Security Model

This document describes the defense-in-depth access control strategy for the
Sanganai marketplace API. Access control operates at two layers:

1. **Application layer (primary)** — Django ORM queryset filtering, DRF
   permission classes, and service-layer ownership checks.
2. **Database layer (secondary)** — PostgreSQL Row-Level Security policies
   enforced via transaction-local session variables.

---

## Roles

| Role | Description |
|------|-------------|
| `BUYER` | Default role for all registered users. Can save listings, send messages, apply to become a seller. |
| `SELLER` | Promoted buyer. Can create and manage their own listings. |
| `MODERATOR` | Staff role. Can review listings, approve/reject seller applications. Requires 2FA. |
| `ADMIN` | Full platform access. User management, role changes, audit data. Requires 2FA. |
| Anonymous | Unauthenticated user. Read-only access to public marketplace data. |
| Service role | Trusted backend — Celery tasks, management commands. Bypasses user-level RLS. |

Roles are stored in `User.role` (a `CharField` with `TextChoices`). Role
promotion always goes through the admin panel; users cannot self-promote.

---

## Application-Layer Policies (primary enforcement)

### Listings

| Action | Who |
|--------|-----|
| Read ACTIVE listings | Anyone (anonymous or authenticated) |
| Read DRAFT / REJECTED / SOLD listings | Owner only; ADMIN/MODERATOR can read all |
| Create listing | SELLER or ADMIN (verified email or phone required) |
| Update listing fields | Owner only; moderation fields (status, rejection_reason, is_featured) excluded |
| Publish (DRAFT → ACTIVE) | Owner only |
| Delete (soft) | Owner or ADMIN |
| Approve listing | MODERATOR or ADMIN only |
| Reject listing | MODERATOR or ADMIN only |

### Inbox

| Action | Who |
|--------|-----|
| Read conversations | Participants only |
| Send messages | Participants only; sender must match authenticated user |
| Mark message read | Recipient (non-sender participant) only |
| Admin conversation access | Not currently exposed — would require explicit admin endpoint |

### Saved listings

| Action | Who |
|--------|-----|
| Save / unsave listing | Authenticated users only; scoped to `request.user` |
| Read saved listings | Owner only (`buyer = request.user` enforced in selector) |

### Seller upgrade requests

| Action | Who |
|--------|-----|
| Submit request | BUYER only (IsBuyer permission + one pending at a time) |
| Read own request status | Authenticated user (own request only) |
| Read all requests | ADMIN / MODERATOR |
| Approve / reject | ADMIN only |

### User profiles

| Action | Who |
|--------|-----|
| Read own profile | Authenticated user |
| Update safe fields (bio, location, phone, name, profile_picture) | Own account only |
| Update protected fields (role, is_staff, is_active, email_verified) | Blocked — not in `UserUpdateSerializer` |
| Read any profile | ADMIN / MODERATOR |
| Toggle is_active / change role | ADMIN only |

---

## Database-Layer Policies (secondary defense-in-depth)

### How session variables work

`RLSJWTAuthentication` (called automatically for every authenticated request)
calls PostgreSQL's `set_config()` after JWT validation:

```sql
SELECT set_config('app.current_user_id',   '<user_pk>',   true);  -- transaction-local
SELECT set_config('app.current_user_role', '<role>',      true);
```

`RLSContextMiddleware` clears stale values at the start of each request so
anonymous requests never inherit a previous user's context from a pooled
connection.

`ATOMIC_REQUESTS = True` in the database configuration ensures every web
request runs inside a transaction, which is required for `set_config(..., true)`
(the `true` = "local to current transaction") to persist across multiple queries.

### Helper functions

```sql
app_current_user_id()    → bigint   -- NULL for anonymous
app_current_user_role()  → text     -- NULL for anonymous
app_is_admin()           → boolean
app_is_moderator()       → boolean  -- true for ADMIN and MODERATOR
app_is_seller()          → boolean
app_is_service_role()    → boolean  -- true when app.service_role = 'true'
```

### Table policies summary

| Table | Public SELECT | Owner SELECT | Mod/Admin SELECT | Insert | Update | Delete |
|-------|--------------|--------------|-----------------|--------|--------|--------|
| `users` | ✗ | Own row | Mod/Admin | Service only | Own / Admin / Service | Admin |
| `totp_devices` | ✗ | Own | Admin | Own / Service | Own / Service | Own / Service |
| `backup_codes` | ✗ | Own | — | Own / Service | Own / Service | Own / Service |
| `seller_upgrade_requests` | ✗ | Own | Mod/Admin | Own (user_id = caller) | Mod/Admin / Service | — |
| `seller_profiles` | All (public info) | Own | Admin | Service / Admin | Own / Admin | — |
| `listings` | ACTIVE only | All own statuses | All | Seller/Admin (own) | Owner / Mod/Admin / Service | Admin |
| `listing_images` | ACTIVE parent | Own parent | Mod/Admin | Owner / Service | Owner / Service | Owner / Admin / Service |
| `saved_listings` | ✗ | Own | Admin | Own | — | Own / Service |
| `categories_category` | All | — | Admin | Admin / Service | Admin / Service | Admin / Service |
| `inbox_conversation` | ✗ | Participant | Mod/Admin | Auth | Participant / Service | — |
| `inbox_conversation_participants` | ✗ | Own | Mod/Admin | Auth / Service | — | Admin / Service |
| `inbox_message` | ✗ | Participant | Mod/Admin | Participant (own sender) | Participant / Service | — |

---

## Service-role bypass (Celery / background tasks)

Background tasks (Celery workers, management commands) operate with trusted
server-side access and need to reach across user boundaries. They use:

```python
from apps.common.authentication import set_service_role_context

set_service_role_context()   # sets app.service_role = 'true' (transaction-local)
```

This should be called at the top of every Celery task that touches the
database. RLS policies include `app_is_service_role()` as an OR condition so
service operations are not blocked.

---

## Important: BYPASSRLS on Supabase

The default `postgres` role on Supabase has the `BYPASSRLS` privilege, which
means database-level RLS is **not enforced** for connections using that role.

To make PostgreSQL RLS actually effective as a secondary layer, connect with a
non-superuser role that does NOT have `BYPASSRLS`. Run this once in the Supabase
SQL editor:

```sql
CREATE ROLE web_user NOINHERIT NOCREATEDB NOCREATEROLE;
GRANT USAGE ON SCHEMA public TO web_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_user;
-- Grant function execution rights
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO web_user;
```

Then update `DATABASE_URL` to use `web_user` credentials for the Django
application (keep the `postgres` role only for migrations and admin SQL).

---

## How to add RLS for a new table

1. Add a `RunSQL` operation to a new migration in `apps/common/migrations/` or
   the relevant app's migrations.

2. Use the pattern:

   ```sql
   ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;
   ALTER TABLE my_new_table FORCE ROW LEVEL SECURITY;

   -- Public read (if applicable)
   CREATE POLICY "my_table_select_public" ON my_new_table
     FOR SELECT USING (/* public condition */);

   -- Owner read/write
   CREATE POLICY "my_table_own" ON my_new_table
     FOR ALL USING (user_id = app_current_user_id());

   -- Admin
   CREATE POLICY "my_table_admin" ON my_new_table
     FOR ALL USING (app_is_moderator());

   -- Service role
   CREATE POLICY "my_table_service" ON my_new_table
     FOR ALL USING (app_is_service_role());
   ```

3. Write tests in `tests/<app>/test_rls.py` covering:
   - Anonymous cannot access private data
   - Owner can access own rows
   - Another user's access is denied
   - Admin/moderator access works

---

## Testing RLS locally

```bash
# Run all RLS tests
pytest tests/listings/test_rls.py tests/inbox/test_rls.py \
       tests/accounts/test_rls.py tests/adminpanel/test_rls.py -v

# Confirm listing visibility rules
pytest tests/listings/test_rls.py::TestPublicListingVisibility -v

# Confirm conversation isolation
pytest tests/inbox/test_rls.py::TestConversationParticipantAccess -v
```

> **SQLite note**: The RLS migration SQL and `set_config()` calls will fail on
> SQLite (used in dev if `DATABASE_URL` is not set). The `RLSJWTAuthentication`
> and `RLSContextMiddleware` catch and log the error gracefully so tests
> continue to work. PostgreSQL is required for the database-layer policies to
> be active.

---

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string; must use a role without `BYPASSRLS` in production |
| `SECRET_KEY` | Django secret key |
| `TOTP_ENCRYPTION_KEY` | Fernet key for TOTP secret encryption |

---

## Known limitations / TODOs

- Celery tasks do not automatically call `set_service_role_context()`. Each
  task must call it manually at the top of the function body.
- The `inbox_conversation_participants` RLS policy allows any authenticated
  user to insert rows. A tighter policy would check that the conversation
  creator is one of the participants — this is enforced at the service layer
  but not yet at the DB layer.
- `FORCE ROW LEVEL SECURITY` is set on all tables, but if the DB user has
  `BYPASSRLS`, this has no effect. See the Supabase section above.
- Reviews, notifications, payments, and payouts are not yet implemented in
  the API; add RLS policies when those models are added.
