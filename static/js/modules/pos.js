// static/js/modules/pos.js

let cart = [];
let cachedSales = [];
let cachedRepairs = [];

export default {
    init: async (container) => {
        container.innerHTML = `
            <div style="display:flex; gap:1rem; height:100%;">
                <!-- Left: Billing Section (60%) -->
                <div class="card" style="flex:3; display:flex; flex-direction:column;">
                    <header style="margin-bottom:1rem;">
                        <h3>Point of Sale</h3>
                        <div style="display:flex; gap:0.5rem;">
                            <input type="text" id="pos-search" placeholder="Scan Barcode or Search Product..." style="flex:1; padding:0.75rem; font-size:1rem;">
                        </div>
                        <div id="search-results" style="position:absolute; background:var(--bg-glass-strong, #1e293b); border:1px solid var(--border-glass, #334155); width:50%; display:none; z-index:100; border-radius:8px; max-height:300px; overflow-y:auto; color:var(--text-primary, #f8fafc);"></div>
                    </header>
                    
                    <div style="flex:1; overflow-y:auto; border:1px solid var(--border-glass); border-radius:4px; margin-bottom:1rem;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead style="position:sticky; top:0; background:var(--bg-glass-strong, #0a1410);">
                                <tr style="text-align:left;">
                                    <th style="padding:0.75rem;">Item</th>
                                    <th style="padding:0.75rem; white-space:nowrap;">Price</th>
                                    <th style="padding:0.75rem; white-space:nowrap;">Qty</th>
                                    <th style="padding:0.75rem; white-space:nowrap;">Total</th>
                                    <th style="padding:0.75rem; width:50px;"></th>
                                </tr>
                            </thead>
                            <tbody id="cart-table-body">
                                <tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-secondary, #a9d6e5);">Cart is empty</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-glass, #101c18); padding:1rem; border-radius:4px;">
                        <div>
                            <span style="color:var(--text-secondary, #a9d6e5);">Total Items: <b id="cart-count">0</b></span>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:1.5rem; font-weight:bold; color:white;">₹<span id="cart-total">0.00</span></div>
                        </div>
                    </div>
                </div>

                <!-- Right: Checkout Section (40%) -->
                <div class="card" style="flex:2; display:flex; flex-direction:column;">
                    <div style="margin-bottom:1rem; text-align:right;">
                        <label>Discount (₹)</label>
                        <input type="number" id="pos-discount" value="0" min="0" style="width:auto; min-width:80px; max-width:120px; padding:0.5rem; text-align:right;">
                    </div>
                    <!-- Customer Details -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                <div style="position:relative;">
                    <input type="text" id="pos-phone" class="mousetrap" placeholder="Customer Phone (Alt+C)" style="width:100%; padding:0.75rem; border:1px solid var(--border-glass); border-radius:6px;">
                    <div id="pos-cust-results" style="position:absolute; top:100%; left:0; right:0; background:var(--bg-card, #101c18); border:1px solid var(--border-glass, #2a4a3a); display:none; z-index:10; border-radius:6px;"></div>
                </div>
                <input type="text" id="pos-name" placeholder="Customer Name" style="width:100%; padding:0.75rem; border:1px solid var(--border-glass); border-radius:6px;">
            </div>

            <!-- Products Table -->     
                <div style="margin-bottom:1rem;">
                    <label>Payment Mode</label>
                    <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                        <button class="btn btn-mode active" data-mode="CASH" style="flex:1; background:#3b82f6;">Cash</button>
                        <button class="btn btn-mode" data-mode="UPI" style="flex:1; background:var(--bg-glass, #003554); color:var(--text-primary, #e0f4fc);">UPI</button>
                        <button class="btn btn-mode" data-mode="CARD" style="flex:1; background:var(--bg-glass, #003554); color:var(--text-primary, #e0f4fc);">Card</button>
                    </div>
                </div>

                <div style="flex:1; display:flex; flex-direction:column; border:1px solid var(--border-glass); border-radius:6px; margin-bottom:1rem; overflow:hidden;">
                     <div style="display:flex; border-bottom:1px solid var(--border-glass, #2a4a3a); background:var(--bg-glass-strong, #0a1410);">
                         <div id="tab-sales" class="pos-tab active" style="flex:1; padding:0.55rem; text-align:center; cursor:pointer; font-weight:bold; font-size:0.9rem; border-right:1px solid var(--border-glass, #2a4a3a); background:var(--bg-card, #101c18); color:var(--primary, #81b29a);">Recent Sales</div>
                         <div id="tab-repairs" class="pos-tab" style="flex:1; padding:0.55rem; text-align:center; cursor:pointer; font-weight:bold; font-size:0.9rem; color:var(--text-secondary, #a9d6e5);">Pending Repairs</div>
                     </div>
                     
                     <div style="padding:0.5rem; border-bottom:1px solid var(--border-glass, #2a4a3a); background:var(--bg-glass-strong, #0a1410);">
                         <input type="text" id="pos-history-search" placeholder="🔍 Search by invoice/job ID, name, phone..." style="width:100%; padding:0.5rem; border:1px solid var(--border-glass); border-radius:6px; font-size:0.85rem; background:var(--bg-card); color:var(--text-primary);">
                     </div>
                     
                     <div id="pos-tab-content" style="flex:1; overflow-y:auto; background:var(--bg-card, #101c18);">
                        <div id="recent-sales-list"></div>
                        <div id="pending-repairs-list" style="display:none;"></div>
                     </div>
                </div>

                    <button id="btn-checkout" class="btn" style="width:100%; padding:1rem; font-size:1.25rem; margin-top:2rem;">
                        Complete Sale
                    </button>
                </div>
            </div>
        `;

        setupPOSEventListeners();

        // Check for Pending Bill (from Repair Queue)
        const pendingJobId = localStorage.getItem('pos_job_id');
        if (pendingJobId) {
            localStorage.removeItem('pos_job_id');
            await loadJobToBill(pendingJobId);
        }

        // Auto-open Repair Tab?
        if (localStorage.getItem('open_repair_tab')) {
            localStorage.removeItem('open_repair_tab');
            document.getElementById('tab-repairs').click();
        }
    }
};

