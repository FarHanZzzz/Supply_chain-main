<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'handler.php';

$handler = new ProductRecordsHandler();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'crops':
                    echo json_encode($handler->getAllCrops());
                    break;
                case 'harvests':
                    echo json_encode($handler->getAllHarvests());
                    break;
                case 'packages':
                    echo json_encode($handler->getAllPackages());
                    break;
                case 'farms':
                    echo json_encode($handler->getAllFarms());
                    break;
                case 'batches':
                    echo json_encode($handler->getAllPackagedProductBatches());
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
                case 'add_crop':
                    $result = $handler->addCrop($input['crop_name'], $input['crop_type']);
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add crop']);
                    }
                    break;
                case 'add_harvest':
                    $result = $handler->addHarvest(
                        $input['farm_id'],
                        $input['harvest_name'],
                        $input['harvest_type'],
                        $input['harvest_quantity'],
                        $input['harvest_shelf_life']
                    );
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add harvest']);
                    }
                    break;
                case 'add_package':
                    $result = $handler->addPackage($input['packaged_product_batch_id'], $input['product_name']);
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add package']);
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
                case 'update_crop':
                    $result = $handler->updateCrop($input['crop_id'], $input['crop_name'], $input['crop_type']);
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_harvest':
                    $result = $handler->updateHarvest(
                        $input['harvest_id'],
                        $input['farm_id'],
                        $input['harvest_name'],
                        $input['harvest_type'],
                        $input['harvest_quantity'],
                        $input['harvest_shelf_life']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_package':
                    $result = $handler->updatePackage(
                        $input['packaged_product_id'],
                        $input['packaged_product_batch_id'],
                        $input['product_name']
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
                case 'delete_crop':
                    $result = $handler->deleteCrop($input['crop_id']);
                    echo json_encode(['success' => $result]);
                    break;
                case 'delete_harvest':
                    $result = $handler->deleteHarvest($input['harvest_id']);
                    echo json_encode(['success' => $result]);
                    break;
                case 'delete_package':
                    $result = $handler->deletePackage($input['packaged_product_id']);
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

