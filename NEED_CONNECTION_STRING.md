# 🔑 DIBUTUHKAN: VERCEL POSTGRES CONNECTION STRING

## 📋 APA YANG DIPERLUKAN:

Untuk push schema ke database, saya membutuhkan connection string dari Vercel Postgres.

---

## 📋 DAPATKAN CONNECTION STRING:

### Langkah 1: Buka Vercel
1. Buka: https://vercel.com/dashboard
2. Login dengan GitHub: safir2310

### Langkah 2: Buka Project ayamgepreksambalijo
- Cari project: **ayamgepreksambalijo**
- Klik project tersebut

### Langkah 3: Cek Database
- Cek apakah database sudah dibuat:
  - Klik menu: **Storage**
  - Klik: **Postgres**
  - Jika database sudah ada, lanjut ke Langkah 4
  - Jika belum ada, klik **"Create Database"**
    - Provider: **Postgres (Neon)**
    - Plan: **Hobby (Free - 512MB)**
    - Name: `ayamgeprek-db`
    - Region: **Singapore/Jakarta**
    - Click: **Create**

### Langkah 4: Copy Connection String
1. Jika database sudah ada atau baru dibuat, klik database tersebut
2. Klik tab: **"Connect"**
3. Di bagian **"Connection String"**, klik tombol **"Copy"**
4. Connection string akan seperti ini:
   ```
   postgresql://default:xxxxxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## ✅ SETELAH ANDA DAPATKAN CONNECTION STRING:

Saya akan jalankan perintah ini:

```bash
cd /home/z/my-project

# Update .env dengan connection string Vercel
echo 'DATABASE_URL="[CONNECTION STRING ANDA]"' > .env

# Push schema ke Vercel Postgres
bun run db:push
```

Expected output:
```
Environment variables loaded from .env
Your database is now in sync with your Prisma schema.
Done in XXXms
```

---

## 🎯 NEXT STEPS:

### Setelah connection string diberikan:

1. ✅ Saya akan update file .env
2. ✅ Saya akan jalankan: `bun run db:push`
3. ✅ Saya akan verify schema berhasil di-push
4. ✅ Database tables akan dibuat di Vercel Postgres

---

## 📋 CEKLIST SEBELUM KASI CONNECTION STRING:

- [ ] Login ke Vercel: https://vercel.com/login
- [ ] Buka project: ayamgepreksambalijo
- [ ] Buka: Storage → Postgres
- [ ] Buat database (jika belum ada): ayamgeprek-db
- [ ] Klik database yang sudah dibuat
- [ ] Klik tab: Connect
- [ ] Copy connection string
- [ ] KASI CONNECTION STRING KE SAYA

---

## 💡 CONTOH CONNECTION STRING:

```
postgresql://default:abcdef123456789@ep-cool-silence-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Format:
- Dimulai dengan: `postgresql://`
- User: `default`
- Password: string random setelah @
- Host: `ep-xxx.ap-southeast-1.aws.neon.tech`
- Database: `neondb`
- SSL parameter: `?sslmode=require`

---

## 🚀 SETELAH CONNECTION STRING DITERIMA:

Silakan reply dengan connection string yang Anda copy dari Vercel, lalu saya akan:

1. Update .env file
2. Push Prisma schema ke database
3. Create semua tables di Vercel Postgres
4. Verifikasi database connection

---

## 📞 BUTUH BANTUAN?

Jika kesulitan mendapatkan connection string:
1. Buka: `BUAT_DATABASE_VERCEL.md`
2. Cek section "Langkah 5: Copy Connection String"
3. Pastikan database sudah dibuat
4. Pastikan database status: **Active**
5. Klik database dan buka tab **Connect**

---

**Silakan reply dengan connection string dari Vercel Postgres!** 🔑
