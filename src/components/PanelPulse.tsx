import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ExternalLink, Lock } from 'lucide-react';
import type { City } from '../data/cities';
import { getMarketPulse } from '@/lib/pulse.functions';

const PLATFORM_COLORS: Record<string, string> = {
  Spotify: 'bg-green-50 text-green-700 border-green-200',
  YouTube: 'bg-red-50 text-red-700 border-red-200',
  'Apple Music': 'bg-pink-50 text-pink-700 border-pink-200',
  Shazam: 'bg-blue-50 text-blue-700 border-blue-200',
  Beatport: 'bg-lime-50 text-lime-700 border-lime-200',
  Instagram: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  TikTok: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function PanelPulse({ city }: { city: City }) {
  const fetchPulse = useServerFn(getMarketPulse);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['market-pulse', city.id, city.country],
    queryFn: () => fetchPulse({ data: { cityId: city.id, country: city.country } }),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
            Market Pulse · {city.name}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">
            Cross-platform aggregation · country: {data?.countryCode ?? '…'}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-800 disabled:opacity-50"
        >
          <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading && <div className="text-xs text-gray-600">Loading market data…</div>}
      {error && <div className="text-xs text-red-500">{(error as Error).message}</div>}

      {data && (
        <>
          {/* Platform status grid */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
              Data sources
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {data.sources.map((s) => (
                <div
                  key={s.platform}
                  className={`rounded-md border px-2 py-1.5 ${PLATFORM_COLORS[s.platform] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">{s.platform}</span>
                    {s.status === 'live' ? (
                      <span className="text-[9px] uppercase tracking-wider bg-white/60 px-1.5 rounded-full">live</span>
                    ) : (
                      <Lock size={9} className="opacity-60" />
                    )}
                  </div>
                  <div className="text-[9px] leading-tight mt-0.5 opacity-80">{s.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Apple Music: electronic share */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-100">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-wider text-pink-700 font-semibold">
                Apple Music — electronic share
              </div>
              <div className="text-2xl font-bold text-pink-700 tabular-nums">
                {data.apple.electronicShare}%
              </div>
            </div>
            <div className="text-[10px] text-pink-800/70">
              {data.apple.electronic.length} electronic tracks in the top {data.apple.top.length + data.apple.electronic.length > 10 ? '50' : data.apple.top.length} country chart · higher = more receptive market
            </div>
            <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                style={{ width: `${Math.min(100, data.apple.electronicShare * 4)}%` }}
              />
            </div>
          </div>

          {/* Apple Music: electronic tracks in country */}
          {data.apple.electronic.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
                Top electronic tracks in {data.countryCode}
              </div>
              <div className="space-y-1">
                {data.apple.electronic.map((t) => (
                  <a
                    key={t.rank + t.name}
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group"
                  >
                    <div className="text-[10px] tabular-nums text-gray-500 w-5">#{t.rank}</div>
                    {t.artwork && (
                      <img src={t.artwork} alt="" className="w-8 h-8 rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{t.name}</div>
                      <div className="text-[10px] text-gray-600 truncate">
                        {t.artist} · {t.genres.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <ExternalLink size={11} className="text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Apple Music: overall top */}
          {data.apple.top.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
                Top 10 country chart (all genres)
              </div>
              <div className="space-y-1">
                {data.apple.top.map((t) => (
                  <a
                    key={t.rank + t.name}
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group ${t.isElectronic ? 'bg-pink-50/40' : ''}`}
                  >
                    <div className="text-[10px] tabular-nums text-gray-500 w-5">#{t.rank}</div>
                    {t.artwork && (
                      <img src={t.artwork} alt="" className="w-7 h-7 rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{t.name}</div>
                      <div className="text-[10px] text-gray-600 truncate">{t.artist}</div>
                    </div>
                    {t.isElectronic && (
                      <span className="text-[9px] uppercase tracking-wider bg-pink-200 text-pink-800 px-1.5 rounded-full">
                        elec
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {data.apple.error && (
            <div className="text-[10px] text-red-500">Apple Music: {data.apple.error}</div>
          )}

          <div className="text-[10px] text-gray-500 border-t pt-2">
            Cached weekly · Spotify & YouTube in <b>Scene Intel</b> tab · country code derived from city
          </div>
        </>
      )}
    </div>
  );
}
