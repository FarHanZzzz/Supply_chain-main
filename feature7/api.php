<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
require_once "../../common/db.php";
}

require_once 'handler.php';

$handler = new AnalyticsHandler();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
            
                case 'system_stats':
                    echo json_encode($handler->getSystemStats());
                    break;
                case 'delivery_performance':
                    echo json_encode($handler->getDeliveryPerformance());
                    break;
                case 'transportation_costs':
                    echo json_encode($handler->getTransportationCosts());
                    break;
                case 'carrier_reliability':
                    echo json_encode($handler->getCarrierReliability());
                    break;
                case 'shipment_trends':
                    $period = isset($_GET['period']) ? intval($_GET['period']) : 30;
                    echo json_encode($handler->getShipmentTrends($period));
                    break;
                case 'product_performance':
                    echo json_encode($handler->getProductPerformance());
                    break;
                case 'route_efficiency':
                    echo json_encode($handler->getRouteEfficiency());
                    break;
                case 'condition_analytics':
                    echo json_encode($handler->getConditionAnalytics());
                    break;
                case 'document_analytics':
                    echo json_encode($handler->getDocumentAnalytics());
                    break;
                case 'export_pdf':
                    $report_type = $_GET['report_type'] ?? 'system_stats';
                    $data = [];
                    $title = '';
                    switch ($report_type) {
                        case 'system_stats':
                            $data = [$handler->getSystemStats()];
                            $title = 'System Statistics Report';
                            break;
                        case 'delivery_performance':
                            $data = [$handler->getDeliveryPerformance()];
                            $title = 'Delivery Performance Report';
                            break;
                        case 'transportation_costs':
                            $data = $handler->getTransportationCosts()['by_vehicle_type'];
                            $title = 'Transportation Costs Report';
                            break;
                        case 'carrier_reliability':
                            $data = $handler->getCarrierReliability()['drivers'];
                            $title = 'Carrier Reliability Report';
                            break;
                        case 'shipment_trends_daily':
                            $data = $handler->getShipmentTrends(30)['daily'];
                            $title = 'Daily Shipment Trends Report';
                            break;
                        case 'shipment_trends_monthly':
                            $data = $handler->getShipmentTrends(12)['monthly'];
                            $title = 'Monthly Shipment Trends Report';
                            break;
                        case 'product_performance':
                            $data = $handler->getProductPerformance()['top_products'];
                            $title = 'Product Performance Report';
                            break;
                        case 'route_efficiency':
                            $data = $handler->getRouteEfficiency()['destinations'];
                            $title = 'Route Efficiency Report';
                            break;
                        case 'condition_analytics_daily':
                            $data = $handler->getConditionAnalytics()['daily_conditions'];
                            $title = 'Daily Condition Analytics Report';
                            break;
                        case 'condition_analytics_alerts':
                            $data = $handler->getConditionAnalytics()['sensor_alerts'];
                            $title = 'Sensor Alerts Analytics Report';
                            break;
                        case 'document_analytics_status':
                            $data = $handler->getDocumentAnalytics()['status_distribution'];
                            $title = 'Document Status Distribution Report';
                            break;
                        case 'document_analytics_type':
                            $data = $handler->getDocumentAnalytics()['type_distribution'];
                            $title = 'Document Type Distribution Report';
                            break;
                        case 'document_analytics_compliance':
                            $data = $handler->getDocumentAnalytics()['compliance_by_shipment'];
                            $title = 'Document Compliance by Shipment Report';
                            break;
                        default:
                            echo json_encode(['error' => 'Invalid report type']);
                            exit();
                    }
                    $handler->exportToPDF($data, $title);
                    break;
                // case 'custom_report':
                //     if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
                //         $metrics = isset($_GET['metrics']) ? explode(',', $_GET['metrics']) : [];
                //         echo json_encode($handler->generateCustomReport($_GET['start_date'], $_GET['end_date'], $metrics));
                //     } else {
                //         echo json_encode(['error' => 'Start date and end date required']);
                //     }
                //     break;
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
                // case 'generate_report':
                //     if (isset($input['start_date']) && isset($input['end_date'])) {
                //         $metrics = isset($input['metrics']) ? $input['metrics'] : [];
                //         echo json_encode($handler->generateCustomReport($input['start_date'], $input['end_date'], $metrics));
                //     } else {
                //         echo json_encode(['error' => 'Start date and end date required']);
                //     }
                    //break;
                default:
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            echo json_encode(['error' => 'Action parameter required']);
        }
        break;
        
    case 'PUT':
        echo json_encode(['error' => 'PUT method not supported for analytics']);
        break;
        
    case 'DELETE':
        echo json_encode(['error' => 'DELETE method not supported for analytics']);
        break;
        
    default:
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

