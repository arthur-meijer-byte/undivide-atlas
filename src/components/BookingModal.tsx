import { useEffect, useState } from 'react';
import { useBookings, type Booking, type Sound } from '../hooks/useBookings';

const SOUNDS: Sound[] = ['Liquid', 'Neuro', 'Jump Up', 'Dancefloor', 'Minimal', 'Halftime', 'All Styles'];

const empty = {
  city: '', country: '', lat: 0, lng: 0, venue: '', date: '',
  promoter: '', capacity: 0, ticketsSold: 0, sound: 'Liquid' as Sound,
  lineup: '', ig: '', fb: '', yt: '', website: '', notes: '',
};

export default function BookingModal() {
  const { bookingModalOpen, closeModal, add, update, prefill, editingId, bookings, remove } = useBookings();
  const [form, setForm] = useState<typeof empty>(empty);

  useEffect(() => {
    if (bookingModalOpen) {
      if (editingId) {
        const b = bookings.find((x) => x.id === editingId);
        if (b) setForm({ ...empty, ...b });
      } else {
        setForm({ ...empty, ...prefill });
      }
    }
  }, [bookingModalOpen, editingId, prefill, bookings]);

  if (!bookingModalOpen) return null;

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city || !form.venue || !form.date) {
      alert('City, venue and date are required');
      return;
    }
    const payload: Omit<Booking, 'id' | 'createdAt'> = {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      capacity: Number(form.capacity),
      ticketsSold: Number(form.ticketsSold),
    };
    if (editingId) update(editingId, payload);
    else add(payload);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeModal}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scroll"
      >
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg,#e84118,#7a0f00)' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 inline-block px-2 py-0.5 rounded-full">
                {editingId ? 'Edit booking' : 'Book a show'}
              </div>
              <div className="text-2xl font-bold mt-2">{editingId ? 'Update show' : 'Add show to calendar'}</div>
              <div className="text-sm opacity-90">Sold by Undivide / Korsakov / Hospitality</div>
            </div>
            <button type="button" onClick={closeModal} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30">×</button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-3 text-sm">
          <Field label="City *"><input className={inp} value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Country *"><input className={inp} value={form.country} onChange={(e) => set('country', e.target.value)} /></Field>
          <Field label="Latitude"><input type="number" step="0.0001" className={inp} value={form.lat} onChange={(e) => set('lat', e.target.value as unknown as number)} /></Field>
          <Field label="Venue *"><input className={inp} value={form.venue} onChange={(e) => set('venue', e.target.value)} /></Field>
          <Field label="Date *"><input type="date" className={inp} value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Promoter"><input className={inp} value={form.promoter} onChange={(e) => set('promoter', e.target.value)} /></Field>
          <Field label="Sound">
            <select className={inp} value={form.sound} onChange={(e) => set('sound', e.target.value as Sound)}>
              {SOUNDS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Capacity"><input type="number" className={inp} value={form.capacity} onChange={(e) => set('capacity', e.target.value as unknown as number)} /></Field>
          <Field label="Tickets sold"><input type="number" className={inp} value={form.ticketsSold} onChange={(e) => set('ticketsSold', e.target.value as unknown as number)} /></Field>

          <div className="col-span-2">
            <Field label="Line-up (comma separated)">
              <input className={inp} value={form.lineup} onChange={(e) => set('lineup', e.target.value)} placeholder="Mefjus, Logistics, IMANU" />
            </Field>
          </div>

          <Field label="Instagram (handle)"><input className={inp} value={form.ig} onChange={(e) => set('ig', e.target.value)} placeholder="undivide.events" /></Field>
          <Field label="Facebook (handle/url)"><input className={inp} value={form.fb} onChange={(e) => set('fb', e.target.value)} /></Field>
          <Field label="YouTube (handle/url)"><input className={inp} value={form.yt} onChange={(e) => set('yt', e.target.value)} /></Field>
          <Field label="Website / ticket link"><input className={inp} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" /></Field>

          <div className="col-span-2">
            <Field label="Notes">
              <textarea rows={2} className={inp} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between">
          {editingId ? (
            <button type="button"
              onClick={() => { if (confirm('Delete this booking?')) { remove(editingId); closeModal(); } }}
              className="text-red-600 text-sm hover:underline">Delete</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-[var(--undivide)] text-white hover:opacity-90">
              {editingId ? 'Save changes' : 'Add to calendar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inp = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-[var(--undivide)]';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}
