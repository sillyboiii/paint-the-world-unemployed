'use strict';

/* =====================================================================
   CONSTANTS
===================================================================== */
const MAP_CENTER   = [-98.5795, 39.8283];
const MAP_ZOOM     = 3.6;
const MAP_MAX_ZOOM = 12;

// Zoom thresholds for state → county crossfade
const ZOOM_CO_START = 4.8;   // counties begin fading in
const ZOOM_CO_FULL  = 6.5;   // counties fully visible
const ZOOM_ST_OUT   = 7.2;   // states fully faded out

const TOPO_STATES   = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const TOPO_COUNTIES = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';
const BLS_API       = 'https://api.bls.gov/publicAPI/v1/timeseries/data/';
const CENSUS_URL    = 'https://api.census.gov/data/2023/acs/acs5/subject'
                    + '?get=NAME,S2301_C04_001E&for=county:*';

/* =====================================================================
   STATE METADATA (51 entries: 50 states + DC)
===================================================================== */
const STATES = [
  { fips: '01', name: 'Alabama',        abbr: 'AL' },
  { fips: '02', name: 'Alaska',         abbr: 'AK' },
  { fips: '04', name: 'Arizona',        abbr: 'AZ' },
  { fips: '05', name: 'Arkansas',       abbr: 'AR' },
  { fips: '06', name: 'California',     abbr: 'CA' },
  { fips: '08', name: 'Colorado',       abbr: 'CO' },
  { fips: '09', name: 'Connecticut',    abbr: 'CT' },
  { fips: '10', name: 'Delaware',       abbr: 'DE' },
  { fips: '11', name: 'D.C.',           abbr: 'DC' },
  { fips: '12', name: 'Florida',        abbr: 'FL' },
  { fips: '13', name: 'Georgia',        abbr: 'GA' },
  { fips: '15', name: 'Hawaii',         abbr: 'HI' },
  { fips: '16', name: 'Idaho',          abbr: 'ID' },
  { fips: '17', name: 'Illinois',       abbr: 'IL' },
  { fips: '18', name: 'Indiana',        abbr: 'IN' },
  { fips: '19', name: 'Iowa',           abbr: 'IA' },
  { fips: '20', name: 'Kansas',         abbr: 'KS' },
  { fips: '21', name: 'Kentucky',       abbr: 'KY' },
  { fips: '22', name: 'Louisiana',      abbr: 'LA' },
  { fips: '23', name: 'Maine',          abbr: 'ME' },
  { fips: '24', name: 'Maryland',       abbr: 'MD' },
  { fips: '25', name: 'Massachusetts',  abbr: 'MA' },
  { fips: '26', name: 'Michigan',       abbr: 'MI' },
  { fips: '27', name: 'Minnesota',      abbr: 'MN' },
  { fips: '28', name: 'Mississippi',    abbr: 'MS' },
  { fips: '29', name: 'Missouri',       abbr: 'MO' },
  { fips: '30', name: 'Montana',        abbr: 'MT' },
  { fips: '31', name: 'Nebraska',       abbr: 'NE' },
  { fips: '32', name: 'Nevada',         abbr: 'NV' },
  { fips: '33', name: 'New Hampshire',  abbr: 'NH' },
  { fips: '34', name: 'New Jersey',     abbr: 'NJ' },
  { fips: '35', name: 'New Mexico',     abbr: 'NM' },
  { fips: '36', name: 'New York',       abbr: 'NY' },
  { fips: '37', name: 'North Carolina', abbr: 'NC' },
  { fips: '38', name: 'North Dakota',   abbr: 'ND' },
  { fips: '39', name: 'Ohio',           abbr: 'OH' },
  { fips: '40', name: 'Oklahoma',       abbr: 'OK' },
  { fips: '41', name: 'Oregon',         abbr: 'OR' },
  { fips: '42', name: 'Pennsylvania',   abbr: 'PA' },
  { fips: '44', name: 'Rhode Island',   abbr: 'RI' },
  { fips: '45', name: 'South Carolina', abbr: 'SC' },
  { fips: '46', name: 'South Dakota',   abbr: 'SD' },
  { fips: '47', name: 'Tennessee',      abbr: 'TN' },
  { fips: '48', name: 'Texas',          abbr: 'TX' },
  { fips: '49', name: 'Utah',           abbr: 'UT' },
  { fips: '50', name: 'Vermont',        abbr: 'VT' },
  { fips: '51', name: 'Virginia',       abbr: 'VA' },
  { fips: '53', name: 'Washington',     abbr: 'WA' },
  { fips: '54', name: 'West Virginia',  abbr: 'WV' },
  { fips: '55', name: 'Wisconsin',      abbr: 'WI' },
  { fips: '56', name: 'Wyoming',        abbr: 'WY' },
];

// Quick lookup: fips2 → state object
const STATE_BY_FIPS = Object.fromEntries(STATES.map(s => [s.fips, s]));

