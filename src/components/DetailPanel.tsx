import { useMapState } from '../hooks/useMapState';
import { STATUS_LABEL } from '../data/cities';
import { exportCityPDF } from '../hooks/usePDF';
import PanelOverview from './PanelOverview';
import PanelEvents from './PanelEvents';
import PanelMarket from './PanelMarket';
import PanelArtists from './PanelArtists';

const TABS = ['Overview', 'Events', 'Market', 'Artists'];

export default function DetailPanel() {
  const { currentCity, setCity, currentTab, setTab, openCompare } = useMapState();
  if (!currentCity) return null;

  return (
    <div
      key={currentCity.id}
      className="panel-slide-in absolute top-0 left-0 bottom-0 z-30 w-[380px] bg-white shadow-[var(--shadow-panel)] flex flex-col"
    >
      <div className="relative p-5 text-white" style={{ background: currentCity.heroColor }}>
        <button
          onClick={() => setCity(null)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
        >×</button>
        <div className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 inline-block px-2 py-0.5 rounded-full">
          {STATUS_LABEL[currentCity.status]}
        </div>
        <div className="text-2xl font-bold mt-2">{currentCity.name}</div>
        <div className="text-sm opacity-90">{currentCity.country} · {currentCity.genre}</div>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { icon: '🌐', label: 'Website', onClick: () => window.open('https://undivideevents.com', '_blank') },
          { icon: '↗', label: 'Share', onClick: () => navigator.clipboard?.writeText(`${location.origin}/?city=${currentCity.id}`) },
          { icon: '⇄', label: 'Compare', onClick: () => openCompare(currentCity.id) },
          { icon: '📄', label: 'Export', onClick: () => exportCityPDF(currentCity) },
        ].map((b) => (
          <button key={b.label} onClick={b.onClick}
            className="flex-1 py-2.5 text-xs flex flex-col items-center gap-0.5 hover:bg-gray-50">
            <span className="text-base">{b.icon}</span>
            <span className="text-gray-500">{b.label}</span>
          </button>
        ))}
      </div>

      <div className="flex border-b border-gray-200 text-xs">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`flex-1 py-2.5 transition-colors ${
              currentTab === i ? 'border-b-2 border-[var(--undivide)] text-[var(--undivide)] font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {currentTab === 0 && <PanelOverview city={currentCity} />}
        {currentTab === 1 && <PanelEvents city={currentCity} />}
        {currentTab === 2 && <PanelMarket city={currentCity} />}
        {currentTab === 3 && <PanelArtists city={currentCity} />}
      </div>
    </div>
  );
}
