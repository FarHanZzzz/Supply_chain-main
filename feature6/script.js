// Initialize variables
let currentDocument = null;
const documentModal = new bootstrap.Modal(document.getElementById('documentModal'));
const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
let searchTimeout;

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
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchDocuments();
        }
    });
    
    // Add debouncing for search input
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchDocuments, 300);
    });
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


// Edit document
async function editDocument(documentId) {
    try {
        const response = await fetch(`api.php?action=document&id=${documentId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const docData = await response.json();
        
        if (!docData || !docData.document_id) {
            throw new Error('Document not found');
        }
        
        // Reset form before populating
        document.getElementById('documentForm').reset();
        
        // Populate form
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
        // Clear previous modal content
        const modalBody = document.querySelector('#viewModal .modal-body');
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading document details...</p>
            </div>
        `;
        
        // Show modal immediately
        viewModal.show();
        
        // Fetch document data
        const response = await fetch(`api.php?action=document&id=${documentId}`);
        
        // Check for HTTP errors
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const docData = await response.json();
        
        // Check if we got valid document data
        if (!docData || typeof docData !== 'object' || !docData.document_id) {
            throw new Error('Invalid document data received');
        }
        
        // Rebuild modal content with actual data
        modalBody.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-8">
                    <h4>${docData.document_type || 'N/A'}</h4>
                    <p class="mb-1"><strong>Document Number:</strong> ${docData.document_number || 'N/A'}</p>
                    <p class="mb-1"><strong>Status:</strong> <span class="status-badge ${getStatusClass(docData.approval_status)}">${docData.approval_status || 'Unknown'}</span></p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-primary" id="downloadBtn" ${!docData.file_path ? 'disabled' : ''}>
                        <i class="fas fa-download me-1"></i> Download
                    </button>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h6>Shipment Information</h6>
                    <p class="mb-1"><strong>Destination:</strong> ${docData.shipment_destination || 'N/A'}</p>
                    <p class="mb-1"><strong>Shipment Date:</strong> ${formatDate(docData.shipment_date) || 'N/A'}</p>
                    <p class="mb-1"><strong>Driver:</strong> ${docData.driver_name || 'N/A'}</p>
                    <p class="mb-1"><strong>Vehicle:</strong> ${docData.vehicle_type || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Document Details</h6>
                    <p class="mb-1"><strong>Issue Date:</strong> ${formatDate(docData.issue_date) || 'N/A'}</p>
                    <p class="mb-1"><strong>Issued By:</strong> ${docData.issued_by || 'N/A'}</p>
                    
                </div>
            </div>
            
            <div class="mb-3">
                <h6>Notes</h6>
                <p class="p-3 bg-light rounded">${docData.notes || 'No notes available'}</p>
            </div>
        `;
        
        // Attach generate PDF using jsPDF (Feature 1 style)
        document.getElementById('downloadBtn').addEventListener('click', () => {
            generateDocumentPDF(docData);
        });
        
    } catch (error) {
        console.error('Error loading document:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error Loading Document</h5>
                <p>${error.message}</p>
                <p>Please try again or contact support.</p>
            </div>
        `;
    }
}

// Download document
function generateDocumentPDF(doc) {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();
    const title = `${doc.document_type || 'Document'} (${doc.document_number || 'N/A'})`;
    docPdf.setFontSize(16);
    docPdf.text(title, 14, 16);

    docPdf.setFontSize(11);
    const rows1 = [
        ['Status', doc.approval_status || 'N/A'],
        ['Issue Date', formatDate(doc.issue_date) || 'N/A'],
        ['Issued By', doc.issued_by || 'N/A'],
    ];
    docPdf.autoTable({ startY: 22, head: [['Field', 'Value']], body: rows1, theme: 'grid' });

    const startY2 = docPdf.lastAutoTable.finalY + 6;
    docPdf.setFontSize(13);
    docPdf.text('Shipment Information', 14, startY2);
    const rows2 = [
        ['Shipment ID', doc.shipment_id ? `SH-${String(doc.shipment_id).padStart(5,'0')}` : 'N/A'],
        ['Destination', doc.shipment_destination || 'N/A'],
        ['Shipment Date', formatDate(doc.shipment_date) || 'N/A'],
        ['Driver', doc.driver_name || 'N/A'],
        ['Vehicle', doc.vehicle_type || 'N/A'],
    ];
    docPdf.autoTable({ startY: startY2 + 4, head: [['Field', 'Value']], body: rows2, theme: 'grid' });

    const startY3 = docPdf.lastAutoTable.finalY + 6;
    docPdf.setFontSize(13);
    docPdf.text('Notes', 14, startY3);
    const noteText = doc.notes || 'No notes available';
    const split = docPdf.splitTextToSize(noteText, 180);
    docPdf.text(split, 14, startY3 + 6);

    docPdf.save(`${(doc.document_type || 'document').replace(/\s+/g,'_')}_${doc.document_number || 'N_A'}.pdf`);
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
        // file_path removed per requirements
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

// CORRECTED SEARCH DOCUMENTS FUNCTION
async function searchDocuments() {
    let searchTerm = document.getElementById('searchInput').value.trim();
    
    // Preprocess search term to handle document IDs more flexibly
    if (searchTerm) {
        // Remove DOC- prefix if present for ID searches
        if (searchTerm.toUpperCase().startsWith('DOC-')) {
            searchTerm = searchTerm.substring(4);
        }
        
        // Convert numeric IDs to padded format (00123) for better matching
        if (/^\d+$/.test(searchTerm)) {
            searchTerm = searchTerm.padStart(5, '0');
        }
    }
    
    if (!searchTerm) {
        loadDocuments();
        return;
    }
    
    try {
        // Show loading state
        const tableBody = document.getElementById('documentsTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p>Searching documents...</p>
                </td>
            </tr>
        `;
        
        // Make API call to search endpoint
        const response = await fetch(`api.php?action=search&term=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const documents = await response.json();
        
        if (!documents || !Array.isArray(documents)) {
            throw new Error('Invalid data received from server');
        }

        // Display the search results
        displayDocuments(documents);
        
    } catch (error) {
        console.error('Search failed:', error);
        const tableBody = document.getElementById('documentsTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h5>Search Failed</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-sm btn-primary" onclick="loadDocuments()">
                        Reload Documents
                    </button>
                </td>
            </tr>
        `;
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