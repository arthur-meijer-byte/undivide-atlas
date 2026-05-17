import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useActivity } from './useActivity';
import { useUser } from './useUser';

export type Sound = 'Liquid' | 'Neuro' | 'Jump Up' | 'Dancefloor' | 'Minimal' | 'Halftime' | 'All Styles';

export type ShowBrand = 'Hospitality' | 'UKF' | 'Korsakov' | 'The Blast' | 'RUN' | 'Independent';
export type ShowStatus = 'Upcoming' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  venue: string;
  eventName?: string;
  date: string; // YYYY-MM-DD
  promoter: string;
  capacity: number;
  ticketsSold: number;
  ticketPrice?: number;
  brand?: ShowBrand;
  status?: ShowStatus;
  artists?: string[];
  sound?: Sound;
  lineup?: string; // legacy comma-separated
  ig?: string;
  fb?: string;
  yt?: string;
  website?: string;
  notes?: string;
  createdAt: number;
}

interface BookingsState {
  bookings: Booking[];
  bookingModalOpen: boolean;
  editingId: string | null;
  prefill: Partial<Booking> | null;
  add: (b: Omit<Booking, 'id' | 'createdAt'>) => void;
  update: (id: string, b: Partial<Booking>) => void;
  remove: (id: string) => void;
  openModal: (prefill?: Partial<Booking>, editingId?: string) => void;
  closeModal: () => void;
}

export const useBookings = create<BookingsState>()(
  persist(
    (set) => ({
      bookings: [],
      bookingModalOpen: false,
      editingId: null,
      prefill: null,
      add: (b) => {
        const id = crypto.randomUUID();
        set((s) => ({
          bookings: [...s.bookings, { ...b, id, createdAt: Date.now() }],
        }));
        const user = useUser.getState().user ?? '—';
        const subject = `${b.eventName || b.venue || 'Show'} — ${b.city}`;
        const action: 'confirmed show' | 'added show' = b.status === 'Confirmed' ? 'confirmed show' : 'added show';
        useActivity.getState().log({ user, action, subject, target: 'show', targetId: id });
        void useUser.getState().notify(
          `${user} ${action === 'confirmed show' ? 'confirmed' : 'added'} a show in ${b.city} — ${b.eventName || b.venue || 'Show'}`,
          'show', id, 'show.add',
        );
      },
      update: (id, b) => {
        set((s) => ({
          bookings: s.bookings.map((x) => (x.id === id ? { ...x, ...b } : x)),
        }));
        const cur = useBookings.getState().bookings.find((x) => x.id === id);
        if (!cur) return;
        const user = useUser.getState().user ?? '—';
        const subject = `${cur.eventName || cur.venue || 'Show'} — ${cur.city}`;
        const action: 'confirmed show' | 'updated show' =
          b.status === 'Confirmed' ? 'confirmed show' : 'updated show';
        useActivity.getState().log({ user, action, subject, target: 'show', targetId: id });
        void useUser.getState().notify(
          `${user} ${action === 'confirmed show' ? 'confirmed' : 'updated'} ${cur.eventName || cur.venue || 'show'} in ${cur.city}`,
          'show', id, 'show.update',
        );
      },
      remove: (id) => set((s) => ({ bookings: s.bookings.filter((x) => x.id !== id) })),
      openModal: (prefill, editingId) =>
        set({ bookingModalOpen: true, prefill: prefill ?? null, editingId: editingId ?? null }),
      closeModal: () => set({ bookingModalOpen: false, prefill: null, editingId: null }),
    }),
    { name: 'undivide-bookings' },
  ),
);
