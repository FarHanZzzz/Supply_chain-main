<?php
require_once 'handler.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;
$handler = new AnalyticsHandler();

try {
    if ($method === 'GET') {
        if (!isset($_GET['action'])) throw new Exception('Action parameter required');
        
        switch ($_GET['action']) {
            // KPI and Overview data
            case 'kpis':
                $kpis = $handler->getKPIs();
                error_log("API KPIs endpoint returned " . count($kpis) . " KPI items");
                echo json_encode($kpis);
                break;
                
            // Deliveries CRUD
            case 'deliveries':
                $deliveries = $handler->getAllDeliveries();
                error_log("API deliveries endpoint returned " . count($deliveries) . " records");
                echo json_encode($deliveries);
                break;
            case 'delivery':
                if (!isset($_GET['id'])) throw new Exception('Delivery ID required');
                echo json_encode($handler->getDeliveryById($_GET['id']));
                break;
                
            // Transports CRUD
            case 'transports':
                $transports = $handler->getAllTransports();
                error_log("API transports endpoint returned " . count($transports) . " records");
                echo json_encode($transports);
                break;
            case 'transport':
                if (!isset($_GET['id'])) throw new Exception('Transport ID required');
                echo json_encode($handler->getTransportById($_GET['id']));
                break;
                
            // Dropdown data
            case 'drivers_dropdown':
                echo json_encode($handler->getDriversDropdown());
                break;
            case 'vehicle_types_dropdown':
                echo json_encode($handler->getVehicleTypesDropdown());
                break;
            case 'vehicle_capacities_dropdown':
                echo json_encode($handler->getVehicleCapacitiesDropdown());
                break;
                
            // Chart data
            case 'delivery_chart':
                echo json_encode($handler->getDeliveryChartData());
                break;
            case 'vehicle_chart':
                echo json_encode($handler->getVehicleStatusChartData());
                break;
            case 'spoilage_chart':
                echo json_encode($handler->getSpoilageChartData());
                break;
            case 'reliability_chart':
                echo json_encode($handler->getReliabilityTrendData());
                break;
                
            case 'test':
                echo json_encode(['status' => 'API working', 'timestamp' => date('Y-m-d H:i:s')]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } elseif ($method === 'POST') {
        if (!isset($input['action'])) throw new Exception('Action parameter required');
        
        switch ($input['action']) {
            // Delivery CRUD operations
            case 'add_delivery':
                $id = $handler->addDelivery($input);
                echo json_encode(['success' => $id !== false, 'delivery_id' => $id]);
                break;
                
            case 'update_delivery':
                if (!isset($input['delivery_id'])) throw new Exception('delivery_id required');
                $result = $handler->updateDelivery($input['delivery_id'], $input);
                echo json_encode(['success' => $result]);
                break;
                
            case 'delete_delivery':
                if (!isset($input['delivery_id'])) throw new Exception('delivery_id required');
                $result = $handler->deleteDelivery($input['delivery_id']);
                echo json_encode(['success' => $result]);
                break;
                
            // Transport CRUD operations
            case 'add_transport':
                $id = $handler->addTransport($input);
                echo json_encode(['success' => $id !== false, 'transport_id' => $id]);
                break;
                
            case 'update_transport':
                if (!isset($input['transport_id'])) throw new Exception('transport_id required');
                $result = $handler->updateTransport($input['transport_id'], $input);
                echo json_encode(['success' => $result]);
                break;
                
            case 'delete_transport':
                if (!isset($input['transport_id'])) throw new Exception('transport_id required');
                $result = $handler->deleteTransport($input['transport_id']);
                echo json_encode(['success' => $result]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>

