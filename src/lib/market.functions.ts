import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const UNDIVIDE_ROSTER = [
  'Chase & Status', 'Logistics', 'Mefjus', 'Sub Focus', 'Wilkinson',
  'Hybrid Minds', 'Etherwood', 'Camo & Krooked', 'Friction', 'Hedex',
  'Turno', 'Netsky', 'S.P.Y', 'Fred V & Grafix',
] as const;

// Full country name → ISO 3166-1 alpha-2
const COUNTRY_TO_ISO: Record<string, string> = {
  'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB',
  'netherlands': 'NL', 'germany': 'DE', 'austria': 'AT',
  'czech republic': 'CZ', 'czechia': 'CZ', 'poland': 'PL',
  'belgium': 'BE', 'france': 'FR', 'spain': 'ES', 'portugal': 'PT',
  'italy': 'IT', 'switzerland': 'CH', 'hungary': 'HU', 'denmark': 'DK',
  'sweden': 'SE', 'norway': 'NO', 'ireland': 'IE', 'finland': 'FI',
  'slovakia': 'SK', 'slovenia': 'SI', 'croatia': 'HR', 'romania': 'RO',
  'bulgaria': 'BG', 'greece': 'GR', 'estonia': 'EE', 'latvia': 'LV',
  'lithuania': 'LT', 'ukraine': 'UA',
  'united states': 'US', 'usa': 'US', 'canada': 'CA', 'mexico': 'MX',
  'brazil': 'BR', 'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO',
  'australia': 'AU', 'new zealand': 'NZ',
  'japan': 'JP', 'south korea': 'KR', 'china': 'CN', 'thailand': 'TH',
  'singapore': 'SG', 'indonesia': 'ID', 'india': 'IN', 'vietnam': 'VN',
  'philippines': 'PH', 'malaysia': 'MY',
  'south africa': 'ZA', 'turkey': 'TR', 'israel': 'IL', 'uae': 'AE',
};

export function isoForCountry(country: string): string {
  return COUNTRY_TO_ISO[country.toLowerCase()] ?? 'US';
}

// ───────────────────────── Spotify ─────────────────────────

let _spotifyToken: { token: string; exp: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (_spotifyToken && _spotifyToken.exp > Date.now() + 30_000) return _spotifyToken.token;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Spotify credentials not configured');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  _spotifyToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  followers: number;
  image: string | null;
}

async function spotifySearchArtistsForMarket(market: string): Promise<SpotifyArtist[]> {
  const token = await getSpotifyToken();
  // Spotify recognises "drum and bass" as a genre; combine with market filter.
  const q = encodeURIComponent('genre:"drum and bass"');
  const r = await fetch(
    `https://api.spotify.com/v1/search?type=artist&limit=50&market=${market}&q=${q}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!r.ok) throw new Error(`Spotify search failed: ${r.status}`);
  const j = (await r.json()) as {
    artists?: { items: Array<{ id: string; name: string; popularity: number; followers: { total: number }; images: Array<{ url: string }> }> };
  };
  const items = j.artists?.items ?? [];
  return items
    .map((a) => ({
      id: a.id,
      name: a.name,
      popularity: a.popularity ?? 0,
      followers: a.followers?.total ?? 0,
      image: a.images?.[0]?.url ?? null,
    }))
    .sort((a, b) => b.popularity - a.popularity || b.followers - a.followers);
}

async function spotifyLookupRoster(market: string): Promise<SpotifyArtist[]> {
  const token = await getSpotifyToken();
  const out: SpotifyArtist[] = [];
  for (const name of UNDIVIDE_ROSTER) {
    try {
      const r = await fetch(
        `https://api.spotify.com/v1/search?type=artist&limit=1&market=${market}&q=${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!r.ok) continue;
      const j = (await r.json()) as { artists?: { items: Array<{ id: string; name: string; popularity: number; followers: { total: number }; images: Array<{ url: string }> }> } };
      const a = j.artists?.items?.[0];
      if (a) {
        out.push({
          id: a.id, name: a.name,
          popularity: a.popularity ?? 0,
          followers: a.followers?.total ?? 0,
          image: a.images?.[0]?.url ?? null,
        });
      }
    } catch { /* skip */ }
  }
  return out;
}

// ───────────────────────── YouTube ─────────────────────────

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  published: string;
}

async function youtubeTopForRegion(region: string): Promise<YouTubeVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YouTube key not configured');
  const after = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&videoCategoryId=10&order=viewCount&regionCode=${region}&publishedAfter=${after}&q=${encodeURIComponent('drum and bass')}&key=${key}`;
  const s = await fetch(searchUrl);
  if (!s.ok) throw new Error(`YouTube search failed: ${s.status}`);
  const sj = (await s.json()) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; publishedAt: string } }> };
  const ids = (sj.items ?? []).map((it) => it.id.videoId).filter(Boolean);
  if (ids.length === 0) return [];
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}&key=${key}`;
  const v = await fetch(statsUrl);
  if (!v.ok) throw new Error(`YouTube stats failed: ${v.status}`);
  const vj = (await v.json()) as { items?: Array<{ id: string; statistics: { viewCount?: string } }> };
  const viewsById = new Map(vj.items?.map((x) => [x.id, parseInt(x.statistics.viewCount ?? '0', 10)]));
  const merged: YouTubeVideo[] = (sj.items ?? []).map((it) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    thumbnail: it.snippet.thumbnails?.medium?.url ?? it.snippet.thumbnails?.default?.url ?? '',
    views: viewsById.get(it.id.videoId) ?? 0,
    published: it.snippet.publishedAt,
  }));
  return merged.sort((a, b) => b.views - a.views).slice(0, 3);
}

