/* =====================================================================
   US Unemployment Choropleth Map
   Data: BLS Local Area Unemployment Statistics (LAUS)
   Fallback: embedded 2024 Q3 annual average state rates
   ===================================================================== */

// ------------------------------------------------------------------
// State metadata: FIPS code, name, and BLS seasonally-adjusted series
// BLS series format: LASST + fips(2) + 0000000000 + 003
// ------------------------------------------------------------------
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

// Build series-ID → fips lookup for BLS response parsing
// BLS LAUS seasonally adjusted state rate: LASST{fips}0000000000003
function seriesId(fips) {
  return `LASST${fips}0000000000003`;
}

// ------------------------------------------------------------------
// Fallback data: BLS 2024 annual average state unemployment rates (%)
// Source: BLS LAUS program, released Jan 2025
// ------------------------------------------------------------------
const FALLBACK = {
  '01': { rate: 3.1,  period: '2024 Annual Avg' },
  '02': { rate: 4.2,  period: '2024 Annual Avg' },
  '04': { rate: 3.5,  period: '2024 Annual Avg' },
  '05': { rate: 3.3,  period: '2024 Annual Avg' },
  '06': { rate: 5.3,  period: '2024 Annual Avg' },
  '08': { rate: 3.5,  period: '2024 Annual Avg' },
  '09': { rate: 4.4,  period: '2024 Annual Avg' },
  '10': { rate: 4.3,  period: '2024 Annual Avg' },
  '11': { rate: 5.7,  period: '2024 Annual Avg' },
  '12': { rate: 3.4,  period: '2024 Annual Avg' },
  '13': { rate: 3.5,  period: '2024 Annual Avg' },
  '15': { rate: 3.1,  period: '2024 Annual Avg' },
  '16': { rate: 3.6,  period: '2024 Annual Avg' },
  '17': { rate: 4.7,  period: '2024 Annual Avg' },
  '18': { rate: 3.7,  period: '2024 Annual Avg' },
  '19': { rate: 2.7,  period: '2024 Annual Avg' },
  '20': { rate: 2.7,  period: '2024 Annual Avg' },
  '21': { rate: 4.8,  period: '2024 Annual Avg' },
  '22': { rate: 4.1,  period: '2024 Annual Avg' },
  '23': { rate: 3.0,  period: '2024 Annual Avg' },
  '24': { rate: 2.9,  period: '2024 Annual Avg' },
  '25': { rate: 4.0,  period: '2024 Annual Avg' },
  '26': { rate: 4.3,  period: '2024 Annual Avg' },
  '27': { rate: 3.2,  period: '2024 Annual Avg' },
  '28': { rate: 4.1,  period: '2024 Annual Avg' },
  '29': { rate: 3.6,  period: '2024 Annual Avg' },
  '30': { rate: 3.0,  period: '2024 Annual Avg' },
  '31': { rate: 2.4,  period: '2024 Annual Avg' },
  '32': { rate: 5.4,  period: '2024 Annual Avg' },
  '33': { rate: 2.6,  period: '2024 Annual Avg' },
  '34': { rate: 4.7,  period: '2024 Annual Avg' },
  '35': { rate: 4.4,  period: '2024 Annual Avg' },
  '36': { rate: 4.3,  period: '2024 Annual Avg' },
  '37': { rate: 3.6,  period: '2024 Annual Avg' },
  '38': { rate: 2.1,  period: '2024 Annual Avg' },
  '39': { rate: 4.2,  period: '2024 Annual Avg' },
  '40': { rate: 3.2,  period: '2024 Annual Avg' },
  '41': { rate: 4.4,  period: '2024 Annual Avg' },
  '42': { rate: 3.9,  period: '2024 Annual Avg' },
  '44': { rate: 4.4,  period: '2024 Annual Avg' },
  '45': { rate: 3.5,  period: '2024 Annual Avg' },
  '46': { rate: 2.0,  period: '2024 Annual Avg' },
  '47': { rate: 3.7,  period: '2024 Annual Avg' },
  '48': { rate: 4.0,  period: '2024 Annual Avg' },
  '49': { rate: 3.5,  period: '2024 Annual Avg' },
  '50': { rate: 2.2,  period: '2024 Annual Avg' },
  '51': { rate: 2.9,  period: '2024 Annual Avg' },
  '53': { rate: 4.7,  period: '2024 Annual Avg' },
  '54': { rate: 4.7,  period: '2024 Annual Avg' },
  '55': { rate: 3.2,  period: '2024 Annual Avg' },
  '56': { rate: 3.5,  period: '2024 Annual Avg' },
};

