
export default {
    init: async (container) => {
        container.innerHTML = `
            <div style="max-width:800px; margin:0 auto;">
                <h2 style="margin-bottom:1.5rem; color:var(--text-primary, #e0f4fc);">Store Settings</h2>
                
                <!-- Shop Details -->
                <div class="card" style="margin-bottom:2rem; padding:2rem;">
                    <h3 style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Shop Details</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Store Name</label>
                            <input type="text" id="set-name" style="width:100%; padding:0.75rem; border:1px solid var(--border-glass); border-radius:6px;">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Address</label>
                            <textarea id="set-address" rows="3" style="width:100%; padding:0.75rem; border:1px solid var(--border-glass); border-radius:6px;"></textarea>
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Phone</label>
                            <input type="text" id="set-phone" style="width:100%; padding:0.75rem; border:1px solid var(--border-glass); border-radius:6px;">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Invoice Footer Note</label>
                            <input type="text" id="set-footer" style="width:100%; padding:0.75rem; border:1px solid var(--border-glass); border-radius:6px;">
                        </div>
                        <div style="text-align:right; margin-top:1rem;">
                            <button class="btn" id="btn-save-settings" style="padding:0.75rem 2rem;">Save Changes</button>
                        </div>
                    </div>
                </div>

                <!-- Data Management -->
                <div class="card" style="padding:2rem;">
                    <h3 style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Data Management</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="display:block; margin-bottom:0.25rem;">Backup Database</strong>
                            <span style="color:var(--text-secondary, #a9d6e5); font-size:0.9rem;">Download a copy of your store's data for safety.</span>
                        </div>
                        <button class="btn" id="btn-backup" style="background:#0ea5e9;">⬇ Download Backup</button>
                    </div>
                </div>
            </div>
        `;

        await loadSettings();

        // Save Listener
        document.getElementById('btn-save-settings').onclick = async () => {
            const data = {
                store_name: document.getElementById('set-name').value,
                store_address: document.getElementById('set-address').value,
                store_phone: document.getElementById('set-phone').value,
                invoice_footer: document.getElementById('set-footer').value
            };

            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                alert("Settings Saved Successfully!");
            } catch (e) { alert("Error saving settings"); }
        };

        // Backup Listener
        document.getElementById('btn-backup').onclick = () => {
            window.location.href = '/api/backup';
        };
    }
};

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();

        document.getElementById('set-name').value = data.store_name || '';
        document.getElementById('set-address').value = data.store_address || '';
        document.getElementById('set-phone').value = data.store_phone || '';
        document.getElementById('set-footer').value = data.invoice_footer || '';
    } catch (e) { console.error(e); }
}
