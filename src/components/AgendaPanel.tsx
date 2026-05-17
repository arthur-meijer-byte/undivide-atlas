import { useMemo, useState } from 'react';
import { create } from 'zustand';
import jsPDF from 'jspdf';
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

// Brand chips — match case-insensitively against promoter name OR event name.
const BRANDS = [
  { id: 'all',         label: 'All',              match: () => true,                              dot: 'bg-gray-900',     chip: 'bg-gray-900 text-white' },
  { id: 'undivide',    label: 'Undivide',         match: (s: string) => /undivide/i.test(s),       dot: 'bg-[var(--undivide)]', chip: 'bg-[var(--undivide)] text-white' },
  { id: 'hospitality', label: 'Hospitality',      match: (s: string) => /hospitalit/i.test(s),     dot: 'bg-[#e84118]',    chip: 'bg-[#e84118] text-white' },
  { id: 'ukf',         label: 'UKF',              match: (s: string) => /\bukf\b/i.test(s),        dot: 'bg-blue-600',     chip: 'bg-blue-600 text-white' },
  { id: 'korsakov',    label: 'Korsakov',         match: (s: string) => /korsakov/i.test(s),       dot: 'bg-purple-600',   chip: 'bg-purple-600 text-white' },
  { id: 'blast',       label: 'The Blast',        match: (s: string) => /the\s*blast|\bblast\b/i.test(s), dot: 'bg-pink-500', chip: 'bg-pink-500 text-white' },
  { id: 'run',         label: 'RUN',              match: (s: string) => /\brun\b/i.test(s),        dot: 'bg-green-600',    chip: 'bg-green-600 text-white' },
  { id: 'virus',       label: 'Virus Recordings', match: (s: string) => /virus/i.test(s),          dot: 'bg-fuchsia-600',  chip: 'bg-fuchsia-600 text-white' },
  { id: 'shogun',      label: 'Shogun Audio',     match: (s: string) => /shogun/i.test(s),         dot: 'bg-amber-600',    chip: 'bg-amber-600 text-white' },
  { id: 'siren',       label: 'Siren Bristol',    match: (s: string) => /siren/i.test(s),          dot: 'bg-cyan-600',     chip: 'bg-cyan-600 text-white' },
] as const;

type BrandId = typeof BRANDS[number]['id'];

// Determine the brand dot color for a row based on its text content.
function brandDotFor(text: string): string {
  for (const b of BRANDS) {
    if (b.id === 'all') continue;
    if (b.match(text)) return b.dot;
  }
  return 'bg-gray-400';
}

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
  artists: string[];
  source: 'event' | 'booking';
  cityId?: string;
  bookingId?: string;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
