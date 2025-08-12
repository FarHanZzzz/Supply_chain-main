// Feature 2: Stock Monitoring JavaScript

let currentEditingBatch = null;
let currentEditingPackagedBatch = null;
// TOP-LEVEL near other globals
let ppbHarvestBatchesCache = [];


// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadHarvestBatches();
    loadStockSummary();
    loadHarvests();
    loadWarehouses();
    loadWarehouseStock(); // Load warehouse stock on page load
    loadPackagedProductBatches(); // Load packaged product batches on page load
});


function selectValueReliably(selectEl, wanted) {
  const target = String(wanted ?? '');
  // Try normal way
  selectEl.value = target;
  if (selectEl.value === target) return true;

  // Fallback: find option by value and set selectedIndex
  const idx = Array.from(selectEl.options).findIndex(o => String(o.value) === target);
  if (idx >= 0) {
    selectEl.selectedIndex = idx;
    return selectEl.value === target;
  }
  return false;
}

function selectByLabelFallback(selectEl, label) {
  if (!label) return false;
  const wanted = String(label).trim().toLowerCase();
  const idx = Array.from(selectEl.options).findIndex(
    o => o.textContent.trim().toLowerCase() === wanted
  );
  if (idx >= 0) {
    selectEl.selectedIndex = idx;
    return true;
  }
  return false;
}


// Load harvest batches data
async function loadHarvestBatches() {
    try {
        const response = await fetch('api.php?action=batches');
        const batches = await response.json();
        displayHarvestBatches(batches);
    } catch (error) {
        console.error('Error loading harvest batches:', error);
        alert('Failed to load harvest batches data');
    }
}

// Load stock summary
async function loadStockSummary() {
    try {
        const response = await fetch('api.php?action=summary');
        const summary = await response.json();
        displayStockSummary(summary);
    } catch (error) {
        console.error('Error loading stock summary:', error);
    }
}

// Load harvests for dropdown
async function loadHarvests() {
    try {
        const response = await fetch('api.php?action=harvests');
        const harvests = await response.json();
        populateHarvestDropdown(harvests);
    } catch (error) {
        console.error('Error loading harvests:', error);
    }
}

