// Initialize variables
let currentDocument = null;
const documentModal = new bootstrap.Modal(document.getElementById('documentModal'));
const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadDocumentStats();
    loadDocuments();
    loadShipments();
    
    // Event Listeners
    document.getElementById('addDocumentBtn').addEventListener('click', openDocumentModal);
    document.getElementById('saveDocumentBtn').addEventListener('click', saveDocument);
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    document.getElementById('searchBtn').addEventListener('click', searchDocuments);
    document.getElementById('statusFilter').addEventListener('change', filterDocuments);
    document.getElementById('typeFilter').addEventListener('change', filterDocuments);
    document.getElementById('downloadBtn').addEventListener('click', downloadDocument);
});

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

// Display document statistics
function displayDocumentStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    
    const statsData = [
        { 
            title: 'Total Documents', 
            value: stats.total_documents || 0,
            icon: 'fas fa-file-alt',
            class: 'total'
        },
        { 
            title: 'Approved', 
            value: stats.by_status?.Approved || 0,
            icon: 'fas fa-check-circle',
            class: 'approved'
        },
        { 
            title: 'Pending', 
            value: stats.by_status?.Pending || 0,
            icon: 'fas fa-clock',
            class: 'pending'
        },
        { 
            title: 'Rejected', 
            value: stats.by_status?.Rejected || 0,
            icon: 'fas fa-times-circle',
            class: 'rejected'
        }
    ];
    
    let statsHTML = '';
    statsData.forEach(stat => {
        statsHTML += `
            <div class="col-md-3">
                <div class="stat-card ${stat.class} text-white p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0">${stat.value}</h5>
                            <small>${stat.title}</small>
                        </div>
                        <i class="${stat.icon} fa-2x"></i>
                    </div>
                </div>
            </div>
        `;
    });
    
    statsContainer.innerHTML = statsHTML;
}

