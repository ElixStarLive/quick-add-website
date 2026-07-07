/**
 * Create (or reuse) Stripe Pro subscription price — run once on server:
 *   node scripts/setup-stripe-subscription.js
 * Add printed price id to .env as STRIPE_PRO_PRICE_ID=
 */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCT_NAME = 'QuickPostAds Pro';
const PRICE_PENCE = 2999;

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY missing in .env');
    process.exit(1);
  }

  const existingId = String(process.env.STRIPE_PRO_PRICE_ID || '').trim();
  if (existingId) {
    const price = await stripe.prices.retrieve(existingId);
    console.log('STRIPE_PRO_PRICE_ID already set:', price.id, '—', price.unit_amount / 100, price.currency);
    return;
  }

  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find((p) => p.name === PRODUCT_NAME);
  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: 'Unlimited job browsing and contact unlocks for UK contractors'
    });
    console.log('Created product:', product.id);
  } else {
    console.log('Using product:', product.id);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = prices.data.find((p) => p.recurring?.interval === 'month' && p.unit_amount === PRICE_PENCE);
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'gbp',
      unit_amount: PRICE_PENCE,
      recurring: { interval: 'month' }
    });
    console.log('Created price:', price.id);
  } else {
    console.log('Using price:', price.id);
  }

  console.log('\nAdd to .env on server:\nSTRIPE_PRO_PRICE_ID=' + price.id);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
