# Perbaiki Struk - Dokumentasi

## Ringkasan Perubahan

Memperbaiki tampilan dan fungsi struk pembelian untuk user dan admin.

## Masalah yang Ditemukan

### 1. User Dashboard
- **Masalah**: Ada tombol "Cetak Struk" yang tidak berfungsi
  - Tombol ini memanggil `window.print()` yang akan mencetak halaman dashboard, bukan PDF struk
  - Membuat bingung user karena tidak mencetak struk yang benar

- **Masalah**: Ikon kurang intuitif
  - Menggunakan ikon Download yang kurang spesifik

### 2. Admin Dashboard
- **Masalah**: Tidak ada tombol untuk melihat struk
  - Admin tidak bisa melihat/mencetak struk transaksi
  - Sulit untuk memverifikasi detail transaksi

### 3. Format Struk PDF
- **Masalah**: Tidak ada header kolom
  - Tidak jelas mana kolom nama produk, harga, dan subtotal

- **Masalah**: Diskon tidak ditampilkan dengan jelas
  - Harga asli dan harga diskon tidak ditampilkan
  - User tidak bisa melihat berapa diskon yang didapat

- **Masalah**: Subtotal per item tidak ditampilkan
  - Hanya menampilkan total per baris tanpa breakdown
  - Kurang informatif

## Perbaikan yang Dilakukan

### 1. User Dashboard (`/home/z/my-project/src/app/user/dashboard/page.tsx`)

#### Hapus Tombol "Cetak Struk"
```typescript
// SEBELUM (dihapus)
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    window.open(`/api/transactions/${transaction.id}/receipt`, '_blank');
    setTimeout(() => window.print(), 500);
  }}
  className="flex items-center gap-2"
>
  <Printer className="h-4 w-4" />
  Cetak Struk
</Button>
```

#### Perbaiki Tombol "Lihat Struk"
```typescript
// SESUDAH
<Button
  variant="outline"
  size="sm"
  onClick={() => window.open(`/api/transactions/${transaction.id}/receipt`, '_blank')}
  className="flex items-center gap-2"
>
  <FileText className="h-4 w-4" />
  Lihat Struk
</Button>
```

**Perubahan:**
- Mengubah "Unduh Struk" menjadi "Lihat Struk"
- Mengganti ikon Download dengan FileText (lebih spesifik untuk dokumen)
- Hapus tombol "Cetak Struk" yang tidak berfungsi
- Hapus import Download dan Printer yang tidak digunakan

### 2. Admin Dashboard (`/home/z/my-project/src/app/admin/dashboard/page.tsx`)

