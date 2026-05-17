import { useMemo } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, RefreshCw, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { City } from '../data/cities';
import { getCityMarketData, type SpotifyMarketArtist } from '@/lib/market.functions';

function fmt(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}

function daysAgo(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return Math.floor((Date.now() - t) / 86400000);
}

function ActivityDot({ a }: { a: SpotifyMarketArtist['activity'] }) {
  const cls = a === 'active' ? 'bg-green-500' : a === 'quiet' ? 'bg-yellow-500' : 'bg-gray-700';
  const label = a === 'active' ? 'Active' : a === 'quiet' ? 'Quiet' : 'Inactive';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-600">
      <span className={`w-1.5 h-1.5 rounded-full ${cls}`} /> {label}
    </span>
  );
}

function SpotifyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path fill="#fff" d="M17.3 16.2c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.3.4-.7.5-1.1.3-2.8-1.7-7.1-2.2-10.4-1.2-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.7.1 1.1zm.1-2.7C15.2 8.9 8.9 8.7 5.7 9.7c-.5.2-1.1-.1-1.3-.7-.2-.5.1-1.1.7-1.3 3.7-1.1 10.7-.9 14.5 1.4.5.3.7 1 .4 1.5-.3.4-1 .6-1.4.3z" />
    </svg>
  );
}

