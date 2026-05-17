import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';


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
  subgenre: string;
}

// Hardcoded DnB artist universe — search Spotify by name, never by genre filter.
const DNB_ARTISTS: string[] = [
  'Chase & Status', 'Sub Focus', 'Wilkinson', 'Logistics', 'Hybrid Minds',
  'Etherwood', 'Camo & Krooked', 'Fred V & Grafix', 'S.P.Y', 'Bcee',
  'Calibre', 'Netsky', 'High Contrast', 'London Elektricity', 'Friction',
  'Metrik', 'Whiney', 'Pola & Bryson', 'Maduk', 'Andromedik', 'Mefjus',
  'Emperor', 'Phace', 'Icicle', 'Misanthrop', 'Calyx & TeeBee',
  'Current Value', 'Neonlight', 'Black Sun Empire', 'Noisia', 'InsideInfo',
  'Hedex', 'Turno', 'Hazard', 'Voltage', 'Bou', 'Kanine', 'Serum',
  'Kings of the Rollers', 'Disrupta', 'Annix', 'Shy FX', 'DJ Marky',
  'Fabio & Grooverider', 'LTJ Bukem', 'Bryan Gee', 'Goldie', 'DJ Hype',
  'Andy C', 'Pendulum', 'Grooverider', 'Bad Company UK', 'Optical',
  'Ed Rush', 'Dillinja', 'Doc Scott', 'Break', 'Skeptical', 'DLR',
  'Alix Perez', 'Halogenix', 'Lenzman', 'Klute', 'Kasra', 'Spor',
  'Concord Dawn', 'Teebee', 'Evol Intent', 'Gridlok', 'Audio',
  'Consequence', 'Cern', 'Dub Phizix', 'Commix', 'Loxy', 'Resound',
  'Seba', 'Nu:Tone', 'Spectrasoul', 'Fixate',
  'Redeyes', 'Rockwell', 'Enei', 'Ivy Lab', 'Paradox', 'Blocks & Escher',
];

// Subgenre lookup (lowercase name -> tag). Fallback for unknowns is "DnB".
const SUBGENRES: Record<string, string> = {
  'chase & status': 'Dancefloor', 'sub focus': 'Dancefloor', 'wilkinson': 'Dancefloor',
  'pendulum': 'Dancefloor', 'andy c': 'All styles', 'friction': 'All styles',
  'mefjus': 'Neurofunk', 'noisia': 'Neurofunk', 'black sun empire': 'Neurofunk',
  'calyx & teebee': 'Neurofunk', 'phace': 'Neurofunk', 'misanthrop': 'Neurofunk',
  'current value': 'Neurofunk', 'neonlight': 'Neurofunk', 'emperor': 'Neurofunk',
  'insideinfo': 'Neurofunk', 'spor': 'Neurofunk', 'icicle': 'Neurofunk',
  'audio': 'Neurofunk',
  'logistics': 'Liquid', 'hybrid minds': 'Liquid', 'etherwood': 'Liquid',
  'bcee': 'Liquid', 'calibre': 'Liquid', 'netsky': 'Liquid', 'high contrast': 'Liquid',
  'london elektricity': 'Liquid', 'pola & bryson': 'Liquid', 'maduk': 'Liquid',
  'lenzman': 'Liquid', 'nu:tone': 'Liquid', 'spectrasoul': 'Liquid',
  'fred v & grafix': 'Liquid', 'whiney': 'Liquid', 'redeyes': 'Liquid',
  'dj marky': 'Liquid/Jungle', 's.p.y': 'Liquid',
  'hedex': 'Jump Up', 'turno': 'Jump Up', 'hazard': 'Jump Up',
  'voltage': 'Jump Up', 'bou': 'Jump Up', 'kanine': 'Jump Up',
  'serum': 'Jump Up', 'kings of the rollers': 'Jump Up',
  'disrupta': 'Jump Up', 'annix': 'Jump Up',
  'shy fx': 'Jungle', 'dj hype': 'Jungle', 'goldie': 'Jungle',
  'fabio & grooverider': 'Jungle', 'ltj bukem': 'Jungle', 'bryan gee': 'Jungle',
  'grooverider': 'Jungle', 'paradox': 'Jungle',
  'camo & krooked': 'Dancefloor', 'metrik': 'Dancefloor', 'andromedik': 'Dancefloor',
  'break': 'Minimal', 'skeptical': 'Minimal', 'dlr': 'Minimal',
  'alix perez': 'Halftime', 'halogenix': 'Halftime', 'ivy lab': 'Halftime',
  'fixate': 'Halftime', 'blocks & escher': 'Halftime', 'rockwell': 'Halftime',
  'enei': 'Minimal', 'commix': 'Minimal', 'klute': 'Minimal', 'kasra': 'Minimal',
  'bad company uk': 'Neurofunk', 'optical': 'Neurofunk', 'ed rush': 'Neurofunk',
  'dillinja': 'Dancefloor', 'doc scott': 'Tech', 'concord dawn': 'Neurofunk',
  'teebee': 'Neurofunk', 'evol intent': 'Neurofunk', 'gridlok': 'Neurofunk',
  'consequence': 'Tech', 'cern': 'Tech', 'dub phizix': 'Halftime',
  'loxy': 'Tech', 'resound': 'Tech', 'seba': 'Liquid',
};

