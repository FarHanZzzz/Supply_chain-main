// Global variables
let deliveries = [];
let transports = [];
let kpis = {};
let drivers = [];
let vehicleTypes = [];
let vehicleCapacities = [];
let charts = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Feature 7 page loaded');
    
    // Test API connection first
    testAPI();
    
    loadAll();
});

// Test API connection
function testAPI() {
    console.log('Testing API connection...');
    fetch('api.php?action=test')
        .then(res => res.json())
        .then(data => {
            console.log('API test successful:', data);
        })
        .catch(error => {
            console.error('API test failed:', error);
        });
}

// Load all data
function loadAll() {
    fetchKPIs();
    fetchDeliveries();
    fetchTransports();
    fetchDrivers();
    fetchVehicleTypes();
    fetchVehicleCapacities();
    
    // Load chart data after a short delay to ensure data is available
    setTimeout(() => {
        updateSpoilageChart();
        updateReliabilityChart();
    }, 500);
}

// ===== KPI FUNCTIONS =====

function fetchKPIs() {
    console.log('Fetching KPIs...');
    fetch('api.php?action=kpis')
        .then(res => {
            console.log('KPIs response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('KPIs data received:', data);
            kpis = data;
            updateKPIStats();
        })
        .catch(error => {
            console.error('Error fetching KPIs:', error);
            console.error('Error details:', error.message);
        });
}

function updateKPIStats() {
    document.getElementById('totalDeliveries').textContent = kpis.total_deliveries || 0;
    document.getElementById('onTimeDeliveries').textContent = kpis.on_time_deliveries || 0;
    document.getElementById('carrierReliability').textContent = (kpis.carrier_reliability || 0) + '%';
    document.getElementById('totalSpoilage').textContent = kpis.total_spoilage || 0;
    
    // Hide loading, show stats
    document.getElementById('loadingStats').style.display = 'none';
    document.getElementById('statsGrid').style.display = 'grid';
}

// ===== DELIVERY FUNCTIONS =====

function fetchDeliveries() {
    console.log('Fetching deliveries...');
    fetch('api.php?action=deliveries')
        .then(res => {
            console.log('Deliveries response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('Deliveries data received:', data);
            deliveries = data;
            renderDeliveriesTable();
            updateDeliveryCharts();
        })
        .catch(error => {
            console.error('Error fetching deliveries:', error);
            console.error('Error details:', error.message);
        });
}

function renderDeliveriesTable() {
    const tbody = document.getElementById('deliveriesTableBody');
    tbody.innerHTML = '';
    
    deliveries.forEach(delivery => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${delivery.delivery_id}</td>
            <td>${delivery.expected_time || ''}</td>
            <td>${delivery.delivered_time || ''}</td>
            <td>${delivery.spoilage_quantity || 0}</td>
            <td><span class="status-badge status-${delivery.delivery_status?.replace(' ', '-')}">${delivery.delivery_status || ''}</span></td>
            <td><span class="status-badge status-${delivery.delivery_success}">${delivery.delivery_success || ''}</span></td>
            <td>
                <button class="btn btn-edit" onclick="editDelivery(${delivery.delivery_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteDelivery(${delivery.delivery_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Hide loading, show table
    document.getElementById('loadingDeliveries').style.display = 'none';
    document.getElementById('deliveriesTable').style.display = 'table';
}

function openDeliveryModal(id = null) {
    const modal = document.getElementById('deliveryModal');
    const title = document.getElementById('deliveryModalTitle');
    const form = document.getElementById('deliveryForm');
    
    if (id) {
        // Edit mode
        title.textContent = 'Edit Delivery';
        const delivery = deliveries.find(d => d.delivery_id == id);
        if (delivery) {
            populateDeliveryForm(delivery);
        }
    } else {
        // Add mode
        title.textContent = 'Add New Delivery';
        form.reset();
    }
    
    modal.style.display = 'block';
}

function closeDeliveryModal() {
    document.getElementById('deliveryModal').style.display = 'none';
}

function populateDeliveryForm(delivery) {
    document.getElementById('vehicleLicenseNo').value = delivery.vehicle_license_no || '';
    document.getElementById('deliveryDate').value = delivery.delivery_date || '';
    document.getElementById('expectedTime').value = delivery.expected_time || '';
    document.getElementById('deliveredTime').value = delivery.delivered_time || '';
    document.getElementById('deliveryManName').value = delivery.delivery_man_name || '';
    document.getElementById('spoilageQuantity').value = delivery.spoilage_quantity || 0;
    document.getElementById('deliveryStatus').value = delivery.delivery_status || '';
    document.getElementById('deliverySuccess').value = delivery.delivery_success || '';
}

function editDelivery(id) {
    openDeliveryModal(id);
}

function saveDelivery() {
    const formData = {
        action: document.getElementById('deliveryModalTitle').textContent.includes('Edit') ? 'update_delivery' : 'add_delivery',
        vehicle_license_no: document.getElementById('vehicleLicenseNo').value,
        delivery_date: document.getElementById('deliveryDate').value,
        delivery_time: document.getElementById('deliveredTime').value,
        delivery_man_name: document.getElementById('deliveryManName').value,
        expected_time: document.getElementById('expectedTime').value,
        delivered_time: document.getElementById('deliveredTime').value,
        spoilage_quantity: parseInt(document.getElementById('spoilageQuantity').value) || 0,
        delivery_status: document.getElementById('deliveryStatus').value,
        delivery_success: document.getElementById('deliverySuccess').value
    };
    
    // If editing, add the ID
    if (formData.action === 'update_delivery') {
        const deliveryId = deliveries.find(d => 
            d.vehicle_license_no === formData.vehicle_license_no &&
            d.delivery_date === formData.delivery_date &&
            d.delivery_man_name === formData.delivery_man_name
        )?.delivery_id;
        if (deliveryId) {
            formData.delivery_id = deliveryId;
        }
    }
    
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeDeliveryModal();
            loadAll();
        } else {
            alert('Error saving delivery: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving delivery');
    });
}

function deleteDelivery(id) {
    if (!confirm('Are you sure you want to delete this delivery?')) return;
    
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_delivery', delivery_id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadAll();
        } else {
            alert('Error deleting delivery: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting delivery');
    });
}

