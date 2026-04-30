import { useMemo, useState, useRef, useEffect } from 'react';
import { CITIES } from '../data/cities';
import { useMapState } from '../hooks/useMapState';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { setCity, flyTo } = useMapState();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return { cities: [], promoters: [], artists: [], venues: [] };
    const needle = q.toLowerCase();
    const cities = CITIES.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.country.toLowerCase().includes(needle),
    ).slice(0, 6);
    const promoters: { city: typeof CITIES[number]; name: string }[] = [];
    const artists: { city: typeof CITIES[number]; name: string }[] = [];
    const venues: { city: typeof CITIES[number]; name: string }[] = [];
    CITIES.forEach((c) => {
      c.clubs.forEach((club) => {
        if (club.name.toLowerCase().includes(needle) && !venues.find((v) => v.name === club.name && v.city.id === c.id))
          venues.push({ city: c, name: club.name });
      });
      c.promoters.forEach((p) => {
        if (p.name.toLowerCase().includes(needle)) promoters.push({ city: c, name: p.name });
        p.lineup.forEach((a) => {
          if (a.toLowerCase().includes(needle) && !artists.find((x) => x.name === a && x.city.id === c.id))
            artists.push({ city: c, name: a });
        });
      });
    });
    return { cities, promoters: promoters.slice(0, 5), artists: artists.slice(0, 6), venues: venues.slice(0, 5) };
  }, [q]);

  const pick = (cityId: string) => {
    const city = CITIES.find((c) => c.id === cityId);
    if (city) {
      setCity(city);
      flyTo(city.lat, city.lng);
      setOpen(false);
      setQ('');
    }
  };

  return (
    <div ref={ref} className="absolute top-4 left-4 z-30 w-[380px]">
      <div className="bg-white rounded-lg shadow-[var(--shadow-float)] flex items-center px-3 py-2.5 gap-3">
        <span className="font-bold tracking-wider text-[var(--undivide)]">UNDIVIDE</span>
        <span className="h-5 w-px bg-gray-300" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search cities, promoters, artists…"
          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
        />
      </div>
      {open && q.trim() && (
        <div className="mt-2 bg-white rounded-lg shadow-[var(--shadow-panel)] max-h-[360px] overflow-y-auto thin-scroll text-sm">
          {results.cities.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-400">Cities</div>
              {results.cities.map((c) => (
                <button key={c.id} onClick={() => pick(c.id)}
                  className="w-full flex justify-between px-3 py-2 hover:bg-gray-50 text-left">
                  <span>{c.name}</span><span className="text-gray-400">{c.country}</span>
                </button>
              ))}
            </div>
          )}
          {results.promoters.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-400">Promoters</div>
              {results.promoters.map((p, i) => (
                <button key={i} onClick={() => pick(p.city.id)}
                  className="w-full flex justify-between px-3 py-2 hover:bg-gray-50 text-left">
                  <span>{p.name}</span><span className="text-gray-400">{p.city.name}</span>
                </button>
              ))}
            </div>
          )}
          {results.artists.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-400">Artists</div>
              {results.artists.map((a, i) => (
                <button key={i} onClick={() => pick(a.city.id)}
                  className="w-full flex justify-between px-3 py-2 hover:bg-gray-50 text-left">
                  <span>{a.name}</span><span className="text-gray-400">{a.city.name}</span>
                </button>
              ))}
            </div>
          )}
          {results.cities.length + results.promoters.length + results.artists.length === 0 && (
            <div className="px-3 py-4 text-gray-400 text-center">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
