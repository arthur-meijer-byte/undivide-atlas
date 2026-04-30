export interface Promoter {
  name: string;
  type: 'undivide' | 'local' | 'venue' | 'independent';
  events: number;
  since: number;
  ig?: string;
  fb?: string;
  yt?: string;
  lineup: string[];
  events_list: {
    date: string;
    year: number;
    name: string;
    cap: number;
    sold: number;
  }[];
}

export interface Market {
  population: number;
  dnbFans: string;
  avgTicket: number;
  competingEvents: number;
  potentialRev: string;
  growth: string;
}

export type CityStatus = 'undivide' | 'growth' | 'emerging' | 'new';
export type CityGenre = 'Liquid' | 'Neuro' | 'Jump Up' | 'Dancefloor' | 'All Styles';
export type MarketSize = 'huge' | 'large' | 'mid' | 'small';

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  status: CityStatus;
  genre: CityGenre;
  marketSize: MarketSize;
  heroColor: string;
  promoters: Promoter[];
  market: Market;
}

const ARTISTS = [
  'Chase & Status', 'Logistics', 'Mefjus', 'Sub Focus', 'Friction', 'Wilkinson',
  'Hazard', 'Turno', 'Etherwood', 'Hybrid Minds', 'Noisia', 'Andy C', 'Dimension',
  'Pola & Bryson', 'Bou', 'Kanine', 'Dave Owen', 'High Contrast', 'Calibre',
  'Camo & Krooked', 'Netsky', 'Fred V', 'IMANU', 'Workforce', 'Bcee'
];

const pick = (n: number, seed: number): string[] => {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(ARTISTS[(seed * 7 + i * 11) % ARTISTS.length]);
  return Array.from(new Set(out));
};

const evts = (yrs: number[], baseName: string, capRange: [number, number]): Promoter['events_list'] => {
  return yrs.map((y, i) => {
    const cap = capRange[0] + ((i * 137) % (capRange[1] - capRange[0]));
    const sold = Math.round(cap * (0.62 + (((y * 13 + i * 17) % 35) / 100)));
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {
      date: `${months[(i * 7) % 12]} ${1 + ((i * 13) % 28)}`,
      year: y,
      name: `${baseName} ${y}`,
      cap, sold
    };
  });
};

