import { STATUS_COLORS, STATUS_LABEL } from '../data/cities';

export default function Legend() {
  return (
    <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-[var(--shadow-float)] px-3 py-2.5 text-xs">
      <div className="font-semibold mb-1.5 text-gray-700">Legend</div>
      {(['undivide','growth','emerging','new'] as const).map((k) => (
        <div key={k} className="flex items-center gap-2 py-0.5 text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[k] }} />
          {STATUS_LABEL[k]}
        </div>
      ))}
    </div>
  );
}
