import { create } from 'zustand';
import type { City } from '../data/cities';

export type BrandFilter = 'Hospitality' | 'UKF' | 'Korsakov' | 'The Blast' | 'RUN' | 'Independent';
// Kept for backwards compat with any callers; not used directly anymore.
export type FilterKey = 'all' | BrandFilter;

interface MapState {
  activeBrands: BrandFilter[];
  selectedYear: number | null;
  heatmapOn: boolean;
  currentCity: City | null;
  currentTab: number;
  compareOpen: boolean;
  compareCityA: string | null;
  compareCityB: string | null;
  mapTransform: { scale: number; x: number; y: number };
  hoverCity: { city: City; x: number; y: number } | null;
  toggleBrand: (b: BrandFilter) => void;
  clearBrands: () => void;
  setYear: (y: number | null) => void;
  setHeatmap: (b: boolean) => void;
  setCity: (c: City | null) => void;
  setTab: (n: number) => void;
  openCompare: (a?: string, b?: string) => void;
  closeCompare: () => void;
  setCompareA: (id: string) => void;
  setCompareB: (id: string) => void;
  setTransform: (t: { scale: number; x: number; y: number }) => void;
  flyTo: (lat: number, lng: number) => void;
  setHover: (h: MapState['hoverCity']) => void;
}

export const useMapState = create<MapState>((set) => ({
  activeBrands: [],
  selectedYear: null,
  heatmapOn: false,
  currentCity: null,
  currentTab: 0,
  compareOpen: false,
  compareCityA: null,
  compareCityB: null,
  mapTransform: { scale: 1, x: 0, y: 0 },
  hoverCity: null,
  toggleBrand: (b) =>
    set((s) => ({
      activeBrands: s.activeBrands.includes(b)
        ? s.activeBrands.filter((x) => x !== b)
        : [...s.activeBrands, b],
    })),
  clearBrands: () => set({ activeBrands: [] }),
  setYear: (y) => set({ selectedYear: y }),
  setHeatmap: (b) => set({ heatmapOn: b }),
  setCity: (c) => set({ currentCity: c, currentTab: 0, hoverCity: null }),
  setTab: (n) => set({ currentTab: n }),
  openCompare: (a, b) => set((s) => ({
    compareOpen: true,
    compareCityA: a ?? s.compareCityA ?? (s.currentCity?.id ?? null),
    compareCityB: b ?? s.compareCityB,
  })),
  closeCompare: () => set({ compareOpen: false }),
  setCompareA: (id) => set({ compareCityA: id }),
  setCompareB: (id) => set({ compareCityB: id }),
  setTransform: (t) => set({ mapTransform: t }),
  flyTo: (lat, lng) => set({ mapTransform: { scale: 4, x: -lng * 8, y: lat * 8 } }),
  setHover: (h) => set({ hoverCity: h }),
}));