async function loadJobToBill(id) {
    try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) return;
        const job = await res.json();

        // Auto-fill Customer
        document.getElementById('pos-name').value = job.customer_name;
        document.getElementById('pos-phone').value = job.customer_phone;

        // Find 'Repair Service' product ID
        let serviceId = 999999;
        try {
            const sRes = await fetch('/api/inventory?search=SERVICE');
            const sProds = await sRes.json();
            const serviceProd = sProds.find(p => p.sku === 'SERVICE');
            if (serviceProd) serviceId = serviceProd.id;
        } catch (e) { console.error("Could not find service product ID"); }

        // Add Service Item
        const serviceItem = {
            id: serviceId,
            name: `Repair Service (${job.device_model}) (Job: ${job.job_no})`,
            product_name: `Repair Service (${job.device_model}) (Job: ${job.job_no})`, // Send custom name to backend
            sku: job.job_no,
            price: job.estimated_cost,
            stock_qty: 99999,
            qty: 1
        };

        cart.push(serviceItem);
        renderCart();

        // Apply Advance as Discount
        if (job.advance_amount > 0) {
            alert(`Customer paid Advance of ₹${job.advance_amount}. Applied as discount.`);
            document.getElementById('pos-discount').value = job.advance_amount;
            renderCart(); // Re-render to calc totals
        }

    } catch (e) { console.error("Error loading job", e); }
}

async function searchProduct(query) {
    if (!query) return [];
    try {
        const res = await fetch(`/api/inventory?search=${encodeURIComponent(query)}`);
        return await res.json();
    } catch (e) { console.error(e); return []; }
}

