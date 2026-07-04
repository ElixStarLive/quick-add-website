document.addEventListener('DOMContentLoaded', async () => {
  const jobDetailContainer = document.getElementById('job-detail');
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  if (!jobId) {
    jobDetailContainer.innerHTML = '<p>Job not found</p>';
    return;
  }

  try {
    const response = await fetch(`/api/jobs/${jobId}`);
    const data = await response.json();

    if (data.job) {
      const job = data.job;
      const budget = job.budget || job.salary || '';
      const unlockFee = job.unlock_fee_display || '£2.00';
      jobDetailContainer.innerHTML = `
        <div class="job-card" style="margin-bottom: 20px;">
          <h2 style="margin-top: 0;">${escapeHtml(job.title)}</h2>
          <p class="job-salary">Budget: ${escapeHtml(budget)}</p>
          <p class="job-location">
            <svg class="icon-inline" viewBox="0 0 24 24" aria-hidden="true" style="width: 16px; height: 16px; fill: currentColor;">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            ${escapeHtml(job.location || 'UK')}
          </p>
          <p class="job-contact-locked" style="margin: 20px 0; line-height: 1.6;">
            <span class="icon-lock">🔒</span>
            Full job description and contact details are locked — unlock to view.
          </p>

          <div id="contact-info">
            <p class="job-contact-locked">
              <span class="icon-lock">
                <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; vertical-align: middle;">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </span>
              Contact: Locked
            </p>
            <div class="job-card-actions">
              <a href="payment-unlock.html?job=${jobId}" class="unlock-btn" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px;">Unlock Contact – ${escapeHtml(unlockFee)}</a>
            </div>
          </div>
        </div>
      `;
    } else {
      jobDetailContainer.innerHTML = '<p>Job not found</p>';
    }
  } catch (error) {
    console.error('Error loading job:', error);
    jobDetailContainer.innerHTML = '<p>Error loading job details</p>';
  }
});

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
