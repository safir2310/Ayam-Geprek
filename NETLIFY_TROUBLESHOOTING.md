# 🚨 NETLIFY TROUBLESHOOTING GUIDE
## Masalah Register di Netlify

---

## 🔍 Step 1: Check Logs Netlify (PENTING)

### Cara Akses Logs:
1. Buka Netlify Dashboard: https://app.netlify.com/sites/ayamgeprek01
2. Klik tab "Functions" di sidebar
3. Klik "Functions log"
4. Filter log dengan search: `[REGISTER]`

### Apa yang Harus Terlihat:
```
[REGISTER] Registration attempt
[REGISTER] Request body: { type: 'user', username: '...', email: '...' }
[REGISTER] Testing database connection...
[REGISTER] Database connection OK, total users: X
[REGISTER] Checking if username exists...
[REGISTER] Creating user in database...
[REGISTER] User created successfully: ...
```

### Jika Tidak Ada Log:
❌ **Artinya**: Request tidak sampai ke server
**Solusi**: Check build logs di "Deploys" tab

---

## 🌐 Step 2: Setup Environment Variables di Netlify

### 1. Buka Netlify Dashboard → Site Settings → Environment Variables

### 2. Tambah Variable Berikut:

#### **VAR 1: NODE_ENV**
- **Key**: `NODE_ENV`
- **Value**: `production`

#### **VAR 2: DATABASE_URL**
- **Key**: `DATABASE_URL`
- **Value**: `file:/tmp/custom.db`

### 3. JANGAN LUPA:
- ✅ Check "Sensitive variable" untuk security
- ✅ Apply to: "All environments" atau pilih environment spesifik

### 4. **SAVE VARIABLES**
- Klik "Save changes"

### 5. **REDEPLOY**
- Automatic atau manual trigger redeploy

---

## 🔧 Step 3: Redeploy Setelah Setup Environment Variables

### Cara Redeploy:
1. Buka tab "Deploys" di Netlify Dashboard
2. Klik "Trigger deploy"
3. Pilih branch: `main`
4. Klik "Trigger deploy"

Atau dari command line:
```bash
netlify deploy --prod
```

### Tunggu Deploy Selesai:
- Status akan berubah: "Queued" → "Building" → "Deployed"
- Proses biasanya 2-5 menit

---

## 🔍 Step 4: Test Register Lagi

### Test URL:
```
https://ayamgeprek01.netlify.app/auth/register
```

### Test Data:
```json
{
  "type": "user",
  "username": "testuser002",
  "password": "password123",
  "email": "test002@example.com",
  "phoneNumber": "08123456789"
}
```

### Harus Terjadi:
✅ Register berhasil
✅ Redirect ke halaman login
✅ User dibuat di database

---

## 🐛 Error Scenarios & Solusi

### Error 1: "Terjadi kesalahan server"
**Possible Causes:**
- Database tidak bisa dibuat di /tmp
- Prisma client belum digenerate
- Permission issues

**Solusi:**
1. Check logs Netlify Functions untuk detail error
2. Pastikan environment variable `DATABASE_URL` sudah di-set
3. Pastikan build script: `bun run db:generate && next build`

---

### Error 2: Log Kosong / "Function not found"
**Possible Causes:**
- Build gagal
- Functions tidak ter-deploy

**Solusi:**
1. Check "Deploys" tab
2. Lihat build logs
3. Pastikan `netlify.toml` di-root directory

---

### Error 3: "Unable to open database file"
**Possible Causes:**
- Database path salah
- Permission /tmp tidak cukup
- File corrupted

**Solusi:**
1. Update environment variable: `DATABASE_URL=file:/tmp/custom.db`
2. Redeploy
3. Jika masih gagal → gunakan Vercel Postgres

---

## ⚠️ MASALAH FUNDAMENTAL DENGAN SQLITE DI NETLIFY

