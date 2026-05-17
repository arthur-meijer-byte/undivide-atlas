import { useMapState, type BrandFilter } from '../hooks/useMapState';

const CHIPS: { key: BrandFilter; dot: string }[] = [
  { key: 'Hospitality', dot: 'bg-[#e84118]' },
  { key: 'UKF',         dot: 'bg-blue-600' },
  { key: 'Korsakov',    dot: 'bg-purple-600' },
  { key: 'The Blast',   dot: 'bg-pink-500' },
  { key: 'RUN',         dot: 'bg-green-600' },
  { key: 'Independent', dot: 'bg-gray-400' },
];

export default function FilterChips() {
  const { activeBrands, toggleBrand, clearBrands } = useMapState();
  const allActive = activeBrands.length === 0;
  return (
    <div className="absolute top-[68px] left-4 z-20 max-w-[calc(100%-2rem)] md:w-[460px] overflow-x-auto thin-scroll">
      <div className="flex gap-2 pb-1 flex-nowrap">
        <button
          onClick={clearBrands}
          className={`px-3 py-1.5 rounded-[20px] text-xs whitespace-nowrap shadow-[var(--shadow-float)] transition-colors ${
            allActive ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {CHIPS.map((c) => {
          const active = activeBrands.includes(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggleBrand(c.key)}
              className={`px-3 py-1.5 rounded-[20px] text-xs whitespace-nowrap shadow-[var(--shadow-float)] transition-colors flex items-center gap-1.5 ${
                active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
              {c.key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
