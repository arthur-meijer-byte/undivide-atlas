import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

// ───────────────────────── Spotify helpers ─────────────────────────

let _spotifyToken: { token: string; exp: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (_spotifyToken && _spotifyToken.exp > Date.now() + 30_000) return _spotifyToken.token;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not configured');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  _spotifyToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function spotifySearchArtist(name: string): Promise<{
  id: string; popularity: number; followers: number;
} | null> {
  const token = await getSpotifyToken();
  const r = await fetch(
    `https://api.spotify.com/v1/search?type=artist&limit=1&q=${encodeURIComponent(name)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!r.ok) return null;
  const j = (await r.json()) as { artists?: { items: Array<{ id: string; popularity: number; followers: { total: number } }> } };
  const a = j.artists?.items?.[0];
  return a ? { id: a.id, popularity: a.popularity, followers: a.followers.total } : null;
}

async function spotifyArtistById(id: string): Promise<{ popularity: number; followers: number } | null> {
  const token = await getSpotifyToken();
  const r = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const a = (await r.json()) as { popularity: number; followers: { total: number } };
  return { popularity: a.popularity, followers: a.followers.total };
}

async function spotifyLatestRelease(id: string): Promise<string | null> {
  const token = await getSpotifyToken();
  const r = await fetch(
    `https://api.spotify.com/v1/artists/${id}/albums?include_groups=single,album&market=US&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!r.ok) return null;
  const j = (await r.json()) as { items: Array<{ release_date: string }> };
  const d = j.items?.[0]?.release_date;
  return d ?? null;
}

// ───────────────────────── YouTube helpers ─────────────────────────

async function youtubeChannelForArtist(name: string): Promise<{ channelId: string; subs: number } | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  // Search for the channel
  const s = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(name + ' drum and bass')}&key=${key}`,
  );
  if (!s.ok) return null;
  const sj = (await s.json()) as { items?: Array<{ snippet: { channelId: string } }> };
  const channelId = sj.items?.[0]?.snippet?.channelId;
  if (!channelId) return null;
  const c = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`,
  );
  if (!c.ok) return null;
  const cj = (await c.json()) as { items?: Array<{ statistics: { subscriberCount?: string } }> };
  const subs = parseInt(cj.items?.[0]?.statistics?.subscriberCount ?? '0', 10);
  return { channelId, subs };
}

// ───────────────────────── Server functions ─────────────────────────

export const refreshArtists = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data: rows, error } = await supabaseAdmin.from('dnb_artists').select('*');
    if (error) throw error;

    let updated = 0;
    const errors: string[] = [];

    for (const row of rows ?? []) {
      try {
        let spotifyId = row.spotify_id;
        let spotifyStats: { popularity: number; followers: number } | null = null;

        if (!spotifyId) {
          const found = await spotifySearchArtist(row.name);
          if (found) {
            spotifyId = found.id;
            spotifyStats = { popularity: found.popularity, followers: found.followers };
          }
        } else {
          spotifyStats = await spotifyArtistById(spotifyId);
        }

        const latest = spotifyId ? await spotifyLatestRelease(spotifyId) : null;
        const yt = await youtubeChannelForArtist(row.name);

        const lastReleaseDate = latest ? latest.padEnd(10, '-01').slice(0, 10) : null;
        const isActive = lastReleaseDate
          ? Date.now() - new Date(lastReleaseDate).getTime() < 365 * 24 * 60 * 60 * 1000
          : row.active;

        await supabaseAdmin.from('dnb_artists').update({
          spotify_id: spotifyId,
          spotify_popularity: spotifyStats?.popularity ?? row.spotify_popularity,
          spotify_followers: spotifyStats?.followers ?? row.spotify_followers,
          youtube_channel_id: yt?.channelId ?? row.youtube_channel_id,
          youtube_subs: yt?.subs ?? row.youtube_subs,
          last_release_at: lastReleaseDate ?? row.last_release_at,
          active: isActive,
          updated_at: new Date().toISOString(),
        }).eq('id', row.id);

        updated += 1;
      } catch (e) {
        errors.push(`${row.name}: ${(e as Error).message}`);
      }
      // gentle throttle
      await new Promise((r) => setTimeout(r, 120));
    }

    return { updated, total: rows?.length ?? 0, errors };
  });

// Map a country to region tags used in dnb_artists.regions
function regionTagsForCountry(country: string): string[] {
  const c = country.toLowerCase();
  const map: Record<string, string[]> = {
    'united kingdom': ['uk', 'eu'],
    'netherlands': ['nl', 'eu'],
    'germany': ['de', 'eu'],
    'austria': ['at', 'eu'],
    'czech republic': ['cz', 'eu'],
    'poland': ['pl', 'eu'],
    'belgium': ['be', 'eu'],
    'france': ['fr', 'eu'],
    'spain': ['es', 'eu'],
    'portugal': ['pt', 'eu'],
    'italy': ['it', 'eu'],
    'switzerland': ['ch', 'eu'],
    'hungary': ['hu', 'eu'],
    'denmark': ['dk', 'eu'],
    'sweden': ['se', 'eu'],
    'ireland': ['ie', 'eu'],
    'brazil': ['br'],
    'new zealand': ['nz'],
    'australia': ['au'],
  };
  return map[c] ?? ['eu'];
}

export const getCityTopArtists = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { country: string; subgenres: string[] }) =>
    z.object({ country: z.string(), subgenres: z.array(z.string()) }).parse(data),
  )
  .handler(async ({ data }) => {
    const tags = regionTagsForCountry(data.country);
    const { data: rows, error } = await supabaseAdmin
      .from('dnb_artists')
      .select('*')
      .overlaps('regions', tags);
    if (error) throw error;

    const subWanted = data.subgenres.map((s) => s.toLowerCase());

    // composite score: spotify popularity (0-100) * 1.0
    //                + log10(spotify_followers) * 4
    //                + log10(youtube_subs)      * 3
    //                + subgenre match bonus     * 8
    const scored = (rows ?? []).map((r) => {
      const subMatch = subWanted.some((s) => r.subgenres.some((g) => g.toLowerCase().includes(s)));
      const pop = r.spotify_popularity ?? 0;
      const sf = r.spotify_followers ? Math.log10(Math.max(1, r.spotify_followers)) : 0;
      const ys = r.youtube_subs ? Math.log10(Math.max(1, r.youtube_subs)) : 0;
      const score = pop + sf * 4 + ys * 3 + (subMatch ? 8 : 0);
      return { ...r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 10);
    const total = top.reduce((s, x) => s + x.score, 0) || 1;
    return top.map((x, i) => ({
      rank: i + 1,
      name: x.name,
      share: Math.round((x.score / total) * 1000) / 10,
      spotify_popularity: x.spotify_popularity ?? null,
      spotify_followers: x.spotify_followers ?? null,
      youtube_subs: x.youtube_subs ?? null,
      last_release_at: x.last_release_at,
      active: x.active,
      subgenres: x.subgenres,
    }));
  });
