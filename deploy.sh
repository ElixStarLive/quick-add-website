#!/bin/bash
# QuickPost Ads — VPS deploy helper (run on server as root)
set -e

APP_DIR="/var/www/quickpostads"
NGINX_SITE="/etc/nginx/sites-available/quickpostads"

echo "=== QuickPost Ads deploy ==="

mkdir -p "$APP_DIR/uploads"

if [ ! -f "$APP_DIR/server.js" ]; then
  echo "ERROR: $APP_DIR/server.js not found. Upload website files with WinSCP first."
  exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: $APP_DIR/.env not found. Create it with nano before running this script."
  exit 1
fi

echo ">>> Writing Nginx config..."
cat > "$NGINX_SITE" << 'NGINXEOF'
server {
    listen 80;
    server_name quickpostads.co.uk www.quickpostads.co.uk 41.215.240.140;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/quickpostads
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/quickpostads
nginx -t
systemctl restart nginx
echo ">>> Nginx OK"

echo ">>> Installing PM2 if needed..."
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo ">>> Installing npm packages..."
cd "$APP_DIR"
npm install --production

echo ">>> Starting app..."
pm2 delete quickpostads 2>/dev/null || true
pm2 start server.js --name quickpostads
pm2 save

echo ">>> Health check..."
sleep 2
curl -s http://127.0.0.1:3000/api/health || true
echo ""
echo "=== Done ==="
echo "Open in browser: http://41.215.240.140"
echo "Then fix DNS to point quickpostads.co.uk -> 41.215.240.140"
echo "Then run: certbot --nginx -d quickpostads.co.uk -d www.quickpostads.co.uk"
