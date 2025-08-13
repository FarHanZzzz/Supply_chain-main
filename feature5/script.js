// Global variables
        let currentTab = 'sensors';
        let sensorData = [];
        let sensors = [];
        let alerts = [];
        let transports = [];
        let chart = null;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            setupEventListeners();
            loadStats();
            loadTransports();
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

            // Dummy button removed

            const dataTransportSelect = document.getElementById('dataTransportSelect');
            if (dataTransportSelect) {
                dataTransportSelect.addEventListener('change', onDataTransportChange);
            }

            const dataSensorSelect = document.getElementById('dataSensorSelect');
            if (dataSensorSelect) {
                dataSensorSelect.addEventListener('change', loadSensorData);
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
                        const selectedTransportId = document.getElementById('dataTransportSelect')?.value || '';
                        const selectedSensorId = document.getElementById('dataSensorSelect')?.value || '';
                        let all = data.data || [];
                        if (selectedTransportId) {
                            all = all.filter(d => String(d.transport_id || '') === String(selectedTransportId));
                        }
                        if (selectedSensorId) {
                            all = all.filter(d => String(d.sensor_id || '') === String(selectedSensorId));
                        }
                        sensorData = all;
                        displaySensorData(sensorData);
                        updateChart(sensorData);
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
                            ${item.temperature ?? '—'}°C
                        </span>
                    </td>
                    <td>
                        <span class="condition-indicator ${getHumidityClass(item.humidity)}">
                            <i class="fas fa-tint"></i>
                            ${item.humidity ?? '—'}%
                        </span>
                    </td>
                    <td>${item.vehicle_license_no ? `${item.vehicle_license_no} (${item.vehicle_type || 'Vehicle'})` : 'N/A'}</td>
                    <td>${renderGoodsCondition(item.temperature, item.humidity)}</td>
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
                        populateSensorSelect();
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
                    <td>${item.vehicle_license_no ? `${item.vehicle_license_no} (${item.vehicle_type || 'Vehicle'})` : 'Unassigned'}</td>
                    <td>
                        <span class="condition-indicator condition-normal">
                            Active
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class=\"btn btn-sm btn-info\" onclick=\"viewSensorData(${item.sensor_id}, ${item.transport_id || 'null'})\">\n                                <i class=\"fas fa-chart-line\"></i>\n                                View Data\n                            </button>
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
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="transportSelect">Transport:</label>
                            <select id="transportSelect" required>
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
            loadTransportOptions();
            
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
                            <label>Sensor Type:</label>
                            <div class="condition-indicator condition-normal">${sensor.sensor_type}</div>
                            <input type="hidden" id="editSensorType" value="${sensor.sensor_type}">
                        </div>
                        <div class="form-group">
                            <label for="editTransportSelect">Transport:</label>
                            <select id="editTransportSelect" required>
                                <option value="">Select Transport</option>
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
            loadTransportOptions('editTransportSelect', sensor.transport_id);
            
            document.getElementById('editSensorForm').addEventListener('submit', handleEditSensor);
        }

        function handleAddSensor(e) {
            e.preventDefault();
            
            const sensorType = document.getElementById('sensorType').value;
            const transportId = document.getElementById('transportSelect').value;
            if (!sensorType || !transportId) {
                showError('Please select sensor type and transport');
                return;
            }
            const dup = sensors.some(s => String(s.transport_id || '') === String(transportId) && String(s.sensor_type) === String(sensorType));
            if (dup) {
                showError('This transport already has a sensor of the selected type');
                return;
            }
            const formData = { sensor_type: sensorType, transport_id: transportId };
            
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
                    const newSensorId = data.id;
                    closeModal();
                    loadSensors();
                    loadStats();
                    // Navigate to sensor data filtered
                    setTimeout(() => { goToSensorDataFor(newSensorId, transportId); }, 200);
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
            
            const sensorId = document.getElementById('editSensorId').value;
            const editType = document.getElementById('editSensorType').value;
            const editTransportId = document.getElementById('editTransportSelect').value;
            if (!editType || !editTransportId) {
                showError('Please select transport');
                return;
            }
            const dupEdit = sensors.some(s => String(s.transport_id || '') === String(editTransportId) && String(s.sensor_type) === String(editType) && String(s.sensor_id) !== String(sensorId));
            if (dupEdit) {
                showError('This transport already has a sensor of that type');
                return;
            }
            const formData = { sensor_id: sensorId, sensor_type: editType, transport_id: editTransportId };
            
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
                    <td>${item.vehicle_license_no || 'N/A'}</td>
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

        function loadTransports() {
            fetch('api.php?action=get_transports')
                .then(r => r.json())
                .then(json => {
                    if (json.success) {
                        transports = json.data || [];
                        const sel = document.getElementById('dataTransportSelect');
                        if (sel) {
                            sel.innerHTML = '<option value="">Select Transport</option>';
                            transports.forEach(t => {
                                const opt = document.createElement('option');
                                opt.value = t.transport_id;
                                opt.textContent = `${t.vehicle_license_no} (${t.vehicle_type})`;
                                sel.appendChild(opt);
                            });
                        }
                    }
                })
                .catch(e => console.error('Error loading transports', e));
        }

        function onDataTransportChange() {
            populateSensorSelect();
            loadSensorData();
        }

        function populateSensorSelect() {
            const sensorSelect = document.getElementById('dataSensorSelect');
            if (!sensorSelect) return;
            sensorSelect.innerHTML = '<option value="">Select Sensor</option>';
            const tId = document.getElementById('dataTransportSelect')?.value || '';
            const filtered = tId ? sensors.filter(s => String(s.transport_id || '') === String(tId)) : sensors;
            filtered.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.sensor_id;
                opt.textContent = `S-${s.sensor_id} (${s.sensor_type})`;
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

        // Dummy generation removed; created automatically on add

        function updateChart(rows) {
            const ctx = document.getElementById('sensorLineChart');
            if (!ctx) return;
            const sorted = [...rows].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
            const labels = sorted.map(r => formatTimeShort(r.timestamp));
            const temps = sorted.map(r => isFiniteNumber(r.temperature) ? Number(r.temperature) : null);
            const hums = sorted.map(r => isFiniteNumber(r.humidity) ? Number(r.humidity) : null);

            if (chart) {
                chart.data.labels = labels;
                chart.data.datasets[0].data = temps;
                chart.data.datasets[1].data = hums;
                chart.update();
                return;
            }

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Temperature (°C)',
                            data: temps,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239,68,68,0.2)',
                            tension: 0.3,
                            spanGaps: true
                        },
                        {
                            label: 'Humidity (%)',
                            data: hums,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59,130,246,0.2)',
                            tension: 0.3,
                            spanGaps: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: { beginAtZero: false }
                    }
                }
            });
        }

        function isFiniteNumber(v) {
            return v !== null && v !== undefined && v !== '' && isFinite(Number(v));
        }

        function formatTimeShort(dateString) {
            if (!dateString) return '';
            const d = new Date(dateString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }