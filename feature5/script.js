// Global variables
let currentTab = 'sensors';
let sensorData = [];
let sensors = [];
let alerts = [];
let transports = [];
let chart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    setupTabs();
    setupEventListeners();
    loadTransports();
    loadSensors();
    loadSensorData();
    loadStats();
    loadAlerts();
    
    // Initialize chart with empty data
    initializeChart();
    console.log('Initialization complete');
});

function setupTabs() {
    console.log('Setting up tabs...');
    // Set initial tab
    switchTab('sensors');
    
    // Add click event listeners to all tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        console.log('Adding click listener to tab:', tab.dataset.tab);
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            console.log('Tab clicked:', tabName);
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    // Remove active class from all tabs and content
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log('Tab activated:', selectedTab.dataset.tab);
    }
    if (selectedContent) {
        selectedContent.classList.add('active');
        console.log('Content activated:', selectedContent.id);
    }
    
    currentTab = tabName;
    
    // Load data for the active tab
    switch(tabName) {
        case 'sensor-data':
            console.log('Loading sensor data...');
            loadSensorData();
            break;
        case 'sensors':
            console.log('Loading sensors...');
            loadSensors();
            break;
        case 'alerts':
            console.log('Loading alerts...');
            loadAlerts();
            break;
    }
}

// ==================== CHART FUNCTIONS (FIXED) ====================

function initializeChart() {
    const ctx = document.getElementById('sensorChart');
    if (!ctx) {
        console.error('Chart canvas not found!');
        return;
    }
    
    // Destroy existing chart if it exists
    if (window.sensorChart && typeof window.sensorChart.destroy === 'function') {
        window.sensorChart.destroy();
    }
    
    window.sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#333',
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Value',
                        color: '#333'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#333',
                        maxTicksLimit: 10
                    },
                    title: {
                        display: true,
                        text: 'Reading Number',
                        color: '#333'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#333',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            }
        }
    });
    console.log('Chart initialized successfully');
}

function updateChart() {
    console.log('updateChart called');
    
    const ctx = document.getElementById('sensorChart');
    if (!ctx) {
        console.error('Chart canvas not found!');
        return;
    }

    if (!sensorData || sensorData.length === 0) {
        console.log('No sensor data available for chart');
        // Show empty chart
        if (window.sensorChart) {
            window.sensorChart.data.labels = [];
            window.sensorChart.data.datasets = [];
            window.sensorChart.update();
        }
        return;
    }
    
    const filter = getChartFilterValue();
    console.log('Chart filter:', filter);
    
    // Process data for chart
    const chartData = processChartData(sensorData);
    
    if (chartData.length === 0) {
        console.log('No valid chart data after processing');
        return;
    }
    
    // Create labels (reading numbers)
    const labels = chartData.map((_, index) => `Reading ${index + 1}`);
    
    // Extract temperature and humidity data
    const temperatures = chartData.map(item => {
        const temp = parseFloat(item.temperature);
        return !isNaN(temp) ? temp : null;
    });
    
    const humidities = chartData.map(item => {
        const humidity = parseFloat(item.humidity);
        return !isNaN(humidity) ? humidity : null;
    });
    
    console.log('Chart data processed:', {
        labels: labels.slice(0, 5) + '...', // Show first 5 for debugging
        temperatures: temperatures.slice(0, 5),
        humidities: humidities.slice(0, 5),
        totalPoints: chartData.length
    });
    
    // Destroy existing chart and create new one
    if (window.sensorChart && typeof window.sensorChart.destroy === 'function') {
        window.sensorChart.destroy();
    }
    
    const datasets = [];
    
    // Add datasets based on filter
    if (filter === 'both' || filter === 'temperature') {
        datasets.push({
            label: 'Temperature (°C)',
            data: temperatures,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ff6b6b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
        });
    }
    
    if (filter === 'both' || filter === 'humidity') {
        datasets.push({
            label: 'Humidity (%)',
            data: humidities,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4ecdc4',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
        });
    }
    
    window.sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#333',
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    },
                    title: {
                        display: true,
                        text: filter === 'temperature' ? 'Temperature (°C)' : 
                              filter === 'humidity' ? 'Humidity (%)' : 'Value',
                        color: '#333'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#333',
                        maxTicksLimit: 10
                    },
                    title: {
                        display: true,
                        text: 'Reading Number',
                        color: '#333'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#333',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const unit = label.includes('Temperature') ? '°C' : '%';
                            return `${label}: ${value.toFixed(2)}${unit}`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('Chart updated successfully with', datasets.length, 'datasets');
}

