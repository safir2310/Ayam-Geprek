# 🚀 PANDUAN DEPLOYMENT KE VERCEL - LENGKAP

## ✅ STATUS SAAT INI:

✅ **Code sudah di-upload ke GitHub**
- Repository: https://github.com/safir2310/Ayam-Geprek
- Prisma schema sudah diubah ke PostgreSQL
- Semua fitur sudah siap

✅ **Siap untuk deployment ke Vercel**

---

## 📋 LANGKAH-LANGKAH DEPLOYMENT:

### Langkah 1: Login ke Vercel

1. Buka browser dan kunjungi: https://vercel.com/login
2. Klik **"Continue with GitHub"**
3. Login ke akun GitHub Anda

**Vercel Token yang diberikan (ng6aQSzv7GiU47El2sXnGWN4) dapat digunakan jika diperlukan untuk API Vercel.**

---

### Langkah 2: Import Project dari GitHub

1. Setelah login, buka: https://vercel.com/new
2. Anda akan melihat halaman **"Import Project From Git"**
3. Cari repository: **safir2310/Ayam-Geprek**
4. Klik tombol **"Import"**

Vercel akan otomatis mendeteksi:
- Framework: Next.js ✅
- Root Directory: ./ ✅
- Build Command: next build ✅

5. Isi **Project Name**: `ayam-geprek-sambal-ijo`
6. Klik **"Deploy"**

**Tunggu 2-3 menit untuk proses deployment awal.**

---

### Langkah 3: Buat Database Vercel Postgres

1. Setelah deployment selesai, buka: https://vercel.com/dashboard
2. Pilih project: **ayam-geprek-sambal-ijo**
3. Di sidebar kiri, klik **"Storage"**
4. Klik **"Postgres"**
5. Klik tombol **"Create Database"**

6. Isi form:
   - **Database Provider**: Postgres (Neon) ✅
   - **Plan**: **Hobby** (Free - 512MB)
   - **Database Name**: `ayam-geprek-db`
   - **Region**: Pilih region terdekat (misal: Singapore)
7. Klik **"Create"**

**Tunggu 1-2 menit untuk database dibuat.**

---

### Langkah 4: Ambil Connection String

1. Setelah database dibuat, klik database yang baru dibuat
2. Klik tab **"Connect"**
3. Anda akan melihat **"Connection String"**
4. Copy connection string ini

Contoh format:
```
postgresql://default:xxxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

⚠️ **Simpan connection string ini dengan aman! Diperlukan untuk langkah berikutnya.**

---

### Langkah 5: Setup Environment Variables di Vercel

1. Di dashboard project Vercel, klik tab **"Settings"**
2. Scroll ke bawah dan klik **"Environment Variables"**
3. Klik tombol **"Add New"**

4. Isi form:
   - **Name**: `DATABASE_URL`
   - **Value**: [Paste connection string dari Langkah 4]
   - **Environments**: ✅ Centang semua:
     - Production
     - Preview
     - Development
5. Klik **"Save"**

---

### Langkah 6: Push Schema ke Database

Sekarang kita perlu push Prisma schema ke database Vercel Postgres.

**Di terminal lokal Anda:**

```bash
cd /home/z/my-project

# Update .env file dengan connection string Vercel
echo 'DATABASE_URL="[PASTE CONNECTION STRING DARI VERCEL DI SINI]"' > .env

# Push schema ke database
bun run db:push
```

Expected output:
```
Your database is now in sync with your Prisma schema.
Done in XXXms
```

✅ **Database tables sudah dibuat di Vercel Postgres!**

---

### Langkah 7: Redeploy di Vercel

1. Kembali ke Vercel dashboard: https://vercel.com/dashboard/[username]/ayam-geprek-sambal-ijo
2. Klik tab **"Deployments"**
3. Cari deployment terbaru
4. Klik titik tiga (...) di sebelah kanan
5. Klik **"Redeploy"**
6. Klik **"Redeploy"** untuk konfirmasi

**Tunggu 2-3 menit untuk redeployment selesai.**

---

### Langkah 8: Verifikasi Deployment

1. Setelah redeploy selesai, klik URL deployment Anda
2. Contoh URL: `https://ayam-geprek-sambal-ijo.vercel.app`

3. **Test Register:**
   - Buka: `https://ayam-geprek-sambal-ijo.vercel.app/auth/register`
   - Isi form User Registration:
     - Username: `testuser`
     - Password: `password123`
     - Email: `test@example.com`
     - Phone Number: `08123456789`
   - Klik: **"Register sebagai User"**
   - ✅ Harus berhasil dan redirect ke login page

4. **Test Login:**
   - Buka: `/auth/login`
   - Login dengan: `testuser` / `password123`
   - ✅ Harus berhasil dan redirect ke dashboard

5. **Test Data Persistence:**
   - Buat beberapa user dan transaksi
   - Refresh halaman
   - Data harus tetap ada (tidak hilang)

---

## ✅ CEKLIST DEPLOYMENT:

### Setup:
- [ ] Login ke Vercel berhasil
- [ ] Project dari GitHub di-import
- [ ] Deployment awal berhasil
- [ ] Vercel Postgres database dibuat
- [ ] Connection string di-copy
- [ ] Environment variable DATABASE_URL ditambahkan
- [ ] Schema di-push ke Vercel Postgres
- [ ] Redeploy berhasil

