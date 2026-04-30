import type { City } from '../data/cities';

export default function PanelArtists({ city }: { city: City }) {
  const artists = Array.from(new Set(city.promoters.flatMap((p) => p.lineup))).sort();
  return (
    <div className="p-4">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
        {artists.length} artists booked
      </div>
      <div className="flex flex-wrap gap-2">
        {artists.map((a) => (
          <span key={a} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full">
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}