// Load warehouses for dropdown
async function loadWarehouses() {
    try {
        const response = await fetch('api.php?action=warehouses');
        const warehouses = await response.json();
        populateWarehouseDropdown(warehouses);
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}

// Load and display warehouse stock breakdown
async function loadWarehouseStock() {
    try {
        const response = await fetch('api.php?action=warehouse_stock');
        const stock = await response.json();
        displayWarehouseStock(stock);
    } catch (error) {
        console.error('Error loading warehouse stock:', error);
        alert('Failed to load warehouse stock breakdown');
    }
}

// Load packaged product batch inventory
async function loadPackagedProductBatches() {
    try {
        const response = await fetch('api.php?action=packaged_batches');
        const batches = await response.json();
        displayPackagedProductBatches(batches);
    } catch (error) {
        console.error('Error loading packaged product batches:', error);
        alert('Failed to load packaged product batch inventory');
    }
}

// Display packaged product batch inventory in table
function displayPackagedProductBatches(batches) {
  const tbody = document.getElementById('packagedBatchesTableBody');
  tbody.innerHTML = '';

  if (!batches.length) {
    const row = tbody.insertRow();
    row.innerHTML = '<td colspan="8" style="text-align:center;color:#6E7F7A;padding:20px;">No packaged product batches found</td>';
    return;
  }

  batches.forEach(batch => {
    const row = tbody.insertRow();
    row.innerHTML = `
        <td>${batch.batch_number || 'N/A'}</td>
        <td>${batch.harvest_batch_number || '—'}</td>   <!-- ✅ from backend join -->
        <td>${batch.batch_name || 'N/A'}</td>
        <td>${batch.production_quantity || 0} kg</td>
        <td>${batch.production_date || 'N/A'}</td>
        <td>${batch.warehouse_name || 'N/A'}</td>
        <td>${batch.factory_name || 'N/A'}</td>
        <td>
        <button class="btn-view" onclick="viewPackagedBatch(${batch.packaged_product_batch_id})">View</button>
        <button class="btn-edit" onclick="editPackagedBatch(
            ${batch.packaged_product_batch_id},
            ${batch.harvest_batch_id ?? 'null'},
            '${(batch.harvest_batch_number || '').replace(/'/g, "\\'")}',
            '${(batch.batch_name || '').replace(/'/g, "\\'")}',
            '${(batch.production_date || '').replace(/'/g, "\\'")}',
            ${batch.production_quantity ?? 'null'},
            ${batch.factory_id ?? 'null'},
            ${batch.warehouse_id ?? 'null'},
            '${(batch.factory_name || '').replace(/'/g, "\\'")}',
            '${(batch.warehouse_name || '').replace(/'/g, "\\'")}'
            )">Edit</button>
        <button class="btn-delete" onclick="deletePackagedBatch(${batch.packaged_product_batch_id})">Delete</button>
      </td>
    `;
  });
}

// Search packaged product batches
function searchPackagedBatches() {
    const searchTerm = document.getElementById('packagedBatchSearch').value.toLowerCase();
    const tableBody = document.getElementById('packagedBatchesTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

// Load low stock packaged items
async function loadLowStockPackagedItems() {
    try {
        const response = await fetch('api.php?action=packaged_batches');
        const batches = await response.json();
        const lowStockBatches = batches.filter(batch => 
            (batch.production_quantity && parseFloat(batch.production_quantity) < 100)
        );
        displayPackagedProductBatches(lowStockBatches);
    } catch (error) {
        console.error('Error loading low stock packaged items:', error);
        alert('Failed to load low stock packaged items');
    }
}

// View packaged batch details (placeholder function)
function viewPackagedBatch(batchId) {
    alert(`Viewing packaged batch ID: ${batchId}\nThis functionality can be expanded to show detailed batch information.`);
}

// Open the modal pre-filled for EDIT
// id, hbId, hbNumber, batchName, prodDate, prodQty, factoryId, warehouseId, factoryName, warehouseName
async function editPackagedBatch(
  id,
  harvestBatchId,
  harvestBatchNumber,
  batchName,
  productionDate,
  productionQuantity,
  factoryId,
  warehouseId,
  factoryName,
  warehouseName
) {
  currentEditingPackagedBatch = id;

  // open modal + load dropdowns with the current HB included
  document.getElementById('packagedBatchModal').style.display = 'block';
  await loadPackagedBatchDropdowns(harvestBatchId);

  // fill fields
  document.getElementById('packagedBatchModalTitle').textContent = 'Edit Packaged Product Batch';
  document.getElementById('packagedBatchName').value = batchName || '';
  document.getElementById('packagedProductionDate').value = productionDate || '';
  document.getElementById('packagedProductionQuantity').value = productionQuantity ?? '';

  if (factoryId != null) document.getElementById('packagedFactorySelect').value = String(factoryId);
  if (warehouseId != null) document.getElementById('packagedWarehouseSelect').value = String(warehouseId);
  if (harvestBatchId != null) document.getElementById('packagedHarvestBatchSelect').value = String(harvestBatchId);
}




// Actually delete via API
async function deletePackagedBatch(id) {
  if (!confirm('Are you sure you want to delete this packaged batch?')) return;

  try {
    const res = await fetch('api.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_packaged_batch', packaged_product_batch_id: id })
    });
    const json = await res.json();
    if (json.success) {
      await loadPackagedProductBatches();
      alert('Packaged batch deleted successfully');
    } else {
      alert(json.error || 'Failed to delete packaged batch');
    }
  } catch (e) {
    console.error(e);
    alert('Failed to delete packaged batch');
  }
}


