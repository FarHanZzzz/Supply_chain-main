DROP DATABASE IF EXISTS farhansupply_db2;
CREATE DATABASE farhansupply_db2;
USE farhansupply_db2;

-- Farmers and Farms
CREATE TABLE Farmers (
    farmer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255) UNIQUE
);

CREATE TABLE Farms (
    farm_id INT AUTO_INCREMENT PRIMARY KEY,
    farm_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    irrigation_type VARCHAR(50)
);

CREATE TABLE Farmer_Farm_Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    farm_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    duration INT,
    role VARCHAR(100),
    CONSTRAINT fk_assignment_farmer FOREIGN KEY (farmer_id) REFERENCES Farmers(farmer_id),
    CONSTRAINT fk_assignment_farm FOREIGN KEY (farm_id) REFERENCES Farms(farm_id)
);

-- Crops and Harvests
CREATE TABLE Crops (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(255) NOT NULL UNIQUE,
    crop_type VARCHAR(100)
);

CREATE TABLE Harvests (
    harvest_id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    harvest_name VARCHAR(255),
    harvest_type VARCHAR(100),
    harvest_quantity DECIMAL(10,2),
    harvest_shelf_life VARCHAR(100),
    CONSTRAINT fk_harvest_farm FOREIGN KEY (farm_id) REFERENCES Farms(farm_id)
);

CREATE TABLE Crop_Sowing (
    harvest_id INT NOT NULL,
    crop_id INT NOT NULL,
    plant_date DATE,
    harvest_date DATE,
    PRIMARY KEY (harvest_id, crop_id),
    CONSTRAINT fk_sowing_harvest FOREIGN KEY (harvest_id) REFERENCES Harvests(harvest_id) ON DELETE CASCADE,
    CONSTRAINT fk_sowing_crop FOREIGN KEY (crop_id) REFERENCES Crops(crop_id) ON DELETE CASCADE
);

-- Inventory and Utilization
CREATE TABLE Farmer_Required_Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    raw_materials TEXT,
    description TEXT
);

CREATE TABLE Material_Utilization (
    utilization_id INT AUTO_INCREMENT PRIMARY KEY,
    harvest_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity DECIMAL(10,2),
    material_name VARCHAR(255),
    farmer_id INT,
    date DATE,
    CONSTRAINT fk_utilization_harvest FOREIGN KEY (harvest_id) REFERENCES Harvests(harvest_id) ON DELETE CASCADE,
    CONSTRAINT fk_utilization_inventory FOREIGN KEY (inventory_id) REFERENCES Farmer_Required_Inventory(inventory_id) ON DELETE CASCADE,
    CONSTRAINT fk_utilization_farmer FOREIGN KEY (farmer_id) REFERENCES Farmers(farmer_id)
);

-- Warehouses and Batches
CREATE TABLE Warehouses (
    warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    capacity DECIMAL(10,2)
);