function addToCart(product) {
    if (product.product_type !== 'SERVICE' && product.stock_qty <= 0) {
        alert('Item is Out of Stock!');
        return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        if (product.product_type !== 'SERVICE' && existing.qty >= product.stock_qty) {
            alert('Insufficient Stock!');
        } else {
            existing.qty++;
        }
    } else {
        cart.push({ ...product, qty: 1, type: product.product_type });
    }
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cart-table-body');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-secondary, #a9d6e5);">Cart is empty</td></tr>';
        totalEl.textContent = '0.00';
        countEl.textContent = '0';
        return;
    }

    tbody.innerHTML = cart.map((item, index) => {
        const isRepair = item.sku && item.sku.startsWith('JOB-');
        return `
        <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:0.75rem;">${item.name} <br><small style="color:var(--text-secondary, #a9d6e5);">${item.sku || ''}</small></td>
            <td style="padding:0.75rem;">₹${item.price}</td>
            <td style="padding:0.75rem;">
                ${isRepair ?
                '<span style="padding:0.25rem;">1</span>' :
                `<input type="number" min="1" max="${item.stock_qty}" value="${item.qty}" 
                    data-index="${index}" class="cart-qty" style="width:50px; padding:0.25rem;">`
            }
            </td>
            <td style="padding:0.75rem;">₹${(item.price * item.qty).toFixed(2)}</td>
            <td style="padding:0.75rem;">
                <button data-index="${index}" class="remove-item" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
            </td>
        </tr>
    `}).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = parseFloat(document.getElementById('pos-discount')?.value || 0); // Safe access
    const total = Math.max(0, subtotal - discount);

    totalEl.textContent = total.toFixed(2);
    countEl.textContent = cart.length;

    // Re-attach listeners
    document.querySelectorAll('.cart-qty').forEach(inp => {
        inp.onchange = (e) => {
            const idx = e.target.dataset.index;
            let newQty = parseInt(e.target.value);
            if (newQty <= 0) newQty = 1; // Prevent 0 or negative

            if (newQty <= cart[idx].stock_qty) {
                cart[idx].qty = newQty;
                renderCart();
            } else {
                alert('Insufficient Stock!');
                e.target.value = cart[idx].qty; // Revert
            }
        };
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.onclick = (e) => {
            const idx = e.target.dataset.index;
            cart.splice(idx, 1);
            renderCart();
        };
    });
}

