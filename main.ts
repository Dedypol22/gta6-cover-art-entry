import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function main() {
    console.log(`Packaging Leonida Cover Studio to ${outputDir}...`);

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    // Copy app directory
    const appSrc = join(__dirname, 'app');
    const appDest = join(outputDir, 'app');
    cpSync(appSrc, appDest, { recursive: true });

    // Copy screenshots directory
    const shotsSrc = join(__dirname, 'screenshots');
    const shotsDest = join(outputDir, 'screenshots');
    if (existsSync(shotsSrc)) {
        mkdirSync(shotsDest, { recursive: true });
        cpSync(shotsSrc, shotsDest, { recursive: true });
    } else {
        console.warn('Warning: screenshots/ directory not found.');
    }

    // Write dossier.json
    const dossierPath = join(outputDir, 'dossier.json');
    const dossier = buildDossier(outputDir, {
        text_max_bytes: 163840,
        screenshots: { max: 4, max_bytes: 262144 },
        app_max_files: 993,
        app_max_bytes: 50331648,
        app_path_max_bytes: 1000,
    });
    writeFileSync(dossierPath, dossier);

    console.log('Packaging complete.');
}

main();
