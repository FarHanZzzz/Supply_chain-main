document.addEventListener('DOMContentLoaded', () => {
    // Grab key elements
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const pageTitleEl = document.getElementById('pageTitle');
    const dashboardHome = document.getElementById('dashboardHome');
    const featureFrame = document.getElementById('featureFrame');

    /**
     * Toggle the sidebar on small screens.
     */
    toggleBtn?.addEventListener('click', () => {
        // Toggle a class on the sidebar to control its transform
        sidebar.classList.toggle('collapsed');
    });

    /**
     * Handle sidebar link clicks using event delegation.
     */
    sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const target = link.dataset.target;
        const title = link.dataset.title || 'LogiFlow';

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
     * Display the dashboard and hide the feature iframe.
     */
    function showDashboard() {
        dashboardHome.classList.remove('d-none');
        featureFrame.classList.remove('active');
        featureFrame.removeAttribute('src');
    }

    /**
     * Load a feature page into the iframe.
     *
     * @param {string} url The relative or absolute URL to load
     */
    function loadFeatureInIframe(url) {
        // Hide dashboard and show iframe
        dashboardHome.classList.add('d-none');
        featureFrame.classList.add('active');

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
                // If cross-origin restrictions prevent access, fall back to a fixed height
                console.warn('Could not auto-resize iframe:', err);
                featureFrame.style.height = '800px';
            }
        };
    }

    // Initialize dashboard on page load
    showDashboard();

    // Add some interactivity for demo purposes
    document.addEventListener('click', (e) => {
        // Handle notification bell clicks
        if (e.target.closest('.notification-bell')) {
            e.preventDefault();
            console.log('Notification clicked - would show logistics alerts');
        }

        // Handle export button clicks
        if (e.target.closest('.btn-logistics')) {
            e.preventDefault();
            console.log('Export clicked - would generate logistics report');
        }

        // Handle card clicks for more details
        if (e.target.closest('.stat-card')) {
            const card = e.target.closest('.stat-card');
            const title = card.querySelector('h6').textContent;
            console.log(`Card clicked: ${title} - would show detailed view`);
        }
    });

    // Add window resize handler for responsive behavior
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            sidebar.classList.remove('collapsed');
        }
    });

    // Add hover effects to cards
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.cursor = 'pointer';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.cursor = 'default';
        });
    });

    // Simulate real-time updates (for demo)
    setInterval(() => {
        const activeShipments = document.querySelector('.stat-card.primary .value');
        if (activeShipments) {
            const currentValue = parseInt(activeShipments.textContent);
            const variation = Math.floor(Math.random() * 5) - 2; // Random variation between -2 and 2
            const newValue = Math.max(0, currentValue + variation);
            activeShipments.textContent = newValue;
        }
    }, 30000); // Update every 30 seconds
});
