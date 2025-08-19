/* script.js
   WarehouseOps dashboard behavior + iframe height fix
   Drop this file next to the index.html above and remove any inline script blocks.
*/

class WarehouseOpsDashboard {
    constructor() {
      // DOM references
      this.sidebar = document.getElementById('sidebar');
      this.sidebarToggle = document.getElementById('sidebarToggle');
      this.dashboardHome = document.getElementById('dashboardHome');
      this.featureFrame = document.getElementById('featureFrame');
      this.pageTitle = document.getElementById('pageTitle');
      this.notificationBadge = document.getElementById('notificationBadge');
      this.topBar = document.querySelector('.top-bar');
  
      // Init
      this.initializeEventListeners();
      this.initializeCharts();
      this.showDashboard();
      this.updateNotificationCount(4);
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
  
      // Resize & scroll - recompute iframe height
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) this.sidebar.classList.remove('collapsed');
        this.adjustIframeHeight();
      });
  
      window.addEventListener('scroll', () => {
        if (this.featureFrame && this.featureFrame.style.display === 'block') {
          this.adjustIframeHeight();
        }
      });
  
      // Notification bell
      const notificationBell = document.getElementById('notificationBell');
      if (notificationBell) {
        notificationBell.addEventListener('click', () => {
          this.showNotification('You have 4 warehouse alerts requiring attention', 'warning');
        });
      }
  
      // Allow trusted iframe to request resize via postMessage (optional)
      window.addEventListener('message', (event) => {
        try {
          if (event && event.data && event.data.type === 'resize-ifr') {
            this.adjustIframeHeight();
          }
        } catch (err) {
          // ignore malicious/cross origin
        }
      });
    }
  
    handleNavigation(link) {
      // Active state
      document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
  
      const target = link.getAttribute('data-target');
      const url = link.getAttribute('data-url');
      const title = link.getAttribute('data-title');
  
      // Update title
      if (title) this.pageTitle.textContent = title;
  
      // Routing
      if (target === 'dashboard') {
        this.showDashboard();
      } else if (target === 'iframe' && url) {
        this.showFeature(url);
      }
  
      // Close mobile sidebar
      if (window.innerWidth <= 992) this.sidebar.classList.add('collapsed');
    }
  
    showDashboard() {
      if (this.dashboardHome) this.dashboardHome.style.display = 'block';
      if (this.featureFrame) {
        this.featureFrame.style.display = 'none';
        this.featureFrame.src = '';
      }
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    showFeature(url) {
      if (this.dashboardHome) this.dashboardHome.style.display = 'none';
      if (!this.featureFrame) return;
      this.featureFrame.style.display = 'block';
      this.featureFrame.classList.add('loading');
      this.featureFrame.src = url;
  
      // Immediately size to available viewport area
      this.adjustIframeHeight();
  
      // On load, try to size to content (same-origin) else keep available height
      this.featureFrame.onload = () => {
        this.featureFrame.classList.remove('loading');
  
        try {
          const doc = this.featureFrame.contentDocument || this.featureFrame.contentWindow.document;
          if (doc) {
            const contentHeight = Math.max(
              doc.documentElement.scrollHeight || 0,
              (doc.body && doc.body.scrollHeight) || 0,
              doc.documentElement.offsetHeight || 0,
              (doc.body && doc.body.offsetHeight) || 0
            );
            const available = this.computeAvailableHeight();
            // choose reasonable height: content if smaller than big page, but at least available
            const finalHeight = Math.max(Math.min(contentHeight, Math.max(available, 400)), 400);
            this.featureFrame.style.height = finalHeight + 'px';
          } else {
            // fallback
            this.adjustIframeHeight();
          }
        } catch (err) {
          // Cross-origin content -> can't read. Fit to visible viewport area.
          this.adjustIframeHeight();
        }
  
        // ensure top of feature is visible
        window.scrollTo({ top: 0, behavior: 'auto' });
      };
  
      this.featureFrame.onerror = () => {
        this.featureFrame.classList.remove('loading');
        this.showError(`Failed to load: ${url}`);
      };
    }
  
    computeAvailableHeight() {
      // Calculate space below top-bar in viewport
      let topOffset = 80; // fallback
      if (this.topBar) {
        const rect = this.topBar.getBoundingClientRect();
        topOffset = Math.ceil(rect.bottom);
      }
      const available = window.innerHeight - topOffset - 24; // 24px padding
      return Math.max(available, 400);
    }
  
    adjustIframeHeight() {
      if (!this.featureFrame || this.featureFrame.style.display === 'none') return;
      const available = this.computeAvailableHeight();
      this.featureFrame.style.height = available + 'px';
    }
  
    showError(message) {
      if (!this.dashboardHome) return;
      const errorContent = `
        <div class="d-flex align-items-center justify-content-center" style="height:60vh;">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size:4rem;"></i>
            <h3 class="mb-3">Content Unavailable</h3>
            <p class="text-muted mb-4">${message}</p>
            <button class="btn btn-warehouse" onclick="location.reload()"><i class="fas fa-refresh me-2"></i>Reload Page</button>
          </div>
        </div>
      `;
      this.dashboardHome.innerHTML = errorContent;
      this.dashboardHome.style.display = 'block';
      if (this.featureFrame) this.featureFrame.style.display = 'none';
    }
  
    updateNotificationCount(count) {
      if (!this.notificationBadge) return;
      this.notificationBadge.style.display = count > 0 ? 'block' : 'none';
    }
  
    showNotification(message, type = 'info') {
      const allowed = ['info','success','warning','danger','primary','secondary'];
      const t = allowed.includes(type) ? type : 'info';
      const toastHTML = `
        <div class="toast align-items-center text-bg-${t} border-0" role="alert" aria-live="polite" aria-atomic="true">
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
      const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
      toast.show();
      toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    }
  
    initializeCharts() {
      // Operations chart
      const operationsCtx = document.getElementById('operationsChart');
      if (operationsCtx && window.Chart) {
        new Chart(operationsCtx, {
          type: 'line',
          data: {
            labels: ['6AM','9AM','12PM','3PM','6PM','9PM','12AM'],
            datasets: [{
              label: 'Orders Fulfilled',
              data: [45,89,156,132,178,98,34],
              borderColor: '#d97706',
              backgroundColor: 'rgba(217,119,6,0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            },{
              label: 'Receiving Volume',
              data: [12,25,18,45,32,15,8],
              borderColor: '#92400e',
              backgroundColor: 'rgba(146,64,14,0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            scales: {
              y: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.05)' } },
              x: { grid:{ display:false } }
            }
          }
        });
      }
  
      // Storage chart
      const storageCtx = document.getElementById('storageChart');
      if (storageCtx && window.Chart) {
        new Chart(storageCtx, {
          type: 'doughnut',
          data: {
            labels: ['Electronics','Clothing','Books','Home & Garden','Sports'],
            datasets: [{
              data: [35,25,15,15,10],
              backgroundColor: ['#d97706','#92400e','#059669','#0369a1','#dc2626'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }
            }
          }
        });
      }
    }
  }
  
  // Initialize dashboard when DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new WarehouseOpsDashboard();
    window.warehouseOpsDashboard = dashboard;
  
    // Welcome notification
    setTimeout(() => dashboard.showNotification('Welcome to WarehouseOps Dashboard!', 'success'), 1000);
  });
  