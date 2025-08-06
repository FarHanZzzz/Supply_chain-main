// Feature 6: Delivery Document Management JavaScript

let currentEditingItem = null;
let allDeliveryDocuments = [];

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDeliveryDocuments();
    loadStats();
});

// Load delivery documents data
async function loadDeliveryDocuments() {
    try {
        const response = await fetch('api.php?action=delivery_documents');
        const documents = await response.json();
        allDeliveryDocuments = documents;
        displayDeliveryDocuments(documents);
    } catch (error) {
        console.error('Error loading delivery documents:', error);
        alert('Failed to load delivery documents data');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('api.php?action=stats');
        const stats = await response.json();
        displayStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Display statistics
function displayStats(stats) {
    document.getElementById('totalDeliveries').textContent = stats.total_deliveries || 0;
    document.getElementById('totalBatchesShipped').textContent = stats.total_batches_shipped || 0;
    document.getElementById('totalItemsShipped').textContent = stats.total_items_shipped || 0;
}

// Display delivery documents in table
function displayDeliveryDocuments(documents) {
    const tableBody = document.getElementById('deliveriesTableBody');
    tableBody.innerHTML = '';
    
    documents.forEach(doc => {
        const row = tableBody.insertRow();
        
        // Format date and time
        const deliveryDateTime = `${doc.delivery_date || ''} ${doc.delivery_time || ''}`;
        
        // Format order details
        const orderDetails = doc.order_id ? 
            `Order #${doc.order_id}<br><small class="order-info">${doc.order_location || ''}</small>` : 
            'N/A';
        
        // Format batch info
        const batchInfo = doc.packaged_product_batch_number ? 
            `<span class="batch-info">Batch: ${doc.packaged_product_batch_number}</span>` : 
            'N/A';
        
        // Format warehouse info
        const warehouseInfo = doc.warehouse_name ? 
            `<span class="warehouse-info">${doc.warehouse_name}</span>` : 
            'N/A';
        
        // Format product items
        const productItems = doc.packaged_product_items || 'N/A';
        
        // Format quantity and price
        const quantity = doc.orderline_quantity || 'N/A';
        const totalPrice = doc.orderline_total_price ? `$${parseFloat(doc.orderline_total_price).toFixed(2)}` : 'N/A';
        
        row.innerHTML = `

        
            <td>${doc.document_id || ''}</td>
            <td>${doc.vehicle_license_no || ''}</td>
            <td>${deliveryDateTime}</td>
            <td>${doc.delivery_man_name || ''}</td>
            <td>${warehouseInfo}</td>
            <td>${batchInfo}</td>
            <td><div class="traceability-info">${productItems}</div></td>
            <td>${orderDetails}</td>
            <td>${quantity}</td>
            <td>${totalPrice}</td>
            <td>
                <button class="btn-edit" onclick="editDelivery(${doc.document_id})">Edit</button>
                <button class="btn-delete" onclick="deleteDelivery(${doc.document_id})">Delete</button>
            </td>
        `;
    });
}

// Modal functions
function openDeliveryModal() {
    currentEditingItem = null;
    document.getElementById('deliveryModalTitle').textContent = 'Add New Delivery';
    document.getElementById('deliveryForm').reset();
    document.getElementById('deliveryModal').style.display = 'block';
    
    // Set default date to today
    document.getElementById('deliveryDate').value = new Date().toISOString().split('T')[0];
}

function closeDeliveryModal() {
    document.getElementById('deliveryModal').style.display = 'none';
}

// Edit function
function editDelivery(deliveryId) {
    const delivery = allDeliveryDocuments.find(d => d.document_id == deliveryId);
    if (!delivery) return;
    
    currentEditingItem = deliveryId;
    document.getElementById('deliveryModalTitle').textContent = 'Edit Delivery';
    document.getElementById('vehicleLicense').value = delivery.vehicle_license_no || '';
    document.getElementById('deliveryDate').value = delivery.delivery_date || '';
    document.getElementById('deliveryTime').value = delivery.delivery_time || '';
    document.getElementById('deliveryManName').value = delivery.delivery_man_name || '';
    document.getElementById('deliveryModal').style.display = 'block';
}

// Save function
async function saveDelivery() {
    const vehicleLicense = document.getElementById('vehicleLicense').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    const deliveryTime = document.getElementById('deliveryTime').value;
    const deliveryManName = document.getElementById('deliveryManName').value;
    
    if (!vehicleLicense || !deliveryDate || !deliveryTime || !deliveryManName) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_delivery' : 'add_delivery',
        vehicle_license_no: vehicleLicense,
        date: deliveryDate,
        time: deliveryTime,
        delivery_man_name: deliveryManName
    };
    
    if (currentEditingItem) {
        data.delivery_id = currentEditingItem;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingItem ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeDeliveryModal();
            loadDeliveryDocuments();
            loadStats();
            alert(currentEditingItem ? 'Delivery updated successfully' : 'Delivery added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving delivery:', error);
        alert('Failed to save delivery');
    }
}

// Delete function
async function deleteDelivery(deliveryId) {
    if (!confirm('Are you sure you want to delete this delivery? This will also affect related traceability records.')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_delivery',
                delivery_id: deliveryId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadDeliveryDocuments();
            loadStats();
            alert('Delivery deleted successfully');
        } else {
            alert('Failed to delete delivery');
        }
    } catch (error) {
        console.error('Error deleting delivery:', error);
        alert('Failed to delete delivery');
    }
}

// Search functionality
function searchDeliveries() {
    const searchTerm = document.getElementById('deliverySearch').value.toLowerCase();
    const filteredDocuments = allDeliveryDocuments.filter(doc => 
        (doc.vehicle_license_no && doc.vehicle_license_no.toLowerCase().includes(searchTerm)) ||
        (doc.delivery_man_name && doc.delivery_man_name.toLowerCase().includes(searchTerm)) ||
        (doc.warehouse_name && doc.warehouse_name.toLowerCase().includes(searchTerm)) ||
        (doc.packaged_product_batch_number && doc.packaged_product_batch_number.toLowerCase().includes(searchTerm)) ||
        (doc.packaged_product_items && doc.packaged_product_items.toLowerCase().includes(searchTerm)) ||
        (doc.order_location && doc.order_location.toLowerCase().includes(searchTerm))
    );
    displayDeliveryDocuments(filteredDocuments);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('deliveryModal');
    
    if (event.target == modal) {
        closeDeliveryModal();
    }
}

