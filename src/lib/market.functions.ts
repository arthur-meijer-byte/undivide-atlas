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

async function spotifyMarketTopTrackAvg(id: string, market: string, token: string): Promise<number> {
  try {
    const r = await fetch(
      `https://api.spotify.com/v1/artists/${id}/top-tracks?market=${market}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!r.ok) return 0;
    const j = (await r.json()) as { tracks?: Array<{ popularity?: number }> };
    const ps = (j.tracks ?? []).slice(0, 5).map((t) => t.popularity ?? 0);
    if (!ps.length) return 0;
    return ps.reduce((a, b) => a + b, 0) / ps.length;
  } catch {
    return 0;
  }
}

async function spotifyLatestRelease(id: string, market: string, token: string): Promise<{ name: string; date: string } | null> {
  try {
    const r = await fetch(
      `https://api.spotify.com/v1/artists/${id}/albums?market=${market}&limit=1&include_groups=album,single&order=desc`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: Array<{ name: string; release_date: string }> };
    const it = j.items?.[0];
    return it ? { name: it.name, date: it.release_date } : null;
  } catch {
    return null;
  }
}

// Search every DnB artist for this market, then fetch fresh /artists/{id} stats,
// per-market top-track popularity, and latest release (per-market availability).
async function spotifyTopForMarket(market: string): Promise<Array<SpotifyArtist & { marketScore: number; latestRelease: { name: string; date: string } | null }>> {
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

  // Step 3 — per-market track popularity + latest release for each artist.
  const marketScores = new Map<string, number>();
  const latestReleases = new Map<string, { name: string; date: string } | null>();
  let mtCursor = 0;
  async function mtWorker() {
    while (mtCursor < ids.length) {
      const i = mtCursor++;
      const id = ids[i];
      const [score, rel] = await Promise.all([
        spotifyMarketTopTrackAvg(id, market, token),
        spotifyLatestRelease(id, market, token),
      ]);
      marketScores.set(id, score);
      latestReleases.set(id, rel);
    }
  }
  await Promise.all(Array.from({ length: 6 }, mtWorker));

  // Step 4 — merge (only artists with content available in this market, i.e. marketScore > 0
  // or a release surfaced — Spotify's market filter on search already excludes unavailable).
  const seen = new Set<string>();
  const list: Array<SpotifyArtist & { marketScore: number; latestRelease: { name: string; date: string } | null }> = [];
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
      marketScore: marketScores.get(a.id) ?? 0,
      latestRelease: latestReleases.get(a.id) ?? null,
    });
  }
  return list;
}

async function spotifyLookupRoster(market: string): Promise<Array<SpotifyArtist & { marketScore: number; latestRelease: { name: string; date: string } | null }>> {
  const token = await getSpotifyToken();
  const out: Array<SpotifyArtist & { marketScore: number; latestRelease: { name: string; date: string } | null }> = [];
  for (const name of UNDIVIDE_ROSTER) {
    try {
      const h = await spotifySearchOne(name, market, token);
      if (!h) continue;
      const [score, rel] = await Promise.all([
        spotifyMarketTopTrackAvg(h.id, market, token),
        spotifyLatestRelease(h.id, market, token),
      ]);
      out.push({
        id: h.id, name: h.name,
        popularity: h.popularity ?? 0,
        followers: h.followers?.total ?? 0,
        image: h.images?.[0]?.url ?? null,
        subgenre: subgenreFor(h.name),
        marketScore: score,
        latestRelease: rel,
      });
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
  roster: boolean;
}

const YT_QUERIES = [
  'drum and bass',
  'neurofunk OR liquid dnb OR jungle dnb',
];
const YT_BAD = [
  'tutorial', 'how to', 'reaction', 'lesson', 'theory',
  'hardwell', 'fred again', 'techno', 'house', 'edm',
  'trance', 'dubstep', 'trap', 'melodic techno', 'melodic house',
  'podcast episode', 'interview', 'afro', 'commercial',
];
const YT_GOOD = [
  'drum and bass', 'dnb', 'd&b', 'neurofunk', 'liquid dnb',
  'jungle', 'drum & bass', 'rollers', 'halftime', 'liquid',
];
const ARTIST_NAMES_LC = DNB_ARTISTS.map((n) => n.toLowerCase());
const KNOWN_LABELS_LC = ['hospital records', 'korsakov music', 'undivide', 'ram records',
  'shogun audio', 'critical music', 'metalheadz', 'invisible', 'blackout', 'eatbrain',
  'liquicity', 'monstercat', 'viper recordings'];

function passesYouTubeFilter(title: string, channel: string): boolean {
  const hay = `${title} ${channel}`.toLowerCase();
  if (YT_BAD.some((b) => hay.includes(b))) return false;
  if (YT_GOOD.some((g) => hay.includes(g))) return true;
  if (KNOWN_LABELS_LC.some((l) => hay.includes(l))) return true;
  return ARTIST_NAMES_LC.some((n) => hay.includes(n));
}

function isRosterTagged(title: string, channel: string): boolean {
  const hay = `${title} ${channel}`.toLowerCase();
  if (KNOWN_LABELS_LC.some((l) => hay.includes(l))) return true;
  return Array.from(ROSTER_LOOKUP).some((n) => hay.includes(n));
}

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
    publishedAt: string;
  };
}

