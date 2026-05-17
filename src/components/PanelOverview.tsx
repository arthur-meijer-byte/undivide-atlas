import type { City } from '../data/cities';

const typeBadge = { undivide: 'bg-[var(--undivide)] text-white', local: 'bg-blue-100 text-blue-700', venue: 'bg-amber-100 text-amber-700', independent: 'bg-gray-200 text-gray-700' } as const;

export default function PanelOverview({ city }: { city: City }) {
  const totalEvents = city.promoters.reduce((a, p) => a + p.events, 0);
  let sold = 0, cap = 0;
  city.promoters.forEach((p) => p.events_list.forEach((e) => { sold += e.sold; cap += e.cap; }));
  const fill = cap ? Math.round((sold / cap) * 100) : 0;

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: totalEvents, l: 'Events' },
          { v: sold.toLocaleString(), l: 'Tickets' },
          { v: `${fill}%`, l: 'Fill rate' },
        ].map((s) => (
          <div key={s.l} className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[var(--undivide)]">{s.v}</div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Row k="Country" v={city.country} />
        <Row k="Genre" v={city.genre} />
        <Row k="Market size" v={city.marketSize} />
        <Row k="Market growth" v={city.market.growth} />
        <Row k="Avg ticket" v={`€${city.market.avgTicket}`} />
        <Row k="Revenue potential" v={city.market.potentialRev} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">Promoters</div>
        <div className="space-y-2">
          {city.promoters.map((p) => (
            <div key={p.name} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
              <div className="w-9 h-9 rounded-full bg-[var(--undivide)]/15 text-[var(--undivide)] flex items-center justify-center font-bold text-sm">
                {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{p.events} events · since {p.since}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${typeBadge[p.type]}`}>{p.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {city.promoters.flatMap((p) => [
          p.ig && { l: 'Instagram', v: p.ig },
          p.fb && { l: 'Facebook', v: p.fb },
          p.yt && { l: 'YouTube', v: p.yt },
        ]).filter(Boolean).map((s, i) => (
          <span key={i} className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600">
            {(s as { l: string; v: string }).l}: @{(s as { l: string; v: string }).v}
          </span>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-gray-100">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold capitalize">{v}</span>
    </div>
  );
}