// ───────────────────────── Cache helpers ─────────────────────────

async function getCached<T>(cityId: string, kind: 'spotify_top' | 'youtube_top' | 'roster_reach'): Promise<{ data: T; fetched_at: string } | null> {
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

async function putCached(cityId: string, countryCode: string, kind: 'spotify_top' | 'youtube_top' | 'roster_reach', payload: unknown) {
  await supabaseAdmin.from('market_cache').upsert(
    { city_id: cityId, country_code: countryCode, kind, payload: payload as never, fetched_at: new Date().toISOString() },
    { onConflict: 'city_id,kind' },
  );
}

// ───────────────────────── Public server functions ─────────────────────────

export interface SpotifyMarketArtist extends SpotifyArtist {
  rank: number;
  roster: boolean;
}

export interface CityMarketData {
  countryCode: string;
  fetchedAt: string;
  spotifyTop: SpotifyMarketArtist[];
  rosterOutside: SpotifyMarketArtist[];
  rosterReachTotal: number;
  rosterBreakdown: Array<{ name: string; followers: number; popularity: number }>;
  youtubeTop: YouTubeVideo[];
  errors: { spotify?: string; youtube?: string };
}

export const getCityMarketData = createServerFn({ method: 'POST' })
  .inputValidator((data: { cityId: string; country: string; force?: boolean }) =>
    z.object({ cityId: z.string().min(1), country: z.string().min(1), force: z.boolean().optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<CityMarketData> => {
    const market = isoForCountry(data.country);
    const errors: { spotify?: string; youtube?: string } = {};
    const force = data.force === true;

    // 1. Spotify top + roster (combined cache)
    let spotifyPayload: { spotifyTop: SpotifyMarketArtist[]; rosterOutside: SpotifyMarketArtist[]; rosterBreakdown: Array<{ name: string; followers: number; popularity: number }>; rosterReachTotal: number } | null = null;
    if (!force) {
      const cached = await getCached<typeof spotifyPayload>(data.cityId, 'spotify_top');
      if (cached) spotifyPayload = cached.data;
    }
    if (!spotifyPayload) {
      try {
        const [top, roster] = await Promise.all([
          spotifySearchArtistsForMarket(market),
          spotifyLookupRoster(market),
        ]);
        const rosterNames = new Set(roster.map((r) => r.name.toLowerCase()));
        const top10: SpotifyMarketArtist[] = top.slice(0, 10).map((a, i) => ({
          ...a, rank: i + 1, roster: rosterNames.has(a.name.toLowerCase()),
        }));
        const top10Names = new Set(top10.map((t) => t.name.toLowerCase()));
        const rosterOutside: SpotifyMarketArtist[] = roster
          .filter((r) => !top10Names.has(r.name.toLowerCase()))
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 10)
          .map((a, i) => ({ ...a, rank: i + 1, roster: true }));
        const rosterBreakdown = roster
          .map((r) => ({ name: r.name, followers: r.followers, popularity: r.popularity }))
          .sort((a, b) => b.followers - a.followers);
        const rosterReachTotal = roster.reduce((s, r) => s + r.followers, 0);
        spotifyPayload = { spotifyTop: top10, rosterOutside, rosterBreakdown, rosterReachTotal };
        await putCached(data.cityId, market, 'spotify_top', spotifyPayload);
      } catch (e) {
        errors.spotify = (e as Error).message;
        spotifyPayload = { spotifyTop: [], rosterOutside: [], rosterBreakdown: [], rosterReachTotal: 0 };
      }
    }

    // 2. YouTube top
    let youtubeTop: YouTubeVideo[] = [];
    let ytFetched = false;
    if (!force) {
      const cached = await getCached<YouTubeVideo[]>(data.cityId, 'youtube_top');
      if (cached) { youtubeTop = cached.data; ytFetched = true; }
    }
    if (!ytFetched) {
      try {
        youtubeTop = await youtubeTopForRegion(market);
        await putCached(data.cityId, market, 'youtube_top', youtubeTop);
      } catch (e) {
        errors.youtube = (e as Error).message;
      }
    }

    return {
      countryCode: market,
      fetchedAt: new Date().toISOString(),
      spotifyTop: spotifyPayload.spotifyTop,
      rosterOutside: spotifyPayload.rosterOutside,
      rosterBreakdown: spotifyPayload.rosterBreakdown,
      rosterReachTotal: spotifyPayload.rosterReachTotal,
      youtubeTop,
      errors,
    };
  });

export interface RosterReachAll {
  byCity: Record<string, { total: number; iso: string }>;
}

export const getAllRosterReach = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<RosterReachAll> => {
    const { data: rows } = await supabaseAdmin
      .from('market_cache')
      .select('city_id, country_code, payload')
      .eq('kind', 'spotify_top');
    const byCity: Record<string, { total: number; iso: string }> = {};
    for (const r of rows ?? []) {
      const p = r.payload as { rosterReachTotal?: number } | null;
      byCity[r.city_id] = { total: p?.rosterReachTotal ?? 0, iso: r.country_code };
    }
    return { byCity };
  });
