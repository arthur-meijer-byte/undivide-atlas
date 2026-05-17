import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '../hooks/useUser';

export const Route = createFileRoute('/set-password')({
  component: SetPasswordPage,
  head: () => ({ meta: [{ title: 'Set your password — Undivide' }] }),
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const init = useUser((s) => s.init);
  const session = useUser((s) => s.session);
  const profile = useUser((s) => s.profile);
  const refreshProfiles = useUser((s) => s.refreshProfiles);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { void init(); }, [init]);
  useEffect(() => {
    if (session === null && !useUser.getState().loading) navigate({ to: '/login' });
  }, [session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (profile) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile.id);
      await refreshProfiles();
    }
    setLoading(false);
    navigate({ to: '/' });
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Set your password</h1>
          <p className="text-xs text-muted-foreground">
            Choose a new password to continue. Minimum 8 characters.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 rounded-md bg-foreground/5 border border-border text-sm outline-none focus:border-foreground/40"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 rounded-md bg-foreground/5 border border-border text-sm outline-none focus:border-foreground/40"
          />
        </div>
        {err && <div className="text-xs text-red-500 text-center" role="alert">{err}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: '#e84118' }}
        >
          {loading ? 'Saving…' : 'Save & continue'}
        </button>
      </form>
    </main>
  );
}
