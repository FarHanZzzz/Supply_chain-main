<?php
require_once '../common/db.php';

class DocumentManagementHandler {
    private $conn;
    
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }
    
    // Get all documents with their associated shipments
    public function getAllDocuments() {
        $sql = "SELECT 
                    d.document_id,
                    d.document_type,
                    d.document_number,
                    d.document_name,
                    d.status,
                    d.created_at,
                    d.created_by,
                    GROUP_CONCAT(s.shipment_id) as associated_shipments,
                    COUNT(sd.shipment_id) as shipment_count
                FROM Documents d
                LEFT JOIN Shipment_Documents sd ON d.document_id = sd.document_id
                LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
                GROUP BY d.document_id
                ORDER BY d.created_at DESC";
        
        $result = $this->conn->query($sql);
        $documents = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $documents[] = $row;
            }
        }
        
        return $documents;
    }
    
    // Get document by ID
    public function getDocumentById($document_id) {
        $stmt = $this->conn->prepare("SELECT * FROM Documents WHERE document_id = ?");
        $stmt->bind_param("i", $document_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $document = $result->fetch_assoc();
        $stmt->close();
        
        if ($document) {
            // Get associated shipments
            $stmt = $this->conn->prepare("SELECT 
                                            s.shipment_id, 
                                            s.shipment_destination,
                                            s.shipment_date
                                        FROM Shipment_Documents sd
                                        JOIN Shipments s ON sd.shipment_id = s.shipment_id
                                        WHERE sd.document_id = ?");
            $stmt->bind_param("i", $document_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $document['associated_shipments'] = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
        }
        
        return $document;
    }
    
    // Add new document
    public function addDocument($data) {
        $stmt = $this->conn->prepare("INSERT INTO Documents (
                                        document_type, 
                                        document_number, 
                                        document_name, 
                                        file_path, 
                                        file_size, 
                                        mime_type, 
                                        created_by, 
                                        notes, 
                                        status
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "ssssissss", 
            $data['document_type'], 
            $data['document_number'], 
            $data['document_name'], 
            $data['file_path'], 
            $data['file_size'], 
            $data['mime_type'], 
            $data['created_by'], 
            $data['notes'], 
            $data['status']
        );
        
        if ($stmt->execute()) {
            $document_id = $this->conn->insert_id;
            
            // Link to shipments if provided
            if (!empty($data['shipment_ids'])) {
                foreach ($data['shipment_ids'] as $shipment_id) {
                    $this->linkDocumentToShipment($document_id, $shipment_id);
                }
            }
            
            $stmt->close();
            return $document_id;
        } else {
            $stmt->close();
            return false;
        }
    }
    
    // Update document
    public function updateDocument($document_id, $data) {
        $stmt = $this->conn->prepare("UPDATE Documents SET 
                                        document_type = ?, 
                                        document_number = ?, 
                                        document_name = ?, 
                                        file_path = ?, 
                                        file_size = ?, 
                                        mime_type = ?, 
                                        created_by = ?, 
                                        notes = ?, 
                                        status = ?
                                    WHERE document_id = ?");
        $stmt->bind_param(
            "ssssissssi", 
            $data['document_type'], 
            $data['document_number'], 
            $data['document_name'], 
            $data['file_path'], 
            $data['file_size'], 
            $data['mime_type'], 
            $data['created_by'], 
            $data['notes'], 
            $data['status'],
            $document_id
        );
        
        $result = $stmt->execute();
        $stmt->close();
        
        // Update shipment associations if provided
        if ($result && isset($data['shipment_ids'])) {
            // First remove existing links
            $this->removeDocumentShipmentLinks($document_id);
            
            // Add new links
            foreach ($data['shipment_ids'] as $shipment_id) {
                $this->linkDocumentToShipment($document_id, $shipment_id);
            }
        }
        
        return $result;
    }
    
    // Delete document
    public function deleteDocument($document_id) {
        // First remove shipment associations
        $this->removeDocumentShipmentLinks($document_id);
        
        // Then delete the document
        $stmt = $this->conn->prepare("DELETE FROM Documents WHERE document_id = ?");
        $stmt->bind_param("i", $document_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Link document to shipment
    private function linkDocumentToShipment($document_id, $shipment_id) {
        $stmt = $this->conn->prepare("INSERT INTO Shipment_Documents (shipment_id, document_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $shipment_id, $document_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Remove all shipment links for a document
    private function removeDocumentShipmentLinks($document_id) {
        $stmt = $this->conn->prepare("DELETE FROM Shipment_Documents WHERE document_id = ?");
        $stmt->bind_param("i", $document_id);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get all shipments for dropdown
    public function getAllShipments() {
        $sql = "SELECT shipment_id, shipment_destination, shipment_date FROM Shipments ORDER BY shipment_date DESC";
        $result = $this->conn->query($sql);
        $shipments = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }
        }
        
        return $shipments;
    }
    
    // Get compliance status for a shipment
    public function getShipmentCompliance($shipment_id) {
        // Get shipment details
        $stmt = $this->conn->prepare("SELECT 
                                        s.shipment_id,
                                        s.shipment_destination,
                                        s.shipment_date,
                                        CASE 
                                            WHEN s.shipment_destination LIKE '%International%' THEN 1
                                            ELSE 0
                                        END as is_international
                                    FROM Shipments s
                                    WHERE s.shipment_id = ?");
        $stmt->bind_param("i", $shipment_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $shipment = $result->fetch_assoc();
        $stmt->close();
        
        if (!$shipment) {
            return null;
        }
        
        // Get all relevant requirements
        $sql = "SELECT 
                    cr.requirement_id,
                    cr.requirement_name,
                    cr.description,
                    cr.is_mandatory,
                    CASE 
                        WHEN ? = 1 THEN cr.applies_to_international
                        ELSE cr.applies_to_domestic
                    END as applies_to_shipment,
                    sc.document_id,
                    d.document_number,
                    d.document_name,
                    d.status as document_status,
                    sc.is_compliant,
                    sc.verified_by,
                    sc.verified_at,
                    sc.notes as compliance_notes
                FROM Compliance_Requirements cr
                LEFT JOIN Shipment_Compliance sc ON cr.requirement_id = sc.requirement_id 
                    AND sc.shipment_id = ?
                LEFT JOIN Documents d ON sc.document_id = d.document_id
                WHERE 
                    (? = 1 AND cr.applies_to_international = 1) OR
                    (? = 0 AND cr.applies_to_domestic = 1)
                ORDER BY cr.is_mandatory DESC, cr.requirement_name";
        
        $stmt = $this->conn->prepare($sql);
        $is_international = $shipment['is_international'];
        $stmt->bind_param("iiii", $is_international, $shipment_id, $is_international, $is_international);
        $stmt->execute();
        $result = $stmt->get_result();
        $requirements = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        // Calculate overall compliance
        $is_compliant = true;
        foreach ($requirements as $req) {
            if ($req['is_mandatory'] && $req['applies_to_shipment'] && !$req['is_compliant']) {
                $is_compliant = false;
                break;
            }
        }
        
        return [
            'shipment' => $shipment,
            'requirements' => $requirements,
            'is_compliant' => $is_compliant
        ];
    }
    
    // Update compliance status
    public function updateCompliance($shipment_id, $requirement_id, $document_id, $is_compliant, $verified_by, $notes) {
        // Check if record exists
        $stmt = $this->conn->prepare("SELECT 1 FROM Shipment_Compliance 
                                    WHERE shipment_id = ? AND requirement_id = ?");
        $stmt->bind_param("ii", $shipment_id, $requirement_id);
        $stmt->execute();
        $exists = $stmt->get_result()->num_rows > 0;
        $stmt->close();
        
        if ($exists) {
            // Update existing record
            $stmt = $this->conn->prepare("UPDATE Shipment_Compliance SET
                                            document_id = ?,
                                            is_compliant = ?,
                                            verified_by = ?,
                                            verified_at = NOW(),
                                            notes = ?
                                        WHERE shipment_id = ? AND requirement_id = ?");
            $stmt->bind_param("iissii", $document_id, $is_compliant, $verified_by, $notes, $shipment_id, $requirement_id);
        } else {
            // Insert new record
            $stmt = $this->conn->prepare("INSERT INTO Shipment_Compliance (
                                            shipment_id,
                                            requirement_id,
                                            document_id,
                                            is_compliant,
                                            verified_by,
                                            verified_at,
                                            notes
                                        ) VALUES (?, ?, ?, ?, ?, NOW(), ?)");
            $stmt->bind_param("iiisss", $shipment_id, $requirement_id, $document_id, $is_compliant, $verified_by, $notes);
        }
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
    }
    
    // Get document statistics
    public function getDocumentStats() {
        $stats = [];
        
        // Total documents
        $sql = "SELECT COUNT(*) as total FROM Documents";
        $result = $this->conn->query($sql);
        $stats['total_documents'] = $result->fetch_assoc()['total'];
        
        // Documents by type
        $sql = "SELECT document_type, COUNT(*) as count FROM Documents GROUP BY document_type";
        $result = $this->conn->query($sql);
        $stats['by_type'] = [];
        while ($row = $result->fetch_assoc()) {
            $stats['by_type'][$row['document_type']] = $row['count'];
        }
        
        // Documents by status
        $sql = "SELECT status, COUNT(*) as count FROM Documents GROUP BY status";
        $result = $this->conn->query($sql);
        $stats['by_status'] = [];
        while ($row = $result->fetch_assoc()) {
            $stats['by_status'][$row['status']] = $row['count'];
        }
        
        // Recent documents (last 7 days)
        $sql = "SELECT COUNT(*) as recent FROM Documents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $result = $this->conn->query($sql);
        $stats['recent_documents'] = $result->fetch_assoc()['recent'];
        
        return $stats;
    }
    
    // Search documents
    public function searchDocuments($searchTerm) {
        $searchTerm = '%' . $searchTerm . '%';
        $stmt = $this->conn->prepare("SELECT 
                                        d.*,
                                        GROUP_CONCAT(s.shipment_id) as associated_shipments
                                    FROM Documents d
                                    LEFT JOIN Shipment_Documents sd ON d.document_id = sd.document_id
                                    LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
                                    WHERE 
                                        d.document_number LIKE ? OR
                                        d.document_name LIKE ? OR
                                        d.document_type LIKE ? OR
                                        d.status LIKE ? OR
                                        d.created_by LIKE ?
                                    GROUP BY d.document_id
                                    ORDER BY d.created_at DESC");
        $stmt->bind_param("sssss", $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        $documents = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $documents;
    }
    
    // Get documents by type
    public function getDocumentsByType($document_type) {
        $stmt = $this->conn->prepare("SELECT 
                                        d.*,
                                        GROUP_CONCAT(s.shipment_id) as associated_shipments
                                    FROM Documents d
                                    LEFT JOIN Shipment_Documents sd ON d.document_id = sd.document_id
                                    LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
                                    WHERE d.document_type = ?
                                    GROUP BY d.document_id
                                    ORDER BY d.created_at DESC");
        $stmt->bind_param("s", $document_type);
        $stmt->execute();
        $result = $stmt->get_result();
        $documents = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $documents;
    }
    
    // Get documents by status
    public function getDocumentsByStatus($status) {
        $stmt = $this->conn->prepare("SELECT 
                                        d.*,
                                        GROUP_CONCAT(s.shipment_id) as associated_shipments
                                    FROM Documents d
                                    LEFT JOIN Shipment_Documents sd ON d.document_id = sd.document_id
                                    LEFT JOIN Shipments s ON sd.shipment_id = s.shipment_id
                                    WHERE d.status = ?
                                    GROUP BY d.document_id
                                    ORDER BY d.created_at DESC");
        $stmt->bind_param("s", $status);
        $stmt->execute();
        $result = $stmt->get_result();
        $documents = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $documents;
    }
    
    // Get documents by shipment
    public function getDocumentsByShipment($shipment_id) {
        $stmt = $this->conn->prepare("SELECT 
                                        d.*
                                    FROM Documents d
                                    JOIN Shipment_Documents sd ON d.document_id = sd.document_id
                                    WHERE sd.shipment_id = ?
                                    ORDER BY d.created_at DESC");
        $stmt->bind_param("i", $shipment_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $documents = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $documents;
    }
}
?>