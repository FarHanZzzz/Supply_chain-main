<?php
require_once '../common/db.php';

class StockMonitoringHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all harvest batches with stock details
    public function getAllHarvestBatches() {

        // Harvest Batches = hb , Warehouses = w , Harvests = h , Farms = f
        $sql = "SELECT 
                    hb.harvest_batch_id,
                    hb.batch_number,
                    hb.quantity,
                    hb.status,
                    hb.storage_date,
                    w.warehouse_name,
                    h.harvest_name,
                    h.harvest_type,
                    f.farm_name
                FROM Harvest_Batches hb
                JOIN Warehouses w ON hb.warehouse_id = w.warehouse_id
                JOIN Harvests h ON hb.harvest_id = h.harvest_id
                JOIN Farms f ON h.farm_id = f.farm_id
                ORDER BY hb.storage_date DESC";
        
        $result = $this->conn->query($sql);
        $batches = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        return $batches;
    }
    
    // Get stock summary statistics
    public function getStockSummary() {
        $summary = [];
        
        // Total harvest batches
        $sql = "SELECT COUNT(*) as total_batches FROM Harvest_Batches";
        $result = $this->conn->query($sql);
        $summary['total_batches'] = $result->fetch_assoc()['total_batches'];
        
        // Total packaged products
        $sql = "SELECT COUNT(*) as total_packages FROM Package_Products";
        $result = $this->conn->query($sql);
        $summary['total_packages'] = $result->fetch_assoc()['total_packages'];
        
        // Total raw materials
        $sql = "SELECT COUNT(*) as total_materials FROM Farmer_Required_Inventory";
        $result = $this->conn->query($sql);
        $summary['total_materials'] = $result->fetch_assoc()['total_materials'];
        
        // Total warehouses
        $sql = "SELECT COUNT(*) as total_warehouses FROM Warehouses";
        $result = $this->conn->query($sql);
        $summary['total_warehouses'] = $result->fetch_assoc()['total_warehouses'];
        
        return $summary;
    }
    
    // Add new harvest batch
    public function addHarvestBatch($harvest_id, $warehouse_id, $batch_number, $quantity, $status, $storage_date) {
        $stmt = $this->conn->prepare("INSERT INTO Harvest_Batches (harvest_id, warehouse_id, batch_number, quantity, status, storage_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iisdss", $harvest_id, $warehouse_id, $batch_number, $quantity, $status, $storage_date);
        
        if ($stmt->execute()) {
            $batch_id = $this->conn->insert_id;
            $stmt->close();
            return $batch_id;
        } else {
            $stmt->close();
            return false;
        }
    }
    
    // Update harvest batch
    public function updateHarvestBatch($harvest_batch_id, $harvest_id, $warehouse_id, $batch_number, $quantity, $status, $storage_date) {
        $stmt = $this->conn->prepare("UPDATE Harvest_Batches SET harvest_id = ?, warehouse_id = ?, batch_number = ?, quantity = ?, status = ?, storage_date = ? WHERE harvest_batch_id = ?");
        $stmt->bind_param("iisdssi", $harvest_id, $warehouse_id, $batch_number, $quantity, $status, $storage_date, $harvest_batch_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete harvest batch
    public function deleteHarvestBatch($harvest_batch_id) {
        $stmt = $this->conn->prepare("DELETE FROM Harvest_Batches WHERE harvest_batch_id = ?");
        $stmt->bind_param("i", $harvest_batch_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get all harvests for dropdown
    public function getAllHarvests() {
        $sql = "SELECT harvest_id, harvest_name FROM Harvests ORDER BY harvest_name";
        $result = $this->conn->query($sql);
        $harvests = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $harvests[] = $row;
            }
        }
        
        return $harvests;
    }
    
    // Get all warehouses for dropdown
    public function getAllWarehouses() {
        $sql = "SELECT warehouse_id, warehouse_name FROM Warehouses ORDER BY warehouse_name";
        $result = $this->conn->query($sql);
        $warehouses = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $warehouses[] = $row;
            }
        }
        
        return $warehouses;
    }
    
    // Search harvest batches
    public function searchHarvestBatches($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';

        // hb = harvest_batches , w = warehouses , h = harvests , f = farms
        $stmt = $this->conn->prepare("SELECT 
                    hb.harvest_batch_id,
                    hb.batch_number,
                    hb.quantity,
                    hb.status,
                    hb.storage_date,
                    w.warehouse_name,
                    h.harvest_name,
                    h.harvest_type,
                    f.farm_name
                FROM Harvest_Batches hb
                JOIN Warehouses w ON hb.warehouse_id = w.warehouse_id
                JOIN Harvests h ON hb.harvest_id = h.harvest_id
                JOIN Farms f ON h.farm_id = f.farm_id
                WHERE hb.batch_number LIKE ? 
                   OR w.warehouse_name LIKE ? 
                   OR hb.status LIKE ?
                   OR h.harvest_name LIKE ?
                ORDER BY hb.storage_date DESC");
        
        $stmt->bind_param("ssss", $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $batches = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        $stmt->close();
        return $batches;
    }
    
    // Update batch status
    public function updateBatchStatus($harvest_batch_id, $status) {
        $stmt = $this->conn->prepare("UPDATE Harvest_Batches SET status = ? WHERE harvest_batch_id = ?");
        $stmt->bind_param("si", $status, $harvest_batch_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get low stock items (quantity < 100)
    public function getLowStockItems() {
        $sql = "SELECT 
                    hb.harvest_batch_id,
                    hb.batch_number,
                    hb.quantity,
                    hb.status,
                    w.warehouse_name,
                    h.harvest_name
                FROM Harvest_Batches hb
                JOIN Warehouses w ON hb.warehouse_id = w.warehouse_id
                JOIN Harvests h ON hb.harvest_id = h.harvest_id
                WHERE hb.quantity < 100
                ORDER BY hb.quantity ASC";
        
        $result = $this->conn->query($sql);
        $items = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $items[] = $row;
            }
        }
        
        return $items;
    }

    // Unified stock summary by warehouse and stage
    public function getWarehouseStockBreakdown() {
        $sql = "SELECT w.warehouse_id, w.warehouse_name,
            COALESCE(raw.raw_qty, 0) AS raw_quantity,
            0 AS inprocess_quantity, -- In-process not linked in schema
            COALESCE(finished.finished_qty, 0) AS finished_quantity
        FROM Warehouses w
        LEFT JOIN (
            SELECT warehouse_id, SUM(quantity) AS raw_qty
            FROM Harvest_Batches
            GROUP BY warehouse_id
        ) raw ON w.warehouse_id = raw.warehouse_id
        LEFT JOIN (
            SELECT warehouse_id, SUM(production_quantity) AS finished_qty
            FROM Packaged_Product_Batches
            GROUP BY warehouse_id
        ) finished ON w.warehouse_id = finished.warehouse_id
        ORDER BY w.warehouse_name";
        $result = $this->conn->query($sql);
        $rows = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
        }
        return $rows;
    }
}
?>

