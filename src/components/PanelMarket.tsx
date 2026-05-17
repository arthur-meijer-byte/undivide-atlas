import { SCENE_LABEL, type City, type SceneStrength } from '../data/cities';

const Bar = ({ label, value, max, suffix = '' }: { label: string; value: number; max: number; suffix?: string }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[var(--undivide)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const STRENGTH_COLOR: Record<SceneStrength, string> = {
  legendary: 'bg-purple-100 text-purple-700',
  strong: 'bg-emerald-100 text-emerald-700',
  growing: 'bg-amber-100 text-amber-700',
  emerging: 'bg-blue-100 text-blue-700',
  untapped: 'bg-gray-100 text-gray-600',
};

export default function PanelMarket({ city }: { city: City }) {
  const m = city.market;

  return (
    <div className="p-4 space-y-4 text-sm">
      {/* Scene strength + dominant subgenre */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold ${STRENGTH_COLOR[m.dnb_scene_strength]}`}>
          {SCENE_LABEL[m.dnb_scene_strength]} scene
        </span>
        <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-[var(--undivide)] text-white">
          {m.dominant_subgenre}
        </span>
        {m.secondary_subgenres.map((g) => (
          <span key={g} className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-700">
            {g}
          </span>
        ))}
      </div>

      {/* Scene notes */}
      <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border-l-2 border-[var(--undivide)]">
        {m.scene_notes}
      </p>

      {/* Bars */}
      <div className="space-y-3">
        <Bar label="Population (M)" value={m.population_city_millions} max={20} />
        <Bar label="Avg ticket (€)" value={m.avg_ticket_eur} max={80} />
        <Bar label="Competing events / yr" value={m.competing_events_per_year} max={200} />
      </div>

      {/* Opportunity card */}
      <div className="hero-text rounded-lg p-4 text-white" style={{ background: city.heroColor }}>
        <div className="text-[10px] uppercase tracking-wider opacity-90">Opportunity Score</div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="text-3xl font-bold">{m.yoy_growth}</div>
          <div className="text-sm opacity-90">YoY growth</div>
        </div>
        <div className="text-sm mt-1">Revenue potential: <b>{m.revenue_potential}</b></div>
      </div>

      {/* Venues / clubs */}
      {city.clubs.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
            Key venues ({city.clubs.length})
          </div>
          <div className="space-y-1.5">
            {city.clubs.map((c) => (
              <div key={c.name} className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-semibold text-xs truncate">{c.name}</span>
                  <span className="text-[11px] text-gray-500 shrink-0">cap {c.capacity.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{c.genre_focus}</div>
                {c.ig && (
                  <a href={`https://instagram.com/${c.ig}`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-pink-600 hover:underline">@{c.ig}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
