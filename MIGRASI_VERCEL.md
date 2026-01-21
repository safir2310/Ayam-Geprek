# 🚀 MIGRASI KE VERCEL - PANDUAN LENGKAP

## STEP 1: BUAT PROJECT DI VERCEL

### 1.1 Buka Vercel
```
https://vercel.com/new
```

### 1.2 Sign Up/Login
- Jika belum ada akun: Sign up dengan GitHub
- Jika sudah ada: Log in

### 1.3 Add New Project
- Klik: **"Add New Project"**
- atau scroll ke: **"Import Project From Git"**

---

## STEP 2: IMPORT DARI GITHUB

### 2.1 Cari Repository
- Pilih repository: **safir2310/Ayam-Geprek** (yang baru)
- Atau paste URL: `https://github.com/safir2310/Ayam-Geprek.git`

### 2.2 Configure Project
- **Framework Preset**: Next.js (otomatis terdeteksi)
- **Root Directory**: `./` (default)
- **Project Name**: `ayam-geprek-sambal-ijo` (atau nama lain yang diinginkan)

### 2.3 Klik: **"Import"**

**🎉 Vercel akan otomatis deploy dari GitHub!**

---

## STEP 3: SETUP VERCEL POSTGRES DATABASE

### 3.1 Buka Project di Vercel
```
https://vercel.com/dashboard
```
- Pilih project: `ayam-geprek-sambal-ijo`

### 3.2 Buka Storage → Postgres
1. Klik tab **"Storage"** di sidebar kiri
2. Klik: **"Create Database"**
3. Pilih **"Hobby" (Free - 512MB)**
4. Database Name: `ayam-geprek-db` (atau nama lain)
5. Klik: **"Create"**

### 3.3 Copy Connection String
1. Setelah database dibuat, akan muncul di list
2. Klik database yang baru dibuat
3. Tab **"Connect"**
4. Copy **"Connection String"**:

Contoh connection string:
```
postgresql://default:xxxxxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## STEP 4: UPDATE PRISMA SCHEMA

### 4.1 Edit `prisma/schema.prisma`

Buka file: `/home/z/my-project/prisma/schema.prisma`

**UBAH DARI:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**MENJADI:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Simpan file!**

---

## STEP 5: GENERATE PRISMA CLIENT

Jalankan perintah di terminal:

```bash
cd /home/z/my-project
bun run db:generate
```

Expected output:
```
✔ Generated Prisma Client (v6.11.1) to ./node_modules/@prisma/client in XXms
```

---

## STEP 6: SETUP ENVIRONMENT VARIABLES DI VERCEL

### 6.1 Buka Project Settings di Vercel
1. Klik project di Vercel dashboard
2. Klik tab **"Settings"**
3. Scroll ke **"Environment Variables"**
4. Klik: **"Add New"**

### 6.2 Add Environment Variables

#### VAR 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: [Paste connection string dari Vercel Postgres]
- **Environments**: ✅ **Production, Preview, Development** (check semua)
- Klik: **"Save"**

Contoh value:
```
postgresql://default:xxxxxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### VAR 2: NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environments**: ✅ **Production** (check Production saja)
- Klik: **"Save"**

---

## STEP 7: PUSH SCHEMA KE DATABASE

### 7.1 Set DATABASE_URL di Local (Temporary)

Buka file `.env` di `/home/z/my-project/`:

**UBAH KE:**
```env
DATABASE_URL=[PASTE CONNECTION STRING DARI VERCEL POSTGRES]
```

### 7.2 Push Schema ke Vercel Postgres

```bash
cd /home/z/my-project
bun run db:push
```

Expected output:
```
Your database is now in sync with your Prisma schema.
Done in XXms
```

---

## STEP 8: REDEPLOY DI VERCEL

### 8.1 Trigger Redeploy
Di Vercel dashboard:
1. Klik tab **"Deployments"**
2. Klik: **"Redeploy"** di deployment terakhir

Atau otomatis setiap push ke GitHub!

---

## STEP 9: VERIFIKASI DEPLOYMENT

### 9.1 Buka Aplikasi

Vercel akan memberikan URL seperti:
```
https://ayam-geprek-sambal-ijo.vercel.app
```

Atau custom domain jika disetup.

### 9.2 Test Fitur

#### Test Register:
1. Buka: `[URL]/auth/register`
2. Isi form User
3. Klik: "Register sebagai User"
4. ✅ Harus berhasil dan data tersimpan di Vercel Postgres

#### Test Login:
1. Buka: `[URL]/auth/login`
2. Login dengan username/password yang baru
3. ✅ Harus berhasil

#### Test Admin (opsional):
1. Register sebagai admin dengan tanggal lahir
2. Login
3. Buka: `[URL]/admin/dashboard`
4. ✅ Harus bisa akses dashboard admin

