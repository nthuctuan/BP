// Vygeneruje PDF přílohy (A4) z HTML šablon v tools/pdf/*.html přes Playwright.
// Spuštění: node tools/pdf.mjs   (výstup se commituje do assets/downloads a legent/assets/downloads)
import { chromium } from './pw.mjs';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const JOBS = [
  { tpl: 'checklist.html', out: 'assets/downloads/checklist-priprava-firmy-na-prodej.pdf', title: 'Checklist: příprava firmy na prodej' },
  { tpl: 'legacy-onepager.html', out: 'assets/downloads/legacy-enterprises-one-pager.pdf', title: 'Legacy Enterprises – one-pager' },
  { tpl: 'legent-onepager.html', out: 'legent/assets/downloads/legent-ai-prehled-sluzeb.pdf', title: 'Legent AI – přehled služeb' },
];

const vars = {
  fontsLegacy: pathToFileURL(join(ROOT, 'assets/fonts/fonts.css')).href,
  fontsLegent: pathToFileURL(join(ROOT, 'legent/assets/fonts/fonts.css')).href,
  email: cfg.legacy.email, legacyUrl: cfg.legacy.url.replace(/^https?:\/\//, ''), legentUrl: cfg.legent.url.replace(/^https?:\/\//, ''),
  company: cfg.common.company, ico: cfg.common.ico, city: cfg.common.city, year: String(cfg.common.year),
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const j of JOBS) {
  const html = readFileSync(join(ROOT, 'tools/pdf', j.tpl), 'utf8').replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m);
  const tmp = join(ROOT, 'test-results', 'pdf-' + j.tpl);
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, html);
  copyFileSync(join(ROOT, 'tools/pdf/_legacy-base.css'), join(dirname(tmp), '_legacy-base.css'));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(join(ROOT, j.out)), { recursive: true });
  await page.pdf({ path: join(ROOT, j.out), format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  console.log('✓', j.out);
}
await browser.close();
