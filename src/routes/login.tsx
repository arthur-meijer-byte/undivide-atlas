import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '../hooks/useUser';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  head: () => ({
    meta: [{ title: 'Sign in — Undivide' }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const init = useUser((s) => s.init);
  const session = useUser((s) => s.session);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { void init(); }, [init]);
  useEffect(() => { if (session) navigate({ to: '/' }); }, [session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErr('Invalid email or password');
      return;
    }
    // Persistent session: Supabase auto-persists via localStorage. "Remember me"
    // controls whether we leave it persisted (default) or clear on tab close.
    if (!remember) {
      window.addEventListener('beforeunload', () => { void supabase.auth.signOut(); }, { once: true });
    }
    navigate({ to: '/' });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight">UNDIVIDE</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Territory Intelligence Platform
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md bg-foreground/5 border border-border text-sm outline-none focus:border-foreground/40"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md bg-foreground/5 border border-border text-sm outline-none focus:border-foreground/40"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#e84118]"
            />
            Remember me for 30 days
          </label>
        </div>

        {err && (
          <div className="text-xs text-red-500 text-center" role="alert">{err}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md text-white text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ background: '#e84118' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-[10px] text-center text-muted-foreground">
          Invite-only · accounts managed by admin
        </p>
      </form>
    </main>
  );
}
