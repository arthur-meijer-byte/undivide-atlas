import { useMapState } from '../hooks/useMapState';

export default function MapControls() {
  const { mapTransform, setTransform, heatmapOn, setHeatmap } = useMapState();
  const zoom = (delta: number) => {
    const next = Math.min(10, Math.max(0.35, mapTransform.scale * delta));
    setTransform({ ...mapTransform, scale: next });
  };
  const reset = () => setTransform({ scale: 1, x: 0, y: 0 });

  // Map/Heatmap toggle and zoom controls hidden per request.
  void mapTransform; void setTransform; void heatmapOn; void setHeatmap; void zoom; void reset;
  return null;
}
