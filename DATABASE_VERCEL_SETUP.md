# Setup Database Vercel Postgres

## Ringkasan

Database Vercel Postgres sudah berhasil:
- ✅ Dikonfigurasi dan terhubung
- ✅ Schema sudah ter-sync
- ✅ Semua tabel dibuat untuk:
  - Update status transaksi
  - Data struk/receipt
  - Upload foto (produk dan user)

## Database Information

**Host**: db.prisma.io:5432  
**Database**: postgres  
**Provider**: Vercel Postgres  
**URL**: `postgresql://45dc3fd94bbd659e56c8c55b2ccef6e967ad15ddfdab5a4dac8bf3e9f70ae2fe:sk_00eZcAvDaUbSo1La_61_q@db.prisma.io:5432/postgres?sslmode=require`

## Schema Database

### 1. **User Model** (Pelanggan)
```prisma
model User {
  id          String   @id @default(cuid())
  userId      String   @unique  // 4-digit ID: 0001, 0002, dll
  username    String   @unique
  password    String
  email       String   @unique
  phoneNumber String
  role        String   // "admin" or "user"
  dateOfBirth String?  // Untuk verifikasi admin
  address     String?  // Alamat pelanggan
  photo       String?  // URL foto profil user (untuk upload foto)
  coins       Int      @default(0)  // Koin user
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactions    Transaction[]
  coinExchanges   CoinExchange[]
}
```

**Fitur:**
- ✅ Menyimpan data pelanggan lengkap
- ✅ Field `photo` untuk URL foto yang diupload
- ✅ Field `address` untuk alamat pelanggan
- ✅ Field `coins` untuk sistem koin

