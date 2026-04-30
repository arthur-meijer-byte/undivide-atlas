import { useEffect, useRef } from 'react';
import { useMapState } from '../hooks/useMapState';
import { CITIES } from '../data/cities';

export default function Timeline() {
  const { selectedYear, setYear } = useMapState();
  const playRef = useRef<NodeJS.Timeout | null>(null);
  const playing = useRef(false);

  const totalEvents = (() => {
    let n = 0;
    CITIES.forEach((c) =>
      c.promoters.forEach((p) =>
        p.events_list.forEach((e) => {
          if (selectedYear === null || e.year === selectedYear) n++;
        })
      )
    );
    return n;
  })();

  const togglePlay = () => {
    if (playing.current) {
      if (playRef.current) clearInterval(playRef.current);
      playing.current = false;
    } else {
      playing.current = true;
      let y = selectedYear ?? 2015;
      playRef.current = setInterval(() => {
        y = y >= 2024 ? 2015 : y + 1;
        setYear(y);
      }, 1100);
    }
  };

  useEffect(() => () => { if (playRef.current) clearInterval(playRef.current); }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-4">
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[var(--undivide)] text-white flex items-center justify-center hover:opacity-90"
      >▶</button>
      <div className="text-sm font-mono w-16 text-center font-semibold">{selectedYear ?? 'ALL'}</div>
      <input
        type="range"
        min={2014}
        max={2024}
        value={selectedYear ?? 2014}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          setYear(v === 2014 ? null : v);
        }}
        className="flex-1 accent-[var(--undivide)]"
      />
      <button
        onClick={() => setYear(null)}
        className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
      >All years</button>
      <div className="text-xs text-gray-500 w-32 text-right">{totalEvents} events shown</div>
    </div>
  );
}
