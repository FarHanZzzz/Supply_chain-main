// Feature 8 — Simple, bright analytics
const $ = s => document.querySelector(s);

const BRIGHT = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#22c55e','#e11d48','#a855f7'
];

Chart.defaults.color = '#0b1221';
Chart.defaults.font.family = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial';
Chart.defaults.plugins.legend.position = 'right';
Chart.defaults.plugins.tooltip.mode = 'index';
Chart.defaults.plugins.tooltip.intersect = false;
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.elements.arc.borderColor = '#ffffff';
Chart.defaults.elements.line.tension = 0.3;
Chart.defaults.maintainAspectRatio = false;

function money(n){ if(n==null) return '—'; return Number(n).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
function integer(n){ if(n==null) return '—'; return Number(n).toLocaleString(); }
function pct(n){ if(n==null || isNaN(n)) return '—'; return Number(n).toFixed(2) + '%'; }

let chHarvestCrop, chHarvestWh, chCostDest, chSpoilage;

function destroy(c){ if(c){ c.destroy(); } }

async function loadKPIs(){
  const res = await fetch('api.php?action=kpis');
  const k = await res.json();
  $('#kpiRevenue').textContent   = '$' + money(k.revenue);
  $('#kpiTotalShipments').textContent = integer(k.total_shipments);
  $('#kpiInTransit').textContent = integer(k.in_transit);
  $('#kpiAvgCost').textContent   = '$' + money(k.avg_transport_cost);
  $('#kpiUtil').textContent      = pct(k.warehouse_util_pct);
  $('#kpiOrders').textContent    = integer(k.orders_count);
  $('#kpiOnTime').textContent    = pct(k.on_time_rate_pct);
  $('#kpiSuccess').textContent   = pct(k.delivery_success_rate_pct);
}

async function harvestByCrop(){
  const res = await fetch('api.php?action=harvest_by_crop');
  const d = await res.json();
  destroy(chHarvestCrop);
  chHarvestCrop = new Chart($('#chartHarvestCrop'), {
    type: 'doughnut',
    data: { labels: d.labels, datasets: [{ data: d.values, backgroundColor: BRIGHT }] },
    options: { plugins: { legend: { labels: { font: { weight: 'bold' }}}} }
  });
}

async function harvestByWarehouse(){
  const res = await fetch('api.php?action=harvest_by_warehouse');
  const d = await res.json();
  destroy(chHarvestWh);
  chHarvestWh = new Chart($('#chartHarvestWarehouse'), {
    type: 'bar',
    data: { labels: d.labels, datasets: [{ label:'Stored Qty', data: d.values, backgroundColor: '#3b82f6' }] },
    options: {
      indexAxis: 'y',
      scales: { x: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

async function costByDestination(){
  const res = await fetch('api.php?action=cost_by_destination');
  const d = await res.json();
  destroy(chCostDest);
  chCostDest = new Chart($('#chartCostDest'), {
    type: 'bar',
    data: { labels: d.labels, datasets: [{ label:'Total Cost ($)', data: d.values, backgroundColor: '#ef4444' }] },
    options: { 
        scales: { 
        y: { beginAtZero: true },
        x: { ticks: { maxRotation: 0, minRotation: 0 } }   // <-- force horizontal labels
        }
    }
    });

}

async function spoilagePie(){
  const res = await fetch('api.php?action=spoilage_pie');
  const d = await res.json();
  destroy(chSpoilage);
  chSpoilage = new Chart($('#chartSpoilage'), {
    type: 'pie',
    data: { labels: d.labels, datasets: [{ data: d.values, backgroundColor: ['#10b981','#ef4444'] }] },
    options: { plugins: { legend: { labels: { font: { weight:'bold' }}}} }
  });
}

async function init(){
  await loadKPIs();
  await Promise.all([harvestByCrop(), harvestByWarehouse(), costByDestination(), spoilagePie()]);
}

document.addEventListener('DOMContentLoaded', init);
