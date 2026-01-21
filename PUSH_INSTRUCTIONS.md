# 📤 GITHUB PUSH INSTRUCTIONS

## ⚠️ GITHUB TOKEN PERLU DIPERBARUI

Token GitHub yang lama sudah tidak berfungsi. Silakan:

### Step 1: Generate Token Baru
1. Buka: https://github.com/settings/tokens
2. Klik: "Generate new token (classic)"
3. Note: "Ayam Geprek - Netlify Update"
4. Scopes: ✅ **repo** (read & write)
5. Generate
6. Copy token baru

---

## 🚀 PUSH KE GITHUB (Dari Terminal):

### Option 1: Push langsung dengan username/token

```bash
cd /home/z/my-project
git push -u origin main
```

Saat diminta:
- Username: `safir2310`
- Password: [PASTE TOKEN BARU]

---

### Option 2: Update remote dengan token

```bash
cd /home/z/my-project
git remote set-url origin https://safir2310:[TOKEN_BARU]@github.com/safir2310/Ayam-Geprek.git
git push -u origin main
```

Ganti `[TOKEN_BARU]` dengan token yang baru di-generate.

---

## 📋 YANG SUDAH DI-COMMIT:

✅ **netlify.toml** - Konfigurasi deployment Netlify
✅ **.env.example** - Contoh environment variables
✅ **NETLIFY_DEPLOYMENT.md** - Panduan lengkap deployment
✅ **package.json** - Update build script (db:generate dulu)

---

## 📄 File yang Akan di-Upload:

1. **netlify.toml**
   - Build command configuration
   - Environment setup
   - Redirect rules
   - Security headers

2. **.env.example**
   - Database URL examples
   - Environment variables guide
   - Local vs Production settings

3. **NETLIFY_DEPLOYMENT.md**
   - Panduan deployment lengkap
   - Opsi database (SQLite, Postgres, MySQL)
   - Troubleshooting guide
   - Production recommendations (Vercel + Postgres)

---

## 🎯 LANJUTKAN SETELAH PUSH:

### 1. Deploy ke Netlify
```bash
# Install Netlify CLI (jika belum ada)
bun add -g netlify-cli

# Deploy
netlify deploy --prod
```

Atau connect GitHub repository di Netlify dashboard!

### 2. Setup Environment Variables di Netlify

Di Netlify Dashboard → Site Settings → Environment Variables:

```
NODE_ENV=production
DATABASE_URL=file:/tmp/custom.db
```

### 3. Build Settings di Netlify:

```
Build command: bun run build
Publish directory: .next/standalone
```

---

## ⚠️ PENTING TENTANG DATABASE:

### SQLite di Netlify (Current Setup):
- ✅ Bisa digunakan untuk **DEMO/TESTING**
- ❌ Data akan hilang setelah redeploy
- ❌ Tidak persisten
- ❌ File hanya di `/tmp` (temporary)

### RECOMMENDED untuk Production:

#### 1. Vercel + Vercel Postgres (BEST)
```
1. Buat project di Vercel
2. Setup Postgres di Vercel
3. Copy DATABASE_URL dari Vercel
4. Add ke Netlify environment variables
5. Update prisma/schema.prisma:
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
6. Push schema: bun run db:push
```

#### 2. Railway.app
```
1. Buat project di Railway
2. Add Postgres database
3. Copy DATABASE_URL
4. Add ke Netlify environment variables
```

---

## 📚 DOKUMENTASI LENGKAP:

Lihat file `NETLIFY_DEPLOYMENT.md` untuk:
- Panduan deployment step-by-step
- Opsi database berbeda
- Troubleshooting
- Production best practices

---

**Push code ke GitHub dulu, lalu deploy ke Netlify!** 🚀
