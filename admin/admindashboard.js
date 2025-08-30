// FRAAAAS Dashboard JavaScript
class FraaasDashboard {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.dashboardHome = document.getElementById('dashboardHome');
        this.featureFrame = document.getElementById('featureFrame');
        this.iframeWrapper = document.getElementById('iframeWrapper');
        this.pageTitle = document.getElementById('pageTitle');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.topBar = document.getElementById('topBar');
        this.initializeEventListeners();
        // remove widgets but keep the dashboard container and nav
        this.clearDashboardWidgets();
        this.initializeEventListeners();

        
        this.initializeCharts();
        this.showDashboard();
        this.updateNotificationCount(3);

        // ensure iframe is sized on first load
        this.adjustFeatureFrameHeight();
    }

    initializeEventListeners() {
        // Mobile sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('collapsed');
            });
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.sidebar-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link);
            });
        });

        // Responsive handling - remove collapsed when big
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.sidebar.classList.remove('collapsed');
            }
            // Recalculate iframe height on resize
            this.adjustFeatureFrameHeight();
        });

        // Notification bell
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.showNotification('You have 3 agriculture system alerts', 'warning');
            });
        }

        // Recompute iframe size after iframe content loads (some pages may have dynamic header)
        this.featureFrame.addEventListener('load', () => {
            this.featureFrame.classList.remove('loading');
            // adjust height again after load
            setTimeout(() => this.adjustFeatureFrameHeight(), 120);
        });

        this.featureFrame.addEventListener('error', () => {
            this.featureFrame.classList.remove('loading');
            this.showError('Failed to load feature content');
        });
    }

    handleNavigation(link) {
        // Update active states
        document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const target = link.getAttribute('data-target');
        const url = link.getAttribute('data-url');
        const title = link.getAttribute('data-title');

        // Update page title
        if (title) { this.pageTitle.textContent = title; }

        // Navigate based on target
        if (target === 'dashboard') {
            this.showDashboard();
        } else if (target === 'iframe' && url) {
            this.showFeature(url);
        }

        // Close mobile sidebar
        if (window.innerWidth <= 992) {
            this.sidebar.classList.add('collapsed');
        }
    }

    showDashboard() {
        this.dashboardHome.style.display = 'block';
        this.iframeWrapper.style.display = 'none';
        this.featureFrame.style.display = 'none';
        // clear src to stop background activity if desired
        this.featureFrame.src = '';
    }

    showFeature(url) {
        this.dashboardHome.style.display = 'none';
        this.iframeWrapper.style.display = 'block';
        this.featureFrame.style.display = 'block';
        this.featureFrame.classList.add('loading');

        // set src (this triggers load event above)
        this.featureFrame.src = url;

        // immediately adjust height to avoid bottom gap
        this.adjustFeatureFrameHeight();
    }

    showError(message) {
        const errorContent = `
            <div class="d-flex align-items-center justify-content-center" style="height: 60vh;">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 4rem;"></i>
                    <h3 class="mb-3">Content Unavailable</h3>
                    <p class="text-muted mb-4">${message}</p>
                    <button class="btn btn-agriculture" onclick="location.reload()">
                        <i class="fas fa-refresh me-2"></i>Reload Page
                    </button>
                </div>
            </div>
        `;
        this.dashboardHome.innerHTML = errorContent;
        this.dashboardHome.style.display = 'block';
        this.iframeWrapper.style.display = 'none';
        this.featureFrame.style.display = 'none';
    }
    clearDashboardWidgets() {
    const container = document.getElementById('dashboardHome');
    if (!container) return;

    // Selector list of things to remove
    const selectors = [
        '.stat-card',
        '.chart-card',
        '.activity-feed',
        '.alert',
        'canvas',
        '.row.g-4',
        '.row.g-4.mb-4'
    ];

    selectors.forEach(sel => {
        container.querySelectorAll(sel).forEach(node => node.remove());
    });

    // Remove leftover empty rows/columns
    container.querySelectorAll('.row').forEach(row => {
        // if row has no visible children after removals, remove it
        if (!row.querySelector('*')) row.remove();
    });

    // Optionally keep the section empty but intact (no placeholder)
    // container.innerHTML = ''; // <-- uncomment to clear everything inside dashboardHome
}

    updateNotificationCount(count) {
        if (this.notificationBadge) {
            this.notificationBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const toastHTML = `
            <div class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        container.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = container.lastElementChild;
        const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
        toast.show();

        // Remove element from DOM after hidden to keep container clean
        toastElement.addEventListener('hidden.bs.toast', () => {
            if (toastElement && toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
        });
    }

    /**
     * Dynamically calculate the iframe height so it exactly fills the space
     * under the top bar inside the viewport. This avoids bottom gaps.
     */
    adjustFeatureFrameHeight() {
        // If wrapper not visible, nothing to do
        if (!this.iframeWrapper || this.iframeWrapper.style.display === 'none') return;

        // Use the viewport height minus the bottom of the top bar minus some spacing
        const topBarRect = this.topBar ? this.topBar.getBoundingClientRect() : { bottom: 0 };
        const available = Math.max(window.innerHeight - Math.ceil(topBarRect.bottom) - 24, 300); // min 300px
        // Set both wrapper and iframe to this height
        this.iframeWrapper.style.height = available + 'px';
        this.featureFrame.style.height = available + 'px';
    }

    initializeCharts() {
        // Shipment Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: ['Jan','Feb','Mar','Apr','May','Jun'],
                    datasets: [{
                        label: 'Shipments Completed',
                        data: [45,52,48,61,55,68],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        borderWidth: 3, fill: true, tension: 0.4
                    },{
                        label: 'Temperature Alerts',
                        data: [8,12,6,15,9,7],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        borderWidth: 3, fill: true, tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
                }
            });
        }

        // Product Categories Chart
        const inventoryCtx = document.getElementById('inventoryChart');
        if (inventoryCtx) {
            new Chart(inventoryCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Fruits','Vegetables','Grains','Dairy','Meat'],
                    datasets: [{
                        data: [35,25,20,12,8],
                        backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } } }
                }
            });
        }
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new FraaasDashboard();
    window.fraaasDashboard = dashboard;

    // Welcome notification
    setTimeout(() => {
        dashboard.showNotification('Welcome to FRAAAAS Agriculture Dashboard!', 'success');
    }, 1000);

    // If user lands directly on a feature (e.g. deep link), ensure iframe height is correct after a short delay
    setTimeout(() => dashboard.adjustFeatureFrameHeight(), 300);
});

// Handle iframe messages (left intact)
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'navigate') {
        console.log('Navigation request from iframe:', event.data);
    }
});