function setupPOSEventListeners() {
    // Search
    const searchInput = document.getElementById('pos-search');
    const resultsBox = document.getElementById('search-results');

    let debounce;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        const query = e.target.value;
        if (query.length < 2) {
            resultsBox.style.display = 'none';
            return;
        }

        debounce = setTimeout(async () => {
            const products = await searchProduct(query);
            if (products.length > 0) {
                resultsBox.innerHTML = products.map(p => {
                    const isOOS = p.stock_qty <= 0;
                    return `
                    <div class="search-item" data-id="${p.id}" style="padding:0.75rem 1rem; cursor:pointer; border-bottom:1px solid var(--border-glass, #334155); background:${(p.product_type !== 'SERVICE' && isOOS) ? 'rgba(239,68,68,0.1)' : 'transparent'}; opacity:${(p.product_type !== 'SERVICE' && isOOS) ? 0.7 : 1}; transition: background 0.2s;">
                        <strong style="color:var(--text-primary, #f8fafc);">${p.name}</strong> - ₹${p.price} 
                        <span style="font-size:0.8em; color:${(p.product_type !== 'SERVICE' && isOOS) ? 'var(--danger, #ef4444)' : 'var(--text-secondary, #94a3b8)'};">
                            (${p.product_type === 'SERVICE' ? 'Stock: ∞' : (isOOS ? 'Out of Stock' : 'Stock: ' + p.stock_qty)})
                        </span>
                    </div>
                `}).join('');
                resultsBox.style.display = 'block';

                // Click to Add
                document.querySelectorAll('.search-item').forEach(div => {
                    div.onclick = () => {
                        const product = products.find(prod => prod.id == div.dataset.id);
                        addToCart(product);
                        searchInput.value = '';
                        resultsBox.style.display = 'none';
                        searchInput.focus();
                    };
                });
            } else {
                resultsBox.style.display = 'none';
            }
        }, 300);
    });

    // Payment Mode Selection
    let selectedMode = 'CASH';
    document.querySelectorAll('.btn-mode').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.btn-mode').forEach(b => {
                b.style.background = 'var(--bg-glass)';
                b.style.color = 'var(--text-primary)';
            });
            btn.style.background = '#3b82f6';
            btn.style.color = 'white';
            selectedMode = btn.dataset.mode;
        };
    });

    // Customer Search (Phone)
    const phoneInp = document.getElementById('pos-phone');
    phoneInp.addEventListener('input', async (e) => {
        const val = e.target.value;
        if (val.length > 2) {
            try {
                const res = await fetch(`/api/customers?search=${val}`);
                const customers = await res.json();
                if (customers.length > 0) {
                    // Auto-fill if exact match or just suggest?
                    // Simple: if exact phone match, fill name
                    const exact = customers.find(c => c.phone === val);
                    if (exact) {
                        document.getElementById('pos-name').value = exact.name;
                    }
                }
            } catch (e) { }
        }
    });

    // Discount Change
    const discInput = document.getElementById('pos-discount');
    if (discInput) {
        discInput.oninput = () => {
            renderCart();
        };
    }

    // Tabs
    const tabSales = document.getElementById('tab-sales');
    const tabRepairs = document.getElementById('tab-repairs');
    const listSales = document.getElementById('recent-sales-list');
    const listRepairs = document.getElementById('pending-repairs-list');

    tabSales.onclick = () => {
        tabSales.style.background = 'var(--bg-card)'; tabSales.style.color = 'var(--primary)';
        tabRepairs.style.background = 'var(--bg-glass)'; tabRepairs.style.color = 'var(--text-secondary)';
        listSales.style.display = 'block';
        listRepairs.style.display = 'none';
        // Clear search and re-render
        const searchInput = document.getElementById('pos-history-search');
        if (searchInput) searchInput.value = '';
        renderSales(cachedSales);
    };

    tabRepairs.onclick = () => {
        tabRepairs.style.background = 'var(--bg-card)'; tabRepairs.style.color = 'var(--primary)';
        tabSales.style.background = 'var(--bg-glass)'; tabSales.style.color = 'var(--text-secondary)';
        listSales.style.display = 'none';
        listRepairs.style.display = 'block';
        loadPendingRepairs();
        // Clear search
        const searchInput = document.getElementById('pos-history-search');
        if (searchInput) searchInput.value = '';
    };

    // History Search (for both Sales and Repairs)
    const historySearchInput = document.getElementById('pos-history-search');
    if (historySearchInput) {
        let historyDebounce;
        historySearchInput.addEventListener('input', (e) => {
            clearTimeout(historyDebounce);
            const query = e.target.value;
            historyDebounce = setTimeout(() => {
                if (query.length === 0) {
                    // Show all
                    const isOnSalesTab = tabSales.classList.contains('active') || listSales.style.display !== 'none';
                    if (isOnSalesTab) {
                        renderSales(cachedSales);
                    } else {
                        renderRepairs(cachedRepairs);
                    }
                } else {
                    filterPOSHistory(query);
                }
            }, 200);
        });
    }

    // Checkout & Print
    document.getElementById('btn-checkout').onclick = async () => {
        if (cart.length === 0) return alert('Cart is empty!');

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discount = parseFloat(document.getElementById('pos-discount').value) || 0;

        if (discount > subtotal) {
            return alert('Discount cannot be greater than Total!');
        }

        const saleData = {
            customer_name: document.getElementById('pos-name').value,
            customer_phone: document.getElementById('pos-phone').value,
            payment_mode: selectedMode,
            discount: discount,
            items: cart.map(item => ({
                product_id: item.id,
                product_name: item.product_name, // Pass custom name
                job_no: (item.sku && item.sku.startsWith('JOB-')) ? item.sku : null, // Pass Job No if repair
                qty: item.qty,
                price: item.price
            }))
        };

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });
            const result = await res.json();

            if (result.status === 'success') {
                alert(`Sale Complete! Invoice: ${result.invoice_no}`);
                cart = [];
                document.getElementById('pos-discount').value = 0; // Reset Discount
                renderCart();
                document.getElementById('pos-name').value = '';
                document.getElementById('pos-phone').value = '';
                loadRecentSales(); // Refresh recent
                loadPendingRepairs(); // Refresh Pending Repairs
                // Trigger Print
                window.open(`/print/invoice/${result.invoice_no}`, '_blank');
            } else {
                alert('Error: ' + JSON.stringify(result));
            }
        } catch (err) {
            console.error(err);
            alert('Checkout Failed');
        }
    };

    loadRecentSales();
}

