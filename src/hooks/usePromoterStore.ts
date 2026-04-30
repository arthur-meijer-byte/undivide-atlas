import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Editable overrides on top of the hardcoded promoter data.
export interface PromoterOverride {
  email?: string;
  phone?: string;
  contactPerson?: string;
  contactRole?: string;
  ig?: string;
  fb?: string;
  yt?: string;
  website?: string;
  notes?: string;
}

// Per-promoter, per-Undivide-brand pipeline status.
export type Brand = 'undivide' | 'hospitality' | 'ukf' | 'korsakov';
export type DealStatus =
  | 'none'
  | 'in-talks'
  | 'solid-idea'
  | 'offer-sent'
  | 'contracted'
  | 'invoiced'
  | 'paid'
  | 'declined';

export interface BrandStatus {
  status: DealStatus;
  city?: string;          // city the deal is for
  date?: string;          // YYYY-MM-DD target
  fee?: string;           // free text
  notes?: string;
  updatedAt: number;
}

// activity log entry
export interface ActivityEntry {
  id: string;
  ts: number;
  brand: Brand;
  text: string;
}

interface State {
  // key = `${cityId}::${promoterName}`
  overrides: Record<string, PromoterOverride>;
  // key = `${cityId}::${promoterName}::${brand}`
  statuses: Record<string, BrandStatus>;
  // key = `${cityId}::${promoterName}` -> activity entries
  activity: Record<string, ActivityEntry[]>;

  setOverride: (cityId: string, promoter: string, patch: PromoterOverride) => void;
  getOverride: (cityId: string, promoter: string) => PromoterOverride;

  setStatus: (cityId: string, promoter: string, brand: Brand, patch: Partial<BrandStatus>) => void;
  getStatus: (cityId: string, promoter: string, brand: Brand) => BrandStatus;

  addActivity: (cityId: string, promoter: string, brand: Brand, text: string) => void;
  getActivity: (cityId: string, promoter: string) => ActivityEntry[];
}

const oKey = (c: string, p: string) => `${c}::${p}`;
const sKey = (c: string, p: string, b: Brand) => `${c}::${p}::${b}`;

export const usePromoterStore = create<State>()(
  persist(
    (set, get) => ({
      overrides: {},
      statuses: {},
      activity: {},

      setOverride: (cityId, promoter, patch) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [oKey(cityId, promoter)]: { ...s.overrides[oKey(cityId, promoter)], ...patch },
          },
        })),
      getOverride: (cityId, promoter) => get().overrides[oKey(cityId, promoter)] ?? {},

      setStatus: (cityId, promoter, brand, patch) =>
        set((s) => {
          const prev = s.statuses[sKey(cityId, promoter, brand)] ?? {
            status: 'none' as DealStatus,
            updatedAt: 0,
          };
          return {
            statuses: {
              ...s.statuses,
              [sKey(cityId, promoter, brand)]: { ...prev, ...patch, updatedAt: Date.now() },
            },
          };
        }),
      getStatus: (cityId, promoter, brand) =>
        get().statuses[sKey(cityId, promoter, brand)] ?? { status: 'none', updatedAt: 0 },

      addActivity: (cityId, promoter, brand, text) =>
        set((s) => {
          const k = oKey(cityId, promoter);
          const entry: ActivityEntry = {
            id: crypto.randomUUID(),
            ts: Date.now(),
            brand,
            text,
          };
          return { activity: { ...s.activity, [k]: [entry, ...(s.activity[k] ?? [])] } };
        }),
      getActivity: (cityId, promoter) => get().activity[oKey(cityId, promoter)] ?? [],
    }),
    { name: 'undivide-promoter-store' },
  ),
);

export const STATUS_META: Record<DealStatus, { label: string; color: string; dot: string }> = {
  none:        { label: 'No contact',  color: 'bg-gray-100 text-gray-600',          dot: 'bg-gray-300' },
  'in-talks':  { label: 'In talks',    color: 'bg-sky-100 text-sky-700',            dot: 'bg-sky-500' },
  'solid-idea':{ label: 'Solid idea',  color: 'bg-indigo-100 text-indigo-700',      dot: 'bg-indigo-500' },
  'offer-sent':{ label: 'Offer sent',  color: 'bg-amber-100 text-amber-700',        dot: 'bg-amber-500' },
  contracted:  { label: 'Contracted',  color: 'bg-emerald-100 text-emerald-700',    dot: 'bg-emerald-500' },
  invoiced:    { label: 'Invoiced',    color: 'bg-violet-100 text-violet-700',      dot: 'bg-violet-500' },
  paid:        { label: 'Paid',        color: 'bg-green-100 text-green-700',        dot: 'bg-green-500' },
  declined:    { label: 'Declined',    color: 'bg-rose-100 text-rose-700',          dot: 'bg-rose-500' },
};

export const BRAND_META: Record<Brand, { label: string; color: string }> = {
  undivide:    { label: 'Undivide',    color: 'bg-[var(--undivide)] text-white' },
  hospitality: { label: 'Hospitality', color: 'bg-orange-500 text-white' },
  ukf:         { label: 'UKF',         color: 'bg-yellow-500 text-black' },
  korsakov:    { label: 'Korsakov',    color: 'bg-rose-600 text-white' },
};

export const ALL_BRANDS: Brand[] = ['undivide', 'hospitality', 'ukf', 'korsakov'];
export const ALL_STATUSES: DealStatus[] = [
  'none', 'in-talks', 'solid-idea', 'offer-sent', 'contracted', 'invoiced', 'paid', 'declined',
];