/* =====================================================================
   FALLBACK DATA — BLS 2024 annual average state unemployment rates (%)
   Source: BLS Local Area Unemployment Statistics
===================================================================== */
const FALLBACK_RATES = {
  '01': 3.1, '02': 4.2, '04': 3.5, '05': 3.3, '06': 5.3,
  '08': 3.5, '09': 4.4, '10': 4.3, '11': 5.7, '12': 3.4,
  '13': 3.5, '15': 3.1, '16': 3.6, '17': 4.7, '18': 3.7,
  '19': 2.7, '20': 2.7, '21': 4.8, '22': 4.1, '23': 3.0,
  '24': 2.9, '25': 4.0, '26': 4.3, '27': 3.2, '28': 4.1,
  '29': 3.6, '30': 3.0, '31': 2.4, '32': 5.4, '33': 2.6,
  '34': 4.7, '35': 4.4, '36': 4.3, '37': 3.6, '38': 2.1,
  '39': 4.2, '40': 3.2, '41': 4.4, '42': 3.9, '44': 4.4,
  '45': 3.5, '46': 2.0, '47': 3.7, '48': 4.0, '49': 3.5,
  '50': 2.2, '51': 2.9, '53': 4.7, '54': 4.7, '55': 3.2,
  '56': 3.5,
};

/* =====================================================================
   COLOR — vivid 6-stop ramp, always visible on dark basemap.
   Maps 0→15% unemployment to cream→yellow→orange→red→crimson.
   Typical US range (2–8%) lands in the yellow-orange band where
   small differences are immediately readable.
===================================================================== */
// Low unemployment → dark crimson · High unemployment → warm white
const RATE_STOPS = [
  { v: 0,  r: 110, g: 10,  b: 35  },  // dark crimson
  { v: 3,  r: 168, g: 20,  b: 50  },  // deep red
  { v: 5,  r: 215, g: 48,  b: 42  },  // vivid red
  { v: 8,  r: 242, g: 130, b: 30  },  // orange
  { v: 11, r: 245, g: 200, b: 60  },  // amber
  { v: 15, r: 240, g: 232, b: 210 },  // warm cream / near-white
];

function rateToColor(rate) {
  if (rate === null || rate === undefined || !isFinite(rate)) return '#0d0d18';
  const r = Math.max(0, Math.min(rate, 15));
  for (let i = 0; i < RATE_STOPS.length - 1; i++) {
    const lo = RATE_STOPS[i], hi = RATE_STOPS[i + 1];
    if (r >= lo.v && r <= hi.v) {
      const t = (r - lo.v) / (hi.v - lo.v);
      const R = Math.round(lo.r + t * (hi.r - lo.r));
      const G = Math.round(lo.g + t * (hi.g - lo.g));
      const B = Math.round(lo.b + t * (hi.b - lo.b));
      return `rgb(${R},${G},${B})`;
    }
  }
  const last = RATE_STOPS[RATE_STOPS.length - 1];
  return `rgb(${last.r},${last.g},${last.b})`;
}

// Filtered-out areas: very dark neutral
const DIM_COLOR = '#0a0a14';

/* =====================================================================
   BLS series-ID builder — seasonally adjusted state unemployment rate
===================================================================== */
function blsSeriesId(fips) {
  return `LASST${fips}0000000000003`;
}

/* =====================================================================
   APP STATE
===================================================================== */
let map;
let stateRates       = {};   // fips2  → { rate, period }
let countyRates      = {};   // fips5  → { rate, name, stateFips }
let stateFeatures    = [];
let countyFeatures   = [];
let searchIndex      = [];   // { type, name, fips, feature }
let countyDataLoaded = false;
let filterMin        = 0;
let filterMax        = 20;
let rankDir          = 'high';
let selectedFips     = null;
let selectedType     = null; // 'state' | 'county'
let hoveredStateId   = null;
let hoveredCountyId  = null;

/* =====================================================================
   LOADING PROGRESS
===================================================================== */
function setProgress(pct, msg) {
  document.getElementById('loader-progress').style.width = `${pct}%`;
  if (msg) document.getElementById('loader-status').textContent = msg;
}

function hideLoading() {
  const el = document.getElementById('loading-screen');
  el.classList.add('fade-out');
  setTimeout(() => el.remove(), 600);
}

/* =====================================================================
   DATA — BLS state unemployment rates (v1 API, no key needed)
===================================================================== */
async function fetchBLSStateRates() {
  const fipsList = STATES.map(s => s.fips);
  const batch1   = fipsList.slice(0, 25).map(blsSeriesId);
  const batch2   = fipsList.slice(25).map(blsSeriesId);

  const post = (ids) => fetch(BLS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: ids, startyear: '2023', endyear: '2025' }),
  }).then(r => r.json());

  const [r1, r2] = await Promise.all([post(batch1), post(batch2)]);
  if (r1.status !== 'REQUEST_SUCCEEDED' || r2.status !== 'REQUEST_SUCCEEDED') {
    throw new Error('BLS API did not return success');
  }

  const result = {};
  for (const series of [...r1.Results.series, ...r2.Results.series]) {
    if (!series.data || series.data.length === 0) continue;
    const fips   = series.seriesID.slice(5, 7);
    const latest = series.data[0]; // already sorted newest first
    result[fips] = {
      rate:   parseFloat(latest.value),
      period: `${latest.periodName} ${latest.year}`,
    };
  }
  return result;
}

