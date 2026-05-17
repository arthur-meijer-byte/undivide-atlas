import { useState, useRef, useEffect } from 'react';
import { useActivity, timeAgo, type ActivityEntry } from '../hooks/useActivity';
import { useBookings } from '../hooks/useBookings';
import { usePromoters } from '../hooks/usePromoters';
import { useAgenda } from './AgendaPanel';

const USER_COLOR: Record<string, string> = {
  Arthur: 'bg-pink-600',
  James: 'bg-blue-600',
};

export default function ActivityFeed() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const entries = useActivity((s) => s.entries);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const openBooking = useBookings((s) => s.openModal);
  const openPromoters = usePromoters((s) => s.openPanel);
  const selectPromoter = usePromoters((s) => s.select);
  const openAgenda = useAgenda((s) => s.toggle);

  const handleClick = (e: ActivityEntry) => {
    setOpen(false);
    if (e.target === 'promoter') {
      selectPromoter(e.targetId);
      openPromoters();
    } else {
      const b = useBookings.getState().bookings.find((x) => x.id === e.targetId);
      if (b) openBooking(b, e.targetId);
      else openAgenda();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Recent activity"
        title="Recent activity"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-[340px] max-h-[440px] overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold">Recent activity</span>
            <span className="text-[10px] text-muted-foreground">{entries.length} / 30</span>
          </div>
          {entries.length === 0 ? (
            <div className="p-6 text-xs text-muted-foreground text-center">No activity yet — actions you and your teammate take will appear here.</div>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((e) => {
                const initial = e.user.charAt(0).toUpperCase() || '—';
                const color = USER_COLOR[e.user] ?? 'bg-gray-500';
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => handleClick(e)}
                      className="w-full text-left px-3 py-2.5 hover:bg-foreground/5 flex items-start gap-2.5"
                    >
                      <span className={`shrink-0 w-6 h-6 rounded-full ${color} text-white text-[10px] font-bold flex items-center justify-center`}>{initial}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs leading-snug">
                          <span className="font-semibold">{e.user}</span>
                          <span className="text-foreground/80"> {e.action}</span>
                          <span className="text-muted-foreground"> — </span>
                          <span className="text-foreground">{e.subject}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(e.at)}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
