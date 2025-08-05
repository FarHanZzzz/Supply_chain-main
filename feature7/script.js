// Feature 7: Analytics JavaScript

let currentTab = 'overview';
let dashboardData = null;

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    showTab('overview');
});

// Tab switching
function showTab(tabName) {
    currentTab = tabName;
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to selected tab button
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Load appropriate data
    switch(tabName) {
        case 'overview':
            displayOverview();
            break;
        case 'performance':
            displayPerformanceMetrics();
            break;
        case 'costs':
            displayCostAnalysis();
            break;
        case 'trends':
            displayTrends();
            break;
        case 'reports':
            displayReports();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading(true);
        const response = await fetch('api.php?action=dashboard');
        dashboardData = await response.json();
        displayOverview();
        showLoading(false);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load analytics data', 'error');
        showLoading(false);
    }
}

// Display overview tab
function displayOverview() {
    if (!dashboardData) return;
    
    // System statistics
    const stats = dashboardData.system_stats;
    document.getElementById('totalShipments').textContent = stats.total_shipments || '0';
    document.getElementById('totalProducts').textContent = stats.total_products || '0';
    document.getElementById('totalTransports').textContent = stats.total_transports || '0';
    document.getElementById('totalDrivers').textContent = stats.total_drivers || '0';
    
    // Delivery performance
    const delivery = dashboardData.delivery_performance;
    document.getElementById('onTimeDeliveries').textContent = delivery.on_time_deliveries || '0';
    document.getElementById('onTimePercentage').textContent = (delivery.on_time_percentage || 0) + '%';
    document.getElementById('avgDeliveryTime').textContent = (delivery.avg_delivery_time || 0) + 'h';
    
    // Transportation costs
    const costs = dashboardData.transportation_costs;
    document.getElementById('totalCosts').textContent = '$' + (costs.total_estimated_cost || 0).toLocaleString();
    document.getElementById('avgCostPerShipment').textContent = '$' + (costs.avg_cost_per_shipment || 0);
    
    // Recent trends (simplified)
    const trends = dashboardData.shipment_trends;
    if (trends.daily && trends.daily.length > 0) {
        const recentTrend = trends.daily[trends.daily.length - 1];
        document.getElementById('recentShipments').textContent = recentTrend.shipments || '0';
    }
}

// Display performance metrics
function displayPerformanceMetrics() {
    if (!dashboardData) return;
    
    // Carrier reliability
    const reliability = dashboardData.carrier_reliability;
    displayCarrierReliability(reliability.drivers || []);
    
    // Product performance
    const products = dashboardData.product_performance;
    displayProductPerformance(products.top_products || []);
    
    // Route efficiency
    const routes = dashboardData.route_efficiency;
    displayRouteEfficiency(routes.destinations || []);
}

// Display carrier reliability
function displayCarrierReliability(drivers) {
    const tableBody = document.getElementById('carrierTableBody');
    tableBody.innerHTML = '';
    
    drivers.forEach(driver => {
        const row = tableBody.insertRow();
        const reliabilityClass = driver.success_rate >= 90 ? 'high-reliability' : 
                                driver.success_rate >= 70 ? 'medium-reliability' : 'low-reliability';
        
        row.innerHTML = `
            <td>DR-${driver.driver_id.toString().padStart(3, '0')}</td>
            <td>${driver.driver_name}</td>
            <td>${driver.vehicle_type}</td>
            <td>${driver.total_shipments}</td>
            <td>${driver.completed_shipments}</td>
            <td><span class="reliability-badge ${reliabilityClass}">${driver.success_rate}%</span></td>
        `;
    });
}

// Display product performance
function displayProductPerformance(products) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';
    
    products.forEach(product => {
        const row = tableBody.insertRow();
        const performanceClass = product.success_rate >= 90 ? 'high-performance' : 
                                product.success_rate >= 70 ? 'medium-performance' : 'low-performance';
        
        row.innerHTML = `
            <td>${product.product_name}</td>
            <td>${product.shipment_count}</td>
            <td>${product.delivered_count}</td>
            <td><span class="performance-badge ${performanceClass}">${product.success_rate}%</span></td>
        `;
    });
}

// Display route efficiency
function displayRouteEfficiency(destinations) {
    const tableBody = document.getElementById('routeTableBody');
    tableBody.innerHTML = '';
    
    destinations.forEach(dest => {
        const row = tableBody.insertRow();
        const efficiencyClass = dest.avg_delivery_time <= 36 ? 'high-efficiency' : 
                               dest.avg_delivery_time <= 48 ? 'medium-efficiency' : 'low-efficiency';
        
        row.innerHTML = `
            <td>${dest.destination}</td>
            <td>${dest.shipment_count}</td>
            <td>${dest.avg_delivery_time ? dest.avg_delivery_time + 'h' : 'N/A'}</td>
            <td><span class="efficiency-badge ${efficiencyClass}">
                ${dest.avg_delivery_time <= 36 ? 'Excellent' : 
                  dest.avg_delivery_time <= 48 ? 'Good' : 'Needs Improvement'}
            </span></td>
        `;
    });
}

