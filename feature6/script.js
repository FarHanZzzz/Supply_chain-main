// Feature 6: Document Management JavaScript

let currentEditingDocument = null;
let currentTab = 'documents';

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDocuments();
    loadDocumentStats();
    loadShipments();
    loadTransports(); // Load transports for shipment modal
    showTab('documents');
});

// Tab switching
function showTab(tabName) {
    currentTab = tabName;
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to selected tab button
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Load appropriate data
    if (tabName === 'documents') {
        loadDocuments();
    } else if (tabName === 'compliance') {
        loadComplianceData();
    }
}

// Load documents data
async function loadDocuments() {
    try {
        const response = await fetch('api.php?action=documents');
        const documents = await response.json();
        displayDocuments(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        showNotification('Failed to load documents data', 'error');
    }
}

// Load document statistics
async function loadDocumentStats() {
    try {
        const response = await fetch('api.php?action=stats');
        const stats = await response.json();
        displayDocumentStats(stats);
    } catch (error) {
        console.error('Error loading document stats:', error);
    }
}

// Load shipments for dropdown
async function loadShipments() {
    try {
        const response = await fetch('api.php?action=shipments');
        const shipments = await response.json();
        populateShipmentDropdown(shipments);
    } catch (error) {
        console.error('Error loading shipments:', error);
    }
}

// Load transports for dropdown
async function loadTransports() {
    try {
        const response = await fetch('api.php?action=transports');
        const transports = await response.json();
        populateTransportDropdown(transports);
    } catch (error) {
        console.error('Error loading transports:', error);
    }
}

// Display documents in table
function displayDocuments(documents) {
    const tableBody = document.getElementById('documentsTableBody');
    tableBody.innerHTML = '';
    
    documents.forEach(document => {
        const row = tableBody.insertRow();
        const statusClass = getStatusClass(document.document_status);
        
        row.innerHTML = `
            <td>${document.document_id}</td>
            <td>${document.document_name}</td>
            <td>${document.document_type}</td>
            <td>${document.related_entity || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${document.document_status}</span></td>
            <td>${formatDate(document.created_at)}</td>
            <td>${document.created_by}</td>
            <td>
                <button class="btn-view" onclick="viewDocument('${document.document_type}', ${document.document_id})">View</button>
                <button class="btn-edit" onclick="editDocument('${document.document_type}', ${document.document_id})">Edit</button>
                <button class="btn-delete" onclick="deleteDocument('${document.document_type}', ${document.document_id})">Delete</button>
            </td>
        `;
    });
}

// Display document statistics
function displayDocumentStats(stats) {
    document.getElementById('totalDocuments').textContent = stats.total_documents || '0';
    // Assuming 'Draft', 'Pending', 'Approved' are statuses for generic documents, not specific to shipment/order/delivery
    // The backend handler provides total_shipments, total_orders, total_deliveries. We need to adjust this part.
    // For now, let's just show total documents.
    document.getElementById('draftDocuments').textContent = stats.by_type?.Shipment || '0'; // Re-purposing for Shipment count
    document.getElementById('approvedDocuments').textContent = stats.by_type?.Order || '0'; // Re-purposing for Order count
    document.getElementById('recentDocuments').textContent = stats.by_type?.Delivery || '0'; // Re-purposing for Delivery count
}

// Get status class for styling
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'draft':
            return 'status-draft';
        case 'pending':
            return 'status-pending';
        case 'approved':
            return 'status-approved';
        case 'submitted':
            return 'status-submitted';
        case 'completed':
            return 'status-approved'; // Deliveries and Orders are 'Completed'
        default:
            return 'status-default';
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Populate shipment dropdown
function populateShipmentDropdown(shipments) {
    const dropdown = document.getElementById('shipmentSelect');
    if (dropdown) {
        dropdown.innerHTML = '<option value="">Select Shipment</option>';
        shipments.forEach(shipment => {
            const option = document.createElement('option');
            option.value = shipment.shipment_id;
            option.textContent = `SH-${shipment.shipment_id.toString().padStart(6, '0')} - ${shipment.destination}`;
            dropdown.appendChild(option);
        });
    }
}

// Populate transport dropdown
function populateTransportDropdown(transports) {
    const dropdown = document.getElementById('shipmentTransportId');
    if (dropdown) {
        dropdown.innerHTML = '<option value="">Select Transport</option>';
        transports.forEach(transport => {
            const option = document.createElement('option');
            option.value = transport.transport_id;
            option.textContent = `${transport.vehicle_type} (${transport.license_plate})`;
            dropdown.appendChild(option);
        });
    }
}

// Modal functions
function openDocumentModal() {
    currentEditingDocument = null;
    document.getElementById('documentModalTitle').textContent = 'Add New Document';
    document.getElementById('documentForm').reset();
    toggleDocumentFields(); // Reset fields visibility
    document.getElementById('documentModal').style.display = 'block';
}

function closeDocumentModal() {
    document.getElementById('documentModal').style.display = 'none';
}

function closeDocumentDetailsModal() {
    document.getElementById('documentDetailsModal').style.display = 'none';
}

// Toggle document specific fields based on type selection
function toggleDocumentFields() {
    const docType = document.getElementById('documentType').value;
    document.querySelectorAll('.document-fields').forEach(fieldDiv => {
        fieldDiv.style.display = 'none';
    });

    switch (docType) {
        case 'Shipment':
            document.getElementById('shipmentFields').style.display = 'block';
            break;
        case 'Order':
            document.getElementById('orderFields').style.display = 'block';
            break;
        case 'Delivery':
            document.getElementById('deliveryFields').style.display = 'block';
            break;
        default:
            document.getElementById('commonDocumentFields').style.display = 'block';
            break;
    }
}

// Edit document
async function editDocument(type, documentId) {
    currentEditingDocument = { type: type, id: documentId };
    document.getElementById('documentModalTitle').textContent = 'Edit Document';
    document.getElementById('documentForm').reset();

    try {
        const response = await fetch(`api.php?action=document&document_id=${documentId}&document_type=${type}`);
        const doc = await response.json();
        
        if (doc) {
            document.getElementById('documentId').value = doc.document_id;
            document.getElementById('documentType').value = doc.document_type;
            toggleDocumentFields(); // Show relevant fields

            if (doc.document_type === 'Shipment') {
                document.getElementById('shipmentTransportId').value = doc.transport_id || '';
                document.getElementById('shipmentDate').value = doc.shipment_date;
                document.getElementById('shipmentDestination').value = doc.destination;
                document.getElementById('shipmentStatus').value = doc.status;
                document.getElementById('shipmentEstimatedDelivery').value = doc.estimated_delivery;
                document.getElementById('shipmentOrigin').value = doc.origin;
                document.getElementById('shipmentProductDetails').value = doc.product_details;
            } else if (doc.document_type === 'Order') {
                document.getElementById('orderCustomerName').value = doc.customer_name;
                document.getElementById('orderLocation').value = doc.location;
                document.getElementById('orderDate').value = doc.order_date;
            } else if (doc.document_type === 'Delivery') {
                document.getElementById('deliveryVehicleLicenseNo').value = doc.vehicle_license_no;
                document.getElementById('deliveryDate').value = doc.date;
                document.getElementById('deliveryTime').value = doc.time;
                document.getElementById('deliveryManName').value = doc.delivery_man_name;
            } else {
                // Common fields for other document types
                document.getElementById('documentName').value = doc.document_name;
                document.getElementById('documentNumber').value = doc.document_number || '';
                document.getElementById('documentFilePath').value = doc.file_path || '';
                document.getElementById('documentFileSize').value = doc.file_size || 0;
                document.getElementById('documentMimeType').value = doc.mime_type || 'application/pdf';
                document.getElementById('documentCreatedBy').value = doc.created_by || 'System User';
                document.getElementById('documentNotes').value = doc.notes || '';
                document.getElementById('documentStatus').value = doc.status;
            }
            document.getElementById('documentModal').style.display = 'block';
        } else {
            showNotification('Document not found', 'error');
        }
    } catch (error) {
        console.error('Error loading document details:', error);
        showNotification('Failed to load document details', 'error');
    }
}

// View document
async function viewDocument(type, documentId) {
    try {
        const response = await fetch(`api.php?action=document&document_id=${documentId}&document_type=${type}`);
        const doc = await response.json();
        
        if (doc) {
            displayDocumentDetails(doc);
            document.getElementById('documentDetailsModal').style.display = 'block';
        } else {
            showNotification('Document not found', 'error');
        }
    } catch (error) {
        console.error('Error loading document details:', error);
        showNotification('Failed to load document details', 'error');
    }
}

// Display document details in view modal
function displayDocumentDetails(document) {
    document.getElementById('detailDocumentId').textContent = document.document_id;
    document.getElementById('detailDocumentName').textContent = document.document_name;
    document.getElementById('detailDocumentType').textContent = document.document_type;
    document.getElementById('detailRelatedEntity').textContent = document.related_entity || 'N/A';
    document.getElementById('detailDocumentStatus').textContent = document.document_status;
    document.getElementById('detailCreatedAt').textContent = formatDate(document.created_at);
    document.getElementById('detailCreatedBy').textContent = document.created_by;
    document.getElementById('detailNotes').textContent = document.notes || 'No notes';

    // Specific fields for each type (if needed for display, otherwise common fields are enough)
    // For now, relying on common fields and related_entity
}

// Save document
async function saveDocument() {
    const documentType = document.getElementById('documentType').value;
    let data = { action: currentEditingDocument ? 'update_document' : 'add_document' };

    if (currentEditingDocument) {
        data.document_id = currentEditingDocument.id;
        data.document_type = currentEditingDocument.type;
    } else {
        data.document_type = documentType;
    }

    switch (documentType) {
        case 'Shipment':
            data.transport_id = document.getElementById('shipmentTransportId').value ? parseInt(document.getElementById('shipmentTransportId').value) : null;
            data.shipment_date = document.getElementById('shipmentDate').value;
            data.destination = document.getElementById('shipmentDestination').value;
            data.status = document.getElementById('shipmentStatus').value;
            data.estimated_delivery = document.getElementById('shipmentEstimatedDelivery').value;
            data.origin = document.getElementById('shipmentOrigin').value;
            data.product_details = document.getElementById('shipmentProductDetails').value;
            if (!data.shipment_date || !data.destination || !data.status) {
                showNotification('Please fill in all required fields for Shipment', 'error');
                return;
            }
            break;
        case 'Order':
            data.customer_name = document.getElementById('orderCustomerName').value;
            data.location = document.getElementById('orderLocation').value;
            data.order_date = document.getElementById('orderDate').value;
            if (!data.customer_name || !data.location || !data.order_date) {
                showNotification('Please fill in all required fields for Order', 'error');
                return;
            }
            break;
        case 'Delivery':
            data.vehicle_license_no = document.getElementById('deliveryVehicleLicenseNo').value;
            data.date = document.getElementById('deliveryDate').value;
            data.time = document.getElementById('deliveryTime').value;
            data.delivery_man_name = document.getElementById('deliveryManName').value;
            if (!data.vehicle_license_no || !data.date || !data.time || !data.delivery_man_name) {
                showNotification('Please fill in all required fields for Delivery', 'error');
                return;
            }
            break;
        default:
            // Common fields for other document types (Invoice, Bill of Lading, etc.)
            data.document_name = document.getElementById('documentName').value;
            data.document_number = document.getElementById('documentNumber').value;
            data.file_path = document.getElementById('documentFilePath').value;
            data.file_size = document.getElementById('documentFileSize').value ? parseInt(document.getElementById('documentFileSize').value) : 0;
            data.mime_type = document.getElementById('documentMimeType').value;
            data.created_by = document.getElementById('documentCreatedBy').value;
            data.notes = document.getElementById('documentNotes').value;
            data.status = document.getElementById('documentStatus').value;

            if (!data.document_name || !data.document_type) {
                showNotification('Please fill in all required fields for Document', 'error');
                return;
            }
            // For new documents, add file simulation if not provided
            if (!currentEditingDocument && !data.file_path) {
                data.file_path = `/uploads/documents/${data.document_number || 'DOC-' + Date.now()}.pdf`;
                data.file_size = Math.floor(Math.random() * 500000) + 50000; // Random size 50KB-500KB
                data.mime_type = 'application/pdf';
            }
            break;
    }

    try {
        const response = await fetch('api.php', {
            method: currentEditingDocument ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeDocumentModal();
            loadDocuments();
            loadDocumentStats();
            showNotification(currentEditingDocument ? 'Document updated successfully' : 'Document added successfully', 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving document:', error);
        showNotification('Failed to save document', 'error');
    }
}

// Delete document
async function deleteDocument(type, documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_document',
                document_id: documentId,
                document_type: type
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadDocuments();
            loadDocumentStats();
            showNotification('Document deleted successfully', 'success');
        } else {
            showNotification('Failed to delete document', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Failed to delete document', 'error');
    }
}

// Generate sample documents
async function generateSampleDocuments() {
    const shipmentId = prompt('Enter Shipment ID to generate documents for:');
    
    if (!shipmentId || isNaN(shipmentId)) {
        showNotification('Invalid shipment ID specified', 'error');
        return;
    }
    
    const count = prompt('Number of sample documents to generate:', '5');
    
    if (!count || isNaN(count)) {
        showNotification('Invalid count specified', 'error');
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate_sample',
                shipment_id: parseInt(shipmentId),
                count: parseInt(count)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadDocuments();
            loadDocumentStats();
            showNotification(`Generated ${result.generated} sample documents`, 'success');
        } else {
            showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error generating sample documents:', error);
        showNotification('Failed to generate sample documents', 'error');
    }
}

// Search functionality
async function searchDocuments() {
    const searchTerm = document.getElementById('documentSearch').value;
    
    if (searchTerm.trim() === '') {
        loadDocuments();
        return;
    }
    
    try {
        const response = await fetch(`api.php?action=search&term=${encodeURIComponent(searchTerm)}`);
        const documents = await response.json();
        displayDocuments(documents);
    } catch (error) {
        console.error('Error searching documents:', error);
        showNotification('Failed to search documents', 'error');
    }
}

// Filter by status
async function filterByStatus(status) {
    if (status === 'all') {
        loadDocuments();
        return;
    }
    
    try {
        const response = await fetch(`api.php?action=by_status&status=${encodeURIComponent(status)}`);
        const documents = await response.json();
        displayDocuments(documents);
    } catch (error) {
        console.error('Error filtering documents:', error);
        showNotification('Failed to filter documents', 'error');
    }
}

// Filter by type
async function filterByType(documentType) {
    if (documentType === 'all') {
        loadDocuments();
        return;
    }
    
    try {
        const response = await fetch(`api.php?action=by_type&document_type=${encodeURIComponent(documentType)}`);
        const documents = await response.json();
        displayDocuments(documents);
    } catch (error) {
        console.error('Error filtering documents:', error);
        showNotification('Failed to filter documents', 'error');
    }
}

// Load compliance data
async function loadComplianceData() {
    try {
        const response = await fetch('api.php?action=shipments');
        const shipments = await response.json();
        
        const complianceData = [];
        
        for (const shipment of shipments) {
            const complianceResponse = await fetch(`api.php?action=compliance&shipment_id=${shipment.shipment_id}`);
            const compliance = await complianceResponse.json();
            
            complianceData.push({
                shipment_id: shipment.shipment_id,
                destination: shipment.destination,
                product: shipment.product_details || 'N/A',
                invoice: compliance.invoice ? '✅' : '❌',
                bill_of_lading: compliance.bill_of_lading ? '✅' : '❌',
                customs_declaration: compliance.customs_declaration ? '✅' : '❌',
                packing_list: compliance.packing_list ? '✅' : '❌',
                certificate_of_origin: compliance.certificate_of_origin ? '✅' : '❌',
                overall_status: compliance.is_compliant ? 'Compliant' : 'Non-Compliant'
            });
        }
        displayComplianceTable(complianceData);
    } catch (error) {
        console.error('Error loading compliance data:', error);
        showNotification('Failed to load compliance data', 'error');
    }
}

// Display compliance data in table
function displayComplianceTable(complianceData) {
    const tableBody = document.getElementById('complianceTableBody');
    tableBody.innerHTML = '';

    if (complianceData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9">No compliance data available.</td></tr>';
        return;
    }
    
    complianceData.forEach(data => {
        const row = tableBody.insertRow();
        const overallStatusClass = data.overall_status === 'Compliant' ? 'status-compliant' : 'status-non-compliant';
        row.innerHTML = `
            <td>SH-${data.shipment_id.toString().padStart(6, '0')}</td>
            <td>${data.destination}</td>
            <td>${data.product}</td>
            <td><span class="compliance-badge ${data.invoice === '✅' ? 'compliant' : 'missing'}">${data.invoice}</span></td>
            <td><span class="compliance-badge ${data.bill_of_lading === '✅' ? 'compliant' : 'missing'}">${data.bill_of_lading}</span></td>
            <td><span class="compliance-badge ${data.customs_declaration === '✅' ? 'compliant' : 'missing'}">${data.customs_declaration}</span></td>
            <td><span class="compliance-badge ${data.packing_list === '✅' ? 'compliant' : 'missing'}">${data.packing_list}</span></td>
            <td><span class="compliance-badge ${data.certificate_of_origin === '✅' ? 'compliant' : 'missing'}">${data.certificate_of_origin}</span></td>
            <td><span class="status-badge ${overallStatusClass}">${data.overall_status}</span></td>
        `;
    });
}

// Refresh all data
function refreshData() {
    loadDocuments();
    loadDocumentStats();
    loadShipments();
    loadTransports();
    if (currentTab === 'compliance') {
        loadComplianceData();
    }
    showNotification('Data refreshed!', 'info');
}

// Export data to PDF
async function exportData() {
    try {
        const response = await fetch('api.php?action=documents'); // Get all documents for export
        const data = await response.json();

        if (data.length === 0) {
            showNotification('No data to export.', 'info');
            return;
        }

        // Construct a form to send data for PDF generation
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'api.php';
        form.target = '_blank'; // Open in new tab

        const actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'action';
        actionInput.value = 'export_pdf';
        form.appendChild(actionInput);

        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'data';
        dataInput.value = JSON.stringify(data);
        form.appendChild(dataInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        showNotification('PDF export initiated!', 'success');

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showNotification('Failed to export PDF.', 'error');
    }
}

// Generic notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}


