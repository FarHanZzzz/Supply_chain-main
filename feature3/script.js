// Feature 3: Transportation Planning JavaScript

let currentEditingShipment = null;
let currentEditingTransport = null;
let currentTab = 'shipments';

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadShipments();
    loadTransports();
    loadTransportationStats();
    loadDrivers();
    loadHarvestBatches();
    loadPackagedBatches();
});

// Tab switching
function showTab(tabName) {
    currentTab = tabName;
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to selected tab button
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// Load shipments data
async function loadShipments() {
    try {
        const response = await fetch('api.php?action=shipments');
        const shipments = await response.json();
        displayShipments(shipments);
    } catch (error) {
        console.error('Error loading shipments:', error);
        alert('Failed to load shipments data');
    }
}

// Load transports data
async function loadTransports() {
    try {
        const response = await fetch('api.php?action=transports');
        const transports = await response.json();
        displayTransports(transports);
    } catch (error) {
        console.error('Error loading transports:', error);
        alert('Failed to load transports data');
    }
}

// Load transportation statistics
async function loadTransportationStats() {
    try {
        const response = await fetch('api.php?action=stats');
        const stats = await response.json();
        displayTransportationStats(stats);
    } catch (error) {
        console.error('Error loading transportation stats:', error);
    }
}

// Load drivers for dropdown
async function loadDrivers() {
  try {
    // Get all drivers
    const driversRes = await fetch('api.php?action=drivers');
    const drivers = await driversRes.json();

    // Get all transports and find used drivers
    const transportsRes = await fetch('api.php?action=transports');
    const transports = await transportsRes.json();
    const usedIds = new Set(transports.map(t => String(t.driver_id)));

    // Populate the dropdown, skipping used drivers
    const dropdown = document.getElementById('transportDriverSelect');
    dropdown.innerHTML = '<option value="">Select Driver</option>';

    drivers.forEach(driver => {
      if (!usedIds.has(String(driver.driver_id))) {
        const opt = document.createElement('option');
        opt.value = driver.driver_id;
        opt.textContent = `${driver.driver_name} (${driver.phone_number})`;
        dropdown.appendChild(opt);
      }
    });
  } catch (err) {
    console.error('Error loading available drivers:', err);
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

// Display shipments in table
function displayShipments(shipments) {
    const tableBody = document.getElementById('shipmentsTableBody');
    tableBody.innerHTML = '';
    
    shipments.forEach(shipment => {
        const row = tableBody.insertRow();
        const statusClass = getStatusClass(shipment.status);
        const productInfo = shipment.harvest_name || shipment.product_name || 'N/A';
        
        row.innerHTML = `
            <td>SH-${shipment.shipment_id.toString().padStart(6, '0')}</td>
            <td>${shipment.shipment_date}</td>
            <td>${shipment.shipment_destination}</td>
            <td><span class="status-badge ${statusClass}">${shipment.status}</span></td>
            <td>${shipment.vehicle_type}</td>
            <td>${shipment.driver_name}</td>
            <td>${productInfo}</td>
            <td>
                <button class="btn-view" onclick="viewShipment(${shipment.shipment_id})">View</button>
                <button class="btn-edit" onclick="editShipment(${shipment.shipment_id}, ${shipment.transport_id}, '${shipment.shipment_date}', '${shipment.shipment_destination}', '${shipment.status}')">Edit</button>
                <button class="btn-delete" onclick="deleteShipment(${shipment.shipment_id})">Delete</button>
            </td>
        `;
    });
}

// Display transports in table
function displayTransports(transports) {
    const tableBody = document.getElementById('transportsTableBody');
    tableBody.innerHTML = '';
    
    transports.forEach(transport => {
        const row = tableBody.insertRow();
        const utilizationPercent = ((transport.current_capacity / transport.vehicle_capacity) * 100).toFixed(1);
        
        row.innerHTML = `
            <td>TRK-${transport.transport_id.toString().padStart(3, '0')}</td>
            <td>${transport.vehicle_type}</td>
            <td>${transport.vehicle_capacity} kg</td>
            <td>${transport.current_capacity} kg (${utilizationPercent}%)</td>
            <td>${transport.driver_name}</td>
            <td>${transport.driver_phone}</td>
            <td>
                <button class="btn-edit" onclick="editTransport(${transport.transport_id}, ${transport.driver_id}, '${transport.vehicle_type}', ${transport.vehicle_capacity}, ${transport.current_capacity})">Edit</button>
                <button class="btn-delete" onclick="deleteTransport(${transport.transport_id})">Delete</button>
            </td>
        `;
    });
}

// Display transportation statistics
function displayTransportationStats(stats) {
    document.getElementById('totalShipments').textContent = stats.total_shipments || '0';
    document.getElementById('activeTransports').textContent = stats.active_transports || '0';
    document.getElementById('availableDrivers').textContent = stats.available_drivers || '0';
    document.getElementById('pendingShipments').textContent = stats.pending_shipments || '0';
}

// Get status class for styling
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'planned':
            return 'status-planned';
        case 'in transit':
            return 'status-transit';
        case 'delivered':
            return 'status-delivered';
        case 'pending':
            return 'status-pending';
        default:
            return 'status-default';
    }
}

// Populate driver dropdown
function populateDriverDropdown(drivers) {
    const dropdown = document.getElementById('transportDriverSelect');  
    dropdown.innerHTML = '<option value="">Select Driver</option>';
    
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.driver_id;
        option.textContent = `${driver.driver_name} (${driver.phone_number})`;
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
        option.textContent = `${batch.batch_number} - ${batch.harvest_name}`;
        dropdown.appendChild(option);
    });
}

