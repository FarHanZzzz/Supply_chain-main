<?php
require_once '../common/db.php';

class DocumentManagementHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all delivery documents with traceability details
    public function getAllDeliveryDocuments() {
        $documents = [];

        $sql = "SELECT 
                    d.delivery_id as document_id,
                    d.vehicle_license_no,
                    d.date as delivery_date,
                    d.time as delivery_time,
                    d.delivery_man_name,
                    w.warehouse_name,
                    ppb.batch_number as packaged_product_batch_number,
                    o.order_id,
                    o.location as order_location,
                    o.order_date,
                    ol.quantity as orderline_quantity,
                    ol.unit_price as orderline_unit_price,
                    ol.total_price as orderline_total_price
                FROM Deliveries d
                LEFT JOIN Orderlines ol ON d.delivery_id = ol.delivery_id
                LEFT JOIN Orders o ON ol.order_id = o.order_id
                LEFT JOIN Packaged_Product_Batches ppb ON ol.packaged_product_batch_id = ppb.packaged_product_batch_id
                LEFT JOIN Package_Products pp ON ol.packaged_product_id = pp.packaged_product_id
                LEFT JOIN Warehouses w ON ppb.warehouse_id = w.warehouse_id -- Assuming packaged products are stored in a warehouse
                GROUP BY d.delivery_id, ppb.batch_number, w.warehouse_name, o.order_id, o.location, o.order_date, ol.quantity, ol.unit_price, ol.total_price
                ORDER BY d.date DESC, d.time DESC";
        
        $result = $this->conn->query($sql);
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $documents[] = $row;
            }
        }
        
        return $documents;
    }

    // Get delivery document statistics
    public function getDeliveryDocumentStats() {
        $stats = [];
        
        // Total deliveries
        $sql = "SELECT COUNT(*) as total_deliveries FROM Deliveries";
        $result = $this->conn->query($sql);
        $stats['total_deliveries'] = $result->fetch_assoc()['total_deliveries'];
        
        // Total packaged product batches shipped
        $sql = "SELECT COUNT(DISTINCT packaged_product_batch_id) as total_batches_shipped FROM Orderlines WHERE delivery_id IS NOT NULL";
        $result = $this->conn->query($sql);
        $stats['total_batches_shipped'] = $result->fetch_assoc()['total_batches_shipped'];

        // Total packaged product items shipped (sum of quantities in orderlines linked to deliveries)
        $sql = "SELECT SUM(quantity) as total_items_shipped FROM Orderlines WHERE delivery_id IS NOT NULL";
        $result = $this->conn->query($sql);
        $stats['total_items_shipped'] = $result->fetch_assoc()['total_items_shipped'];
        
        return $stats;
    }

    // Add new delivery (simplified for document management context)
    public function addDelivery($vehicle_license_no, $date, $time, $delivery_man_name) {
        $stmt = $this->conn->prepare("INSERT INTO Deliveries (vehicle_license_no, date, time, delivery_man_name) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $vehicle_license_no, $date, $time, $delivery_man_name);
        
        if ($stmt->execute()) {
            $delivery_id = $this->conn->insert_id;
            $stmt->close();
            return $delivery_id;
        } else {
            $stmt->close();
            return false;
        }
    }

    // Update delivery (simplified for document management context)
    public function updateDelivery($delivery_id, $vehicle_license_no, $date, $time, $delivery_man_name) {
        $stmt = $this->conn->prepare("UPDATE Deliveries SET vehicle_license_no = ?, date = ?, time = ?, delivery_man_name = ? WHERE delivery_id = ?");
        $stmt->bind_param("ssssi", $vehicle_license_no, $date, $time, $delivery_man_name, $delivery_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Delete delivery (simplified for document management context)
    public function deleteDelivery($delivery_id) {
        $stmt = $this->conn->prepare("DELETE FROM Deliveries WHERE delivery_id = ?");
        $stmt->bind_param("i", $delivery_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }

    // Search delivery documents
    public function searchDeliveryDocuments($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';
        $sql = "SELECT 
                    d.delivery_id as document_id,
                    d.vehicle_license_no,
                    d.date as delivery_date,
                    d.time as delivery_time,
                    d.delivery_man_name,
                    w.warehouse_name,
                    ppb.batch_number as packaged_product_batch_number,
                    
                    o.order_id,
                    o.location as order_location,
                    o.order_date,
                    ol.quantity as orderline_quantity,
                    ol.unit_price as orderline_unit_price,
                    ol.total_price as orderline_total_price
                FROM Deliveries d
                LEFT JOIN Orderlines ol ON d.delivery_id = ol.delivery_id
                LEFT JOIN Orders o ON ol.order_id = o.order_id
                LEFT JOIN Packaged_Product_Batches ppb ON ol.packaged_product_batch_id = ppb.packaged_product_batch_id
                LEFT JOIN Package_Products pp ON ol.packaged_product_id = pp.packaged_product_id
                LEFT JOIN Warehouses w ON ppb.warehouse_id = w.warehouse_id
                WHERE d.vehicle_license_no LIKE ? 
                   OR d.delivery_man_name LIKE ? 
                   OR w.warehouse_name LIKE ? 
                   OR ppb.batch_number LIKE ? 
                   OR pp.product_name LIKE ? 
                   OR o.location LIKE ?
                GROUP BY d.delivery_id, ppb.batch_number, w.warehouse_name, o.order_id, o.location, o.order_date, ol.quantity, ol.unit_price, ol.total_price
                ORDER BY d.date DESC, d.time DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssssss", $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $documents = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $documents[] = $row;
            }
        }
        
        $stmt->close();
        return $documents;
    }

    // Get warehouses for dropdown
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

    // Get packaged product batches for dropdown
    public function getAllPackagedProductBatches() {
        $sql = "SELECT packaged_product_batch_id, batch_number FROM Packaged_Product_Batches ORDER BY batch_number";
        $result = $this->conn->query($sql);
        $batches = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $batches[] = $row;
            }
        }
        
        return $batches;
    }

    // Get packaged products for dropdown
    public function getAllPackageProducts() {
        $sql = "SELECT packaged_product_id, product_name FROM Package_Products ORDER BY product_name";
        $result = $this->conn->query($sql);
        $products = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $products[] = $row;
            }
        }
        
        return $products;
    }

    // Get orders for dropdown
    public function getAllOrders() {
        $sql = "SELECT order_id, location FROM Orders ORDER BY order_id";
        $result = $this->conn->query($sql);
        $orders = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $orders[] = $row;
            }
        }
        
        return $orders;
    }

    // Get orderlines for dropdown (for linking to deliveries)
    public function getAllOrderlines() {
        $sql = "SELECT orderline_id, order_id, packaged_product_batch_id, packaged_product_id FROM Orderlines ORDER BY orderline_id";
        $result = $this->conn->query($sql);
        $orderlines = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $orderlines[] = $row;
            }
        }
        
        return $orderlines;
    }
}
?>

