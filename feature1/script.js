// Feature 1: Product Records JavaScript

let currentEditingItem = null;
let currentEditingType = null;
let currentEditingSowing = null;
// Keep the latest trace payload for export
let lastTraceability = null;


// -------------------- BOOTSTRAP --------------------
document.addEventListener('DOMContentLoaded', async function () {
  // Test API first
  testAPI();

  // Initial data loads (tables)
  loadCrops();
  loadHarvests();
  loadPackages();
  loadFarms();
  loadSowings();



  // Load batch dropdown options once up front (only unused)
  await loadAvailableBatches();

  // Hook up batch -> product name autofill (after options exist)
  const batchSelect = document.getElementById('batchSelect');
  const productNameInput = document.getElementById('productName');

  if (batchSelect && productNameInput) {
    batchSelect.addEventListener('change', () => {
      const opt = batchSelect.selectedOptions[0];
      if (opt?.dataset.batchName) {
        const firstWord = opt.dataset.batchName.trim().split(' ')[0];
        productNameInput.value = firstWord;
      } else {
        productNameInput.value = '';
      }
    });
  }

  // Load sowings table

});

// -------------------- HELPERS --------------------
async function ensureBatchesLoaded(currentBatchId = null) {
  const sel = document.getElementById('batchSelect');
  if (sel && sel.options.length > 1) return;
  await loadAvailableBatches(currentBatchId);
  await new Promise(r => setTimeout(r, 0));
}

function selectBatchValueReliably(selectEl, wantedValue) {
  const wanted = String(wantedValue ?? '');
  // Try by value
  selectEl.value = wanted;

  if (selectEl.value === wanted) return true;

  // Fallback: find index and set selectedIndex
  const idx = Array.from(selectEl.options).findIndex(o => String(o.value) === wanted);
  if (idx >= 0) {
    selectEl.selectedIndex = idx;
    return selectEl.value === wanted;
  }
  return false;
}