// Extended roster across the labels we represent / partner with.
const ROSTER_LABELS: Record<string, string[]> = {
  Undivide: [...UNDIVIDE_ROSTER],
  Hospital: ['Logistics', 'Etherwood', 'Bcee', 'Nu:Tone', 'London Elektricity',
    'High Contrast', 'Whiney', 'Pola & Bryson', 'Fred V & Grafix', 'S.P.Y', 'Maduk',
    'Netsky', 'Metrik', 'Camo & Krooked', 'Hybrid Minds'],
  Korsakov: ['Mefjus', 'Neonlight', 'Phace', 'Misanthrop', 'InsideInfo', 'Emperor'],
};
const ROSTER_LOOKUP = new Set<string>(
  Object.values(ROSTER_LABELS).flat().map((n) => n.toLowerCase()),
);

function subgenreFor(name: string): string {
  return SUBGENRES[name.toLowerCase()] ?? 'DnB';
}

interface SpotifySearchHit {
  id: string;
  name: string;
  popularity: number;
  followers: { total: number };
  images: Array<{ url: string }>;
}

async function spotifySearchOne(name: string, market: string, token: string): Promise<SpotifySearchHit | null> {
  const r = await fetch(
    `https://api.spotify.com/v1/search?type=artist&limit=5&market=${market}&q=${encodeURIComponent(name)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!r.ok) return null;
  const j = (await r.json()) as { artists?: { items: SpotifySearchHit[] } };
  const items = j.artists?.items ?? [];
  // Prefer exact name match (case-insensitive), otherwise first result.
  return items.find((a) => a.name.toLowerCase() === name.toLowerCase()) ?? items[0] ?? null;
}

async function refreshArtistsByIds(ids: string[], token: string): Promise<Map<string, SpotifySearchHit>> {
  const out = new Map<string, SpotifySearchHit>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const r = await fetch(
      `https://api.spotify.com/v1/artists?ids=${batch.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!r.ok) continue;
    const j = (await r.json()) as { artists?: SpotifySearchHit[] };
    for (const a of j.artists ?? []) if (a?.id) out.set(a.id, a);
  }
  return out;
}

