// Automatické ověření obou webů (Playwright, bez dalších závislostí).
//   node tests/run.mjs              → všechny kontroly
//   node tests/run.mjs --shots DIR  → navíc uloží screenshoty (desktop/mobil, light/dark)
// Kontroly: HTTP 200, chyby JS v konzoli, rozbité interní odkazy a kotvy, chybějící zdroje,
// vodorovné přetečení na mobilu, povinné meta tagy, jediný <h1>, alt u obrázků,
// přístupnost (axe-core: kritické a vážné nálezy), funkční testy interaktivních prvků.
import { readdirSync, statSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../tools/pw.mjs';
import { startServer } from '../tools/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const AXE = readFileSync(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');

const IGNORE = new Set(['node_modules', '.git', 'tools', 'tests', 'docs', 'test-results']);
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out.sort();
}

const pages = walk(ROOT).filter((p) => !only || p.includes(only));
const failures = [];
const warnings = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const linkTargets = new Map(); // url -> set of hrefs to check later

for (const path of pages) {
  const is404 = path.endsWith('404.html');
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    const missing = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith(path)) missing.push(`${r.status()} ${r.url().replace(base, '/')}`); });
    page.on('requestfailed', (r) => { if (!r.url().startsWith('mailto:')) missing.push(`FAILED ${r.url()}`); });
    const res = await page.goto(base + path, { waitUntil: 'load' });
    if (!res || res.status() !== 200) fail(path, `HTTP ${res && res.status()}`);
    await page.waitForTimeout(150);

    // Externí požadavky (kromě odkazů) by neměly existovat – GDPR, výkon
    const external = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((u) => !u.startsWith(location.origin) && !u.startsWith('data:')));
    if (external.length) fail(path, `externí požadavky: ${external.join(', ')}`);
    errors.filter((e) => !/Failed to load resource/.test(e)).forEach((e) => fail(path, `[${vp.name}] JS chyba: ${e}`));
    missing.forEach((m) => fail(path, `[${vp.name}] chybějící zdroj: ${m}`));

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) {
      const culprits = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')));
      fail(path, `[${vp.name}] vodorovné přetečení ${overflow}px (${culprits.join(', ')})`);
    }

    if (vp.name === 'desktop') {
      const meta = await page.evaluate(() => ({
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content || '',
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        h1: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
        robots: document.querySelector('meta[name="robots"]')?.content || '',
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return 'ok'; } catch (e) { return e.message; } }),
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        placeholders: (document.body.innerText.match(/\[doplnit[^\]]*\]/g) || []),
      }));
      if (!meta.title || meta.title.length > 70) (meta.title ? warn : fail)(path, `title (${meta.title.length} znaků): ${meta.title}`);
      if (!is404) {
        if (meta.desc.length < 70 || meta.desc.length > 170) warn(path, `meta description má ${meta.desc.length} znaků`);
        if (!meta.canonical) fail(path, 'chybí canonical');
        if (!meta.ogImage) fail(path, 'chybí og:image');
      }
      if (meta.h1 !== 1) fail(path, `počet h1 = ${meta.h1}`);
      if (!meta.lang) fail(path, 'chybí lang');
      if (meta.imgsNoAlt) fail(path, `${meta.imgsNoAlt} obrázků bez alt`);
      meta.ld.filter((x) => x !== 'ok').forEach((e) => fail(path, `nevalidní JSON-LD: ${e}`));
      if (meta.placeholders.length) warn(path, `placeholdery k doplnění: ${[...new Set(meta.placeholders)].join(', ')}`);
      linkTargets.set(path, meta.links);

      // Přístupnost – axe-core (light i dark); přechody vypnuty, ať se měří cílové barvy
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      for (const theme of ['light', 'dark']) {
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.evaluate(AXE);
        const axe = await page.evaluate(async () => {
          const r = await window.axe.run(document, { resultTypes: ['violations'] });
          return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') }));
        });
        axe.filter((v) => v.impact === 'critical' || v.impact === 'serious')
          .forEach((v) => fail(path, `[a11y ${theme}] ${v.id} (${v.impact}) ×${v.n} např. ${v.sample}`));
        axe.filter((v) => v.impact !== 'critical' && v.impact !== 'serious')
          .forEach((v) => warn(path, `[a11y ${theme}] ${v.id} (${v.impact}) ×${v.n}`));
      }
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    }

    if (shotsDir) {
      mkdirSync(shotsDir, { recursive: true });
      const name = path.replace(/\//g, '__').replace('.html', '');
      for (const theme of ['light', 'dark']) {
        if (vp.name === 'mobile' && theme === 'dark') continue;
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')));
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(shotsDir, `${name}--${vp.name}-${theme}.png`), fullPage: true });
      }
    }
    await ctx.close();
  }
}

// Interní odkazy a kotvy
for (const [from, hrefs] of linkTargets) {
  for (const href of new Set(hrefs)) {
    if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) continue;
    const url = new URL(href, base + from);
    const target = relative(ROOT, join(ROOT, decodeURIComponent(url.pathname))).split(sep).join('/') || 'index.html';
    const file = target.endsWith('/') || target === '' ? target + 'index.html' : target;
    let exists = false;
    try { exists = statSync(join(ROOT, file)).isFile(); } catch { /* */ }
    if (!exists) { fail(from, `rozbitý odkaz → ${href}`); continue; }
    if (url.hash && file.endsWith('.html')) {
      const html = readFileSync(join(ROOT, file), 'utf8');
      const id = decodeURIComponent(url.hash.slice(1));
      if (!new RegExp(`id="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) fail(from, `neexistující kotva → ${href}`);
    }
  }
}

// Funkční testy (běží jen pokud stránky existují)
const functional = (await import('./functional.mjs')).default;
await functional({ browser, base, fail, pages });

await browser.close();
server.close();

console.log(`\nStránek: ${pages.length}`);
if (warnings.length) console.log(`\nVarování (${warnings.length}):\n  ` + warnings.join('\n  '));
if (failures.length) {
  console.error(`\n✗ CHYBY (${failures.length}):\n  ` + failures.join('\n  '));
  process.exit(1);
}
console.log('\n✓ Všechny kontroly prošly');