// -------------------- API TEST --------------------
async function testAPI() {
  try {
    const response = await fetch('api.php?action=test');
    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    console.log('API test result:', result);
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// -------------------- LOADERS --------------------
async function loadAvailableBatches(currentBatchId = null) {
  try {
    const [bRes, pRes] = await Promise.all([
      fetch('api.php?action=batches'),
      fetch('api.php?action=packages')
    ]);
    if (!bRes.ok || !pRes.ok) throw new Error('Network response was not ok');

    const batches = await bRes.json();
    const packages = await pRes.json();

    const used = new Set((packages || []).map(p => p.packaged_product_batch_id));

    // Keep the current batch (when editing), otherwise only unused
    const filtered = (batches || []).filter(
      b =>
        (currentBatchId != null && String(b.packaged_product_batch_id) === String(currentBatchId)) ||
        !used.has(b.packaged_product_batch_id)
    );

    populateBatchDropdown(filtered);
  } catch (error) {
    console.error('Error loading available batches:', error);
  }
}

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

  function refreshPackages() { loadPackages(); }
  function refreshHarvests()  { loadHarvests(); }
  function refreshCrops()     { loadCrops(); }
  function refreshSowings()   { loadSowings(); }

// -------------------- RENDERERS --------------------
function displayCrops(crops) {
  const tableBody = document.getElementById('cropsTableBody');
  tableBody.innerHTML = '';
  (crops || []).forEach(crop => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${crop.crop_id || ''}</td>
      <td>${crop.crop_name || ''}</td>
      <td>${crop.crop_type || ''}</td>
      <td>
        <button class="btn-edit" onclick="editCrop(${crop.crop_id}, '${escapeHtml(crop.crop_name)}', '${escapeHtml(crop.crop_type)}')">Edit</button>
        <button class="btn-delete" onclick="deleteCrop(${crop.crop_id})">Delete</button>
      </td>`;
  });
}


function displayHarvests(harvests) {
  const tableBody = document.getElementById('harvestsTableBody');
  tableBody.innerHTML = '';
  (harvests || []).forEach(harvest => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${harvest.harvest_id || ''}</td>
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
      </td>`;
  });
}


function displayPackages(packages) {
  const tableBody = document.getElementById('packagesTableBody');
  tableBody.innerHTML = '';
  (packages || []).forEach(pkg => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${pkg.packaged_product_id || ''}</td>
      <td>${pkg.product_name || ''}</td>
      <td>${pkg.storage_requirements ?? ''}</td>
      <td>${pkg.packaging_details || ''}</td>
      <td>${pkg.production_quantity ?? ''}</td>
      <td>${pkg.production_date || ''}</td>
      <td>${pkg.warehouse_name || 'N/A'}</td>
      <td>${pkg.factory_name || ''}</td>
      <td>
        <button class="btn-edit" onclick="editPackage(
          ${pkg.packaged_product_id},
          '${escapeHtml(pkg.product_name)}',
          ${pkg.packaged_product_batch_id},
          '${escapeHtml(pkg.storage_requirements || '')}',
          '${escapeHtml(pkg.packaging_details || '')}'
        )">Edit</button>
        <button class="btn-delete" onclick="deletePackage(${pkg.packaged_product_id})">Delete</button>
      </td>`;
  });
}


// -------------------- DROPDOWNS --------------------
function populateFarmDropdown(farms) {
  const dropdown = document.getElementById('farmSelect');
  dropdown.innerHTML = '<option value="">Select Farm</option>';
  (farms || []).forEach(farm => {
    const option = document.createElement('option');
    option.value = farm.farm_id;
    option.textContent = farm.farm_name;
    dropdown.appendChild(option);
  });
}

function populateBatchDropdown(batches) {
  const dropdown = document.getElementById('batchSelect');
  const productNameInput = document.getElementById('productName');
  if (!dropdown) return;

  dropdown.innerHTML = '<option value="">Select Batch</option>';

  const seen = new Set();
  for (const batch of (batches || [])) {
    const id = batch.packaged_product_batch_id;
    if (id == null || seen.has(id)) continue;
    seen.add(id);

    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = `Batch ${id} • ${batch.batch_name || 'Unnamed'}`;
    opt.dataset.batchName = batch.batch_name || '';
    dropdown.appendChild(opt);
  }

  // If the current selected value corresponds to an option, keep autofill in sync
  const opt = dropdown.selectedOptions[0];
  if (opt && productNameInput && opt.dataset.batchName) {
    productNameInput.value = opt.dataset.batchName.trim().split(' ')[0];
  }
}

// -------------------- MODALS --------------------
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

async function openPackageModal() {
  currentEditingItem = null;
  currentEditingType = 'package';
  document.getElementById('packageModalTitle').textContent = 'Add New Package';
  document.getElementById('packageForm').reset();
  document.getElementById('packageModal').style.display = 'block';
  await loadAvailableBatches(); // only unused batches
}
function closePackageModal() {
  const modal = document.getElementById('packageModal');
  if (modal) modal.style.display = 'none';

  const form = document.getElementById('packageForm');
  if (form) form.reset();

  currentEditingItem = null;
  currentEditingType = null;
}
function closeHarvestModal() {
    document.getElementById('harvestModal').style.display = 'none';
  currentEditingItem = null;
  currentEditingType = null;
}

function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
}

// -------------------- EDIT HANDLERS --------------------
function editCrop(cropId, cropName, cropType) {
  currentEditingItem = cropId;
  currentEditingType = 'crop';
  document.getElementById('cropModalTitle').textContent = 'Edit Crop';
  document.getElementById('cropName').value = cropName;
  document.getElementById('cropType').value = cropType;
  document.getElementById('cropModal').style.display = 'block';
}

function editHarvest(id, name, type, qty, life, farmId) {
  currentEditingItem = id;
  currentEditingType = 'harvest';
  document.getElementById('harvestModalTitle').textContent = 'Edit Harvest';
  document.getElementById('harvestName').value = name;
  document.getElementById('harvestType').value = type;
  document.getElementById('harvestQuantity').value = qty;
  document.getElementById('harvestShelfLife').value = life;
  document.getElementById('harvestModal').style.display = 'block';
  loadFarms().then(() => {
    document.getElementById('farmSelect').value = String(farmId);
  });
}

// ✅ Robust preselect for Edit Package (Chrome-safe)
async function editPackage(packageId, _productName, batchId, storageRequirements, packagingDetails) {
  currentEditingItem = packageId;
  currentEditingType = 'package';
  document.getElementById('packageModalTitle').textContent = 'Edit Package';
  document.getElementById('packageModal').style.display = 'block';

  await loadAvailableBatches(batchId);

  const batchSelect = document.getElementById('batchSelect');
  const wanted = String(batchId ?? '');

  // Try immediately
  let ok = selectBatchValueReliably(batchSelect, wanted);

  // If Chrome hasn’t applied it yet, retry after a micro-delay
  if (!ok) {
    await new Promise(r => setTimeout(r, 0));
    ok = selectBatchValueReliably(batchSelect, wanted);
  }

  // One more defensive retry after 50ms (covers layout/paint timing)
  if (!ok) {
    await new Promise(r => setTimeout(r, 50));
    selectBatchValueReliably(batchSelect, wanted);
  }

  // Update product name from the selected option (first word)
  const selOpt = batchSelect.selectedOptions[0];
  const productNameInput = document.getElementById('productName');
  if (selOpt?.dataset.batchName && productNameInput) {
    productNameInput.value = selOpt.dataset.batchName.trim().split(' ')[0];
  }

  // Remaining fields
  document.getElementById('storageRequirements').value = storageRequirements || '';
  document.getElementById('packagingDetails').value = packagingDetails || '';
}

// -------------------- SAVE HANDLERS --------------------
async function saveCrop() {
  let cropName = document.getElementById('cropName').value.trim();
  const cropType = document.getElementById('cropType').value;

  // ✅ Validation: Capitalize first letter
  if (cropName.length > 0) {
    cropName = cropName.charAt(0).toUpperCase() + cropName.slice(1);
  }

  // ✅ Validation: Remove trailing 's' (plural -> singular)
  if (cropName.length > 1 && cropName.endsWith('s')) {
    cropName = cropName.slice(0, -1);
  }

  // Put the fixed value back into the input for user visibility
  document.getElementById('cropName').value = cropName;

  if (!cropName || !cropType) {
    alert('Please fill in all required fields');
    return;
  }

  const data = {
    action: currentEditingItem ? 'update_crop' : 'add_crop',
    crop_name: cropName,
    crop_type: cropType
  };
  if (currentEditingItem) data.crop_id = currentEditingItem;

  try {
    const response = await fetch('api.php', {
      method: currentEditingItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  if (currentEditingItem) data.harvest_id = currentEditingItem;

  try {
    const response = await fetch('api.php', {
      method: currentEditingItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const productName = document.getElementById('productName').value.trim();
  const storageRequirements = document.getElementById('storageRequirements').value;
  const packagingDetails = document.getElementById('packagingDetails').value;

  if (!batchId || !productName || !storageRequirements || !packagingDetails) {
    alert('Please fill in all required fields');
    return;
  }

  const isEditing = !!currentEditingItem;
  const data = {
    action: isEditing ? 'update_package' : 'add_package',
    packaged_product_batch_id: parseInt(batchId),
    product_name: productName,
    storage_requirements: storageRequirements,
    packaging_details: packagingDetails
  };
  if (isEditing) data.packaged_product_id = currentEditingItem;

  try {
    const response = await fetch('api.php', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();

    if (result.success) {
  closePackageModal();
  loadPackages();
  await loadAvailableBatches();
  alert(isEditing ? 'Package updated successfully' : 'Package added successfully');
} else {
      alert('Error: ' + (result.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error saving package:', err);
    alert('Failed to save package: ' + err.message);
  }
}

// -------------------- DELETE HANDLERS --------------------
async function deleteCrop(cropId) {
  if (!confirm('Are you sure you want to delete this crop?')) return;
  try {
    const response = await fetch('api.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_crop', crop_id: cropId })
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
  if (!confirm('Are you sure you want to delete this harvest?')) return;
  try {
    const response = await fetch('api.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_harvest', harvest_id: harvestId })
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
  if (!confirm('Are you sure you want to delete this package?')) return;
  try {
    const response = await fetch('api.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_package', packaged_product_id: packageId })
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    if (result.success) {
      loadPackages();
      await loadAvailableBatches(); // freed batch becomes selectable again
      alert('Package deleted successfully');
    } else {
      alert('Error: ' + (result.error || 'Failed to delete package'));
    }
  } catch (error) {
    console.error('Error deleting package:', error);
    alert('Failed to delete package: ' + error.message);
  }
}

// -------------------- SEARCH --------------------
function searchCrops() {
  const searchTerm = document.getElementById('cropSearch').value.toLowerCase();
  const rows = document.getElementById('cropsTable').getElementsByTagName('tr');
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    let found = false;
    for (let j = 0; j < cells.length - 1; j++) {
      if (cells[j].textContent.toLowerCase().includes(searchTerm)) { found = true; break; }
    }
    rows[i].style.display = found ? '' : 'none';
  }
}

function searchHarvests() {
  const searchTerm = document.getElementById('harvestSearch').value.toLowerCase();
  const rows = document.getElementById('harvestsTable').getElementsByTagName('tr');
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    let found = false;
    for (let j = 0; j < cells.length - 1; j++) {
      if (cells[j].textContent.toLowerCase().includes(searchTerm)) { found = true; break; }
    }
    rows[i].style.display = found ? '' : 'none';
  }
}

function searchPackages() {
  const searchTerm = document.getElementById('packageSearch').value.toLowerCase();
  const rows = document.getElementById('packagesTable').getElementsByTagName('tr');
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    let found = false;
    for (let j = 0; j < cells.length - 1; j++) {
      if (cells[j].textContent.toLowerCase().includes(searchTerm)) { found = true; break; }
    }
    rows[i].style.display = found ? '' : 'none';
  }
}

// -------------------- UTIL --------------------
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -------------------- SOWING (Feature) --------------------
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
  (sowings || []).forEach(sowing => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${sowing.crop_id}</td>
      <td>${sowing.harvest_id}</td>
      <td>${sowing.crop_name || ''}</td>
      <td>${sowing.harvest_name || ''}</td>
      <td>${sowing.plant_date || ''}</td>
      <td>${sowing.harvest_date || ''}</td>
      <td>
        <button class="btn-edit" onclick="editSowing(${sowing.harvest_id}, ${sowing.crop_id}, '${sowing.plant_date}', '${sowing.harvest_date}')">Edit</button>
        <button class="btn-delete" onclick="deleteSowing(${sowing.harvest_id}, ${sowing.crop_id})">Delete</button>
      </td>`;
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

async function editSowing(harvestId, cropId, plantDate, sowHarvestDate) {
  currentEditingSowing = { harvestId, cropId };
  document.getElementById('sowingModalTitle').textContent = 'Edit Sowing';
  document.getElementById('plantDate').value = plantDate;
  document.getElementById('sowingHarvestDate').value = sowHarvestDate;
  document.getElementById('sowingModal').style.display = 'block';
  await populateSowingDropdowns();
  document.getElementById('sowingCropSelect').value = String(cropId);
  document.getElementById('sowingHarvestSelect').value = String(harvestId);
}

async function saveSowing() {
  const cropIdNew = parseInt(document.getElementById('sowingCropSelect').value);
  const harvestIdNew = parseInt(document.getElementById('sowingHarvestSelect').value);
  const plantDate = document.getElementById('plantDate').value;
  const harvestDate = document.getElementById('sowingHarvestDate').value;

  if (!cropIdNew || !harvestIdNew || !plantDate || !harvestDate) {
    alert('Please fill in all required fields');
    return;
  }

  const isEditing = !!currentEditingSowing;

  try {
    if (isEditing) {
      const cropIdOld = currentEditingSowing.cropId;
      const harvestIdOld = currentEditingSowing.harvestId;
      const pairChanged = (cropIdNew !== cropIdOld) || (harvestIdNew !== harvestIdOld);

      if (pairChanged) {
        const delRes = await fetch('api.php', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_crop_sowing', harvest_id: harvestIdOld, crop_id: cropIdOld })
        });
        const delJson = await delRes.json();
        if (!delJson.success) throw new Error(delJson.error || 'Delete failed');

        const addRes = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_crop_sowing', crop_id: cropIdNew, harvest_id: harvestIdNew, plant_date: plantDate, harvest_date: harvestDate })
        });
        const addJson = await addRes.json();
        if (!addJson.success) throw new Error(addJson.error || 'Add failed');

      } else {
        const updRes = await fetch('api.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_crop_sowing', crop_id: cropIdNew, harvest_id: harvestIdNew, plant_date: plantDate, harvest_date: harvestDate })
        });
        const updJson = await updRes.json();
        if (!updJson.success) throw new Error(updJson.error || 'Update failed');
      }
    } else {
      const addRes = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_crop_sowing', crop_id: cropIdNew, harvest_id: harvestIdNew, plant_date: plantDate, harvest_date: harvestDate })
      });
      const addJson = await addRes.json();
      if (!addJson.success) throw new Error(addJson.error || 'Add failed');
    }

    closeSowingModal();
    loadSowings();
    alert(isEditing ? 'Sowing saved' : 'Sowing added');
  } catch (err) {
    console.error('Error saving sowing:', err);
    alert('Failed to save sowing: ' + err.message);
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
  try {
    const cropRes = await fetch('api.php?action=crops');
    const crops = await cropRes.json();
    const cropDropdown = document.getElementById('sowingCropSelect');
    cropDropdown.innerHTML = '<option value="">Select Crop</option>';
    (crops || []).forEach(crop => {
      const opt = document.createElement('option');
      opt.value = crop.crop_id;
      opt.textContent = crop.crop_name;
      cropDropdown.appendChild(opt);
    });
  } catch {}
  try {
    const harvestRes = await fetch('api.php?action=harvests');
    const harvests = await harvestRes.json();
    const harvestDropdown = document.getElementById('sowingHarvestSelect');
    harvestDropdown.innerHTML = '<option value="">Select Harvest</option>';
    (harvests || []).forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.harvest_id;
      opt.textContent = h.harvest_name;
      harvestDropdown.appendChild(opt);
    });
  } catch {}
}

