# Perbaiki Ikon Login/Register dan Validasi Admin Verification

## Ringkasan Perubahan

Memperbaiki dua masalah utama:
1. Menambahkan ikon yang berbeda dan lebih jelas untuk Login dan Register di dropdown header
2. Memperbaiki validasi kode verifikasi admin yang sebelumnya tidak berfungsi karena format tanggal yang salah

## Perubahan 1: Ikon di Dropdown Header

### File: `/home/z/my-project/src/app/page.tsx`

#### Import Tambahan
```typescript
import { LogIn, UserPlus } from 'lucide-react';
```

#### Dropdown Menu (Sebelum)
```typescript
<DropdownMenuContent align="end">
  <DropdownMenuItem asChild>
    <Link href="/auth/login" className="cursor-pointer">
      <User className="h-4 w-4 mr-2" />
      Login
    </Link>
  </DropdownMenuItem>
  <DropdownMenuItem asChild>
    <Link href="/auth/register" className="cursor-pointer">
      <User className="h-4 w-4 mr-2" />
      Register
    </Link>
  </DropdownMenuItem>
</DropdownMenuContent>
```

#### Dropdown Menu (Sesudah)
```typescript
<DropdownMenuContent align="end">
  <DropdownMenuItem asChild>
    <Link href="/auth/login" className="cursor-pointer">
      <LogIn className="h-4 w-4 mr-2" />
      Login
    </Link>
  </DropdownMenuItem>
  <DropdownMenuItem asChild>
    <Link href="/auth/register" className="cursor-pointer">
      <UserPlus className="h-4 w-4 mr-2" />
      Register
    </Link>
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Perubahan Ikon
- **Login**: Menggunakan ikon `LogIn` (panah masuk ke dalam garis) - lebih intuitif untuk aksi login
- **Register**: Menggunakan ikon `UserPlus` (user dengan tanda plus) - lebih intuitif untuk aksi pendaftaran

## Perubahan 2: Validasi Kode Verifikasi Admin

### Masalah yang Ditemukan

**Format Tanggal HTML Date Picker:**
- HTML date picker (`type="date"`) mengembalikan format: `YYYY-MM-DD`
- Contoh: `2000-01-01`

**Kode Verifikasi yang Diminta:**
- Format yang diminta: `DDMMYY` (6 digit)
- Contoh: `010100`

**Masalah Sebelumnya:**
```typescript
// Kode lama hanya menghapus semua karakter non-digit
const cleanDob = dateOfBirth.replace(/[^0-9]/g, '');
// Hasil: "20000101" (8 digit) - tidak akan cocok dengan "010100" (6 digit)
```

**Akibat:**
- Validasi selalu gagal
- User selalu melihat error "Kode verifikasi salah" meskipun kode benar

### Solusi yang Diterapkan

#### File: `/home/z/my-project/src/app/api/auth/register/route.ts`

```typescript
// Parse date of birth dari HTML date picker format (YYYY-MM-DD)
// dan konversi ke format DDMMYY untuk perbandingan
const dateParts = dateOfBirth.split('-');
if (dateParts.length !== 3) {
  return NextResponse.json(
    { error: 'Format tanggal lahir tidak valid' },
    { status: 400 }
  );
}

const year = dateParts[0];   // YYYY
const month = dateParts[1];  // MM
const day = dateParts[2];    // DD

// Ambil 2 digit terakhir tahun
const yearShort = year.slice(-2);

// Format sebagai DDMMYY
const formattedDob = `${day}${month}${yearShort}`;

// Bandingkan dengan kode verifikasi
if (cleanVerificationCode !== formattedDob) {
  return NextResponse.json(
    { error: 'Kode verifikasi salah' },
    { status: 400 }
  );
}
```

#### File: `/home/z/my-project/src/app/auth/register/page.tsx`

**Menambahkan Informasi Format yang Lebih Jelas:**

```tsx
<div className="space-y-2">
  <Label htmlFor="admin-verification" className="flex items-center gap-2">
    <Check className="h-4 w-4" />
    Kode verifikasi
  </Label>
  <Input
    id="admin-verification"
    type="text"
    placeholder="DDMMYY (contoh: 010100)"
    value={adminData.verificationCode}
    onChange={(e) => setAdminData({ ...adminData, verificationCode: e.target.value })}
    required
    maxLength={6}
  />
  <p className="text-xs text-gray-500">
    Masukkan 6 digit dari tanggal lahir Anda dalam format DDMMYY
    <br />
    Contoh: Jika lahir 01-01-2000, masukkan <strong>010100</strong>
  </p>
</div>
```

## Cara Kerja Validasi

### Contoh Skenario

**User Admin ingin mendaftar dengan:**
- Tanggal Lahir: 01 Januari 2000
- Di date picker: memilih 2000-01-01

**Proses Validasi:**

1. Backend menerima: `dateOfBirth = "2000-01-01"`
2. Backend mem-parse tanggal:
   - `year = "2000"`
   - `month = "01"`
   - `day = "01"`
3. Format ulang ke DDMMYY:
   - `yearShort = "00"` (2 digit terakhir tahun)
   - `formattedDob = "01" + "01" + "00" = "010100"`
4. User memasukkan kode verifikasi: `010100`
5. Normalisasi kode: `cleanVerificationCode = "010100"`
6. Perbandingan: `"010100" === "010100"` → ✅ **MATCH!**

## Testing

### Test 1: Ikon yang Benar
1. Buka https://ayamgepreksambalijo.vercel.app
2. Pastikan belum login
3. Klik tombol User di header (dengan panah ke bawah)
4. Dropdown menu akan muncul
5. Verifikasi:
   - Opsi Login memiliki ikon LogIn (panah masuk)
   - Opsi Register memiliki ikon UserPlus (user dengan plus)

### Test 2: Registrasi Admin yang Benar
1. Buka https://ayamgepreksambalijo.vercel.app
2. Klik dropdown → Register
3. Pilih tab "Admin"
4. Isi formulir:
   - Username: testadmin
   - Password: password123
   - Email: admin@example.com
   - No HP: 08123456789
   - Tanggal Lahir: pilih tanggal lahir Anda, misal 01-01-2000
   - Kode Verifikasi: masukkan 6 digit dari tanggal lahir dalam format DDMMYY
     - Untuk 01-01-2000, masukkan: **010100**
5. Klik "Register sebagai Admin"
6. Verifikasi:
   - Registrasi berhasil
   - Tidak ada error "Kode verifikasi salah"
   - Redirect ke halaman login

### Test 3: Kode Verifikasi Salah
1. Ulangi langkah di atas
2. Masukkan kode verifikasi yang salah, misal "999999"
3. Verifikasi:
   - Muncul error "Kode verifikasi salah"
   - Tidak berhasil mendaftar

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil
- **Commit**: `perbaiki ikon login/register di dropdown dan validasi admin verification`

## Ringkasan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Ikon Login** | User (umum) | LogIn (spesifik) |
| **Ikon Register** | User (umum) | UserPlus (spesifik) |
| **Validasi Admin** | Selalu gagal | Berfungsi dengan benar |
| **Petunjuk User** | Tidak jelas | Ada contoh dan penjelasan |
| **Placeholder** | "kode verifikasi dari admin" | "DDMMYY (contoh: 010100)" |

## Catatan Teknis

- HTML date picker selalu mengembalikan format `YYYY-MM-DD` (ISO 8601)
- Validasi backend sekarang mem-parse format ini dan mengubah ke `DDMMYY`
- User diberikan contoh yang jelas agar mengerti format yang benar
- Logging ditambahkan untuk debugging jika ada masalah di masa depan