function displayWarehouseStock(stock) {
    const tbody = document.getElementById('warehouseStockTableBody');
    tbody.innerHTML = '';
    stock.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.warehouse_name}</td>
            <td class="${getStockClass(row.raw_quantity)}">${row.raw_quantity}</td>
            <td class="${getStockClass(row.finished_quantity)}">${row.finished_quantity}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getStockClass(qty) {
    qty = parseFloat(qty);
    if (qty < 100) return 'stock-low';
    if (qty < 500) return 'stock-medium';
    return 'stock-high';
}

// Add styles for stock classes (only once)
if (!document.getElementById('stock-style')) {
    const style = document.createElement('style');
    style.id = 'stock-style';
    style.innerHTML = `
        .stock-low { background: #f8d7da; color: #721c24; font-weight: bold; }
        .stock-medium { background: #fff3cd; color: #856404; font-weight: bold; }
        .stock-high { background: #d4edda; color: #155724; font-weight: bold; }
    `;
    document.head.appendChild(style);
}

// Load warehouse stock on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWarehouseStock);
} else {
    loadWarehouseStock();
}

// Display harvest batches in table
function displayHarvestBatches(batches) {
    const tableBody = document.getElementById('batchesTableBody');
    tableBody.innerHTML = '';
    
    batches.forEach(batch => {
        const row = tableBody.insertRow();
        const statusClass = getStatusClass(batch.status);
        
        row.innerHTML = `
            <td>${batch.batch_number}</td>
            <td>${batch.harvest_name}</td>
            <td>${batch.quantity} kg</td>
            <td><span class="status-badge ${statusClass}">${batch.status}</span></td>
            <td>${batch.warehouse_name}</td>
            <td>${batch.storage_date}</td>
            <td>
                <button class="btn-view" onclick="viewBatch(${batch.harvest_batch_id})">View</button>
                <button class="btn-edit"
                onclick="editBatch(
                    ${batch.harvest_batch_id},
                    '${(batch.batch_number||'').replace(/'/g, "\\'")}',
                    ${batch.harvest_id ?? 'null'},
                    ${batch.warehouse_id ?? 'null'},
                    ${batch.quantity},
                    '${(batch.status||'').replace(/'/g, "\\'")}',
                    '${(batch.storage_date||'').replace(/'/g, "\\'")}',
                    '${(batch.harvest_name||'').replace(/'/g, "\\'")}',
                    '${(batch.warehouse_name||'').replace(/'/g, "\\'")}'
                )">Edit</button>
                <button class="btn-delete" onclick="deleteBatch(${batch.harvest_batch_id})">Delete</button>
            </td>
            `;
    });
}

// Display stock summary
function displayStockSummary(summary) {
    document.getElementById('totalBatches').textContent = summary.total_batches || '0';
    document.getElementById('totalPackages').textContent = summary.total_packages || '0';
    document.getElementById('totalMaterials').textContent = summary.total_materials || '0';
    document.getElementById('totalWarehouses').textContent = summary.total_warehouses || '0';
}

// Get status class for styling
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'stored':
            return 'status-stored';
        case 'dispatched':
            return 'status-dispatched';
        case 'pending':
            return 'status-pending';
        default:
            return 'status-default';
    }
}

// Populate harvest dropdown
function populateHarvestDropdown(harvests) {
    const dropdown = document.getElementById('harvestSelect');
    dropdown.innerHTML = '<option value="">Select Harvest</option>';
    
    harvests.forEach(harvest => {
        const option = document.createElement('option');
        option.value = harvest.harvest_id;
        option.textContent = harvest.harvest_name;
        dropdown.appendChild(option);
    });
}

// Populate warehouse dropdown
function populateWarehouseDropdown(warehouses) {
    const dropdown = document.getElementById('warehouseSelect');
    dropdown.innerHTML = '<option value="">Select Warehouse</option>';
    
    warehouses.forEach(warehouse => {
        const option = document.createElement('option');
        option.value = warehouse.warehouse_id;
        option.textContent = warehouse.warehouse_name;
        dropdown.appendChild(option);
    });
}