// -------------------- TRACEABILITY --------------------
async function lookupTraceability() {
  const productId = document.getElementById('traceProductId').value;
  if (!productId) return alert('Please enter a Packaged Product ID');
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
    resultDiv.innerHTML = `<div style="color:#b91c1c;font-weight:700;">${trace?.error || 'No traceability data found.'}</div>`;
    lastTraceability = null;
    return;
  }

  lastTraceability = trace;

  const pp  = trace.packaged_product || {};
  const pb  = trace.packaged_batch || {};
  const hb  = trace.harvest_batch || {};
  const hv  = trace.harvest || {};
  const fm  = trace.farm || {};
  const cps = Array.isArray(trace.crops) ? trace.crops : [];

  const cropsHtml = cps.length
    ? cps.map((c, i) => `
        <li style="margin:6px 0;">
          <b>${c.crop_name || 'Crop #'+(i+1)}</b>
          <span style="opacity:.8;">(${c.crop_type || '—'})</span><br/>
          <small>Planted: ${c.plant_date || '—'} • Harvested: ${c.harvest_date || '—'}</small>
        </li>
      `).join('')
    : `<li style="opacity:.7;">No crop sowing records linked.</li>`;

  const idRow = `
    <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:12px; opacity:.8; margin-top:4px;">
      <span>SKU: <code>${pp.packaged_product_id ?? '—'}</code></span>
      <span>PackagedBatchID: <code>${pb.packaged_product_batch_id ?? '—'}</code></span>
      <span>HarvestBatchID: <code>${pb.harvest_batch_id ?? '—'}</code></span>
      <span>HarvestID: <code>${hv.harvest_id ?? '—'}</code></span>
      <span>FarmID: <code>${fm.farm_id ?? '—'}</code></span>
    </div>`;

  resultDiv.innerHTML = `
    <div class="controls" style="margin: 8px 0 14px 0;">
      <button class="btn btn-primary" onclick="downloadTraceabilityPDF()">Download PDF</button>
      <button class="btn btn-secondary" onclick="copyTraceabilityJSON()">Copy JSON</button>
    </div>

    <div style="background:#fff;padding:20px;border:1px solid #E6ECEA;border-radius:14px">
      <h3 style="margin:0 0 6px 0;">Product Traceability</h3>
      ${idRow}

      <div style="margin-top:16px;">
        <h4 style="margin:0 0 8px 0;">Packaged Product</h4>
        <div><b>Name:</b> ${pp.product_name || '—'}</div>
        <div><b>Storage:</b> ${pp.storage_requirements || '—'}</div>
        <div><b>Packaging:</b> ${pp.packaging_details || '—'}</div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="margin:0 0 8px 0;">Packaged Product Batch</h4>
        <div><b>Batch Name:</b> ${pb.batch_name || '—'}</div>
        <div><b>Batch #:</b> ${pb.batch_number || '—'}</div>
        <div><b>Production Date:</b> ${pb.production_date || '—'}</div>
        <div><b>Production Qty (kg):</b> ${pb.production_quantity ?? '—'}</div>
        <div><b>Factory:</b> ${pb.factory_name || '—'}</div>
        <div><b>Warehouse:</b> ${pb.warehouse_name || '—'}</div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="margin:0 0 8px 0;">Origin Harvest Batch (raw)</h4>
        <div><b>Batch #:</b> ${hb.batch_number || '—'}</div>
        <div><b>Quantity (kg):</b> ${hb.quantity ?? '—'}</div>
        <div><b>Status:</b> ${hb.status || '—'}</div>
        <div><b>Storage Date:</b> ${hb.storage_date || '—'}</div>
        <div><b>Warehouse:</b> ${hb.warehouse_name || '—'}</div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="margin:0 0 8px 0;">Harvest</h4>
        <div><b>Name:</b> ${hv.harvest_name || '—'}</div>
        <div><b>Type:</b> ${hv.harvest_type || '—'}</div>
        <div><b>Quantity (kg):</b> ${hv.harvest_quantity ?? '—'}</div>
        <div><b>Shelf Life:</b> ${hv.harvest_shelf_life || '—'}</div>
        <div><b>Farm:</b> ${fm.farm_name || '—'}</div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="margin:0 0 8px 0;">Crop Sowing</h4>
        <ul style="margin:0;padding-left:18px;">${cropsHtml}</ul>
      </div>

      <div style="margin-top:18px;padding-top:12px;border-top:1px dashed #E6ECEA;">
        <h4 style="margin:0 0 8px 0;">Chain</h4>
        <ol style="margin:0;padding-left:18px;">
          <li>Farm: ${fm.farm_name || '—'}</li>
          <li>Harvest: ${hv.harvest_name || '—'} (${hv.harvest_type || '—'})</li>
          <li>Harvest Batch: ${hb.batch_number || '—'} → ${hb.warehouse_name || '—'}</li>
          <li>Packaged Batch: ${pb.batch_number || '—'} (${pb.batch_name || '—'}) @ Factory ${pb.factory_name || '—'}</li>
          <li>Packaged Product (SKU ${pp.packaged_product_id ?? '—'}): ${pp.product_name || '—'}</li>
        </ol>
      </div>
    </div>
  `;
}

