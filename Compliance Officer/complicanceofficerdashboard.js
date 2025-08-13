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
    let riskChartInstance = null;

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
        const title = link.dataset.title || 'ComplianceHub';

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
     * Display the dashboard and hide the feature iframe. Initialize charts
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
        const riskCanvas = document.getElementById('inventoryChart');

        if (perfCanvas && perfCanvas.getContext) {
            const ctx = perfCanvas.getContext('2d');
            performanceChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        {
                            label: 'Compliance Score (%)',
                            data: [88, 91, 89, 93, 95, 92, 94, 96, 94, 97, 95, 94],
                            borderColor: '#0f766e',
                            backgroundColor: 'rgba(15, 118, 110, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#fff',
                            pointBorderWidth: 3,
                            pointRadius: 5,
                            pointBorderColor: '#0f766e'
                        },
                        {
                            label: 'Training Completion (%)',
                            data: [78, 82, 85, 88, 91, 89, 93, 95, 92, 94, 96, 98],
                            borderColor: '#0891b2',
                            backgroundColor: 'rgba(8, 145, 178, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#fff',
                            pointBorderWidth: 3,
                            pointRadius: 5,
                            pointBorderColor: '#0891b2'
                        },
                        {
                            label: 'Audit Success Rate (%)',
                            data: [92, 89, 91, 94, 90, 93, 95, 91, 96, 94, 92, 95],
                            borderColor: '#059669',
                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#fff',
                            pointBorderWidth: 3,
                            pointRadius: 5,
                            pointBorderColor: '#059669'
                        }
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 70,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                color: '#64748b',
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#64748b'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    family: 'Inter',
                                    weight: '500'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            titleColor: '#f8fafc',
                            bodyColor: '#f8fafc',
                            borderColor: '#0f766e',
                            borderWidth: 1,
                            cornerRadius: 8,
                            titleFont: {
                                family: 'Inter',
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Inter',
                                weight: '500'
                            },
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + '%';
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                },
            });
        }

        if (riskCanvas && riskCanvas.getContext) {
            const ctx = riskCanvas.getContext('2d');
            riskChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk', 'Mitigated'],
                    datasets: [
                        {
                            label: 'Risk Assessment',
                            data: [45, 28, 15, 7, 5],
                            backgroundColor: [
                                '#059669',
                                '#0891b2', 
                                '#d97706',
                                '#dc2626',
                                '#64748b'
                            ],
                            borderWidth: 0,
                            hoverOffset: 6
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
                                    size: 12,
                                    family: 'Inter',
                                    weight: '500'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            titleColor: '#f8fafc',
                            bodyColor: '#f8fafc',
                            borderColor: '#0f766e',
                            borderWidth: 1,
                            cornerRadius: 8,
                            titleFont: {
                                family: 'Inter',
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Inter',
                                weight: '500'
                            },
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    cutout: '65%',
                },
            });
        }
    }

    // Initialize dashboard on page load
    showDashboard();

    // Add some interactivity for demo purposes
    document.addEventListener('click', (e) => {
        // Handle notification bell clicks
        if (e.target.closest('.notification-bell')) {
            e.preventDefault();
            console.log('Notification clicked - would show notification panel');
        }

        // Handle export button clicks
        if (e.target.closest('.btn-compliance')) {
            e.preventDefault();
            console.log('Export clicked - would generate compliance report');
        }
    });

    // Add window resize handler for responsive behavior
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            sidebar.classList.remove('collapsed');
        }
    });
});
