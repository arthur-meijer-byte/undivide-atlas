import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivity, type ActivityAction } from './useActivity';
import { useUser } from './useUser';

export type PromoterType = 'Local promoter' | 'Venue' | 'Festival' | 'Undivide partner' | 'Independent';
export type PromoterGenre = 'Liquid' | 'Neurofunk' | 'Jump Up' | 'Dancefloor' | 'All styles';
export type PromoterStatus = 'Cold' | 'Contacted' | 'In talks' | 'Partner' | 'Inactive';
export type AssignedTo = 'Arthur' | 'James';
export type Language = 'EN' | 'NL' | 'DE' | 'FR' | 'ES' | 'PT';

export interface ActivityEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Call' | 'Email' | 'WhatsApp' | 'Meeting' | 'Note';
  description: string;
  loggedBy: AssignedTo;
}

export interface Promoter {
  id: string;
  name: string;
  type: PromoterType;
  city: string;
  country: string;
  activeSince?: number;
  mainGenre?: PromoterGenre;
  eventsPerYear?: number;

  contactName?: string;
  email?: string;
  phone?: string;
  language?: Language;

  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  website?: string;

  status: PromoterStatus;
  assignedTo?: AssignedTo;
  lastContact?: string; // YYYY-MM-DD
  followUp?: string; // YYYY-MM-DD

  notes?: string;
  activity: ActivityEntry[];
  createdAt: number;
}

interface PromotersState {
  promoters: Promoter[];
  panelOpen: boolean;
  selectedId: string | null;
  openPanel: () => void;
  closePanel: () => void;
  select: (id: string | null) => void;
  add: (p: Omit<Promoter, 'id' | 'createdAt' | 'activity'> & { activity?: ActivityEntry[] }) => string;
  update: (id: string, patch: Partial<Promoter>) => void;
  remove: (id: string) => void;
  addActivity: (id: string, a: Omit<ActivityEntry, 'id'>) => void;
}

const seed: Promoter[] = [
  {
    id: 'seed-1',
    name: 'Liquicity',
    type: 'Festival',
    city: 'Amsterdam',
    country: 'Netherlands',
    activeSince: 2011,
    mainGenre: 'Liquid',
    eventsPerYear: 8,
    contactName: 'Maris',
    email: 'booking@liquicity.com',
    language: 'EN',
    instagram: 'liquicity',
    youtube: 'Liquicity',
    website: 'https://liquicity.com',
    status: 'Partner',
    assignedTo: 'Arthur',
    lastContact: new Date().toISOString().slice(0, 10),
    notes: 'Strong relationship — annual festival slot under discussion.',
    activity: [],
    createdAt: Date.now(),
  },
];

export const usePromoters = create<PromotersState>()(
  persist(
    (set) => ({
      promoters: seed,
      panelOpen: false,
      selectedId: null,
      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),
      select: (id) => set({ selectedId: id }),
      add: (p) => {
        const id = crypto.randomUUID();
        set((s) => ({
          promoters: [
            ...s.promoters,
            { ...p, id, createdAt: Date.now(), activity: p.activity ?? [] },
          ],
          selectedId: id,
        }));
        const user = useUser.getState().user ?? '—';
        useActivity.getState().log({
          user, action: 'added promoter', subject: p.name,
          target: 'promoter', targetId: id,
        });
        void useUser.getState().notify(
          `${user} added promoter ${p.name} in ${p.city}`,
          'promoter', id, 'promoter.add',
        );
        return id;
      },
      update: (id, patch) => {
        const before = usePromoters.getState().promoters.find((x) => x.id === id);
        set((s) => ({
          promoters: s.promoters.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        if (!before) return;
        const user = useUser.getState().user ?? '—';
        let action: ActivityAction = 'updated promoter';
        let message = `${user} updated promoter ${before.name}`;
        if (patch.status && patch.status !== before.status) {
          action = 'moved promoter';
          message = `${user} moved ${before.name} to '${patch.status}'`;
        } else if (patch.followUp && patch.followUp !== before.followUp) {
          action = 'set follow-up';
          message = `${user} set a follow-up for ${before.name} on ${patch.followUp}`;
        }
        useActivity.getState().log({
          user, action, subject: before.name,
          target: 'promoter', targetId: id,
        });
        void useUser.getState().notify(message, 'promoter', id, `promoter.${action}`);
      },
      remove: (id) =>
        set((s) => ({
          promoters: s.promoters.filter((x) => x.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      addActivity: (id, a) => {
        set((s) => ({
          promoters: s.promoters.map((x) =>
            x.id === id
              ? { ...x, activity: [{ ...a, id: crypto.randomUUID() }, ...x.activity] }
              : x,
          ),
        }));
        const promoter = usePromoters.getState().promoters.find((x) => x.id === id);
        if (!promoter) return;
        const user = useUser.getState().user ?? a.loggedBy;
        const map: Record<string, ActivityAction> = {
          Call: 'logged call', Email: 'logged email', WhatsApp: 'logged whatsapp',
          Meeting: 'logged meeting', Note: 'logged note',
        };
        const action = map[a.type] ?? 'logged note';
        useActivity.getState().log({
          user, action, subject: promoter.name, target: 'promoter', targetId: id,
        });
        void useUser.getState().notify(
          `${user} ${action} — ${promoter.name}`,
          'promoter', id, `promoter.${action}`,
        );
      },
    }),
    { name: 'undivide-promoters' },
  ),
);

export const STATUS_META: Record<PromoterStatus, { dot: string; pill: string; emoji: string }> = {
  Cold:       { dot: 'bg-red-500',    pill: 'bg-red-500 text-white',    emoji: '🔴' },
  Contacted:  { dot: 'bg-yellow-400', pill: 'bg-yellow-400 text-black', emoji: '🟡' },
  'In talks': { dot: 'bg-orange-500', pill: 'bg-orange-500 text-white', emoji: '🟠' },
  Partner:    { dot: 'bg-green-500',  pill: 'bg-green-500 text-white',  emoji: '🟢' },
  Inactive:   { dot: 'bg-gray-500',   pill: 'bg-gray-500 text-white',   emoji: '⚫' },
};
