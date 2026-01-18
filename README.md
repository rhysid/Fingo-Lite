# Fingo-Lite

FINGO-LITE adalah bot Telegram untuk mencatat keuangan pribadi.  
Bot ini membantu pengguna mencatat pemasukan dan pengeluaran, memantau saldo, serta melihat riwayat dan rekap keuangan dengan cara yang sederhana dan efisien.

Project ini dibuat menggunakan Node.js dan Telegraf, dengan sistem penyimpanan berbasis file untuk penggunaan yang ringan.

## Fitur

- Mencatat pemasukan  
- Mencatat pengeluaran  
- Melihat saldo  
- Melihat riwayat transaksi  
- Rekap keuangan bulanan  
- Menghapus transaksi terakhir  
- Reset data pengguna  

## Perintah

### Mencatat Pemasukan
/masuk <nominal> <keterangan>  
Contoh:  
/masuk 50000 gajian  

### Mencatat Pengeluaran
/keluar <nominal> <keterangan>  
Contoh:  
/keluar 10000 ngopi  

### Melihat Saldo
/saldo  

### Melihat Riwayat Transaksi
/riwayat [jumlah]  
Contoh:  
/riwayat 15  

### Rekap Bulanan
/rekap [YYYY-MM]  
Contoh:  
/rekap 2026-01  

### Menghapus Transaksi Terakhir
/hapus_terakhir  

### Reset Data
/reset  

## Instalasi

1. Clone repository  
git clone https://github.com/yourusername/fingo-lite.git  
cd fingo-lite  

2. Install dependency  
npm install  

3. Buat file environment  
Buat file .env berdasarkan .env.example  

TOKEN_BOT=TOKEN_BOT_TELEGRAM_KAMU  

4. Jalankan bot  
npm start  

## Variabel Environment

TOKEN_BOT = Token API bot Telegram  

## Catatan Keamanan

Jangan upload file .env ke GitHub  
Simpan token bot dengan aman  
Tambahkan .env dan db.json ke dalam .gitignore  

Contoh isi .gitignore:  
node_modules  
.env  
db.json  

## Struktur Project

fingo-lite/  
├─ index.js  
├─ db.json  
├─ .env.example  
├─ package.json  
├─ .gitignore  
└─ README.md  

## Lisensi

MIT License  

## Author

Rhys  

## Disclaimer

Project ini dibuat untuk keperluan pribadi dan edukasi.  
Tidak diperuntukkan sebagai sistem akuntansi atau keuangan bisnis.