// Populate packaged batch dropdown
function populatePackagedBatchDropdown(batches) {
    const dropdown = document.getElementById('packagedBatchSelect');
    dropdown.innerHTML = '<option value="">Select Packaged Batch (Optional)</option>';
    
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch.packaged_product_batch_id;
        option.textContent = `${batch.product_name} (${batch.production_quantity})`;
        dropdown.appendChild(option);
    });
}

// Modal functions
function openShipmentModal() {
    currentEditingShipment = null;
    document.getElementById('shipmentModalTitle').textContent = 'Plan New Shipment';
    document.getElementById('shipmentForm').reset();
    loadAvailableTransports();
    document.getElementById('shipmentModal').style.display = 'block';
}

function openTransportModal() {
    currentEditingTransport = null;
    document.getElementById('transportModalTitle').textContent = 'Add New Transport';
    document.getElementById('transportForm').reset();
    loadDrivers();
    document.getElementById('transportModal').style.display = 'block';
}

function closeShipmentModal() {
    document.getElementById('shipmentModal').style.display = 'none';
}

function closeTransportModal() {
    document.getElementById('transportModal').style.display = 'none';
}

// Load available transports for shipment planning
async function loadAvailableTransports() {
    try {
        const response = await fetch('api.php?action=available_transports');
        const transports = await response.json();
        populateTransportDropdown(transports);
    } catch (error) {
        console.error('Error loading available transports:', error);
    }
}

// Populate transport dropdown
function populateTransportDropdown(transports) {
    const dropdown = document.getElementById('transportSelect');
    dropdown.innerHTML = '<option value="">Select Transport</option>';
    
    transports.forEach(transport => {
        const option = document.createElement('option');
        option.value = transport.transport_id;
        option.textContent = `${transport.vehicle_type} - ${transport.driver_name} (${transport.vehicle_capacity} kg)`;
        dropdown.appendChild(option);
    });
}

// Edit functions
function editShipment(shipmentId, transportId, shipmentDate, destination, status) {
    currentEditingShipment = shipmentId;
    document.getElementById('shipmentModalTitle').textContent = 'Edit Shipment';
    document.getElementById('transportSelect').value = transportId;
    document.getElementById('shipmentDate').value = shipmentDate;
    document.getElementById('shipmentDestination').value = destination;
    document.getElementById('shipmentStatus').value = status;
    loadAvailableTransports();
    document.getElementById('shipmentModal').style.display = 'block';
}