// Load all documents
async function loadDocuments() {
    try {
        const response = await fetch('api.php?action=documents');
        const documents = await response.json();
        displayDocuments(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Display documents in table
function displayDocuments(documents) {
    const tableBody = document.getElementById('documentsTableBody');
    tableBody.innerHTML = '';
    
    if (!documents || documents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-file-excel fa-3x text-muted mb-3"></i>
                    <h5>No Documents Found</h5>
                    <p>Add your first shipping document to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    documents.forEach(doc => {
        const statusClass = getStatusClass(doc.approval_status);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>DOC-${doc.document_id.toString().padStart(5, '0')}</td>
            <td>${doc.document_type}</td>
            <td>${doc.document_number || 'N/A'}</td>
            <td>
                <div>SH-${doc.shipment_id.toString().padStart(5, '0')}</div>
                <small class="text-muted">${doc.shipment_destination}</small>
            </td>
            <td>${formatDate(doc.issue_date)}</td>
            <td>${doc.issued_by}</td>
            <td><span class="status-badge ${statusClass}">${doc.approval_status}</span></td>
            <td>
                <button class="action-btn btn-view" data-id="${doc.document_id}" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn btn-edit" data-id="${doc.document_id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-delete" data-id="${doc.document_id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => viewDocument(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editDocument(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteDocument(btn.dataset.id));
    });
}

// Get status class for styling
function getStatusClass(status) {
    if (!status) return 'status-pending';
    
    switch (status.toLowerCase()) {
        case 'approved':
            return 'status-approved';
        case 'rejected':
            return 'status-rejected';
        default:
            return 'status-pending';
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
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

// Populate shipment dropdown
function populateShipmentDropdown(shipments) {
    const dropdown = document.getElementById('shipmentId');
    dropdown.innerHTML = '<option value="">Select Shipment</option>';
    
    if (!shipments || shipments.length === 0) return;
    
    shipments.forEach(shipment => {
        const option = document.createElement('option');
        option.value = shipment.shipment_id;
        option.textContent = `SH-${shipment.shipment_id.toString().padStart(5, '0')} - ${shipment.shipment_destination}`;
        dropdown.appendChild(option);
    });
}

// Open document modal for adding
function openDocumentModal() {
    currentDocument = null;
    document.getElementById('modalTitle').textContent = 'Add New Document';
    document.getElementById('documentForm').reset();
    document.getElementById('documentId').value = '';
    document.getElementById('approvalStatus').value = 'Pending';
    documentModal.show();
}


// Edit document - FIXED
async function editDocument(documentId) {
    try {
        const response = await fetch(`api.php?action=document&id=${documentId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // CHANGE THIS VARIABLE NAME - THIS IS THE CAUSE OF THE ERROR
        const docData = await response.json(); // Changed from 'document' to 'docData'
        
        if (!docData || !docData.document_id) {
            throw new Error('Document not found');
        }
        
        // Reset form before populating
        document.getElementById('documentForm').reset();
        
        // Populate form - note: using docData instead of document
        document.getElementById('modalTitle').textContent = 'Edit Document';
        document.getElementById('documentId').value = docData.document_id;
        document.getElementById('documentType').value = docData.document_type || '';
        document.getElementById('documentNumber').value = docData.document_number || '';
        
        // Load shipments before setting value
        await loadShipments();
        document.getElementById('shipmentId').value = docData.shipment_id || '';
        
        // Format date for input field (YYYY-MM-DD)
        const issueDate = docData.issue_date ? new Date(docData.issue_date) : null;
        document.getElementById('issueDate').value = issueDate ? 
            issueDate.toISOString().split('T')[0] : '';
        
        document.getElementById('issuedBy').value = docData.issued_by || '';
        document.getElementById('filePath').value = docData.file_path || '';
        document.getElementById('approvalStatus').value = docData.approval_status || 'Pending';
        document.getElementById('notes').value = docData.notes || '';
        
        documentModal.show();
        
    } catch (error) {
        console.error('Error loading document:', error);
        alert(`Failed to load document: ${error.message}`);
    }
}
// View document
async function viewDocument(documentId) {
    try {
        const response = await fetch(`api.php?action=document&id=${documentId}`);
        const docData = await response.json();
        
        if (document) {
            // Populate view modal
             document.getElementById('viewDocumentType').textContent = docData.document_type || 'N/A';
            document.getElementById('viewDocumentNumber').textContent = document.document_number || 'N/A';
            
            const statusBadge = document.getElementById('viewStatus');
            statusBadge.textContent = document.approval_status;
            statusBadge.className = `status-badge ${getStatusClass(document.approval_status)}`;
            
            document.getElementById('viewDestination').textContent = document.shipment_destination || 'N/A';
            document.getElementById('viewShipmentDate').textContent = formatDate(document.shipment_date) || 'N/A';
            document.getElementById('viewDriver').textContent = document.driver_name || 'N/A';
            document.getElementById('viewVehicle').textContent = document.vehicle_type || 'N/A';
            document.getElementById('viewIssueDate').textContent = formatDate(document.issue_date) || 'N/A';
            document.getElementById('viewIssuedBy').textContent = document.issued_by || 'N/A';
            
            // FIX: File path handling
            const filePath = document.file_path || '';
            document.getElementById('viewFilePath').textContent = filePath || 'No file attached';
            
            // Set download button
            const downloadBtn = document.getElementById('downloadBtn');
            if (filePath) {
                downloadBtn.disabled = false;
                downloadBtn.onclick = () => downloadDocument(filePath);
            } else {
                downloadBtn.disabled = true;
            }
            
            document.getElementById('viewNotes').textContent = document.notes || 'No notes available';
            
            viewModal.show();
        }
    } catch (error) {
        console.error('Error loading document:', error);
        alert('Failed to load document details');
    }
}


// Download document
function downloadDocument(filePath) {
    if (!filePath) {
        alert('No file path available for download');
        return;
    }
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.split('/').pop() || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Save document (add or update)
async function saveDocument() {
    const documentId = document.getElementById('documentId').value;
    const formData = {
        shipment_id: document.getElementById('shipmentId').value,
        document_type: document.getElementById('documentType').value,
        document_number: document.getElementById('documentNumber').value,
        issue_date: document.getElementById('issueDate').value,
        issued_by: document.getElementById('issuedBy').value,
        file_path: document.getElementById('filePath').value,
        approval_status: document.getElementById('approvalStatus').value,
        notes: document.getElementById('notes').value
    };
    
    // Validate required fields
    if (!formData.shipment_id || !formData.document_type || !formData.issued_by || !formData.issue_date) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const action = documentId ? 'update' : 'add';
        const url = 'api.php';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                document_id: documentId,
                ...formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            documentModal.hide();
            refreshData();
            alert(`Document ${documentId ? 'updated' : 'added'} successfully!`);
        } else {
            alert('Error saving document. Please try again.');
        }
    } catch (error) {
        console.error('Error saving document:', error);
        alert('Failed to save document');
    }
}

// Delete document
async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete',
                document_id: documentId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            refreshData();
            alert('Document deleted successfully!');
        } else {
            alert('Error deleting document. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document');
    }
}

// Search documents
function searchDocuments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('documentsTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        let match = false;
        
        for (let cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchTerm)) {
                match = true;
                break;
            }
        }
        
        row.style.display = match ? '' : 'none';
    }
}

// Filter documents by status and type
function filterDocuments() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const tableBody = document.getElementById('documentsTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const statusCell = row.cells[6];
        const typeCell = row.cells[1];
        
        const statusMatch = !statusFilter || statusCell.textContent.includes(statusFilter);
        const typeMatch = !typeFilter || typeCell.textContent.includes(typeFilter);
        
        row.style.display = (statusMatch && typeMatch) ? '' : 'none';
    }
}

// Refresh all data
function refreshData() {
    loadDocumentStats();
    loadDocuments();
    loadShipments();
}