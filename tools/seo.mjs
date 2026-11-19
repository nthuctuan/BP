// Vygeneruje sitemap.xml a robots.txt pro oba weby (Legacy v kořeni, Legent v /legent/).
// Stránky s <meta name="robots" content="noindex"> se do sitemapy nezařadí.
// Spuštění: node tools/seo.mjs  (spouští se i v rámci npm run build)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const IGNORE = new Set(['node_modules', '.git', 'tools', 'tests', 'docs', 'test-results']);

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (IGNORE.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}

function lastmod(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${relative(ROOT, file)}"`, { cwd: ROOT }).toString().trim();
    if (d) return d;
  } catch { /* mimo git */ }
  return new Date().toISOString().slice(0, 10);
}

function priority(rel) {
  if (rel === 'index.html') return '1.0';
  if (/^(exit-readiness|kupci|sluzby|reseni|exit-test|kalkulacka|ai-audit|roi|kontakt)\.html$/.test(rel)) return '0.9';
  if (/^insights\//.test(rel)) return '0.7';
  if (/(ochrana|cookies|eticky)/.test(rel)) return '0.3';
  return '0.6';
}

function build(siteDir, baseUrl, files) {
  const urls = files
    .map((f) => ({ f, rel: relative(siteDir, f).split(sep).join('/') }))
    .filter(({ f }) => !/name="robots" content="noindex"/.test(readFileSync(f, 'utf8')))
    .sort((a, b) => (a.rel === 'index.html' ? -1 : b.rel === 'index.html' ? 1 : a.rel.localeCompare(b.rel)))
    .map(({ f, rel }) => {
      const loc = baseUrl.replace(/\/$/, '') + '/' + (rel === 'index.html' ? '' : rel); // shodně s canonical
      return `  <url><loc>${loc}</loc><lastmod>${lastmod(f)}</lastmod><priority>${priority(rel)}</priority></url>`;
    });
  writeFileSync(join(siteDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  writeFileSync(join(siteDir, 'robots.txt'), `# ${baseUrl}\nUser-agent: *\nAllow: /\n\n# AI asistenti a vyhledávače odpovědí smí web číst (GEO)\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml\n`);
  return urls.length;
}

const all = walk(ROOT);
const legentDir = join(ROOT, 'legent');
const legacyFiles = all.filter((f) => !f.startsWith(legentDir + sep));
const legentFiles = all.filter((f) => f.startsWith(legentDir + sep));
console.log(`sitemap Legacy: ${build(ROOT, cfg.legacy.url, legacyFiles)} URL`);
if (existsSync(legentDir) && legentFiles.length) console.log(`sitemap Legent: ${build(legentDir, cfg.legent.url, legentFiles)} URL`);

// RSS feed pro Insights (Legacy) a Legent insights (pokud existují)
function feed(dir, siteUrl, title, desc) {
  if (!existsSync(dir)) return 0;
  const items = readdirSync(dir).filter((n) => n.endsWith('.html') && n !== 'index.html').map((n) => {
    const h = readFileSync(join(dir, n), 'utf8');
    const get = (re) => (h.match(re) || [])[1] || '';
    return {
      title: get(/<title>([^<]*)<\/title>/), desc: get(/<meta name="description" content="([^"]*)"/),
      link: get(/<link rel="canonical" href="([^"]*)"/), date: get(/<meta property="article:published_time" content="([^"]*)"/),
    };
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const esc = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(title)}</title>
  <link>${siteUrl}</link>
  <description>${esc(desc)}</description>
  <language>cs</language>
  <atom:link href="${siteUrl}feed.xml" rel="self" type="application/rss+xml"/>
${items.map((i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${i.link}</link>
    <guid>${i.link}</guid>
    <description>${esc(i.desc)}</description>
    <pubDate>${new Date(i.date + 'T08:00:00Z').toUTCString()}</pubDate>
  </item>`).join('\n')}
</channel>
</rss>
`;
  writeFileSync(join(dir, 'feed.xml'), rss);
  return items.length;
}
console.log(`RSS Legacy: ${feed(join(ROOT, 'insights'), cfg.legacy.url.replace(/\/$/, '') + '/insights/', 'Insights – Legacy Enterprises', 'Prodej, ocenění a nástupnictví malých a středních firem v ČR.')} článků`);
const lf = feed(join(ROOT, 'legent', 'insights'), cfg.legent.url.replace(/\/$/, '') + '/insights/', 'Insights – Legent AI', 'AI agenti a automatizace v praxi malých a středních firem.');
if (lf) console.log(`RSS Legent: ${lf} článků`);