// ===== TRANSPORT FUNCTIONS =====

function fetchTransports() {
    console.log('Fetching transports...');
    fetch('api.php?action=transports')
        .then(res => {
            console.log('Transports response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('Transports data received:', data);
            transports = data;
            renderTransportsTable();
            updateVehicleCharts();
        })
        .catch(error => {
            console.error('Error fetching transports:', error);
            console.error('Error details:', error.message);
        });
}

function renderTransportsTable() {
    const tbody = document.getElementById('transportsTableBody');
    tbody.innerHTML = '';
    
    transports.forEach(transport => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${transport.transport_id}</td>
            <td>${transport.vehicle_license_no || ''}</td>
            <td>${transport.vehicle_type || ''}</td>
            <td>${transport.vehicle_capacity || 0}</td>
            <td><span class="status-badge status-${transport.vehicle_status?.replace(' ', '-')}">${transport.vehicle_status || ''}</span></td>
            <td>${transport.carrier_reliability || 0}%</td>
            <td>
                <button class="btn btn-edit" onclick="editTransport(${transport.transport_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteTransport(${transport.transport_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Hide loading, show table
    document.getElementById('loadingTransports').style.display = 'none';
    document.getElementById('transportsTable').style.display = 'table';
}

function openTransportModal(id = null) {
    const modal = document.getElementById('transportModal');
    const title = document.getElementById('transportModalTitle');
    const form = document.getElementById('transportForm');
    
    if (id) {
        // Edit mode
        title.textContent = 'Edit Transport';
        const transport = transports.find(t => t.transport_id == id);
        if (transport) {
            populateTransportForm(transport);
        }
    } else {
        // Add mode
        title.textContent = 'Add New Transport';
        form.reset();
        populateAllDropdowns();
    }
    
    modal.style.display = 'block';
}

function closeTransportModal() {
    document.getElementById('transportModal').style.display = 'none';
}

function populateTransportForm(transport) {
    document.getElementById('driverId').value = transport.driver_id || '';
    document.getElementById('vehicleType').value = transport.vehicle_type || '';
    document.getElementById('vehicleLicenseNo').value = transport.vehicle_license_no || '';
    document.getElementById('vehicleCapacity').value = transport.vehicle_capacity || '';
    document.getElementById('vehicleStatus').value = transport.vehicle_status || '';
    populateAllDropdowns();
}

function editTransport(id) {
    openTransportModal(id);
}

function saveTransport() {
    const formData = {
        action: document.getElementById('transportModalTitle').textContent.includes('Edit') ? 'update_transport' : 'add_transport',
        driver_id: parseInt(document.getElementById('driverId').value),
        vehicle_type: document.getElementById('vehicleType').value,
        vehicle_license_no: document.getElementById('vehicleLicenseNo').value,
        vehicle_capacity: parseFloat(document.getElementById('vehicleCapacity').value),
        vehicle_status: document.getElementById('vehicleStatus').value
    };
    
    // If editing, add the ID
    if (formData.action === 'update_transport') {
        const transportId = transports.find(t => 
            t.vehicle_license_no === formData.vehicle_license_no
        )?.transport_id;
        if (transportId) {
            formData.transport_id = transportId;
        }
    }
    
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeTransportModal();
        loadAll();
        } else {
            alert('Error saving transport: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving transport');
    });
}

