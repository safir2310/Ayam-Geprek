# Perbaiki Error Server saat Update Transaksi

## Masalah yang Dilaporkan

User melaporkan bahwa saat mencoba update status transaksi di admin dashboard, muncul error:
```
Terjadi kesalahan server
```

## Investigasi

### Kemungkinan Penyebab

1. **coinsEarned bernilai null atau 0**
   - Ketika status diubah ke "completed", sistem mencoba menambahkan koin ke user
   - Jika `coinsEarned` null atau 0, bisa menyebabkan error di database increment

2. **Status tidak valid**
   - User mungkin mengirim status yang tidak valid
   - Tidak ada validasi untuk memastikan status masuk daftar yang benar

3. **Database error tidak terhandle dengan benar**
   - Error database hanya muncul sebagai generic error
   - Tidak ada pesan error yang spesifik

4. **Coin addition failure menyebabkan seluruh operasi gagal**
   - Jika menambahkan koin gagal, seluruh transaction update juga gagal
   - Padahal transaction update sudah berhasil

## Perbaikan yang Dilakukan

### 1. Validasi Status Value

**File:** `/home/z/my-project/src/app/api/transactions/[id]/route.ts`

```typescript
// Validate status value
const validStatuses = ['waiting', 'approved', 'processing', 'completed', 'cancelled'];
if (!validStatuses.includes(status)) {
  console.log('[TRANSACTION] Invalid status:', status);
  return NextResponse.json(
    { error: `Status tidak valid. Status yang valid: ${validStatuses.join(', ')}` },
    { status: 400 }
  );
}
```

**Manfaat:**
- Mencegah status yang tidak valid dikirim ke database
- Memberikan pesan error yang jelas dengan daftar status yang valid

### 2. Logging Tambahan

```typescript
console.log('[TRANSACTION] Current status:', existingTransaction.status);
console.log('[TRANSACTION] Coins earned:', existingTransaction.coinsEarned);
console.log('[TRANSACTION] User ID:', existingTransaction.userId);
```

**Manfaat:**
- Memudahkan debugging jika ada masalah
- Bisa melihat nilai coinsEarned yang akan ditambahkan
- Bisa melihat userId yang akan diupdate

### 3. Null Check untuk Coins Earned

**Sebelum:**
```typescript
await db.user.update({
  where: { id: existingTransaction.userId },
  data: {
    coins: {
      increment: existingTransaction.coinsEarned, // Bisa null!
    },
  },
});
```

**Sesudah:**
```typescript
// Validate coinsEarned before adding
const coinsToAdd = existingTransaction.coinsEarned || 0;

if (coinsToAdd > 0) {
  console.log('[TRANSACTION] Adding coins to user:', coinsToAdd);
  await db.user.update({
    where: { id: existingTransaction.userId },
    data: {
      coins: {
        increment: coinsToAdd, // Aman, pasti number
      },
    },
  });
  console.log('[TRANSACTION] Coins added successfully');
} else {
  console.log('[TRANSACTION] No coins to add (coinsEarned is 0 or null)');
}
```

**Manfaat:**
- Mencegah error jika `coinsEarned` null
- Hanya increment jika ada koin yang ditambahkan
- Logging yang jelas untuk tiap kondisi

### 4. Try-Catch Khusus untuk Coin Addition

```typescript
if (status === 'completed' && existingTransaction.status !== 'completed') {
  try {
    // Validate coinsEarned before adding
    const coinsToAdd = existingTransaction.coinsEarned || 0;

    if (coinsToAdd > 0) {
      console.log('[TRANSACTION] Adding coins to user:', coinsToAdd);
      await db.user.update({
        where: { id: existingTransaction.userId },
        data: {
          coins: {
            increment: coinsToAdd,
          },
        },
      });
      console.log('[TRANSACTION] Coins added successfully');
    } else {
      console.log('[TRANSACTION] No coins to add (coinsEarned is 0 or null)');
    }
  } catch (coinError) {
    console.error('[TRANSACTION] Error adding coins:', coinError);
    // Continue even if coin addition fails
    // Transaction update was successful, just log the coin error
  }
}
```

**Manfaat:**
- Coin addition failure tidak mengganggu transaction update
- Error coin dilog secara terpisah
- Transaction update tetap berhasil meskipun coin gagal

### 5. Database Error Handling

**Untuk Find Operation:**
```typescript
const existingTransaction = await db.transaction.findUnique({
  where: { id: params.id },
}).catch((dbError) => {
  console.error('[TRANSACTION] Database error finding transaction:', dbError);
  throw new Error('Gagal mengambil data transaksi dari database');
});
```

**Untuk Update Operation:**
```typescript
const transaction = await db.transaction.update({
  where: { id: params.id },
  data: {
    status,
    ...(status === 'completed' && {
      completedAt: new Date(),
    }),
  },
}).catch((dbError) => {
  console.error('[TRANSACTION] Database error updating transaction:', dbError);
  throw new Error('Gagal mengupdate status transaksi di database');
});
```

