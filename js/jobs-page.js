/** Find Jobs page — trade filters and job listings */
(function () {
  var TRADE_FILTERS = [
    { label: 'Building', q: 'building', icon: 'building' },
    { label: 'Plumbing', q: 'plumbing', icon: 'tap' },
    { label: 'Electrical', q: 'electrical', icon: 'electrical' },
    { label: 'Roofing', q: 'roof', icon: 'roof' },
    { label: 'Cleaning', q: 'cleaning', icon: 'cleaning' },
    { label: 'Painting', q: 'painting', icon: 'paint' },
    { label: 'Flooring', q: 'flooring', icon: 'floor' },
    { label: 'Windows', q: 'UPVC', icon: 'upvc' },
    { label: 'Garden', q: 'garden', icon: 'garden' },
    { label: 'Handyman', q: 'handyman', icon: 'handyman' },
    { label: 'Removals', q: 'removal', icon: 'removal' }
  ];

  function esc(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return 'Recently posted';
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Recently posted';
    }
  }

  function renderTradeFilters(containerId, activeQuery) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var active = String(activeQuery || '').toLowerCase();
    el.innerHTML = TRADE_FILTERS.map(function (cat) {
      var isActive = active === cat.q.toLowerCase();
      var iconHtml = typeof qpIconBox === 'function' ? qpIconBox(cat.icon) : '';
      var cls = 'jobs-filter-chip' + (isActive ? ' jobs-filter-chip-active' : '');
      var href = isActive ? 'jobs.html' : 'jobs.html?q=' + encodeURIComponent(cat.q);
      return '<a href="' + href + '" class="' + cls + '">' + iconHtml + '<span>' + esc(cat.label) + '</span></a>';
    }).join('');
  }

  function renderJobCard(job) {
    var fee = job.unlock_fee_display || 'See price';
    var budget = job.budget ? esc(job.budget) : 'Budget on request';
    var location = esc(job.location || 'UK');
    var posted = formatDate(job.created_at);
    return (
      '<article class="job-card job-card-pro">' +
        '<div class="job-card-top">' +
          '<div class="job-card-heading">' +
            '<p class="job-card-type">Homeowner listing</p>' +
            '<h3><a href="job-detail.html?id=' + esc(job.id) + '">' + esc(job.title) + '</a></h3>' +
          '</div>' +
          '<span class="job-status-badge">Open</span>' +
        '</div>' +
        '<div class="job-card-meta">' +
          '<span class="job-meta-pill"><svg class="icon-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> ' + location + '</span>' +
          '<span class="job-meta-pill job-meta-budget">' + budget + '</span>' +
          '<span class="job-meta-pill">' + esc(posted) + '</span>' +
        '</div>' +
        '<p class="job-contact-locked"><span class="icon-lock" aria-hidden="true">🔒</span> Full job details and homeowner contact are locked until you unlock this lead.</p>' +
        '<div class="job-card-actions">' +
          '<a href="job-detail.html?id=' + esc(job.id) + '" class="btn btn-outline btn-sm">View details</a>' +
          '<a href="payment-unlock.html?job=' + esc(job.id) + '" class="unlock-btn">Unlock contact – ' + esc(fee) + '</a>' +
          '<a href="contact.html?report=job&id=' + esc(job.id) + '" class="ad-card-report">Report</a>' +
        '</div>' +
      '</article>'
    );
  }

  function renderEmptyState(filterQuery, rawQuery) {
    if (filterQuery) {
      return (
        '<div class="jobs-empty-state">' +
          '<h3>No jobs for &ldquo;' + esc(rawQuery) + '&rdquo; yet</h3>' +
          '<p>Try another trade or post this job free — contractors will see it on Find Jobs.</p>' +
          '<div class="jobs-empty-actions">' +
            '<a href="post-job.html?work=' + encodeURIComponent(rawQuery) + '" class="btn btn-primary">Post this job free</a>' +
            '<a href="jobs.html" class="btn btn-outline">View all jobs</a>' +
          '</div>' +
        '</div>'
      );
    }
    return (
      '<div class="jobs-empty-state">' +
        '<div class="jobs-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg></div>' +
        '<h3>No live jobs right now</h3>' +
        '<p>New construction and maintenance jobs appear here as homeowners post them. Check back soon or post a job to get quotes.</p>' +
        '<div class="jobs-empty-actions">' +
          '<a href="post-job.html" class="btn btn-primary">Post a job free</a>' +
          '<a href="for-contractors.html" class="btn btn-outline">For contractors</a>' +
        '</div>' +
      '</div>'
    );
  }

  async function loadJobs() {
    var jobsContainer = document.getElementById('jobs-container');
    var countEl = document.getElementById('jobs-count');
    if (!jobsContainer) return;

    var params = new URLSearchParams(window.location.search);
    var filterQuery = (params.get('q') || '').trim().toLowerCase();
    var rawQuery = params.get('q') || '';
    var searchInput = document.getElementById('jobs-search-input');
    var locationInput = document.getElementById('jobs-location-input');
    if (searchInput && params.get('q')) searchInput.value = params.get('q');
    if (locationInput && params.get('location')) locationInput.value = params.get('location');

    renderTradeFilters('jobs-cat-strip', filterQuery);

    try {
      var response = await fetch('/api/jobs');
      var data = await response.json();
      var jobs = data.jobs || [];
      if (filterQuery) {
        jobs = jobs.filter(function (j) {
          return String(j.title || '').toLowerCase().includes(filterQuery);
        });
      }
      var locFilter = (params.get('location') || '').trim().toLowerCase();
      if (locFilter) {
        jobs = jobs.filter(function (j) {
          return String(j.location || '').toLowerCase().includes(locFilter);
        });
      }

      if (countEl) {
        countEl.textContent = jobs.length
          ? jobs.length + ' job' + (jobs.length === 1 ? '' : 's') + ' available'
          : 'No jobs listed yet';
      }

      if (jobs.length > 0) {
        jobsContainer.innerHTML = jobs.map(renderJobCard).join('');
      } else {
        jobsContainer.innerHTML = renderEmptyState(filterQuery, rawQuery);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobsContainer.innerHTML =
        '<div class="jobs-empty-state"><h3>Could not load jobs</h3><p>Please refresh the page or try again in a moment.</p></div>';
      if (countEl) countEl.textContent = '';
    }
  }

  document.addEventListener('DOMContentLoaded', loadJobs);
})();
