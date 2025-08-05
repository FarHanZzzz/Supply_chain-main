// Feature 1: Product Records JavaScript

let currentEditingItem = null;
let currentEditingType = null;

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCrops();
    loadHarvests();
    loadPackages();
    loadFarms();
    loadPackagedProductBatches();
});

// Load crops data
async function loadCrops() {
    try {
        const response = await fetch('api.php?action=crops');
        if (!response.ok) throw new Error('Network response was not ok');
        const crops = await response.json();
        displayCrops(crops);
    } catch (error) {
        console.error('Error loading crops:', error);
        alert('Failed to load crops data');
    }
}

// Load harvests data
async function loadHarvests() {
    try {
        const response = await fetch('api.php?action=harvests');
        if (!response.ok) throw new Error('Network response was not ok');
        const harvests = await response.json();
        displayHarvests(harvests);
    } catch (error) {
        console.error('Error loading harvests:', error);
        alert('Failed to load harvests data');
    }
}

// Load packages data
async function loadPackages() {
    try {
        const response = await fetch('api.php?action=packages');
        if (!response.ok) throw new Error('Network response was not ok');
        const packages = await response.json();
        displayPackages(packages);
    } catch (error) {
        console.error('Error loading packages:', error);
        alert('Failed to load packages data');
    }
}

// Load farms for dropdown
async function loadFarms() {
    try {
        const response = await fetch('api.php?action=farms');
        if (!response.ok) throw new Error('Network response was not ok');
        const farms = await response.json();
        populateFarmDropdown(farms);
    } catch (error) {
        console.error('Error loading farms:', error);
    }
}

// Load packaged product batches for dropdown
async function loadPackagedProductBatches() {
    try {
        const response = await fetch('api.php?action=batches');
        if (!response.ok) throw new Error('Network response was not ok');
        const batches = await response.json();
        populateBatchDropdown(batches);
    } catch (error) {
        console.error('Error loading batches:', error);
    }
}

// Display crops in table
function displayCrops(crops) {
    const tableBody = document.getElementById('cropsTableBody');
    tableBody.innerHTML = '';
    
    crops.forEach(crop => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${crop.crop_name || ''}</td>
            <td>${crop.crop_type || ''}</td>
            <td>${crop.plant_date || 'N/A'}</td>
            <td>${crop.harvest_date || 'N/A'}</td>
            <td>${crop.harvest_quantity || 'N/A'}</td>
            <td>${crop.harvest_shelf_life || 'N/A'}</td>
            <td>${crop.farm_name || 'N/A'}</td>
            <td>
                <button class="btn-edit" onclick="editCrop(${crop.crop_id}, '${escapeHtml(crop.crop_name)}', '${escapeHtml(crop.crop_type)}')">Edit</button>
                <button class="btn-delete" onclick="deleteCrop(${crop.crop_id})">Delete</button>
            </td>
        `;
    });
}

// Display harvests in table
function displayHarvests(harvests) {
    const tableBody = document.getElementById('harvestsTableBody');
    tableBody.innerHTML = '';
    
    harvests.forEach(harvest => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${harvest.harvest_name || ''}</td>
            <td>${harvest.harvest_type || ''}</td>
            <td>${harvest.harvest_quantity || ''}</td>
            <td>${harvest.harvest_shelf_life || ''}</td>
            <td>${harvest.farm_name || ''}</td>
            <td>${harvest.crop_name || 'N/A'}</td>
            <td>${harvest.plant_date || 'N/A'}</td>
            <td>
                <button class="btn-edit" onclick="editHarvest(${harvest.harvest_id}, '${escapeHtml(harvest.harvest_name)}', '${escapeHtml(harvest.harvest_type)}', ${harvest.harvest_quantity}, '${escapeHtml(harvest.harvest_shelf_life)}')">Edit</button>
                <button class="btn-delete" onclick="deleteHarvest(${harvest.harvest_id})">Delete</button>
            </td>
        `;
    });
}

