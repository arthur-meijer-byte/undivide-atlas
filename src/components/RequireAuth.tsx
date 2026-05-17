import { useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useUser } from '../hooks/useUser';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useUser((s) => s.loading);
  const session = useUser((s) => s.session);
  const profile = useUser((s) => s.profile);
  const init = useUser((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: '/login' });
      return;
    }
    if (profile?.must_change_password && location.pathname !== '/set-password') {
      navigate({ to: '/set-password' });
    }
  }, [loading, session, profile, navigate, location.pathname]);

  if (loading || !session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (profile?.must_change_password && location.pathname !== '/set-password') {
    return null;
  }
  return <>{children}</>;
}
