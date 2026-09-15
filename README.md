# Sistem KPI Staff — Proton Indah Sari Otomobil (Jerteh)

Panduan penuh untuk jadikan sistem ni live, guna **Firebase** (simpan data) + **Netlify** (hosting).
Tak perlu install apa-apa di komputer — semua boleh dibuat guna browser sahaja.

---

## BAHAGIAN A — Setup Firebase (tempat simpan data)

1. Pergi ke https://console.firebase.google.com dan log masuk dengan akaun Google.
2. Klik **"Add project"**. Bagi nama, contoh `proton-kpi-jerteh`. Boleh matikan Google Analytics (tidak diperlukan). Klik **Create project**.
3. Dalam halaman utama projek, klik ikon **`</>`** (Web) untuk daftar app web.
   - Bagi nickname, contoh `kpi-web`.
   - **Tidak perlu** tick "Also set up Firebase Hosting" (kita guna Netlify).
   - Klik **Register app**.
4. Firebase akan tunjukkan kod `firebaseConfig` macam ni:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "proton-kpi-jerteh.firebaseapp.com",
     projectId: "proton-kpi-jerteh",
     storageBucket: "proton-kpi-jerteh.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```
   **Salin** kod ni (akan digunakan di Langkah 8).
5. Di menu kiri, klik **Build > Firestore Database > Create database**.
6. Pilih lokasi server — cadangan `asia-southeast1 (Singapore)` sebab paling dekat dengan Malaysia. Klik **Next**.
7. Pilih **"Start in test mode"**, klik **Create**.
8. Selepas database siap, klik tab **Rules** di atas. Padam semua rules sedia ada, dan tampal kandungan fail `firestore.rules` (ada dalam zip yang saya bagi). Klik **Publish**.

Firebase dah siap. Sekarang kita sambungkan ke projek website.

---

## BAHAGIAN B — Masukkan Firebase config ke dalam projek

9. **Download & unzip** fail projek (`proton-kpi-netlify.zip`) yang saya sediakan.
10. Buka fail `src/firebaseConfig.js` guna Notepad (atau apa-apa text editor).
11. **Fail ini sudah pun diisi** dengan config projek `sistem-kpi-syarikat` anda. Tiada apa-apa perlu diubah — terus ke Bahagian C.

---

## BAHAGIAN C — Naikkan projek ke GitHub (percuma, tanpa command line)

12. Pergi ke https://github.com, buat akaun percuma kalau belum ada.
13. Klik **"+ " > "New repository"**. Bagi nama, contoh `proton-kpi-jerteh`. **Jangan** tick "Add a README file". Klik **Create repository**.
14. Di halaman repo kosong tu, klik pautan **"uploading an existing file"**.
15. Buka folder projek yang diunzip tadi di File Explorer / Finder, **select semua fail & folder** (`src`, `index.html`, `package.json`, `vite.config.js`, `netlify.toml`, `.gitignore`, `firestore.rules`, `README.md`), **drag semua** masuk ke halaman GitHub tu.
16. Tunggu upload siap, scroll bawah, klik **"Commit changes"**.

---

## BAHAGIAN D — Deploy ke Netlify

17. Pergi ke https://netlify.com, klik **Sign up**, pilih **"Sign up with GitHub"** (paling senang).
18. Selepas login, klik **"Add new site" > "Import an existing project"**.
19. Pilih **GitHub**, benarkan akses, cari & pilih repo `proton-kpi-jerteh` yang dinaikkan tadi.
20. Netlify akan auto-detect tetapan build (sebab ada fail `netlify.toml`):
    - Build command: `npm run build`
    - Publish directory: `dist`
    Tak perlu ubah apa-apa. Klik **Deploy site**.
21. Tunggu 1–2 minit. Netlify akan bagi satu URL live, contoh `proton-kpi-jerteh.netlify.app`. Klik untuk buka & cuba sistem KPI anda.

---

## BAHAGIAN E — (Pilihan) Domain sendiri yang cantik

22. Dalam Netlify, pergi ke **Site settings > Domain management > Add a domain**.
23. Beli domain (contoh dari Namecheap, GoDaddy, atau Exabytes/Shinjiru untuk domain `.my`) — cadangan nama: `piso-kpi.my`, `jerteh-kpi.com`, `psijerteh.my`.
24. Ikut arahan Netlify untuk tukar DNS domain tu supaya menuju ke Netlify (biasanya cuma tambah 1–2 rekod DNS). Netlify akan bagi HTTPS (SSL) automatik, percuma.

---

## Nota Penting

- **Setiap kali** Claude buat perubahan pada sistem ni lepas ni, anda perlu ganti fail `src/App.jsx` dengan versi terbaru, upload semula ke GitHub (drag & drop fail baru, commit) — Netlify akan auto-deploy semula secara automatik.
- Data (KPI, staff, target dll) disimpan dalam Firebase — **berasingan** daripada data yang ada dalam versi Claude artifact asal. Ia akan mula kosong bila pertama kali live, staff perlu mula key-in dari awal.
- Firestore rules yang disediakan membenarkan sesiapa yang tahu URL laman ini baca/tulis data tanpa login — sesuai untuk alat dalaman kedai. Kalau nak lebih selamat (contoh perlukan staff login), boleh minta Claude bantu tambah kemudian.
- Firebase & Netlify kedua-duanya ada **pelan percuma (free tier)** yang cukup untuk penggunaan satu outlet kedai — tiada kos bulanan buat masa ini.
