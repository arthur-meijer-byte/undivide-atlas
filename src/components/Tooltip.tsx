import { useMapState } from '../hooks/useMapState';
import { STATUS_COLORS, STATUS_LABEL } from '../data/cities';

export default function Tooltip() {
  const hover = useMapState((s) => s.hoverCity);
  if (!hover) return null;
  const totalEvents = hover.city.promoters.reduce((a, p) => a + p.events, 0);
  return (
    <div
      className="fixed z-40 pointer-events-none bg-white rounded-md shadow-[var(--shadow-float)] px-3 py-2 text-xs"
      style={{ left: hover.x + 14, top: hover.y + 14 }}
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[hover.city.status] }} />
        {hover.city.name}
        <span className="text-gray-600 font-normal">{hover.city.country}</span>
      </div>
      <div className="text-gray-500 mt-0.5">{STATUS_LABEL[hover.city.status]} · {hover.city.genre}</div>
      <div className="text-gray-500">{totalEvents} events · {hover.city.promoters.length} promoters</div>
    </div>
  );
}
