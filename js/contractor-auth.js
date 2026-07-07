/** Contractor account — registration, login, subscription gate */
const CONTRACTOR_TOKEN_KEY = 'quickpostContractorToken';

function getContractorToken() {
  return localStorage.getItem(CONTRACTOR_TOKEN_KEY) || '';
}

function setContractorToken(token) {
  const value = String(token || '').trim();
  if (value) localStorage.setItem(CONTRACTOR_TOKEN_KEY, value);
  else localStorage.removeItem(CONTRACTOR_TOKEN_KEY);
}

function clearContractorSession() {
  localStorage.removeItem(CONTRACTOR_TOKEN_KEY);
}

function contractorAuthHeaders() {
  const token = getContractorToken();
  return token ? { Authorization: 'Bearer ' + token } : {};
}

async function contractorFetch(url, options) {
  const opts = options || {};
  opts.headers = Object.assign({}, opts.headers || {}, contractorAuthHeaders());
  if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(url, opts);
}

async function fetchContractorMe() {
  const token = getContractorToken();
  if (!token) return null;
  try {
    const res = await contractorFetch('/api/contractors/me');
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) clearContractorSession();
      return null;
    }
    return data.contractor || null;
  } catch (e) {
    return null;
  }
}

async function contractorLogin(email, password) {
  const res = await fetch('/api/contractors/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setContractorToken(data.token);
  if (data.contractor && data.contractor.email && typeof setStoredUserEmail === 'function') {
    setStoredUserEmail(data.contractor.email);
  }
  return data.contractor;
}

async function contractorRegister(payload) {
  const res = await fetch('/api/contractors/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setContractorToken(data.token);
  if (data.contractor && data.contractor.email && typeof setStoredUserEmail === 'function') {
    setStoredUserEmail(data.contractor.email);
  }
  return data.contractor;
}

async function startProSubscription() {
  const res = await contractorFetch('/api/contractors/subscribe', { method: 'POST', body: { plan: 'pro' } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not start checkout');
  if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  return data;
}

async function confirmProSubscription(sessionId) {
  const res = await contractorFetch('/api/contractors/confirm-subscription', {
    method: 'POST',
    body: { session_id: sessionId }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not confirm subscription');
  return data.contractor;
}

async function unlockJobWithSubscription(jobId) {
  const res = await contractorFetch('/api/jobs/' + encodeURIComponent(jobId) + '/unlock-subscriber', {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not unlock job');
  return data.job;
}

function renderContractorPaywall(container, options) {
  const opts = options || {};
  const code = opts.code || 'LOGIN_REQUIRED';
  const jobCount = opts.jobCount;
  const countText = typeof jobCount === 'number' && jobCount > 0
    ? '<p class="contractor-paywall-count"><strong>' + jobCount + '</strong> live job' + (jobCount === 1 ? '' : 's') + ' waiting — register and subscribe to view them.</p>'
    : '';

  if (code === 'SUBSCRIPTION_REQUIRED') {
    container.innerHTML =
      '<div class="contractor-paywall">' +
        '<div class="contractor-paywall-icon" aria-hidden="true">🔒</div>' +
        '<h2>Pro subscription required</h2>' +
        countText +
        '<p>There is no free job browsing. Subscribe to Pro (&pound;29.99/month) for unlimited job access and contact unlocks.</p>' +
        '<div class="contractor-paywall-actions">' +
          '<button type="button" class="btn btn-primary" id="paywall-subscribe-btn">Subscribe to Pro</button>' +
          '<a href="pricing.html" class="btn btn-outline">View pricing</a>' +
        '</div>' +
        (opts.loggedIn ? '<p class="form-hint">Logged in as ' + escPaywall(opts.email) + ' · <a href="#" id="paywall-logout">Log out</a></p>' : '') +
      '</div>';
    document.getElementById('paywall-subscribe-btn')?.addEventListener('click', function () {
      startProSubscription().catch(function (err) { alert(err.message); });
    });
  } else {
    container.innerHTML =
      '<div class="contractor-paywall">' +
        '<div class="contractor-paywall-icon" aria-hidden="true">👷</div>' +
        '<h2>Contractors: register to view jobs</h2>' +
        countText +
        '<p>Job listings are for registered, paying contractors only. Homeowners post free — you subscribe to browse and unlock leads.</p>' +
        '<div class="contractor-paywall-actions">' +
          '<a href="contractor-register.html" class="btn btn-primary">Register as contractor</a>' +
          '<a href="dashboard.html" class="btn btn-outline">Log in</a>' +
        '</div>' +
      '</div>';
  }

  document.getElementById('paywall-logout')?.addEventListener('click', function (e) {
    e.preventDefault();
    clearContractorSession();
    window.location.reload();
  });
}

function escPaywall(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
