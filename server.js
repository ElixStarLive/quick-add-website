const express = require('express');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  buildEstimate
} = require('./lib/uk-pricing-engine');
const {
  parseSeoPagePath,
  parseLegacyCompoundSlug,
  listSeoPageSlugs
} = require('./lib/seo-pages-data');
const {
  renderSeoLandingPage,
  renderSeoSitemap
} = require('./lib/seo-page-render');
const {
  MARKETPLACE_HUB,
  MARKETPLACE_CATEGORIES,
  getMarketplaceCategory
} = require('./lib/section-pages-data');
const {
  renderSectionHub,
  renderSectionCategory
} = require('./lib/section-page-render');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || (process.env.RAILWAY_ENVIRONMENT ? 'production' : 'development');
const IS_PRODUCTION = NODE_ENV === 'production';
function envTrim(name) {
  return String(process.env[name] || '').trim();
}

function normalizeSqlitePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/^sqlite:/i, '');
}

const ADMIN_SECRET = envTrim('ADMIN_SECRET');
const SESSION_SECRET = envTrim('SESSION_SECRET');
const SITE_URL = envTrim('SITE_URL').replace(/\/$/, '');
function resolveDbPath() {
  const raw = normalizeSqlitePath(envTrim('DATABASE_PATH')) || normalizeSqlitePath(envTrim('DATABASE_URL'));
  if (!raw) return path.join(__dirname, 'quickpost.db');
  return path.isAbsolute(raw) ? raw : path.join(__dirname, raw);
}
const DB_PATH = resolveDbPath();
const LISTING_FEE_PENCE = 100;
const PRO_PLAN_PRICE_PENCE = 2999;
const STRIPE_PRO_PRICE_ID = envTrim('STRIPE_PRO_PRICE_ID');
const STRIPE_PUBLISHABLE_KEY = envTrim('STRIPE_PUBLISHABLE_KEY') || envTrim('VITE_STRIPE_PUBLISHABLE_KEY');
const CONTRACTOR_JWT_SECRET = SESSION_SECRET || 'dev-contractor-secret-change-me';

app.set('trust proxy', 1);

function validateProductionConfig() {
  if (!IS_PRODUCTION) return;
  const checks = {
    STRIPE_SECRET_KEY: envTrim('STRIPE_SECRET_KEY'),
    STRIPE_PUBLISHABLE_KEY,
    ADMIN_SECRET,
    SESSION_SECRET
  };
  const missing = [];
  if (!checks.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!checks.STRIPE_PUBLISHABLE_KEY) missing.push('STRIPE_PUBLISHABLE_KEY (or VITE_STRIPE_PUBLISHABLE_KEY)');
  if (!checks.ADMIN_SECRET || checks.ADMIN_SECRET.includes('your_')) missing.push('ADMIN_SECRET');
  if (!checks.SESSION_SECRET || checks.SESSION_SECRET.includes('your_')) missing.push('SESSION_SECRET');
  if (!envTrim('STRIPE_WEBHOOK_SECRET')) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — subscription renewals/cancellations may not sync automatically.');
  }
  if (missing.length) {
    console.error('Production startup blocked. Missing or empty:', missing.join(', '));
    console.error('Env present (true/false, values not shown):', {
      STRIPE_SECRET_KEY: Boolean(checks.STRIPE_SECRET_KEY),
      STRIPE_PUBLISHABLE_KEY: Boolean(checks.STRIPE_PUBLISHABLE_KEY),
      ADMIN_SECRET: Boolean(checks.ADMIN_SECRET),
      SESSION_SECRET: Boolean(checks.SESSION_SECRET),
      NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not set'
    });
    process.exit(1);
  }
}

validateProductionConfig();

const BLOCKED_STATIC = new Set([
  'server.js', 'package.json', 'package-lock.json', '.env', '.env.example',
  'quickpost.db', '.gitignore', 'Procfile'
]);

app.use((req, res, next) => {
  const base = path.basename(decodeURIComponent(req.path));
  if (BLOCKED_STATIC.has(base) || req.path.startsWith('/node_modules')) {
    return res.status(404).end();
  }
  next();
});

function ensureHtmlLang(html) {
  if (typeof html !== 'string' || !/<html[\s>]/i.test(html)) return html;
  return html.replace(/<html([^>]*)>/i, (match, attrs) => {
    const cleaned = String(attrs || '').replace(/\s*lang\s*=\s*["'][^"']*["']/gi, '');
    return `<html lang="en-GB"${cleaned}>`;
  });
}

