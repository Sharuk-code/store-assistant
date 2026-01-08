// static/js/modules/purchases.js

let purchaseItems = [];

export default {
    init: async (container) => {
        container.innerHTML = `
            <div style="height:100%; display:flex; flex-direction:column; gap:1.5rem;">
                
                <!-- Top Section: New Purchase & Suppliers -->
                <div style="display:flex; gap:1.5rem; height:60%;">
                    
                    <!-- Left: Purchase Entry -->
                    <div class="card" style="flex:2; display:flex; flex-direction:column;">
                        <h3 style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">New Purchase (Inward Stock)</h3>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:1rem; align-items:end;">
                            <div>
                                <label style="font-size:0.85rem; color:var(--text-secondary, #a9d6e5); margin-bottom:0.25rem; display:block;">Supplier</label>
                                <select id="supplier-select" style="width:100%; height:40px; padding:0 0.6rem; border:1px solid var(--border-glass, #2a4a3a); border-radius:6px; background:var(--bg-card, #101c18); color:var(--text-primary, #c8e0d8);">
                                    <option value="">Select Supplier...</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.85rem; color:var(--text-secondary, #a9d6e5); margin-bottom:0.25rem; display:block;">Invoice No.</label>
                                <input type="text" id="supp-invoice" placeholder="e.g. INV-001" style="width:100%; height:40px; padding:0 0.6rem; border:1px solid var(--border-glass); border-radius:6px;">
                            </div>
                            <div style="position:relative;">
                                <label style="font-size:0.85rem; color:var(--text-secondary, #a9d6e5); margin-bottom:0.25rem; display:block;">Find Product</label>
                                <div style="position:relative; width:100%;">
                                    <span style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none;">🔍</span>
                                    <input type="text" id="pur-search" placeholder="Search product..." style="width:100%; height:40px; padding:0 0.6rem 0 2.2rem; border:1px solid var(--border-glass); border-radius:6px;">
                                </div>
                                <div id="pur-search-results" style="position:absolute; top:100%; left:0; right:0; background:var(--bg-card, #101c18); border:1px solid var(--border-glass, #2a4a3a); border-radius:6px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); display:none; z-index:50; max-height:200px; overflow-y:auto; margin-top:4px;"></div>
                            </div>
                        </div>
                        
                        <div style="flex:1; overflow-y:auto; border:1px solid var(--border-glass); border-radius:6px; margin-bottom:1rem;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
                                <thead style="background:var(--bg-glass-strong, #0a1410); position:sticky; top:0;">
                                    <tr style="text-align:left;">
                                        <th style="padding:0.75rem;">Item</th>
                                        <th style="padding:0.75rem; white-space:nowrap;">Cost (₹)</th>
                                        <th style="padding:0.75rem; white-space:nowrap;">Qty</th>
                                        <th style="padding:0.75rem; white-space:nowrap; text-align:right;">Total</th>
                                        <th style="width:40px;"></th>
                                    </tr>
                                </thead>
                                <tbody id="pur-table-body"></tbody>
                            </table>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.5rem;">
                            <div style="font-size:1.2rem; font-weight:bold; color:var(--text-primary, white);">Total: ₹<span id="pur-total">0.00</span></div>
                            <button class="btn" id="btn-save-purchase" style="padding:0.6rem 1.5rem;">Save & Apply Stock</button>
                        </div>
                    </div>

                    <!-- Right: Suppliers List -->
                    <div class="card" style="flex:1; display:flex; flex-direction:column;">
                        <header style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                            <h3>Suppliers</h3>
                            <button class="btn" id="btn-add-supplier" style="font-size:0.8rem; padding:0.25rem 0.75rem;">+ New</button>
                        </header>
                        <div id="suppliers-list" style="overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:0.5rem;">Loading...</div>
                    </div>
                </div>

                <!-- Bottom Section: Purchase History -->
                <div class="card" style="flex:1; display:flex; flex-direction:column; min-height:0;">
                    <h3 style="margin-bottom:0.5rem;">Purchase History</h3>
                    <div style="flex:1; overflow-y:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead style="background:var(--bg-glass-strong, #0a1410); border-bottom:2px solid var(--border-glass, #2a4a3a);">
                                <tr style="text-align:left;">
                                    <th style="padding:0.5rem;">Date</th>
                                    <th style="padding:0.5rem;">Invoice No</th>
                                    <th style="padding:0.5rem;">Supplier</th>
                                    <th style="padding:0.5rem; text-align:right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody id="purchase-history-body">
                                <tr><td colspan="4" style="padding:1rem; text-align:center; color:var(--text-secondary, #a9d6e5);">Loading history...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <!-- Add Supplier Modal -->
            <div id="modal-supplier" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); align-items:center; justify-content:center; z-index:100;">
                <div class="card" style="width:300px; padding:1.5rem;">
                    <h3 style="margin-bottom:1rem;">Add Supplier</h3>
                    <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1rem;">
                        <input id="new-supp-name" placeholder="Supplier Name" style="padding:0.6rem; border:1px solid var(--border-glass); border-radius:4px;">
                        <input id="new-supp-phone" placeholder="Phone Number" style="padding:0.6rem; border:1px solid var(--border-glass); border-radius:4px;">
                    </div>
                    <div style="text-align:right; display:flex; justify-content:flex-end; gap:0.5rem;">
                        <button class="btn" style="background:var(--bg-glass, #003554); color:var(--text-primary, #e0f4fc);" onclick="document.getElementById('modal-supplier').style.display='none'">Cancel</button>
                        <button class="btn" id="btn-save-supplier">Save</button>
                    </div>
                </div>
            </div>
        `;

        await loadSuppliers();
        await loadPurchaseHistory();
        setupEventListeners();
    }
};

