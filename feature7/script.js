// Feature 7 — Bright KPI cards + Compact 3-row layout + Ranked Driver Leaderboard

let chOnTime, chVolumeStatus, chCostDest, chSpoilagePie;

const $ = sel => document.querySelector(sel);

// Vibrant palette
const COLORS = {
  blue:   '#3B82F6',
  green:  '#22C55E',
  amber:  '#F59E0B',
  red:    '#EF4444',
  purple: '#8B5CF6',
  teal:   '#14B8A6',
  rose:   '#F43F5E',
  indigo: '#6366F1'
};

// Formatting
const money = n => (n === null || n === undefined || isNaN(n)) ? '—' :
  Number(n).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
const fmt = (n, d=2) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(d);
const fmtInt = n => (n === null || n === undefined || isNaN(n)) ? '0' : String(Math.round(n));
const pct = n => (n === null || n === undefined || isNaN(n)) ? '—' : `${(n * 100).toFixed(1)}%`;

// Build QS from filters
function buildQS(){
  const p = new URLSearchParams();
  const map = {
    from: $('#fromDate').value,
    to: $('#toDate').value,
    destination: $('#destinationSel').value,
    driver_id: $('#driverSel').value,
    transport_id: $('#transportSel').value,
    route_id: $('#routeSel').value,
    status: $('#statusSel').value
  };
  for (const [k,v] of Object.entries(map)) if (v) p.set(k, v);
  return p.toString();
}

// ---------- DIMENSIONS ----------
async function loadDimensions(){
  try{
    const res = await fetch('api.php?action=analytics_dimensions');
    const dims = await res.json();

    const setOpts = (sel, items, toText, toVal) => {
      sel.innerHTML = '<option value="">All</option>';
      (items||[]).forEach(it=>{
        const opt = document.createElement('option');
        opt.value = toVal ? toVal(it) : it;
        opt.textContent = toText ? toText(it) : it;
        sel.appendChild(opt);
      });
    };

    setOpts($('#destinationSel'), dims.destinations);
    setOpts($('#driverSel'), dims.drivers, d=>d.driver_name, d=>d.driver_id);
    setOpts($('#transportSel'), dims.transports, t=>`${t.vehicle_type} — ${t.driver_name||'N/A'}`, t=>t.transport_id);
    setOpts($('#routeSel'), dims.routes, r=>`${r.route_name} • ${r.distance||0}km • ${(r.duration||'').slice(0,5)}`, r=>r.route_id);

  }catch(e){
    console.error('Failed to load dimensions', e);
  }
}

// ---------- KPIs ----------
function setDelta(elId, val, invert=false){
  const el = document.getElementById(elId);
  el.className = 'delta';
  if (val === null || val === undefined || isNaN(val)) { el.textContent = '—'; return; }
  const shown = (val*100).toFixed(1) + '% vs prev.';
  const good = invert ? (val < 0) : (val > 0);
  el.textContent = (val>0?'+':'') + shown;
  el.classList.add(val===0 ? 'flat' : (good ? 'up' : 'down'));
}

let _lastKPIs = null;

async function loadKPIs(){
  const res = await fetch(`api.php?action=kpis&${buildQS()}`);
  const k = await res.json();
  _lastKPIs = k;

  $('#kpiTotalShipments').textContent      = fmtInt(k.total_shipments);
  $('#kpiDispatched').textContent          = fmtInt(k.dispatched);
  $('#kpiDelivered').textContent           = fmtInt(k.delivered);
  $('#kpiAvgTransit').textContent          = fmt(k.avg_transit_hours, 2);
  $('#kpiTotalCost').textContent           = `$${money(k.total_cost)}`;
  $('#kpiAvgCost').textContent             = `$${money(k.avg_cost_per_shipment)}`;
  $('#kpiCostPerKm').textContent           = k.cost_per_km != null ? `$${fmt(k.cost_per_km, 2)}` : '—';
  $('#kpiDispatchCompliance').textContent  = k.dispatch_compliance != null ? (k.dispatch_compliance*100).toFixed(1)+'%' : '—';

  setDelta('deltaTotalShipments', k.total_shipments_delta);
  setDelta('deltaDispatched', k.dispatched_delta);
  setDelta('deltaDelivered', k.delivered_delta);
  setDelta('deltaAvgTransit', k.avg_transit_hours_delta, /*invert=*/true);
  setDelta('deltaTotalCost', k.total_cost_delta);
  setDelta('deltaAvgCost', k.avg_cost_per_shipment_delta);
  setDelta('deltaCostPerKm', k.cost_per_km_delta);
  setDelta('deltaDispatchCompliance', k.dispatch_compliance_delta);

  renderTop5Table(k);
}

function renderTop5Table(k){
  const rows = [
    { name: 'Total Shipments', value: fmtInt(k.total_shipments), def:'Count of shipments in period.'},
    { name: 'Dispatched Shipments', value: fmtInt(k.dispatched), def:'Shipments with at least one progress log.'},
    { name: 'Delivered Shipments', value: fmtInt(k.delivered), def:'Shipments with status = Delivered.'},
    { name: 'Avg Planned Transit Time (hrs)', value: fmt(k.avg_transit_hours,2), def:'Avg(ETA - Dispatch) across progress rows.'},
    { name: 'Total Transport Cost ($)', value: money(k.total_cost), def:'Sum of transportation_cost.'}
  ];
  const tbody = $('#kpiTop5Body');
  tbody.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.name}</strong></td>
      <td>${r.value}</td>
      <td class="muted">${r.def}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------- ANALYTICS (Charts + Leaderboard) ----------
