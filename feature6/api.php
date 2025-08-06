<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'handler.php';

$handler = new DocumentManagementHandler();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && !empty($_GET['action'])) {
            switch ($_GET['action']) {
                case 'delivery_documents':
                    echo json_encode($handler->getAllDeliveryDocuments());
                    break;
                case 'stats':
                    echo json_encode($handler->getDeliveryDocumentStats());
                    break;
                case 'warehouses':
                    echo json_encode($handler->getAllWarehouses());
                    break;
                case 'packaged_product_batches':
                    echo json_encode($handler->getAllPackagedProductBatches());
                    break;
                case 'package_products':
                    echo json_encode($handler->getAllPackageProducts());
                    break;
                case 'orders':
                    echo json_encode($handler->getAllOrders());
                    break;
                case 'orderlines':
                    echo json_encode($handler->getAllOrderlines());
                    break;
                case 'search':
                    if (isset($_GET['term'])) {
                        echo json_encode($handler->searchDeliveryDocuments($_GET['term']));
                    } else {
                        echo json_encode(['error' => 'Search term required']);
                    }
                    break;
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            // Log for debugging if action is missing
            error_log("GET without action: " . json_encode($_GET));
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    case 'POST':
        if (isset($input['action'])) {
            switch ($input['action']) {
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
            echo "2nd";
            echo json_encode(['error' => 'Action parameter required']);
        } 
        break;
        
    case 'PUT':
        if (isset($input['action'])) {
            switch ($input['action']) {
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
            echo "3rd";
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    case 'DELETE':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'delete_delivery':
                    $result = $handler->deleteDelivery($input['delivery_id']);
                    echo json_encode(['success' => $result]);
                    break;
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            echo "4th";
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