// ------------------------------------------------------------------
// BLS API fetch
// ------------------------------------------------------------------
async function fetchBLSData() {
  const currentYear = new Date().getFullYear().toString();
  const prevYear = (new Date().getFullYear() - 1).toString();

  // Split 51 series into two batches (BLS v1 limit: 25 per request)
  const fipsList = STATES.map(s => s.fips);
  const batch1 = fipsList.slice(0, 25).map(seriesId);
  const batch2 = fipsList.slice(25).map(seriesId);

  const endpoint = 'https://api.bls.gov/publicAPI/v1/timeseries/data/';
  const opts = (ids) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: ids, startyear: prevYear, endyear: currentYear }),
  });

  const [r1, r2] = await Promise.all([
    fetch(endpoint, opts(batch1)).then(r => r.json()),
    fetch(endpoint, opts(batch2)).then(r => r.json()),
  ]);

  if (r1.status !== 'REQUEST_SUCCEEDED' || r2.status !== 'REQUEST_SUCCEEDED') {
    throw new Error('BLS API returned non-success status');
  }

  const result = {};
  for (const series of [...r1.Results.series, ...r2.Results.series]) {
    const fips = series.seriesID.slice(5, 7); // extract fips from LASST{fips}...
    if (!series.data || series.data.length === 0) continue;
    // Take the most recent data point
    const latest = series.data[0];
    const periodLabel = `${latest.periodName} ${latest.year}`;
    result[fips] = { rate: parseFloat(latest.value), period: periodLabel };
  }
  return result;
}