#### Tambah Tombol "Lihat Struk"
```typescript
// Import tambahan
import { FileText } from 'lucide-react';

// Tambah tombol di sebelah dropdown status
<div className="flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => window.open(`/api/transactions/${transaction.id}/receipt`, '_blank')}
    className="flex items-center gap-2"
  >
    <FileText className="h-4 w-4" />
    Lihat Struk
  </Button>
  <Select
    value={transaction.status}
    onValueChange={(value) => onUpdateStatus(transaction.id, value)}
  >
    <SelectTrigger className="w-40">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="waiting">Menunggu</SelectItem>
      <SelectItem value="approved">Disetujui</SelectItem>
      <SelectItem value="processing">Diproses</SelectItem>
      <SelectItem value="completed">Selesai</SelectItem>
      <SelectItem value="cancelled">Batal</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Keuntungan:**
- Admin sekarang bisa melihat struk setiap transaksi
- Memudahkan verifikasi detail pesanan
- Bisa mencetak struk dari PDF viewer

### 3. Perbaikan Format Struk PDF (`/home/z/my-project/src/app/api/transactions/[id]/receipt/route.ts`)

#### a) Tambah Header Kolom
```typescript
// Item header
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(80, 80, 80);
doc.text('Nama Produk', 20, y);
doc.text('Harga', 120, y, { align: 'right' });
doc.text('Subtotal', 170, y, { align: 'right' });
y += 5;
doc.setDrawColor(220, 220, 220);
doc.line(20, y, 190, y);
y += 8;
```

**Hasil:**
- Ada header yang jelas untuk setiap kolom
- Garis pemisah di bawah header
- Warna teks lebih terang (abu-abu) untuk header

#### b) Tampilkan Harga Asli dan Diskon
```typescript
if (item.discount > 0) {
  // Tampilkan harga asli (abu-abu)
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 120, y, { align: 'right' });

  // Tampilkan persentase diskon (merah)
  doc.setTextColor(200, 50, 50);
  doc.text(`-${item.discount}%`, 140, y, { align: 'right' });

  // Tampilkan harga setelah diskon (hitam)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Rp ${Math.round(finalPrice).toLocaleString('id-ID')}`, 170, y, { align: 'right' });
} else {
  // Tidak ada diskon, tampilkan harga normal
  doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
}
```

**Hasil:**
- Jika ada diskon: menampilkan harga asli (abu-abu), persentase diskon (merah), dan harga diskon (hitam)
- Jika tidak ada diskon: hanya menampilkan harga normal
- User bisa melihat jelas berapa diskon yang didapat

#### c) Tampilkan Subtotal per Item
```typescript
// Subtotal di baris terpisah
y += 7;
doc.setFontSize(9);
doc.setTextColor(100, 100, 100);
doc.text(`Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
y += 10;
```

**Hasil:**
- Subtotal ditampilkan di baris terpisah
- Warna lebih terang (abu-abu) untuk membedakan dari harga
- Lebih mudah dibaca dan dipahami

## Tampilan Struk PDF Baru

### Struktur Struk:
1. **Header**
   - Nama toko (AYAM GEPREK SAMBAL IJO) - warna orange
   - Alamat dan kontak
   - Garis pemisah orange

2. **Informasi Transaksi**
   - ID Struk
   - Tanggal pemesanan
   - Nama pelanggan
   - ID User
   - Nomor HP

3. **Item Pesanan**
   - Header kolom (Nama Produk, Harga, Subtotal)
   - Daftar item dengan detail harga dan diskon
   - Subtotal per item

4. **Total**
   - Total harga (tebal)
   - Status transaksi
   - Koin diperoleh (jika completed)

5. **Footer**
   - Pesan terima kasih
   - Informasi sosial media

### Contoh Tampilan Item:

**Tanpa Diskon:**
```
2x Ayam Geprek Paha                               Rp 20.000
                                              Subtotal: Rp 40.000
```

**Dengan Diskon:**
```
1x Paket Hemat                            Rp 35.000      -20%
                                                        Rp 28.000
                                              Subtotal: Rp 28.000
```

## Cara Menguji

### Test User Dashboard:
1. Login sebagai user: https://ayamgepreksambalijo.vercel.app
2. Buka dashboard user
3. Pergi ke tab "Riwayat Transaksi"
4. Klik tombol "📄 Lihat Struk" pada salah satu transaksi
5. PDF struk akan terbuka di tab baru
6. Verifikasi:
   - Header kolom muncul dengan benar
   - Harga dan diskon ditampilkan dengan warna yang benar
   - Subtotal per item terlihat jelas

### Test Admin Dashboard:
1. Login sebagai admin
2. Buka dashboard admin: https://ayamgepreksambalijo.vercel.app/admin/dashboard
3. Pergi ke tab "Transaksi"
4. Klik tombol "📄 Lihat Struk" pada salah satu transaksi
5. PDF struk akan terbuka di tab baru
6. Verifikasi sama seperti test user dashboard

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil dan live di production

## Ringkasan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **User Dashboard - Tombol Struk** | Unduh & Cetak (cetak tidak berfungsi) | Lihat Struk (berfungsi) |
| **Ikon** | Download & Printer | FileText |
| **Admin Dashboard - Tombol Struk** | Tidak ada | Lihat Struk |
| **Header Kolom** | Tidak ada | Ada (Nama, Harga, Subtotal) |
| **Tampilan Diskon** | Tidak jelas | Harga asli + % diskon + harga diskon |
| **Subtotal per Item** | Tidak ada | Ada (di baris terpisah) |
| **Warna Informasi** | Seragam | Berbeda (abu-abu, merah, hitam) |

## Catatan Teknis

- PDF struk menggunakan jsPDF library
- Struk terbuka di tab baru dengan opsi download/print dari PDF viewer
- Subtotal diambil dari field yang sudah ada di database (TransactionItem.subtotal)
- Harga per unit dihitung ulang untuk struk (price * (1 - discount/100))
- Pewarnaan teks untuk membedakan informasi penting:
  - Hitam: informasi utama
  - Abu-abu: informasi sekunder
  - Merah: diskon/pengurangan
  - Orange: header dan branding
