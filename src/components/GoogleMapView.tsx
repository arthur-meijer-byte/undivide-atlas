import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { CITIES, STATUS_COLORS, type City } from '../data/cities';
import { useMapState } from '../hooks/useMapState';
import { useBookings } from '../hooks/useBookings';
import { useTheme } from '../hooks/useTheme';
import { getAllRosterReach } from '@/lib/market.functions';
import { loadGoogleMaps, LIGHT_STYLE, DARK_STYLE } from '@/lib/googleMaps';

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
  return city.promoters.some((p) => re.test(p.name) || p.events_list.some((e) => re.test(e.name)));
}

function matchesFilter(city: City, activeBrands: string[]): boolean {
  if (activeBrands.length === 0) return true;
  return activeBrands.some((b) => cityMatchesBrand(city, b));
}

function inYear(city: City, year: number | null): boolean {
  if (year === null) return true;
  return city.promoters.some((p) => p.events_list.some((e) => e.year === year));
}

/** Same weighting rules as the previous vector map. */
function pinStyle(
  city: City,
  spotifyMode: boolean,
  reach: number,
  reachMax: number,
): { color: string; scale: number } {
  const maxCap = city.clubs.reduce((m, c) => Math.max(m, c.capacity), 0);
  const heat =
    maxCap >= 6000 ? 1.8 : maxCap >= 3000 ? 1.45 : maxCap >= 1500 ? 1.2 : maxCap >= 800 ? 1.0 : maxCap >= 200 ? 0.82 : 0.7;
  if (spotifyMode) {
    const t = Math.min(1, Math.log10(1 + reach) / Math.log10(1 + (reachMax || 1)));
    return {
      color: t < 0.05 ? '#9ca3af' : t < 0.35 ? '#3b82f6' : t < 0.7 ? '#10b981' : '#ef4444',
      scale: 5 + t * 12,
    };
  }
  const boost = city.status === 'undivide' ? 1.15 : 1;
  return { color: STATUS_COLORS[city.status], scale: 5 + heat * boost * 5 };
}

export default function GoogleMapView() {
  const {
    activeBrands,
    selectedYear,
    setCity,
    setHover,
    setTransform,
    spotifyReachOn,
    setSpotifyReach,
    flyTarget,
  } = useMapState();
  const openBookingModal = useBookings((s) => s.openModal);
  const bookings = useBookings((s) => s.bookings);
  const theme = useTheme((s) => s.theme);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const cityMarkers = useRef<google.maps.Marker[]>([]);
  const bookingMarkers = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReach = useServerFn(getAllRosterReach);
  const { data: reachData } = useQuery({
    queryKey: ['all-roster-reach'],
    queryFn: () => fetchReach({}),
    enabled: spotifyReachOn,
    staleTime: 60 * 60 * 1000,
  });
  const reachMax = reachData ? Math.max(1, ...Object.values(reachData.byCity).map((v) => v.total)) : 1;

  // Init map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: { lat: 30, lng: 8 },
          zoom: 3,
          minZoom: 2,
          maxZoom: 18,
          gestureHandling: 'greedy',
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: theme === 'dark' ? DARK_STYLE : LIGHT_STYLE,
        });
        mapRef.current = map;
        map.addListener('zoom_changed', () => {
          const c = map.getCenter();
          setTransform({ scale: map.getZoom() ?? 3, x: c?.lng() ?? 0, y: c?.lat() ?? 0 });
        });
        map.addListener('click', () => setHover(null));
        setReady(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Map failed to load'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme restyle
  useEffect(() => {
    mapRef.current?.setOptions({ styles: theme === 'dark' ? DARK_STYLE : LIGHT_STYLE });
  }, [theme, ready]);

  // Fly to a city (search bar / bookings list)
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.panTo({ lat: flyTarget.lat, lng: flyTarget.lng });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 3, 9));
  }, [flyTarget, ready]);

  const visible = useMemo(
    () => CITIES.filter((c) => matchesFilter(c, activeBrands) && inYear(c, selectedYear)),
    [activeBrands, selectedYear],
  );
  const visibleBookings = useMemo(
    () => (activeBrands.length === 0 ? bookings : bookings.filter((b) => b.brand && activeBrands.includes(b.brand))),
    [bookings, activeBrands],
  );

  // City pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    cityMarkers.current.forEach((m) => m.setMap(null));
    cityMarkers.current = visible.map((city) => {
      const { color, scale } = pinStyle(city, spotifyReachOn, reachData?.byCity[city.id]?.total ?? 0, reachMax);
      const marker = new google.maps.Marker({
        map,
        position: { lat: city.lat, lng: city.lng },
        title: `${city.name}, ${city.country}`,
        zIndex: city.status === 'undivide' ? 30 : 20,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: color,
          fillOpacity: 0.55,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          strokeOpacity: 0.9,
        },
      });
      marker.addListener('click', () => {
        setHover(null);
        setCity(city);
      });
      marker.addListener('mouseover', (e: google.maps.MapMouseEvent) => {
        const de = (e as unknown as { domEvent?: MouseEvent }).domEvent;
        setHover({ city, x: de?.clientX ?? 0, y: de?.clientY ?? 0 });
      });
      marker.addListener('mouseout', () => setHover(null));
      return marker;
    });
    return () => {
      cityMarkers.current.forEach((m) => m.setMap(null));
      cityMarkers.current = [];
    };
  }, [visible, ready, spotifyReachOn, reachData, reachMax, setCity, setHover]);

  // Booking pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    bookingMarkers.current.forEach((m) => m.setMap(null));
    bookingMarkers.current = visibleBookings.map((b) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: b.lat, lng: b.lng },
        zIndex: 40,
        label: { text: b.city, color: theme === 'dark' ? '#f8fafc' : '#111827', fontSize: '11px', fontWeight: '700' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#111827',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          labelOrigin: new google.maps.Point(0, -3),
        },
      });
      marker.addListener('click', () => openBookingModal(undefined, b.id));
      return marker;
    });
    return () => {
      bookingMarkers.current.forEach((m) => m.setMap(null));
      bookingMarkers.current = [];
    };
  }, [visibleBookings, ready, theme, openBookingModal]);

  return (
    <div className="absolute inset-0 bg-map-ocean">
      <div ref={containerRef} className="absolute inset-0" />
      {error && (
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-700 bg-white/70">
          {error}
        </div>
      )}
      <button
        onClick={() => setSpotifyReach(!spotifyReachOn)}
        className={`absolute top-3 right-3 z-20 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md transition-colors ${
          spotifyReachOn ? 'bg-[#1DB954] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title="Toggle Spotify reach heatmap (roster followers per market)"
      >
        {spotifyReachOn ? '● Spotify reach' : '○ Spotify reach'}
      </button>
    </div>
  );
}