### Testing:
- [ ] Bisa register user baru
- [ ] Bisa login dengan user yang terdaftar
- [ ] Data tersimpan di database
- [ ] User dashboard bisa diakses
- [ ] Semua fitur berfungsi

---

## 🔧 TROUBLESHOOTING:

### Problem 1: "Error validating datasource db: URL must start with postgresql://"

**Solusi:**
1. Pastikan Prisma schema sudah: `provider = "postgresql"`
2. Pastikan DATABASE_URL di environment variables diawali dengan `postgresql://`
3. Redeploy setelah update

### Problem 2: Register berhasil tapi data hilang setelah refresh

**Solusi:**
1. Pastikan menggunakan Vercel Postgres, bukan SQLite lokal
2. Cek environment variable DATABASE_URL di Vercel Settings
3. Pastikan schema sudah di-push ke Vercel Postgres

### Problem 3: "Connection refused" atau error koneksi database

**Solusi:**
1. Copy connection string lagi dari Vercel Postgres
2. Pastikan tidak ada typo di DATABASE_URL
3. Cek jika ada special characters yang perlu di-escape
4. Redeploy setelah fix

### Problem 4: Build gagal di Vercel

**Solusi:**
1. Cek Vercel build logs
2. Pastikan semua dependencies di package.json
3. Pastikan Next.js configuration benar
4. Cek untuk syntax errors

---

## 📊 INFORMASI PROJECT:

### GitHub:
- **Repository**: https://github.com/safir2310/Ayam-Geprek
- **Branch**: master
- **Status**: Ready for deployment ✅

### Vercel:
- **Project Name**: ayam-geprek-sambal-ijo
- **Framework**: Next.js 16
- **Database**: Vercel Postgres (Hobby - 512MB Free)
- **Status**: Ready for deployment ✅

### Database:
- **Provider**: PostgreSQL (Vercel Postgres)
- **Models**: User, Product, Transaction, CoinExchangeProduct, CoinExchange, StoreProfile
- **Status**: Ready for schema push ✅

---

## 🎯 URL PENTING:

### Vercel:
- Dashboard: https://vercel.com/dashboard
- New Project: https://vercel.com/new
- Your Project: https://vercel.com/dashboard/[username]/ayam-geprek-sambal-ijo

### Database:
- Vercel Postgres: https://vercel.com/dashboard/storage/postgres
- Connection String: Diambil dari tab "Connect" di database

### GitHub:
- Repository: https://github.com/safir2310/Ayam-Geprek
- Settings: https://github.com/safir2310/Ayam-Geprek/settings

---

## 💡 TIPS:

### 1. Database Backup
Vercel Postgres otomatis backup 7 hari (free tier)
- Export data secara berkala
- Simpan connection string dengan aman

### 2. Environment Variables Security
- JANGAN commit .env file ke GitHub
- Selalu gunakan environment variables di Vercel dashboard
- JANGAN share connection string secara publik

### 3. Monitoring
- Cek Vercel dashboard secara berkala
- Monitor function logs untuk error
- Cek Vercel Postgres usage

### 4. Performance
- Vercel CDN global untuk fast loading
- Edge functions untuk low latency
- Auto SSL certificate

---

## 🎉 SETELAH DEPLOYMENT:

### Yang Akan Anda Dapatkan:

✅ **Production Application**
- URL: `https://ayam-geprek-sambal-ijo.vercel.app`
- Atau custom domain jika di-setup

✅ **Persistent Database**
- Data tersimpan di Vercel Postgres
- Tidak hilang saat redeploy
- Auto backup

✅ **Professional Features**
- Global CDN
- Auto SSL
- Auto scaling
- Production-ready

---

## 📞 BANTUAN:

### Documentation:
- Panduan ini: `/home/z/my-project/PANDUAN_DEPLOYMENT.md`
- Quick Start: `DEPLOYMENT_QUICK_START.md`
- Full Guide: `VERCEL_DEPLOYMENT_GUIDE.md`
- Database Fix: `DATABASE_FIX_GUIDE.md`

### Links:
- Vercel Docs: https://vercel.com/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

## 🚀 MULAI DEPLOYMENT SEKARANG!

### Langkah Cepat:

1. **Buka**: https://vercel.com/new
2. **Import**: safir2310/Ayam-Geprek
3. **Deploy**: Tunggu 2-3 menit
4. **Buka Dashboard**: https://vercel.com/dashboard
5. **Buat Database**: Storage → Postgres → Create (Hobby Free)
6. **Copy Connection String**: Dari tab Connect
7. **Add Env Var**: DATABASE_URL = [connection string]
8. **Push Schema**: `bun run db:push` (dengan DATABASE_URL Vercel)
9. **Redeploy**: Vercel dashboard → Deployments → Redeploy
10. **Test**: Register dan login!

**Total Time: ~10-15 menit**

---

## ✅ KONFIGURASI SUDAH SIAP!

- ✅ Code di GitHub
- ✅ Prisma schema PostgreSQL
- ✅ Ready untuk Vercel
- ✅ Database setup guide lengkap

**Silakan ikuti langkah-langkah di atas untuk deployment!** 🚀

---

**Selamat! Aplikasi Ayam Geprek Sambal Ijo Anda akan segera production-ready!** 🎊