### 2. **Product Model** (Produk)
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Int
  discount    Int      @default(0)
  category    String   // "makanan" or "minuman"
  photo       String?  // URL foto produk (untuk upload foto)
  isPromotion Boolean  @default(false)
  isNewest    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactionItems TransactionItem[]
}
```

**Fitur:**
- ✅ Menyimpan data produk lengkap
- ✅ Field `photo` untuk URL foto produk yang diupload
- ✅ Mendukung diskon
- ✅ Kategori produk

### 3. **Transaction Model** (Transaksi)
```prisma
model Transaction {
  id              String   @id @default(cuid())
  receiptId       String   @unique  // 4-digit ID: 0001, 0002, dll
  userId          String
  userIdNumber    String   // User's 4-digit ID (untuk struk)
  userName        String   // Nama user (untuk struk)
  userPhoneNumber String   // No HP user (untuk struk)
  totalAmount     Int      // Total harga
  coinsEarned     Int      @default(0)  // Koin yang didapat
  status          String   // "waiting", "approved", "processing", "completed", "cancelled"
  orderDate       DateTime @default(now())
  completedAt     DateTime?  // Tanggal selesai

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  items           TransactionItem[]
}
```

**Fitur:**
- ✅ Menyimpan semua data yang dibutuhkan untuk struk
- ✅ Field `status` untuk update status transaksi
- ✅ Field `completedAt` untuk tracking waktu selesai
- ✅ Field `coinsEarned` untuk sistem koin
- ✅ Semua informasi pelanggan untuk struk

### 4. **TransactionItem Model** (Item Pesanan)
```prisma
model TransactionItem {
  id            String   @id @default(cuid())
  transactionId String
  productId     String
  productName   String
  productPhoto  String?  // Foto produk (untuk struk)
  quantity      Int
  price         Int
  discount      Int      @default(0)
  subtotal      Int  // Subtotal per item (untuk struk)

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  product     Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

**Fitur:**
- ✅ Menyimpan detail item pesanan
- ✅ Semua informasi untuk struk
- ✅ Field `productPhoto` untuk tampil foto di struk
- ✅ Field `subtotal` untuk tampil di struk

### 5. **CoinExchangeProduct Model** (Produk Tukar Koin)
```prisma
model CoinExchangeProduct {
  id          String   @id @default(cuid())
  name        String
  description String?
  coinsNeeded Int
  photo       String?  // URL foto produk tukar koin (untuk upload foto)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  exchanges CoinExchange[]
}
```

**Fitur:**
- ✅ Menyimpan produk tukar koin
- ✅ Field `photo` untuk URL foto yang diupload

### 6. **CoinExchange Model** (Riwayat Tukar Koin)
```prisma
model CoinExchange {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  productName String
  coinsSpent  Int
  exchangedAt DateTime @default(now())

  user    User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  product CoinExchangeProduct @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

**Fitur:**
- ✅ Riwayat tukar koin user
- ✅ Tracking koin yang digunakan

### 7. **StoreProfile Model** (Profil Toko)
```prisma
model StoreProfile {
  id          String   @id @default(cuid())
  name        String
  slogan      String?
  address     String   // Alamat toko (untuk struk)
  phoneNumber String
  instagram   String?
  facebook    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Fitur:**
- ✅ Informasi toko lengkap
- ✅ Alamat untuk struk

## API Endpoint untuk Fitur

### 1. **Update Status Transaksi**

**Endpoint**: `PUT /api/transactions/[id]`  
**Schema**: sudah ada  
**Fitur**:
- ✅ Update status transaksi (waiting → approved → processing → completed/cancelled)
- ✅ Set `completedAt` ketika status = completed
- ✅ Menambahkan koin ke user ketika status = completed
- ✅ Validasi status yang diizinkan

**Status yang Valid**:
- `waiting` - Menunggu persetujuan
- `approved` - Disetujui
- `processing` - Sedang diproses
- `completed` - Selesai (koin ditambahkan)
- `cancelled` - Dibatalkan

### 2. **Struk/Receipt**

**Endpoint**: `GET /api/transactions/[id]/receipt`  
**Schema**: sudah ada  
**Fitur**:
- ✅ Generate PDF dengan format profesional
- ✅ Menampilkan semua informasi transaksi
- ✅ Menampilkan informasi pelanggan
- ✅ Menampilkan item pesanan lengkap
- ✅ Menampilkan harga dan diskon
- ✅ Menampilkan total dan status
- ✅ Download sebagai PDF

**Data yang Ditampilkan**:
- Nama toko (AYAM GEPREK SAMBAL IJO)
- Alamat toko
- Tanggal dan waktu transaksi
- ID struk (4-digit)
- Nama pelanggan
- No HP pelanggan
- ID pelanggan (4-digit)
- Daftar item pesanan dengan qty, harga, diskon, subtotal
- Total harga
- Status transaksi
- Koin yang diperoleh (jika completed)
- Ucapan terima kasih
- Sosial media toko

### 3. **Upload Foto**

**Endpoint**: `POST /api/upload`  
**Schema**: sudah ada  
**Fitur**:
- ✅ Upload foto produk
- ✅ Upload foto profil user
- ✅ Upload foto produk tukar koin
- ✅ Simpan URL ke database

**Format**:
- Request: `FormData` dengan field `file` dan `type`
- Type: `product` (foto produk) atau `profile` (foto user)
- Response: `{ url: string }` - URL file yang diupload

**Database Fields yang Diupdate**:
- Product.photo = URL foto produk
- User.photo = URL foto profil user
- CoinExchangeProduct.photo = URL foto produk tukar koin

## Cara Menguji Database

### Test 1: Cek Koneksi Database
```bash
# Buka di browser:
https://ayamgepreksambalijo.vercel.app/api/test-database
```

**Expected Response**:
```json
{
  "status": "success",
  "message": "Database connection successful",
  "data": {
    "userCount": 5,
    "productCount": 15,
    "transactionCount": 23,
    "latestTransaction": {
      "receiptId": "0023",
      "userName": "contoh_user",
      "status": "completed",
      "totalAmount": 50000,
      "itemCount": 3
    }
  }
}
```

### Test 2: Update Status Transaksi
```bash
# Dari admin dashboard:
1. Pilih transaksi
2. Update status dari "waiting" → "approved" → "processing" → "completed"
3. Status berhasil diubah
4. Koin user bertambah (jika status = completed)
```

### Test 3: Generate Struk
```bash
# Dari admin atau user dashboard:
1. Pilih transaksi
2. Klik "Lihat Struk"
3. PDF terbuka dengan format baru
4. PDF berisi semua informasi yang lengkap
```

### Test 4: Upload Foto
```bash
# Dari admin dashboard:
1. Tambah produk baru
2. Upload foto produk
3. Foto tersimpan dan URL disimpan ke database
4. Produk ditampilkan dengan foto

# Dari user dashboard:
1. Edit profil
2. Upload foto profil
3. Foto tersimpan dan URL disimpan ke database
4. Profil ditampilkan dengan foto
```

## Environment Variables

### Vercel (Production)
```
DATABASE_URL = postgresql://45dc3fd94bbd659e56c8c55b2ccef6e967ad15ddfdab5a4dac8bf3e9f70ae2fe:sk_00eZcAvDaUbSo1La_61_q@db.prisma.io:5432/postgres?sslmode=require
```

### Local Development
```
DATABASE_URL = postgresql://45dc3fd94bbd659e56c8c55b2ccef6e967ad15ddfdab5a4dac8bf3e9f70ae2fe:sk_00eZcAvDaUbSo1La_61_q@db.prisma.io:5432/postgres?sslmode=require
```

## Perintah Prisma

### Generate Prisma Client
```bash
bun run db:generate
```

### Push Schema ke Database
```bash
bun run db:push
```

### Pull Schema dari Database
```bash
bun run db:pull
```

### Reset Database
```bash
bun run db:reset
```

## Troubleshooting

### Error: "Database connection failed"
**Solutions:**
1. Cek apakah DATABASE_URL valid di Vercel
2. Cek apakah Prisma Client sudah digenerate: `bun run db:generate`
3. Push schema ke database: `bun run db:push`
4. Cek Vercel logs untuk error database

### Error: "URL must start with protocol postgresql:// or postgres://"
**Solutions:**
1. Pastikan DATABASE_URL tidak ada newline di awal file
2. Pastikan tidak ada spasi atau karakter khusus
3. Format harus: `postgresql://user:password@host:port/database`

### Error: Schema validation failed
**Solutions:**
1. Cek syntax Prisma schema
2. Pastikan semua field memiliki tipe yang benar
3. Pastikan relationships sudah didefinisikan dengan benar

## Database Capabilities

Database Vercel Postgres sudah mendukung:

1. ✅ **Update Status Transaksi**
   - Transaction model dengan field status
   - API endpoint PUT /api/transactions/[id]
   - Status flow: waiting → approved → processing → completed/cancelled

2. ✅ **Generate Struk/Receipt**
   - Transaction model dengan semua data yang dibutuhkan
   - TransactionItem model untuk detail item
   - User model untuk informasi pelanggan
   - StoreProfile model untuk info toko
   - API endpoint GET /api/transactions/[id]/receipt
   - PDF generation dengan format profesional

3. ✅ **Upload Foto**
   - Product.photo field untuk URL foto produk
   - User.photo field untuk URL foto profil user
   - CoinExchangeProduct.photo field untuk URL foto tukar koin
   - API endpoint POST /api/upload
   - FormData upload dengan type validation

4. ✅ **Sistem Koin**
   - User.coins field untuk menyimpan koin
   - Transaction.coinsEarned field untuk koin dari transaksi
   - CoinExchange model untuk riwayat tukar koin
   - CoinExchangeProduct model untuk produk tukar koin

## Monitoring

### Vercel Dashboard
1. Login ke https://vercel.com
2. Pilih project: ayamgepreksambalijo
3. Buka tab "Storage" → "Postgres"
4. Monitor database:
   - Tables
   - Rows
   - Storage usage
   - Query performance

### Logs
1. Buka tab "Logs" di Vercel dashboard
2. Filter dengan prefix:
   - `[TRANSACTION]` - Update status transaksi
   - `[RECEIPT]` - Generate struk
   - `[DB-TEST]` - Test database connection
   - `[UPLOAD]` - Upload foto

## Security Notes

1. **Database URL**: Jangan commit ke Git repository
2. **Environment Variables**: Gunakan Vercel environment variables
3. **Password**: Disimpan menggunakan bcrypt.js hashing
4. **Input Validation**: Validasi semua input di API endpoints
5. **SQL Injection**: Prisma ORM mencegah SQL injection
6. **File Upload**: Validasi tipe file dan ukuran

## Performance Tips

1. **Connection Pooling**: Prisma mengelola koneksi secara otomatis
2. **Indexing**: Prisma memberi rekomendasi index untuk foreign keys
3. **Query Optimization**: Gunakan select only fields yang dibutuhkan
4. **Pagination**: Gunakan pagination untuk data yang banyak
5. **Caching**: Gunakan caching untuk data yang sering diakses

## Summary

| Fitur | Status | Endpoint | Database Model |
|--------|--------|-----------|---------------|
| Update Status Transaksi | ✅ | PUT /api/transactions/[id] | Transaction |
| Generate Struk | ✅ | GET /api/transactions/[id]/receipt | Transaction, TransactionItem, User, StoreProfile |
| Upload Foto Produk | ✅ | POST /api/upload | Product |
| Upload Foto Profil | ✅ | POST /api/upload | User |
| Upload Foto Koin | ✅ | POST /api/upload | CoinExchangeProduct |
| Sistem Koin | ✅ | - | User, Transaction, CoinExchange |

Database sudah siap dan berfungsi dengan lengkap! 🎉
