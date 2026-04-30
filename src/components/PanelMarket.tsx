import type { City } from '../data/cities';

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

export default function PanelMarket({ city }: { city: City }) {
  const m = city.market;
  const fans = parseInt(m.dnbFans.replace(/[^\d]/g, '')) || 0;

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="space-y-3">
        <Bar label="Population (M)" value={m.population} max={25} />
        <Bar label="DnB fanbase" value={fans} max={500} suffix="k" />
        <Bar label="Avg ticket (€)" value={m.avgTicket} max={80} />
        <Bar label="Market activity" value={city.promoters.reduce((a, p) => a + p.events, 0)} max={150} />
        <Bar label="Competition" value={m.competingEvents} max={40} />
      </div>

      <div className="rounded-lg p-4 text-white" style={{ background: city.heroColor }}>
        <div className="text-[10px] uppercase tracking-wider opacity-90">Opportunity Score</div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="text-3xl font-bold">{m.growth}</div>
          <div className="text-sm opacity-90">YoY growth</div>
        </div>
        <div className="text-sm mt-1">Revenue potential: <b>{m.potentialRev}</b></div>
        <div className="text-xs opacity-90 mt-2">
          {city.status === 'undivide' && 'Established Undivide market with proven demand and strong promoter network.'}
          {city.status === 'growth' && 'Active scene with healthy demand. Prime target for Undivide expansion.'}
          {city.status === 'emerging' && 'Building scene with passionate early-adopter community.'}
          {city.status === 'new' && 'Untapped territory with significant long-term potential.'}
        </div>
      </div>
    </div>
  );
}
