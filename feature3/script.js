// Feature 3: Transportation Planning JavaScript

let currentEditingShipment = null;
let currentEditingTransport = null;
let currentTab = 'shipments';
let routesCache = [];
let shipmentsCache = [];

// Leaflet globals
let leafletMap = null;
let routingControl = null;

// Load on page ready
document.addEventListener('DOMContentLoaded', function() {
  initLeafletMap();                // << init map first
  loadShipments();
  loadTransports();
  loadTransportationStats();
  loadDrivers();
  loadHarvestBatches();
  loadPackagedBatches();
  loadShipmentProgress();
});

// Tabs
function showTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabName + 'Tab').style.display = 'block';
  document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// -------- Formatters --------
function formatCurrency(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v); if (Number.isNaN(n)) return '—';
  return n.toFixed(2);
}

// Turn "HH:MM[:SS]" into "H Hour(s) M Minute(s)"
function fmtDurationWords(t) {
  if (!t) return '';
  const [hh='0', mm='0'] = String(t).split(':');
  const h = parseInt(hh,10)||0, m=parseInt(mm,10)||0;
  const parts = [];
  if (h) parts.push(`${h} Hour${h!==1?'s':''}`);
  if (m || !h) parts.push(`${m} Minute${m!==1?'s':''}`);
  return parts.join(' ');
}

// Date/time utils
function fromLocalDateTimeInput(v){ return v ? (v.replace('T',' ') + ':00') : null; }
const _toDate = s => s ? new Date(String(s).replace(' ', 'T')) : null;
function fmt(dt, kind='ymd') {
  const d = _toDate(dt);
  if (!d || isNaN(d)) return '—';
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0');
  const hh=d.getHours(), mm=String(d.getMinutes()).padStart(2,'0');
  if (kind==='ymd') return `${y}-${m}-${da}`;
  if (kind==='ymdhm') return `${y}-${m}-${da} ${String(hh).padStart(2,'0')}:${mm}`;
  if (kind==='time12') { const ampm=hh>=12?'PM':'AM'; const h12=(hh%12)||12; return `${h12}:${mm} ${ampm}`; }
  return d.toISOString();
}

// ===== Loads =====
async function loadShipments() {
  try {
    const res = await fetch('api.php?action=shipments');
    displayShipments(await res.json());
  } catch (e) { console.error('Error loading shipments:', e); alert('Failed to load shipments data'); }
}

async function loadShipmentProgress() {
  try {
    const res = await fetch('api.php?action=shipment_progress');
    displayShipmentProgress(await res.json());
  } catch (e) { console.error('Error loading shipment progress:', e); }
}

async function loadTransports() {
  try {
    const res = await fetch('api.php?action=transports');
    displayTransports(await res.json());
  } catch (e) { console.error('Error loading transports:', e); alert('Failed to load transports data'); }
}

async function loadShipmentsForProgress() {
  try {
    const [shipRes, progRes] = await Promise.all([
      fetch('api.php?action=shipments'),
      fetch('api.php?action=shipment_progress')
    ]);
    const shipments = await shipRes.json();
    const progress = await progRes.json();
    shipmentsCache = Array.isArray(shipments) ? shipments : [];

    const progressed = new Set((Array.isArray(progress)?progress:[]).map(p => String(p.shipment_id)));
    const eligible = shipmentsCache.filter(s => {
      const idStr = String(s.shipment_id);
      const st = String(s.status || '').toLowerCase();
      return !progressed.has(idStr) && st !== 'in transit' && st !== 'delivered';
    });

    const dd = document.getElementById('progressShipmentSelect');
    dd.innerHTML = '<option value="">Select Shipment</option>';
    eligible.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.shipment_id;
      opt.textContent = `SH-${String(s.shipment_id).padStart(6,'0')} — ${s.shipment_destination}`;
      dd.appendChild(opt);
    });
  } catch (e) { console.error('Error loading shipments for progress:', e); }
}

async function loadRoutesForProgress() {
  try {
    const res = await fetch('api.php?action=routes');
    const routes = await res.json();
    routesCache = Array.isArray(routes) ? routes : [];
  } catch (e) { console.error('Error loading routes:', e); routesCache=[]; }
}