/* =====================================================================
   DATA — Census ACS 5-year county unemployment rates (no key needed)
   Variable S2301_C04_001E = unemployment rate 16+ years (%)
===================================================================== */
async function fetchCensusCountyRates() {
  const resp = await fetch(CENSUS_URL);
  if (!resp.ok) throw new Error(`Census API ${resp.status}`);
  const rows = await resp.json();

  const result = {};
  for (let i = 1; i < rows.length; i++) {
    const [name, rateStr, state, county] = rows[i];
    const rate = parseFloat(rateStr);
    if (!isFinite(rate) || rate < 0) continue; // -888888888 = suppressed/N/A
    const fips = state + county;
    result[fips] = {
      rate,
      name:      name.split(',')[0].trim(), // strip ", State Name"
      stateFips: state,
    };
  }
  return result;
}

/* =====================================================================
   DATA — BLS state trend (annual averages, last 6 years)
   Called on demand when a state is clicked in the sidebar
===================================================================== */
async function fetchStateTrend(fips) {
  const startYear = String(new Date().getFullYear() - 6);
  const endYear   = String(new Date().getFullYear());

  const resp = await fetch(BLS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: [blsSeriesId(fips)],
      startyear: startYear,
      endyear:   endYear,
    }),
  });
  const json = await resp.json();
  if (json.status !== 'REQUEST_SUCCEEDED') throw new Error('BLS trend error');

  const data = json.Results.series[0].data;

  // Prefer M13 (annual average) records
  let annual = data
    .filter(d => d.period === 'M13')
    .map(d => ({ year: +d.year, rate: parseFloat(d.value) }))
    .filter(d => isFinite(d.rate))
    .sort((a, b) => a.year - b.year);

  // Fallback: average all monthly records per year
  if (annual.length === 0) {
    const byYear = {};
    data.forEach(d => {
      const r = parseFloat(d.value);
      if (isFinite(r) && d.period !== 'M13') {
        if (!byYear[d.year]) byYear[d.year] = [];
        byYear[d.year].push(r);
      }
    });
    annual = Object.entries(byYear)
      .map(([yr, vals]) => ({ year: +yr, rate: vals.reduce((a, b) => a + b) / vals.length }))
      .sort((a, b) => a.year - b.year);
  }

  return annual;
}

/* =====================================================================
   MAP STYLE — CARTO Dark Matter vector tiles (crisp text at every zoom)
   Choropleth layers are inserted before the first symbol layer so that
   place labels always render on top of the fills.
===================================================================== */
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/* =====================================================================
   MAP LAYERS
   States: visible at low zoom, fade out as user zooms past county threshold
   Counties: fade in as user zooms in, fully visible at ZOOM_CO_FULL
===================================================================== */
// `before` = first symbol layer id from the vector style — ensures labels
// always render on top of our choropleth fills.
function addMapLayers(before) {
  // ── STATES ──────────────────────────────────────────────────────
  map.addSource('states', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: stateFeatures },
  });

  // Fill — color stored as feature property, opacity fades with zoom
  map.addLayer({
    id: 'states-fill',
    type: 'fill',
    source: 'states',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': [
        'interpolate', ['linear'], ['zoom'],
        ZOOM_CO_START, 0.65,
        ZOOM_ST_OUT,   0,
      ],
    },
  }, before);

  // Borders — subtle translucent white so they read on the dark vector basemap
  map.addLayer({
    id: 'states-line',
    type: 'line',
    source: 'states',
    paint: {
      'line-color': 'rgba(255,255,255,0.22)',
      'line-width': 0.8,
      'line-opacity': ['interpolate', ['linear'], ['zoom'],
        ZOOM_CO_START, 1,
        ZOOM_ST_OUT,   0,
      ],
    },
  }, before);

  // Hover overlay (white tint via feature-state)
  map.addLayer({
    id: 'states-hover',
    type: 'fill',
    source: 'states',
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 0.14, 0,
      ],
    },
  }, before);

  // Selection outline (white border via feature-state)
  map.addLayer({
    id: 'states-selected',
    type: 'line',
    source: 'states',
    paint: {
      'line-color': '#ffffff',
      'line-width': ['case',
        ['boolean', ['feature-state', 'selected'], false], 2.2, 0,
      ],
      'line-opacity': ['interpolate', ['linear'], ['zoom'],
        ZOOM_CO_START, 1,
        ZOOM_ST_OUT,   0,
      ],
    },
  }, before);

  // ── COUNTIES ────────────────────────────────────────────────────
  map.addSource('counties', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }, // populated later
  });

  // Fill
  map.addLayer({
    id: 'counties-fill',
    type: 'fill',
    source: 'counties',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'],
        ZOOM_CO_START, 0,
        ZOOM_CO_FULL,  0.65,
      ],
    },
  }, before);

  // Borders
  map.addLayer({
    id: 'counties-line',
    type: 'line',
    source: 'counties',
    paint: {
      'line-color': 'rgba(255,255,255,0.1)',
      'line-width': 0.35,
      'line-opacity': ['interpolate', ['linear'], ['zoom'],
        ZOOM_CO_START, 0,
        ZOOM_CO_FULL,  1,
      ],
    },
  }, before);

  // Hover overlay
  map.addLayer({
    id: 'counties-hover',
    type: 'fill',
    source: 'counties',
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 0.18, 0,
      ],
    },
  }, before);

  // County selection outline
  map.addLayer({
    id: 'counties-selected',
    type: 'line',
    source: 'counties',
    paint: {
      'line-color': '#ffffff',
      'line-width': ['case',
        ['boolean', ['feature-state', 'selected'], false], 2.0, 0,
      ],
      'line-opacity': ['interpolate', ['linear'], ['zoom'],
        ZOOM_CO_START, 0,
        ZOOM_CO_FULL,  1,
      ],
    },
  }, before);
  // Vector tile labels are already baked into MAP_STYLE above all fills.
}