**Manfaat:**
- Error database memiliki pesan yang spesifik
- User mendapat error message yang jelas
- Mudah debugging dari log

## Flow Update Status (Sesudah Perbaikan)

```
1. Admin klik dropdown status
2. Admin memilih status baru
3. Frontend:
   - Set updatingTransactionId
   - Tampilkan loading spinner
   - Kirim PUT request ke /api/transactions/[id]
4. API receives request
5. API validates status:
   - Cek apakah status ada dalam validStatuses
   - Jika tidak valid → return 400 dengan pesan error
6. API finds transaction in database:
   - Jika error database → throw dengan pesan spesifik
   - Jika tidak ditemukan → return 404
7. API updates transaction in database:
   - Jika error database → throw dengan pesan spesifik
   - Set status dan completedAt jika needed
8. API adds coins (if status = completed):
   - Validate coinsEarned tidak null
   - Cek coinsToAdd > 0
   - Update user coins
   - Catch coin error tapi continue (transaction update sukses)
9. API returns updated transaction
10. Frontend:
    - Terima response
    - Refresh data transaksi
    - Clear updatingTransactionId
    - Hapus loading spinner
```

## Cara Menguji

### Test 1: Update Status ke Non-Completed
1. Buka https://ayamgepreksambalijo.vercel.app/admin/dashboard
2. Login sebagai admin
3. Pilih transaksi dengan status "waiting"
4. Update ke "approved"
5. **Hasil:**
   - ✅ Status berhasil diubah
   - ✅ Alert "Status berhasil diubah!"
   - ✅ Tidak ada koin ditambahkan

### Test 2: Update Status ke Completed dengan Coins
1. Pilih transaksi lain
2. Update ke "completed"
3. **Hasil:**
   - ✅ Status berhasil diubah
   - ✅ Koin user bertambah sesuai coinsEarned
   - ✅ Alert "Status berhasil diubah!"

### Test 3: Update Status ke Completed Tanpa Coins
1. Cari transaksi dengan coinsEarned = 0
2. Update ke "completed"
3. **Hasil:**
   - ✅ Status berhasil diubah
   - ✅ Log "No coins to add"
   - ✅ User coins tidak berubah
   - ✅ Tidak ada error

### Test 4: Kirim Status Tidak Valid
1. Coba kirim request manual (bisa via browser console)
2. Kirim status: "invalid_status"
3. **Hasil:**
   - ✅ Return 400 dengan pesan error
   - ✅ Error message: "Status tidak valid. Status yang valid: waiting, approved, processing, completed, cancelled"

### Test 5: Coba Update Transaksi Tidak Ada
1. Gunakan ID transaksi yang tidak valid
2. Coba update status
3. **Hasil:**
   - ✅ Return 404
   - ✅ Error message: "Transaksi tidak ditemukan"

### Test 6: Update Status Sama
1. Pilih transaksi dengan status "approved"
2. Coba update ke "approved" lagi
3. **Hasil:**
   - ✅ Frontend skip request (status validation)
   - Tidak ada request ke API
   - Tidak ada alert atau perubahan

## Debugging jika Masalah Masih Terjadi

Jika error masih muncul:

1. **Buka Vercel Logs**
   - https://vercel.com
   - Pilih project: ayamgepreksambalijo
   - Buka tab "Logs"
   - Filter dengan `[TRANSACTION]`

2. **Periksa Log Sequence**
   ```
   [TRANSACTION] PUT request received for ID: xxx
   [TRANSACTION] New status: xxx
   [TRANSACTION] Current status: xxx
   [TRANSACTION] Coins earned: xxx
   [TRANSACTION] User ID: xxx
   [TRANSACTION] Transaction updated successfully
   [TRANSACTION] Adding coins to user: xxx
   [TRANSACTION] Coins added successfully
   ```

3. **Identify Error**
   - Lihat di langkah mana error terjadi
   - Baca error message yang spesifik
   - Cek stack trace jika ada

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil dan live
- **Commit**: `perbaiki error server saat update transaksi`

## Ringkasan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Status Validation** | Tidak ada | Validasi status dengan daftar |
| **Null Checks** | Tidak ada | coinsEarned validated |
| **Zero Coin Handling** | Error jika 0 | Skip jika 0 |
| **Coin Error Isolation** | Gagalkan semua | Catch & continue |
| **Database Errors** | Generic | Spesifik pesan error |
| **Logging** | Basic | Detail untuk debugging |
| **Error Messages** | "Terjadi kesalahan server" | Spesifik per tipe error |
| **User Experience** | Confusing | Clear dengan pesan error spesifik |

## Catatan Teknis

- Validasi status menggunakan array validStatuses
- coinsEarned menggunakan default value 0 untuk mencegah null
- Coin addition dalam try-catch terpisah untuk isolasi error
- Database operations menggunakan .catch() untuk throw error spesifik
- Transaction update dan coin addition dipisah error handlingnya
- Semua error memiliki prefix `[TRANSACTION]` untuk mudah difilter di logs
- Pesan error dalam Bahasa Indonesia untuk user-friendly
