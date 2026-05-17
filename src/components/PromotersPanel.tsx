import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  usePromoters,
  STATUS_META,
  type Promoter,
  type PromoterStatus,
  type PromoterType,
  type PromoterGenre,
  type AssignedTo,
  type Language,
  type ActivityEntry,
} from '../hooks/usePromoters';
import { useBookings } from '../hooks/useBookings';

const TYPES: PromoterType[] = ['Local promoter', 'Venue', 'Festival', 'Undivide partner', 'Independent'];
const GENRES: PromoterGenre[] = ['Liquid', 'Neurofunk', 'Jump Up', 'Dancefloor', 'All styles'];
const STATUSES: PromoterStatus[] = ['Cold', 'Contacted', 'In talks', 'Partner', 'Inactive'];
const LANGS: Language[] = ['EN', 'NL', 'DE', 'FR', 'ES', 'PT'];
const ACTIVITY_ICON: Record<ActivityEntry['type'], string> = {
  Call: '📞', Email: '✉️', WhatsApp: '💬', Meeting: '🤝', Note: '📝',
};

export function PromotersButton() {
  const open = usePromoters((s) => s.openPanel);
  return (
    <button
      onClick={open}
      className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1 rounded-full flex items-center gap-1"
      title="Promoters CRM"
    >
      👥 <span>Promoters</span>
    </button>
  );
}

