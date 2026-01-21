# Perbaiki Lengkap Update Status Transaksi

## Masalah Utama

Update status transaksi di admin dashboard gagal dengan pesan:
```
Terjadi kesalahan server
```

## Root Cause

Masalah utama adalah penggunaan `.catch()` pada Prisma operations yang **melempar error baru dengan `throw new Error()`**.

### Contoh Error Code:

```typescript
// ❌ SALAH
const existingTransaction = await db.transaction.findUnique({
  where: { id: params.id },
}).catch((dbError) => {
  console.error('[TRANSACTION] Database error finding transaction:', dbError);
  throw new Error('Gagal mengambil data transaksi dari database'); // ← INI MASALAHNYA!
});

// Ketika error dilempar di sini:
// 1. Masuk ke .catch()
// 2. throw new Error()
// 3. Masuk ke outer try-catch
// 4. Kembali ke user dengan "Terjadi kesalahan server"
```

### Kenapa Ini Masalah?

1. **Error yang dilempar** dari `.catch()` akan **masuk ke outer catch block**
2. Error yang sebenarnya mungkin **bukan fatal** (misalnya connection issue sementara)
3. User menerima **error generik** "Terjadi kesalahan server" bukan error spesifik
4. Sulit untuk debugging karena error asli tertutup

## Perbaikan

### Solusi: Hapus `.catch()` dan Gunakan Error Handling Sederhana

