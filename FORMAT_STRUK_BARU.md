# Format Struk Baru yang Lengkap

## Ringkasan Perubahan

Membuat format struk PDF baru yang lebih lengkap dan profesional dengan tata letak informasi yang jelas dan mudah dibaca.

## Struktur Struk

### 1. HEADER (Bagian Atas)

```
╔══════════════════════════════════════════════════╗
║                  AYAM GEPREK SAMBAL IJO                 ║
╚══════════════════════════════════════════════════╝
```

- **Font**: Helvetica Bold, Size 24px
- **Warna**: Orange (255, 140, 0)
- **Posisi**: Center, tengah halaman
- **Garis Pemisah**: Orange, line width 1px

### 2. ALAMAT TOKO

```
Jl. Medan - Banda Aceh, Simpang Camat
Gampong Tijue, Kec. Pidie, Kab. Pidie, 24151
Telp: 085260812758
───────────────────────────────────────────────────────────
```

- **Font**: Helvetica Normal, Size 10px
- **Warna**: Abu-abu gelap (60, 60, 60)
- **Posisi**: Center
- **Garis Pemisah**: Abu-abu, line width 0.3px

### 3. INFORMASI TRANSAKSI

```
INFORMASI TRANSAKSI
───────────────────────────────────────────────────────────

Tanggal        : Senin, 1 Januari 2025
Waktu          : 14:30
ID Struk       : 0001
───────────────────────────────────────────────────────────
```

- **Font**: Title Bold 14px, Body Normal 10px
- **Warna**: Hitam (0, 0, 0)
- **Tanggal**: Format lengkap dengan hari, bulan, tahun (Bahasa Indonesia)
- **Waktu**: Format HH:MM dengan jam dan menit
- **ID Struk**: 4-digit ID transaksi
- **Garis Pemisah**: Abu-abu, line width 0.3px

### 4. INFORMASI PELANGGAN

```
INFORMASI PELANGGAN
───────────────────────────────────────────────────────────

Nama           : [Nama Pelanggan]
No HP          : [Nomor HP]
ID User        : [4-digit ID User]
───────────────────────────────────────────────────────────
```

- **Font**: Title Bold 14px, Body Normal 10px
- **Warna**: Hitam (0, 0, 0)
- **Nama**: Nama lengkap pelanggan
- **No HP**: Nomor telepon pelanggan
- **ID User**: 4-digit ID pelanggan
- **Garis Pemisah**: Abu-abu, line width 0.3px

### 5. PRODUK PESANAN (Tabel)

```
PRODUK PESANAN
───────────────────────────────────────────────────────────

No   Nama Produk                        Qty   Harga    Diskon   Subtotal
───────────────────────────────────────────────────────────
1.   2x Ayam Geprek Paha              2    Rp 20.000           Rp 40.000
                                                 Subtotal: Rp 40.000

2.   1x Paket Hemat                      1    Rp 35.000 -20%   Rp 28.000
                                                 Subtotal: Rp 28.000

───────────────────────────────────────────────────────────
```

#### Kolom Tabel:
1. **No**: Nomor urut (1, 2, 3, ...)
2. **Nama Produk**: Nama produk dengan quantity
   - Format: `qty x Nama Produk`
   - Truncate jika terlalu panjang (max 35 karakter) + "..."
3. **Qty**: Jumlah (otomatis dari nama produk)
4. **Harga**: Harga satuan
   - Tanpa diskon: Hitam, Rp 20.000
   - Dengan diskon: Abu-abu Rp 35.000, merah -20%, hitam Rp 28.000
5. **Diskon**: Persentase diskon (jika ada)
   - Warna merah (200, 50, 50)
   - Posisi center
6. **Subtotal**: Harga total per item
   - Font lebih kecil (8px)
   - Warna abu-abu (100, 100, 100)
   - Di baris terpisah
   - Posisi align right

#### Tampilan Produk dengan Diskon:

```
1.   2x Ayam Geprek Paha              2    Rp 20.000           Rp 40.000
                                                 Subtotal: Rp 40.000

2.   1x Paket Hemat                      1    Rp 35.000 -20%   Rp 28.000
                                                 Subtotal: Rp 28.000
```

- Baris 1: Harga normal (Rp 20.000)
- Baris 2: Harga asli abu-abu, diskon merah, harga diskon hitam

### 6. TOTAL HARGA

```
═════════════════════════════════════════════════════
TOTAL HARGA                                          Rp 100.000
═════════════════════════════════════════════════════
```

- **Font**: Bold 18px
- **Warna TOTAL**: Orange (255, 140, 0)
- **Posisi**: Label di kiri, jumlah di kanan
- **Garis Pemisah**: Orange, line width 1px

### 7. STATUS TRANSAKSI

```
Status: Menunggu Persetujuan
```

- **Font**: Normal 11px
- **Warna** sesuai status:
  - Menunggu: Kuning/Oranye (200, 150, 50)
  - Disetujui: Biru (50, 150, 200)
  - Sedang Diproses: Kuning/Brown (150, 100, 50)
  - Selesai: Hijau (0, 150, 50)
  - Dibatalkan: Merah (200, 50, 50)

### 8. KOIN (Jika Completed)

```
Koin Diperoleh: +50
```

- **Font**: Bold 11px
- **Warna**: Hijau (0, 150, 0)
- **Hanya muncul jika**: status = "completed" dan coinsEarned > 0

### 9. FOOTER

```
═════════════════════════════════════════════════════

                    Terima kasih telah memesan di

                      AYAM GEPREK SAMBAL IJO

              Simpan struk ini sebagai bukti pembayaran yang sah

              Instagram: @ayamgepreksambalijo
              Facebook: Ayam Geprek Sambal Ijo

              Hubungi kami jika ada pertanyaan

═════════════════════════════════════════════════════
```

