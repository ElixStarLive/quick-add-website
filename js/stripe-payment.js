/** Shared Stripe Payment Element helpers (card, Clearpay, Klarna, etc.) */
const STRIPE_PAYMENT_HINT =
  'Pay by card, Clearpay (pay in 4), Klarna, or other methods shown below. Processed securely by Stripe.';

function mountStripePaymentElement(stripeClient, clientSecret, mountSelector) {
  const elements = stripeClient.elements({ clientSecret });
  const paymentElement = elements.create('payment', {
    layout: 'tabs',
    paymentMethodOrder: ['card', 'afterpay_clearpay', 'klarna', 'link']
  });
  paymentElement.mount(mountSelector);
  return { elements, paymentElement };
}

function stripeUnlockReturnUrl(jobId) {
  const url = new URL(window.location.href);
  url.search = `job=${encodeURIComponent(jobId)}`;
  return url.toString();
}

function stripeListingReturnUrl() {
  return window.location.origin + window.location.pathname + '?listing_payment=1';
}

function saveListingDraft(form) {
  const draft = {
    category: form.querySelector('#category')?.value,
    title: form.querySelector('#title')?.value,
    description: form.querySelector('#description')?.value,
    location: form.querySelector('#location')?.value,
    price: form.querySelector('#price')?.value,
    contact_email: form.querySelector('#contact')?.value,
    contact_phone: form.querySelector('#phone')?.value
  };
  try {
    sessionStorage.setItem('quickpostListingDraft', JSON.stringify(draft));
  } catch (_) {
    /* ignore */
  }
}

function loadListingDraft() {
  try {
    const raw = sessionStorage.getItem('quickpostListingDraft');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearListingDraft() {
  try {
    sessionStorage.removeItem('quickpostListingDraft');
  } catch (_) {
    /* ignore */
  }
}
