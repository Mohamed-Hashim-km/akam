# AKAM Digital - Deployment & CI/CD Guide

This document outlines the CI/CD deployment pipeline, server prerequisites, PM2 process management, and Nginx reverse proxy configuration for **AKAM Digital**.

---

## 🏗️ Architecture Overview

| Component | Technology | Directory | Port | PM2 Process Name | Public Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend API** | NestJS + Prisma | `/var/www/akam-digital/backend` | `3000` | `akam-backend` | `https://api.akam.digital` |
| **Frontend Web** | Next.js 16 | `/var/www/akam-digital/frontend` | `3002` | `akam-frontend` | `https://akam.digital` |

---

## 🚀 CI/CD Pipeline

The repository uses **GitHub Actions** workflows located in `.github/workflows/`:

### 1. Production Deployment (`deploy.yml`)
- **Triggers**: On push to `main` branch or manual `workflow_dispatch`.
- **Runner**: `[self-hosted, akam-vps]` (Hostinger VPS runner).
- **Execution Flow**:
  1. **Syncs Code**: Uses `rsync -av --delete` to sync code into `/var/www/akam-digital/` while preserving `.env*`, `node_modules`, build artifacts, and uploaded media files (`backend/uploads/`).
  2. **Uploads Integrity**: Ensures media upload subfolders exist:
     - `backend/uploads/avatars`
     - `backend/uploads/books`
     - `backend/uploads/covers`
     - `backend/uploads/inline-images`
     - `backend/uploads/pdfs`
  3. **Backend Deployment**:
     - Runs `npm ci --prefer-offline || npm install`
     - Generates Prisma client (`npx prisma generate`)
     - Applies schema changes (`npx prisma db push --accept-data-loss`)
     - Compiles TypeScript to `dist/` (`npm run build`)
  4. **Frontend Deployment**:
     - Runs `npm ci --prefer-offline || npm install`
     - Compiles Next.js application (`npm run build`)
  5. **PM2 Reload**:
     - Reloads `akam-backend` and `akam-frontend` using `ecosystem.config.cjs` with `--update-env` for zero-downtime deployment.

### 2. CI Validation (`ci.yml`)
- **Triggers**: On pull requests against `main` or manual trigger.
- **Runner**: `ubuntu-latest` (GitHub-hosted).
- **Execution Flow**:
  - Validates dependency resolution, Prisma generation, code quality (linting), and TypeScript builds for both backend and frontend.

---

## ⚙️ Initial VPS Server Setup (One-time)

### 1. Create Target Directory & Set Permissions
```bash
sudo mkdir -p /var/www/akam-digital
sudo chown -R $USER:$USER /var/www/akam-digital
```

### 2. Prepare Environment Files on VPS
Create `.env` inside `/var/www/akam-digital/backend/.env`:
```bash
nano /var/www/akam-digital/backend/.env
```
*(Reference values can be found in `backend/.env.example`)*

Create `.env.production` inside `/var/www/akam-digital/frontend/.env.production`:
```bash
nano /var/www/akam-digital/frontend/.env.production
```
*(Example: `NEXT_PUBLIC_SERVER_URL=https://api.akam.digital`, `NEXT_PUBLIC_SITE_URL=https://akam.digital`)*

### 3. Start PM2 Services with the Ecosystem File
From `/var/www/akam-digital`:
```bash
cd /var/www/akam-digital
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 🌐 Nginx Reverse Proxy Configuration

### 1. Backend API (`api.akam.digital`)
Create `/etc/nginx/sites-available/api.akam.digital`:
```nginx
server {
    server_name api.akam.digital;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static uploads caching & delivery
    location /uploads/ {
        alias /var/www/akam-digital/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 2. Frontend (`akam.digital` & `www.akam.digital`)
Create `/etc/nginx/sites-available/akam.digital`:
```nginx
server {
    server_name akam.digital www.akam.digital;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable both sites and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/api.akam.digital /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/akam.digital /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain SSL certificates via Certbot:
```bash
sudo certbot --nginx -d akam.digital -d www.akam.digital -d api.akam.digital
```

---

## 🛠️ Handy PM2 Commands

```bash
# Check status of processes
pm2 status

# View live streaming logs
pm2 logs akam-backend
pm2 logs akam-frontend

# Manual reload
pm2 reload ecosystem.config.cjs --update-env

# Restart service
pm2 restart akam-backend
pm2 restart akam-frontend
```