// Modal functions
function openBatchModal() {
  currentEditingBatch = null;
  document.getElementById('batchModalTitle').textContent = 'Add New Batch';
  document.getElementById('batchForm').reset();
  // Make sure dropdowns have a clean default
  Promise.all([loadHarvests(), loadWarehouses()]).then(() => {
    document.getElementById('harvestSelect').selectedIndex = 0;
    document.getElementById('warehouseSelect').selectedIndex = 0;
  });
  document.getElementById('batchModal').style.display = 'block';
}


function closeBatchModal() {
    document.getElementById('batchModal').style.display = 'none';
}

// Edit batch
// Edit batch (robust preselect)
async function editBatch(
  batchId, batchNumber, harvestId, warehouseId, quantity, status, storageDate,
  harvestName, warehouseName
) {
  currentEditingBatch = batchId;
  document.getElementById('batchModalTitle').textContent = 'Edit Batch';

  // Fill simple fields
  document.getElementById('batchNumber').value = batchNumber || '';
  document.getElementById('quantity').value = quantity ?? '';
  document.getElementById('status').value = status || '';
  document.getElementById('storageDate').value = storageDate || '';

  // Ensure dropdowns are populated
  await Promise.all([loadHarvests(), loadWarehouses()]);

  const harvestSelect = document.getElementById('harvestSelect');
  const warehouseSelect = document.getElementById('warehouseSelect');

  // Try by id
  let okH = harvestId != null && selectValueReliably(harvestSelect, harvestId);
  let okW = warehouseId != null && selectValueReliably(warehouseSelect, warehouseId);

  // Fallback by label if id missing/0/not in list
  if (!okH) selectByLabelFallback(harvestSelect, harvestName);
  if (!okW) selectByLabelFallback(warehouseSelect, warehouseName);

  // Open the modal
  document.getElementById('batchModal').style.display = 'block';
}


// View batch details
function viewBatch(batchId) {
    // This could open a detailed view modal
    alert(`Viewing details for batch ID: ${batchId}`);
}

// --- Batch Modal: Batch Number Suggestions and Validation ---
function generateBatchNumberSuggestion() {
    const today = new Date();
    const yyyymmdd = today.getFullYear().toString() + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0');
    return [1,2,3].map(n => `BATCH-${yyyymmdd}-${String(n).padStart(3,'0')}`);
}


function validateBatchForm() {
    let valid = true;
    // Harvest
    const harvest = document.getElementById('harvestSelect');
    const harvestError = document.getElementById('harvestSelectError');
    if (!harvest.value) { harvestError.textContent = 'Harvest is required.'; valid = false; } else { harvestError.textContent = ''; }
    // Warehouse
    const warehouse = document.getElementById('warehouseSelect');
    const warehouseError = document.getElementById('warehouseSelectError');
    if (!warehouse.value) { warehouseError.textContent = 'Warehouse is required.'; valid = false; } else { warehouseError.textContent = ''; }
    // Batch Number
    const batchNumber = document.getElementById('batchNumber');
    const batchNumberError = document.getElementById('batchNumberError');
    if (!batchNumber.value) {
        batchNumberError.textContent = 'Batch number is required.';
        valid = false;
    } else {
        batchNumberError.textContent = '';
    }
 
    // Quantity
    const quantity = document.getElementById('quantity');
    const quantityError = document.getElementById('quantityError');
    if (!quantity.value || parseFloat(quantity.value) <= 0) {
        quantityError.textContent = 'Quantity must be greater than 0.';
        valid = false;
    } else {
        quantityError.textContent = '';
    }
    // Status
    const status = document.getElementById('status');
    const statusError = document.getElementById('statusError');
    if (!status.value) { statusError.textContent = 'Status is required.'; valid = false; } else { statusError.textContent = ''; }
    // Storage Date
    const storageDate = document.getElementById('storageDate');
    const storageDateError = document.getElementById('storageDateError');
    if (!storageDate.value) { storageDateError.textContent = 'Storage date is required.'; valid = false; } else { storageDateError.textContent = ''; }
    return valid;
}

