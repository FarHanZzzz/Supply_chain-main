<?php
require_once '../common/db.php';

class ShipmentManagementHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all shipments with their details
    public function getAllShipments() {

        // s = shipments , t = transports , hb = harvest_batches , ppb = packaged_product_batches
        $sql = "SELECT 
                    s.shipment_id,
                    s.transport_id,
                    s.harvest_batch_id,
                    s.packaged_product_batch_id,
                    s.shipment_date,
                    s.shipment_destination,
                    s.status,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    hb.batch_number as harvest_batch_number,
                    ppb.production_quantity
                FROM shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
                LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
                ORDER BY s.shipment_date DESC";
        
        $result = $this->conn->query($sql);
        $shipments = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        return $shipments;
    }
    
    // Get shipment statistics
    public function getShipmentStats() {
        $stats = [];
        
        // Total shipments
        $sql = "SELECT COUNT(*) as total_shipments FROM shipments";
        $result = $this->conn->query($sql);
        $stats['total_shipments'] = $result->fetch_assoc()['total_shipments'];
        
        // Pending shipments
        $sql = "SELECT COUNT(*) as pending_shipments FROM shipments WHERE status = 'Pending'";
        $result = $this->conn->query($sql);
        $stats['pending_shipments'] = $result->fetch_assoc()['pending_shipments'];
        
        // In transit shipments
        $sql = "SELECT COUNT(*) as in_transit_shipments FROM shipments WHERE status = 'In Transit'";
        $result = $this->conn->query($sql);
        $stats['in_transit_shipments'] = $result->fetch_assoc()['in_transit_shipments'];
        
        // Delivered shipments
        $sql = "SELECT COUNT(*) as delivered_shipments FROM shipments WHERE status = 'Delivered'";
        $result = $this->conn->query($sql);
        $stats['delivered_shipments'] = $result->fetch_assoc()['delivered_shipments'];
        
        return $stats;
    }
    
    // Add new shipment
    public function addShipment($transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status) {
        $stmt = $this->conn->prepare("INSERT INTO shipments (transport_id, harvest_batch_id, packaged_product_batch_id, shipment_date, shipment_destination, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iiisss", $transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status);
        
        if ($stmt->execute()) {
            $shipment_id = $this->conn->insert_id;
            $stmt->close();
            return $shipment_id;
        } else {
            $stmt->close();
            return false;
        }
    }
    
    // Update shipment
    public function updateShipment($shipment_id, $transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status) {
        $stmt = $this->conn->prepare("UPDATE shipments SET transport_id = ?, harvest_batch_id = ?, packaged_product_batch_id = ?, shipment_date = ?, shipment_destination = ?, status = ? WHERE shipment_id = ?");
        $stmt->bind_param("iiisssi", $transport_id, $harvest_batch_id, $packaged_product_batch_id, $shipment_date, $shipment_destination, $status, $shipment_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete shipment
    public function deleteShipment($shipment_id) {
        $stmt = $this->conn->prepare("DELETE FROM shipments WHERE shipment_id = ?");
        $stmt->bind_param("i", $shipment_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Update shipment status
    public function updateShipmentStatus($shipment_id, $status) {
        $stmt = $this->conn->prepare("UPDATE shipments SET status = ? WHERE shipment_id = ?");
        $stmt->bind_param("si", $status, $shipment_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get all transports for dropdown
    public function getAllTransports() {
        $sql = "SELECT transport_id, vehicle_type, vehicle_capacity FROM Transports ORDER BY vehicle_type";
        $result = $this->conn->query($sql);
        $transports = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $transports[] = $row;
            }
        }
        
        return $transports;
    }
    
    // Get all harvest batches for dropdown
    public function getAllHarvestBatches() {
        $sql = "SELECT harvest_batch_id, batch_number FROM Harvest_Batches ORDER BY batch_number";
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
        $sql = "SELECT packaged_product_batch_id, production_quantity FROM Packaged_Product_Batches ORDER BY packaged_product_batch_id";
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
    public function searchShipments($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';
        $stmt = $this->conn->prepare("SELECT 
                    s.shipment_id,
                    s.transport_id,
                    s.harvest_batch_id,
                    s.packaged_product_batch_id,
                    s.shipment_date,
                    s.shipment_destination,
                    s.status,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    hb.batch_number as harvest_batch_number,
                    ppb.production_quantity
                FROM shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
                LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
                WHERE s.shipment_destination LIKE ? 
                   OR s.status LIKE ?
                   OR t.vehicle_type LIKE ?
                   OR hb.batch_number LIKE ?
                ORDER BY s.shipment_date DESC");
        
        $stmt->bind_param("ssss", $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $shipments = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        $stmt->close();
        return $shipments;
    }
    
    // Get shipments by status
    public function getShipmentsByStatus($status) {
        $stmt = $this->conn->prepare("SELECT 
                    s.shipment_id,
                    s.transport_id,
                    s.harvest_batch_id,
                    s.packaged_product_batch_id,
                    s.shipment_date,
                    s.shipment_destination,
                    s.status,
                    t.vehicle_type,
                    t.vehicle_capacity,
                    hb.batch_number as harvest_batch_number,
                    ppb.production_quantity
                FROM shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Harvest_Batches hb ON s.harvest_batch_id = hb.harvest_batch_id
                LEFT JOIN Packaged_Product_Batches ppb ON s.packaged_product_batch_id = ppb.packaged_product_batch_id
                WHERE s.status = ?
                ORDER BY s.shipment_date DESC");
        
        $stmt->bind_param("s", $status);
        $stmt->execute();
        $result = $stmt->get_result();
        $shipments = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        $stmt->close();
        return $shipments;
    }
}
?>

