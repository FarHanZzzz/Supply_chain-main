// Global variables
let currentTab = 'transport-monitoring';
let transportMonitoringData = [];
let sensorData = [];
let sensors = [];
let transports = [];
let shipments = [];
let alerts = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadStats();
    loadTransportMonitoring();
    loadCriticalAlerts();
    loadActiveTransports();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Search functionality
    const transportSearch = document.getElementById('transportMonitoringSearch');
    if (transportSearch) {
        transportSearch.addEventListener('input', function() {
            filterTransportMonitoring(this.value);
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterTransportMonitoringByStatus(this.value);
        });
    }

    const sensorDataSearch = document.getElementById('sensorDataSearch');
    if (sensorDataSearch) {
        sensorDataSearch.addEventListener('input', function() {
            filterSensorData(this.value);
        });
    }
}

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;

    // Load data for the active tab
    switch(tabName) {
        case 'transport-monitoring':
            loadTransportMonitoring();
            loadCriticalAlerts();
            loadActiveTransports();
            break;
        case 'sensor-data':
            loadSensorData();
            break;
        case 'sensors':
            loadSensors();
            break;
        case 'alerts':
            loadAlerts();
            break;
    }
}

// ==================== TRANSPORT MONITORING FUNCTIONS ====================

function loadTransportMonitoring() {
    showLoading('transportMonitoringLoading');
    
    fetch('api.php?action=get_transport_monitoring')
        .then(response => response.json())
        .then(data => {
            hideLoading('transportMonitoringLoading');
            if (data.success) {
                transportMonitoringData = data.data;
                displayTransportMonitoring(transportMonitoringData);
            } else {
                showError('Failed to load transport monitoring data');
            }
        })
        .catch(error => {
            hideLoading('transportMonitoringLoading');
            console.error('Error loading transport monitoring:', error);
            showError('Error loading transport monitoring data');
        });
}

