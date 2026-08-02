# AWS VPS Deployment Guide

## Architecture

```
Internet → Nginx (reverse proxy) → Next.js (PM2 cluster) → PostgreSQL (localhost)
```

---

## 1. Launch EC2 Instance

1. Log in to [AWS Console](https://console.aws.amazon.com) → **EC2** → **Launch Instance**
2. Configure:
   | Setting | Value |
   |---|---|
   | Name | `cga-quiz-production` |
   | AMI | **Ubuntu 24.04 LTS** |
   | Instance type | `t3.medium` (2 vCPU, 4 GB RAM) |
   | Key pair | Create new → save `.pem` file |
   | Storage | 20 GB gp3 |
   | Security group | Allow: **SSH (22)**, **HTTP (80)**, **HTTPS (443)** |

3. Click **Launch**

---

## 2. Connect to the Server

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

---

## 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # v22.x
npm -v    # 10.x

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

---

## 4. Setup PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Switch to postgres user
sudo -u postgres psql

# In psql shell:
CREATE DATABASE cgaquizz;
CREATE USER cgaadmin WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE cgaquizz TO cgaadmin;
\c cgaquizz
GRANT ALL ON SCHEMA public TO cgaadmin;
\q
```

Update PostgreSQL auth to allow password login:

```bash
sudo nano /etc/postgresql/18/main/pg_hba.conf

# Change this line:
# local   all   all   peer
# To:
local   all   all   md5

sudo systemctl restart postgresql
```

---

## 5. Clone & Setup the App

```bash
# Create app directory
mkdir -p /var/www
cd /var/www

# Clone your repo (or use scp to upload)
sudo git clone https://github.com/winbalamin/cga_quizz.git
cd cga_quizz

# Install dependencies
sudo npm install

# Generate Prisma client
sudo npx prisma generate
```

---

## 6. Environment Variables

```bash
sudo nano .env
```

```ini
    DATABASE_URL="postgresql://cgaadmin:your-strong-password@localhost:5432/cgaquizz?schema=public"
    AUTH_SECRET="your-generated-secret-key"
```

Generate `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 7. Run Migrations & Seed

```bash
# Apply database migrations
npx prisma migrate deploy

# Seed admin user + sample questions
npx tsx prisma/seed.ts
```

---

## 8. Build & Start with PM2

```bash
# Build the app
npm run build

# Start with PM2
pm2 start npm --name "cga-quiz" -- start

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup systemd
# Run the command PM2 outputs
```

Verify:
```bash
pm2 status
# Should show "cga-quiz" → status: online

curl http://localhost:3000
# Should return HTML
```

---

## 9. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/cga-quiz
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Increase upload size for CSV imports
    client_max_body_size 10M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for exam sessions
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cga-quiz /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t          # Test config
sudo systemctl restart nginx
```

---

## 10. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## 11. Firewall

```bash
# Enable UFW
sudo ufw allow 22   # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS
sudo ufw enable

# Verify
sudo ufw status
```

---

## 12. Deploy Updates

Create a deploy script:

```bash
nano /var/www/deploy.sh
```

```bash
#!/bin/bash
cd /var/www/cga_quizz
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart cga-quiz
echo "Deploy complete at $(date)"
```

```bash
chmod +x /var/www/deploy.sh

# Run after pushing to git:
sudo /var/www/deploy.sh
```

---

## 13. Monitoring

```bash
# PM2 logs
pm2 logs cga-quiz

# PM2 dashboard
pm2 monit

# System resources
htop

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# PostgreSQL
sudo -u postgres psql -d cgaquizz
```

---

## 14. Troubleshooting

### App shows 502 Bad Gateway
```bash
pm2 status              # Check if app is running
pm2 logs cga-quiz       # Check for errors
```

### Database connection refused
```bash
sudo systemctl status postgresql
sudo -u postgres psql   # Can you connect?
```

### Portfolio exhaust (too many connections)
```bash
nano /etc/postgresql/16/main/postgresql.conf
# Increase: max_connections = 100
sudo systemctl restart postgresql
```

### Changes don't appear after deploy
```bash
npm run build           # Rebuild
pm2 restart cga-quiz    # Restart
# Or hard restart:
pm2 delete cga-quiz
pm2 start npm --name "cga-quiz" -- start
```

---

## Quick Reference

| Command | Purpose |
|---|---|
| `pm2 status` | Check app status |
| `pm2 logs cga-quiz` | View app logs |
| `pm2 restart cga-quiz` | Restart app |
| `sudo systemctl restart nginx` | Restart Nginx |
| `sudo nginx -t` | Test Nginx config |
| `sudo /var/www/deploy.sh` | Deploy latest changes |
| `sudo -u postgres psql -d cgaquizz` | Access database |
