-- =============================================================================
-- ZimConnect — Fix listing FK + search_suggestions RPC (idempotent)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix seller FK (drop stale constraint if it exists, re-add correctly)
-- ---------------------------------------------------------------------------
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;

-- The listings.user_id → profiles.id FK should already exist from migration 001.
-- This block is a no-op safety net in case a divergent migration named it differently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'listings_user_id_fkey'
      AND table_name = 'listings'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

-- Force PostgREST to reload its schema cache so new FK relationships
-- are visible to the JS client immediately after this migration runs.
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
