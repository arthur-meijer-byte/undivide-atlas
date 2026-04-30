import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useMapState } from '../hooks/useMapState';

export default function BookingsButton() {
  const { openModal, bookings } = useBookings();
  const { flyTo } = useMapState();
  const [listOpen, setListOpen] = useState(false);

  return (
    <>
      <div className="absolute bottom-[72px] right-4 z-30 flex flex-col items-end gap-2">
        {listOpen && (
          <div className="bg-white rounded-lg shadow-[var(--shadow-panel)] w-[320px] max-h-[60vh] overflow-y-auto thin-scroll">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <div className="font-semibold text-sm">Booked shows ({bookings.length})</div>
              <button onClick={() => setListOpen(false)} className="text-gray-400 hover:text-gray-700">×</button>
            </div>
            {bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No shows booked yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bookings
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((b) => (
                    <button key={b.id}
                      onClick={() => { flyTo(b.lat, b.lng); openModal(undefined, b.id); }}
                      className="w-full text-left p-3 hover:bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{b.city}</span>
                        <span className="text-gray-500 text-xs">{b.date}</span>
                      </div>
                      <div className="text-xs text-gray-500">{b.venue} · {b.sound}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setListOpen((o) => !o)}
          className="bg-white text-gray-700 px-3 py-2 rounded-full shadow-[var(--shadow-float)] text-xs font-semibold hover:bg-gray-50"
        >
          📅 Shows ({bookings.length})
        </button>
        <button
          onClick={() => openModal()}
          className="bg-[var(--undivide)] text-white px-4 py-2.5 rounded-full shadow-[var(--shadow-float)] text-sm font-semibold hover:opacity-90"
        >
          + Book a show
        </button>
      </div>
    </>
  );
}
