# Perbaiki Error Struk

## Masalah yang Dilaporkan

User melaporkan bahwa saat mengklik tombol "Lihat Struk", muncul error:
```json
{"error":"Terjadi kesalahan server"}
```

## Investigasi dan Perbaikan

### Kemungkinan Penyebab

1. **Field yang bernilai null** - Beberapa field di database mungkin null
2. **Error dalam rendering PDF** - jsPDF mungkin gagal memproses null/undefined
3. **Tipe data yang tidak sesuai** - Field yang diharapkan number tapi mungkin string
4. **Field yang tidak ada** - Field yang diakses mungkin tidak tersedia di query result

### Perbaikan yang Dilakukan

#### 1. Tambah Logging Detail untuk Debugging

```typescript
// Log saat request masuk
console.log('[RECEIPT] Generating receipt for transaction ID:', params.id);

// Log setelah query database
console.log('[RECEIPT] Transaction found:', !!transaction);
console.log('[RECEIPT] Transaction data:', {
  receiptId: transaction.receiptId,
  totalAmount: transaction.totalAmount,
  itemCount: transaction.items.length,
});

// Log untuk setiap item yang diproses
transaction.items.forEach((item, index) => {
  console.log('[RECEIPT] Processing item:', {
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    subtotal: item.subtotal,
  });
  // ... processing item
});

// Log saat PDF berhasil digenerate
console.log('[RECEIPT] PDF generated successfully, size:', pdfBuffer.length);

// Log detail saat terjadi error
console.error('[RECEIPT] Error generating PDF:', error);
console.error('[RECEIPT] Error details:', JSON.stringify(error, null, 2));
if (error instanceof Error) {
  console.error('[RECEIPT] Error name:', error.name);
  console.error('[RECEIPT] Error message:', error.message);
  console.error('[RECEIPT] Error stack:', error.stack);
}
```

#### 2. Tambah Null Checks untuk Field Transaksi

**Sebelum:**
```typescript
doc.text(`ID Struk       : ${transaction.receiptId}`, 20, 65);
doc.text(
  `Tanggal        : ${new Date(transaction.orderDate).toLocaleDateString('id-ID', ...)}`,
  20,
  72
);
doc.text(`Nama           : ${transaction.userName}`, 20, 79);
doc.text(`ID User        : ${transaction.userIdNumber}`, 20, 86);
doc.text(`No HP          : ${transaction.userPhoneNumber}`, 20, 93);
```

**Sesudah:**
```typescript
doc.text(`ID Struk       : ${transaction.receiptId || 'N/A'}`, 20, 65);
doc.text(
  `Tanggal        : ${transaction.orderDate
    ? new Date(transaction.orderDate).toLocaleDateString('id-ID', {...})
    : 'N/A'}`,
  20,
  72
);
doc.text(`Nama           : ${transaction.userName || 'N/A'}`, 20, 79);
doc.text(`ID User        : ${transaction.userIdNumber || 'N/A'}`, 20, 86);
doc.text(`No HP          : ${transaction.userPhoneNumber || 'N/A'}`, 20, 93);
```

#### 3. Tambah Null Checks untuk Field Item

**Sebelum:**
```typescript
const finalPrice = item.discount > 0
  ? item.price * (1 - item.discount / 100)
  : item.price;

doc.text(`${item.quantity}x ${item.productName}`, 20, y);
doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 120, y, { align: 'right' });
doc.text(`-${item.discount}%`, 140, y, { align: 'right' });
doc.text(`Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
```

**Sesudah:**
```typescript
// Extract dengan default values untuk menghindari error null/undefined
const itemPrice = item.price || 0;
const itemDiscount = item.discount || 0;
const itemSubtotal = item.subtotal || 0;

const finalPrice = itemDiscount > 0
  ? itemPrice * (1 - itemDiscount / 100)
  : itemPrice;

// Log untuk debugging
console.log('[RECEIPT] Processing item:', {
  productName: item.productName,
  quantity: item.quantity,
  price: item.price,
  discount: item.discount,
  subtotal: item.subtotal,
});

