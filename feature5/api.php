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

        // generate_dummy_sensor_data endpoint removed; dummy data is auto-created when adding a sensor

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
                    $input['transport_id'] ?? null
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor added successfully', 'id' => $result]);
                } else {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'message' => 'Sensor of this type is already assigned to this transport']);
                }
            }
            break;

        case 'update_sensor':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $handler->updateSensor(
                    $input['sensor_id'],
                    $input['sensor_type'],
                    $input['transport_id'] ?? null
                );
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Sensor updated successfully']);
                } else {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'message' => 'Sensor of this type is already assigned to this transport']);
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

        // ==================== HELPER ENDPOINTS ====================
        case 'get_warehouses':
            if ($method === 'GET') {
                $data = $handler->getAllWarehouses();
                echo json_encode(['success' => true, 'data' => $data]);
            }
            break;

        case 'get_transports':
            if ($method === 'GET') {
                $data = $handler->getAllTransports();
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