export default function PromotersPanel() {
  const { panelOpen, closePanel, promoters, selectedId, select } = usePromoters();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'last'>('name');
  const [addOpen, setAddOpen] = useState(false);

  const countries = useMemo(
    () => Array.from(new Set(promoters.map((p) => p.country).filter(Boolean))).sort(),
    [promoters],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = promoters.filter((p) => {
      if (country !== 'all' && p.country !== country) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (genre !== 'all' && p.mainGenre !== genre) return false;
      if (q) {
        const hay = `${p.name} ${p.city} ${p.country} ${p.contactName ?? ''} ${p.email ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return (b.lastContact ?? '').localeCompare(a.lastContact ?? '');
    });
    return list;
  }, [promoters, search, country, status, genre, sortBy]);

  const selected = promoters.find((p) => p.id === selectedId) ?? null;

  if (!panelOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>👥</span>
          <span>Promoters CRM</span>
          <span className="text-xs text-muted-foreground font-normal">· {filtered.length} of {promoters.length}</span>
        </div>
        <button
          onClick={closePanel}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
        >
          ✕ Close
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT */}
        <aside className="w-[380px] border-r border-border flex flex-col min-h-0">
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search promoters…"
                className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-background"
              />
              <button
                onClick={() => setAddOpen(true)}
                className="text-xs px-2 py-1.5 rounded bg-pink-600 hover:bg-pink-700 text-white font-medium whitespace-nowrap"
              >
                + Add
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="text-[11px] px-1.5 py-1 rounded border border-border bg-background">
                <option value="all">All countries</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-[11px] px-1.5 py-1 rounded border border-border bg-background">
                <option value="all">All status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className="text-[11px] px-1.5 py-1 rounded border border-border bg-background">
                <option value="all">All genres</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <button onClick={() => setSortBy('name')} className={`px-1.5 py-0.5 rounded ${sortBy === 'name' ? 'bg-foreground/10 text-foreground' : ''}`}>Name</button>
              <button onClick={() => setSortBy('status')} className={`px-1.5 py-0.5 rounded ${sortBy === 'status' ? 'bg-foreground/10 text-foreground' : ''}`}>Status</button>
              <button onClick={() => setSortBy('last')} className={`px-1.5 py-0.5 rounded ${sortBy === 'last' ? 'bg-foreground/10 text-foreground' : ''}`}>Last contact</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-xs text-muted-foreground text-center">No promoters match.</div>
            ) : filtered.map((p) => {
              const meta = STATUS_META[p.status];
              const isSel = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => select(p.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border flex items-start gap-2.5 hover:bg-foreground/5 ${isSel ? 'bg-foreground/10' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.city}{p.city && p.country ? ', ' : ''}{p.country}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">{p.lastContact ?? '—'}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT */}
        <section className="flex-1 overflow-y-auto min-h-0">
          {selected ? <PromoterDetail key={selected.id} promoter={selected} /> : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Select a promoter from the list to view details.
            </div>
          )}
        </section>
      </div>

      {addOpen && <AddPromoterModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

// ---------- Detail ----------

function PromoterDetail({ promoter }: { promoter: Promoter }) {
  const update = usePromoters((s) => s.update);
  const remove = usePromoters((s) => s.remove);
  const addActivity = usePromoters((s) => s.addActivity);
  const bookings = useBookings((s) => s.bookings);

  const save = (patch: Partial<Promoter>) => {
    update(promoter.id, patch);
    toast.success('Saved', { duration: 1200 });
  };

  const overdue = promoter.followUp && promoter.followUp < new Date().toISOString().slice(0, 10);

  const shows = useMemo(() => {
    const needle = promoter.name.toLowerCase();
    return bookings.filter((b) => (b.promoter ?? '').toLowerCase().includes(needle));
  }, [bookings, promoter.name]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Identity */}
      <Section title="Identity">
        <InlineText value={promoter.name} onSave={(v) => save({ name: v })} className="text-2xl font-bold" placeholder="Promoter name" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Type">
            <InlineSelect value={promoter.type} options={TYPES} onSave={(v) => save({ type: v as PromoterType })} />
          </Field>
          <Field label="Main genre">
            <InlineSelect value={promoter.mainGenre ?? ''} options={['', ...GENRES]} onSave={(v) => save({ mainGenre: (v || undefined) as PromoterGenre })} />
          </Field>
          <Field label="City">
            <InlineText value={promoter.city} onSave={(v) => save({ city: v })} />
          </Field>
          <Field label="Country">
            <InlineText value={promoter.country} onSave={(v) => save({ country: v })} />
          </Field>
          <Field label="Active since">
            <InlineText value={String(promoter.activeSince ?? '')} onSave={(v) => save({ activeSince: v ? Number(v) : undefined })} type="number" />
          </Field>
          <Field label="Events / year">
            <InlineText value={String(promoter.eventsPerYear ?? '')} onSave={(v) => save({ eventsPerYear: v ? Number(v) : undefined })} type="number" />
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person"><InlineText value={promoter.contactName ?? ''} onSave={(v) => save({ contactName: v })} /></Field>
          <Field label="Preferred language">
            <InlineSelect value={promoter.language ?? ''} options={['', ...LANGS]} onSave={(v) => save({ language: (v || undefined) as Language })} />
          </Field>
          <Field label="Email">
            <div className="flex items-center gap-2">
              <InlineText value={promoter.email ?? ''} onSave={(v) => save({ email: v })} type="email" />
              {promoter.email && <a className="text-xs text-blue-500 hover:underline" href={`mailto:${promoter.email}`}>↗</a>}
            </div>
          </Field>
          <Field label="Phone / WhatsApp">
            <div className="flex items-center gap-2">
              <InlineText value={promoter.phone ?? ''} onSave={(v) => save({ phone: v })} />
              {promoter.phone && <a className="text-xs text-blue-500 hover:underline" href={`tel:${promoter.phone}`}>↗</a>}
            </div>
          </Field>
        </div>
      </Section>

      {/* Social */}
      <Section title="Social media">
        <div className="grid grid-cols-2 gap-3">
          <SocialField icon="📷" label="Instagram"  value={promoter.instagram ?? ''} onSave={(v) => save({ instagram: v })} hrefFn={(v) => `https://instagram.com/${v.replace(/^@/, '')}`} />
          <SocialField icon="🎵" label="TikTok"     value={promoter.tiktok ?? ''}    onSave={(v) => save({ tiktok: v })}    hrefFn={(v) => `https://tiktok.com/@${v.replace(/^@/, '')}`} />
          <SocialField icon="▶️" label="YouTube"    value={promoter.youtube ?? ''}   onSave={(v) => save({ youtube: v })}   hrefFn={(v) => `https://youtube.com/@${v.replace(/^@/, '')}`} />
          <SocialField icon="📘" label="Facebook"   value={promoter.facebook ?? ''}  onSave={(v) => save({ facebook: v })}  hrefFn={(v) => `https://facebook.com/${v}`} />
          <SocialField icon="🌐" label="Website"    value={promoter.website ?? ''}   onSave={(v) => save({ website: v })}   hrefFn={(v) => v.startsWith('http') ? v : `https://${v}`} />
        </div>
      </Section>

      {/* CRM */}
      <Section title="CRM status">
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUSES.map((s) => {
            const meta = STATUS_META[s];
            const active = promoter.status === s;
            return (
              <button
                key={s}
                onClick={() => save({ status: s })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${active ? meta.pill + ' border-transparent' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                <span className="mr-1">{meta.emoji}</span>{s}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Assigned to">
            <div className="flex gap-1">
              {(['Arthur', 'James'] as AssignedTo[]).map((a) => (
                <button
                  key={a}
                  onClick={() => save({ assignedTo: a })}
                  className={`flex-1 text-xs py-1 rounded border ${promoter.assignedTo === a ? 'bg-foreground text-background border-transparent' : 'border-border'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Last contact">
            <InlineText value={promoter.lastContact ?? ''} onSave={(v) => save({ lastContact: v || undefined })} type="date" />
          </Field>
          <Field label={<span>Follow-up {overdue && <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold">OVERDUE</span>}</span>}>
            <InlineText value={promoter.followUp ?? ''} onSave={(v) => save({ followUp: v || undefined })} type="date" />
          </Field>
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea
          defaultValue={promoter.notes ?? ''}
          onBlur={(e) => { if (e.target.value !== (promoter.notes ?? '')) save({ notes: e.target.value }); }}
          rows={4}
          placeholder="Add notes…"
          className="w-full text-sm px-3 py-2 rounded border border-border bg-background resize-y"
        />
      </Section>

      {/* Activity */}
      <Section title="Activity log">
        <ActivityForm onSubmit={(a) => { addActivity(promoter.id, a); toast.success('Logged'); }} assignedTo={promoter.assignedTo} />
        <div className="mt-3 space-y-2">
          {promoter.activity.length === 0 && <div className="text-xs text-muted-foreground">No activity yet.</div>}
          {promoter.activity.map((a) => (
            <div key={a.id} className="flex items-start gap-2 text-xs border-l-2 border-border pl-3 py-1">
              <span className="text-base leading-none">{ACTIVITY_ICON[a.type]}</span>
              <div className="flex-1">
                <div className="text-muted-foreground">{a.date} · {a.type} · <span className="text-foreground/70">{a.loggedBy}</span></div>
                <div className="text-foreground">{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Shows */}
      <Section title="Shows together">
        {shows.length === 0 ? (
          <div className="text-xs text-muted-foreground">No shows logged with this promoter.</div>
        ) : (
          <div className="space-y-1">
            {shows.map((b) => {
              const pct = b.capacity ? Math.round((b.ticketsSold / b.capacity) * 100) : 0;
              return (
                <div key={b.id} className="grid grid-cols-[100px_1fr_120px_60px] gap-2 text-xs py-1.5 border-b border-border">
                  <span className="text-muted-foreground">{b.date}</span>
                  <span className="font-medium truncate">{b.eventName ?? b.venue}</span>
                  <span className="text-muted-foreground truncate">{b.city}</span>
                  <span className={pct >= 90 ? 'text-emerald-500' : pct >= 70 ? 'text-amber-500' : 'text-red-500'}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <div className="pt-4 border-t border-border flex justify-end">
        <button
          onClick={() => { if (confirm(`Delete ${promoter.name}?`)) { remove(promoter.id); toast.success('Promoter deleted'); } }}
          className="text-xs text-red-500 hover:text-red-600"
        >
          Delete promoter
        </button>
      </div>
    </div>
  );
}

// ---------- Small UI helpers ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function InlineText({
  value, onSave, type = 'text', placeholder, className,
}: { value: string; onSave: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  const [v, setV] = useState(value);
  return (
    <input
      type={type}
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onSave(v); }}
      className={`w-full bg-transparent border border-transparent hover:border-border focus:border-foreground/30 rounded px-2 py-1 text-sm outline-none ${className ?? ''}`}
    />
  );
}

function InlineSelect({ value, options, onSave }: { value: string; options: readonly string[]; onSave: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onSave(e.target.value)}
      className="w-full bg-transparent border border-transparent hover:border-border focus:border-foreground/30 rounded px-2 py-1 text-sm outline-none"
    >
      {options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
    </select>
  );
}

function SocialField({
  icon, label, value, onSave, hrefFn,
}: { icon: string; label: string; value: string; onSave: (v: string) => void; hrefFn: (v: string) => string }) {
  return (
    <Field label={<span>{icon} {label}</span>}>
      <div className="flex items-center gap-2">
        <InlineText value={value} onSave={onSave} placeholder="handle or URL" />
        {value && <a href={hrefFn(value)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">↗</a>}
      </div>
    </Field>
  );
}

function ActivityForm({ onSubmit, assignedTo }: { onSubmit: (a: Omit<ActivityEntry, 'id'>) => void; assignedTo?: AssignedTo }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActivityEntry['type']>('Call');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [by, setBy] = useState<AssignedTo>(assignedTo ?? 'Arthur');

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-pink-600 hover:text-pink-700 font-medium">+ Log activity</button>
    );
  }
  return (
    <div className="border border-border rounded p-3 space-y-2">
      <div className="grid grid-cols-[110px_1fr_110px_90px] gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as ActivityEntry['type'])} className="text-xs px-2 py-1 rounded border border-border bg-background">
          {(['Call', 'Email', 'WhatsApp', 'Meeting', 'Note'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="text-xs px-2 py-1 rounded border border-border bg-background" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-xs px-2 py-1 rounded border border-border bg-background" />
        <select value={by} onChange={(e) => setBy(e.target.value as AssignedTo)} className="text-xs px-2 py-1 rounded border border-border bg-background">
          <option>Arthur</option><option>James</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground px-2 py-1">Cancel</button>
        <button
          onClick={() => {
            if (!desc.trim()) return;
            onSubmit({ type, description: desc.trim(), date, loggedBy: by });
            setDesc(''); setOpen(false);
          }}
          className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded font-medium"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ---------- Add Modal ----------

function AddPromoterModal({ onClose }: { onClose: () => void }) {
  const add = usePromoters((s) => s.add);
  const [form, setForm] = useState({
    name: '', type: 'Local promoter' as PromoterType, city: '', country: '',
    contactName: '', email: '', phone: '',
    status: 'Cold' as PromoterStatus, assignedTo: 'Arthur' as AssignedTo,
    mainGenre: '' as PromoterGenre | '', notes: '',
  });
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background text-foreground rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Add promoter</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <ModalField label="Name *"><input className="modal-input" value={form.name} onChange={(e) => set('name', e.target.value)} /></ModalField>
          <ModalField label="Type">
            <select className="modal-input" value={form.type} onChange={(e) => set('type', e.target.value as PromoterType)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </ModalField>
          <ModalField label="City"><input className="modal-input" value={form.city} onChange={(e) => set('city', e.target.value)} /></ModalField>
          <ModalField label="Country"><input className="modal-input" value={form.country} onChange={(e) => set('country', e.target.value)} /></ModalField>
          <ModalField label="Contact person"><input className="modal-input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></ModalField>
          <ModalField label="Email"><input className="modal-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></ModalField>
          <ModalField label="Phone"><input className="modal-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></ModalField>
          <ModalField label="Main genre">
            <select className="modal-input" value={form.mainGenre} onChange={(e) => set('mainGenre', e.target.value as PromoterGenre | '')}>
              <option value="">—</option>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </ModalField>
          <ModalField label="Status">
            <select className="modal-input" value={form.status} onChange={(e) => set('status', e.target.value as PromoterStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </ModalField>
          <ModalField label="Assigned to">
            <select className="modal-input" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value as AssignedTo)}>
              <option>Arthur</option><option>James</option>
            </select>
          </ModalField>
          <ModalField label="Notes" wide>
            <textarea rows={3} className="modal-input" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </ModalField>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="text-xs text-muted-foreground px-3 py-2">Cancel</button>
          <button
            onClick={() => {
              if (!form.name.trim()) { toast.error('Name is required'); return; }
              add({
                name: form.name.trim(),
                type: form.type,
                city: form.city.trim(),
                country: form.country.trim(),
                contactName: form.contactName.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                status: form.status,
                assignedTo: form.assignedTo,
                mainGenre: (form.mainGenre || undefined) as PromoterGenre | undefined,
                notes: form.notes.trim() || undefined,
              });
              toast.success(`${form.name} added`);
              onClose();
            }}
            className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded font-medium"
          >
            Save promoter
          </button>
        </div>
        <style>{`.modal-input{width:100%;font-size:12px;padding:6px 8px;border:1px solid hsl(var(--border, 0 0% 80%));background:transparent;border-radius:6px;outline:none;color:inherit;}.modal-input:focus{border-color:rgb(219 39 119);}`}</style>
      </div>
    </div>
  );
}

function ModalField({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'col-span-2' : ''}>
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
