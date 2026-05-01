export interface EventEntry {
  date: string;       // "Sep 2024"
  year: number;
  name: string;
  venue: string;
  cap: number;
  sold: number;
}

export interface Promoter {
  name: string;
  type: 'undivide' | 'local' | 'venue' | 'independent';
  // legacy fields kept so existing components keep compiling
  since: number;            // = active_since
  events: number;           // = events_per_year
  ig?: string;
  fb?: string;
  yt?: string;
  website?: string;
  lineup: string[];
  events_list: EventEntry[];
  // new richer fields
  active_since: number;
  events_per_year: number;
  dominant_genre: string;
}

export interface Club {
  name: string;
  capacity: number;
  genre_focus: string;
  ig?: string;
}

export type SceneStrength = 'legendary' | 'strong' | 'growing' | 'emerging' | 'untapped';

export interface MarketData {
  population_city_millions: number;
  dnb_scene_strength: SceneStrength;
  dominant_subgenre: string;
  secondary_subgenres: string[];
  avg_ticket_eur: number;
  competing_events_per_year: number;
  revenue_potential: string;
  yoy_growth: string;
  scene_notes: string;
  // legacy mirrors used by existing UI
  population: number;       // = population_city_millions
  dnbFans: string;          // shown as fanbase chip
  avgTicket: number;        // = avg_ticket_eur
  competingEvents: number;  // = competing_events_per_year
  potentialRev: string;     // = revenue_potential
  growth: string;           // = yoy_growth
}

export type CityStatus = 'undivide' | 'growth' | 'emerging' | 'new';
export type CityGenre = string;
export type MarketSize = 'huge' | 'large' | 'mid' | 'small';

// A top act in a market — composite ranking (bookings 50% / streams 30% / socials 20%)
export interface TopAct {
  name: string;
  share: number;            // composite share %, all top-10 acts in a city sum to ~100
  bookings_yr: number;      // verified shows headlined in city/region last 12–24 mo
  spotify_monthly?: number; // global Spotify monthly listeners (in millions if ≥1, k otherwise)
  ig_followers?: number;    // primary IG account followers
  country_origin?: string;
  primary_label?: string;
  notes?: string;
}

// Live-ish social/streaming stats for the city scene (verified snapshot)
export interface CityStats {
  spotify_dnb_monthly_listeners?: string;  // "12.4M" — total local DnB streaming
  ig_top_promoter_followers?: number;      // followers of the biggest local DnB IG
  fb_groups?: { name: string; members: number; url?: string }[];
  ra_events_last_12mo?: number;            // Resident Advisor DnB events
  spotify_top_playlist?: { name: string; followers: number; url?: string };
  data_as_of: string;                      // "2025-Q1"
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  status: CityStatus;
  // legacy
  genre: CityGenre;          // = dominant_genre
  marketSize: MarketSize;
  heroColor: string;
  // new
  dominant_genre: string;
  market: MarketData;
  clubs: Club[];
  promoters: Promoter[];
  topActs?: TopAct[];        // top 10 acts in this market with composite %
  stats?: CityStats;         // social/streaming snapshot
}

