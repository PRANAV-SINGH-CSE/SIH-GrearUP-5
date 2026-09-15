# CompliScan — Deployment & Operations Guide

CompliScan is built on Next.js 16 (App Router), Prisma ORM, and TypeScript. It can be deployed as a unified containerized full-stack service or split into independent microservices.

---

## 1. Environment Variables

Create `.env` (or set environment variables in your deployment platform):

```env
# Database Configuration
DATABASE_PROVIDER=prisma
DATABASE_URL=postgresql://compliscan_user:password@db.internal:5432/compliscan?schema=public

# Object Storage Provider ('local' | 's3' | 'supabase')
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=./public/uploads

# OCR & AI Providers ('mock' | 'gemini')
OCR_PROVIDER=gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Application Configuration
NODE_ENV=production
PORT=3000
```

---

## 2. Production Build & Run

```bash
# 1. Install dependencies
npm install --production=false

# 2. Generate Prisma client
npm run prisma:generate

# 3. Apply database migrations
npm run prisma:migrate

# 4. Seed Legal Metrology rules and categories
npm run seed

# 5. Build optimized Next.js bundle
npm run build

# 6. Start production server
npm run start
```

---

## 3. Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 4. Mobile Client Packaging (Android Studio)

CompliScan's web frontend is designed to be packaged directly as an Android mobile application via Android Studio using an Android WebView wrapper, Capacitor, or PWA:
1. Point the Android WebView to `https://your-domain.com`.
2. Configure Android camera permissions in `AndroidManifest.xml` (`android.permission.CAMERA`).
3. Offline inspection mode can store images locally on the Android device and trigger `POST /api/offline/sync` when a data connection is restored.
