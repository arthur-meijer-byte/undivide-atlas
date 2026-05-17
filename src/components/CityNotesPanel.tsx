import { useEffect, useMemo, useRef, useState } from 'react';
import { useCityStatus, STATUS_META, timeAgo, type StoplightStatus } from '../hooks/useCityStatus';
import { useUser } from '../hooks/useUser';
import { usePromoters } from '../hooks/usePromoters';
import type { City } from '../data/cities';

interface Props {
  city: City;
  onClose: () => void;
  onOpenPromoter?: (promoterId: string) => void;
}

const STATUSES: StoplightStatus[] = ['green', 'orange', 'red'];

export default function CityNotesPanel({ city, onClose, onOpenPromoter }: Props) {
  const byCity = useCityStatus((s) => s.byCity);
  const logsByCity = useCityStatus((s) => s.logsByCity);
  const setStatus = useCityStatus((s) => s.setStatus);
  const setNotes = useCityStatus((s) => s.setNotes);
  const addPromoter = useCityStatus((s) => s.addPromoter);
  const removePromoter = useCityStatus((s) => s.removePromoter);
  const loadLogs = useCityStatus((s) => s.loadLogs);

  const profile = useUser((s) => s.profile);
  const otherProfile = useUser((s) => s.otherProfile);
  const allProfiles = useMemo(() => [profile, otherProfile].filter(Boolean), [profile, otherProfile]);

  const promoters = usePromoters((s) => s.promoters);

  const row = byCity[city.id];
  const status: StoplightStatus = row?.status ?? 'green';
  const notes = row?.notes ?? '';
  const promoterIds = row?.promoters_in_conversation ?? [];
  const logs = logsByCity[city.id] ?? [];

  const [notesDraft, setNotesDraft] = useState(notes);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const lastCityId = useRef(city.id);

  useEffect(() => {
    if (lastCityId.current !== city.id) {
      lastCityId.current = city.id;
      setNotesDraft(notes);
    }
  }, [city.id, notes]);

  useEffect(() => { void loadLogs(city.id); }, [city.id, loadLogs]);
  
  useEffect(() => { setNotesDraft((d) => (d === '' || d === notes ? notes : d)); }, [notes]);

  const filteredPromoters = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inConv = new Set(promoterIds);
    return promoters
      .filter((p) => !inConv.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))
      .slice(0, 8);
  }, [promoters, promoterIds, search]);

  const updaterName = (id: string | null | undefined) => {
    if (!id) return '—';
    return allProfiles.find((p) => p!.id === id)?.display_name ?? '—';
  };
  const updaterInitial = (id: string | null | undefined) => {
    if (!id) return '—';
    return allProfiles.find((p) => p!.id === id)?.initial ?? '—';
  };

  return (
    <div
      className="panel-slide-in absolute top-0 bottom-0 left-[400px] z-30 w-[400px] bg-white shadow-[var(--shadow-panel)] flex flex-col border-l border-gray-200"
    >
      <div className="relative px-5 py-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700"
        >×</button>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">City notes</div>
        <div className="text-lg font-bold text-gray-900">{city.name}</div>
        <div className="text-xs text-gray-500">{city.country}</div>

        <div className="mt-4 flex gap-1.5">
          {STATUSES.map((s) => {
            const meta = STATUS_META[s];
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => void setStatus(city.id, city.name, s)}
                className={`flex-1 text-xs font-semibold px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  active
                    ? meta.fill + ' shadow'
                    : 'bg-white ring-1 ' + meta.ring + ' hover:bg-gray-50'
                }`}
              >
                <span>{meta.emoji}</span>
                <span className="truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-5 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
            In conversation with
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {promoterIds.map((id) => {
              const p = promoters.find((x) => x.id === id);
              const name = p?.name ?? id;
              const sub = p?.city ?? '';
              return (
                <span key={id} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs rounded-full pl-2 pr-1 py-0.5">
                  <button
                    className="hover:underline"
                    onClick={() => p && onOpenPromoter?.(p.id)}
                    title={sub}
                  >
                    {name}{sub && <span className="opacity-60"> · {sub}</span>}
                  </button>
                  <button
                    onClick={() => void removePromoter(city.id, city.name, id, name)}
                    className="w-4 h-4 rounded-full hover:bg-orange-200 flex items-center justify-center"
                    aria-label="Remove"
                  >×</button>
                </span>
              );
            })}
            {promoterIds.length === 0 && (
              <span className="text-xs text-gray-400 italic">No promoters added yet.</span>
            )}
          </div>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Add a promoter..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--undivide)]/30"
            />
            {searchOpen && filteredPromoters.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                {filteredPromoters.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void addPromoter(city.id, city.name, p.id, p.name);
                      setSearch('');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex justify-between"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-500">{p.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Notes</div>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => { if (notesDraft !== notes) void setNotes(city.id, city.name, notesDraft); }}
            placeholder={`What's the situation in ${city.name}? Who have you spoken to, what's the next step...`}
            rows={6}
            className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--undivide)]/30 resize-y"
          />
          {row?.updated_by && (
            <div className="text-[11px] text-gray-400 mt-1">
              Last edited by {updaterName(row.updated_by)} · {timeAgo(row.updated_at)}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Update log</div>
          {logs.length === 0 && <div className="text-xs text-gray-400 italic">No updates yet.</div>}
          <div className="space-y-1.5">
            {(showAllLogs ? logs : logs.slice(0, 10)).map((l) => {
              let text = '';
              if (l.change_type === 'status') {
                const s = (l.new_value as StoplightStatus) ?? 'green';
                text = `Changed to ${STATUS_META[s]?.emoji ?? ''} ${STATUS_META[s]?.label ?? l.new_value}`;
              } else if (l.change_type === 'notes') {
                text = 'Updated notes';
              } else if (l.change_type === 'promoter_added') {
                text = `Added promoter: ${l.new_value}`;
              } else if (l.change_type === 'promoter_removed') {
                text = `Removed promoter: ${l.old_value}`;
              } else {
                text = l.change_type;
              }
              return (
                <div key={l.id} className="text-[11px] text-gray-600 flex items-start gap-2">
                  <span className="inline-flex w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-[9px] font-bold items-center justify-center shrink-0 mt-0.5">
                    {updaterInitial(l.changed_by)}
                  </span>
                  <span className="flex-1">
                    {text} <span className="text-gray-400">— {timeAgo(l.changed_at)}</span>
                  </span>
                </div>
              );
            })}
          </div>
          {logs.length > 10 && (
            <button
              onClick={() => setShowAllLogs((v) => !v)}
              className="mt-2 text-[11px] text-[var(--undivide)] hover:underline"
            >
              {showAllLogs ? 'Show less' : `Show more (${logs.length - 10})`}
            </button>
          )}
        </div>
      </div>

      {row?.updated_by && (
        <div className="px-4 py-2 border-t border-gray-200 text-[11px] text-gray-500">
          Last updated by {updaterName(row.updated_by)} · {timeAgo(row.updated_at)}
        </div>
      )}
    </div>
  );
}
