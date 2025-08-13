document.addEventListener('DOMContentLoaded', () => {
            // Grab key elements
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            const pageTitleEl = document.getElementById('pageTitle');
            const dashboardHome = document.getElementById('dashboardHome');
            const featureFrame = document.getElementById('featureFrame');



            // Flags for chart initialization
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
             * Handle sidebar link clicks using event delegation.
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
             * Display the dashboard and hide the feature iframe.  Initialize charts
             * once on first visit.
             */
            function showDashboard() {
                dashboardHome.classList.remove('d-none');
                featureFrame.classList.remove('active');
                featureFrame.removeAttribute('src');

                if (!chartsInitialised) {
                    initDashboardCharts();
                    chartsInitialised = true;
                }
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

            /**
             * Initialize charts on the dashboard.
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
                                    label: 'On-time delivery %',
                                    data: [92, 94, 90, 96, 95, 93, 97],
                                    borderColor: '#3b82f6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    tension: 0.35,
                                    fill: true,
                                    pointBackgroundColor: '#fff',
                                    pointBorderWidth: 2,
                                    pointRadius: 4
                                },
                                {
                                    label: 'Temperature compliance %',
                                    data: [88, 91, 89, 95, 92, 90, 94],
                                    borderColor: '#10b981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    tension: 0.35,
                                    fill: true,
                                    pointBackgroundColor: '#fff',
                                    pointBorderWidth: 2,
                                    pointRadius: 4
                                }
                            ],
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: { 
                                    beginAtZero: true, 
                                    max: 100,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)'
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    }
                                }
                            },
                            plugins: {
                                legend: { 
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 20
                                    }
                                },
                            },
                            interaction: {
                                intersect: false,
                                mode: 'index'
                            }
                        },
                    });
                }

                if (invCanvas && invCanvas.getContext) {
                    const ctx = invCanvas.getContext('2d');
                    inventoryChartInstance = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['In Stock', 'Reserved', 'Out of Stock', 'Damaged'],
                            datasets: [
                                {
                                    label: 'Inventory',
                                    data: [65, 25, 7, 3],
                                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                                    borderWidth: 0,
                                },
                            ],
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { 
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        font: {
                                            size: 12
                                        }
                                    }
                                },
                            },
                            cutout: '70%',
                        },
                    });
                }
            }

            // By default, show the dashboard on initial load
            showDashboard();
        });