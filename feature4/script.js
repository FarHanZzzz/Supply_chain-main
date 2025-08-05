// Feature 4: Shipment Management JavaScript

let currentEditingItem = null;
let allShipments = [];

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadShipments();
    loadTransports();
    loadHarvestBatches();
    loadPackagedBatches();
    loadStats();
});

// Load shipments data
async function loadShipments() {
    try {
        const response = await fetch('api.php?action=shipments');
        const shipments = await response.json();
        allShipments = shipments;
        displayShipments(shipments);
    } catch (error) {
        console.error('Error loading shipments:', error);
        alert('Failed to load shipments data');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('api.php?action=stats');
        const stats = await response.json();
        displayStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load transports for dropdown
async function loadTransports() {
    try {
        const response = await fetch('api.php?action=transports');
        const transports = await response.json();
        populateTransportDropdown(transports);
    } catch (error) {
        console.error('Error loading transports:', error);
    }
}

// Load harvest batches for dropdown
async function loadHarvestBatches() {
    try {
        const response = await fetch('api.php?action=harvest_batches');
        const batches = await response.json();
        populateHarvestBatchDropdown(batches);
    } catch (error) {
        console.error('Error loading harvest batches:', error);
    }
}

// Load packaged batches for dropdown
async function loadPackagedBatches() {
    try {
        const response = await fetch('api.php?action=packaged_batches');
        const batches = await response.json();
        populatePackagedBatchDropdown(batches);
    } catch (error) {
        console.error('Error loading packaged batches:', error);
    }
}

// Display statistics
function displayStats(stats) {
    document.getElementById('totalShipments').textContent = stats.total_shipments || 0;
    document.getElementById('pendingShipments').textContent = stats.pending_shipments || 0;
    document.getElementById('inTransitShipments').textContent = stats.in_transit_shipments || 0;
    document.getElementById('deliveredShipments').textContent = stats.delivered_shipments || 0;
}

// Display shipments in table
function displayShipments(shipments) {
    const tableBody = document.getElementById('shipmentsTableBody');
    tableBody.innerHTML = '';
    
    shipments.forEach(shipment => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${shipment.shipment_id}</td>
            <td>${shipment.vehicle_type || 'N/A'} (${shipment.vehicle_capacity || 'N/A'})</td>
            <td>${shipment.harvest_batch_number || 'N/A'}</td>
            <td>${shipment.production_quantity || 'N/A'}</td>
            <td>${shipment.shipment_date || ''}</td>
            <td>${shipment.shipment_destination || ''}</td>
            <td><span class="status-badge status-${shipment.status.toLowerCase().replace(' ', '-')}">${shipment.status}</span></td>
            <td>
                <button class="btn-edit" onclick="editShipment(${shipment.shipment_id})">Edit</button>
                <button class="btn-delete" onclick="deleteShipment(${shipment.shipment_id})">Delete</button>
            </td>
        `;
    });
}

// Populate transport dropdown
function populateTransportDropdown(transports) {
    const dropdown = document.getElementById('transportSelect');
    dropdown.innerHTML = '<option value="">Select Transport</option>';
    
    transports.forEach(transport => {
        const option = document.createElement('option');
        option.value = transport.transport_id;
        option.textContent = `${transport.vehicle_type} (${transport.vehicle_capacity})`;
        dropdown.appendChild(option);
    });
}

// Populate harvest batch dropdown
function populateHarvestBatchDropdown(batches) {
    const dropdown = document.getElementById('harvestBatchSelect');
    dropdown.innerHTML = '<option value="">Select Harvest Batch (Optional)</option>';
    
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch.harvest_batch_id;
        option.textContent = `Batch ${batch.batch_number}`;
        dropdown.appendChild(option);
    });
}

// Populate packaged batch dropdown
function populatePackagedBatchDropdown(batches) {
    const dropdown = document.getElementById('packagedBatchSelect');
    dropdown.innerHTML = '<option value="">Select Product Batch (Optional)</option>';
    
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch.packaged_product_batch_id;
        option.textContent = `Batch ${batch.packaged_product_batch_id} (${batch.production_quantity})`;
        dropdown.appendChild(option);
    });
}

// Modal functions
function openShipmentModal() {
    currentEditingItem = null;
    document.getElementById('shipmentModalTitle').textContent = 'Add New Shipment';
    document.getElementById('shipmentForm').reset();
    document.getElementById('shipmentModal').style.display = 'block';
}

function closeShipmentModal() {
    document.getElementById('shipmentModal').style.display = 'none';
}

// Edit function
function editShipment(shipmentId) {
    const shipment = allShipments.find(s => s.shipment_id == shipmentId);
    if (!shipment) return;
    
    currentEditingItem = shipmentId;
    document.getElementById('shipmentModalTitle').textContent = 'Edit Shipment';
    document.getElementById('transportSelect').value = shipment.transport_id || '';
    document.getElementById('harvestBatchSelect').value = shipment.harvest_batch_id || '';
    document.getElementById('packagedBatchSelect').value = shipment.packaged_product_batch_id || '';
    document.getElementById('shipmentDate').value = shipment.shipment_date || '';
    document.getElementById('shipmentDestination').value = shipment.shipment_destination || '';
    document.getElementById('shipmentStatus').value = shipment.status || '';
    document.getElementById('shipmentModal').style.display = 'block';
}

// Save function
async function saveShipment() {
    const transportId = document.getElementById('transportSelect').value;
    const harvestBatchId = document.getElementById('harvestBatchSelect').value || null;
    const packagedBatchId = document.getElementById('packagedBatchSelect').value || null;
    const shipmentDate = document.getElementById('shipmentDate').value;
    const shipmentDestination = document.getElementById('shipmentDestination').value;
    const shipmentStatus = document.getElementById('shipmentStatus').value;
    
    if (!transportId || !shipmentDate || !shipmentDestination || !shipmentStatus) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_shipment' : 'add_shipment',
        transport_id: parseInt(transportId),
        harvest_batch_id: harvestBatchId ? parseInt(harvestBatchId) : null,
        packaged_product_batch_id: packagedBatchId ? parseInt(packagedBatchId) : null,
        shipment_date: shipmentDate,
        shipment_destination: shipmentDestination,
        status: shipmentStatus
    };
    
    if (currentEditingItem) {
        data.shipment_id = currentEditingItem;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingItem ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeShipmentModal();
            loadShipments();
            loadStats();
            alert(currentEditingItem ? 'Shipment updated successfully' : 'Shipment added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving shipment:', error);
        alert('Failed to save shipment');
    }
}

// Delete function
async function deleteShipment(shipmentId) {
    if (!confirm('Are you sure you want to delete this shipment?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_shipment',
                shipment_id: shipmentId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadShipments();
            loadStats();
            alert('Shipment deleted successfully');
        } else {
            alert('Failed to delete shipment');
        }
    } catch (error) {
        console.error('Error deleting shipment:', error);
        alert('Failed to delete shipment');
    }
}

// Search functionality
function searchShipments() {
    const searchTerm = document.getElementById('shipmentSearch').value.toLowerCase();
    const filteredShipments = allShipments.filter(shipment => 
        shipment.shipment_destination.toLowerCase().includes(searchTerm) ||
        shipment.status.toLowerCase().includes(searchTerm) ||
        (shipment.vehicle_type && shipment.vehicle_type.toLowerCase().includes(searchTerm)) ||
        (shipment.harvest_batch_number && shipment.harvest_batch_number.toLowerCase().includes(searchTerm))
    );
    displayShipments(filteredShipments);
}

// Filter by status
async function filterByStatus(status) {
    if (status === 'all') {
        displayShipments(allShipments);
    } else {
        try {
            const response = await fetch(`api.php?action=by_status&status=${encodeURIComponent(status)}`);
            const shipments = await response.json();
            displayShipments(shipments);
        } catch (error) {
            console.error('Error filtering shipments:', error);
            alert('Failed to filter shipments');
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('shipmentModal');
    if (event.target == modal) {
        closeShipmentModal();
    }
}

