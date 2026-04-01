# Deploy AYAM GEPREK SAMBAL IJO ke Vercel dengan Database

## 📋 Prasyarat

- Akun [Vercel](https://vercel.com)
- Akun [GitHub](https://github.com)
- Repository sudah terupload ke GitHub: https://github.com/safir2310/Ayam-Geprek

---

## 🗄️ Langkah 1: Buat Vercel Postgres Database

### 1.1 Buka Vercel Dashboard
1. Login ke [vercel.com](https://vercel.com)
2. Pilih project **Ayam-Geprek** atau buat project baru

### 1.2 Tambahkan Storage
1. Di menu sidebar kiri, klik **Storage**
2. Klik tombol **"Create Database"**
3. Pilih **Postgres** (gratis untuk penggunaan dasar)
4. Klik **"Continue"**

### 1.3 Konfigurasi Database
1. **Database Name**: `ayam-geprek-db` (atau nama lain yang Anda inginkan)
2. **Region**: Pilih yang terdekat dengan pengguna (misal: Singapore)
3. Klik **"Create"**

### 1.4 Copy Environment Variables
Setelah database dibuat, Vercel akan menampilkan environment variables. Copy semua nilai berikut:

```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

---

## 🔧 Langkah 2: Update Environment Variables di Vercel

### 2.1 Buka Project Settings
1. Di dashboard Vercel, buka project **Ayam-Geprek**
2. Klik **Settings** tab
3. Klik **Environment Variables**

### 2.2 Tambahkan Environment Variables

Tambahkan variabel-variabel berikut:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | `POSTGRES_PRISMA_URL` dari Storage | Production, Preview, Development |
| `DIRECT_URL` | `POSTGRES_URL_NON_POOLING` dari Storage | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate random string | Production, Preview, Development |
| `NEXTAUTH_URL` | Domain production Anda (contoh: `https://ayam-geprek.vercel.app`) | Production |

**Untuk NEXTAUTH_SECRET:**
- Buka terminal dan jalankan:
  ```bash
  openssl rand -base64 32
  ```
- Copy output dan paste sebagai nilai NEXTAUTH_SECRET

---

## 🚀 Langkah 3: Deploy ke Vercel

### 3.1 Connect GitHub Repository
1. Di dashboard Vercel, klik **"Add New Project"**
2. Pilih **Continue with GitHub**
3. Authorize Vercel untuk mengakses repository Anda
4. Pilih repository **Ayam-Geprek**

### 3.2 Konfigurasi Deploy
1. **Framework Preset**: Pilih **Next.js**
2. **Root Directory**: Biarkan default (`./`)
3. **Build Command**: Biarkan default (`npm run build`)
4. **Output Directory**: Biarkan default (`.next`)
5. **Install Command**: Biarkan default (`npm install`)

### 3.3 Environment Variables
1. Scroll ke bagian **Environment Variables**
2. Tambahkan semua variabel dari Langkah 2
3. Klik **"Add"** untuk setiap variabel

### 4. Deploy
1. Klik **"Deploy"**
2. Tunggu proses deploy selesai (sekitar 2-3 menit)
3. Setelah berhasil, aplikasi akan dapat diakses di `https://ayam-geprek.vercel.app`

---

## 🔨 Langkah 4: Setup Database Schema

### 4.1 Generate Prisma Client
Setelah deploy berhasil, Anda perlu generate Prisma client untuk production:

**Option 1: Melalui Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Generate Prisma client
vercel env pull .env.local
npx prisma generate
```

**Option 2: Melalui Vercel Dashboard**
1. Buka Vercel Dashboard
2. Pilih project **Ayam-Geprek**
3. Klik **Settings** > **Environment Variables**
4. Klik **"Export All"** untuk download file `.env`
5. Gunakan file tersebut di local development

### 4.2 Push Schema ke Database

**Untuk Local Development:**
```bash
# Set DATABASE_URL dari Vercel
export DATABASE_URL="postgresql://user:password@host/database?sslmode=require&pgbouncer=true"
export DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

# Push schema ke database
bun run db:push
```

**Untuk Production (melalui Vercel):**
1. Buka Vercel Dashboard
2. Pilih project
3. Buka tab **Deployments**
4. Klik titik tiga (...) di deployment terbaru
5. Pilih **"Redeploy"**
6. Prisma akan otomatis generate schema saat build

---

## ✅ Langkah 5: Verifikasi Deploy

### 5.1 Cek Database
1. Buka Vercel Dashboard
2. Pilih **Storage** > **Ayam-Geprek Database**
3. Klik **"Query"** tab
4. Jalankan query untuk cek tabel:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Anda seharusnya melihat semua tabel dari schema Prisma (User, Product, Order, dll).

### 5.2 Cek Aplikasi
1. Buka URL production: `https://ayam-geprek.vercel.app`
2. Test fitur-fitur utama:
   - ✅ Halaman utama loading
   - ✅ Login/Register berfungsi
   - ✅ Tampilan produk
   - ✅ Tambah ke keranjang
   - ✅ Checkout
   - ✅ Order tersimpan di database

---

## 🐛 Troubleshooting

### Error: "Database connection failed"
**Solusi:**
1. Cek environment variables di Vercel Dashboard
2. Pastikan `DATABASE_URL` dan `DIRECT_URL` benar
3. Pastikan database tidak dalam status "Sleep"

### Error: "Prisma Client not generated"
**Solusi:**
1. Tambahkan script postinstall di package.json:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
2. Redeploy project

### Error: "SSL Connection Required"
**Solusi:**
1. Pastikan `DATABASE_URL` dan `DIRECT_URL` memiliki parameter `sslmode=require`
2. Vercel Postgres menggunakan SSL secara default

### Error: "Connection Pooling Issue"
**Solusi:**
1. Gunakan `POSTGRES_PRISMA_URL` untuk `DATABASE_URL` (sudah include connection pooling)
2. Gunakan `POSTGRES_URL_NON_POOLING` untuk `DIRECT_URL` (untuk migrations)

---

## 📝 Environment Variables Reference

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | Primary database connection dengan pooling | `postgresql://user:pass@host/db?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Direct connection untuk migrations | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_SECRET` | Secret key untuk NextAuth | Random string (gunakan `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL aplikasi production | `https://ayam-geprek.vercel.app` |

---

## 🔄 Update Kode ke Production

Setelah setup database, pastikan untuk:

1. **Push semua perubahan ke GitHub:**
   ```bash
   git add .
   git commit -m "feat: Setup Vercel Postgres database"
   git push origin master
   ```

2. **Redeploy di Vercel:**
   - Deployment otomatis akan ter-trigger saat ada push ke GitHub
   - Tunggu deploy selesai

---

## 🎉 Selesai!

Aplikasi AYAM GEPREK SAMBAL IJO sudah berhasil deploy ke Vercel dengan database Postgres!

**URL Production:** `https://ayam-geprek.vercel.app`

**Database:** Vercel Postgres (powered by Neon)

---

## 📚 Resources Tambahan

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma with Vercel Postgres](https://www.prisma.io/docs/guides/database/deploy-to-vercel/vercel-postgres)
- [Neon Serverless Postgres](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Dokumentasi dibuat untuk AYAM GEPREK SAMBAL IJO POS System**
**Last Updated:** 2025
