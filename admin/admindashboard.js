/*
 * FRAAAAS Admin Dashboard script
 *
 * This module wires up the admin dashboard, handling sidebar navigation,
 * responsive layout adjustments, and optional chart initialisation.  It
 * ensures that feature pages loaded into the iframe are refreshed on
 * each navigation, preventing stale content from persisting between
 * feature transitions.  It also gracefully handles cross‑origin iframe
 * content by falling back to a fixed height when automatic resizing
 * isn't permitted.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Grab key elements
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const pageTitleEl = document.getElementById('pageTitle');
  const dashboardHome = document.getElementById('dashboardHome');
  const featureFrame = document.getElementById('featureFrame');

  // Flags for chart initialisation
  let chartsInitialised = false;
  let performanceChartInstance = null;
  let inventoryChartInstance = null;

  /**
   * Toggle the sidebar on small screens.
   */
  toggleBtn?.addEventListener('click', () => {
    // Toggle a class on the sidebar to control its transform
    sidebar.classList.toggle('collapsed');
  });

  /**
   * Handle sidebar link clicks using event delegation.  Links within the
   * user dropdown should not trigger dashboard navigation, so we only
   * process anchors with a data-target attribute.
   */
  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const target = link.dataset.target;
    const title = link.dataset.title || 'FRAAAAS';

    if (!target) return; // allow normal anchors without data-target
    e.preventDefault();

    setActiveLink(link);
    pageTitleEl.textContent = title;

    if (target === 'dashboard') {
      showDashboard();
    } else if (target === 'iframe') {
      const url = link.dataset.url;
      if (url) {
        loadFeatureInIframe(url);
      }
    }

    // Collapse the sidebar on small screens after selecting an item
    if (window.innerWidth <= 992) {
      sidebar.classList.add('collapsed');
    }
  });

  /**
   * Set the clicked link as active and remove active state from others.
   *
   * @param {HTMLElement} activeLink The link element that should become active
   */
  function setActiveLink(activeLink) {
    sidebar.querySelectorAll('.sidebar-menu a').forEach((anchor) => {
      anchor.classList.remove('active');
    });
    activeLink.classList.add('active');
  }

  /**
   * Display the dashboard and hide the feature iframe.  Initialise charts
   * once on first visit.
   */
  function showDashboard() {
    dashboardHome.classList.remove('d-none');
    featureFrame.classList.add('d-none');
    featureFrame.removeAttribute('src');

    if (!chartsInitialised) {
      initDashboardCharts();
      chartsInitialised = true;
    }
  }

  /**
   * Load a feature page into the iframe.  Always reload the iframe
   * regardless of whether the URL has changed – this prevents cached
   * content from persisting across navigations and ensures forms and
   * interactive widgets reset properly.  The iframe height is adjusted
   * after loading, with a catch for cross‑origin pages.
   *
   * @param {string} url The relative or absolute URL to load
   */
  function loadFeatureInIframe(url) {
    // Hide dashboard and show iframe
    dashboardHome.classList.add('d-none');
    featureFrame.classList.remove('d-none');

    // Always set the src to force a reload
    featureFrame.setAttribute('src', url);

    // Reset height to minimum before content loads
    featureFrame.style.height = '700px';

    // Listen for iframe load to adjust height
    featureFrame.onload = () => {
      try {
        const doc = featureFrame.contentDocument || featureFrame.contentWindow.document;
        const height = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
          doc.documentElement.offsetHeight
        );
        // Apply a minimum height to prevent sudden collapses
        featureFrame.style.height = Math.max(height + 20, 700) + 'px';
      } catch (err) {
        // If cross‑origin restrictions prevent access, fall back to a fixed height
        console.warn('Could not auto‑resize iframe:', err);
        featureFrame.style.height = '800px';
      }
    };
  }

  /**
   * Initialise charts on the dashboard.  If the canvas elements are
   * missing (e.g. the developer removed them from the markup), this
   * function quietly skips chart creation.
   */
  function initDashboardCharts() {
    const perfCanvas = document.getElementById('performanceChart');
    const invCanvas = document.getElementById('inventoryChart');

    if (perfCanvas && perfCanvas.getContext) {
      const ctx = perfCanvas.getContext('2d');
      performanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'On‑time delivery %',
              data: [92, 94, 90, 96, 95, 93, 97],
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.15)',
              tension: 0.35,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 },
          },
          plugins: {
            legend: { display: true },
          },
        },
      });
    }

    if (invCanvas && invCanvas.getContext) {
      const ctx = invCanvas.getContext('2d');
      inventoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['In Stock', 'Reserved', 'Out of Stock'],
          datasets: [
            {
              label: 'Inventory',
              data: [65, 25, 10],
              backgroundColor: ['#198754', '#f39c12', '#dc3545'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
          cutout: '60%',
        },
      });
    }
  }

  // By default, show the dashboard on initial load
  showDashboard();
});
