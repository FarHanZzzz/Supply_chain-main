<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

require_once "../../common/db.php";
require_once "handler.php";

$handler = new DocumentManagementHandler();
$method = $_SERVER["REQUEST_METHOD"];
$input = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case "GET":
        if (isset($_GET["action"])) {
            switch ($_GET["action"]) {
                case "documents":
                    echo json_encode($handler->getAllDocuments());
                    break;
                case "document":
                    if (isset($_GET["document_id"])) {
                        echo json_encode($handler->getDocumentById($_GET["document_id"]));
                    } else {
                        echo json_encode(["error" => "Document ID required"]);
                    }
                    break;
                case "shipments":
                    echo json_encode($handler->getAllShipments());
                    break;
                case "by_type":
                    if (isset($_GET["document_type"])) {
                        echo json_encode($handler->getDocumentsByType($_GET["document_type"]));
                    } else {
                        echo json_encode(["error" => "Document type required"]);
                    }
                    break;
                case "by_status":
                    if (isset($_GET["status"])) {
                        echo json_encode($handler->getDocumentsByStatus($_GET["status"]));
                    } else {
                        echo json_encode(["error" => "Status required"]);
                    }
                    break;
                case "by_shipment":
                    if (isset($_GET["shipment_id"])) {
                        echo json_encode($handler->getDocumentsByShipment($_GET["shipment_id"]));
                    } else {
                        echo json_encode(["error" => "Shipment ID required"]);
                    }
                    break;
                case "compliance":
                    if (isset($_GET["shipment_id"])) {
                        echo json_encode($handler->getShipmentCompliance($_GET["shipment_id"]));
                    } else {
                        echo json_encode(["error" => "Shipment ID required"]);
                    }
                    break;
                case "stats":
                    echo json_encode($handler->getDocumentStats());
                    break;
                case "search":
                    if (isset($_GET["term"])) {
                        echo json_encode($handler->searchDocuments($_GET["term"]));
                    } else {
                        echo json_encode(["error" => "Search term required"]);
                    }
                    break;
                default:
                    echo json_encode(["error" => "Invalid action"]);
            }
        } else {
            echo json_encode(["error" => "Action parameter required"]);
        }
        break;
        
    case "POST":
        if (isset($input["action"])) {
            switch ($input["action"]) {
                case "add_document":
                    if (empty($input["document_type"]) || empty($input["document_number"])) {
                        echo json_encode(["success" => false, "error" => "Document type and number are required"]);
                        break;
                    }
                    
                    $result = $handler->addDocument([
                        'document_type' => $input["document_type"],
                        'document_number' => $input["document_number"],
                        'document_name' => $input["document_name"] ?? '',
                        'file_path' => $input["file_path"] ?? '',
                        'file_size' => $input["file_size"] ?? 0,
                        'mime_type' => $input["mime_type"] ?? 'application/pdf',
                        'created_by' => $input["created_by"] ?? 'System',
                        'notes' => $input["notes"] ?? '',
                        'status' => $input["status"] ?? 'Draft',
                        'shipment_ids' => $input["shipment_ids"] ?? []
                    ]);
                    
                    if ($result) {
                        echo json_encode(["success" => true, "document_id" => $result]);
                    } else {
                        echo json_encode(["success" => false, "error" => "Failed to add document"]);
                    }
                    break;
                case "update_compliance":
                    if (empty($input["shipment_id"]) || empty($input["requirement_id"])) {
                        echo json_encode(["success" => false, "error" => "Shipment ID and Requirement ID are required"]);
                        break;
                    }
                    
                    $result = $handler->updateCompliance(
                        $input["shipment_id"],
                        $input["requirement_id"],
                        $input["document_id"] ?? null,
                        $input["is_compliant"] ?? false,
                        $input["verified_by"] ?? 'System',
                        $input["notes"] ?? ''
                    );
                    
                    echo json_encode(["success" => $result]);
                    break;
                default:
                    echo json_encode(["error" => "Invalid action"]);
            }
        } else {
            echo json_encode(["error" => "Action parameter required"]);
        }
        break;
        
    case "PUT":
        if (isset($input["action"])) {
            switch ($input["action"]) {
                case "update_document":
                    if (empty($input["document_id"])) {
                        echo json_encode(["success" => false, "error" => "Document ID required"]);
                        break;
                    }
                    
                    $result = $handler->updateDocument($input["document_id"], [
                        'document_type' => $input["document_type"] ?? '',
                        'document_number' => $input["document_number"] ?? '',
                        'document_name' => $input["document_name"] ?? '',
                        'file_path' => $input["file_path"] ?? '',
                        'file_size' => $input["file_size"] ?? 0,
                        'mime_type' => $input["mime_type"] ?? 'application/pdf',
                        'created_by' => $input["created_by"] ?? 'System',
                        'notes' => $input["notes"] ?? '',
                        'status' => $input["status"] ?? 'Draft',
                        'shipment_ids' => $input["shipment_ids"] ?? []
                    ]);
                    
                    echo json_encode(["success" => $result]);
                    break;
                default:
                    echo json_encode(["error" => "Invalid action"]);
            }
        } else {
            echo json_encode(["error" => "Action parameter required"]);
        }
        break;
        
    case "DELETE":
        if (isset($input["action"])) {
            switch ($input["action"]) {
                case "delete_document":
                    if (empty($input["document_id"])) {
                        echo json_encode(["success" => false, "error" => "Document ID required"]);
                        break;
                    }
                    
                    $result = $handler->deleteDocument($input["document_id"]);
                    echo json_encode(["success" => $result]);
                    break;
                default:
                    echo json_encode(["error" => "Invalid action"]);
            }
        } else {
            echo json_encode(["error" => "Action parameter required"]);
        }
        break;
        
    default:
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
?>