<?php
require_once '../common/db.php';

class TransportationPlanningHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all shipments with transportation details
    public function getAllShipments() {
        $sql = "
            SELECT
                s.shipment_id,
                s.shipment_date,
                s.shipment_destination,
                s.status,
                s.transport_id,
                s.harvest_batch_id,
                s.packaged_product_batch_id,
                s.transportation_cost,
                t.vehicle_type,
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,   -- FIX 1
                h.harvest_name,                                          -- FIX 2 (via join to Harvests)
                pp.product_name
            FROM Shipments s
            JOIN Transports t ON s.transport_id = t.transport_id
            JOIN Drivers d ON t.driver_id = d.driver_id
            LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
            LEFT JOIN Harvests h ON hb.harvest_id = h.harvest_id          -- FIX 2
            LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
            LEFT JOIN Package_Products pp ON ppb.packaged_product_batch_id = pp.packaged_product_batch_id  -- FIX 3
            ORDER BY s.shipment_date DESC
        ";
        
        $result = $this->conn->query($sql);
            if (!$result) {
                return ['error' => 'SQL error: ' . $this->conn->error];
            }
        $shipments = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        return $shipments;
    }
    
    // Get all transports with driver details
    public function getAllTransports() {
        $sql = "SELECT 
                    t.transport_id,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    t.current_capacity,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    d.phone_number as driver_phone,
                    d.driver_id
                FROM Transports t
                JOIN Drivers d ON t.driver_id = d.driver_id
                ORDER BY t.vehicle_type";
        
        $result = $this->conn->query($sql);
        $transports = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $transports[] = $row;
            }
        }
        
        return $transports;
    }
    
    // Add new shipment
    public function addShipment($data) {
        $cost = isset($data['transportation_cost']) ? $data['transportation_cost'] : null;
        $stmt = $this->conn->prepare("
            INSERT INTO Shipments
            (transport_id, harvest_batch_id, packaged_product_batch_id,
            shipment_date, shipment_destination, status, transportation_cost)
            VALUES (?,?,?,?,?,?,?)
        ");
        $stmt->bind_param(
            "iiisssd",
            $data['transport_id'],
            $data['harvest_batch_id'],
            $data['packaged_product_batch_id'],
            $data['shipment_date'],
            $data['shipment_destination'],
            $data['status'],
            $cost
        );
        if ($stmt->execute()) {
            $shipment_id = $this->conn->insert_id;
            $stmt->close();
            return $shipment_id;
        } else {
            $stmt->close();
            return false;
        }
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
            $stmt->close();
            return false;
        }
    }
    
    // Update shipment
    public function updateShipment($data) {
        $cost = isset($data['transportation_cost']) ? $data['transportation_cost'] : null;
        $stmt = $this->conn->prepare("
            UPDATE Shipments
            SET transport_id=?,
                harvest_batch_id=?,
                packaged_product_batch_id=?,
                shipment_date=?,
                shipment_destination=?,
                status=?,
                transportation_cost=?       -- NEW
            WHERE shipment_id=?
        ");
        $stmt->bind_param(
            "iiisssdi",
            $data['transport_id'],
            $data['harvest_batch_id'],
            $data['packaged_product_batch_id'],
            $data['shipment_date'],
            $data['shipment_destination'],
            $data['status'],
            $cost,
            $data['shipment_id']
        );
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Update transport
    public function updateTransport($transport_id, $driver_id, $vehicle_type, $vehicle_capacity, $current_capacity) {
        $stmt = $this->conn->prepare("UPDATE Transports SET driver_id = ?, vehicle_type = ?, vehicle_capacity = ?, current_capacity = ? WHERE transport_id = ?");
        $stmt->bind_param("isddi", $driver_id, $vehicle_type, $vehicle_capacity, $current_capacity, $transport_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete shipment
    public function deleteShipment($shipment_id) {
        $stmt = $this->conn->prepare("DELETE FROM Shipments WHERE shipment_id = ?");
        $stmt->bind_param("i", $shipment_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete transport
    public function deleteTransport($transport_id) {
        $stmt = $this->conn->prepare("DELETE FROM Transports WHERE transport_id = ?");
        $stmt->bind_param("i", $transport_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get all drivers for dropdown
    public function getAllDrivers() {
        $sql = "SELECT driver_id, CONCAT(first_name, ' ', last_name) as driver_name, phone_number FROM Drivers ORDER BY first_name";
        $result = $this->conn->query($sql);
        $drivers = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $drivers[] = $row;
            }
        }
        
        return $drivers;
    }
    
    // Get all harvest batches for dropdown
    public function getAllHarvestBatches() {
        $sql = "SELECT hb.harvest_batch_id, hb.batch_number, h.harvest_name 
                FROM Harvest_Batches hb 
                JOIN Harvests h ON hb.harvest_id = h.harvest_id 
                WHERE hb.status = 'Stored'
                ORDER BY hb.batch_number";
        $result = $this->conn->query($sql);
        $batches = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        return $batches;
    }
    
    // Get all packaged product batches for dropdown
    public function getAllPackagedProductBatches() {
        $sql = "SELECT ppb.packaged_product_batch_id, ppb.production_quantity, pp.product_name 
                FROM Packaged_Product_Batches ppb 
                JOIN Package_Products pp ON ppb.packaged_product_batch_id = pp.packaged_product_batch_id
                ORDER BY pp.product_name";
        $result = $this->conn->query($sql);
        $batches = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        return $batches;
    }
    
    // Search shipments
    public function searchShipments($term) {
    $raw = trim((string)$term);
    $like = '%' . mb_strtolower($raw, 'UTF-8') . '%';

    $digits = preg_replace('/\D+/', '', $raw);
    $digitsTrim = ltrim($digits, '0');
    if ($digitsTrim === '') { $digitsTrim = $digits; }

    if ($digits !== '') {
        // Numeric-ish: search by ID formats only
        $likeCast = '%' . $digitsTrim . '%';
        $likePad  = '%' . $digits . '%'; // zero-padded
        $likeFull = '%' . $raw . '%';    // e.g., "SH-000123"

        $sql = "
        SELECT 
            s.shipment_id, s.shipment_date, s.shipment_destination, s.status,
            t.vehicle_type, t.vehicle_capacity, t.current_capacity,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            d.phone_number AS driver_phone, h.harvest_name, pp.product_name
        FROM Shipments s
        JOIN Transports t ON s.transport_id = t.transport_id
        JOIN Drivers d    ON t.driver_id = d.driver_id
        LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
        LEFT JOIN Harvests h         ON hb.harvest_id = h.harvest_id
        LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
        LEFT JOIN Package_Products pp          ON ppb.packaged_product_batch_id = pp.packaged_product_batch_id
        WHERE CAST(s.shipment_id AS CHAR) LIKE ?
           OR LPAD(s.shipment_id, 6, '0') LIKE ?
           OR CONCAT('SH-', LPAD(s.shipment_id, 6, '0')) LIKE ?
        GROUP BY s.shipment_id
        ORDER BY s.shipment_date DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("sss", $likeCast, $likePad, $likeFull);
    } else {
        // Text: destination OR driver name OR vehicle type OR status (all case-insensitive)
        $sql = "
        SELECT 
            s.shipment_id, s.shipment_date, s.shipment_destination, s.status,
            t.vehicle_type, t.vehicle_capacity, t.current_capacity,
            CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
            d.phone_number AS driver_phone, h.harvest_name, pp.product_name
        FROM Shipments s
        JOIN Transports t ON s.transport_id = t.transport_id
        JOIN Drivers d    ON t.driver_id = d.driver_id
        LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
        LEFT JOIN Harvests h         ON hb.harvest_id = h.harvest_id
        LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
        LEFT JOIN Package_Products pp          ON ppb.packaged_product_batch_id = pp.packaged_product_batch_id
        WHERE LOWER(s.shipment_destination) LIKE ?
           OR LOWER(CONCAT(d.first_name, ' ', d.last_name)) LIKE ?
           OR LOWER(t.vehicle_type) LIKE ?
           OR LOWER(s.status) LIKE ?
        GROUP BY s.shipment_id
        ORDER BY s.shipment_date DESC";
        $stmt = $this->conn->prepare($sql);
        // 4 params here
        $stmt->bind_param("ssss", $like, $like, $like, $like);
    }

    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $stmt->close();
    return $rows;
}


    
    // Get transportation statistics
    public function getTransportationStats() {
        $stats = [];
        
        // Total shipments
        $sql = "SELECT COUNT(*) as total_shipments FROM Shipments";
        $result = $this->conn->query($sql);
        $stats['total_shipments'] = $result->fetch_assoc()['total_shipments'];
        
        // Active transports
        $sql = "SELECT COUNT(*) as active_transports FROM Transports";
        $result = $this->conn->query($sql);
        $stats['active_transports'] = $result->fetch_assoc()['active_transports'];
        
        // Available drivers
        $sql = "SELECT COUNT(*) AS available_drivers FROM Drivers d LEFT JOIN Transports t ON d.driver_id = t.driver_id WHERE t.driver_id IS NULL;";
        $result = $this->conn->query($sql);
        $stats['available_drivers'] = $result->fetch_assoc()['available_drivers'];
        
        // Pending shipments
        $sql = "SELECT COUNT(*) as pending_shipments FROM Shipments WHERE status = 'Pending'";
        $result = $this->conn->query($sql);
        $stats['pending_shipments'] = $result->fetch_assoc()['pending_shipments'];
        
        return $stats;
    }
    
    // Update shipment status
    public function updateShipmentStatus($shipment_id, $status) {
        $stmt = $this->conn->prepare("UPDATE Shipments SET status = ? WHERE shipment_id = ?");
        $stmt->bind_param("si", $status, $shipment_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get available transports (not currently assigned)
    public function getAvailableTransports() {
        $sql = "SELECT 
                    t.transport_id,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    t.current_capacity,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name
                FROM Transports t
                JOIN Drivers d ON t.driver_id = d.driver_id
                WHERE t.transport_id NOT IN (
                    SELECT DISTINCT transport_id FROM Shipments WHERE status IN ('Planned', 'In Transit')
                )
                ORDER BY t.vehicle_type";
        
        $result = $this->conn->query($sql);
        $transports = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $transports[] = $row;
            }
        }
        
        return $transports;
    }
}
?>

