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
                    t.vehicle_license_no,
                    t.vehicle_type
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
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
                    s.transport_id,
                    t.vehicle_license_no,
                    t.vehicle_type
                FROM Sensors s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
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
    public function addSensor($sensor_type, $transport_id) {
        // Prevent duplicate sensor type on same transport
        if ($this->isSensorTypeAssignedToTransport($sensor_type, $transport_id)) {
            return false;
        }
        $stmt = $this->conn->prepare("INSERT INTO Sensors (sensor_type, transport_id) VALUES (?, ?)");
        $stmt->bind_param("si", $sensor_type, $transport_id);
        
        if ($stmt->execute()) {
            $sensor_id = $this->conn->insert_id;
            $stmt->close();
            // Auto-generate 10 dummy records for this sensor
            $this->generateDummySensorData($sensor_id, 10);
            return $sensor_id;
        } else {
            error_log("Add sensor failed: " . $stmt->error);
            $stmt->close();
            return false;
        }
    }
    
    // Update sensor
    public function updateSensor($sensor_id, $sensor_type, $transport_id) {
        // Prevent duplicate sensor type on same transport when reassigning
        $stmtCheck = $this->conn->prepare("SELECT COUNT(*) as cnt FROM Sensors WHERE sensor_type = ? AND transport_id = ? AND sensor_id <> ?");
        $stmtCheck->bind_param("sii", $sensor_type, $transport_id, $sensor_id);
        $stmtCheck->execute();
        $res = $stmtCheck->get_result();
        $row = $res->fetch_assoc();
        $stmtCheck->close();
        if ($row && (int)$row['cnt'] > 0) {
            return false;
        }
        $stmt = $this->conn->prepare("UPDATE Sensors SET sensor_type = ?, transport_id = ? WHERE sensor_id = ?");
        $stmt->bind_param("sii", $sensor_type, $transport_id, $sensor_id);
        
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
    
    // ==================== HELPER METHODS ====================
    
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

    // Get all transports for dropdown
    public function getAllTransports() {
        $sql = "SELECT transport_id, vehicle_license_no, vehicle_type FROM Transports ORDER BY vehicle_license_no";
        $result = $this->conn->query($sql);
        $transports = [];

        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $transports[] = $row;
            }
        }

        return $transports;
    }
    
    // Get temperature/humidity alerts (values outside normal range)
    public function getTemperatureHumidityAlerts() {
        $sql = "SELECT 
                    sd.sensor_data_id,
                    sd.timestamp,
                    sd.temperature,
                    sd.humidity,
                    s.sensor_type,
                    t.vehicle_license_no,
                    CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 THEN 'Temperature Alert'
                        WHEN sd.humidity < 30 OR sd.humidity > 80 THEN 'Humidity Alert'
                        ELSE 'Normal'
                    END as alert_type
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
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
                    s.sensor_type,
                    t.vehicle_license_no
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                WHERE s.sensor_type LIKE ? 
                   OR sd.temperature LIKE ?
                   OR sd.humidity LIKE ?
                   OR t.vehicle_license_no LIKE ?
                ORDER BY sd.timestamp DESC");
        
        $stmt->bind_param("ssss", $searchTerm, $searchTerm, $searchTerm, $searchTerm);
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

    // Helper: check if a sensor type already assigned to the transport
    public function isSensorTypeAssignedToTransport($sensor_type, $transport_id) {
        $stmt = $this->conn->prepare("SELECT COUNT(*) as cnt FROM Sensors WHERE sensor_type = ? AND transport_id = ?");
        $stmt->bind_param("si", $sensor_type, $transport_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        return $row && (int)$row['cnt'] > 0;
    }

    // Generate dummy sensor data for a given sensor
    public function generateDummySensorData($sensor_id, $num_points = 24) {
        // Determine base now time
        $now = new \DateTime();

        // Determine what fields to generate based on sensor type
        $stmtType = $this->conn->prepare("SELECT sensor_type FROM Sensors WHERE sensor_id = ?");
        $stmtType->bind_param("i", $sensor_id);
        $stmtType->execute();
        $resultType = $stmtType->get_result();
        $sensor = $resultType->fetch_assoc();
        $stmtType->close();

        if (!$sensor) {
            return 0;
        }

        $type = $sensor['sensor_type'];

        $inserted = 0;
        for ($i = $num_points - 1; $i >= 0; $i--) {
            $time = clone $now;
            $time->modify('-' . ($i * 30) . ' minutes');
            $timestamp = $time->format('Y-m-d H:i:s');

            $temperature = null;
            $humidity = null;

            // Generate values in a realistic range with some variance
            if ($type === 'Temperature' || $type === 'Temperature/Humidity') {
                // Base around 5-10 C for cold chain, with occasional spikes
                $temperature = round(6 + sin($i / 3) * 1.5 + (mt_rand(-10, 10) / 10), 2);
                // 5% chance of abnormal spike
                if (mt_rand(1, 100) <= 5) {
                    $temperature += mt_rand(5, 12);
                }
            }

            if ($type === 'Humidity' || $type === 'Temperature/Humidity') {
                // Base around 55-65% humidity
                $humidity = round(60 + cos($i / 4) * 8 + (mt_rand(-15, 15) / 10), 2);
                // 5% chance of abnormal drop/spike
                if (mt_rand(1, 100) <= 5) {
                    $humidity += mt_rand(-25, 25);
                }
            }

            $stmt = $this->conn->prepare("INSERT INTO Sensor_Data (sensor_id, timestamp, temperature, humidity) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("issd", $sensor_id, $timestamp, $temperature, $humidity);
            // Note: binding types: i s s d → but we have two decimals; use 'isdd'
            $stmt->close();

            // Re-prepare with correct bind types
            $stmt2 = $this->conn->prepare("INSERT INTO Sensor_Data (sensor_id, timestamp, temperature, humidity) VALUES (?, ?, ?, ?)");
            $stmt2->bind_param("isdd", $sensor_id, $timestamp, $temperature, $humidity);
            if ($stmt2->execute()) {
                $inserted++;
            }
            $stmt2->close();
        }

        return $inserted;
    }
}
?>