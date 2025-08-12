<?php
require_once '../common/db.php';

class StockMonitoringHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    public function getAvailableHarvestBatches($includeId = null) {
        // Only harvest batches not yet linked to a packaged product batch.
        // If $includeId is provided (edit mode), include that one too so the dropdown can keep current selection.
        $baseSql = "
            SELECT 
                hb.harvest_batch_id,
                hb.batch_number,
                hb.quantity,
                hb.warehouse_id,
                w.warehouse_name,
                h.harvest_name,
                hb.storage_date
            FROM Harvest_Batches hb
            JOIN Warehouses w ON w.warehouse_id = hb.warehouse_id
            JOIN Harvests  h ON h.harvest_id   = hb.harvest_id
            LEFT JOIN Packaged_Product_Batches ppb 
                ON ppb.harvest_batch_id = hb.harvest_batch_id
            WHERE ppb.harvest_batch_id IS NULL
        ";

        if ($includeId) {
            // include the currently-linked batch id too (for edit)
            $sql = $baseSql . " OR hb.harvest_batch_id = ? ORDER BY hb.storage_date DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param('i', $includeId);
        } else {
            $sql = $baseSql . " ORDER BY hb.storage_date DESC";
            $stmt = $this->conn->prepare($sql);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($row = $res->fetch_assoc()) { $rows[] = $row; }
        $stmt->close();
        return $rows;
    }


    // Get all harvest batches with stock details
    public function getAllHarvestBatches() {

        // Harvest Batches = hb , Warehouses = w , Harvests = h , Farms = f
        $sql = "SELECT 
            hb.harvest_batch_id,
            hb.harvest_id,
            hb.warehouse_id,
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
        JOIN Harvests h   ON hb.harvest_id   = h.harvest_id
        JOIN Farms f      ON h.farm_id       = f.farm_id
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

    // Get packaged product batch inventory
   public function getPackagedProductBatchInventory() {
    $sql = "
    SELECT
      ppb.packaged_product_batch_id,
      ppb.batch_name,
      ppb.production_quantity,
      ppb.production_date,
      ppb.warehouse_id,
      w.warehouse_name,
      ppb.factory_id,
      f.factory_name,
      ppb.harvest_batch_id,
      hb.batch_number AS harvest_batch_number,
      ppb.batch_number
    FROM Packaged_Product_Batches ppb
    LEFT JOIN Warehouses w ON w.warehouse_id = ppb.warehouse_id
    LEFT JOIN Factories  f ON f.factory_id  = ppb.factory_id
    LEFT JOIN Harvest_Batches hb ON hb.harvest_batch_id = ppb.harvest_batch_id
    ORDER BY ppb.packaged_product_batch_id DESC";

    $result = $this->conn->query($sql);
    $rows = [];
    if ($result && $result->num_rows > 0) {
        while ($r = $result->fetch_assoc()) {
            $rows[] = $r;
        }
    }
    return $rows;
}




    // Unified stock summary by warehouse and stage
    public function getWarehouseStockBreakdown() {
    $sql = "
    SELECT
      w.warehouse_id,
      w.warehouse_name,
      COALESCE(raw.total, 0)  AS raw_quantity,
      COALESCE(pkg.total, 0)  AS finished_quantity
    FROM Warehouses w
    LEFT JOIN (
      SELECT hb.warehouse_id, SUM(hb.quantity) AS total
      FROM Harvest_Batches hb
      WHERE NOT EXISTS (
        SELECT 1
        FROM Packaged_Product_Batches ppb
        WHERE ppb.harvest_batch_id = hb.harvest_batch_id
      )
      GROUP BY hb.warehouse_id
    ) raw ON raw.warehouse_id = w.warehouse_id
    LEFT JOIN (
      SELECT ppb.warehouse_id, SUM(ppb.production_quantity) AS total
      FROM Packaged_Product_Batches ppb
      GROUP BY ppb.warehouse_id
    ) pkg ON pkg.warehouse_id = w.warehouse_id
    ORDER BY w.warehouse_name";

    $result = $this->conn->query($sql);
    $rows = [];
    if ($result && $result->num_rows > 0) {
        while ($r = $result->fetch_assoc()) {
            $rows[] = $r;
        }
    }
    return $rows;
}



    // Get all factories for dropdown
    public function getAllFactories() {
        $sql = "SELECT factory_id, factory_name FROM Factories ORDER BY factory_name";
        $result = $this->conn->query($sql);
        $factories = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $factories[] = $row;
            }
        }
        
