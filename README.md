# Chaesa Live

## Validasi lokal dan CI

Gunakan Node.js 22 atau lebih baru dan pasang dependensi dengan `npm ci`
(termasuk devDependencies, karena TypeScript diperlukan saat build).

```sh
npm run typecheck
npm test
npm run build
```

- `npm run typecheck` menjalankan `tsc --noEmit` menggunakan `tsconfig.json`
  tanpa menghasilkan JavaScript. Perintah ini bisa dijalankan sendiri di lokal
  atau sebagai langkah CI, dan keluar dengan kode bukan nol jika ada kesalahan tipe.
- `npm run build` otomatis menjalankan audit keamanan yang sudah ada, lalu
  pemeriksaan tipe melalui `prebuild`, sebelum `next build`. Next.js juga tetap
  memvalidasi tipe saat build; kesalahan tipe menghentikan build produksi.
- `npm test` tetap menjalankan pengujian unit secara terpisah.

### Bukti praktik: izin database dan signed URL Storage

```sh
npm run test:integration:evidence
npm run test:integration:evidence:storage
```

- Perintah pertama memerlukan binary PostgreSQL (`initdb`, `pg_ctl`, `psql`)
  dan menjalankan pemeriksaan RLS/RPC dalam cluster sementara.
- Perintah kedua memerlukan Docker yang berjalan dan dependensi proyek
  (Supabase CLI sudah disertakan). Pengujian menyalakan Supabase lokal dengan
  project ID acak dan port tersendiri, membuat fixture tabel aplikasi minimal
  dan menerapkan migrasi bukti/review yang sebenarnya, lalu memakai akun
  peserta serta dua pemilik course yang berbeda melalui HTTP Storage API asli.
  Pemilik course yang cocok harus dapat membuat signed URL dan mengunduh
  byte bukti yang tertaut pada progress. Pemilik course lain dan permintaan
  untuk file yang ada tetapi tidak tertaut harus mendapat penolakan Storage
  `Object not found`, tanpa signed URL.
- Tidak ada URL atau credential project Supabase bersama yang digunakan.
  Akun, file, container, volume, dan folder sementara dibersihkan setelah tes,
  termasuk ketika pemeriksaan gagal. Kegagalan Docker/layanan lokal menghasilkan
  exit bukan nol, bukan hasil tes yang dianggap lulus.

Pemeriksaan tipe mencakup sumber aplikasi, server, dan pengujian TypeScript
sesuai `tsconfig.json`. Fungsi Supabase Edge di `supabase/functions` tetap
dikecualikan karena memakai runtime Deno; konfigurasi pemeriksaan yang sudah
ada tidak dilonggarkan.