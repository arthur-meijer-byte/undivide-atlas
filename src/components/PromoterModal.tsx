import { useState } from 'react';
import type { City, Promoter } from '../data/cities';
import {
  usePromoterStore,
  ALL_BRANDS,
  ALL_STATUSES,
  BRAND_META,
  STATUS_META,
  type Brand,
  type DealStatus,
} from '../hooks/usePromoterStore';

const TYPE_BADGE = {
  undivide: 'bg-[var(--undivide)] text-white',
  local: 'bg-blue-100 text-blue-700',
  venue: 'bg-amber-100 text-amber-700',
  independent: 'bg-gray-200 text-gray-700',
} as const;

function igUrl(h: string) { return h.startsWith('http') ? h : `https://instagram.com/${h.replace(/^@/, '')}`; }
function fbUrl(h: string) { return h.startsWith('http') ? h : `https://facebook.com/${h.replace(/^@/, '')}`; }
function ytUrl(h: string) { return h.startsWith('http') ? h : `https://youtube.com/@${h.replace(/^@/, '')}`; }

interface Props {
  city: City;
  promoter: Promoter;
  onClose: () => void;
  onViewHistory: () => void;
}

export default function PromoterModal({ city, promoter, onClose, onViewHistory }: Props) {
  const [tab, setTab] = useState<'info' | 'status'>('info');
  const override = usePromoterStore((s) => s.overrides[`${city.id}::${promoter.name}`] ?? {});

  // Merge hardcoded promoter data with editable overrides — overrides win.
  const merged = {
    email: override.email ?? '',
    phone: override.phone ?? '',
    contactPerson: override.contactPerson ?? '',
    contactRole: override.contactRole ?? '',
    ig: override.ig ?? promoter.ig ?? '',
    fb: override.fb ?? promoter.fb ?? '',
    yt: override.yt ?? promoter.yt ?? '',
    website: override.website ?? promoter.website ?? '',
    notes: override.notes ?? '',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-base">{promoter.name}</h3>
              <p className="text-xs text-gray-500">{city.name}, {city.country}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[promoter.type]}`}>{promoter.type}</span>
            <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">Since {promoter.since}</span>
            <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">{promoter.events} events/yr</span>
            <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">🎵 {promoter.dominant_genre}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2">
          {([
            ['info', 'Info & contact'],
            ['status', 'Undivide status'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                tab === key
                  ? 'border-[var(--undivide)] text-[var(--undivide)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto thin-scroll flex-1">
          {tab === 'info' ? (
            <InfoTab city={city} promoter={promoter} merged={merged} onViewHistory={onViewHistory} />
          ) : (
            <StatusTab city={city} promoter={promoter} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Info tab ---------------- */

function InfoTab({
  city,
  promoter,
  merged,
  onViewHistory,
}: {
  city: City;
  promoter: Promoter;
  merged: {
    email: string; phone: string; contactPerson: string; contactRole: string;
    ig: string; fb: string; yt: string; website: string; notes: string;
  };
  onViewHistory: () => void;
}) {
  const setOverride = usePromoterStore((s) => s.setOverride);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(merged);

  const save = () => {
    setOverride(city.id, promoter.name, form);
    setEditing(false);
  };
  const cancel = () => {
    setForm(merged);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-3 text-sm">
        <Field label="Contact person" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
        <Field label="Role / title" value={form.contactRole} onChange={(v) => setForm({ ...form, contactRole: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Instagram (@handle or URL)" value={form.ig} onChange={(v) => setForm({ ...form, ig: v })} />
        <Field label="Facebook" value={form.fb} onChange={(v) => setForm({ ...form, fb: v })} />
        <Field label="YouTube" value={form.yt} onChange={(v) => setForm({ ...form, yt: v })} />
        <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            maxLength={1000}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--undivide)]/30"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} className="flex-1 bg-[var(--undivide)] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90">Save</button>
          <button onClick={cancel} className="px-4 bg-gray-100 hover:bg-gray-200 text-sm font-semibold py-2 rounded-lg">Cancel</button>
        </div>
      </div>
    );
  }

  const hasContact = merged.email || merged.phone || merged.contactPerson;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Contact</div>
          <button onClick={() => setEditing(true)} className="text-[11px] text-[var(--undivide)] hover:underline font-semibold">✎ Edit</button>
        </div>
        {hasContact ? (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            {merged.contactPerson && (
              <div className="font-semibold">
                {merged.contactPerson}
                {merged.contactRole && <span className="text-gray-500 font-normal"> · {merged.contactRole}</span>}
              </div>
            )}
            {merged.email && (
              <a href={`mailto:${merged.email}`} className="block text-[var(--undivide)] hover:underline text-xs">
                ✉ {merged.email}
              </a>
            )}
            {merged.phone && (
              <a href={`tel:${merged.phone}`} className="block text-[var(--undivide)] hover:underline text-xs">
                ☎ {merged.phone}
              </a>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-400 italic">
            No contact details on file. Click Edit to add.
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Socials</div>
        <div className="flex flex-wrap gap-2">
          {merged.ig && (
            <a href={igUrl(merged.ig)} target="_blank" rel="noopener noreferrer" className="bg-pink-50 text-pink-700 hover:bg-pink-100 px-2.5 py-1 rounded-full text-xs">IG @{merged.ig.replace(/^@/, '')}</a>
          )}
          {merged.fb && (
            <a href={fbUrl(merged.fb)} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-full text-xs">FB {merged.fb}</a>
          )}
          {merged.yt && (
            <a href={ytUrl(merged.yt)} target="_blank" rel="noopener noreferrer" className="bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-full text-xs">YT {merged.yt}</a>
          )}
          {merged.website && (
            <a href={merged.website.startsWith('http') ? merged.website : `https://${merged.website}`} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2.5 py-1 rounded-full text-xs">🌐 Website</a>
          )}
          {!merged.ig && !merged.fb && !merged.yt && !merged.website && (
            <span className="text-xs text-gray-400 italic">None on file</span>
          )}
        </div>
      </div>

      {merged.notes && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Notes</div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs whitespace-pre-wrap">{merged.notes}</div>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Recent line-ups</div>
        <div className="flex flex-wrap gap-1">
          {promoter.lineup.map((a) => (
            <span key={a} className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[11px]">{a}</span>
          ))}
        </div>
      </div>

      <button
        onClick={onViewHistory}
        className="w-full bg-[var(--undivide)] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90"
      >
        View full event history →
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={255}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--undivide)]/30"
      />
    </div>
  );
}

