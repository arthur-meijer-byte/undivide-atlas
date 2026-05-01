import { useMapState, type FilterKey } from '../hooks/useMapState';

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'undivide', label: 'Undivide only' },
];

export default function FilterChips() {
  const { activeFilter, setFilter } = useMapState();
  return (
    <div className="absolute top-[68px] left-4 z-20 w-[380px] overflow-x-auto thin-scroll">
      <div className="flex gap-2 pb-1">
        {CHIPS.map((c) => {
          const active = activeFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`px-3 py-1.5 rounded-[20px] text-xs whitespace-nowrap shadow-[var(--shadow-float)] transition-colors ${
                active ? 'bg-[var(--undivide)] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
