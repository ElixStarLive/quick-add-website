# Launch QuickPost Ads today

## 1. Server requirements
- **Node.js 18+** VPS or Railway/Render (not plain HTML hosting)
- Domain pointed to server (e.g. `quickpostads.co.uk`)
- HTTPS enabled (Let's Encrypt / host SSL)

## 2. Environment variables (`.env` on server)

```env
NODE_ENV=production
PORT=3000
SITE_URL=https://quickpostads.co.uk

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

ADMIN_SECRET=long_random_string
SESSION_SECRET=another_long_random_string

DATABASE_PATH=/data/quickpost.db   # use a persistent volume path
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Deploy steps (VPS / IONOS)

```bash
npm install --production
NODE_ENV=production node server.js
```

Use **PM2** to keep it running:
```bash
npm install -g pm2
NODE_ENV=production pm2 start server.js --name quickpost
pm2 save
pm2 startup
```

Nginx reverse proxy → `http://127.0.0.1:3000`

## 4. Stripe setup
1. [Stripe Dashboard](https://dashboard.stripe.com) → API keys (live)
2. Webhook: `https://quickpostads.co.uk/api/stripe/webhook`
3. Event: `payment_intent.succeeded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## 5. Admin panel
- URL: `https://quickpostads.co.uk/admin.html`
- Sign in with `ADMIN_SECRET` from `.env`

## 6. Pre-launch checklist
- [ ] `/api/health` returns `{ ok: true, stripe: true }`
- [ ] Post a test job
- [ ] Unlock contact with card
- [ ] Post shop item (£1)
- [ ] Contact form works
- [ ] Dashboard loads with email
- [ ] `.env` not uploaded to git

## 7. Production features enabled
- Real Stripe payments (mock disabled in production)
- £1 shop listing payments
- Contact details hidden until unlock
- Protected admin API
- Rate limiting
- Contact form → database
- Dashboard (posted jobs + unlocks)
- No sample data in production
