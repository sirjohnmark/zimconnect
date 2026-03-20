-- =============================================================================
-- ZimConnect — Fix listing FK + search_suggestions RPC (idempotent)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix seller FK
-- ---------------------------------------------------------------------------
-- Migration 001 created listings.user_id → auth.users(id) with the implicit
-- name listings_user_id_fkey.  PostgREST cannot join listings → profiles
-- through that constraint because it points at auth.users, not public.profiles.
-- We add a SECOND FK with a distinct name pointing at profiles so PostgREST
-- can resolve the relationship and fetch seller data in a single query.
-- ---------------------------------------------------------------------------
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name        = 'listings'
      AND rc.constraint_name   = 'listings_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_user_id_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

-- Force PostgREST to reload its schema cache so the new FK relationship
-- is visible immediately (allows seller:profiles!user_id join hint to work).
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 2. search_suggestions RPC
-- ---------------------------------------------------------------------------
-- Returns up to 5 ranked suggestions for the instant-search dropdown.
-- Uses websearch_to_tsquery so raw user input is safe (no special-char errors).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_suggestions(query_text TEXT)
RETURNS TABLE(
  slug          TEXT,
  title         TEXT,
  category_name TEXT,
  price         NUMERIC,
  price_type    TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    l.slug,
    l.title,
    c.name  AS category_name,
    l.price,
    l.price_type::TEXT
  FROM listings l
  JOIN categories c ON c.id = l.category_id
  WHERE
    l.status = 'active'
    AND l.search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY
    l.is_featured DESC,
    ts_rank(l.search_vector, websearch_to_tsquery('english', query_text)) DESC
  LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION public.search_suggestions(TEXT)
  TO anon, authenticated;
