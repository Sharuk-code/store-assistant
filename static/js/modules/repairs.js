// static/js/modules/repairs.js

export default {
    init: async (container) => {
        container.innerHTML = `
            <div style="height:100%; display:flex; flex-direction:column;">
                <header style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <h3>Repair Jobs</h3>
                    <button class="btn" id="btn-new-job">+ New Job Card</button>
                </header>
                
                <div id="kanban-board" style="display:flex; gap:1rem; overflow-x:auto; height:100%; padding-bottom:1rem;">
                    <!-- Columns -->
                    ${renderColumn('RECEIVED', 'Received')}
                    ${renderColumn('DIAGNOSING', 'Diagnosing')}
                    ${renderColumn('IN_PROGRESS', 'In Progress')}
                    ${renderColumn('READY', 'Ready')}
                    ${renderColumn('DELIVERED', 'Delivered')}
                </div>
            </div>

             <!-- Add Job Modal -->
            <div id="modal-new-job" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); align-items:center; justify-content:center; z-index:999;">
                <div class="card" style="width:500px; max-width:95%;">
                    <h3>Create New Job Card</h3>
                    <form id="form-new-job">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div>
                                <label>Phone (Search)</label>
                                <input type="text" id="job-phone" name="customer_phone" required style="width:100%; padding:0.5rem;" placeholder="Enter Phone to Search...">
                            </div>
                            <div>
                                <label>Customer Name</label>
                                <input type="text" id="job-name" name="customer_name" required style="width:100%; padding:0.5rem;">
                            </div>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label>Device Model</label>
                            <input type="text" name="device_model" required style="width:100%; padding:0.5rem;">
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label>Issue Description</label>
                            <textarea name="issue_description" rows="2" style="width:100%; padding:0.5rem;"></textarea>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label>Repair Notes (Work Done)</label>
                            <textarea name="repair_notes" rows="2" style="width:100%; padding:0.5rem; background:var(--bg-note); color:var(--text-primary);"></textarea>
                        </div>
                        <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                            <div style="flex:1;">
                                <label>Est. Cost</label>
                                <input type="number" name="estimated_cost" value="0" min="0" style="width:100%; padding:0.5rem;">
                            </div>
                        <div style="flex:1;">
                                <label>Advance</label>
                                <input type="number" name="advance_amount" value="0" min="0" style="width:100%; padding:0.5rem;">
                            </div>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label>Assign Technician</label>
                            <select name="technician" id="job-technician" style="width:100%; padding:0.5rem; background:var(--bg-input); color:var(--text-primary);">
                                <option value="">-- Unassigned --</option>
                            </select>
                        </div>
                        <div style="text-align:right;">
                            <button type="button" class="btn" style="background:var(--bg-glass); color:var(--text-primary);" id="btn-cancel-job">Cancel</button>
                            <button type="button" class="btn" id="btn-submit-job">Save Job Card</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Load Technicians
        try {
            const uRes = await fetch('/api/users');
            const users = await uRes.json();
            const techSelect = document.getElementById('job-technician');
            if (techSelect) {
                // Filter for techs or just show all? Showing all for now.
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.username;
                    opt.textContent = `${u.username} (${u.role})`;
                    techSelect.appendChild(opt);
                });
            }
        } catch (e) { console.error("Error loading techs", e); }

        await loadJobs();
        setupEventListeners();
    }
};

function renderColumn(statusId, title) {
    return `
        <div class="kanban-col" data-status="${statusId}" style="min-width:280px; background:var(--bg-column); border-radius:8px; padding:0.5rem; display:flex; flex-direction:column;">
            <div style="font-weight:bold; margin-bottom:0.5rem; padding:0.5rem; border-bottom:2px solid var(--border-color); display:flex; justify-content:space-between;">
                ${title} <span class="count-badge" style="background:var(--border-color); padding:2px 8px; border-radius:12px; font-size:0.8em;" id="count-${statusId}">0</span>
            </div>
            <div class="kanban-items" id="col-${statusId}" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;">
                <!-- Items go here -->
            </div>
        </div>
    `;
}

async function loadJobs() {
    try {
        const res = await fetch('/api/jobs');
        const jobs = await res.json();

        // Clear columns
        document.querySelectorAll('.kanban-items').forEach(el => el.innerHTML = '');
        const counts = {};

        jobs.forEach(job => {
            const col = document.getElementById(`col-${job.status}`);
            if (col) {
                const card = document.createElement('div');
                card.className = 'kanban-card card';
                card.draggable = true;
                card.style.cursor = 'grab';
                card.style.padding = '0.75rem';
                card.dataset.id = job.id;

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-size:0.85em; margin-bottom:0.25rem;">
                        <span style="font-weight:bold; color:#3b82f6;">${job.job_no}</span>
                        <span style="color:var(--text-secondary, #a9d6e5);">${new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style="font-weight:600; margin-bottom:0.25rem;">${job.device_model}</div>
                    <div style="font-size:0.9em; color:var(--text-secondary, #a9d6e5); margin-bottom:0.5rem;">${job.customer_name}</div>
                    ${job.technician ? `<div style="font-size:0.8em; color:var(--accent); margin-bottom:0.5rem;">👤 ${job.technician}</div>` : ''}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <select class="status-select" data-id="${job.id}" style="font-size:0.8em; padding:2px;" ${job.status === 'DELIVERED' ? 'disabled' : ''}>
                            <option value="RECEIVED" ${job.status === 'RECEIVED' ? 'selected' : ''}>Recv</option>
                            <option value="DIAGNOSING" ${job.status === 'DIAGNOSING' ? 'selected' : ''}>Diag</option>
                            <option value="IN_PROGRESS" ${job.status === 'IN_PROGRESS' ? 'selected' : ''}>Prog</option>
                            <option value="READY" ${job.status === 'READY' ? 'selected' : ''}>Ready</option>
                            <option value="DELIVERED" ${job.status === 'DELIVERED' ? 'selected' : ''}>Done</option>
                        </select>
                        <a href="https://wa.me/${job.customer_phone}?text=Hello ${job.customer_name}, your device (${job.device_model}) status is now: ${job.status}. Job No: ${job.job_no}" 
                           target="_blank" 
                           style="color:#25D366; text-decoration:none; font-size:1.2rem; margin-left:0.5rem;" 
                           title="Send WhatsApp">
                           &#128172;
                        </a>
                    </div>
                     <div style="border-top:1px solid var(--border-color); margin-top:0.5rem; padding-top:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                         <div style="font-size:0.8em; color:var(--text-secondary); background:var(--bg-note); padding:2px 4px; border-radius:4px; max-width:70%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${job.repair_notes || ''}">
                             ${job.repair_notes || ''}
                         </div>
                         <div style="display:flex; gap:0.5rem;">
                            <button class="btn-edit-job" data-id="${job.id}" title="Edit/Add Notes" style="border:none; background:none; cursor:pointer;"><img src="/static/icons/edit.svg" style="width:16px; height:16px; filter:brightness(0) saturate(100%) invert(76%) sepia(15%) saturate(811%) hue-rotate(155deg);"></button>
                            <button class="btn-delete-job" data-id="${job.id}" title="Delete Job" style="border:none; background:none; cursor:pointer;"><img src="/static/icons/delete.svg" style="width:16px; height:16px; filter:invert(45%) sepia(100%) saturate(1000%) hue-rotate(330deg);"></button>
                         </div>
                     </div>
                `;
                col.appendChild(card);

                counts[job.status] = (counts[job.status] || 0) + 1;
            }
        });

        // Update counts
        Object.keys(counts).forEach(k => {
            const badge = document.getElementById(`count-${k}`);
            if (badge) badge.textContent = counts[k];
        });

        // Re-attach status listeners
        document.querySelectorAll('.status-select').forEach(sel => {
            sel.onchange = async (e) => {
                const newStatus = e.target.value;
                const jobId = e.target.dataset.id;
                const prevStatus = e.target.dataset.status || 'RECEIVED'; // Store in data attr if possible, or naive revert

                if (newStatus === 'DELIVERED') {
                    if (confirm("This job has NOT been billed yet.\n\nClick OK to go to Billing.\nClick Cancel to just mark as Delivered.")) {
                        // Go to Billing
                        localStorage.setItem('pos_job_id', jobId);
                        localStorage.setItem('open_repair_tab', 'true');
                        document.querySelector('[data-route="pos"]').click();
                        e.target.value = prevStatus; // Revert visually
                        return;
                    } else {
                        if (!confirm("Are you sure you want to mark as Delivered WITHOUT billing?")) {
                            e.target.value = prevStatus;
                            return;
                        }
                    }
                }

                e.target.dataset.status = newStatus; // Access current status for revert
                await updateJobStatus(jobId, newStatus);
            };
            // Set initial status for revert
            sel.dataset.status = sel.value;
        });

        // Edit/Delete Listeners
        document.querySelectorAll('.btn-edit-job').forEach(btn => {
            btn.onclick = (e) => editJob(e.target.closest('button').dataset.id);
        });
        document.querySelectorAll('.btn-delete-job').forEach(btn => {
            btn.onclick = (e) => deleteJob(e.target.closest('button').dataset.id);
        });

        // Setup drag & drop after cards are loaded
        setupDragDrop();

    } catch (err) {
        console.error("Failed to load jobs", err);
    }
}