function parseDateStr(s: string, year: number): number {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}`).getTime();
  const m = /([A-Za-z]{3})\s*(\d{1,2})?/.exec(s);
  const month = m ? MONTHS[m[1].toLowerCase()] ?? 0 : 0;
  const day = m && m[2] ? parseInt(m[2], 10) : 1;
  return new Date(year, month, day).getTime();
}

type SortKey = 'date-desc' | 'date-asc' | 'fill' | 'city' | 'brand';

export default function AgendaPanel() {
  const open = useAgenda((s) => s.open);
  const close = useAgenda((s) => s.close);
  const bookings = useBookings((s) => s.bookings);
  const setCity = useMapState((s) => s.setCity);
  const openBooking = useBookings((s) => s.openModal);
  const [brand, setBrand] = useState<BrandId>('all');
  const [scope, setScope] = useState<'upcoming' | 'past' | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [detail, setDetail] = useState<AgendaItem | null>(null);

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
            artists: p.lineup ?? [],
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
        name: b.eventName || `${b.promoter || 'Booking'} — ${b.venue}`,
        venue: b.venue,
        city: b.city,
        country: b.country,
        promoter: b.promoter || '',
        cap: b.capacity,
        sold: b.ticketsSold,
        artists: b.artists ?? (b.lineup ? b.lineup.split(',').map((s) => s.trim()).filter(Boolean) : []),
        source: 'booking',
        bookingId: b.id,
      });
    }
    return out;
  }, [bookings]);

  const filtered = useMemo(() => {
    const brandDef = BRANDS.find((b) => b.id === brand)!;
    const now = Date.now();
    const q = query.trim().toLowerCase();
    const matchQ = (i: AgendaItem) =>
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.city.toLowerCase().includes(q) ||
      i.venue.toLowerCase().includes(q) ||
      i.promoter.toLowerCase().includes(q) ||
      i.artists.some((a) => a.toLowerCase().includes(q));

    const list = items
      .filter((i) => brandDef.match(`${i.promoter} ${i.name}`))
      .filter((i) => (scope === 'upcoming' ? i.sortKey >= now : scope === 'past' ? i.sortKey < now : true))
      .filter(matchQ);

    const fill = (i: AgendaItem) => (i.cap ? i.sold / i.cap : 0);
    switch (sortKey) {
      case 'date-asc':  list.sort((a, b) => a.sortKey - b.sortKey); break;
      case 'fill':      list.sort((a, b) => fill(b) - fill(a)); break;
      case 'city':      list.sort((a, b) => a.city.localeCompare(b.city)); break;
      case 'brand':     list.sort((a, b) => brandDotFor(`${a.promoter} ${a.name}`).localeCompare(brandDotFor(`${b.promoter} ${b.name}`))); break;
      case 'date-desc':
      default:          list.sort((a, b) => b.sortKey - a.sortKey); break;
    }
    return list;
  }, [items, brand, scope, query, sortKey]);

  // Summary
  const summary = useMemo(() => {
    const sold = filtered.reduce((s, i) => s + (i.sold || 0), 0);
    const cap = filtered.reduce((s, i) => s + (i.cap || 0), 0);
    const avgFill = cap > 0 ? Math.round((sold / cap) * 100) : 0;
    return { count: filtered.length, sold, avgFill };
  }, [filtered]);

  // Group by Year-Month, preserving the current sort
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

  const exportCSV = () => {
    const head = ['Date', 'Event', 'Venue', 'City', 'Country', 'Promoter', 'Capacity', 'Tickets sold', 'Fill %', 'Artists'];
    const rows = filtered.map((i) => [
      i.date, i.name, i.venue, i.city, i.country, i.promoter,
      i.cap, i.sold, i.cap ? Math.round((i.sold / i.cap) * 100) : 0,
      i.artists.join('; '),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `agenda-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Agenda export', 14, 14);
    doc.setFontSize(9);
    doc.text(`${summary.count} events · ${summary.sold.toLocaleString()} tickets sold · ${summary.avgFill}% avg fill`, 14, 20);
    doc.setFontSize(8);
    let y = 30;
    const header = ['Date', 'Event', 'Venue', 'City', 'Promoter', 'Cap', 'Sold', 'Fill'];
    const colX = [14, 38, 110, 160, 195, 240, 255, 272];
    header.forEach((h, idx) => doc.text(h, colX[idx], y));
    y += 4;
    doc.setLineWidth(0.2); doc.line(14, y, 285, y); y += 3;
    for (const i of filtered) {
      if (y > 200) { doc.addPage(); y = 14; }
      const pct = i.cap ? Math.round((i.sold / i.cap) * 100) : 0;
      const row = [
        i.date,
        truncate(i.name, 42),
        truncate(i.venue, 30),
        truncate(i.city, 18),
        truncate(i.promoter, 22),
        String(i.cap || ''),
        String(i.sold || ''),
        i.cap ? `${pct}%` : '',
      ];
      row.forEach((c, idx) => doc.text(c, colX[idx], y));
      y += 4.5;
    }
    doc.save(`agenda-${Date.now()}.pdf`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex justify-end" onClick={close}>
      <div
        className="panel-slide-in bg-white w-full max-w-[560px] h-full flex flex-col shadow-[var(--shadow-panel)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-lg">Agenda</h2>
            <p className="text-xs text-gray-500">{brand === 'all' ? 'all brands' : BRANDS.find((b) => b.id === brand)?.label}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white hover:bg-gray-50"
              title="Sort"
            >
              <option value="date-desc">Date (newest)</option>
              <option value="date-asc">Date (oldest)</option>
              <option value="fill">Fill rate</option>
              <option value="city">City</option>
              <option value="brand">Brand</option>
            </select>
            <button onClick={exportCSV} className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50" title="Export CSV">CSV</button>
            <button onClick={exportPDF} className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50" title="Export PDF">PDF</button>
            <button onClick={close} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-xl leading-none">×</button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3 text-xs">
          <Stat label="Events" value={summary.count.toLocaleString()} />
          <Dot />
          <Stat label="Tickets sold" value={summary.sold.toLocaleString()} />
          <Dot />
          <Stat label="Avg fill" value={`${summary.avgFill}%`} />
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-200">
          <input
            type="search"
            placeholder="Search event, city, venue, promoter, artist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-[var(--undivide)]"
          />
        </div>

        {/* Tabs + brand chips */}
        <div className="px-4 pt-2 pb-2 border-b border-gray-200 space-y-2">
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
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                  brand === b.id ? b.chip : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {b.id !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />}
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-5">
          {groups.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-12">No events match this filter.</div>
          )}
          {groups.map(([key, list]) => {
            const d = new Date(`${key}-01`);
            const label = d.toLocaleString('en', { month: 'long', year: 'numeric' });
            return (
              <div key={key}>
                <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2 sticky top-0 bg-white py-1">
                  {label} · {list.length}
                </div>
                <div className="space-y-2">
                  {list.map((i) => {
                    const pct = i.cap ? Math.round((i.sold / i.cap) * 100) : 0;
                    const color = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
                    const dot = brandDotFor(`${i.promoter} ${i.name}`);
                    return (
                      <button
                        key={i.id}
                        onClick={() => setDetail(i)}
                        className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 pl-3 transition-colors relative overflow-hidden"
                      >
                        <span className={`absolute left-0 top-0 bottom-0 w-1 ${dot}`} />
                        <div className="pl-2">
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
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                                <span className="text-[11px] font-semibold w-10 text-right">{pct}%</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                <span>{i.cap.toLocaleString()} cap</span>
                                <span>{i.sold.toLocaleString()} sold</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {detail && (
        <DetailModal
          item={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            if (detail.source === 'booking' && detail.bookingId) {
              openBooking(undefined, detail.bookingId);
              setDetail(null);
            }
          }}
          onOpenCity={() => {
            if (detail.cityId) {
              const c = CITIES.find((x) => x.id === detail.cityId);
              if (c) { setCity(c); setDetail(null); close(); }
            }
          }}
        />
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-bold text-gray-900">{value}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}
function Dot() { return <span className="text-gray-500">·</span>; }

function DetailModal({
  item, onClose, onEdit, onOpenCity,
}: {
  item: AgendaItem;
  onClose: () => void;
  onEdit: () => void;
  onOpenCity: () => void;
}) {
  const pct = item.cap ? Math.round((item.sold / item.cap) * 100) : 0;
  const dot = brandDotFor(`${item.promoter} ${item.name}`);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto thin-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className={`mt-1.5 w-2 h-2 rounded-full ${dot} shrink-0`} />
            <div className="min-w-0">
              <div className="font-bold text-base truncate">{item.name}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-lg leading-none">×</button>
        </div>
        <div className="p-4 text-sm space-y-3">
          <Row k="Venue" v={item.venue} />
          <Row k="City" v={`${item.city}, ${item.country}`} />
          <Row k="Promoter" v={item.promoter || '—'} />
          <div className="grid grid-cols-3 gap-2">
            <Stat2 label="Capacity" v={item.cap.toLocaleString()} />
            <Stat2 label="Sold" v={item.sold.toLocaleString()} />
            <Stat2 label="Fill" v={item.cap ? `${pct}%` : '—'} />
          </div>
          {item.artists.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-1">Artists</div>
              <div className="flex flex-wrap gap-1">
                {item.artists.map((a) => (
                  <span key={a} className="bg-gray-100 px-2 py-0.5 rounded-full text-[11px]">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-gray-200 flex gap-2 justify-end">
          {item.cityId && (
            <button onClick={onOpenCity} className="text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">
              Open city
            </button>
          )}
          {item.source === 'booking' && (
            <button onClick={onEdit} className="text-xs px-3 py-1.5 rounded-md bg-[var(--undivide)] text-white hover:opacity-90 font-semibold">
              Edit show
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 text-xs uppercase tracking-wider">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
function Stat2({ label, v }: { label: string; v: string }) {
  return (
    <div className="bg-gray-50 rounded-md p-2 text-center">
      <div className="text-base font-bold">{v}</div>
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
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