/* =====================================================================
   INTERACTIONS — hover + click on states and counties
===================================================================== */
function setupInteractions() {
  const tooltip = document.getElementById('tooltip');
  const ttName  = document.getElementById('tt-name');
  const ttRate  = document.getElementById('tt-rate');
  const ttMeta  = document.getElementById('tt-meta');

  function showTooltip(e, name, rate, meta) {
    ttName.textContent = name;
    ttRate.textContent = rate !== null && isFinite(rate) ? `${rate.toFixed(1)}%` : 'N/A';
    ttMeta.textContent = meta || '';
    tooltip.classList.remove('hidden');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const pad = 16, tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    let tx = e.clientX + pad, ty = e.clientY - th / 2;
    if (tx + tw > window.innerWidth)  tx = e.clientX - tw - pad;
    if (ty < 4)                        ty = 4;
    if (ty + th > window.innerHeight)  ty = window.innerHeight - th - 4;
    tooltip.style.left = `${tx}px`;
    tooltip.style.top  = `${ty}px`;
  }

  function hideTooltip() { tooltip.classList.add('hidden'); }

  // ── State hover ──────────────────────────────────────────────────
  map.on('mousemove', 'states-fill', (e) => {
    if (!e.features.length) return;
    map.getCanvas().style.cursor = 'pointer';
    const f    = e.features[0];
    const fips = String(f.id).padStart(2, '0');
    const info = stateRates[fips];
    const rank = sortedStates().findIndex(s => s.fips === fips) + 1;

    if (hoveredStateId !== null && hoveredStateId !== f.id) {
      map.setFeatureState({ source: 'states', id: hoveredStateId }, { hover: false });
    }
    hoveredStateId = f.id;
    map.setFeatureState({ source: 'states', id: hoveredStateId }, { hover: true });

    showTooltip(
      e,
      STATE_BY_FIPS[fips]?.name || fips,
      info?.rate ?? null,
      `#${rank} of ${sortedStates().length} states · ${info?.period || '2024 Avg'}`,
    );
  });

  map.on('mousemove', (e) => moveTooltip(e));

  map.on('mouseleave', 'states-fill', () => {
    if (hoveredStateId !== null) {
      map.setFeatureState({ source: 'states', id: hoveredStateId }, { hover: false });
      hoveredStateId = null;
    }
    map.getCanvas().style.cursor = '';
    hideTooltip();
  });

  // ── County hover ─────────────────────────────────────────────────
  map.on('mousemove', 'counties-fill', (e) => {
    if (!e.features.length) return;
    map.getCanvas().style.cursor = 'pointer';
    const f    = e.features[0];
    const fips = String(f.id).padStart(5, '0');
    const info = countyRates[fips];
    const stAbbr = STATE_BY_FIPS[fips.slice(0, 2)]?.abbr || '';
    const rank = sortedCounties().findIndex(c => c.fips === fips) + 1;

    if (hoveredCountyId !== null && hoveredCountyId !== f.id) {
      map.setFeatureState({ source: 'counties', id: hoveredCountyId }, { hover: false });
    }
    hoveredCountyId = f.id;
    map.setFeatureState({ source: 'counties', id: hoveredCountyId }, { hover: true });

    showTooltip(
      e,
      info ? `${info.name}, ${stAbbr}` : fips,
      info?.rate ?? null,
      rank > 0 ? `#${rank} of ${sortedCounties().length} counties · ACS 2023` : 'ACS 2023',
    );
  });

  map.on('mouseleave', 'counties-fill', () => {
    if (hoveredCountyId !== null) {
      map.setFeatureState({ source: 'counties', id: hoveredCountyId }, { hover: false });
      hoveredCountyId = null;
    }
    map.getCanvas().style.cursor = '';
    hideTooltip();
  });

  // ── State click ──────────────────────────────────────────────────
  map.on('click', 'states-fill', (e) => {
    if (!e.features.length) return;
    // At county zoom, let county handler take priority
    if (map.getZoom() >= ZOOM_CO_FULL && countyDataLoaded) return;
    const fips = String(e.features[0].id).padStart(2, '0');
    selectFeature(fips, 'state');
  });

  // ── County click ─────────────────────────────────────────────────
  map.on('click', 'counties-fill', (e) => {
    if (!e.features.length) return;
    const fips = String(e.features[0].id).padStart(5, '0');
    selectFeature(fips, 'county');
  });

  // ── Zoom → update rankings & view badge ──────────────────────────
  map.on('zoom', () => {
    const isCounty = map.getZoom() >= ZOOM_CO_FULL && countyDataLoaded;
    const vb = document.getElementById('view-badge');
    if (vb) vb.textContent = isCounty ? 'Counties' : 'States';
    renderRankings();
  });
}

