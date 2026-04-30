import { createFileRoute } from '@tanstack/react-router';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import Tooltip from '../components/Tooltip';
import MapControls from '../components/MapControls';
import DetailPanel from '../components/DetailPanel';
import CompareModal from '../components/CompareModal';
import BookingModal from '../components/BookingModal';
import BookingsButton from '../components/BookingsButton';
import ThemeToggle from '../components/ThemeToggle';
import AgendaPanel, { AgendaButton } from '../components/AgendaPanel';
import { useApplyTheme } from '../hooks/useTheme';

export const Route = createFileRoute('/')({
  component: Index,
  head: () => ({
    meta: [
      { title: 'Undivide Territory Intelligence' },
      { name: 'description', content: 'Internal map of global drum & bass scenes — promoters, line-ups, sounds and booked shows for Undivide Events.' },
    ],
  }),
});

function Index() {
  useApplyTheme();
  return (
    <main className="fixed inset-0 overflow-hidden font-sans bg-background text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 className="sr-only">Undivide Territory Intelligence</h1>
      <div className="absolute top-4 right-[200px] z-30 flex items-center gap-2">
        <AgendaButton />
        <ThemeToggle />
      </div>
      <MapView />
      <SearchBar />
      <FilterChips />
      <MapControls />
      <DetailPanel />
      <Tooltip />
      <CompareModal />
      <BookingsButton />
      <BookingModal />
      <AgendaPanel />
    </main>
  );
}
