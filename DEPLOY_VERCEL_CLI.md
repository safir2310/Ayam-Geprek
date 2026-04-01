# 🚀 Deploy ke Vercel dengan CLI - AYAM GEPREK SAMBAL IJO

Panduan deployment ke Vercel menggunakan Vercel CLI dengan token yang sudah disiapkan.

---

## ✅ Status Database Neon

Database Neon sudah siap:
- ✅ Schema sudah di-push (18 tabel)
- ✅ Prisma Client sudah digenerate
- ✅ Connection string sudah dikonfigurasi
- ✅ Siap untuk production

---

## 📋 Langkah 1: Install Vercel CLI

### Option A: Install Vercel CLI (jika belum ada)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Atau menggunakan bun
bun install -g vercel

# Cek versi
vercel --version
```

### Option B: Login dengan Token

Gunakan token yang sudah disiapkan:

```bash
# Login ke Vercel dengan token Anda
vercel login --token YOUR_VERCEL_TOKEN_HERE
```

Setelah login berhasil, Anda akan melihat:
```
✅ Success! Logged in as [your-email]
```

---

## 📋 Langkah 2: Setup Project di Vercel

### 2.1 Link Project ke Vercel

```bash
# Masuk ke direktori project
cd /home/z/my-project

# Link project ke Vercel
vercel link
```

Saat diminta:
1. **Set up and deploy "~/my-project"?** → `Y`
2. **Which scope do you want to deploy to?** → Pilih akun Anda
3. **Link to existing project?** → `N` (untuk project baru)
4. **What's your project's name?** → `ayam-geprek` (atau nama lain)
5. **In which directory is your code located?** → `./` (default)

### 2.2 Setup Environment Variables

```bash
# Set DATABASE_URL
vercel env add DATABASE_URL

# Masukkan value ini:
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pgbouncer=true

# Pilih environment: Production, Preview, Development

# Set DIRECT_URL
vercel env add DIRECT_URL

# Masukkan value ini:
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require

# Pilih environment: Production, Preview, Development

# Set NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET

# Masukkan value ini:
ayam-geprek-sambal-ijo-secret-2025-production

# Pilih environment: Production, Preview, Development

# Set NEXTAUTH_URL
vercel env add NEXTAUTH_URL

# Masukkan value ini:
https://ayam-geprek.vercel.app

# Pilih environment: Production only (untuk Preview dan Development biarkan kosong)
```

### 2.3 Cek Environment Variables

```bash
# List semua environment variables
vercel env ls

# Pull environment variables ke local (opsional)
vercel env pull .env.local
```

---

## 📋 Langkah 3: Deploy ke Vercel

### 3.1 Deploy Pertama kali (Production)

```bash
# Deploy ke production
vercel --prod
```

Vercel akan:
1. ✅ Install dependencies
2. ✅ Run `postinstall` script (generate Prisma Client)
3. ✅ Build aplikasi
4. ✅ Deploy ke production

Tunggu sekitar 2-3 menit. Setelah selesai, Anda akan mendapatkan URL:
```
✅ Production: https://ayam-geprek.vercel.app
```

### 3.2 Deploy ke Preview (untuk testing)

```bash
# Deploy ke preview environment
vercel
```

Ini akan membuat preview URL untuk testing sebelum production.

---

## 📋 Langkah 4: Verify Deployment

### 4.1 Buka Production URL

Buka URL production di browser:
```
https://ayam-geprek.vercel.app
```

Test fitur-fitur:
- ✅ Halaman utama loading
- ✅ Tampilan premium
- ✅ Login/Register berfungsi
- ✅ Data tersimpan di Neon database

### 4.2 Cek Deployment Logs

```bash
# View logs untuk deployment terakhir
vercel logs

# View logs untuk production
vercel logs --prod

# Stream logs real-time
vercel logs --follow
```

### 4.3 Cek Database di Neon

1. Buka [Neon Console](https://console.neon.tech)
2. Pilih project `ep-ancient-paper-aiifvyrx`
3. Klik **SQL Editor**
4. Jalankan query:

```sql
-- Cek user yang register
SELECT id, email, name, role, created_at FROM "User";