async function ytSearchOnce(query: string, region: string, after: string, key: string): Promise<YTSearchItem[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&videoCategoryId=10&order=viewCount&regionCode=${region}&publishedAfter=${after}&q=${encodeURIComponent(query)}&key=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`YouTube search failed: ${r.status}`);
  const j = (await r.json()) as { items?: YTSearchItem[] };
  return (j.items ?? []).filter((it) => it.id?.videoId);
}

async function youtubeTopForRegion(region: string, topArtistNames: string[]): Promise<{ videos: YouTubeVideo[]; note: string | null; rawHaystack: string[] }> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YouTube key not configured');
  const after = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  // 3rd query: name-search bundle of the top-5 Spotify artists in this market.
  const queries = [...YT_QUERIES];
  if (topArtistNames.length) {
    queries.push(topArtistNames.slice(0, 5).map((n) => `"${n}"`).join(' OR ') + ' drum and bass');
  }

  // Run all queries, combine, dedupe by videoId.
  const seen = new Map<string, YTSearchItem>();
  for (const q of queries) {
    try {
      const items = await ytSearchOnce(q, region, after, key);
      for (const it of items) if (!seen.has(it.id.videoId)) seen.set(it.id.videoId, it);
    } catch { /* skip this query, continue */ }
  }
  const combined = Array.from(seen.values());
  const filtered = combined.filter((it) => passesYouTubeFilter(it.snippet.title, it.snippet.channelTitle));
  const rawHaystack = filtered.map((it) => `${it.snippet.title} ${it.snippet.channelTitle}`.toLowerCase());

  if (filtered.length === 0) {
    return { videos: [], note: 'No verified DnB content found for this region in the last 12 months — this may indicate a developing market', rawHaystack: [] };
  }
  const ids = filtered.slice(0, 15).map((it) => it.id.videoId);
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}&key=${key}`;
  const v = await fetch(statsUrl);
  if (!v.ok) throw new Error(`YouTube stats failed: ${v.status}`);
  const vj = (await v.json()) as { items?: Array<{ id: string; statistics: { viewCount?: string } }> };
  const viewsById = new Map(vj.items?.map((x) => [x.id, parseInt(x.statistics.viewCount ?? '0', 10)]));
  const merged: YouTubeVideo[] = filtered.slice(0, 15).map((it) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    thumbnail: it.snippet.thumbnails?.medium?.url ?? it.snippet.thumbnails?.default?.url ?? '',
    views: viewsById.get(it.id.videoId) ?? 0,
    published: it.snippet.publishedAt,
    roster: isRosterTagged(it.snippet.title, it.snippet.channelTitle),
  }));
  merged.sort((a, b) => b.views - a.views);
  const top = merged.slice(0, 5);
  const note = top.length < 5 ? 'Limited DnB video content found for this region' : null;
  return { videos: top, note, rawHaystack };
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
  marketScore: number;
  ytMentions: number;
  eventMentions: number;
  cityScore: number;
  latestRelease: { name: string; date: string } | null;
  activity: 'active' | 'quiet' | 'inactive';
}

export interface CityMarketData {
  countryCode: string;
  fetchedAt: string;
  spotifyTop: SpotifyMarketArtist[];
  rosterOutside: SpotifyMarketArtist[];
  rosterReachTotal: number;
  rosterBreakdown: Array<{ name: string; followers: number; popularity: number }>;
  youtubeTop: YouTubeVideo[];
  youtubeNote: string | null;
  errors: { spotify?: string; youtube?: string };
}

type ArtistWithExtras = SpotifyArtist & { marketScore: number; latestRelease: { name: string; date: string } | null };
type CachedSpotify = {
  artists: ArtistWithExtras[];
  rosterAll: ArtistWithExtras[];
};
type CachedYoutube = { videos: YouTubeVideo[]; note: string | null; rawHaystack: string[] };

function activityFor(rel: { date: string } | null): 'active' | 'quiet' | 'inactive' {
  if (!rel) return 'inactive';
  const d = new Date(rel.date).getTime();
  if (!Number.isFinite(d)) return 'inactive';
  const ageDays = (Date.now() - d) / 86400000;
  if (ageDays < 120) return 'active';
  if (ageDays < 365) return 'quiet';
  return 'inactive';
}

function scoreArtists(
  artists: ArtistWithExtras[],
  ytHaystack: string[],
  lineupsLc: string[],
): SpotifyMarketArtist[] {
  const lineupCount = new Map<string, number>();
  for (const n of lineupsLc) lineupCount.set(n, (lineupCount.get(n) ?? 0) + 1);

  return artists.map((a) => {
    const nameLc = a.name.toLowerCase();
    const ytMentions = ytHaystack.filter((h) => h.includes(nameLc)).length;
    const eventMentions = lineupCount.get(nameLc) ?? 0;
    const spotifyComp = a.marketScore;
    const ytComp = Math.min(100, ytMentions * 20);
    const eventComp = Math.min(100, eventMentions * 25);
    const cityScore = spotifyComp * 0.55 + ytComp * 0.25 + eventComp * 0.20;
    return {
      ...a,
      rank: 0,
      roster: ROSTER_LOOKUP.has(nameLc),
      ytMentions,
      eventMentions,
      cityScore: Math.round(cityScore * 10) / 10,
      activity: activityFor(a.latestRelease),
    };
  });
}

export const getCityMarketData = createServerFn({ method: 'POST' })
  .inputValidator((data: { cityId: string; country: string; force?: boolean; lineups?: string[] }) =>
    z.object({
      cityId: z.string().min(1),
      country: z.string().min(1),
      force: z.boolean().optional(),
      lineups: z.array(z.string()).max(2000).optional(),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<CityMarketData> => {
    const market = isoForCountry(data.country);
    const errors: { spotify?: string; youtube?: string } = {};
    const force = data.force === true;
    const lineupsLc = (data.lineups ?? []).map((n) => n.toLowerCase());

    // 1. Spotify raw fetch (artists + roster, with per-market track scores).
    let spotifyRaw: CachedSpotify | null = null;
    if (!force) {
      const cached = await getCached<CachedSpotify>(data.cityId, 'spotify_top');
      // Legacy cache shape had { spotifyTop, ... } — invalidate it.
      if (cached && (cached.data as unknown as { artists?: unknown }).artists) {
        spotifyRaw = cached.data;
      }
    }
    if (!spotifyRaw) {
      try {
        const [top, rosterAll] = await Promise.all([
          spotifyTopForMarket(market),
          spotifyLookupRoster(market).then(async (roster) => {
            // Also compute market top-track score for roster artists.
            const token = await getSpotifyToken();
            const withScore = await Promise.all(
              roster.map(async (r) => ({
                ...r,
                marketScore: await spotifyMarketTopTrackAvg(r.id, market, token),
              })),
            );
            return withScore;
          }),
        ]);
        spotifyRaw = { artists: top, rosterAll };
        await putCached(data.cityId, market, 'spotify_top', spotifyRaw);
      } catch (e) {
        errors.spotify = (e as Error).message;
        spotifyRaw = { artists: [], rosterAll: [] };
      }
    }

    // 2. YouTube raw fetch (videos + note + rawHaystack for scoring).
    let youtubeRaw: CachedYoutube | null = null;
    if (!force) {
      const cached = await getCached<CachedYoutube | YouTubeVideo[] | { videos: YouTubeVideo[]; note: string | null }>(data.cityId, 'youtube_top');
      if (cached) {
        const c = cached.data as { rawHaystack?: unknown };
        if (Array.isArray(cached.data) || !c.rawHaystack) {
          youtubeRaw = null; // legacy shape — refetch
        } else {
          youtubeRaw = cached.data as CachedYoutube;
        }
      }
    }
    if (!youtubeRaw) {
      try {
        youtubeRaw = await youtubeTopForRegion(market);
        await putCached(data.cityId, market, 'youtube_top', youtubeRaw);
      } catch (e) {
        errors.youtube = (e as Error).message;
        youtubeRaw = { videos: [], note: null, rawHaystack: [] };
      }
    }

    // 3. Composite per-city ranking.
    const scored = scoreArtists(spotifyRaw.artists, youtubeRaw.rawHaystack, lineupsLc);
    scored.sort((a, b) => b.cityScore - a.cityScore || b.popularity - a.popularity);
    const spotifyTop = scored.slice(0, 10).map((a, i) => ({ ...a, rank: i + 1 }));
    const top10Names = new Set(spotifyTop.map((t) => t.name.toLowerCase()));

    const rosterScored = scoreArtists(spotifyRaw.rosterAll, youtubeRaw.rawHaystack, lineupsLc);
    const rosterOutside = rosterScored
      .filter((r) => !top10Names.has(r.name.toLowerCase()))
      .sort((a, b) => b.cityScore - a.cityScore || b.followers - a.followers)
      .slice(0, 10)
      .map((a, i) => ({ ...a, rank: i + 1, roster: true }));
    const rosterBreakdown = spotifyRaw.rosterAll
      .map((r) => ({ name: r.name, followers: r.followers, popularity: r.popularity }))
      .sort((a, b) => b.followers - a.followers);
    const rosterReachTotal = spotifyRaw.rosterAll.reduce((s, r) => s + r.followers, 0);

    return {
      countryCode: market,
      fetchedAt: new Date().toISOString(),
      spotifyTop,
      rosterOutside,
      rosterBreakdown,
      rosterReachTotal,
      youtubeTop: youtubeRaw.videos,
      youtubeNote: youtubeRaw.note,
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
      const p = r.payload as { rosterAll?: Array<{ followers?: number }>; rosterReachTotal?: number } | null;
      const total = p?.rosterAll
        ? p.rosterAll.reduce((s, a) => s + (a.followers ?? 0), 0)
        : p?.rosterReachTotal ?? 0;
      byCity[r.city_id] = { total, iso: r.country_code };
    }
    return { byCity };
  });
