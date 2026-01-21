# Perbaiki Update Status Transaksi di Admin Dashboard

## Masalah yang Dilaporkan

User melaporkan bahwa fitur update status transaksi di dashboard admin **"tidak bisa diubah dengan 1 x klik"**.

## Investigasi

### Penyebab Masalah

1. **Tidak ada prevention untuk multiple requests**
   - User bisa klik berkali-kali pada Select dropdown
   - Setiap klik memicu `onValueChange` event
   - Banyak request API dikirim secara simultan

2. **Tidak ada loading state**
   - Tidak ada indikator visual saat update sedang berjalan
   - User tidak tahu kapan update selesai
   - Bisa menyebabkan kebingungan

3. **Tidak ada validasi status**
   - Request dikirim meskipun status tidak berubah
   - Membuat request yang tidak perlu ke server

4. **Tidak ada logging**
   - Sulit untuk debugging jika ada masalah
   - Tidak bisa melihat apa yang terjadi di backend

## Perbaikan yang Dilakukan

### 1. Tambah State untuk Melacak Updating Transaction

**File:** `/home/z/my-project/src/app/admin/dashboard/page.tsx`

```typescript
const [updatingTransactionId, setUpdatingTransactionId] = useState<string | null>(null);
```

State ini melacak transaksi mana yang sedang diupdate:
- `null`: tidak ada transaksi yang sedang diupdate
- `string`: ID transaksi yang sedang diupdate

### 2. Perbaiki Fungsi handleUpdateTransactionStatus

**Sebelum:**
```typescript
const handleUpdateTransactionStatus = async (id: string, status: string) => {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      alert('Status berhasil diubah!');
      fetchData();
    } else {
      alert('Gagal mengubah status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Terjadi kesalahan. Silakan coba lagi.');
  }
};
```

**Sesudah:**
```typescript
const handleUpdateTransactionStatus = async (id: string, status: string) => {
  // Prevent multiple simultaneous updates for the same transaction
  if (updatingTransactionId === id) {
    console.log('[ADMIN] Transaction already updating, skipping:', id);
    return;
  }

  // Prevent updating if status hasn't changed
  const transaction = transactions.find(t => t.id === id);
  if (transaction && transaction.status === status) {
    console.log('[ADMIN] Status unchanged, skipping update:', id, status);
    return;
  }

  try {
    console.log('[ADMIN] Updating transaction:', id, 'to status:', status);
    setUpdatingTransactionId(id);

    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log('[ADMIN] Transaction updated successfully:', data);
      alert('Status berhasil diubah!');
      await fetchData(); // Use await to ensure data is refreshed
    } else {
      console.error('[ADMIN] Failed to update transaction:', data);
      alert(data.error || 'Gagal mengubah status');
    }
  } catch (error) {
    console.error('[ADMIN] Error updating status:', error);
    alert('Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    setUpdatingTransactionId(null); // Always clear updating state
  }
};
```

**Perubahan:**
1. **Cek jika transaksi sedang diupdate** - Mencegah multiple requests
2. **Cek jika status tidak berubah** - Mencegah request yang tidak perlu
3. **Set updatingTransactionId** - Melacak update yang sedang berjalan
4. **Tambah logging detail** - Memudahkan debugging
5. **Tampilkan error spesifik** - User tahu error yang sebenarnya
6. **Gunakan await fetchData()** - Memastikan data di-refresh sebelum lanjut
7. **Finally block** - Selalu clear updating state, bahkan jika error

### 3. Update TransactionCard Component

**Props Baru:**
```typescript
function TransactionCard({
  transaction,
  getStatusColor,
  getStatusText,
  onUpdateStatus,
  updatingTransactionId, // ← Prop baru
}: {
  transaction: Transaction;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onUpdateStatus: (id: string, status: string) => void;
  updatingTransactionId: string | null; // ← Tipe baru
}) {
```

**UI Update:**
```typescript
<div className="flex gap-2 items-center">
  <Button
    variant="outline"
    size="sm"
    onClick={() => window.open(`/api/transactions/${transaction.id}/receipt`, '_blank')}
    className="flex items-center gap-2"
    disabled={updatingTransactionId === transaction.id} // ← Disable saat updating
  >
    <FileText className="h-4 w-4" />
    Lihat Struk
  </Button>

  {updatingTransactionId === transaction.id ? (
    // ← Tampilkan spinner saat updating
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="h-4 w-4 border-2 border-gray-400 border-t-orange-600 rounded-full animate-spin" />
      <span>Menyimpan...</span>
    </div>
  ) : (
    // ← Tampilkan Select saat tidak updating
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
  )}
</div>
```

**Perubahan:**
1. **Disable tombol Lihat Struk** saat updating
2. **Tampilkan loading spinner** saat updating
3. **Sembunyikan Select dropdown** saat updating
4. **Ganti dengan loading indicator** untuk memberi feedback jelas

