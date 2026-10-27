# AKAM Digital - Deployment & CI/CD Guide

This document outlines the CI/CD deployment pipeline, server setup, PM2 process management, and Nginx reverse proxy configuration for **AKAM Digital**.

---

## 🏗️ Architecture Overview

| Component | Technology | Directory | Port | PM2 Process Name | Public Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend API** | NestJS + Prisma 8 | `/var/www/akam-digital/backend` | `3005` | `akam-digital-api` | `https://api.akamdigital.in` |
| **Frontend Web** | Next.js 16 | `/var/www/akam-digital/frontend` | `3004` | `akam-digital-web` | `https://akamdigital.in` |

---

## 🚀 CI/CD Pipeline

The repository uses **GitHub Actions** workflows located in `.github/workflows/`:

### 1. Production Deployment (`deploy.yml`)
- **Triggers**: On push to `main` branch or manual `workflow_dispatch`.
- **Runner**: `[self-hosted, akam-vps]` (Hostinger VPS runner located at `/opt/actions-runner-akam-digital`).
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
     - Emits Prisma contract (`npm run contract:emit`) & syncs schema (`npm run db:update`)
     - Compiles TypeScript to `dist/` (`npm run build`)
  4. **Frontend Deployment**:
     - Runs `npm ci --prefer-offline || npm install`
     - Compiles Next.js application (`npm run build`)
  5. **PM2 Zero-Downtime Reload**:
     - Reloads `akam-digital-api` and `akam-digital-web` with `--update-env`.

---

## 🛠️ Handy PM2 Commands on VPS

```bash
# Check status of processes
pm2 status

# View live streaming logs
pm2 logs akam-digital-api
pm2 logs akam-digital-web

# Restart services
pm2 restart akam-digital-api --update-env
pm2 restart akam-digital-web --update-env
```