app.use((req, res, next) => {
  const originalSend = res.send.bind(res);
  res.send = function sendWithLang(body) {
    const type = res.getHeader('Content-Type');
    const isHtml = (typeof type === 'string' && type.includes('text/html'))
      || (typeof body === 'string' && /<html[\s>]/i.test(body));
    if (isHtml && typeof body === 'string') {
      if (!res.getHeader('Content-Language')) {
        res.setHeader('Content-Language', 'en-GB');
      }
      return originalSend(ensureHtmlLang(body));
    }
    return originalSend(body);
  };
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  },
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false,
  frameguard: { action: 'sameorigin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));

app.use(compression());
app.use(cors(IS_PRODUCTION && SITE_URL ? { origin: SITE_URL } : {}));

let stripe;
try {
  if (envTrim('STRIPE_SECRET_KEY')) {
    stripe = require('stripe')(envTrim('STRIPE_SECRET_KEY'));
  } else if (IS_PRODUCTION) {
    console.error('STRIPE_SECRET_KEY is required in production');
    process.exit(1);
  }
} catch (e) {
  console.error('Stripe init failed:', e.message);
  if (IS_PRODUCTION) process.exit(1);
}

/** Stripe PaymentIntent — card + Clearpay (UK BNPL) + other methods enabled in Dashboard */
function buildStripePaymentIntentOptions({ amount, receipt_email, metadata }) {
  return {
    amount,
    currency: 'gbp',
    receipt_email,
    metadata,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'always'
    }
  };
}

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook not configured');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const dbRef = global.__quickpostDb;
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    if (pi.metadata.type === 'unlock' && pi.metadata.job_id && pi.metadata.payer_email && dbRef) {
      dbRef.run(`INSERT OR IGNORE INTO payments (job_id, amount, payer_email, payment_status, payment_id) VALUES (?, ?, ?, 'paid', ?)`,
        [pi.metadata.job_id, pi.amount / 100, pi.metadata.payer_email, pi.id]);
    }
  }
  if (dbRef && event.type === 'checkout.session.completed') {
    try {
      await activateSubscriptionFromCheckoutSession(dbRef, event.data.object);
    } catch (err) {
      console.error('Webhook subscription activation error:', err.message);
    }
  }
  if (dbRef && (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted')) {
    const sub = event.data.object;
    dbRef.get('SELECT id FROM users WHERE stripe_subscription_id = ?', [sub.id], (err, user) => {
      if (err || !user) return;
      const active = sub.status === 'active' || sub.status === 'trialing';
      const expiresAt = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
      dbRef.run(
        `UPDATE users SET subscription_status = ?, subscription_expires_at = ? WHERE id = ?`,
        [active ? 'active' : sub.status || 'canceled', expiresAt, user.id]
      );
    });
  }
  res.json({ received: true });
});

const rateBuckets = new Map();
function rateLimit(key, max = 60, windowMs = 60000) {
  return (req, res, next) => {
    const id = `${key}:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
    const now = Date.now();
    const bucket = rateBuckets.get(id) || { count: 0, reset: now + windowMs };
    if (now > bucket.reset) {
      bucket.count = 0;
      bucket.reset = now + windowMs;
    }
    bucket.count += 1;
    rateBuckets.set(id, bucket);
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Image uploads
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});
app.use('/uploads', express.static(uploadsDir));

// Initialize SQLite database
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  global.__quickpostDb = db;
  console.log('Connected to SQLite database:', DB_PATH);
  initializeDatabase();
});

function initializeDatabase() {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      // Create jobs table after users table
      db.run(`CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        salary TEXT,
        contact_email TEXT NOT NULL,
        contact_phone TEXT,
        status TEXT DEFAULT 'pending',
        is_featured INTEGER DEFAULT 0,
        is_urgent INTEGER DEFAULT 0,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`, (err) => {
        db.run('ALTER TABLE jobs ADD COLUMN image_url TEXT', () => {});
        if (err) {
          console.error('Error creating jobs table:', err.message);
        } else {
          // Create payments table after jobs table
          db.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_status TEXT DEFAULT 'pending',
            payer_email TEXT NOT NULL,
            payment_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (job_id) REFERENCES jobs(id)
          )`, (err) => {
            if (err) {
              console.error('Error creating payments table:', err.message);
            } else {
              db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_job_payer ON payments(job_id, payer_email)`, () => {});
              db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )`, () => {});
              db.run(`ALTER TABLE ads ADD COLUMN listing_payment_id TEXT`, () => {});
              finishDatabaseInit();
            }
          });
        }
      });
    }
  });
}

function finishDatabaseInit() {
  migrateContractorColumns();
  insertForSaleTable();
  if (IS_PRODUCTION) purgeDemoContentQuiet();
}

function migrateContractorColumns() {
  const cols = [
    'user_type TEXT DEFAULT "homeowner"',
    'company_name TEXT',
    'trade TEXT',
    'subscription_plan TEXT DEFAULT "none"',
    'subscription_status TEXT DEFAULT "none"',
    'subscription_expires_at TEXT',
    'stripe_customer_id TEXT',
    'stripe_subscription_id TEXT'
  ];
  cols.forEach((col) => {
    const name = col.split(' ')[0];
    db.run(`ALTER TABLE users ADD COLUMN ${col}`, () => {});
  });
}

function purgeDemoContentQuiet() {
  db.serialize(() => {
    db.run("DELETE FROM payments WHERE job_id IN (SELECT id FROM jobs WHERE contact_email LIKE '%@example.com')");
    db.run("DELETE FROM jobs WHERE contact_email LIKE '%@example.com'");
    db.run("DELETE FROM ads WHERE contact_email LIKE '%@example.com' OR image_url LIKE '/uploads/samples/%'");
    db.run("DELETE FROM users WHERE email LIKE '%@example.com' OR email = 'test@test.com'", () => {
      cleanUploadedFiles();
      console.log('Demo listings removed from production database');
    });
  });
}

