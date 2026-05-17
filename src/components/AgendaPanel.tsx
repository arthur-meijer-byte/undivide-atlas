import { useMemo, useState } from 'react';
import { create } from 'zustand';
import { CITIES } from '../data/cities';
import { useBookings } from '../hooks/useBookings';
import { useMapState } from '../hooks/useMapState';

interface AgendaState {
  open: boolean;
  toggle: () => void;
  close: () => void;
}
export const useAgenda = create<AgendaState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}));

// Brands to filter by — matched case-insensitively against promoter name OR event name.
const BRANDS = [
  { id: 'all', label: 'All', match: () => true, color: 'bg-gray-900' },
  { id: 'undivide', label: 'Undivide', match: (s: string) => /undivide/i.test(s), color: 'bg-[var(--undivide)]' },
  { id: 'korsakov', label: 'Korsakov', match: (s: string) => /korsakov/i.test(s), color: 'bg-rose-600' },
  { id: 'hospitality', label: 'Hospitality', match: (s: string) => /hospitalit/i.test(s), color: 'bg-orange-500' },
  { id: 'ukf', label: 'UKF', match: (s: string) => /\bukf\b/i.test(s), color: 'bg-yellow-500' },
  { id: 'virus', label: 'Virus Recordings', match: (s: string) => /virus/i.test(s), color: 'bg-fuchsia-600' },
  { id: 'shogun', label: 'Shogun Audio', match: (s: string) => /shogun/i.test(s), color: 'bg-amber-600' },
  { id: 'blast', label: 'The Blast', match: (s: string) => /the\s*blast|blast/i.test(s), color: 'bg-red-700' },
  { id: 'run', label: 'RUN', match: (s: string) => /\brun\b/i.test(s), color: 'bg-emerald-600' },
  { id: 'siren', label: 'Siren Bristol', match: (s: string) => /siren/i.test(s), color: 'bg-cyan-600' },
] as const;

type BrandId = typeof BRANDS[number]['id'];

interface AgendaItem {
  id: string;
  date: string;        // ISO-ish or "Sep 2024"
  sortKey: number;     // for ordering
  name: string;
  venue: string;
  city: string;
  country: string;
  promoter: string;
  cap: number;
  sold: number;
  source: 'event' | 'booking';
  cityId?: string;
  bookingId?: string;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
function parseDateStr(s: string, year: number): number {
  // Handles "YYYY-MM-DD" and "Sep 2024" / "Sep 15 2024"
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}`).getTime();
  const m = /([A-Za-z]{3})\s*(\d{1,2})?/.exec(s);
  const month = m ? MONTHS[m[1].toLowerCase()] ?? 0 : 0;
  const day = m && m[2] ? parseInt(m[2], 10) : 1;
  return new Date(year, month, day).getTime();
}

export default function AgendaPanel() {
  const open = useAgenda((s) => s.open);
  const close = useAgenda((s) => s.close);
  const bookings = useBookings((s) => s.bookings);
  const setCity = useMapState((s) => s.setCity);
  const openBooking = useBookings((s) => s.openModal);
  const [brand, setBrand] = useState<BrandId>('all');
  const [scope, setScope] = useState<'upcoming' | 'past' | 'all'>('all');

  const items = useMemo<AgendaItem[]>(() => {
    const out: AgendaItem[] = [];
    for (const c of CITIES) {
      for (const p of c.promoters) {
        for (const e of p.events_list) {
          out.push({
            id: `${c.id}-${p.name}-${e.date}-${e.name}`,
            date: e.date,
            sortKey: parseDateStr(e.date, e.year),
            name: e.name,
            venue: e.venue,
            city: c.name,
            country: c.country,
            promoter: p.name,
            cap: e.cap,
            sold: e.sold,
            source: 'event',
            cityId: c.id,
          });
        }
      }
    }
    for (const b of bookings) {
      out.push({
        id: `b-${b.id}`,
        date: b.date,
        sortKey: new Date(b.date).getTime(),
        name: `${b.promoter || 'Booking'} — ${b.venue}`,
        venue: b.venue,
        city: b.city,
        country: b.country,
        promoter: b.promoter || '',
        cap: b.capacity,
        sold: b.ticketsSold,
        source: 'booking',
        bookingId: b.id,
      });
    }
    return out;
  }, [bookings]);

  const filtered = useMemo(() => {
    const brandDef = BRANDS.find((b) => b.id === brand)!;
    const now = Date.now();
    return items
      .filter((i) => brandDef.match(`${i.promoter} ${i.name}`))
      .filter((i) => (scope === 'upcoming' ? i.sortKey >= now : scope === 'past' ? i.sortKey < now : true))
      .sort((a, b) => (scope === 'past' ? b.sortKey - a.sortKey : a.sortKey - b.sortKey));
  }, [items, brand, scope]);

  // group by Year-Month
  const groups = useMemo(() => {
    const g = new Map<string, AgendaItem[]>();
    for (const i of filtered) {
      const d = new Date(i.sortKey);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(i);
    }
    return Array.from(g.entries());
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex justify-end" onClick={close}>
      <div
        className="panel-slide-in bg-white w-full max-w-[520px] h-full flex flex-col shadow-[var(--shadow-panel)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Agenda</h2>
            <p className="text-xs text-gray-500">{filtered.length} events · {brand === 'all' ? 'all brands' : BRANDS.find((b) => b.id === brand)?.label}</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-xl leading-none">×</button>
        </div>

        <div className="px-4 pt-3 pb-2 border-b border-gray-100 space-y-2">
          <div className="flex gap-1 text-xs">
            {(['upcoming', 'past', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1 rounded-full font-medium capitalize ${scope === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  brand === b.id ? `${b.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-5">
          {groups.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-12">
              No events match this filter.
            </div>
          )}
          {groups.map(([key, list]) => {
            const d = new Date(`${key}-01`);
            const label = d.toLocaleString('en', { month: 'long', year: 'numeric' });
            return (
              <div key={key}>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 sticky top-0 bg-white py-1">
                  {label} · {list.length}
                </div>
                <div className="space-y-2">
                  {list.map((i) => {
                    const pct = i.cap ? Math.round((i.sold / i.cap) * 100) : 0;
                    const color = pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-400' : 'bg-red-400';
                    return (
                      <button
                        key={i.id}
                        onClick={() => {
                          if (i.source === 'booking' && i.bookingId) {
                            openBooking(undefined, i.bookingId);
                          } else if (i.cityId) {
                            const c = CITIES.find((x) => x.id === i.cityId);
                            if (c) {
                              setCity(c);
                              close();
                            }
                          }
                        }}
                        className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{i.name}</span>
                          <span className="text-xs text-gray-500 shrink-0">{i.date}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-700">{i.promoter}</span>
                          <span>·</span>
                          <span>{i.venue}</span>
                          <span>·</span>
                          <span>{i.city}, {i.country}</span>
                          {i.source === 'booking' && (
                            <span className="bg-[var(--undivide)] text-white text-[9px] uppercase px-1.5 py-0.5 rounded-full ml-1">Booked</span>
                          )}
                        </div>
                        {i.cap > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold w-24 text-right">
                              {i.sold.toLocaleString()}/{i.cap.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AgendaButton() {
  const toggle = useAgenda((s) => s.toggle);
  return (
    <button
      onClick={toggle}
      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-full flex items-center gap-1"
      title="Open agenda"
    >
      📅 <span>Agenda</span>
    </button>
  );
}
