import { useState, useRef, useEffect } from 'react';
import { useAgenda } from './AgendaPanel';
import { usePromoters } from '../hooks/usePromoters';
import { useUser } from '../hooks/useUser';
import UploadEventsButton from './UploadEventsButton';
import ThemeToggle from './ThemeToggle';
import ActivityFeed from './ActivityFeed';

type ViewKey = 'map' | 'agenda' | 'promoters';

function Icon({ name }: { name: ViewKey | 'upload' }) {
  const props = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'map') return (<svg {...props}><polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21" /><line x1="8" y1="3" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="21" /></svg>);
  if (name === 'agenda') return (<svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
  if (name === 'promoters') return (<svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
  return (<svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
}

export default function TopNav() {
  const agendaOpen = useAgenda((s) => s.open);
  const toggleAgenda = useAgenda((s) => s.toggle);
  const closeAgenda = useAgenda((s) => s.close);
  const promotersOpen = usePromoters((s) => s.panelOpen);
  const openPromoters = usePromoters((s) => s.openPanel);
  const closePromoters = usePromoters((s) => s.closePanel);

  const active: ViewKey = promotersOpen ? 'promoters' : agendaOpen ? 'agenda' : 'map';
  const goMap = () => { closeAgenda(); closePromoters(); };
  const goAgenda = () => { closePromoters(); toggleAgenda(); };
  const goPromoters = () => { closeAgenda(); openPromoters(); };

  const [mobileOpen, setMobileOpen] = useState(false);

  const items: { key: ViewKey; label: string; onClick: () => void }[] = [
    { key: 'map', label: 'Map', onClick: goMap },
    { key: 'agenda', label: 'Agenda', onClick: goAgenda },
    { key: 'promoters', label: 'Promoters', onClick: goPromoters },
  ];

  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-1">
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1 mr-1">
        {items.map((it) => (
          <NavBtn key={it.key} active={active === it.key} onClick={it.onClick}>
            <Icon name={it.key} />
            <span>{it.label}</span>
          </NavBtn>
        ))}
        <div className="relative">
          <UploadEventsButton
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-foreground/70 hover:text-foreground hover:bg-foreground/5"
            icon=""
            label="Upload"
          />
        </div>
      </nav>

      {/* Mobile hamburger */}
      <div className="md:hidden relative">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Open menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground/70 hover:bg-foreground/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="absolute right-0 mt-1 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {items.map((it) => (
              <button
                key={it.key}
                onClick={() => { setMobileOpen(false); it.onClick(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${active === it.key ? 'text-foreground bg-foreground/5' : 'text-foreground/70'} hover:bg-foreground/10`}
              >
                <Icon name={it.key} /><span>{it.label}</span>
              </button>
            ))}
            <div className="border-t border-border my-1" />
            <div className="px-3 py-1">
              <UploadEventsButton
                className="w-full flex items-center gap-2 px-0 py-1 text-xs text-foreground/70 hover:text-foreground"
                icon=""
                label="Upload"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mx-1 h-6 w-px bg-border" />
      <ThemeToggleMini />
      <UserMenu />
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${active ? 'text-foreground bg-foreground/10 font-semibold' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
    >
      {children}
    </button>
  );
}

// Smaller variant of ThemeToggle — icon only
function ThemeToggleMini() {
  // Reuse existing component but shrink container
  return (
    <div className="[&>button]:w-8 [&>button]:h-8 [&>button]:shadow-none [&>button]:bg-transparent [&>button:hover]:bg-foreground/10">
      <ThemeToggle />
    </div>
  );
}

function UserMenu() {
  const { user, setUser, logout } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground hidden sm:inline">Logged out</span>
        {(['Arthur', 'James'] as const).map((u) => (
          <button key={u} onClick={() => setUser(u)} className="text-xs px-2 py-1 rounded text-foreground/70 hover:bg-foreground/10">
            {u}
          </button>
        ))}
      </div>
    );
  }

  const initial = user.charAt(0);
  const color = user === 'Arthur' ? 'bg-pink-600' : 'bg-blue-600';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-foreground/10"
      >
        <span className={`w-6 h-6 rounded-full ${color} text-white text-[11px] font-bold flex items-center justify-center`}>{initial}</span>
        <span className="text-xs hidden sm:inline">{user}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-background border border-border rounded-lg shadow-lg py-2 min-w-[180px] text-xs">
          <div className="px-3 py-1.5 text-muted-foreground">Logged in as <span className="text-foreground font-medium">{user}</span></div>
          <div className="border-t border-border my-1" />
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Switch user</div>
          {(['Arthur', 'James'] as const).map((u) => (
            <button
              key={u}
              onClick={() => { setUser(u); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-foreground/5 ${user === u ? 'font-semibold text-foreground' : 'text-foreground/70'}`}
            >
              {u}
            </button>
          ))}
          <div className="border-t border-border my-1" />
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-red-500 hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
