# QuickPost Ads - IONOS Deployment Guide

This guide will help you deploy your QuickPost Ads website to IONOS hosting.

---

## 📋 First: Check Your IONOS Hosting Type

IONOS offers a few different hosting options. Here's what you need:

### Option A: IONOS Cloud Server (VPS) ✅ BEST for your Node.js site
- If you have a Cloud Server (e.g., "IONOS Cloud Server S"), this is perfect
- Full SSH access, install Node.js, run your backend

### Option B: IONOS Web Hosting (WordPress-focused) ⚠️ Needs Workaround
- If your plan is for WordPress/PHP, you can still use your domain with a free Node.js host like Vercel

---

## 🚀 Option 1: Deploy to IONOS Cloud Server (Recommended)

### Step 1: Log into your IONOS Cloud Server
1. Go to https://my.ionos.co.uk/ and log in
2. Navigate to **Servers & Cloud** → Select your server
3. Note your server's IP address and SSH credentials

### Step 2: Connect to your server via SSH
1. Open **PowerShell** (Windows) or **Terminal** (Mac)
2. Run:
   ```bash
   ssh root@your-server-ip-address
   ```
   (Replace `your-server-ip-address` with your actual server IP)

### Step 3: Set up your server
Run these commands on your server:

1. **Update packages:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Install Node.js and npm:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   ```

3. **Verify installation:**
   ```bash
   node -v
   npm -v
   ```

4. **Install PM2 (to keep your server running):**
   ```bash
   npm install -g pm2
   ```

### Step 4: Upload your website files
1. **On your local computer**, zip your entire project folder
2. **Upload the zip file** to your server using:
   - SCP (command line) or
   - A tool like FileZilla (SFTP)

3. **On your server**, unzip the file:
   ```bash
   apt install -y unzip
   unzip quickpost-ads.zip -d /var/www/quickpost-ads
   cd /var/www/quickpost-ads
   ```

### Step 5: Install dependencies and start the server
```bash
npm install
pm2 start server.js --name quickpost-ads
pm2 startup
pm2 save
```

### Step 6: Set up Nginx as a reverse proxy
1. **Install Nginx:**
   ```bash
   apt install -y nginx
   ```

2. **Create a configuration file:**
   ```bash
   nano /etc/nginx/sites-available/quickpost-ads
   ```

3. **Paste this configuration** (replace `your-domain.com` with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable the site:**
   ```bash
   ln -s /etc/nginx/sites-available/quickpost-ads /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

### Step 7: Enable SSL (Free with Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```
Follow the prompts to set up HTTPS!

---

## 🌐 Option 2: If You Have IONOS Web Hosting (WordPress Plan)
If your hosting doesn't support Node.js, use **Vercel** (free) for the backend + your IONOS domain:

### Step 1: Deploy to Vercel
1. Sign up for a free Vercel account: https://vercel.com
2. Install Git: https://git-scm.com
3. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/quickpost-ads.git
   git push -u origin main
   ```
4. Import your repo to Vercel and deploy!

### Step 2: Connect your IONOS domain to Vercel
1. In your IONOS control panel, go to **Domains & SSL**
2. Select your domain → **DNS**
3. Update your DNS records:
   - **A Record**: Point `@` to Vercel's IP: `76.76.21.21`
   - **CNAME Record**: Point `www` to `cname.vercel-dns.com`
4. In Vercel, add your custom domain in **Settings → Domains**

---

## 📝 Environment Variables
Create a `.env` file on your server:
```env
PORT=3000
NODE_ENV=production
# Optional: Add your Stripe keys if you want real payments
# STRIPE_SECRET_KEY=sk_live_your_key
# STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

---

## 🎯 Next Steps After Deployment
1. ✅ Test your website at your domain
2. ✅ Set up your email (info@QuickPostAds.co.uk) in IONOS
3. ✅ Add more sample jobs to populate the site
4. ✅ Start promoting!

---

## ❓ Need Help?
- **IONOS Support**: https://www.ionos.co.uk/help
- **Vercel Docs**: https://vercel.com/docs
- **PM2 Docs**: https://pm2.keymetrics.io/
