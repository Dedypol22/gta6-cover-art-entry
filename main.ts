import { cpSync, mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function main() {
    console.log(`Packaging Leonida Cover Studio to ${outputDir}...`);

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    // Validate screenshots before packaging: every file must be a real JPEG
    // (magic bytes FF D8) and within the 256 KiB dossier limit.
    const shotsSrc = join(__dirname, 'screenshots');
    if (existsSync(shotsSrc)) {
        for (const name of readdirSync(shotsSrc).sort()) {
            const shotPath = join(shotsSrc, name);
            if (!statSync(shotPath).isFile()) continue;
            const bytes = readFileSync(shotPath);
            if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
                throw new Error(`Screenshot ${name} is not a valid JPEG (missing FF D8 magic bytes).`);
            }
            if (bytes.length > 262144) {
                throw new Error(`Screenshot ${name} is ${bytes.length} bytes, over the 256 KiB limit.`);
            }
        }
    }

    // Copy app directory
    const appSrc = join(__dirname, 'app');
    const appDest = join(outputDir, 'app');
    cpSync(appSrc, appDest, { recursive: true });

    // Copy screenshots directory
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
    if (Buffer.byteLength(dossier, 'utf8') > 1572864) {
        throw new Error(`dossier.json is ${Buffer.byteLength(dossier, 'utf8')} bytes, over the 1.5 MiB limit.`);
    }
    writeFileSync(dossierPath, dossier);

    // Packaging summary: app file count, screenshot count + sizes, dossier size.
    const countFiles = (dir: string): number =>
        readdirSync(dir, { withFileTypes: true }).reduce(
            (n, e) => n + (e.isDirectory() ? countFiles(join(dir, e.name)) : 1), 0);
    const shotSummary = existsSync(shotsDest)
        ? readdirSync(shotsDest).filter((n) => statSync(join(shotsDest, n)).isFile())
            .map((n) => `${n} (${statSync(join(shotsDest, n)).size} bytes)`).join(', ')
        : 'none';
    console.log(`Packaged ${countFiles(appDest)} app files; screenshots: ${shotSummary}; dossier.json ${Buffer.byteLength(dossier, 'utf8')} bytes.`);

    console.log('Packaging complete.');
}

main();
