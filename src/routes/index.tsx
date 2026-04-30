import { createFileRoute } from '@tanstack/react-router';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import Legend from '../components/Legend';
import Tooltip from '../components/Tooltip';
import MapControls from '../components/MapControls';
import Timeline from '../components/Timeline';
import DetailPanel from '../components/DetailPanel';
import CompareModal from '../components/CompareModal';
import BookingModal from '../components/BookingModal';
import BookingsButton from '../components/BookingsButton';

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
  return (
    <main className="fixed inset-0 overflow-hidden font-sans" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 className="sr-only">Undivide Territory Intelligence</h1>
      <MapView />
      <SearchBar />
      <FilterChips />
      <Legend />
      <MapControls />
      <DetailPanel />
      <Timeline />
      <Tooltip />
      <CompareModal />
      <BookingsButton />
      <BookingModal />
    </main>
  );
}
