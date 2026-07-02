import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { isoForCountry } from './market.functions';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ───────────────────────── Apple Music (free RSS, no auth) ─────────────────────────
// https://rss.applemarketingtools.com — country-scoped charts, updated daily.

export interface AppleTrack {
  rank: number;
  name: string;
  artist: string;
  artwork: string | null;
  url: string;
  genres: string[];
  isElectronic: boolean;
}

interface AppleFeedItem {
  name: string;
  artistName: string;
  artworkUrl100?: string;
  url: string;
  genres?: Array<{ name: string }>;
}

const ELECTRONIC_GENRES = new Set([
  'Dance', 'Electronic', 'Drum & Bass', 'House', 'Techno', 'Dubstep',
  'Trance', 'Breakbeat', 'Garage', 'Hardcore', 'IDM',
]);

async function fetchAppleChart(cc: string, limit = 50): Promise<AppleTrack[]> {
  const lc = cc.toLowerCase();
  const url = `https://rss.applemarketingtools.com/api/v2/${lc}/music/most-played/${limit}/songs.json`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Apple RSS ${cc}: ${r.status}`);
  const j = (await r.json()) as { feed?: { results?: AppleFeedItem[] } };
  const items = j.feed?.results ?? [];
  return items.map((it, i) => {
    const genres = (it.genres ?? []).map((g) => g.name);
    return {
      rank: i + 1,
      name: it.name,
      artist: it.artistName,
      artwork: it.artworkUrl100 ?? null,
      url: it.url,
      genres,
      isElectronic: genres.some((g) => ELECTRONIC_GENRES.has(g)),
    };
  });
}

// ───────────────────────── Cache ─────────────────────────

async function getCached<T>(cityId: string, kind: string): Promise<{ data: T; fetched_at: string } | null> {
  const { data } = await supabaseAdmin
    .from('market_cache')
    .select('payload, fetched_at')
    .eq('city_id', cityId)
    .eq('kind', kind)
    .maybeSingle();
  if (!data) return null;
  if (Date.now() - new Date(data.fetched_at).getTime() > WEEK_MS) return null;
  return { data: data.payload as T, fetched_at: data.fetched_at };
}

async function putCached(cityId: string, cc: string, kind: string, payload: unknown) {
  await supabaseAdmin.from('market_cache').upsert(
    { city_id: cityId, country_code: cc, kind, payload: payload as never, fetched_at: new Date().toISOString() },
    { onConflict: 'city_id,kind' },
  );
}

// ───────────────────────── Public ─────────────────────────

export interface MarketPulse {
  countryCode: string;
  fetchedAt: string;
  apple: {
    top: AppleTrack[];
    electronic: AppleTrack[];
    electronicShare: number; // 0-100
    error: string | null;
  };
  sources: Array<{
    platform: string;
    status: 'live' | 'needs_key' | 'needs_scrape';
    note: string;
  }>;
}

export const getMarketPulse = createServerFn({ method: 'POST' })
  .inputValidator((data: { cityId: string; country: string; force?: boolean }) =>
    z.object({
      cityId: z.string().min(1),
      country: z.string().min(1),
      force: z.boolean().optional(),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<MarketPulse> => {
    const cc = isoForCountry(data.country);
    const force = data.force === true;

    let appleTop: AppleTrack[] = [];
    let appleError: string | null = null;

    if (!force) {
      const cached = await getCached<AppleTrack[]>(data.cityId, 'apple_top');
      if (cached) appleTop = cached.data;
    }
    if (!appleTop.length) {
      try {
        appleTop = await fetchAppleChart(cc, 50);
        await putCached(data.cityId, cc, 'apple_top', appleTop);
      } catch (e) {
        appleError = (e as Error).message;
      }
    }

    const electronic = appleTop.filter((t) => t.isElectronic);
    const share = appleTop.length ? Math.round((electronic.length / appleTop.length) * 1000) / 10 : 0;

    return {
      countryCode: cc,
      fetchedAt: new Date().toISOString(),
      apple: {
        top: appleTop.slice(0, 10),
        electronic: electronic.slice(0, 10),
        electronicShare: share,
        error: appleError,
      },
      sources: [
        { platform: 'Spotify', status: 'live', note: 'Roster reach + top DnB per market (Scene Intel tab)' },
        { platform: 'YouTube', status: 'live', note: 'Top DnB videos per region (Scene Intel tab)' },
        { platform: 'Apple Music', status: 'live', note: `Top 50 country chart · ${electronic.length} electronic tracks` },
        { platform: 'Shazam', status: 'needs_key', note: 'Requires RapidAPI Shazam-core subscription' },
        { platform: 'Beatport', status: 'needs_scrape', note: 'No public API — needs Firecrawl connector for genre charts' },
        { platform: 'Instagram', status: 'needs_key', note: 'Requires Meta Graph API + business account' },
        { platform: 'TikTok', status: 'needs_key', note: 'Requires TikTok connector (per-user OAuth only)' },
      ],
    };
  });
