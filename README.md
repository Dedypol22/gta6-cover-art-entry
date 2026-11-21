# Leonida Cover Studio — Pembuat Cover Art ala GTA 6

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Dedypol22/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Dedypol22/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Leonida Cover Studio** mengubah fotomu menjadi cover art multi-panel gaya
poster GTA 6 — hero close-up berbingkai, caption besar ala sampul game, dan
grade warna Sunset / Neon / Malam Leonida — lalu mengekspornya sebagai PNG
siap posting. Dibuat untuk kompetisi
[Make GTA 6 Cover Art (gta6-cover-art-01)](https://make.fun/bounty/gta6-cover-art-01)
di make.fun.

## Fitur

- **Cover multi-panel ala poster GTA 6** — 3 layout: Trio (1 hero besar di
  atas + 2 panel bawah), Duo (2 panel berdampingan), Solo (1 panel
  full-bleed). Bingkai luar putih tebal + garis antar panel, panel hero
  di-crop close-up seperti key art crime-epic.
- **Foto apa pun** — unggah banyak foto dari perangkatmu (dibaca lokal via
  FileReader, tidak pernah diunggah) atau pakai 2 foto contoh bawaan (Pier
  dan Boulevard). Klik panel untuk memilihnya, lalu tetapkan foto ke panel
  itu; satu foto bisa mengisi semua panel atau tiap panel foto berbeda.
- **Crop & posisi per panel** — seret foto langsung di pratinjau, atau pakai
  slider zoom dan posisi X/Y.
- **Caption poster** — judul besar (default `BOULEVARD QUEEN`) + subjudul
  (`VICE CITY • LEONIDA`), bisa diedit; atur ukuran, posisi atas/bawah, dan
  warna teks (Putih, Kuning Sunset, Cyan Neon, Pink). Outline hitam tebal +
  drop shadow, font condensed tebal.
- **Grade warna** — Sunset (hangat oranye–pink), Neon (cyan–magenta +
  vignette), Malam Leonida (biru–ungu gelap + glow neon). Toggle
  "Bandingkan sebelum/sesudah grade" untuk melihat perbedaannya.
- **Export PNG** — 1080×1080, 1080×1350, atau 1920×1080. Pratinjau live
  selalu menampilkan hasil akhir apa adanya.

## Cara menjalankan

```sh
node serve.ts
```

Lalu buka <http://localhost:8080> di browser. Aplikasi ini sepenuhnya
statis dan offline — tanpa request jaringan, tanpa logo Rockstar, tanpa
artwork resmi, tanpa font resmi (semua font dari system stack).

## Mode screenshot

Untuk pemotretan headless, aplikasi membaca parameter URL:

- `?shot=cover&photo=pier&caption=SUNSET%20HEIST&layout=trio&size=1920x1080&grade=sunset`
  — tampilkan cover saja memenuhi viewport.
- `?shot=editor&photo=boulevard&caption=BOULEVARD%20QUEEN&layout=trio&grade=neon`
  — tampilkan editor lengkap dengan foto sudah dimuat.

Parameter yang tidak dikenal diabaikan dengan aman.

## Struktur

- `app/index.html` — halaman utama (header, pratinjau, kontrol editor)
- `app/style.css` — gaya studio gelap bernuansa sunset/neon Leonida
- `app/src/editor.js` — state, interaksi editor, mode screenshot
- `app/src/renderer.js` — menggambar cover multi-panel ke canvas
- `app/samples/` — foto contoh bawaan (Pier, Boulevard)
- `main.ts` — entrypoint packaging: menyalin `app/` + `screenshots/` ke
  direktori output dan menulis `dossier.json`
- `screenshots/` — 4 screenshot JPEG hasil nyata dari aplikasi ini
