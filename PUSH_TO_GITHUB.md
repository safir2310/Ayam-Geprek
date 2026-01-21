# PUSH KE GITHUB - PETUNJUK AMAN

## PERINGATAN!
JANGAN pernah share token GitHub di chat, file, atau tempat lain yang tidak aman!

## CARA AMAN PUSH KE GITHUB:

### Option 1: SSH Keys (Paling Aman & Disarankan)

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Add SSH key to GitHub:
   - Copy: `cat ~/.ssh/id_ed25519.pub`
   - Buka: https://github.com/settings/keys
   - Klik: "New SSH key"
   - Paste dan save

3. Update remote ke SSH:
```bash
cd /home/z/my-project
git remote set-url origin git@github.com:safir2310/ayam-geprek.git
```

4. Push:
```bash
git push -u origin main
```

---

### Option 2: Personal Access Token dengan Git Credential Helper

1. Generate Personal Access Token di GitHub:
   - Buka: https://github.com/settings/tokens
   - Klik: "Generate new token (classic)"
   - Scopes: repo (read & write)
   - Generate dan copy token

2. Configure git credential:
```bash
cd /home/z/my-project
git config credential.helper store
```

3. Push (git akan minta username & token):
```bash
git push -u origin main
```

4. Saat ditanya:
   - Username: safir2310
   - Password: [PASTE TOKEN ANDA DISINI]

Token akan tersimpan secara aman oleh git credential helper.

---

### Option 3: Gunakan HTTPS setiap kali

```bash
cd /home/z/my-project
git push -u origin main
```

Masukkan saat ditanya:
- Username: safir2310
- Password: [PASTE TOKEN ANDA DISINI]

---

## REPOSITORY SUDAH DIBUAT

✅ Remote URL: https://github.com/safir2310/ayam-geprek.git
✅ Branch: main
✅ Files siap untuk push

## LANGKAH TERAKHIR

Pilih salah satu option di atas dan jalankan perintah push:

```bash
cd /home/z/my-project
git push -u origin main
```

File Anda akan ter-upload ke GitHub repository "ayam-geprek"!
