// Zkopíruje self-hosted fonty (woff2) z node_modules do assets/fonts a vygeneruje fonts.css.
// Důvod: GDPR (žádné volání Google Fonts s IP návštěvníka) + rychlost (stejný origin, preload).
// Spuštění: npm run fonts   (výstup se commituje, web pak nepotřebuje node_modules)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUBSETS = ['latin', 'latin-ext', 'vietnamese'];

// [balíček, css soubor, nová font-family]
const SITES = {
  'assets': [
    ['@fontsource-variable/lora', 'wght.css', 'Lora'],
    ['@fontsource-variable/lora', 'wght-italic.css', 'Lora'],
    ['@fontsource-variable/eb-garamond', 'wght.css', 'EB Garamond'],
    ['@fontsource-variable/eb-garamond', 'wght-italic.css', 'EB Garamond'],
    ['@fontsource-variable/inter', 'wght.css', 'Inter'],
    ['@fontsource-variable/jetbrains-mono', 'wght.css', 'JetBrains Mono'],
  ],
  'legent/assets': [
    ['@fontsource-variable/geist', 'wght.css', 'Geist'],
    ['@fontsource/instrument-serif', '400.css', 'Instrument Serif'],
    ['@fontsource/instrument-serif', '400-italic.css', 'Instrument Serif'],
    ['@fontsource-variable/jetbrains-mono', 'wght.css', 'JetBrains Mono'],
  ],
};

for (const [dest, list] of Object.entries(SITES)) {
  const outDir = join(ROOT, dest, 'fonts');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  let css = '/* Vygenerováno: tools/fonts.mjs — needitovat ručně. Licence fontů: SIL OFL 1.1 */\n';
  for (const [pkg, file, family] of list) {
    const pkgDir = join(ROOT, 'node_modules', pkg);
    const src = readFileSync(join(pkgDir, file), 'utf8');
    const blocks = src.split('@font-face').slice(1);
    for (const block of blocks) {
      const url = block.match(/url\(\.\/files\/([^)]+)\)/)?.[1];
      if (!url) continue;
      const subset = SUBSETS.find((s) => url.includes(`-${s}-`));
      if (!subset) continue;
      // latin vs latin-ext rozlišení: "-latin-ext-" obsahuje i "-latin-"
      if (subset === 'latin' && url.includes('-latin-ext-')) {
        // zpracuje se jako latin-ext
      }
      copyFileSync(join(pkgDir, 'files', url), join(outDir, url));
      const body = block
        .replace(/font-family:[^;]+;/, `font-family: '${family}';`)
        .replace(/url\(\.\/files\//, 'url(./')
        .replace(/format\('woff2-variations'\)/, "format('woff2')");
      css += '@font-face' + body.replace(/\n\n?$/, '\n');
    }
  }
  writeFileSync(join(outDir, 'fonts.css'), css);
  console.log(`fonts → ${dest}/fonts`);
}
