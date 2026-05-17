import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useBookings, type Booking, type ShowBrand, type ShowStatus } from '../hooks/useBookings';
import { CITIES } from '../data/cities';

const BRANDS: { key: ShowBrand; bg: string; ring: string }[] = [
  { key: 'Hospitality', bg: 'bg-[#e84118]', ring: 'ring-[#e84118]' },
  { key: 'UKF',         bg: 'bg-blue-600',  ring: 'ring-blue-600' },
  { key: 'Korsakov',    bg: 'bg-purple-600',ring: 'ring-purple-600' },
  { key: 'The Blast',   bg: 'bg-pink-500',  ring: 'ring-pink-500' },
  { key: 'RUN',         bg: 'bg-green-600', ring: 'ring-green-600' },
  { key: 'Independent', bg: 'bg-gray-500',  ring: 'ring-gray-500' },
];

const STATUSES: ShowStatus[] = ['Upcoming', 'Confirmed', 'Completed', 'Cancelled'];

const empty = {
  city: '', country: '', lat: 0, lng: 0, venue: '', eventName: '', date: '',
  promoter: '', capacity: 0, ticketsSold: 0, ticketPrice: 0,
  brand: '' as ShowBrand | '', status: 'Upcoming' as ShowStatus,
  artists: [] as string[], notes: '',
};

type Form = typeof empty;

// Build a flat list of known promoters from CITIES data
const ALL_PROMOTERS = CITIES.flatMap((c) =>
  c.promoters.map((p) => ({ name: p.name, city: c.name, country: c.country, lat: c.lat, lng: c.lng })),
);