async function loadTransportationStats() {
  try {
    const res = await fetch('api.php?action=stats');
    displayTransportationStats(await res.json());
  } catch (e) { console.error('Error loading transportation stats:', e); }
}

// Drivers (optionally include current driver)
async function loadDrivers({ includeId = null } = {}) {
  try {
    const [driversRes, transportsRes] = await Promise.all([
      fetch('api.php?action=drivers'),
      fetch('api.php?action=transports')
    ]);
    const [drivers, transports] = [await driversRes.json(), await transportsRes.json()];
    const used = new Set((transports||[]).map(t => String(t.driver_id)));
    const dd = document.getElementById('transportDriverSelect');
    dd.innerHTML = '<option value="">Select Driver</option>';
    (drivers||[]).forEach(d => {
      const idStr = String(d.driver_id);
      if ((includeId!=null && idStr===String(includeId)) || !used.has(idStr)) {
        dd.appendChild(new Option(`${d.driver_name} (${d.phone_number})`, d.driver_id));
      }
    });
    if (includeId!=null && !Array.from(dd.options).some(o => o.value===String(includeId))) {
      dd.add(new Option(`(Current) Driver #${includeId}`, String(includeId)), 1);
    }
  } catch (e) { console.error('Error loading available drivers:', e); }
}

async function loadHarvestBatches() {
  try { const r=await fetch('api.php?action=harvest_batches'); populateHarvestBatchDropdown(await r.json()); }
  catch(e){ console.error('Error loading harvest batches:', e); }
}
async function loadPackagedBatches() {
  try { const r=await fetch('api.php?action=packaged_batches'); populatePackagedBatchDropdown(await r.json()); }
  catch(e){ console.error('Error loading packaged batches:', e); }
}

// ===== UI Helpers =====
function displayShipments(shipments) {
  const body = document.getElementById('shipmentsTableBody');
  body.innerHTML = '';
  (shipments||[]).forEach(s => {
    const tr = body.insertRow();
    const productInfo = s.harvest_name || s.product_name || 'N/A';
    const statusClass = getStatusClass(s.status);
    tr.innerHTML = `
      <td>SH-${s.shipment_id.toString().padStart(6,'0')}</td>
      <td>${s.shipment_date}</td>
      <td>${s.shipment_destination}</td>
      <td><span class="status-badge ${statusClass}">${s.status}</span></td>
      <td>${s.vehicle_type}</td>
      <td>${s.driver_name}</td>
      <td>${productInfo}</td>
      <td>${formatCurrency(s.transportation_cost)}</td>
      <td>
        <button class="btn-view" onclick="viewShipment(${s.shipment_id})">View</button>
        <button class="btn-edit" onclick="editShipment(
          ${s.shipment_id},
          ${s.transport_id ?? 'null'},
          '${s.shipment_date}',
          '${(s.shipment_destination ?? '').replace(/'/g,"\\'")}',
          '${s.status}',
          ${s.harvest_batch_id ?? 'null'},
          ${s.packaged_product_batch_id ?? 'null'},
          ${s.transportation_cost ?? 'null'}
        )">Edit</button>
        <button class="btn-delete" onclick="deleteShipment(${s.shipment_id})">Delete</button>
      </td>
    `;
  });
}