// ----- Shop / for-sale items -----
function insertForSaleTable() {
  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    price TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'approved',
    ad_type TEXT DEFAULT 'forsale',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    db.run('ALTER TABLE ads ADD COLUMN image_url TEXT', () => {});
    db.run('ALTER TABLE ads ADD COLUMN listing_payment_id TEXT', () => {});
  });
}

// Budget-based unlock fee (in pence)
function unlockFeePence(salary) {
  const value = parseInt(String(salary || '').replace(/[^0-9]/g, ''), 10) || 0;
  if (value >= 5000) return 2500;
  if (value >= 2000) return 1500;
  if (value >= 800) return 1000;
  if (value >= 300) return 500;
  return 200;
}
function enrichJob(job) {
  if (!job) return job;
  const pence = unlockFeePence(job.salary);
  const { salary, ...rest } = job;
  return { ...rest, budget: job.salary, unlock_fee_pence: pence, unlock_fee_display: `£${(pence / 100).toFixed(2)}` };
}

function publicJob(job, unlocked = false) {
  const e = enrichJob(job);
  const base = {
    id: e.id,
    title: e.title,
    location: e.location,
    budget: e.budget,
    status: e.status,
    created_at: e.created_at,
    image_url: e.image_url,
    is_featured: e.is_featured,
    is_urgent: e.is_urgent,
    locked: !unlocked,
    unlock_fee_pence: e.unlock_fee_pence,
    unlock_fee_display: e.unlock_fee_display
  };
  if (unlocked) {
    base.description = e.description;
    base.contact_email = e.contact_email;
    base.contact_phone = e.contact_phone;
  }
  return base;
}

function contractorPublicProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    company_name: user.company_name,
    trade: user.trade,
    subscription_plan: user.subscription_plan || 'none',
    subscription_status: user.subscription_status || 'none',
    subscription_active: contractorHasActiveSubscription(user),
    subscription_expires_at: user.subscription_expires_at || null
  };
}

function contractorHasActiveSubscription(user) {
  if (!user || user.user_type !== 'contractor') return false;
  if (user.subscription_status !== 'active') return false;
  if (!user.subscription_expires_at) return true;
  return new Date(user.subscription_expires_at).getTime() > Date.now();
}

function signContractorToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'contractor' },
    CONTRACTOR_JWT_SECRET,
    { expiresIn: '14d' }
  );
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return (req.headers['x-contractor-token'] || '').trim();
}

function dbGetUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ? AND user_type = "contractor"', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function dbGetUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function activateContractorSubscription(dbRef, contractorId, { plan, stripeCustomerId, stripeSubscriptionId, expiresAt }) {
  dbRef.run(
    `UPDATE users SET subscription_plan = ?, subscription_status = 'active', subscription_expires_at = ?,
     stripe_customer_id = COALESCE(?, stripe_customer_id), stripe_subscription_id = COALESCE(?, stripe_subscription_id)
     WHERE id = ? AND user_type = 'contractor'`,
    [plan || 'pro', expiresAt, stripeCustomerId || null, stripeSubscriptionId || null, contractorId]
  );
}

async function resolveSubscriptionExpiry(subscriptionRef) {
  if (!stripe || !subscriptionRef) return null;
  try {
    const sub = typeof subscriptionRef === 'object' && subscriptionRef.current_period_end
      ? subscriptionRef
      : await stripe.subscriptions.retrieve(typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id);
    return sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;
  } catch (err) {
    console.error('Subscription lookup error:', err.message);
    return null;
  }
}

async function activateSubscriptionFromCheckoutSession(dbRef, session) {
  if (!session?.metadata?.contractor_id || session.mode !== 'subscription') return;
  const subId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  const expiresAt = await resolveSubscriptionExpiry(session.subscription);
  activateContractorSubscription(dbRef, session.metadata.contractor_id, {
    plan: session.metadata.plan || 'pro',
    stripeCustomerId: session.customer,
    stripeSubscriptionId: subId,
    expiresAt
  });
}

function optionalContractorAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    req.contractor = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, CONTRACTOR_JWT_SECRET);
    if (payload.type !== 'contractor') {
      req.contractor = null;
      return next();
    }
    dbGetUserById(payload.id).then((user) => {
      req.contractor = user;
      next();
    }).catch(() => {
      req.contractor = null;
      next();
    });
  } catch {
    req.contractor = null;
    next();
  }
}

function requireContractorAuth(req, res, next) {
  optionalContractorAuth(req, res, () => {
    if (!req.contractor) {
      return res.status(401).json({
        error: 'Please log in or register as a contractor.',
        code: 'LOGIN_REQUIRED',
        registerUrl: '/contractor-register.html',
        loginUrl: '/dashboard.html'
      });
    }
    next();
  });
}

function requireContractorSubscription(req, res, next) {
  requireContractorAuth(req, res, () => {
    if (!contractorHasActiveSubscription(req.contractor)) {
      return res.status(403).json({
        error: 'An active Pro subscription is required to view jobs.',
        code: 'SUBSCRIPTION_REQUIRED',
        pricingUrl: '/pricing.html'
      });
    }
    next();
  });
}

