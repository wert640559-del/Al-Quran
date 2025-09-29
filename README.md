# Al-Qur'an Interaktif

**Al-Qur'an Interaktif** adalah aplikasi web yang memungkinkan pengguna membaca, memahami, dan mendengarkan Al-Qur'an di mana saja melalui handphone atau komputer, tanpa perlu membawa mushaf fisik. Aplikasi ini dilengkapi fitur audio per ayat, tafsir per ayat, pencarian surah dan ayat, serta bookmark untuk memudahkan pengalaman belajar Al-Qur’an.

## Live Demo
[https://al-quran-orpin.vercel.app/](https://al-quran-orpin.vercel.app/)

## YouTube Demo
[Link YouTube](https://youtu.be/5frU9l9CRk8)

## Canva Slide Presentasi
[Link Canva](https://www.canva.com/design/DAG0WqyWMoY/aNUtOO6v5fcDNRD01G92IQ/edit?utm_content=DAG0WqyWMoY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## Fitur Utama
- Melihat daftar surat Al-Qur’an
- Membaca per ayat
- Tafsir per ayat
- Mendengarkan audio tilawah per ayat
- Pencarian surat dan ayat berdasarkan nomor atau arti
- Bookmark ayat favorit
- Pilihan qari untuk audio

## Teknologi
- HTML, CSS, JavaScript
- Storage menggunakan LocalStorage
- Menggunakan API dari [EQuran.id](https://equran.id/api/)

## Cara Menjalankan Lokal
1. Clone repository ini:
```bash
git clone https://github.com/wert640559-del/Al-Quran.git
Masuk ke folder project:

bash
Copy code
cd Al-Quran
Buka file index.html di browser.

Cara Deploy
Pastikan sudah memiliki akun Vercel.

Jalankan perintah deploy:

bash
Copy code
vercel
Ikuti instruksi Vercel untuk memilih project dan domain.

Setelah selesai, aplikasi akan tersedia di URL Vercel.

Struktur Folder
bash
Copy code
/assets
  /css
/src
  /modules
    api.js
    ui.js
    storage.js
    auth.js
index.html
surat.html
Tantangan
API kadang sulit diambil

Masalah deploy di Vercel

Audio dari API tidak selalu muncul

Bug pada navigasi dan tafsir per ayat

Rencana Pengembangan
Memperbaiki bug audio dan tafsir

Menambahkan fitur tema gelap/terang

Optimalisasi performa aplikasi

Lisensi
MIT License