/* =====================================================================
   FEATURE SELECTION — updates sidebar detail card
===================================================================== */
function selectFeature(fips, type) {
  // Deselect previous
  if (selectedFips !== null) {
    const src = selectedType === 'state' ? 'states' : 'counties';
    map.setFeatureState({ source: src, id: +selectedFips }, { selected: false });
  }

  selectedFips = fips;
  selectedType = type;
  const src = type === 'state' ? 'states' : 'counties';
  map.setFeatureState({ source: src, id: +fips }, { selected: true });

  if (type === 'state') {
    const info    = stateRates[fips];
    const state   = STATE_BY_FIPS[fips];
    const ranked  = sortedStates();
    const rank    = ranked.findIndex(s => s.fips === fips) + 1;
    showDetailCard({
      type:   'State',
      name:   state?.name || fips,
      rate:   info?.rate,
      period: info?.period || '2024 Annual Avg',
      rank:   `#${rank} of ${ranked.length} states`,
      fips,
    });
  } else {
    const info   = countyRates[fips];
    const stAbbr = STATE_BY_FIPS[fips.slice(0, 2)]?.abbr || '';
    const ranked = sortedCounties();
    const rank   = ranked.findIndex(c => c.fips === fips) + 1;
    showDetailCard({
      type:   'County',
      name:   info ? `${info.name}, ${stAbbr}` : fips,
      rate:   info?.rate,
      period: 'Census ACS 5-Year 2023',
      rank:   rank > 0 ? `#${rank} of ${ranked.length} counties` : '',
      fips,
    });
  }
}

/* =====================================================================
   DETAIL CARD — sidebar panel with rate, rank, and optional trend chart
===================================================================== */
async function showDetailCard({ type, name, rate, period, rank, fips }) {
  document.getElementById('detail-placeholder').classList.add('hidden');
  const card = document.getElementById('detail-card');
  card.classList.remove('hidden');

  document.getElementById('detail-type').textContent   = type;
  document.getElementById('detail-name').textContent   = name;
  document.getElementById('detail-rate').textContent   = rate != null ? `${rate.toFixed(1)}%` : 'N/A';
  document.getElementById('detail-rank').textContent   = rank;
  document.getElementById('detail-period').textContent = period;

  const trendWrap    = document.getElementById('trend-wrap');
  const trendLoading = document.getElementById('trend-loading');
  trendWrap.classList.add('hidden');
  trendLoading.classList.add('hidden');

  // Trend chart — states only (BLS has per-state annual history)
  if (type === 'State') {
    trendLoading.classList.remove('hidden');
    try {
      const trend = await fetchStateTrend(fips);
      trendLoading.classList.add('hidden');
      if (trend && trend.length > 1) {
        trendWrap.classList.remove('hidden');
        renderSparkline(trend);
      }
    } catch (_) {
      trendLoading.classList.add('hidden');
    }
  }
}