async function loadRecentSales() {
    try {
        const res = await fetch('/api/sales/recent');
        cachedSales = await res.json();
        renderSales(cachedSales);
    } catch (e) { console.error(e); }
}

function renderSales(sales) {
    const container = document.getElementById('recent-sales-list');
    if (!container) return;

    if (sales.length === 0) {
        container.innerHTML = '<p style="padding:1rem; color:#888;">No sales found.</p>';
        return;
    }

    container.innerHTML = sales.map(s => `
        <div class="history-item" style="padding:0.5rem; border-bottom:1px solid var(--border-glass, #2a4a3a); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold; font-size:0.9rem;">${s.invoice_no}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary, #a9d6e5);">${s.customer_name || 'Walk-in'} - ${s.customer_phone || ''}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary, #a9d6e5);">${new Date(s.date).toLocaleString()} - ₹${s.total}</div>
            </div>
            <a href="/print/invoice/${s.invoice_no}" target="_blank" style="text-decoration:none; display:flex; align-items:center; gap:4px;"><img src="/static/icons/print.svg" style="width:16px; height:16px; filter:brightness(0) saturate(100%) invert(45%) sepia(70%) saturate(500%) hue-rotate(190deg);"><span style="color:var(--primary); font-size:0.85rem;">View</span></a>
        </div>
    `).join('');
}

async function loadPendingRepairs() {
    try {
        const res = await fetch('/api/jobs');
        const jobs = await res.json();
        cachedRepairs = jobs.filter(j => j.status === 'READY');
        renderRepairs(cachedRepairs);
    } catch (e) { console.error(e); }
}

function renderRepairs(repairs) {
    const container = document.getElementById('pending-repairs-list');
    if (!container) return;

    if (repairs.length === 0) {
        container.innerHTML = '<p style="padding:1rem; color:#888;">No pending repairs found.</p>';
        return;
    }

    container.innerHTML = repairs.map(job => `
        <div class="history-item" style="padding:0.5rem; border-bottom:1px solid var(--border-glass, #2a4a3a); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold; font-size:0.9rem;">${job.job_no}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary, #a9d6e5);">${job.device_model} - ${job.customer_name}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary, #a9d6e5);">${job.customer_phone || ''}</div>
                <div style="font-size:0.8rem; font-weight:bold;">₹${job.estimated_cost}</div>
            </div>
            <button class="btn-bill-job" data-id="${job.id}" style="padding:0.25rem 0.5rem; background:#8b5cf6; color:white; border:none; border-radius:4px; cursor:pointer;">
                Bill ➡️
            </button>
        </div>
    `).join('');

    // Attach listeners
    container.querySelectorAll('.btn-bill-job').forEach(btn => {
        btn.onclick = (e) => loadJobToBill(e.target.dataset.id);
    });
}

// Search filter function for POS history
function filterPOSHistory(query) {
    const q = query.toLowerCase().trim();
    const salesTab = document.getElementById('tab-sales');
    const isOnSalesTab = salesTab && salesTab.classList.contains('active');

    if (isOnSalesTab) {
        // Filter sales
        const filtered = cachedSales.filter(s =>
            (s.invoice_no && s.invoice_no.toLowerCase().includes(q)) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
            (s.customer_phone && s.customer_phone.includes(q))
        );
        renderSales(filtered);
    } else {
        // Filter repairs
        const filtered = cachedRepairs.filter(job =>
            (job.job_no && job.job_no.toLowerCase().includes(q)) ||
            (job.customer_name && job.customer_name.toLowerCase().includes(q)) ||
            (job.customer_phone && job.customer_phone.includes(q)) ||
            (job.device_model && job.device_model.toLowerCase().includes(q))
        );
        renderRepairs(filtered);
    }
}
