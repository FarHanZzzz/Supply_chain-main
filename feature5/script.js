// Global variables
        let currentTab = 'sensors';
        let sensorData = [];
        let sensors = [];
        let alerts = [];

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            setupEventListeners();
            loadStats();
            switchTab('sensors');
        }

        function setupEventListeners() {
            // Tab navigation
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    switchTab(this.dataset.tab);
                });
            });

            // Search functionality
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
                        <td colspan="5" class="empty-state">
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
                    <td>${item.coordinates || 'N/A'}</td>
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

        function filterSensorData(searchTerm) {
            const filteredData = sensorData.filter(item => {
                const searchString = `${item.timestamp} ${item.temperature} ${item.humidity} ${item.coordinates}`.toLowerCase();
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
                    <td>${item.sensor_type || 'N/A'}</td>
                    <td>${item.warehouse_name || 'N/A'}</td>
                    <td>
                        <span class="condition-indicator condition-normal">
                            Active
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
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
                            <select id="warehouseSelect" required>
                                <option value="">Select Warehouse</option>
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
            
            document.getElementById('sensorForm').addEventListener('submit', handleAddSensor);
        }

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
                            <label for="editSensorType">Sensor Type:</label>
                            <select id="editSensorType" required>
                                <option value="Temperature" ${sensor.sensor_type === 'Temperature' ? 'selected' : ''}>Temperature</option>
                                <option value="Humidity" ${sensor.sensor_type === 'Humidity' ? 'selected' : ''}>Humidity</option>
                                <option value="Temperature/Humidity" ${sensor.sensor_type === 'Temperature/Humidity' ? 'selected' : ''}>Temperature/Humidity</option>
                                <option value="GPS" ${sensor.sensor_type === 'GPS' ? 'selected' : ''}>GPS</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editWarehouseSelect">Warehouse:</label>
                            <select id="editWarehouseSelect" required>
                                <option value="">Select Warehouse</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Update Sensor</button>
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            
            showModal(modalContent);
            loadWarehouseOptions('editWarehouseSelect', sensor.warehouse_id);
            
            document.getElementById('editSensorForm').addEventListener('submit', handleEditSensor);
        }

        function handleAddSensor(e) {
            e.preventDefault();
            
            const formData = {
                sensor_type: document.getElementById('sensorType').value,
                warehouse_id: document.getElementById('warehouseSelect').value
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
                    loadSensors();
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

        function handleEditSensor(e) {
            e.preventDefault();
            
            const formData = {
                sensor_id: document.getElementById('editSensorId').value,
                sensor_type: document.getElementById('editSensorType').value,
                warehouse_id: document.getElementById('editWarehouseSelect').value
            };
            
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
                    <td>${formatDateTime(item.timestamp)}</td>
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
                    <td>${item.warehouse_name || 'N/A'}</td>
                </tr>
            `).join('');
        }

        function refreshAlerts() {
            loadAlerts();
            showSuccess('Alerts refreshed');
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
            document.getElementById('totalSensors').textContent = stats.total_sensors || 0;
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

        function loadWarehouseOptions(selectId = 'warehouseSelect', selectedId = null) {
            fetch('api.php?action=get_warehouses')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const select = document.getElementById(selectId);
                        select.innerHTML = '<option value="">Select Warehouse</option>';
                        data.data.forEach(warehouse => {
                            const option = document.createElement('option');
                            option.value = warehouse.warehouse_id;
                            option.textContent = warehouse.warehouse_name;
                            if (selectedId && warehouse.warehouse_id == selectedId) {
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