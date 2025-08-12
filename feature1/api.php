<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
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
                case 'crop_sowings':
                    echo json_encode($handler->getAllCropSowings());
                    break;
                case 'traceability':
                    if (!isset($_GET['packaged_product_id'])) {
                        echo json_encode(['error' => 'packaged_product_id required']);
                        break;
                    }
                    $id = (int)$_GET['packaged_product_id'];
                    $trace = $handler->getProductTraceability($id);
                    if (!$trace) {
                        echo json_encode(['error' => 'No traceability found for this packaged product']);
                    } else {
                        echo json_encode($trace);
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
                    $result = $handler->addPackage($input['packaged_product_batch_id'], $input['product_name'], $input['storage_requirements'], $input['packaging_details']);
                    if ($result) {
                        echo json_encode(['success' => true, 'id' => $result]);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Failed to add package']);
                    }
                    break;
                case 'add_crop_sowing':
                    $result = $handler->addCropSowing(
                        $input['harvest_id'],
                        $input['crop_id'],
                        $input['plant_date'],
                        $input['harvest_date']
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
                        $input['product_name'],
                        $input['storage_requirements'],
                        $input['packaging_details']
                    );
                    echo json_encode(['success' => $result]);
                    break;
                case 'update_crop_sowing':
    $old_crop_id    = isset($input['old_crop_id']) ? intval($input['old_crop_id']) : 0;
    $old_harvest_id = isset($input['old_harvest_id']) ? intval($input['old_harvest_id']) : 0;
    $new_crop_id    = isset($input['crop_id']) ? intval($input['crop_id']) : 0;
    $new_harvest_id = isset($input['harvest_id']) ? intval($input['harvest_id']) : 0;
    $plant_date     = $input['plant_date'] ?? null;
    $harvest_date   = $input['harvest_date'] ?? null;

    if (!$old_crop_id || !$old_harvest_id || !$new_crop_id || !$new_harvest_id || !$plant_date || !$harvest_date) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        break;
    }

    $success = $handler->updateCropSowing(
        $old_crop_id,
        $old_harvest_id,
        $new_crop_id,
        $new_harvest_id,
        $plant_date,
        $harvest_date
    );

    echo json_encode(['success' => $success]);
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
                case 'delete_crop_sowing':
                    $result = $handler->deleteCropSowing(
                        $input['harvest_id'],
                        $input['crop_id']
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
        
    default:
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