function ArtistRow({ a, showRank = true }: { a: SpotifyMarketArtist; showRank?: boolean }) {
  return (
    <a
      href={`https://open.spotify.com/artist/${a.id}`}
      target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-2 px-2 py-2 rounded-md hover:bg-gray-50"
    >
      {showRank && <div className="text-[10px] tabular-nums text-gray-600 w-5 pt-1">#{a.rank}</div>}
      {a.image ? (
        <img src={a.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1.5 flex-wrap">
          {a.name}
          <span className="text-[8px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-700 px-1 py-px rounded">
            {a.subgenre}
          </span>
          {a.roster && (
            <span className="text-[8px] uppercase tracking-wider font-bold bg-[var(--undivide)] text-white px-1 py-px rounded">
              Roster
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-700 truncate">
          <span className="font-semibold">Pop {Math.round(a.marketScore)}/100</span>
          {' · '}{fmt(a.followers)} followers
          {' · '}YT {a.ytMentions} · Events {a.eventMentions}
        </div>
        <div className="text-[10px] text-gray-600 truncate flex items-center gap-2 mt-0.5">
          {a.latestRelease ? (
            <span className="truncate">
              <span className="text-gray-500">Latest:</span>{' '}
              <span className="font-medium text-gray-800">{a.latestRelease.name}</span>
              {' · '}
              {a.latestRelease.date}
            </span>
          ) : (
            <span className="text-gray-600 italic">No releases indexed</span>
          )}
          <ActivityDot a={a.activity} />
        </div>
      </div>
      <SpotifyIcon className="w-3 h-3 opacity-60 mt-1" />
    </a>
  );
}

// ─────────────── Event analytics derived from city.promoters ───────────────

interface EventAggregates {
  totalShows: number;
  totalSold: number;
  totalCap: number;
  avgFill: number;
  best: { name: string; venue: string; date: string; fill: number; promoter: string } | null;
  worst: { name: string; venue: string; date: string; fill: number; promoter: string } | null;
  byYear: Array<{ year: number; sold: number; shows: number }>;
  mostBookedArtist: { name: string; count: number } | null;
  mostUsedVenue: { name: string; count: number } | null;
}

function aggregateEvents(city: City): EventAggregates {
  const venueCount = new Map<string, number>();
  const artistCount = new Map<string, number>();
  const yearMap = new Map<number, { sold: number; shows: number }>();
  let totalShows = 0;
  let totalSold = 0;
  let totalCap = 0;
  let best: EventAggregates['best'] = null;
  let worst: EventAggregates['worst'] = null;

  for (const p of city.promoters) {
    for (const a of p.lineup) {
      const k = a.trim();
      if (k) artistCount.set(k, (artistCount.get(k) ?? 0) + 1);
    }
    for (const e of p.events_list) {
      totalShows++;
      totalSold += e.sold;
      totalCap += e.cap;
      const fill = e.cap > 0 ? e.sold / e.cap : 0;
      if (!best || fill > best.fill) best = { name: e.name, venue: e.venue, date: e.date, fill, promoter: p.name };
      if (!worst || fill < worst.fill) worst = { name: e.name, venue: e.venue, date: e.date, fill, promoter: p.name };
      venueCount.set(e.venue, (venueCount.get(e.venue) ?? 0) + 1);
      const yr = e.year;
      const cur = yearMap.get(yr) ?? { sold: 0, shows: 0 };
      cur.sold += e.sold;
      cur.shows += 1;
      yearMap.set(yr, cur);
    }
  }

  const startYear = 2015;
  const endYear = new Date().getFullYear();
  const byYear: EventAggregates['byYear'] = [];
  for (let y = startYear; y <= endYear; y++) {
    const e = yearMap.get(y) ?? { sold: 0, shows: 0 };
    byYear.push({ year: y, sold: e.sold, shows: e.shows });
  }

  const topEntry = <T,>(m: Map<string, number>): { name: string; count: number } | null => {
    let best: { name: string; count: number } | null = null;
    m.forEach((count, name) => { if (!best || count > best.count) best = { name, count }; });
    return best;
  };

  return {
    totalShows,
    totalSold,
    totalCap,
    avgFill: totalCap > 0 ? totalSold / totalCap : 0,
    best,
    worst,
    byYear,
    mostBookedArtist: topEntry(artistCount),
    mostUsedVenue: topEntry(venueCount),
  };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
      <div className="text-base font-bold text-gray-900 mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-gray-600 truncate">{sub}</div>}
    </div>
  );
}

function EventAnalytics({ city }: { city: City }) {
  const agg = useMemo(() => aggregateEvents(city), [city]);

  if (agg.totalShows === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-sm font-semibold text-gray-900">No shows logged for {city.name} yet.</div>
        <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white bg-[var(--undivide)] px-3 py-1.5 rounded-full hover:opacity-90">
          <Plus size={12} /> Book first show
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Shows" value={String(agg.totalShows)} sub={`since ${agg.byYear.find((y) => y.shows > 0)?.year ?? '—'}`} />
        <StatCard label="Tickets sold" value={fmt(agg.totalSold)} sub={`${fmt(agg.totalCap)} cap`} />
        <StatCard label="Avg fill" value={`${Math.round(agg.avgFill * 100)}%`} />
      </div>

      <div className="h-32 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={agg.byYear} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" fontSize={9} stroke="#9ca3af" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{ fontSize: 10, padding: '4px 8px', borderRadius: 6 }}
              formatter={(v: number) => [fmt(v), 'Tickets']}
            />
            <Bar dataKey="sold" fill="var(--undivide)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {agg.best && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-2.5">
          <div className="text-[9px] uppercase tracking-wider text-green-700 font-semibold">Best show</div>
          <div className="text-xs font-semibold text-gray-900 truncate">{agg.best.name}</div>
          <div className="text-[10px] text-gray-700">
            {agg.best.venue} · {agg.best.date} · {Math.round(agg.best.fill * 100)}% fill · by {agg.best.promoter}
          </div>
        </div>
      )}
      {agg.worst && agg.worst !== agg.best && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Worst show (internal)</div>
          <div className="text-xs font-semibold text-gray-900 truncate">{agg.worst.name}</div>
          <div className="text-[10px] text-gray-700">
            {agg.worst.venue} · {agg.worst.date} · {Math.round(agg.worst.fill * 100)}% fill · by {agg.worst.promoter}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {agg.mostBookedArtist && (
          <StatCard label="Most booked artist" value={agg.mostBookedArtist.name} sub={`${agg.mostBookedArtist.count}× line-ups`} />
        )}
        {agg.mostUsedVenue && (
          <StatCard label="Most used venue" value={agg.mostUsedVenue.name} sub={`${agg.mostUsedVenue.count} shows`} />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────── Main ────────────────────────────

export default function PanelTopArtists({ city }: { city: City }) {
  const qc = useQueryClient();
  const fetchMarket = useServerFn(getCityMarketData);

  const lineups = useMemo(
    () => city.promoters.flatMap((p) => [
      ...p.lineup,
      ...p.events_list.flatMap((e) => e.name.split(/[,&×x+/]| feat\.?| with /i).map((s) => s.trim()).filter(Boolean)),
    ]),
    [city],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['city-market', city.id],
    queryFn: () => fetchMarket({ data: { cityId: city.id, country: city.country, lineups } }),
    staleTime: 60 * 60 * 1000,
  });

  const refreshMut = useMutation({
    mutationFn: () => fetchMarket({ data: { cityId: city.id, country: city.country, force: true, lineups } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['city-market', city.id] }),
  });

  return (
    <div className="p-4 space-y-6 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Scene Intel — {city.name} ({data?.countryCode ?? '…'})
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Spotify market data · YouTube regional content · Internal event analytics
          </div>
        </div>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending || isLoading}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <RefreshCw size={11} className={refreshMut.isPending ? 'animate-spin' : ''} />
          {refreshMut.isPending ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {isLoading && <div className="text-xs text-gray-500">Loading market data…</div>}
      {error && <div className="text-xs text-red-500">{(error as Error).message}</div>}

      {data && (
        <>
          {/* SECTION 1 — Spotify top 10 in market */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <SpotifyIcon className="w-3.5 h-3.5" />
              <div className="text-[10px] uppercase tracking-wider text-gray-700 font-semibold">
                Top 10 DnB in {data.countryCode} — Spotify market data
              </div>
            </div>
            {data.errors.spotify ? (
              <div className="text-[11px] text-gray-500 italic">Data unavailable — {data.errors.spotify}</div>
            ) : data.spotifyTop.length === 0 ? (
              <div className="text-[11px] text-gray-500 italic">No D&B artists available in this market.</div>
            ) : (
              <div className="space-y-0.5">
                {data.spotifyTop.map((a) => <ArtistRow key={a.id} a={a} />)}
              </div>
            )}
          </div>

          {/* SECTION 2 — Your roster in this market */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--undivide)] font-bold mb-2">
              Your roster in {data.countryCode}
            </div>
            {data.rosterOutside.length === 0 && data.spotifyTop.filter((a) => a.roster).length === 0 ? (
              <div className="text-[11px] text-gray-500 italic">No Undivide roster artist available in this market.</div>
            ) : (
              <div className="space-y-0.5">
                {/* Roster artists already in Top 10 first */}
                {data.spotifyTop.filter((a) => a.roster).map((a) => (
                  <ArtistRow key={`top-${a.id}`} a={a} showRank={false} />
                ))}
                {data.rosterOutside.map((a) => <ArtistRow key={a.id} a={a} showRank={false} />)}
              </div>
            )}
            <p className="text-[10px] text-gray-500 mt-2 leading-snug">
              Local Spotify popularity for every roster artist available in this market — your leverage shortlist.
            </p>
          </div>

          {/* SECTION 3 — YouTube */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-700 font-semibold mb-2">
              YouTube — top D&B from {data.countryCode} (last 12 mo)
            </div>
            {data.errors.youtube ? (
              <div className="text-[11px] text-gray-500 italic">Data unavailable — {data.errors.youtube}</div>
            ) : data.youtubeTop.length === 0 ? (
              <div className="text-[11px] text-gray-500 italic">{data.youtubeNote ?? 'No videos found.'}</div>
            ) : (
              <>
                <div className="space-y-2">
                  {data.youtubeTop.map((v) => (
                    <a
                      key={v.id}
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex gap-2 hover:bg-gray-50 rounded-md p-1.5"
                    >
                      <div className="relative shrink-0">
                        <img src={v.thumbnail} alt="" className="w-24 h-16 rounded object-cover" />
                        {v.roster && (
                          <span className="absolute top-1 left-1 text-[8px] uppercase tracking-wider font-bold bg-[var(--undivide)] text-white px-1 py-px rounded">
                            Roster
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{v.title}</div>
                        <div className="text-[10px] text-gray-600 truncate mt-0.5">{v.channel}</div>
                        <div className="text-[10px] text-gray-600 flex items-center gap-1.5">
                          {fmt(v.views)} views · {daysAgo(v.published)}d ago <ExternalLink size={9} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
                {data.youtubeNote && (
                  <div className="text-[10px] text-gray-500 italic mt-2">{data.youtubeNote}</div>
                )}
              </>
            )}
          </div>

          {/* SECTION 4 — Event analytics */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-700 font-semibold mb-2">
              Event analytics — {city.name}
            </div>
            <EventAnalytics city={city} />
          </div>
        </>
      )}
    </div>
  );
}