// Logic to Edit Job
window.editJob = async (id) => {
    try {
        const res = await fetch(`/api/jobs/${id}`);
        const job = await res.json();

        const form = document.getElementById('form-new-job');
        form.reset();

        // Fill form
        form.querySelector('[name="customer_name"]').value = job.customer_name;
        form.querySelector('[name="customer_phone"]').value = job.customer_phone;
        form.querySelector('[name="device_model"]').value = job.device_model;
        form.querySelector('[name="issue_description"]').value = job.issue_description || '';
        form.querySelector('[name="repair_notes"]').value = job.repair_notes || '';
        form.querySelector('[name="estimated_cost"]').value = job.estimated_cost;
        form.querySelector('[name="advance_amount"]').value = job.advance_amount;
        form.querySelector('[name="technician"]').value = job.technician || '';

        // Set ID for Update
        form.dataset.id = job.id;
        document.querySelector('#modal-new-job h3').textContent = `Edit Job #${job.job_no}`;
        document.getElementById('modal-new-job').style.display = 'flex';

    } catch (e) { console.error(e); }
};

window.deleteJob = async (id) => {
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this job?")) return;
    try {
        const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadJobs();
        } else {
            alert("Failed to delete.");
        }
    } catch (e) { console.error(e); }
};

async function updateJobStatus(jobId, status) {
    try {
        await fetch(`/api/jobs/${jobId}/status?status=${status}`, { method: 'PUT' });
        loadJobs(); // Refresh board
    } catch (e) { console.error(e); }
}

