import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';
import { useActivity } from './useActivity';

export type StoplightStatus = 'green' | 'orange' | 'red';

export const STATUS_META: Record<StoplightStatus, { dot: string; label: string; emoji: string; ring: string; fill: string }> = {
  green:  { dot: 'bg-green-500',  label: 'Actively scouting',    emoji: '🟢', ring: 'ring-green-500 text-green-700',   fill: 'bg-green-500 text-white' },
  orange: { dot: 'bg-orange-400', label: 'In conversation',      emoji: '🟡', ring: 'ring-orange-400 text-orange-700', fill: 'bg-orange-400 text-white' },
  red:    { dot: 'bg-red-500',    label: 'Existing relationship', emoji: '🔴', ring: 'ring-red-500 text-red-700',       fill: 'bg-red-500 text-white' },
};

export interface CityStatus {
  city_id: string;
  status: StoplightStatus;
  notes: string;
  promoters_in_conversation: string[];
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface CityStatusLog {
  id: string;
  city_id: string;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

interface State {
  byCity: Record<string, CityStatus>;
  logsByCity: Record<string, CityStatusLog[]>;
  notesPanelCityId: string | null;
  loaded: boolean;
  init: () => Promise<void>;
  openNotes: (cityId: string) => void;
  closeNotes: () => void;
  loadLogs: (cityId: string) => Promise<void>;
  setStatus: (cityId: string, cityName: string, status: StoplightStatus) => Promise<void>;
  setNotes: (cityId: string, cityName: string, notes: string) => Promise<void>;
  addPromoter: (cityId: string, cityName: string, promoterId: string, promoterName: string) => Promise<void>;
  removePromoter: (cityId: string, cityName: string, promoterId: string, promoterName: string) => Promise<void>;
}

async function ensureRow(cityId: string): Promise<CityStatus> {
  const { data } = await supabase.from('city_status').select('*').eq('city_id', cityId).maybeSingle();
  if (data) return data as CityStatus;
  const u = useUser.getState().session?.user.id ?? null;
  const { data: ins } = await supabase
    .from('city_status')
    .insert({ city_id: cityId, status: 'green', notes: '', promoters_in_conversation: [], updated_by: u })
    .select('*')
    .single();
  return ins as CityStatus;
}

async function writeLog(cityId: string, change_type: string, old_value: string | null, new_value: string | null) {
  const u = useUser.getState().session?.user.id ?? null;
  await supabase.from('city_status_log').insert({
    city_id: cityId, change_type, old_value, new_value, changed_by: u,
  });
}

export const useCityStatus = create<State>((set, get) => ({
  byCity: {},
  logsByCity: {},
  notesPanelCityId: null,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    set({ loaded: true });
    const { data } = await supabase.from('city_status').select('*');
    const byCity: Record<string, CityStatus> = {};
    for (const row of (data ?? []) as CityStatus[]) byCity[row.city_id] = row;
    set({ byCity });

    supabase
      .channel('city_status_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'city_status' }, (payload) => {
        const row = payload.new as CityStatus;
        if (row?.city_id) set((s) => ({ byCity: { ...s.byCity, [row.city_id]: row } }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'city_status_log' }, (payload) => {
        const row = payload.new as CityStatusLog;
        if (!row?.city_id) return;
        set((s) => ({
          logsByCity: {
            ...s.logsByCity,
            [row.city_id]: [row, ...(s.logsByCity[row.city_id] ?? [])],
          },
        }));
      })
      .subscribe();
  },

  openNotes: (cityId) => {
    set({ notesPanelCityId: cityId });
    void get().loadLogs(cityId);
  },
  closeNotes: () => set({ notesPanelCityId: null }),

  loadLogs: async (cityId) => {
    const { data } = await supabase
      .from('city_status_log')
      .select('*')
      .eq('city_id', cityId)
      .order('changed_at', { ascending: false })
      .limit(50);
    set((s) => ({ logsByCity: { ...s.logsByCity, [cityId]: (data ?? []) as CityStatusLog[] } }));
  },

  setStatus: async (cityId, cityName, status) => {
    const u = useUser.getState();
    const userId = u.session?.user.id ?? null;
    const current = await ensureRow(cityId);
    if (current.status === status) return;
    const { data } = await supabase
      .from('city_status')
      .update({ status, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('city_id', cityId)
      .select('*')
      .single();
    if (data) set((s) => ({ byCity: { ...s.byCity, [cityId]: data as CityStatus } }));
    await writeLog(cityId, 'status', current.status, status);
    const name = u.profile?.display_name ?? '—';
    useActivity.getState().log({
      user: name, action: 'updated city', subject: cityName, target: 'city', targetId: cityId,
    });
    void u.notify(`${name} updated ${cityName} — now ${STATUS_META[status].emoji} ${STATUS_META[status].label}`, undefined, undefined, 'city.status');
  },

  setNotes: async (cityId, cityName, notes) => {
    const u = useUser.getState();
    const userId = u.session?.user.id ?? null;
    const current = await ensureRow(cityId);
    if (current.notes === notes) return;
    const { data } = await supabase
      .from('city_status')
      .update({ notes, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('city_id', cityId)
      .select('*')
      .single();
    if (data) set((s) => ({ byCity: { ...s.byCity, [cityId]: data as CityStatus } }));
    await writeLog(cityId, 'notes', null, null);
    const name = u.profile?.display_name ?? '—';
    void u.notify(`${name} updated notes for ${cityName}`, undefined, undefined, 'city.notes');
  },

  addPromoter: async (cityId, cityName, promoterId, promoterName) => {
    const u = useUser.getState();
    const userId = u.session?.user.id ?? null;
    const current = await ensureRow(cityId);
    if (current.promoters_in_conversation.includes(promoterId)) return;
    const next = [...current.promoters_in_conversation, promoterId];
    const { data } = await supabase
      .from('city_status')
      .update({ promoters_in_conversation: next, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('city_id', cityId)
      .select('*')
      .single();
    if (data) set((s) => ({ byCity: { ...s.byCity, [cityId]: data as CityStatus } }));
    await writeLog(cityId, 'promoter_added', null, promoterName);
    const name = u.profile?.display_name ?? '—';
    void u.notify(`${name} added promoter ${promoterName} to ${cityName}`, 'promoter', promoterId, 'city.promoter_added');
  },

  removePromoter: async (cityId, cityName, promoterId, promoterName) => {
    const u = useUser.getState();
    const userId = u.session?.user.id ?? null;
    const current = await ensureRow(cityId);
    const next = current.promoters_in_conversation.filter((x) => x !== promoterId);
    const { data } = await supabase
      .from('city_status')
      .update({ promoters_in_conversation: next, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('city_id', cityId)
      .select('*')
      .single();
    if (data) set((s) => ({ byCity: { ...s.byCity, [cityId]: data as CityStatus } }));
    await writeLog(cityId, 'promoter_removed', promoterName, null);
    const name = u.profile?.display_name ?? '—';
    void u.notify(`${name} removed promoter ${promoterName} from ${cityName}`, undefined, undefined, 'city.promoter_removed');
  },
}));

export function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} hour${Math.floor(d / 3600) === 1 ? '' : 's'} ago`;
  const days = Math.floor(d / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} mo ago`;
}
