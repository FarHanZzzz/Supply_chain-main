<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'handler.php';

$handler = new TemperatureHumidityHandler();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        // ==================== TRANSPORT MONITORING ENDPOINTS ====================
        case 'get_transport_monitoring':
            if ($method === 'GET') {
                $data = $handler->getTransportMonitoringData();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_active_transports':
            if ($method === 'GET') {
                $data = $handler->getActiveTransportsWithSensors();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_transport_history':
            if ($method === 'GET') {
                $transport_id = $_GET['transport_id'] ?? null;
                $hours = $_GET['hours'] ?? 24;
                
                if (!$transport_id) {
                    echo json_encode(['success' => false, 'message' => 'Transport ID is required']);
                    break;
                }
                
                $data = $handler->getTransportSensorHistory($transport_id, $hours);
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_critical_alerts':
            if ($method === 'GET') {
                $data = $handler->getCriticalAlerts();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        // ==================== SENSOR DATA ENDPOINTS ====================
        case 'get_sensor_data':
            if ($method === 'GET') {
                $data = $handler->getAllSensorData();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'add_sensor_data':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->addSensorData(
                    $input['sensor_id'],
                    $input['timestamp'],
                    $input['temperature'] ?? null,
                    $input['humidity'] ?? null,
                    $input['travel_duration'] ?? null,
                    $input['coordinates'] ?? null
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor data added successfully', 'id' => $result]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to add sensor data']);
                }
            }
            break;

        case 'update_sensor_data':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->updateSensorData(
                    $input['sensor_data_id'],
                    $input['sensor_id'],
                    $input['timestamp'],
                    $input['temperature'] ?? null,
                    $input['humidity'] ?? null,
                    $input['travel_duration'] ?? null,
                    $input['coordinates'] ?? null
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor data updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update sensor data']);
                }
            }
            break;

        case 'delete_sensor_data':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->deleteSensorData($input['sensor_data_id']);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor data deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete sensor data']);
                }
            }
            break;

        case 'search_sensor_data':
            if ($method === 'GET') {
                $searchTerm = $_GET['term'] ?? '';
                $data = $handler->searchSensorData($searchTerm);
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        // ==================== SENSOR ENDPOINTS ====================
        case 'get_sensors':
            if ($method === 'GET') {
                $data = $handler->getAllSensors();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'add_sensor':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->addSensor(
                    $input['sensor_type'],
                    $input['warehouse_id'] ?? null,
                    $input['transport_id'] ?? null
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor added successfully', 'id' => $result]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to add sensor']);
                }
            }
            break;

        case 'update_sensor':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->updateSensor(
                    $input['sensor_id'],
                    $input['sensor_type'],
                    $input['warehouse_id'] ?? null,
                    $input['transport_id'] ?? null
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update sensor']);
                }
            }
            break;

        case 'delete_sensor':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->deleteSensor($input['sensor_id']);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete sensor']);
                }
            }
            break;

        // ==================== TRANSPORT ENDPOINTS ====================
        case 'get_transports':
            if ($method === 'GET') {
                $data = $handler->getAllTransports();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'add_transport':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->addTransport(
                    $input['driver_id'],
                    $input['vehicle_type'],
                    $input['vehicle_capacity'],
                    $input['current_capacity'] ?? 0
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Transport added successfully', 'id' => $result]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to add transport']);
                }
            }
            break;

        case 'update_transport':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->updateTransport(
                    $input['transport_id'],
                    $input['driver_id'],
                    $input['vehicle_type'],
                    $input['vehicle_capacity'],
                    $input['current_capacity'] ?? 0
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Transport updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update transport']);
                }
            }
            break;

        case 'delete_transport':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->deleteTransport($input['transport_id']);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Transport deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete transport']);
                }
            }
            break;

        // ==================== SHIPMENT ENDPOINTS ====================
        case 'get_shipments':
            if ($method === 'GET') {
                $data = $handler->getAllShipments();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'add_shipment':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->addShipment(
                    $input['transport_id'],
                    $input['harvest_batch_id'] ?? null,
                    $input['packaged_product_batch_id'] ?? null,
                    $input['shipment_date'],
                    $input['shipment_destination'],
                    $input['status']
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Shipment added successfully', 'id' => $result]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to add shipment']);
                }
            }
            break;

        case 'update_shipment':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->updateShipment(
                    $input['shipment_id'],
                    $input['transport_id'],
                    $input['harvest_batch_id'] ?? null,
                    $input['packaged_product_batch_id'] ?? null,
                    $input['shipment_date'],
                    $input['shipment_destination'],
                    $input['status']
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Shipment updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update shipment']);
                }
            }
            break;

        case 'delete_shipment':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->deleteShipment($input['shipment_id']);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Shipment deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete shipment']);
                }
            }
            break;

        // ==================== HELPER ENDPOINTS ====================
        case 'get_drivers':
            if ($method === 'GET') {
                $data = $handler->getAllDrivers();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_warehouses':
            if ($method === 'GET') {
                $data = $handler->getAllWarehouses();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_harvest_batches':
            if ($method === 'GET') {
                $data = $handler->getAllHarvestBatches();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_packaged_product_batches':
            if ($method === 'GET') {
                $data = $handler->getAllPackagedProductBatches();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_alerts':
            if ($method === 'GET') {
                $data = $handler->getTemperatureHumidityAlerts();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_stats':
            if ($method === 'GET') {
                $data = $handler->getStats();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        // ==================== BATCH OPERATIONS ====================
        case 'bulk_add_sensor_data':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $results = [];
                $success_count = 0;
                $error_count = 0;
                
                foreach ($input['data'] as $item) {
                    $result = $handler->addSensorData(
                        $item['sensor_id'],
                        $item['timestamp'],
                        $item['temperature'] ?? null,
                        $item['humidity'] ?? null,
                        $item['travel_duration'] ?? null,
                        $item['coordinates'] ?? null
                    );
                    
                    if ($result) {
                        $success_count++;
                        $results[] = ['success' => true, 'id' => $result];
                    } else {
                        $error_count++;
                        $results[] = ['success' => false, 'error' => 'Failed to add sensor data'];
                    }
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => "Bulk operation completed: {$success_count} successful, {$error_count} failed",
                    'results' => $results,
                    'summary' => [
                        'total' => count($input['data']),
                        'successful' => $success_count,
                        'failed' => $error_count
                    ]
                ]);
            }
            break;

        // ==================== EXPORT ENDPOINTS ====================
        case 'export_sensor_data':
            if ($method === 'GET') {
                $format = $_GET['format'] ?? 'json';
                $data = $handler->getAllSensorData();
                
                if ($format === 'csv') {
                    header('Content-Type: text/csv');
                    header('Content-Disposition: attachment; filename="sensor_data_export.csv"');
                    
                    $output = fopen('php://output', 'w');
                    
                    // CSV headers
                    fputcsv($output, [
                        'ID', 'Sensor ID', 'Timestamp', 'Temperature', 'Humidity', 
                        'Travel Duration', 'Coordinates', 'Sensor Type', 'Vehicle Type', 'Driver Name'
                    ]);
                    
                    // CSV data
                    foreach ($data as $row) {
                        fputcsv($output, [
                            $row['sensor_data_id'],
                            $row['sensor_id'],
                            $row['timestamp'],
                            $row['temperature'],
                            $row['humidity'],
                            $row['travel_duration'],
                            $row['coordinates'],
                            $row['sensor_type'],
                            $row['vehicle_type'],
                            $row['driver_name']
                        ]);
                    }
                    
                    fclose($output);
                } else {
                    echo json_encode(['success' => true, 'data' => $data]);
                }
            }
            break;

        // ==================== ANALYTICS ENDPOINTS ====================
        case 'get_temperature_trends':
            if ($method === 'GET') {
                $days = $_GET['days'] ?? 7;
                // This would typically involve more complex queries for trend analysis
                // For now, we'll return basic sensor data grouped by date
                $data = $handler->getAllSensorData();
                
                // Group data by date for trend analysis
                $trends = [];
                foreach ($data as $row) {
                    if ($row['temperature'] !== null) {
                        $date = date('Y-m-d', strtotime($row['timestamp']));
                        if (!isset($trends[$date])) {
                            $trends[$date] = [
                                'date' => $date,
                                'temperatures' => [],
                                'avg_temp' => 0,
                                'min_temp' => null,
                                'max_temp' => null
                            ];
                        }
                        $trends[$date]['temperatures'][] = floatval($row['temperature']);
                    }
                }
                
                // Calculate averages and min/max
                foreach ($trends as &$trend) {
                    $temps = $trend['temperatures'];
                    $trend['avg_temp'] = round(array_sum($temps) / count($temps), 2);
                    $trend['min_temp'] = min($temps);
                    $trend['max_temp'] = max($temps);
                    unset($trend['temperatures']); // Remove raw data
                }
                
                echo json_encode(['success' => true, 'data' => array_values($trends)]);
            }
            break;

        case 'get_humidity_trends':
            if ($method === 'GET') {
                $days = $_GET['days'] ?? 7;
                $data = $handler->getAllSensorData();
                
                // Group data by date for trend analysis
                $trends = [];
                foreach ($data as $row) {
                    if ($row['humidity'] !== null) {
                        $date = date('Y-m-d', strtotime($row['timestamp']));
                        if (!isset($trends[$date])) {
                            $trends[$date] = [
                                'date' => $date,
                                'humidity_values' => [],
                                'avg_humidity' => 0,
                                'min_humidity' => null,
                                'max_humidity' => null
                            ];
                        }
                        $trends[$date]['humidity_values'][] = floatval($row['humidity']);
                    }
                }
                
                // Calculate averages and min/max
                foreach ($trends as &$trend) {
                    $humidity = $trend['humidity_values'];
                    $trend['avg_humidity'] = round(array_sum($humidity) / count($humidity), 2);
                    $trend['min_humidity'] = min($humidity);
                    $trend['max_humidity'] = max($humidity);
                    unset($trend['humidity_values']); // Remove raw data
                }
                
                echo json_encode(['success' => true, 'data' => array_values($trends)]);
            }
            break;

        // ==================== REAL-TIME MONITORING ====================
        case 'get_live_sensor_data':
            if ($method === 'GET') {
                $transport_id = $_GET['transport_id'] ?? null;
                $sensor_id = $_GET['sensor_id'] ?? null;
                
                // Get recent sensor data (last 24 hours)
                $data = $handler->getAllSensorData();
                $filtered_data = [];
                
                $cutoff_time = date('Y-m-d H:i:s', strtotime('-24 hours'));
                
                foreach ($data as $row) {
                    if ($row['timestamp'] >= $cutoff_time) {
                        if ($transport_id && $row['transport_id'] != $transport_id) continue;
                        if ($sensor_id && $row['sensor_id'] != $sensor_id) continue;
                        $filtered_data[] = $row;
                    }
                }
                
                echo json_encode(['success' => true, 'data' => $filtered_data]);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action specified']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>