// Display cost analysis
function displayCostAnalysis() {
    if (!dashboardData) return;
    
    const costs = dashboardData.transportation_costs;
    
    // Cost summary
    document.getElementById('totalEstimatedCost').textContent = '$' + (costs.total_estimated_cost || 0).toLocaleString();
    document.getElementById('avgCostShipment').textContent = '$' + (costs.avg_cost_per_shipment || 0);
    document.getElementById('totalShipmentsCount').textContent = costs.total_shipments || '0';
    
    // Cost breakdown by vehicle type
    const tableBody = document.getElementById('costTableBody');
    tableBody.innerHTML = '';
    
    if (costs.by_vehicle_type) {
        costs.by_vehicle_type.forEach(vehicle => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${vehicle.vehicle_type}</td>
                <td>${vehicle.shipment_count}</td>
                <td>$${vehicle.cost_per_shipment}</td>
                <td>$${vehicle.total_cost.toLocaleString()}</td>
                <td>${((vehicle.total_cost / costs.total_estimated_cost) * 100).toFixed(1)}%</td>
            `;
        });
    }
}

// Display trends
function displayTrends() {
    if (!dashboardData) return;
    
    const trends = dashboardData.shipment_trends;
    
    // Daily trends
    displayDailyTrends(trends.daily || []);
    
    // Monthly trends
    displayMonthlyTrends(trends.monthly || []);
    
    // Condition analytics
    const conditions = dashboardData.condition_analytics;
    displayConditionTrends(conditions.daily_conditions || []);
    
    // Document analytics
    const documents = dashboardData.document_analytics;
    displayDocumentAnalytics(documents);
}

// Display daily trends
function displayDailyTrends(dailyData) {
    const tableBody = document.getElementById('dailyTrendsBody');
    tableBody.innerHTML = '';
    
    // Show last 10 days
    const recentData = dailyData.slice(-10);
    
    recentData.forEach(day => {
        const row = tableBody.insertRow();
        const deliveryRate = day.shipments > 0 ? ((day.delivered / day.shipments) * 100).toFixed(1) : '0';
        
        row.innerHTML = `
            <td>${formatDate(day.date)}</td>
            <td>${day.shipments}</td>
            <td>${day.delivered}</td>
            <td>${deliveryRate}%</td>
        `;
    });
}

// Display monthly trends
function displayMonthlyTrends(monthlyData) {
    const tableBody = document.getElementById('monthlyTrendsBody');
    tableBody.innerHTML = '';
    
    monthlyData.forEach(month => {
        const row = tableBody.insertRow();
        const deliveryRate = month.shipments > 0 ? ((month.delivered / month.shipments) * 100).toFixed(1) : '0';
        const monthName = new Date(month.year, month.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        row.innerHTML = `
            <td>${monthName}</td>
            <td>${month.shipments}</td>
            <td>${month.delivered}</td>
            <td>${deliveryRate}%</td>
        `;
    });
}

// Display condition trends
function displayConditionTrends(conditionData) {
    const tableBody = document.getElementById('conditionTrendsBody');
    tableBody.innerHTML = '';
    
    // Show last 10 days
    const recentData = conditionData.slice(-10);
    
    recentData.forEach(day => {
        const row = tableBody.insertRow();
        const alertRate = day.reading_count > 0 ? ((day.alert_count / day.reading_count) * 100).toFixed(1) : '0';
        
        row.innerHTML = `
            <td>${formatDate(day.date)}</td>
            <td>${day.avg_temperature}°C</td>
            <td>${day.avg_humidity}%</td>
            <td>${day.reading_count}</td>
            <td>${day.alert_count}</td>
            <td>${alertRate}%</td>
        `;
    });
}

// Display document analytics
function displayDocumentAnalytics(documentData) {
    // Status distribution
    const statusBody = document.getElementById('documentStatusBody');
    statusBody.innerHTML = '';
    
    if (documentData.status_distribution) {
        documentData.status_distribution.forEach(status => {
            const row = statusBody.insertRow();
            row.innerHTML = `
                <td>${status.status}</td>
                <td>${status.count}</td>
            `;
        });
    }
    
    // Type distribution
    const typeBody = document.getElementById('documentTypeBody');
    typeBody.innerHTML = '';
    
    if (documentData.type_distribution) {
        documentData.type_distribution.forEach(type => {
            const row = typeBody.insertRow();
            row.innerHTML = `
                <td>${type.document_type}</td>
                <td>${type.count}</td>
            `;
        });
    }
}

// Display reports
function displayReports() {
    // This would show custom report generation interface
    // For now, just show a placeholder
}

// Generate custom report
async function generateCustomReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showNotification('Please select start and end dates', 'error');
        return;
    }
    
    const metrics = [];
    if (document.getElementById('includeDelivery').checked) metrics.push('delivery_performance');
    if (document.getElementById('includeCosts').checked) metrics.push('costs');
    if (document.getElementById('includeTrends').checked) metrics.push('trends');
    
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate_report',
                start_date: startDate,
                end_date: endDate,
                metrics: metrics
            })
        });
        
        const report = await response.json();
        displayCustomReport(report);
        showNotification('Custom report generated successfully', 'success');
    } catch (error) {
        console.error('Error generating custom report:', error);
        showNotification('Failed to generate custom report', 'error');
    }
}

// Display custom report
function displayCustomReport(report) {
    const reportResults = document.getElementById('reportResults');
    reportResults.innerHTML = `
        <h4>Custom Report Results</h4>
        <p><strong>Period:</strong> ${report.period.start} to ${report.period.end}</p>
        <p><strong>Shipments in Period:</strong> ${report.shipments_in_period}</p>
        <div class="report-content">
            ${JSON.stringify(report, null, 2)}
        </div>
    `;
    reportResults.style.display = 'block';
}

// Refresh data
async function refreshData() {
    await loadDashboardData();
    showNotification('Analytics data refreshed successfully', 'success');
}

// Export data to PDF
async function exportAnalyticsPDF() {
    try {
        const response = await fetch('api.php?action=export_pdf');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analytics_report.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showNotification('Analytics report exported successfully!', 'success');
        } else {
            const errorText = await response.text();
            showNotification(`Failed to export PDF: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showNotification('Failed to export PDF', 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Auto-refresh every 5 minutes
setInterval(() => {
    loadDashboardData();
}, 300000);



