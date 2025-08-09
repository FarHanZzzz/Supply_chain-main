<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'handler.php';

$handler = new TransportationPlanningHandler();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'shipments':
                    echo json_encode($handler->getAllShipments());
                    break;
                case 'transports':
                    echo json_encode($handler->getAllTransports());
                    break;
                case 'drivers':
                    echo json_encode($handler->getAllDrivers());
                    break;
                case 'harvest_batches':
                    echo json_encode($handler->getAllHarvestBatches());
                    break;
                case 'packaged_batches':
                    echo json_encode($handler->getAllPackagedProductBatches());
                    break;
                case 'stats':
                    echo json_encode($handler->getTransportationStats());
                    break;
                case 'available_transports':
                    echo json_encode($handler->getAvailableTransports());
                    break;
                case 'search':
                    if (isset($_GET['term'])) {
                        echo json_encode($handler->searchShipments($_GET['term']));
                    } else {
                        echo json_encode(['error' => 'Search term required']);
                    }
                    break;
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    case 'POST':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'add_shipment':
                    $result = $handler->addShipment(
                        $input['transport_id'],
                        $input['harvest_batch_id'] ?? null,
                        $input['packaged_product_batch_id'] ?? null,
                        $input['shipment_date'],
                        $input['shipment_destination'],
                        $input['status']
                    );
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add shipment']);
                    }
                    break;
                case 'add_transport':
                    $result = $handler->addTransport(
                        $input['driver_id'],
                        $input['vehicle_type'],
                        $input['vehicle_capacity'],
                        $input['current_capacity']
                    );
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add transport']);
                    }
                    break;
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    case 'PUT':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'update_shipment':
                    $result = $handler->updateShipment(
                        $input['shipment_id'],
                        $input['transport_id'],
                        $input['harvest_batch_id'] ?? null,
                        $input['packaged_product_batch_id'] ?? null,
                        $input['shipment_date'],
                        $input['shipment_destination'],
                        $input['status']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_transport':
                    $result = $handler->updateTransport(
                        $input['transport_id'],
                        $input['driver_id'],
                        $input['vehicle_type'],
                        $input['vehicle_capacity'],
                        $input['current_capacity']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_status':
                    $result = $handler->updateShipmentStatus(
                        $input['shipment_id'],
                        $input['status']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    case 'DELETE':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'delete_shipment':
                    $result = $handler->deleteShipment($input['shipment_id']);
                    echo json_encode(['success' => $result]);
                    break;
                case 'delete_transport':
                    $result = $handler->deleteTransport($input['transport_id']);
                    echo json_encode(['success' => $result]);
                    break;
            
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

