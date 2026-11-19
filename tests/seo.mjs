// Statická SEO kontrola obou webů (bez prohlížeče):
// unikátní <title> a meta description, canonical odpovídá cestě a doméně, og:url = canonical,
// každá indexovaná stránka je v sitemap.xml a vede na ni alespoň jeden interní odkaz (žádné sirotky),
// llms.txt existuje, obrázky ve stránkách mají rozměrově rozumné OG (soubor existuje).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const IGNORE = new Set(['node_modules', '.git', 'tools', 'tests', 'docs', 'test-results', '_site']);
const walk = (d, o = []) => { for (const n of readdirSync(d)) { if (IGNORE.has(n)) continue; const p = join(d, n); statSync(p).isDirectory() ? walk(p, o) : n.endsWith('.html') && o.push(p); } return o; };

const errors = [];
const sites = [
  { name: 'Legacy', dir: ROOT, url: cfg.legacy.url, files: [] },
  { name: 'Legent', dir: join(ROOT, 'legent'), url: cfg.legent.url, files: [] },
];
for (const f of walk(ROOT)) (f.startsWith(join(ROOT, 'legent') + sep) ? sites[1] : sites[0]).files.push(f);

for (const site of sites) {
  const titles = new Map(), descs = new Map(), inbound = new Map();
  const sitemap = existsSync(join(site.dir, 'sitemap.xml')) ? readFileSync(join(site.dir, 'sitemap.xml'), 'utf8') : '';
  if (!sitemap) errors.push(`${site.name}: chybí sitemap.xml`);
  if (!existsSync(join(site.dir, 'robots.txt'))) errors.push(`${site.name}: chybí robots.txt`);
  if (!existsSync(join(site.dir, 'llms.txt'))) errors.push(`${site.name}: chybí llms.txt`);

  for (const f of site.files) {
    const rel = relative(site.dir, f).split(sep).join('/');
    const html = readFileSync(f, 'utf8');
    const noindex = /name="robots" content="noindex"/.test(html);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    const canon = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/)?.[1];
    const ogImg = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
    if (title) { if (titles.has(title)) errors.push(`${rel}: duplicitní title s ${titles.get(title)}`); titles.set(title, rel); }
    if (desc) { if (descs.has(desc)) errors.push(`${rel}: duplicitní description s ${descs.get(desc)}`); descs.set(desc, rel); }
    if (!noindex) {
      const expected = site.url.replace(/\/$/, '') + '/' + (rel === 'index.html' ? '' : rel);
      if (canon !== expected) errors.push(`${rel}: canonical ${canon} ≠ ${expected}`);
      if (ogUrl !== canon) errors.push(`${rel}: og:url ≠ canonical`);
      if (!sitemap.includes(`<loc>${expected}</loc>`)) errors.push(`${rel}: chybí v sitemap.xml`);
      if (ogImg) {
        const local = join(site.dir, ogImg.replace(site.url.replace(/\/$/, ''), ''));
        if (!existsSync(local)) errors.push(`${rel}: og:image neexistuje (${ogImg})`);
      }
      const wantLang = /(^|\/)en\//.test(rel) ? 'en' : 'cs';
      if (!new RegExp(`<html lang="${wantLang}"`).test(html)) errors.push(`${rel}: chybí lang="${wantLang}"`);
    }
    // interní odkazy → příchozí odkazy pro cílové stránky
    for (const m of html.matchAll(/<a [^>]*href="([^"#?]+\.html)[^"]*"/g)) {
      if (/^(https?:|mailto:)/.test(m[1])) continue;
      const target = m[1].startsWith('/')
        ? relative(site.dir, join(ROOT, m[1])).split(sep).join('/')
        : posix.normalize(posix.join(posix.dirname(rel), m[1]));
      if (target !== rel) inbound.set(target, (inbound.get(target) || 0) + 1);
    }
  }
  for (const f of site.files) {
    const rel = relative(site.dir, f).split(sep).join('/');
    const html = readFileSync(f, 'utf8');
    if (rel === 'index.html' || /noindex/.test(html)) continue;
    if (!inbound.get(rel)) errors.push(`${site.name}: osiřelá stránka ${rel} (žádný interní odkaz)`);
  }
  console.log(`${site.name}: ${site.files.length} stránek, ${titles.size} unikátních titulků`);
}

if (errors.length) { console.error('✗ SEO chyby:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('✓ SEO kontrola prošla');
