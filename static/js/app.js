// app.js

const router = {
    init: () => {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.dataset.route;
                if (route) router.navigate(route);
            });
        });

        // Load Default Route (Dashboard)
        router.navigate('dashboard');
    },

    navigate: (route) => {
        // Update Active Link
        document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
        document.querySelector(`nav a[data-route="${route}"]`).classList.add('active');

        // Update Title
        const titleMap = {
            'dashboard': 'Dashboard',
            'pos': 'Point of Sale',
            'repairs': 'Repair Jobs',
            'inventory': 'Inventory Management',
            'purchases': 'Purchases & Stock',
            'settings': 'Store Settings'
        };
        document.getElementById('page-title').textContent = titleMap[route] || 'Dashboard';

        // Load Content
        const container = document.getElementById('view-container');
        const v = Date.now(); // Cache Buster

        if (route === 'settings') {
            import(`./modules/settings.js?v=${v}`)
                .then(module => {
                    module.default.init(container);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<div class="card"><h3 style="color:red">Error loading module</h3><pre>${err.message}</pre></div>`;
                });
            return;
        }

        if (route === 'inventory') {
            import(`./modules/inventory.js?v=${v}`)
                .then(module => {
                    module.default.init(container);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<div class="card"><h3 style="color:red">Error loading module</h3><pre>${err.message}</pre></div>`;
                });
            return;
        }

        if (route === 'pos') {
            import(`./modules/pos.js?v=${v}`)
                .then(module => {
                    module.default.init(container);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<div class="card"><h3 style="color:red">Error loading module</h3><pre>${err.message}</pre></div>`;
                });
            return;
        }

        if (route === 'repairs') {
            import(`./modules/repairs.js?v=${v}`)
                .then(module => {
                    module.default.init(container);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<div class="card"><h3 style="color:red">Error loading module</h3><pre>${err.message}</pre></div>`;
                });
            return;
        }

        if (route === 'repair_billing') {
            // Legacy route redirection
            router.navigate('pos');
            return;
        }

        if (route === 'dashboard') {
            import(`./modules/dashboard.js?v=${v}`)
                .then(module => {
                    module.default.init(container);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<div class="card"><h3 style="color:red">Error loading module</h3><pre>${err.message}</pre></div>`;
                });
            return;
        }

        if (route === 'purchases') {
            import(`./modules/purchases.js?v=${v}`)
                .then(module => {
                    module.default.init(container);
                })
                .catch(err => {
                    console.error(err);
                    container.innerHTML = `<div class="card"><h3 style="color:red">Error loading module</h3><pre>${err.message}</pre></div>`;
                });
            return;
        }

        container.innerHTML = `<div class="card"><h3>Loading ${titleMap[route]}...</h3></div>`;

        // Simulate loading (Placeholder for other modules)
        setTimeout(() => {
            container.innerHTML = `<div class="card"><h3>${titleMap[route]} Module</h3><p>Content coming soon...</p></div>`;
        }, 300);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const path = window.location.pathname;

    // If we are already on the login page, just stop here (login.html handles itself)
    // But wait, login.html is a separate page usually served by backend? 
    // Yes, main.py serves login.html at /login.
    // Index.html is served at /.

    // If we are at root '/', we should check auth.
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        try {
            const res = await fetch('/api/me');
            if (res.status === 401) {
                console.log("Not authenticated, redirecting to login...");
                window.location.href = '/login';
                return; // Stop execution, don't init router
            }

            const user = await res.json();
            console.log("Logged in as:", user.username);

            // Update User Profile UI
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) {
                nameDisplay.textContent = user.username;
            }

            // Start App
            router.init();
            console.log("GoodVibe App Initialized");

            // Init AI Assistant
            import('./modules/ai.js').then(m => m.default.init());

        } catch (e) {
            console.error("Auth check failed", e);
            // On network error or other issues, maybe safer to redirect to login?
            // Or just log it. If API is down, app won't work anyway.
        }
    } else {
        // For other pages (like /login), do nothing specific in this main app.js 
    }
});
