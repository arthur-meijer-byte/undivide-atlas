import { useEffect, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule } from 'react-simple-maps';
import { CITIES, STATUS_COLORS, type City } from '../data/cities';
import { useMapState } from '../hooks/useMapState';
import { useBookings } from '../hooks/useBookings';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const BRAND_PATTERNS: Record<string, RegExp> = {
  Hospitality: /hospitalit/i,
  UKF: /\bukf\b/i,
  Korsakov: /korsakov/i,
  'The Blast': /\bthe\s*blast\b|\bblast\b/i,
  RUN: /\brun\b/i,
};

function cityMatchesBrand(city: City, brand: string): boolean {
  if (brand === 'Independent') {
    return city.promoters.some((p) => p.type === 'independent' || p.type === 'local');
  }
  const re = BRAND_PATTERNS[brand];
  if (!re) return false;
  return city.promoters.some(
    (p) => re.test(p.name) || p.events_list.some((e) => re.test(e.name)),
  );
}

function matchesFilter(city: City, activeBrands: string[]): boolean {
  if (activeBrands.length === 0) return true;
  return activeBrands.some((b) => cityMatchesBrand(city, b));
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
  // Heat intensity from largest venue capacity — Snapchat heatmap style.
  const maxCap = city.clubs.reduce((m, c) => Math.max(m, c.capacity), 0);
  // Heat tier: bigger crowds = bigger softer blob
  const heat = maxCap >= 6000 ? 1.8
    : maxCap >= 3000 ? 1.45
    : maxCap >= 1500 ? 1.2
    : maxCap >= 800 ? 1.0
    : maxCap >= 200 ? 0.82
    : 0.7;
  const undivideBoost = city.status === 'undivide' ? 1.15 : 1;
  // Blobs stay roughly constant on screen but grow slightly on zoom-out for that cluster feel.
  const z = Math.max(zoom, 0.35);
  const s = (heat * undivideBoost) / Math.pow(z, 0.7);
  const handlers = usePinClick(onClick);

  // Unique gradient id per city
  const gradId = `heat-${city.id}`;
  const blurId = `blur-${city.id}`;

  const blobR = 18 * s;     // big soft heat blob
  const coreR = 2.2 * s;    // tiny solid core
  const hit = Math.max(blobR * 0.6, 10 * s);

  return (
    <Marker coordinates={[city.lng, city.lat]}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.75" />
          <stop offset="35%" stopColor={color} stopOpacity="0.4" />
          <stop offset="70%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={1.2 * s} />
        </filter>
      </defs>
      <g
        style={{ cursor: 'pointer' }}
        {...handlers}
        onMouseEnter={(e) => onHover({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onHover({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => onHover(null)}
      >
        {/* invisible hit target */}
        <circle r={hit} fill="transparent" />
        {/* big soft heat blob */}
        <circle r={blobR} fill={`url(#${gradId})`} filter={`url(#${blurId})`} pointerEvents="none" />
        {/* tiny bright core */}
        <circle r={coreR} fill={color} opacity={0.78} pointerEvents="none" />
      </g>
    </Marker>
  );
}

function BookingPin({ lat, lng, onClick, label, zoom }: { lat: number; lng: number; onClick: () => void; label: string; zoom: number }) {
  const handlers = usePinClick(onClick);
  const z = Math.max(zoom, 0.35);
  const s = 1 / Math.pow(z, 0.7);
  const gradId = `heat-booking-${label.replace(/\s+/g, '-')}`;
  const blobR = 16 * s;
  const coreR = 2 * s;
  return (
    <Marker coordinates={[lng, lat]}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g style={{ cursor: 'pointer' }} {...handlers}>
        <circle r={Math.max(blobR * 0.6, 10 * s)} fill="transparent" />
        <circle r={blobR} fill={`url(#${gradId})`} pointerEvents="none" />
        <circle r={coreR} fill="#111827" stroke="#fff" strokeWidth={0.6 * s} pointerEvents="none" />
        <text textAnchor="middle" y={-(coreR + 4 * s)} fill="#111827" fontSize={6 * s} fontWeight={700}
          style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 1.8 * s }} pointerEvents="none">
          {label}
        </text>
      </g>
    </Marker>
  );
}

export default function MapView() {
  const { activeBrands, selectedYear, setCity, setHover, mapTransform, setTransform } = useMapState();
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

  const visible = CITIES.filter((c) => matchesFilter(c, activeBrands) && inYear(c, selectedYear));
  const visibleBookings = activeBrands.length === 0
    ? bookings
    : bookings.filter((b) => b.brand && activeBrands.includes(b.brand));

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
          maxZoom={20}
          onMove={(pos: any) => {
            // Live update during wheel/drag so pins resize smoothly. d3-zoom already
            // anchors wheel zoom on the pointer, so this also makes cursor-targeted zoom feel right.
            setTransform({ scale: pos.zoom, x: mapTransform.x, y: mapTransform.y });
          }}
          onMoveEnd={(pos: any) => {
            const coords = pos.coordinates ?? [mapTransform.x, mapTransform.y];
            setTransform({ scale: pos.zoom, x: coords[0], y: coords[1] });
          }}
          filterZoomEvent={(evt: any) => {
            // Dampen wheel delta for smoother, slower zoom increments.
            if (evt.type === 'wheel') {
              try { evt.deltaY = evt.deltaY * 0.35; } catch { /* read-only — ignore */ }
            }
            return true;
          }}
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
          {visibleBookings.map((b) => (
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
