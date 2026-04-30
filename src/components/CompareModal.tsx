import { useMapState } from '../hooks/useMapState';
import { CITIES, type City } from '../data/cities';

function statsOf(c: City) {
  let sold = 0, cap = 0, events = 0;
  c.promoters.forEach((p) => {
    events += p.events;
    p.events_list.forEach((e) => { sold += e.sold; cap += e.cap; });
  });
  return {
    events, sold, fill: cap ? Math.round((sold / cap) * 100) : 0,
    marketSize: c.marketSize,
    growth: c.market.growth,
    revenue: c.market.potentialRev,
    genre: c.genre,
  };
}

const ROWS: { key: keyof ReturnType<typeof statsOf>; label: string; higherWins?: boolean }[] = [
  { key: 'events', label: 'Total events', higherWins: true },
  { key: 'sold', label: 'Tickets sold', higherWins: true },
  { key: 'fill', label: 'Fill rate %', higherWins: true },
  { key: 'marketSize', label: 'Market size' },
  { key: 'growth', label: 'Growth' },
  { key: 'revenue', label: 'Revenue potential' },
  { key: 'genre', label: 'Genre' },
];

export default function CompareModal() {
  const { compareOpen, closeCompare, compareCityA, compareCityB, setCompareA, setCompareB } = useMapState();
  if (!compareOpen) return null;

  const a = CITIES.find((c) => c.id === compareCityA) ?? null;
  const b = CITIES.find((c) => c.id === compareCityB) ?? null;
  const sa = a ? statsOf(a) : null;
  const sb = b ? statsOf(b) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeCompare}>
      <div className="bg-white rounded-xl shadow-2xl w-[680px] max-w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="font-bold">Compare cities</div>
          <button onClick={closeCompare} className="w-8 h-8 rounded-full hover:bg-gray-100">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 border-b border-gray-200">
          <select value={compareCityA ?? ''} onChange={(e) => setCompareA(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Select city A…</option>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={compareCityB ?? ''} onChange={(e) => setCompareB(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Select city B…</option>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="overflow-y-auto thin-scroll">
          {sa && sb ? (
            <table className="w-full text-sm">
              <tbody>
                {ROWS.map((r) => {
                  const va = sa[r.key]; const vb = sb[r.key];
                  let aWin = false, bWin = false;
                  if (r.higherWins && typeof va === 'number' && typeof vb === 'number') {
                    aWin = va > vb; bWin = vb > va;
                  }
                  return (
                    <tr key={r.key} className="border-b border-gray-100">
                      <td className={`px-5 py-3 text-right w-1/3 ${aWin ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''}`}>
                        {String(va)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-400 uppercase tracking-wider">{r.label}</td>
                      <td className={`px-5 py-3 w-1/3 ${bWin ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''}`}>
                        {String(vb)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Pick two cities to compare</div>
          )}
        </div>
      </div>
    </div>
  );
}