// Save batch with validation
// Save batch with validation
async function saveBatch() {
    if (!validateBatchForm()) return;

    const harvestId = document.getElementById('harvestSelect').value;
    const warehouseId = document.getElementById('warehouseSelect').value;

    // ⬇️ Add this block here
    let batchNumber = document.getElementById('batchNumber').value.trim();
    // If purely numeric, pad with zeros to make 3 digits and add BATCH prefix
    if (/^\d+$/.test(batchNumber)) {
        batchNumber = 'BATCH' + String(batchNumber).padStart(3, '0');
    }
    // ⬆️ This ensures "2" → "BATCH002"

    const quantity = document.getElementById('quantity').value;
    const status = document.getElementById('status').value;
    const storageDate = document.getElementById('storageDate').value;
    
    const data = {
        action: currentEditingBatch ? 'update_batch' : 'add_batch',
        harvest_id: parseInt(harvestId),
        warehouse_id: parseInt(warehouseId),
        batch_number: batchNumber, // <- now uses formatted value
        quantity: parseFloat(quantity),
        status: status,
        storage_date: storageDate
    };
    
    if (currentEditingBatch) {
        data.harvest_batch_id = currentEditingBatch;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingBatch ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeBatchModal();
            loadHarvestBatches();
            loadStockSummary();
            alert(currentEditingBatch ? 'Batch updated successfully' : 'Batch added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving batch:', error);
        alert('Failed to save batch');
    }
}


// Delete batch
async function deleteBatch(batchId) {
    if (!confirm('Are you sure you want to delete this batch?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_batch',
                harvest_batch_id: batchId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadHarvestBatches();
            loadStockSummary();
            alert('Batch deleted successfully');
        } else {
            alert('Failed to delete batch');
        }
    } catch (error) {
        console.error('Error deleting batch:', error);
        alert('Failed to delete batch');
    }
}

// Search functionality
async function searchBatches() {
    const searchTerm = document.getElementById('batchSearch').value;
    
    if (searchTerm.trim() === '') {
        loadHarvestBatches();
        return;
    }
    
    try {
        const response = await fetch(`api.php?action=search&term=${encodeURIComponent(searchTerm)}`);
        const batches = await response.json();
        displayHarvestBatches(batches);
    } catch (error) {
        console.error('Error searching batches:', error);
        alert('Failed to search batches');
    }
}

// Refresh data
function refreshData() {
    loadHarvestBatches();
    loadStockSummary();
    alert('Data refreshed successfully');
}

// Export data (placeholder)
function exportData() {
    alert('Export functionality would be implemented here');
}

// Load low stock items
async function loadLowStockItems() {
    try {
        const response = await fetch('api.php?action=low_stock');
        const items = await response.json();
        
        if (items.length > 0) {
            let message = 'Low Stock Alert:\n\n';
            items.forEach(item => {
                message += `${item.batch_number} - ${item.harvest_name}: ${item.quantity} kg\n`;
            });
            alert(message);
        } else {
            alert('No low stock items found');
        }
    } catch (error) {
        console.error('Error loading low stock items:', error);
        alert('Failed to load low stock items');
    }
}

// Update batch status quickly
async function updateBatchStatus(batchId, newStatus) {
    try {
        const response = await fetch('api.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_status',
                harvest_batch_id: batchId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadHarvestBatches();
            alert('Status updated successfully');
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
}

// Packaged Product Batch Modal Functions
function openPackagedBatchModal() {
  currentEditingPackagedBatch = null;
  document.getElementById('packagedBatchModalTitle').textContent = 'Add New Packaged Product Batch';
  document.getElementById('packagedBatchForm').reset();
  loadPackagedBatchDropdowns(null);   // only unused HBs
  document.getElementById('packagedBatchModal').style.display = 'block';
}



function closePackagedBatchModal() {
  document.getElementById('packagedBatchModal').style.display = 'none';
  clearPackagedBatchForm();
  currentEditingPackagedBatch = null; // reset edit state
}


function clearPackagedBatchForm() {
    document.getElementById('packagedBatchForm').reset();
    clearPackagedBatchErrors();
}

function clearPackagedBatchErrors() {
    const errorElements = document.querySelectorAll('#packagedBatchForm .error-message');
    errorElements.forEach(element => element.textContent = '');
}

async function loadPackagedBatchDropdowns(includeHarvestBatchId = null) {
  try {
    // Factories
    const factoriesResponse = await fetch('api.php?action=factories');
    const factories = await factoriesResponse.json();
    const factorySelect = document.getElementById('packagedFactorySelect');
    factorySelect.innerHTML = '<option value="">Select Factory</option>';
    factories.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.factory_id;
      opt.textContent = f.factory_name;
      factorySelect.appendChild(opt);
    });

    // Warehouses
    const warehousesResponse = await fetch('api.php?action=warehouses');
    const warehouses = await warehousesResponse.json();
    const warehouseSelect = document.getElementById('packagedWarehouseSelect');
    warehouseSelect.innerHTML = '<option value="">Select Warehouse</option>';
    warehouses.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.warehouse_id;
      opt.textContent = w.warehouse_name;
      warehouseSelect.appendChild(opt);
    });

    // Harvest Batches: only ones NOT used (plus current one if editing)
    const hbUrl = includeHarvestBatchId
      ? `api.php?action=available_harvest_batches&include_id=${includeHarvestBatchId}`
      : 'api.php?action=available_harvest_batches';

    const hbRes = await fetch(hbUrl);
    ppbHarvestBatchesCache = await hbRes.json(); // keep for auto-fill

    const hbSelect = document.getElementById('packagedHarvestBatchSelect');
    hbSelect.innerHTML = '<option value="">Select Harvest Batch</option>';
    ppbHarvestBatchesCache.forEach(hb => {
      const opt = document.createElement('option');
      opt.value = hb.harvest_batch_id;
      opt.textContent = `${hb.batch_number} — ${hb.harvest_name || ''}`;
      hbSelect.appendChild(opt);
    });

    // Auto-fill production quantity + default warehouse when a HB is chosen
    hbSelect.onchange = () => {
      const chosen = ppbHarvestBatchesCache.find(
        x => String(x.harvest_batch_id) === String(hbSelect.value)
      );
      if (chosen) {
        // quantity auto-fill
        document.getElementById('packagedProductionQuantity').value = chosen.quantity ?? '';
        // optionally default the packaged warehouse to the harvest batch’s warehouse
        if (chosen.warehouse_id) {
          document.getElementById('packagedWarehouseSelect').value = String(chosen.warehouse_id);
        }
      }
    };
  } catch (err) {
    console.error('Error loading dropdowns:', err);
    alert('Failed to load dropdown options');
  }
}




async function savePackagedBatch() {
  const formData = {
    batch_name: document.getElementById('packagedBatchName').value.trim(),
    factory_id: document.getElementById('packagedFactorySelect').value,
    production_date: document.getElementById('packagedProductionDate').value,
    production_quantity: document.getElementById('packagedProductionQuantity').value,
    warehouse_id: document.getElementById('packagedWarehouseSelect').value,
    harvest_batch_id: document.getElementById('packagedHarvestBatchSelect').value  // ✅
  };

  if (!formData.harvest_batch_id || !formData.batch_name || !formData.factory_id ||
      !formData.production_date || !formData.production_quantity || !formData.warehouse_id) {
    alert('Please fill in all required fields');
    return;
  }

  const isEdit = !!currentEditingPackagedBatch;
  const payload = { action: isEdit ? 'update_packaged_batch' : 'add_packaged_batch', ...formData };
  if (isEdit) payload.packaged_product_batch_id = currentEditingPackagedBatch;

  try {
    const response = await fetch('api.php', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.success) {
      closePackagedBatchModal();
      loadPackagedProductBatches();
      alert(isEdit ? 'Packaged product batch updated' : 'Packaged product batch created successfully');
    } else {
      alert(result.error || 'Failed to save packaged product batch');
    }
  } catch (error) {
    console.error('Error saving packaged product batch:', error);
    alert('Failed to save packaged product batch');
  }
}