function countApprovedJobs() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS c FROM jobs WHERE status = "approved"', (err, row) => {
      if (err) reject(err);
      else resolve(row?.c || 0);
    });
  });
}

async function verifyListingPayment(paymentIntentId, sellerEmail) {
  if (!stripe || !paymentIntentId) return false;
  if (IS_PRODUCTION && !paymentIntentId) return false;
  if (!IS_PRODUCTION && !paymentIntentId) return true;
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    return pi.status === 'succeeded'
      && pi.metadata.type === 'listing'
      && pi.metadata.seller_email === sellerEmail
      && pi.amount === LISTING_FEE_PENCE;
  } catch {
    return false;
  }
}

// API Routes

app.post('/api/estimate', rateLimit('estimate', 20, 60000), (req, res) => {
  const { job_type, description, location, budget } = req.body;
  if (!job_type && !description) {
    return res.status(400).json({ error: 'Describe the work type or add a description.' });
  }

  const result = buildEstimate({ job_type, description, location, budget });
  res.json(result);
});

// Get all approved jobs — contractors must be logged in with active subscription
app.get('/api/jobs', optionalContractorAuth, async (req, res) => {
  try {
    if (!req.contractor) {
      const jobCount = await countApprovedJobs();
      return res.status(401).json({
        error: 'Register and subscribe as a contractor to browse jobs.',
        code: 'LOGIN_REQUIRED',
        jobCount,
        registerUrl: '/contractor-register.html',
        loginUrl: '/dashboard.html'
      });
    }
    if (!contractorHasActiveSubscription(req.contractor)) {
      const jobCount = await countApprovedJobs();
      return res.status(403).json({
        error: 'Active Pro subscription required to view jobs. No free job browsing.',
        code: 'SUBSCRIPTION_REQUIRED',
        jobCount,
        pricingUrl: '/pricing.html'
      });
    }
    db.all('SELECT * FROM jobs WHERE status = "approved" ORDER BY created_at DESC', (err, jobs) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const locked = jobs.map((j) => publicJob(j, false));
      res.json({ jobs: locked });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public job count teaser (no job details)
app.get('/api/jobs/teaser', async (req, res) => {
  try {
    const jobCount = await countApprovedJobs();
    res.json({
      jobCount,
      message: 'Register and subscribe to browse live construction jobs.',
      registerUrl: '/contractor-register.html',
      pricingUrl: '/pricing.html'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List for-sale shop items
app.get('/api/ads', (req, res) => {
  const category = (req.query.category || '').trim();
  let sql = `SELECT id, category, title, description, location, price, ad_type, image_url, created_at FROM ads WHERE status = 'approved' AND ad_type = 'forsale'`;
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY created_at DESC LIMIT 100';
  db.all(sql, params, (err, ads) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ ads });
  });
});

// Post a for-sale item (£1 listing fee via Stripe in production)
app.post('/api/ads', rateLimit('ads', 10, 60000), (req, res) => {
  upload.single('image')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message || 'Upload failed' });
    }
    const { category, title, description, location, price, contact_email, contact_phone, payment_intent_id } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : null;
    if (!category || !title || !description || !contact_email) {
      return res.status(400).json({ error: 'Please fill in category, title, description and contact email.' });
    }

    if (IS_PRODUCTION || payment_intent_id) {
      const paid = await verifyListingPayment(payment_intent_id, contact_email);
      if (!paid) {
        return res.status(402).json({ error: '£1 listing payment required before posting.' });
      }
      db.get('SELECT id FROM ads WHERE listing_payment_id = ?', [payment_intent_id], (dupErr, existing) => {
        if (dupErr) return res.status(500).json({ error: dupErr.message });
        if (existing) return res.status(400).json({ error: 'This payment was already used for a listing.' });
        insertAd();
      });
    } else {
      insertAd();
    }

    function insertAd() {
      db.run(`INSERT INTO ads (category, title, description, location, price, contact_email, contact_phone, status, ad_type, image_url, listing_payment_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 'forsale', ?, ?)`,
        [category, title, description, location || '', price || '', contact_email, contact_phone || '', image_url, payment_intent_id || null],
        function (err) {
          if (err) { res.status(500).json({ error: err.message }); return; }
          res.json({ message: 'Item posted live', adId: this.lastID });
        });
    }
  });
});

// Stripe: create PaymentIntent for £1 shop listing
app.post('/api/ads/create-intent', rateLimit('ads-intent', 20, 60000), async (req, res) => {
  const { seller_email } = req.body;
  if (!stripe || !STRIPE_PUBLISHABLE_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured.' });
  }
  if (!seller_email) {
    return res.status(400).json({ error: 'Contact email is required.' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      buildStripePaymentIntentOptions({
        amount: LISTING_FEE_PENCE,
        receipt_email: seller_email,
        metadata: { type: 'listing', seller_email }
      })
    );
    res.json({ clientSecret: paymentIntent.client_secret, amount: LISTING_FEE_PENCE, fee_display: '£1.00' });
  } catch (error) {
    console.error('Listing intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID (contact hidden until unlocked; subscription required to view)
app.get('/api/jobs/:id', optionalContractorAuth, (req, res) => {
  const jobId = req.params.id;
  if (jobId === 'teaser') return res.status(404).json({ error: 'Not found' });

  const payerEmail = (req.query.email || req.contractor?.email || '').trim();

  if (!req.contractor) {
    return res.status(401).json({
      error: 'Register and subscribe as a contractor to view job details.',
      code: 'LOGIN_REQUIRED',
      registerUrl: '/contractor-register.html'
    });
  }
  if (!contractorHasActiveSubscription(req.contractor)) {
    return res.status(403).json({
      error: 'Active Pro subscription required to view this job.',
      code: 'SUBSCRIPTION_REQUIRED',
      pricingUrl: '/pricing.html'
    });
  }

  db.get('SELECT * FROM jobs WHERE id = ? AND status = "approved"', [jobId], (err, job) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (!payerEmail) {
      return res.json({ job: publicJob(job, false) });
    }
    db.get('SELECT id FROM payments WHERE job_id = ? AND payer_email = ? AND payment_status = "paid"',
      [jobId, payerEmail], (payErr, payment) => {
        if (payErr) return res.status(500).json({ error: payErr.message });
        res.json({ job: publicJob(job, Boolean(payment)), unlocked: Boolean(payment) });
      });
  });
});

// Create a new job (goes live instantly)
app.post('/api/jobs', rateLimit('jobs', 10, 60000), (req, res) => {
  upload.single('image')(req, res, (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message || 'Upload failed' });
    }
    const { title, description, location, salary, budget, contact_email, contact_phone, is_featured, is_urgent } = req.body;
    const jobBudget = budget || salary;
    const user_id = 1;
    const image_url = req.file ? '/uploads/' + req.file.filename : null;

    if (!title || !description || !location || !jobBudget || !contact_email) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    db.run(`INSERT INTO jobs (user_id, title, description, location, salary, contact_email, contact_phone, status, is_featured, is_urgent, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`, 
      [user_id, title, description, location, jobBudget, contact_email, contact_phone,
        is_featured === '1' || is_featured === true ? 1 : 0,
        is_urgent === '1' || is_urgent === true ? 1 : 0, image_url],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Job posted', jobId: this.lastID });
      }
    );
  });
});

// Check if job is unlocked for a specific email (contractor must be subscribed)
app.get('/api/jobs/:id/unlock-status', requireContractorSubscription, (req, res) => {
  const jobId = req.params.id;
  const payerEmail = req.query.email || req.contractor.email;
  
  db.get('SELECT * FROM payments WHERE job_id = ? AND payer_email = ? AND payment_status = "paid"', 
    [jobId, payerEmail], (err, payment) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (payment) {
        db.get('SELECT * FROM jobs WHERE id = ?', [jobId], (err, job) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ unlocked: true, job: publicJob(job, true) });
        });
      } else {
        res.json({ unlocked: false, includedInPlan: true });
      }
    }
  );
});

