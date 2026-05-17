import { useEffect, useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '../hooks/useUser';

interface Notification {
  id: string;
  type: string;
  message: string;
  link_type: string | null;
  link_id: string | null;
  created_by: string;
  for_user: string;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return 'Yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsBell() {
  const session = useUser((s) => s.session);
  const otherProfile = useUser((s) => s.otherProfile);
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) { setItems([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('for_user', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!cancelled && data) setItems(data as Notification[]);
    })();

    const ch = supabase
      .channel(`notif-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `for_user=eq.${session.user.id}` },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 50));
        },
      )
      .subscribe();

    return () => { cancelled = true; void supabase.removeChannel(ch); };
  }, [session]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const unread = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    if (!session || unread === 0) return;
    const ids = items.filter((i) => !i.read).map((i) => i.id);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase.from('notifications').update({ read: true }).in('id', ids);
  };

  const onClickItem = async (n: Notification) => {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    }
    // navigation deep links can be wired per link_type if needed
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open) void markAllRead(); }}
        aria-label="Notifications"
        className="relative w-8 h-8 flex items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-[#e84118] text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-[340px] max-h-[440px] overflow-auto bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold">
              {otherProfile ? `Updates from ${otherProfile.display_name}` : 'Updates'}
            </span>
            <span className="text-[10px] text-muted-foreground">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet</div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => onClickItem(n)}
                    className={`w-full text-left px-3 py-2 hover:bg-foreground/5 ${!n.read ? 'bg-foreground/[0.03]' : ''}`}
                  >
                    <div className="text-xs text-foreground">{n.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
