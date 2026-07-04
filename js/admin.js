function getAdminKey() {
  return sessionStorage.getItem('adminKey') || new URLSearchParams(window.location.search).get('key') || '';
}

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'X-Admin-Key': getAdminKey() };
}

document.addEventListener('DOMContentLoaded', async () => {
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
      const response = await fetch('/api/admin/jobs', { headers: adminHeaders() });
      const data = await response.json();
      if (response.status === 401) {
        sessionStorage.removeItem('adminKey');
        loginBox.style.display = 'block';
        adminContent.innerHTML = '<p class="form-notice">Invalid admin key.</p>';
        return;
      }
      if (!data.jobs?.length) {
        adminContent.innerHTML = '<p>No jobs to review.</p>';
        return;
      }
      adminContent.innerHTML = `
        <p style="margin-bottom:1rem;">Total jobs: ${data.jobs.length}</p>
        ${data.jobs.map((job) => `
          <article class="job-card" style="margin-bottom:1rem;">
            <h3 style="margin-top:0;">${esc(job.title)}</h3>
            <p>${esc(job.location)} · ${esc(job.salary || '')}</p>
            <p>${esc((job.description || '').slice(0, 120))}…</p>
            <p><strong>Status:</strong> ${esc(job.status)}</p>
            <p style="margin-top:0.75rem;">
              <button onclick="updateJobStatus(${job.id}, 'approved')" class="btn btn-primary" style="margin-right:0.5rem;">Approve</button>
              <button onclick="updateJobStatus(${job.id}, 'rejected')" class="btn btn-outline" style="margin-right:0.5rem;">Reject</button>
              <button onclick="updateJobStatus(${job.id}, 'pending')" class="btn btn-outline">Pending</button>
            </p>
          </article>`).join('')}`;
    } catch (e) {
      adminContent.innerHTML = '<p>Error loading admin panel.</p>';
    }
  }
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

function esc(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