CREATE TABLE Harvest_Batches (
    harvest_batch_id INT AUTO_INCREMENT PRIMARY KEY,
    harvest_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    batch_number VARCHAR(100) UNIQUE,
    quantity DECIMAL(10,2),
    status VARCHAR(50),
    storage_date DATE,
    CONSTRAINT fk_batch_harvest FOREIGN KEY (harvest_id) REFERENCES Harvests(harvest_id) ON DELETE CASCADE,
    CONSTRAINT fk_batch_warehouse FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

-- Factories and Products
CREATE TABLE Owners (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    address TEXT
);

CREATE TABLE Factories (
    factory_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    factory_name VARCHAR(255) NOT NULL,
    factory_region VARCHAR(100),
    harvest_received_quantity DECIMAL(10,2),
    CONSTRAINT fk_factory_owner FOREIGN KEY (owner_id) REFERENCES Owners(owner_id) ON DELETE CASCADE
);

CREATE TABLE Packaged_Product_Batches (
  packaged_product_batch_id INT AUTO_INCREMENT PRIMARY KEY,
  harvest_batch_id INT NOT NULL UNIQUE,
  batch_number VARCHAR(100) UNIQUE,
  batch_name VARCHAR(255),
  factory_id INT NOT NULL,
  production_date DATE,
  quantity DECIMAL(10,2),
  warehouse_id INT,
  production_quantity DECIMAL(10,2),
  CONSTRAINT fk_ppb_harvest_batch FOREIGN KEY (harvest_batch_id) REFERENCES Harvest_Batches(harvest_batch_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ppb_factory FOREIGN KEY (factory_id) REFERENCES Factories(factory_id) ON DELETE CASCADE,
  CONSTRAINT fk_ppb_warehouse FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

CREATE TABLE Package_Products (
    packaged_product_id INT AUTO_INCREMENT PRIMARY KEY,
    packaged_product_batch_id INT NOT NULL,
    product_name VARCHAR(255),
    storage_requirements VARCHAR(100),
    packaging_details VARCHAR(100),
    CONSTRAINT fk_package_product_batch FOREIGN KEY (packaged_product_batch_id) REFERENCES Packaged_Product_Batches(packaged_product_batch_id) ON DELETE CASCADE
);

-- Transport and Shipments
CREATE TABLE Drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20)
);

CREATE TABLE Transports (
    transport_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    vehicle_type VARCHAR(100),
    vehicle_license_no VARCHAR(50),
    vehicle_capacity DECIMAL(10,2),
    current_capacity DECIMAL(10,2),
    vehicle_status ENUM('available', 'in-use', 'needs repair', 'under maintenance') DEFAULT 'available',
    CONSTRAINT fk_transport_driver FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id) ON DELETE CASCADE
);

CREATE TABLE Shipments (
    shipment_id INT AUTO_INCREMENT PRIMARY KEY,
    transport_id INT NOT NULL,
    harvest_batch_id INT,
    packaged_product_batch_id INT,
    shipment_date DATE,
    shipment_destination VARCHAR(255),
    status VARCHAR(50),
    transportation_cost DECIMAL(10,2) DEFAULT 0.00,
    CONSTRAINT fk_shipment_transport FOREIGN KEY (transport_id) REFERENCES Transports(transport_id) ON DELETE CASCADE,
    CONSTRAINT fk_shipment_batch FOREIGN KEY (harvest_batch_id) REFERENCES Harvest_Batches(harvest_batch_id) ON DELETE CASCADE,
    CONSTRAINT fk_shipment_packaged FOREIGN KEY (packaged_product_batch_id) REFERENCES Packaged_Product_Batches(packaged_product_batch_id) ON DELETE CASCADE
);

CREATE TABLE Routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    duration TIME,
    distance DECIMAL(10,2),
    road_condition ENUM('good','moderate','poor','closed') DEFAULT 'good'
);

CREATE TABLE Route_Defaults (
  route_id INT PRIMARY KEY,
  default_current_location VARCHAR(255) NOT NULL,
  default_remaining_distance_km DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_rd_route FOREIGN KEY (route_id) REFERENCES Routes(route_id) ON DELETE CASCADE
);

CREATE TABLE Shipment_Progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  route_id INT NOT NULL,
  dispatch_time DATETIME NOT NULL,
  destination VARCHAR(255) NOT NULL,
  current_location VARCHAR(255),
  remaining_distance_km DECIMAL(10,2),
  estimated_arrival_time DATETIME,
  INDEX idx_sp_shipment (shipment_id),
  INDEX idx_sp_route (route_id),
  CONSTRAINT fk_sp_shipment FOREIGN KEY (shipment_id) REFERENCES Shipments(shipment_id) ON DELETE CASCADE,
  CONSTRAINT fk_sp_route FOREIGN KEY (route_id) REFERENCES Routes(route_id) ON DELETE CASCADE
);

-- Shipping Documents
CREATE TABLE Shipping_Documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    document_type ENUM('Invoice', 'Bill of Lading', 'Customs Declaration', 'Delivery Note', 'Other') NOT NULL,
    document_number VARCHAR(100),
    issue_date DATE,
    issued_by VARCHAR(255),
    file_path VARCHAR(255),
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT,
    CONSTRAINT fk_document_shipment FOREIGN KEY (shipment_id) REFERENCES Shipments(shipment_id) ON DELETE CASCADE
);

