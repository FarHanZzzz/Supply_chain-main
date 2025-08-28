<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'handler.php';

$handler = new Feature8Handler();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'kpis':
            echo json_encode($handler->getKPIs());
            break;
        case 'harvest_by_crop':
            echo json_encode($handler->getHarvestByCropType());
            break;
        case 'harvest_by_warehouse':
            echo json_encode($handler->getHarvestQtyByWarehouse());
            break;
        case 'cost_by_destination':
            echo json_encode($handler->getTransportCostByDestination());
            break;
        case 'spoilage_pie':
            echo json_encode($handler->getSpoilagePie());
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'detail' => $e->getMessage()]);
}
