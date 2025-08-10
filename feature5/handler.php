<?php
require_once '../common/db.php';

class TemperatureHumidityHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // ==================== SENSOR DATA OPERATIONS ====================
    
    // Get all sensor data with related information
    public function getAllSensorData() {
        if (!$this->conn || !$this->conn->ping()) {
            error_log("Database connection is not active");
            return [];
        }
    
        $sql = "SELECT 
                    sd.sensor_data_id,
                    sd.sensor_id,
                    sd.timestamp,
                    sd.temperature,
                    sd.humidity,
                    sd.travel_duration,
                    sd.coordinates,
                    s.sensor_type,
                    t.transport_id,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    sh.shipment_id,
                    sh.shipment_destination,
                    sh.status as shipment_status
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                LEFT JOIN Shipments sh ON t.transport_id = sh.transport_id
                ORDER BY sd.timestamp DESC";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            error_log("Sensor data query failed: " . $this->conn->error);
            return [];
        }
        
        $sensorData = [];
        while($row = $result->fetch_assoc()) {
            $sensorData[] = $row;
        }
        
        return $sensorData;
    }
    
    // Add new sensor data
    public function addSensorData($sensor_id, $timestamp, $temperature, $humidity, $travel_duration, $coordinates) {
        $stmt = $this->conn->prepare("INSERT INTO Sensor_Data (sensor_id, timestamp, temperature, humidity, travel_duration, coordinates) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isddis", $sensor_id, $timestamp, $temperature, $humidity, $travel_duration, $coordinates);
        
        if ($stmt->execute()) {
            $sensor_data_id = $this->conn->insert_id;
            $stmt->close();
            return $sensor_data_id;
        } else {
            error_log("Add sensor data failed: " . $stmt->error);
            $stmt->close();
            return false;
        }
    }
    
    // Update sensor data
    public function updateSensorData($sensor_data_id, $sensor_id, $timestamp, $temperature, $humidity, $travel_duration, $coordinates) {
        $stmt = $this->conn->prepare("UPDATE Sensor_Data SET sensor_id = ?, timestamp = ?, temperature = ?, humidity = ?, travel_duration = ?, coordinates = ? WHERE sensor_data_id = ?");
        $stmt->bind_param("isddisi", $sensor_id, $timestamp, $temperature, $humidity, $travel_duration, $coordinates, $sensor_data_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Update sensor data failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // Delete sensor data
    public function deleteSensorData($sensor_data_id) {
        $stmt = $this->conn->prepare("DELETE FROM Sensor_Data WHERE sensor_data_id = ?");
        $stmt->bind_param("i", $sensor_data_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Delete sensor data failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // ==================== SENSOR OPERATIONS ====================
    
    // Get all sensors
    public function getAllSensors() {
        $sql = "SELECT 
                    s.sensor_id,
                    s.sensor_type,
                    s.warehouse_id,
                    s.transport_id,
                    w.warehouse_name,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name
                FROM Sensors s
                LEFT JOIN Warehouses w ON s.warehouse_id = w.warehouse_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                ORDER BY s.sensor_id";
        
        $result = $this->conn->query($sql);
        $sensors = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $sensors[] = $row;
            }
        }
        
        return $sensors;
    }
    
    // Add new sensor
    public function addSensor($sensor_type, $warehouse_id, $transport_id) {
        $stmt = $this->conn->prepare("INSERT INTO Sensors (sensor_type, warehouse_id, transport_id) VALUES (?, ?, ?)");
        $stmt->bind_param("sii", $sensor_type, $warehouse_id, $transport_id);
        
        if ($stmt->execute()) {
            $sensor_id = $this->conn->insert_id;
            $stmt->close();
            return $sensor_id;
        } else {
            error_log("Add sensor failed: " . $stmt->error);
            $stmt->close();
            return false;
        }
    }
    
    // Update sensor
    public function updateSensor($sensor_id, $sensor_type, $warehouse_id, $transport_id) {
        $stmt = $this->conn->prepare("UPDATE Sensors SET sensor_type = ?, warehouse_id = ?, transport_id = ? WHERE sensor_id = ?");
        $stmt->bind_param("siii", $sensor_type, $warehouse_id, $transport_id, $sensor_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Update sensor failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // Delete sensor
    public function deleteSensor($sensor_id) {
        $stmt = $this->conn->prepare("DELETE FROM Sensors WHERE sensor_id = ?");
        $stmt->bind_param("i", $sensor_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Delete sensor failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // ==================== TRANSPORT OPERATIONS ====================
    
    // Get all transports
    public function getAllTransports() {
        $sql = "SELECT 
                    t.transport_id,
                    t.driver_id,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    t.current_capacity,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    d.phone_number as driver_phone
                FROM Transports t
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                ORDER BY t.transport_id";
        
        $result = $this->conn->query($sql);
        $transports = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $transports[] = $row;
            }
        }
        
        return $transports;
    }
    
    // Add new transport
    public function addTransport($driver_id, $vehicle_type, $vehicle_capacity, $current_capacity) {
        $stmt = $this->conn->prepare("INSERT INTO Transports (driver_id, vehicle_type, vehicle_capacity, current_capacity) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isdd", $driver_id, $vehicle_type, $vehicle_capacity, $current_capacity);
        
        if ($stmt->execute()) {
            $transport_id = $this->conn->insert_id;
            $stmt->close();
            return $transport_id;
        } else {
            error_log("Add transport failed: " . $stmt->error);
            $stmt->close();
            return false;
        }
    }
    
    // Update transport
    public function updateTransport($transport_id, $driver_id, $vehicle_type, $vehicle_capacity, $current_capacity) {
        $stmt = $this->conn->prepare("UPDATE Transports SET driver_id = ?, vehicle_type = ?, vehicle_capacity = ?, current_capacity = ? WHERE transport_id = ?");
        $stmt->bind_param("isddi", $driver_id, $vehicle_type, $vehicle_capacity, $current_capacity, $transport_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Update transport failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // Delete transport
    public function deleteTransport($transport_id) {
        $stmt = $this->conn->prepare("DELETE FROM Transports WHERE transport_id = ?");
        $stmt->bind_param("i", $transport_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Delete transport failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // ==================== SHIPMENT OPERATIONS ====================
    
    // Get all shipments
    public function getAllShipments() {
        $sql = "SELECT 
                    s.shipment_id,
                    s.transport_id,
                    s.harvest_batch_id,
                    s.packaged_product_batch_id,
                    s.shipment_date,
                    s.shipment_destination,
                    s.status,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    hb.batch_number as harvest_batch,
                    ppb.production_quantity
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
                LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
                ORDER BY s.shipment_date DESC";
        
        $result = $this->conn->query($sql);
        $shipments = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        return $shipments;
    }
    
    // Add new shipment
    public function addShipment($transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status) {
        $stmt = $this->conn->prepare("INSERT INTO Shipments (transport_id, harvest_batch_id, packaged_product_batch_id, shipment_date, shipment_destination, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiisss", $transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status);
        
        if ($stmt->execute()) {
            $shipment_id = $this->conn->insert_id;
            $stmt->close();
            return $shipment_id;
        } else {
            error_log("Add shipment failed: " . $stmt->error);
            $stmt->close();
            return false;
        }
    }
    
    // Update shipment
    public function updateShipment($shipment_id, $transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status) {
        $stmt = $this->conn->prepare("UPDATE Shipments SET transport_id = ?, harvest_batch_id = ?, packaged_product_batch_id = ?, shipment_date = ?, shipment_destination = ?, status = ? WHERE shipment_id = ?");
        $stmt->bind_param("iiisssi", $transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status, $shipment_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Update shipment failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // Delete shipment
    public function deleteShipment($shipment_id) {
        $stmt = $this->conn->prepare("DELETE FROM Shipments WHERE shipment_id = ?");
        $stmt->bind_param("i", $shipment_id);
        
        $result = $stmt->execute();
        if (!$result) {
            error_log("Delete shipment failed: " . $stmt->error);
        }
        $stmt->close();
        return $result;
    }
    
    // ==================== TRANSPORT MONITORING (MERGED VIEW) ====================
    
    // Get comprehensive transport monitoring data (main feature for perishable goods)
    public function getTransportMonitoringData() {
        if (!$this->conn || !$this->conn->ping()) {
            error_log("Database connection is not active");
            return [];
        }
    
        $sql = "SELECT 
                    t.transport_id,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    t.current_capacity,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    d.phone_number as driver_phone,
                    sh.shipment_id,
                    sh.shipment_destination,
                    sh.shipment_date,
                    sh.status as shipment_status,
                    s.sensor_id,
                    s.sensor_type,
                    sd.sensor_data_id,
                    sd.timestamp as last_reading_time,
                    sd.temperature,
                    sd.humidity,
                    sd.travel_duration,
                    sd.coordinates,
                    CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 THEN 'Temperature Alert'
                        WHEN sd.humidity < 30 OR sd.humidity > 80 THEN 'Humidity Alert'
                        ELSE 'Normal'
                    END as condition_status,
                    CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 OR sd.humidity < 30 OR sd.humidity > 80 THEN 'danger'
                        WHEN sd.temperature < 2 OR sd.temperature > 20 OR sd.humidity < 40 OR sd.humidity > 70 THEN 'warning'
                        ELSE 'normal'
                    END as alert_level,
                    hb.batch_number as harvest_batch,
                    ppb.production_quantity
                FROM Transports t
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                LEFT JOIN Shipments sh ON t.transport_id = sh.transport_id
                LEFT JOIN Sensors s ON t.transport_id = s.transport_id
                LEFT JOIN Sensor_Data sd ON s.sensor_id = sd.sensor_id
                LEFT JOIN Harvest_Batches hb ON sh.harvest_batch_id = hb.harvest_batch_id
                LEFT JOIN Packaged_Product_Batches ppb ON sh.packaged_product_batch_id = ppb.packaged_product_batch_id
                WHERE sd.sensor_data_id = (
                    SELECT MAX(sd2.sensor_data_id) 
                    FROM Sensor_Data sd2 
                    WHERE sd2.sensor_id = s.sensor_id
                )
                ORDER BY 
                    CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 OR sd.humidity < 30 OR sd.humidity > 80 THEN 1
                        WHEN sd.temperature < 2 OR sd.temperature > 20 OR sd.humidity < 40 OR sd.humidity > 70 THEN 2
                        ELSE 3
                    END,
                    sd.timestamp DESC";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            error_log("Transport monitoring query failed: " . $this->conn->error);
            return [];
        }
        
        $monitoringData = [];
        while($row = $result->fetch_assoc()) {
            $monitoringData[] = $row;
        }
        
        return $monitoringData;
    }
    
    // Get active transports with current sensor readings
    public function getActiveTransportsWithSensors() {
        $sql = "SELECT DISTINCT
                    t.transport_id,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    sh.shipment_destination,
                    sh.status as shipment_status,
                    COUNT(s.sensor_id) as sensor_count,
                    AVG(sd.temperature) as avg_temperature,
                    AVG(sd.humidity) as avg_humidity,
                    MAX(sd.timestamp) as last_update,
                    SUM(CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 OR sd.humidity < 30 OR sd.humidity > 80 
                        THEN 1 ELSE 0 
                    END) as alert_count
                FROM Transports t
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                LEFT JOIN Shipments sh ON t.transport_id = sh.transport_id
                LEFT JOIN Sensors s ON t.transport_id = s.transport_id
                LEFT JOIN Sensor_Data sd ON s.sensor_id = sd.sensor_id
                WHERE sh.status IN ('pending', 'in transit')
                AND sd.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY t.transport_id, t.vehicle_type, driver_name, sh.shipment_destination, sh.status
                ORDER BY alert_count DESC, last_update DESC";
        
        $result = $this->conn->query($sql);
        $activeTransports = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $activeTransports[] = $row;
            }
        }
        
        return $activeTransports;
    }
    
    // Get detailed sensor readings for a specific transport
    public function getTransportSensorHistory($transport_id, $hours = 24) {
        $stmt = $this->conn->prepare("SELECT 
                    sd.sensor_data_id,
                    sd.timestamp,
                    sd.temperature,
                    sd.humidity,
                    sd.coordinates,
                    s.sensor_type,
                    s.sensor_id
                FROM Sensor_Data sd
                JOIN Sensors s ON sd.sensor_id = s.sensor_id
                WHERE s.transport_id = ?
                AND sd.timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY sd.timestamp DESC");
        
        $stmt->bind_param("ii", $transport_id, $hours);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $history = [];
        while($row = $result->fetch_assoc()) {
            $history[] = $row;
        }
        
        $stmt->close();
        return $history;
    }
    
    // Get critical alerts for dashboard
    public function getCriticalAlerts() {
        $sql = "SELECT 
                    t.transport_id,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    sh.shipment_destination,
                    sd.temperature,
                    sd.humidity,
                    sd.timestamp,
                    s.sensor_type,
                    CASE 
                        WHEN sd.temperature < 0 THEN 'Freezing Temperature'
                        WHEN sd.temperature > 25 THEN 'High Temperature'
                        WHEN sd.humidity < 30 THEN 'Low Humidity'
                        WHEN sd.humidity > 80 THEN 'High Humidity'
                        ELSE 'Unknown Alert'
                    END as alert_message
                FROM Sensor_Data sd
                JOIN Sensors s ON sd.sensor_id = s.sensor_id
                JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                LEFT JOIN Shipments sh ON t.transport_id = sh.transport_id
                WHERE (sd.temperature < 0 OR sd.temperature > 25 OR sd.humidity < 30 OR sd.humidity > 80)
                AND sd.timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                AND sh.status IN ('pending', 'in transit')
                ORDER BY sd.timestamp DESC
                LIMIT 10";
        
        $result = $this->conn->query($sql);
        $alerts = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $alerts[] = $row;
            }
        }
        
        return $alerts;
    }

    // ==================== HELPER METHODS ====================
    
    // Get all drivers for dropdown
    public function getAllDrivers() {
        $sql = "SELECT driver_id, CONCAT(first_name, ' ', last_name) as driver_name FROM Drivers ORDER BY first_name";
        $result = $this->conn->query($sql);
        $drivers = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $drivers[] = $row;
            }
        }
        
        return $drivers;
    }
    
    // Get all warehouses for dropdown
    public function getAllWarehouses() {
        $sql = "SELECT warehouse_id, warehouse_name FROM Warehouses ORDER BY warehouse_name";
        $result = $this->conn->query($sql);
        $warehouses = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $warehouses[] = $row;
            }
        }
        
        return $warehouses;
    }
    
    // Get all harvest batches for dropdown
    public function getAllHarvestBatches() {
        $sql = "SELECT harvest_batch_id, batch_number FROM Harvest_Batches ORDER BY batch_number";
        $result = $this->conn->query($sql);
        $batches = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        return $batches;
    }
    
    // Get all packaged product batches for dropdown
    public function getAllPackagedProductBatches() {
        $sql = "SELECT packaged_product_batch_id, production_quantity FROM Packaged_Product_Batches ORDER BY packaged_product_batch_id";
        $result = $this->conn->query($sql);
        $batches = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        return $batches;
    }
    
    // Get temperature/humidity alerts (values outside normal range)
    public function getTemperatureHumidityAlerts() {
        $sql = "SELECT 
                    sd.sensor_data_id,
                    sd.timestamp,
                    sd.temperature,
                    sd.humidity,
                    s.sensor_type,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    sh.shipment_destination,
                    CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 THEN 'Temperature Alert'
                        WHEN sd.humidity < 30 OR sd.humidity > 80 THEN 'Humidity Alert'
                        ELSE 'Normal'
                    END as alert_type
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                LEFT JOIN Shipments sh ON t.transport_id = sh.transport_id
                WHERE (sd.temperature < 0 OR sd.temperature > 25 OR sd.humidity < 30 OR sd.humidity > 80)
                ORDER BY sd.timestamp DESC";
        
        $result = $this->conn->query($sql);
        $alerts = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $alerts[] = $row;
            }
        }
        
        return $alerts;
    }
    
    // Get statistics for dashboard
    public function getStats() {
        $stats = [];
        
        // Total sensor data records
        $sql = "SELECT COUNT(*) as total_sensor_data FROM Sensor_Data";
        $result = $this->conn->query($sql);
        $stats['total_sensor_data'] = $result->fetch_assoc()['total_sensor_data'];
        
        // Total sensors
        $sql = "SELECT COUNT(*) as total_sensors FROM Sensors";
        $result = $this->conn->query($sql);
        $stats['total_sensors'] = $result->fetch_assoc()['total_sensors'];
        
        // Total transports
        $sql = "SELECT COUNT(*) as total_transports FROM Transports";
        $result = $this->conn->query($sql);
        $stats['total_transports'] = $result->fetch_assoc()['total_transports'];
        
        // Total shipments
        $sql = "SELECT COUNT(*) as total_shipments FROM Shipments";
        $result = $this->conn->query($sql);
        $stats['total_shipments'] = $result->fetch_assoc()['total_shipments'];
        
        // Active shipments
        $sql = "SELECT COUNT(*) as active_shipments FROM Shipments WHERE status IN ('Pending', 'In Transit')";
        $result = $this->conn->query($sql);
        $stats['active_shipments'] = $result->fetch_assoc()['active_shipments'];
        
        // Temperature alerts (last 24 hours)
        $sql = "SELECT COUNT(*) as temp_alerts FROM Sensor_Data WHERE (temperature < 0 OR temperature > 25) AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
        $result = $this->conn->query($sql);
        $stats['temp_alerts'] = $result->fetch_assoc()['temp_alerts'];
        
        // Humidity alerts (last 24 hours)
        $sql = "SELECT COUNT(*) as humidity_alerts FROM Sensor_Data WHERE (humidity < 30 OR humidity > 80) AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
        $result = $this->conn->query($sql);
        $stats['humidity_alerts'] = $result->fetch_assoc()['humidity_alerts'];
        
        return $stats;
    }
    
    // Search sensor data
    public function searchSensorData($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';
        $stmt = $this->conn->prepare("SELECT 
                    sd.sensor_data_id,
                    sd.sensor_id,
                    sd.timestamp,
                    sd.temperature,
                    sd.humidity,
                    sd.travel_duration,
                    sd.coordinates,
                    s.sensor_type,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                WHERE s.sensor_type LIKE ? 
                   OR t.vehicle_type LIKE ?
                   OR CONCAT(d.first_name, ' ', d.last_name) LIKE ?
                ORDER BY sd.timestamp DESC");
        
        $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $sensorData = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $sensorData[] = $row;
            }
        }
        
        $stmt->close();
        return $sensorData;
    }
}
?>

