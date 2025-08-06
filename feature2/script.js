// Feature 2: Stock Monitoring JavaScript

let currentEditingBatch = null;

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadHarvestBatches();
    loadStockSummary();
    loadHarvests();
    loadWarehouses();
    loadWarehouseStock(); // Load warehouse stock on page load
});




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
                <button class="btn-edit" onclick="editBatch(${batch.harvest_batch_id}, '${batch.batch_number}', ${batch.harvest_id || 0}, ${batch.warehouse_id || 0}, ${batch.quantity}, '${batch.status}', '${batch.storage_date}')">Edit</button>
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
    document.getElementById('batchModal').style.display = 'block';
}

function closeBatchModal() {
    document.getElementById('batchModal').style.display = 'none';
}

// Edit batch
function editBatch(batchId, batchNumber, harvestId, warehouseId, quantity, status, storageDate) {
    currentEditingBatch = batchId;
    document.getElementById('batchModalTitle').textContent = 'Edit Batch';
    document.getElementById('batchNumber').value = batchNumber;
    document.getElementById('harvestSelect').value = harvestId;
    document.getElementById('warehouseSelect').value = warehouseId;
    document.getElementById('quantity').value = quantity;
    document.getElementById('status').value = status;
    document.getElementById('storageDate').value = storageDate;
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

document.addEventListener('DOMContentLoaded', function() {
    // Populate batch number suggestions
    const datalist = document.getElementById('batchNumberSuggestions');
    if (datalist) {
        generateBatchNumberSuggestion().forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            datalist.appendChild(opt);
        });
    }
});

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
    const batchPattern = /^BATCH-\d{8}-\d{3}$/;
    if (!batchNumber.value) {
        batchNumberError.textContent = 'Batch number is required.';
        valid = false;
    } else if (!batchPattern.test(batchNumber.value)) {
        batchNumberError.textContent = 'Format must be BATCH-YYYYMMDD-XXX.';
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
async function saveBatch() {
    if (!validateBatchForm()) return;
    const harvestId = document.getElementById('harvestSelect').value;
    const warehouseId = document.getElementById('warehouseSelect').value;
    const batchNumber = document.getElementById('batchNumber').value;
    const quantity = document.getElementById('quantity').value;
    const status = document.getElementById('status').value;
    const storageDate = document.getElementById('storageDate').value;
    
    const data = {
        action: currentEditingBatch ? 'update_batch' : 'add_batch',
        harvest_id: parseInt(harvestId),
        warehouse_id: parseInt(warehouseId),
        batch_number: batchNumber,
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
            headers: {
                'Content-Type': 'application/json'
            },
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