- **"Terima kasih telah memesan di"**: Normal 10px, abu-abu
- **"AYAM GEPREK SAMBAL IJO"**: Bold 12px, orange
- **Instruksi simpan**: Normal 9px, abu-abu
- **Sosial media**: Normal 9px, abu-abu
- **Contact**: Normal 9px, abu-abu
- **Semua teks**: Center alignment
- **Garis batas**: Orange, line width 1px

## Layout Struk

```
┌─────────────────────────────────────────────────────────────┐
│           AYAM GEPREK SAMBAL IJO                 │
├─────────────────────────────────────────────────────────────┤
│             ALAMAT TOKO                             │
├─────────────────────────────────────────────────────────────┤
│             INFORMASI TRANSAKSI                     │
│             [Tanggal, Waktu, ID Struk]               │
├─────────────────────────────────────────────────────────────┤
│             INFORMASI PELANGGAN                      │
│             [Nama, No HP, ID User]                     │
├─────────────────────────────────────────────────────────────┤
│             PRODUK PESANAN                          │
│             [Tabel dengan kolom lengkap]               │
├─────────────────────────────────────────────────────────────┤
│             TOTAL HARGA                               │
│             [Jumlah besar]                             │
├─────────────────────────────────────────────────────────────┤
│             STATUS                                    │
│             [Status dengan warna]                       │
│             [Koin jika selesai]                       │
├─────────────────────────────────────────────────────────────┤
│             FOOTER                                    │
│             [Terima kasih, nama toko, sosmed]       │
└─────────────────────────────────────────────────────────────┘
```

## Perbandingan dengan Format Lama

| Aspek | Lama | Baru |
|-------|------|------|
| **Nama Toko** | 20px, orange | 24px, orange, bold |
| **Header Layout** | Semua di atas | Terpisah dengan section |
| **Alamat Toko** | Tercampur dengan transaksi | Section terpisah |
| **Informasi Transaksi** | Tanggal saja | Tanggal + Waktu |
| **Informasi Pelanggan** | Terpisah acak | Section terpisah |
| **Tabel Produk** | 3 kolom saja | 6 kolom lengkap |
| **Diskon** | Di baris sama | Terlihat jelas (abu, merah, hitam) |
| **Subtotal per Item** | Di baris sama | Baris terpisah, lebih jelas |
| **Total Harga** | 12px, orange | 18px, orange, lebih besar |
| **Status** | Hitam saja | Berwarna sesuai status |
| **Footer** | Pendek | Lengkap dengan instruksi |

## Fitur Baru

1. ✅ **Informasi Waktu** - Jam dan menit ditampilkan
2. ✅ **Tabel 6 Kolom** - No, Nama, Qty, Harga, Diskon, Subtotal
3. ✅ **Status Berwarna** - Mudah mengenali status
4. ✅ **Diskon Jelas** - Harga asli, %, harga diskon semua terlihat
5. ✅ **Subtotal Terpisah** - Lebih mudah dibaca
6. ✅ **Section Terpisah** - Setiap bagian jelas batasnya
7. ✅ **Instruksi Simpan** - Reminder untuk simpan struk
8. ✅ **Contact Info** - Hubungi kami jika ada pertanyaan

## Spesifikasi Teknis

- **PDF Generator**: jsPDF
- **Font**: Helvetica (Standard)
- **Ukuran Kertas**: A4 (Default jsPDF)
- **Warna**:
  - Primary: Orange (255, 140, 0)
  - Text: Hitam (0, 0, 0)
  - Secondary: Abu-abu (100, 100, 100)
  - Success: Hijau (0, 150, 0)
  - Warning/Diskon: Merah (200, 50, 50)
  - Lines: Abu-abu (200, 200, 200)
- **Line Width**: 1px (primary), 0.3px (secondary)

## Cara Menguji

### Test 1: Lihat Struk Normal
1. Buka https://ayamgepreksambalijo.vercel.app
2. Login sebagai user atau admin
3. Buka dashboard → pilih transaksi
4. Klik "📄 Lihat Struk"
5. **Hasil**:
   - ✅ PDF terbuka dengan format baru
   - ✅ Nama toko besar dan jelas di tengah
   - ✅ Semua informasi lengkap

### Test 2: Transaksi dengan Diskon
1. Pilih transaksi yang memiliki produk diskon
2. Lihat struk
3. **Hasil**:
   - ✅ Harga asli (abu-abu)
   - ✅ Persentase diskon (merah)
   - ✅ Harga diskon (hitam)
   - ✅ Subtotal di baris terpisah

### Test 3: Transaksi Selesai dengan Koin
1. Pilih transaksi dengan status "completed"
2. Lihat struk
3. **Hasil**:
   - ✅ Status berwarna hijau
   - ✅ Informasi koin muncul
   - ✅ Warna koin hijau

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil dan live
- **Commit**: `buat format struk baru yang lengkap`

## Catatan

- Format struk baru lebih profesional dan lengkap
- Informasi terstruktur dengan section yang jelas
- Mudah dibaca dengan font size yang bervariasi
- Warna yang konsisten dengan tema orange
- Semua informasi penting ditampilkan
- Cocok untuk dicetak atau disimpan sebagai digital

## Customisasi

Jika ingin mengubah format struk di masa depan:

1. **Ubah nama toko**: Baris 42-45
2. **Ubah alamat**: Baris 59-62
3. **Ubah warna**: Ubah RGB values
4. **Ubah font size**: Ubah angka setFontSize()
5. **Ubah layout**: Ubah posisi x dan y values
