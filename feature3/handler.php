<?php
require_once '../common/db.php';

class TransportationPlanningHandler {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    // Get all shipments with transportation details (NO progress join)
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
                CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                h.harvest_name,
                pp.product_name
            FROM Shipments s
            JOIN Transports t ON s.transport_id = t.transport_id
            JOIN Drivers d    ON t.driver_id = d.driver_id
            LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
            LEFT JOIN Harvests h         ON hb.harvest_id = h.harvest_id
            LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
            LEFT JOIN Package_Products pp          ON ppb.packaged_product_batch_id = pp.packaged_product_batch_id
            ORDER BY s.shipment_date DESC
        ";
        $result = $this->conn->query($sql);
        $rows = [];
        if ($result && $result->num_rows > 0) {
            while ($r = $result->fetch_assoc()) $rows[] = $r;
        }
        return $rows;
    }

    // List all shipment progress rows (for the progress table)
    public function getAllShipmentProgress() {
        $sql = "
            SELECT
                sp.progress_id,
                sp.shipment_id,
                sp.dispatch_time,
                sp.destination,
                sp.current_location,
                sp.remaining_distance_km,
                sp.estimated_arrival_time,
                r.route_name
            FROM Shipment_Progress sp
            LEFT JOIN Routes r ON sp.route_id = r.route_id
            ORDER BY sp.dispatch_time DESC, sp.progress_id DESC
        ";
        $res = $this->conn->query($sql);
        $rows = [];
        if ($res && $res->num_rows > 0) {
            while ($r = $res->fetch_assoc()) $rows[] = $r;
        }
        return $rows;
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

    public function getAllRoutes() {
        $sql = "SELECT route_id, route_name, destination, duration, distance, road_condition
                FROM Routes
                ORDER BY destination, route_name";
        $res = $this->conn->query($sql);
        $rows = [];
        if ($res && $res->num_rows > 0) while ($r = $res->fetch_assoc()) $rows[] = $r;
        return $rows;
    }

    // Create shipment (no progress write here)
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

        if (!$stmt->execute()) { $stmt->close(); return false; }
        $shipment_id = $this->conn->insert_id;
        $stmt->close();
        return $shipment_id;
    }

    // Add transport
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

    // Add shipment progress (auto-fill seed defaults & ETA; also flip status to In Transit)
    public function addShipmentProgress($data) {
        $shipment_id = (int)$data['shipment_id'];
        $route_id = (int)$data['route_id'];
        $dispatch_time = $data['dispatch_time'] ?? null;

        if (!$shipment_id || !$route_id || !$dispatch_time) {
            return ['success' => false, 'error' => 'shipment_id, route_id and dispatch_time are required'];
        }

        // Get shipment destination
        $sql = "SELECT shipment_destination FROM Shipments WHERE shipment_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $shipment_id);
        $stmt->execute();
        $destRes = $stmt->get_result();
        $stmt->close();
        if (!$destRes || $destRes->num_rows === 0) {
            return ['success' => false, 'error' => 'Shipment not found'];
        }
        $shipment = $destRes->fetch_assoc();
        $destination = $shipment['shipment_destination'];

        // Ensure route matches destination
        $sql = "SELECT duration, destination AS route_destination FROM Routes WHERE route_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $route_id);
        $stmt->execute();
        $routeRes = $stmt->get_result();
        $stmt->close();
        if (!$routeRes || $routeRes->num_rows === 0) {
            return ['success' => false, 'error' => 'Route not found'];
        }
        $route = $routeRes->fetch_assoc();
        if (trim($route['route_destination']) !== trim($destination)) {
            return ['success' => false, 'error' => 'Selected route does not match shipment destination'];
        }

        // Seed defaults
        $sql = "SELECT default_current_location, default_remaining_distance_km
                FROM Route_Defaults WHERE route_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $route_id);
        $stmt->execute();
        $seedRes = $stmt->get_result();
        $stmt->close();

        $current_location = null;
        $remaining_km = null;
        if ($seedRes && $seedRes->num_rows > 0) {
            $seed = $seedRes->fetch_assoc();
            $current_location = $seed['default_current_location'];
            $remaining_km = $seed['default_remaining_distance_km'];
        }

        // Compute ETA = dispatch + route.duration (fallback 6h)
        $eta = null;
        $dur = $route['duration'];
        try {
            $dt = new DateTime($dispatch_time);
            if ($dur) {
                [$h, $m, $s] = array_map('intval', explode(':', $dur));
                $dt->modify("+{$h} hours +{$m} minutes +{$s} seconds");
            } else {
                $dt->modify("+6 hours");
            }
            $eta = $dt->format('Y-m-d H:i:s');
        } catch (Exception $e) {
            $eta = null;
        }

        // Insert progress row
        $stmt = $this->conn->prepare("
            INSERT INTO Shipment_Progress
              (shipment_id, route_id, dispatch_time, destination, current_location, remaining_distance_km, estimated_arrival_time)
            VALUES (?,?,?,?,?,?,?)
        ");
        $stmt->bind_param(
            "iisssds",
            $shipment_id,
            $route_id,
            $dispatch_time,
            $destination,
            $current_location,
            $remaining_km,
            $eta
        );
        $ok = $stmt->execute();
        $newId = $this->conn->insert_id;
        $stmt->close();

        if (!$ok) {
            return ['success' => false, 'error' => 'Failed to add shipment progress'];
        }

        // Flip status to "In Transit"
        $this->updateShipmentStatus($shipment_id, 'In Transit');

        return ['success' => true, 'id' => $newId];
    }

    // Update shipment (no progress write here)
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
                   transportation_cost=?
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
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
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

    public function deleteShipmentProgress($progress_id) {
    if (!$progress_id) return false;

    // 1) Look up the shipment_id before deleting
    $shipment_id = null;
    $stmt = $this->conn->prepare("SELECT shipment_id FROM Shipment_Progress WHERE progress_id = ?");
    $stmt->bind_param("i", $progress_id);
    if ($stmt->execute()) {
        $res = $stmt->get_result();
        if ($res && $res->num_rows > 0) {
            $shipment_id = (int)$res->fetch_assoc()['shipment_id'];
        }
    }
    $stmt->close();

    // 2) Delete the progress row
    $stmt = $this->conn->prepare("DELETE FROM Shipment_Progress WHERE progress_id = ?");
    $stmt->bind_param("i", $progress_id);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) return false;

    // 3) Flip the shipment status to 'Pending' (per requirement)
    if ($shipment_id) {
        $this->updateShipmentStatus($shipment_id, 'Pending');
    }

    return true;
}


    // Delete transport
    public function deleteTransport($transport_id) {
        $stmt = $this->conn->prepare("DELETE FROM Transports WHERE transport_id = ?");
        $stmt->bind_param("i", $transport_id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
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

    // Harvest batches for dropdown
    public function getAllHarvestBatches() {
        $sql = "SELECT hb.harvest_batch_id, hb.batch_number, h.harvest_name
                FROM Harvest_Batches hb
                JOIN Harvests h ON hb.harvest_id = h.harvest_id
                WHERE hb.status = 'Stored'
                ORDER BY hb.batch_number";
        $result = $this->conn->query($sql);
        $batches = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) $batches[] = $row;
        }
        return $batches;
    }

    // Packaged product batches for dropdown
    public function getAllPackagedProductBatches() {
        $sql = "SELECT ppb.packaged_product_batch_id, ppb.production_quantity, pp.product_name
                FROM Packaged_Product_Batches ppb
                JOIN Package_Products pp ON ppb.packaged_product_batch_id = pp.packaged_product_batch_id
                ORDER BY pp.product_name";
        $result = $this->conn->query($sql);
        $batches = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) $batches[] = $row;
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
            $likeCast = '%' . $digitsTrim . '%';
            $likePad  = '%' . $digits . '%';
            $likeFull = '%' . $raw . '%';

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
            $stmt->bind_param("ssss", $like, $like, $like, $like);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($r = $res->fetch_assoc()) $rows[] = $r;
        $stmt->close();
        return $rows;
    }

    // Stats / Status / Availability
    public function getTransportationStats() {
        $stats = [];

        $sql = "SELECT COUNT(*) as total_shipments FROM Shipments";
        $result = $this->conn->query($sql);
        $stats['total_shipments'] = $result->fetch_assoc()['total_shipments'];

        $sql = "SELECT COUNT(*) as active_transports FROM Transports";
        $result = $this->conn->query($sql);
        $stats['active_transports'] = $result->fetch_assoc()['active_transports'];

        $sql = "SELECT COUNT(*) AS available_drivers FROM Drivers d LEFT JOIN Transports t ON d.driver_id = t.driver_id WHERE t.driver_id IS NULL;";
        $result = $this->conn->query($sql);
        $stats['available_drivers'] = $result->fetch_assoc()['available_drivers'];

        $sql = "SELECT COUNT(*) as pending_shipments FROM Shipments WHERE status = 'Pending'";
        $result = $this->conn->query($sql);
        $stats['pending_shipments'] = $result->fetch_assoc()['pending_shipments'];

        return $stats;
    }

    public function updateShipmentStatus($shipment_id, $status) {
        $stmt = $this->conn->prepare("UPDATE Shipments SET status = ? WHERE shipment_id = ?");
        $stmt->bind_param("si", $status, $shipment_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

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
            while($row = $result->fetch_assoc()) $transports[] = $row;
        }
        return $transports;
    }
}
?>