const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`;

export const CITIES: City[] = [
  // ------- UNDIVIDE ACTIVE -------
  { id:'london', name:'London', country:'United Kingdom', lat:51.5074, lng:-0.1278,
    status:'undivide', genre:'All Styles', marketSize:'huge',
    heroColor: grad('#e84118','#7a0f00'),
    promoters:[
      { name:'Undivide London', type:'undivide', events:46, since:2015, ig:'undivide.london', fb:'undivideUK', yt:'undivide',
        lineup: pick(8, 1),
        events_list: evts([2016,2017,2018,2019,2021,2022,2023,2024],'Undivide x Printworks',[1800,4500]) },
      { name:'Hospitality', type:'local', events:120, since:2009, ig:'hospitalrecords',
        lineup: pick(7, 2),
        events_list: evts([2018,2019,2020,2022,2023,2024],'Hospitality In The Park',[5000,12000]) },
    ],
    market:{ population:9.5, dnbFans:'est. 480k', avgTicket:42, competingEvents:38, potentialRev:'€2.8M', growth:'+8%' }
  },
  { id:'amsterdam', name:'Amsterdam', country:'Netherlands', lat:52.3676, lng:4.9041,
    status:'undivide', genre:'Liquid', marketSize:'large',
    heroColor: grad('#e84118','#a8240a'),
    promoters:[
      { name:'Undivide NL', type:'undivide', events:32, since:2016, ig:'undivide.nl',
        lineup: pick(7,3),
        events_list: evts([2017,2018,2019,2021,2022,2023,2024],'Undivide x Melkweg',[1200,3200]) },
      { name:'Liquicity', type:'local', events:55, since:2012, ig:'liquicity',
        lineup: pick(6,4),
        events_list: evts([2019,2021,2022,2023,2024],'Liquicity Festival',[8000,15000]) },
    ],
    market:{ population:1.2, dnbFans:'est. 95k', avgTicket:38, competingEvents:18, potentialRev:'€680k', growth:'+11%' }
  },
  { id:'rotterdam', name:'Rotterdam', country:'Netherlands', lat:51.9244, lng:4.4777,
    status:'undivide', genre:'Neuro', marketSize:'mid',
    heroColor: grad('#e84118','#8a1a05'),
    promoters:[
      { name:'Undivide RTM', type:'undivide', events:18, since:2018,
        lineup: pick(6,5),
        events_list: evts([2019,2021,2022,2023,2024],'Undivide x Maassilo',[1500,2800]) },
    ],
    market:{ population:0.65, dnbFans:'est. 42k', avgTicket:35, competingEvents:9, potentialRev:'€320k', growth:'+9%' }
  },
  { id:'berlin', name:'Berlin', country:'Germany', lat:52.5200, lng:13.4050,
    status:'undivide', genre:'Neuro', marketSize:'large',
    heroColor: grad('#e84118','#780f00'),
    promoters:[
      { name:'Undivide Berlin', type:'undivide', events:24, since:2017,
        lineup: pick(7,6),
        events_list: evts([2018,2019,2021,2022,2023,2024],'Undivide x Watergate',[1400,3000]) },
      { name:'Mefjus Audio', type:'independent', events:14, since:2015,
        lineup: pick(5,7),
        events_list: evts([2017,2018,2019,2022,2023],'Mefjus presents',[800,1800]) },
    ],
    market:{ population:3.8, dnbFans:'est. 220k', avgTicket:36, competingEvents:24, potentialRev:'€1.4M', growth:'+10%' }
  },
  { id:'sydney', name:'Sydney', country:'Australia', lat:-33.8688, lng:151.2093,
    status:'undivide', genre:'Jump Up', marketSize:'large',
    heroColor: grad('#e84118','#7a1808'),
    promoters:[
      { name:'Undivide AUS', type:'undivide', events:28, since:2016,
        lineup: pick(7,8),
        events_list: evts([2017,2018,2019,2022,2023,2024],'Undivide Sydney',[1800,3600]) },
    ],
    market:{ population:5.3, dnbFans:'est. 180k', avgTicket:55, competingEvents:14, potentialRev:'€1.1M', growth:'+13%' }
  },
  { id:'manchester', name:'Manchester', country:'United Kingdom', lat:53.4808, lng:-2.2426,
    status:'undivide', genre:'Dancefloor', marketSize:'mid',
    heroColor: grad('#e84118','#8c1808'),
    promoters:[
      { name:'Undivide MCR', type:'undivide', events:22, since:2017,
        lineup: pick(6,9),
        events_list: evts([2018,2019,2022,2023,2024],'Undivide x Warehouse Project',[2200,4000]) },
    ],
    market:{ population:2.7, dnbFans:'est. 145k', avgTicket:34, competingEvents:16, potentialRev:'€720k', growth:'+9%' }
  },
  { id:'newyork', name:'New York', country:'United States', lat:40.7128, lng:-74.0060,
    status:'undivide', genre:'All Styles', marketSize:'huge',
    heroColor: grad('#e84118','#5e0a00'),
    promoters:[
      { name:'Undivide USA', type:'undivide', events:14, since:2019,
        lineup: pick(7,10),
        events_list: evts([2019,2022,2023,2024],'Undivide x Brooklyn Mirage',[2400,5500]) },
    ],
    market:{ population:8.4, dnbFans:'est. 210k', avgTicket:62, competingEvents:11, potentialRev:'€1.6M', growth:'+18%' }
  },
  { id:'toronto', name:'Toronto', country:'Canada', lat:43.6532, lng:-79.3832,
    status:'undivide', genre:'Liquid', marketSize:'mid',
    heroColor: grad('#e84118','#6e0e02'),
    promoters:[
      { name:'Undivide CA', type:'undivide', events:11, since:2020,
        lineup: pick(6,11),
        events_list: evts([2021,2022,2023,2024],'Undivide Toronto',[1200,2400]) },
    ],
    market:{ population:2.9, dnbFans:'est. 85k', avgTicket:48, competingEvents:7, potentialRev:'€520k', growth:'+15%' }
  },
  { id:'melbourne', name:'Melbourne', country:'Australia', lat:-37.8136, lng:144.9631,
    status:'undivide', genre:'Neuro', marketSize:'large',
    heroColor: grad('#e84118','#7c1606'),
    promoters:[
      { name:'Undivide MEL', type:'undivide', events:24, since:2016,
        lineup: pick(7,12),
        events_list: evts([2017,2018,2019,2022,2023,2024],'Undivide Melbourne',[1600,3200]) },
    ],
    market:{ population:5.0, dnbFans:'est. 165k', avgTicket:52, competingEvents:12, potentialRev:'€980k', growth:'+12%' }
  },
  { id:'prague', name:'Prague', country:'Czech Republic', lat:50.0755, lng:14.4378,
    status:'undivide', genre:'Neuro', marketSize:'mid',
    heroColor: grad('#e84118','#6c1004'),
    promoters:[
      { name:'Undivide CZ', type:'undivide', events:19, since:2018,
        lineup: pick(6,13),
        events_list: evts([2019,2021,2022,2023,2024],'Undivide x Roxy',[1100,2200]) },
    ],
    market:{ population:1.3, dnbFans:'est. 88k', avgTicket:24, competingEvents:11, potentialRev:'€340k', growth:'+10%' }
  },
  { id:'warsaw', name:'Warsaw', country:'Poland', lat:52.2297, lng:21.0122,
    status:'undivide', genre:'Jump Up', marketSize:'mid',
    heroColor: grad('#e84118','#7a1305'),
    promoters:[
      { name:'Undivide PL', type:'undivide', events:16, since:2018,
        lineup: pick(6,14),
        events_list: evts([2019,2022,2023,2024],'Undivide Warsaw',[1400,2600]) },
    ],
    market:{ population:1.8, dnbFans:'est. 75k', avgTicket:22, competingEvents:8, potentialRev:'€280k', growth:'+14%' }
  },
  { id:'barcelona', name:'Barcelona', country:'Spain', lat:41.3851, lng:2.1734,
    status:'undivide', genre:'Liquid', marketSize:'mid',
    heroColor: grad('#e84118','#6c0d02'),
    promoters:[
      { name:'Undivide ES', type:'undivide', events:13, since:2019,
        lineup: pick(6,15),
        events_list: evts([2019,2022,2023,2024],'Undivide x Razzmatazz',[1500,2800]) },
    ],
    market:{ population:1.6, dnbFans:'est. 62k', avgTicket:32, competingEvents:6, potentialRev:'€340k', growth:'+11%' }
  },
  { id:'vienna', name:'Vienna', country:'Austria', lat:48.2082, lng:16.3738,
    status:'undivide', genre:'Neuro', marketSize:'mid',
    heroColor: grad('#e84118','#6e0f03'),
    promoters:[
      { name:'Undivide AT', type:'undivide', events:15, since:2018,
        lineup: pick(6,16),
        events_list: evts([2019,2022,2023,2024],'Undivide Vienna',[1200,2200]) },
    ],
    market:{ population:1.9, dnbFans:'est. 70k', avgTicket:30, competingEvents:9, potentialRev:'€310k', growth:'+9%' }
  },
  { id:'dubai', name:'Dubai', country:'UAE', lat:25.2048, lng:55.2708,
    status:'undivide', genre:'Dancefloor', marketSize:'mid',
    heroColor: grad('#e84118','#5c0c02'),
    promoters:[
      { name:'Undivide UAE (partial)', type:'undivide', events:6, since:2022,
        lineup: pick(5,17),
        events_list: evts([2022,2023,2024],'Undivide Dubai',[1400,2400]) },
    ],
    market:{ population:3.4, dnbFans:'est. 48k', avgTicket:75, competingEvents:5, potentialRev:'€620k', growth:'+22%' }
  },
  { id:'capetown', name:'Cape Town', country:'South Africa', lat:-33.9249, lng:18.4241,
    status:'undivide', genre:'Liquid', marketSize:'small',
    heroColor: grad('#e84118','#5a0a01'),
    promoters:[
      { name:'Undivide ZA (partial)', type:'undivide', events:5, since:2022,
        lineup: pick(5,18),
        events_list: evts([2022,2023,2024],'Undivide Cape Town',[800,1600]) },
    ],
    market:{ population:4.7, dnbFans:'est. 38k', avgTicket:18, competingEvents:6, potentialRev:'€180k', growth:'+19%' }
  },

  // ------- GROWTH MARKETS -------
  { id:'la', name:'Los Angeles', country:'United States', lat:34.0522, lng:-118.2437,
    status:'growth', genre:'Dancefloor', marketSize:'large',
    heroColor: grad('#fbbc04','#9a6b00'),
    promoters:[
      { name:'West Coast Bass', type:'local', events:18, since:2018,
        lineup: pick(6,19),
        events_list: evts([2019,2022,2023,2024],'WCB presents',[1500,3000]) },
    ],
    market:{ population:4.0, dnbFans:'est. 110k', avgTicket:55, competingEvents:9, potentialRev:'€820k', growth:'+16%' }
  },
  { id:'tokyo', name:'Tokyo', country:'Japan', lat:35.6762, lng:139.6503,
    status:'growth', genre:'Neuro', marketSize:'large',
    heroColor: grad('#fbbc04','#8a5a00'),
    promoters:[
      { name:'Drum and Bass Sessions JP', type:'local', events:22, since:2014,
        lineup: pick(6,20),
        events_list: evts([2018,2019,2022,2023,2024],'DnB Sessions Tokyo',[1200,2400]) },
    ],
    market:{ population:13.9, dnbFans:'est. 95k', avgTicket:48, competingEvents:7, potentialRev:'€720k', growth:'+13%' }
  },
  { id:'paris', name:'Paris', country:'France', lat:48.8566, lng:2.3522,
    status:'growth', genre:'Liquid', marketSize:'large',
    heroColor: grad('#fbbc04','#7e5200'),
    promoters:[
      { name:'Cyberfunk', type:'local', events:34, since:2010,
        lineup: pick(7,21),
        events_list: evts([2018,2019,2022,2023,2024],'Cyberfunk Paris',[1800,3600]) },
    ],
    market:{ population:2.2, dnbFans:'est. 130k', avgTicket:36, competingEvents:14, potentialRev:'€720k', growth:'+12%' }
  },
  { id:'saopaulo', name:'São Paulo', country:'Brazil', lat:-23.5505, lng:-46.6333,
    status:'growth', genre:'Jump Up', marketSize:'large',
    heroColor: grad('#fbbc04','#7a4f00'),
    promoters:[
      { name:'DnB Brazil', type:'local', events:26, since:2013,
        lineup: pick(6,22),
        events_list: evts([2018,2019,2022,2023,2024],'DnB Brazil presents',[2000,4500]) },
    ],
    market:{ population:12.3, dnbFans:'est. 140k', avgTicket:18, competingEvents:11, potentialRev:'€480k', growth:'+17%' }
  },
  { id:'jhb', name:'Johannesburg', country:'South Africa', lat:-26.2041, lng:28.0473,
    status:'growth', genre:'Dancefloor', marketSize:'mid',
    heroColor: grad('#fbbc04','#6e4700'),
    promoters:[
      { name:'Jozi Bass', type:'local', events:14, since:2017,
        lineup: pick(5,23),
        events_list: evts([2019,2022,2023,2024],'Jozi Bass Sessions',[1100,2200]) },
    ],
    market:{ population:5.6, dnbFans:'est. 52k', avgTicket:16, competingEvents:5, potentialRev:'€220k', growth:'+18%' }
  },
  { id:'singapore', name:'Singapore', country:'Singapore', lat:1.3521, lng:103.8198,
    status:'growth', genre:'Neuro', marketSize:'mid',
    heroColor: grad('#fbbc04','#6a4400'),
    promoters:[
      { name:'Bass Republic SG', type:'local', events:12, since:2018,
        lineup: pick(5,24),
        events_list: evts([2019,2022,2023,2024],'Bass Republic',[900,1800]) },
    ],
    market:{ population:5.7, dnbFans:'est. 38k', avgTicket:58, competingEvents:4, potentialRev:'€340k', growth:'+15%' }
  },

  // ------- EMERGING -------
  { id:'seoul', name:'Seoul', country:'South Korea', lat:37.5665, lng:126.9780,
    status:'emerging', genre:'Neuro', marketSize:'mid',
    heroColor: grad('#34a853','#1a5028'),
    promoters:[
      { name:'Seoul Bass Collective', type:'independent', events:8, since:2020,
        lineup: pick(5,25),
        events_list: evts([2021,2022,2023,2024],'SBC night',[600,1400]) },
    ],
    market:{ population:9.7, dnbFans:'est. 28k', avgTicket:42, competingEvents:3, potentialRev:'€220k', growth:'+24%' }
  },
  { id:'mumbai', name:'Mumbai', country:'India', lat:19.0760, lng:72.8777,
    status:'emerging', genre:'Liquid', marketSize:'large',
    heroColor: grad('#34a853','#185024'),
    promoters:[
      { name:'Sub Continental', type:'local', events:9, since:2019,
        lineup: pick(5,26),
        events_list: evts([2021,2022,2023,2024],'Sub Continental',[800,1800]) },
    ],
    market:{ population:20.4, dnbFans:'est. 55k', avgTicket:14, competingEvents:4, potentialRev:'€180k', growth:'+28%' }
  },
  { id:'brisbane', name:'Brisbane', country:'Australia', lat:-27.4698, lng:153.0251,
    status:'emerging', genre:'Jump Up', marketSize:'mid',
    heroColor: grad('#34a853','#1a4e26'),
    promoters:[
      { name:'BNE Bass', type:'local', events:10, since:2019,
        lineup: pick(5,27),
        events_list: evts([2021,2022,2023,2024],'BNE Bass',[800,1600]) },
    ],
    market:{ population:2.5, dnbFans:'est. 42k', avgTicket:48, competingEvents:5, potentialRev:'€280k', growth:'+19%' }
  },
  { id:'antwerp', name:'Antwerp', country:'Belgium', lat:51.2194, lng:4.4025,
    status:'emerging', genre:'Liquid', marketSize:'small',
    heroColor: grad('#34a853','#1c4f28'),
    promoters:[
      { name:'BE Bass', type:'venue', events:7, since:2020,
        lineup: pick(5,28),
        events_list: evts([2021,2022,2023,2024],'BE Bass',[600,1200]) },
    ],
    market:{ population:0.55, dnbFans:'est. 22k', avgTicket:32, competingEvents:4, potentialRev:'€140k', growth:'+17%' }
  },

  // ------- NEW -------
  { id:'chicago', name:'Chicago', country:'United States', lat:41.8781, lng:-87.6298,
    status:'new', genre:'Dancefloor', marketSize:'mid',
    heroColor: grad('#1a73e8','#0d3a78'),
    promoters:[
      { name:'Chicago Bass', type:'independent', events:4, since:2022,
        lineup: pick(4,29),
        events_list: evts([2023,2024],'Chicago Bass',[800,1500]) },
    ],
    market:{ population:2.7, dnbFans:'est. 32k', avgTicket:50, competingEvents:3, potentialRev:'€180k', growth:'+26%' }
  },
  { id:'moscow', name:'Moscow', country:'Russia', lat:55.7558, lng:37.6173,
    status:'new', genre:'Neuro', marketSize:'large',
    heroColor: grad('#1a73e8','#0e3a72)'),
    promoters:[
      { name:'RU DnB', type:'local', events:5, since:2021,
        lineup: pick(4,30),
        events_list: evts([2022,2023,2024],'RU DnB',[1000,2000]) },
    ],
    market:{ population:12.5, dnbFans:'est. 90k', avgTicket:20, competingEvents:6, potentialRev:'€220k', growth:'+11%' }
  },
  { id:'budapest', name:'Budapest', country:'Hungary', lat:47.4979, lng:19.0402,
    status:'new', genre:'Jump Up', marketSize:'mid',
    heroColor: grad('#1a73e8','#0d386f'),
    promoters:[
      { name:'BP Bass', type:'independent', events:3, since:2022,
        lineup: pick(4,31),
        events_list: evts([2023,2024],'BP Bass',[700,1400]) },
    ],
    market:{ population:1.7, dnbFans:'est. 38k', avgTicket:18, competingEvents:5, potentialRev:'€120k', growth:'+15%' }
  },
  { id:'beijing', name:'Beijing', country:'China', lat:39.9042, lng:116.4074,
    status:'new', genre:'All Styles', marketSize:'huge',
    heroColor: grad('#1a73e8','#0c356a'),
    promoters:[
      { name:'BJ Bass Lab', type:'independent', events:3, since:2023,
        lineup: pick(4,32),
        events_list: evts([2023,2024],'BJ Bass Lab',[800,1400]) },
    ],
    market:{ population:21.5, dnbFans:'est. 60k', avgTicket:38, competingEvents:2, potentialRev:'€240k', growth:'+32%' }
  },
  { id:'mexico', name:'Mexico City', country:'Mexico', lat:19.4326, lng:-99.1332,
    status:'new', genre:'Dancefloor', marketSize:'large',
    heroColor: grad('#1a73e8','#0c356a'),
    promoters:[
      { name:'CDMX Bass', type:'local', events:4, since:2022,
        lineup: pick(4,33),
        events_list: evts([2023,2024],'CDMX Bass',[900,1800]) },
    ],
    market:{ population:9.2, dnbFans:'est. 48k', avgTicket:22, competingEvents:3, potentialRev:'€160k', growth:'+23%' }
  },
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
