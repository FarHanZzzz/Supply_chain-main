// Feature 2: Stock Monitoring JavaScript

let currentEditingBatch = null;

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadHarvestBatches();
    loadStockSummary();
    loadHarvests();
    loadWarehouses();
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

// Save batch
async function saveBatch() {
    const harvestId = document.getElementById('harvestSelect').value;
    const warehouseId = document.getElementById('warehouseSelect').value;
    const batchNumber = document.getElementById('batchNumber').value;
    const quantity = document.getElementById('quantity').value;
    const status = document.getElementById('status').value;
    const storageDate = document.getElementById('storageDate').value;
    
    if (!harvestId || !warehouseId || !batchNumber || !quantity || !status || !storageDate) {
        alert('Please fill in all required fields');
        return;
    }
    
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

