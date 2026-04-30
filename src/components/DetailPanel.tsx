import { useState } from 'react';
import { useMapState } from '../hooks/useMapState';
import { STATUS_LABEL, SCENE_LABEL, type City } from '../data/cities';
import { useBookings } from '../hooks/useBookings';

const TYPE_BADGE = {
  undivide: 'bg-[var(--undivide)] text-white',
  local: 'bg-blue-100 text-blue-700',
  venue: 'bg-amber-100 text-amber-700',
  independent: 'bg-gray-200 text-gray-700',
} as const;

function igUrl(h: string) { return h.startsWith('http') ? h : `https://instagram.com/${h.replace(/^@/, '')}`; }
function fbUrl(h: string) { return h.startsWith('http') ? h : `https://facebook.com/${h.replace(/^@/, '')}`; }
function ytUrl(h: string) {
  if (h.startsWith('http')) return h;
  const v = h.replace(/^@/, '');
  return `https://youtube.com/@${v}`;
}

function dominantSound(city: City): string {
  return city.market.dominant_subgenre;
}

export default function DetailPanel() {
  const { currentCity, setCity } = useMapState();
  const bookings = useBookings((s) => s.bookings);
  const openModal = useBookings((s) => s.openModal);
  const [openPromoter, setOpenPromoter] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  const [showPromoters, setShowPromoters] = useState(false);
  const [contactPromoter, setContactPromoter] = useState<string | null>(null);

  if (!currentCity) return null;
  const city = currentCity;
  const cityBookings = bookings.filter(
    (b) => b.city.toLowerCase() === city.name.toLowerCase(),
  );
  const totalEvents = city.promoters.reduce((a, p) => a + p.events, 0);
  const allEvents = city.promoters
    .flatMap((p) => p.events_list.map((e) => ({ ...e, promoter: p.name })))
    .sort((a, b) => b.year - a.year);
  const contactP = contactPromoter ? city.promoters.find((p) => p.name === contactPromoter) : null;

  return (
    <div
      key={city.id}
      className="panel-slide-in absolute top-0 left-0 bottom-0 z-30 w-[400px] bg-white shadow-[var(--shadow-panel)] flex flex-col"
    >
      <div className="relative p-5 text-white" style={{ background: city.heroColor }}>
        <button
          onClick={() => setCity(null)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
        >×</button>
        <div className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 inline-block px-2 py-0.5 rounded-full">
          {STATUS_LABEL[city.status]}
        </div>
        <div className="text-2xl font-bold mt-2">{city.name}</div>
        <div className="text-sm opacity-90">{city.country}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="bg-white/20 px-2 py-1 rounded-full">🎵 {dominantSound(city)}</span>
          <span className="bg-white/25 px-2 py-1 rounded-full font-semibold">⚡ {SCENE_LABEL[city.market.dnb_scene_strength]}</span>
          <button onClick={() => setShowEvents(true)} className="bg-white/20 hover:bg-white/35 px-2 py-1 rounded-full transition-colors">📅 {totalEvents} events ›</button>
          <button onClick={() => setShowPromoters(true)} className="bg-white/20 hover:bg-white/35 px-2 py-1 rounded-full transition-colors">👥 {city.promoters.length} promoters ›</button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed opacity-90 line-clamp-3">
          {city.market.scene_notes}
        </p>
      </div>

      <div className="p-3 border-b border-gray-200">
        <button
          onClick={() => openModal({
            city: city.name, country: city.country, lat: city.lat, lng: city.lng,
            sound: city.genre as never,
          })}
          className="w-full bg-[var(--undivide)] text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90"
        >
          + Book a show in {city.name}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-4 text-sm">
        {/* Market quick stats — clickable for context */}
        <div className="grid grid-cols-3 gap-2">
          <StatPop
            v={city.market.dnbFans}
            l="DnB fans"
            title={`Estimated DnB fanbase — ${city.name}`}
            body={
              <>
                <KV k="Estimate" v={city.market.dnbFans} />
                <KV k="City population" v={`${city.market.population_city_millions}M`} />
                <KV k="Scene strength" v={SCENE_LABEL[city.market.dnb_scene_strength]} />
                <KV k="Dominant sound" v={city.market.dominant_subgenre} />
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Heuristic from population × scene strength. Cross-reference with
                  Resident Advisor for live event counts.
                </p>
                <Links city={city} kind="fans" />
              </>
            }
          />
          <StatPop
            v={`€${city.market.avgTicket}`}
            l="Avg ticket"
            title={`Average ticket — ${city.name}`}
            body={
              <>
                <KV k="Average" v={`€${city.market.avgTicket}`} />
                <KV k="Competing events / yr" v={city.market.competing_events_per_year} />
                <KV k="Revenue potential" v={city.market.revenue_potential} />
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Benchmark across local DnB nights. Premium / festival pricing
                  typically sits 30–80% above this average.
                </p>
                <Links city={city} kind="tickets" />
              </>
            }
          />
          <StatPop
            v={city.market.growth}
            l="Growth"
            title={`YoY growth — ${city.name}`}
            body={
              <>
                <KV k="YoY" v={city.market.growth} />
                <p className="text-[11px] text-gray-700 leading-relaxed mt-2">{city.market.scene_notes}</p>
                <Links city={city} kind="growth" />
              </>
            }
          />
        </div>

        {/* Promoters - dropdowns */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
            Promoters in {city.name}
          </div>
          <div className="space-y-2">
            {city.promoters.map((p) => {
              const open = openPromoter === p.name;
              const totalSold = p.events_list.reduce((a, e) => a + e.sold, 0);
              const totalCap = p.events_list.reduce((a, e) => a + e.cap, 0);
              return (
                <div key={p.name} className="bg-gray-50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenPromoter(open ? null : p.name)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-100 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--undivide)]/15 text-[var(--undivide)] flex items-center justify-center font-bold text-sm">
                      {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.events} events · since {p.since}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[p.type]}`}>{p.type}</span>
                    <span className="text-gray-400 ml-1">{open ? '▾' : '▸'}</span>
                  </button>

                  {open && (
                    <div className="p-3 pt-0 space-y-3 text-xs">
                      {/* Socials */}
                      {(p.ig || p.fb || p.yt) && (
                        <div className="flex flex-wrap gap-2">
                          {p.ig && (
                            <a href={igUrl(p.ig)} target="_blank" rel="noreferrer"
                              className="bg-pink-50 text-pink-700 hover:bg-pink-100 px-2.5 py-1 rounded-full">
                              IG @{p.ig}
                            </a>
                          )}
                          {p.fb && (
                            <a href={fbUrl(p.fb)} target="_blank" rel="noreferrer"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-full">
                              FB {p.fb}
                            </a>
                          )}
                          {p.yt && (
                            <a href={ytUrl(p.yt)} target="_blank" rel="noreferrer"
                              className="bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-full">
                              YT {p.yt}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Numbers */}
                      <div className="grid grid-cols-3 gap-2">
                        <Mini v={p.events.toString()} l="Events" />
                        <Mini v={totalSold.toLocaleString()} l="Tickets" />
                        <Mini v={totalCap ? `${Math.round((totalSold / totalCap) * 100)}%` : '—'} l="Fill" />
                      </div>

                      {/* Lineup */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Recent line-ups</div>
                        <div className="flex flex-wrap gap-1">
                          {p.lineup.map((a) => (
                            <span key={a} className="bg-white border border-gray-200 px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                        </div>
                      </div>

                      {/* Previous events */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Previous events</div>
                        <div className="space-y-1">
                          {p.events_list.slice(-5).reverse().map((e, i) => (
                            <div key={i} className="bg-white px-2 py-1.5 rounded">
                              <div className="flex justify-between gap-2">
                                <span className="truncate font-medium">{e.name}</span>
                                <span className="text-gray-500 shrink-0">{e.sold.toLocaleString()}/{e.cap.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-gray-500 truncate">
                                {e.date} · {e.venue}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bookings in this city */}
        {cityBookings.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              Booked shows ({cityBookings.length})
            </div>
            <div className="space-y-2">
              {cityBookings.map((b) => (
                <button key={b.id} onClick={() => openModal(undefined, b.id)}
                  className="w-full text-left bg-gray-900 text-white rounded-lg p-2.5 hover:bg-gray-800">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{b.venue}</span>
                    <span className="opacity-70">{b.date}</span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {b.promoter || '—'} · {b.sound} · {b.ticketsSold}/{b.capacity} sold
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Events overview modal */}
      {showEvents && (
        <Modal title={`${totalEvents} events in ${city.name}`} onClose={() => setShowEvents(false)}>
          <div className="space-y-2">
            {allEvents.map((e, i) => {
              const pct = e.cap ? Math.round((e.sold / e.cap) * 100) : 0;
              const color = pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-400' : 'bg-red-400';
              return (
                <button
                  key={i}
                  onClick={() => {
                    setShowEvents(false);
                    setOpenPromoter(e.promoter);
                  }}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 transition-colors"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{e.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">{e.date}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {e.promoter} · {e.venue}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold w-20 text-right">
                      {e.sold.toLocaleString()}/{e.cap.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Promoters list modal */}
      {showPromoters && (
        <Modal title={`${city.promoters.length} promoters in ${city.name}`} onClose={() => setShowPromoters(false)}>
          <div className="space-y-2">
            {city.promoters.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setShowPromoters(false);
                  setContactPromoter(p.name);
                }}
                className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--undivide)]/15 text-[var(--undivide)] flex items-center justify-center font-bold text-sm">
                  {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.events} events/yr · {p.dominant_genre}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[p.type]}`}>{p.type}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Promoter contact modal */}
      {contactP && (
        <Modal title={contactP.name} onClose={() => setContactPromoter(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[contactP.type]}`}>{contactP.type}</span>
              <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">Since {contactP.since}</span>
              <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">{contactP.events} events/yr</span>
              <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">🎵 {contactP.dominant_genre}</span>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Contact & socials</div>
              <div className="flex flex-wrap gap-2">
                {contactP.ig && (
                  <a href={igUrl(contactP.ig)} target="_blank" rel="noreferrer"
                    className="bg-pink-50 text-pink-700 hover:bg-pink-100 px-2.5 py-1 rounded-full text-xs">
                    IG @{contactP.ig}
                  </a>
                )}
                {contactP.fb && (
                  <a href={fbUrl(contactP.fb)} target="_blank" rel="noreferrer"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-full text-xs">
                    FB {contactP.fb}
                  </a>
                )}
                {contactP.yt && (
                  <a href={ytUrl(contactP.yt)} target="_blank" rel="noreferrer"
                    className="bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-full text-xs">
                    YT {contactP.yt}
                  </a>
                )}
                {contactP.website && (
                  <a href={contactP.website.startsWith('http') ? contactP.website : `https://${contactP.website}`} target="_blank" rel="noreferrer"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2.5 py-1 rounded-full text-xs">
                    🌐 Website
                  </a>
                )}
                {!contactP.ig && !contactP.fb && !contactP.yt && !contactP.website && (
                  <span className="text-xs text-gray-400 italic">No socials on file</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Recent line-ups</div>
              <div className="flex flex-wrap gap-1">
                {contactP.lineup.map((a) => (
                  <span key={a} className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[11px]">{a}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setContactPromoter(null);
                setOpenPromoter(contactP.name);
              }}
              className="w-full bg-[var(--undivide)] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90"
            >
              View full event history →
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 p-4 border-b border-gray-100">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-4 overflow-y-auto thin-scroll">{children}</div>
      </div>
    </div>
  );
}

function StatPop({ v, l, title, body }: { v: string; l: string; title: string; body: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-center transition-colors border border-transparent hover:border-[var(--undivide)]/30"
        title={`More about ${l}`}
      >
        <div className="text-sm font-bold text-[var(--undivide)]">{v}</div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center justify-center gap-1">
          {l} <span className="opacity-50">ⓘ</span>
        </div>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base">{title}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="space-y-1 text-sm">{body}</div>
          </div>
        </div>
      )}
    </>
  );
}

function KV({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-gray-100">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

function Links({ city, kind }: { city: City; kind: 'fans' | 'tickets' | 'growth' }) {
  const q = encodeURIComponent(`${city.name} drum and bass`);
  const links =
    kind === 'fans'
      ? [
          { label: 'Resident Advisor', url: `https://ra.co/clubs/${encodeURIComponent(city.name.toLowerCase())}` },
          { label: 'Songkick events', url: `https://www.songkick.com/search?query=${q}` },
          { label: 'Spotify city listeners', url: `https://open.spotify.com/search/${q}` },
        ]
      : kind === 'tickets'
      ? [
          { label: 'RA tickets', url: `https://ra.co/events/${encodeURIComponent(city.name.toLowerCase())}` },
          { label: 'Skiddle', url: `https://www.skiddle.com/whats-on/search/?q=${q}` },
        ]
      : [
          { label: 'Google Trends', url: `https://trends.google.com/trends/explore?q=${q}` },
          { label: 'RA news', url: `https://ra.co/news?q=${q}` },
        ];
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {links.map((l) => (
        <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
          className="text-[11px] bg-[var(--undivide)]/10 text-[var(--undivide)] hover:bg-[var(--undivide)]/20 px-2.5 py-1 rounded-full font-medium">
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}

function Mini({ v, l }: { v: string; l: string }) {
  return (
    <div className="bg-white rounded p-1.5 text-center border border-gray-200">
      <div className="text-xs font-bold">{v}</div>
      <div className="text-[9px] uppercase text-gray-500">{l}</div>
    </div>
  );
}
