/** QuickPost Ads admin panel */
function getAdminKey() {
  return sessionStorage.getItem('adminKey') || new URLSearchParams(window.location.search).get('key') || '';
}

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'X-Admin-Key': getAdminKey() };
}

function esc(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
  const adminContent = document.getElementById('admin-content');
  const loginBox = document.getElementById('admin-login');
  const keyInput = document.getElementById('admin-key-input');
  const loginBtn = document.getElementById('admin-login-btn');

  const savedKey = getAdminKey();
  if (savedKey && keyInput) keyInput.value = savedKey;

  loginBtn?.addEventListener('click', () => {
    const key = keyInput?.value.trim();
    if (!key) return alert('Enter admin key');
    sessionStorage.setItem('adminKey', key);
    loginBox.style.display = 'none';
    loadAdmin();
  });

  if (savedKey) {
    loginBox.style.display = 'none';
    loadAdmin();
  }

  async function loadAdmin() {
    adminContent.innerHTML = '<p>Loading…</p>';
    try {
      const [jobsRes, adsRes] = await Promise.all([
        fetch('/api/admin/jobs', { headers: adminHeaders() }),
        fetch('/api/admin/ads', { headers: adminHeaders() })
      ]);
      if (jobsRes.status === 401 || adsRes.status === 401) {
        sessionStorage.removeItem('adminKey');
        loginBox.style.display = 'block';
        adminContent.innerHTML = '<p class="form-notice">Invalid admin key.</p>';
        return;
      }
      const jobsData = await jobsRes.json();
      const adsData = await adsRes.json();
      const jobs = jobsData.jobs || [];
      const ads = adsData.ads || [];

      adminContent.innerHTML = `
        <div style="margin-bottom:1.5rem;padding:1rem;border:1px solid rgba(255,255,255,0.12);border-radius:8px;">
          <p style="margin:0 0 0.75rem;"><strong>Production cleanup</strong> — removes all jobs, shop listings, payments and contact messages.</p>
          <button type="button" class="btn btn-outline" id="purge-all-btn">Clear entire site</button>
        </div>
        <h2 class="section-title">Jobs (${jobs.length})</h2>
        ${jobs.length ? jobs.map((job) => jobCard(job)).join('') : '<p>No jobs.</p>'}
        <h2 class="section-title" style="margin-top:2rem;">Shop listings (${ads.length})</h2>
        ${ads.length ? ads.map((ad) => adCard(ad)).join('') : '<p>No shop listings.</p>'}`;

      document.getElementById('purge-all-btn')?.addEventListener('click', purgeAll);
    } catch (e) {
      adminContent.innerHTML = '<p>Error loading admin panel.</p>';
    }
  }

  function jobCard(job) {
    return `
      <article class="job-card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">${esc(job.title)}</h3>
        <p>${esc(job.location)} · ${esc(job.salary || '')}</p>
        <p>${esc((job.description || '').slice(0, 120))}…</p>
        <p><strong>Status:</strong> ${esc(job.status)} · <strong>Contact:</strong> ${esc(job.contact_email)}</p>
        <p style="margin-top:0.75rem;">
          <button onclick="updateJobStatus(${job.id}, 'approved')" class="btn btn-primary" style="margin-right:0.5rem;">Approve</button>
          <button onclick="updateJobStatus(${job.id}, 'rejected')" class="btn btn-outline" style="margin-right:0.5rem;">Reject</button>
          <button onclick="deleteJob(${job.id})" class="btn btn-outline">Delete</button>
        </p>
      </article>`;
  }

  function adCard(ad) {
    return `
      <article class="job-card" style="margin-bottom:1rem;">
        <h3 style="margin-top:0;">${esc(ad.title)}</h3>
        <p>${esc(ad.location)} · ${esc(ad.price || '')}</p>
        <p><strong>Contact:</strong> ${esc(ad.contact_email)}</p>
        <p style="margin-top:0.75rem;">
          <button onclick="deleteAd(${ad.id})" class="btn btn-outline">Delete</button>
        </p>
      </article>`;
  }

  async function purgeAll() {
    if (!confirm('Delete ALL jobs, shop listings, payments and contact messages? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/purge-all', { method: 'POST', headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purge failed');
      alert(data.message || 'Site cleared.');
      loadAdmin();
    } catch (e) {
      alert(e.message || 'Purge failed');
    }
  }

  window.loadAdmin = loadAdmin;
});

async function updateJobStatus(jobId, status) {
  try {
    const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Update failed');
    location.reload();
  } catch (e) {
    alert('Error updating job status');
  }
}

async function deleteJob(jobId) {
  if (!confirm('Delete this job permanently?')) return;
  try {
    const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Delete failed');
    if (typeof loadAdmin === 'function') loadAdmin();
    else location.reload();
  } catch (e) {
    alert('Error deleting job');
  }
}

async function deleteAd(adId) {
  if (!confirm('Delete this listing permanently?')) return;
  try {
    const res = await fetch(`/api/admin/ads/${adId}`, { method: 'DELETE', headers: adminHeaders() });
    if (!res.ok) throw new Error('Delete failed');
    if (typeof loadAdmin === 'function') loadAdmin();
    else location.reload();
  } catch (e) {
    alert('Error deleting listing');
  }
}