function processChartData(data) {
    if (!data || data.length === 0) {
        return [];
    }
    
    // Sort data by sensor_data_id to ensure consistent ordering
    const sortedData = [...data].sort((a, b) => {
        const idA = parseInt(a.sensor_data_id) || 0;
        const idB = parseInt(b.sensor_data_id) || 0;
        return idA - idB;
    });
    
    // Filter out entries with no temperature or humidity data
    const validData = sortedData.filter(item => {
        const hasTemp = item.temperature !== null && item.temperature !== undefined && item.temperature !== '';
        const hasHumidity = item.humidity !== null && item.humidity !== undefined && item.humidity !== '';
        return hasTemp || hasHumidity;
    });
    
    console.log('Processed chart data:', validData.length, 'valid entries from', data.length, 'total entries');
    return validData;
}

function getChartFilterValue() {
    const selectedFilter = document.querySelector('input[name="chartFilter"]:checked');
    return selectedFilter ? selectedFilter.value : 'both';
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Search functionality - ENHANCED to include sensor IDs
    const sensorDataSearch = document.getElementById('sensorDataSearch');
    if (sensorDataSearch) {
        sensorDataSearch.addEventListener('input', function() {
            filterSensorData(this.value);
        });
    }

    const dataTransportSelect = document.getElementById('dataTransportSelect');
    if (dataTransportSelect) {
        dataTransportSelect.addEventListener('change', onDataTransportChange);
    }

    const dataWarehouseSelect = document.getElementById('dataWarehouseSelect');
    if (dataWarehouseSelect) {
        dataWarehouseSelect.addEventListener('change', onDataWarehouseChange);
    }

    const dataSensorSelect = document.getElementById('dataSensorSelect');
    if (dataSensorSelect) {
        dataSensorSelect.addEventListener('change', loadSensorData);
    }

    // Combined sensor form
    setupCombinedSensorForm();

    // Chart filters
    setupChartFilters();

    // View options
    setupViewOptions();
}

// ==================== SENSOR DATA FUNCTIONS ====================