function displayTransportMonitoring(data) {
    const tbody = document.getElementById('transportMonitoringTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-truck"></i>
                    <h3>No Transport Data Available</h3>
                    <p>No active transports with sensor data found.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td><strong>T-${item.transport_id}</strong></td>
            <td>${item.vehicle_type || 'N/A'}</td>
            <td>${item.driver_name || 'N/A'}</td>
            <td>${item.shipment_destination || 'N/A'}</td>
            <td>
                <span class="condition-indicator ${getShipmentStatusClass(item.shipment_status)}">
                    ${item.shipment_status || 'N/A'}
                </span>
            </td>
            <td>
                <span class="condition-indicator ${getTemperatureClass(item.temperature)}">
                    <i class="fas fa-thermometer-half"></i>
                    ${item.temperature ? item.temperature + '°C' : 'N/A'}
                </span>
            </td>
            <td>
                <span class="condition-indicator ${getHumidityClass(item.humidity)}">
                    <i class="fas fa-tint"></i>
                    ${item.humidity ? item.humidity + '%' : 'N/A'}
                </span>
            </td>
            <td>
                <span class="condition-indicator condition-${item.alert_level || 'normal'}">
                    ${item.condition_status || 'Normal'}
                </span>
            </td>
            <td>${item.last_reading_time ? formatDateTime(item.last_reading_time) : 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewTransportHistory(${item.transport_id})">
                        <i class="fas fa-history"></i>
                        History
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="viewTransportDetails(${item.transport_id})">
                        <i class="fas fa-eye"></i>
                        Details
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadCriticalAlerts() {
    fetch('api.php?action=get_critical_alerts')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayCriticalAlerts(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading critical alerts:', error);
        });
}

function displayCriticalAlerts(alerts) {
    const container = document.getElementById('criticalAlertsContainer');
    
    if (!alerts || alerts.length === 0) {
        container.innerHTML = `
            <div class="alert-item">
                <div class="alert-info">
                    <div class="alert-message">No Critical Alerts</div>
                    <div class="alert-details">All transport conditions are within normal parameters</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item">
            <div class="alert-info">
                <div class="alert-message">${alert.alert_message}</div>
                <div class="alert-details">
                    Transport ${alert.transport_id} - ${alert.driver_name} - ${alert.shipment_destination}
                    <br>Temperature: ${alert.temperature}°C, Humidity: ${alert.humidity}%
                    <br>${formatDateTime(alert.timestamp)}
                </div>
            </div>
        </div>
    `).join('');
}

function loadActiveTransports() {
    fetch('api.php?action=get_active_transports')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayActiveTransports(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading active transports:', error);
        });
}

function displayActiveTransports(transports) {
    const container = document.getElementById('activeTransportsGrid');
    
    if (!transports || transports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck"></i>
                <h3>No Active Transports</h3>
                <p>No transports are currently active with sensor data.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = transports.map(transport => `
        <div class="transport-card">
            <div class="transport-header">
                <div class="transport-id">Transport ${transport.transport_id}</div>
                <div class="transport-status ${getAlertStatusClass(transport.alert_count)}">
                    ${transport.alert_count > 0 ? transport.alert_count + ' Alerts' : 'Normal'}
                </div>
            </div>
            <div class="transport-details">
                <div class="detail-row">
                    <span class="detail-label">Vehicle:</span>
                    <span class="detail-value">${transport.vehicle_type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Driver:</span>
                    <span class="detail-value">${transport.driver_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Destination:</span>
                    <span class="detail-value">${transport.shipment_destination}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Sensors:</span>
                    <span class="detail-value">${transport.sensor_count}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Avg Temp:</span>
                    <span class="detail-value">${transport.avg_temperature ? parseFloat(transport.avg_temperature).toFixed(1) + '°C' : 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Avg Humidity:</span>
                    <span class="detail-value">${transport.avg_humidity ? parseFloat(transport.avg_humidity).toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Update:</span>
                    <span class="detail-value">${formatDateTime(transport.last_update)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function refreshTransportMonitoring() {
    loadTransportMonitoring();
    loadCriticalAlerts();
    loadActiveTransports();
    loadStats();
    showSuccess('Transport monitoring data refreshed');
}

function exportTransportData() {
    // Create CSV content
    const headers = ['Transport ID', 'Vehicle', 'Driver', 'Destination', 'Status', 'Temperature', 'Humidity', 'Condition', 'Last Reading'];
    const csvContent = [
        headers.join(','),
        ...transportMonitoringData.map(item => [
            `T-${item.transport_id}`,
            item.vehicle_type || '',
            item.driver_name || '',
            item.shipment_destination || '',
            item.shipment_status || '',
            item.temperature || '',
            item.humidity || '',
            item.condition_status || '',
            item.last_reading_time || ''
        ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transport_monitoring_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Transport monitoring report exported');
}

function viewTransportHistory(transportId) {
    fetch(`api.php?action=get_transport_history&transport_id=${transportId}&hours=24`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTransportHistoryModal(transportId, data.data);
            } else {
                showError('Failed to load transport history');
            }
        })
        .catch(error => {
            console.error('Error loading transport history:', error);
            showError('Error loading transport history');
        });
}

function displayTransportHistoryModal(transportId, history) {
    const modalContent = `
        <div class="modal-header">
            <h3>Transport ${transportId} - Sensor History (24 hours)</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            ${history.length === 0 ? 
                '<p>No sensor data available for the last 24 hours.</p>' :
                `<table class="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Sensor</th>
                            <th>Temperature</th>
                            <th>Humidity</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(record => `
                            <tr>
                                <td>${formatDateTime(record.timestamp)}</td>
                                <td>${record.sensor_type} (${record.sensor_id})</td>
                                <td>
                                    <span class="condition-indicator ${getTemperatureClass(record.temperature)}">
                                        ${record.temperature}°C
                                    </span>
                                </td>
                                <td>
                                    <span class="condition-indicator ${getHumidityClass(record.humidity)}">
                                        ${record.humidity}%
                                    </span>
                                </td>
                                <td>${record.coordinates || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
            }
        </div>
    `;
    
    showModal(modalContent);
}

function viewTransportDetails(transportId) {
    // Find the transport in the monitoring data
    const transport = transportMonitoringData.find(t => t.transport_id == transportId);
    if (!transport) {
        showError('Transport details not found');
        return;
    }

    const modalContent = `
        <div class="modal-header">
            <h3>Transport ${transportId} - Detailed Information</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="detail-grid">
                <div class="detail-section">
                    <h4>Transport Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Transport ID:</span>
                        <span class="detail-value">T-${transport.transport_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Vehicle Type:</span>
                        <span class="detail-value">${transport.vehicle_type || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Capacity:</span>
                        <span class="detail-value">${transport.vehicle_capacity || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Driver:</span>
                        <span class="detail-value">${transport.driver_name || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${transport.driver_phone || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Shipment Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Shipment ID:</span>
                        <span class="detail-value">S-${transport.shipment_id || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Destination:</span>
                        <span class="detail-value">${transport.shipment_destination || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="condition-indicator ${getShipmentStatusClass(transport.shipment_status)}">
                                ${transport.shipment_status || 'N/A'}
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Harvest Batch:</span>
                        <span class="detail-value">${transport.harvest_batch || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Production Qty:</span>
                        <span class="detail-value">${transport.production_quantity || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Current Sensor Readings</h4>
                    <div class="detail-row">
                        <span class="detail-label">Sensor ID:</span>
                        <span class="detail-value">S-${transport.sensor_id || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Sensor Type:</span>
                        <span class="detail-value">${transport.sensor_type || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Temperature:</span>
                        <span class="detail-value">
                            <span class="condition-indicator ${getTemperatureClass(transport.temperature)}">
                                <i class="fas fa-thermometer-half"></i>
                                ${transport.temperature ? transport.temperature + '°C' : 'N/A'}
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Humidity:</span>
                        <span class="detail-value">
                            <span class="condition-indicator ${getHumidityClass(transport.humidity)}">
                                <i class="fas fa-tint"></i>
                                ${transport.humidity ? transport.humidity + '%' : 'N/A'}
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Condition:</span>
                        <span class="detail-value">
                            <span class="condition-indicator condition-${transport.alert_level || 'normal'}">
                                ${transport.condition_status || 'Normal'}
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Last Reading:</span>
                        <span class="detail-value">${transport.last_reading_time ? formatDateTime(transport.last_reading_time) : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${transport.coordinates || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="viewTransportHistory(${transport.transport_id})">
                    <i class="fas fa-history"></i>
                    View History
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== SENSOR DATA FUNCTIONS ====================

function loadSensorData() {
    showLoading('sensorDataLoading');
    
    fetch('api.php?action=get_sensor_data')
        .then(response => response.json())
        .then(data => {
            hideLoading('sensorDataLoading');
            if (data.success) {
                sensorData = data.data;
                displaySensorData(sensorData);
            } else {
                showError('Failed to load sensor data');
            }
        })
        .catch(error => {
            hideLoading('sensorDataLoading');
            console.error('Error loading sensor data:', error);
            showError('Error loading sensor data');
        });
}

function displaySensorData(data) {
    const tbody = document.getElementById('sensorDataTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-database"></i>
                    <h3>No Sensor Data Available</h3>
                    <p>No sensor readings have been recorded yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.sensor_data_id}</td>
            <td>${formatDateTime(item.timestamp)}</td>
            <td>
                <span class="condition-indicator ${getTemperatureClass(item.temperature)}">
                    <i class="fas fa-thermometer-half"></i>
                    ${item.temperature}°C
                </span>
            </td>
            <td>
                <span class="condition-indicator ${getHumidityClass(item.humidity)}">
                    <i class="fas fa-tint"></i>
                    ${item.humidity}%
                </span>
            </td>
            <td>${item.sensor_type || 'N/A'}</td>
            <td>${item.vehicle_type || 'N/A'}</td>
            <td>${item.driver_name || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editSensorData(${item.sensor_data_id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSensorData(${item.sensor_data_id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== UTILITY FUNCTIONS ====================

function loadStats() {
    fetch('api.php?action=get_stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStats(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

function updateStats(stats) {
    document.getElementById('totalTransports').textContent = stats.total_transports || 0;
    document.getElementById('totalSensors').textContent = stats.total_sensors || 0;
    document.getElementById('activeShipments').textContent = stats.active_shipments || 0;
    document.getElementById('totalSensorData').textContent = stats.total_sensor_data || 0;
    document.getElementById('tempAlerts').textContent = stats.temp_alerts || 0;
    document.getElementById('humidityAlerts').textContent = stats.humidity_alerts || 0;
}

function getTemperatureClass(temperature) {
    if (!temperature) return 'condition-normal';
    if (temperature < 0 || temperature > 25) return 'condition-danger';
    if (temperature < 2 || temperature > 20) return 'condition-warning';
    return 'condition-normal';
}

function getHumidityClass(humidity) {
    if (!humidity) return 'condition-normal';
    if (humidity < 30 || humidity > 80) return 'condition-danger';
    if (humidity < 40 || humidity > 70) return 'condition-warning';
    return 'condition-normal';
}

function getShipmentStatusClass(status) {
    switch(status) {
        case 'delivered': return 'status-normal';
        case 'in transit': return 'status-warning';
        case 'pending': return 'status-warning';
        case 'cancelled': return 'status-danger';
        default: return 'status-normal';
    }
}

function getAlertStatusClass(alertCount) {
    if (alertCount > 0) return 'status-danger';
    return 'status-normal';
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('show');
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('show');
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Position notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '400px';
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showModal(content) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;
    
    // Add to page
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Filter functions
function filterTransportMonitoring(searchTerm) {
    const filteredData = transportMonitoringData.filter(item => {
        const searchString = `${item.transport_id} ${item.vehicle_type} ${item.driver_name} ${item.shipment_destination}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });
    displayTransportMonitoring(filteredData);
}

function filterTransportMonitoringByStatus(status) {
    if (!status) {
        displayTransportMonitoring(transportMonitoringData);
        return;
    }
    
    const filteredData = transportMonitoringData.filter(item => {
        return item.alert_level === status;
    });
    displayTransportMonitoring(filteredData);
}

function filterSensorData(searchTerm) {
    const filteredData = sensorData.filter(item => {
        const searchString = `${item.sensor_data_id} ${item.sensor_type} ${item.vehicle_type} ${item.driver_name}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });
    displaySensorData(filteredData);
}

// ==================== SENSORS TAB FUNCTIONS ====================

function loadSensors() {
    showLoading('sensorsLoading');
    
    fetch('api.php?action=get_sensors')
        .then(response => response.json())
        .then(data => {
            hideLoading('sensorsLoading');
            if (data.success) {
                sensors = data.data;
                displaySensors(sensors);
            } else {
                showError('Failed to load sensors');
            }
        })
        .catch(error => {
            hideLoading('sensorsLoading');
            console.error('Error loading sensors:', error);
            showError('Error loading sensors');
        });
}

function displaySensors(data) {
    const tbody = document.getElementById('sensorsTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-microchip"></i>
                    <h3>No Sensors Available</h3>
                    <p>No sensors have been registered yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>S-${item.sensor_id}</td>
            <td>${item.sensor_type || 'N/A'}</td>
            <td>${item.warehouse_name || 'N/A'}</td>
            <td>${item.vehicle_type || 'N/A'}</td>
            <td>${item.driver_name || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editSensor(${item.sensor_id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSensor(${item.sensor_id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== ALERTS TAB FUNCTIONS ====================

function loadAlerts() {
    showLoading('alertsLoading');
    
    fetch('api.php?action=get_alerts')
        .then(response => response.json())
        .then(data => {
            hideLoading('alertsLoading');
            if (data.success) {
                alerts = data.data;
                displayAlerts(alerts);
            } else {
                showError('Failed to load alerts');
            }
        })
        .catch(error => {
            hideLoading('alertsLoading');
            console.error('Error loading alerts:', error);
            showError('Error loading alerts');
        });
}

function displayAlerts(data) {
    const tbody = document.getElementById('alertsTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No Alerts</h3>
                    <p>No temperature or humidity alerts have been triggered.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${formatDateTime(item.timestamp)}</td>
            <td>
                <span class="condition-indicator condition-${item.alert_level}">
                    ${item.alert_type}
                </span>
            </td>
            <td>
                <span class="condition-indicator ${getTemperatureClass(item.temperature)}">
                    <i class="fas fa-thermometer-half"></i>
                    ${item.temperature}°C
                </span>
            </td>
            <td>
                <span class="condition-indicator ${getHumidityClass(item.humidity)}">
                    <i class="fas fa-tint"></i>
                    ${item.humidity}%
                </span>
            </td>
            <td>${item.vehicle_type || 'N/A'}</td>
            <td>${item.driver_name || 'N/A'}</td>
            <td>${item.shipment_destination || 'N/A'}</td>
            
        </tr>
    `).join('');
}

function refreshAlerts() {
    loadAlerts();
    showSuccess('Alerts refreshed');
}


function openAddSensorDataModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Add Sensor Data</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="sensorDataForm">
                <div class="form-group">
                    <label for="sensorSelect">Sensor:</label>
                    <select id="sensorSelect" required>
                        <option value="">Select Sensor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="temperature">Temperature (°C):</label>
                    <input type="number" id="temperature" step="0.1" required>
                </div>
                <div class="form-group">
                    <label for="humidity">Humidity (%):</label>
                    <input type="number" id="humidity" step="0.1" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label for="travelDuration">Travel Duration (hours):</label>
                    <input type="number" id="travelDuration" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="coordinates">Coordinates:</label>
                    <input type="text" id="coordinates" placeholder="Latitude, Longitude">
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Add Sensor Data</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(modalContent);
    loadSensorOptions();
    
    document.getElementById('sensorDataForm').addEventListener('submit', handleAddSensorData);
}

function openAddSensorModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Add Sensor</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="sensorForm">
                <div class="form-group">
                    <label for="sensorType">Sensor Type:</label>
                    <select id="sensorType" required>
                        <option value="">Select Type</option>
                        <option value="Temperature">Temperature</option>
                        <option value="Humidity">Humidity</option>
                        <option value="Temperature/Humidity">Temperature/Humidity</option>
                        <option value="GPS">GPS</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="warehouseSelect">Warehouse:</label>
                    <select id="warehouseSelect">
                        <option value="">Select Warehouse</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="transportSelect">Transport:</label>
                    <select id="transportSelect">
                        <option value="">Select Transport</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Add Sensor</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(modalContent);
    loadWarehouseOptions();
    loadTransportOptions();
    
    document.getElementById('sensorForm').addEventListener('submit', handleAddSensor);
}

// ==================== CRUD OPERATION HANDLERS ====================

function handleAddSensorData(e) {
    e.preventDefault();
    
    const formData = {
        sensor_id: document.getElementById('sensorSelect').value,
        temperature: document.getElementById('temperature').value,
        humidity: document.getElementById('humidity').value,
        travel_duration: document.getElementById('travelDuration').value || 0,
        coordinates: document.getElementById('coordinates').value
    };
    
    fetch('api.php?action=add_sensor_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Sensor data added successfully');
            closeModal();
            if (currentTab === 'sensor-data') {
                loadSensorData();
            }
            loadStats();
        } else {
            showError(data.message || 'Failed to add sensor data');
        }
    })
    .catch(error => {
        console.error('Error adding sensor data:', error);
        showError('Error adding sensor data');
    });
}

function handleAddSensor(e) {
    e.preventDefault();
    
    const formData = {
        sensor_type: document.getElementById('sensorType').value,
        warehouse_id: document.getElementById('warehouseSelect').value || null,
        transport_id: document.getElementById('transportSelect').value || null
    };
    
    fetch('api.php?action=add_sensor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Sensor added successfully');
            closeModal();
            if (currentTab === 'sensors') {
                loadSensors();
            }
            loadStats();
        } else {
            showError(data.message || 'Failed to add sensor');
        }
    })
    .catch(error => {
        console.error('Error adding sensor:', error);
        showError('Error adding sensor');
    });
}

// ==================== EDIT FUNCTIONS ====================

function editSensorData(id) {
    const item = sensorData.find(s => s.sensor_data_id == id);
    if (!item) {
        showError('Sensor data not found');
        return;
    }
    
    const modalContent = `
        <div class="modal-header">
            <h3>Edit Sensor Data</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editSensorDataForm">
                <input type="hidden" id="editSensorDataId" value="${item.sensor_data_id}">
                <div class="form-group">
                    <label for="editSensorSelect">Sensor:</label>
                    <select id="editSensorSelect" required>
                        <option value="">Select Sensor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editTemperature">Temperature (°C):</label>
                    <input type="number" id="editTemperature" step="0.1" value="${item.temperature}" required>
                </div>
                <div class="form-group">
                    <label for="editHumidity">Humidity (%):</label>
                    <input type="number" id="editHumidity" step="0.1" min="0" max="100" value="${item.humidity}" required>
                </div>
                <div class="form-group">
                    <label for="editTravelDuration">Travel Duration (hours):</label>
                    <input type="number" id="editTravelDuration" step="0.1" min="0" value="${item.travel_duration || 0}">
                </div>
                <div class="form-group">
                    <label for="editCoordinates">Coordinates:</label>
                    <input type="text" id="editCoordinates" value="${item.coordinates || ''}" placeholder="Latitude, Longitude">
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Update Sensor Data</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(modalContent);
    loadSensorOptions('editSensorSelect', item.sensor_id);
    
    document.getElementById('editSensorDataForm').addEventListener('submit', handleEditSensorData);
}

function handleEditSensorData(e) {
    e.preventDefault();
    
    const formData = {
        sensor_data_id: document.getElementById('editSensorDataId').value,
        sensor_id: document.getElementById('editSensorSelect').value,
        temperature: document.getElementById('editTemperature').value,
        humidity: document.getElementById('editHumidity').value,
        travel_duration: document.getElementById('editTravelDuration').value || 0,
        coordinates: document.getElementById('editCoordinates').value
    };
    
    fetch('api.php?action=update_sensor_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Sensor data updated successfully');
            closeModal();
            loadSensorData();
        } else {
            showError(data.message || 'Failed to update sensor data');
        }
    })
    .catch(error => {
        console.error('Error updating sensor data:', error);
        showError('Error updating sensor data');
    });
}

function deleteSensorData(id) {
    if (confirm('Are you sure you want to delete this sensor data?')) {
        fetch('api.php?action=delete_sensor_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sensor_data_id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Sensor data deleted successfully');
                loadSensorData();
                loadStats();
            } else {
                showError(data.message || 'Failed to delete sensor data');
            }
        })
        .catch(error => {
            console.error('Error deleting sensor data:', error);
            showError('Error deleting sensor data');
        });
    }
}

function editSensor(id) {
    showNotification('Edit sensor functionality coming soon', 'info');
}

function deleteSensor(id) {
    if (confirm('Are you sure you want to delete this sensor?')) {
        showNotification('Delete sensor functionality coming soon', 'info');
    }
}

// ==================== HELPER FUNCTIONS FOR DROPDOWNS ====================

function loadSensorOptions(selectId = 'sensorSelect', selectedValue = null) {
    fetch('api.php?action=get_sensors')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                select.innerHTML = '<option value="">Select Sensor</option>';
                data.data.forEach(sensor => {
                    const option = document.createElement('option');
                    option.value = sensor.sensor_id;
                    option.textContent = `${sensor.sensor_type} (ID: ${sensor.sensor_id})`;
                    if (selectedValue && sensor.sensor_id == selectedValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading sensor options:', error);
        });
}

function loadWarehouseOptions() {
    fetch('api.php?action=get_warehouses')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('warehouseSelect');
                data.data.forEach(warehouse => {
                    const option = document.createElement('option');
                    option.value = warehouse.warehouse_id;
                    option.textContent = warehouse.warehouse_name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading warehouse options:', error);
        });
}

function loadTransportOptions(selectId = 'transportSelect') {
    fetch('api.php?action=get_transports')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                data.data.forEach(transport => {
                    const option = document.createElement('option');
                    option.value = transport.transport_id;
                    option.textContent = `${transport.vehicle_type} - ${transport.driver_name}`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading transport options:', error);
        });
}

function loadDriverOptions() {
    fetch('api.php?action=get_drivers')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('driverSelect');
                data.data.forEach(driver => {
                    const option = document.createElement('option');
                    option.value = driver.driver_id;
                    option.textContent = `${driver.first_name} ${driver.last_name}`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading driver options:', error);
        });
}

function loadHarvestBatchOptions() {
    fetch('api.php?action=get_harvest_batches')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('harvestBatchSelect');
                data.data.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.harvest_batch_id;
                    option.textContent = `Batch ${batch.batch_number}`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading harvest batch options:', error);
        });
}

function loadPackagedProductOptions() {
    fetch('api.php?action=get_packaged_product_batches')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('packagedProductSelect');
                data.data.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.packaged_product_batch_id;
                    option.textContent = `Batch ${batch.packaged_product_batch_id} (${batch.production_quantity})`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading packaged product options:', error);
        });
}

// ==================== ADDITIONAL UTILITY FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