---

## ✅ CHECKLIST PRODUCTION

### Sebelum Production:

- [ ] Project dibuat di Vercel
- [ ] Repository GitHub di-import
- [ ] Vercel Postgres dibuat
- [ ] Connection string di-copy
- [ ] Prisma schema diubah ke `postgresql`
- [ ] Prisma client di-generate
- [ ] Environment variables di-set di Vercel
- [ ] Schema di-push ke Vercel Postgres
- [ ] Deployment berhasil

### Setelah Production:

- [ ] Aplikasi dapat diakses via Vercel URL
- [ ] Register user baru berhasil
- [ ] Login berhasil
- [ ] Data tersimpan persisten di Vercel Postgres
- [ ] Admin dashboard berfungsi
- [ ] Semua fitur berjalan normal

---

## 🔧 TROUBLESHOOTING

### Error 1: "Unknown database provider: postgresql"

**Solusi:**
```bash
bun run db:generate
```
Generate ulang Prisma client setelah ubah schema.

---

### Error 2: "P3001: Connection refused" / "connection error"

**Solusi:**
1. Pastikan DATABASE_URL di environment variables sudah benar
2. Copy connection string dari Vercel Postgres lagi
3. Cek jika ada special characters
4. Re-deploy setelah update environment variables

---

### Error 3: "Table doesn't exist" / "No such table"

**Solusi:**
```bash
# Set DATABASE_URL lokal
DATABASE_URL="[VERCEL CONNECTION STRING]" bun run db:push
```

Push schema ke Vercel Postgres dari local terminal.

---

### Error 4: Register gagal "server error"

**Solusi:**
1. Buka Vercel → Functions
2. Cek logs function register
3. Lihat error detail
4. Pastikan environment variables sudah benar

---

## 🎯 PERBANDINGAN: NETLIFY vs VERCEL

| Fitur | Netlify + SQLite | Vercel + Postgres |
|-------|------------------|-------------------|
| **Database** | ❌ Data hilang | ✅ Persisten |
| **Free Tier** | ✅ Ada | ✅ Ada |
| **Setup** | 10-15 menit | 5 menit |
| **Deployment** | Manual push | Otomatis dari GitHub |
| **Next.js Support** | ⚠️ Manual config | ✅ Native |
| **SSL** | ✅ Auto | ✅ Auto |
| **Scaling** | ❌ Terbatas | ✅ Otomatis |
| **Production** | ❌ Tidak cocok | ✅ Ready |
| **Persistence** | ❌ Tidak | ✅ Ya |

---

## 📞 LINKS PENTING:

### Vercel:
- **Dashboard**: https://vercel.com/dashboard
- **Create Project**: https://vercel.com/new
- **Your Project**: https://vercel.com/dashboard/[username]/ayam-geprek-sambal-ijo
- **Vercel Postgres**: https://vercel.com/dashboard/[username]/storage/postgres
- **Docs**: https://vercel.com/docs

### GitHub:
- **Repository**: https://github.com/safir2310/Ayam-Geprek
- **Deployment Settings**: https://github.com/safir2310/Ayam-Geprek/settings/deployments

---

## 💡 TIPS PRODUCTION:

### 1. Database Backups
Vercel Postgres otomatis backup, tapi untuk keamanan:
- Export data secara berkala
- Copy connection string dan simpan di tempat aman

### 2. Environment Variables Security
✅ JANGAN commit `.env` file ke GitHub
✅ Gunakan environment variables di Vercel dashboard
✅ JANGAN share connection string

### 3. Monitoring
✅ Check Vercel dashboard secara berkala
✅ Monitor function logs untuk error
✅ Cek Vercel Postgres usage

### 4. Performance
✅ Vercel CDN global untuk fast loading
✅ Edge functions untuk low latency
✅ Auto SSL certificate

---

## 🎉 SUMMARY

### Langkah Singkat:

1. **Vercel**: Import `safir2310/Ayam-Geprek`
2. **Postgres**: Create database di Vercel
3. **Schema**: Ubah `prisma/schema.prisma` ke `postgresql`
4. **Generate**: `bun run db:generate`
5. **Env Vars**: Add `DATABASE_URL` di Vercel Settings
6. **Push Schema**: `bun run db:push` (dengan DATABASE_URL Vercel)
7. **Deploy**: Otomatis dari GitHub!

---

## 🚀 MULAI SEKARANG!

1. Buka: **https://vercel.com/new**
2. Import: `safir2310/Ayam-Geprek`
3. Create Vercel Postgres database
4. Update environment variables
5. Push schema
6. ✅ Production ready!

---

**Estimated Time Setup: 5-10 menit**

**Good luck! Aplikasi Ayam Geprek Sambal Ijo akan production-ready dengan Vercel + Vercel Postgres!** 🎊