-- Cek produk
SELECT id, name, price, stock, is_active FROM "Product";

-- Cek order
SELECT id, order_number, customer_name, status, total_amount, created_at FROM "Order" ORDER BY created_at DESC;
```

---

## 📋 Langkah 5: Update Deployment

Setiap kali ada perubahan kode:

### 5.1 Commit Changes ke GitHub

```bash
# Add semua perubahan
git add .

# Commit
git commit -m "feat: description of changes"

# Push ke GitHub
git push origin main
```

### 5.2 Deploy ke Vercel

```bash
# Deploy ke production
vercel --prod
```

Vercel akan otomatis:
- ✅ Pull latest code dari GitHub
- ✅ Install dependencies
- ✅ Run build
- ✅ Deploy ke production

---

## 🔧 Troubleshooting

### Error: "Not logged in"

**Solusi:**
```bash
# Login ulang dengan token Anda
vercel login --token YOUR_VERCEL_TOKEN_HERE
```

### Error: "Environment variable not found"

**Solusi:**
```bash
# Cek environment variables
vercel env ls

# Tambahkan environment variable yang missing
vercel env add VARIABLE_NAME
```

### Error: "Prisma Client not generated"

**Solusi:**
```bash
# Cek postinstall script di package.json
cat package.json | grep postinstall

# Harus ada: "postinstall": "prisma generate"

# Redeploy
vercel --prod --force
```

### Error: "Database connection failed"

**Solusi:**
```bash
# Verify DATABASE_URL
vercel env rm DATABASE_URL
vercel env add DATABASE_URL

# Masukkan value yang benar
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pgbouncer=true

# Redeploy
vercel --prod --force
```

### Error: "Build failed"

**Solusi:**
```bash
# Cek build logs
vercel logs --prod

# Test build locally
bun run build

# Fix error yang muncul, lalu redeploy
vercel --prod
```

---

## 📊 Monitoring

### View Deployment Status

```bash
# Cek deployment list
vercel list

# Cek deployment production
vercel inspect https://ayam-geprek.vercel.app
```

### View Logs

```bash
# View semua logs
vercel logs

# View logs production
vercel logs --prod

# View logs real-time
vercel logs --follow

# View logs untuk function tertentu
vercel logs --filter function-name
```

### View Project Info

```bash
# Lihat info project
vercel inspect

# Lihat project settings
vercel project ls
```

---

## 🎯 Common Commands

```bash
# Login (gunakan token Anda sendiri)
vercel login --token YOUR_VERCEL_TOKEN_HERE

# Link project
vercel link

# Deploy ke preview
vercel

# Deploy ke production
vercel --prod

# View logs
vercel logs

# View logs production
vercel logs --prod

# Stream logs
vercel logs --follow

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# Pull environment variables
vercel env pull .env.local

# List deployments
vercel list

# Inspect project
vercel inspect
```

---

## 📝 Environment Variables Reference

```env
# Database (Neon / Vercel Postgres)
DATABASE_URL=postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pgbouncer=true
DIRECT_URL=postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=ayam-geprek-sambal-ijo-secret-2025-production
NEXTAUTH_URL=https://ayam-geprek.vercel.app
```

---

## 🎉 Selesai!

Setelah deployment berhasil, Anda akan memiliki:

- ✅ **Production URL:** `https://ayam-geprek.vercel.app`
- ✅ **Database:** Neon (Vercel Postgres) dengan 18 tabel
- ✅ **GitHub Repository:** https://github.com/safir2310/Ayam-Geprek
- ✅ **Auto-deploy:** Setiap push ke GitHub akan trigger deployment

---

## 📚 Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Vercel Token:** (Gunakan token Anda sendiri)
**Project:** AYAM GEPREK SAMBAL IJO
**Database:** Neon (Vercel Postgres)
**Last Updated:** 2025