function deleteTransport(id) {
    if (!confirm('Are you sure you want to delete this transport?')) return;
    
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_transport', transport_id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadAll();
        } else {
            alert('Error deleting transport: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting transport');
    });
}

// ===== DRIVER FUNCTIONS =====

function fetchDrivers() {
    console.log('Fetching drivers...');
    fetch('api.php?action=drivers_dropdown')
        .then(res => {
            console.log('Drivers response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('Drivers data received:', data);
            drivers = data;
        })
        .catch(error => {
            console.error('Error fetching drivers:', error);
            console.error('Error details:', error.message);
        });
}

function fetchVehicleTypes() {
    console.log('Fetching vehicle types...');
    fetch('api.php?action=vehicle_types_dropdown')
        .then(res => {
            console.log('Vehicle types response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('Vehicle types data received:', data);
            vehicleTypes = data;
        })
        .catch(error => {
            console.error('Error fetching vehicle types:', error);
            console.error('Error details:', error.message);
        });
}

function fetchVehicleCapacities() {
    console.log('Fetching vehicle capacities...');
    fetch('api.php?action=vehicle_capacities_dropdown')
        .then(res => {
            console.log('Vehicle capacities response status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('Vehicle capacities data received:', data);
            vehicleCapacities = data;
        })
        .catch(error => {
            console.error('Error fetching vehicle capacities:', error);
            console.error('Error details:', error.message);
        });
}

function populateDriversDropdown() {
    const select = document.getElementById('driverId');
    select.innerHTML = '<option value="">Select Driver</option>';
    
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = driver.label;
        select.appendChild(option);
    });
}

function populateVehicleTypeDropdown() {
    const select = document.getElementById('vehicleType');
    select.innerHTML = '<option value="">Select Vehicle Type</option>';
    
    vehicleTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function populateVehicleCapacityDropdown() {
    const select = document.getElementById('vehicleCapacity');
    select.innerHTML = '<option value="">Select Vehicle Capacity</option>';
    
    vehicleCapacities.forEach(capacity => {
        const option = document.createElement('option');
        option.value = capacity;
        option.textContent = capacity;
        select.appendChild(option);
    });
}

function populateAllDropdowns() {
    populateDriversDropdown();
    populateVehicleTypeDropdown();
    populateVehicleCapacityDropdown();
}

// ===== CHART FUNCTIONS =====

function updateDeliveryCharts() {
    fetch('api.php?action=delivery_chart')
        .then(res => res.json())
        .then(data => {
            renderDeliveryChart(data);
        })
        .catch(error => console.error('Error fetching delivery chart data:', error));
}

function updateVehicleCharts() {
    fetch('api.php?action=vehicle_chart')
        .then(res => res.json())
        .then(data => {
            renderVehicleChart(data);
        })
        .catch(error => console.error('Error fetching vehicle chart data:', error));
}

function updateSpoilageChart() {
    fetch('api.php?action=spoilage_chart')
        .then(res => res.json())
        .then(data => {
            renderSpoilageChart(data);
        })
        .catch(error => console.error('Error fetching spoilage chart data:', error));
}

function updateReliabilityChart() {
    fetch('api.php?action=reliability_chart')
        .then(res => res.json())
        .then(data => {
            renderReliabilityChart(data);
        })
        .catch(error => console.error('Error fetching reliability chart data:', error));
}

function renderDeliveryChart(data) {
    const ctx = document.getElementById('deliveryChart').getContext('2d');
    
    if (charts.delivery) charts.delivery.destroy();
    
    charts.delivery = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            layout: {
                padding: 20
            }
        }
    });
}

function renderVehicleChart(data) {
    const ctx = document.getElementById('vehicleChart').getContext('2d');
    
    if (charts.vehicle) charts.vehicle.destroy();
    
    charts.vehicle = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Vehicle Count',
                data: Object.values(data),
                backgroundColor: ['#17a2b8', '#ffc107', '#dc3545', '#6c757d'],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            layout: {
                padding: 20
            }
        }
    });
}

