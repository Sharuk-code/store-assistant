// static/js/modules/inventory.js

export default {
    init: async (container) => {
        container.innerHTML = `
            <div class="card">
                <header style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <h3>Inventory List</h3>
                    <button class="btn" id="btn-add-product">+ Add Product</button>
                </header>
                <div style="margin-bottom:1rem;">
                    <input type="text" id="search-inventory" placeholder="Search by Name or SKU..." style="padding:0.5rem; width:300px; border:1px solid var(--border-glass); border-radius:4px; background:var(--bg-input); color:var(--text-primary);">
                </div>
                <div id="inventory-table-container">
                    <p>Loading...</p>
                </div>
            </div>

            <!-- Add Product Modal (Simple inline for MVP) -->
            <div id="modal-add-product" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); align-items:center; justify-content:center;">
                <div class="card" style="width:400px; max-width:90%;">
                    <h3>Add New Product</h3>
                    <form id="form-add-product">
                        <div style="margin-bottom:1rem;">
                            <label>SKU</label><br>
                            <input type="text" name="sku" required style="width:100%; padding:0.5rem;">
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label>Name</label><br>
                            <input type="text" name="name" required style="width:100%; padding:0.5rem;">
                        </div>
                        <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label>Price</label><br>
                                <input type="number" name="price" step="0.01" required min="0" style="width:100%; padding:0.5rem;">
                            </div>
                            <div>
                                <label>Stock Qty</label><br>
                                <input type="number" name="stock_qty" required min="0" style="width:100%; padding:0.5rem;">
                            </div>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label>Category</label><br>
                            <input type="text" name="category" style="width:100%; padding:0.5rem;">
                        </div>
                        <div style="text-align:right;">
                            <button type="button" class="btn" style="background:var(--bg-glass); color:var(--text-primary);" id="btn-cancel-add">Cancel</button>
                            <button type="submit" class="btn">Save Product</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await loadInventory();
        setupEventListeners();
    }
};

async function loadInventory(search = '') {
    const container = document.getElementById('inventory-table-container');
    try {
        const url = search ? `/api/inventory?search=${encodeURIComponent(search)}` : '/api/inventory';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');

        const products = await res.json();
        renderTable(products);
    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error loading inventory: ${err.message}</p>`;
    }
}

function renderTable(products) {
    const container = document.getElementById('inventory-table-container');
    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }

    let html = `
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:var(--bg-glass-strong, #0a1410); text-align:left;">
                    <th style="padding:0.75rem;">SKU</th>
                    <th style="padding:0.75rem;">Name</th>
                    <th style="padding:0.75rem;">Category</th>
                    <th style="padding:0.75rem;">Price</th>
                    <th style="padding:0.75rem;">Stock</th>
                    <th style="padding:0.75rem;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    products.forEach(p => {
        html += `
            <tr style="border-bottom:1px solid var(--border-glass);">
                <td style="padding:0.75rem;">${p.sku || '-'}</td>
                <td style="padding:0.75rem;"><strong>${p.name}</strong></td>
                <td style="padding:0.75rem;">${p.category || '-'}</td>
                <td style="padding:0.75rem;">₹${p.price}</td>
                <td style="padding:0.75rem; font-weight:bold; color:${(p.product_type !== 'SERVICE' && p.stock_qty < 5) ? 'red' : 'inherit'};">
                    ${p.product_type === 'SERVICE' ? '∞' : p.stock_qty}
                </td>
                <td style="padding:0.75rem;">
                    <button class="btn-delete" data-id="${p.id}" style="background:none; border:none; cursor:pointer;" title="Delete"><img src="/static/icons/delete.svg" style="width:16px; height:16px; filter:invert(45%) sepia(100%) saturate(1000%) hue-rotate(330deg);"></button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Attach listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async (e) => {
            if (confirm('Are you sure you want to delete this product?')) {
                const id = e.target.dataset.id;
                await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
                loadInventory();
            }
        };
    });
}


function setupEventListeners() {
    // Show Modal
    document.getElementById('btn-add-product').onclick = () => {
        document.getElementById('modal-add-product').style.display = 'flex';
    };

    // Hide Modal
    document.getElementById('btn-cancel-add').onclick = () => {
        document.getElementById('modal-add-product').style.display = 'none';
    };

    // Search
    const searchInput = document.getElementById('search-inventory');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            loadInventory(e.target.value);
        }, 300);
    });

    // Add Product Form
    document.getElementById('form-add-product').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        // Simple type conversion
        data.price = parseFloat(data.price);
        data.stock_qty = parseInt(data.stock_qty);

        if (data.price < 0 || data.stock_qty < 0) {
            return alert('Price and Stock cannot be negative.');
        }

        data.branch_id = 1; // Default

        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.id) {
                // Success
                document.getElementById('modal-add-product').style.display = 'none';
                e.target.reset();
                loadInventory(); // Reload list
            } else {
                alert('Error adding product');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding product');
        }
    };
}
