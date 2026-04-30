import { useMapState } from '../hooks/useMapState';

export default function MapControls() {
  const { mapTransform, setTransform, heatmapOn, setHeatmap } = useMapState();
  const zoom = (delta: number) => {
    const next = Math.min(10, Math.max(0.35, mapTransform.scale * delta));
    setTransform({ ...mapTransform, scale: next });
  };
  const reset = () => setTransform({ scale: 1, x: 0, y: 0 });

  return (
    <>
      <div className="absolute right-4 bottom-[110px] z-20 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-[var(--shadow-float)] p-1 flex">
          <button
            onClick={() => setHeatmap(false)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${!heatmapOn ? 'bg-gray-100 font-semibold' : 'text-gray-500'}`}
          >Map</button>
          <button
            onClick={() => setHeatmap(true)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${heatmapOn ? 'bg-gray-100 font-semibold' : 'text-gray-500'}`}
          >Heatmap</button>
        </div>
      </div>
      <div className="absolute right-4 bottom-[160px] z-20 flex flex-col bg-white rounded-lg shadow-[var(--shadow-float)] overflow-hidden">
        <button onClick={() => zoom(1.4)} className="w-9 h-9 hover:bg-gray-50 text-lg">+</button>
        <div className="h-px bg-gray-200" />
        <button onClick={() => zoom(1 / 1.4)} className="w-9 h-9 hover:bg-gray-50 text-lg">−</button>
        <div className="h-px bg-gray-200" />
        <button onClick={reset} className="w-9 h-9 hover:bg-gray-50 text-base" title="Reset view">⊙</button>
      </div>
    </>
  );
}
