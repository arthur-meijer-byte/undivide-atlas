import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import type { City } from '../data/cities';
import { getCityTopArtists, refreshArtists } from '@/lib/artists.functions';

function fmt(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}

export default function PanelArtists({ city }: { city: City }) {
  const qc = useQueryClient();
  const fetchTop = useServerFn(getCityTopArtists);
  const refresh = useServerFn(refreshArtists);

  const subgenres = [city.market.dominant_subgenre, ...(city.market.secondary_subgenres ?? [])];

  const { data, isLoading, error } = useQuery({
    queryKey: ['city-top-artists', city.country, subgenres.join(',')],
    queryFn: () => fetchTop({ data: { country: city.country, subgenres } }),
    staleTime: 5 * 60 * 1000,
  });

  const refreshMut = useMutation({
    mutationFn: () => refresh({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['city-top-artists'] }),
  });

  // Fallback: previously-booked artists from promoter lineups
  const bookedArtists = Array.from(new Set(city.promoters.flatMap((p) => p.lineup))).sort();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
            Top 10 in {city.name}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">
            Spotify popularity · followers · YouTube subs · subgenre match
          </div>
        </div>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-800 disabled:opacity-50"
          title="Pull latest Spotify + YouTube stats for the whole roster"
        >
          <RefreshCw size={11} className={refreshMut.isPending ? 'animate-spin' : ''} />
          {refreshMut.isPending ? 'Refreshing…' : 'Refresh stats'}
        </button>
      </div>

      {isLoading && <div className="text-xs text-gray-600">Loading…</div>}
      {error && <div className="text-xs text-red-500">{(error as Error).message}</div>}

      {data && data.length === 0 && (
        <div className="text-xs text-gray-600">
          No artists tagged for this region yet. Hit Refresh to populate stats, or add seed artists.
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-1.5">
          {data.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-[10px] tabular-nums text-gray-600 w-4">{a.rank}</div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate flex items-center gap-1.5">
                    {a.name}
                    {!a.active && (
                      <span className="text-[9px] uppercase text-gray-600 border border-gray-200 px-1 rounded">
                        inactive
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {a.subgenres.join(' · ') || '—'}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] tabular-nums text-gray-700">
                  {a.share}% · pop {a.spotify_popularity ?? '—'}
                </div>
                <div className="text-[10px] tabular-nums text-gray-600">
                  SP {fmt(a.spotify_followers)} · YT {fmt(a.youtube_subs)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {refreshMut.data && (
        <div className="text-[10px] text-gray-600 border-t pt-2">
          Refreshed {refreshMut.data.updated}/{refreshMut.data.total}
          {refreshMut.data.errors.length > 0 && ` · ${refreshMut.data.errors.length} errors`}
        </div>
      )}

      {bookedArtists.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
            Previously booked in city ({bookedArtists.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bookedArtists.map((a) => (
              <span
                key={a}
                className="text-[11px] bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