/* =====================================================================
   SPARKLINE — D3 line chart showing annual trend in the sidebar
===================================================================== */
function renderSparkline(data) {
  const wrap = document.getElementById('trend-chart').parentElement;
  const W    = (wrap.clientWidth || 240);
  const H    = 72;
  const m    = { top: 8, right: 6, bottom: 18, left: 30 };
  const iW   = W - m.left - m.right;
  const iH   = H - m.top - m.bottom;

  const svg = d3.select('#trend-chart')
    .attr('width', W).attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`);
  svg.selectAll('*').remove();

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, iW]);

  const [yMin, yMax] = d3.extent(data, d => d.rate);
  const pad = Math.max((yMax - yMin) * 0.3, 0.4);
  const y = d3.scaleLinear()
    .domain([yMin - pad, yMax + pad])
    .range([iH, 0]);

  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  // Subtle grid lines
  g.append('g')
    .call(d3.axisLeft(y).ticks(3).tickSize(-iW).tickFormat(''))
    .call(ax => {
      ax.select('.domain').remove();
      ax.selectAll('line').attr('stroke', '#1e1e1e').attr('stroke-dasharray', '3,3');
    });

  // Area fill
  g.append('path')
    .datum(data)
    .attr('fill', 'rgba(255,255,255,0.04)')
    .attr('d', d3.area()
      .x(d => x(d.year)).y0(iH).y1(d => y(d.rate))
      .curve(d3.curveMonotoneX));

  // Line
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#888')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(d => x(d.year)).y(d => y(d.rate))
      .curve(d3.curveMonotoneX));

  // Dots
  g.selectAll('circle').data(data).join('circle')
    .attr('cx', d => x(d.year))
    .attr('cy', d => y(d.rate))
    .attr('r', 2.5)
    .attr('fill', '#ccc')
    .attr('stroke', '#000')
    .attr('stroke-width', 0.8);

  // X axis (year labels)
  g.append('g')
    .attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format('d')))
    .call(ax => {
      ax.select('.domain').attr('stroke', '#2a2a2a');
      ax.selectAll('.tick line').attr('stroke', '#2a2a2a');
      ax.selectAll('.tick text').attr('fill', '#555').attr('font-size', '9px');
    });

  // Y axis (rate labels)
  g.append('g')
    .call(d3.axisLeft(y).ticks(3).tickFormat(d => `${d.toFixed(1)}%`))
    .call(ax => {
      ax.select('.domain').remove();
      ax.selectAll('.tick line').remove();
      ax.selectAll('.tick text').attr('fill', '#555').attr('font-size', '9px');
    });
}

/* =====================================================================
   RANKINGS — sorted list of states or counties shown in the sidebar
===================================================================== */
function sortedStates() {
  return STATES
    .map(s => ({ ...s, rate: stateRates[s.fips]?.rate }))
    .filter(s => s.rate !== undefined && s.rate >= filterMin && s.rate <= filterMax)
    .sort((a, b) => b.rate - a.rate);
}

function sortedCounties() {
  if (!countyDataLoaded) return [];
  return Object.entries(countyRates)
    .map(([fips, info]) => ({ fips, ...info }))
    .filter(c => isFinite(c.rate) && c.rate >= filterMin && c.rate <= filterMax)
    .sort((a, b) => b.rate - a.rate);
}

function renderRankings() {
  const isCounty = map && map.getZoom() >= ZOOM_CO_FULL && countyDataLoaded;
  const all      = isCounty ? sortedCounties() : sortedStates();
  const items    = rankDir === 'high' ? all.slice(0, 15) : all.slice(-15).reverse();
  const listEl   = document.getElementById('rankings-list');
  listEl.innerHTML = '';

  if (items.length === 0) {
    listEl.innerHTML = '<div style="color:#444;font-size:0.76rem;padding:6px 2px">No data in this range</div>';
    return;
  }

  items.forEach((item, i) => {
    const num  = rankDir === 'high' ? i + 1 : all.length - i;
    const stAbbr = isCounty ? (STATE_BY_FIPS[item.fips?.slice(0, 2)]?.abbr || '') : '';
    const displayName = isCounty
      ? `${item.name || item.fips}${stAbbr ? ', ' + stAbbr : ''}`
      : (item.name || item.fips);

    const div = document.createElement('div');
    div.className = 'rank-item';
    div.innerHTML = `
      <span class="rank-num">${num}</span>
      <span class="rank-swatch" style="background:${rateToColor(item.rate)}"></span>
      <span class="rank-name" title="${displayName}">${displayName}</span>
      <span class="rank-rate">${item.rate.toFixed(1)}%</span>
    `;

    div.addEventListener('click', () => flyToItem(item.fips, isCounty ? 'county' : 'state'));
    listEl.appendChild(div);
  });
}

/* =====================================================================
   FLY-TO — zoom map to a state or county and select it
===================================================================== */
function flyToItem(fips, type) {
  const features = type === 'county' ? countyFeatures : stateFeatures;
  const padded   = type === 'county' ? fips.padStart(5, '0') : fips.padStart(2, '0');
  const feature  = features.find(f => String(f.id).padStart(type === 'county' ? 5 : 2, '0') === padded);
  if (!feature) return;

  const bounds = d3.geoBounds(feature);
  map.fitBounds(
    [[bounds[0][0], bounds[0][1]], [bounds[1][0], bounds[1][1]]],
    { padding: type === 'county' ? 90 : 60, duration: 1100, maxZoom: type === 'county' ? 9 : 7 },
  );
  // Select immediately — feature state doesn't require the feature to be rendered
  selectFeature(padded, type);
}

/* =====================================================================
   FILTER — dims areas outside the selected rate range
===================================================================== */
function initFilter() {
  const minEl  = document.getElementById('filter-min');
  const maxEl  = document.getElementById('filter-max');
  const minVal = document.getElementById('filter-min-val');
  const maxVal = document.getElementById('filter-max-val');

  function apply() {
    filterMin = parseFloat(minEl.value);
    filterMax = parseFloat(maxEl.value);
    if (filterMin > filterMax) {
      [filterMin, filterMax] = [filterMax, filterMin];
      [minEl.value, maxEl.value] = [String(filterMax), String(filterMin)];
    }
    minVal.textContent = `${filterMin.toFixed(1)}%`;
    maxVal.textContent = `${filterMax.toFixed(1)}%`;
    refreshColors();
    renderRankings();
  }

  minEl.addEventListener('input', apply);
  maxEl.addEventListener('input', apply);

  document.getElementById('filter-reset').addEventListener('click', () => {
    minEl.value = '0'; maxEl.value = '20';
    filterMin = 0; filterMax = 20;
    minVal.textContent = '0.0%'; maxVal.textContent = '20.0%';
    refreshColors();
    renderRankings();
  });
}

// Recompute the `color` property for every feature and push updated GeoJSON to MapLibre
function refreshColors() {
  const newStates = {
    type: 'FeatureCollection',
    features: stateFeatures.map(f => {
      const rate    = f.properties.rate;
      const inRange = rate != null && rate >= filterMin && rate <= filterMax;
      return { ...f, properties: { ...f.properties, color: inRange ? rateToColor(rate) : DIM_COLOR } };
    }),
  };
  if (map.getSource('states')) map.getSource('states').setData(newStates);

  if (countyDataLoaded) {
    const newCounties = {
      type: 'FeatureCollection',
      features: countyFeatures.map(f => {
        const rate    = f.properties.rate;
        const inRange = rate != null && rate >= filterMin && rate <= filterMax;
        return { ...f, properties: { ...f.properties, color: inRange ? rateToColor(rate) : DIM_COLOR } };
      }),
    };
    if (map.getSource('counties')) map.getSource('counties').setData(newCounties);
  }
}

/* =====================================================================
   SEARCH — state + county name autocomplete in the sidebar
===================================================================== */
function initSearch() {
  const input    = document.getElementById('search-input');
  const results  = document.getElementById('search-results');
  const clearBtn = document.getElementById('search-clear');

  // Build initial index from state features
  stateFeatures.forEach(f => {
    const fips = String(f.id).padStart(2, '0');
    const s    = STATE_BY_FIPS[fips];
    if (s) searchIndex.push({ type: 'state', name: s.name, abbr: s.abbr, fips, feature: f });
  });

  function query(q) {
    const lq = q.toLowerCase();
    return searchIndex
      .filter(item => {
        const n = item.name.toLowerCase();
        const a = (item.abbr || '').toLowerCase();
        return n.includes(lq) || a.startsWith(lq);
      })
      .slice(0, 14);
  }

  function renderResults(matches) {
    results.innerHTML = '';
    if (matches.length === 0) { results.classList.add('hidden'); return; }
    matches.forEach(item => {
      const rate = item.type === 'state'
        ? stateRates[item.fips]?.rate
        : countyRates[item.fips]?.rate;
      const div  = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `
        <span class="search-item-name">${item.name}</span>
        ${rate != null ? `<span class="search-item-rate">${rate.toFixed(1)}%</span>` : ''}
        <span class="search-item-type">${item.type}</span>
      `;
      div.addEventListener('click', () => {
        input.value = item.name;
        results.classList.add('hidden');
        clearBtn.classList.remove('hidden');
        flyToItem(item.fips, item.type);
      });
      results.appendChild(div);
    });
    results.classList.remove('hidden');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearBtn.classList.toggle('hidden', q === '');
    if (q.length < 1) { results.classList.add('hidden'); return; }
    renderResults(query(q));
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    results.classList.add('hidden');
    clearBtn.classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) results.classList.add('hidden');
  });

  // Called after county data loads to extend the search index
  return {
    addCounties() {
      countyFeatures.forEach(f => {
        const fips = String(f.id).padStart(5, '0');
        const info = countyRates[fips];
        if (!info) return;
        const stAbbr = STATE_BY_FIPS[fips.slice(0, 2)]?.abbr || '';
        searchIndex.push({
          type:    'county',
          name:    `${info.name}, ${stAbbr}`,
          abbr:    stAbbr,
          fips,
          feature: f,
        });
      });
    },
  };
}

/* =====================================================================
   MAP CONTROLS — zoom in / zoom out
===================================================================== */
function initMapControls() {
  document.getElementById('btn-zoom-in').addEventListener('click',  () => map.zoomIn());
  document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());
}

/* =====================================================================
   RANK TABS — highest / lowest toggle
===================================================================== */
function initRankTabs() {
  document.querySelectorAll('.rank-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rank-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rankDir = btn.dataset.dir;
      renderRankings();
    });
  });
}

/* =====================================================================
   MOBILE SIDEBAR TOGGLE
===================================================================== */
function initSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    applyLayout();
  });
  document.getElementById('sidebar-close').addEventListener('click', () => {
    sidebar.classList.remove('open');
    applyLayout();
  });
}

/* =====================================================================
   ERROR — logged to console (banner element removed from UI)
===================================================================== */
function showError(msg) {
  console.warn('Map error:', msg);
}

/* =====================================================================
   LAYOUT — fully JS-driven so it is cache-proof and always correct.
   Inline styles from JS override any stale CSS the browser may have cached.
===================================================================== */
const SIDEBAR_W = 290;
const BANNER_H  = 56;

function applyLayout() {
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  const mobile = vw <= 768;
  const mapW   = mobile ? vw : (vw - SIDEBAR_W);
  const mapH   = vh - BANNER_H;

  // Loading overlay
  setStyle('loading-screen', {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%', zIndex: '9999',
  });

  // App shell: full-viewport column flex
  setStyle('app', {
    position: 'fixed', top: '0', left: '0',
    width: vw + 'px', height: vh + 'px',
    display: 'flex', flexDirection: 'column',
  });

  // Banner: fixed-height top strip (do not touch visual styles)
  setStyle('banner', {
    width: '100%', height: BANNER_H + 'px', flexShrink: '0',
  });

  // Main row that holds sidebar + map
  setStyle('main', {
    flex: '1', display: 'flex', overflow: 'hidden', minHeight: '0',
  });

  // Sidebar: part of flex row on desktop, fixed overlay on mobile
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    if (mobile) {
      Object.assign(sidebar.style, {
        position: 'fixed', top: BANNER_H + 'px', left: '0',
        width: SIDEBAR_W + 'px', height: mapH + 'px',
        flexShrink: '0', overflow: 'hidden', zIndex: '300',
        transform: sidebar.classList.contains('open') ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .3s ease',
      });
    } else {
      Object.assign(sidebar.style, {
        position: 'relative', top: '', left: '',
        width: SIDEBAR_W + 'px', height: mapH + 'px',
        flexShrink: '0', overflow: 'hidden',
        zIndex: '', transform: 'none', transition: '',
      });
    }
  }

  // Map container: takes remaining width in the flex row
  setStyle('map-container', {
    position: 'relative', flex: '1', overflow: 'hidden',
    width: mapW + 'px', height: mapH + 'px',
  });

  // MapLibre canvas needs explicit pixel dimensions
  setStyle('map', {
    display: 'block', width: mapW + 'px', height: mapH + 'px',
  });

  if (map) map.resize();
}

function setStyle(id, props) {
  const el = document.getElementById(id);
  if (!el) return;
  Object.assign(el.style, props);
}

// Run synchronously NOW so the map container has real px dimensions
// before MapLibre is constructed
applyLayout();
window.addEventListener('resize', applyLayout);

/* =====================================================================
   MAIN INIT
===================================================================== */
async function init() {
  setProgress(5, 'Loading boundaries…');

  // Fetch boundaries and state rate data in parallel
  const [stateTopo, countyTopo, blsResult] = await Promise.all([
    fetch(TOPO_STATES).then(r => r.json()),
    fetch(TOPO_COUNTIES).then(r => r.json()),
    fetchBLSStateRates().catch(err => ({ _error: err.message })),
  ]);

  setProgress(45, 'Processing data…');

  // Merge BLS result with fallback (fallback fills any gaps)
  const fallbackObj = Object.fromEntries(
    Object.entries(FALLBACK_RATES).map(([fips, rate]) => [fips, { rate, period: '2024 Annual Avg' }])
  );
  if (blsResult._error) {
    showError(`Live BLS data unavailable — showing 2024 annual averages.`);
    stateRates = fallbackObj;
  } else {
    stateRates = { ...fallbackObj, ...blsResult };
  }

  // Build state GeoJSON — attach rate + grayscale color as feature properties
  stateFeatures = topojson.feature(stateTopo, stateTopo.objects.states).features;
  stateFeatures.forEach(f => {
    const fips = String(f.id).padStart(2, '0');
    const rate = stateRates[fips]?.rate ?? null;
    f.properties = { fips, rate, color: rateToColor(rate) };
  });

  // Build county GeoJSON geometry only — rates added after Census fetch
  countyFeatures = topojson.feature(countyTopo, countyTopo.objects.counties).features;
  countyFeatures.forEach(f => {
    f.properties = { fips: String(f.id).padStart(5, '0'), rate: null, color: DIM_COLOR };
  });

  setProgress(62, 'Initialising map…');

  // Init MapLibre
  map = new maplibregl.Map({
    container: 'map',
    style:     MAP_STYLE,
    center:    MAP_CENTER,
    zoom:      MAP_ZOOM,
    maxZoom:   MAP_MAX_ZOOM,
    attributionControl: false,
  });

  map.on('load', async () => {
    // Re-apply pixel dimensions and force canvas recompute
    applyLayout();
    map.resize();

    setProgress(75, 'Adding layers…');
    // Insert choropleth fills before the first symbol (label) layer so that
    // city/state/country text always renders on top of the coloured fills.
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    addMapLayers(firstSymbol?.id);
    setupInteractions();

    const search = initSearch();
    initFilter();
    initRankTabs();
    initMapControls();
    initSidebarToggle();
    renderRankings();

    hideLoading();

    // Fetch county data in the background — map is already usable at state level
    setProgress(88, 'Fetching county data…');
    fetchCensusCountyRates()
      .then(rates => {
        countyRates = rates;

        // Attach rates to county features
        countyFeatures.forEach(f => {
          const fips = String(f.id).padStart(5, '0');
          const info = rates[fips];
          const rate = info?.rate ?? null;
          f.properties = {
            fips,
            rate,
            color:     rateToColor(rate),
            stateFips: fips.slice(0, 2),
          };
        });

        // Push county data to map source
        map.getSource('counties').setData({
          type: 'FeatureCollection',
          features: countyFeatures,
        });

        countyDataLoaded = true;
        search.addCounties();
        renderRankings();
        setProgress(100);
      })
      .catch(err => {
        console.warn('County data fetch failed:', err);
        showError('County-level data unavailable. Showing state data only.');
      });
  });

  map.on('error', e => console.warn('MapLibre error:', e.error?.message));
}

init();
