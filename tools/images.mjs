// Vygeneruje rastrové obrázky (ikony, OG náhledy pro sociální sítě) z HTML šablon přes Playwright.
// Spuštění: node tools/images.mjs   (výstup se commituje)
import { chromium } from './pw.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsLegacy = pathToFileURL(join(ROOT, 'assets/fonts/fonts.css')).href;
const fontsLegent = pathToFileURL(join(ROOT, 'legent/assets/fonts/fonts.css')).href;
const svg = (p) => readFileSync(join(ROOT, p), 'utf8');

const legacyOg = (title, kicker) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fontsLegacy}">
<style>
  body{margin:0;width:1200px;height:630px;background:#F8F6F1;font-family:Inter;color:#1A1A2E;position:relative;overflow:hidden}
  .g{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 92% 10%,#E8F0FB,transparent 70%),radial-gradient(ellipse 40% 50% at 0% 100%,rgba(201,149,60,.14),transparent 70%)}
  .in{position:absolute;inset:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
  .logo{font-family:Lora;font-size:34px;font-weight:600}.logo i{color:#C9953C;font-weight:400}.logo em{font-weight:400}
  .k{font-family:'JetBrains Mono';font-size:18px;letter-spacing:.24em;text-transform:uppercase;color:#8A6420;display:flex;align-items:center;gap:16px}
  .k:before{content:"";width:40px;height:2px;background:#C9953C}
  h1{font-family:Lora;font-weight:500;font-size:76px;line-height:1.04;letter-spacing:-.02em;margin:22px 0 0;max-width:15ch}
  h1 span{font-style:italic;color:#1B3A6B}
  .f{display:flex;justify-content:space-between;font-family:'JetBrains Mono';font-size:18px;color:rgba(26,26,46,.65);letter-spacing:.06em;border-top:1px solid rgba(26,26,46,.15);padding-top:22px}
</style></head><body><div class="g"></div><div class="in">
<div class="logo">Legacy <i>·</i> <em>Enterprises</em></div>
<div><div class="k">${kicker}</div><h1>${title}</h1></div>
<div class="f"><span>legacyenterprises.cz</span><span>Praha · ČR · EU</span></div></div></body></html>`;

const legentOg = (title, kicker) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fontsLegent}">
<style>
  body{margin:0;width:1200px;height:630px;background:#07080F;font-family:Geist;color:#ECEBF2;position:relative;overflow:hidden}
  .g{position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 85% 20%,rgba(124,77,255,.35),transparent 70%),radial-gradient(ellipse 50% 60% at 10% 90%,rgba(59,130,246,.25),transparent 70%)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,#000,transparent)}
  .in{position:absolute;inset:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
  .logo{font-size:34px;font-weight:600;letter-spacing:-.02em;display:flex;align-items:center;gap:14px}
  .logo b{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#7C4DFF,#3B82F6);display:inline-block}
  .k{font-family:'JetBrains Mono';font-size:18px;letter-spacing:.2em;text-transform:uppercase;color:#9DB8FF}
  h1{font-family:'Instrument Serif';font-weight:400;font-size:84px;line-height:1.02;letter-spacing:-.01em;margin:20px 0 0;max-width:16ch}
  h1 span{font-style:italic;background:linear-gradient(90deg,#B69CFF,#7FB2FF);-webkit-background-clip:text;color:transparent}
  .f{display:flex;justify-content:space-between;font-family:'JetBrains Mono';font-size:18px;color:rgba(236,235,242,.6);border-top:1px solid rgba(255,255,255,.12);padding-top:22px}
</style></head><body><div class="g"></div><div class="grid"></div><div class="in">
<div class="logo"><b></b>Legent AI</div>
<div><div class="k">${kicker}</div><h1>${title}</h1></div>
<div class="f"><span>legent.ai</span><span>AI agenti pro české MSP</span></div></div></body></html>`;

const icon = (file, size) => `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px">
${svg(file).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`;

const JOBS = [
  { out: 'assets/img/apple-touch-icon.png', w: 180, h: 180, html: icon('assets/img/favicon.svg', 180) },
  { out: 'assets/img/icon-512.png', w: 512, h: 512, html: icon('assets/img/favicon.svg', 512) },
  { out: 'assets/img/og-default.png', w: 1200, h: 630, html: legacyOg('Vaše firma stojí víc, <span>než si myslíte.</span>', 'Pre-exit příprava MSP') },
  { out: 'assets/img/og-exit-test.png', w: 1200, h: 630, html: legacyOg('Je vaše firma <span>připravená na prodej?</span>', 'Exit Readiness test · 5 min') },
  { out: 'assets/img/og-kalkulacka.png', w: 1200, h: 630, html: legacyOg('Kolik je vaše firma <span>skutečně</span> hodna?', 'Kalkulačka hodnoty firmy') },
  { out: 'assets/img/og-insights.png', w: 1200, h: 630, html: legacyOg('Insights z&nbsp;českého <span>M&amp;A trhu</span>', 'Insights · Legacy Enterprises') },
];

const LEGENT_JOBS = [
  { out: 'legent/assets/img/apple-touch-icon.png', w: 180, h: 180, file: 'legent/assets/img/favicon.svg' },
  { out: 'legent/assets/img/icon-512.png', w: 512, h: 512, file: 'legent/assets/img/favicon.svg' },
  { out: 'legent/assets/img/og-default.png', w: 1200, h: 630, html: legentOg('AI agenti, kteří <span>čtou vaši firmu.</span>', 'Legent AI · implementace AI pro MSP') },
  { out: 'legent/assets/img/og-ai-audit.png', w: 1200, h: 630, html: legentOg('Jak je vaše firma <span>připravená na AI?</span>', 'AI Readiness test · 4 min') },
  { out: 'legent/assets/img/og-roi.png', w: 1200, h: 630, html: legentOg('Kolik hodin vám <span>AI agenti vrátí?</span>', 'ROI kalkulačka') },
];

const legacyLogo = (color, dot) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fontsLegacy}">
<style>html,body{margin:0;background:transparent}div{font-family:Lora;font-size:120px;font-weight:600;color:${color};padding:30px 50px;display:inline-block;letter-spacing:-1px}i{color:${dot};font-weight:400}em{font-weight:400}</style></head>
<body><div>Legacy <i>·</i> <em>Enterprises</em></div></body></html>`;
const legentLogo = (color) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fontsLegent}">
<style>html,body{margin:0;background:transparent}div{font-family:Geist;font-size:120px;font-weight:600;color:${color};padding:30px 50px;display:inline-flex;align-items:center;gap:36px;letter-spacing:-4px}svg{width:150px;height:150px}</style></head>
<body><div>${svg('legent/assets/img/favicon.svg').replace('<svg ', '<svg width="150" height="150" ')}Legent AI</div></body></html>`;
JOBS.push(
  { out: 'assets/brand/legacy-logo-na-svetle.png', w: 1500, h: 220, html: legacyLogo('#1A1A2E', '#C9953C'), transparent: true },
  { out: 'assets/brand/legacy-logo-na-tmave.png', w: 1500, h: 220, html: legacyLogo('#F4F1EA', '#C8A86B'), transparent: true },
);
LEGENT_JOBS.push(
  { out: 'legent/assets/brand/legent-logo-na-svetle.png', w: 1000, h: 220, html: legentLogo('#07080F'), transparent: true },
  { out: 'legent/assets/brand/legent-logo-na-tmave.png', w: 1000, h: 220, html: legentLogo('#ECEBF2'), transparent: true },
);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
let all = [...JOBS];
for (const j of LEGENT_JOBS) {
  all.push({ ...j, html: j.html || icon(j.file, j.w) });
}
for (const j of all) {
  await page.setViewportSize({ width: j.w, height: j.h });
  const tmp = join(ROOT, 'test-results', 'img-tmp.html');
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, j.html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(join(ROOT, j.out)), { recursive: true });
  await page.screenshot({ path: join(ROOT, j.out), type: 'png', omitBackground: !!j.transparent });
  console.log('✓', j.out);
}
await browser.close();
