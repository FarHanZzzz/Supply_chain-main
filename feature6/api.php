<?php
require_once 'handler.php';

// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Get request data
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestData = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;

// Instantiate handler
$handler = new DocumentManagementHandler();

// Route requests
try {
    switch ($requestMethod) {
        case 'GET':
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'documents':
                        echo json_encode($handler->getAllDocuments());
                        break;
                    case 'document':
                        if (isset($_GET['id'])) {
                            echo json_encode($handler->getDocumentById($_GET['id']));
                        } else {
                            throw new Exception("Document ID required");
                        }
                        break;
                    case 'shipments':
                        echo json_encode($handler->getAllShipments());
                        break;
                    case 'stats':
                        echo json_encode($handler->getDocumentStats());
                        break;
                    default:
                        throw new Exception("Invalid action");
                }
            } else {
                throw new Exception("Action parameter required");
            }
            break;
            
        case 'POST':
            if (!isset($requestData['action'])) {
                throw new Exception("Action parameter required");
            }
            
            switch ($requestData['action']) {
                case 'add':
                    $documentId = $handler->addDocument($requestData);
                    echo json_encode([
                        'success' => $documentId !== false,
                        'document_id' => $documentId
                    ]);
                    break;
                case 'update':
                    if (!isset($requestData['document_id'])) {
                        throw new Exception("Document ID required");
                    }
                    $result = $handler->updateDocument($requestData['document_id'], $requestData);
                    echo json_encode(['success' => $result]);
                    break;
                case 'delete':
                    if (!isset($requestData['document_id'])) {
                        throw new Exception("Document ID required");
                    }
                    $result = $handler->deleteDocument($requestData['document_id']);
                    echo json_encode(['success' => $result]);
                    break;
                default:
                    throw new Exception("Invalid action");
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}