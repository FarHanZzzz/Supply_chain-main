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
            
            <td>
                <button class="btn-edit" onclick="editHarvest(
                    ${harvest.harvest_id},
                    '${escapeHtml(harvest.harvest_name)}',
                    '${escapeHtml(harvest.harvest_type)}',
                     ${harvest.harvest_quantity},
                    '${escapeHtml(harvest.harvest_shelf_life)}',
                     ${harvest.farm_id}
                     )">Edit</button>
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
                <button class="btn-edit" 
                    onclick="editPackage(
                    ${pkg.packaged_product_id}, 
                    '${escapeHtml(pkg.product_name)}',
                    ${pkg.packaged_product_batch_id}  // NEW PARAM
                    )">Edit</button>
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

// editHarvest:
function editHarvest(id, name, type, qty, life, farmId){
  currentEditingItem = id; currentEditingType='harvest';
  document.getElementById('harvestModalTitle').textContent='Edit Harvest';
  document.getElementById('harvestName').value = name;
  document.getElementById('harvestType').value = type;
  document.getElementById('harvestQuantity').value = qty;
  document.getElementById('harvestShelfLife').value = life;
  document.getElementById('harvestModal').style.display='block';
  // ensure farms are loaded, then set:
  loadFarms().then(()=>{ document.getElementById('farmSelect').value = String(farmId); });
}

