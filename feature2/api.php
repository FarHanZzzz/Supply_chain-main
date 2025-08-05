<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'handler.php';

$handler = new StockMonitoringHandler();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'batches':
                    echo json_encode($handler->getAllHarvestBatches());
                    break;
                case 'summary':
                    echo json_encode($handler->getStockSummary());
                    break;
                case 'harvests':
                    echo json_encode($handler->getAllHarvests());
                    break;
                case 'warehouses':
                    echo json_encode($handler->getAllWarehouses());
                    break;
                case 'search':
                    if (isset($_GET['term'])) {
                        echo json_encode($handler->searchHarvestBatches($_GET['term']));
                    } else {
                        echo json_encode(['error' => 'Search term required']);
                    }
                    break;
                case 'low_stock':
                    echo json_encode($handler->getLowStockItems());
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
                case 'add_batch':
                    $result = $handler->addHarvestBatch(
                        $input['harvest_id'],
                        $input['warehouse_id'],
                        $input['batch_number'],
                        $input['quantity'],
                        $input['status'],
                        $input['storage_date']
                    );
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add batch']);
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
                case 'update_batch':
                    $result = $handler->updateHarvestBatch(
                        $input['harvest_batch_id'],
                        $input['harvest_id'],
                        $input['warehouse_id'],
                        $input['batch_number'],
                        $input['quantity'],
                        $input['status'],
                        $input['storage_date']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_status':
                    $result = $handler->updateBatchStatus(
                        $input['harvest_batch_id'],
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
                case 'delete_batch':
                    $result = $handler->deleteHarvestBatch($input['harvest_batch_id']);
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