### Kenapa SQLite TIDAK COCOK untuk Production di Netlify:

1. **Serverless Environment**
   - Netlify Functions adalah serverless
   - Tidak ada filesystem persisten
   - /tmp hanya temporary

2. **Data Hilang Setiap Redeploy**
   - Setiap redeploy = container baru
   - Database di /tmp di-reset
   - SEMUA DATA HILANG

3. **Tidak Cocok untuk Production**
   - User baru diregister akan hilang
   - Produk baru akan hilang
   - Pesanan akan hilang

---

## ✅ SOLUSI TERBAIK: MIGRASI KE VERCEL + VERCEL POSTGRES

### Kenapa Vercel Postgres:
✅ **Gratis** - 500MB storage
✅ **Persisten** - Data tidak hilang
✅ **Next.js Creator** - Support terbaik
✅ **Auto SSL** - Gratis
✅ **CDN Global** - Fast worldwide
✅ **Zero Config** - Deploy dari GitHub dalam 1 klik

---

## 🚀 MIGRASI KE VERCEL (Recommended)

### Step 1: Buat Account Vercel
1. Buka: https://vercel.com
2. Sign up / Sign in dengan GitHub
3. Otorisasi repository

### Step 2: Buat Project Baru
1. Klik "Add New Project"
2. Import from GitHub: `safir2310/Ayam-Geprek`
3. Klik "Import"

### Step 3: Setup Vercel Postgres
1. Di dashboard project, klik "Storage" → "Postgres"
2. Klik "Create Database"
3. Pilih plan: Free (Hobby)
4. Klik "Create"
5. Copy **DATABASE_URL** dari tab "Connect"

### Step 4: Update Environment Variables
1. Di dashboard project Vercel
2. Klik "Settings" → "Environment Variables"
3. Add variable:
   - **Key**: `DATABASE_URL`
   - **Value**: [paste connection string dari Vercel Postgres]
   - **Select**: All environments
4. Klik "Save"

### Step 5: Update Prisma Schema
```bash
# Edit prisma/schema.prisma
datasource db {
  provider = "postgresql"  // Ubah ke postgresql
  url      = env("DATABASE_URL")
}
```

### Step 6: Generate Prisma Client
```bash
bunx prisma generate
```

### Step 7: Push Schema ke Database
```bash
bunx prisma db push
```

### Step 8: Deploy!
Vercel akan otomatis deploy dari GitHub!

---

## 🎯 QUICK CHECKLIST NETLIFY

Sebelum men-debug lebih lanjut:

- [ ] Logs Netlify Functions sudah dicek
- [ ] Environment variables sudah di-set:
  - [ ] NODE_ENV=production
  - [ ] DATABASE_URL=file:/tmp/custom.db
- [ ] Setelah setup, sudah redeploy
- [ ] Test register lagi
- [ ] Jika masih error → migrate ke Vercel Postgres

---

## 📞 Link Penting:

- **Netlify Dashboard**: https://app.netlify.com/sites/ayamgeprek01
- **Functions Logs**: Dashboard → Functions → Functions log
- **Deploy Logs**: Dashboard → Deploys
- **Environment Variables**: Dashboard → Site Settings → Environment variables

- **Vercel Deploy**: https://vercel.com/new (RECOMMENDED ⭐)

---

## 💡 REKOMENDASI FINAL:

### Untuk DEMO/TESTING:
✅ Bisa gunakan Netlify dengan SQLite
✅ Ingat: Data akan hilang setiap redeploy
✅ Gunakan hanya untuk testing fitur

### Untuk PRODUCTION:
🥇 **GUNAKAN VERCEL + VERCEL POSTGRES**
- Gratis
- Persisten
- Support Next.js terbaik
- Mudah setup dalam 5 menit

---

**NETLIFY + SQLITE = TIDAK STABLE UNTUK PRODUCTION**
**VERCEL + POSTGRES = PRODUCTION READY**
