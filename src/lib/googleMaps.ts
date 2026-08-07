/** Google Maps loader — single shared promise, browser key from the connector. */
let loaderPromise: Promise<typeof google.maps> | null = null;

const CALLBACK = '__undivideMapsReady';

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    if ((w.google as any)?.maps?.Map) {
      resolve((w.google as any).maps);
      return;
    }
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;
    if (!key) {
      reject(new Error('Google Maps browser key missing'));
      return;
    }
    w[CALLBACK] = () => resolve((window as any).google.maps);
    const s = document.createElement('script');
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${CALLBACK}` +
      (channel ? `&channel=${channel}` : '');
    s.async = true;
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });

  return loaderPromise;
}

/** Muted light style — no business POIs, soft land/water, keeps city + country labels. */
export const LIGHT_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e3ece2' }, { visibility: 'on' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f4f4f1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe0ea' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9c9c4' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
];

/** Matching dark style. */
export const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1f2430' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa4b2' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141821' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#232936' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111725' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3240' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3a4152' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
];
