<?php
require_once '../common/db.php';

class OrderManagementHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all orders
    public function getAllOrders() {
        // Verify connection
        if (!$this->conn || !$this->conn->ping()) {
            error_log("Database connection is not active");
            return [];
        }
    
        // Use consistent table name casing
        $sql = "SELECT 
                    order_id,
                    
                    location,
                    order_date
                FROM orders
                ORDER BY order_date DESC";
        
        $result = $this->conn->query($sql);
        
        if (!$result) {
            error_log("Order query failed: " . $this->conn->error);
            return [];
        }
        
        $orders = [];
        while($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        return $orders;
    }
    
    // Get all deliveries
    public function getAllDeliveries() {
        $sql = "SELECT 
                    delivery_id,
                    vehicle_license_no,
                    delivery_date,
                    delivery_time,
                    delivery_man_name
                FROM Deliveries
                ORDER BY delivery_date DESC, delivery_time DESC";
        
        $result = $this->conn->query($sql);
        $deliveries = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $deliveries[] = $row;
            }
        }
        
        return $deliveries;
    }
    
    // Get order statistics
    public function getOrderStats() {
        $stats = [];
        
        // Total orders
        $sql = "SELECT COUNT(*) as total_orders FROM orders";
        $result = $this->conn->query($sql);
        $stats['total_orders'] = $result->fetch_assoc()['total_orders'];
        
        // Total deliveries
        $sql = "SELECT COUNT(*) as total_deliveries FROM Deliveries";
        $result = $this->conn->query($sql);
        $stats['total_deliveries'] = $result->fetch_assoc()['total_deliveries'];
        
        // Recent orders (last 7 days)
        $sql = "SELECT COUNT(*) as recent_orders FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        $result = $this->conn->query($sql);
        $stats['recent_orders'] = $result->fetch_assoc()['recent_orders'];
        
        // Recent deliveries (last 7 days)
        $sql = "SELECT COUNT(*) as recent_deliveries FROM Deliveries WHERE delivery_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        $result = $this->conn->query($sql);
        $stats['recent_deliveries'] = $result->fetch_assoc()['recent_deliveries'];
        
        return $stats;
    }
    
    // Add new order
    public function addOrder($customer_name, $location, $order_date) {
        $stmt = $this->conn->prepare("INSERT INTO orders (customer_name, location, order_date) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $customer_name, $location, $order_date);
        
        if ($stmt->execute()) {
            $order_id = $this->conn->insert_id;
            $stmt->close();
            return $order_id;
        } else {
            $stmt->close();
            return false;
        }
    }
    
    // Add new delivery
    public function addDelivery($vehicle_license_no, $date, $time, $delivery_man_name) {
        $stmt = $this->conn->prepare("INSERT INTO Deliveries (vehicle_license_no, delivery_date, delivery_time, delivery_man_name) VALUES (?, ?, ?, ?)");
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
    
    // Update order
    public function updateOrder($order_id, $customer_name, $location, $order_date) {
        $stmt = $this->conn->prepare("UPDATE orders SET customer_name = ?, location = ?, order_date = ? WHERE order_id = ?");
        $stmt->bind_param("sssi", $customer_name, $location, $order_date, $order_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Update delivery
    public function updateDelivery($delivery_id, $vehicle_license_no, $date, $time, $delivery_man_name) {
        $stmt = $this->conn->prepare("UPDATE Deliveries SET vehicle_license_no = ?, delivery_date = ?, delivery_time = ?, delivery_man_name = ? WHERE delivery_id = ?");
        $stmt->bind_param("ssssi", $vehicle_license_no, $date, $time, $delivery_man_name, $delivery_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete order
    public function deleteOrder($order_id) {
        $stmt = $this->conn->prepare("DELETE FROM orders WHERE order_id = ?");
        $stmt->bind_param("i", $order_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Delete delivery
    public function deleteDelivery($delivery_id) {
        $stmt = $this->conn->prepare("DELETE FROM Deliveries WHERE delivery_id = ?");
        $stmt->bind_param("i", $delivery_id);
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Search orders
    public function searchOrders($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';
        $stmt = $this->conn->prepare("SELECT 
                    order_id,
                    customer_name,
                    location,
                    order_date
                FROM Orders
                WHERE customer_name LIKE ? 
                   OR location LIKE ?
                ORDER BY order_date DESC");
        
        $stmt->bind_param("ss", $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $orders[] = $row;
            }
        }
        
        $stmt->close();
        return $orders;
    }
    
    // Get orders by location
    public function getOrdersByLocation($location) {
        $stmt = $this->conn->prepare("SELECT 
                    order_id,
                    customer_name,
                    location,
                    order_date
                FROM Orders
                WHERE location = ?
                ORDER BY order_date DESC");
        
        $stmt->bind_param("s", $location);
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $orders[] = $row;
            }
        }
        
        $stmt->close();
        return $orders;
    }
    
    // Get recent orders (last 30 days)
    public function getRecentOrders() {
        $sql = "SELECT 
                    order_id,
                    customer_name,
                    location,
                    order_date
                FROM Orders
                WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ORDER BY order_date DESC";
        
        $result = $this->conn->query($sql);
        $orders = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $orders[] = $row;
            }
        }
        
        return $orders;
    }
    
    // Search deliveries
    public function searchDeliveries($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';
        $stmt = $this->conn->prepare("SELECT 
                    delivery_id,
                    vehicle_license_no,
                    delivery_date,
                    delivery_time,
                    delivery_man_name
                FROM Deliveries
                WHERE vehicle_license_no LIKE ? 
                   OR delivery_man_name LIKE ?
                ORDER BY delivery_date DESC, delivery_time DESC");
        
        $stmt->bind_param("ss", $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $deliveries = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $deliveries[] = $row;
            }
        }
        
        $stmt->close();
        return $deliveries;
    }
}
?>

