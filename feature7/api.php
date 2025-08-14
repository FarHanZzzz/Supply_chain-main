<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once 'handler.php';

$handler = new Feature7AnalyticsHandler();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$action = $_GET['action'] ?? null;

switch ($action) {
  case 'analytics_dimensions':
    echo json_encode($handler->getDimensions());
    break;

  case 'analytics':
    $filters = [
      'from'         => $_GET['from']         ?? null,
      'to'           => $_GET['to']           ?? null,
      'destination'  => $_GET['destination']  ?? null,
      'driver_id'    => $_GET['driver_id']    ?? null,
      'transport_id' => $_GET['transport_id'] ?? null,
      'route_id'     => $_GET['route_id']     ?? null,
      'status'       => $_GET['status']       ?? null
    ];
    echo json_encode($handler->getAnalytics($filters));
    break;

  case 'kpis':
    $filters = [
      'from'         => $_GET['from']         ?? null,
      'to'           => $_GET['to']           ?? null,
      'destination'  => $_GET['destination']  ?? null,
      'driver_id'    => $_GET['driver_id']    ?? null,
      'transport_id' => $_GET['transport_id'] ?? null,
      'route_id'     => $_GET['route_id']     ?? null,
      'status'       => $_GET['status']       ?? null
    ];
    echo json_encode($handler->getKPIs($filters));
    break;

  default:
    echo json_encode(['error' => 'Invalid action']);
}
