# Gabungkan Login dan Register di Header

## Ringkasan Perubahan

Menggabungkan tombol Login dan Register terpisah di header menjadi satu dropdown menu agar lebih hemat ruang dan lebih bersih secara visual.

## Perubahan yang Dilakukan

### File: `/home/z/my-project/src/app/page.tsx`

#### 1. Import Tambahan
```typescript
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

#### 2. Header Navigation (Sebelum)
```typescript
) : (
  <div className="flex gap-2">
    <Link href="/auth/login">
      <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
        <User className="h-5 w-5 mr-2" />
      </Button>
    </Link>
    <Link href="/auth/register">
      <Button className="bg-white text-orange-600 hover:bg-orange-50">
        <User className="h-5 w-5 mr-2" />
      </Button>
    </Link>
  </div>
)}
```

#### 3. Header Navigation (Sesudah)
```typescript
) : (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
        <User className="h-5 w-5 mr-2" />
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
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
  </DropdownMenu>
)}
```

## Fitur Baru

### Dropdown Menu Authentication
- **Satu Tombol**: User hanya perlu klik satu tombol dengan ikon User untuk melihat opsi
- **Dua Opsi**:
  - Login: Mengarah ke halaman `/auth/login`
  - Register: Mengarah ke halaman `/auth/register`
- **Icon Chevron Down**: Menunjukkan bahwa tombol ini memiliki dropdown menu
- **Align End**: Dropdown menu muncul di sebelah kanan (align="end") agar tidak terpotong di layar kecil

## Keuntungan

1. **Hemat Ruang**: Mengurangi jumlah tombol di header dari 2 menjadi 1
2. **UI Lebih Bersih**: Header terlihat lebih minimalis dan profesional
3. **Responsive**: Lebih cocok untuk tampilan mobile yang terbatas ruangnya
4. **Pengalaman User**: User masih bisa dengan mudah mengakses kedua halaman (Login dan Register)
5. **Konsisten**: Menggunakan komponen shadcn/ui DropdownMenu yang sudah tersedia

## Deploy

- **Deployment URL**: https://ayamgepreksambalijo.vercel.app
- **Status**: ✅ Deploy berhasil
- **Commit**: `gabungkan tombol login dan register di header menjadi dropdown menu`

## Testing

Untuk menguji perubahan ini:

1. Buka https://ayamgepreksambalijo.vercel.app
2. Pastikan tidak sedang login (logout jika sudah login)
3. Di bagian header sebelah kanan, akan terlihat satu tombol dengan ikon User dan panah ke bawah
4. Klik tombol tersebut untuk membuka dropdown menu
5. Pilih Login atau Register dari menu yang muncul
6. Verifikasi bahwa halaman yang benar terbuka

## Catatan Teknis

- Menggunakan komponen `DropdownMenu` dari shadcn/ui (@radix-ui/react-dropdown-menu)
- Tombol trigger menggunakan styling yang sama dengan tombol login sebelumnya (border-white, text-white)
- Setiap menu item menggunakan ikon User yang lebih kecil (h-4 w-4) untuk konsistensi
- Dropdown menu diset align="end" agar muncul di sebelah kanan tombol trigger