const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`;

// fanbase heuristic from population & strength — purely cosmetic for the chip.
const fans = (popM: number, s: SceneStrength): string => {
  const mult = { legendary: 70, strong: 45, growing: 25, emerging: 14, untapped: 6 }[s];
  const k = Math.round(popM * mult);
  return `est. ${k}k`;
};

const sizeFromPop = (popM: number): MarketSize =>
  popM >= 8 ? 'huge' : popM >= 2.5 ? 'large' : popM >= 0.8 ? 'mid' : 'small';

const heroByStatus: Record<CityStatus, string> = {
  undivide: grad('#ff2d6f', '#7a0030'),     // neon pink/red
  growth: grad('#fff200', '#b08a00'),       // neon yellow
  emerging: grad('#39ff14', '#0a6b1a'),     // neon green
  new: grad('#00e5ff', '#003a7a'),          // neon cyan
};

// helper to build a promoter with mirrored legacy fields
function P(p: {
  name: string; type: Promoter['type']; active_since: number; events_per_year: number;
  dominant_genre: string; ig?: string; fb?: string; yt?: string; website?: string;
  lineup: string[]; events: EventEntry[];
}): Promoter {
  return {
    name: p.name, type: p.type,
    active_since: p.active_since, events_per_year: p.events_per_year,
    since: p.active_since, events: p.events_per_year,
    dominant_genre: p.dominant_genre,
    ig: p.ig, fb: p.fb, yt: p.yt, website: p.website,
    lineup: p.lineup, events_list: p.events,
  };
}

// helper to build market with mirrored legacy fields
function M(m: Omit<MarketData, 'population' | 'dnbFans' | 'avgTicket' | 'competingEvents' | 'potentialRev' | 'growth'>): MarketData {
  return {
    ...m,
    population: m.population_city_millions,
    dnbFans: fans(m.population_city_millions, m.dnb_scene_strength),
    avgTicket: m.avg_ticket_eur,
    competingEvents: m.competing_events_per_year,
    potentialRev: m.revenue_potential,
    growth: m.yoy_growth,
  };
}

function C(c: Omit<City, 'genre' | 'marketSize' | 'heroColor'>): City {
  return {
    ...c,
    genre: c.dominant_genre,
    marketSize: sizeFromPop(c.market.population_city_millions),
    heroColor: heroByStatus[c.status],
  };
}

const CITIES_RAW: City[] = [
  // ──────────────────────────── UNDIVIDE ACTIVE ────────────────────────────
  C({
    id: 'london', name: 'London', country: 'United Kingdom',
    lat: 51.51, lng: -0.13, status: 'undivide',
    dominant_genre: 'Liquid / All styles',
    market: M({
      population_city_millions: 9.5,
      dnb_scene_strength: 'legendary',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Neurofunk', 'Jump Up', 'Dancefloor', 'Jungle'],
      avg_ticket_eur: 28,
      competing_events_per_year: 200,
      revenue_potential: '€2.5M+',
      yoy_growth: '+6%',
      scene_notes: 'Birthplace of DnB. Fabric Friday nights (FABRICLIVE) have run DnB since inception. Drumsheds (15,000 cap) opened 2023, ranked #45 DJ Mag Top 100 Clubs 2026.',
    }),
    clubs: [
      { name: 'fabric', capacity: 2500, genre_focus: 'DnB (Fridays) + Techno (Saturdays)', ig: 'fabriclondon' },
      { name: 'Drumsheds', capacity: 14999, genre_focus: 'All electronic — Room X 10,000 / Room Y 5,000 / Room Z 1,000', ig: 'drumsheds' },
      { name: 'XOYO', capacity: 800, genre_focus: 'DnB, House, Techno', ig: 'xoyolondon' },
      { name: 'Village Underground', capacity: 700, genre_focus: 'Electronic, DnB', ig: 'villageunderground' },
      { name: 'Scala', capacity: 1150, genre_focus: 'DnB events, club nights', ig: 'scalalondondotcom' },
      { name: 'O2 Academy Brixton', capacity: 4921, genre_focus: 'Large DnB shows (Hospitality, DnB Allstars)', ig: 'o2academybrixton' },
    ],
    promoters: [
      P({
        name: 'Hospital Records / Hospitality', type: 'undivide',
        active_since: 1996, events_per_year: 15,
        dominant_genre: 'Liquid',
        ig: 'hospitalrecords', website: 'hospitalrecords.com',
        lineup: ['London Elektricity', 'Netsky', 'High Contrast', 'Logistics', 'S.P.Y', 'Etherwood', 'Hybrid Minds', 'Bcee', 'Fred V & Grafix'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Hospitality In The Park', venue: 'Finsbury Park', cap: 10000, sold: 9800 },
          { date: 'Sep 2023', year: 2023, name: 'Hospitality In The Park', venue: 'Finsbury Park', cap: 10000, sold: 9500 },
          { date: 'Mar 2024', year: 2024, name: 'Hospitality', venue: 'O2 Academy Brixton', cap: 4921, sold: 4921 },
          { date: 'Nov 2023', year: 2023, name: 'Hospitality', venue: 'O2 Academy Brixton', cap: 4921, sold: 4700 },
        ],
      }),
      P({
        name: 'DnB Allstars', type: 'local',
        active_since: 2000, events_per_year: 20,
        dominant_genre: 'All styles',
        ig: 'dnballstars', website: 'dnballstars.com',
        lineup: ['Andy C', 'Friction', 'Chase & Status', 'Sub Focus', 'DJ Hype', 'Shy FX', 'Goldie'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'DnB Allstars Halloween', venue: 'Drumsheds', cap: 10000, sold: 9500 },
          { date: 'Feb 2024', year: 2024, name: 'DnB Allstars', venue: 'Drumsheds', cap: 8000, sold: 7800 },
        ],
      }),
      P({
        name: 'UKF (Undivide)', type: 'undivide',
        active_since: 2009, events_per_year: 8,
        dominant_genre: 'All styles',
        ig: 'ukf', yt: 'UKF', website: 'ukf.com',
        lineup: ['Sub Focus', 'Wilkinson', 'Dimension', 'Culture Shock', '1991', 'Kanine', 'Tantrum Desire', 'Mefjus'],
        events: [
          { date: 'Dec 2024', year: 2024, name: 'UKF15 Anniversary', venue: 'Drumsheds', cap: 10000, sold: 9800 },
          { date: 'Apr 2024', year: 2024, name: 'UKF On Air London', venue: 'Drumsheds', cap: 8000, sold: 7600 },
          { date: 'Oct 2023', year: 2023, name: 'UKF On Air London', venue: 'Printworks', cap: 6000, sold: 5900 },
          { date: 'May 2023', year: 2023, name: 'UKF Halloween', venue: 'Drumsheds', cap: 8000, sold: 7400 },
        ],
      }),
      P({
        name: 'FABRICLIVE', type: 'venue',
        active_since: 1999, events_per_year: 50,
        dominant_genre: 'Liquid / Neurofunk / Jungle',
        ig: 'fabriclondon', website: 'fabriclondon.com',
        lineup: ['Andy C', 'Goldie', 'Shy FX', 'LTJ Bukem', 'Marky', 'Fabio & Grooverider'],
        events: [
          { date: 'Every Fri', year: 2024, name: 'FABRICLIVE', venue: 'fabric', cap: 2500, sold: 2200 },
        ],
      }),
    ],
  }),

  C({
    id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands',
    lat: 52.37, lng: 4.90, status: 'undivide',
    dominant_genre: 'Liquid / All styles',
    market: M({
      population_city_millions: 0.87,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 25,
      competing_events_per_year: 30,
      revenue_potential: '€450k',
      yoy_growth: '+12%',
      scene_notes: 'Liquicity based here — leading global liquid DnB label/brand with 4M+ YouTube subscribers. Now&Wow (cap 3000) hosts Korsakov Kingsnight. Strong festival market via Liquicity Festival (Geestmerambacht, annual sellout).',
    }),
    clubs: [
      { name: 'Now&Wow', capacity: 3000, genre_focus: 'DnB, Electronic', ig: 'nowandwow' },
      { name: 'Paradiso', capacity: 1500, genre_focus: 'All genres incl. DnB shows', ig: 'paradiso_amsterdam' },
      { name: 'Melkweg', capacity: 1500, genre_focus: 'All genres', ig: 'melkwegamsterdam' },
      { name: 'NDSM Wharf', capacity: 5000, genre_focus: 'Large outdoor events', ig: 'ndsmwharf' },
    ],
    promoters: [
      P({
        name: 'Liquicity', type: 'local',
        active_since: 2010, events_per_year: 12,
        dominant_genre: 'Liquid',
        ig: 'liquicity', website: 'liquicity.com', yt: 'Liquicity',
        lineup: ['Hybrid Minds', 'Maduk', 'Whiney', 'BCee', 'Kasra', 'Metrik', 'Camo & Krooked', 'Andromedik'],
        events: [
          { date: 'Jul 2024', year: 2024, name: 'Liquicity Festival', venue: 'Geestmerambacht Oudkarspel', cap: 15000, sold: 15000 },
          { date: 'Jul 2023', year: 2023, name: 'Liquicity Festival', venue: 'Geestmerambacht Oudkarspel', cap: 12000, sold: 12000 },
        ],
      }),
      P({
        name: 'Hospitality NL (Undivide)', type: 'undivide',
        active_since: 2015, events_per_year: 4,
        dominant_genre: 'Liquid',
        ig: 'hospitalitydnb',
        lineup: ['Chase & Status', 'Logistics', 'Bcee', 'Hybrid Minds', 'Fred V & Grafix', 'Camo & Krooked'],
        events: [
          { date: 'Jul 2024', year: 2024, name: 'Hospitality In The Park AMS', venue: 'Amstelpark', cap: 3000, sold: 2950 },
          { date: 'Jul 2023', year: 2023, name: 'Hospitality In The Park AMS', venue: 'Amstelpark', cap: 3000, sold: 2800 },
        ],
      }),
      P({
        name: 'High Tea', type: 'local',
        active_since: 2016, events_per_year: 6,
        dominant_genre: 'Liquid / Melodic',
        ig: 'highteadnb', website: 'highteadnb.com',
        lineup: ['T & Sugah', 'Zazu', 'Mozey', 'Dossa & Locuzzed', 'Monrroe', 'NCT', 'Rameses B'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'High Tea Amsterdam', venue: 'Now&Wow', cap: 2000, sold: 1900 },
        ],
      }),
    ],
  }),

  C({
    id: 'rotterdam', name: 'Rotterdam', country: 'Netherlands',
    lat: 51.92, lng: 4.48, status: 'undivide',
    dominant_genre: 'Neurofunk / All styles',
    market: M({
      population_city_millions: 0.65,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Dancefloor', 'Liquid', 'Crossbreed'],
      avg_ticket_eur: 22,
      competing_events_per_year: 20,
      revenue_potential: '€320k',
      yoy_growth: '+8%',
      scene_notes: 'Home of Korsakov Weekender — biggest indoor DnB festival in the Netherlands. Maassilo (former grain silo) hosts 5000+ cap events. Eatbrain festival (15-year anniversary 2025) also at Maassilo.',
    }),
    clubs: [
      { name: 'Maassilo', capacity: 5000, genre_focus: 'Large DnB festivals, Korsakov, Eatbrain', ig: 'maassilo' },
      { name: 'Now&Wow', capacity: 3000, genre_focus: 'Korsakov Kingsnight, DnB club nights', ig: 'nowandwow' },
      { name: 'Annabel', capacity: 800, genre_focus: 'Club nights', ig: 'annabelrotterdam' },
    ],
    promoters: [
      P({
        name: 'Korsakov Music NL (Undivide)', type: 'undivide',
        active_since: 2014, events_per_year: 6,
        dominant_genre: 'Neurofunk',
        ig: 'korsakovmusic', website: 'korsakovmusic.com',
        lineup: ['Mefjus', 'Emperor', 'Phace', 'Unreal', 'Icicle', 'Malux', 'Optiv', 'Billain', 'Hedex', 'Wilkinson', 'Camo & Krooked b2b Mefjus', 'Bou & B Live 247'],
        events: [
          { date: 'Mar 2025', year: 2025, name: 'Korsakov Weekender', venue: 'Maassilo', cap: 5000, sold: 5000 },
          { date: 'Apr 2025', year: 2025, name: 'Korsakov Kingsnight', venue: 'Now&Wow', cap: 3000, sold: 2900 },
          { date: 'Mar 2024', year: 2024, name: 'Korsakov Weekender', venue: 'Maassilo', cap: 5000, sold: 4800 },
        ],
      }),
      P({
        name: 'Explicit Events', type: 'local',
        active_since: 2020, events_per_year: 8,
        dominant_genre: 'Liquid / Dancefloor / Neurofunk',
        ig: 'explicit_events_nl', website: 'explicitevents.nl',
        lineup: ['Local & regional DnB talent', 'Up-and-coming international artists'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'Explicit Rotterdam', venue: 'TBC', cap: 400, sold: 380 },
        ],
      }),
      P({
        name: 'Eatbrain', type: 'local',
        active_since: 2012, events_per_year: 3,
        dominant_genre: 'Neurofunk',
        ig: 'eatbrain', website: 'eatbrain.com',
        lineup: ['Jade Venom', 'Prolix', 'State of Mind', 'Agressor Bunx', 'Misanthrop', 'Pythius'],
        events: [
          { date: 'May 2025', year: 2025, name: 'Eatbrain Indoor Festival 15yr Anniversary', venue: 'Maassilo Rotterdam', cap: 4000, sold: 3800 },
        ],
      }),
    ],
  }),

  C({
    id: 'prague', name: 'Prague', country: 'Czech Republic',
    lat: 50.08, lng: 14.44, status: 'undivide',
    dominant_genre: 'All styles — DnB capital of the world',
    market: M({
      population_city_millions: 1.35,
      dnb_scene_strength: 'legendary',
      dominant_subgenre: 'All styles',
      secondary_subgenres: ['Neurofunk', 'Liquid', 'Dancefloor', 'Jump Up'],
      avg_ticket_eur: 18,
      competing_events_per_year: 60,
      revenue_potential: '€850k',
      yoy_growth: '+10%',
      scene_notes: 'Widely called the DnB capital of the world. Let It Roll — the world\'s largest DnB festival (25,000 daily summer; 8,000 winter at Fortuna Hall) — is based here, run by Beatworx/Suki Zdenek since 2002. Winter 2024 held at O2 Universum.',
    }),
    clubs: [
      { name: 'Fortuna Sports Hall (SH FORTUNA)', capacity: 8000, genre_focus: 'Let It Roll Winter editions', ig: 'letitroll' },
      { name: 'O2 Universum', capacity: 10000, genre_focus: 'Large shows, Let It Roll Winter 2024', ig: 'o2universum' },
      { name: 'Fuchs2', capacity: 300, genre_focus: 'Underground club nights', ig: 'fuchs2prague' },
    ],
    promoters: [
      P({
        name: 'Beatworx / Let It Roll', type: 'local',
        active_since: 2002, events_per_year: 4,
        dominant_genre: 'All DnB subgenres',
        ig: 'letitroll', website: 'letitroll.eu',
        lineup: ['Andy C', 'Chase & Status', 'Camo & Krooked', 'Wilkinson', 'Mefjus', 'Dimension', 'Netsky', 'Hybrid Minds', 'Friction', 'AMC', 'Bou', 'Sigma', 'Hedex', 'Black Sun Empire', 'Noisia'],
        events: [
          { date: 'Aug 2024', year: 2024, name: 'Let It Roll Summer 2024', venue: 'Milovice Airfield Prague', cap: 25000, sold: 23000 },
          { date: 'Feb 2024', year: 2024, name: 'Let It Roll Winter 2024', venue: 'O2 Universum Prague', cap: 10000, sold: 9500 },
          { date: 'Feb 2026', year: 2026, name: 'Let It Roll Winter 2026', venue: 'Fortuna Sports Hall Prague', cap: 8000, sold: 8000 },
        ],
      }),
      P({
        name: 'Korsakov Music CZ (Undivide)', type: 'undivide',
        active_since: 2015, events_per_year: 4,
        dominant_genre: 'Neurofunk',
        ig: 'korsakovmusic',
        lineup: ['Mefjus', 'Emperor', 'Phace', 'Unreal', 'Icicle', 'Misanthrop'],
        events: [
          { date: 'Jan 2024', year: 2024, name: 'Korsakov Showcase Prague', venue: 'TBC', cap: 1200, sold: 1200 },
        ],
      }),
    ],
  }),

  C({
    id: 'budapest', name: 'Budapest', country: 'Hungary',
    lat: 47.50, lng: 19.04, status: 'growth',
    dominant_genre: 'Jump Up / Dancefloor / Neurofunk',
    market: M({
      population_city_millions: 1.75,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Jump Up',
      secondary_subgenres: ['Neurofunk', 'Dancefloor', 'Liquid'],
      avg_ticket_eur: 14,
      competing_events_per_year: 25,
      revenue_potential: '€180k',
      yoy_growth: '+28%',
      scene_notes: 'Bladerunnaz (est. 1999) is one of Europe\'s longest-running DnB nights. Arzenál (former 110-year-old gun factory) is the city\'s flagship DnB venue. Hedex headlined Burn Energy Tour here Sep 2024. Strong community, younger generation growing fast.',
    }),
    clubs: [
      { name: 'Arzenál', capacity: 1500, genre_focus: 'Bass music, DnB flagship venue', ig: 'arsenal_budapest' },
      { name: 'Instant-Fogas', capacity: 600, genre_focus: 'Underground electronic, DnB nights', ig: 'instantfogas' },
    ],
    promoters: [
      P({
        name: 'Bladerunnaz', type: 'local',
        active_since: 1999, events_per_year: 12,
        dominant_genre: 'Jump Up / Dancefloor',
        ig: 'bladerunnaz',
        lineup: ['Hedex', 'Hazard', 'Turno', 'Voltage', 'Hype', 'Bou', 'Pendulum', 'Mefjus', 'Camo & Krooked'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Burn Energy Tour — Hedex', venue: 'Arzenál Budapest', cap: 1500, sold: 1500 },
          { date: 'Mar 2024', year: 2024, name: 'Bladerunnaz Budapest', venue: 'Arzenál Budapest', cap: 1200, sold: 1180 },
        ],
      }),
      P({
        name: 'Otherside / Arzenál', type: 'venue',
        active_since: 2019, events_per_year: 20,
        dominant_genre: 'Bass music / DnB',
        ig: 'arsenal_budapest',
        lineup: ['International and local DnB talent'],
        events: [
          { date: '2024', year: 2024, name: 'Otherside Bass Events', venue: 'Arzenál Budapest', cap: 1500, sold: 1350 },
        ],
      }),
    ],
  }),

  C({
    id: 'berlin', name: 'Berlin', country: 'Germany',
    lat: 52.52, lng: 13.40, status: 'undivide',
    dominant_genre: 'Neurofunk / Techstep',
    market: M({
      population_city_millions: 3.8,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Techstep', 'Dancefloor', 'Liquid'],
      avg_ticket_eur: 22,
      competing_events_per_year: 40,
      revenue_potential: '€750k',
      yoy_growth: '+14%',
      scene_notes: 'Strong underground techno culture spills into DnB. Mannheim and Bremen also notable German scenes. The Blast operates here via Funkhaus (2000 cap). Trust Berlin (est. 2012) runs Berghain-adjacent nights.',
    }),
    clubs: [
      { name: 'Funkhaus Berlin', capacity: 2000, genre_focus: 'Large DnB and electronic events', ig: 'funkhaus.berlin' },
      { name: 'Berghain / Säule', capacity: 1500, genre_focus: 'Occasional DnB/bass events', ig: 'berghain_kantine' },
      { name: 'Tresor', capacity: 800, genre_focus: 'Techno + occasional DnB', ig: 'tresor.berlin' },
    ],
    promoters: [
      P({
        name: 'The Blast Berlin (Undivide)', type: 'undivide',
        active_since: 2017, events_per_year: 4,
        dominant_genre: 'Neurofunk',
        ig: 'theblastdnb',
        lineup: ['Calyx & TeeBee', 'Mefjus', 'Emperor', 'Current Value', 'Misanthrop', 'Phace', 'Icicle'],
        events: [
          { date: 'Feb 2024', year: 2024, name: 'The Blast — Funkhaus Berlin', venue: 'Funkhaus Berlin', cap: 2000, sold: 1900 },
          { date: 'Feb 2023', year: 2023, name: 'The Blast — Funkhaus Berlin', venue: 'Funkhaus Berlin', cap: 2000, sold: 1750 },
        ],
      }),
      P({
        name: 'Trust Berlin', type: 'local',
        active_since: 2012, events_per_year: 10,
        dominant_genre: 'Neurofunk / Techstep',
        ig: 'trustberlin',
        lineup: ['Mefjus', 'Break', 'Insideinfo', 'Telekinesis', 'Neonlight'],
        events: [
          { date: 'Jan 2024', year: 2024, name: 'Trust Berlin', venue: 'Funkhaus Berlin', cap: 1500, sold: 1450 },
        ],
      }),
    ],
  }),

  C({
    id: 'warsaw', name: 'Warsaw', country: 'Poland',
    lat: 52.23, lng: 21.01, status: 'undivide',
    dominant_genre: 'Neurofunk',
    market: M({
      population_city_millions: 1.8,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Dancefloor', 'Jump Up'],
      avg_ticket_eur: 14,
      competing_events_per_year: 15,
      revenue_potential: '€160k',
      yoy_growth: '+18%',
      scene_notes: 'Mentioned alongside Budapest as a strong emerging European DnB market. Burn Energy Tour 2024 listed Poland as next stop after Budapest. Korsakov active here.',
    }),
    clubs: [
      { name: 'Smolna', capacity: 600, genre_focus: 'Underground electronic, DnB nights', ig: 'smolnawarsaw' },
      { name: 'Jasna 1', capacity: 800, genre_focus: 'Club events', ig: 'jasna1warsaw' },
    ],
    promoters: [
      P({
        name: 'Korsakov Music PL (Undivide)', type: 'undivide',
        active_since: 2016, events_per_year: 4,
        dominant_genre: 'Neurofunk',
        ig: 'korsakovmusic',
        lineup: ['Mefjus', 'Emperor', 'Phace', 'Unreal', 'Icicle'],
        events: [
          { date: 'Feb 2024', year: 2024, name: 'Korsakov Warsaw', venue: 'Smolna Warsaw', cap: 600, sold: 580 },
        ],
      }),
      P({
        name: 'Bassline Warsaw', type: 'local',
        active_since: 2014, events_per_year: 8,
        dominant_genre: 'Dancefloor / Jump Up',
        ig: 'basslinewarsaw',
        lineup: ['Hazard', 'Voltage', 'Turno', 'Hype'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'Bassline Warsaw', venue: 'Jasna 1', cap: 500, sold: 490 },
        ],
      }),
    ],
  }),

  C({
    id: 'barcelona', name: 'Barcelona', country: 'Spain',
    lat: 41.39, lng: 2.15, status: 'undivide',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 1.6,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Dancefloor',
      secondary_subgenres: ['Neurofunk', 'Liquid'],
      avg_ticket_eur: 20,
      competing_events_per_year: 12,
      revenue_potential: '€250k',
      yoy_growth: '+20%',
      scene_notes: 'Mentioned in Burn Energy Tour expansion. Growing underground electronic scene with crossover from techno/house crowds into DnB.',
    }),
    clubs: [
      { name: 'Razzmatazz', capacity: 3000, genre_focus: 'Multi-room club, electronic events', ig: 'razzmatazzbcn' },
      { name: 'Nitsa Club', capacity: 600, genre_focus: 'Underground electronic', ig: 'nitsaclub' },
    ],
    promoters: [
      P({
        name: 'The Blast Iberia (Undivide)', type: 'undivide',
        active_since: 2017, events_per_year: 3,
        dominant_genre: 'Neurofunk',
        ig: 'theblastdnb',
        lineup: ['Calyx & TeeBee', 'Mefjus', 'Current Value', 'Icicle'],
        events: [
          { date: 'Jun 2024', year: 2024, name: 'The Blast Barcelona', venue: 'Razzmatazz', cap: 1500, sold: 1400 },
        ],
      }),
    ],
  }),

  C({
    id: 'manchester', name: 'Manchester', country: 'United Kingdom',
    lat: 53.48, lng: -2.24, status: 'undivide',
    dominant_genre: 'Liquid / All styles',
    market: M({
      population_city_millions: 0.55,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Jump Up', 'Dancefloor'],
      avg_ticket_eur: 25,
      competing_events_per_year: 20,
      revenue_potential: '€340k',
      yoy_growth: '+10%',
      scene_notes: 'Depot Mayfield (Broadwick Live, same team as Drumsheds/Printworks) is Manchester\'s key large venue. Warehouse Project runs here. Strong student city — high DnB fanbase density.',
    }),
    clubs: [
      { name: 'Depot Mayfield', capacity: 10000, genre_focus: 'Large events, Warehouse Project', ig: 'depotmayfield' },
      { name: 'Band on the Wall', capacity: 500, genre_focus: 'Club nights', ig: 'bandonthewall' },
      { name: 'Gorilla', capacity: 600, genre_focus: 'Electronic club nights', ig: 'gorillamanc' },
    ],
    promoters: [
      P({
        name: 'Hospitality North (Undivide)', type: 'undivide',
        active_since: 2016, events_per_year: 4,
        dominant_genre: 'Liquid',
        ig: 'hospitalitydnb',
        lineup: ['Logistics', 'S.P.Y', 'Etherwood', 'Camo & Krooked', 'Bcee'],
        events: [
          { date: 'Feb 2024', year: 2024, name: 'Hospitality Manchester', venue: 'Gorilla', cap: 600, sold: 580 },
        ],
      }),
    ],
  }),

  C({
    id: 'sydney', name: 'Sydney', country: 'Australia',
    lat: -33.87, lng: 151.21, status: 'undivide',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 5.3,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Dancefloor', 'Jump Up'],
      avg_ticket_eur: 42,
      competing_events_per_year: 12,
      revenue_potential: '€650k',
      yoy_growth: '+20%',
      scene_notes: 'DnB Allstars toured Australia/NZ Sep 2024, performing at Hordern Pavilion Sydney. Australian scene growing strongly. Hospitality active here since 2016.',
    }),
    clubs: [
      { name: 'Hordern Pavilion', capacity: 5500, genre_focus: 'Large DnB shows (DnB Allstars, Hospitality)', ig: 'hordern_pavilion' },
      { name: 'Marquee Sydney', capacity: 2000, genre_focus: 'Club nights', ig: 'marqueeclub' },
      { name: 'Metro Theatre', capacity: 1700, genre_focus: 'Live shows and DnB events', ig: 'metrotheatre' },
    ],
    promoters: [
      P({
        name: 'Hospitality Australia (Undivide)', type: 'undivide',
        active_since: 2016, events_per_year: 3,
        dominant_genre: 'Liquid',
        ig: 'hospitalitydnb',
        lineup: ['Logistics', 'Bcee', 'Camo & Krooked', 'Calibre', 'S.P.Y', 'Etherwood'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'Hospitality Sydney', venue: 'Metro Theatre', cap: 1700, sold: 1650 },
          { date: 'Sep 2024', year: 2024, name: 'DnB Allstars Sydney', venue: 'Hordern Pavilion', cap: 5500, sold: 5000 },
        ],
      }),
      P({
        name: 'UKF Australia (Undivide)', type: 'undivide',
        active_since: 2018, events_per_year: 2,
        dominant_genre: 'All styles',
        ig: 'ukf', website: 'ukf.com',
        lineup: ['Sub Focus', 'Wilkinson', 'Dimension', 'Culture Shock'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'UKF On Air Sydney', venue: 'Hordern Pavilion', cap: 5500, sold: 5100 },
          { date: 'Oct 2023', year: 2023, name: 'UKF On Air Sydney', venue: 'Metro Theatre', cap: 1700, sold: 1650 },
        ],
      }),
    ],
  }),

  C({
    id: 'melbourne', name: 'Melbourne', country: 'Australia',
    lat: -37.81, lng: 144.96, status: 'undivide',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 5.1,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Neurofunk', 'Dancefloor'],
      avg_ticket_eur: 38,
      competing_events_per_year: 10,
      revenue_potential: '€500k',
      yoy_growth: '+22%',
      scene_notes: 'Twisted Audio and Plasma Audio are the key local brands. Plasma Audio (Safire) has connections to Shogun Audio, Noisia Invisible, Dispatch. Broken Beat Assault runs long-standing nights. Seven Nightclub used for seasonal events.',
    }),
    clubs: [
      { name: 'Seven Nightclub', capacity: 1200, genre_focus: 'Electronic, DnB seasonal events', ig: 'sevennightclub' },
      { name: 'Margaret Court Arena', capacity: 7500, genre_focus: 'Large shows', ig: 'margaretcourtarena' },
    ],
    promoters: [
      P({
        name: 'Hospitality Melbourne (Undivide)', type: 'undivide',
        active_since: 2018, events_per_year: 3,
        dominant_genre: 'Liquid',
        ig: 'hospitalitydnb',
        lineup: ['Logistics', 'Etherwood', 'Hybrid Minds', 'Fred V & Grafix'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'Hospitality Melbourne', venue: 'Seven Nightclub', cap: 1200, sold: 1150 },
        ],
      }),
      P({
        name: 'Plasma Audio / Twisted Audio', type: 'local',
        active_since: 2014, events_per_year: 6,
        dominant_genre: 'Neurofunk / Liquid',
        ig: 'plasmaaudio', website: 'plasma-audio.com',
        lineup: ['Safire', 'Alix Perez', 'Doc Scott', 'DLR', 'Skeptical', 'Icicle'],
        events: [
          { date: '2024', year: 2024, name: 'Plasma Audio presents', venue: 'Seven Nightclub', cap: 800, sold: 750 },
        ],
      }),
    ],
  }),

  // ──────────────────────────── GROWTH MARKETS ────────────────────────────
  C({
    id: 'antwerp', name: 'Antwerp', country: 'Belgium',
    lat: 51.22, lng: 4.40, status: 'growth',
    dominant_genre: 'All styles — festival market',
    market: M({
      population_city_millions: 0.52,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Liquid / Neurofunk',
      secondary_subgenres: ['Dancefloor', 'Jump Up'],
      avg_ticket_eur: 55,
      competing_events_per_year: 5,
      revenue_potential: '€1.2M (festival)',
      yoy_growth: '+15%',
      scene_notes: 'Rampage Open Air (est. 2012, annual sellout, 25,000 cap) is one of Europe\'s top DnB/bass festivals. Held annually in Antwerp. Lineup typically includes Chase & Status, Sub Focus, Noisia, Mefjus, Pendulum.',
    }),
    clubs: [
      { name: 'Rampage Open Air site', capacity: 25000, genre_focus: 'Annual DnB/bass festival', ig: 'rampagefestival' },
      { name: 'Trix', capacity: 2000, genre_focus: 'Live shows and club nights', ig: 'trix_antwerp' },
    ],
    promoters: [
      P({
        name: 'Rampage Festival', type: 'local',
        active_since: 2012, events_per_year: 2,
        dominant_genre: 'All DnB / Bass music',
        ig: 'rampagefestival', website: 'rampagefestival.be',
        lineup: ['Chase & Status', 'Sub Focus', 'Noisia', 'Mefjus', 'Pendulum', 'Andy C', 'Shy FX', 'Friction', 'Hedex', 'Wilkinson'],
        events: [
          { date: 'Jun 2024', year: 2024, name: 'Rampage Open Air 2024', venue: 'Antwerp Open Air Site', cap: 25000, sold: 25000 },
          { date: 'Jun 2023', year: 2023, name: 'Rampage Open Air 2023', venue: 'Antwerp Open Air Site', cap: 22000, sold: 22000 },
        ],
      }),
    ],
  }),

  C({
    id: 'tokyo', name: 'Tokyo', country: 'Japan',
    lat: 35.68, lng: 139.69, status: 'growth',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 13.9,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 35,
      competing_events_per_year: 15,
      revenue_potential: '€900k',
      yoy_growth: '+35%',
      scene_notes: 'Safire (Melbourne) played Japan multiple times, confirming international DnB touring interest. UKF Japan active since 2019. Tokyo has active club circuit with strong electronic music culture.',
    }),
    clubs: [
      { name: 'Womb Tokyo', capacity: 800, genre_focus: 'Electronic, regular DnB nights', ig: 'womb_official' },
      { name: 'Unit Tokyo', capacity: 600, genre_focus: 'Underground electronic, DnB', ig: 'unit_tokyo' },
      { name: 'Zepp Tokyo', capacity: 2700, genre_focus: 'Larger shows', ig: 'zepptokyo' },
    ],
    promoters: [
      P({
        name: 'UKF Japan (Undivide)', type: 'undivide',
        active_since: 2019, events_per_year: 2,
        dominant_genre: 'Dancefloor',
        ig: 'ukf',
        lineup: ['Chase & Status', 'Sub Focus', 'Wilkinson', 'Friction'],
        events: [
          { date: 'Apr 2024', year: 2024, name: 'UKF On Air Tokyo', venue: 'Zepp Tokyo', cap: 2700, sold: 2500 },
        ],
      }),
    ],
  }),

  // ──────────────────────────── NEW TERRITORIES ────────────────────────────
  C({
    id: 'saopaulo', name: 'São Paulo', country: 'Brazil',
    lat: -23.55, lng: -46.63, status: 'new',
    dominant_genre: 'Dancefloor / Jump Up',
    market: M({
      population_city_millions: 12.3,
      dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Dancefloor',
      secondary_subgenres: ['Jump Up', 'Liquid'],
      avg_ticket_eur: 20,
      competing_events_per_year: 10,
      revenue_potential: '€400k',
      yoy_growth: '+45%',
      scene_notes: 'DJ Marky (Brazilian DnB legend, signed to Hospital Records) is the scene\'s figurehead globally. D-Edge Club São Paulo is one of Latin America\'s top electronic venues. Sambass subgenre originated here.',
    }),
    clubs: [
      { name: 'D-Edge', capacity: 2500, genre_focus: 'Top electronic venue in Latin America, DnB nights', ig: 'dedgeclub' },
      { name: 'Cine Jóia', capacity: 1500, genre_focus: 'Electronic events', ig: 'cinejoia' },
    ],
    promoters: [
      P({
        name: 'DJ Marky Productions', type: 'independent',
        active_since: 2000, events_per_year: 5,
        dominant_genre: 'Liquid / Dancefloor',
        ig: 'djmarkyofficial',
        lineup: ['DJ Marky', 'Logistics', 'S.P.Y', 'Calibre'],
        events: [
          { date: '2024', year: 2024, name: 'Marky & Friends', venue: 'D-Edge São Paulo', cap: 1500, sold: 1400 },
        ],
      }),
    ],
  }),

  // ──────────────────────────── ADDITIONAL EUROPEAN MARKETS ────────────────────────────

  C({
    id: 'paris', name: 'Paris', country: 'France',
    lat: 48.8566, lng: 2.3522, status: 'growth',
    dominant_genre: 'Liquid / Jungle / All styles',
    market: M({
      population_city_millions: 11.2,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Jungle', 'Neurofunk', 'Dancefloor'],
      avg_ticket_eur: 22,
      competing_events_per_year: 60,
      revenue_potential: '€1M+',
      yoy_growth: '+18%',
      scene_notes: 'Forever DnB (Elisa Do Brasil) on Rinse France since 2017 — the reference DnB crew. Concrete legacy + new Essaim club (400 cap, 2024) anchor the scene.',
    }),
    clubs: [
      { name: 'La Machine du Moulin Rouge', capacity: 1000, genre_focus: 'Electronic, DnB nights', ig: 'lamachinedumoulinrouge' },
      { name: 'Glazart', capacity: 700, genre_focus: 'Bass music, DnB, dub', ig: 'glazartofficial' },
      { name: 'Essaim', capacity: 400, genre_focus: 'New club from Concrete AD', ig: 'essaimclub' },
      { name: 'Le Trabendo', capacity: 700, genre_focus: 'Electronic, bass shows', ig: 'letrabendo' },
    ],
    promoters: [
      P({
        name: 'Forever DnB', type: 'local',
        active_since: 2010, events_per_year: 12,
        dominant_genre: 'Liquid / All styles',
        ig: 'foreverdnb', website: 'rinse.fr',
        lineup: ['Elisa Do Brasil', 'Marky', 'LTJ Bukem', 'Calibre', 'Lenzman'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Forever DnB x Rinse France', venue: 'La Machine du Moulin Rouge', cap: 1000, sold: 920 },
          { date: 'May 2024', year: 2024, name: 'Forever DnB Spring', venue: 'Glazart', cap: 700, sold: 680 },
        ],
      }),
      P({
        name: 'Jungle Syndicate', type: 'independent',
        active_since: 2015, events_per_year: 6,
        dominant_genre: 'Jungle',
        ig: 'junglesyndicate',
        lineup: ['Aphrodite', 'Congo Natty', 'Serial Killaz'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Jungle Syndicate', venue: 'Glazart', cap: 700, sold: 600 },
        ],
      }),
    ],
  }),

  C({
    id: 'lyon', name: 'Lyon', country: 'France',
    lat: 45.764, lng: 4.8357, status: 'emerging',
    dominant_genre: 'Bass music / DnB',
    market: M({
      population_city_millions: 1.7,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 16,
      competing_events_per_year: 25,
      revenue_potential: '€250k',
      yoy_growth: '+30%',
      scene_notes: 'Physical Tool collective is the bass-music backbone — launched RETREAT DnB series in 2024. Active scene at Sucre and Le Sucre rooftop.',
    }),
    clubs: [
      { name: 'Le Sucre', capacity: 600, genre_focus: 'Electronic, DnB & bass', ig: 'lesucrelyon' },
      { name: 'Le Sonic', capacity: 350, genre_focus: 'Underground electronic', ig: 'lesoniclyon' },
    ],
    promoters: [
      P({
        name: 'Physical Tool', type: 'local',
        active_since: 2014, events_per_year: 10,
        dominant_genre: 'Bass music / DnB',
        ig: 'physicaltool',
        lineup: ['Mefjus', 'Skantia', 'Bou', 'Tsuki'],
        events: [
          { date: 'Feb 2024', year: 2024, name: 'RETREAT #1', venue: 'Le Sucre', cap: 600, sold: 540 },
          { date: 'Apr 2024', year: 2024, name: 'RETREAT #2', venue: 'Le Sucre', cap: 600, sold: 580 },
        ],
      }),
    ],
  }),

  C({
    id: 'marseille', name: 'Marseille', country: 'France',
    lat: 43.2965, lng: 5.3698, status: 'emerging',
    dominant_genre: 'Jump Up / Dancefloor',
    market: M({
      population_city_millions: 1.6,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Jump Up',
      secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 11,
      competing_events_per_year: 18,
      revenue_potential: '€180k',
      yoy_growth: '+25%',
      scene_notes: 'Menace Rekords runs the recurring DnB Night at Le Molotov. Le Makeda hosts Hyperactivity Music label nights. Friche la Belle de Mai brings bigger international acts.',
    }),
    clubs: [
      { name: 'Le Molotov', capacity: 250, genre_focus: 'DnB & bass nights', ig: 'lemolotov' },
      { name: 'Le Makeda', capacity: 400, genre_focus: 'DnB label nights', ig: 'lemakeda' },
      { name: 'Friche la Belle de Mai', capacity: 1500, genre_focus: 'Larger electronic & bass', ig: 'lafrichebellemai' },
    ],
    promoters: [
      P({
        name: 'Menace Rekords', type: 'independent',
        active_since: 2018, events_per_year: 8,
        dominant_genre: 'Jump Up / Dancefloor',
        ig: 'menacerekords',
        lineup: ['Bou', 'Tsuki', 'Sl8r', 'Disrupta'],
        events: [
          { date: 'Feb 2026', year: 2026, name: 'DnB Night #6', venue: 'Le Molotov', cap: 250, sold: 230 },
          { date: 'Oct 2024', year: 2024, name: 'DnB Night #4', venue: 'Le Molotov', cap: 250, sold: 240 },
        ],
      }),
      P({
        name: 'Hyperactivity Music', type: 'independent',
        active_since: 2015, events_per_year: 6,
        dominant_genre: 'DnB / Bass',
        ig: 'hyperactivitymusic',
        lineup: ['Phatt', 'Brk', 'K-MI'],
        events: [
          { date: 'May 2024', year: 2024, name: 'Label Night & Phatt B-day', venue: 'Le Makeda', cap: 400, sold: 380 },
        ],
      }),
    ],
  }),

  C({
    id: 'lisbon', name: 'Lisbon', country: 'Portugal',
    lat: 38.7223, lng: -9.1393, status: 'new',
    dominant_genre: 'Liquid / Minimal',
    market: M({
      population_city_millions: 2.9,
      dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Minimal', 'Neurofunk'],
      avg_ticket_eur: 18,
      competing_events_per_year: 15,
      revenue_potential: '€200k',
      yoy_growth: '+40%',
      scene_notes: 'Lux Frágil (cap 1500, DJ Mag Top 100 Clubs 2022) is the cultural anchor — three floors, opened 1998. Scene small but engaged, lots of expat & touring acts.',
    }),
    clubs: [
      { name: 'Lux Frágil', capacity: 1500, genre_focus: 'Electronic flagship — occasional DnB nights', ig: 'luxfragil' },
      { name: 'Ministerium', capacity: 1200, genre_focus: 'Electronic, occasional bass', ig: 'ministeriumclub' },
    ],
    promoters: [
      P({
        name: 'Bass Lisboa', type: 'independent',
        active_since: 2018, events_per_year: 6,
        dominant_genre: 'DnB / Dubstep',
        ig: 'basslisboa',
        lineup: ['S.P.Y', 'DJ Marky', 'Lenzman'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Bass Lisboa', venue: 'Lux Frágil', cap: 1500, sold: 1100 },
        ],
      }),
    ],
  }),

  C({
    id: 'cologne', name: 'Köln', country: 'Germany',
    lat: 50.9375, lng: 6.9603, status: 'growth',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 1.1,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Neurofunk', 'Jump Up'],
      avg_ticket_eur: 20,
      competing_events_per_year: 45,
      revenue_potential: '€600k',
      yoy_growth: '+22%',
      scene_notes: 'Bootshaus hosts Liquicity Cologne (sellout, ~2000 cap). Beats x Bass x Cologne run weekly Mittwochenende DnB nights at LUXOR. Stadtgarten/Jaki Club programs Bass of Cologne series.',
    }),
    clubs: [
      { name: 'Bootshaus', capacity: 2000, genre_focus: 'Liquicity, large DnB shows', ig: 'bootshaus' },
      { name: 'LUXOR', capacity: 500, genre_focus: 'Beats x Bass x Cologne weekly', ig: 'luxorkoeln' },
      { name: 'Club Bahnhof Ehrenfeld (CBE)', capacity: 600, genre_focus: 'Electronic, DnB specials', ig: 'cbe_koeln' },
      { name: 'Stadtgarten / Jaki', capacity: 400, genre_focus: 'Bass of Cologne series', ig: 'stadtgartenkoeln' },
    ],
    promoters: [
      P({
        name: 'Beats x Bass x Cologne', type: 'local',
        active_since: 2019, events_per_year: 40,
        dominant_genre: 'DnB / Techno',
        ig: 'beatsxbassxcologne',
        lineup: ['Laeti', 'Enaly', 'local residents + UK guests'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Bass of Cologne', venue: 'LUXOR', cap: 500, sold: 480 },
          { date: 'Apr 2026', year: 2026, name: 'TEAMPLAYER DnB Special #2', venue: 'CBE', cap: 600, sold: 0 },
        ],
      }),
      P({
        name: 'Liquicity (touring)', type: 'independent',
        active_since: 2010, events_per_year: 1,
        dominant_genre: 'Liquid',
        ig: 'liquicity', website: 'liquicity.com',
        lineup: ['Maduk', 'Fox Stevenson', 'Polygon', 'Whisper'],
        events: [
          { date: 'Apr 2026', year: 2026, name: 'Liquicity Cologne', venue: 'Bootshaus', cap: 2000, sold: 0 },
        ],
      }),
    ],
  }),

  C({
    id: 'milan', name: 'Milan', country: 'Italy',
    lat: 45.4642, lng: 9.19, status: 'growth',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 3.2,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Neurofunk', 'Jump Up'],
      avg_ticket_eur: 18,
      competing_events_per_year: 30,
      revenue_potential: '€450k',
      yoy_growth: '+28%',
      scene_notes: 'Mother Inc. crew runs THIS IS DNB since 1997 — longest-running DnB night in Italy. Circolo Magnolia & LINEA are home venues. Frequent label takeovers.',
    }),
    clubs: [
      { name: 'Circolo Magnolia', capacity: 2000, genre_focus: 'Outdoor electronic, DnB all-stars', ig: 'circolomagnolia' },
      { name: 'LINEA', capacity: 700, genre_focus: 'DnB label takeovers', ig: 'lineamilano' },
    ],
    promoters: [
      P({
        name: 'Mother Inc. / This Is DnB', type: 'local',
        active_since: 1997, events_per_year: 10,
        dominant_genre: 'DnB',
        ig: 'thisisdnb', website: 'motherinc.net',
        lineup: ['Tode', 'Was A Be', 'Leleprox', 'Tommy Tumble'],
        events: [
          { date: 'Apr 2024', year: 2024, name: 'Milano DnB All Stars', venue: 'Circolo Magnolia', cap: 2000, sold: 1850 },
          { date: 'Nov 2024', year: 2024, name: 'This Is DnB pres. Linea Takeover', venue: 'LINEA', cap: 700, sold: 680 },
        ],
      }),
    ],
  }),

  C({
    id: 'rome', name: 'Rome', country: 'Italy',
    lat: 41.9028, lng: 12.4964, status: 'emerging',
    dominant_genre: 'Jungle / Liquid',
    market: M({
      population_city_millions: 2.8,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Jungle', 'Jump Up'],
      avg_ticket_eur: 15,
      competing_events_per_year: 20,
      revenue_potential: '€220k',
      yoy_growth: '+20%',
      scene_notes: 'Rum — History of Drum&Bass series at Hacienda Roma celebrates classic DnB. Smaller scene than Milan but loyal community.',
    }),
    clubs: [
      { name: 'Hacienda Roma', capacity: 600, genre_focus: 'DnB, electronic', ig: 'haciendaroma' },
      { name: 'Monk', capacity: 700, genre_focus: 'Electronic & bass', ig: 'monkroma' },
    ],
    promoters: [
      P({
        name: 'Rum — History of DnB', type: 'independent',
        active_since: 2018, events_per_year: 5,
        dominant_genre: 'Jungle / DnB',
        ig: 'rumhistoryofdnb',
        lineup: ['Italian residents + UK guests'],
        events: [
          { date: 'Apr 2025', year: 2025, name: 'Rum — History of DnB', venue: 'Hacienda Roma', cap: 600, sold: 520 },
        ],
      }),
    ],
  }),

  C({
    id: 'vienna', name: 'Vienna', country: 'Austria',
    lat: 48.2082, lng: 16.3738, status: 'undivide',
    dominant_genre: 'Neurofunk / Liquid',
    market: M({
      population_city_millions: 1.95,
      dnb_scene_strength: 'legendary',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Liquid', 'Halftime', 'Dancefloor'],
      avg_ticket_eur: 25,
      competing_events_per_year: 80,
      revenue_potential: '€1.2M',
      yoy_growth: '+12%',
      scene_notes: 'One of the strongest DnB scenes in Europe. Mainframe Recordings, Camo & Krooked, Mefjus all from here. Beat It! at Gasometer pulls 3,500. UKF wrote a feature on why Austria is so exciting for DnB.',
    }),
    clubs: [
      { name: 'Gasometer (Bank Austria Halle)', capacity: 3500, genre_focus: 'Largest DnB events', ig: 'planetfestival' },
      { name: 'Flex', capacity: 800, genre_focus: 'Iconic electronic & DnB club on the Donaukanal', ig: 'flexvienna' },
      { name: 'Grelle Forelle', capacity: 600, genre_focus: 'Underground electronic', ig: 'grelleforelle' },
    ],
    promoters: [
      P({
        name: 'Mainframe Recordings', type: 'local',
        active_since: 2003, events_per_year: 10,
        dominant_genre: 'Neurofunk',
        ig: 'mainframerec', website: 'mainframerecordings.com',
        lineup: ['Camo & Krooked', 'Mefjus', 'Phace', 'Misanthrop', 'Cease'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Beat It!', venue: 'Gasometer', cap: 3500, sold: 3450 },
          { date: 'Mar 2024', year: 2024, name: 'Mainframe Night', venue: 'Flex', cap: 800, sold: 780 },
        ],
      }),
      P({
        name: 'Korsakov Music AT (Undivide)', type: 'undivide',
        active_since: 2016, events_per_year: 4,
        dominant_genre: 'Neurofunk',
        ig: 'korsakovmusic',
        lineup: ['Mefjus', 'Emperor', 'Phace', 'Misanthrop'],
        events: [
          { date: 'Jan 2024', year: 2024, name: 'Korsakov Vienna', venue: 'Flex Vienna', cap: 500, sold: 490 },
        ],
      }),
    ],
  }),

  C({
    id: 'madrid', name: 'Madrid', country: 'Spain',
    lat: 40.4168, lng: -3.7038, status: 'emerging',
    dominant_genre: 'Jump Up / Dancefloor',
    market: M({
      population_city_millions: 3.3,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Jump Up',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 16,
      competing_events_per_year: 22,
      revenue_potential: '€280k',
      yoy_growth: '+25%',
      scene_notes: 'Twist DnB Club is the hub — runs Twist XXL DnB Fest (Sala La Riviera, ~2500 cap) and DnB Addiction series. Growing community, mainly jump up & dancefloor.',
    }),
    clubs: [
      { name: 'Sala La Riviera', capacity: 2500, genre_focus: 'Largest DnB shows in Madrid', ig: 'salalariviera' },
      { name: 'Sala Etnia', capacity: 800, genre_focus: 'Twist Back to da Club series', ig: 'salaetnia' },
    ],
    promoters: [
      P({
        name: 'Twist DnB Club', type: 'local',
        active_since: 2015, events_per_year: 8,
        dominant_genre: 'Jump Up / Dancefloor',
        ig: 'twistdnbclub', website: 'twistdnbclub.com',
        lineup: ['Bou', 'Tsuki', 'Disrupta', 'Sl8r', 'Macky Gee'],
        events: [
          { date: 'Apr 2025', year: 2025, name: 'Twist XXL DnB Fest', venue: 'Sala La Riviera', cap: 2500, sold: 2300 },
          { date: 'Nov 2025', year: 2025, name: 'DnB Addiction', venue: 'Sala La Riviera', cap: 2500, sold: 0 },
        ],
      }),
    ],
  }),

  C({
    id: 'bristol', name: 'Bristol', country: 'United Kingdom',
    lat: 51.4545, lng: -2.5879, status: 'undivide',
    dominant_genre: 'Jungle / Dancefloor / Neurofunk',
    market: M({
      population_city_millions: 0.47,
      dnb_scene_strength: 'legendary',
      dominant_subgenre: 'Jungle',
      secondary_subgenres: ['Dancefloor', 'Neurofunk', 'Liquid'],
      avg_ticket_eur: 22,
      competing_events_per_year: 120,
      revenue_potential: '€900k',
      yoy_growth: '+9%',
      scene_notes: 'Spiritual home of UK bass — Roni Size, Reprazent, Krust, DJ Die. Motion + The Marble Factory weekly DnB nights. Run, In:Motion seasons & Shogun Audio shows here.',
    }),
    clubs: [
      { name: 'Motion', capacity: 5000, genre_focus: 'Largest DnB & bass venue in UK outside London', ig: 'motionbristol' },
      { name: 'The Marble Factory', capacity: 1000, genre_focus: 'DnB, bass, dubstep', ig: 'marblefactorybristol' },
      { name: 'Lakota', capacity: 1100, genre_focus: 'DnB, jungle, techno', ig: 'lakotabristol' },
      { name: 'SWX', capacity: 1300, genre_focus: 'Live + DJ DnB shows', ig: 'swxbristol' },
    ],
    promoters: [
      P({
        name: 'In:Motion', type: 'venue',
        active_since: 2009, events_per_year: 25,
        dominant_genre: 'All bass styles',
        ig: 'motionbristol', website: 'motionbristol.com',
        lineup: ['Andy C', 'Chase & Status', 'Wilkinson', 'Sub Focus', 'Hybrid Minds', 'Kanine'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'In:Motion DnB', venue: 'Motion', cap: 5000, sold: 4900 },
          { date: 'Nov 2024', year: 2024, name: 'Hospitality Bristol', venue: 'Motion', cap: 5000, sold: 4800 },
        ],
      }),
      P({
        name: 'Run', type: 'local',
        active_since: 2018, events_per_year: 8,
        dominant_genre: 'Dancefloor',
        ig: 'run.bristol',
        lineup: ['Bou', 'Tsuki', 'A.M.C', 'Turno', 'Disrupta'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Run', venue: 'Motion', cap: 5000, sold: 4700 },
        ],
      }),
    ],
  }),

  C({
    id: 'leeds', name: 'Leeds', country: 'United Kingdom',
    lat: 53.8008, lng: -1.5491, status: 'growth',
    dominant_genre: 'Jump Up / Dancefloor',
    market: M({
      population_city_millions: 0.81,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Jump Up',
      secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 18,
      competing_events_per_year: 80,
      revenue_potential: '€520k',
      yoy_growth: '+10%',
      scene_notes: 'Heavy student-driven scene. Beaver Works campus is the bass HQ — Hospitality Leeds and DnB Allstars regularly sell out 2,000+ rooms.',
    }),
    clubs: [
      { name: 'Beaver Works (Mint Warehouse)', capacity: 2300, genre_focus: 'Largest DnB warehouse in the north', ig: 'beaverworksleeds' },
      { name: 'Stylus (Leeds Uni)', capacity: 2200, genre_focus: 'Hospitality, Andy C tour stops', ig: 'leedsstudentsunion' },
      { name: 'Wire', capacity: 350, genre_focus: 'Underground DnB', ig: 'wireclubleeds' },
    ],
    promoters: [
      P({
        name: 'Beaver Works DnB', type: 'venue',
        active_since: 2014, events_per_year: 20,
        dominant_genre: 'All bass',
        ig: 'beaverworksleeds',
        lineup: ['Andy C', 'Hybrid Minds', 'Bou', 'Sub Focus', 'Wilkinson'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Hospitality Leeds', venue: 'Beaver Works', cap: 2300, sold: 2300 },
        ],
      }),
    ],
  }),

  C({
    id: 'glasgow', name: 'Glasgow', country: 'United Kingdom',
    lat: 55.8642, lng: -4.2518, status: 'growth',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 0.63,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Dancefloor', 'Jump Up'],
      avg_ticket_eur: 20,
      competing_events_per_year: 60,
      revenue_potential: '€380k',
      yoy_growth: '+8%',
      scene_notes: 'SWG3 and The Galvanizers regularly host 2,500+ DnB shows. Loyal scene — sells out fast.',
    }),
    clubs: [
      { name: 'SWG3 / Galvanizers', capacity: 2500, genre_focus: 'Large bass shows, Hospitality Glasgow', ig: 'swg3glasgow' },
      { name: 'The Garage', capacity: 600, genre_focus: 'Mid-size DnB nights', ig: 'thegarageglasgow' },
      { name: 'Sub Club', capacity: 410, genre_focus: 'Iconic underground (mostly house/techno, DnB takeovers)', ig: 'subclub' },
    ],
    promoters: [
      P({
        name: 'Pressure / SWG3', type: 'venue',
        active_since: 2010, events_per_year: 15,
        dominant_genre: 'All bass',
        ig: 'swg3glasgow',
        lineup: ['Andy C', 'Bou', 'Sub Focus', 'Mefjus', 'Kanine'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Hospitality Glasgow', venue: 'SWG3 Galvanizers', cap: 2500, sold: 2450 },
        ],
      }),
    ],
  }),

  C({
    id: 'birmingham', name: 'Birmingham', country: 'United Kingdom',
    lat: 52.4862, lng: -1.8904, status: 'growth',
    dominant_genre: 'Jump Up / Dancefloor',
    market: M({
      population_city_millions: 1.15,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Jump Up',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 18,
      competing_events_per_year: 70,
      revenue_potential: '€460k',
      yoy_growth: '+9%',
      scene_notes: 'O2 Institute hosts the biggest DnB tour stops. Lab11 and Mama Roux are core grassroots bass venues.',
    }),
    clubs: [
      { name: 'O2 Institute', capacity: 1500, genre_focus: 'DnB & bass tours', ig: 'o2institutebirmingham' },
      { name: 'Lab11', capacity: 1500, genre_focus: 'Underground bass warehouse', ig: 'lab11bham' },
      { name: 'Mama Roux\'s', capacity: 350, genre_focus: 'Intimate DnB nights', ig: 'mamarouxs' },
    ],
    promoters: [
      P({
        name: 'Lab11', type: 'venue',
        active_since: 2015, events_per_year: 30,
        dominant_genre: 'Bass / DnB',
        ig: 'lab11bham',
        lineup: ['Bou', 'Hybrid Minds', 'Turno', 'Disrupta', 'A.M.C'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Hospitality Birmingham', venue: 'O2 Institute', cap: 1500, sold: 1500 },
        ],
      }),
    ],
  }),

  C({
    id: 'zurich', name: 'Zürich', country: 'Switzerland',
    lat: 47.3769, lng: 8.5417, status: 'emerging',
    dominant_genre: 'Neurofunk / Liquid',
    market: M({
      population_city_millions: 0.43,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Liquid', 'Dancefloor'],
      avg_ticket_eur: 35,
      competing_events_per_year: 25,
      revenue_potential: '€340k',
      yoy_growth: '+14%',
      scene_notes: 'High disposable income, premium ticket pricing. Komplex 457 & X-TRA host the largest DnB nights. Rohstofflager runs intimate sold-out DnB.',
    }),
    clubs: [
      { name: 'Komplex 457', capacity: 2500, genre_focus: 'Large electronic + DnB shows', ig: 'komplex457' },
      { name: 'X-TRA', capacity: 1500, genre_focus: 'DnB & bass tours', ig: 'xtra_zurich' },
      { name: 'Rohstofflager', capacity: 600, genre_focus: 'Underground bass', ig: 'rohstofflager' },
    ],
    promoters: [
      P({
        name: 'Drumcomplex CH', type: 'local',
        active_since: 2012, events_per_year: 8,
        dominant_genre: 'Neurofunk / Liquid',
        ig: 'drumcomplex_ch',
        lineup: ['Mefjus', 'Camo & Krooked', 'Phace', 'Hybrid Minds'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Drumcomplex', venue: 'X-TRA', cap: 1500, sold: 1450 },
        ],
      }),
    ],
  }),

  C({
    id: 'munich', name: 'Munich', country: 'Germany',
    lat: 48.1351, lng: 11.5820, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 1.49,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 25,
      competing_events_per_year: 35,
      revenue_potential: '€420k',
      yoy_growth: '+13%',
      scene_notes: 'Tonhalle and Backstage Werk regularly host 2,000+ cap DnB shows. Strong appetite for Hospitality and Rampage tour stops.',
    }),
    clubs: [
      { name: 'Tonhalle München', capacity: 3000, genre_focus: 'Large DnB / electronic tours', ig: 'tonhallemuc' },
      { name: 'Backstage Werk', capacity: 1500, genre_focus: 'DnB, metal, electronic', ig: 'backstagemunich' },
      { name: 'Muffatwerk', capacity: 1200, genre_focus: 'Electronic + DnB', ig: 'muffatwerk' },
    ],
    promoters: [
      P({
        name: 'BLN.FM Bass', type: 'local',
        active_since: 2014, events_per_year: 6,
        dominant_genre: 'Neurofunk',
        ig: 'tonhallemuc',
        lineup: ['Mefjus', 'Phace', 'Camo & Krooked', 'Bou'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Hospitality Munich', venue: 'Tonhalle', cap: 3000, sold: 2900 },
        ],
      }),
    ],
  }),

  C({
    id: 'hamburg', name: 'Hamburg', country: 'Germany',
    lat: 53.5511, lng: 9.9937, status: 'emerging',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 1.84,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Neurofunk', 'Dancefloor'],
      avg_ticket_eur: 22,
      competing_events_per_year: 40,
      revenue_potential: '€480k',
      yoy_growth: '+11%',
      scene_notes: 'Markthalle and Übel & Gefährlich anchor the scene. Steady rotation of UK headliners. Strong port-city electronic culture.',
    }),
    clubs: [
      { name: 'Markthalle', capacity: 1100, genre_focus: 'DnB, drum tours, hip-hop', ig: 'markthallehh' },
      { name: 'Übel & Gefährlich', capacity: 850, genre_focus: 'Electronic, DnB nights', ig: 'uebelundgefaehrlich' },
      { name: 'Mojo Club', capacity: 500, genre_focus: 'Underground DnB nights', ig: 'mojohamburg' },
    ],
    promoters: [
      P({
        name: 'Bassgeflüster', type: 'local',
        active_since: 2013, events_per_year: 10,
        dominant_genre: 'Liquid / Neurofunk',
        ig: 'bassgefluester',
        lineup: ['Hybrid Minds', 'BCee', 'Camo & Krooked', 'Mefjus'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Bassgeflüster', venue: 'Markthalle', cap: 1100, sold: 1050 },
        ],
      }),
    ],
  }),

  C({
    id: 'frankfurt', name: 'Frankfurt', country: 'Germany',
    lat: 50.1109, lng: 8.6821, status: 'emerging',
    dominant_genre: 'Neurofunk / Jump Up',
    market: M({
      population_city_millions: 0.77,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Jump Up', 'Liquid'],
      avg_ticket_eur: 22,
      competing_events_per_year: 25,
      revenue_potential: '€280k',
      yoy_growth: '+10%',
      scene_notes: 'Batschkapp anchors DnB tours. Strong techno history bleeding into bass nights at Tanzhaus West.',
    }),
    clubs: [
      { name: 'Batschkapp', capacity: 1500, genre_focus: 'DnB & bass tours', ig: 'batschkapp' },
      { name: 'Tanzhaus West', capacity: 800, genre_focus: 'Electronic + DnB takeovers', ig: 'tanzhauswest' },
    ],
    promoters: [
      P({
        name: 'Frankfurt Bass Society', type: 'local',
        active_since: 2016, events_per_year: 6,
        dominant_genre: 'Neurofunk',
        ig: 'batschkapp',
        lineup: ['Mefjus', 'Phace', 'Camo & Krooked'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Bass Society', venue: 'Batschkapp', cap: 1500, sold: 1300 },
        ],
      }),
    ],
  }),

  C({
    id: 'copenhagen', name: 'Copenhagen', country: 'Denmark',
    lat: 55.6761, lng: 12.5683, status: 'emerging',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 0.66,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Neurofunk', 'Dancefloor'],
      avg_ticket_eur: 28,
      competing_events_per_year: 25,
      revenue_potential: '€320k',
      yoy_growth: '+15%',
      scene_notes: 'Pumpehuset and Vega are the main DnB destinations. High purchasing power, strong appetite for Hospitality tours.',
    }),
    clubs: [
      { name: 'Pumpehuset', capacity: 600, genre_focus: 'DnB, bass, electronic', ig: 'pumpehuset' },
      { name: 'Vega', capacity: 1550, genre_focus: 'Large DnB tours', ig: 'vegacph' },
      { name: 'Rust', capacity: 600, genre_focus: 'Underground bass', ig: 'rustcph' },
    ],
    promoters: [
      P({
        name: 'Copenhagen Bass', type: 'local',
        active_since: 2015, events_per_year: 8,
        dominant_genre: 'Liquid',
        ig: 'pumpehuset',
        lineup: ['Hybrid Minds', 'BCee', 'Mozey', 'Whiney'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Hospitality CPH', venue: 'Vega', cap: 1550, sold: 1500 },
        ],
      }),
    ],
  }),

  C({
    id: 'stockholm', name: 'Stockholm', country: 'Sweden',
    lat: 59.3293, lng: 18.0686, status: 'emerging',
    dominant_genre: 'Neurofunk / Liquid',
    market: M({
      population_city_millions: 0.98,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Liquid', 'Dancefloor'],
      avg_ticket_eur: 30,
      competing_events_per_year: 22,
      revenue_potential: '€340k',
      yoy_growth: '+12%',
      scene_notes: 'Fryshuset and Slaktkyrkan host the biggest tours. Loyal Nordic DnB crowd, premium ticket pricing.',
    }),
    clubs: [
      { name: 'Fryshuset Arenan', capacity: 2500, genre_focus: 'Large DnB tours', ig: 'fryshuset' },
      { name: 'Slaktkyrkan', capacity: 1200, genre_focus: 'Electronic + DnB warehouse', ig: 'slaktkyrkan' },
      { name: 'Nalen', capacity: 700, genre_focus: 'Mid-size DnB', ig: 'nalenstockholm' },
    ],
    promoters: [
      P({
        name: 'Bass Republic SE', type: 'local',
        active_since: 2014, events_per_year: 7,
        dominant_genre: 'Neurofunk / Liquid',
        ig: 'slaktkyrkan',
        lineup: ['Mefjus', 'Hybrid Minds', 'Camo & Krooked', 'BCee'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Hospitality Stockholm', venue: 'Slaktkyrkan', cap: 1200, sold: 1100 },
        ],
      }),
    ],
  }),

  C({
    id: 'auckland', name: 'Auckland', country: 'New Zealand',
    lat: -36.8485, lng: 174.7633, status: 'emerging',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 1.66,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 30,
      competing_events_per_year: 60,
      revenue_potential: '€620k',
      yoy_growth: '+11%',
      scene_notes: 'NZ punches massively above its weight in DnB — Shapeshifter, Truth, State of Mind all from here. Powerstation and Trusts Arena host huge shows.',
    }),
    clubs: [
      { name: 'Powerstation', capacity: 1100, genre_focus: 'DnB & bass live shows', ig: 'powerstationnz' },
      { name: 'The Studio', capacity: 800, genre_focus: 'DnB nights, bass tours', ig: 'thestudioauckland' },
      { name: 'Trusts Arena', capacity: 4500, genre_focus: 'Largest DnB events (Hospitality, Rampage)', ig: 'trustsarena' },
    ],
    promoters: [
      P({
        name: 'A:LIVE', type: 'local',
        active_since: 2012, events_per_year: 12,
        dominant_genre: 'All bass',
        ig: 'aliveevents',
        lineup: ['Sub Focus', 'Wilkinson', 'Hybrid Minds', 'Andy C', 'Netsky'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'A:LIVE', venue: 'Trusts Arena', cap: 4500, sold: 4400 },
        ],
      }),
      P({
        name: 'UKF NZ (Undivide)', type: 'undivide',
        active_since: 2019, events_per_year: 1,
        dominant_genre: 'All styles',
        ig: 'ukf', website: 'ukf.com',
        lineup: ['Sub Focus', 'Wilkinson', 'Dimension'],
        events: [
          { date: 'Mar 2024', year: 2024, name: 'UKF On Air Auckland', venue: 'Powerstation', cap: 1100, sold: 1080 },
        ],
      }),
    ],
  }),

  C({
    id: 'toronto', name: 'Toronto', country: 'Canada',
    lat: 43.6532, lng: -79.3832, status: 'emerging',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 2.93,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 26,
      competing_events_per_year: 45,
      revenue_potential: '€560k',
      yoy_growth: '+14%',
      scene_notes: 'Rebel and CODA are the bass anchors. Hybrid Minds, Sub Focus all sell 2,500+. Diverse subgenre coverage.',
    }),
    clubs: [
      { name: 'Rebel', capacity: 2400, genre_focus: 'Large DnB tours', ig: 'rebeltoronto' },
      { name: 'CODA', capacity: 600, genre_focus: 'Underground electronic + DnB', ig: 'codatoronto' },
      { name: 'History', capacity: 2500, genre_focus: 'Live bass / DnB tours', ig: 'historytoronto' },
    ],
    promoters: [
      P({
        name: 'Embrace Presents', type: 'local',
        active_since: 2010, events_per_year: 20,
        dominant_genre: 'All bass',
        ig: 'embracepresents',
        lineup: ['Hybrid Minds', 'Sub Focus', 'Andy C', 'Netsky', 'Wilkinson'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Hybrid Minds Toronto', venue: 'Rebel', cap: 2400, sold: 2300 },
        ],
      }),
    ],
  }),

  C({
    id: 'losangeles', name: 'Los Angeles', country: 'United States',
    lat: 34.0522, lng: -118.2437, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 3.9,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 35,
      competing_events_per_year: 80,
      revenue_potential: '€1.1M',
      yoy_growth: '+18%',
      scene_notes: 'Respect DnB at Exchange LA every Thursday is legendary — longest-running DnB night in the US. Academy LA hosts biggest tours.',
    }),
    clubs: [
      { name: 'Exchange LA', capacity: 1500, genre_focus: 'Respect DnB weekly', ig: 'exchangela' },
      { name: 'Academy LA', capacity: 2000, genre_focus: 'DnB, bass tours', ig: 'academylaofficial' },
      { name: 'Sound Nightclub', capacity: 700, genre_focus: 'Electronic + DnB', ig: 'soundnightclub' },
    ],
    promoters: [
      P({
        name: 'Respect DnB', type: 'local',
        active_since: 2002, events_per_year: 50,
        dominant_genre: 'All DnB',
        ig: 'respectdnb', website: 'respectdnb.com',
        lineup: ['Andy C', 'Sub Focus', 'Mefjus', 'Bou', 'Dieselboy'],
        events: [
          { date: 'Every Thu', year: 2024, name: 'Respect', venue: 'Exchange LA', cap: 1500, sold: 1300 },
        ],
      }),
      P({
        name: 'UKF USA (Undivide)', type: 'undivide',
        active_since: 2017, events_per_year: 3,
        dominant_genre: 'All styles',
        ig: 'ukf', website: 'ukf.com',
        lineup: ['Sub Focus', 'Wilkinson', 'Dimension', 'Culture Shock'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'UKF On Air LA', venue: 'Academy LA', cap: 2000, sold: 1900 },
          { date: 'May 2023', year: 2023, name: 'UKF On Air LA', venue: 'Exchange LA', cap: 1500, sold: 1450 },
        ],
      }),
    ],
  }),

  C({
    id: 'newyork', name: 'New York', country: 'United States',
    lat: 40.7128, lng: -74.0060, status: 'emerging',
    dominant_genre: 'Liquid / Jungle',
    market: M({
      population_city_millions: 8.4,
      dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid',
      secondary_subgenres: ['Jungle', 'Neurofunk'],
      avg_ticket_eur: 35,
      competing_events_per_year: 70,
      revenue_potential: '€1.3M',
      yoy_growth: '+16%',
      scene_notes: 'Jungle revival epicenter in the US. Brooklyn Mirage, Knockdown Center and Avant Gardner host massive tours.',
    }),
    clubs: [
      { name: 'Brooklyn Mirage', capacity: 6000, genre_focus: 'Large DnB & bass tours', ig: 'brooklynmirage' },
      { name: 'Knockdown Center', capacity: 3200, genre_focus: 'Bass warehouse', ig: 'knockdowncenter' },
      { name: 'Avant Gardner', capacity: 6000, genre_focus: 'Large electronic + DnB', ig: 'avantgardner_bk' },
    ],
    promoters: [
      P({
        name: 'Teksupport', type: 'local',
        active_since: 2017, events_per_year: 25,
        dominant_genre: 'All bass',
        ig: 'teksupport',
        lineup: ['Sub Focus', 'Andy C', 'Hybrid Minds', 'Chase & Status'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Sub Focus NYC', venue: 'Brooklyn Mirage', cap: 6000, sold: 5800 },
        ],
      }),
      P({
        name: 'UKF NYC (Undivide)', type: 'undivide',
        active_since: 2018, events_per_year: 2,
        dominant_genre: 'All styles',
        ig: 'ukf', website: 'ukf.com',
        lineup: ['Sub Focus', 'Wilkinson', 'Dimension', 'Chase & Status'],
        events: [
          { date: 'Aug 2024', year: 2024, name: 'UKF On Air NYC', venue: 'Brooklyn Mirage', cap: 6000, sold: 5700 },
          { date: 'Sep 2023', year: 2023, name: 'UKF On Air NYC', venue: 'Knockdown Center', cap: 3200, sold: 3100 },
        ],
      }),
    ],
  }),

  // ──────────────────────────── EMERGING GLOBAL TERRITORIES (verified 2024–2025) ────────────────────────────

  C({
    id: 'mumbai', name: 'Mumbai', country: 'India',
    lat: 19.076, lng: 72.8777, status: 'emerging',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 20.7, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Neurofunk', 'Jungle'],
      avg_ticket_eur: 12, competing_events_per_year: 18, revenue_potential: '€180k', yoy_growth: '+35%',
      scene_notes: 'Drum & Bass India (DNBI) anchors the national scene since 2013 — 12-year anniversary weekender 2025. Antisocial and Bonobo are the regular DnB venues. Strong producer pipeline (The Untitled One, Calm Chor).',
    }),
    clubs: [
      { name: 'Antisocial', capacity: 350, genre_focus: 'Underground bass, DnB nights', ig: 'antisocialin' },
      { name: 'Bonobo', capacity: 250, genre_focus: 'DnB & bass parties', ig: 'bonobo_mumbai' },
    ],
    promoters: [
      P({
        name: 'Drum & Bass India', type: 'local',
        active_since: 2013, events_per_year: 20, dominant_genre: 'All DnB',
        ig: 'drumandbassindia', website: 'drumandbassindia.com',
        lineup: ['The Untitled One', 'Calm Chor', 'Sun-J', 'Degs', 'Whiney'],
        events: [
          { date: 'Feb 2025', year: 2025, name: 'DNBI 12-Year Weekender', venue: 'Antisocial', cap: 350, sold: 350 },
          { date: 'Sep 2024', year: 2024, name: 'DNBI Mumbai', venue: 'Bonobo', cap: 250, sold: 240 },
        ],
      }),
    ],
  }),

  C({
    id: 'bangalore', name: 'Bangalore', country: 'India',
    lat: 12.9716, lng: 77.5946, status: 'emerging',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 13.2, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 14, competing_events_per_year: 22, revenue_potential: '€220k', yoy_growth: '+38%',
      scene_notes: 'Tech-hub crowd with strong appetite for international DnB tours. Fandom and Bay 146 host regular DNBI nights. Booming festival circuit.',
    }),
    clubs: [
      { name: 'Fandom at Gilly\'s Redefined', capacity: 800, genre_focus: 'Bass & DnB tours', ig: 'fandombangalore' },
      { name: 'Bay 146', capacity: 600, genre_focus: 'Underground electronic', ig: 'bay146' },
    ],
    promoters: [
      P({
        name: 'Drum & Bass India BLR', type: 'local',
        active_since: 2014, events_per_year: 12, dominant_genre: 'All DnB',
        ig: 'drumandbassindia',
        lineup: ['Bou', 'Whiney', 'The Untitled One', 'Sun-J'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'DNBI Bangalore', venue: 'Fandom', cap: 800, sold: 750 },
        ],
      }),
    ],
  }),

  C({
    id: 'delhi', name: 'New Delhi', country: 'India',
    lat: 28.6139, lng: 77.2090, status: 'emerging',
    dominant_genre: 'Neurofunk / Jungle',
    market: M({
      population_city_millions: 32.9, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Jungle', 'Liquid'],
      avg_ticket_eur: 13, competing_events_per_year: 15, revenue_potential: '€200k', yoy_growth: '+30%',
      scene_notes: 'Auro Kitchen & Bar and Summer House Café host the DNBI Delhi chapters. Hard heavyweight crowd.',
    }),
    clubs: [
      { name: 'Summer House Café', capacity: 400, genre_focus: 'Bass nights, DnB', ig: 'summerhousecafe' },
      { name: 'Auro Kitchen & Bar', capacity: 300, genre_focus: 'Underground DnB', ig: 'aurokitchenandbar' },
    ],
    promoters: [
      P({
        name: 'Drum & Bass India Delhi', type: 'local',
        active_since: 2014, events_per_year: 10, dominant_genre: 'All DnB',
        ig: 'drumandbassindia',
        lineup: ['Bou', 'Whiney', 'Degs', 'The Untitled One'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'DNBI Delhi', venue: 'Summer House Café', cap: 400, sold: 380 },
        ],
      }),
    ],
  }),

  C({
    id: 'yangon', name: 'Yangon', country: 'Myanmar',
    lat: 16.8409, lng: 96.1735, status: 'new',
    dominant_genre: 'Liquid / Modern DnB',
    market: M({
      population_city_millions: 5.4, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Neurofunk'],
      avg_ticket_eur: 8, competing_events_per_year: 6, revenue_potential: '€40k', yoy_growth: '+50%',
      scene_notes: 'Radiant Light Unit (Burmese DnB pioneer) is leading a one-man revolution from Yangon — championed in international press. Tiny but passionate underground.',
    }),
    clubs: [
      { name: 'Pioneer Club', capacity: 400, genre_focus: 'Electronic, occasional DnB', ig: 'pioneeryangon' },
    ],
    promoters: [
      P({
        name: 'Radiant Light Unit collective', type: 'local',
        active_since: 2020, events_per_year: 4, dominant_genre: 'Modern DnB',
        ig: 'radiantlightunit',
        lineup: ['Radiant Light Unit', 'local crews'],
        events: [
          { date: 'May 2024', year: 2024, name: 'RLU Showcase Yangon', venue: 'Pioneer Club', cap: 400, sold: 320 },
        ],
      }),
    ],
  }),

  C({
    id: 'bangkok', name: 'Bangkok', country: 'Thailand',
    lat: 13.7563, lng: 100.5018, status: 'emerging',
    dominant_genre: 'Jungle / Liquid',
    market: M({
      population_city_millions: 10.7, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Jungle', secondary_subgenres: ['Liquid', 'Neurofunk'],
      avg_ticket_eur: 18, competing_events_per_year: 30, revenue_potential: '€280k', yoy_growth: '+28%',
      scene_notes: 'Jungle Jam BKK has anchored the scene since 2020. DnB Thailand directory unites the country. Mustache Bangkok and De Commune host regular DnB nights.',
    }),
    clubs: [
      { name: 'De Commune', capacity: 600, genre_focus: 'DnB, jungle, bass', ig: 'decommunebkk' },
      { name: 'Mustache Bangkok', capacity: 500, genre_focus: 'Underground bass + DnB', ig: 'mustachebkk' },
    ],
    promoters: [
      P({
        name: 'Jungle Jam BKK', type: 'local',
        active_since: 2020, events_per_year: 12, dominant_genre: 'Jungle / DnB',
        ig: 'junglejambkk', website: 'junglejambkk.com',
        lineup: ['Degs', 'Tim Reaper', 'Sherelle', 'Coco Bryce'],
        events: [
          { date: 'Mar 2025', year: 2025, name: 'Jungle Jam BKK', venue: 'De Commune', cap: 600, sold: 580 },
          { date: 'Nov 2024', year: 2024, name: 'Jungle Jam BKK', venue: 'Mustache Bangkok', cap: 500, sold: 480 },
        ],
      }),
    ],
  }),

  C({
    id: 'phuket', name: 'Phuket', country: 'Thailand',
    lat: 7.8804, lng: 98.3923, status: 'new',
    dominant_genre: 'Dancefloor / Liquid',
    market: M({
      population_city_millions: 0.42, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Dancefloor', secondary_subgenres: ['Liquid'],
      avg_ticket_eur: 22, competing_events_per_year: 12, revenue_potential: '€90k', yoy_growth: '+40%',
      scene_notes: 'District1 brings UK headliners (Degs, etc.) to the island. Tourist-driven crowd, high spend per head.',
    }),
    clubs: [
      { name: 'District1 Phuket', capacity: 500, genre_focus: 'DnB + bass', ig: 'district1dnb' },
    ],
    promoters: [
      P({
        name: 'District1', type: 'local',
        active_since: 2022, events_per_year: 10, dominant_genre: 'DnB',
        ig: 'district1dnb', website: 'district1dnb.com',
        lineup: ['Degs', 'Tantrum Desire', 'Bou'],
        events: [
          { date: 'Feb 2024', year: 2024, name: 'District1 Degs', venue: 'District1 Phuket', cap: 500, sold: 480 },
        ],
      }),
    ],
  }),

  C({
    id: 'hochiminh', name: 'Ho Chi Minh City', country: 'Vietnam',
    lat: 10.8231, lng: 106.6297, status: 'new',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 9.0, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Dancefloor'],
      avg_ticket_eur: 11, competing_events_per_year: 10, revenue_potential: '€80k', yoy_growth: '+45%',
      scene_notes: 'Scientific Sound Asia hosts DnB / bass / hip hop showcases like Mad Circus. Underground crowd growing fast post-pandemic.',
    }),
    clubs: [
      { name: 'The Observatory', capacity: 400, genre_focus: 'Underground electronic + bass', ig: 'theobservatory.hcmc' },
    ],
    promoters: [
      P({
        name: 'Scientific Sound Asia', type: 'local',
        active_since: 2018, events_per_year: 8, dominant_genre: 'Bass / DnB',
        ig: 'scientificsoundasia', website: 'scientificsound.asia',
        lineup: ['Local DJs', 'Asia tour selectors'],
        events: [
          { date: 'Aug 2024', year: 2024, name: 'Mad Circus 2', venue: 'The Observatory', cap: 400, sold: 360 },
        ],
      }),
    ],
  }),

  C({
    id: 'shanghai', name: 'Shanghai', country: 'China',
    lat: 31.2304, lng: 121.4737, status: 'emerging',
    dominant_genre: 'Neurofunk / Liquid',
    market: M({
      population_city_millions: 26.3, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Liquid', 'Dancefloor'],
      avg_ticket_eur: 28, competing_events_per_year: 25, revenue_potential: '€450k', yoy_growth: '+25%',
      scene_notes: 'ALL Club is the underground HQ. Storm Festival has hosted DnB stages. SVBKVLT label connects bass culture across China.',
    }),
    clubs: [
      { name: 'ALL Club', capacity: 400, genre_focus: 'Underground bass / DnB', ig: 'all_club_shanghai' },
      { name: 'Elevator', capacity: 350, genre_focus: 'Bass, DnB, techno', ig: 'elevator.sh' },
    ],
    promoters: [
      P({
        name: 'SVBKVLT', type: 'local',
        active_since: 2013, events_per_year: 20, dominant_genre: 'Bass / Club',
        ig: 'svbkvlt', website: 'svbkvlt.com',
        lineup: ['Swimful', 'Hyph11E', 'international DnB tours'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'SVBKVLT Showcase', venue: 'ALL Club', cap: 400, sold: 390 },
        ],
      }),
    ],
  }),

  C({
    id: 'beijing', name: 'Beijing', country: 'China',
    lat: 39.9042, lng: 116.4074, status: 'new',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 21.5, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor'],
      avg_ticket_eur: 24, competing_events_per_year: 14, revenue_potential: '€280k', yoy_growth: '+22%',
      scene_notes: 'Zhao Dai is the bass-music institution. Smaller scene than Shanghai but loyal underground following.',
    }),
    clubs: [
      { name: 'Zhao Dai', capacity: 450, genre_focus: 'Underground electronic, bass', ig: 'zhaodaiclub' },
    ],
    promoters: [
      P({
        name: 'Zhao Dai Bookings', type: 'venue',
        active_since: 2017, events_per_year: 12, dominant_genre: 'Bass / DnB',
        ig: 'zhaodaiclub',
        lineup: ['China bass DJs', 'visiting DnB acts'],
        events: [
          { date: 'Jun 2024', year: 2024, name: 'Bass Night Beijing', venue: 'Zhao Dai', cap: 450, sold: 400 },
        ],
      }),
    ],
  }),

  C({
    id: 'seoul', name: 'Seoul', country: 'South Korea',
    lat: 37.5665, lng: 126.9780, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 9.7, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor', 'Jump Up'],
      avg_ticket_eur: 32, competing_events_per_year: 28, revenue_potential: '€520k', yoy_growth: '+24%',
      scene_notes: 'Cakeshop and Vurt are the bass / DnB destinations in Itaewon and Hongdae. Strong appetite for international DnB tours.',
    }),
    clubs: [
      { name: 'Cakeshop', capacity: 400, genre_focus: 'Bass, DnB, club', ig: 'cakeshopseoul' },
      { name: 'Vurt', capacity: 350, genre_focus: 'Underground electronic + DnB', ig: 'vurt_official' },
    ],
    promoters: [
      P({
        name: 'Cakeshop Bookings', type: 'venue',
        active_since: 2012, events_per_year: 30, dominant_genre: 'Bass / DnB',
        ig: 'cakeshopseoul',
        lineup: ['Visiting UK DnB headliners', 'Korean bass DJs'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'DnB Night Seoul', venue: 'Cakeshop', cap: 400, sold: 390 },
        ],
      }),
    ],
  }),

  C({
    id: 'taipei', name: 'Taipei', country: 'Taiwan',
    lat: 25.0330, lng: 121.5654, status: 'new',
    dominant_genre: 'Liquid / Neurofunk',
    market: M({
      population_city_millions: 7.0, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Neurofunk'],
      avg_ticket_eur: 22, competing_events_per_year: 12, revenue_potential: '€160k', yoy_growth: '+26%',
      scene_notes: 'Pawnshop and B1 host bass / DnB nights. Connected scene with Tokyo and Seoul touring routes.',
    }),
    clubs: [
      { name: 'Pawnshop', capacity: 350, genre_focus: 'Bass, DnB, electronic', ig: 'pawnshop_tpe' },
    ],
    promoters: [
      P({
        name: 'Smoke Machine', type: 'local',
        active_since: 2013, events_per_year: 15, dominant_genre: 'Underground electronic / Bass',
        ig: 'smokemachine.tw',
        lineup: ['International tour DJs', 'Taiwanese bass DJs'],
        events: [
          { date: 'Jul 2024', year: 2024, name: 'Bass Showcase Taipei', venue: 'Pawnshop', cap: 350, sold: 320 },
        ],
      }),
    ],
  }),

  C({
    id: 'jakarta', name: 'Jakarta', country: 'Indonesia',
    lat: -6.2088, lng: 106.8456, status: 'new',
    dominant_genre: 'Jump Up / Dancefloor',
    market: M({
      population_city_millions: 10.6, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Jump Up', secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 14, competing_events_per_year: 10, revenue_potential: '€110k', yoy_growth: '+32%',
      scene_notes: 'Bass / DnB scene growing through small underground crews. Connected to Bali tour circuit.',
    }),
    clubs: [
      { name: 'Studio Palem', capacity: 400, genre_focus: 'Underground electronic + bass', ig: 'studiopalem' },
    ],
    promoters: [
      P({
        name: 'Bass Republic Indonesia', type: 'local',
        active_since: 2019, events_per_year: 6, dominant_genre: 'DnB / Bass',
        ig: 'bassrepublic.id',
        lineup: ['Local DnB DJs', 'visiting headliners'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'Bass Republic Jakarta', venue: 'Studio Palem', cap: 400, sold: 350 },
        ],
      }),
    ],
  }),

  C({
    id: 'bali', name: 'Bali (Canggu)', country: 'Indonesia',
    lat: -8.6478, lng: 115.1385, status: 'emerging',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 0.65, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Dancefloor', 'Jungle'],
      avg_ticket_eur: 26, competing_events_per_year: 30, revenue_potential: '€260k', yoy_growth: '+45%',
      scene_notes: 'Massive expat / digital nomad / Aussie tourist crowd. Savaya, La Brisa and The Lawn run regular bass nights. Hot spot for international DJ tours.',
    }),
    clubs: [
      { name: 'Savaya Bali', capacity: 2500, genre_focus: 'Large electronic, occasional DnB', ig: 'savayabali' },
      { name: 'La Brisa', capacity: 800, genre_focus: 'Bass, DnB sunset sessions', ig: 'labrisabali' },
    ],
    promoters: [
      P({
        name: 'Sunset Bass Bali', type: 'local',
        active_since: 2021, events_per_year: 18, dominant_genre: 'DnB / Bass',
        ig: 'sunsetbass.bali',
        lineup: ['Hybrid Minds', 'Degs', 'Aussie touring DnB acts'],
        events: [
          { date: 'Aug 2024', year: 2024, name: 'Sunset Bass Bali', venue: 'La Brisa', cap: 800, sold: 780 },
        ],
      }),
    ],
  }),

  C({
    id: 'manila', name: 'Manila', country: 'Philippines',
    lat: 14.5995, lng: 120.9842, status: 'new',
    dominant_genre: 'Jump Up / Dancefloor',
    market: M({
      population_city_millions: 13.5, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Jump Up', secondary_subgenres: ['Dancefloor'],
      avg_ticket_eur: 12, competing_events_per_year: 8, revenue_potential: '€90k', yoy_growth: '+34%',
      scene_notes: 'Time in Manila and XX XX run regular bass / DnB nights. Strong UK garage and bass crossover.',
    }),
    clubs: [
      { name: 'XX XX', capacity: 400, genre_focus: 'Underground bass + DnB', ig: 'xxxxmanila' },
    ],
    promoters: [
      P({
        name: 'Manila Bass Collective', type: 'local',
        active_since: 2020, events_per_year: 6, dominant_genre: 'DnB / Bass',
        ig: 'manilabass',
        lineup: ['Local DnB DJs', 'Asia tour acts'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Manila Bass Night', venue: 'XX XX', cap: 400, sold: 350 },
        ],
      }),
    ],
  }),

  C({
    id: 'dubai', name: 'Dubai', country: 'UAE',
    lat: 25.2048, lng: 55.2708, status: 'emerging',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 3.6, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 55, competing_events_per_year: 25, revenue_potential: '€700k', yoy_growth: '+30%',
      scene_notes: 'Soho Garden and Base Dubai host UK DnB headliners (Sub Focus, Wilkinson, Chase & Status all played 2024). High spend per head, expat-driven.',
    }),
    clubs: [
      { name: 'Soho Garden DXB', capacity: 2000, genre_focus: 'Large electronic + DnB tours', ig: 'sohogardendxb' },
      { name: 'Base Dubai', capacity: 1500, genre_focus: 'Bass, DnB tour stops', ig: 'basedubai' },
    ],
    promoters: [
      P({
        name: 'Soho Garden Bookings', type: 'venue',
        active_since: 2017, events_per_year: 30, dominant_genre: 'All bass',
        ig: 'sohogardendxb',
        lineup: ['Sub Focus', 'Wilkinson', 'Chase & Status', 'Hybrid Minds'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Sub Focus Dubai', venue: 'Soho Garden DXB', cap: 2000, sold: 1900 },
        ],
      }),
    ],
  }),

  C({
    id: 'telaviv', name: 'Tel Aviv', country: 'Israel',
    lat: 32.0853, lng: 34.7818, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 4.3, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 30, competing_events_per_year: 35, revenue_potential: '€450k', yoy_growth: '+20%',
      scene_notes: 'Block Club is one of the world\'s top-ranked clubs (DJ Mag) and hosts heavy DnB nights. Long-running scene with loyal crowd.',
    }),
    clubs: [
      { name: 'The Block', capacity: 800, genre_focus: 'Top-tier electronic + DnB', ig: 'theblockclub' },
      { name: 'Pasaz', capacity: 500, genre_focus: 'Bass, DnB nights', ig: 'pasaz_tlv' },
    ],
    promoters: [
      P({
        name: 'Block Bookings', type: 'venue',
        active_since: 2010, events_per_year: 25, dominant_genre: 'Bass / DnB',
        ig: 'theblockclub',
        lineup: ['Mefjus', 'Noisia', 'Camo & Krooked', 'Andy C'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'DnB Night Tel Aviv', venue: 'The Block', cap: 800, sold: 780 },
        ],
      }),
    ],
  }),

  C({
    id: 'capetown', name: 'Cape Town', country: 'South Africa',
    lat: -33.9249, lng: 18.4241, status: 'emerging',
    dominant_genre: 'Liquid / Dancefloor',
    market: M({
      population_city_millions: 4.7, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Dancefloor', 'Neurofunk'],
      avg_ticket_eur: 18, competing_events_per_year: 18, revenue_potential: '€220k', yoy_growth: '+22%',
      scene_notes: 'Modular brings UK DnB acts down regularly. Strong local producer base via Counterpoint and Subvert.',
    }),
    clubs: [
      { name: 'Modular', capacity: 700, genre_focus: 'Bass, DnB, electronic', ig: 'modular.ct' },
      { name: 'Reset', capacity: 500, genre_focus: 'Underground DnB nights', ig: 'resetclub_ct' },
    ],
    promoters: [
      P({
        name: 'Counterpoint', type: 'local',
        active_since: 2015, events_per_year: 12, dominant_genre: 'DnB',
        ig: 'counterpoint_dnb',
        lineup: ['Hybrid Minds', 'Bcee', 'Degs', 'local DnB DJs'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Counterpoint Cape Town', venue: 'Modular', cap: 700, sold: 650 },
        ],
      }),
    ],
  }),

  C({
    id: 'johannesburg', name: 'Johannesburg', country: 'South Africa',
    lat: -26.2041, lng: 28.0473, status: 'emerging',
    dominant_genre: 'Dancefloor / Liquid',
    market: M({
      population_city_millions: 6.0, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Dancefloor', secondary_subgenres: ['Liquid', 'Jungle'],
      avg_ticket_eur: 16, competing_events_per_year: 14, revenue_potential: '€180k', yoy_growth: '+24%',
      scene_notes: 'And Club and Kitcheners host the DnB / bass nights. Long-standing JHB jungle scene.',
    }),
    clubs: [
      { name: 'And Club', capacity: 600, genre_focus: 'Bass, DnB, electronic', ig: 'and_club_jhb' },
    ],
    promoters: [
      P({
        name: 'Bass Konnect', type: 'local',
        active_since: 2016, events_per_year: 10, dominant_genre: 'DnB / Bass',
        ig: 'basskonnect',
        lineup: ['Tantrum Desire', 'Hybrid Minds', 'local heroes'],
        events: [
          { date: 'Aug 2024', year: 2024, name: 'Bass Konnect JHB', venue: 'And Club', cap: 600, sold: 550 },
        ],
      }),
    ],
  }),

  C({
    id: 'nairobi', name: 'Nairobi', country: 'Kenya',
    lat: -1.2921, lng: 36.8219, status: 'new',
    dominant_genre: 'Liquid / Jungle',
    market: M({
      population_city_millions: 4.4, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Liquid', secondary_subgenres: ['Jungle'],
      avg_ticket_eur: 12, competing_events_per_year: 6, revenue_potential: '€55k', yoy_growth: '+55%',
      scene_notes: 'Jungle Culture is East & Central Africa\'s first DnB movement. "The Kenyan Way" 2024 with Degs sold out pre-sale — landmark moment for the continent.',
    }),
    clubs: [
      { name: 'The Alchemist', capacity: 800, genre_focus: 'Bass, electronic, DnB takeovers', ig: 'thealchemistbar' },
    ],
    promoters: [
      P({
        name: 'Jungle Culture', type: 'local',
        active_since: 2022, events_per_year: 6, dominant_genre: 'DnB / Jungle',
        ig: 'jungleculture.ke',
        lineup: ['Degs', 'Balter Sensei', 'Nduta'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'The Kenyan Way (Degs)', venue: 'The Alchemist', cap: 800, sold: 800 },
        ],
      }),
    ],
  }),

  C({
    id: 'lagos', name: 'Lagos', country: 'Nigeria',
    lat: 6.5244, lng: 3.3792, status: 'new',
    dominant_genre: 'Jungle / Dancefloor',
    market: M({
      population_city_millions: 15.4, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Jungle', secondary_subgenres: ['Dancefloor'],
      avg_ticket_eur: 14, competing_events_per_year: 5, revenue_potential: '€60k', yoy_growth: '+50%',
      scene_notes: 'Tiny but rapidly growing DnB / jungle micro-scene riding the Afrobass crossover. Hard Rock and Bature Brewery host occasional bass nights.',
    }),
    clubs: [
      { name: 'Hard Rock Café Lagos', capacity: 600, genre_focus: 'Live + electronic, bass takeovers', ig: 'hardrockcafelagos' },
    ],
    promoters: [
      P({
        name: 'Bass Lagos', type: 'local',
        active_since: 2023, events_per_year: 4, dominant_genre: 'DnB / Bass',
        ig: 'basslagos',
        lineup: ['Local DJs', 'visiting UK acts'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'Bass Lagos Launch', venue: 'Hard Rock Café Lagos', cap: 600, sold: 480 },
        ],
      }),
    ],
  }),

  C({
    id: 'mexicocity', name: 'Mexico City', country: 'Mexico',
    lat: 19.4326, lng: -99.1332, status: 'emerging',
    dominant_genre: 'Neurofunk / Liquid',
    market: M({
      population_city_millions: 22.5, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Liquid', 'Dancefloor'],
      avg_ticket_eur: 18, competing_events_per_year: 35, revenue_potential: '€480k', yoy_growth: '+26%',
      scene_notes: 'Foro Indie Rocks and Fonoteca host bigger DnB tours. Strong Latin American hub with Mefjus, Camo & Krooked tour stops.',
    }),
    clubs: [
      { name: 'Foro Indie Rocks', capacity: 1200, genre_focus: 'Bass tours, DnB shows', ig: 'foroindierocks' },
      { name: 'Fonoteca Nacional', capacity: 600, genre_focus: 'Underground electronic + DnB', ig: 'fonotecamx' },
    ],
    promoters: [
      P({
        name: 'Subbase MX', type: 'local',
        active_since: 2014, events_per_year: 18, dominant_genre: 'DnB',
        ig: 'subbase.mx',
        lineup: ['Mefjus', 'Camo & Krooked', 'Andy C', 'Hybrid Minds'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'Subbase MX', venue: 'Foro Indie Rocks', cap: 1200, sold: 1150 },
        ],
      }),
    ],
  }),

  C({
    id: 'buenosaires', name: 'Buenos Aires', country: 'Argentina',
    lat: -34.6037, lng: -58.3816, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 15.4, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor', 'Liquid'],
      avg_ticket_eur: 16, competing_events_per_year: 30, revenue_potential: '€380k', yoy_growth: '+22%',
      scene_notes: 'Crobar and Mandarine Park host major DnB tours. Connected scene with São Paulo touring routes.',
    }),
    clubs: [
      { name: 'Crobar', capacity: 2500, genre_focus: 'Big-room electronic + DnB', ig: 'crobarba' },
      { name: 'Mandarine Park', capacity: 5000, genre_focus: 'Outdoor bass / DnB festivals', ig: 'mandarinepark' },
    ],
    promoters: [
      P({
        name: 'Bassiani BA', type: 'local',
        active_since: 2015, events_per_year: 20, dominant_genre: 'DnB',
        ig: 'bassiani.ba',
        lineup: ['Mefjus', 'Andy C', 'Camo & Krooked'],
        events: [
          { date: 'Nov 2024', year: 2024, name: 'DnB Night BA', venue: 'Crobar', cap: 2500, sold: 2400 },
        ],
      }),
    ],
  }),

  C({
    id: 'bogota', name: 'Bogotá', country: 'Colombia',
    lat: 4.7110, lng: -74.0721, status: 'new',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 7.7, dnb_scene_strength: 'emerging',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor'],
      avg_ticket_eur: 14, competing_events_per_year: 14, revenue_potential: '€160k', yoy_growth: '+30%',
      scene_notes: 'Video Club and Octava host the bass / DnB tours. Growing Latin American DnB market.',
    }),
    clubs: [
      { name: 'Video Club Bogotá', capacity: 800, genre_focus: 'Underground electronic + DnB', ig: 'videoclub.bog' },
    ],
    promoters: [
      P({
        name: 'BassBog', type: 'local',
        active_since: 2018, events_per_year: 10, dominant_genre: 'DnB',
        ig: 'bassbog',
        lineup: ['Mefjus', 'Bou', 'local DnB DJs'],
        events: [
          { date: 'Sep 2024', year: 2024, name: 'BassBog Showcase', venue: 'Video Club Bogotá', cap: 800, sold: 720 },
        ],
      }),
    ],
  }),

  C({
    id: 'kyiv', name: 'Kyiv', country: 'Ukraine',
    lat: 50.4501, lng: 30.5234, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 3.0, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor', 'Jump Up'],
      avg_ticket_eur: 14, competing_events_per_year: 18, revenue_potential: '€180k', yoy_growth: '+18%',
      scene_notes: 'Closer and K41 are the underground DnB / bass anchors. Resilient scene continuing through wartime — fundraiser raves regularly sell out.',
    }),
    clubs: [
      { name: 'Closer', capacity: 1200, genre_focus: 'Underground electronic + DnB', ig: 'closerkyiv' },
      { name: 'K41', capacity: 1500, genre_focus: 'Bass, DnB, techno', ig: 'k41community' },
    ],
    promoters: [
      P({
        name: 'Kyiv Bass Collective', type: 'local',
        active_since: 2014, events_per_year: 18, dominant_genre: 'DnB',
        ig: 'kyivbass',
        lineup: ['Mefjus', 'Camo & Krooked', 'Mind Vortex'],
        events: [
          { date: 'Aug 2024', year: 2024, name: 'DnB Fundraiser Kyiv', venue: 'Closer', cap: 1200, sold: 1200 },
        ],
      }),
    ],
  }),

  C({
    id: 'tbilisi', name: 'Tbilisi', country: 'Georgia',
    lat: 41.7151, lng: 44.8271, status: 'emerging',
    dominant_genre: 'Neurofunk / Dancefloor',
    market: M({
      population_city_millions: 1.2, dnb_scene_strength: 'growing',
      dominant_subgenre: 'Neurofunk', secondary_subgenres: ['Dancefloor'],
      avg_ticket_eur: 18, competing_events_per_year: 16, revenue_potential: '€160k', yoy_growth: '+28%',
      scene_notes: 'Bassiani is a globally-ranked institution — DnB nights pull international heavyweights. Khidi is the newer bass anchor.',
    }),
    clubs: [
      { name: 'Bassiani', capacity: 1200, genre_focus: 'Top-tier underground + DnB', ig: 'bassianiclub' },
      { name: 'Khidi', capacity: 800, genre_focus: 'Underground bass + DnB', ig: 'khidi.club' },
    ],
    promoters: [
      P({
        name: 'Bassiani Bookings', type: 'venue',
        active_since: 2014, events_per_year: 25, dominant_genre: 'Underground / DnB',
        ig: 'bassianiclub',
        lineup: ['Mefjus', 'Noisia', 'visiting UK DnB acts'],
        events: [
          { date: 'Oct 2024', year: 2024, name: 'DnB Night Tbilisi', venue: 'Bassiani', cap: 1200, sold: 1180 },
        ],
      }),
    ],
  }),
];

export const STATUS_COLORS: Record<CityStatus, string> = {
  undivide: '#ff2d6f',   // neon pink
  growth: '#fff200',     // neon yellow
  emerging: '#39ff14',   // neon green
  new: '#00e5ff',        // neon cyan
};

export const STATUS_LABEL: Record<CityStatus, string> = {
  undivide: 'Undivide active',
  growth: 'Growth market',
  emerging: 'Emerging scene',
  new: 'New territory',
};

export const SCENE_LABEL: Record<SceneStrength, string> = {
  legendary: 'Legendary',
  strong: 'Strong',
  growing: 'Growing',
  emerging: 'Emerging',
  untapped: 'Untapped',
};
