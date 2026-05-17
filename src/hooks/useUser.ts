import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_color: string;
  initial: string;
  role: string;
  must_change_password: boolean;
}

interface UserState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  otherProfile: Profile | null;
  /** Backward-compat: display name string of current user. */
  user: string | null;
  init: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  logout: () => Promise<void>;
  notify: (
    message: string,
    link_type?: 'show' | 'promoter',
    link_id?: string,
    type?: string,
  ) => Promise<void>;
}

let initialized = false;

export const useUser = create<UserState>((set, get) => ({
  loading: true,
  session: null,
  profile: null,
  otherProfile: null,
  user: null,

  init: async () => {
    if (initialized) return;
    initialized = true;

    const apply = async (session: Session | null) => {
      if (!session) {
        set({ session: null, profile: null, otherProfile: null, user: null, loading: false });
        return;
      }
      const { data: profiles } = await supabase.from('profiles').select('*');
      const list = (profiles ?? []) as Profile[];
      const profile = list.find((p) => p.id === session.user.id) ?? null;
      const otherProfile = list.find((p) => p.id !== session.user.id) ?? null;
      set({
        session,
        profile,
        otherProfile,
        user: profile?.display_name ?? null,
        loading: false,
      });
    };

    supabase.auth.onAuthStateChange((_e, session) => {
      void apply(session);
    });
    const { data } = await supabase.auth.getSession();
    await apply(data.session);
  },

  refreshProfiles: async () => {
    const session = get().session;
    if (!session) return;
    const { data: profiles } = await supabase.from('profiles').select('*');
    const list = (profiles ?? []) as Profile[];
    const profile = list.find((p) => p.id === session.user.id) ?? null;
    const otherProfile = list.find((p) => p.id !== session.user.id) ?? null;
    set({ profile, otherProfile, user: profile?.display_name ?? null });
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  notify: async (message, link_type, link_id, type = 'activity') => {
    const { session, otherProfile } = get();
    if (!session || !otherProfile) return;
    await supabase.from('notifications').insert({
      type,
      message,
      link_type: link_type ?? null,
      link_id: link_id ?? null,
      created_by: session.user.id,
      for_user: otherProfile.id,
    });
  },
}));