// Drag & Drop Setup
function setupDragDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-col');

    let draggedCard = null;

    // Card drag events
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            columns.forEach(col => col.classList.remove('drag-over'));
            draggedCard = null;
        });
    });

    // Column drop zone events
    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', (e) => {
            // Only remove if leaving the column entirely
            if (!col.contains(e.relatedTarget)) {
                col.classList.remove('drag-over');
            }
        });

        col.addEventListener('drop', async (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');

            if (draggedCard) {
                const jobId = draggedCard.dataset.id;
                const newStatus = col.dataset.status;
                const oldStatus = draggedCard.closest('.kanban-col')?.dataset.status;

                if (newStatus && newStatus !== oldStatus) {
                    // Visual feedback - move card immediately
                    const itemsContainer = col.querySelector('.kanban-items');
                    if (itemsContainer) {
                        // Add animation class
                        draggedCard.style.animation = 'slideIn 0.3s ease-out';
                        itemsContainer.appendChild(draggedCard);

                        // Update the select dropdown
                        const select = draggedCard.querySelector('.status-select');
                        if (select) select.value = newStatus;

                        // Update count badges
                        updateCountBadges();
                    }

                    // Update in backend
                    await updateJobStatusSilent(jobId, newStatus);
                }
            }
        });
    });
}

// Update status without reloading (for drag-drop)
async function updateJobStatusSilent(jobId, status) {
    try {
        await fetch(`/api/jobs/${jobId}/status?status=${status}`, { method: 'PUT' });
    } catch (e) {
        console.error(e);
        loadJobs(); // Reload on error
    }
}

// Update count badges
function updateCountBadges() {
    const columns = document.querySelectorAll('.kanban-col');
    columns.forEach(col => {
        const status = col.dataset.status;
        const count = col.querySelectorAll('.kanban-card').length;
        const badge = document.getElementById(`count-${status}`);
        if (badge) badge.textContent = count;
    });
}

function setupEventListeners() {
    // Use Delegation to avoid binding issues
    const container = document.getElementById('modal-new-job').parentElement; // The main container

    container.onclick = async (e) => {
        // Open Modal
        if (e.target.id === ('btn-new-job')) {
            document.getElementById('modal-new-job').style.display = 'flex';
        }
        // Close Modal
        if (e.target.id === 'btn-cancel-job') {
            document.getElementById('modal-new-job').style.display = 'none';
        }
        // Submit Job
        if (e.target.id === 'btn-submit-job') {
            e.preventDefault();
            await handleJobSubmit();
        }
    };

    // Customer Search Input (Direct binding is okay here as it needs 'input' event, but delegation is safer for click)
    const phoneInp = document.getElementById('job-phone');
    if (phoneInp) {
        phoneInp.oninput = async (e) => {
            const val = e.target.value;
            if (val.length > 2) {
                try {
                    const res = await fetch(`/api/customers?search=${val}`);
                    const customers = await res.json();
                    const exact = customers.find(c => c.phone === val);
                    if (exact) {
                        document.querySelector('[name="customer_name"]').value = exact.name; // Changed to querySelector for customer_name
                    }
                } catch (e) { }
            }
        };
    }
}

async function handleJobSubmit() {
    const form = document.getElementById('form-new-job');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (!data.customer_name || !data.customer_phone || !data.device_model) {
        return alert("Please fill in Customer Name, Phone, and Device Model.");
    }

    data.branch_id = 1;
    data.estimated_cost = parseFloat(data.estimated_cost) || 0;
    data.advance_amount = parseFloat(data.advance_amount) || 0;

    if (data.estimated_cost < 0 || data.advance_amount < 0) {
        return alert("Cost and Advance cannot be negative.");
    }

    const jobId = form.dataset.id;
    const method = jobId ? 'PUT' : 'POST';
    const url = jobId ? `/api/jobs/${jobId}` : '/api/jobs';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert("Job Created Successfully!"); // Explicit Feedback
            document.getElementById('modal-new-job').style.display = 'none';
            form.reset();
            delete form.dataset.id; // clear ID
            document.querySelector('#modal-new-job h3').textContent = 'Create New Job Card';
            loadJobs();
        } else {
            const err = await res.json();
            alert("Error creating job: " + (err.detail || JSON.stringify(err)));
        }
    } catch (err) {
        console.error(err);
        alert("Network Error: " + err.message);
    }
}