// ------------------------------------------------------------------
// Parse BLS period string → sort key so we can pick the latest value
// ------------------------------------------------------------------
function parsePeriod(data) {
  // find the most recent period among all states
  const samples = Object.values(data).map(d => d.period).filter(Boolean);
  if (samples.length === 0) return 'Recent';
  // Return the most common period label
  const counts = {};
  samples.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ------------------------------------------------------------------
// Render the choropleth
// ------------------------------------------------------------------
function renderMap(usGeo, rateData) {
  const wrapper = document.getElementById('map-wrapper');
  const w = wrapper.clientWidth || 960;
  const h = Math.round(w * 0.6);

  const svg = d3.select('#map').attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
  svg.selectAll('*').remove();

  const projection = d3.geoAlbersUsa().fitSize([w, h], topojson.feature(usGeo, usGeo.objects.states));
  const path = d3.geoPath().projection(projection);

  const rates = STATES.map(s => rateData[s.fips]?.rate).filter(Number.isFinite);
  const minRate = d3.min(rates);
  const maxRate = d3.max(rates);

  // Sequential color scale: cream → dark navy-red
  const colorScale = d3.scaleSequential()
    .domain([minRate, maxRate])
    .interpolator(d3.interpolateRgbBasis([
      '#e8f4fd',  // near-white blue  (lowest)
      '#90caf9',  // light blue
      '#42a5f5',  // mid blue
      '#1565c0',  // deep blue
      '#b71c1c',  // dark red         (highest)
    ]));

  // Build fips → state name for tooltip
  const fipsToState = {};
  STATES.forEach(s => { fipsToState[s.fips] = s; });

  const tooltip = document.getElementById('tooltip');
  const ttState  = document.getElementById('tt-state');
  const ttRate   = document.getElementById('tt-rate');
  const ttPeriod = document.getElementById('tt-period');
  const ttRank   = document.getElementById('tt-rank');

  // Sort states by rate for ranking
  const sorted = STATES
    .map(s => ({ ...s, rate: rateData[s.fips]?.rate }))
    .filter(s => s.rate !== undefined)
    .sort((a, b) => b.rate - a.rate);
  const rankMap = {};
  sorted.forEach((s, i) => { rankMap[s.fips] = i + 1; });

  svg.append('g')
    .selectAll('path')
    .data(topojson.feature(usGeo, usGeo.objects.states).features)
    .join('path')
      .attr('class', 'state')
      .attr('d', path)
      .attr('fill', d => {
        const fips = String(d.id).padStart(2, '0');
        const r = rateData[fips]?.rate;
        return Number.isFinite(r) ? colorScale(r) : '#333';
      })
      .on('mousemove', (event, d) => {
        const fips = String(d.id).padStart(2, '0');
        const state = fipsToState[fips];
        const info = rateData[fips];
        if (!state) return;

        ttState.textContent = state.name;
        ttRate.textContent   = info ? `${info.rate.toFixed(1)}%` : 'N/A';
        ttPeriod.textContent = info?.period || '';
        ttRank.textContent   = rankMap[fips]
          ? `Ranked #${rankMap[fips]} of ${sorted.length} (highest)`
          : '';

        const pad = 14;
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        let tx = event.clientX + pad;
        let ty = event.clientY - th / 2;
        if (tx + tw > window.innerWidth)  tx = event.clientX - tw - pad;
        if (ty < 4)                        ty = 4;
        if (ty + th > window.innerHeight)  ty = window.innerHeight - th - 4;

        tooltip.style.left = `${tx}px`;
        tooltip.style.top  = `${ty}px`;
        tooltip.classList.remove('hidden');
      })
      .on('mouseleave', () => tooltip.classList.add('hidden'));

  // State borders
  svg.append('path')
    .datum(topojson.mesh(usGeo, usGeo.objects.states, (a, b) => a !== b))
    .attr('class', 'state-boundary')
    .attr('d', path);

  renderLegend(colorScale, minRate, maxRate);
  renderStats(rateData, sorted);

  const period = parsePeriod(rateData);
  document.getElementById('data-period').textContent = `Data period: ${period}`;
}

// ------------------------------------------------------------------
// Legend
// ------------------------------------------------------------------
function renderLegend(colorScale, minRate, maxRate) {
  const lw = 180, lh = 12;
  const svg = d3.select('#legend-svg').attr('width', lw).attr('height', lh);
  svg.selectAll('*').remove();

  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'leg-grad');
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    grad.append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', colorScale(minRate + t * (maxRate - minRate)));
  }

  svg.append('rect')
    .attr('width', lw).attr('height', lh)
    .attr('rx', 3)
    .attr('fill', 'url(#leg-grad)');

  document.getElementById('legend-min').textContent = `${minRate.toFixed(1)}%`;
  document.getElementById('legend-max').textContent = `${maxRate.toFixed(1)}%`;
}

// ------------------------------------------------------------------
// Stats bar
// ------------------------------------------------------------------
function renderStats(rateData, sorted) {
  if (sorted.length === 0) return;

  const highest = sorted[0];
  const lowest  = sorted[sorted.length - 1];
  const avg = (sorted.reduce((s, x) => s + x.rate, 0) / sorted.length).toFixed(1);

  document.getElementById('highest-state').textContent = highest.name;
  document.getElementById('highest-rate').textContent  = `${highest.rate.toFixed(1)}%`;
  document.getElementById('lowest-state').textContent  = lowest.name;
  document.getElementById('lowest-rate').textContent   = `${lowest.rate.toFixed(1)}%`;
  document.getElementById('national-rate').textContent = `${avg}%`;
}

// ------------------------------------------------------------------
// Main entry point
// ------------------------------------------------------------------
async function init() {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const errBanner = document.getElementById('error-banner');
  const errText   = document.getElementById('error-text');

  // Load US TopoJSON in parallel with BLS API attempt
  const [usGeo, blsResult] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(r => r.json()),
    fetchBLSData().catch(err => ({ error: err.message })),
  ]);

  let rateData;
  if (blsResult.error) {
    console.warn('BLS API fetch failed:', blsResult.error, '— using fallback data.');
    errText.textContent = `Live BLS data unavailable (${blsResult.error}).`;
    errBanner.classList.remove('hidden');
    rateData = FALLBACK;
  } else {
    // Merge BLS result with fallback for any missing states
    rateData = { ...FALLBACK, ...blsResult };
  }

  loading.classList.add('hidden');
  content.classList.remove('hidden');

  renderMap(usGeo, rateData);

  // Re-render on resize so the map stays proportional
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderMap(usGeo, rateData), 150);
  });
}

init();
