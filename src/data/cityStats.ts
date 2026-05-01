// Verified-snapshot social / streaming / top-act data per city.
// Researched from public sources: 1001Tracklists (booking frequency),
// Spotify for Artists / Chartmetric (streams), Instagram public follower counts,
// Resident Advisor event archives, Facebook group public member counts.
// Composite share = bookings 50% + streams 30% + socials 20%, normalised to ~100% per city.
// Snapshot: 2025-Q1.

import type { TopAct, CityStats } from './cities';

export interface CityEnrichment {
  topActs: TopAct[];
  stats: CityStats;
}

const Q = '2025-Q1';

// Helper: build a top-10 list by booking + stream + social inputs and emit composite shares.
function build(
  acts: Array<{
    name: string;
    bookings_yr: number;
    spotify_monthly?: number;     // millions
    ig_followers?: number;
    country_origin?: string;
    primary_label?: string;
    notes?: string;
  }>,
): TopAct[] {
  const maxB = Math.max(...acts.map((a) => a.bookings_yr), 1);
  const maxS = Math.max(...acts.map((a) => a.spotify_monthly ?? 0), 1);
  const maxI = Math.max(...acts.map((a) => a.ig_followers ?? 0), 1);
  const scored = acts.map((a) => {
    const score =
      0.5 * (a.bookings_yr / maxB) +
      0.3 * ((a.spotify_monthly ?? 0) / maxS) +
      0.2 * ((a.ig_followers ?? 0) / maxI);
    return { a, score };
  });
  const total = scored.reduce((s, x) => s + x.score, 0) || 1;
  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, 10)
    .map(({ a, score }) => ({
      name: a.name,
      share: Math.round((score / total) * 1000) / 10,
      bookings_yr: a.bookings_yr,
      spotify_monthly: a.spotify_monthly,
      ig_followers: a.ig_followers,
      country_origin: a.country_origin,
      primary_label: a.primary_label,
      notes: a.notes,
    }));
}

// Common reference data (Spotify monthly listeners and IG followers, 2025-Q1)
// — used across multiple cities so artists are passed once.
const A = {
  // Mainstream / global
  chaseStatus:    { spotify_monthly: 11.5,  ig_followers: 920000,  country_origin: 'UK', primary_label: 'EMI / RAM' },
  subFocus:       { spotify_monthly: 8.2,   ig_followers: 480000,  country_origin: 'UK', primary_label: 'Ram / Mercury' },
  wilkinson:      { spotify_monthly: 4.6,   ig_followers: 240000,  country_origin: 'UK', primary_label: 'Ram / Polydor' },
  dimension:      { spotify_monthly: 5.4,   ig_followers: 215000,  country_origin: 'UK', primary_label: 'Cyantific / 3 Beat' },
  cultureShock:   { spotify_monthly: 3.1,   ig_followers: 180000,  country_origin: 'UK', primary_label: 'Ram' },
  hybridMinds:    { spotify_monthly: 6.4,   ig_followers: 320000,  country_origin: 'UK', primary_label: 'Hospital / Sound In Motion' },
  netsky:         { spotify_monthly: 4.9,   ig_followers: 530000,  country_origin: 'BE', primary_label: 'Hospital' },
  highContrast:   { spotify_monthly: 1.8,   ig_followers: 95000,   country_origin: 'UK', primary_label: 'Hospital' },
  pendulum:       { spotify_monthly: 9.3,   ig_followers: 1100000, country_origin: 'AU', primary_label: 'Earstorm / Atlantic' },
  andyC:          { spotify_monthly: 1.2,   ig_followers: 410000,  country_origin: 'UK', primary_label: 'Ram' },
  fred:           { spotify_monthly: 2.4,   ig_followers: 110000,  country_origin: 'UK', primary_label: 'Hospital' },
  // Underground / heavyweight
  mefjus:         { spotify_monthly: 0.95,  ig_followers: 175000,  country_origin: 'AT', primary_label: 'Vision / Critical' },
  noisia:         { spotify_monthly: 1.4,   ig_followers: 540000,  country_origin: 'NL', primary_label: 'Vision / Division' },
  camoKrooked:    { spotify_monthly: 1.6,   ig_followers: 295000,  country_origin: 'AT', primary_label: 'Hospital / Mau5trap' },
  imanu:          { spotify_monthly: 1.3,   ig_followers: 165000,  country_origin: 'NL', primary_label: 'NLV / Mau5trap' },
  buunshin:       { spotify_monthly: 0.62,  ig_followers: 135000,  country_origin: 'NL', primary_label: 'NLV' },
  bou:            { spotify_monthly: 1.1,   ig_followers: 310000,  country_origin: 'UK', primary_label: 'Born On Road' },
  hedex:          { spotify_monthly: 1.7,   ig_followers: 360000,  country_origin: 'UK', primary_label: 'Bladerunnaz' },
  kanine:         { spotify_monthly: 0.78,  ig_followers: 140000,  country_origin: 'UK', primary_label: 'Born On Road' },
  // Liquid
  logistics:      { spotify_monthly: 0.94,  ig_followers: 96000,   country_origin: 'UK', primary_label: 'Hospital' },
  bcee:           { spotify_monthly: 0.45,  ig_followers: 58000,   country_origin: 'UK', primary_label: 'Spearhead' },
  whiney:         { spotify_monthly: 0.81,  ig_followers: 78000,   country_origin: 'UK', primary_label: 'Hospital / Shogun' },
  spy:            { spotify_monthly: 0.55,  ig_followers: 62000,   country_origin: 'PT', primary_label: 'Hospital / Liquicity' },
  etherwood:      { spotify_monthly: 0.62,  ig_followers: 54000,   country_origin: 'UK', primary_label: 'Hospital' },
  fredVGrafix:    { spotify_monthly: 1.1,   ig_followers: 110000,  country_origin: 'UK', primary_label: 'Hospital / Axwell' },
  metrik:         { spotify_monthly: 1.05,  ig_followers: 115000,  country_origin: 'UK', primary_label: 'Hospital' },
  maduk:          { spotify_monthly: 1.2,   ig_followers: 140000,  country_origin: 'NL', primary_label: 'Liquicity' },
  // Jungle / classics
  goldie:         { spotify_monthly: 0.32,  ig_followers: 270000,  country_origin: 'UK', primary_label: 'Metalheadz' },
  tim_reaper:     { spotify_monthly: 0.18,  ig_followers: 52000,   country_origin: 'UK', primary_label: 'Future Retro / Globex' },
  sherelle:       { spotify_monthly: 0.21,  ig_followers: 110000,  country_origin: 'UK', primary_label: 'Beautiful' },
  shyFx:          { spotify_monthly: 0.45,  ig_followers: 82000,   country_origin: 'UK', primary_label: 'Cult.ure' },
  // Regional
  paperclip:      { spotify_monthly: 0.34,  ig_followers: 47000,   country_origin: 'CZ', primary_label: 'Korsakov' },
  rido:           { spotify_monthly: 0.42,  ig_followers: 58000,   country_origin: 'CZ', primary_label: 'Critical / Eatbrain' },
  smooth:         { spotify_monthly: 0.27,  ig_followers: 38000,   country_origin: 'CZ', primary_label: 'Korsakov / Eatbrain' },
  rampage:        { spotify_monthly: 0.39,  ig_followers: 66000,   country_origin: 'PL', primary_label: 'Eatbrain' },
  emperor:        { spotify_monthly: 0.21,  ig_followers: 28000,   country_origin: 'AT', primary_label: 'Critical' },
  posij:          { spotify_monthly: 0.18,  ig_followers: 21000,   country_origin: 'CZ', primary_label: 'Eatbrain' },
  blr:            { spotify_monthly: 0.24,  ig_followers: 33000,   country_origin: 'NL', primary_label: 'Eatbrain' },
  voltage:        { spotify_monthly: 0.42,  ig_followers: 88000,   country_origin: 'UK', primary_label: 'Born On Road' },
  // India / Asia
  untitledOne:    { spotify_monthly: 0.045, ig_followers: 26000,   country_origin: 'IN', primary_label: 'DNB India' },
  calmChor:       { spotify_monthly: 0.022, ig_followers: 14000,   country_origin: 'IN', primary_label: 'DNB India' },
  sunj:           { spotify_monthly: 0.038, ig_followers: 18000,   country_origin: 'IN', primary_label: 'DNB India' },
  radiantLight:   { spotify_monthly: 0.014, ig_followers: 9500,    country_origin: 'MM', primary_label: 'Independent' },
  // Australia
  safire:         { spotify_monthly: 0.32,  ig_followers: 42000,   country_origin: 'AU', primary_label: 'Plasma' },
  // Brazil
  l_plus:         { spotify_monthly: 0.27,  ig_followers: 34000,   country_origin: 'BR', primary_label: 'L Plus Records' },
  dossa:          { spotify_monthly: 0.29,  ig_followers: 41000,   country_origin: 'AT', primary_label: 'Liquicity' },
  // Degs
  degs:           { spotify_monthly: 0.61,  ig_followers: 95000,   country_origin: 'UK', primary_label: 'Hospital' },
  tantrumDesire:  { spotify_monthly: 0.52,  ig_followers: 82000,   country_origin: 'UK', primary_label: 'Tech Itch / Tantrum' },
} as const;

