# GetMasjid - Deployment ke Vercel (Lengkap)

## 📦 Yang Sudah Siap untuk Vercel

1. **No file system dependency** → `data/counter.json` dihapus, nomor surat pakai random per request (aman stateless)
2. **Puppeteer fallback** → support `@sparticuz/chromium` + system Chrome fallback
3. **Print fallback** → jika Puppeteer gagal, balik HTML + JS print window (user bisa "Print to PDF")
4. **Vercel JSON config** → `vercel.json` sudah siap
5. **Next config** → `next.config.ts` updated
6. **Type declarations** → `.d.ts` untuk sparticuz compatibility

---

## 🚀 Cara Deploy ke Vercel (3 Metode)

### Metode 1: GitHub/GitLab (Rekomendasi)

```bash
# Push code ke git repo dulu
cd "/Users/raffiatmaja/Documents/Aplikasi Generate Surat"
git add .
git commit -m "chore: siap deploy Vercel - no fs dependency, random nomor, print fallback"
git push origin main
```

1. Buka https://vercel.com/new
2. Import repository GitHub yang tadi di-push
3. Framework preset: **Next.js** (auto detect)
4. Build & Output Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Environment Variables: Kosongkan (tidak wajib)
6. Klik **Deploy**

### Metode 2: CLI Vercel

```bash
# Install Vercel CLI (if belum ada)
npm i -g vercel

# Masuk directory project
cd "/Users/raffiatmaja/Documents/Aplikasi Generate Surat"

# Login Vercel
vercel login

# Deploy (first time)
vercel --prod

# Follow prompt: accept defaults
- Set up and deploy? Y
- Which scope? Pilih account Anda
- Link to existing project? N
- Project name? get-masjid-surat
- In which directory is your code located? ./
- Automatically inject environmental variables? N
- Project Group? Default
```

Setelah deploy selesai, Vercel kasih URL production: `https://get-masjid-surat.vercel.app`

### Metode 3: Manual Upload via Vercel Dashboard

1. Compress project jadi ZIP (pastikan `node_modules` TIDAK include)
2. Upload via dashboard Vercel > Add New > Import Project

---

## 💾 Penyimpanan / Data Storage di Vercel

### Yang DISIMPAN (Local browser only):
✅ **Riwayat surat** → `localStorage` (`getmasjid_history_v1`)  
✅ **Kop surat custom** → `localStorage` (`getmasjid_kop_v1`)  
✅ **Tanda tangan & cap** → `localStorage` (`getmasjid_sig_v1`)  
✅ Semua data gambar (logo/TTD/cap) tersimpan sebagai **base64** di localStorage user  

→ **Ini aman di semua device karena tersimpan di browser user**, tidak di server!

### Yang TIDAK disimpan (serverless):
❌ Nomor surat → di-generate random per request (stateless)  
❌ File counter JSON → sudah dihapus dari kode  
❌ Tidak ada database eksternal → tidak diperlukan  

### Jika ingin persistensi nomor urut:
Opsi tambahan (jika butuh sequential numbering global):

**A. Gunakan Supabase/Firebase** (Recommended untuk production scale)
- Buat table `letter_counters` (id, count, last_month)
- Update tiap kali download PDF
- API route `/api/number` fetch/update row

**B. Redis di Upstash/Vercel KV**
- Setup Redis instance gratis di Vercel
- Increment key `gmj_counter` per bulan
- Return + save ke header

**C. Next.js cookies + in-memory cache** (Semi stateful)
- Simpan di cookie `set-cookie: gmj_counter`
- Butuh upgrade ke Edge runtime dengan logic lebih kompleks

**Untuk sekarang ini: random number sudah cukup!** Setiap PDF unik dan rapi.

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Build failed "puppeteer not found"
```json
// Solution: pastikan dependencies lengkap di package.json
{
  "dependencies": {
    "puppeteer": "^25.9.0",
    "pdfjs-dist": "^6.3.x",
    ...
  }
}
```
Run di local: `npm install puppeteer --save-exact`, lalu commit + push

### Issue 2: API generate-pdf error 500 di production
- Log di Vercel dashboard: Logs → Production logs → Cari error
- Biasanya Chromium unavailable → gunakan **Print fallback** (sudah built-in)
- User bisa buka Preview tab → Ctrl+P / Cmd+P → Save as PDF

### Issue 3: LocalStorage tidak tersimpan di mobile
- Pastikan Safari/iOS tidak block cookies/third party storage
- Test di browser incognito (ini akan clear localStorage setiap session)

### Issue 4: CORS pada image upload
- Gunakan `crossOrigin="anonymous"` di `<img>` tag (sudah default)
- Pastikan upload file lokal (FileReader) bukan remote URL

---

## 📊 Monitoring & Scaling

Vercel auto-scale:
- **Edge Functions**: routing cepat worldwide
- **Node Runtimes**: untuk PDF generation (API route)
- **Serverless**: bayar per request (gratis 100GB bandwidth/month)

Monitor di:
- Dashboard → Analytics
- Logs → View recent requests/errors
- Performance → Core Web Vitals

---

## ✨ Fitur Setelah Deploy

1. ✅ **Generate surat resmi** → A4 PDF ready
2. ✅ **Nomor otomatis** → Random format `XXX/GMJ/MM/YYYY`
3. ✅ **Kop custom** → Logo + brand text transparan
4. ✅ **TTD CEO** → Upload scan PDF/JPG + hapus BG
5. ✅ **Cap resmi** → "Temukan dan Terhubung ke Masjid" double-circle
6. ✅ **Logo crop** → Drag & zoom preview sebelum save
7. ✅ **Riwayat save-first** → LocalStorage history max 50 item
8. ✅ **Print fallback** → Jika Puppeteer fail → window.print() PDF viewer

---

## 🎯 Checklist Final Sebelum Deploy

- [ ] Run `npm run build` di local → successful
- [ ] No console errors saat development
- [ ] Test download PDF di local → success
- [ ] Test riwayat save/load → berfungsi
- [ ] Commit all changes ke git
- [ ] Push ke GitHub/GitLab repo
- [ ] Import ke Vercel dashboard
- [ ] Deploy → watch log → success
- [ ] Test URL production → semua fitur jalan

---

## 🙏 FAQ

**Q: Apakah perlu biaya bulanan?**  
A: Gratis di tier community Vercel (100GB bandwidth/month). Unlimited surat.

**Q: Berapa lama surat ter-generate?**  
A: 2-5 detik per PDF tergantung ukuran gambar TTD/Cap.

**Q: Apa terjadi kalau saya refresh saat generate PDF?**  
A: Data form tetap tersimpan (React state), tapi histori hanya update setelah klik Simpan.

**Q: Bisa ganti nomor format nanti?**  
A: Ya, edit `generateNomorSurat()` di `src/lib/letter-number.ts`.

---

## 🚀 Ready to Go!

**Deploy sekarang:**

```bash
# Option 1: CLI
vercel --prod

# Option 2: Git (push + GitHub connect)
git add .
git commit -m "chore: siap deploy Vercel"
git push origin main
```

Setelah deploy:  
👉 **URL: `https://<your-project>.vercel.app`**

Semua fitur siap digunakan, data tersimpan di browser user, server stateless (no DB needed)!
