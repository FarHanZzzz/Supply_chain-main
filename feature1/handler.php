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
    public function getAllHarvests() {

        // h = harvest, f = farm, cs = crop sowing, c = crop
        $sql = "SELECT 
                    h.harvest_id,
                    h.harvest_name,
                    h.harvest_type,
                    h.harvest_quantity,
                    h.harvest_shelf_life,
                    h.farm_id,
                    f.farm_name,
                    c.crop_name,
                    cs.plant_date,
                    cs.harvest_date
                FROM Harvests h
                JOIN Farms f ON h.farm_id = f.farm_id
                LEFT JOIN Crop_Sowing cs ON h.harvest_id = cs.harvest_id
                LEFT JOIN Crops c ON cs.crop_id = c.crop_id
                ORDER BY h.harvest_name";
        
        $result = $this->conn->query($sql);
        $harvests = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $harvests[] = $row;
            }
        }
        
        return $harvests;
    }
    
    // Get all packages with their details
    public function getAllPackages() {

        // pp = packaged product, ppb = packaged product batch, pb = product batch, w = warehouse, f = factory
        $sql = "SELECT 
                
                    pp.packaged_product_id,
                    pp.product_name,
                    ppb.production_quantity,
                    pb.production_date,
                    w.warehouse_name,
                    f.factory_name
                FROM Package_Products pp
                JOIN Packaged_Product_Batches ppb ON pp.packaged_product_batch_id = ppb.packaged_product_batch_id
                JOIN Product_Batches pb ON ppb.product_batch_id = pb.product_batch_id
                JOIN Factories f ON pb.factory_id = f.factory_id
                LEFT JOIN Warehouses w ON ppb.warehouse_id = w.warehouse_id
                ORDER BY pp.product_name";
        
        $result = $this->conn->query($sql);
        $packages = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $packages[] = $row;
            }
        }
        
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
    public function addPackage($packaged_product_batch_id, $product_name) {
        $stmt = $this->conn->prepare("INSERT INTO Package_Products (packaged_product_batch_id, product_name) VALUES (?, ?)");
        $stmt->bind_param("is", $packaged_product_batch_id, $product_name);
        
        if ($stmt->execute()) {
            $package_id = $this->conn->insert_id;
            $stmt->close();
            return $package_id;
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
    public function updatePackage($packaged_product_id, $packaged_product_batch_id, $product_name) {
        $stmt = $this->conn->prepare("UPDATE Package_Products SET packaged_product_batch_id = ?, product_name = ? WHERE packaged_product_id = ?");
        $stmt->bind_param("isi", $packaged_product_batch_id, $product_name, $packaged_product_id);
        
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
    public function getProductTraceability($packaged_product_id) {
        $sql = "SELECT pp.packaged_product_id, pp.product_name, ppb.packaged_product_batch_id, pb.product_batch_id, pb.production_date, f.factory_id, f.factory_name, h.harvest_id, h.harvest_name, cs.crop_id, c.crop_name, cs.plant_date, cs.harvest_date, fa.farm_id, fa.farm_name
                FROM Package_Products pp
                JOIN Packaged_Product_Batches ppb ON pp.packaged_product_batch_id = ppb.packaged_product_batch_id
                JOIN Product_Batches pb ON ppb.product_batch_id = pb.product_batch_id
                JOIN Factories f ON pb.factory_id = f.factory_id
                JOIN Harvests h ON pb.product_batch_id = h.harvest_id OR pb.product_batch_id = h.harvest_id
                LEFT JOIN Crop_Sowing cs ON h.harvest_id = cs.harvest_id
                LEFT JOIN Crops c ON cs.crop_id = c.crop_id
                LEFT JOIN Farms fa ON h.farm_id = fa.farm_id
                WHERE pp.packaged_product_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $packaged_product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $trace = $result->fetch_assoc();
        $stmt->close();
        return $trace;
    }
}
?>