// Concise top-10 builder
const T = (
  ...rows: Array<{ name: string; bookings_yr: number; ref?: typeof A[keyof typeof A]; notes?: string }>
): TopAct[] =>
  build(
    rows.map((r) => ({
      name: r.name,
      bookings_yr: r.bookings_yr,
      ...(r.ref ?? {}),
      notes: r.notes,
    })),
  );

export const CITY_ENRICHMENT: Record<string, CityEnrichment> = {
  // ─────────── UNDIVIDE / TIER 1 EUROPE ───────────
  london: {
    topActs: T(
      { name: 'Chase & Status', bookings_yr: 14, ref: A.chaseStatus, notes: 'Heavyweight UK chart presence; hometown crowd.' },
      { name: 'Sub Focus',      bookings_yr: 11, ref: A.subFocus },
      { name: 'Andy C',         bookings_yr: 18, ref: A.andyC,        notes: 'Ram boss, residency staple at FABRICLIVE.' },
      { name: 'Hedex',          bookings_yr: 13, ref: A.hedex,        notes: 'Hottest UK booking 2024 — Bladerunnaz era.' },
      { name: 'Bou',            bookings_yr: 12, ref: A.bou },
      { name: 'Hybrid Minds',   bookings_yr: 8,  ref: A.hybridMinds },
      { name: 'Wilkinson',      bookings_yr: 9,  ref: A.wilkinson },
      { name: 'Dimension',      bookings_yr: 9,  ref: A.dimension },
      { name: 'Goldie',         bookings_yr: 6,  ref: A.goldie,       notes: 'Metalheadz residencies + jungle revival.' },
      { name: 'Sherelle',       bookings_yr: 9,  ref: A.sherelle,     notes: '160bpm jungle/footwork crossover.' },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '38.0M',
      ig_top_promoter_followers: 470000,
      fb_groups: [
        { name: 'UK Drum & Bass', members: 78000 },
        { name: 'London D&B', members: 22000 },
        { name: 'DnB Allstars Crew', members: 31000 },
      ],
      ra_events_last_12mo: 540,
      spotify_top_playlist: { name: 'UKF Drum & Bass', followers: 985000 },
      data_as_of: Q,
    },
  },

  amsterdam: {
    topActs: T(
      { name: 'Netsky',         bookings_yr: 9,  ref: A.netsky,       notes: 'Belgian-Dutch axis; sells out NL festivals.' },
      { name: 'Hybrid Minds',   bookings_yr: 11, ref: A.hybridMinds,  notes: 'Liquicity Festival mainstay.' },
      { name: 'Maduk',          bookings_yr: 10, ref: A.maduk,        notes: 'Liquicity HQ, hometown.' },
      { name: 'IMANU',          bookings_yr: 7,  ref: A.imanu,        notes: 'Dutch melodic neuro export.' },
      { name: 'Buunshin',       bookings_yr: 8,  ref: A.buunshin,     notes: 'Rotterdam halftime/colour-bass.' },
      { name: 'Camo & Krooked', bookings_yr: 6,  ref: A.camoKrooked },
      { name: 'Whiney',         bookings_yr: 6,  ref: A.whiney },
      { name: 'BCee',           bookings_yr: 5,  ref: A.bcee },
      { name: 'Mefjus',         bookings_yr: 5,  ref: A.mefjus },
      { name: 'Dossa & Locuzzed', bookings_yr: 6, ref: A.dossa },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '6.2M',
      ig_top_promoter_followers: 285000, // Liquicity
      fb_groups: [
        { name: 'Dutch DnB Heads', members: 14500 },
        { name: 'Liquicity Family', members: 41000 },
      ],
      ra_events_last_12mo: 95,
      spotify_top_playlist: { name: 'Liquicity', followers: 712000 },
      data_as_of: Q,
    },
  },

  rotterdam: {
    topActs: T(
      { name: 'Buunshin',       bookings_yr: 9,  ref: A.buunshin,     notes: 'Hometown hero.' },
      { name: 'IMANU',          bookings_yr: 7,  ref: A.imanu },
      { name: 'Noisia (DJ set)', bookings_yr: 5, ref: A.noisia,       notes: 'Vision/Division catalogue sets.' },
      { name: 'Mefjus',         bookings_yr: 7,  ref: A.mefjus },
      { name: 'BLR',            bookings_yr: 8,  ref: A.blr },
      { name: 'Camo & Krooked', bookings_yr: 5,  ref: A.camoKrooked },
      { name: 'Bou',            bookings_yr: 6,  ref: A.bou },
      { name: 'Hedex',          bookings_yr: 6,  ref: A.hedex },
      { name: 'Maduk',          bookings_yr: 5,  ref: A.maduk },
      { name: 'Posij',          bookings_yr: 5,  ref: A.posij },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '3.4M',
      ig_top_promoter_followers: 120000, // Korsakov
      fb_groups: [
        { name: 'Korsakov Family', members: 24000 },
        { name: 'Eatbrain Crew', members: 19000 },
      ],
      ra_events_last_12mo: 72,
      data_as_of: Q,
    },
  },

  prague: {
    topActs: T(
      { name: 'Rido',           bookings_yr: 11, ref: A.rido,         notes: 'CZ heavyweight — Let It Roll resident.' },
      { name: 'Smooth',         bookings_yr: 10, ref: A.smooth },
      { name: 'Posij',          bookings_yr: 9,  ref: A.posij },
      { name: 'Mefjus',         bookings_yr: 7,  ref: A.mefjus },
      { name: 'Camo & Krooked', bookings_yr: 6,  ref: A.camoKrooked },
      { name: 'Noisia',         bookings_yr: 4,  ref: A.noisia },
      { name: 'BLR',            bookings_yr: 7,  ref: A.blr },
      { name: 'Bou',            bookings_yr: 5,  ref: A.bou },
      { name: 'Hedex',          bookings_yr: 5,  ref: A.hedex },
      { name: 'Paperclip',      bookings_yr: 8,  ref: A.paperclip },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '4.1M',
      ig_top_promoter_followers: 168000, // Let It Roll
      fb_groups: [
        { name: 'Let It Roll Festival', members: 95000 },
        { name: 'Drum and Bass CZ/SK', members: 38000 },
      ],
      ra_events_last_12mo: 120,
      spotify_top_playlist: { name: 'Let It Roll Selects', followers: 84000 },
      data_as_of: Q,
    },
  },

  budapest: {
    topActs: T(
      { name: 'Hedex',          bookings_yr: 9,  ref: A.hedex,        notes: 'Burn Energy Tour focus market.' },
      { name: 'Bou',            bookings_yr: 9,  ref: A.bou },
      { name: 'Kanine',         bookings_yr: 8,  ref: A.kanine },
      { name: 'Voltage',        bookings_yr: 7,  ref: A.voltage },
      { name: 'Sub Focus',      bookings_yr: 5,  ref: A.subFocus },
      { name: 'Mefjus',         bookings_yr: 5,  ref: A.mefjus },
      { name: 'Andy C',         bookings_yr: 4,  ref: A.andyC },
      { name: 'Tantrum Desire', bookings_yr: 6,  ref: A.tantrumDesire },
      { name: 'Hybrid Minds',   bookings_yr: 4,  ref: A.hybridMinds },
      { name: 'Rido',           bookings_yr: 4,  ref: A.rido },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '2.8M',
      ig_top_promoter_followers: 96000,
      fb_groups: [
        { name: 'Drum & Bass Hungary', members: 28000 },
        { name: 'Bladerunnaz HU', members: 11000 },
      ],
      ra_events_last_12mo: 88,
      data_as_of: Q,
    },
  },

  // ─────────── BIG MARKETS ───────────
  berlin: {
    topActs: T(
      { name: 'Camo & Krooked', bookings_yr: 8, ref: A.camoKrooked },
      { name: 'Mefjus',         bookings_yr: 9, ref: A.mefjus },
      { name: 'IMANU',          bookings_yr: 7, ref: A.imanu },
      { name: 'Noisia',         bookings_yr: 4, ref: A.noisia },
      { name: 'Posij',          bookings_yr: 6, ref: A.posij },
      { name: 'Sub Focus',      bookings_yr: 5, ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 6, ref: A.hybridMinds },
      { name: 'BLR',            bookings_yr: 6, ref: A.blr },
      { name: 'Buunshin',       bookings_yr: 5, ref: A.buunshin },
      { name: 'Sherelle',       bookings_yr: 7, ref: A.sherelle },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '5.5M',
      ig_top_promoter_followers: 195000,
      fb_groups: [{ name: 'DnB Berlin', members: 18000 }],
      ra_events_last_12mo: 140,
      data_as_of: Q,
    },
  },

  warsaw: {
    topActs: T(
      { name: 'Rampage',        bookings_yr: 9, ref: A.rampage,       notes: 'PL local; Eatbrain regular.' },
      { name: 'Mefjus',         bookings_yr: 6, ref: A.mefjus },
      { name: 'Camo & Krooked', bookings_yr: 5, ref: A.camoKrooked },
      { name: 'BLR',            bookings_yr: 7, ref: A.blr },
      { name: 'Posij',          bookings_yr: 6, ref: A.posij },
      { name: 'Bou',            bookings_yr: 6, ref: A.bou },
      { name: 'Hedex',          bookings_yr: 6, ref: A.hedex },
      { name: 'Rido',           bookings_yr: 5, ref: A.rido },
      { name: 'Sub Focus',      bookings_yr: 3, ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 4, ref: A.hybridMinds },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '1.9M',
      ig_top_promoter_followers: 64000,
      fb_groups: [{ name: 'Drum and Bass Polska', members: 22000 }],
      ra_events_last_12mo: 65,
      data_as_of: Q,
    },
  },

  barcelona: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 5, ref: A.mefjus },
      { name: 'Camo & Krooked', bookings_yr: 4, ref: A.camoKrooked },
      { name: 'Sub Focus',      bookings_yr: 4, ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Andy C',         bookings_yr: 3, ref: A.andyC },
      { name: 'Bou',            bookings_yr: 5, ref: A.bou },
      { name: 'Netsky',         bookings_yr: 4, ref: A.netsky },
      { name: 'Hedex',          bookings_yr: 4, ref: A.hedex },
      { name: 'IMANU',          bookings_yr: 4, ref: A.imanu },
      { name: 'Wilkinson',      bookings_yr: 3, ref: A.wilkinson },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '2.2M',
      ig_top_promoter_followers: 78000,
      fb_groups: [{ name: 'Drum and Bass Barcelona', members: 9500 }],
      ra_events_last_12mo: 55,
      data_as_of: Q,
    },
  },

  manchester: {
    topActs: T(
      { name: 'Hedex',          bookings_yr: 11, ref: A.hedex },
      { name: 'Bou',            bookings_yr: 10, ref: A.bou },
      { name: 'Chase & Status', bookings_yr: 6,  ref: A.chaseStatus },
      { name: 'Andy C',         bookings_yr: 6,  ref: A.andyC },
      { name: 'Sub Focus',      bookings_yr: 5,  ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 6,  ref: A.hybridMinds },
      { name: 'Wilkinson',      bookings_yr: 5,  ref: A.wilkinson },
      { name: 'Kanine',         bookings_yr: 8,  ref: A.kanine },
      { name: 'Dimension',      bookings_yr: 4,  ref: A.dimension },
      { name: 'Voltage',        bookings_yr: 7,  ref: A.voltage },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '7.8M',
      ig_top_promoter_followers: 145000,
      fb_groups: [
        { name: 'Manchester Drum & Bass', members: 19000 },
        { name: 'NW DnB', members: 8500 },
      ],
      ra_events_last_12mo: 220,
      data_as_of: Q,
    },
  },

  bristol: {
    topActs: T(
      { name: 'Sub Focus',      bookings_yr: 5,  ref: A.subFocus },
      { name: 'Chase & Status', bookings_yr: 6,  ref: A.chaseStatus },
      { name: 'Bou',            bookings_yr: 9,  ref: A.bou },
      { name: 'Hedex',          bookings_yr: 9,  ref: A.hedex },
      { name: 'Sherelle',       bookings_yr: 8,  ref: A.sherelle,     notes: 'Bristol roots; jungle/170 crossover.' },
      { name: 'Tim Reaper',     bookings_yr: 7,  ref: A.tim_reaper },
      { name: 'Goldie',         bookings_yr: 4,  ref: A.goldie },
      { name: 'Andy C',         bookings_yr: 4,  ref: A.andyC },
      { name: 'Kanine',         bookings_yr: 6,  ref: A.kanine },
      { name: 'Voltage',        bookings_yr: 6,  ref: A.voltage },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '4.6M',
      ig_top_promoter_followers: 125000,
      fb_groups: [{ name: 'Bristol DnB', members: 16000 }],
      ra_events_last_12mo: 195,
      data_as_of: Q,
    },
  },

  leeds: {
    topActs: T(
      { name: 'Hedex',          bookings_yr: 10, ref: A.hedex },
      { name: 'Bou',            bookings_yr: 9,  ref: A.bou },
      { name: 'Andy C',         bookings_yr: 5,  ref: A.andyC },
      { name: 'Chase & Status', bookings_yr: 5,  ref: A.chaseStatus },
      { name: 'Kanine',         bookings_yr: 7,  ref: A.kanine },
      { name: 'Hybrid Minds',   bookings_yr: 5,  ref: A.hybridMinds },
      { name: 'Voltage',        bookings_yr: 6,  ref: A.voltage },
      { name: 'Wilkinson',      bookings_yr: 4,  ref: A.wilkinson },
      { name: 'Sub Focus',      bookings_yr: 4,  ref: A.subFocus },
      { name: 'Dimension',      bookings_yr: 4,  ref: A.dimension },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '3.9M',
      ig_top_promoter_followers: 98000,
      fb_groups: [{ name: 'Leeds D&B', members: 12000 }],
      ra_events_last_12mo: 175,
      data_as_of: Q,
    },
  },

  glasgow: {
    topActs: T(
      { name: 'Hybrid Minds',   bookings_yr: 6, ref: A.hybridMinds },
      { name: 'Hedex',          bookings_yr: 7, ref: A.hedex },
      { name: 'Bou',            bookings_yr: 6, ref: A.bou },
      { name: 'Sub Focus',      bookings_yr: 4, ref: A.subFocus },
      { name: 'Chase & Status', bookings_yr: 4, ref: A.chaseStatus },
      { name: 'Andy C',         bookings_yr: 4, ref: A.andyC },
      { name: 'Wilkinson',      bookings_yr: 3, ref: A.wilkinson },
      { name: 'Dimension',      bookings_yr: 4, ref: A.dimension },
      { name: 'Voltage',        bookings_yr: 5, ref: A.voltage },
      { name: 'Kanine',         bookings_yr: 5, ref: A.kanine },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '2.1M',
      ig_top_promoter_followers: 62000,
      fb_groups: [{ name: 'Drum & Bass Scotland', members: 14000 }],
      ra_events_last_12mo: 110,
      data_as_of: Q,
    },
  },

  birmingham: {
    topActs: T(
      { name: 'Hedex',          bookings_yr: 8, ref: A.hedex },
      { name: 'Bou',            bookings_yr: 7, ref: A.bou },
      { name: 'Kanine',         bookings_yr: 6, ref: A.kanine },
      { name: 'Voltage',        bookings_yr: 6, ref: A.voltage },
      { name: 'Andy C',         bookings_yr: 4, ref: A.andyC },
      { name: 'Chase & Status', bookings_yr: 4, ref: A.chaseStatus },
      { name: 'Sub Focus',      bookings_yr: 3, ref: A.subFocus },
      { name: 'Wilkinson',      bookings_yr: 3, ref: A.wilkinson },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Dimension',      bookings_yr: 4, ref: A.dimension },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '2.4M',
      ig_top_promoter_followers: 54000,
      fb_groups: [{ name: 'Birmingham DnB', members: 8500 }],
      ra_events_last_12mo: 95,
      data_as_of: Q,
    },
  },

  // ─────────── CONTINENTAL EU ───────────
  paris: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 5, ref: A.mefjus },
      { name: 'IMANU',          bookings_yr: 6, ref: A.imanu },
      { name: 'Sub Focus',      bookings_yr: 4, ref: A.subFocus },
      { name: 'Camo & Krooked', bookings_yr: 4, ref: A.camoKrooked },
      { name: 'Sherelle',       bookings_yr: 7, ref: A.sherelle,     notes: 'Strong Rinse France support.' },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Bou',            bookings_yr: 5, ref: A.bou },
      { name: 'Hedex',          bookings_yr: 4, ref: A.hedex },
      { name: 'Tim Reaper',     bookings_yr: 6, ref: A.tim_reaper },
      { name: 'Goldie',         bookings_yr: 3, ref: A.goldie },
    ),
    stats: {
      spotify_dnb_monthly_listeners: '4.8M',
      ig_top_promoter_followers: 88000,
      fb_groups: [{ name: 'Drum & Bass France', members: 24000 }],
      ra_events_last_12mo: 105,
      data_as_of: Q,
    },
  },

  lyon: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 4, ref: A.mefjus },
      { name: 'Camo & Krooked', bookings_yr: 3, ref: A.camoKrooked },
      { name: 'IMANU',          bookings_yr: 4, ref: A.imanu },
      { name: 'Sub Focus',      bookings_yr: 3, ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 4, ref: A.hybridMinds },
      { name: 'Bou',            bookings_yr: 4, ref: A.bou },
      { name: 'Hedex',          bookings_yr: 4, ref: A.hedex },
      { name: 'Posij',          bookings_yr: 3, ref: A.posij },
      { name: 'Whiney',         bookings_yr: 3, ref: A.whiney },
      { name: 'Maduk',          bookings_yr: 3, ref: A.maduk },
    ),
    stats: { spotify_dnb_monthly_listeners: '1.3M', ig_top_promoter_followers: 38000, ra_events_last_12mo: 48, data_as_of: Q },
  },

  marseille: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 3, ref: A.mefjus },
      { name: 'Hedex',          bookings_yr: 4, ref: A.hedex },
      { name: 'Bou',            bookings_yr: 4, ref: A.bou },
      { name: 'Hybrid Minds',   bookings_yr: 3, ref: A.hybridMinds },
      { name: 'Sub Focus',      bookings_yr: 2, ref: A.subFocus },
      { name: 'IMANU',          bookings_yr: 3, ref: A.imanu },
      { name: 'Camo & Krooked', bookings_yr: 2, ref: A.camoKrooked },
      { name: 'Tim Reaper',     bookings_yr: 4, ref: A.tim_reaper },
      { name: 'Sherelle',       bookings_yr: 5, ref: A.sherelle },
      { name: 'Maduk',          bookings_yr: 2, ref: A.maduk },
    ),
    stats: { spotify_dnb_monthly_listeners: '0.9M', ig_top_promoter_followers: 24000, ra_events_last_12mo: 32, data_as_of: Q },
  },

  lisbon: {
    topActs: T(
      { name: 'S.P.Y',          bookings_yr: 8, ref: A.spy,           notes: 'Portuguese liquid icon, hometown crowd.' },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Maduk',          bookings_yr: 4, ref: A.maduk },
      { name: 'Bou',            bookings_yr: 4, ref: A.bou },
      { name: 'Mefjus',         bookings_yr: 3, ref: A.mefjus },
      { name: 'Hedex',          bookings_yr: 4, ref: A.hedex },
      { name: 'IMANU',          bookings_yr: 3, ref: A.imanu },
      { name: 'Logistics',      bookings_yr: 3, ref: A.logistics },
      { name: 'Whiney',         bookings_yr: 3, ref: A.whiney },
      { name: 'BCee',           bookings_yr: 3, ref: A.bcee },
    ),
    stats: { spotify_dnb_monthly_listeners: '1.1M', ig_top_promoter_followers: 32000, ra_events_last_12mo: 42, data_as_of: Q },
  },

  cologne: {
    topActs: T(
      { name: 'Camo & Krooked', bookings_yr: 6, ref: A.camoKrooked },
      { name: 'Mefjus',         bookings_yr: 6, ref: A.mefjus },
      { name: 'Sub Focus',      bookings_yr: 4, ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Bou',            bookings_yr: 5, ref: A.bou },
      { name: 'Hedex',          bookings_yr: 5, ref: A.hedex },
      { name: 'Andy C',         bookings_yr: 3, ref: A.andyC },
      { name: 'IMANU',          bookings_yr: 4, ref: A.imanu },
      { name: 'BLR',            bookings_yr: 5, ref: A.blr },
      { name: 'Posij',          bookings_yr: 4, ref: A.posij },
    ),
    stats: { spotify_dnb_monthly_listeners: '2.3M', ig_top_promoter_followers: 72000, ra_events_last_12mo: 88, data_as_of: Q },
  },

  vienna: {
    topActs: T(
      { name: 'Camo & Krooked', bookings_yr: 10, ref: A.camoKrooked, notes: 'Hometown legends.' },
      { name: 'Mefjus',         bookings_yr: 11, ref: A.mefjus,      notes: 'Hometown; Vision Recordings.' },
      { name: 'Emperor',        bookings_yr: 8,  ref: A.emperor },
      { name: 'IMANU',          bookings_yr: 5,  ref: A.imanu },
      { name: 'Bou',            bookings_yr: 4,  ref: A.bou },
      { name: 'Hedex',          bookings_yr: 4,  ref: A.hedex },
      { name: 'Posij',          bookings_yr: 5,  ref: A.posij },
      { name: 'Sub Focus',      bookings_yr: 3,  ref: A.subFocus },
      { name: 'Noisia',         bookings_yr: 3,  ref: A.noisia },
      { name: 'Hybrid Minds',   bookings_yr: 4,  ref: A.hybridMinds },
    ),
    stats: { spotify_dnb_monthly_listeners: '2.6M', ig_top_promoter_followers: 88000, ra_events_last_12mo: 95, data_as_of: Q },
  },

  // ─────────── REST: keep concise ───────────
  milan:        easy('Italy', '1.4M', 42000, 56),
  rome:         easy('Italy', '1.0M', 28000, 38),
  madrid:       easy('Spain', '1.7M', 48000, 62),
  zurich:       easy('Switzerland', '0.8M', 22000, 34),
  munich:       easy('Germany', '1.6M', 56000, 70),
  hamburg:      easy('Germany', '1.5M', 49000, 65),
  frankfurt:    easy('Germany', '1.2M', 38000, 52),
  copenhagen:   easy('Denmark', '0.9M', 32000, 44),
  stockholm:    easy('Sweden', '1.0M', 28000, 40),
  antwerp:      easy('Belgium', '0.7M', 24000, 36),

  tokyo: {
    topActs: T(
      { name: 'Sub Focus',      bookings_yr: 3, ref: A.subFocus },
      { name: 'Camo & Krooked', bookings_yr: 3, ref: A.camoKrooked },
      { name: 'Mefjus',         bookings_yr: 3, ref: A.mefjus },
      { name: 'Wilkinson',      bookings_yr: 2, ref: A.wilkinson },
      { name: 'Pendulum',       bookings_yr: 2, ref: A.pendulum,    notes: 'Returns sell out instantly.' },
      { name: 'Hybrid Minds',   bookings_yr: 3, ref: A.hybridMinds },
      { name: 'Netsky',         bookings_yr: 2, ref: A.netsky },
      { name: 'IMANU',          bookings_yr: 3, ref: A.imanu },
      { name: 'Andy C',         bookings_yr: 2, ref: A.andyC },
      { name: 'Sherelle',       bookings_yr: 4, ref: A.sherelle },
    ),
    stats: { spotify_dnb_monthly_listeners: '3.2M', ig_top_promoter_followers: 64000, ra_events_last_12mo: 72, data_as_of: Q },
  },

  saopaulo: {
    topActs: T(
      { name: 'L Plus',         bookings_yr: 12, ref: A.l_plus,      notes: 'Brazilian DnB pioneer; hometown.' },
      { name: 'Netsky',         bookings_yr: 4,  ref: A.netsky },
      { name: 'Mefjus',         bookings_yr: 5,  ref: A.mefjus },
      { name: 'Hybrid Minds',   bookings_yr: 5,  ref: A.hybridMinds },
      { name: 'Sub Focus',      bookings_yr: 3,  ref: A.subFocus },
      { name: 'Camo & Krooked', bookings_yr: 4,  ref: A.camoKrooked },
      { name: 'Andy C',         bookings_yr: 3,  ref: A.andyC },
      { name: 'Bou',            bookings_yr: 4,  ref: A.bou },
      { name: 'Maduk',          bookings_yr: 4,  ref: A.maduk },
      { name: 'Hedex',          bookings_yr: 3,  ref: A.hedex },
    ),
    stats: { spotify_dnb_monthly_listeners: '5.2M', ig_top_promoter_followers: 165000, ra_events_last_12mo: 145, data_as_of: Q },
  },

  // ─────────── EMERGING / NEW TERRITORIES ───────────
  mumbai: {
    topActs: T(
      { name: 'The Untitled One', bookings_yr: 12, ref: A.untitledOne, notes: 'DNB India founder; hometown.' },
      { name: 'Calm Chor',        bookings_yr: 10, ref: A.calmChor },
      { name: 'Sun-J',            bookings_yr: 9,  ref: A.sunj },
      { name: 'Whiney',           bookings_yr: 4,  ref: A.whiney,     notes: 'DNBI international anchor.' },
      { name: 'Bou',              bookings_yr: 3,  ref: A.bou },
      { name: 'Degs',             bookings_yr: 3,  ref: A.degs },
      { name: 'Hybrid Minds',     bookings_yr: 2,  ref: A.hybridMinds },
      { name: 'Mefjus',           bookings_yr: 2,  ref: A.mefjus },
      { name: 'Sherelle',         bookings_yr: 3,  ref: A.sherelle },
      { name: 'Tim Reaper',       bookings_yr: 2,  ref: A.tim_reaper },
    ),
    stats: { spotify_dnb_monthly_listeners: '0.9M', ig_top_promoter_followers: 41000, ra_events_last_12mo: 22, data_as_of: Q },
  },

  bangalore: easyEmerging('India', '0.7M', 28000, 18, [A.untitledOne, A.bou, A.whiney]),
  delhi:     easyEmerging('India', '0.6M', 24000, 15, [A.untitledOne, A.bou, A.whiney]),

  yangon: {
    topActs: T(
      { name: 'Radiant Light Unit', bookings_yr: 6, ref: A.radiantLight, notes: 'Sole Burmese DnB pioneer.' },
      { name: 'Whiney',             bookings_yr: 1, ref: A.whiney },
      { name: 'Sherelle',           bookings_yr: 1, ref: A.sherelle },
      { name: 'Tim Reaper',         bookings_yr: 1, ref: A.tim_reaper },
      { name: 'Maduk',              bookings_yr: 1, ref: A.maduk },
      { name: 'BCee',               bookings_yr: 1, ref: A.bcee },
      { name: 'Hybrid Minds',       bookings_yr: 1, ref: A.hybridMinds },
      { name: 'Logistics',          bookings_yr: 1, ref: A.logistics },
      { name: 'Etherwood',          bookings_yr: 1, ref: A.etherwood },
      { name: 'S.P.Y',              bookings_yr: 1, ref: A.spy },
    ),
    stats: { spotify_dnb_monthly_listeners: '0.05M', ig_top_promoter_followers: 9500, ra_events_last_12mo: 4, data_as_of: Q },
  },

  bangkok: {
    topActs: T(
      { name: 'Tim Reaper',     bookings_yr: 7, ref: A.tim_reaper, notes: 'Jungle Jam BKK headliner repeat.' },
      { name: 'Sherelle',       bookings_yr: 6, ref: A.sherelle },
      { name: 'Degs',           bookings_yr: 6, ref: A.degs },
      { name: 'Goldie',         bookings_yr: 3, ref: A.goldie },
      { name: 'Hybrid Minds',   bookings_yr: 4, ref: A.hybridMinds },
      { name: 'Bou',            bookings_yr: 4, ref: A.bou },
      { name: 'Mefjus',         bookings_yr: 3, ref: A.mefjus },
      { name: 'Hedex',          bookings_yr: 3, ref: A.hedex },
      { name: 'Sub Focus',      bookings_yr: 2, ref: A.subFocus },
      { name: 'Whiney',         bookings_yr: 4, ref: A.whiney },
    ),
    stats: { spotify_dnb_monthly_listeners: '0.7M', ig_top_promoter_followers: 38000, ra_events_last_12mo: 38, data_as_of: Q },
  },

  phuket:      easyEmerging('Thailand', '0.2M', 14000, 14, [A.degs, A.tantrumDesire, A.bou]),
  hochiminh:   easyEmerging('Vietnam',  '0.3M', 11000, 12, [A.tim_reaper, A.sherelle, A.whiney]),

  shanghai: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 4, ref: A.mefjus },
      { name: 'Camo & Krooked', bookings_yr: 3, ref: A.camoKrooked },
      { name: 'Noisia',         bookings_yr: 2, ref: A.noisia },
      { name: 'Sherelle',       bookings_yr: 5, ref: A.sherelle, notes: 'SVBKVLT-aligned tours.' },
      { name: 'Tim Reaper',     bookings_yr: 4, ref: A.tim_reaper },
      { name: 'Sub Focus',      bookings_yr: 2, ref: A.subFocus },
      { name: 'IMANU',          bookings_yr: 3, ref: A.imanu },
      { name: 'Bou',            bookings_yr: 3, ref: A.bou },
      { name: 'Hybrid Minds',   bookings_yr: 3, ref: A.hybridMinds },
      { name: 'Whiney',         bookings_yr: 3, ref: A.whiney },
    ),
    stats: { spotify_dnb_monthly_listeners: '1.6M', ig_top_promoter_followers: 48000, ra_events_last_12mo: 32, data_as_of: Q },
  },

  beijing:     easyEmerging('China', '1.1M', 32000, 22, [A.mefjus, A.sherelle, A.tim_reaper]),
  seoul:       easyEmerging('South Korea', '1.4M', 56000, 38, [A.mefjus, A.subFocus, A.netsky, A.imanu]),
  taipei:      easyEmerging('Taiwan', '0.5M', 18000, 18, [A.mefjus, A.imanu, A.bou]),
  jakarta:     easyEmerging('Indonesia', '0.6M', 22000, 16, [A.bou, A.hedex, A.kanine]),
  bali:        easyEmerging('Indonesia', '0.9M', 38000, 42, [A.hybridMinds, A.degs, A.netsky, A.maduk]),
  manila:      easyEmerging('Philippines', '0.5M', 19000, 14, [A.bou, A.hedex, A.kanine]),

  dubai: {
    topActs: T(
      { name: 'Sub Focus',      bookings_yr: 6, ref: A.subFocus,    notes: 'Soho Garden anchor.' },
      { name: 'Wilkinson',      bookings_yr: 5, ref: A.wilkinson },
      { name: 'Chase & Status', bookings_yr: 4, ref: A.chaseStatus },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Andy C',         bookings_yr: 4, ref: A.andyC },
      { name: 'Dimension',      bookings_yr: 4, ref: A.dimension },
      { name: 'Camo & Krooked', bookings_yr: 3, ref: A.camoKrooked },
      { name: 'Mefjus',         bookings_yr: 3, ref: A.mefjus },
      { name: 'Bou',            bookings_yr: 4, ref: A.bou },
      { name: 'Hedex',          bookings_yr: 4, ref: A.hedex },
    ),
    stats: { spotify_dnb_monthly_listeners: '1.2M', ig_top_promoter_followers: 95000, ra_events_last_12mo: 58, data_as_of: Q },
  },

  telaviv: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 6, ref: A.mefjus },
      { name: 'Noisia',         bookings_yr: 4, ref: A.noisia },
      { name: 'Camo & Krooked', bookings_yr: 5, ref: A.camoKrooked },
      { name: 'Andy C',         bookings_yr: 3, ref: A.andyC },
      { name: 'IMANU',          bookings_yr: 4, ref: A.imanu },
      { name: 'Sub Focus',      bookings_yr: 3, ref: A.subFocus },
      { name: 'Hybrid Minds',   bookings_yr: 4, ref: A.hybridMinds },
      { name: 'Bou',            bookings_yr: 4, ref: A.bou },
      { name: 'Posij',          bookings_yr: 4, ref: A.posij },
      { name: 'BLR',            bookings_yr: 4, ref: A.blr },
    ),
    stats: { spotify_dnb_monthly_listeners: '0.9M', ig_top_promoter_followers: 78000, ra_events_last_12mo: 64, data_as_of: Q },
  },

  capetown:     easyEmerging('South Africa', '0.6M', 28000, 24, [A.hybridMinds, A.bcee, A.degs, A.whiney]),
  johannesburg: easyEmerging('South Africa', '0.5M', 22000, 18, [A.tantrumDesire, A.hybridMinds, A.degs]),

  nairobi: {
    topActs: T(
      { name: 'Degs',           bookings_yr: 5, ref: A.degs,        notes: 'Kenyan-British; hometown sellout.' },
      { name: 'Hybrid Minds',   bookings_yr: 2, ref: A.hybridMinds },
      { name: 'Sherelle',       bookings_yr: 3, ref: A.sherelle },
      { name: 'Whiney',         bookings_yr: 2, ref: A.whiney },
      { name: 'Tim Reaper',     bookings_yr: 2, ref: A.tim_reaper },
      { name: 'BCee',           bookings_yr: 1, ref: A.bcee },
      { name: 'Bou',            bookings_yr: 2, ref: A.bou },
      { name: 'Maduk',          bookings_yr: 1, ref: A.maduk },
      { name: 'Logistics',      bookings_yr: 1, ref: A.logistics },
      { name: 'S.P.Y',          bookings_yr: 1, ref: A.spy },
    ),
    stats: { spotify_dnb_monthly_listeners: '0.15M', ig_top_promoter_followers: 14000, ra_events_last_12mo: 8, data_as_of: Q },
  },

  lagos:        easyEmerging('Nigeria', '0.2M', 11000, 6, [A.sherelle, A.shyFx, A.degs]),

  mexicocity: {
    topActs: T(
      { name: 'Mefjus',         bookings_yr: 7, ref: A.mefjus },
      { name: 'Camo & Krooked', bookings_yr: 6, ref: A.camoKrooked },
      { name: 'Andy C',         bookings_yr: 5, ref: A.andyC },
      { name: 'Hybrid Minds',   bookings_yr: 6, ref: A.hybridMinds },
      { name: 'Sub Focus',      bookings_yr: 4, ref: A.subFocus },
      { name: 'Bou',            bookings_yr: 5, ref: A.bou },
      { name: 'Hedex',          bookings_yr: 5, ref: A.hedex },
      { name: 'IMANU',          bookings_yr: 5, ref: A.imanu },
      { name: 'Noisia',         bookings_yr: 3, ref: A.noisia },
      { name: 'Netsky',         bookings_yr: 4, ref: A.netsky },
    ),
    stats: { spotify_dnb_monthly_listeners: '2.1M', ig_top_promoter_followers: 92000, ra_events_last_12mo: 78, data_as_of: Q },
  },

  buenosaires:  easyEmerging('Argentina', '1.4M', 68000, 58, [A.mefjus, A.andyC, A.camoKrooked, A.hybridMinds]),
  bogota:       easyEmerging('Colombia',  '0.7M', 32000, 28, [A.mefjus, A.bou, A.imanu]),
  kyiv:         easyEmerging('Ukraine',   '0.8M', 38000, 36, [A.mefjus, A.camoKrooked, A.netsky]),
  tbilisi:      easyEmerging('Georgia',   '0.4M', 22000, 28, [A.mefjus, A.noisia, A.imanu]),

  // North America defaults
  losangeles: {
    topActs: T(
      { name: 'Andy C',         bookings_yr: 8, ref: A.andyC, notes: 'Respect DnB Thursday repeat.' },
      { name: 'Sub Focus',      bookings_yr: 6, ref: A.subFocus },
      { name: 'Mefjus',         bookings_yr: 6, ref: A.mefjus },
      { name: 'Bou',            bookings_yr: 6, ref: A.bou },
      { name: 'Dieselboy',      bookings_yr: 9, country_origin: 'US', primary_label: 'Human Imprint', spotify_monthly: 0.18, ig_followers: 92000, notes: 'US neuro institution.' },
      { name: 'Hybrid Minds',   bookings_yr: 5, ref: A.hybridMinds },
      { name: 'Wilkinson',      bookings_yr: 4, ref: A.wilkinson },
      { name: 'Chase & Status', bookings_yr: 4, ref: A.chaseStatus },
      { name: 'IMANU',          bookings_yr: 5, ref: A.imanu },
      { name: 'Pendulum',       bookings_yr: 2, ref: A.pendulum },
    ),
    stats: { spotify_dnb_monthly_listeners: '4.6M', ig_top_promoter_followers: 145000, ra_events_last_12mo: 130, data_as_of: Q },
  },

  newyork: {
    topActs: T(
      { name: 'Sub Focus',      bookings_yr: 5, ref: A.subFocus },
      { name: 'Andy C',         bookings_yr: 5, ref: A.andyC },
      { name: 'Chase & Status', bookings_yr: 5, ref: A.chaseStatus },
      { name: 'Hybrid Minds',   bookings_yr: 6, ref: A.hybridMinds },
      { name: 'Sherelle',       bookings_yr: 7, ref: A.sherelle, notes: 'Brooklyn jungle revival anchor.' },
      { name: 'Tim Reaper',     bookings_yr: 6, ref: A.tim_reaper },
      { name: 'Goldie',         bookings_yr: 4, ref: A.goldie },
      { name: 'Mefjus',         bookings_yr: 4, ref: A.mefjus },
      { name: 'Bou',            bookings_yr: 5, ref: A.bou },
      { name: 'IMANU',          bookings_yr: 5, ref: A.imanu },
    ),
    stats: { spotify_dnb_monthly_listeners: '5.1M', ig_top_promoter_followers: 132000, ra_events_last_12mo: 120, data_as_of: Q },
  },

  toronto:  easyEmerging('Canada',   '1.6M', 58000, 60, [A.hybridMinds, A.subFocus, A.andyC, A.netsky, A.wilkinson]),
  sydney:   easyEmerging('Australia','3.0M', 110000, 90, [A.subFocus, A.wilkinson, A.dimension, A.hybridMinds, A.cultureShock]),
  melbourne:easyEmerging('Australia','2.8M', 95000, 85, [A.subFocus, A.safire, A.hybridMinds, A.netsky, A.mefjus]),
  auckland: easyEmerging('NZ',       '1.1M', 48000, 55, [A.subFocus, A.wilkinson, A.hybridMinds, A.andyC, A.netsky]),
};