-- Sensors
CREATE TABLE Sensors (
    sensor_id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_type VARCHAR(100),
    warehouse_id INT,
    transport_id INT,
    CONSTRAINT fk_sensor_warehouse FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE,
    CONSTRAINT fk_sensor_transport FOREIGN KEY (transport_id) REFERENCES Transports(transport_id) ON DELETE CASCADE
);

CREATE TABLE Sensor_Data (
    sensor_data_id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    CONSTRAINT fk_sensor_data_sensor FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id) ON DELETE CASCADE
);

-- Deliveries
CREATE TABLE Deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_license_no VARCHAR(50),
    delivery_date DATE,
    delivery_time TIME,
    delivery_man_name VARCHAR(255),
    expected_time TIME,
    delivered_time TIME,
    spoilage_quantity INT NOT NULL DEFAULT 0,
    delivery_status ENUM('on time','late') NOT NULL DEFAULT 'on time',
    delivery_success ENUM('successful','unsuccessful') NOT NULL DEFAULT 'successful'
);

-- Orders
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255),
    order_date DATE
);

CREATE TABLE Orderlines (
    orderline_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    packaged_product_batch_id INT,
    packaged_product_id INT,
    delivery_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    total_price DECIMAL(10,2),
    CONSTRAINT fk_orderline_order FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderline_batch FOREIGN KEY (packaged_product_batch_id) REFERENCES Packaged_Product_Batches(packaged_product_batch_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderline_product FOREIGN KEY (packaged_product_id) REFERENCES Package_Products(packaged_product_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderline_delivery FOREIGN KEY (delivery_id) REFERENCES Deliveries(delivery_id) ON DELETE CASCADE
);


-- Sample data
INSERT INTO Farmers (first_name, last_name, phone_number, email) VALUES
('John', 'Doe', '123-456-7890', 'john.doe@example.com'),
('Jane', 'Smith', '098-765-4321', 'jane.smith@example.com'),
('Bob', 'Johnson', '555-123-4567', 'bob.johnson@example.com');

INSERT INTO Farms (farm_name, location, irrigation_type) VALUES
('Green Valley Farm', 'North District', 'Drip Irrigation'),
('Sunny Acres', 'South District', 'Sprinkler System'),
('Riverside Farm', 'East District', 'Flood Irrigation');

INSERT INTO Farmer_Farm_Assignments (farmer_id, farm_id, start_date, end_date, duration, role) VALUES
(1, 1, '2024-01-01', '2024-12-31', 365, 'Manager'),
(2, 2, '2024-02-01', '2024-11-30', 303, 'Worker'),
(3, 3, '2024-03-01', NULL, NULL, 'Supervisor');

INSERT INTO Crops (crop_name, crop_type) VALUES
('Tomatoes', 'Vegetable'),
('Wheat', 'Grain'),
('Apples', 'Fruit'),
('Corn', 'Grain');

INSERT INTO Harvests (farm_id, harvest_name, harvest_type, harvest_quantity, harvest_shelf_life) VALUES
(1, 'Spring Tomato Harvest', 'Vegetable', 500.00, '7 days'),
(2, 'Winter Wheat', 'Grain', 2000.00, '1 year'),
(3, 'Apple Harvest 2024', 'Fruit', 800.00, '3 months'),
(1, 'Summer Tomato Harvest',        'Vegetable', 650.00, '7 days'),
(2, 'Monsoon Corn Harvest',         'Grain',    1400.00, '6 months'),
(3, 'Late Apple Harvest',           'Fruit',     500.00, '2 months'),
(1, 'Winter Wheat Cycle',           'Grain',    1700.00, '1 year'),
(2, 'Autumn Tomato Harvest',        'Vegetable', 550.00, '7 days'),
(3, 'Riverside Wheat',              'Grain',    1800.00, '1 year'),
(1, 'Green Valley Apple Lot',       'Fruit',     300.00, '3 months');

INSERT INTO Crop_Sowing (harvest_id, crop_id, plant_date, harvest_date) VALUES
(1, 1, '2024-03-15', '2024-06-15'),
(2, 2, '2024-10-01', '2024-07-01'),
(3, 3, '2024-04-01', '2024-09-01');

INSERT INTO Farmer_Required_Inventory (raw_materials, description) VALUES
('Seeds, Fertilizer', 'Basic farming materials for crop production'),
('Pesticides, Tools', 'Pest control and farming tools'),
('Irrigation Equipment', 'Water management systems');

INSERT INTO Material_Utilization (harvest_id, inventory_id, quantity, material_name, farmer_id, date) VALUES
(1, 1, 50.00, 'Tomato Seeds', 1, '2024-03-15'),
(2, 1, 100.00, 'Wheat Seeds', 2, '2024-10-01'),
(3, 2, 25.00, 'Apple Tree Fertilizer', 3, '2024-04-01');

INSERT INTO Warehouses (warehouse_name, location, capacity) VALUES
('Central Warehouse', 'Main District', 10000.00),
('Cold Storage Unit', 'North District', 5000.00),
('Dry Storage Facility', 'South District', 8000.00);

INSERT INTO Harvest_Batches (harvest_id, warehouse_id, batch_number, quantity, status, storage_date) VALUES
(1, 2, 'BATCH001', 250.00, 'Stored', '2024-06-16'),
(2, 3, 'BATCH002', 1000.00, 'Stored', '2024-07-02'),
(3, 2, 'BATCH003', 400.00, 'Stored', '2024-09-02'),
(4,  1, 'BATCH004', 300.00, 'Stored',     '2024-06-25'),
(5,  3, 'BATCH005', 700.00, 'Pending',    '2024-08-15'),
(6,  2, 'BATCH006', 250.00, 'Stored',     '2024-09-10'),
(7,  3, 'BATCH007', 900.00, 'Dispatched', '2024-11-20'),
(8,  2, 'BATCH008', 280.00, 'Stored',     '2024-10-05'),
(9,  1, 'BATCH009', 950.00, 'Pending',    '2024-07-20'),
(10, 2, 'BATCH010', 220.00, 'Stored',     '2024-09-18');


INSERT INTO Owners (first_name, last_name, contact_number, address) VALUES
('Michael', 'Brown', '111-222-3333', '123 Factory St, Industrial Zone'),
('Sarah', 'Wilson', '444-555-6666', '456 Processing Ave, Manufacturing District');

INSERT INTO Factories (owner_id, factory_name, factory_region, harvest_received_quantity) VALUES
(1, 'Fresh Processing Plant', 'Industrial Zone A', 1500.00),
(2, 'Grain Mill Co.', 'Industrial Zone B', 2500.00);

INSERT INTO Packaged_Product_Batches (harvest_batch_id, factory_id, batch_number, batch_name, production_date, quantity, warehouse_id, production_quantity) VALUES
(1, 1, 'BATCH001', 'Tomato Batch A', '2024-06-20', 200.00, 1, 200.00),
(2, 2, 'BATCH002', 'Wheat Batch B',  '2024-07-05', 800.00, 3, 800.00),
(3, 1, 'BATCH003', 'Apple Batch C',  '2024-09-05', 350.00, 2, 350.00);


INSERT INTO Package_Products (packaged_product_batch_id, product_name, storage_requirements, packaging_details) VALUES
(1, 'Canned Tomatoes', 'Cool Dry Place', 'Metal Can'),
(2, 'Wheat Flour', 'Cool Dry Place', 'Paper Bag'),
(3, 'Apple Juice', 'Refrigerated', 'Plastic Bottle');

INSERT INTO Drivers (first_name, last_name, phone_number) VALUES
('Tom', 'Anderson', '777-888-9999'),
('Lisa', 'Garcia', '333-444-5555'),
('Mark', 'Davis', '666-777-8888'),
('Emily', 'Johnson', '222-333-4444'),
('James', 'Brown', '555-666-7777'),
('Sarah', 'Miller', '888-999-0000'),
('David', 'Wilson', '111-222-3333'),
('Olivia', 'Martinez', '444-555-6666'),
('Michael', 'Taylor', '999-000-1111'),
('Sophia', 'Harris', '123-456-7890');

INSERT INTO Transports (driver_id, vehicle_type, vehicle_license_no, vehicle_capacity, current_capacity) VALUES
(1, 'Truck', 'TRK-001', 5000.00, 0.00),
(2, 'Van', 'VAN-002', 2000.00, 0.00),
(3, 'Refrigerated Truck', 'REF-003', 3000.00, 0.00),
(4, 'Trailer', 'TEA-004', 5000.00, 0.00),
(5,  'Truck',              'TRK-005', 5000.00, 0.00),   -- James Brown
(6,  'Van',                'VAN-006', 2000.00, 0.00),   -- Sarah Miller
(7,  'Trailer',            'TRL-007', 6000.00, 0.00),   -- David Wilson
(8,  'Refrigerated Truck', 'REF-008', 3000.00, 0.00),   -- Olivia Martinez
(9,  'Truck',              'TRK-009', 5000.00, 0.00),   -- Michael Taylor
(10, 'Van',                'VAN-010', 2000.00, 0.00);  

-- Seed data (omit shipment_id, let it auto-increment)
INSERT INTO Shipments
  (transport_id, harvest_batch_id, packaged_product_batch_id, shipment_date, shipment_destination, status, transportation_cost)
VALUES
  (1, 2, NULL, '2025-08-10', 'Dhaka, Bangladesh', 'In Transit', 2500.00),
  (2, NULL, 3, '2025-08-11', 'Chittagong, Bangladesh', 'In Transit', 4000.00),
  (3, 3, NULL, '2025-08-12', 'Sylhet, Bangladesh', 'In Transit', 1800.00),
  (4, NULL, 2, '2025-08-13', 'Khulna, Bangladesh', 'In Transit', 3000.00);

INSERT INTO Routes (route_name, destination, duration, distance, road_condition) VALUES
-- Dhaka
('Route A','Dhaka, Bangladesh','06:00:00', 250.00, 'good'),
('Route B','Dhaka, Bangladesh','07:30:00', 260.00, 'moderate'),
('Route C','Dhaka, Bangladesh','05:45:00', 240.00, 'good'),
-- Chittagong
('Route A','Chittagong, Bangladesh','08:00:00', 270.00, 'moderate'),
('Route B','Chittagong, Bangladesh','09:15:00', 300.00, 'poor'),
('Route C','Chittagong, Bangladesh','07:40:00', 260.00, 'good'),
-- Khulna
('Route A','Khulna, Bangladesh','05:20:00', 190.00, 'closed'),
('Route B','Khulna, Bangladesh','06:10:00', 210.00, 'moderate'),
('Route C','Khulna, Bangladesh','05:50:00', 200.00, 'good'),
-- Rajshahi
('Route A','Rajshahi, Bangladesh','07:00:00', 240.00, 'good'),
('Route B','Rajshahi, Bangladesh','07:45:00', 260.00, 'moderate'),
('Route C','Rajshahi, Bangladesh','06:30:00', 230.00, 'good'),
-- Sylhet
('Route A','Sylhet, Bangladesh','06:20:00', 240.00, 'moderate'),
('Route B','Sylhet, Bangladesh','07:10:00', 260.00, 'poor'),
('Route C','Sylhet, Bangladesh','05:55:00', 230.00, 'good');

INSERT INTO Route_Defaults (route_id, default_current_location, default_remaining_distance_km) VALUES
(1,  'Narayanganj, Bangladesh',  35.50),
(2,  'Gazipur, Bangladesh',      58.00),
(3,  'Tangail, Bangladesh',      80.00),
(4,  'Feni, Bangladesh',        120.00),
(5,  'Cumilla, Bangladesh',     145.00),
(6,  'Sitakunda, Bangladesh',    25.00),
(7,  'Jhenaidah, Bangladesh',    95.00),
(8,  'Jessore, Bangladesh',      65.00),
(9,  'Magura, Bangladesh',       88.00),
(10, 'Sirajganj, Bangladesh',   110.00),
(11, 'Natore, Bangladesh',       70.00),
(12, 'Pabna, Bangladesh',        95.00),
(13, 'Moulvibazar, Bangladesh',  85.75),
(14, 'Habiganj, Bangladesh',     60.00),
(15, 'Srimangal, Bangladesh',    40.00);

-- Corrected Shipment_Progress seeds (all attributes + consistency with Shipments, Routes, Route_Defaults)
INSERT INTO Shipment_Progress
  (shipment_id, route_id, dispatch_time, destination, current_location, remaining_distance_km, estimated_arrival_time)
VALUES
  -- Shipment 1 → Dhaka (Route 1 defaults: Narayanganj, 35.50)
  (1, 1,  '2025-08-10 08:00:00', 'Dhaka, Bangladesh',        'Narayanganj, Bangladesh',  35.50, '2025-08-10 14:00:00'),

  -- Shipment 2 → Chittagong (Route 4 defaults: Feni, 120.00)
  (2, 4,  '2025-08-11 07:30:00', 'Chittagong, Bangladesh',   'Feni, Bangladesh',        120.00, '2025-08-11 15:30:00'),

  -- Shipment 3 → Sylhet (Route 13 defaults: Moulvibazar, 85.75)
  (3, 13, '2025-08-12 06:15:00', 'Sylhet, Bangladesh',       'Moulvibazar, Bangladesh',  85.75, '2025-08-12 12:35:00'),

  -- Shipment 4 → Khulna (Route 9 defaults: Magura, 88.00)
  (4, 9,  '2025-08-13 09:00:00', 'Khulna, Bangladesh',       'Magura, Bangladesh',       88.00, '2025-08-13 14:50:00');



INSERT INTO Shipping_Documents (shipment_id, document_type, document_number, issue_date, issued_by, file_path, approval_status, notes) VALUES
(1, 'Invoice', 'INV-001', '2024-06-17', 'Admin', '/invoices/INV-001.pdf', 'Approved', 'Initial shipment invoice'),
(2, 'Bill of Lading', 'BOL-001', '2024-06-25', 'Admin', '/bills/BOL-001.pdf', 'Approved', 'Product delivery'),
(3, 'Customs Declaration', 'CUS-001', '2024-09-03', 'Admin', '/customs/CUS-001.pdf', 'Pending', 'International shipment');
INSERT INTO Sensors (sensor_type, warehouse_id, transport_id) VALUES
-- Warehouse combined sensors (Temperature/Humidity)
('Temperature/Humidity', 1, NULL),  -- Central Warehouse
('Temperature/Humidity', 2, NULL),  -- Cold Storage Unit  
('Temperature/Humidity', 3, NULL),  -- Dry Storage Facility
-- Transport combined sensors (Temperature/Humidity) for transports 1..10
('Temperature/Humidity', NULL, 1),
('Temperature/Humidity', NULL, 2),
('Temperature/Humidity', NULL, 3),
('Temperature/Humidity', NULL, 4),
('Temperature/Humidity', NULL, 5),
('Temperature/Humidity', NULL, 6),
('Temperature/Humidity', NULL, 7),
('Temperature/Humidity', NULL, 8),
('Temperature/Humidity', NULL, 9),
('Temperature/Humidity', NULL, 10);

-- Seed sensor data with more realistic readings
INSERT INTO Sensor_Data (sensor_id, temperature, humidity) VALUES
-- Central Warehouse (sensor_id 1) - multiple readings
(1, 12.50, 45.00),
(1, 11.20, 46.50),
(1, 13.10, 44.20),
(1, 12.80, 47.30),
(1, 11.90, 45.80),

-- Cold Storage Unit (sensor_id 2) - multiple readings
(2, 4.00, 70.00),
(2, 3.50, 72.50),
(2, 4.20, 69.30),
(2, 3.80, 71.20),
(2, 4.10, 70.80),

-- Dry Storage Facility (sensor_id 3) - multiple readings
(3, 18.00, 35.00),
(3, 17.50, 36.20),
(3, 18.30, 34.50),
(3, 17.80, 35.80),
(3, 18.20, 35.20),

-- Transport sensors with realistic cold chain temperatures
-- Transport 1 (sensor_id 4)
(4, 6.20, 59.00),
(4, 5.80, 61.50),
(4, 6.50, 58.30),
(4, 6.10, 60.20),
(4, 5.90, 59.80),

-- Transport 2 (sensor_id 5)
(5, 7.10, 61.50),
(5, 6.90, 62.30),
(5, 7.30, 60.80),
(5, 7.00, 61.90),
(5, 7.20, 61.20),

-- Transport 3 (sensor_id 6)
(6, 5.80, 62.30),
(6, 5.60, 63.50),
(6, 6.00, 61.80),
(6, 5.70, 62.90),
(6, 5.90, 62.10),

-- Transport 4 (sensor_id 7)
(7, 6.70, 58.40),
(7, 6.50, 59.20),
(7, 6.90, 57.80),
(7, 6.60, 58.90),
(7, 6.80, 58.10),

-- Transport 5 (sensor_id 8) - with some alerts
(8, 8.20, 64.10),
(8, 28.50, 85.20), -- Temperature and humidity alerts
(8, 7.90, 63.80),
(8, 8.10, 64.50),
(8, 8.00, 64.20),

-- Transport 6 (sensor_id 9)
(9, 7.90, 60.20),
(9, 7.70, 61.00),
(9, 8.10, 59.80),
(9, 7.80, 60.50),
(9, 7.95, 60.10),

-- Transport 7 (sensor_id 10)
(10, 6.10, 57.80),
(10, 5.90, 58.50),
(10, 6.30, 57.20),
(10, 6.00, 58.10),
(10, 6.20, 57.90),

-- Transport 8 (sensor_id 11)
(11, 5.60, 63.50),
(11, 5.40, 64.20),
(11, 5.80, 62.90),
(11, 5.50, 63.80),
(11, 5.70, 63.30),

-- Transport 9 (sensor_id 12) - with temperature alert
(12, 6.40, 66.20),
(12, -2.10, 25.30), -- Temperature alert (too cold)
(12, 6.20, 65.80),
(12, 6.50, 66.50),
(12, 6.30, 66.00),

-- Transport 10 (sensor_id 13)
(13, 7.30, 59.90),
(13, 7.10, 60.50),
(13, 7.50, 59.30),
(13, 7.20, 60.20),
(13, 7.40, 59.70);
INSERT INTO Deliveries
  (vehicle_license_no, delivery_date, delivery_time, delivery_man_name,
   expected_time, delivered_time, spoilage_quantity, delivery_status, delivery_success)
VALUES
  -- On time, no spoilage, successful
  ('ABC-123', '2024-06-25', '14:30:00', 'Carlos Rodriguez',
   '14:30:00', '14:30:00', 0, 'on time', 'successful'),

  -- Late (delivered after expected), small spoilage, successful
  ('XYZ-789', '2024-07-10', '09:15:00', 'Emma Thompson',
   '09:00:00', '09:15:00', 3, 'late', 'successful'),

  -- Late, higher spoilage, unsuccessful (to exercise KPI/Chart buckets)
  ('DEF-456', '2024-09-08', '16:45:00', 'James Wilson',
   '16:30:00', '16:45:00', 12, 'late', 'unsuccessful'),

  ('GHI-789', '2024-08-01', '11:00:00', 'Liam Carter',
   '11:00:00', '11:00:00', 0, 'on time', 'successful'),

  ('JKL-456', '2024-08-15', '15:20:00', 'Sophia Green',
   '15:00:00', '15:20:00', 5, 'late', 'successful'),

  ('MNO-321', '2024-08-28', '09:45:00', 'Noah Bennett',
   '09:30:00', '09:45:00', 2, 'late', 'successful'),

  ('PQR-654', '2024-09-12', '13:10:00', 'Isabella Foster',
   '13:10:00', '13:10:00', 0, 'on time', 'successful'),

  ('STU-987', '2024-09-25', '17:05:00', 'Mason Rivera',
   '17:00:00', '17:05:00', 7, 'late', 'unsuccessful'),

  ('VWX-159', '2024-10-03', '10:25:00', 'Olivia Hughes',
   '10:20:00', '10:25:00', 1, 'late', 'successful'),

  ('YZA-753', '2024-10-18', '08:50:00', 'Ethan Morgan',
   '08:50:00', '08:50:00', 0, 'on time', 'successful');

INSERT INTO Orders (location, order_date) VALUES
('Downtown Store', '2024-06-20'),
('Suburban Market', '2024-07-05'),
('City Center Mall', '2024-09-01');

INSERT INTO Orderlines (order_id, packaged_product_batch_id, packaged_product_id, delivery_id, quantity, unit_price, discount_percentage, total_price) VALUES
(1, 1, 1, 1, 50, 5.99, 0.00, 299.50),
(2, 2, 2, 2, 100, 2.49, 5.00, 236.55),
(3, 3, 3, 3, 25, 8.99, 10.00, 202.28);