async function loadAnalytics(){
  const res = await fetch(`api.php?action=analytics&${buildQS()}`);
  const a = await res.json();
  drawOnTime(a.on_time_weekly);
  drawVolumeStatus(a.volume_status_daily);
  drawCostDestination(a.cost_per_destination);
  drawSpoilagePie(a.spoilage_summary);
  renderDriverLeaderboard(a.driver_reliability); // NEW
}

function destroyIf(ch){ if (ch) ch.destroy(); }

// On-Time Delivery Rate (weekly)
function drawOnTime(d){
  destroyIf(chOnTime);
  const ctx = document.getElementById('onTimeWeekly').getContext('2d');
  chOnTime = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [{
        label: 'On-Time %',
        data: d.rates,
        borderColor: COLORS.green,
        backgroundColor: 'rgba(34,197,94,.15)',
        tension: .25,
        pointRadius: 3,
        fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v=>v+'%' } } },
      plugins: { legend: { display: true } }
    }
  });
}

// Shipment Volume & Status Trend (daily)
function drawVolumeStatus(d){
  destroyIf(chVolumeStatus);
  const ctx = document.getElementById('volumeStatusDaily').getContext('2d');
  chVolumeStatus = new Chart(ctx, {
    data: {
      labels: d.labels,
      datasets: [
        { type:'bar', label:'Planned',     backgroundColor: COLORS.blue,  data: d.planned, stack: 'status' },
        { type:'bar', label:'In Transit',  backgroundColor: COLORS.amber, data: d.in_transit, stack: 'status' },
        { type:'bar', label:'Delivered',   backgroundColor: COLORS.green, data: d.delivered, stack: 'status' },
        { type:'bar', label:'Pending',     backgroundColor: COLORS.red,   data: d.pending, stack: 'status' },
        { type:'line',label:'Total',       borderColor: COLORS.purple,    data: d.total, tension:.25, yAxisID:'y1', pointRadius: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation:false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, title: { display:true, text:'Shipments (stacked)' } },
        y1:{ beginAtZero:true, position:'right', grid:{ drawOnChartArea:false }, title:{ display:true, text:'Total' } }
      },
      plugins: { legend: { position:'bottom' } }
    }
  });
}

// Transport Cost per Destination & Cost-per-Km
function drawCostDestination(d){
  destroyIf(chCostDest);
  const ctx = document.getElementById('costByDestination').getContext('2d');
  chCostDest = new Chart(ctx, {
    data: {
      labels: d.labels,
      datasets: [
        { type:'bar',  label:'Total Cost ($)', backgroundColor: COLORS.indigo, data: d.costs, yAxisID:'y' },
        { type:'line', label:'Cost per Km ($/km)', borderColor: COLORS.teal, data: d.cost_per_km, tension:.25, yAxisID:'y1', pointRadius: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation:false,
      scales: {
        y:  { beginAtZero: true, title:{display:true, text:'Total Cost ($)'} },
        y1: { beginAtZero: true, position:'right', grid:{ drawOnChartArea:false }, title:{display:true, text:'$/km'} }
      },
      plugins: { legend: { position:'bottom' } }
    }
  });
}

// Spoilage Pie
function drawSpoilagePie(s){
  destroyIf(chSpoilagePie);
  const ctx = document.getElementById('spoilagePie').getContext('2d');
  chSpoilagePie = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Spoiled', 'Not Spoiled'],
      datasets: [{
        data: [s.spoiled, s.ok],
        backgroundColor: [COLORS.rose, COLORS.green],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false, animation:false,
      plugins: { legend: { position:'bottom' } }
    }
  });
}

// Ranked Driver Leaderboard (Top 5 cards)
function renderDriverLeaderboard(data){
  const host = $('#driverLeaderboardList');
  host.innerHTML = '';
  // data.items: [{driver, success_rate, on_time_rate, deliveries}]
  (data.items || []).forEach((d, idx) => {
    const card = document.createElement('div');
    card.className = 'driver-card';
    card.innerHTML = `
      <div class="rank-badge">#${idx+1}</div>
      <div class="driver-meta">
        <div class="driver-name">#${idx+1}. ${d.driver || 'Unknown'}</div>
        <div class="driver-metrics">
          Success Rate: <strong>${fmt(d.success_rate,1)}%</strong><br/>
          On-Time Rate: <strong>${fmt(d.on_time_rate,1)}%</strong><br/>
          Deliveries: <strong>${fmtInt(d.deliveries)}</strong>
        </div>
      </div>
    `;
    host.appendChild(card);
  });
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadDimensions();
  await Promise.all([loadKPIs(), loadAnalytics()]);

  ['fromDate','toDate','destinationSel','driverSel','transportSel','routeSel','statusSel']
    .forEach(id => document.getElementById(id).addEventListener('change', ()=>{
      loadKPIs(); loadAnalytics();
    }));
  document.getElementById('applyBtn').addEventListener('click', ()=>{ loadKPIs(); loadAnalytics(); });
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    ['fromDate','toDate','destinationSel','driverSel','transportSel','routeSel','statusSel']
      .forEach(id => document.getElementById(id).value = '');
    loadKPIs(); loadAnalytics();
  });
});