doc.text(`${item.quantity}x ${item.productName || 'Unknown Product'}`, 20, y);
doc.text(`Rp ${itemPrice.toLocaleString('id-ID')}`, 120, y, { align: 'right' });
doc.text(`-${itemDiscount}%`, 140, y, { align: 'right' });
doc.text(`Subtotal: Rp ${itemSubtotal.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
```

#### 4. Tambah Null Checks untuk Total dan Koin

**Sebelum:**
```typescript
doc.text(`Rp ${transaction.totalAmount.toLocaleString('id-ID')}`, 170, y, { align: 'right' });

const statusText = {
  waiting: 'Menunggu Persetujuan',
  ...
}[transaction.status] || transaction.status;

if (transaction.status === 'completed') {
  doc.text(`Koin Diperoleh: +${transaction.coinsEarned}`, 20, y);
}
```

**Sesudah:**
```typescript
doc.text(`Rp ${(transaction.totalAmount || 0).toLocaleString('id-ID')}`, 170, y, { align: 'right' });

const statusText = {
  waiting: 'Menunggu Persetujuan',
  ...
}[transaction.status] || transaction.status || 'Unknown';

if (transaction.status === 'completed' && transaction.coinsEarned) {
  doc.text(`Koin Diperoleh: +${transaction.coinsEarned}`, 20, y);
}
```

## Manfaat Perbaikan

### 1. **Error Prevention**
- Mencegah crash saat field bernilai null/undefined
- Menggunakan default values untuk numeric fields
- Menggunakan fallback strings untuk text fields

### 2. **Better Error Handling**
- Logging detail untuk memudahkan debugging
- Error yang lebih spesifik bisa diidentifikasi
- Stack trace tersedia untuk troubleshooting

### 3. **Graceful Degradation**
- Jika data tidak lengkap, tetap bisa menampilkan struk dengan nilai 'N/A'
- User tetap bisa melihat struk meski ada data yang kurang

## Cara Menguji

### Test 1: Lihat Struk dengan Data Lengkap
1. Login sebagai user/admin
2. Buka dashboard
3. Pilih transaksi dengan data lengkap
4. Klik "Lihat Struk"
5. Verifikasi: Struk PDF terbuka dengan benar

### Test 2: Cek Log jika Error Masih Terjadi
Jika error masih muncul:
1. Buka Vercel logs di: https://vercel.com/safir2310s-projects/ayamgepreksambalijo
2. Cari log dengan prefix `[RECEIPT]`
3. Lihat error detail yang muncul:
   - Error name
   - Error message
   - Error stack
   - Transaction data
   - Item data

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil
- **Commit**: `perbaiki error struk dengan null checks dan logging`

## Langkah Selanjutnya jika Error Masih Terjadi

Jika setelah perbaikan ini error masih terjadi:

1. **Cek Vercel Logs**
   - Buka dashboard Vercel
   - Pilih project ayamgepreksambalijo
   - Buka tab "Logs"
   - Filter dengan `[RECEIPT]`

2. **Identify Error Type**
   - Lihat error name dan message
   - Cek apakah field yang bermasalah
   - Pastikan schema database sesuai dengan code

3. **Test Data di Database**
   - Cek transaksi di database
   - Pastikan semua field terisi dengan benar
   - Pastikan tipe data sesuai

## Ringkasan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Null Handling** | Tidak ada | Ada untuk semua fields |
| **Error Logging** | Basic | Detail dengan stack trace |
| **Default Values** | Tidak ada | 'N/A', 'Unknown', 0 |
| **Debugging Info** | Minimal | Logs untuk setiap step |
| **Resilience** | Bisa crash | Graceful degradation |

## Catatan Teknis

- Semua field sekarang memiliki null checks atau default values
- Logging menggunakan prefix `[RECEIPT]` untuk mudah difilter
- Error handling sekarang mencetak:
  - Error object lengkap
  - Error name, message, dan stack
- Field yang ditangani:
  - Transaction: receiptId, orderDate, userName, userIdNumber, userPhoneNumber, totalAmount, status, coinsEarned
  - TransactionItem: productName, quantity, price, discount, subtotal
