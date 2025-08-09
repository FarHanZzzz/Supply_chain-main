<?php
require_once '../../common/db.php';

class AnalyticsHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get overall system statistics
    public function getSystemStats() {
        $stats = [];
        
        // Total shipments
        $sql = "SELECT COUNT(*) as total FROM shipment";
        $result = $this->conn->query($sql);
        $stats['total_shipments'] = $result->fetch_assoc()['total'];
        
        // Total products (using packaged_product_batch for simplicity)
        $sql = "SELECT COUNT(*) as total FROM harvest"; // Using harvest as primary product source
        $result = $this->conn->query($sql);
        $stats['total_products'] = $result->fetch_assoc()['total'];
        
        // Total transports
        $sql = "SELECT COUNT(*) as total FROM transport";
        $result = $this->conn->query($sql);
        $stats['total_transports'] = $result->fetch_assoc()['total'];
        
        // Total drivers
        $sql = "SELECT COUNT(*) as total FROM driver";
        $result = $this->conn->query($sql);
        $stats['total_drivers'] = $result->fetch_assoc()['total'];
        
        return $stats;
    }
    
    // Get delivery performance metrics
    public function getDeliveryPerformance() {
        $performance = [];
        
        // On-time deliveries (assuming 'Delivered' status means on-time for demo)
        $sql = "SELECT 
                    COUNT(*) as total_deliveries,
                    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as on_time_deliveries
                FROM shipment 
            
                WHERE status IN ('delivered', 'in_transit')";
        
        $result = $this->conn->query($sql);
        $data = $result->fetch_assoc();
        
        $performance['total_deliveries'] = $data['total_deliveries'];
        $performance['on_time_deliveries'] = $data['on_time_deliveries'];
        $performance['on_time_percentage'] = $data['total_deliveries'] > 0 ? 
            round(($data['on_time_deliveries'] / $data['total_deliveries']) * 100, 2) : 0;
        
        // Average delivery time (simulated)
        $performance['avg_delivery_time'] = rand(24, 72); // 24-72 hours
        
        return $performance;
    }
    
    // Get transportation costs analysis
    public function getTransportationCosts() {
        $costs = [];
        
        // Simulated cost data based on shipments
        $sql = "SELECT 
                    COUNT(*) as shipment_count,
                    AVG(CASE 
                        WHEN t.vehicle_type = 'Refrigerated Truck' THEN 700
                        WHEN t.vehicle_type = 'Standard Truck' THEN 500
                        WHEN t.vehicle_type = 'Large Truck' THEN 800
                        WHEN t.vehicle_type = 'Cold Storage Truck' THEN 750
                        ELSE 400
                    END) as avg_cost_per_shipment
                FROM shipment s
                JOIN transport t ON s.transport_id = t.transport_id";
        
        $result = $this->conn->query($sql);
        $data = $result->fetch_assoc();
        
        $costs['total_shipments'] = $data['shipment_count'];
        $costs['avg_cost_per_shipment'] = round($data['avg_cost_per_shipment'], 2);
        $costs['total_estimated_cost'] = round($data['shipment_count'] * $data['avg_cost_per_shipment'], 2);
        
        // Cost breakdown by vehicle type
        $sql = "SELECT 
                    t.vehicle_type,
                    COUNT(*) as shipment_count,
                    CASE 
                        WHEN t.vehicle_type = 'Refrigerated Truck' THEN 700
                        WHEN t.vehicle_type = 'Standard Truck' THEN 500
                        WHEN t.vehicle_type = 'Large Truck' THEN 800
                        WHEN t.vehicle_type = 'Cold Storage Truck' THEN 750
                        ELSE 400
                    END as cost_per_shipment
                FROM shipment s
                JOIN transport t ON s.transport_id = t.transport_id
                GROUP BY t.vehicle_type";
        
        $result = $this->conn->query($sql);
        $costs['by_vehicle_type'] = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $costs['by_vehicle_type'][] = [
                    'vehicle_type' => $row['vehicle_type'],
                    'shipment_count' => $row['shipment_count'],
                    'cost_per_shipment' => $row['cost_per_shipment'],
                    'total_cost' => $row['shipment_count'] * $row['cost_per_shipment']
                ];
            }
        }
        
        return $costs;
    }
    
    // Get carrier reliability metrics
    public function getCarrierReliability() {
        $reliability = [];
        
        // Driver performance (simulated based on completed shipments)
        $sql = "SELECT 
                    d.driver_id,
                    d.driver_name,
                    COUNT(s.shipment_id) as total_shipments,
                    SUM(CASE WHEN s.status = 'delivered' THEN 1 ELSE 0 END) as completed_shipments,
                    t.vehicle_type
                FROM driver d
                LEFT JOIN transport t ON d.driver_id = t.driver_id
                LEFT JOIN shipment s ON t.transport_id = s.transport_id
                GROUP BY d.driver_id, d.driver_name, t.vehicle_type
                ORDER BY completed_shipments DESC";
        
        $result = $this->conn->query($sql);
        $reliability['drivers'] = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $success_rate = $row['total_shipments'] > 0 ? 
                    round(($row['completed_shipments'] / $row['total_shipments']) * 100, 2) : 0;
                
                $reliability['drivers'][] = [
                    'driver_id' => $row['driver_id'],
                    'driver_name' => $row['driver_name'],
                    'vehicle_type' => $row['vehicle_type'],
                    'total_shipments' => $row['total_shipments'],
                    'completed_shipments' => $row['completed_shipments'],
                    'success_rate' => $success_rate
                ];
            }
        }
        
        return $reliability;
    }
    
    // Get shipment trends over time
    public function getShipmentTrends($period = '30') {
        $trends = [];
        
        // Daily shipment counts for the last 30 days
        $sql = "SELECT 
                    DATE(shipment_date) as date,
                    COUNT(*) as shipment_count,
                    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
                FROM shipment 
                WHERE shipment_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(shipment_date)
                ORDER BY date";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $period);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $trends['daily'] = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $trends['daily'][] = [
                    'date' => $row['date'],
                    'shipments' => $row['shipment_count'],
                    'delivered' => $row['delivered_count']
                ];
            }
        }
        
        $stmt->close();
        
        // Monthly trends
        $sql = "SELECT 
                    YEAR(shipment_date) as year,
                    MONTH(shipment_date) as month,
                    COUNT(*) as shipment_count,
                    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
                FROM shipment 
                WHERE shipment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY YEAR(shipment_date), MONTH(shipment_date)
                ORDER BY year, month";
        
        $result = $this->conn->query($sql);
        $trends['monthly'] = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $trends['monthly'][] = [
                    'year' => $row['year'],
                    'month' => $row['month'],
                    'shipments' => $row['shipment_count'],
                    'delivered' => $row['delivered_count']
                ];
            }
        }
        
        return $trends;
    }
    
    // Get product performance analytics
    public function getProductPerformance() {
        $performance = [];
        
        // Most shipped products (using harvest and shipment tables)
        $sql = "SELECT 
                    h.harvest_name as product_name,
                    COUNT(s.shipment_id) as shipment_count,
                    SUM(CASE WHEN s.status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
                FROM shipment s
                JOIN harvest h ON s.product_details LIKE CONCAT('%', h.harvest_name, '%')
                GROUP BY h.harvest_name
                ORDER BY shipment_count DESC
                LIMIT 10";
        
        $result = $this->conn->query($sql);
        $performance['top_products'] = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $success_rate = $row['shipment_count'] > 0 ? 
                    round(($row['delivered_count'] / $row['shipment_count']) * 100, 2) : 0;
                
                $performance['top_products'][] = [
                    'product_name' => $row['product_name'],
                    'shipment_count' => $row['shipment_count'],
                    'delivered_count' => $row['delivered_count'],
                    'success_rate' => $success_rate
                ];
            }
        }
        
        return $performance;
    }
    
    // Get route efficiency analysis
    public function getRouteEfficiency() {
        $efficiency = [];
        
        // Most common destinations
        $sql = "SELECT 
                    destination,
                    COUNT(*) as shipment_count,
                    AVG(DATEDIFF(actual_delivery, shipment_date)) as avg_delivery_time
                FROM shipment 
                WHERE actual_delivery IS NOT NULL
                GROUP BY destination
                ORDER BY shipment_count DESC
                LIMIT 10";
        
        $result = $this->conn->query($sql);
        $efficiency['destinations'] = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $efficiency['destinations'][] = [
                    'destination' => $row['destination'],
                    'shipment_count' => $row['shipment_count'],
                    'avg_delivery_time' => $row['avg_delivery_time'] ? round($row['avg_delivery_time'], 1) : null
                ];
            }
        }
        
        return $efficiency;
    }
    
    // Get condition monitoring analytics
    public function getConditionAnalytics() {
        $analytics = [];
        
        // Check if sensor_data table exists
        $sql = "SHOW TABLES LIKE 'sensor_data'";
        $result = $this->conn->query($sql);
        
        if ($result->num_rows > 0) {
            // Temperature and humidity trends
            $sql = "SELECT 
                        DATE(timestamp) as date,
                        AVG(temperature) as avg_temperature,
                        AVG(humidity) as avg_humidity,
                        COUNT(*) as reading_count
                    FROM sensor_data 
                    WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    GROUP BY DATE(timestamp)
                    ORDER BY date";
            
            $result = $this->conn->query($sql);
            $analytics['daily_conditions'] = [];
            
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $analytics['daily_conditions'][] = [
                        'date' => $row['date'],
                        'avg_temperature' => round($row['avg_temperature'], 2),
                        'avg_humidity' => round($row['avg_humidity'], 2),
                        'reading_count' => $row['reading_count']
                    ];
                }
            }
            
            // Alert frequency by sensor (simulated alerts based on temperature/humidity)
            $sql = "SELECT 
                        sd.sensor_id,
                        s.sensor_type as sensor_name,
                        COUNT(*) as total_readings,
                        SUM(CASE WHEN (sd.temperature < 2 OR sd.temperature > 8 OR sd.humidity < 80 OR sd.humidity > 95) THEN 1 ELSE 0 END) as alert_count
                    FROM sensor_data sd
                    JOIN sensor s ON sd.sensor_id = s.sensor_id
                    GROUP BY sd.sensor_id, s.sensor_type
                    ORDER BY alert_count DESC";
            
            $result = $this->conn->query($sql);
            $analytics['sensor_alerts'] = [];
            
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $alert_rate = $row['total_readings'] > 0 ? 
                        round(($row['alert_count'] / $row['total_readings']) * 100, 2) : 0;
                    
                    $analytics['sensor_alerts'][] = [
                        'sensor_id' => $row['sensor_id'],
                        'sensor_name' => $row['sensor_name'],
                        'total_readings' => $row['total_readings'],
                        'alert_count' => $row['alert_count'],
                        'alert_rate' => $alert_rate
                    ];
                }
            }
        } else {
            $analytics['daily_conditions'] = [];
            $analytics['sensor_alerts'] = [];
        }
        
        return $analytics;
    }
    
    // Get document compliance analytics
    public function getDocumentAnalytics() {
        $analytics = [];
        
        // Document status distribution (using shipment status and order status)
        $sql_shipment_status = "SELECT status, COUNT(*) as count FROM shipment GROUP BY status";
        $result_shipment_status = $this->conn->query($sql_shipment_status);
        $status_distribution = [];
        if ($result_shipment_status->num_rows > 0) {
            while($row = $result_shipment_status->fetch_assoc()) {
                $status_distribution[$row['status']] = $row['count'];
            }
        }

        $sql_order_status = "SELECT 'Completed' as status, COUNT(*) as count FROM orders"; // Assuming orders are 'Completed'
        $result_order_status = $this->conn->query($sql_order_status);
        if ($result_order_status->num_rows > 0) {
            $row = $result_order_status->fetch_assoc();
            $status_distribution[$row['status']] = ($status_distribution[$row['status']] ?? 0) + $row['count'];
        }

        foreach($status_distribution as $status => $count) {
            $analytics['status_distribution'][] = ['status' => $status, 'count' => $count];
        }

        // Document type distribution
        $analytics['type_distribution'] = [
            ['document_type' => 'Shipment', 'count' => $this->conn->query("SELECT COUNT(*) FROM shipment")->fetch_assoc()['COUNT(*)']],
            ['document_type' => 'Order', 'count' => $this->conn->query("SELECT COUNT(*) FROM orders")->fetch_assoc()['COUNT(*)']]
        ];

        // Compliance rate by shipment (simulated based on shipment status)
        $sql = "SELECT 
                    shipment_id,
                    destination as shipment_destination,
                    status,
                    CASE WHEN status = 'delivered' THEN 100 ELSE RAND() * 80 + 20 END as compliance_rate
                FROM shipment
                ORDER BY compliance_rate DESC
                LIMIT 10";
            
        $result = $this->conn->query($sql);
        $analytics['compliance_by_shipment'] = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $analytics['compliance_by_shipment'][] = [
                    'shipment_id' => $row['shipment_id'],
                    'shipment_destination' => $row['shipment_destination'],
                    'status' => $row['status'],
                    'compliance_rate' => round($row['compliance_rate'], 2)
                ];
            }
        }
        
        return $analytics;
    }
    
    // Export data to PDF
    public function exportToPDF($data, $title = "Analytics Report") {
        require_once '../../common/pdf_generator.php';
        
        $pdf = new PDFGenerator();
        $headers = [];
        if (!empty($data)) {
            $headers = array_keys($data[0]);
            // Filter out internal keys if necessary
            $headers = array_filter($headers, function($key) {
                return !in_array($key, ["shipment_id", "order_id", "driver_id", "transport_id", "sensor_id"]);
            });
            $headers = array_values($headers); // Re-index array
        }
        
        $pdf->generateTablePDF($data, $headers, $title);
    }
}
?>

