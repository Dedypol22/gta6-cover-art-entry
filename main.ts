import { writeFileSync, mkdirSync, cpSync, readdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

/**
 * Vice Cover Studio entry plumbing.
 * Copies app/ and screenshots/ to the output directory and writes dossier.json.
 */

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const repoDir = process.cwd();

// Ensure output directory exists
try {
    mkdirSync(outputDir, { recursive: true });
} catch (err) {
    // Ignore if exists
}

// Copy app/ and screenshots/
const dirsToCopy = ['app', 'screenshots'];
for (const dir of dirsToCopy) {
    const src = join(repoDir, dir);
    const dest = join(outputDir, dir);
    try {
        if (lstatSync(src).isDirectory()) {
            cpSync(src, dest, { recursive: true });
        }
    } catch (err) {
        console.error(`Gagal menyalin ${dir}: ${(err as Error).message}`);
    }
}

// Build and write dossier.json
// Caps from starter/main.ts and RULES.txt
const caps = {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
};

try {
    const dossierBytes = buildDossier(outputDir, caps);
    writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
    console.log(`Dossier berhasil ditulis ke ${join(outputDir, 'dossier.json')}`);
} catch (err) {
    console.error(`Gagal membangun dossier: ${(err as Error).message}`);
    process.exit(1);
}
