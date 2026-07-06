document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('job-detail');
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  if (!container) return;
  if (!jobId) {
    container.innerHTML = '<p class="page-subtitle">Job not found. <a href="jobs.html">Back to jobs</a></p>';
    return;
  }

  try {
    const response = await fetch('/api/jobs/' + jobId);
    const data = await response.json();

    if (!data.job) {
      container.innerHTML = '<p class="page-subtitle">Job not found. <a href="jobs.html">Back to jobs</a></p>';
      return;
    }

    const job = data.job;
    const budget = job.budget || 'Budget on request';
    const location = job.location || 'UK';
    const unlocked = !job.locked;
    const unlockFee = job.unlock_fee_display || '£2.00';
    const tradeGuess = job.title || 'Construction';
    const postedDate = job.created_at ? new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
    const photoHtml = job.image_url
      ? '<div class="job-detail-photos"><img src="' + esc(job.image_url) + '" alt="Job photo" class="job-detail-photo-main"></div>'
      : '<div class="job-detail-photos job-detail-photos-placeholder"><p>Photos available after unlock</p></div>';

    const descriptionHtml = unlocked
      ? '<p>' + esc(job.description || '').replace(/\n/g, '<br>') + '</p>'
      : '<p class="job-detail-locked-text"><span class="icon-lock">🔒</span> Full job description is available after you unlock this lead. Preview: homeowners post detailed scope, timeline and budget expectations.</p>';

    container.innerHTML =
      '<div class="job-detail-layout">' +
        '<div class="job-detail-main">' +
          '<a href="jobs.html" class="job-detail-back">← Back to jobs</a>' +
          '<div class="job-detail-header">' +
            '<div>' +
              '<h1 class="job-detail-title">' + esc(job.title) + '</h1>' +
              '<p class="job-detail-location">' + esc(location) + '</p>' +
            '</div>' +
            '<span class="job-status-badge">Open</span>' +
          '</div>' +
          '<div class="job-detail-meta-row">' +
            '<span><strong>Budget:</strong> ' + esc(budget) + '</span>' +
            '<span><strong>Posted:</strong> ' + esc(postedDate) + '</span>' +
            '<span><strong>Start:</strong> Flexible</span>' +
          '</div>' +
          '<section class="job-detail-section">' +
            '<h2>Job description</h2>' + descriptionHtml +
          '</section>' +
          '<section class="job-detail-section">' +
            '<h2>Photos</h2>' + photoHtml +
          '</section>' +
        '</div>' +
        '<aside class="job-detail-sidebar">' +
          '<div class="job-summary-card">' +
            '<h2>Job summary</h2>' +
            '<dl class="job-summary-list">' +
              '<dt>Trade</dt><dd>' + esc(tradeGuess) + '</dd>' +
              '<dt>Job type</dt><dd>' + esc(job.title) + '</dd>' +
              '<dt>Budget</dt><dd>' + esc(budget) + '</dd>' +
              '<dt>Posted by</dt><dd>Homeowner</dd>' +
              '<dt>Location</dt><dd>' + esc(location) + '</dd>' +
              '<dt>Posted</dt><dd>' + esc(postedDate) + '</dd>' +
            '</dl>' +
            (unlocked
              ? '<p class="job-unlocked-note">✓ Contact unlocked</p>'
              : '<a href="payment-unlock.html?job=' + esc(jobId) + '" class="btn btn-primary btn-block">Unlock contact – ' + esc(unlockFee) + '</a>') +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<section class="job-contractors-section">' +
        '<h2 class="section-title">Contractors interested</h2>' +
        '<p class="page-subtitle">When contractors unlock this job, they can appear here. Be the first to quote.</p>' +
        '<div class="contractor-interest-empty">' +
          '<p>No public interest list yet — <a href="payment-unlock.html?job=' + esc(jobId) + '">unlock this job</a> to contact the homeowner.</p>' +
        '</div>' +
      '</section>';
  } catch (error) {
    console.error('Error loading job:', error);
    container.innerHTML = '<p class="page-subtitle">Error loading job. <a href="jobs.html">Back to jobs</a></p>';
  }
});

function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
