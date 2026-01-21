# 🚀 NETLIFY DEPLOYMENT GUIDE

## ⚠️ PENTING: Database SQLite di Netlify

**SQLite TIDAK RECOMMENDED untuk Netlify Production** karena:
- Netlify adalah serverless environment
- Tidak ada filesystem persisten
- Data akan hilang setelah setiap deploy
- Database file hanya disimpan di `/tmp` (temporary)

---

## 📋 OPTIONS DATABASE:

### Option 1: SQLite di /tmp (Hanya untuk DEMO/TESTING)

**Kelebihan:**
✅ Gratis dan mudah setup
✅ Tidak perlu provider tambahan

**Kekurangan:**
❌ Data hilang setiap redeploy
❌ Tidak cocok untuk production
❌ Terbatas untuk testing saja

**Setup:**
1. Di Netlify Dashboard → Site Settings → Environment Variables
2. Add: `DATABASE_URL` = `file:/tmp/custom.db`
3. Redeploy aplikasi

---

### Option 2: Vercel Postgres (RECOMMENDED for Production)

**Kelebihan:**
✅ Database persisten
✅ Skalabel
✅ Free tier tersedia
✅ Full PostgreSQL support

**Setup:**
1. Buat project di Vercel: https://vercel.com/new
2. Go ke project → Settings → Postgres
3. Copy connection string:
   ```
   postgresql://username:password@host/dbname?schema=public
   ```
4. Di Netlify Dashboard:
   - Environment Variables
   - Add: `DATABASE_URL` = paste connection string
5. Update Prisma schema provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
6. Run: `prisma db push`

---

### Option 3: PlanetScale MySQL (ALTERNATIVE)

**Kelebihan:**
✅ Free tier tersedia
✅ Skalabel
✅ MySQL compatible

**Setup:**
1. Buat account di: https://planetscale.com
2. Buat database baru
3. Copy connection string
4. Add ke Netlify environment variables
5. Update Prisma schema provider to `mysql`

---

## 📝 DEPLOYMENT STEPS (Netlify):

### Step 1: Install Netlify CLI (jika belum ada)

```bash
bun add -g netlify-cli
# atau
npm install -g netlify-cli
```

### Step 2: Login ke Netlify

```bash
netlify login
```

### Step 3: Deploy

```bash
# Dari project root
netlify deploy --prod
```

Atau deploy dari GitHub repository:
1. Connect GitHub ke Netlify dashboard
2. Pilih repository: `safir2310/Ayam-Geprek`
3. Configure build settings:
   - Build command: `bun run build`
   - Publish directory: `.next/standalone`
4. Add environment variables
5. Deploy!

---

## 🔧 Environment Variables yang Diperlukan di Netlify:

```env
NODE_ENV=production
DATABASE_URL=file:/tmp/custom.db  # atau connection string database cloud
```

---

## 🎯 RECOMMENDASI PRODUCTION:

### Untuk Production, gunakan salah satu:

#### 1. Vercel + Vercel Postgres (RECOMMENDED)
- Hosting: Vercel
- Database: Vercel Postgres (free tier)
- Mengapa:
  ✅ Full Next.js support
  ✅ Auto SSL
  ✅ Edge functions
  ✅ Serverless-first architecture
  ✅ Database persisten
  ✅ Gratis sampai 500MB Postgres

#### 2. Railway.app
- Hosting + Database di satu tempat
- Free tier tersedia
- Postgres database built-in

#### 3. Render.com
- Hosting Next.js
- Postgres database tersedia
- Free tier tersedia

---

## 🐛 DEPLOYING KE VERCEL (LEBIH MUDAH):

### Step 1: Install Vercel CLI
```bash
bun add -g vercel
```

### Step 2: Deploy
```bash
vercel
```

Atau deploy dari GitHub dashboard di Vercel!

---

## ⚙️ KONFIGURASI PRISMA UNTUK PRODUCTION:

### Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Ubah ke postgresql untuk production
  url      = env("DATABASE_URL")
}
```

### Generate Prisma Client setelah deploy:
```bash
bunx prisma generate
```

### Push schema ke production database:
```bash
bunx prisma db push
```

---

## 🔍 TROUBLESHOOTING:

### Error: "Unable to open database file"
**Solusi:**
1. Pastikan DATABASE_URL environment variable ada di Netlify
2. Restart deploy di Netlify dashboard
3. Check logs di Netlify → Functions → Logs

### Error: "PrismaClientInitializationError"
**Solusi:**
1. Run `bun run db:generate` sebelum build
2. Pastikan @prisma/client terinstall
3. Check DATABASE_URL valid

### Error: "Module not found"
**Solusi:**
1. Run `bun install`
2. Clear cache: `rm -rf .next node_modules`
3. Install ulang: `bun install`

---

## 📚 LINKS YANG BERGUNA:

- Netlify Docs: https://docs.netlify.com/
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Postgres: https://vercel.com/docs/postgres
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment

---

## 💡 TIPS:

1. **TEST LOCALLY DULU**: Pastikan semua fitur berfungsi
2. **USE GIT**: Deploy dari Git repository (GitHub/GitLab)
3. **MONITOR LOGS**: Check build logs di Netlify dashboard
4. **BACKUP DATABASE**: Jika gunakan SQLite lokal, backup sebelum deploy
5. **CONSIDER CLOUD DB**: Untuk production, gunakan database cloud persisten

---

**SUMMARY**: Untuk development/testing bisa gunakan SQLite di Netlify, tapi untuk **production strongly recommended** gunakan Vercel + Vercel Postgres atau Railway!