/* ---------------- Status tab ---------------- */

function StatusTab({ city, promoter }: { city: City; promoter: Promoter }) {
  const [activeBrand, setActiveBrand] = useState<Brand>('undivide');
  const status = usePromoterStore((s) => s.statuses[`${city.id}::${promoter.name}::${activeBrand}`] ?? { status: 'none', updatedAt: 0 });
  const setStatus = usePromoterStore((s) => s.setStatus);
  const addActivity = usePromoterStore((s) => s.addActivity);
  const activity = usePromoterStore((s) => s.activity[`${city.id}::${promoter.name}`] ?? []);

  const [form, setForm] = useState({
    status: status.status as DealStatus,
    city: status.city ?? city.name,
    date: status.date ?? '',
    fee: status.fee ?? '',
    notes: status.notes ?? '',
  });
  // re-sync when brand switches
  const brandKey = `${city.id}::${promoter.name}::${activeBrand}`;
  const [lastKey, setLastKey] = useState(brandKey);
  if (lastKey !== brandKey) {
    setLastKey(brandKey);
    setForm({
      status: status.status,
      city: status.city ?? city.name,
      date: status.date ?? '',
      fee: status.fee ?? '',
      notes: status.notes ?? '',
    });
  }

  const [logText, setLogText] = useState('');

  const save = () => {
    setStatus(city.id, promoter.name, activeBrand, form);
    addActivity(
      city.id,
      promoter.name,
      activeBrand,
      `Status → ${STATUS_META[form.status].label}${form.city ? ` (${form.city})` : ''}`,
    );
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Brand selector */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Undivide brand</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BRANDS.map((b) => {
            const meta = BRAND_META[b];
            const s = usePromoterStore.getState().statuses[`${city.id}::${promoter.name}::${b}`];
            const dot = STATUS_META[s?.status ?? 'none'].dot;
            return (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-colors ${
                  activeBrand === b ? meta.color : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status form */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Status</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_STATUSES.map((s) => {
              const m = STATUS_META[s];
              const active = form.status === s;
              return (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, status: s })}
                  className={`text-xs px-2 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border transition-all ${
                    active ? `${m.color} border-current` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Target date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        </div>
        <Field label="Fee" value={form.fee} onChange={(v) => setForm({ ...form, fee: v })} />
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            maxLength={1000}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--undivide)]/30"
          />
        </div>
        <button
          onClick={save}
          className="w-full bg-[var(--undivide)] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90"
        >
          Save {BRAND_META[activeBrand].label} status
        </button>
        {status.updatedAt > 0 && (
          <div className="text-[10px] text-gray-400 text-center">
            Last updated {new Date(status.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Activity log */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Activity log</div>
        <div className="flex gap-2 mb-2">
          <input
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder={`Add ${BRAND_META[activeBrand].label} note…`}
            maxLength={500}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--undivide)]/30"
          />
          <button
            onClick={() => {
              const t = logText.trim();
              if (!t) return;
              addActivity(city.id, promoter.name, activeBrand, t);
              setLogText('');
            }}
            className="bg-gray-900 text-white text-xs font-semibold px-3 rounded-lg hover:bg-gray-800"
          >
            Add
          </button>
        </div>
        {activity.length === 0 ? (
          <div className="text-xs text-gray-400 italic">No activity yet.</div>
        ) : (
          <ul className="space-y-1.5">
            {activity.slice(0, 20).map((a) => (
              <li key={a.id} className="bg-white border border-gray-100 rounded-lg p-2 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-semibold ${BRAND_META[a.brand].color}`}>
                    {BRAND_META[a.brand].label}
                  </span>
                  <span className="text-[10px] text-gray-400">{new Date(a.ts).toLocaleString()}</span>
                </div>
                <div>{a.text}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
