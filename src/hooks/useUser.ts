import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppUser = 'Arthur' | 'James';

interface UserState {
  user: AppUser | null;
  setUser: (u: AppUser) => void;
  logout: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      user: 'Arthur',
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null }),
    }),
    { name: 'undivide-user' },
  ),
);
