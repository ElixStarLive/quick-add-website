document.addEventListener('DOMContentLoaded', async () => {
  const paymentSection = document.getElementById('payment-section');
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job');

  if (!jobId) {
    paymentSection.innerHTML = '<p class="page-subtitle">Invalid job ID</p>';
    return;
  }

  const contractor = await fetchContractorMe();

  if (!contractor) {
    renderContractorPaywall(paymentSection, { code: 'LOGIN_REQUIRED' });
    return;
  }

  if (!contractor.subscription_active) {
    renderContractorPaywall(paymentSection, {
      code: 'SUBSCRIPTION_REQUIRED',
      loggedIn: true,
      email: contractor.email
    });
    return;
  }

  try {
    const checkResponse = await contractorFetch('/api/jobs/' + jobId + '/unlock-status?email=' + encodeURIComponent(contractor.email));
    const checkData = await checkResponse.json();
    if (checkData.unlocked && checkData.job) {
      showContactInfo(checkData.job);
      return;
    }
  } catch (error) {
    console.error('Error checking unlock status:', error);
  }

  try {
    const jobRes = await contractorFetch('/api/jobs/' + jobId);
    const jobData = await jobRes.json();

    if (!jobRes.ok || !jobData.job) {
      if (jobRes.status === 401 || jobRes.status === 403) {
        renderContractorPaywall(paymentSection, {
          code: jobData.code,
          loggedIn: jobRes.status === 403,
          email: contractor.email
        });
        return;
      }
      paymentSection.innerHTML = '<p class="page-subtitle">Job not found</p>';
      return;
    }

    const job = jobData.job;
    const budget = job.budget || job.salary || '';

    paymentSection.innerHTML = `
      <div class="job-card" style="margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0;">${escapeHtml(job.title)}</h3>
        <p class="job-budget">Customer budget: ${escapeHtml(budget)}</p>
        <p class="job-location">${escapeHtml(job.location || 'UK')}</p>
      </div>
      <div class="form-notice" style="margin-bottom: 1.25rem;">
        <strong>Included in your Pro plan</strong> — unlock this lead at no extra cost. Unlimited unlocks while subscribed.
      </div>
      <div class="form-page" style="max-width: 480px; margin: 0;">
        <p class="form-hint">Logged in as ${escapeHtml(contractor.email)}</p>
        <button type="button" class="btn btn-primary" id="unlock-btn">Unlock contact now</button>
        <p style="margin-top:1rem;"><a href="job-detail.html?id=${escapeHtml(jobId)}">← Back to job details</a></p>
      </div>
    `;

    document.getElementById('unlock-btn').addEventListener('click', async () => {
      const btn = document.getElementById('unlock-btn');
      btn.disabled = true;
      btn.textContent = 'Unlocking…';
      try {
        const job = await unlockJobWithSubscription(jobId);
        showContactInfo(job);
      } catch (err) {
        alert(err.message || 'Could not unlock job');
        btn.disabled = false;
        btn.textContent = 'Unlock contact now';
      }
    });
  } catch (error) {
    console.error('Error loading job:', error);
    paymentSection.innerHTML = '<p class="page-subtitle">Error loading job details</p>';
  }
});

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showContactInfo(job) {
  const paymentSection = document.getElementById('payment-section');
  const budget = job.budget || job.salary || '';
  paymentSection.innerHTML = `
    <div class="form-notice" style="margin-bottom: 1.25rem; background: rgba(40,167,69,0.15); border-color: #28a745;">
      <strong style="color: #28a745;">Contact unlocked!</strong> You can now quote this homeowner directly.
    </div>
    <div class="job-card">
      <h3 style="margin-top: 0;">${escapeHtml(job.title)}</h3>
      <p class="job-budget">Customer budget: ${escapeHtml(budget)}</p>
      <p class="job-location">${escapeHtml(job.location || 'UK')}</p>
      ${job.description ? `<p class="job-card-desc" style="margin: 0.75rem 0;">${escapeHtml(job.description)}</p>` : ''}
      <div class="form-notice" style="margin-top: 1rem;">
        <h4 style="margin: 0 0 0.5rem;">Contact information</h4>
        <p style="margin: 0.25rem 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(job.contact_email)}">${escapeHtml(job.contact_email)}</a></p>
        ${job.contact_phone ? `<p style="margin: 0.25rem 0;"><strong>Phone:</strong> <a href="tel:${escapeHtml(job.contact_phone)}">${escapeHtml(job.contact_phone)}</a></p>` : ''}
      </div>
      <p style="margin-top: 1.25rem;"><a href="jobs.html">← Back to all jobs</a></p>
    </div>
  `;
}