async function geocodeCity(name: string): Promise<{ lat: number; lng: number; country: string } | null> {
  // Try CITIES first
  const local = CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (local) return { lat: local.lat, lng: local.lng, country: local.country };
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`,
    );
    const j = await r.json();
    const hit = j?.results?.[0];
    if (hit) return { lat: hit.latitude, lng: hit.longitude, country: hit.country ?? '' };
  } catch {
    // ignore
  }
  return null;
}

export default function BookingModal() {
  const { bookingModalOpen, closeModal, add, update, prefill, editingId, bookings, remove } = useBookings();
  const [form, setForm] = useState<Form>(empty);
  const [artistDraft, setArtistDraft] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [promQuery, setPromQuery] = useState('');
  const [promOpen, setPromOpen] = useState(false);

  useEffect(() => {
    if (!bookingModalOpen) return;
    if (editingId) {
      const b = bookings.find((x) => x.id === editingId);
      if (b) {
        setForm({
          ...empty,
          ...b,
          brand: (b.brand ?? '') as ShowBrand | '',
          status: (b.status ?? 'Upcoming') as ShowStatus,
          artists: b.artists ?? (b.lineup ? b.lineup.split(',').map((s) => s.trim()).filter(Boolean) : []),
          eventName: b.eventName ?? '',
          ticketPrice: b.ticketPrice ?? 0,
        });
        setCityQuery(b.city);
        setPromQuery(b.promoter);
        return;
      }
    }
    setForm({ ...empty, ...(prefill ?? {}) });
    setCityQuery(prefill?.city ?? '');
    setPromQuery(prefill?.promoter ?? '');
  }, [bookingModalOpen, editingId, prefill, bookings]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  // City suggestions
  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return [];
    return CITIES
      .filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
      .slice(0, 6);
  }, [cityQuery]);

  const promoterSuggestions = useMemo(() => {
    const q = promQuery.trim().toLowerCase();
    const filtered = q
      ? ALL_PROMOTERS.filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))
      : ALL_PROMOTERS.slice(0, 8);
    // dedupe by name+city
    const seen = new Set<string>();
    return filtered.filter((p) => {
      const k = `${p.name}::${p.city}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);
  }, [promQuery]);

  const pickCity = async (name: string, country?: string, lat?: number, lng?: number) => {
    setCityQuery(name);
    setCityOpen(false);
    if (lat != null && lng != null) {
      setForm((f) => ({ ...f, city: name, country: country ?? f.country, lat, lng }));
    } else {
      setForm((f) => ({ ...f, city: name, country: country ?? f.country }));
      const geo = await geocodeCity(name);
      if (geo) setForm((f) => ({ ...f, lat: geo.lat, lng: geo.lng, country: f.country || geo.country }));
    }
  };

  const cityBlurTimer = useRef<number | null>(null);
  const handleCityBlur = () => {
    cityBlurTimer.current = window.setTimeout(async () => {
      setCityOpen(false);
      if (cityQuery && cityQuery !== form.city) {
        await pickCity(cityQuery);
      }
    }, 150);
  };

  const addArtist = (raw: string) => {
    const name = raw.trim().replace(/,$/, '').trim();
    if (!name) return;
    if (form.artists.includes(name)) return;
    set('artists', [...form.artists, name]);
  };
  const removeArtist = (name: string) => set('artists', form.artists.filter((a) => a !== name));

  const estRevenue = Math.max(0, Number(form.ticketsSold) || 0) * Math.max(0, Number(form.ticketPrice) || 0);

  if (!bookingModalOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city || !form.venue || !form.date) {
      toast.error('City, venue and date are required');
      return;
    }
    if (!form.brand) {
      toast.error('Pick a brand');
      return;
    }
    let { lat, lng, country } = form;
    if (!lat || !lng) {
      const geo = await geocodeCity(form.city);
      if (geo) { lat = geo.lat; lng = geo.lng; country = country || geo.country; }
    }
    const payload: Omit<Booking, 'id' | 'createdAt'> = {
      city: form.city,
      country,
      lat: Number(lat) || 0,
      lng: Number(lng) || 0,
      venue: form.venue,
      eventName: form.eventName || undefined,
      date: form.date,
      promoter: form.promoter,
      capacity: Number(form.capacity) || 0,
      ticketsSold: Number(form.ticketsSold) || 0,
      ticketPrice: Number(form.ticketPrice) || 0,
      brand: form.brand as ShowBrand,
      status: form.status,
      artists: form.artists,
      lineup: form.artists.join(', '),
      notes: form.notes,
    };
    if (editingId) {
      update(editingId, payload);
      toast.success(`Show updated in ${form.city}`);
    } else {
      add(payload);
      toast.success(`Show added to ${form.city}`);
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeModal}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto thin-scroll"
      >
        <div className="hero-text p-5 text-white" style={{ background: 'linear-gradient(135deg,#e84118,#7a0f00)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 inline-block px-2 py-0.5 rounded-full">
                {editingId ? 'Edit show' : 'Book a show'}
              </div>
              <div className="text-2xl font-bold mt-2">{editingId ? 'Update show' : 'Add show to calendar'}</div>
              <div className="text-sm opacity-90">Undivide / Korsakov / Hospitality</div>
            </div>
            <button type="button" onClick={closeModal} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30">×</button>
          </div>
        </div>

        <div className="p-5 space-y-6 text-sm">
          {/* Section 1: Location */}
          <Section title="Location">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="City *">
                <div className="relative">
                  <input
                    className={inp}
                    value={cityQuery}
                    placeholder="Start typing a city…"
                    onChange={(e) => { setCityQuery(e.target.value); setCityOpen(true); }}
                    onFocus={() => setCityOpen(true)}
                    onBlur={handleCityBlur}
                  />
                  {cityOpen && citySuggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                      {citySuggestions.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); if (cityBlurTimer.current) clearTimeout(cityBlurTimer.current); pickCity(c.name, c.country, c.lat, c.lng); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm"
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-gray-500 text-xs ml-2">{c.country}</span>
                          </button>
                        </li>
                      ))}
                      {cityQuery.trim() && !citySuggestions.some((c) => c.name.toLowerCase() === cityQuery.trim().toLowerCase()) && (
                        <li className="border-t border-gray-200">
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); if (cityBlurTimer.current) clearTimeout(cityBlurTimer.current); pickCity(cityQuery.trim()); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm text-[var(--undivide)] font-semibold"
                          >
                            + Use "{cityQuery.trim()}" (auto-locate)
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </Field>
              <Field label="Country">
                <input className={inp} value={form.country} onChange={(e) => set('country', e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
              <Label>Brand *</Label>
              <div className="flex flex-wrap gap-2">
                {BRANDS.map((b) => {
                  const active = form.brand === b.key;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => set('brand', b.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? `${b.bg} text-white border-transparent shadow-sm`
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {b.key}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Section 2: Event details */}
          <Section title="Event details">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Event name">
                <input className={inp} value={form.eventName} onChange={(e) => set('eventName', e.target.value)} placeholder="e.g. Hospitality In The Park" />
              </Field>
              <Field label="Date *">
                <input type="date" className={inp} value={form.date} onChange={(e) => set('date', e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Label>Status</Label>
                <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                  {STATUSES.map((s) => {
                    const active = form.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('status', s)}
                        className={`px-3 py-1.5 text-xs font-semibold border-r border-gray-300 last:border-r-0 transition-colors ${
                          active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Venue *">
                <input className={inp} value={form.venue} onChange={(e) => set('venue', e.target.value)} />
              </Field>
              <Field label="Promoter">
                <div className="relative">
                  <input
                    className={inp}
                    value={promQuery}
                    placeholder="Search promoters…"
                    onChange={(e) => { setPromQuery(e.target.value); set('promoter', e.target.value); setPromOpen(true); }}
                    onFocus={() => setPromOpen(true)}
                    onBlur={() => setTimeout(() => setPromOpen(false), 150)}
                  />
                  {promOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                      {promoterSuggestions.map((p) => (
                        <li key={`${p.name}-${p.city}`}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setPromQuery(p.name); set('promoter', p.name); setPromOpen(false); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm"
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-gray-500 text-xs ml-2">{p.city}</span>
                          </button>
                        </li>
                      ))}
                      {promoterSuggestions.length === 0 && (
                        <li className="px-3 py-1.5 text-xs text-gray-600 italic">No matches</li>
                      )}
                      <li className="border-t border-gray-200">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); toast.message('Open a city panel to add a new promoter to its roster.'); setPromOpen(false); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm text-[var(--undivide)] font-semibold"
                        >
                          + Add new promoter
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </Field>
            </div>
          </Section>

          {/* Section 3: Numbers */}
          <Section title="Numbers">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Capacity">
                <input type="number" min={0} className={inp} value={form.capacity || ''} onChange={(e) => set('capacity', Number(e.target.value))} />
              </Field>
              <Field label="Tickets sold">
                <input type="number" min={0} className={inp} value={form.ticketsSold || ''} onChange={(e) => set('ticketsSold', Number(e.target.value))} />
              </Field>
              <Field label="Ticket price (EUR)">
                <input type="number" min={0} step="0.01" className={inp} value={form.ticketPrice || ''} onChange={(e) => set('ticketPrice', Number(e.target.value))} />
              </Field>
              <Field label="Estimated revenue">
                <div className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-700">
                  €{estRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
              </Field>
            </div>
          </Section>

          {/* Section 4: Lineup */}
          <Section title="Artists on lineup">
            <div className="border border-gray-300 rounded-md px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:border-[var(--undivide)]">
              {form.artists.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                  {a}
                  <button type="button" onClick={() => removeArtist(a)} className="text-gray-500 hover:text-red-600">×</button>
                </span>
              ))}
              <input
                value={artistDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(',')) { addArtist(v); setArtistDraft(''); }
                  else setArtistDraft(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addArtist(artistDraft); setArtistDraft(''); }
                  else if (e.key === 'Backspace' && !artistDraft && form.artists.length) {
                    removeArtist(form.artists[form.artists.length - 1]);
                  }
                }}
                onBlur={() => { if (artistDraft.trim()) { addArtist(artistDraft); setArtistDraft(''); } }}
                placeholder={form.artists.length ? '' : 'Type an artist and press Enter…'}
                className="flex-1 min-w-[140px] text-sm outline-none py-0.5"
              />
            </div>
          </Section>

          {/* Section 5: Notes */}
          <Section title="Notes">
            <textarea rows={3} className={inp} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Section>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3">
          {editingId ? (
            <button type="button"
              onClick={() => { if (confirm('Delete this show?')) { remove(editingId); toast.success('Show deleted'); closeModal(); } }}
              className="text-red-600 text-sm hover:underline">Delete</button>
          ) : <span />}
          <button
            type="submit"
            className="flex-1 max-w-md ml-auto bg-gradient-to-r from-[#e84118] to-[#ff2d6f] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 shadow"
          >
            Save show
          </button>
        </div>
      </form>
    </div>
  );
}

const inp = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-[var(--undivide)]';

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-2 border-b border-gray-200 pb-1">{title}</div>
      {children}
    </div>
  );
}
