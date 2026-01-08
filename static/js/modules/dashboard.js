// static/js/modules/dashboard.js

export default {
    init: async (container) => {
        container.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; margin-bottom:2rem;">
                <div class="stat-card card-blue" onclick="document.querySelector('[data-route=pos]').click()" style="cursor:pointer;">
                    <div class="stat-header">
                        <div class="stat-label">Sales Revenue</div>
                        <div class="stat-icon"><img src="/static/icons/icon-chart.png" alt="Sales"></div>
                    </div>
                    <div style="display:flex; align-items:flex-end; justify-content:space-between;">
                        <div class="stat-value" id="dash-sales">₹0</div>
                        <select id="sales-period-select" style="font-size:0.75rem; padding:2px 6px; border:none; border-radius:4px; background:rgba(255,255,255,0.25); color:white; cursor:pointer;">
                            <option value="today">Today</option>
                            <option value="7d">7 Days</option>
                            <option value="30d">30 Days</option>
                            <option value="90d">90 Days</option>
                            <option value="6m">6 Mo</option>
                            <option value="9m">9 Mo</option>
                            <option value="12m">1 Year</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>

                <div class="stat-card card-yellow" onclick="document.querySelector('[data-route=repairs]').click()" style="cursor:pointer;">
                    <div class="stat-header">
                        <div class="stat-label">Open Jobs</div>
                        <div class="stat-icon"><img src="/static/icons/icon-gear.png" alt="Jobs"></div>
                    </div>
                    <div class="stat-value" id="dash-jobs">0</div>
                </div>

                <div class="stat-card card-red" onclick="document.querySelector('[data-route=inventory]').click()" style="cursor:pointer;">
                    <div class="stat-header">
                        <div class="stat-label">Low Stock</div>
                        <div class="stat-icon"><img src="/static/icons/icon-info.png" alt="Stock"></div>
                    </div>
                    <div class="stat-value" id="dash-low-stock-count">0</div>
                </div>

                <div class="stat-card card-green" onclick="document.querySelector('[data-route=purchases]').click()" style="cursor:pointer;">
                    <div class="stat-header">
                        <div class="stat-label">Purchases</div>
                        <div class="stat-icon"><img src="/static/icons/icon-calendar.png" alt="Purchases"></div>
                    </div>
                    <div class="stat-value" id="dash-purchases">₹0</div>
                </div>

                <div class="stat-card card-purple" onclick="localStorage.setItem('open_repair_tab', 'true'); document.querySelector('[data-route=pos]').click()" style="cursor:pointer;">
                    <div class="stat-header">
                        <div class="stat-label">Ready for Bill</div>
                        <div class="stat-icon"><img src="/static/icons/icon-star.png" alt="Ready"></div>
                    </div>
                    <div class="stat-value" id="dash-ready">0</div>
                </div>
            </div>

            <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                <div class="card" style="flex:1; min-width:300px;">
                    <h3>Recent Jobs</h3>
                    <div id="dash-recent-jobs">Loading...</div>
                </div>

                <div class="card summary-card" id="card-low-stock" style="flex:1; min-width:300px; border-left: 5px solid var(--danger, #e07a5f); background: var(--bg-card, #101c18);">
                    <h3>Low Stock Alerts</h3>
                    <div class="value" style="color: var(--danger, #e07a5f);" id="dash-low-stock-items-count">0</div>
                    <div id="dash-low-stock-items" style="font-size:0.85rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.25rem;">
                        Loading...
                    </div>
                </div>

                <div class="card" style="flex:1; min-width:300px;">
                    <h3>Recent Purchases</h3>
                    <div id="dash-recent-purchases">Loading...</div>
                </div>
            </div>
        `;

        loadDashboardStats();
    }
};

async function loadDashboardStats() {
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();

        loadSalesStats('today');

        const salesSelect = document.getElementById('sales-period-select');
        if (salesSelect) {
            salesSelect.onchange = (e) => {
                loadSalesStats(e.target.value);
            };
            salesSelect.onclick = (e) => e.stopPropagation();
        }

        animateCount('dash-jobs', data.open_jobs);
        animateCount('dash-low-stock-count', data.low_stock_count);
        animateCount('dash-purchases', data.purchases_today, '₹');
        if (document.getElementById('dash-ready')) {
            animateCount('dash-ready', data.ready_jobs_count || 0);
        }

        const stockItemsContainer = document.getElementById('dash-low-stock-items');
        if (data.low_stock_items && data.low_stock_items.length > 0) {
            stockItemsContainer.innerHTML = data.low_stock_items.map(i => `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${i.name}</span>
                    <strong style="color:#ef4444; font-size:0.9em;">${i.stock_qty} left</strong>
                </div>
            `).join('');
        } else {
            stockItemsContainer.innerHTML = '<span style="color:#10b981; font-size:0.9em;">All items well stocked!</span>';
        }

        const jobsContainer = document.getElementById('dash-recent-jobs');
        if (data.recent_jobs.length > 0) {
            jobsContainer.innerHTML = data.recent_jobs.map(job => `
                <div style="padding:0.5rem 0; border-bottom:1px solid #eee; font-size:0.9rem;">
                    <strong>${job.job_no}</strong> - ${job.device_model}
                    <span style="float:right; font-size:0.8em; background:var(--border-glass, #2a4a3a); color:var(--primary, #81b29a); padding:2px 6px; border-radius:4px;">${job.status}</span>
                </div>
            `).join('');
        } else {
            jobsContainer.innerHTML = '<p style="color:var(--text-secondary, #a9d6e5);">No recent jobs.</p>';
        }

        const purContainer = document.getElementById('dash-recent-purchases');
        if (data.recent_purchases && data.recent_purchases.length > 0) {
            purContainer.innerHTML = data.recent_purchases.map(p => `
                <div style="padding:0.5rem 0; border-bottom:1px solid #eee; font-size:0.9rem;">
                    <strong>${p.supplier_name || 'Unknown'}</strong><br>
                    <span style="color:var(--text-secondary, #a9d6e5);">Inv: ${p.invoice_no}</span>
                    <span style="float:right; font-weight:bold;">₹${p.total_amount}</span>
                </div>
            `).join('');
        } else {
            purContainer.innerHTML = '<p style="color:var(--text-secondary, #a9d6e5);">No recent purchases.</p>';
        }

    } catch (e) {
        console.error(e);
    }
}

async function loadSalesStats(period) {
    try {
        const res = await fetch(`/api/analytics/sales?period=${period}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        animateCount('dash-sales', data.total, '₹');
    } catch (e) {
        console.error("Error loading sales stats", e);
        const el = document.getElementById('dash-sales');
        if (el) el.textContent = "Error";
    }
}

function animateCount(id, endValue, prefix = '') {
    const el = document.getElementById(id);
    if (!el) return;

    let end = parseFloat(endValue) || 0;
    let start = 0;
    const duration = 1000;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        const current = Math.floor(ease * (end - start) + start);
        el.textContent = `${prefix}${current.toLocaleString()}`;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            el.textContent = `${prefix}${end.toLocaleString()}`;
        }
    }
    window.requestAnimationFrame(step);
}