function displayShipmentProgress(rows) {
  const body = document.getElementById('shipmentProgressTableBody');
  body.innerHTML = '';
  (rows||[]).forEach(p => {
    const sh = `SH-${String(p.shipment_id).padStart(6,'0')}`;
    const km = (p.remaining_distance_km!=null && p.remaining_distance_km!=='')
      ? `${Math.ceil(Number(p.remaining_distance_km))} Kilometers` : '—';

    // safe embed
    const cur = String(p.current_location||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const dst = String(p.destination||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sh}</td>
      <td>${fmt(p.dispatch_time,'ymd')}</td>
      <td>${fmt(p.dispatch_time,'time12')}</td>
      <td>${p.destination || '—'}</td>
      <td>${p.current_location || '—'}</td>
      <td class="text-center">${km}</td>
      <td>${p.route_name || '—'}</td>
      <td>${fmt(p.estimated_arrival_time,'time12')}</td>
      <td>
        <button class="btn-view" onclick="trackShipment('${cur}','${dst}')">Track</button>
        <button class="btn-delete" onclick="deleteShipmentProgress(${p.progress_id})">Delete</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

function displayTransports(transports) {
  const body = document.getElementById('transportsTableBody');
  body.innerHTML = '';
  (transports||[]).forEach(t => {
    const tr = body.insertRow();
    const util = ((t.current_capacity / t.vehicle_capacity) * 100).toFixed(1);
    tr.innerHTML = `
      <td>TRK-${t.transport_id.toString().padStart(3,'0')}</td>
      <td>${t.vehicle_type}</td>
      <td>${t.vehicle_capacity} kg</td>
      <td>${t.current_capacity} kg (${util}%)</td>
      <td>${t.driver_name}</td>
      <td>${t.driver_phone}</td>
      <td>
        <button class="btn-edit" onclick="editTransport(${t.transport_id}, ${t.driver_id}, '${t.vehicle_type}', ${t.vehicle_capacity}, ${t.current_capacity})">Edit</button>
        <button class="btn-delete" onclick="deleteTransport(${t.transport_id})">Delete</button>
      </td>
    `;
  });
}

function displayTransportationStats(stats) {
  document.getElementById('totalShipments').textContent = stats.total_shipments || '0';
  document.getElementById('activeTransports').textContent = stats.active_transports || '0';
  document.getElementById('availableDrivers').textContent = stats.available_drivers || '0';
  document.getElementById('pendingShipments').textContent = stats.pending_shipments || '0';
}

function getStatusClass(status) {
  switch ((status||'').toLowerCase()) {
    case 'planned': return 'status-planned';
    case 'in transit': return 'status-transit';
    case 'delivered': return 'status-delivered';
    case 'pending': return 'status-pending';
    default: return 'status-default';
  }
}

// Dropdown fillers
function populateHarvestBatchDropdown(batches) {
  const dd = document.getElementById('harvestBatchSelect');
  dd.innerHTML = '<option value="">Select Harvest Batch (Optional)</option>';
  (batches||[]).forEach(b => dd.appendChild(new Option(`${b.batch_number} - ${b.harvest_name}`, b.harvest_batch_id)));
}
function populatePackagedBatchDropdown(batches) {
  const dd = document.getElementById('packagedBatchSelect');
  dd.innerHTML = '<option value="">Select Packaged Product (Optional)</option>';
  (batches||[]).forEach(b => dd.appendChild(new Option(`${b.product_name} (${b.production_quantity})`, b.packaged_product_batch_id)));
}

// ===== Modals =====
function openShipmentModal() {
  currentEditingShipment = null;
  document.getElementById('shipmentModalTitle').textContent = 'Plan New Shipment';
  document.getElementById('shipmentForm').reset();
  loadAvailableTransports();
  document.getElementById('shipmentModal').style.display = 'block';
}
function closeShipmentModal(){ document.getElementById('shipmentModal').style.display = 'none'; }

function openTransportModal() {
  currentEditingTransport = null;
  document.getElementById('transportModalTitle').textContent = 'Add New Transport';
  document.getElementById('transportForm').reset();
  loadDrivers();
  document.getElementById('transportModal').style.display = 'block';
}
function closeTransportModal(){ document.getElementById('transportModal').style.display = 'none'; }

async function openProgressModal() {
  await Promise.all([loadShipmentsForProgress(), loadRoutesForProgress()]);
  document.getElementById('progressForm').reset();
  document.getElementById('progressRouteSelect').innerHTML = '<option value="">Select Route</option>';
  document.getElementById('progressDestination').value = '';
  document.getElementById('progressModal').style.display = 'block';
}
function closeProgressModal(){ document.getElementById('progressModal').style.display = 'none'; }

// Available transports for shipment planning (with optional preselect)
async function loadAvailableTransports(currentTransportId = null) {
  try {
    const r = await fetch('api.php?action=available_transports');
    const transports = await r.json();
    const dd = document.getElementById('transportSelect');
    dd.innerHTML = '<option value="">Select Transport</option>';
    let hasCurrent=false;
    (transports||[]).forEach(t => {
      if (String(t.transport_id)===String(currentTransportId)) hasCurrent = true;
      dd.appendChild(new Option(`${t.vehicle_type} - ${t.driver_name} (${t.vehicle_capacity} kg)`, t.transport_id));
    });
    if (currentTransportId && !hasCurrent) {
      const allRes = await fetch('api.php?action=transports');
      const all = await allRes.json();
      const cur = (all||[]).find(x => String(x.transport_id)===String(currentTransportId));
      if (cur) dd.insertBefore(new Option(`${cur.vehicle_type} - ${cur.driver_name} (${cur.vehicle_capacity} kg)`, cur.transport_id), dd.firstChild.nextSibling);
    }
    if (currentTransportId) dd.value = String(currentTransportId);
  } catch(e){ console.error('Error loading available transports:', e); }
}

// ===== Edit / Save =====
function toYMD(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const dt = new Date(d); if (!isNaN(dt)) {
    const y=dt.getFullYear(), mm=String(dt.getMonth()+1).padStart(2,'0'), dd=String(dt.getDate()).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  return '';
}

async function editShipment(
  shipmentId, transportId, shipmentDate, destination, status,
  harvestBatchId=null, packagedBatchId=null, transportationCost=null
) {
  currentEditingShipment = shipmentId;
  document.getElementById('shipmentModalTitle').textContent = 'Edit Shipment';
  document.getElementById('shipmentForm').reset();

  await loadAvailableTransports(transportId);
  await loadHarvestBatches();
  if (harvestBatchId) document.getElementById('harvestBatchSelect').value = String(harvestBatchId);
  await loadPackagedBatches();
  if (packagedBatchId) document.getElementById('packagedBatchSelect').value = String(packagedBatchId);

  document.getElementById('shipmentDate').value = toYMD(shipmentDate);
  document.getElementById('shipmentDestination').value = destination ?? '';
  document.getElementById('shipmentStatus').value = status ?? '';
  document.getElementById('transportationCost').value = transportationCost ?? '';

  document.getElementById('shipmentModal').style.display = 'block';
}

async function editTransport(transportId, driverId, vehicleType, vehicleCapacity, currentCapacity) {
  currentEditingTransport = transportId;
  document.getElementById('transportModalTitle').textContent = 'Edit Transport';
  document.getElementById('transportForm').reset();

  await loadDrivers({ includeId: driverId });
  document.getElementById('transportDriverSelect').value = String(driverId ?? '');
  document.getElementById('vehicleType').value = vehicleType ?? '';
  document.getElementById('vehicleCapacity').value = vehicleCapacity ?? '';
  document.getElementById('currentCapacity').value = (currentCapacity ?? 0);

  document.getElementById('transportModal').style.display = 'block';
}

function viewShipment(shipmentId){ alert(`Viewing details for shipment ID: ${shipmentId}`); }

async function saveShipment() {
  const transportId = document.getElementById('transportSelect').value;
  const harvestBatchId = document.getElementById('harvestBatchSelect').value || null;
  const packagedBatchId = document.getElementById('packagedBatchSelect').value || null;
  const shipmentDate = document.getElementById('shipmentDate').value;
  const destination = document.getElementById('shipmentDestination').value;
  const status = document.getElementById('shipmentStatus').value;
  const costRaw = document.getElementById('transportationCost').value;
  const transportationCost = costRaw!=='' ? parseFloat(costRaw) : null;

  if (!transportId || !shipmentDate || !destination || !status) { alert('Please fill in all required fields'); return; }
  if (transportationCost!==null && (Number.isNaN(transportationCost) || transportationCost<0)) { alert('Transportation cost must be a non-negative number.'); return; }

  const data = {
    action: currentEditingShipment ? 'update_shipment' : 'add_shipment',
    transport_id: parseInt(transportId),
    harvest_batch_id: harvestBatchId ? parseInt(harvestBatchId) : null,
    packaged_product_batch_id: packagedBatchId ? parseInt(packagedBatchId) : null,
    shipment_date: shipmentDate,
    shipment_destination: destination,
    status,
    transportation_cost: transportationCost
  };
  if (currentEditingShipment) data.shipment_id = currentEditingShipment;

  try {
    const response = await fetch('api.php', {
      method: currentEditingShipment ? 'PUT' : 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      closeShipmentModal();
      loadShipments();
      loadTransportationStats();
      alert(currentEditingShipment ? 'Shipment updated successfully' : 'Shipment planned successfully');
    } else { alert('Error: ' + (result.error || 'Unknown error')); }
  } catch (e) { console.error('Error saving shipment:', e); alert('Failed to save shipment'); }
}

// Create or update a transport (used by the Transport modal Save button)
async function saveTransport() {
  const driverId        = document.getElementById('transportDriverSelect').value;
  const vehicleType     = document.getElementById('vehicleType').value;
  const vehicleCapacity = document.getElementById('vehicleCapacity').value;
  const currentCapacity = document.getElementById('currentCapacity').value;

  if (!driverId || !vehicleType || !vehicleCapacity) {
    alert('Please fill in all required fields');
    return;
  }

  const payload = {
    action: (typeof currentEditingTransport === 'number' && !Number.isNaN(currentEditingTransport))
      ? 'update_transport'
      : 'add_transport',
    driver_id: parseInt(driverId, 10),
    vehicle_type: vehicleType,
    vehicle_capacity: parseFloat(vehicleCapacity),
    current_capacity: currentCapacity !== '' ? parseFloat(currentCapacity) : 0
  };

  if (payload.action === 'update_transport') {
    payload.transport_id = currentEditingTransport;
  }

  try {
    const res = await fetch('api.php', {
      method: payload.action === 'update_transport' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const out = await res.json();

    if (out.success) {
      closeTransportModal();
      await Promise.all([loadTransports(), loadTransportationStats()]);
      alert(payload.action === 'update_transport' ? 'Transport updated successfully' : 'Transport added successfully');
    } else {
      alert('Error: ' + (out.error || 'Failed to save transport'));
    }
  } catch (err) {
    console.error('Error saving transport:', err);
    alert('Failed to save transport');
  }
}


// ===== Shipment Progress =====
async function onProgressShipmentChanged() {
  const shipmentId = document.getElementById('progressShipmentSelect').value;
  const destInput  = document.getElementById('progressDestination');
  const routesDD   = document.getElementById('progressRouteSelect');

  routesDD.innerHTML = '<option value="">Select Route</option>';
  if (!shipmentId) { destInput.value = ''; return; }

  const s = shipmentsCache.find(x => String(x.shipment_id) === String(shipmentId));
  const dest = s ? s.shipment_destination : '';
  destInput.value = dest || '';

  const norm = v => String(v||'').trim().toLowerCase();
  const filtered = (routesCache||[]).filter(r => norm(r.destination) === norm(dest));

  if (filtered.length === 0) {
    routesDD.innerHTML = '<option value="">No routes found for this destination</option>';
    return;
  }
  filtered.forEach(r => {
    const dist = (r.distance!=null && r.distance!=='') ? `${r.distance} km` : '';
    const dur  = fmtDurationWords(r.duration);
    const rc   = r.road_condition ? `Road Condition: ${r.road_condition}` : '';
    const labelDetails = [dist, dur, rc].filter(Boolean).join(' • ');

    const opt = document.createElement('option');
    opt.value = r.route_id;
    opt.textContent = labelDetails ? `${r.route_name} — ${labelDetails}` : r.route_name;
    routesDD.appendChild(opt);
  });

  // Do NOT change status here; only on save.
}

async function saveShipmentProgress() {
  const shipmentId   = document.getElementById('progressShipmentSelect').value;
  const routeId      = document.getElementById('progressRouteSelect').value;
  const dispatchLocal= document.getElementById('progressDispatchTime').value;
  const dispatchTime = fromLocalDateTimeInput(dispatchLocal);

  if (!shipmentId || !routeId || !dispatchTime) { alert('Please select Shipment, Route and set Dispatch Time'); return; }

  try {
    const res = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'add_shipment_progress', shipment_id:parseInt(shipmentId), route_id:parseInt(routeId), dispatch_time:dispatchTime })
    });
    const out = await res.json();
    if (out.success) {
      closeProgressModal();
      await Promise.all([ loadShipmentProgress(), loadShipmentsForProgress(), loadShipments(), loadTransportationStats() ]);
      alert('Shipment progress logged');
    } else {
      alert('Error: ' + (out.error || 'Failed to log progress'));
    }
  } catch (e) {
    console.error('Failed to save shipment progress:', e);
    alert('Failed to save shipment progress');
  }
}

// ===== Delete =====
async function deleteShipment(shipmentId) {
  if (!confirm('Are you sure you want to delete this shipment?')) return;
  try {
    const r = await fetch('api.php', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'delete_shipment', shipment_id:shipmentId }) });
    const out = await r.json();
    if (out.success) { loadShipments(); loadTransportationStats(); alert('Shipment deleted successfully'); }
    else { alert('Failed to delete shipment'); }
  } catch (e) { console.error('Error deleting shipment:', e); alert('Failed to delete shipment'); }
}

async function deleteShipmentProgress(progressId) {
  if (!confirm('Delete this progress log?')) return;
  try {
    const r = await fetch('api.php', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'delete_shipment_progress', progress_id:progressId }) });
    const out = await r.json();
    if (out.success) {
      await Promise.all([loadShipmentProgress(), loadShipments(), loadTransportationStats()]);
      alert('Progress deleted');
    } else { alert('Failed to delete progress'); }
  } catch (e) { console.error('Error deleting progress:', e); alert('Failed to delete progress'); }
}