function loadSensorData() {
    console.log('loadSensorData called');
    showLoading('sensorDataLoading');
    
    console.log('Fetching from: api.php?action=get_sensor_data');
    fetch('api.php?action=get_sensor_data')
        .then(response => {
            console.log('Response received:', response);
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Data parsed:', data);
            hideLoading('sensorDataLoading');
            if (data.success) {
                const selectedTransportId = document.getElementById('dataTransportSelect')?.value || '';
                const selectedSensorId = document.getElementById('dataSensorSelect')?.value || '';
                let all = data.data || [];
                console.log('Raw data from API:', all);
                
                // Filter by selected sensor if specified
                if (selectedSensorId) {
                    all = all.filter(d => String(d.sensor_id || '') === String(selectedSensorId));
                }
                
                // Store the filtered data globally
                sensorData = all;
                console.log('Processed sensor data:', sensorData);
                
                // Display the data in table
                displaySensorData(sensorData);
                
                // Update chart after loading data
                setTimeout(() => {
                    console.log('Updating chart with loaded data...');
                    updateChart();
                }, 100);
                
            } else {
                console.error('API returned error:', data.message);
                showError('Failed to load sensor data: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            hideLoading('sensorDataLoading');
            showError('Error loading sensor data: ' + error.message);
        });
}

function displaySensorData(data) {
    const tbody = document.getElementById('sensorDataTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    <i class="fas fa-thermometer-half"></i>
                    <h3>No Sensor Data Available</h3>
                    <p>No sensor readings have been recorded yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td><strong>SD-${item.sensor_data_id}</strong></td>
            <td>S-${item.sensor_id}</td>
            <td><span class="badge badge-info">${item.sensor_type || 'N/A'}</span></td>
            <td>${item.temperature !== null ? item.temperature + '°C' : 'N/A'}</td>
            <td>${item.humidity !== null ? item.humidity + '%' : 'N/A'}</td>
            <td>${item.vehicle_license_no ? `${item.vehicle_license_no} (Transport)` : 'N/A'}</td>
            <td>${item.warehouse_name ? `${item.warehouse_name} (Warehouse)` : 'N/A'}</td>
            <td>${item.vehicle_license_no ? 
                `<span class="condition-indicator ${getCargoConditionClass(item.temperature, item.humidity)}">
                    ${getCargoCondition(item.temperature, item.humidity)}
                </span>` : 'N/A'}</td>
            <td>${item.warehouse_name ? 
                `<span class="condition-indicator ${getWarehouseConditionClass(item.temperature, item.humidity)}">
                    ${getWarehouseCondition(item.temperature, item.humidity)}
                </span>` : 'N/A'}</td>
            <td>${formatDateTime(new Date().toISOString())}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-danger" onclick="deleteSensorData(${item.sensor_data_id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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

// ENHANCED SEARCH FUNCTION - Now includes sensor IDs
function filterSensorData(searchTerm) {
    const filteredData = sensorData.filter(item => {
        // Include sensor_data_id and sensor_id in search
        const searchString = `SD-${item.sensor_data_id} S-${item.sensor_id} ${item.sensor_data_id} ${item.sensor_id} ${item.temperature} ${item.humidity} ${item.vehicle_license_no || ''} ${item.warehouse_name || ''} ${item.sensor_type || ''}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });
    displaySensorData(filteredData);
    // Update chart with filtered data
    setTimeout(() => updateChart(), 100);
}

// ==================== SENSORS TAB FUNCTIONS ====================

function loadSensors() {
    console.log('loadSensors called');
    showLoading('sensorsLoading');
    
    console.log('Fetching sensors from: api.php?action=get_sensors');
    fetch('api.php?action=get_sensors')
        .then(response => {
            console.log('Sensors response received:', response);
            return response.json();
        })
        .then(data => {
            console.log('Sensors data parsed:', data);
            hideLoading('sensorsLoading');
            if (data.success) {
                sensors = data.data;
                console.log('Sensors loaded:', sensors);
                displaySensors(sensors);
                populateSensorSelect();
            } else {
                console.error('Failed to load sensors:', data.message);
                showError('Failed to load sensors: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Sensors fetch error:', error);
            hideLoading('sensorsLoading');
            showError('Error loading sensors: ' + error.message);
        });
}

function displaySensors(data) {
    const tbody = document.getElementById('sensorsTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
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
            <td><span class="badge badge-info">${item.sensor_type || 'N/A'}</span></td>
            <td>${item.vehicle_license_no ? `${item.vehicle_license_no} (${item.vehicle_type || 'Vehicle'})` : (item.warehouse_name ? `${item.warehouse_name} (Warehouse)` : 'Unassigned')}</td>
            <td>
                <span class="condition-indicator condition-normal">
                    Active
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewSensorData(${item.sensor_id}, ${item.transport_id || 'null'})">
                        <i class="fas fa-chart-line"></i>
                        View Data
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="openEditSensorModal(${item.sensor_id})">
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

// ==================== SENSOR MODAL FUNCTIONS ====================

function openEditSensorModal(sensorId) {
    // Find the sensor in the list
    const sensor = sensors.find(s => s.sensor_id == sensorId);
    
    if (!sensor) {
        showError('Sensor not found');
        return;
    }
    
    const modalContent = `
        <div class="modal-header">
            <h3>Edit Sensor</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editSensorForm">
                <input type="hidden" id="editSensorId" value="${sensor.sensor_id}">
                <div class="form-group">
                    <label>Sensor Type:</label>
                    <div class="condition-indicator condition-normal">${sensor.sensor_type || 'N/A'}</div>
                    <input type="hidden" id="editSensorType" value="${sensor.sensor_type || ''}">
                </div>
                <div class="form-group">
                    <label for="editAssignTo">Assign To:</label>
                    <select id="editAssignTo" required>
                        <option value="transport" ${sensor.transport_id ? 'selected' : ''}>Transport</option>
                        <option value="warehouse" ${sensor.warehouse_id ? 'selected' : ''}>Warehouse</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editTransportSelect">Transport:</label>
                    <select id="editTransportSelect">
                        <option value="">Select Transport</option>
                    </select>
                </div>
                <div class="form-group">
                    <div class="form-group">
                        <label for="editWarehouseSelect">Warehouse:</label>
                        <select id="editWarehouseSelect">
                            <option value="">Select Warehouse</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Update Sensor</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(modalContent);
    loadTransportOptions('editTransportSelect');
    loadWarehouseOptions('editWarehouseSelect');
    
    // Set current values
    if (sensor.transport_id) {
        document.getElementById('editAssignTo').value = 'transport';
        setTimeout(() => {
            document.getElementById('editTransportSelect').value = sensor.transport_id;
        }, 500);
        document.getElementById('editTransportSelect').style.display = '';
        document.getElementById('editWarehouseSelect').style.display = 'none';
    } else {
        document.getElementById('editAssignTo').value = 'warehouse';
        setTimeout(() => {
            document.getElementById('editWarehouseSelect').value = sensor.warehouse_id;
        }, 500);
        document.getElementById('editTransportSelect').style.display = 'none';
        document.getElementById('editWarehouseSelect').style.display = '';
    }
    
    const assignSel = document.getElementById('editAssignTo');
    const tSel = document.getElementById('editTransportSelect');
    const wSel = document.getElementById('editWarehouseSelect');
    assignSel.addEventListener('change', () => {
        if (assignSel.value === 'transport') {
            tSel.style.display = '';
            wSel.style.display = 'none';
        } else if (assignSel.value === 'warehouse') {
            tSel.style.display = 'none';
            wSel.style.display = '';
        } else {
            tSel.style.display = 'none';
            wSel.style.display = 'none';
        }
    });
    
    document.getElementById('editSensorForm').addEventListener('submit', handleEditSensor);
}

function handleEditSensor(e) {
    e.preventDefault();
    
    const sensorId = document.getElementById('editSensorId').value;
    const editType = document.getElementById('editSensorType').value;
    const editAssignTo = document.getElementById('editAssignTo').value;
    const editTransportId = document.getElementById('editTransportSelect').value;
    const editWarehouseId = document.getElementById('editWarehouseSelect').value;
    
    let formData = { sensor_id: sensorId, sensor_type: editType };
    
    if (editAssignTo === 'transport') {
        if (!editTransportId) { 
            showError('Please select transport'); 
            return; 
        }
        const dupEdit = sensors.some(s => String(s.transport_id || '') === String(editTransportId) && String(s.sensor_type) === String(editType) && String(s.sensor_id) !== String(sensorId));
        if (dupEdit) { 
            showError('This transport already has a sensor of that type'); 
            return; 
        }
        formData.transport_id = editTransportId;
    } else {
        if (!editWarehouseId) { 
            showError('Please select warehouse'); 
            return; 
        }
        const dupEditW = sensors.some(s => String(s.warehouse_id || '') === String(editWarehouseId) && String(s.sensor_type) === String(editType) && String(s.sensor_id) !== String(sensorId));
        if (dupEditW) { 
            showError('This warehouse already has a sensor of that type'); 
            return; 
        }
        formData.warehouse_id = editWarehouseId;
    }
    
    fetch('api.php?action=update_sensor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Sensor updated successfully');
            closeModal();
            loadSensors();
        } else {
            showError(data.message || 'Failed to update sensor');
        }
    })
    .catch(error => {
        console.error('Error updating sensor:', error);
        showError('Error updating sensor');
    });
}

function deleteSensor(sensorId) {
    if (confirm('Are you sure you want to delete this sensor? This action cannot be undone.')) {
        fetch('api.php?action=delete_sensor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sensor_id: sensorId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Sensor deleted successfully');
                loadSensors();
                loadStats();
            } else {
                showError(data.message || 'Failed to delete sensor');
            }
        })
        .catch(error => {
            console.error('Error deleting sensor:', error);
            showError('Error deleting sensor');
        });
    }
}

// ==================== ALERTS TAB FUNCTIONS ====================

function loadAlerts() {
    showLoading('alertsLoading');
    
    fetch('api.php?action=get_alerts')
        .then(response => response.json())
        .then(data => {
            hideLoading('alertsLoading');
            if (data.success) {
                alerts = data.data || [];
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
                <td colspan="5" class="empty-state">
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
            <td>${formatDateTime(new Date().toISOString())}</td>
            <td>
                <span class="condition-indicator condition-danger">
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
            <td>${item.vehicle_license_no ? `${item.vehicle_license_no} (Transport)` : 'Warehouse Sensor'}</td>
        </tr>
    `).join('');
}

function refreshAlerts() {
    loadAlerts();
    showSuccess('Alerts refreshed');
}

// ==================== UTILITY FUNCTIONS ====================

function loadStats() {
    console.log('loadStats called');
    // Calculate stats from loaded data
    const totalSensors = sensors.length;
    const totalSensorData = sensorData.length;
    
    // Count temperature and humidity alerts
    const tempAlerts = sensorData.filter(item => {
        const temp = parseFloat(item.temperature);
        return !isNaN(temp) && (temp > 30 || temp < 5);
    }).length;
    
    const humidityAlerts = sensorData.filter(item => {
        const humidity = parseFloat(item.humidity);
        return !isNaN(humidity) && (humidity > 80 || humidity < 30);
    }).length;
    
    console.log('Stats calculated:', { totalSensors, totalSensorData, tempAlerts, humidityAlerts });
    
    // Update UI
    document.getElementById('totalSensors').textContent = totalSensors;
    document.getElementById('totalSensorData').textContent = totalSensorData;
    document.getElementById('tempAlerts').textContent = tempAlerts;
    document.getElementById('humidityAlerts').textContent = humidityAlerts;
}

function updateStats(stats) {
    document.getElementById('totalSensors').textContent = stats.total_sensors || 0;
    document.getElementById('totalSensorData').textContent = stats.total_sensor_data || 0;
    document.getElementById('tempAlerts').textContent = stats.temp_alerts || 0;
    document.getElementById('humidityAlerts').textContent = stats.humidity_alerts || 0;
}

function getTemperatureClass(temperature) {
    if (temperature === null || temperature === undefined || temperature === '') return 'condition-normal';
    if (temperature < 0 || temperature > 25) return 'condition-danger';
    if (temperature < 2 || temperature > 20) return 'condition-warning';
    return 'condition-normal';
}

function getHumidityClass(humidity) {
    if (humidity === null || humidity === undefined || humidity === '') return 'condition-normal';
    if (humidity < 30 || humidity > 80) return 'condition-danger';
    if (humidity < 40 || humidity > 70) return 'condition-warning';
    return 'condition-normal';
}

function renderGoodsCondition(temperature, humidity) {
    // Define optimal ranges
    const tempOk = temperature !== null && temperature !== undefined && temperature >= 2 && temperature <= 8;
    const humOk = humidity !== null && humidity !== undefined && humidity >= 40 && humidity <= 70;

    if (tempOk && humOk) {
        return '<span class="condition-indicator condition-normal"><i class="fas fa-check-circle"></i> Optimal</span>';
    }
    if ((temperature !== null && temperature !== undefined && (temperature < 0 || temperature > 25)) || (humidity !== null && humidity !== undefined && (humidity < 30 || humidity > 80))) {
        return '<span class="condition-indicator condition-danger"><i class="fas fa-exclamation-triangle"></i> At Risk</span>';
    }
    return '<span class="condition-indicator condition-warning"><i class="fas fa-exclamation-circle"></i> Suboptimal</span>';
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

function loadTransportOptions(selectId = 'transportSelect', selectedId = null) {
    fetch('api.php?action=get_transports')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                if (!select) return;
                select.innerHTML = '<option value="">Select Transport</option>';
                data.data.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.transport_id;
                    option.textContent = `${t.vehicle_license_no} (${t.vehicle_type})`;
                    if (selectedId && String(t.transport_id) === String(selectedId)) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading transport options:', error);
        });
}

function loadWarehouseOptions(selectId = 'warehouseSelect', selectedId = null) {
    fetch('api.php?action=get_warehouses')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                if (!select) return;
                select.innerHTML = '<option value="">Select Warehouse</option>';
                data.data.forEach(w => {
                    const option = document.createElement('option');
                    option.value = w.warehouse_id;
                    option.textContent = `${w.warehouse_name}`;
                    if (selectedId && String(w.warehouse_id) === String(selectedId)) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading warehouse options:', error);
        });
}

function loadTransports() {
    fetch('api.php?action=get_transports')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const transportSelect = document.getElementById('dataTransportSelect');
                const combinedTransportSelect = document.getElementById('combinedTransportSelect');
                
                if (transportSelect) {
                    transportSelect.innerHTML = '<option value="">All Transports</option>' + 
                        data.data.map(t => `<option value="${t.transport_id}">${t.vehicle_license_no} (${t.vehicle_type})</option>`).join('');
                }
                
                if (combinedTransportSelect) {
                    combinedTransportSelect.innerHTML = '<option value="">Select Transport</option>' + 
                        data.data.map(t => `<option value="${t.transport_id}">${t.vehicle_license_no} (${t.vehicle_type})</option>`).join('');
                }
            }
        })
        .catch(error => {
            console.error('Error loading transports:', error);
        });
        
    // Also load warehouses for the combined sensor form
    fetch('api.php?action=get_warehouses')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const warehouseSelect = document.getElementById('dataWarehouseSelect');
                const combinedWarehouseSelect = document.getElementById('combinedWarehouseSelect');
                
                if (warehouseSelect) {
                    warehouseSelect.innerHTML = '<option value="">All Warehouses</option>' + 
                        data.data.map(w => `<option value="${w.warehouse_id}">${w.warehouse_name}</option>`).join('');
                }
                
                if (combinedWarehouseSelect) {
                    combinedWarehouseSelect.innerHTML = '<option value="">Select Warehouse</option>' + 
                        data.data.map(w => `<option value="${w.warehouse_id}">${w.warehouse_name}</option>`).join('');
                }
            }
        })
        .catch(error => {
            console.error('Error loading warehouses:', error);
        });
}

function onDataTransportChange() {
    // Clear warehouse selection when transport is selected
    const wSel = document.getElementById('dataWarehouseSelect');
    if (wSel) wSel.value = '';
    populateSensorSelect();
    loadSensorData();
}

function onDataWarehouseChange() {
    // Clear transport selection when warehouse is selected
    const tSel = document.getElementById('dataTransportSelect');
    if (tSel) tSel.value = '';
    populateSensorSelect();
    loadSensorData();
}

function clearAllFilters() {
    const tSel = document.getElementById('dataTransportSelect');
    const wSel = document.getElementById('dataWarehouseSelect');
    const sSel = document.getElementById('dataSensorSelect');
    const searchInput = document.getElementById('sensorDataSearch');
    
    if (tSel) tSel.value = '';
    if (wSel) wSel.value = '';
    if (sSel) sSel.value = '';
    if (searchInput) searchInput.value = '';
    
    populateSensorSelect();
    loadSensorData();
}

function populateSensorSelect() {
    const sensorSelect = document.getElementById('dataSensorSelect');
    if (!sensorSelect) return;
    sensorSelect.innerHTML = '<option value="">Select Sensor</option>';
    
    const tId = document.getElementById('dataTransportSelect')?.value || '';
    const wId = document.getElementById('dataWarehouseSelect')?.value || '';
    
    // Filter sensors based on transport or warehouse selection
    let filtered = sensors;
    if (tId) {
        filtered = sensors.filter(s => String(s.transport_id || '') === String(tId));
    } else if (wId) {
        filtered = sensors.filter(s => String(s.warehouse_id || '') === String(wId));
    }
    
    // Show filtered sensors with clear labeling
    filtered.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.sensor_id;
        const assignment = s.vehicle_license_no ? 
            `${s.vehicle_license_no} (${s.vehicle_type || 'Vehicle'})` : 
            `${s.warehouse_name || 'Unknown'} (Warehouse)`;
        opt.textContent = `S-${s.sensor_id} (${s.sensor_type}) - ${assignment}`;
        sensorSelect.appendChild(opt);
    });
}

function viewSensorData(sensorId, transportId) {
    if (!sensorId) return;
    const tId = transportId || (sensors.find(s => String(s.sensor_id) === String(sensorId))?.transport_id);
    goToSensorDataFor(sensorId, tId);
}

function goToSensorDataFor(sensorId, transportId) {
    const tSel = document.getElementById('dataTransportSelect');
    const sSel = document.getElementById('dataSensorSelect');
    if (tSel) tSel.value = String(transportId || '');
    populateSensorSelect();
    if (sSel) sSel.value = String(sensorId || '');
    switchTab('sensor-data');
    loadSensorData();
}

// ==================== HELPER FUNCTIONS ====================

function getCargoCondition(temperature, humidity) {
    if (temperature > 30 || temperature < 5) {
        return 'Critical';
    } else if (temperature > 35 || temperature < 10) {
        return 'Suboptimal';
    } else if (humidity > 80 || humidity < 30) {
        return 'Optimal';
    } else {
        return 'Normal';
    }
}

function getCargoConditionClass(temperature, humidity) {
    const condition = getCargoCondition(temperature, humidity);
    switch (condition) {
        case 'Critical': return 'condition-danger';
        case 'Suboptimal': return 'condition-warning';
        case 'Optimal': return 'condition-normal';
        case 'Normal': return 'condition-normal';
        default: return 'condition-normal';
    }
}

function getWarehouseCondition(temperature, humidity) {
    if (temperature > 25 || temperature < 2) {
        return 'Critical';
    } else if (temperature > 20 || temperature < 5) {
        return 'Warning';
    } else if (humidity > 75 || humidity < 35) {
        return 'Suboptimal';
    } else {
        return 'Normal';
    }
}

function getWarehouseConditionClass(temperature, humidity) {
    const condition = getWarehouseCondition(temperature, humidity);
    switch (condition) {
        case 'Critical': return 'condition-danger';
        case 'Warning': return 'condition-warning';
        case 'Suboptimal': return 'condition-warning';
        case 'Optimal': return 'condition-normal';
        case 'Normal': return 'condition-normal';
        default: return 'condition-normal';
    }
}

function isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

function formatTimeShort(timestamp) {
    try {
        const d = new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timestamp;
    }
}

// ==================== COMBINED SENSOR FUNCTIONS ====================

function setupCombinedSensorForm() {
    const form = document.getElementById('combinedSensorForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            addCombinedSensors();
        });
    }
}

function addCombinedSensors() {
    const transportId = document.getElementById('combinedTransportSelect').value;
    const warehouseId = document.getElementById('combinedWarehouseSelect').value;
    
    if (!transportId && !warehouseId) {
        showError('Please select either a transport or a warehouse');
        return;
    }
    
    if (transportId && warehouseId) {
        showError('Please select either a transport OR a warehouse, not both');
        return;
    }
    
    showLoading('sensorsLoading');
    
    fetch('api.php?action=add_combined_sensors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transport_id: transportId || null,
            warehouse_id: warehouseId || null
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading('sensorsLoading');
        if (data.success) {
            const assetType = transportId ? 'transport' : 'warehouse';
            const assetName = transportId ? 
                document.getElementById('combinedTransportSelect').options[document.getElementById('combinedTransportSelect').selectedIndex].text :
                document.getElementById('combinedWarehouseSelect').options[document.getElementById('combinedWarehouseSelect').selectedIndex].text;
            
            showSuccess(`Successfully added Temperature and Humidity sensors to ${assetType}: ${assetName}`);
            document.getElementById('combinedSensorForm').reset();
            loadSensors();
            loadSensorData();
            loadStats();
        } else {
            showError(data.message || 'Failed to add combined sensors');
        }
    })
    .catch(error => {
        hideLoading('sensorsLoading');
        console.error('Error adding combined sensors:', error);
        showError('Error adding combined sensors');
    });
}

// ==================== CHART FILTERING ====================

function setupChartFilters() {
    const chartFilters = document.querySelectorAll('input[name="chartFilter"]');
    chartFilters.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Chart filter changed to:', this.value);
            updateChart();
        });
    });
}

// ==================== VIEW OPTIONS FUNCTIONS ====================

function setupViewOptions() {
    const viewBothBtn = document.getElementById('viewBothBtn');
    const viewTransportBtn = document.getElementById('viewTransportBtn');
    const viewWarehouseBtn = document.getElementById('viewWarehouseBtn');
    
    if (viewBothBtn) {
        viewBothBtn.addEventListener('click', () => {
            setActiveView('both');
            filterDataByView('both');
        });
    }
    
    if (viewTransportBtn) {
        viewTransportBtn.addEventListener('click', () => {
            setActiveView('transport');
            filterDataByView('transport');
        });
    }
    
    if (viewWarehouseBtn) {
        viewWarehouseBtn.addEventListener('click', () => {
            setActiveView('warehouse');
            filterDataByView('warehouse');
        });
    }
}

function setActiveView(viewType) {
    const viewBothBtn = document.getElementById('viewBothBtn');
    const viewTransportBtn = document.getElementById('viewTransportBtn');
    const viewWarehouseBtn = document.getElementById('viewWarehouseBtn');
    
    // Remove active class from all buttons
    [viewBothBtn, viewTransportBtn, viewWarehouseBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    // Add active class to selected button
    switch (viewType) {
        case 'both':
            if (viewBothBtn) viewBothBtn.classList.add('active');
            break;
        case 'transport':
            if (viewTransportBtn) viewTransportBtn.classList.add('active');
            break;
        case 'warehouse':
            if (viewWarehouseBtn) viewWarehouseBtn.classList.add('active');
            break;
    }
}

function filterDataByView(viewType) {
    if (!sensorData || sensorData.length === 0) return;
    
    let filteredData = [];
    
    switch (viewType) {
        case 'both':
            filteredData = sensorData;
            break;
        case 'transport':
            filteredData = sensorData.filter(item => item.vehicle_license_no);
            break;
        case 'warehouse':
            filteredData = sensorData.filter(item => item.warehouse_name);
            break;
    }
    
    displaySensorData(filteredData);
    // Update chart with filtered data
    setTimeout(() => updateChart(), 100);
}