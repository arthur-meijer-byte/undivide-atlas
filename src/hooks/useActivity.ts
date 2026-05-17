import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityAction =
  | 'added show'
  | 'updated show'
  | 'confirmed show'
  | 'added promoter'
  | 'updated promoter'
  | 'moved promoter'
  | 'set follow-up'
  | 'logged call'
  | 'logged email'
  | 'logged whatsapp'
  | 'logged meeting'
  | 'logged note';

export type ActivityTarget = 'show' | 'promoter';

export interface ActivityEntry {
  id: string;
  user: string;            // "Arthur" | "James" | "—"
  action: ActivityAction;
  subject: string;         // displayed name
  target: ActivityTarget;
  targetId: string;        // booking id / promoter id
  at: number;              // ms
}

interface ActivityState {
  entries: ActivityEntry[];
  log: (e: Omit<ActivityEntry, 'id' | 'at'>) => void;
  clear: () => void;
}

export const useActivity = create<ActivityState>()(
  persist(
    (set) => ({
      entries: [],
      log: (e) =>
        set((s) => ({
          entries: [
            { ...e, id: crypto.randomUUID(), at: Date.now() },
            ...s.entries,
          ].slice(0, 30),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'undivide-activity' },
  ),
);

export function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`;
  if (diff < 86400 * 2) return 'Yesterday';
  return `${Math.floor(diff / 86400)} days ago`;
}
