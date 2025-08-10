// admindashboard.js
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const pageTitleEl = document.getElementById('pageTitle');
  const dashboardHome = document.getElementById('dashboardHome');
  const featureFrame = document.getElementById('featureFrame');

  let chartsInitialized = false;
  let performanceChartInstance = null;
  let inventoryChartInstance = null;

  // Mobile sidebar toggle
  toggleBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Delegate link clicks in sidebar
  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const target = link.dataset.target;
    const title = link.dataset.title || 'FRAAAAS';

    if (!target) return; // let normal links (if any) work
    e.preventDefault();

    // Set active class on sidebar links
    setActiveLink(link);

    if (target === 'dashboard') {
      pageTitleEl.textContent = title;
      showDashboard();
    } else if (target === 'iframe') {
      const url = link.dataset.url;
      if (!url) return;
      pageTitleEl.textContent = title;
      loadFeatureInIframe(url);
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 992) {
      sidebar.classList.remove('active');
    }
  });

  function setActiveLink(activeLink) {
    sidebar.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    activeLink.classList.add('active');
  }

  function showDashboard() {
    // Show dashboard, hide iframe
    dashboardHome.classList.remove('d-none');
    featureFrame.classList.add('d-none');

    // Initialize charts once
    if (!chartsInitialized) {
      initDashboardCharts();
      chartsInitialized = true;
    }
  }

  function loadFeatureInIframe(url) {
    // Hide dashboard, show iframe
    dashboardHome.classList.add('d-none');
    featureFrame.classList.remove('d-none');

    // Only reload if URL changed
    if (featureFrame.getAttribute('src') !== url) {
      featureFrame.setAttribute('src', url);
    }
  }

  // Auto-resize iframe to its content (works if same-origin)
  featureFrame.addEventListener('load', () => {
    try {
      const doc = featureFrame.contentDocument || featureFrame.contentWindow.document;
      const height = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.offsetHeight
      );
      featureFrame.style.height = Math.max(height, 700) + 'px';
    } catch (err) {
      // Cross-origin or other restriction — ignore resizing
      console.warn('Could not auto-resize iframe:', err);
    }
  });

  // Initialize charts on Dashboard
  function initDashboardCharts() {
    const perfCtx = document.getElementById('performanceChart')?.getContext('2d');
    const invCtx = document.getElementById('inventoryChart')?.getContext('2d');

    if (perfCtx) {
      performanceChartInstance = new Chart(perfCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'On-time delivery %',
              data: [92, 94, 90, 96, 95, 93, 97],
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.15)',
              tension: 0.35,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 }
          },
          plugins: {
            legend: { display: true }
          }
        }
      });
    }

    if (invCtx) {
      inventoryChartInstance = new Chart(invCtx, {
        type: 'doughnut',
        data: {
          labels: ['In Stock', 'Reserved', 'Out of Stock'],
          datasets: [
            {
              label: 'Inventory',
              data: [65, 25, 10],
              backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c']
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          cutout: '60%'
        }
      });
    }
  }

  // Show dashboard by default
  showDashboard();
});