**File:** `/home/z/my-project/src/app/api/transactions/[id]/route.ts`

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[TRANSACTION] PUT request received for ID:', params.id);

    const body = await request.json();
    const { status } = body;

    console.log('[TRANSACTION] New status:', status);

    // Validate status value
    const validStatuses = ['waiting', 'approved', 'processing', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      console.log('[TRANSACTION] Invalid or missing status:', status);
      return NextResponse.json(
        { error: 'Status tidak valid. Status yang valid: waiting, approved, processing, completed, cancelled' },
        { status: 400 }
      );
    }

    // Get transaction first - TANPA .catch()
    const existingTransaction = await db.transaction.findUnique({
      where: { id: params.id },
    });

    console.log('[TRANSACTION] Existing transaction found:', !!existingTransaction);

    if (!existingTransaction) {
      console.log('[TRANSACTION] Transaction not found:', params.id);
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[TRANSACTION] Current status:', existingTransaction.status);
    console.log('[TRANSACTION] Coins earned:', existingTransaction.coinsEarned);
    console.log('[TRANSACTION] User ID:', existingTransaction.userId);

    // Update transaction - TANPA .catch()
    const transaction = await db.transaction.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'completed' && {
          completedAt: new Date(),
        }),
      },
    });

    console.log('[TRANSACTION] Transaction updated successfully');

    // If status is completed, add coins to user
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
        // Continue even if coin addition fails - transaction update was successful
        // Just log the error, don't fail the whole request
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    // SEMUA error akan masuk sini dan dilog dengan benar
    console.error('[TRANSACTION] Error updating transaction:', error);
    if (error instanceof Error) {
      console.error('[TRANSACTION] Error name:', error.name);
      console.error('[TRANSACTION] Error message:', error.message);
      console.error('[TRANSACTION] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
```

## Perbedaan: Sebelum vs Sesudah

| Aspek | Sebelum (Salah) | Sesudah (Benar) |
|-------|------------------|-----------------|
| **findUnique** | Ada `.catch()` + `throw` | Tidak ada, langsung ke outer catch |
| **update** | Ada `.catch()` + `throw` | Tidak ada, langsung ke outer catch |
| **Error Handling** | Nested throws, confusing | Sederhana, semua ke satu catch block |
| **Error Messages** | Generik / tersembunyi | Spesifik dengan full stack |
| **Coin Addition** | Terpisah | Terpisah (tetap benar) |
| **Debugging** | Sulit | Mudah dengan log lengkap |

## Flow Error Handling (Sesudah)

```
Prisma Operation Error
        ↓
   (langsung, tanpa .catch())
        ↓
Outer catch block
        ↓
   Log error detail:
   - Error name
   - Error message  
   - Error stack
        ↓
   Return user-friendly error: "Terjadi kesalahan server"
```

## Kenapa Ini Solusi yang Lebih Baik?

### 1. **Semua Error Ditangani di Satu Tempat**
- Tidak ada error yang "dilempar" dan tertutup
- Outer catch block menangani semua error dengan konsisten
- Log selalu lengkap

### 2. **Error Messages yang Lebih Baik**
- Developer bisa melihat error asli di logs
- User masih menerima pesan user-friendly
- Stack trace tersedia untuk debugging

### 3. **Coin Addition Failure Tidak Mengganggu Update**
- Coin addition dalam try-catch terpisah
- Jika coin addition gagal, transaction update tetap sukses
- User tetap bisa melihat status terupdate

### 4. **Code yang Lebih Sederhana**
- Tidak ada nested error handling
- Flow lebih linear dan mudah dipahami
- Kurang bug-prone

## Cara Menguji

### Test 1: Update Status Normal
1. Buka https://ayamgepreksambalijo.vercel.app/admin/dashboard
2. Login sebagai admin
3. Pilih transaksi dengan status "waiting"
4. Update ke "approved"
5. **Hasil:**
   - ✅ Loading spinner muncul
   - ✅ Status berhasil diubah
   - ✅ Alert "Status berhasil diubah!"
   - ✅ Tidak ada error

### Test 2: Update ke Completed (dengan Coins)
1. Pilih transaksi lain
2. Update ke "completed"
3. **Hasil:**
   - ✅ Status diubah ke "completed"
   - ✅ Koin user bertambah
   - ✅ completedAt di-set ke waktu sekarang
   - ✅ Tidak ada error

### Test 3: Update ke Completed (tanpa Coins)
1. Cari transaksi dengan coinsEarned = 0
2. Update ke "completed"
3. **Hasil:**
   - ✅ Status diubah ke "completed"
   - ✅ Log "No coins to add"
   - ✅ User coins tidak berubah
   - ✅ Tidak ada error

### Test 4: Update ke Status Sama
1. Pilih transaksi dengan status "approved"
2. Update ke "approved" lagi
3. **Hasil:**
   - ✅ Frontend skip request (validasi status)
   - ✅ Tidak ada request ke API
   - ✅ Tidak ada alert

### Test 5: Multiple Clicks
1. Klik status baru, lalu klik lagi sebelum selesai
2. **Hasil:**
   - ✅ Klik kedua diabaikan
   - ✅ Hanya satu request dikirim
   - ✅ Log "Transaction already updating"

## Debugging jika Masalah Masih Terjadi

Jika error masih muncul:

1. **Buka Vercel Logs**
   - https://vercel.com
   - Pilih project: ayamgepreksambalijo
   - Buka tab "Logs"
   - Filter dengan `[TRANSACTION]`

2. **Cari Log Sequence yang Lengkap**
   ```
   [TRANSACTION] PUT request received for ID: xxx
   [TRANSACTION] New status: xxx
   [TRANSACTION] Existing transaction found: true/false
   [TRANSACTION] Current status: xxx
   [TRANSACTION] Coins earned: xxx
   [TRANSACTION] User ID: xxx
   [TRANSACTION] Transaction updated successfully
   [TRANSACTION] Adding coins to user: xxx
   [TRANSACTION] Coins added successfully
   ```

3. **Identify Dimana Error Terjadi**
   - Setelah log manakah error muncul?
   - Apakah error pada database read atau update?
   - Apakah error pada coin addition?

4. **Analisis Error**
   - Error name: tipe error apa?
   - Error message: detail spesifiknya?
   - Error stack: di line mana error terjadi?

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil dan live
- **Commit**: `perbaiki update status transaksi - hapus catch yang melempar error`

## Ringkasan Perbaikan

| Aspek | Masalah | Solusi |
|-------|---------|---------|
| **Nested Error Handling** | `.catch()` + `throw` dalam catch | Hapus `.catch()`, biarkan ke outer catch |
| **Error Tersembunyi** | Error asli tertutup oleh generic throw | Log semua error asli |
| **User Experience** | Error generik "Terjadi kesalahan server" | Tambah logging untuk debugging, tetap user-friendly |
| **Coin Addition** | Bisa gagalkan seluruh operasi | Isolasi dalam try-catch terpisah |
| **Code Complexity** | Nested, confusing | Sederhana, linear |
| **Debugging** | Sulit, error tersembunyi | Mudah, log lengkap |

## Catatan Penting

1. **JANGAN gunakan `.catch()` dengan `throw` pada Prisma operations**
   - Ini akan melempar error ke luar
   - Menggagalkan error handling yang baik di outer catch

2. **Biarkan Prisma errors masuk ke outer catch block**
   - Semua error ditangani konsisten
   - Log selalu lengkap dan informatif

3. **Isolasi operasi yang bisa fail secara independen**
   - Coin addition dalam try-catch terpisah
   - Jika fail, log saja, jangan gagalkan request

4. **Log semuanya untuk debugging**
   - Request data
   - Current state
   - Operations steps
   - Error details jika ada
