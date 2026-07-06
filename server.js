const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const multer = require('multer');
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
const STRIPE_PUBLISHABLE_KEY = envTrim('STRIPE_PUBLISHABLE_KEY') || envTrim('VITE_STRIPE_PUBLISHABLE_KEY');

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
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    if (pi.metadata.type === 'unlock' && pi.metadata.job_id && pi.metadata.payer_email) {
      const dbRef = global.__quickpostDb;
      if (dbRef) {
        dbRef.run(`INSERT OR IGNORE INTO payments (job_id, amount, payer_email, payment_status, payment_id) VALUES (?, ?, ?, 'paid', ?)`,
          [pi.metadata.job_id, pi.amount / 100, pi.metadata.payer_email, pi.id]);
      }
    }
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
  insertForSaleTable();
  if (IS_PRODUCTION) purgeDemoContentQuiet();
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

// Get all approved jobs (locked: no description/contact until unlocked)
app.get('/api/jobs', (req, res) => {
  db.all('SELECT * FROM jobs WHERE status = "approved" ORDER BY created_at DESC', (err, jobs) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const locked = jobs.map((j) => publicJob(j, false));
    res.json({ jobs: locked });
  });
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

// Get job by ID (contact hidden until unlocked)
app.get('/api/jobs/:id', (req, res) => {
  const jobId = req.params.id;
  const payerEmail = (req.query.email || '').trim();
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

// Check if job is unlocked for a specific email
app.get('/api/jobs/:id/unlock-status', (req, res) => {
  const jobId = req.params.id;
  const payerEmail = req.query.email;
  
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
        res.json({ unlocked: false });
      }
    }
  );
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

// Stripe: create PaymentIntent for job unlock
app.post('/api/payments/create-intent', rateLimit('pay-intent', 30, 60000), async (req, res) => {
  const { job_id, payer_email } = req.body;
  if (!stripe || !STRIPE_PUBLISHABLE_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured on the server.' });
  }
  if (!job_id || !payer_email) {
    return res.status(400).json({ error: 'Job ID and email are required.' });
  }

  try {
    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM jobs WHERE id = ?', [job_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const enriched = enrichJob(job);
    const amount = enriched.unlock_fee_pence;

    const paymentIntent = await stripe.paymentIntents.create(
      buildStripePaymentIntentOptions({
        amount,
        receipt_email: payer_email,
        metadata: {
          type: 'unlock',
          job_id: String(job_id),
          payer_email
        }
      })
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      unlock_fee_display: enriched.unlock_fee_display,
      budget: enriched.budget
    });
  } catch (error) {
    console.error('Create intent error:', error);
    res.status(500).json({ error: error.message });
  }
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
  const html = ensureHtmlLang(fs.readFileSync(filePath, 'utf8'));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Language', 'en-GB');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  return res.send(html);
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

const staticMiddleware = express.static(path.join(__dirname), { dotfiles: 'deny', index: false });
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