// Search every DnB artist for this market, then fetch fresh /artists/{id} stats.
async function spotifyTopForMarket(market: string): Promise<SpotifyArtist[]> {
  const token = await getSpotifyToken();
  // Step 1 — resolve IDs by name search (concurrency limited).
  const hits: SpotifySearchHit[] = [];
  const concurrency = 6;
  let cursor = 0;
  async function worker() {
    while (cursor < DNB_ARTISTS.length) {
      const idx = cursor++;
      const name = DNB_ARTISTS[idx];
      try {
        const h = await spotifySearchOne(name, market, token);
        if (h) hits.push(h);
      } catch { /* skip */ }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // Step 2 — refresh stats via /artists?ids=
  const ids = Array.from(new Set(hits.map((h) => h.id)));
  const fresh = await refreshArtistsByIds(ids, token);

  // Step 3 — merge
  const seen = new Set<string>();
  const list: SpotifyArtist[] = [];
  for (const h of hits) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    const a = fresh.get(h.id) ?? h;
    list.push({
      id: a.id,
      name: a.name,
      popularity: a.popularity ?? 0,
      followers: a.followers?.total ?? 0,
      image: a.images?.[0]?.url ?? null,
      subgenre: subgenreFor(a.name),
    });
  }
  list.sort((a, b) => b.popularity - a.popularity || b.followers - a.followers);
  return list;
}

async function spotifyLookupRoster(market: string): Promise<SpotifyArtist[]> {
  const token = await getSpotifyToken();
  const out: SpotifyArtist[] = [];
  for (const name of UNDIVIDE_ROSTER) {
    try {
      const h = await spotifySearchOne(name, market, token);
      if (h) {
        out.push({
          id: h.id, name: h.name,
          popularity: h.popularity ?? 0,
          followers: h.followers?.total ?? 0,
          image: h.images?.[0]?.url ?? null,
          subgenre: subgenreFor(h.name),
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

const YT_QUERY = 'drum and bass mix OR neurofunk OR liquid dnb OR jungle dnb';
const YT_BAD = [
  'tutorial', 'how to', 'reaction', 'lesson', 'theory',
  'hardwell', 'fred again', 'techno', 'house', 'edm',
  'trance', 'dubstep', 'trap', 'melodic techno',
  'podcast episode', 'interview',
];
const YT_GOOD = [
  'drum and bass', 'dnb', 'd&b', 'neurofunk', 'liquid dnb',
  'jungle', 'drum & bass', 'rollers', 'halftime',
];
const ARTIST_NAMES_LC = DNB_ARTISTS.map((n) => n.toLowerCase());

function passesYouTubeFilter(title: string, channel: string): boolean {
  const hay = `${title} ${channel}`.toLowerCase();
  if (YT_BAD.some((b) => hay.includes(b))) return false;
  if (YT_GOOD.some((g) => hay.includes(g))) return true;
  return ARTIST_NAMES_LC.some((n) => hay.includes(n));
}

async function youtubeTopForRegion(region: string): Promise<{ videos: YouTubeVideo[]; note: string | null }> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YouTube key not configured');
  const after = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&videoCategoryId=10&order=viewCount&regionCode=${region}&publishedAfter=${after}&q=${encodeURIComponent(YT_QUERY)}&key=${key}`;
  const s = await fetch(searchUrl);
  if (!s.ok) throw new Error(`YouTube search failed: ${s.status}`);
  const sj = (await s.json()) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; publishedAt: string } }> };
  const candidates = (sj.items ?? []).filter((it) => it.id.videoId);
  const filtered = candidates.filter((it) => passesYouTubeFilter(it.snippet.title, it.snippet.channelTitle));
  if (filtered.length === 0) {
    return { videos: [], note: 'No verified DnB content found for this region in the last 12 months — this may indicate a developing market' };
  }
  const ids = filtered.slice(0, 10).map((it) => it.id.videoId);
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}&key=${key}`;
  const v = await fetch(statsUrl);
  if (!v.ok) throw new Error(`YouTube stats failed: ${v.status}`);
  const vj = (await v.json()) as { items?: Array<{ id: string; statistics: { viewCount?: string } }> };
  const viewsById = new Map(vj.items?.map((x) => [x.id, parseInt(x.statistics.viewCount ?? '0', 10)]));
  const merged: YouTubeVideo[] = filtered.slice(0, 10).map((it) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    thumbnail: it.snippet.thumbnails?.medium?.url ?? it.snippet.thumbnails?.default?.url ?? '',
    views: viewsById.get(it.id.videoId) ?? 0,
    published: it.snippet.publishedAt,
  }));
  merged.sort((a, b) => b.views - a.views);
  const top = merged.slice(0, 5);
  const note = top.length < 5 ? 'Limited DnB video content found for this region' : null;
  return { videos: top, note };
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
          spotifyTopForMarket(market),
          spotifyLookupRoster(market),
        ]);
        const top10: SpotifyMarketArtist[] = top.slice(0, 10).map((a, i) => ({
          ...a, rank: i + 1, roster: ROSTER_LOOKUP.has(a.name.toLowerCase()),
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

    // 2. YouTube top (cached as { videos, note })
    let youtubePayload: { videos: YouTubeVideo[]; note: string | null } | null = null;
    if (!force) {
      const cached = await getCached<{ videos: YouTubeVideo[]; note: string | null } | YouTubeVideo[]>(data.cityId, 'youtube_top');
      if (cached) {
        // Migrate legacy cache shape (bare array) so we don't surface stale broken data.
        youtubePayload = Array.isArray(cached.data) ? null : cached.data;
      }
    }
    if (!youtubePayload) {
      try {
        youtubePayload = await youtubeTopForRegion(market);
        await putCached(data.cityId, market, 'youtube_top', youtubePayload);
      } catch (e) {
        errors.youtube = (e as Error).message;
        youtubePayload = { videos: [], note: null };
      }
    }

    return {
      countryCode: market,
      fetchedAt: new Date().toISOString(),
      spotifyTop: spotifyPayload.spotifyTop,
      rosterOutside: spotifyPayload.rosterOutside,
      rosterBreakdown: spotifyPayload.rosterBreakdown,
      rosterReachTotal: spotifyPayload.rosterReachTotal,
      youtubeTop: youtubePayload.videos,
      youtubeNote: youtubePayload.note,
      errors,
    };
  });

export interface RosterReachAll {
  byCity: Record<string, { total: number; iso: string }>;
}

export const getAllRosterReach = createServerFn({ method: 'POST' })
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
