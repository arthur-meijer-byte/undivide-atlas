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
  undivide: grad('#e84118', '#7a0f00'),
  growth: grad('#fbbc04', '#b07700'),
  emerging: grad('#34a853', '#0f6b28'),
  new: grad('#1a73e8', '#0a3d8a'),
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

export const CITIES: City[] = [
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
    id: 'vienna', name: 'Vienna', country: 'Austria',
    lat: 48.21, lng: 16.37, status: 'undivide',
    dominant_genre: 'Neurofunk / All styles',
    market: M({
      population_city_millions: 1.9,
      dnb_scene_strength: 'strong',
      dominant_subgenre: 'Neurofunk',
      secondary_subgenres: ['Liquid', 'Dancefloor'],
      avg_ticket_eur: 18,
      competing_events_per_year: 20,
      revenue_potential: '€200k',
      yoy_growth: '+7%',
      scene_notes: 'Consistently rated by international artists as one of Europe\'s best DnB cities. Multiple references to weekly sold-out club nights. Linz (2hr away) also has an active scene (PRSPCT crossbreed ties).',
    }),
    clubs: [
      { name: 'Flex', capacity: 600, genre_focus: 'DnB and electronic club nights', ig: 'flexvienna' },
      { name: 'Arena Vienna', capacity: 3500, genre_focus: 'Large events', ig: 'arenavienna' },
    ],
    promoters: [
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
];

export const STATUS_COLORS: Record<CityStatus, string> = {
  undivide: '#e84118',
  growth: '#fbbc04',
  emerging: '#34a853',
  new: '#1a73e8',
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
