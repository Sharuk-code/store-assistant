export default {
    init: async (container) => {
        container.innerHTML = `
            <div class="card">
                <h3>Billing Queue (Ready for Delivery)</h3>
                <div id="billing-queue-list">Loading...</div>
            </div>
        `;
        loadReadyJobs();
    }
};

async function loadReadyJobs() {
    try {
        const res = await fetch('/api/jobs');
        const jobs = await res.json();
        const readyJobs = jobs.filter(j => j.status === 'READY');

        const container = document.getElementById('billing-queue-list');

        if (readyJobs.length === 0) {
            container.innerHTML = '<p style="padding:1rem;">No jobs ready for billing.</p>';
            return;
        }

        container.innerHTML = `
            <table style="width:100%; border-collapse:collapse; margin-top:1rem;">
                <thead>
                    <tr style="text-align:left; background:var(--bg-glass-strong, #0a1410);">
                        <th style="padding:0.75rem;">Job No</th>
                        <th style="padding:0.75rem;">Customer</th>
                        <th style="padding:0.75rem;">Device</th>
                        <th style="padding:0.75rem;">Cost (Est)</th>
                        <th style="padding:0.75rem;">Advance</th>
                        <th style="padding:0.75rem;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${readyJobs.map(job => `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:0.75rem; font-weight:bold;">${job.job_no}</td>
                            <td style="padding:0.75rem;">
                                ${job.customer_name}<br>
                                <small style="color:var(--text-secondary, #a9d6e5);">${job.customer_phone}</small>
                            </td>
                            <td style="padding:0.75rem;">${job.device_model}</td>
                            <td style="padding:0.75rem;">₹${job.estimated_cost}</td>
                            <td style="padding:0.75rem; color:green;">-₹${job.advance_amount}</td>
                            <td style="padding:0.75rem;">
                                <button class="btn btn-bill-job" data-id="${job.id}" style="padding:0.5rem 1rem;">
                                    Bill ➡️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.btn-bill-job').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.dataset.id;
                // Store Intent
                localStorage.setItem('pos_job_id', id);
                // Navigate
                document.querySelector('[data-route="pos"]').click();
            };
        });

    } catch (e) {
        console.error(e);
        document.getElementById('billing-queue-list').innerHTML = '<p style="color:red">Error loading jobs.</p>';
    }
}
