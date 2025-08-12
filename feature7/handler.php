<?php
require_once '../common/db.php';

class AnalyticsHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    // ===== DELIVERIES CRUD OPERATIONS =====
    
    public function getAllDeliveries() {
        $sql = "
        SELECT 
            delivery_id,
            vehicle_license_no,
            delivery_date,
            delivery_time,
            delivery_man_name,
            expected_time,
            delivered_time,
            spoilage_quantity,
            delivery_status,
            delivery_success
        FROM Deliveries 
        ORDER BY delivery_id DESC
        ";
        $result = $this->conn->query($sql);
        
        if (!$result) {
            error_log("Database error in getAllDeliveries: " . $this->conn->error);
            return [];
        }
        
        $deliveries = [];
        while ($row = $result->fetch_assoc()) {
            $deliveries[] = $row;
        }
        
        error_log("getAllDeliveries found " . count($deliveries) . " records");
        return $deliveries;
    }

    public function addDelivery($data) {
        $vehicleLicense = $data['vehicle_license_no'] ?? null; // optional
        $stmt = $this->conn->prepare("
            INSERT INTO Deliveries (
                vehicle_license_no, 
                delivery_date, 
                delivery_time, 
                delivery_man_name, 
                expected_time, 
                delivered_time, 
                spoilage_quantity, 
                delivery_status, 
                delivery_success
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("ssssssiss", 
            $vehicleLicense,
            $data['delivery_date'],
            $data['delivery_time'],
            $data['delivery_man_name'],
            $data['expected_time'],
            $data['delivered_time'],
            $data['spoilage_quantity'],
            $data['delivery_status'],
            $data['delivery_success']
        );
        $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
        return $id;
    }

    public function updateDelivery($id, $data) {
        $vehicleLicense = $data['vehicle_license_no'] ?? null; // optional
        $stmt = $this->conn->prepare("
            UPDATE Deliveries SET 
                vehicle_license_no = ?, 
                delivery_date = ?, 
                delivery_time = ?, 
                delivery_man_name = ?, 
                expected_time = ?, 
                delivered_time = ?, 
                spoilage_quantity = ?, 
                delivery_status = ?, 
                delivery_success = ?
            WHERE delivery_id = ?
        ");
        $stmt->bind_param("ssssssissi", 
            $vehicleLicense,
            $data['delivery_date'],
            $data['delivery_time'],
            $data['delivery_man_name'],
            $data['expected_time'],
            $data['delivered_time'],
            $data['spoilage_quantity'],
            $data['delivery_status'],
            $data['delivery_success'],
            $id
        );
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $affected > 0;
    }

    public function deleteDelivery($id) {
        $stmt = $this->conn->prepare("DELETE FROM Deliveries WHERE delivery_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $affected > 0;
    }

    public function getDeliveryById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM Deliveries WHERE delivery_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $delivery = $result->fetch_assoc();
        $stmt->close();
        return $delivery;
    }

    // ===== TRANSPORTS CRUD OPERATIONS =====
    
    public function getAllTransports() {
        $sql = "
        SELECT 
            t.transport_id,
            t.driver_id,
            t.vehicle_license_no,
            t.vehicle_type,
            t.vehicle_capacity,
            t.vehicle_status,
            d.first_name,
            d.last_name,
            d.phone_number
        FROM Transports t
        LEFT JOIN Drivers d ON t.driver_id = d.driver_id
        ORDER BY t.transport_id DESC
        ";
        $result = $this->conn->query($sql);
        
        if (!$result) {
            error_log("Database error in getAllTransports: " . $this->conn->error);
            return [];
        }
        
        $transports = [];
        while ($row = $result->fetch_assoc()) {
            // Calculate carrier reliability for each transport
            $row['carrier_reliability'] = $this->calculateCarrierReliability($row['transport_id']);
            $transports[] = $row;
        }
        
        error_log("getAllTransports found " . count($transports) . " records");
        return $transports;
    }

    private function assertUniqueVehicleLicense(?string $vehicleLicense, ?int $ignoreTransportId = null): void {
        if ($vehicleLicense === null || $vehicleLicense === '') return;
        $sql = "SELECT transport_id FROM Transports WHERE vehicle_license_no = ?" . ($ignoreTransportId ? " AND transport_id <> ?" : "");
        $stmt = $this->conn->prepare($sql);
        if ($ignoreTransportId) {
            $stmt->bind_param("si", $vehicleLicense, $ignoreTransportId);
        } else {
            $stmt->bind_param("s", $vehicleLicense);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        $exists = $res && $res->num_rows > 0;
        $stmt->close();
        if ($exists) {
            throw new Exception('Vehicle license already exists. It must be unique.');
        }
    }

    public function addTransport($data) {
        // Validate license format (e.g., ABC-123 or ABC-1234)
        $vehicleLicense = strtoupper(trim($data['vehicle_license_no']));
        if (!preg_match('/^[A-Z]{3}-\d{3,4}$/', $vehicleLicense)) {
            throw new Exception('Invalid vehicle license format. Use ABC-123 or ABC-1234');
        }
        $this->assertUniqueVehicleLicense($vehicleLicense, null);

        $stmt = $this->conn->prepare("
            INSERT INTO Transports (
                driver_id, 
                vehicle_type, 
                vehicle_license_no, 
                vehicle_capacity, 
                vehicle_status
            ) VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("issds", 
            $data['driver_id'],
            $data['vehicle_type'],
            $vehicleLicense,
            $data['vehicle_capacity'],
            $data['vehicle_status']
        );
        $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
        return $id;
    }

    public function updateTransport($id, $data) {
        $vehicleLicense = strtoupper(trim($data['vehicle_license_no']));
        if (!preg_match('/^[A-Z]{3}-\d{3,4}$/', $vehicleLicense)) {
            throw new Exception('Invalid vehicle license format. Use ABC-123 or ABC-1234');
        }
        $this->assertUniqueVehicleLicense($vehicleLicense, $id);

        $stmt = $this->conn->prepare("
            UPDATE Transports SET 
                driver_id = ?, 
                vehicle_type = ?, 
                vehicle_license_no = ?, 
                vehicle_capacity = ?, 
                vehicle_status = ?
            WHERE transport_id = ?
        ");
        $stmt->bind_param("issdsi", 
            $data['driver_id'],
            $data['vehicle_type'],
            $vehicleLicense,
            $data['vehicle_capacity'],
            $data['vehicle_status'],
            $id
        );
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $affected > 0;
    }

    public function deleteTransport($id) {
        $stmt = $this->conn->prepare("DELETE FROM Transports WHERE transport_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();
        return $affected > 0;
    }

    public function getTransportById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM Transports WHERE transport_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $transport = $result->fetch_assoc();
        $stmt->close();
        return $transport;
    }

    // ===== DROPDOWN DATA =====
    
    public function getDriversDropdown() {
        $sql = "SELECT driver_id, first_name, last_name, phone_number FROM Drivers ORDER BY first_name, last_name";
        $result = $this->conn->query($sql);
        $drivers = [];
        while ($row = $result->fetch_assoc()) {
            $drivers[] = [
                'id' => $row['driver_id'],
                'label' => $row['first_name'] . ' ' . $row['last_name'] . ' (' . $row['phone_number'] . ')'
            ];
        }
        return $drivers;
    }

    // Get vehicle types from existing transports
    public function getVehicleTypesDropdown() {
        $sql = "SELECT DISTINCT vehicle_type FROM Transports WHERE vehicle_type IS NOT NULL AND vehicle_type != '' ORDER BY vehicle_type";
        $result = $this->conn->query($sql);
        $vehicleTypes = [];
        while ($row = $result->fetch_assoc()) {
            $vehicleTypes[] = $row['vehicle_type'];
        }
        
        // If no vehicle types found, return some common defaults
        if (empty($vehicleTypes)) {
            $vehicleTypes = ['Truck', 'Van', 'Refrigerated Truck', 'Container Truck', 'Pickup Truck'];
        }
        
        return $vehicleTypes;
    }

    // Get vehicle capacities from existing transports
    public function getVehicleCapacitiesDropdown() {
        $sql = "SELECT DISTINCT vehicle_capacity FROM Transports WHERE vehicle_capacity IS NOT NULL AND vehicle_capacity > 0 ORDER BY vehicle_capacity";
        $result = $this->conn->query($sql);
        $capacities = [];
        while ($row = $result->fetch_assoc()) {
            $capacities[] = $row['vehicle_capacity'];
        }
        
        // If no capacities found, return some common defaults
        if (empty($capacities)) {
            $capacities = [1000, 2000, 3000, 5000, 10000, 15000, 20000];
        }
        
        return $capacities;
    }

    // ===== KPI CALCULATIONS =====
    
    public function getKPIs() {
        $kpis = [];
        
        // Delivery KPIs (on-time/late/success + spoilage)
        $sql = "SELECT 
            COUNT(*) as total_deliveries,
            SUM(CASE WHEN delivery_status = 'on time' THEN 1 ELSE 0 END) as on_time_deliveries,
            SUM(CASE WHEN delivery_status = 'late' THEN 1 ELSE 0 END) as late_deliveries,
            SUM(CASE WHEN delivery_success = 'successful' THEN 1 ELSE 0 END) as successful_deliveries,
            SUM(CASE WHEN delivery_success = 'unsuccessful' THEN 1 ELSE 0 END) as unsuccessful_deliveries,
            SUM(spoilage_quantity) as total_spoilage
        FROM Deliveries";
        $result = $this->conn->query($sql);
        $row = $result->fetch_assoc();
        
        $kpis['total_deliveries'] = (int)$row['total_deliveries'];
        $kpis['on_time_deliveries'] = (int)$row['on_time_deliveries'];
        $kpis['late_deliveries'] = (int)$row['late_deliveries'];
        $kpis['successful_deliveries'] = (int)$row['successful_deliveries'];
        $kpis['unsuccessful_deliveries'] = (int)$row['unsuccessful_deliveries'];
        $kpis['total_spoilage'] = (int)$row['total_spoilage'];
        
        // Transport KPIs + Carrier reliability based on Shipments delivered
        $sql = "SELECT 
            COUNT(*) as total_transports,
            SUM(CASE WHEN vehicle_status = 'available' THEN 1 ELSE 0 END) as available_vehicles,
            SUM(CASE WHEN vehicle_status = 'in-use' THEN 1 ELSE 0 END) as in_use_vehicles,
            SUM(CASE WHEN vehicle_status = 'needs repair' THEN 1 ELSE 0 END) as needs_repair_vehicles,
            SUM(CASE WHEN vehicle_status = 'under maintenance' THEN 1 ELSE 0 END) as under_maintenance_vehicles
        FROM Transports";
        $result = $this->conn->query($sql);
        $row = $result->fetch_assoc();
        
        $kpis['total_transports'] = (int)$row['total_transports'];
        $kpis['available_vehicles'] = (int)$row['available_vehicles'];
        $kpis['in_use_vehicles'] = (int)$row['in_use_vehicles'];
        $kpis['needs_repair_vehicles'] = (int)$row['needs_repair_vehicles'];
        $kpis['under_maintenance_vehicles'] = (int)$row['under_maintenance_vehicles'];

        // Overall carrier reliability from shipments
        $sql = "SELECT 
            COUNT(*) AS total_shipments,
            SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_shipments
        FROM Shipments";
        $res = $this->conn->query($sql);
        $ship = $res->fetch_assoc();
        $totalShipments = (int)$ship['total_shipments'];
        $deliveredShipments = (int)$ship['delivered_shipments'];
        $kpis['carrier_reliability'] = $totalShipments > 0 ? round(($deliveredShipments / $totalShipments) * 100, 2) : 0;
        
        return $kpis;
    }

    // Calculate carrier reliability for a specific transport
    private function calculateCarrierReliability($transportId) {
        // Get total shipments and successful shipments for this transport
        $sql = "SELECT 
            COUNT(*) as total_shipments,
            SUM(CASE WHEN s.status = 'Delivered' THEN 1 ELSE 0 END) as successful_shipments
        FROM Shipments s
        WHERE s.transport_id = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $transportId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        $totalShipments = (int)$row['total_shipments'];
        $successfulShipments = (int)$row['successful_shipments'];
        
        if ($totalShipments > 0) {
            return round(($successfulShipments / $totalShipments) * 100, 2);
        }
        return 0;
    }

    // ===== CHART DATA =====
    
    public function getDeliveryChartData() {
        $sql = "SELECT 
            delivery_status,
            COUNT(*) as count
        FROM Deliveries 
        GROUP BY delivery_status";
        $result = $this->conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[$row['delivery_status']] = (int)$row['count'];
        }
        return $data;
    }

    public function getVehicleStatusChartData() {
        $sql = "SELECT 
            vehicle_status,
            COUNT(*) as count
        FROM Transports 
        GROUP BY vehicle_status";
        $result = $this->conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[$row['vehicle_status']] = (int)$row['count'];
        }
        return $data;
    }

    public function getSpoilageChartData() {
        $sql = "SELECT 
            CASE 
                WHEN spoilage_quantity = 0 THEN 'No Spoilage'
                WHEN spoilage_quantity BETWEEN 1 AND 5 THEN 'Low (1-5)'
                WHEN spoilage_quantity BETWEEN 6 AND 10 THEN 'Medium (6-10)'
                ELSE 'High (>10)'
            END as spoilage_category,
            COUNT(*) as count
        FROM Deliveries 
        GROUP BY spoilage_category
        ORDER BY 
            CASE spoilage_category
                WHEN 'No Spoilage' THEN 1
                WHEN 'Low (1-5)' THEN 2
                WHEN 'Medium (6-10)' THEN 3
                WHEN 'High (>10)' THEN 4
            END";
        $result = $this->conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[$row['spoilage_category']] = (int)$row['count'];
        }
        return $data;
    }

    public function getReliabilityTrendData() {
        // Get reliability data over time (last 6 months)
        $sql = "SELECT 
            DATE_FORMAT(delivery_date, '%Y-%m') as month,
            COUNT(*) as total_deliveries,
            SUM(CASE WHEN delivery_success = 'successful' THEN 1 ELSE 0 END) as successful_deliveries
        FROM Deliveries 
        WHERE delivery_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(delivery_date, '%Y-%m')
        ORDER BY month";
        $result = $this->conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $successRate = $row['total_deliveries'] > 0 ? 
                round(($row['successful_deliveries'] / $row['total_deliveries']) * 100, 2) : 0;
            $data[] = [
                'month' => $row['month'],
                'reliability' => $successRate
            ];
        }
        return $data;
    }
}
?>

