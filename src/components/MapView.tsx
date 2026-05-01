import { useEffect, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule } from 'react-simple-maps';
import { CITIES, STATUS_COLORS, type City } from '../data/cities';
import { useMapState } from '../hooks/useMapState';
import { useBookings } from '../hooks/useBookings';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function matchesFilter(city: City, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'undivide') return city.status === 'undivide';
  if (filter === 'market') return city.status === 'new' || city.status === 'emerging' || city.status === 'growth';
  // Match against dominant + secondary subgenres + headline genre string.
  const hay = [
    city.dominant_genre,
    city.market.dominant_subgenre,
    ...city.market.secondary_subgenres,
  ].join(' ').toLowerCase().replace(/\s+/g, '');
  if (filter === 'jumpup') return hay.includes('jumpup');
  return hay.includes(filter);
}

function inYear(city: City, year: number | null): boolean {
  if (year === null) return true;
  return city.promoters.some((p) => p.events_list.some((e) => e.year === year));
}

/** Pin with click-vs-drag detection (d3-zoom inside ZoomableGroup eats click events). */
function usePinClick(onClick: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; },
    onPointerUp: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        e.stopPropagation();
        onClick();
      }
    },
  };
}

interface PinProps { city: City; onClick: () => void; onHover: (e: { x: number; y: number } | null) => void; zoom: number; }
function Pin({ city, onClick, onHover, zoom }: PinProps) {
  const color = STATUS_COLORS[city.status];
  // Size by largest venue capacity — bigger crowds = more prominent dot.
  const maxCap = city.clubs.reduce((m, c) => Math.max(m, c.capacity), 0);
  // Scale: 200 cap -> 0.85, 1000 -> 1.05, 3000 -> 1.35, 6000+ -> 1.7
  const capScale = maxCap >= 6000 ? 1.7
    : maxCap >= 3000 ? 1.35
    : maxCap >= 1500 ? 1.15
    : maxCap >= 800 ? 1.0
    : maxCap >= 200 ? 0.85
    : 0.75;
  const baseSize = (city.status === 'undivide' ? 1.15 : 1) * capScale;
  const s = baseSize / Math.max(zoom, 0.35);
  const handlers = usePinClick(onClick);

  const r = 2.6 * s;          // dot radius (small, subtle)
  const glow = 6 * s;         // outer neon halo
  const hit = 9 * s;          // invisible touch target

  return (
    <Marker coordinates={[city.lng, city.lat]}>
      <g
        style={{ cursor: 'pointer' }}
        {...handlers}
        onMouseEnter={(e) => onHover({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onHover({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => onHover(null)}
      >
        {/* hit target */}
        <circle r={hit} fill="transparent" />
        {/* neon glow halo */}
        <circle r={glow} fill={color} opacity={0.28} pointerEvents="none" />
        <circle r={glow * 0.65} fill={color} opacity={0.45} pointerEvents="none" />
        {/* solid neon dot with thin white ring */}
        <circle r={r} fill={color} stroke="#fff" strokeWidth={0.6 * s} pointerEvents="none" />
      </g>
    </Marker>
  );
}

function BookingPin({ lat, lng, onClick, label, zoom }: { lat: number; lng: number; onClick: () => void; label: string; zoom: number }) {
  const handlers = usePinClick(onClick);
  const s = 1 / Math.max(zoom, 0.35);
  const r = 2.6 * s;
  const glow = 6 * s;
  return (
    <Marker coordinates={[lng, lat]}>
      <g style={{ cursor: 'pointer' }} {...handlers}>
        <circle r={9 * s} fill="transparent" />
        <circle r={glow} fill="#ffffff" opacity={0.25} pointerEvents="none" />
        <circle r={r} fill="#111827" stroke="#fff" strokeWidth={0.6 * s} pointerEvents="none" />
        <text textAnchor="middle" y={-(r + 3 * s)} fill="#111827" fontSize={7 * s} fontWeight={700}
          style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 2 * s }} pointerEvents="none">
          {label}
        </text>
      </g>
    </Marker>
  );
}

export default function MapView() {
  const { activeFilter, selectedYear, setCity, setHover, mapTransform, setTransform } = useMapState();
  const openBookingModal = useBookings((s) => s.openModal);
  const bookings = useBookings((s) => s.bookings);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => {
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect();
        setSize({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const visible = CITIES.filter((c) => matchesFilter(c, activeFilter) && inYear(c, selectedYear));

  return (
    <div ref={wrapRef} className="absolute inset-0 bg-map-ocean">
      <ComposableMap
        projection="geoNaturalEarth1"
        width={size.w}
        height={size.h}
        projectionConfig={{ scale: Math.min(size.w / 6.3, size.h / 3.2) }}
        style={{ width: '100%', height: '100%', background: 'var(--map-ocean)' }}
      >
        <ZoomableGroup
          center={[0, 20]}
          zoom={mapTransform.scale}
          minZoom={0.35}
          maxZoom={10}
          onMoveEnd={(pos) => setTransform({ scale: pos.zoom, x: pos.coordinates[0], y: pos.coordinates[1] })}
        >
          <Graticule stroke="rgba(0,0,0,0.05)" strokeWidth={0.5} />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--map-land)"
                  stroke="var(--map-stroke)"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'var(--map-land)' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {visible.map((city) => (
            <Pin
              key={city.id}
              city={city}
              zoom={mapTransform.scale}
              onClick={() => setCity(city)}
              onHover={(p) => setHover(p ? { city, x: p.x, y: p.y } : null)}
            />
          ))}
          {bookings.map((b) => (
            <BookingPin
              key={b.id}
              lat={b.lat}
              lng={b.lng}
              label={b.city}
              zoom={mapTransform.scale}
              onClick={() => openBookingModal(undefined, b.id)}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