async function loadPurchaseHistory() {
    try {
        const res = await fetch('/api/purchases');
        const purchases = await res.json();
        const tbody = document.getElementById('purchase-history-body');

        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding:1rem; text-align:center; color:var(--text-secondary, #a9d6e5);">No purchases recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = purchases.map(p => `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:0.5rem;">${new Date(p.date).toLocaleDateString()}</td>
                <td style="padding:0.5rem; font-family:monospace;">${p.invoice_no}</td>
                <td style="padding:0.5rem;">${p.supplier_name || '-'}</td>
                <td style="padding:0.5rem; text-align:right; font-weight:600;">₹${p.total_amount.toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Failed to load history", e);
    }
}

async function loadSuppliers() {
    const listEl = document.getElementById('suppliers-list');
    const selectEl = document.getElementById('supplier-select');
    try {
        const res = await fetch('/api/suppliers');
        const suppliers = await res.json();

        // Populate List
        listEl.innerHTML = suppliers.map(s => `
            <div style="padding:0.5rem; border-bottom:1px solid #eee;">
                <strong>${s.name}</strong><br>
                <small>${s.phone || '-'}</small>
            </div>
        `).join('');

        // Populate Select
        selectEl.innerHTML = '<option value="">Select Supplier...</option>' +
            suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    } catch (e) { console.error(e); }
}

async function searchProduct(query) {
    if (!query) return [];
    const res = await fetch(`/api/inventory?search=${encodeURIComponent(query)}`);
    return await res.json();
}

function addToPurchase(product) {
    const qty = 1;
    const cost = product.cost || 0;

    if (qty < 0 || cost < 0) return alert("Negative values not allowed");

    // Add with default cost = current cost or 0
    purchaseItems.push({
        product_id: product.id,
        name: product.name,
        qty: qty,
        cost_price: cost
    });
    renderPurchaseTable();
}

function renderPurchaseTable() {
    const tbody = document.getElementById('pur-table-body');
    tbody.innerHTML = purchaseItems.map((item, idx) => `
        <tr>
            <td style="padding:0.5rem;">${item.name}</td>
            <td style="padding:0.5rem;"><input type="number" step="0.1" value="${item.cost_price}" data-idx="${idx}" class="item-cost" style="width:60px;"></td>
            <td style="padding:0.5rem;"><input type="number" value="${item.qty}" data-idx="${idx}" class="item-qty" style="width:60px;"></td>
            <td style="padding:0.5rem;">₹${(item.cost_price * item.qty).toFixed(2)}</td>
            <td><button style="color:red; border:none; background:none;" onclick="removePurItem(${idx})">&times;</button></td>
        </tr>
    `).join('');

    // Listeners
    document.querySelectorAll('.item-cost').forEach(inp => inp.onchange = (e) => {
        let val = parseFloat(e.target.value);
        if (val < 0) { alert("Cost cannot be negative"); val = 0; e.target.value = 0; }
        purchaseItems[e.target.dataset.idx].cost_price = val;
        renderPurchaseTable();
    });
    document.querySelectorAll('.item-qty').forEach(inp => inp.onchange = (e) => {
        let val = parseInt(e.target.value);
        if (val < 1) { alert("Qty must be at least 1"); val = 1; e.target.value = 1; }
        purchaseItems[e.target.dataset.idx].qty = val;
        renderPurchaseTable();
    });

    // Total
    const total = purchaseItems.reduce((acc, i) => acc + (i.cost_price * i.qty), 0);
    document.getElementById('pur-total').textContent = total.toFixed(2);
}

// Make remove function global hack for onclick
window.removePurItem = (idx) => {
    purchaseItems.splice(idx, 1);
    renderPurchaseTable();
}

function setupEventListeners() {
    // Add Supplier Modal
    document.getElementById('btn-add-supplier').onclick = () => {
        document.getElementById('modal-supplier').style.display = 'flex';
    };

    document.getElementById('btn-save-supplier').onclick = async () => {
        const name = document.getElementById('new-supp-name').value;
        const phone = document.getElementById('new-supp-phone').value;
        if (!name) return alert('Name required');

        await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        });
        document.getElementById('modal-supplier').style.display = 'none';
        loadSuppliers();
    };

    // Product Search
    const searchInp = document.getElementById('pur-search');
    const results = document.getElementById('pur-search-results');
    let debounce;

    searchInp.addEventListener('input', (e) => {
        clearTimeout(debounce);
        const q = e.target.value;
        if (q.length < 2) { results.style.display = 'none'; return; }

        debounce = setTimeout(async () => {
            const products = await searchProduct(q);
            if (products.length > 0) {
                results.innerHTML = products.map(p => `
                    <div class="p-result" data-id="${p.id}" style="padding:0.5rem; cursor:pointer; border-bottom:1px solid #eee;">
                        ${p.name}
                    </div>
                `).join('');
                results.style.display = 'block';

                document.querySelectorAll('.p-result').forEach(el => {
                    el.onclick = () => {
                        const prod = products.find(p => p.id == el.dataset.id);
                        addToPurchase(prod);
                        results.style.display = 'none';
                        searchInp.value = '';
                    };
                });
            }
        }, 300);
    });

    // Save Purchase
    document.getElementById('btn-save-purchase').onclick = async () => {
        const supplier_id = document.getElementById('supplier-select').value;
        const invoice_no = document.getElementById('supp-invoice').value;

        if (!supplier_id || purchaseItems.length === 0) return alert('Select Supplier and Add Items');

        const data = {
            supplier_id: parseInt(supplier_id),
            invoice_no: invoice_no || 'NA',
            items: purchaseItems,
            total_amount: purchaseItems.reduce((acc, i) => acc + (i.cost_price * i.qty), 0),
            branch_id: 1
        };

        const res = await fetch('/api/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Purchase Saved & Stock Updated!');
            purchaseItems = [];
            renderPurchaseTable();
            document.getElementById('supp-invoice').value = '';
            loadPurchaseHistory(); // Refresh History
        } else {
            alert('Error saving purchase');
        }
    };
}
