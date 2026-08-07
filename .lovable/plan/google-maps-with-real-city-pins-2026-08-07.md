# Google Maps with real city pins

Replace the stylised vector world map with a real Google Map, so every pin sits on the actual city location, stays clickable, and keeps the smooth zoom/pan behaviour you have today.

## What changes

**Real map, real positions**
- The map becomes a real Google Map (streets, country/city labels, coastlines) instead of the flat SVG atlas.
- Each of the cities in the database is placed at its real coordinates, so pins land on the city itself instead of drifting on a projected outline.
- Zooming and panning work as now: scroll/pinch to zoom, drag to pan, with pins scaling sensibly and clustering-free at world level.

**Pins keep all current behaviour**
- Colour by city status (Undivide / growth / emerging / new), size by scene/venue weight — same rules as today.
- Hover shows the existing tooltip card.
- Click opens the existing city detail panel (Overview, Promoters, Scene Intel, Pulse, Events, Notes) — no data is rebuilt, just re-wired to the new pins.
- Filter chips (brands), year timeline, and the Spotify reach toggle keep working and keep filtering pins.
- Booking pins from uploaded/added shows also render on the real map and open the booking modal.

**Promoter connection**
- Clicking a pin opens the city panel on the Promoters view when the city has promoters, so a pin click leads straight to promoter detail.
- Promoter cards in that panel keep the CRM link into the Promoters section.

## Setup you need to do

Google Maps needs a connection to Google's mapping service. A connect card will appear in chat; approving it takes a minute and no key needs to be pasted for the managed option. Nothing else is required from you.

## Decisions taken (tell me if you want otherwise)

- Style: clean light "roadmap" with muted greys/greens and reduced clutter (no business POIs), matching the current app look; dark mode gets a matching dark map style.
- The old SVG map is removed rather than kept as a second view, to avoid two maps to maintain.

## Technical notes

- Load the Maps JavaScript API in the browser with the connector's browser key, `loading=async` + a global callback; render the map inside a `ClientOnly`/lazy boundary so SSR is unaffected.
- New `GoogleMapView.tsx` replaces `MapView.tsx` as the renderer; `useMapState` stays the source of truth (`mapTransform` becomes zoom + center, `flyTo` uses `map.panTo`/`setZoom`), so `SearchBar`, `MapControls`, `Timeline`, `FilterChips`, `CompareModal` and `DetailPanel` continue to work untouched.
- Pins use `google.maps.Marker` with SVG path/scaled icons for the existing colour + size logic (no `mapId`, no AdvancedMarkerElement), plus a transparent hit area and the existing click-vs-drag guard is no longer needed since Maps handles it.
- Spotify reach mode recolours/resizes the same markers from the existing `getAllRosterReach` server function.
- Any geocoding needed to refine coarse city coordinates runs server-side through the connector gateway, one-off, results written back into `src/data/cities.ts`.