// Pro subscribers unlock contact at no extra cost
app.post('/api/jobs/:id/unlock-subscriber', rateLimit('unlock-sub', 30, 60000), requireContractorSubscription, (req, res) => {
  const jobId = req.params.id;
  const payerEmail = req.contractor.email;

  db.get('SELECT * FROM jobs WHERE id = ? AND status = "approved"', [jobId], (err, job) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    db.get('SELECT id FROM payments WHERE job_id = ? AND payer_email = ? AND payment_status = "paid"',
      [jobId, payerEmail], (payErr, existing) => {
        if (payErr) return res.status(500).json({ error: payErr.message });
        if (existing) {
          return res.json({ success: true, job: publicJob(job, true), message: 'Already unlocked.' });
        }
        db.run(
          `INSERT INTO payments (user_id, job_id, amount, payer_email, payment_status, payment_id) VALUES (?, ?, 0, ?, 'paid', ?)`,
          [req.contractor.id, jobId, payerEmail, `sub-${req.contractor.id}-${jobId}`],
          function (insErr) {
            if (insErr) return res.status(500).json({ error: insErr.message });
            res.json({ success: true, job: publicJob(job, true), message: 'Contact unlocked with your Pro plan.' });
          }
        );
      });
  });
});

// Mock payment — development only
app.post('/api/payments', rateLimit('payments', 20, 60000), async (req, res) => {
  if (IS_PRODUCTION) {
    return res.status(503).json({ error: 'Payments must use Stripe checkout.' });
  }
  const { job_id, payer_email } = req.body;
  if (!job_id || !payer_email) {
    return res.status(400).json({ error: 'Job ID and email are required.' });
  }
  if (stripe) {
    return res.status(400).json({ error: 'Use Stripe checkout on this page.', stripeRequired: true });
  }

  try {
    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM jobs WHERE id = ?', [job_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const feePence = unlockFeePence(job.salary);
    db.run(`INSERT INTO payments (job_id, amount, payer_email, payment_status) VALUES (?, ?, ?, ?)`,
      [job_id, feePence / 100, payer_email, 'paid'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          message: 'Mock payment successful!',
          paymentId: this.lastID,
          job: publicJob(job, true)
        });
      });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe: publishable key for frontend
app.get('/api/stripe/config', (req, res) => {
  res.json({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    stripeEnabled: Boolean(stripe && STRIPE_PUBLISHABLE_KEY),
    paymentMethods: ['card', 'afterpay_clearpay', 'klarna', 'link'],
    clearpayNote: 'Pay in 4 interest-free instalments with Clearpay (UK, £1–£1,200). Enable Clearpay in your Stripe Dashboard → Settings → Payment methods.'
  });
});

// Stripe: create PaymentIntent for job unlock (legacy — Pro plan includes unlocks)
app.post('/api/payments/create-intent', rateLimit('pay-intent', 30, 60000), requireContractorSubscription, async (req, res) => {
  return res.status(400).json({
    error: 'Job unlocks are included in your Pro subscription. Use the unlock button on the job page.',
    code: 'USE_SUBSCRIPTION_UNLOCK'
  });
});

// Stripe: confirm payment and unlock job
app.post('/api/payments/confirm', async (req, res) => {
  const { payment_intent_id, job_id, payer_email } = req.body;
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured.' });
  }
  if (!payment_intent_id || !job_id || !payer_email) {
    return res.status(400).json({ error: 'Missing payment details.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed.', status: paymentIntent.status });
    }
    if (paymentIntent.metadata.job_id !== String(job_id) || paymentIntent.metadata.payer_email !== payer_email) {
      return res.status(400).json({ error: 'Payment details do not match this job.' });
    }

    const amount = paymentIntent.amount / 100;
    db.get('SELECT id FROM payments WHERE payment_id = ? AND payment_status = "paid"', [payment_intent_id], (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });

      const finish = () => {
        db.get('SELECT * FROM jobs WHERE id = ?', [job_id], (err2, job) => {
          if (err2) return res.status(500).json({ error: err2.message });
          if (!job) return res.status(404).json({ error: 'Job not found' });
          res.json({ success: true, message: 'Payment successful!', job: publicJob(job, true) });
        });
      };

      if (existing) return finish();

      db.run(`INSERT INTO payments (job_id, amount, payer_email, payment_status, payment_id) VALUES (?, ?, ?, ?, ?)`,
        [job_id, amount, payer_email, 'paid', payment_intent_id],
        function (err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          finish();
        });
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes (protected)
function cleanUploadedFiles() {
  try {
    for (const name of fs.readdirSync(uploadsDir)) {
      if (name === '.gitkeep') continue;
      fs.rmSync(path.join(uploadsDir, name), { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Upload cleanup error:', err.message);
  }
}

function purgeAllListings(done) {
  db.serialize(() => {
    db.run('DELETE FROM payments');
    db.run('DELETE FROM jobs');
    db.run('DELETE FROM ads');
    db.run('DELETE FROM contact_messages');
    db.run("DELETE FROM users WHERE email LIKE '%@example.com' OR email = 'test@test.com'", function (err) {
      cleanUploadedFiles();
      done(err);
    });
  });
}

app.get('/api/admin/ads', requireAdmin, (req, res) => {
  db.all('SELECT * FROM ads ORDER BY created_at DESC', (err, ads) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ads });
  });
});

app.post('/api/admin/purge-all', requireAdmin, (req, res) => {
  purgeAllListings((err) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log('Admin purge: all listings removed');
    res.json({ ok: true, message: 'All jobs, shop listings, payments and contact messages removed.' });
  });
});

app.delete('/api/admin/jobs/:id', requireAdmin, (req, res) => {
  const jobId = req.params.id;
  db.serialize(() => {
    db.run('DELETE FROM payments WHERE job_id = ?', [jobId]);
    db.run('DELETE FROM jobs WHERE id = ?', [jobId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: 'Job not found' });
      res.json({ ok: true });
    });
  });
});