function editPackage(packageId, productName, batchId) {
    currentEditingItem = packageId;
    currentEditingType = 'package';
    document.getElementById('packageModalTitle').textContent = 'Edit Package';
    document.getElementById('productName').value = productName;
    document.getElementById('packageModal').style.display = 'block';

    // Ensure batches are loaded, then set the dropdown
    loadPackagedProductBatches().then(() => {document.getElementById('batchSelect').value = String(batchId);
    });
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

// --- Crop Sowing Logic ---
let currentEditingSowing = null;

async function loadSowings() {
    try {
        const response = await fetch('api.php?action=crop_sowings');
        if (!response.ok) throw new Error('Network response was not ok');
        const sowings = await response.json();
        displaySowings(sowings);
    } catch (error) {
        console.error('Error loading sowings:', error);
        alert('Failed to load sowing data');
    }
}

function displaySowings(sowings) {
    const tableBody = document.getElementById('sowingsTableBody');
    tableBody.innerHTML = '';
    sowings.forEach(sowing => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${sowing.crop_name || ''}</td>
            <td>${sowing.harvest_name || ''}</td>
            <td>${sowing.plant_date || ''}</td>
            <td>${sowing.harvest_date || ''}</td>
            <td>
                <button class="btn-edit" onclick="editSowing(${sowing.harvest_id}, ${sowing.crop_id}, '${sowing.plant_date}', '${sowing.harvest_date}')">Edit</button>
                <button class="btn-delete" onclick="deleteSowing(${sowing.harvest_id}, ${sowing.crop_id})">Delete</button>
            </td>
        `;
    });
}

function openSowingModal() {
    currentEditingSowing = null;
    document.getElementById('sowingModalTitle').textContent = 'Add New Sowing';
    document.getElementById('sowingForm').reset();
    document.getElementById('sowingModal').style.display = 'block';
    populateSowingDropdowns();
}

function closeSowingModal() {
    document.getElementById('sowingModal').style.display = 'none';
}

function editSowing(harvestId, cropId, plantDate, harvestDate) {
    currentEditingSowing = { harvestId, cropId };
    document.getElementById('sowingModalTitle').textContent = 'Edit Sowing';
    document.getElementById('sowingCropSelect').value = cropId;
    document.getElementById('sowingHarvestSelect').value = harvestId;
    document.getElementById('plantDate').value = plantDate;
    document.getElementById('sowingHarvestDate').value = harvestDate;
    document.getElementById('sowingModal').style.display = 'block';
    populateSowingDropdowns();
}




async function saveSowing() {
    const cropId = document.getElementById('sowingCropSelect').value;
    const harvestId = document.getElementById('sowingHarvestSelect').value;
    const plantDate = document.getElementById('plantDate').value;
    const harvestDate = document.getElementById('sowingHarvestDate').value;
    if (!cropId || !harvestId || !plantDate || !harvestDate) {
        alert('Please fill in all required fields');
        return;
    }
    const data = {
        action: currentEditingSowing ? 'update_crop_sowing' : 'add_crop_sowing',
        crop_id: parseInt(cropId),
        harvest_id: parseInt(harvestId),
        plant_date: plantDate,
        harvest_date: harvestDate
    };
    if (currentEditingSowing) {
        data.crop_id = currentEditingSowing.cropId;
        data.harvest_id = currentEditingSowing.harvestId;
    }
    try {
        const response = await fetch('api.php', {
            method: currentEditingSowing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        if (result.success) {
            closeSowingModal();
            loadSowings();
            alert(currentEditingSowing ? 'Sowing updated successfully' : 'Sowing added successfully');
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving sowing:', error);
        alert('Failed to save sowing: ' + error.message);
    }
}

async function deleteSowing(harvestId, cropId) {
    if (!confirm('Are you sure you want to delete this sowing record?')) return;
    try {
        const response = await fetch('api.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_crop_sowing', harvest_id: harvestId, crop_id: cropId })
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        if (result.success) {
            loadSowings();
            alert('Sowing deleted successfully');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete sowing'));
        }
    } catch (error) {
        console.error('Error deleting sowing:', error);
        alert('Failed to delete sowing: ' + error.message);
    }
}

async function populateSowingDropdowns() {
    // Populate crop dropdown
    try {
        const cropRes = await fetch('api.php?action=crops');
        const crops = await cropRes.json();
        const cropDropdown = document.getElementById('sowingCropSelect');
        cropDropdown.innerHTML = '<option value="">Select Crop</option>';
        crops.forEach(crop => {
            const option = document.createElement('option');
            option.value = crop.crop_id;
            option.textContent = crop.crop_name;
            cropDropdown.appendChild(option);
        });
    } catch {}
    // Populate harvest dropdown
    try {
        const harvestRes = await fetch('api.php?action=harvests');
        const harvests = await harvestRes.json();
        const harvestDropdown = document.getElementById('sowingHarvestSelect');
        harvestDropdown.innerHTML = '<option value="">Select Harvest</option>';
        harvests.forEach(harvest => {
            const option = document.createElement('option');
            option.value = harvest.harvest_id;
            option.textContent = harvest.harvest_name;
            harvestDropdown.appendChild(option);
        });
    } catch {}
}

function searchSowings() {
    const searchTerm = document.getElementById('sowingSearch').value.toLowerCase();
    const table = document.getElementById('sowingsTable');
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

// --- Traceability Logic ---
async function lookupTraceability() {
    const productId = document.getElementById('traceProductId').value;
    if (!productId) {
        alert('Please enter a Packaged Product ID');
        return;
    }
    try {
        const response = await fetch(`api.php?action=traceability&packaged_product_id=${productId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const trace = await response.json();
        displayTraceability(trace);
    } catch (error) {
        console.error('Error fetching traceability:', error);
        alert('Failed to fetch traceability: ' + error.message);
    }
}

function displayTraceability(trace) {
    const resultDiv = document.getElementById('traceabilityResult');
    if (!trace || trace.error) {
        resultDiv.innerHTML = `<div style="color:red;">${trace && trace.error ? trace.error : 'No traceability data found.'}</div>`;
        return;
    }
    resultDiv.innerHTML = `
        <div style="background:#f8f9fa;padding:20px;border-radius:10px;">
            <h4>Traceability Chain</h4>
            <ul>
                <li><b>Product Name:</b> ${trace.product_name || ''}</li>
                <li><b>Packaged Product Batch ID:</b> ${trace.packaged_product_batch_id || ''}</li>
                <li><b>Product Batch ID:</b> ${trace.product_batch_id || ''}</li>
                <li><b>Production Date:</b> ${trace.production_date || ''}</li>
                <li><b>Factory:</b> ${trace.factory_name || ''}</li>
                <li><b>Harvest:</b> ${trace.harvest_name || ''}</li>
                <li><b>Crop:</b> ${trace.crop_name || ''}</li>
                <li><b>Plant Date:</b> ${trace.plant_date || ''}</li>
                <li><b>Harvest Date:</b> ${trace.harvest_date || ''}</li>
                <li><b>Farm:</b> ${trace.farm_name || ''}</li>
            </ul>
        </div>
    `;
}

// --- Load sowings on page load ---
document.addEventListener('DOMContentLoaded', function() {
    loadSowings();
});