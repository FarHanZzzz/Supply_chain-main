<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'handler.php';

$handler = new OrderManagementHandler();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'orders':
                    echo json_encode($handler->getAllOrders());
                    break;
                case 'deliveries':
                    echo json_encode($handler->getAllDeliveries());
                    break;
                case 'stats':
                    echo json_encode($handler->getOrderStats());
                    break;
                case 'search':
                    if (isset($_GET['term'])) {
                        echo json_encode($handler->searchOrders($_GET['term']));
                    } else {
                        echo json_encode(['error' => 'Search term required']);
                    }
                    break;
                case 'by_location':
                    if (isset($_GET['location'])) {
                        echo json_encode($handler->getOrdersByLocation($_GET['location']));
                    } else {
                        echo json_encode(['error' => 'Location parameter required']);
                    }
                    break;
                case 'recent':
                    echo json_encode($handler->getRecentOrders());
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
                case 'add_order':
                    $result = $handler->addOrder(
                        $input['customer_name'],
                        $input['location'],
                        $input['order_date']
                    );
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add order']);
                    }
                    break;
                case 'add_delivery':
                    $result = $handler->addDelivery(
                        $input['vehicle_license_no'],
                        $input['date'],
                        $input['time'],
                        $input['delivery_man_name']
                    );
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add delivery']);
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
                case 'update_order':
                    $result = $handler->updateOrder(
                        $input['order_id'],
                        $input['customer_name'],
                        $input['location'],
                        $input['order_date']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_delivery':
                    $result = $handler->updateDelivery(
                        $input['delivery_id'],
                        $input['vehicle_license_no'],
                        $input['date'],
                        $input['time'],
                        $input['delivery_man_name']
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
                case 'delete_order':
                    $result = $handler->deleteOrder($input['order_id']);
                    echo json_encode(['success' => $result]);
                    break;
                case 'delete_delivery':
                    $result = $handler->deleteDelivery($input['delivery_id']);
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

