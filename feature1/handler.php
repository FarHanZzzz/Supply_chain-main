<?php
require_once '../common/db.php';

class ProductRecordsHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    
    // Get all crops with their details
    public function getAllCrops() {

        // c = crop , cs = crop sowing, h = harvest, f = farm	
        $sql = "SELECT 
                    c.crop_id,
                    c.crop_name,
                    c.crop_type,
                    cs.plant_date,
                    cs.harvest_date,
                    h.harvest_quantity,
                    h.harvest_shelf_life,
                    f.farm_name
                FROM Crops c
                LEFT JOIN Crop_Sowing cs ON c.crop_id = cs.crop_id
                LEFT JOIN Harvests h ON cs.harvest_id = h.harvest_id
                LEFT JOIN Farms f ON h.farm_id = f.farm_id
                ORDER BY c.crop_name";
        
        $result = $this->conn->query($sql);
        $crops = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $crops[] = $row;
            }
        }
        
        return $crops;
    }
    
    // Get all harvests with their details
    // Get all harvests with their details (1 row per harvest)
    public function getAllHarvests() {
        $sql = "SELECT 
                    h.harvest_id,
                    h.harvest_name,
                    h.harvest_type,
                    h.harvest_quantity,
                    h.harvest_shelf_life,
                    h.farm_id,
                    f.farm_name
                FROM Harvests h
                JOIN Farms f ON h.farm_id = f.farm_id
                ORDER BY h.harvest_name";

        $result = $this->conn->query($sql);
        $harvests = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $harvests[] = $row;
            }
        }
        return $harvests;
    }

    
    // Get all packages with their details
    public function getAllPackages() {

        // pp = packaged product, ppb = packaged product batch, w = warehouse, f = factory
        $sql = "SELECT 
                
                    pp.packaged_product_id,
                    pp.product_name,
                    pp.packaged_product_batch_id,
                    pp.storage_requirements,
                    pp.packaging_details,
                    ppb.production_quantity,
                    ppb.production_date,
                    w.warehouse_name,
                    f.factory_name
                FROM Package_Products pp
                JOIN Packaged_Product_Batches ppb ON pp.packaged_product_batch_id = ppb.packaged_product_batch_id
                JOIN Factories f ON ppb.factory_id = f.factory_id
                LEFT JOIN Warehouses w ON ppb.warehouse_id = w.warehouse_id
                ORDER BY pp.product_name";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            error_log("Database error in getAllPackages: " . $this->conn->error);
            return [];
        }
        
        $packages = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $packages[] = $row;
            }
        }
        
        error_log("getAllPackages SQL: " . $sql);
        error_log("getAllPackages returned " . count($packages) . " packages");
        error_log("getAllPackages data: " . json_encode($packages));
        return $packages;
    }
    
    // Add new crop
    public function addCrop($crop_name, $crop_type) {
        $stmt = $this->conn->prepare("INSERT INTO Crops (crop_name, crop_type) VALUES (?, ?)");
        $stmt->bind_param("ss", $crop_name, $crop_type);
        
        if ($stmt->execute()) {
            $crop_id = $this->conn->insert_id;
            $stmt->close();
            return $crop_id;
        } else {
            $stmt->close();
            return false;
        }
    }
    
    // Add new harvest
    public function addHarvest($farm_id, $harvest_name, $harvest_type, $harvest_quantity, $harvest_shelf_life) {
        $stmt = $this->conn->prepare("INSERT INTO Harvests (farm_id, harvest_name, harvest_type, harvest_quantity, harvest_shelf_life) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issds", $farm_id, $harvest_name, $harvest_type, $harvest_quantity, $harvest_shelf_life);
        
        if ($stmt->execute()) {
            $harvest_id = $this->conn->insert_id;
            $stmt->close();
            return $harvest_id;
        } else {
            $stmt->close();
            return false;
        }
    }
    
    // Add new package
    public function addPackage($packaged_product_batch_id, $product_name, $storage_requirements, $packaging_details) {
    // 1) Find smallest available packaged_product_id starting at 1
    $nextId = 1;
    if ($res = $this->conn->query("SELECT packaged_product_id FROM Package_Products ORDER BY packaged_product_id ASC")) {
        while ($row = $res->fetch_assoc()) {
            $id = (int)$row['packaged_product_id'];
            if ($id === $nextId) {
                $nextId++;
            } elseif ($id > $nextId) {
                break; // found a gap
            }
        }
        $res->free();
    }

    // 2) Insert explicitly using that id (note: 5 params now)
    $stmt = $this->conn->prepare("
        INSERT INTO Package_Products
            (packaged_product_id, packaged_product_batch_id, product_name, storage_requirements, packaging_details)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        "iisss",                // id, batch_id, 3 strings
        $nextId,
        $packaged_product_batch_id,
        $product_name,
        $storage_requirements,
        $packaging_details
    );

    if ($stmt->execute()) {
        $stmt->close();
        return $nextId;         // we supplied the id
    } else {
        $stmt->close();
        return false;
    }
}

    
    // Update crop
    public function updateCrop($crop_id, $crop_name, $crop_type) {
        $stmt = $this->conn->prepare("UPDATE Crops SET crop_name = ?, crop_type = ? WHERE crop_id = ?");
        $stmt->bind_param("ssi", $crop_name, $crop_type, $crop_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Update harvest
    public function updateHarvest($harvest_id, $farm_id, $harvest_name, $harvest_type, $harvest_quantity, $harvest_shelf_life) {
        $stmt = $this->conn->prepare("UPDATE Harvests SET farm_id = ?, harvest_name = ?, harvest_type = ?, harvest_quantity = ?, harvest_shelf_life = ? WHERE harvest_id = ?");
        $stmt->bind_param("issdsi", $farm_id, $harvest_name, $harvest_type, $harvest_quantity, $harvest_shelf_life, $harvest_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Update package
    public function updatePackage($packaged_product_id, $packaged_product_batch_id, $product_name, $storage_requirements, $packaging_details) {
        $stmt = $this->conn->prepare("UPDATE Package_Products SET packaged_product_batch_id = ?, product_name = ?, storage_requirements = ?, packaging_details = ? WHERE packaged_product_id = ?");
        $stmt->bind_param("isssi", $packaged_product_batch_id, $product_name, $storage_requirements, $packaging_details, $packaged_product_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete crop
    public function deleteCrop($crop_id) {
        $stmt = $this->conn->prepare("DELETE FROM Crops WHERE crop_id = ?");
        $stmt->bind_param("i", $crop_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete harvest
    public function deleteHarvest($harvest_id) {
        $stmt = $this->conn->prepare("DELETE FROM Harvests WHERE harvest_id = ?");
        $stmt->bind_param("i", $harvest_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete package
    public function deletePackage($packaged_product_id) {
        $stmt = $this->conn->prepare("DELETE FROM Package_Products WHERE packaged_product_id = ?");
        $stmt->bind_param("i", $packaged_product_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get all farms for dropdown
    public function getAllFarms() {
        $sql = "SELECT farm_id, farm_name FROM Farms ORDER BY farm_name";
        $result = $this->conn->query($sql);
        $farms = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $farms[] = $row;
            }
        }
        
        return $farms;
    }
    
    // Get all packaged product batches for dropdown
    public function getAllPackagedProductBatches() {
    $sql = "SELECT 
                   ppb.packaged_product_batch_id,
                   ppb.batch_name,
                   ppb.production_quantity,
                   ppb.production_date,
                   ppb.quantity,
                   w.warehouse_name,
                   f.factory_name
            FROM Packaged_Product_Batches ppb
            LEFT JOIN Warehouses w 
                   ON ppb.warehouse_id = w.warehouse_id
            LEFT JOIN Factories f 
                   ON ppb.factory_id = f.factory_id
            ORDER BY ppb.packaged_product_batch_id";

    $result = $this->conn->query($sql);
    $batches = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $batches[] = $row;
        }
    }
    return $batches;
}

    // Crop Sowing CRUD
    public function getAllCropSowings() {
        $sql = "SELECT cs.harvest_id, cs.crop_id, cs.plant_date, cs.harvest_date, c.crop_name, h.harvest_name
                FROM Crop_Sowing cs
                JOIN Crops c ON cs.crop_id = c.crop_id
                JOIN Harvests h ON cs.harvest_id = h.harvest_id
                ORDER BY cs.plant_date DESC";
        $result = $this->conn->query($sql);
        $sowings = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $sowings[] = $row;
            }
        }
        return $sowings;
    }

    public function addCropSowing($harvest_id, $crop_id, $plant_date, $harvest_date) {
        $stmt = $this->conn->prepare("INSERT INTO Crop_Sowing (harvest_id, crop_id, plant_date, harvest_date) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiss", $harvest_id, $crop_id, $plant_date, $harvest_date);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    public function updateCropSowing($harvest_id, $crop_id, $plant_date, $harvest_date) {
        $stmt = $this->conn->prepare("UPDATE Crop_Sowing SET plant_date = ?, harvest_date = ? WHERE harvest_id = ? AND crop_id = ?");
        $stmt->bind_param("ssii", $plant_date, $harvest_date, $harvest_id, $crop_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    public function deleteCropSowing($harvest_id, $crop_id) {
        $stmt = $this->conn->prepare("DELETE FROM Crop_Sowing WHERE harvest_id = ? AND crop_id = ?");
        $stmt->bind_param("ii", $harvest_id, $crop_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Traceability: Get full chain for a packaged product
    // === TRACEABILITY: one-hop joins from packaged_product_id ===
public function getProductTraceability($packagedProductId) {
    $sql = "
    SELECT
      -- packaged product
      pp.packaged_product_id,
      pp.product_name,
      pp.storage_requirements,
      pp.packaging_details,
      pp.packaged_product_batch_id,

      -- packaged batch
      ppb.packaged_product_batch_id AS ppb_id,
      ppb.batch_name AS packaged_batch_name,
      ppb.batch_number AS shared_batch_number,
      ppb.production_date,
      ppb.production_quantity,
      ppb.factory_id,
      f.factory_name,
      ppb.warehouse_id AS packaged_warehouse_id,
      w.warehouse_name AS packaged_warehouse_name,
      ppb.harvest_batch_id,

      -- harvest batch (raw stage)
      hb.harvest_batch_id,
      hb.batch_number AS harvest_batch_number,
      hb.quantity       AS harvest_batch_quantity,
      hb.status         AS harvest_batch_status,
      hb.storage_date   AS harvest_batch_storage_date,
      hb.warehouse_id   AS raw_warehouse_id,
      wr.warehouse_name AS raw_warehouse_name,

      -- harvest
      h.harvest_id,
      h.harvest_name,
      h.harvest_type,
      h.harvest_quantity,
      h.harvest_shelf_life,
      h.farm_id,
      fm.farm_name,

      -- crop sowing -> crop (can be multiple rows)
      cs.crop_id,
      cs.plant_date,
      cs.harvest_date AS sowing_harvest_date,
      c.crop_name,
      c.crop_type
    FROM Package_Products pp
    LEFT JOIN Packaged_Product_Batches ppb
           ON pp.packaged_product_batch_id = ppb.packaged_product_batch_id
    LEFT JOIN Factories f
           ON ppb.factory_id = f.factory_id
    LEFT JOIN Warehouses w
           ON ppb.warehouse_id = w.warehouse_id
    LEFT JOIN Harvest_Batches hb
           ON ppb.harvest_batch_id = hb.harvest_batch_id
    LEFT JOIN Warehouses wr
           ON hb.warehouse_id = wr.warehouse_id
    LEFT JOIN Harvests h
           ON hb.harvest_id = h.harvest_id
    LEFT JOIN Farms fm
           ON h.farm_id = fm.farm_id
    LEFT JOIN Crop_Sowing cs
           ON cs.harvest_id = h.harvest_id
    LEFT JOIN Crops c
           ON cs.crop_id = c.crop_id
    WHERE pp.packaged_product_id = ?
    ";

    $stmt = $this->conn->prepare($sql);
    $stmt->bind_param("i", $packagedProductId);
    $stmt->execute();
    $res = $stmt->get_result();

    if (!$res || $res->num_rows === 0) {
        $stmt->close();
        return null;
    }

    $rows = [];
    while ($r = $res->fetch_assoc()) { $rows[] = $r; }
    $stmt->close();

    // Base info from first row
    $a = $rows[0];

    // Collect unique crops+sowing
    $seen = [];
    $crops = [];
    foreach ($rows as $r) {
        if (!empty($r['crop_id']) && !isset($seen[$r['crop_id'].'|'.$r['plant_date'].'|'.$r['sowing_harvest_date']])) {
            $seen[$r['crop_id'].'|'.$r['plant_date'].'|'.$r['sowing_harvest_date']] = true;
            $crops[] = [
                'crop_id'      => (int)$r['crop_id'],
                'crop_name'    => $r['crop_name'] ?? null,
                'crop_type'    => $r['crop_type'] ?? null,
                'plant_date'   => $r['plant_date'] ?? null,
                'harvest_date' => $r['sowing_harvest_date'] ?? null,
            ];
        }
    }

    return [
        'packaged_product' => [
            'packaged_product_id'     => (int)$a['packaged_product_id'],
            'product_name'            => $a['product_name'],
            'storage_requirements'    => $a['storage_requirements'],
            'packaging_details'       => $a['packaging_details'],
            'packaged_product_batch_id'=> $a['packaged_product_batch_id'] ? (int)$a['packaged_product_batch_id'] : null
        ],
        'packaged_batch' => [
            'packaged_product_batch_id'=> $a['ppb_id'] ? (int)$a['ppb_id'] : null,
            'batch_name'               => $a['packaged_batch_name'],
            'batch_number'             => $a['shared_batch_number'],
            'production_date'          => $a['production_date'],
            'production_quantity'      => $a['production_quantity'],
            'factory_id'               => $a['factory_id'] ? (int)$a['factory_id'] : null,
            'factory_name'             => $a['factory_name'],
            'warehouse_id'             => $a['packaged_warehouse_id'] ? (int)$a['packaged_warehouse_id'] : null,
            'warehouse_name'           => $a['packaged_warehouse_name'],
            'harvest_batch_id'         => $a['harvest_batch_id'] ? (int)$a['harvest_batch_id'] : null
        ],
        'harvest_batch' => [
            'harvest_batch_id'         => $a['harvest_batch_id'] ? (int)$a['harvest_batch_id'] : null,
            'batch_number'             => $a['harvest_batch_number'],
            'quantity'                 => $a['harvest_batch_quantity'],
            'status'                   => $a['harvest_batch_status'],
            'storage_date'             => $a['harvest_batch_storage_date'],
            'warehouse_id'             => $a['raw_warehouse_id'] ? (int)$a['raw_warehouse_id'] : null,
            'warehouse_name'           => $a['raw_warehouse_name']
        ],
        'harvest' => [
            'harvest_id'               => $a['harvest_id'] ? (int)$a['harvest_id'] : null,
            'harvest_name'             => $a['harvest_name'],
            'harvest_type'             => $a['harvest_type'],
            'harvest_quantity'         => $a['harvest_quantity'],
            'harvest_shelf_life'       => $a['harvest_shelf_life'],
        ],
        'farm' => [
            'farm_id'                  => $a['farm_id'] ? (int)$a['farm_id'] : null,
            'farm_name'                => $a['farm_name'],
        ],
        'crops' => $crops
    ];
}

}
?>

