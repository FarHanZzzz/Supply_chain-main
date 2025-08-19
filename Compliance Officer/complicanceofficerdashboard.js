  // ComplianceHub Dashboard JavaScript
  class ComplianceDashboard {
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
        this.initializeCharts();
        this.showDashboard();
        this.updateNotificationCount(3);

        // Ensure iframe height calculated initially if needed
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

        // Responsive handling - remove collapsed when big & recalc height
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.sidebar.classList.remove('collapsed');
            }
            this.adjustFeatureFrameHeight();
        });

        // Notification bell
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.showNotification('You have 3 pending notifications', 'info');
            });
        }

        // Recompute iframe size after iframe content loads (and handle errors)
        this.featureFrame.addEventListener('load', () => {
            this.featureFrame.classList.remove('loading');
            // Small timeout helps when iframe content adjusts height after load
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
        if (title) {
            this.pageTitle.textContent = title;
        }

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
        this.featureFrame.src = '';
    }

    showFeature(url) {
        this.dashboardHome.style.display = 'none';
        this.iframeWrapper.style.display = 'block';
        this.featureFrame.style.display = 'block';
        this.featureFrame.classList.add('loading');

        // Set iframe src (will trigger load handler)
        this.featureFrame.src = url;

        // Adjust immediately to avoid visible bottom gap
        this.adjustFeatureFrameHeight();
    }

    showError(message) {
        const errorContent = `
            <div class="d-flex align-items-center justify-content-center" style="height: 60vh;">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 4rem;"></i>
                    <h3 class="mb-3">Content Unavailable</h3>
                    <p class="text-muted mb-4">${message}</p>
                    <button class="btn btn-compliance" onclick="location.reload()">
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
        
        // Auto remove after hide
        toastElement.addEventListener('hidden.bs.toast', () => {
            if (toastElement && toastElement.parentNode) toastElement.parentNode.removeChild(toastElement);
        });
    }

    /**
     * Dynamically calculate the iframe height so it fills the viewport under the top bar.
     */
    adjustFeatureFrameHeight() {
        if (!this.iframeWrapper || this.iframeWrapper.style.display === 'none') return;

        const topBarRect = this.topBar ? this.topBar.getBoundingClientRect() : { bottom: 0 };
        const available = Math.max(window.innerHeight - Math.ceil(topBarRect.bottom) - 24, 300); // min 300px
        this.iframeWrapper.style.height = available + 'px';
        this.featureFrame.style.height = available + 'px';
    }

    initializeCharts() {
        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Compliance Score',
                        data: [88, 90, 87, 92, 89, 94],
                        borderColor: '#0f766e',
                        backgroundColor: 'rgba(15, 118, 110, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Policy Updates',
                        data: [12, 15, 8, 18, 14, 12],
                        borderColor: '#0891b2',
                        backgroundColor: 'rgba(8, 145, 178, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, padding: 20 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Risk Distribution Chart
        const riskCtx = document.getElementById('riskChart');
        if (riskCtx) {
            new Chart(riskCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
                    datasets: [{
                        data: [45, 30, 20, 5],
                        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#dc2626'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, padding: 15 }
                        }
                    }
                }
            });
        }
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new ComplianceDashboard();
    window.complianceDashboard = dashboard;
    
    // Welcome notification
    setTimeout(() => {
        dashboard.showNotification('Welcome to ComplianceHub Dashboard!', 'success');
    }, 1000);

    // Ensure height recalculation a bit later (in case fonts or layout change)
    setTimeout(() => dashboard.adjustFeatureFrameHeight(), 300);
});

// Handle iframe messages
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'navigate') {
        console.log('Navigation request from iframe:', event.data);
    }
});