# Stock Biskut ORINICE

Aplikasi React + Vite untuk merekod stok masuk/keluar bagi 30 produk dan dua jenis ready stock: `BALANG 7000` dan `BALANG 9503`.

## Ciri-ciri
- Senarai 30 produk dan baki stok mengikut jenis balang
- Rekod stok masuk dan keluar
- Semakan supaya stok tidak boleh menjadi negatif
- Sejarah transaksi dengan nama staff, masa dan tujuan
- Eksport baki stok ke CSV
- Mod demo jika Supabase belum disambungkan

## Jalankan di komputer
1. Pasang Node.js versi LTS.
2. Ekstrak ZIP dan buka folder ini di terminal.
3. Jalankan `npm install`.
4. Salin `.env.example` kepada `.env` dan masukkan URL serta publishable/anon key projek Supabase.
5. Jalankan SQL dalam `supabase.sql` di Supabase SQL Editor.
6. Jalankan `npm run dev` dan buka URL yang dipaparkan.

## Deploy ke Vercel
1. Muat naik folder projek ke GitHub.
2. Import repository tersebut di Vercel.
3. Di Vercel > Settings > Environment Variables, tambah:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy semula selepas memasukkan environment variables.

## Penting: keselamatan dan perkongsian staff
- Mod demo menyimpan data hanya dalam browser/peranti semasa dan bukan dikongsi.
- Untuk data sebenar, sambungkan Supabase.
- SQL ini menyediakan polisi bacaan demo. Sebelum digunakan secara operasi oleh ramai staff, aktifkan Supabase Auth dan hadkan akses mengikut peranan HQ/staff. Jangan masukkan `service_role` key dalam aplikasi web.
- Nama staff dalam borang ialah catatan transaksi, bukan pengesahan identiti. Untuk audit sebenar, wajibkan login individu.
- Semua baki permulaan bermula 0. Masukkan stok sebenar melalui transaksi stok masuk.
- Senarai yang diterima dalam mesej mengandungi 29 nama. SQL ini memasukkan 29 nama yang diberi (58 rekod stok bagi 2 kategori); produk ke-30 perlu ditambah selepas namanya disahkan.
