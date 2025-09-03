# 🌱 FRAAAAS - Advanced Supply Chain Management System

<div align="center">

![FRAAAAS Logo](https://img.shields.io/badge/FRAAAAS-Supply%20Chain%20Management-2E7D6A?style=for-the-badge&logo=leaf&logoColor=white)

**A comprehensive, modern supply chain management platform for agricultural products with real-time tracking, inventory management, and analytics.**

[![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?style=flat-square&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://javascript.info)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

[🚀 Live Demo](#-live-demo) • [📖 Documentation](#-documentation) • [🛠️ Installation](#️-installation) • [🤝 Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Installation](#️-installation)
- [📱 User Interfaces](#-user-interfaces)
- [🗄️ Database Schema](#️-database-schema)
- [🔧 API Documentation](#-api-documentation)
- [📊 Screenshots](#-screenshots)
- [🚀 Live Demo](#-live-demo)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

**FRAAAAS** is a cutting-edge supply chain management system specifically designed for agricultural products. It provides end-to-end visibility and control over the entire supply chain, from farm to consumer, with modern web technologies and intuitive user interfaces.

### 🎯 Key Objectives

- **Complete Traceability**: Track products from farm to final destination
- **Real-time Monitoring**: Live updates on shipments, inventory, and conditions
- **Data-driven Insights**: Comprehensive analytics and reporting
- **User-friendly Interface**: Modern, responsive design for all stakeholders
- **Scalable Architecture**: Built to handle growing agricultural operations

---

## ✨ Features

### 🚜 **Agricultural Product Management**
- **Crop & Harvest Records**: Comprehensive tracking of agricultural products
- **Product Traceability**: Complete supply chain visibility with PDF export
- **Batch Management**: Organize products by batches for better tracking
- **Storage Requirements**: Monitor and manage storage conditions

### 📦 **Inventory Management**
- **Stock Level Monitoring**: Real-time inventory tracking across warehouses
- **Low Stock Alerts**: Automated notifications for inventory levels
- **Warehouse Management**: Multi-location inventory control
- **Batch Tracking**: Detailed batch-level inventory management

### 🚚 **Transportation & Logistics**
- **Shipment Planning**: Comprehensive shipment management system
- **Real-time Tracking**: Live shipment progress monitoring
- **Route Optimization**: Intelligent route planning and management
- **Driver & Vehicle Management**: Complete fleet management

### 🌡️ **Condition Monitoring**
- **Sensor Integration**: Temperature and humidity monitoring
- **Alert System**: Real-time notifications for condition breaches
- **Data Logging**: Historical condition data analysis
- **Compliance Tracking**: Ensure regulatory compliance

### 📄 **Document Management**
- **Digital Documentation**: Store and manage shipping documents
- **Approval Workflows**: Streamlined document approval processes
- **Compliance Reports**: Generate regulatory compliance reports
- **PDF Generation**: Automated report generation

### 📊 **Analytics & Reporting**
- **Performance Dashboards**: Real-time KPI monitoring
- **Trend Analysis**: Historical data analysis and insights
- **Custom Reports**: Flexible reporting capabilities
- **Data Export**: Export data in multiple formats

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRAAAAS System Architecture              │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (HTML5, CSS3, JavaScript)                  │
│  ├── Admin Dashboard                                        │
│  ├── Feature Modules (7 specialized interfaces)            │
│  ├── Home/Landing Page                                      │
│  └── Role-based Dashboards                                  │
├─────────────────────────────────────────────────────────────┤
│  Backend Layer (PHP)                                        │
│  ├── API Endpoints                                          │
│  ├── Business Logic Handlers                                │
│  ├── Data Validation                                        │
│  └── PDF Generation                                         │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (MySQL)                                     │
│  ├── 20+ Normalized Tables                                  │
│  ├── Foreign Key Relationships                              │
│  ├── Indexed Queries                                        │
│  └── Sample Data                                            │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 **Technology Stack**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | User interfaces and interactions |
| **Backend** | PHP 8.0+ | Server-side logic and API |
| **Database** | MySQL 8.0+ | Data persistence and management |
| **Libraries** | Chart.js, Leaflet, jsPDF | Enhanced functionality |
| **Styling** | Custom CSS with CSS Variables | Modern, responsive design |

---

## 🛠️ Installation

### 📋 Prerequisites

- **Web Server**: Apache/Nginx with PHP support
- **PHP**: Version 8.0 or higher
- **MySQL**: Version 8.0 or higher
- **Web Browser**: Modern browser with JavaScript enabled

### 🚀 Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/fraaaas-supply-chain.git
   cd fraaaas-supply-chain
   ```

2. **Database Setup**
   ```bash
   # Import the database schema
   mysql -u root -p < db.sql
   ```

3. **Configure Database Connection**
   ```php
   // Edit common/db.php
   $servername = "localhost";
   $username = "your_username";
   $password = "your_password";
   $dbname = "farhansupply_db2";
   ```

4. **Deploy to Web Server**
   ```bash
   # Copy files to your web server directory
   cp -r * /var/www/html/fraaaas/
   ```

5. **Access the Application**
   ```
   http://localhost/fraaaas/home/
   ```

### 🔧 **Configuration Options**

- **Database Settings**: Modify `common/db.php`
- **API Endpoints**: Configure in individual `api.php` files
- **PDF Generation**: Customize in `core/pdf_generator.php`
- **Styling**: Update CSS variables in individual feature files

---

## 📱 User Interfaces

### 👨‍💼 **Admin Dashboard**
- **Centralized Control**: Single interface for all system management
- **Real-time Statistics**: Live KPI monitoring and alerts
- **Feature Navigation**: Easy access to all system modules
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🚜 **Feature Modules**

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **Feature 1** | Agricultural Products | Crop records, harvest tracking, product traceability |
| **Feature 2** | Inventory Management | Stock monitoring, warehouse management, low stock alerts |
| **Feature 3** | Transportation | Shipment planning, real-time tracking, route management |
| **Feature 5** | Condition Monitoring | Sensor data, temperature alerts, compliance tracking |
| **Feature 6** | Document Management | Digital documents, approval workflows, compliance reports |
| **Feature 7** | Analytics | Performance dashboards, trend analysis, custom reports |

### 👥 **Role-based Access**

- **Admin**: Full system access and management
- **Compliance Officer**: Regulatory compliance and monitoring
- **Data Analyst**: Analytics and reporting access
- **Logistics Manager**: Transportation and shipment management
- **Warehouse Manager**: Inventory and warehouse operations

---

## 🗄️ Database Schema

### 📊 **Core Tables**

```sql
-- Agricultural Management
├── Farmers (farmer_id, first_name, last_name, contact_info)
├── Farms (farm_id, farm_name, location, irrigation_type)
├── Crops (crop_id, crop_name, crop_type)
├── Harvests (harvest_id, farm_id, harvest_details)
└── Crop_Sowing (harvest_id, crop_id, planting_dates)

-- Inventory Management
├── Warehouses (warehouse_id, warehouse_name, location, capacity)
├── Harvest_Batches (batch_id, harvest_id, warehouse_id, quantity)
├── Packaged_Product_Batches (batch_id, factory_id, production_details)
└── Package_Products (product_id, batch_id, product_details)

-- Transportation
├── Drivers (driver_id, driver_details)
├── Transports (transport_id, driver_id, vehicle_details)
├── Shipments (shipment_id, transport_id, destination, status)
├── Routes (route_id, route_name, destination, distance)
└── Shipment_Progress (progress_id, shipment_id, current_location)

-- Monitoring & Compliance
├── Sensors (sensor_id, sensor_type, location)
├── Sensor_Data (data_id, sensor_id, temperature, humidity)
├── Shipping_Documents (document_id, shipment_id, document_type)
└── Deliveries (delivery_id, delivery_details, status)
```

### 🔗 **Key Relationships**

- **Farmers** → **Farms** (Many-to-Many via assignments)
- **Farms** → **Harvests** → **Harvest_Batches** → **Packaged_Product_Batches**
- **Shipments** → **Transports** → **Drivers**
- **Sensors** → **Sensor_Data** (One-to-Many)

---

## 🔧 API Documentation

### 🌐 **RESTful Endpoints**

#### **Agricultural Products API**
```http
GET    /feature1/api.php?action=crops
POST   /feature1/api.php (add_crop)
PUT    /feature1/api.php (update_crop)
DELETE /feature1/api.php (delete_crop)
```

#### **Inventory Management API**
```http
GET    /feature2/api.php?action=batches
POST   /feature2/api.php (add_batch)
PUT    /feature2/api.php (update_batch)
DELETE /feature2/api.php (delete_batch)
```

#### **Transportation API**
```http
GET    /feature3/api.php?action=shipments
POST   /feature3/api.php (add_shipment)
PUT    /feature3/api.php (update_shipment)
DELETE /feature3/api.php (delete_shipment)
```

### 📝 **Request/Response Format**

```json
// Request
{
  "action": "add_crop",
  "crop_name": "Organic Tomatoes",
  "crop_type": "Vegetable"
}

// Response
{
  "success": true,
  "id": 123,
  "message": "Crop added successfully"
}
```

---

## 🚀 Live Demo

### 🌐 **Access the System**

- **Home Page**: [http://localhost/fraaaas/home/](http://localhost/fraaaas/home/)
- **Admin Dashboard**: [http://localhost/fraaaas/admin/](http://localhost/fraaaas/admin/)
- **Feature Modules**: Navigate through the admin dashboard

### 🔑 **Demo Credentials**

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Admin | admin | admin123 | Full System Access |
| Compliance Officer | compliance | compliance123 | Compliance & Monitoring |
| Data Analyst | analyst | analyst123 | Analytics & Reports |
| Logistics Manager | logistics | logistics123 | Transportation Management |
| Warehouse Manager | warehouse | warehouse123 | Inventory Management |

---

## 🤝 Contributing

We welcome contributions to improve FRAAAAS! Here's how you can help:

### 🛠️ **Development Setup**

1. **Fork the Repository**
   ```bash
   git fork https://github.com/yourusername/fraaaas-supply-chain.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

4. **Submit a Pull Request**
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```

### 📋 **Contribution Guidelines**

- **Code Style**: Follow existing PHP and JavaScript conventions
- **Documentation**: Update README and inline comments
- **Testing**: Test all new features thoroughly
- **Issues**: Report bugs and suggest improvements

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### 📜 **License Summary**

- ✅ **Commercial Use**: Use in commercial projects
- ✅ **Modification**: Modify and adapt the code
- ✅ **Distribution**: Share and distribute
- ✅ **Private Use**: Use in private projects
- ❌ **Liability**: No warranty or liability
- ❌ **Warranty**: No warranty provided

---

## 🙏 Acknowledgments

- **Farmers and Agricultural Workers**: For inspiring this system
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: Everyone who has helped improve this project
- **Beta Testers**: For valuable feedback and testing

---

## 📞 Support & Contact

### 💬 **Get Help**

- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

### 📧 **Contact Information**

- **Email**: support@fraaaas.com
- **Website**: [https://fraaaas.com](https://fraaaas.com)
- **GitHub**: [https://github.com/yourusername/fraaaas-supply-chain](https://github.com/yourusername/fraaaas-supply-chain)

---

<div align="center">

**Made with ❤️ for the Agricultural Community**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/fraaaas-supply-chain?style=social)](https://github.com/yourusername/fraaaas-supply-chain)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/fraaaas-supply-chain?style=social)](https://github.com/yourusername/fraaaas-supply-chain)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/fraaaas-supply-chain)](https://github.com/yourusername/fraaaas-supply-chain)

</div>