        return $factories;
    }



    // Create new packaged product batch
    public function createPackagedProductBatch($harvest_batch_id, $batch_name, $factory_id, $production_date, $production_quantity, $warehouse_id) {
    // 1) Get the source harvest batch + its batch_number
    $stmt = $this->conn->prepare("SELECT batch_number FROM Harvest_Batches WHERE harvest_batch_id = ?");
    $stmt->bind_param('i', $harvest_batch_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if (!$res || $res->num_rows === 0) { $stmt->close(); return false; }
    $hb = $res->fetch_assoc();
    $stmt->close();

    // 2) Enforce one-to-one: not already used
    $stmt = $this->conn->prepare("SELECT 1 FROM Packaged_Product_Batches WHERE harvest_batch_id = ?");
    $stmt->bind_param('i', $harvest_batch_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows > 0) { $stmt->close(); return ['error' => 'This harvest batch is already packaged.']; }
    $stmt->close();

    // 3) Insert, keeping batch_number aligned
    $stmt = $this->conn->prepare("
        INSERT INTO Packaged_Product_Batches
        (harvest_batch_id, batch_number, batch_name, factory_id, production_date, production_quantity, warehouse_id)
        VALUES (?,?,?,?,?,?,?)
    ");
    $stmt->bind_param(
        'issisdi',
        $harvest_batch_id,
        $hb['batch_number'],
        $batch_name,
        $factory_id,
        $production_date,
        $production_quantity,
        $warehouse_id
    );
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}


    // Get single packaged product batch by ID
    public function getPackagedProductBatchById($batchId) {
        $stmt = $this->conn->prepare("SELECT 
                    ppb.packaged_product_batch_id,
                    ppb.batch_name,
                    ppb.production_quantity,
                    ppb.production_date,
                    ppb.warehouse_id,
                    ppb.factory_id,
                    w.warehouse_name,
                    f.factory_name
                FROM Packaged_Product_Batches ppb
                LEFT JOIN Warehouses w ON ppb.warehouse_id = w.warehouse_id
                LEFT JOIN Factories f ON ppb.factory_id = f.factory_id
                WHERE ppb.packaged_product_batch_id = ?");
        
        $stmt->bind_param("i", $batchId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $batch = $result->fetch_assoc();
            $stmt->close();
            return $batch;
        }
        
        $stmt->close();
        return null;
    }

    // Update packaged product batch
    public function updatePackagedProductBatch(
    $packaged_product_batch_id,
    $batch_name,
    $factory_id,
    $production_date,
    $production_quantity,
    $warehouse_id,
    $harvest_batch_id
) {
    // Validate HB exists
    $stmt = $this->conn->prepare("SELECT 1 FROM Harvest_Batches WHERE harvest_batch_id = ?");
    $stmt->bind_param('i', $harvest_batch_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) { $stmt->close(); return false; }
    $stmt->close();

    // Enforce 1:1 link (exclude this record)
    $stmt = $this->conn->prepare("
        SELECT COUNT(*) FROM Packaged_Product_Batches
        WHERE harvest_batch_id = ? AND packaged_product_batch_id <> ?
    ");
    $stmt->bind_param('ii', $harvest_batch_id, $packaged_product_batch_id);
    $stmt->execute();
    $stmt->bind_result($cnt);
    $stmt->fetch();
    $stmt->close();
    if ($cnt > 0) return false;

    // Update
    $stmt = $this->conn->prepare("
        UPDATE Packaged_Product_Batches
        SET batch_name = ?, factory_id = ?, production_date = ?, production_quantity = ?, warehouse_id = ?, harvest_batch_id = ?
        WHERE packaged_product_batch_id = ?
    ");
    $stmt->bind_param(
        'sisdiii',
        $batch_name,          // s
        $factory_id,          // i
        $production_date,     // s
        $production_quantity, // d
        $warehouse_id,        // i
        $harvest_batch_id,    // i
        $packaged_product_batch_id // i
    );
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}




    // Delete packaged product batch
    public function deletePackagedProductBatch($batchId) {
        $stmt = $this->conn->prepare("DELETE FROM Packaged_Product_Batches WHERE packaged_product_batch_id = ?");
        $stmt->bind_param("i", $batchId);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
}
?>

