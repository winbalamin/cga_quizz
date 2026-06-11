# Vercel Deployment Guide

## Prerequisites

- A [Vercel](https://vercel.com) account
- A PostgreSQL database (see [Database Setup](#database-setup))
- Git repository connected to Vercel (or use Vercel CLI)

---

## 1. Database Setup

You need a PostgreSQL database accessible from Vercel. Two options:

### Option A — Vercel Postgres

1. In your Vercel project dashboard, go to **Storage** → **Create Database** → **Postgres**
2. Choose a region close to your users
3. Once created, copy the connection string

### Option B — External PostgreSQL (Supabase, Neon, Railway, etc.)

1. Create a PostgreSQL database from your provider
2. Get the connection string in this format:
   ```
   postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
   ```
3. Ensure the database is publicly accessible or use Vercel's IP allowlist

---

## 2. Environment Variables

Add these to your Vercel project (**Settings** → **Environment Variables**):

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@ep-xxx.us-east-2.aws.neon.tech/cga?sslmode=require` |
| `AUTH_SECRET` | Auth.js session encryption key | `cebc597e5507bafae5eb9e5307d4542...` |

Generate a new `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Deploy

### Option A — Git Push (Recommended)

1. Push your code to GitHub/GitLab
2. In Vercel, click **Add New** → **Project**
3. Import your repository
4. Vercel auto-detects Next.js — no framework settings needed
5. Add environment variables from step 2
6. Click **Deploy**

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
# Follow the prompts
```

---

## 4. Post-Deployment — Run Migrations & Seed

After the first deploy, run migrations and seed the database:

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull env vars locally
vercel env pull .env.vercel

# Run migrations against production DB
npx prisma migrate deploy

# Seed admin user and sample questions
npx tsx prisma/seed.ts
```

> **Important**: You only need to run migrations once (or after schema changes). The seed creates the admin account and sample questions.

---

## 5. Build Configuration

Vercel auto-detects Next.js. No custom build settings needed. The default build command is:

```
next build
```

If you need to customize, add to `next.config.ts` or set in Vercel dashboard → **Build & Development Settings**.

---

## 6. Verifying the Deployment

After deploy:

| Check | URL |
|---|---|
| Landing page | `https://your-app.vercel.app/` |
| Admin login | `https://your-app.vercel.app/admin/login` |
| Leaderboard | `https://your-app.vercel.app/leaderboard` |

### Default Admin Credentials

```
Email:    admin@cga-quiz.com
Password: admin123
```

> Change the admin password after first login.

---

## 7. Database Migrations (Ongoing)

When you make schema changes locally:

```bash
# 1. Create migration locally
npx prisma migrate dev --name description_of_change

# 2. Push to git
git add prisma/migrations
git commit -m "db: add new field"
git push

# 3. After deploy, apply to production
vercel link
vercel env pull .env.vercel
npx prisma migrate deploy
```

---

## 8. Troubleshooting

### Build fails with Prisma errors
Make sure `DATABASE_URL` is set in Vercel environment variables. Prisma needs it at build time to generate the client.

### 500 errors after deploy
Run `npx prisma migrate deploy` against the production database. Missing tables cause runtime errors.

### Admin login redirects to itself
Check `AUTH_SECRET` is set and matches the value used when deploying.

### Questions not loading
Run `npx tsx prisma/seed.ts` — no questions exist until seeded.

### Exam control crashes
Run the migration `20250611000002_exam_session` — the `ExamSession` table must exist.
