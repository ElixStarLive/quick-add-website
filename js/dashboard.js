document.addEventListener('DOMContentLoaded', async () => {
  const dashboardContent = document.getElementById('dashboard-content');
  const emailInput = document.getElementById('dashboard-email');
  const loadBtn = document.getElementById('dashboard-load');
  const loginPanel = document.getElementById('contractor-login-panel');
  const accountPanel = document.getElementById('contractor-account-panel');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginBtn = document.getElementById('contractor-login-btn');

  const stored = typeof getStoredDashboardEmail === 'function' ? getStoredDashboardEmail() : '';
  if (stored && emailInput) emailInput.value = stored;

  async function renderContractorAccount() {
    const contractor = await fetchContractorMe();
    if (!contractor) {
      loginPanel.style.display = 'block';
      accountPanel.style.display = 'none';
      return;
    }

    loginPanel.style.display = 'none';
    accountPanel.style.display = 'block';

    const planLabel = contractor.subscription_active
      ? 'Pro — active'
      : 'No active subscription';

    accountPanel.innerHTML = `
      <div class="job-card">
        <h2 class="section-title" style="margin-top:0;font-size:1.25rem;">Welcome, ${esc(contractor.name)}</h2>
        <p><strong>Email:</strong> ${esc(contractor.email)}</p>
        ${contractor.company_name ? `<p><strong>Company:</strong> ${esc(contractor.company_name)}</p>` : ''}
        ${contractor.trade ? `<p><strong>Trade:</strong> ${esc(contractor.trade)}</p>` : ''}
        <p><strong>Plan:</strong> ${esc(planLabel)}</p>
        <div style="margin-top:1.25rem;display:flex;flex-wrap:wrap;gap:0.5rem;">
          ${contractor.subscription_active
            ? '<a href="jobs.html" class="btn btn-primary">Browse jobs</a>'
            : '<button type="button" class="btn btn-primary" id="dash-subscribe-btn">Subscribe to Pro — £29.99/mo</button>'}
          <button type="button" class="btn btn-outline" id="contractor-logout-btn">Log out</button>
        </div>
        ${contractor.subscription_active ? '' : '<p class="form-hint" style="margin-top:1rem;">You must subscribe before you can view or unlock any jobs. No free job access.</p>'}
      </div>
      <section style="margin-top:1.5rem;" id="contractor-unlocks-section">
        <h2 class="section-title">Jobs I unlocked</h2>
        <p class="page-subtitle">Loading…</p>
      </section>`;

    document.getElementById('contractor-logout-btn')?.addEventListener('click', () => {
      clearContractorSession();
      window.location.reload();
    });

    document.getElementById('dash-subscribe-btn')?.addEventListener('click', () => {
      startProSubscription().catch((err) => alert(err.message));
    });

    loadContractorUnlocks(contractor.email);
  }

  async function loadContractorUnlocks(email) {
    const section = document.getElementById('contractor-unlocks-section');
    if (!section) return;
    try {
      const res = await fetch('/api/dashboard?email=' + encodeURIComponent(email));
      const data = await res.json();
      const unlocks = data.unlocks || [];
      const html = unlocks.length
        ? unlocks.map((u) => `
          <article class="job-card" style="margin-bottom: 1rem;">
            <h3 style="margin-top:0;"><a href="payment-unlock.html?job=${u.job_id}">${esc(u.title)}</a></h3>
            <p class="job-location">${esc(u.location || '')} · Budget: ${esc(u.budget || '')}</p>
            <p>Unlocked · ${new Date(u.created_at).toLocaleDateString()}</p>
          </article>`).join('')
        : '<p class="page-subtitle">No unlocks yet. <a href="jobs.html">Browse jobs</a> once subscribed.</p>';
      section.innerHTML = '<h2 class="section-title">Jobs I unlocked (' + unlocks.length + ')</h2>' + html;
    } catch (err) {
      section.innerHTML = '<h2 class="section-title">Jobs I unlocked</h2><p class="page-subtitle">Could not load unlocks.</p>';
    }
  }

  loginBtn?.addEventListener('click', async () => {
    const email = (loginEmail?.value || '').trim();
    const password = loginPassword?.value || '';
    if (!email || !password) {
      alert('Enter email and password.');
      return;
    }
    loginBtn.disabled = true;
    try {
      await contractorLogin(email, password);
      await renderContractorAccount();
    } catch (err) {
      alert(err.message);
    } finally {
      loginBtn.disabled = false;
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('subscribed') === '1' && urlParams.get('session_id')) {
    try {
      await confirmProSubscription(urlParams.get('session_id'));
      history.replaceState({}, '', 'dashboard.html?subscribed=ok');
    } catch (err) {
      alert(err.message || 'Payment received — refresh in a moment if your plan is not active yet.');
    }
  }

  if (urlParams.get('subscribed') === 'ok') {
    const banner = document.createElement('div');
    banner.className = 'form-notice';
    banner.style.marginBottom = '1rem';
    banner.innerHTML = '<strong>Pro subscription active!</strong> You can now browse and unlock jobs.';
    document.querySelector('.main')?.prepend(banner);
  }

  await renderContractorAccount();

  async function loadHomeownerDashboard() {
    const email = (emailInput?.value || '').trim();
    if (!email) {
      alert('Enter your email to view jobs you posted.');
      return;
    }
    setStoredDashboardEmail(email);
    dashboardContent.innerHTML = '<p class="page-subtitle">Loading…</p>';

    try {
      const res = await fetch('/api/dashboard?email=' + encodeURIComponent(email));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load dashboard');

      const posted = data.posted || [];
      const postedHtml = posted.length
        ? posted.map((job) => `
          <article class="job-card" style="margin-bottom: 1rem;">
            <h3 style="margin-top:0;"><a href="job-detail.html?id=${job.id}">${esc(job.title)}</a></h3>
            <p class="job-salary">Budget: ${esc(job.budget || '')}</p>
            <p class="job-location">${esc(job.location || '')}</p>
            <p><strong>Status:</strong> ${esc(job.status)}</p>
          </article>`).join('')
        : '<p class="page-subtitle">No jobs posted with this email yet. <a href="post-job.html">Post a job</a></p>';

      dashboardContent.innerHTML = `
        <section>
          <h2 class="section-title">Jobs I posted (${posted.length})</h2>
          ${postedHtml}
        </section>`;
    } catch (err) {
      dashboardContent.innerHTML = '<p class="page-subtitle">' + esc(err.message) + '</p>';
    }
  }

  loadBtn?.addEventListener('click', loadHomeownerDashboard);
});

function esc(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
