
CREATE TABLE public.market_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('spotify_top','youtube_top','roster_reach')),
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, kind)
);
CREATE INDEX idx_market_cache_lookup ON public.market_cache(city_id, kind);

ALTER TABLE public.market_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_cache readable by authenticated"
  ON public.market_cache FOR SELECT TO authenticated USING (true);