// Display packages in table
function displayPackages(packages) {
    const tableBody = document.getElementById('packagesTableBody');
    tableBody.innerHTML = '';
    
    packages.forEach(pkg => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${pkg.product_name || ''}</td>
            <td>${pkg.production_quantity || ''}</td>
            <td>${pkg.production_date || ''}</td>
            <td>${pkg.warehouse_name || 'N/A'}</td>
            <td>${pkg.factory_name || ''}</td>
            <td>
                <button class="btn-edit" onclick="editPackage(${pkg.packaged_product_id}, '${escapeHtml(pkg.product_name)}')">Edit</button>
                <button class="btn-delete" onclick="deletePackage(${pkg.packaged_product_id})">Delete</button>
            </td>
        `;
    });
}

// Populate farm dropdown
function populateFarmDropdown(farms) {
    const dropdown = document.getElementById('farmSelect');
    dropdown.innerHTML = '<option value="">Select Farm</option>';
    
    farms.forEach(farm => {
        const option = document.createElement('option');
        option.value = farm.farm_id;
        option.textContent = farm.farm_name;
        dropdown.appendChild(option);
    });
}

// Populate batch dropdown
function populateBatchDropdown(batches) {
    const dropdown = document.getElementById('batchSelect');
    dropdown.innerHTML = '<option value="">Select Batch</option>';
    
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch.packaged_product_batch_id;
        option.textContent = `Batch ${batch.packaged_product_batch_id} (${batch.production_quantity})`;
        dropdown.appendChild(option);
    });
}

// Modal functions
function openCropModal() {
    currentEditingItem = null;
    currentEditingType = 'crop';
    document.getElementById('cropModalTitle').textContent = 'Add New Crop';
    document.getElementById('cropForm').reset();
    document.getElementById('cropModal').style.display = 'block';
}

function openHarvestModal() {
    currentEditingItem = null;
    currentEditingType = 'harvest';
    document.getElementById('harvestModalTitle').textContent = 'Add New Harvest';
    document.getElementById('harvestForm').reset();
    document.getElementById('harvestModal').style.display = 'block';
}

function openPackageModal() {
    currentEditingItem = null;
    currentEditingType = 'package';
    document.getElementById('packageModalTitle').textContent = 'Add New Package';
    document.getElementById('packageForm').reset();
    document.getElementById('packageModal').style.display = 'block';
}

function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
}

function closeHarvestModal() {
    document.getElementById('harvestModal').style.display = 'none';
}

function closePackageModal() {
    document.getElementById('packageModal').style.display = 'none';
}

// Edit functions
function editCrop(cropId, cropName, cropType) {
    currentEditingItem = cropId;
    currentEditingType = 'crop';
    document.getElementById('cropModalTitle').textContent = 'Edit Crop';
    document.getElementById('cropName').value = cropName;
    document.getElementById('cropType').value = cropType;
    document.getElementById('cropModal').style.display = 'block';
}

function editHarvest(harvestId, harvestName, harvestType, harvestQuantity, harvestShelfLife) {
    currentEditingItem = harvestId;
    currentEditingType = 'harvest';
    document.getElementById('harvestModalTitle').textContent = 'Edit Harvest';
    document.getElementById('harvestName').value = harvestName;
    document.getElementById('harvestType').value = harvestType;
    document.getElementById('harvestQuantity').value = harvestQuantity;
    document.getElementById('harvestShelfLife').value = harvestShelfLife;
    document.getElementById('harvestModal').style.display = 'block';
}

function editPackage(packageId, productName) {
    currentEditingItem = packageId;
    currentEditingType = 'package';
    document.getElementById('packageModalTitle').textContent = 'Edit Package';
    document.getElementById('productName').value = productName;
    document.getElementById('packageModal').style.display = 'block';
}

// Save functions
async function saveCrop() {
    const cropName = document.getElementById('cropName').value;
    const cropType = document.getElementById('cropType').value;
    
    if (!cropName || !cropType) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_crop' : 'add_crop',
        crop_name: cropName,
        crop_type: cropType
    };
    
    if (currentEditingItem) {
        data.crop_id = currentEditingItem;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingItem ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        
        if (result.success) {
            closeCropModal();
            loadCrops();
            alert(currentEditingItem ? 'Crop updated successfully' : 'Crop added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving crop:', error);
        alert('Failed to save crop: ' + error.message);
    }
}

async function saveHarvest() {
    const farmId = document.getElementById('farmSelect').value;
    const harvestName = document.getElementById('harvestName').value;
    const harvestType = document.getElementById('harvestType').value;
    const harvestQuantity = document.getElementById('harvestQuantity').value;
    const harvestShelfLife = document.getElementById('harvestShelfLife').value;
    
    if (!farmId || !harvestName || !harvestType || !harvestQuantity || !harvestShelfLife) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_harvest' : 'add_harvest',
        farm_id: parseInt(farmId),
        harvest_name: harvestName,
        harvest_type: harvestType,
        harvest_quantity: parseFloat(harvestQuantity),
        harvest_shelf_life: harvestShelfLife
    };
    
    if (currentEditingItem) {
        data.harvest_id = currentEditingItem;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingItem ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        
        if (result.success) {
            closeHarvestModal();
            loadHarvests();
            alert(currentEditingItem ? 'Harvest updated successfully' : 'Harvest added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving harvest:', error);
        alert('Failed to save harvest: ' + error.message);
    }
}

async function savePackage() {
    const batchId = document.getElementById('batchSelect').value;
    const productName = document.getElementById('productName').value;
    
    if (!batchId || !productName) {
        alert('Please fill in all required fields');
        return;
    }
    
    const data = {
        action: currentEditingItem ? 'update_package' : 'add_package',
        packaged_product_batch_id: parseInt(batchId),
        product_name: productName
    };
    
    if (currentEditingItem) {
        data.packaged_product_id = currentEditingItem;
    }
    
    try {
        const response = await fetch('api.php', {
            method: currentEditingItem ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        
        if (result.success) {
            closePackageModal();
            loadPackages();
            alert(currentEditingItem ? 'Package updated successfully' : 'Package added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving package:', error);
        alert('Failed to save package: ' + error.message);
    }
}

// Delete functions
async function deleteCrop(cropId) {
    if (!confirm('Are you sure you want to delete this crop?')) {
        return;
    }

    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_crop',
                crop_id: cropId
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        
        if (result.success) {
            loadCrops();
            alert('Crop deleted successfully');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete crop'));
        }
    } catch (error) {
        console.error('Error deleting crop:', error);
        alert('Failed to delete crop: ' + error.message);
    }
}

async function deleteHarvest(harvestId) {
    if (!confirm('Are you sure you want to delete this harvest?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_harvest',
                harvest_id: harvestId
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        
        if (result.success) {
            loadHarvests();
            alert('Harvest deleted successfully');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete harvest'));
        }
    } catch (error) {
        console.error('Error deleting harvest:', error);
        alert('Failed to delete harvest: ' + error.message);
    }
}

async function deletePackage(packageId) {
    if (!confirm('Are you sure you want to delete this package?')) {
        return;
    }
    
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete_package',
                packaged_product_id: packageId
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        
        if (result.success) {
            loadPackages();
            alert('Package deleted successfully');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete package'));
        }
    } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete package: ' + error.message);
    }
}

// Search functionality
function searchCrops() {
    const searchTerm = document.getElementById('cropSearch').value.toLowerCase();
    const table = document.getElementById('cropsTable');
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) {
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

function searchHarvests() {
    const searchTerm = document.getElementById('harvestSearch').value.toLowerCase();
    const table = document.getElementById('harvestsTable');
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) {
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

function searchPackages() {
    const searchTerm = document.getElementById('packageSearch').value.toLowerCase();
    const table = document.getElementById('packagesTable');
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) {
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

// Utility function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}