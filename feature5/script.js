// Feature 5: Order & Delivery Management JavaScript

let currentEditingItem = null;
let currentEditingType = null;
let allOrders = [];
let allDeliveries = [];

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    loadDeliveries();
    loadStats();
    showTab('orders'); // Show orders tab by default
});




// Load orders data
async function loadOrders() {
    try {
        const response = await fetch('api.php?action=orders');
        const orders = await response.json();
        console.log({orders});
        allOrders = orders;
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Failed to load orders data');
    }
}





// Load deliveries data
async function loadDeliveries() {
    try {
        const response = await fetch('api.php?action=deliveries');
        const deliveries = await response.json();
        allDeliveries = deliveries;
        displayDeliveries(deliveries);
    } catch (error) {
        console.error('Error loading deliveries:', error);
        alert('Failed to load deliveries data');
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
    document.getElementById('totalOrders').textContent = stats.total_orders || 0;
    document.getElementById('totalDeliveries').textContent = stats.total_deliveries || 0;
    document.getElementById('recentOrders').textContent = stats.recent_orders || 0;
    document.getElementById('recentDeliveries').textContent = stats.recent_deliveries || 0;
}

// Display orders in table
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.customer_name || ''}</td>
            <td>${order.location || ''}</td>
            <td>${order.order_date || ''}</td>
            <td>
                <button class="btn-edit" onclick="editOrder(${order.order_id})">Edit</button>
                <button class="btn-delete" onclick="deleteOrder(${order.order_id})">Delete</button>
            </td>
        `;
    });
}

// Display deliveries in table
function displayDeliveries(deliveries) {
    const tableBody = document.getElementById('deliveriesTableBody');
    tableBody.innerHTML = '';
    
    deliveries.forEach(delivery => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${delivery.delivery_id}</td>
            <td>${delivery.vehicle_license_no || ''}</td>
            <td>${delivery.date || ''}</td>
            <td>${delivery.time || ''}</td>
            <td>${delivery.delivery_man_name || ''}</td>
            <td>
                <button class="btn-edit" onclick="editDelivery(${delivery.delivery_id})">Edit</button>
                <button class="btn-delete" onclick="deleteDelivery(${delivery.delivery_id})">Delete</button>
            </td>
        `;
    });
}

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to selected tab button
    // event.target.classList.add('active');
}

// Modal functions for orders
function openOrderModal() {
    currentEditingItem = null;
    currentEditingType = 'order';
    document.getElementById('orderModalTitle').textContent = 'Add New Order';
    document.getElementById('orderForm').reset();
    document.getElementById('orderModal').style.display = 'block';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Modal functions for deliveries
function openDeliveryModal() {
    currentEditingItem = null;
    currentEditingType = 'delivery';
    document.getElementById('deliveryModalTitle').textContent = 'Add New Delivery';
    document.getElementById('deliveryForm').reset();
    document.getElementById('deliveryModal').style.display = 'block';
}

function closeDeliveryModal() {
    document.getElementById('deliveryModal').style.display = 'none';
}

// Edit functions
function editOrder(orderId) {
    const order = allOrders.find(o => o.order_id == orderId);
    if (!order) return;
    
    currentEditingItem = orderId;
    currentEditingType = 'order';
    document.getElementById('orderModalTitle').textContent = 'Edit Order';
    document.getElementById('customerName').value = order.customer_name || '';
    document.getElementById('orderLocation').value = order.location || '';
    document.getElementById('orderDate').value = order.order_date || '';
    document.getElementById('orderModal').style.display = 'block';
}

function editDelivery(deliveryId) {
    const delivery = allDeliveries.find(d => d.delivery_id == deliveryId);
    if (!delivery) return;
    
    currentEditingItem = deliveryId;
    currentEditingType = 'delivery';
    document.getElementById('deliveryModalTitle').textContent = 'Edit Delivery';
    document.getElementById('vehicleLicense').value = delivery.vehicle_license_no || '';
    document.getElementById('deliveryDate').value = delivery.date || '';
    document.getElementById('deliveryTime').value = delivery.time || '';
    document.getElementById('deliveryManName').value = delivery.delivery_man_name || '';
    document.getElementById('deliveryModal').style.display = 'block';
}

// Save functions
async function saveOrder() {
    const customerName = document.getElementById('customerName').value;
    const location = document.getElementById('orderLocation').value;
    const orderDate = document.getElementById('orderDate').value;
    
    if (!customerName || !location || !orderDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_order' : 'add_order',
        customer_name: customerName,
        location: location,
        order_date: orderDate
    };
    
    if (currentEditingItem) {
        data.order_id = currentEditingItem;
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
            closeOrderModal();
            loadOrders();
            loadStats();
            alert(currentEditingItem ? 'Order updated successfully' : 'Order added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving order:', error);
        alert('Failed to save order');
    }
}

async function saveDelivery() {
    const vehicleLicense = document.getElementById('vehicleLicense').value;
    const date = document.getElementById('deliveryDate').value;
    const time = document.getElementById('deliveryTime').value;
    const deliveryManName = document.getElementById('deliveryManName').value;
    
    if (!vehicleLicense || !date || !time || !deliveryManName) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_delivery' : 'add_delivery',
        vehicle_license_no: vehicleLicense,
        date: date,
        time: time,
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
            loadDeliveries();
            loadStats();
            alert(currentEditingItem ? 'Delivery updated successfully' : 'Delivery added successfully');
        } else {
            console.error('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving delivery:', error);
        alert('Failed to save delivery');
    }
}

// Delete functions
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_order',
                order_id: orderId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadOrders();
            loadStats();
            alert('Order deleted successfully');
        } else {
            alert('Failed to delete order');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
    }
}

async function deleteDelivery(deliveryId) {
    if (!confirm('Are you sure you want to delete this delivery?')) {
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
            loadDeliveries();
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
function searchOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const filteredOrders = allOrders.filter(order => 
        order.customer_name.toLowerCase().includes(searchTerm) ||
        order.location.toLowerCase().includes(searchTerm)
    );
    displayOrders(filteredOrders);
}

function searchDeliveries() {
    const searchTerm = document.getElementById('deliverySearch').value.toLowerCase();
    const filteredDeliveries = allDeliveries.filter(delivery => 
        delivery.vehicle_license_no.toLowerCase().includes(searchTerm) ||
        delivery.delivery_man_name.toLowerCase().includes(searchTerm)
    );
    displayDeliveries(filteredDeliveries);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const orderModal = document.getElementById('orderModal');
    const deliveryModal = document.getElementById('deliveryModal');
    
    if (event.target == orderModal) {
        closeOrderModal();
    }
    if (event.target == deliveryModal) {
        closeDeliveryModal();
    }
}

