<?php
require_once '../common/db.php';

class DocumentManagementHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all shipping documents
    public function getAllDocuments() {
        $sql = "SELECT 
                    sd.document_id,
                    sd.shipment_id,
                    sd.document_type,
                    sd.issue_date,
                    sd.issued_by,
                    sd.file_path,
                    sd.approval_status,
                    sd.notes,
                    s.shipment_destination,
                    s.shipment_date,
                    s.status as shipment_status,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name
                FROM Shipping_Documents sd
                LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                ORDER BY sd.issue_date DESC";
        
        $result = $this->conn->query($sql);
        $documents = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $documents[] = $row;
            }
        }
        
        return $documents;
    }

    // Get all shipments
    public function getAllShipments() {
        $sql = "SELECT 
                    s.shipment_id,
                    s.shipment_destination,
                    s.shipment_date,
                    s.status,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                    t.vehicle_type
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                ORDER BY s.shipment_date DESC";
        
        $result = $this->conn->query($sql);
        $shipments = [];
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        return $shipments;
    }



     // Search documents by term (searches shipment_destination, driver_name, and document_type)
    public function searchDocuments($term) {
        $raw = trim((string)$term);
        $like = '%' . strtolower($raw) . '%';
        
        // Check if term is a numeric ID or DOC- formatted ID
        $isNumericId = is_numeric($raw);
        $isFormattedId = preg_match('/^DOC-?(\d+)$/i', $raw, $matches);
        
        $sql = "SELECT 
                sd.document_id,
                sd.shipment_id,
                sd.document_type,
                sd.issue_date,
                sd.issued_by,
                sd.file_path,
                sd.approval_status,
                sd.notes,
                s.shipment_destination,
                s.shipment_date,
                s.status as shipment_status,
                t.vehicle_type,
                CONCAT(d.first_name, ' ', d.last_name) as driver_name
            FROM Shipping_Documents sd
            LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
            LEFT JOIN Transports t ON s.transport_id = t.transport_id
            LEFT JOIN Drivers d ON t.driver_id = d.driver_id
            WHERE LOWER(s.shipment_destination) LIKE ?
               OR LOWER(CONCAT(d.first_name, ' ', d.last_name)) LIKE ?
               OR LOWER(sd.document_type) LIKE ?
               OR sd.document_id = ? " .  // Numeric ID search
               ($isFormattedId ? "OR sd.document_id = ? " : "") .  // Formatted ID search
            "ORDER BY sd.issue_date DESC";
    
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return [];
        }
        
        // Bind parameters based on ID type
        $types = "sssi";
        $params = [$like, $like, $like];
        
        // Numeric ID parameter
        $params[] = $isNumericId ? (int)$raw : 0;
        
        // Formatted ID parameter if exists
        if ($isFormattedId) {
            $types .= "i";
            $params[] = (int)$matches[1];
        }
        
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    
        $documents = [];
        while ($row = $result->fetch_assoc()) {
            $documents[] = $row;
        }
        $stmt->close();
        return $documents;
    }





    // Add a new document
    public function addDocument($data) {
        $filePath = isset($data['file_path']) ? $data['file_path'] : '';
        $stmt = $this->conn->prepare("INSERT INTO Shipping_Documents 
                    (shipment_id, document_type, issue_date, 
                     issued_by, file_path, approval_status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        if ($stmt) {
            $stmt->bind_param("issssss", 
                $data['shipment_id'], 
                $data['document_type'], 
                $data['issue_date'], 
                $data['issued_by'], 
                $filePath, 
                $data['approval_status'], 
                $data['notes']
            );
            
            if ($stmt->execute()) {
                $document_id = $this->conn->insert_id;
                $stmt->close();
                return $document_id;
            }
            $stmt->close();
        }
        return false;
    }

    // Update a document
    public function updateDocument($document_id, $data) {
        $filePath = isset($data['file_path']) ? $data['file_path'] : null;
        $stmt = $this->conn->prepare("UPDATE Shipping_Documents 
                    SET shipment_id = ?, document_type = ?, 
                        issue_date = ?, issued_by = ?, file_path = COALESCE(?, file_path), 
                        approval_status = ?, notes = ?
                    WHERE document_id = ?");
        
        if ($stmt) {
            $stmt->bind_param("issssssi", 
                $data['shipment_id'], 
                $data['document_type'], 
                $data['issue_date'], 
                $data['issued_by'], 
                $filePath, 
                $data['approval_status'], 
                $data['notes'],
                $document_id
            );
            
            $result = $stmt->execute();
            $stmt->close();
            return $result;
        }
        return false;
    }

    // Delete a document
    public function deleteDocument($document_id) {
        $stmt = $this->conn->prepare("DELETE FROM Shipping_Documents WHERE document_id = ?");
        
        if ($stmt) {
            $stmt->bind_param("i", $document_id);
            $result = $stmt->execute();
            $stmt->close();
            return $result;
        }
        return false;
    }

    // Get document by ID
    public function getDocumentById($document_id) {
        $sql = "SELECT 
                    sd.*,
                    s.shipment_destination,
                    s.shipment_date,
                    s.status as shipment_status,
                    t.vehicle_type,
                    CONCAT(d.first_name, ' ', d.last_name) as driver_name
                FROM Shipping_Documents sd
                LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                WHERE sd.document_id = ?";
        
        $stmt = $this->conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("i", $document_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $document = $result->fetch_assoc();
            $stmt->close();
            return $document;
        }
        return null;
    }

    // Get document statistics
    public function getDocumentStats() {
        $stats = [];
        
        // Total documents
        $result = $this->conn->query("SELECT COUNT(*) as total FROM Shipping_Documents");
        $stats['total_documents'] = $result ? $result->fetch_assoc()['total'] : 0;
        
        // Documents by status
        $statusResult = $this->conn->query("SELECT approval_status, COUNT(*) as count 
                                          FROM Shipping_Documents 
                                          GROUP BY approval_status");
        $stats['by_status'] = [];
        if ($statusResult) {
            while ($row = $statusResult->fetch_assoc()) {
                $stats['by_status'][$row['approval_status']] = $row['count'];
            }
        }
        
        // Documents by type
        $typeResult = $this->conn->query("SELECT document_type, COUNT(*) as count 
                                        FROM Shipping_Documents 
                                        GROUP BY document_type");
        $stats['by_type'] = [];
        if ($typeResult) {
            while ($row = $typeResult->fetch_assoc()) {
                $stats['by_type'][$row['document_type']] = $row['count'];
            }
        }
        
        return $stats;
    }
}
?>