function editTransport(transportId, driverId, vehicleType, vehicleCapacity, currentCapacity) {
    currentEditingTransport = transportId;
    document.getElementById('transportModalTitle').textContent = 'Edit Transport';
    document.getElementById('transportDriverSelect').value = driverId;
    document.getElementById('vehicleType').value = vehicleType;
    document.getElementById('vehicleCapacity').value = vehicleCapacity;
    document.getElementById('currentCapacity').value = currentCapacity;
    document.getElementById('transportModal').style.display = 'block';
}

// View shipment details
function viewShipment(shipmentId) {
    alert(`Viewing details for shipment ID: ${shipmentId}`);
}

// Save functions
async function saveShipment() {
    const transportId = document.getElementById('transportSelect').value;
    const harvestBatchId = document.getElementById('harvestBatchSelect').value || null;
    const packagedBatchId = document.getElementById('packagedBatchSelect').value || null;
    const shipmentDate = document.getElementById('shipmentDate').value;
    const destination = document.getElementById('shipmentDestination').value;
    const status = document.getElementById('shipmentStatus').value;
    
    if (!transportId || !shipmentDate || !destination || !status) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingShipment ? 'update_shipment' : 'add_shipment',
        transport_id: parseInt(transportId),
        harvest_batch_id: harvestBatchId ? parseInt(harvestBatchId) : null,
        packaged_product_batch_id: packagedBatchId ? parseInt(packagedBatchId) : null,
        shipment_date: shipmentDate,
        shipment_destination: destination,
        status: status
    };
    
    if (currentEditingShipment) {
        data.shipment_id = currentEditingShipment;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingShipment ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeShipmentModal();
            loadShipments();
            loadTransportationStats();
            alert(currentEditingShipment ? 'Shipment updated successfully' : 'Shipment planned successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving shipment:', error);
        alert('Failed to save shipment');
    }
}

async function saveTransport() {
    const driverId = document.getElementById('transportDriverSelect').value;
    const vehicleType = document.getElementById('vehicleType').value;
    const vehicleCapacity = document.getElementById('vehicleCapacity').value;
    const currentCapacity = document.getElementById('currentCapacity').value;
    
    if (!driverId || !vehicleType || !vehicleCapacity) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingTransport ? 'update_transport' : 'add_transport',
        driver_id: parseInt(driverId),
        vehicle_type: vehicleType,
        vehicle_capacity: parseFloat(vehicleCapacity),
        current_capacity: parseFloat(currentCapacity) || 0
    };
    
    if (currentEditingTransport) {
        data.transport_id = currentEditingTransport;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingTransport ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeTransportModal();
            loadTransports();
            loadTransportationStats();
            alert(currentEditingTransport ? 'Transport updated successfully' : 'Transport added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving transport:', error);
        alert('Failed to save transport');
    }
}

// Delete functions
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
            loadTransportationStats();
            alert('Shipment deleted successfully');
        } else {
            alert('Failed to delete shipment');
        }
    } catch (error) {
        console.error('Error deleting shipment:', error);
        alert('Failed to delete shipment');
    }
}

async function deleteTransport(transportId) {
    if (!confirm('Are you sure you want to delete this transport?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_transport',
                transport_id: transportId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadTransports();
            loadTransportationStats();
            alert('Transport deleted successfully');
        } else {
            alert('Failed to delete transport');
        }
    } catch (error) {
        console.error('Error deleting transport:', error);
        alert('Failed to delete transport');
    }
}

// Search functionality
async function searchShipments() {
    const searchTerm = document.getElementById('shipmentSearch').value;
    
    if (searchTerm.trim() === '') {
        loadShipments();
        return;
    }
    
    try {
        const response = await fetch(`api.php?action=search&term=${encodeURIComponent(searchTerm)}`);
        const shipments = await response.json();
        displayShipments(shipments);
    } catch (error) {
        console.error('Error searching shipments:', error);
        alert('Failed to search shipments');
    }
}

// Refresh data
function refreshData() {
    if (currentTab === 'shipments') {
        loadShipments();
    } else {
        loadTransports();
    }
    loadTransportationStats();
    alert('Data refreshed successfully');
}

