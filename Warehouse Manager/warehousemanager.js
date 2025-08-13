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
        const title = link.dataset.title || 'WarehouseOps';

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
            console.log('Notification clicked - would show warehouse alerts');
        }

        // Handle export button clicks
        if (e.target.closest('.btn-warehouse')) {
            e.preventDefault();
            console.log('Export clicked - would generate warehouse operations report');
        }

        // Handle card clicks for more details
        if (e.target.closest('.stat-card')) {
            const card = e.target.closest('.stat-card');
            const title = card.querySelector('h6').textContent;
            console.log(`Card clicked: ${title} - would show detailed warehouse metrics`);
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

    // Simulate real-time warehouse updates (for demo)
    setInterval(() => {
        // Update orders fulfilled count
        const ordersCard = document.querySelector('.stat-card.info .value');
        if (ordersCard && !ordersCard.textContent.includes('%')) {
            const currentValue = parseInt(ordersCard.textContent.replace(/,/g, ''));
            const increment = Math.floor(Math.random() * 3); // Random increment 0-2
            const newValue = currentValue + increment;
            ordersCard.textContent = newValue.toLocaleString();
        }
    }, 45000); // Update every 45 seconds

    // Simulate storage utilization changes
    setInterval(() => {
        const storageCard = document.querySelector('.stat-card.primary .value');
        if (storageCard && storageCard.textContent.includes('%')) {
            const currentValue = parseFloat(storageCard.textContent);
            const variation = (Math.random() - 0.5) * 0.6; // Random variation between -0.3 and 0.3
            const newValue = Math.max(70, Math.min(85, currentValue + variation));
            storageCard.textContent = newValue.toFixed(1) + '%';
        }
    }, 30000); // Update every 30 seconds

    // Add safety counter increment
    const safetyCard = document.querySelector('.stat-card.success .value');
    if (safetyCard && safetyCard.textContent.includes('days')) {
        // Increment safety days counter every minute (for demo purposes)
        setInterval(() => {
            const currentDays = parseInt(safetyCard.textContent);
            // Only increment occasionally to simulate realistic safety tracking
            if (Math.random() < 0.1) { // 10% chance to increment
                safetyCard.textContent = (currentDays + 1) + ' days';
            }
        }, 60000); // Check every minute
    }

    // Add equipment status monitoring
    const equipmentCard = document.querySelector('.stat-card.danger .value');
    if (equipmentCard) {
        setInterval(() => {
            const currentIssues = parseInt(equipmentCard.textContent);
            // Randomly resolve or add equipment issues
            const change = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
            const newIssues = Math.max(0, Math.min(10, currentIssues + change));
            equipmentCard.textContent = newIssues;
            
            // Update the small text based on number of issues
            const smallText = equipmentCard.parentElement.querySelector('small');
            if (newIssues === 0) {
                smallText.innerHTML = '<i class="fas fa-check me-1"></i> All equipment operational';
                smallText.className = 'text-success';
            } else if (newIssues <= 2) {
                smallText.innerHTML = `<i class="fas fa-tools me-1"></i> ${newIssues} minor issues`;
                smallText.className = 'text-warning';
            } else {
                smallText.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i> ${Math.floor(newIssues/2)} urgent repairs`;
                smallText.className = 'text-danger';
            }
        }, 120000); // Update every 2 minutes
    }

    // Log warehouse operations for analytics
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const cardTitle = card.querySelector('h6').textContent;
            console.log(`Warehouse Analytics: "${cardTitle}" accessed at ${new Date().toLocaleTimeString()}`);
        });
    });
});
