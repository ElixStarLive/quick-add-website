document.addEventListener('DOMContentLoaded', async () => {
  const paymentSection = document.getElementById('payment-section');
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job');

  if (!jobId) {
    paymentSection.innerHTML = '<p class="page-subtitle">Invalid job ID</p>';
    return;
  }

  const storedEmail = typeof getStoredUserEmail === 'function' ? getStoredUserEmail() : '';

  if (urlParams.get('redirect_status') === 'succeeded' && urlParams.get('payment_intent') && storedEmail) {
    try {
      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: urlParams.get('payment_intent'),
          job_id: jobId,
          payer_email: storedEmail
        })
      });
      const confirmData = await confirmRes.json();
      if (confirmRes.ok && confirmData.job) {
        showContactInfo(confirmData.job);
        return;
      }
    } catch (error) {
      console.error('Clearpay/card return confirm error:', error);
    }
  }

  if (storedEmail) {
    try {
      const checkResponse = await fetch(`/api/jobs/${jobId}/unlock-status?email=${encodeURIComponent(storedEmail)}`);
      const checkData = await checkResponse.json();
      if (checkData.unlocked) {
        showContactInfo(checkData.job);
        return;
      }
    } catch (error) {
      console.error('Error checking unlock status:', error);
    }
  }

  try {
    const [jobRes, stripeRes] = await Promise.all([
      fetch(`/api/jobs/${jobId}`),
      fetch('/api/stripe/config')
    ]);
    const jobData = await jobRes.json();
    const stripeConfig = await stripeRes.json();

    if (!jobData.job) {
      paymentSection.innerHTML = '<p class="page-subtitle">Job not found</p>';
      return;
    }

    const job = jobData.job;
    const budget = job.budget || job.salary || '';
    const unlockFee = job.unlock_fee_display || '£5.00';
    const stripeEnabled = stripeConfig.stripeEnabled && stripeConfig.publishableKey;
    const payHint = typeof STRIPE_PAYMENT_HINT !== 'undefined' ? STRIPE_PAYMENT_HINT : 'Secure payment by Stripe.';

    paymentSection.innerHTML = `
      <div class="job-card" style="margin-bottom: 1.5rem;">
        <h3 style="margin-top: 0;">${escapeHtml(job.title)}</h3>
        <p class="job-budget">Customer budget: ${escapeHtml(budget)}</p>
        <p class="job-location">${escapeHtml(job.location || 'UK')}</p>
      </div>
      <div class="form-notice" style="margin-bottom: 1.25rem;">
        <strong>Unlock fee: ${escapeHtml(unlockFee)}</strong> — pay once to see full job details and customer contact.
      </div>
      <div class="form-page" style="max-width: 480px; margin: 0;">
        <form id="payment-form">
          <div class="form-group">
            <label for="email">Your email (for payment receipt) *</label>
            <input type="email" id="email" name="email" required value="${escapeHtml(storedEmail)}" placeholder="your@email.com" autocomplete="email">
            <p class="form-hint">Use your business email. Site contact: info@QuickPostAds.co.uk</p>
          </div>
          <div id="payment-element-wrap" style="display:none;">
            <div id="payment-element" style="margin-bottom: 1rem;"></div>
          </div>
          <p class="form-hint" id="pay-hint">${escapeHtml(payHint)}</p>
          <button type="submit" class="btn btn-primary" id="pay-btn">${stripeEnabled ? 'Pay ' + escapeHtml(unlockFee) + ' and unlock' : 'Unlock (test mode)'}</button>
        </form>
      </div>
    `;

    const form = document.getElementById('payment-form');
    const emailInput = document.getElementById('email');
    const payBtn = document.getElementById('pay-btn');
    let stripeClient;
    let elements;
    let clientSecret;
    let paymentElement;
    let currentEmail = '';

    async function initStripePayment(email) {
      if (!stripeEnabled || !email || email === currentEmail && clientSecret) return;
      currentEmail = email;
      setStoredUserEmail(email);
      payBtn.disabled = true;
      payBtn.textContent = 'Loading payment…';

      const intentRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, payer_email: email })
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentData.error || 'Could not start payment');

      clientSecret = intentData.clientSecret;
      if (!stripeClient) stripeClient = window.Stripe(stripeConfig.publishableKey);

      if (paymentElement) paymentElement.unmount();
      const mounted = typeof mountStripePaymentElement === 'function'
        ? mountStripePaymentElement(stripeClient, clientSecret, '#payment-element')
        : null;
      if (mounted) {
        elements = mounted.elements;
        paymentElement = mounted.paymentElement;
      } else {
        elements = stripeClient.elements({ clientSecret });
        paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
      }
      document.getElementById('payment-element-wrap').style.display = 'block';
      payBtn.disabled = false;
      payBtn.textContent = `Pay ${intentData.unlock_fee_display || unlockFee} and unlock`;
    }

    if (stripeEnabled) {
      emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && email.includes('@')) {
          initStripePayment(email).catch((err) => alert(err.message));
        }
      });
      if (storedEmail) {
        initStripePayment(storedEmail).catch((err) => console.error(err));
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) return;

        try {
          if (!clientSecret) await initStripePayment(email);

          payBtn.disabled = true;
          payBtn.textContent = 'Processing…';

          const returnUrl = typeof stripeUnlockReturnUrl === 'function'
            ? stripeUnlockReturnUrl(jobId)
            : `${window.location.origin}${window.location.pathname}?job=${encodeURIComponent(jobId)}`;

          const { error, paymentIntent } = await stripeClient.confirmPayment({
            elements,
            confirmParams: {
              receipt_email: email,
              return_url: returnUrl
            },
            redirect: 'if_required'
          });
          if (error) throw new Error(error.message);

          const confirmRes = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_intent_id: paymentIntent.id,
              job_id: jobId,
              payer_email: email
            })
          });
          const confirmData = await confirmRes.json();
          if (!confirmRes.ok) throw new Error(confirmData.error || 'Payment confirmation failed');
          showContactInfo(confirmData.job);
        } catch (err) {
          alert(err.message || 'Payment failed. Please try again.');
          payBtn.disabled = false;
          payBtn.textContent = `Pay ${unlockFee} and unlock`;
        }
      });
    } else {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) return;
        setStoredUserEmail(email);
        payBtn.disabled = true;

        try {
          const paymentResponse = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobId, payer_email: email })
          });
          const paymentData = await paymentResponse.json();
          if (paymentData.job) showContactInfo(paymentData.job);
          else throw new Error(paymentData.error || 'Payment failed');
        } catch (err) {
          alert(err.message || 'Payment failed.');
          payBtn.disabled = false;
        }
      });
    }
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
      <strong style="color: #28a745;">Payment successful!</strong> You have unlocked the contact details for this job.
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
