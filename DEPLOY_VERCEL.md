# 🚀 Deployment ke Vercel - AYAM GEPREK SAMBAL IJO

Database Neon sudah siap dan schema sudah ter-sync! Sekarang saatnya deploy ke Vercel.

---

## ✅ Status Saat Ini

- ✅ Database Neon sudah terhubung
- ✅ Schema Prisma sudah di-push ke database
- ✅ Semua tabel sudah dibuat (18 tabel)
- ✅ Prisma Client sudah digenerate
- ✅ Kode sudah terupload ke GitHub: https://github.com/safir2310/Ayam-Geprek

---

## 📋 Langkah 1: Setup Environment Variables di Vercel

### 1.1 Buka Vercel Dashboard
1. Login ke [vercel.com](https://vercel.com)
2. Buka project **Ayam-Geprek** atau buat project baru
3. Klik **Settings** → **Environment Variables**

### 1.2 Tambahkan Environment Variables

Tambahkan variabel-variabel berikut satu per satu:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pgbouncer=true` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `ayam-geprek-sambal-ijo-secret-2025-production` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://ayam-geprek.vercel.app` (ganti dengan domain production Anda) | Production only |

**Cara menambahkan:**
1. Klik **"Add New"**
2. Masukkan **Name** dan **Value**
3. Pilih Environment(s): Production, Preview, Development
4. Klik **"Save"**

**Catatan:**
- `NEXTAUTH_URL` untuk production, setelah Anda tahu domain Vercel Anda
- Untuk Preview dan Development, biarkan `NEXTAUTH_URL` kosong atau gunakan `http://localhost:3000`

---

## 🚀 Langkah 2: Deploy ke Vercel

### 2.1 Connect GitHub Repository (Jika belum)

1. Di dashboard Vercel, klik **"Add New Project"**
2. Klik **"Import Git Repository"**
3. Authorize Vercel untuk akses GitHub Anda (jika diminta)
4. Pilih repository **Ayam-Geprek** dari list
5. Klik **"Import"**

### 2.2 Konfigurasi Project

Vercel akan otomatis detect Next.js:

**Build & Development Settings:**
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

Biarkan semua setting default dan scroll ke bawah.

### 2.3 Environment Variables

Di bagian **Environment Variables**, pastikan semua variabel dari Langkah 1 sudah terdaftar.

Jika belum:
1. Klik **"Add New"**
2. Tambahkan semua variabel dari tabel di atas
3. Klik **"Add"** untuk setiap variabel

### 2.4 Deploy

1. Klik tombol **"Deploy"**
2. Tunggu proses deploy (sekitar 2-3 menit)
3. Prisma akan otomatically generate client saat `postinstall` script berjalan

### 2.5 Cek Deploy Result

Setelah deploy selesai:
1. Anda akan melihat link production: `https://ayam-geprek.vercel.app`
2. Klik untuk buka aplikasi
3. Test fitur-fitur utama:
   - ✅ Halaman utama loading
   - ✅ Tampilan produk
   - ✅ Login/Register
   - ✅ Tambah ke keranjang
   - ✅ Checkout

---

## 🔧 Langkah 3: Verifikasi Database

### 3.1 Cek Tabel di Neon Dashboard

1. Buka [Neon Console](https://console.neon.tech)
2. Pilih project `ep-ancient-paper-aiifvyrx`
3. Klik **SQL Editor**
4. Jalankan query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Anda seharusnya melihat 18 tabel:
- User
- Category
- Product
- Member
- Order
- OrderItem
- Transaction
- TransactionItem
- Payment
- CashierShift
- StockLog
- PointHistory
- Promo
- ProductPromo
- VoidLog
- Setting
- Notification
- QRISPayment
- DynamicTab
- DynamicPage
- DynamicFeature

### 3.2 Cek Data Production

Setelah aplikasi berjalan di production, cek apakah data tersimpan:

```sql
-- Cek user yang register
SELECT id, email, name, role, created_at FROM "User" LIMIT 10;

-- Cek produk
SELECT id, name, price, stock, is_active FROM "Product" LIMIT 10;

-- Cek order
SELECT id, order_number, customer_name, status, total_amount, created_at FROM "Order" ORDER BY created_at DESC LIMIT 10;
```

---

## 🎉 Langkah 4: Selesai!

Aplikasi sudah berhasil deploy!

### Akses Aplikasi:
- **Production URL**: `https://ayam-geprek.vercel.app`
- **GitHub Repository**: https://github.com/safir2310/Ayam-Geprek
- **Neon Database**: https://console.neon.tech/project/ep-ancient-paper-aiifvyrx

### Environment Variables Summary:

```env
# Database (Neon / Vercel Postgres)
DATABASE_URL=postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pgbouncer=true
DIRECT_URL=postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=ayam-geprek-sambal-ijo-secret-2025-production
NEXTAUTH_URL=https://ayam-geprek.vercel.app
```

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

**Solusi:**
1. Cek environment variables di Vercel Dashboard
2. Pastikan `DATABASE_URL` dan `DIRECT_URL` benar
3. Pastikan database Neon tidak dalam status "Sleep"

### Error: "Prisma Client not generated"

**Solusi:**
1. Cek di Vercel Deployment Logs
2. Pastikan script `postinstall` berjalan:
   ```bash
   "postinstall": "prisma generate"
   ```
3. Redeploy project

### Error: "SSL Connection Required"

**Solusi:**
1. Pastikan `DATABASE_URL` dan `DIRECT_URL` memiliki parameter `sslmode=require`
2. Neon menggunakan SSL secara default

### Error: "Deployment failed"

**Solusi:**
1. Cek deployment logs di Vercel
2. Pastikan semua dependencies terinstall:
   ```bash
   bun install
   ```
3. Pastikan build command benar: `npm run build`

---

## 📊 Monitoring & Logs

### View Deployment Logs:
1. Buka Vercel Dashboard
2. Pilih project **Ayam-Geprek**
3. Klik tab **Deployments**
4. Klik deployment terbaru
5. Klik **"View Logs"**

### View Function Logs:
1. Buka Vercel Dashboard
2. Pilih project
3. Klik tab **Functions**
4. Pilih function untuk lihat logs real-time

### View Database Logs:
1. Buka Neon Console
2. Pilih project
3. Klik tab **Metrics**
4. Lihat query performance, connections, dll.

---

## 🔄 Update Kode di Production

Setiap kali Anda update kode:

### 1. Commit & Push ke GitHub:
```bash
git add .
git commit -m "feat: description of changes"
git push origin main
```

### 2. Vercel akan otomatis redeploy:
- Deployment otomatis akan ter-trigger
- Tunggu deploy selesai (2-3 menit)
- Production URL akan otomatis update

### 3. Jika ada perubahan database schema:

**Jika ada perubahan di Prisma schema:**

```bash
# Local
bun run db:push

# Production akan otomatis menggunakan schema yang sama
```

**Catatan:** Vercel Postgres tidak mendukung `prisma migrate`, gunakan `db:push` untuk schema changes.

---

## 📝 Checklist Deployment

- [x] Database Neon sudah dibuat dan terhubung
- [x] Schema Prisma sudah di-push ke database
- [x] Prisma Client sudah digenerate
- [x] Kode sudah terupload ke GitHub
- [x] Environment variables sudah disiapkan
- [ ] Repository sudah connect ke Vercel
- [ ] Environment variables sudah ditambahkan di Vercel
- [ ] Deploy ke Vercel sudah selesai
- [ ] Aplikasi bisa diakses di production URL
- [ ] Fitur-fitur utama sudah ditest

---

## 🎯 Next Steps

Setelah deploy berhasil:

1. **Setup Custom Domain** (opsional):
   - Di Vercel Dashboard → Settings → Domains
   - Add your custom domain
   - Update DNS settings

2. **Setup Payment Gateway** (opsional):
   - Integrasikan Midtrans/Xendit/Tripay
   - Update environment variables
   - Deploy ulang

3. **Setup WhatsApp Notifications** (opsional):
   - Integrasikan Fonnte/Wablas/Twilio
   - Update environment variables
   - Test notifications

4. **Monitor Performance**:
   - Setup Vercel Analytics
   - Monitor Neon database metrics
   - Track errors dengan Sentry (opsional)

---

## 📚 Resources Tambahan

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

---

## 🙏 Terima Kasih

Aplikasi **AYAM GEPREK SAMBAL IJO** siap digunakan di production!

**Status:** ✅ **PRODUCTION READY**

**Deployment:**
- 🌐 Production URL: `https://ayam-geprek.vercel.app`
- 📦 GitHub: https://github.com/safir2310/Ayam-Geprek
- 🗄️ Database: Neon (Vercel Postgres)

---

**Dokumentasi dibuat khusus untuk deployment AYAM GEPREK SAMBAL IJO**
**Last Updated:** 2025