async function deleteTransport(transportId) {
  if (!confirm('Are you sure you want to delete this transport?')) return;
  try {
    const r = await fetch('api.php', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'delete_transport', transport_id:transportId }) });
    const out = await r.json();
    if (out.success) { loadTransports(); loadTransportationStats(); alert('Transport deleted successfully'); }
    else { alert('Failed to delete transport'); }
  } catch (e) { console.error('Error deleting transport:', e); alert('Failed to delete transport'); }
}

// Search
async function searchShipments() {
  const term = document.getElementById('shipmentSearch').value;
  if (term.trim()==='') { loadShipments(); return; }
  try {
    const r = await fetch(`api.php?action=search&term=${encodeURIComponent(term)}`);
    displayShipments(await r.json());
  } catch (e) { console.error('Error searching shipments:', e); alert('Failed to search shipments'); }
}

// Refresh
function refreshData() {
  if (currentTab==='shipments') { loadShipments(); loadShipmentProgress(); } else { loadTransports(); }
  loadTransportationStats();
  alert('Data refreshed successfully');
}

/* =======================
   Leaflet Map + Routing
   ======================= */
function initLeafletMap() {
  // Center roughly on Bangladesh
  leafletMap = L.map('map').setView([23.685, 90.3563], 6);

  // OSM tiles (for dev/demo use)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(leafletMap);
}

