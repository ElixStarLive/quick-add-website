# Card payments & customer data — what you need (UK)

## Do you need a payment licence?

**No — not for how QuickPost Ads works today.**

You are **not** running your own bank or payment company. **Stripe** is the licensed payment processor (FCA-authorised in the UK). Your site sends customers to Stripe’s secure card form; Stripe handles the money and card security.

You need a **Stripe account** (merchant account), not a separate FCA payment institution licence.

---

## How customer cards are protected (already built in)

| What | Who handles it |
|------|----------------|
| Card number, CVV, expiry | **Stripe only** — never saved on your server |
| PCI DSS compliance (card security rules) | **Stripe** (Level 1 certified) |
| HTTPS encryption | Your hosting (must use SSL on live site) |
| Payment confirmation | Your server stores only Stripe payment ID + email + amount |

Your site uses **Stripe Payment Element** — the card fields load inside Stripe’s secure iframe. This is the **lowest PCI burden** (SAQ A): you do not touch raw card data.

**Never** add code that logs or saves card numbers in your database, logs, or emails.

---

## What you DO need for UK customer data (GDPR)

1. **Privacy Policy** — updated on your site (covers Stripe, what you store, UK GDPR rights).

2. **Terms of Service** — payment and refund rules.

3. **ICO registration** (likely required)  
   If you process personal data as a business in the UK (emails, phones, job posts), register with the Information Commissioner’s Office:  
   https://ico.org.uk/for-organisations/data-protection-fee/  
   Fee is typically **£40–£60 per year** for small businesses.

4. **HTTPS on production** — mandatory (`https://quickpostads.co.uk`).

5. **Keep `.env` secret** — Stripe keys must never be public or in git.

6. **Stripe Dashboard**  
   - Complete Stripe account verification (identity/business details)  
   - Enable live payments only after verification  
   - Set up webhook for payment confirmations  

---

## Checklist before taking live card payments

- [ ] Stripe account fully verified for **live** mode  
- [ ] Site served over **HTTPS** only  
- [ ] `NODE_ENV=production` on server  
- [ ] Privacy Policy and Terms live on site  
- [ ] ICO data protection fee paid (if applicable)  
- [ ] Webhook configured: `https://quickpostads.co.uk/api/stripe/webhook`  
- [ ] Test one real payment, then refund in Stripe if needed  

---

## If a customer asks “Is my card safe?”

You can say:

> “Payments are processed by Stripe, a regulated payment provider. Your card details go directly to Stripe and are not stored on QuickPost Ads. We only keep a payment receipt reference so you are not charged twice for the same unlock.”

---

## Optional (recommended later)

- Cookie notice if you add analytics cookies  
- Dedicated refund/contact process for payment disputes  
- Professional legal review of Terms/Privacy for your exact business structure  

This is general guidance, not legal advice. For your company structure (sole trader vs Ltd), consider a brief review with a UK solicitor or accountant.
