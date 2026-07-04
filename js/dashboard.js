document.addEventListener('DOMContentLoaded', () => {
  const dashboardContent = document.getElementById('dashboard-content');
  const emailInput = document.getElementById('dashboard-email');
  const loadBtn = document.getElementById('dashboard-load');
  const stored = typeof getStoredDashboardEmail === 'function' ? getStoredDashboardEmail() : '';
  if (stored && emailInput) emailInput.value = stored;

  async function loadDashboard() {
    const email = (emailInput?.value || '').trim();
    if (!email) {
      alert('Enter your email to view your jobs and unlocks.');
      return;
    }
    setStoredDashboardEmail(email);
    dashboardContent.innerHTML = '<p class="page-subtitle">Loading…</p>';

    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load dashboard');

      const posted = data.posted || [];
      const unlocks = data.unlocks || [];

      const postedHtml = posted.length
        ? posted.map((job) => `
          <article class="job-card" style="margin-bottom: 1rem;">
            <h3 style="margin-top:0;"><a href="job-detail.html?id=${job.id}">${esc(job.title)}</a></h3>
            <p class="job-salary">Budget: ${esc(job.budget || '')}</p>
            <p class="job-location">${esc(job.location || '')}</p>
            <p><strong>Status:</strong> ${esc(job.status)}</p>
          </article>`).join('')
        : '<p class="page-subtitle">No jobs posted with this email yet. <a href="post-job.html">Post a job</a></p>';

      const unlocksHtml = unlocks.length
        ? unlocks.map((u) => `
          <article class="job-card" style="margin-bottom: 1rem;">
            <h3 style="margin-top:0;"><a href="payment-unlock.html?job=${u.job_id}">${esc(u.title)}</a></h3>
            <p class="job-location">${esc(u.location || '')} · Budget: ${esc(u.budget || '')}</p>
            <p>Unlocked for £${Number(u.amount).toFixed(2)} · ${new Date(u.created_at).toLocaleDateString()}</p>
          </article>`).join('')
        : '<p class="page-subtitle">No unlocks yet. <a href="jobs.html">Browse jobs</a></p>';

      dashboardContent.innerHTML = `
        <section style="margin-bottom: 2rem;">
          <h2 class="section-title">Jobs I posted (${posted.length})</h2>
          ${postedHtml}
        </section>
        <section>
          <h2 class="section-title">Contacts I unlocked (${unlocks.length})</h2>
          ${unlocksHtml}
        </section>`;
    } catch (err) {
      dashboardContent.innerHTML = `<p class="page-subtitle">${esc(err.message)}</p>`;
    }
  }

  loadBtn?.addEventListener('click', loadDashboard);
  if (stored) loadDashboard();
});

function esc(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
