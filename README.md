# QuickPost Ads – Classified ads website

A simple adult-oriented classified ads site with age verification, legal pages, and compliance structure.

## What’s included

- **Age verification (18+)** – `age-verify.html` is shown first; users must confirm they are 18+ before entering. Legal pages (Terms, Privacy, Content rules, Age policy) are accessible without verification.
- **Home page** – Hero, search bar, category grid, recent ads, Report on each ad
- **Post an ad** – Form with category, identity verification placeholders (email, phone, ID upload), moderation notice, CAPTCHA placeholder
- **Categories** – Adult (Escorts, Massage, Webcam, Adult entertainment) + Jobs, Local services, Other
- **Search ads** – Search + category filter, Report on each ad
- **Contact** – Contact form with Report option and CAPTCHA placeholder
- **Legal pages** – Terms of Service, Privacy Policy, Content Rules, Age Policy (required for compliance)
- **Job board (pay-per-lead)** – Employer posts a job (title, description, salary, location, contact hidden). Job seeker sees the job and pays £5 to unlock contact. See below.

**Entry point:** Opening `index.html` (or any main page) redirects to `age-verify.html` until the user confirms 18+. Then they can use the site. All main pages load `js/age-gate.js` to enforce this.

## Your launch checklist

### 1. Choose your niche
Don’t do everything at once. Examples:
- Jobs in [your city]
- Local services
- Used electronics
- Cars for sale / property rentals

### 2. Name + domain
Pick a simple name (e.g. londonads.co.uk, quickpostads.com).  
Buy a domain from **GoDaddy** or **Namecheap** (~£8–£15/year).

### 3. Hosting
Use **Hostinger** or **SiteGround** (~£3–£10/month). Upload this folder via FTP or use their file manager.

### 4. Build further
- **Option A:** Keep this as a static site and hook forms to a form service (e.g. Formspree, Netlify Forms).
- **Option B:** Move to **WordPress** and use a classified ads plugin for real ad posting, user accounts, and payments.

### 5. Launch with free ads
- Allow free posting at the start.
- Add the first ads yourself.
- Invite friends or local businesses so the site looks active.

### 6. Monetize later
When you have traffic, consider:
- Featured / top listing ads
- Top placement ads
- Subscription or business accounts
- **Payment providers:** Many restrict adult content; check Stripe, PayPal, etc. policies and use compliant processors.

### 7. Promote
- Facebook groups, local businesses, Instagram
- SEO (good titles, descriptions, and a sitemap)

## Job board – how it works

**Step 1 – Employer posts a job**  
`post-job.html`: Employer fills in job title, description, salary, location, and their contact (email/phone). Contact is **hidden** from the public. Jobs are approved before going live.

**Step 2 – Job seeker sees the job**  
`jobs.html` and `job-detail.html`: Visitors see title, description, city, salary. Contact details are hidden. Each job has an **Unlock Contact – £5** button.

**Step 3 – Job seeker pays £5**  
`payment-unlock.html`: User enters email and pays (Stripe/PayPal to be connected). After payment → `unlock-success.html` shows employer phone/email and “We’ve emailed you the details.” In production: save the lead in the database and send contact by email.

**Pages:** Home (latest jobs), Job page (detail + Unlock + Report), Post a job, **Dashboard** (jobs I posted + leads I bought), **Admin panel** (approve jobs, manage users).

**Database**  
See `database-schema.sql`: **users** (id, name, email, **password**, phone), **jobs** (title, description, location, contact_email, contact_phone, status, is_featured, is_urgent), **payments** (user_id, job_id, amount, payment_status, payer_email). `UNIQUE(job_id, payer_email)` = 1 unlock per job per user.

**Prevent problems:** Job approval before publishing (admin), phone/email verification, **Report job** on every listing.

**Extra revenue:** Featured job £20, Urgent job £10 (on post-job form), employer subscription later. **Tip:** Add jobs yourself at the start, invite local businesses, free posting for employers — pay-per-lead works when jobs are real.

## Growth plan (job board)

- **Add the first jobs yourself** — Manually add jobs (from Indeed, LinkedIn, Gumtree, etc.). Use job title, description, company name, link/contact. Always rewrite text; do not copy copyrighted content.
- **Free posting for employers** — “Post jobs free for the first 3 months.” Charge later (e.g. £10 per job or £5 per lead). See `for-employers.html` and the banner on `post-job.html`.
- **Contact local businesses** — Email cleaning companies, warehouses, restaurants, construction, delivery services. Sample message is on the For employers page.
- **Facebook groups** — Post in “Jobs in London”, “London hiring”, “Warehouse jobs UK” with a short free-listing offer. Template on For employers page.
- **Target recruiters** — LinkedIn outreach: free bulk posting, featured listings. One recruiter can add 50–100 jobs.
- **Import jobs** — Use job feeds or APIs (company career pages, recruitment feeds, RSS) to add many listings automatically.
- **Incentivize** — Free featured jobs, top placement, email promotion.

**Example growth:** Week 1 add ~100 jobs yourself → Week 2 ten companies post 5 each (+50) → Week 3 five recruiters add 20 each (+100) → Week 4 job feed (+250) → **≈ 500+ listings.**

**5-phase roadmap** (`roadmap.html`): Phase 1 Seed (0→500 jobs), Phase 2 Employer relationships (500→2k), Phase 3 Automate inflows (2k→5k), Phase 4 Large employers (5k→10k), Phase 5 Quality & trust. Extra tips: social proof (“X+ jobs posted”), hot niches, analytics, expiry reminders. Custom roadmap to 10k in 3–6 months: contact.

## Compliance (important)

- **Age verification:** Implemented via `age-verify.html` and `js/age-gate.js`. For production, consider stronger verification (e.g. ID or third-party age-check) if required by law.
- **Identity verification:** Placeholders on Post an ad for email, phone, and ID upload. Connect to a real verification service for advertisers.
- **Content moderation:** Manual approval and report flow are referenced; add a moderator dashboard and automated filters (banned words, spam) on the backend.
- **Legal pages:** Fill in [Date] and any jurisdiction-specific wording in `terms-of-service.html`, `privacy-policy.html`, `content-rules.html`, `age-policy.html`. Get legal advice for UK Online Safety Act and other laws.
- **CAPTCHA:** Placeholders on Post an ad and Contact. Add reCAPTCHA or similar to reduce bots and spam.
- **Security:** Add spam detection, secure storage for IDs, and safe handling of reports.

## Customise

- Replace “QuickPost Ads” with your brand name in every HTML file.
- Change colours in `css/style.css` (see `:root` at the top).
- Add your real contact email in `contact.html`.
- Add or change categories in the category grid, search select, and post-ad form.
- Replace CAPTCHA placeholders with a real CAPTCHA service.

## Simple success formula

**Pick niche → Build simple site → Add ads → Get users → Start charging.**
