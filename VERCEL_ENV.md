# 🌐 Environment Variables untuk Vercel Deployment

Gunakan environment variables ini saat deploy ke Vercel.

---

## 📋 Environment Variables untuk Vercel

### 1. DATABASE_URL (Production, Preview, Development)

```
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

**Description:**
- Primary database connection untuk aplikasi
- Menggunakan connection pooling untuk optimal performance
- Parameter `connect_timeout=15` untuk timeout 15 detik
- Parameter `sslmode=require` untuk SSL connection wajib

---

### 2. DIRECT_URL (Production, Preview, Development)

```
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Description:**
- Direct connection untuk database migrations
- Tanpa connection pooling (pgbouncer)
- Digunakan untuk schema changes dan migrations
- SSL connection wajib

---

### 3. NEXTAUTH_SECRET (Production, Preview, Development)

```
ayam-geprek-sambal-ijo-secret-2025-production
```

**Description:**
- Secret key untuk NextAuth.js authentication
- Digunakan untuk signing JWT tokens
- Gunakan string yang sama di semua environments

**Note:** Untuk production yang lebih aman, generate dengan:
```bash
openssl rand -base64 32
```

---

### 4. NEXTAUTH_URL (Production Only)

```
https://ayam-geprek.vercel.app
```

**Description:**
- URL production aplikasi
- Wajib untuk NextAuth di production
- Update setelah deployment selesai

**Untuk Preview & Development:**
- Biarkan kosong
- Atau gunakan `http://localhost:3000` untuk local development

---

## 🔧 Cara Menambahkan di Vercel

### Via Vercel Dashboard (Web)

1. Buka [vercel.com](https://vercel.com)
2. Pilih project **Ayam-Geprek**
3. Klik **Settings** → **Environment Variables**
4. Klik **"Add New"**
5. Masukkan **Name** dan **Value** dari atas
6. Pilih Environment(s): `Production, Preview, Development`
7. Klik **"Save"**
8. Ulangi untuk setiap variabel

### Via Vercel CLI

```bash
# Login dulu (jika belum)
vercel login --token YOUR_VERCEL_TOKEN

# Link project (jika belum)
vercel link

# Add DATABASE_URL
vercel env add DATABASE_URL
# Pilih environment: Production, Preview, Development
# Paste value

# Add DIRECT_URL
vercel env add DIRECT_URL
# Pilih environment: Production, Preview, Development
# Paste value

# Add NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET
# Pilih environment: Production, Preview, Development
# Paste value

# Add NEXTAUTH_URL
vercel env add NEXTAUTH_URL
# Pilih environment: Production only
# Paste value setelah deployment selesai
```

---

## 📊 Environment Variables Summary

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `ayam-geprek-sambal-ijo-secret-2025-production` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://ayam-geprek.vercel.app` | Production only |

---

## ✅ Verifikasi Setup

### 1. Cek Environment Variables di Local

```bash
# Lihat .env file
cat .env

# Test database connection
bun run db:push
```

### 2. Cek Environment Variables di Vercel

```bash
# List semua environment variables
vercel env ls

# Pull environment variables ke local
vercel env pull .env.local
```

### 3. Verify Database Connection

Setelah deployment, test dengan menjalankan query di Neon Console:

```sql
-- Cek koneksi
SELECT NOW();

-- Cek tabel
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 🎯 Quick Copy untuk Vercel

### DATABASE_URL
```
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

### DIRECT_URL
```
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### NEXTAUTH_SECRET
```
ayam-geprek-sambal-ijo-secret-2025-production
```

### NEXTAUTH_URL (setelah deploy)
```
https://ayam-geprek.vercel.app
```

---

## 📝 Notes

### Environment Variables Rules:
1. ✅ `DATABASE_URL` dan `DIRECT_URL` harus sama di Production, Preview, Development
2. ✅ `NEXTAUTH_SECRET` harus sama di semua environments
3. ✅ `NEXTAUTH_URL` hanya diisi untuk Production
4. ✅ Gunakan connection string yang sudah disediakan oleh Neon

### Security Notes:
1. ⚠️ JANGAN share environment variables dengan siapapun
2. ⚠️ JANGAN commit `.env` file ke GitHub
3. ⚠️ Gunakan secrets management yang disediakan Vercel
4. ⚠️ Rotate secrets secara berkala untuk production

---

## 🚀 Next Steps

1. ✅ Setup environment variables di Vercel
2. ✅ Deploy ke Vercel
3. ✅ Test aplikasi di production URL
4. ✅ Verify database connection di production
5. ✅ Selesai! 🎉

---

**Last Updated:** 2025
**Project:** AYAM GEPREK SAMBAL IJO
**Database:** Neon (Vercel Postgres)
**Deployment:** Vercel