function renderSpoilageChart(data) {
    const ctx = document.getElementById('spoilageChart').getContext('2d');
    
    if (charts.spoilage) charts.spoilage.destroy();
    
    charts.spoilage = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            layout: {
                padding: 20
            }
        }
    });
}

function renderReliabilityChart(data) {
    const ctx = document.getElementById('reliabilityChart').getContext('2d');
    
    if (charts.reliability) charts.reliability.destroy();
    
    charts.reliability = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.month),
            datasets: [{
                label: 'Reliability %',
                data: data.map(item => item.reliability),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            layout: {
                padding: 20
            }
        }
    });
}

// ===== SEARCH AND FILTER FUNCTIONS =====

function searchDeliveries() {
    const searchTerm = document.getElementById('deliverySearch').value.toLowerCase();
    const filteredDeliveries = deliveries.filter(delivery => 
        delivery.vehicle_license_no?.toLowerCase().includes(searchTerm) ||
        delivery.delivery_man_name?.toLowerCase().includes(searchTerm) ||
        delivery.delivery_status?.toLowerCase().includes(searchTerm) ||
        delivery.delivery_success?.toLowerCase().includes(searchTerm)
    );
    renderFilteredDeliveries(filteredDeliveries);
}

function filterDeliveries(status) {
    if (status === 'all') {
        renderDeliveriesTable();
        return;
    }
    
    const filteredDeliveries = deliveries.filter(delivery => 
        delivery.delivery_status === status
    );
    renderFilteredDeliveries(filteredDeliveries);
}

function renderFilteredDeliveries(filteredDeliveries) {
    const tbody = document.getElementById('deliveriesTableBody');
    tbody.innerHTML = '';
    
    filteredDeliveries.forEach(delivery => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${delivery.delivery_id}</td>
            <td>${delivery.expected_time || ''}</td>
            <td>${delivery.delivered_time || ''}</td>
            <td>${delivery.spoilage_quantity || 0}</td>
            <td><span class="status-badge status-${delivery.delivery_status?.replace(' ', '-')}">${delivery.delivery_status || ''}</span></td>
            <td><span class="status-badge status-${delivery.delivery_success}">${delivery.delivery_success || ''}</span></td>
            <td>
                <button class="btn btn-edit" onclick="editDelivery(${delivery.delivery_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteDelivery(${delivery.delivery_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function searchTransports() {
    const searchTerm = document.getElementById('transportSearch').value.toLowerCase();
    const filteredTransports = transports.filter(transport => 
        transport.vehicle_license_no?.toLowerCase().includes(searchTerm) ||
        transport.vehicle_type?.toLowerCase().includes(searchTerm) ||
        transport.vehicle_status?.toLowerCase().includes(searchTerm)
    );
    renderFilteredTransports(filteredTransports);
}

function filterTransports(status) {
    if (status === 'all') {
        renderTransportsTable();
        return;
    }
    
    const filteredTransports = transports.filter(transport => 
        transport.vehicle_status === status
    );
    renderFilteredTransports(filteredTransports);
}

function renderFilteredTransports(filteredTransports) {
    const tbody = document.getElementById('transportsTableBody');
    tbody.innerHTML = '';
    
    filteredTransports.forEach(transport => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${transport.transport_id}</td>
            <td>${transport.vehicle_license_no || ''}</td>
            <td>${transport.vehicle_type || ''}</td>
            <td>${transport.vehicle_capacity || 0}</td>
            <td><span class="status-badge status-${transport.vehicle_status?.replace(' ', '-')}">${transport.vehicle_status || ''}</span></td>
            <td>${transport.carrier_reliability || 0}%</td>
            <td>
                <button class="btn btn-edit" onclick="editTransport(${transport.transport_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteTransport(${transport.transport_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ===== UTILITY FUNCTIONS =====

// Close modals when clicking outside
window.onclick = function(event) {
    const deliveryModal = document.getElementById('deliveryModal');
    const transportModal = document.getElementById('transportModal');
    
    if (event.target === deliveryModal) {
        closeDeliveryModal();
    }
    if (event.target === transportModal) {
        closeTransportModal();
    }
};

// Update all charts when data changes
function updateAllCharts() {
    updateDeliveryCharts();
    updateVehicleCharts();
    updateSpoilageChart();
    updateReliabilityChart();
}

// Refresh all data
function refreshData() {
    loadAll();
}