function copyTraceabilityJSON() {
  if (!lastTraceability) return alert('No traceability data yet.');
  const text = JSON.stringify(lastTraceability, null, 2);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => alert('JSON copied to clipboard'));
  } else {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    alert('JSON copied to clipboard');
  }
}

function downloadTraceabilityPDF() {
  if (!lastTraceability) return alert('No traceability data yet.');
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || !window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF libraries not loaded'); return;
  }
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const primary = [26,36,33];     // #1A2421
  const lightRow = [248,250,249]; // table zebra row
  const border = [230,236,234];

  // pull pieces
  const pp  = lastTraceability.packaged_product || {};
  const pb  = lastTraceability.packaged_batch || {};
  const hb  = lastTraceability.harvest_batch || {};
  const hv  = lastTraceability.harvest || {};
  const fm  = lastTraceability.farm || {};
  const cps = Array.isArray(lastTraceability.crops) ? lastTraceability.crops : [];

  const v = x => (x === null || x === undefined || x === '') ? '—' : String(x);

  // Header bar
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold'); doc.setFontSize(18);
  doc.text('Product Traceability Report', 40, 50);
  doc.setFont('helvetica','normal'); doc.setFontSize(11);
  doc.text(`${v(pp.product_name)}  •  SKU ${v(pp.packaged_product_id)}`, 40, 70);

  let y = 110;

  const addKV = (title, rows) => {
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFont('helvetica','bold'); doc.setFontSize(13);
    doc.text(title, 40, y);
    y += 8;
    doc.autoTable({
      startY: y + 6,
      theme: 'grid',
      head: [['Field','Value']],
      body: rows.map(r => [r.k, r.v]),
      styles: { fontSize: 10, cellPadding: 6, lineWidth: 0.6, lineColor: border },
      headStyles: { fillColor: primary, textColor: 255, halign: 'left' },
      bodyStyles: { textColor: [33,49,45] },
      alternateRowStyles: { fillColor: lightRow },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 170 } }
    });
    y = doc.lastAutoTable.finalY + 18;
    if (y > pageH - 120) { doc.addPage(); y = 60; }
  };

  // Sections
  addKV('Packaged Product', [
    { k: 'Name', v: v(pp.product_name) },
    { k: 'Storage', v: v(pp.storage_requirements) },
    { k: 'Packaging', v: v(pp.packaging_details) },
    { k: 'Packaged Product Batch ID', v: v(pp.packaged_product_batch_id) },
  ]);

  addKV('Packaged Product Batch', [
    { k: 'Batch Name', v: v(pb.batch_name) },
    { k: 'Batch #', v: v(pb.batch_number) },
    { k: 'Production Date', v: v(pb.production_date) },
    { k: 'Production Qty (kg)', v: v(pb.production_quantity) },
    { k: 'Factory', v: v(pb.factory_name) },
    { k: 'Warehouse', v: v(pb.warehouse_name) },
  ]);

  addKV('Origin Harvest Batch (raw)', [
    { k: 'Batch #', v: v(hb.batch_number) },
    { k: 'Quantity (kg)', v: v(hb.quantity) },
    { k: 'Status', v: v(hb.status) },
    { k: 'Storage Date', v: v(hb.storage_date) },
    { k: 'Warehouse', v: v(hb.warehouse_name) },
  ]);

  addKV('Harvest & Farm', [
    { k: 'Harvest Name', v: v(hv.harvest_name) },
    { k: 'Harvest Type', v: v(hv.harvest_type) },
    { k: 'Harvest Quantity (kg)', v: v(hv.harvest_quantity) },
    { k: 'Shelf Life', v: v(hv.harvest_shelf_life) },
    { k: 'Farm', v: v(fm.farm_name) },
  ]);

  // Crop table
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('Crop Sowing', 40, y);
  y += 8;
  const cropRows = cps.length
    ? cps.map(c => [v(c.crop_name), v(c.crop_type), v(c.plant_date), v(c.harvest_date)])
    : [['—', '—', '—', '—']];
  doc.autoTable({
    startY: y + 6,
    theme: 'grid',
    head: [['Crop','Type','Planted','Harvested']],
    body: cropRows,
    styles: { fontSize: 10, cellPadding: 6, lineWidth: 0.6, lineColor: border },
    headStyles: { fillColor: primary, textColor: 255, halign: 'left' },
    alternateRowStyles: { fillColor: lightRow },
  });
  y = doc.lastAutoTable.finalY + 24;

  // Footer (timestamp + page numbers)
  const stamp = new Date().toLocaleString();
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(110,127,122);
      doc.text(`Generated: ${stamp}`, 40, pageH - 26);
      doc.text(`Page ${i} of ${totalPages}`, pageW - 40, pageH - 26, { align: 'right' });
    }
  };
  addFooter();

  // Save
  const safeName = (pp.product_name || 'traceability').replace(/[^\w\-]+/g,'_');
  doc.save(`${safeName}_traceability.pdf`);
}



