import { useEffect, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule } from 'react-simple-maps';
import { CITIES, STATUS_COLORS, type City } from '../data/cities';
import { useMapState } from '../hooks/useMapState';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function genreKey(g: City['genre']): string {
  return g.toLowerCase().replace(/\s+/g, '');
}

function matchesFilter(city: City, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'undivide') return city.status === 'undivide';
  if (filter === 'market') return city.status === 'new' || city.status === 'emerging' || city.status === 'growth';
  return genreKey(city.genre) === filter || (filter === 'jumpup' && city.genre === 'Jump Up');
}

function inYear(city: City, year: number | null): boolean {
  if (year === null) return true;
  return city.promoters.some((p) => p.events_list.some((e) => e.year === year));
}

interface PinProps { city: City; onClick: () => void; onHover: (e: { x: number; y: number } | null) => void; heatmap: boolean; }

function Pin({ city, onClick, onHover, heatmap }: PinProps) {
  const color = STATUS_COLORS[city.status];
  const sizeMap = { undivide: 14, growth: 11, emerging: 9, new: 7 } as const;
  const r = sizeMap[city.status];

  if (heatmap) {
    const totalEvents = city.promoters.reduce((a, p) => a + p.events, 0);
    const blob = Math.min(60, 14 + totalEvents * 0.8);
    return (
      <Marker coordinates={[city.lng, city.lat]}>
        <circle r={blob} fill={color} opacity={0.35} style={{ filter: 'blur(8px)' }} />
        <circle r={6} fill={color} stroke="#fff" strokeWidth={1.5}
          style={{ cursor: 'pointer' }}
          onClick={onClick}
          onMouseEnter={(e) => onHover({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => onHover(null)}
        />
      </Marker>
    );
  }

  return (
    <Marker coordinates={[city.lng, city.lat]}>
      <g
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        onMouseEnter={(e) => onHover({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onHover({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => onHover(null)}
      >
        {city.status === 'undivide' && (
          <circle r={r * 1.6} fill={color} className="pin-pulse" opacity={0.5} />
        )}
        {city.status === 'undivide' ? (
          <>
            <path
              d={`M0,-${r * 1.6} C ${r}, -${r * 1.6} ${r}, 0 0, ${r * 0.8} C -${r}, 0 -${r}, -${r * 1.6} 0, -${r * 1.6} Z`}
              fill={color}
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle cy={-r * 0.6} r={r * 0.32} fill="#fff" />
          </>
        ) : (
          <circle r={r} fill={color} stroke="#fff" strokeWidth={1.5} />
        )}
      </g>
    </Marker>
  );
}

export default function MapView() {
  const { activeFilter, selectedYear, heatmapOn, setCity, setHover, mapTransform, setTransform } = useMapState();
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
              heatmap={heatmapOn}
              onClick={() => setCity(city)}
              onHover={(p) => setHover(p ? { city, x: p.x, y: p.y } : null)}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