app.delete('/api/admin/ads/:id', requireAdmin, (req, res) => {
  const adId = req.params.id;
  db.get('SELECT image_url FROM ads WHERE id = ?', [adId], (err, ad) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!ad) return res.status(404).json({ error: 'Listing not found' });
    db.run('DELETE FROM ads WHERE id = ?', [adId], function (delErr) {
      if (delErr) return res.status(500).json({ error: delErr.message });
      if (ad.image_url && ad.image_url.startsWith('/uploads/')) {
        const file = path.join(__dirname, ad.image_url.replace(/^\//, ''));
        fs.unlink(file, () => {});
      }
      res.json({ ok: true });
    });
  });
});

app.get('/api/admin/jobs', requireAdmin, (req, res) => {
  db.all('SELECT * FROM jobs ORDER BY created_at DESC', (err, jobs) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ jobs });
  });
});

app.put('/api/admin/jobs/:id/status', requireAdmin, (req, res) => {
  const jobId = req.params.id;
  const { status } = req.body;
  
  db.run('UPDATE jobs SET status = ? WHERE id = ?', [status, jobId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Job status updated' });
  });
});

// Contact form
app.post('/api/contact', rateLimit('contact', 5, 600000), (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  db.run(`INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
    [name.trim(), email.trim(), (subject || 'general').trim(), message.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Thank you — we received your message and will reply within 24 hours.' });
    });
});

// ----- Contractor registration, login & subscription -----

app.post('/api/contractors/register', rateLimit('contractor-reg', 10, 600000), async (req, res) => {
  const { name, email, password, phone, company_name, trade } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (cleanPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const existing = await dbGetUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }
    const hash = await bcrypt.hash(cleanPassword, 12);
    db.run(
      `INSERT INTO users (name, email, password, phone, company_name, trade, user_type) VALUES (?, ?, ?, ?, ?, ?, 'contractor')`,
      [cleanName, cleanEmail, hash, String(phone || '').trim(), String(company_name || '').trim(), String(trade || '').trim()],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const user = {
          id: this.lastID,
          name: cleanName,
          email: cleanEmail,
          phone: phone || '',
          company_name: company_name || '',
          trade: trade || '',
          user_type: 'contractor',
          subscription_plan: 'none',
          subscription_status: 'none'
        };
        const token = signContractorToken(user);
        res.status(201).json({
          message: 'Account created. Subscribe to Pro to browse and unlock jobs.',
          token,
          contractor: contractorPublicProfile(user)
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contractors/login', rateLimit('contractor-login', 20, 600000), async (req, res) => {
  const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
  const cleanPassword = String(req.body?.password || '');

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await dbGetUserByEmail(cleanEmail);
    if (!user || user.user_type !== 'contractor') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const ok = await bcrypt.compare(cleanPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signContractorToken(user);
    res.json({ token, contractor: contractorPublicProfile(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contractors/me', requireContractorAuth, (req, res) => {
  res.json({ contractor: contractorPublicProfile(req.contractor) });
});

app.post('/api/contractors/subscribe', rateLimit('contractor-sub', 10, 600000), requireContractorAuth, async (req, res) => {
  const plan = String(req.body?.plan || 'pro').toLowerCase();
  if (plan !== 'pro') {
    return res.status(400).json({ error: 'Online checkout is available for the Pro plan. Contact us for Business or Enterprise.' });
  }
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured.' });
  }

  const contractor = req.contractor;
  const baseUrl = SITE_URL || 'http://localhost:' + PORT;
  const successUrl = `${baseUrl}/dashboard.html?subscribed=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/pricing.html?canceled=1`;

  try {
    const lineItem = STRIPE_PRO_PRICE_ID
      ? { price: STRIPE_PRO_PRICE_ID, quantity: 1 }
      : {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'QuickPostAds Pro — unlimited job access' },
            unit_amount: PRO_PLAN_PRICE_PENCE,
            recurring: { interval: 'month' }
          },
          quantity: 1
        };

    const sessionConfig = {
      mode: 'subscription',
      client_reference_id: String(contractor.id),
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        contractor_id: String(contractor.id),
        plan: 'pro'
      },
      subscription_data: {
        metadata: {
          contractor_id: String(contractor.id),
          plan: 'pro'
        }
      }
    };

    if (contractor.stripe_customer_id) {
      sessionConfig.customer = contractor.stripe_customer_id;
    } else {
      sessionConfig.customer_email = contractor.email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Subscribe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contractors/confirm-subscription', rateLimit('contractor-sub-confirm', 10, 600000), requireContractorAuth, async (req, res) => {
  const sessionId = String(req.body?.session_id || '').trim();
  if (!stripe || !sessionId) {
    return res.status(400).json({ error: 'Missing checkout session.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.metadata?.contractor_id !== String(req.contractor.id)) {
      return res.status(403).json({ error: 'This checkout session does not belong to your account.' });
    }
    if (session.status !== 'complete') {
      return res.status(400).json({ error: 'Checkout not completed yet.', status: session.status });
    }

    const sub = session.subscription;
    const expiresAt = await resolveSubscriptionExpiry(sub);

    activateContractorSubscription(db, req.contractor.id, {
      plan: session.metadata?.plan || 'pro',
      stripeCustomerId: session.customer,
      stripeSubscriptionId: typeof sub === 'string' ? sub : sub?.id,
      expiresAt
    });

    const updated = await dbGetUserById(req.contractor.id);
    res.json({
      message: 'Pro subscription active. You can now browse and unlock jobs.',
      contractor: contractorPublicProfile(updated)
    });
  } catch (err) {
    console.error('Confirm subscription error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard: jobs posted + unlocks purchased by email
app.get('/api/dashboard', (req, res) => {
  const email = (req.query.email || '').trim();
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  db.all(`SELECT id, title, location, salary, status, created_at FROM jobs WHERE contact_email = ? ORDER BY created_at DESC`,
    [email], (err, posted) => {
      if (err) return res.status(500).json({ error: err.message });
      db.all(`SELECT p.id, p.amount, p.created_at, j.id AS job_id, j.title, j.location, j.salary
              FROM payments p JOIN jobs j ON j.id = p.job_id
              WHERE p.payer_email = ? AND p.payment_status = 'paid' ORDER BY p.created_at DESC`,
        [email], (err2, unlocks) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({
            posted: (posted || []).map((j) => ({
              id: j.id, title: j.title, location: j.location,
              budget: j.salary, status: j.status, created_at: j.created_at
            })),
            unlocks: (unlocks || []).map((u) => ({
              payment_id: u.id, job_id: u.job_id, title: u.title, location: u.location,
              budget: u.salary, amount: u.amount, created_at: u.created_at
            }))
          });
        });
    });
});

// Health check for hosting platforms
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: NODE_ENV, stripe: Boolean(stripe), estimator: 'engine' });
});

// Static frontend (after API routes)
function sendHtmlPage(res, fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).end();
  }
  let html = ensureHtmlLang(fs.readFileSync(filePath, 'utf8'));
  html = injectMobileAssets(html);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', 'en-GB');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  return res.send(html);
}

function injectCompactTopBar(html) {
  if (!html.includes('top-bar-contact') || html.includes('top-bar-text-short')) return html;
  return html
    .replace(
      '> 23 Calderon Road, Leyton, London E11 4ET</span>',
      '><span class="top-bar-text-full">23 Calderon Road, Leyton, London E11 4ET</span><span class="top-bar-text-short">Leyton, E11</span></span>'
    )
    .replace(
      '> Phone: 07860266619</span>',
      '><span class="top-bar-text-full">Phone: 07860266619</span><span class="top-bar-text-short">07860266619</span></span>'
    )
    .replace(
      '> Email: info@QuickPostAds.co.uk</span>',
      '><span class="top-bar-text-full">Email: info@QuickPostAds.co.uk</span><span class="top-bar-text-short">info@QuickPostAds.co.uk</span></span>'
    )
    .replace(
      '> Elix Star Live</a>',
      '><span class="top-bar-text-full">Elix Star Live</span><span class="top-bar-text-short">Elix</span></a>'
    );
}

function stripHamburgerNav(html) {
  return html
    .replace(/<button[^>]*class="nav-toggle"[\s\S]*?<\/button>\s*/gi, '')
    .replace(/<div class="nav-overlay"[^>]*><\/div>\s*/gi, '')
    .replace(/<script[^>]*src="js\/mobile-nav\.js[^"]*"[^>]*><\/script>\s*/gi, '');
}

function injectMobileAssets(html) {
  if (typeof html !== 'string') return html;
  let out = stripHamburgerNav(html);
  out = injectCompactTopBar(out);
  out = out.replace(/css\/style\.css\?v=\d+/g, 'css/style.css?v=103');
  return out;
}

app.get('/', (req, res) => sendHtmlPage(res, 'index.html'));

app.get('/cars', (req, res) => res.redirect(301, '/marketplace'));
app.get('/cars/:slug', (req, res) => res.redirect(301, '/marketplace'));

app.get('/marketplace', (req, res) => {
  const baseUrl = SITE_URL || `${req.protocol}://${req.get('host')}`;
  const html = renderSectionHub(MARKETPLACE_HUB, MARKETPLACE_CATEGORIES, 'marketplace', baseUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', 'en-GB');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(html);
});

app.get('/marketplace/:slug', (req, res, next) => {
  const category = getMarketplaceCategory(String(req.params.slug || '').toLowerCase());
  if (!category) return next();
  const baseUrl = SITE_URL || `${req.protocol}://${req.get('host')}`;
  const html = renderSectionCategory(MARKETPLACE_HUB, category, 'marketplace', baseUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', 'en-GB');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(html);
});

app.get('/sitemap-seo.xml', (req, res) => {
  const baseUrl = SITE_URL || `${req.protocol}://${req.get('host')}`;
  const xml = renderSeoSitemap(baseUrl, listSeoPageSlugs());
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(xml);
});

app.get('/:segment/:location', (req, res, next) => {
  const page = parseSeoPagePath(req.params.segment, req.params.location);
  if (!page) return next();
  const baseUrl = SITE_URL || `${req.protocol}://${req.get('host')}`;
  const html = renderSeoLandingPage(page, baseUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', 'en-GB');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(html);
});

app.get(/^\/([a-z0-9-]+)$/i, (req, res, next) => {
  const slug = req.path.replace(/^\//, '');
  const legacy = parseLegacyCompoundSlug(slug);
  if (legacy) return res.redirect(301, legacy.redirect);
  return next();
});

app.get(/\.html$/i, (req, res) => {
  const base = path.basename(decodeURIComponent(req.path));
  if (base === 'categories.html') {
    return res.redirect(301, '/marketplace');
  }
  if (base.includes('..') || BLOCKED_STATIC.has(base)) {
    return res.status(404).end();
  }
  return sendHtmlPage(res, base);
});

const staticMiddleware = express.static(path.join(__dirname), {
  dotfiles: 'deny',
  index: false,
  maxAge: IS_PRODUCTION ? '7d' : 0,
  setHeaders(res, filePath) {
    if (/\.(css|js|webp|jpg|jpeg|png|svg|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', IS_PRODUCTION ? 'public, max-age=604800, immutable' : 'no-cache');
    }
  }
});
app.use((req, res, next) => {
  const pathOnly = req.path.split('?')[0];
  if (pathOnly === '/' || /\.html$/i.test(pathOnly)) {
    return next();
  }
  return staticMiddleware(req, res, next);
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: IS_PRODUCTION ? 'Something went wrong.' : err.message });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QuickPost Ads running on port ${PORT} (${NODE_ENV})`);
  if (IS_PRODUCTION) {
    console.log('Production mode — Stripe required, mock payments disabled');
  }
});
