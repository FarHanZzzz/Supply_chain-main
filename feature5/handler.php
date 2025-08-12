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
                    s.sensor_type
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
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
                    w.warehouse_name
                FROM Sensors s
                LEFT JOIN Warehouses w ON s.warehouse_id = w.warehouse_id
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
    public function addSensor($sensor_type, $warehouse_id) {
        $stmt = $this->conn->prepare("INSERT INTO Sensors (sensor_type, warehouse_id) VALUES (?, ?)");
        $stmt->bind_param("si", $sensor_type, $warehouse_id);
        
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
    public function updateSensor($sensor_id, $sensor_type, $warehouse_id) {
        $stmt = $this->conn->prepare("UPDATE Sensors SET sensor_type = ?, warehouse_id = ? WHERE sensor_id = ?");
        $stmt->bind_param("sii", $sensor_type, $warehouse_id, $sensor_id);
        
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
    
    // Get temperature/humidity alerts (values outside normal range)
    public function getTemperatureHumidityAlerts() {
        $sql = "SELECT 
                    sd.sensor_data_id,
                    sd.timestamp,
                    sd.temperature,
                    sd.humidity,
                    s.sensor_type,
                    w.warehouse_name,
                    CASE 
                        WHEN sd.temperature < 0 OR sd.temperature > 25 THEN 'Temperature Alert'
                        WHEN sd.humidity < 30 OR sd.humidity > 80 THEN 'Humidity Alert'
                        ELSE 'Normal'
                    END as alert_type
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                LEFT JOIN Warehouses w ON s.warehouse_id = w.warehouse_id
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
                    s.sensor_type
                FROM Sensor_Data sd
                LEFT JOIN Sensors s ON sd.sensor_id = s.sensor_id
                WHERE s.sensor_type LIKE ? 
                   OR sd.temperature LIKE ?
                   OR sd.humidity LIKE ?
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