### 4. Tambah Logging di API Route

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

    if (!status) {
      console.log('[TRANSACTION] Status is missing in request body');
      return NextResponse.json(
        { error: 'Status diperlukan' },
        { status: 400 }
      );
    }

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

    const transaction = await db.transaction.update({...});

    console.log('[TRANSACTION] Transaction updated successfully');

    if (status === 'completed' && existingTransaction.status !== 'completed') {
      console.log('[TRANSACTION] Adding coins to user:', existingTransaction.coinsEarned);
      await db.user.update({...});
      console.log('[TRANSACTION] Coins added successfully');
    }

    return NextResponse.json(transaction);
  } catch (error) {
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

**Logging yang Ditambahkan:**
1. Request diterima (ID transaksi)
2. Status baru yang diminta
3. Validasi status
4. Transaksi ditemukan atau tidak
5. Status saat ini
6. Update berhasil
7. Menambahkan koin (jika completed)
8. Koin berhasil ditambah
9. Error detail (name, message, stack) jika terjadi error

## Cara Kerja Baru

### Flow Update Status:

1. **User mengklik dropdown status**
2. **User memilih status baru**
3. **Frontend:**
   - Cek apakah transaksi sedang diupdate → Jika ya, **skip**
   - Cek apakah status sama dengan yang ada → Jika ya, **skip**
   - Set `updatingTransactionId` ke ID transaksi
   - Tampilkan spinner "Menyimpan..."
   - Sembunyikan Select dropdown
   - Kirim request PUT ke API
4. **API:**
   - Validate input
   - Update transaksi di database
   - Tambahkan koin jika status = completed
   - Return updated transaction
5. **Frontend:**
   - Terima response
   - Tampilkan alert "Status berhasil diubah!"
   - Refresh data transaksi
   - Clear `updatingTransactionId` kembali ke `null`
   - Tampilkan Select dropdown kembali dengan status baru

### Multiple Click Prevention:

```
Klik 1: Select status "approved"
  → updatingTransactionId = "tx123"
  → Spinner tampil
  → Request dikirim

Klik 2: Select status "completed" (sebelum request 1 selesai)
  → checking: updatingTransactionId === "tx123" ? YES
  → → SKIP (request tidak dikirim)

Request 1 selesai:
  → updatingTransactionId = null
  → Status berubah ke "approved"
  → Spinner hilang, Select muncul

Klik 3: Select status "completed"
  → checking: updatingTransactionId === "tx123" ? NO
  → checking: status === "approved" !== "completed" ? YES
  → updatingTransactionId = "tx123"
  → Request dikirim
```

## Cara Menguji

### Test 1: Update Status dengan Satu Klik
1. Buka https://ayamgepreksambalijo.vercel.app/admin/dashboard
2. Login sebagai admin
3. Pergi ke tab "Transaksi"
4. Pilih salah satu transaksi
5. Klik dropdown status dan pilih status baru
6. **Hasil:**
   - Spinner "Menyimpan..." muncul
   - Tombol Lihat Struk disabled
   - Dropdown disembunyikan
   - Status berhasil berubah dalam satu klik
   - Alert "Status berhasil diubah!" muncul
   - Dropdown muncul kembali dengan status baru

### Test 2: Coba Multiple Clicks
1. Pilih transaksi lain
2. Klik status dan pilih opsi baru
3. **Sebelum** spinner hilang, klik lagi ke opsi lain
4. **Hasil:**
   - Klik kedua **diabaikan** (tidak ada request)
   - Log menunjukkan: "Transaction already updating, skipping"
   - Tidak ada multiple request

### Test 3: Coba Update ke Status Sama
1. Pilih transaksi dengan status "approved"
2. Klik dropdown dan pilih "approved" lagi
3. **Hasil:**
   - Tidak ada request dikirim
   - Log menunjukkan: "Status unchanged, skipping update"
   - Tidak ada alert atau perubahan UI

### Test 4: Check Logs jika Ada Masalah
Jika masih ada masalah, periksa Vercel logs:
1. Buka https://vercel.com
2. Pilih project ayamgepreksambalijo
3. Buka tab "Logs"
4. Filter dengan `[ADMIN]` dan `[TRANSACTION]`
5. Lihat sequence log untuk debugging

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil dan live
- **Commit**: `perbaiki update status transaksi di admin dashboard dengan satu klik`

## Ringkasan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Multiple Requests** | Tidak dicegah | Dicegah dengan state |
| **Loading Indicator** | Tidak ada | Spinner + text "Menyimpan..." |
| **Disabled Controls** | Tidak ada | Tombol & Select disabled saat updating |
| **Status Validation** | Tidak ada | Skip jika status sama |
| **Error Handling** | Basic | Detail error dari API |
| **Logging** | Minimal | Detail untuk debugging |
| **User Feedback** | Minimal | Jelas dengan spinner dan alert |
| **Click Efficiency** | Perlu banyak klik | 1 klik cukup |

## Catatan Teknis

- `updatingTransactionId` mencegah race conditions
- Loading state memberi feedback visual yang jelas
- Status validation mencegah request yang tidak perlu
- Logging dengan prefix `[ADMIN]` dan `[TRANSACTION]` untuk mudah difilter
- `await fetchData()` memastikan data refresh selesai sebelum lanjut
- `finally` block memastikan updating state selalu di-clear
- Spinner menggunakan Tailwind `animate-spin` untuk animasi smooth
