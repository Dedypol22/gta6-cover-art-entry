# Vice Cover Studio 🌴

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Dedypol22/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Dedypol22/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover Studio adalah aplikasi web statis untuk membuat sampul (cover art) bergaya poster GTA 6 dari foto pengguna. Didesain untuk kontes [make.fun gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

## Fitur Utama
- **Multi-panel Layout**: Pilih antara layout Trio (3 panel), Duo (2 panel), atau Solo (1 panel).
- **Edit Foto**: Geser dan zoom foto di setiap panel secara independen.
- **GTA-Style Lettering**: Judul dan subjudul tebal dengan outline dan drop shadow.
- **Color Grading**: Filter Sunset, Neon, dan Malam Leonida untuk nuansa Vice City yang autentik.
- **Export PNG**: Mendukung ukuran standar 1080x1080 (kotak), 1080x1350 (portrait), dan 1920x1080 (landscape).
- **Offline & Aman**: Foto diproses sepenuhnya di browser Anda, tidak ada yang diunggah ke server.

## Cara Menjalankan
Aplikasi ini hanya terdiri dari file statis dan tidak memerlukan instalasi.

1.  Pastikan Anda memiliki Node.js terpasang.
2.  Jalankan server statis menggunakan file `serve.ts` yang tersedia:
    ```bash
    node serve.ts
    ```
3.  Buka browser Anda dan akses `http://localhost:8080`.

## Pengembangan
Untuk membangun dossier penyerahan kontes:
```bash
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Lisensi
Proyek ini dilisensikan di bawah lisensi MIT.
