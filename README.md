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

Pemeriksaan tipe mencakup sumber aplikasi, server, dan pengujian TypeScript
sesuai `tsconfig.json`. Fungsi Supabase Edge di `supabase/functions` tetap
dikecualikan karena memakai runtime Deno; konfigurasi pemeriksaan yang sudah
ada tidak dilonggarkan.