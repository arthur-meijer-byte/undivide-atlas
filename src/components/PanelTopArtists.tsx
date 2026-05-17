import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { City } from '../data/cities';
import { getCityMarketData } from '@/lib/market.functions';

function fmt(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}

function SpotifyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path
        fill="#fff"
        d="M17.3 16.2c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.3.4-.7.5-1.1.3-2.8-1.7-7.1-2.2-10.4-1.2-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 3.8-1.1 8.6-.6 11.8 1.4.4.2.5.7.1 1.1zm.1-2.7C15.2 8.9 8.9 8.7 5.7 9.7c-.5.2-1.1-.1-1.3-.7-.2-.5.1-1.1.7-1.3 3.7-1.1 10.7-.9 14.5 1.4.5.3.7 1 .4 1.5-.3.4-1 .6-1.4.3z"
      />
    </svg>
  );
}

export default function PanelTopArtists({ city }: { city: City }) {
  const qc = useQueryClient();
  const fetchMarket = useServerFn(getCityMarketData);

  // Flatten all promoter line-ups + previous-event names so the server can
  // count per-artist appearances inside THIS city's event analytics.
  const lineups = city.promoters.flatMap((p) => [
    ...p.lineup,
    ...p.events_list.flatMap((e) => e.name.split(/[,&×x+/]| feat\.?| with /i).map((s) => s.trim()).filter(Boolean)),
  ]);

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
    <div className="p-4 space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Top Artists — {city.name} ({data?.countryCode ?? '…'})
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            Ranked per-city: Spotify market pop · YouTube mentions · Event line-ups
          </div>
        </div>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending || isLoading}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-800 disabled:opacity-50"
        >
          <RefreshCw size={11} className={refreshMut.isPending ? 'animate-spin' : ''} />
          {refreshMut.isPending ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {isLoading && <div className="text-xs text-gray-400">Loading market data…</div>}
      {error && <div className="text-xs text-red-500">{(error as Error).message}</div>}

      {data && (
        <>
          {/* Spotify Top 10 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <SpotifyIcon className="w-3.5 h-3.5" />
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Spotify Top 10 in {data.countryCode}
              </div>
            </div>
            {data.errors.spotify ? (
              <div className="text-[11px] text-gray-400 italic">Data unavailable — {data.errors.spotify}</div>
            ) : data.spotifyTop.length === 0 ? (
              <div className="text-[11px] text-gray-400 italic">No D&B artists indexed for this market.</div>
            ) : (
              <div className="space-y-1">
                {data.spotifyTop.map((a) => (
                  <a
                    key={a.id}
                    href={`https://open.spotify.com/artist/${a.id}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50"
                  >
                    <div className="text-[10px] tabular-nums text-gray-400 w-4">{a.rank}</div>
                    {a.image ? (
                      <img src={a.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        {a.name}
                        <span className="text-[8px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-600 px-1 py-px rounded">
                          {a.subgenre}
                        </span>
                        {a.roster && (
                          <span className="text-[8px] uppercase tracking-wider font-bold bg-green-600 text-white px-1 py-px rounded">
                            Roster
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {fmt(a.followers)} Spotify followers · pop {a.popularity}
                      </div>
                    </div>
                    <SpotifyIcon className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2 leading-snug">
              Spotify API exposes popularity (0–100) and total followers — monthly listeners is
              not publicly available. Followers shown as the strongest available proxy.
            </p>
          </div>

          {/* Roster outside top 10 */}
          {data.rosterOutside.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                Your artists in this market
              </div>
              <div className="space-y-1">
                {data.rosterOutside.map((a) => (
                  <a
                    key={a.id}
                    href={`https://open.spotify.com/artist/${a.id}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--undivide)]/5 hover:bg-[var(--undivide)]/10"
                  >
                    {a.image ? (
                      <img src={a.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900 truncate">{a.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {fmt(a.followers)} followers · pop {a.popularity}
                      </div>
                    </div>
                    <SpotifyIcon className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* YouTube top 3 */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              YouTube — top D&B videos from {data.countryCode} (last 12 mo)
            </div>
            {data.errors.youtube ? (
              <div className="text-[11px] text-gray-400 italic">Data unavailable — {data.errors.youtube}</div>
            ) : data.youtubeTop.length === 0 ? (
              <div className="text-[11px] text-gray-500 italic">
                {data.youtubeNote ?? 'No videos found.'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {data.youtubeTop.map((v) => (
                    <a
                      key={v.id}
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank" rel="noreferrer"
                      className="flex gap-2 hover:bg-gray-50 rounded-md p-1.5"
                    >
                      <img src={v.thumbnail} alt="" className="w-20 h-14 rounded object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium line-clamp-2 leading-snug">{v.title}</div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">{v.channel}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1">
                          {fmt(v.views)} views <ExternalLink size={9} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
                {data.youtubeNote && (
                  <div className="text-[10px] text-gray-400 italic mt-2">{data.youtubeNote}</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