// Simple geocoder via Nominatim (dev-friendly)
async function geocodeAddress(q) {
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      const { lat, lon } = data[0];
      return L.latLng(parseFloat(lat), parseFloat(lon));
    }
    return null;
  } catch (e) {
    console.error('Geocode failed:', e);
    return null;
  }
}

// Draw/replace route: current_location -> destination
async function trackShipment(currentLocation, destination) {
  if (!leafletMap) initLeafletMap();

  if (!currentLocation || !destination) {
    alert('Missing current location or destination for this shipment.');
    return;
  }

  // Geocode both ends
  const [startLL, endLL] = await Promise.all([ geocodeAddress(currentLocation), geocodeAddress(destination) ]);

  if (!startLL || !endLL) {
    alert('Could not locate one or both addresses on the map.');
    return;
  }

  // Remove previous route if any
  if (routingControl) {
    leafletMap.removeControl(routingControl);
    routingControl = null;
  }

  // Add a new route via OSRM demo server
  routingControl = L.Routing.control({
    waypoints: [ startLL, endLL ],
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    show: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    lineOptions: { addWaypoints:false }
  }).addTo(leafletMap);

  // Ensure map fits when route is ready
  routingControl.on('routesfound', function(e){
    const route = e.routes && e.routes[0];
    if (route && route.coordinates && route.coordinates.length) {
      const bounds = L.latLngBounds(route.coordinates);
      leafletMap.fitBounds(bounds, { padding: [30,30] });
    }
  });
}
