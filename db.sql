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
    FOREIGN KEY (farmer_id) REFERENCES Farmers(farmer_id),
    FOREIGN KEY (farm_id) REFERENCES Farms(farm_id)
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
    FOREIGN KEY (farm_id) REFERENCES Farms(farm_id)
);

CREATE TABLE Crop_Sowing (
    harvest_id INT NOT NULL,
    crop_id INT NOT NULL,
    plant_date DATE,
    harvest_date DATE,
    PRIMARY KEY (harvest_id, crop_id),
    FOREIGN KEY (harvest_id) REFERENCES Harvests(harvest_id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES Crops(crop_id) ON DELETE CASCADE
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
    FOREIGN KEY (harvest_id) REFERENCES Harvests(harvest_id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES Farmer_Required_Inventory(inventory_id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES Farmers(farmer_id)
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
    FOREIGN KEY (harvest_id) REFERENCES Harvests(harvest_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE 
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
    FOREIGN KEY (owner_id) REFERENCES Owners(owner_id) ON DELETE CASCADE
);

CREATE TABLE Product_Batches (
    product_batch_id INT AUTO_INCREMENT PRIMARY KEY,
    factory_id INT NOT NULL,
    production_date DATE,
    quantity DECIMAL(10,2),
    FOREIGN KEY (factory_id) REFERENCES Factories(factory_id)
);

CREATE TABLE Packaged_Product_Batches (
    packaged_product_batch_id INT AUTO_INCREMENT PRIMARY KEY,
    product_batch_id INT NOT NULL,
    warehouse_id INT,
    production_quantity DECIMAL(10,2),
    spoilage_count INT DEFAULT 0,
    FOREIGN KEY (product_batch_id) REFERENCES Product_Batches(product_batch_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE
);

CREATE TABLE Package_Products (
    packaged_product_id INT AUTO_INCREMENT PRIMARY KEY,
    packaged_product_batch_id INT NOT NULL,
    product_name VARCHAR(255),
    FOREIGN KEY (packaged_product_batch_id) REFERENCES Packaged_Product_Batches(packaged_product_batch_id) ON DELETE CASCADE
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
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id) ON DELETE CASCADE
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
    FOREIGN KEY (transport_id) REFERENCES Transports(transport_id) ON DELETE CASCADE,
    FOREIGN KEY (harvest_batch_id) REFERENCES Harvest_Batches(harvest_batch_id) ON DELETE CASCADE,
    FOREIGN KEY (packaged_product_batch_id) REFERENCES Packaged_Product_Batches(packaged_product_batch_id) ON DELETE CASCADE
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
    FOREIGN KEY (shipment_id) REFERENCES Shipments(shipment_id) ON DELETE CASCADE
);

-- Sensors
CREATE TABLE Sensors (
    sensor_id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_type VARCHAR(100),
    warehouse_id INT,
    transport_id INT,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id) ON DELETE CASCADE,
    FOREIGN KEY (transport_id) REFERENCES Transports(transport_id) ON DELETE CASCADE
);

CREATE TABLE Sensor_Data (
    sensor_data_id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    timestamp DATETIME,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    travel_duration INT,
    coordinates VARCHAR(255),
    FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id) ON DELETE CASCADE
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
    spoilage_quantity INT DEFAULT 0,
    delivery_status ENUM('on time', 'late') DEFAULT 'on time',
    delivery_success ENUM('successful', 'unsuccessful') DEFAULT 'successful'
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
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (packaged_product_batch_id) REFERENCES Packaged_Product_Batches(packaged_product_batch_id) ON DELETE CASCADE,
    FOREIGN KEY (packaged_product_id) REFERENCES Package_Products(packaged_product_id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_id) REFERENCES Deliveries(delivery_id) ON DELETE CASCADE
);

-- Sample Data
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
(3, 'Apple Harvest 2024', 'Fruit', 800.00, '3 months');

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
(3, 2, 'BATCH003', 400.00, 'Stored', '2024-09-02');

INSERT INTO Owners (first_name, last_name, contact_number, address) VALUES
('Michael', 'Brown', '111-222-3333', '123 Factory St, Industrial Zone'),
('Sarah', 'Wilson', '444-555-6666', '456 Processing Ave, Manufacturing District');

INSERT INTO Factories (owner_id, factory_name, factory_region, harvest_received_quantity) VALUES
(1, 'Fresh Processing Plant', 'Industrial Zone A', 1500.00),
(2, 'Grain Mill Co.', 'Industrial Zone B', 2500.00);

INSERT INTO Product_Batches (factory_id, production_date, quantity) VALUES
(1, '2024-06-20', 200.00),
(2, '2024-07-05', 800.00),
(1, '2024-09-05', 350.00);

INSERT INTO Packaged_Product_Batches (product_batch_id, warehouse_id, production_quantity, spoilage_count) VALUES
(1, 1, 200.00, 2),
(2, 3, 800.00, 0),
(3, 2, 350.00, 1);

INSERT INTO Package_Products (packaged_product_batch_id, product_name) VALUES
(1, 'Canned Tomatoes'),
(2, 'Wheat Flour'),
(3, 'Apple Juice');

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

INSERT INTO Transports (driver_id, vehicle_type, vehicle_license_no, vehicle_capacity, current_capacity, vehicle_status) VALUES
(1, 'Truck', 'TRK-001', 5000.00, 0.00, 'available'),
(2, 'Van', 'VAN-002', 2000.00, 0.00, 'available'),
(3, 'Refrigerated Truck', 'REF-003', 3000.00, 0.00, 'in-use');

INSERT INTO Shipments (transport_id, harvest_batch_id, packaged_product_batch_id, shipment_date, shipment_destination, status, transportation_cost) VALUES
(1, 1, NULL, '2024-06-17', 'Factory A', 'In Transit', 150.00),
(2, NULL, 1, '2024-06-25', 'Retail Store B', 'Delivered', 200.00),
(3, 3, NULL, '2024-09-03', 'Processing Plant C', 'Pending', 120.00);

INSERT INTO Shipping_Documents (shipment_id, document_type, document_number, issue_date, issued_by, file_path, approval_status, notes) VALUES
(1, 'Invoice', 'INV-001', '2024-06-17', 'Admin', '/invoices/INV-001.pdf', 'Approved', 'Initial shipment invoice'),
(2, 'Bill of Lading', 'BOL-001', '2024-06-25', 'Admin', '/bills/BOL-001.pdf', 'Approved', 'Product delivery'),
(3, 'Customs Declaration', 'CUS-001', '2024-09-03', 'Admin', '/customs/CUS-001.pdf', 'Pending', 'International shipment');

INSERT INTO Sensors (sensor_type, warehouse_id, transport_id) VALUES
('Temperature', 2, NULL),
('Humidity', 1, NULL),
('GPS', NULL, 1),
('Temperature', NULL, 3);

INSERT INTO Sensor_Data (sensor_id, timestamp, temperature, humidity, travel_duration, coordinates) VALUES
(1, '2024-06-16 10:00:00', 4.5, NULL, NULL, NULL),
(2, '2024-06-16 10:00:00', NULL, 65.0, NULL, NULL),
(3, '2024-06-17 08:30:00', NULL, NULL, 120, '40.7128,-74.0060'),
(4, '2024-09-03 14:15:00', 2.0, NULL, NULL, NULL);

INSERT INTO Deliveries (vehicle_license_no, delivery_date, delivery_time, delivery_man_name, expected_time, delivered_time, spoilage_quantity, delivery_status, delivery_success) VALUES
('ABC-123', '2024-06-25', '14:30:00', 'Carlos Rodriguez', '15:00:00', '14:30:00', 0, 'on time', 'successful'),
('XYZ-789', '2024-07-10', '09:15:00', 'Emma Thompson', '09:00:00', '09:15:00', 2, 'late', 'successful'),
('DEF-456', '2024-09-08', '16:45:00', 'James Wilson', '17:00:00', '16:45:00', 0, 'on time', 'successful');

INSERT INTO Orders (location, order_date) VALUES
('Downtown Store', '2024-06-20'),
('Suburban Market', '2024-07-05'),
('City Center Mall', '2024-09-01');

INSERT INTO Orderlines (order_id, packaged_product_batch_id, packaged_product_id, delivery_id, quantity, unit_price, discount_percentage, total_price) VALUES
(1, 1, 1, 1, 50, 5.99, 0.00, 299.50),
(2, 2, 2, 2, 100, 2.49, 5.00, 236.55),
(3, 3, 3, 3, 25, 8.99, 10.00, 202.28);