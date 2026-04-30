import type { City } from '../data/cities';

export default function PanelEvents({ city }: { city: City }) {
  const events = city.promoters.flatMap((p) => p.events_list).sort((a, b) => b.year - a.year);
  return (
    <div className="p-4 space-y-2 text-sm">
      {events.map((e, i) => {
        const pct = Math.round((e.sold / e.cap) * 100);
        const color = pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
            <div className="w-12 text-center bg-white rounded-md p-1 shrink-0">
              <div className="text-[10px] text-gray-500">{e.date.split(' ')[0]}</div>
              <div className="text-sm font-bold text-[var(--undivide)]">{e.year}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate text-xs">{e.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{e.venue}</div>
              <div className="text-[11px] text-gray-500">{e.sold.toLocaleString()} / {e.cap.toLocaleString()}</div>
              <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
            <div className="text-xs font-semibold w-10 text-right">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}
