# 🗄️ SETUP VERCEL POSTGRES DATABASE
## Panduan Visual Lengkap dengan Langkah-Demi-Langkah

---

## 🎯 OVERVIEW

### Apa yang Akan Kita Lakukan:
1. ✅ Create project di Vercel
2. ✅ Create Vercel Postgres database
3. ✅ Get connection string
4. ✅ Configure environment variables
5. ✅ Push database schema
6. ✅ Test connection

---

## 📋 PREPARATION

### Pastikan Anda Punya:
- ✅ GitHub account
- ✅ Vercel account (buat di https://vercel.com/signup jika belum ada)
- ✅ Project code sudah di GitHub: https://github.com/safir2310/Ayam-Geprek

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1: Buka Vercel & Buat Project

#### 1.1 Buka Vercel
```
https://vercel.com
```

#### 1.2 Login / Sign Up
- Jika belum ada akun: Klik "Sign Up"
- Gunakan GitHub untuk login (RECOMMENDED) atau email

#### 1.3 Buat Project Baru
Setelah login:

**Cari yang Anda LIHAT di Dashboard:**
- Tombol besar di tengah: **"Add New Project"** atau
- Link: **"Your Projects"** → **"Add New"**

**Klik: "Add New Project"** atau "Add New"**

---

### STEP 2: Import dari GitHub

#### 2.1 Halaman "Import Project"

**Anda akan LIHAT form:**

```
┌─────────────────────────────────────────────────┐
│                                         │
│  Import Project                         │
│                                         │
│  [ Import Git Repository ]                │
│                                         │
│  Repository or git URL                   │
│  [safir2310        ▼]                  │
│  Ayam-Geprek                           │
│                                         │
│  Project Name (used in deployment URL)   │
│  [ ayam-geprek-sambal-ijo            ] │
│                                         │
│  Framework Preset                        │
│  [ Next.js                      ▼]     │
│                                         │
│  Root Directory                          │
│  [ ./                                   ] │
│                                         │
│  [ Import ]    [ Cancel ]                │
│                                         │
└─────────────────────────────────────────────────┘
```

#### 2.2 Isi Form

**Repository:**
- Klik dropdown "Repository"
- Cari: **safir2310** (username Anda)
- Pilih: **Ayam-Geprek** (repository yang baru)

**Project Name:**
- Isi: **ayam-geprek-sambal-ijo**
- Ini akan menjadi bagian URL nanti

**Framework Preset:**
- Pastikan: **Next.js** (otomatis terdeteksi)

**Root Directory:**
- Biarkan: **./** (default)

#### 2.3 Klik Tombol: **[ Import ]**

⏱️ Tunggu proses import (1-2 menit)

---

### STEP 3: Setup Vercel Postgres Database

#### 3.1 Setelah Import Selesai

**Anda akan diarahkan ke halaman project dashboard:**

```
https://vercel.com/[username]/ayam-geprek-sambal-ijo
```

#### 3.2 Cari Tab "Storage"

**Di Sidebar kiri, Anda akan LIHAT menu:**
```
┌───────────────────────────────┐
│ Overview                       │
│ Deployments                   │
│ 🔴 Storage                    │ ← KLIK INI
│ Environment Variables          │
│ Settings                      │
│ Integrations                  │
└───────────────────────────────┘
```

**Klik: "Storage"**

#### 3.3 Halaman Storage

**Anda akan LIHAT:**

```
┌─────────────────────────────────────────────────────────┐
│                                                 │
│  Storage                                         │
│                                                 │
│  ┌─────────────────────────────────────────────┐     │
│  │ Create a Postgres Database                 │     │
│  │                                         │     │
│  │ Database Name                            │     │
│  │ [ ayam-geprek-db                   ] │     │
│  │                                         │     │
│  │ Region                                  │     │
│  │ [ Washington D.C. (East US)      ▼ ] │     │
│  │                                         │     │
│  │ Plan / Database Size                     │     │
│  │ [ Free (Hobby) - 512 MB            ▼ ] │     │
│  │                                         │     │
│  │ [ Create Database ]                     │     │
│  │                                         │     │
│  └─────────────────────────────────────────────┘     │
│                                                 │
│  Your existing databases                       │
│  (no databases yet)                          │
│                                                 │
└─────────────────────────────────────────────────────────┘
```

#### 3.4 Isi Database Form

**Database Name:**
- Isi: **ayam-geprek-db**
- Atau nama lain yang mudah diingat

**Region:**
- Biarkan: **Washington D.C. (East US)** (default - paling cepat)
- Atau pilih region terdekat dengan user base

**Plan / Database Size:**
- Klik dropdown
- Pilih: **Free (Hobby) - 512 MB**
- Ini GRATIS untuk aplikasi Anda

#### 3.5 Klik: **[ Create Database ]**

⏱️ Tunggu proses (10-30 detik)

---

### STEP 4: Get Connection String

#### 4.1 Setelah Database Dibuat

**Anda akan LIHAT daftar database:**

```
┌─────────────────────────────────────────────────────────┐
│                                                 │
│  Your existing databases                       │
│                                                 │
│  ┌─────────────────────────────────────────────┐     │
│  │ ayam-geprek-db                       │     │
│  │ 512 MB / 512 MB (0% used)         │     │
│  │                                         │     │
│  │ [ ... ] [ ⋮ ] [ ⚙ ]  [ 🗑 ]      │     │
│  │                                         │     │
│  │ Washington D.C. (East US)             │     │
│  │ Hobby                                  │     │
│  │ Updated 2 seconds ago                  │     │
│  │                                         │     │
│  └─────────────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────────────┘
```

#### 4.2 Klik Tombol: **[ ⋮ ]** (menu)

**Menu dropdown akan muncul:**

```
┌─────────────────────┐
│                  │
│  Manage           │
│  Reset Password    │
│  ⚙ Settings      │
│  🗑 Delete         │
│                  │
└─────────────────────┘
```

**Klik: "Manage"**

#### 4.3 Halaman Manage Database

**Anda akan LIHAT:**

```
┌─────────────────────────────────────────────────────────┐
│                                                 │
│  Connect                                   │
│                                                 │
│  ├──────────────────────────────────────────────┤     │
│  │                                           │     │
│  │  Welcome to ayam-geprek-db       │     │
│  │                                           │     │
│  │  Your database is ready to use!        │     │
│  │                                           │     │
│  └──────────────────────────────────────────────┘     │
│                                                 │
│  ├──────────────────────────────────────────────┤     │
│  │                                           │     │
│  │  Connection String                         │     │
│  │                                           │     │
│  │ ┌─────────────────────────────────────┐   │     │
│  │ │ postgresql://default:xxxxx     │   │     │
│  │ │ @ep-xxx.aws.neon.tech/neondb   │   │     │
│  │ │ ?sslmode=require                     │   │     │
│  │ │                                   │   │     │
│  │ │ [  Reset Password    ]            │   │     │
│  │ │ [ ⏎  Close          ]            │   │     │
│  │ │                                   │   │     │
│  │ └─────────────────────────────────────┘   │     │
│  │                                           │     │
│  └──────────────────────────────────────────────┘     │     │
│                                                 │
└─────────────────────────────────────────────────────────┘
```

#### 4.4 Copy Connection String

**LANGKAH-PENTING:**

❌ **JANGAN** copy dari box kecil (terputus)
✅ **GUNAKAN** tombol copy di Vercel (belum ada di UI lama)

**Solusi Temporary:**
1. Highlight seluruh connection string
2. Ctrl+C (Windows) / Cmd+C (Mac)
3. Paste ke tempat aman (Notepad, dll)

**Contoh connection string yang akan ANDA LIHAT:**
```
postgresql://default:c6c7b9b8c8c0f5e3d5a6@ep-fuzzy-moon-a42c5e1.us-east-1.aws.neon.tech/neondb?sslmode=require
```

📋 **SIMPAN CONNECTION STRING INI!** Diperlukan di langkah berikutnya.

---

### STEP 5: Configure Environment Variables di Vercel

#### 5.1 Kembali ke Project Dashboard

**Cari dan klik tab: "Environment Variables"**

```
https://vercel.com/[username]/ayam-geprek-sambal-ijo/settings/environment-variables
```

#### 5.2 Halaman Environment Variables

**Anda akan LIHAT:**

```
┌─────────────────────────────────────────────────────────┐
│                                                 │
│  Environment Variables                       │
│                                                 │
│  ┌─────────────────────────────────────────────┐     │
│  │ Key                   │ Value        │     │
│  │                       │              │     │
│  └─────────────────────────────────────────────┘     │
│                                                 │
│  [ Select Environment  All ▼ ]                │
│  [ Add New        ]                             │
│                                                 │
│  Your existing variables                       │
│  (no variables yet)                             │
│                                                 │
└─────────────────────────────────────────────────────────┘
```

#### 5.3 Klik: **[ Add New ]**

#### 5.4 Form Add Environment Variable

**Pop-up akan muncul:**

```
┌──────────────────────────────────────────────┐
│                                        │
│  Add Environment Variable           │
│                                        │
│  Key                            │
│  [ DATABASE_URL                  ]     │
│                                        │
│  Value                          │
│  [                              ]     │
│  [                              ]     │
│  [                              ]     │
│                                        │
│  Environments                  │
│  ☐ Preview                       │
│  ☑ Production                   │
│  ☐ Development                  │
│                                        │
│  [    Save    ]    [ Cancel ]   │
│                                        │
└──────────────────────────────────────────────┘
```

#### 5.5 Isi Form

**Key:**
```
DATABASE_URL
```

**Value:**
```
[PASTE CONNECTION STRING DARI STEP 4]
```

Contoh (paste string lengkap):
```
postgresql://default:c6c7b9b8c8c0f5e3d5a6@ep-fuzzy-moon-a42c5e1.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Environments:**
- ✅ Check **Production** (paling penting)
- ☐ Preview (opsional)
- ☐ Development (opsional)

#### 5.6 Klik: **[ Save ]**

⏱️ Tunggu save (2-5 detik)

#### 5.7 Verify Variable Tersimpan

**Scroll ke "Your existing variables":**

```
┌─────────────────────────────────────────────────────────┐
│                                                 │
│  Your existing variables                       │
│                                                 │
│  ┌─────────────────────────────────────────────┐     │
│  │ Key                   │ Value        │     │
│  │                       │              │     │
│  │ DATABASE_URL          │ postgresql:   │     │
│  │                       │ @ep-xxx.aws.. │     │
│  │                       │ .neon.tech/.. │     │
│  │                       │              │     │
│  └─────────────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────────────┘
```

✅ Pastikan **DATABASE_URL** sudah ada!

---

### STEP 6: Generate Prisma Client

#### 6.1 Buka Terminal di Lokal

```bash
cd /home/z/my-project
```

#### 6.2 Generate Prisma Client

```bash
bun run db:generate
```

**Expected Output:**
```
Environment variables loaded from .env
✔ Generated Prisma Client (v6.11.1) to ./node_modules/@prisma/client in 57ms
```

✅ Jika muncul ini, berhasl!

---

### STEP 7: Push Schema ke Vercel Postgres

#### 7.1 Update .env File Lokal

**Edit file: `/home/z/my-project/.env`**

```bash
nano .env
# atau
vim .env
```

**Isi dengan:**
```env
DATABASE_URL=[PASTE CONNECTION STRING DARI VERCEL]
```

Contoh lengkap:
```env
DATABASE_URL=postgresql://default:c6c7b9b8c8c0f5e3d5a6@ep-fuzzy-moon-a42c5e1.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### 7.2 Save File

- Jika pakai nano: `Ctrl+X`, `Y`, `Enter`
- Jika pakai vim: `:wq`, `Enter`

#### 7.3 Push Schema ke Database

```bash
bun run db:push
```

**Expected Output:**
```
Environment variables loaded from .env
Datasource "db": PostgreSQL database "neondb" at "ep-xxx..."
🚀  Your database is now in sync with your Prisma schema.
Done in 2342ms
Running generate...
✔ Generated Prisma Client (v6.11.1) to ./node_modules/@prisma/client in 57ms
```

✅ Schema berhasil di-push!

---

### STEP 8: Deploy Aplikasi

#### 8.1 Check Deployments di Vercel

**Kembali ke tab: "Deployments"**

**Scroll ke deployment terbaru:**

```
┌─────────────────────────────────────────────────────────┐
│                                                 │
│  Deployments                                 │
│                                                 │
│  ┌─────────────────────────────────────────────┐     │
│  │ ayam-geprek-sambal-ijo         │     │
│  │                                   │     │
│  │ Production   Ready  2m ago         │     │
│  │                                   │     │
│  │ ┌──────────────────────────────────┐ │     │
│  │ │ https://ayam-geprek-... │ │     │
│  │ │ .vercel.app/             │ │     │
│  │ └──────────────────────────────────┘ │     │
│  │                                   │     │
│  │ [ View Deployment ] [ ... ]     │ │     │
│  │                                   │     │
│  └─────────────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────────────┘
```

#### 8.2 Klik URL Production

**Klik URL di box:**

```
https://ayam-geprek-sambal-ijo.vercel.app
```

🎉 Aplikasi sudah deployed!

---

## ✅ VERIFIKASI

### Test Register User

1. Buka: `https://ayam-geprek-sambal-ijo.vercel.app/auth/register`
2. Isi form User
3. Klik "Register"
4. ✅ Harus berhasil tanpa error

### Test Login

1. Buka: `https://ayam-geprek-sambal-ijo.vercel.app/auth/login`
2. Masukkan username/password yang baru
3. Klik "Login"
4. ✅ Harus berhasil dan redirect ke dashboard

### Test Admin Dashboard

1. Buka: `https://ayam-geprek-sambal-ijo.vercel.app/admin/dashboard`
2. ✅ Harus bisa akses jika login sebagai admin

---

## 🔍 TROUBLESHOOTING

### Error 1: "Unknown database provider: postgresql"

**Cause:** Prisma belum generate setelah ubah schema

**Solusi:**
```bash
bun run db:generate
bun run db:push
```

---

### Error 2: "Unable to connect to database"

**Cause:** Connection string salah atau environment variable belum set

**Solusi:**
1. Check Vercel Dashboard → Environment Variables
2. Pastikan DATABASE_URL ada dan benar
3. Copy connection string lagi dan paste

---

### Error 3: "Table doesn't exist"

**Cause:** Schema belum di-push ke database

**Solusi:**
```bash
# Pastikan .env sudah di-update
cat .env

# Push schema lagi
bun run db:push
```

---

### Error 4: "Register gagal (server error)"

**Cause:** Database tidak connect saat runtime

**Solusi:**
1. Buka Vercel Functions → Logs
2. Cari error di logs
3. Pastikan DATABASE_URL ada di Production
4. Redeploy dari Vercel dashboard

---

## 📋 CEKLIST PRODUCTION

### Sebelum Production:
- [ ] Project dibuat di Vercel
- [ ] Vercel Postgres database dibuat
- [ ] Connection string di-copy
- [ ] Environment variable DATABASE_URL di-set
- [ ] Prisma client di-generate
- [ ] Schema di-push ke Vercel Postgres
- [ ] Deployment berhasil
- [ ] Production URL dapat diakses

### Setelah Production:
- [ ] Register user baru berhasil
- [ ] Login berhasil
- [ ] Data tersimpan persisten
- [ ] Admin dashboard bisa diakses
- [ ] Semua fitur berfungsi normal

---

## 🎯 LANGKAH RINGKAS

### Jika semua lancar (5-10 menit):

1. ✅ Import GitHub ke Vercel → 1 menit
2. ✅ Create Vercel Postgres → 2 menit
3. ✅ Copy connection string → 30 detik
4. ✅ Add environment variable → 1 menit
5. ✅ Generate Prisma client → 30 detik
6. ✅ Push schema ke database → 2 menit
7. ✅ Verifikasi dan test → 2 menit

**Total: ~9 menit untuk production-ready deployment!** 🚀

---

## 📞 LINKS

### Vercel:
- Dashboard: https://vercel.com/dashboard
- Project: https://vercel.com/[username]/ayam-geprek-sambal-ijo
- Storage: https://vercel.com/dashboard/[username]/storage
- Docs: https://vercel.com/docs/postgres

### GitHub:
- Repository: https://github.com/safir2310/Ayam-Geprek

---

## 💡 TIPS

1. **Save Connection String** di Notepad atau tempat aman
2. **Database Vercel Postgres** adalah FREE untuk 512MB
3. **Auto backup** - Vercel Postgres otomatis backup
4. **Monitoring** - Cek Vercel dashboard berkala
5. **Security** - JANGAN share connection string

---

## 🎉 SUMMARY

✅ Vercel project dibuat
✅ Vercel Postgres database dibuat (Free 512MB)
✅ Connection string didapat
✅ Environment variable di-setup
✅ Prisma schema di-push ke PostgreSQL
✅ Production-ready deployment

**Aplikasi Ayam Geprek Sambal Ijo sekarang production-ready dengan database persisten!**

---

**MULAI DENGAN STEP 1 SEKARANG!** 🚀

Buka: https://vercel.com/new
