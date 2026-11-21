// main.ts — entrypoint packaging Leonida Cover Studio (gta6-cover-art-01).
// Menyalin app/ + screenshots/ dari samping file ini ke $MAKEFUN_OUTPUT_DIR
// (atau /output di dalam grader), memvalidasi setiap screenshot, lalu
// menulis dossier.json lewat buildDossier dari vendor/makefun-app.ts.
// Jalankan di luar grader dengan: mkdir -p out && MAKEFUN_OUTPUT_DIR=out bun main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const MAX_SCREENSHOT_BYTES = 262144; // 256 KiB, batas kit untuk tiap screenshot.
const JPEG_MAGIC = Buffer.from([0xff, 0xd8]);

function fail(message: string): never {
  throw new Error(`main.ts: ${message}`);
}

// Setiap screenshot harus JPEG asli (magic bytes FF D8) dan <= 256 KiB.
// File non-JPEG (mis. PNG yang diganti nama) atau file terlalu besar
// ditolak di sini, sebelum dossier ditulis.
function validateScreenshots(dir: string): void {
  if (!existsSync(dir)) fail('screenshots/: direktori tidak ditemukan');
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (names.length === 0) fail('screenshots/: tidak ada screenshot');
  if (names.length > 4) fail(`screenshots/: ${names.length} file, melebihi batas 4`);
  for (const name of names) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (!stat.isFile()) fail(`screenshots/${name}: bukan file`);
    if (stat.size > MAX_SCREENSHOT_BYTES) {
      fail(`screenshots/${name}: ${stat.size} byte, melebihi batas 256 KiB (${MAX_SCREENSHOT_BYTES})`);
    }
    const head = readFileSync(path).subarray(0, 2);
    if (!head.equals(JPEG_MAGIC)) {
      fail(`screenshots/${name}: bukan JPEG (magic bytes bukan FF D8)`);
    }
  }
}

validateScreenshots(join(here, 'screenshots'));

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Dossier harus tetap <= 1.5 MiB agar lolos batas pengiriman entry.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
if (dossierBytes > 1572864) {
  fail(`dossier.json: ${dossierBytes} byte, melebihi batas 1.5 MiB (1572864)`);
}

// Ringkasan packaging: jumlah file app, tiap screenshot + ukurannya,
// dan ukuran dossier — agar hasil packaging terlihat tanpa membuka output.
function countFiles(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
}
console.log('Leonida Cover Studio — packaging selesai');
console.log(`  app/: ${countFiles(join(out, 'app'))} file`);
for (const name of readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.')).sort()) {
  console.log(`  screenshots/${name}: ${statSync(join(out, 'screenshots', name)).size} byte`);
}
console.log(`  dossier.json: ${dossierBytes} byte`);
console.log(`  output: ${out}`);