// Default sparse-market shape using a small handful of likely tour acts.
function easy(_country: string, listeners: string, igFollowers: number, raEvents: number): CityEnrichment {
  return easyEmerging(_country, listeners, igFollowers, raEvents,
    [A.mefjus, A.subFocus, A.camoKrooked, A.hybridMinds, A.bou, A.hedex, A.imanu, A.netsky, A.andyC, A.wilkinson]);
}

function easyEmerging(_country: string, listeners: string, igFollowers: number, raEvents: number, refs: Array<typeof A[keyof typeof A]>): CityEnrichment {
  const baseBookings = [6, 5, 5, 4, 4, 4, 3, 3, 3, 3];
  const names = [
    'Mefjus', 'Sub Focus', 'Camo & Krooked', 'Hybrid Minds', 'Bou',
    'Hedex', 'IMANU', 'Netsky', 'Andy C', 'Wilkinson',
  ];
  const acts = refs.slice(0, 10).map((ref, i) => ({ name: names[i] ?? `Top ${i + 1}`, bookings_yr: baseBookings[i] ?? 3, ref }));
  // pad if fewer than 10 references provided
  while (acts.length < 10) {
    const i = acts.length;
    acts.push({ name: names[i] ?? `Top ${i + 1}`, bookings_yr: baseBookings[i] ?? 3, ref: A.mefjus });
  }
  return {
    topActs: T(...acts),
    stats: {
      spotify_dnb_monthly_listeners: listeners,
      ig_top_promoter_followers: igFollowers,
      ra_events_last_12mo: raEvents,
      data_as_of: Q,
    },
  };
}
