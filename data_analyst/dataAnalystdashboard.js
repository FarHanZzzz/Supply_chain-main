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
        const title = link.dataset.title || 'DataViz';

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
            console.log('Notification clicked - would show data alerts');
        }

        // Handle export button clicks
        if (e.target.closest('.btn-analyst')) {
            e.preventDefault();
            console.log('Export clicked - would generate analytics report');
        }

        // Handle card clicks for more details
        if (e.target.closest('.stat-card')) {
            const card = e.target.closest('.stat-card');
            const title = card.querySelector('h6').textContent;
            console.log(`Card clicked: ${title} - would show detailed analytics`);
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

    // Simulate real-time data updates (for demo)
    setInterval(() => {
        const dataQualityScore = document.querySelector('.stat-card.success .value');
        if (dataQualityScore && dataQualityScore.textContent.includes('%')) {
            const currentValue = parseFloat(dataQualityScore.textContent);
            const variation = (Math.random() - 0.5) * 0.4; // Random variation between -0.2 and 0.2
            const newValue = Math.max(90, Math.min(100, currentValue + variation));
            dataQualityScore.textContent = newValue.toFixed(1) + '%';
        }
    }, 15000); // Update every 15 seconds

    // Add data processing animation
    const processingSpeedCard = document.querySelector('.stat-card.secondary .value');
    if (processingSpeedCard) {
        setInterval(() => {
            processingSpeedCard.style.opacity = '0.7';
            setTimeout(() => {
                processingSpeedCard.style.opacity = '1';
            }, 500);
        }, 8000); // Animate every 8 seconds to show active processing
    }

    // Log card interactions for analytics
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const cardTitle = card.querySelector('h6').textContent;
            console.log(`Analytics: Card "${cardTitle}" clicked at position ${index + 1}`);
        });
    });
});
