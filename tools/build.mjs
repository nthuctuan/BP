// Vloží sdílené části (hlavička, patička, …) do všech HTML stránek.
//
// Ve stránce:  <!-- @partial header root="../" active="insights" -->  …  <!-- @end header -->
// Obsah mezi značkami se při každém buildu přepíše šablonou z tools/partials/<site>/<name>.html.
// V šabloně lze použít {{root}}, {{year}} a klíče ze site.config.json ({{email}}, {{ico}}…).
// Odkazy s data-nav="X" dostanou aria-current="page", pokud active="X".
//
//   npm run build            → přepíše soubory
//   node tools/build.mjs --check → jen ověří, že je vše aktuální (pro CI/testy)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const config = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));

const IGNORE = new Set(['node_modules', '.git', 'tools', 'tests', 'docs', 'test-results', 'legent-agents']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function siteOf(file) {
  const rel = relative(ROOT, file).split(sep);
  return rel[0] === 'legent' ? 'legent' : 'legacy';
}

const cache = new Map();
function template(site, name) {
  const key = `${site}/${name}`;
  if (!cache.has(key)) {
    const p = join(ROOT, 'tools', 'partials', site, `${name}.html`);
    if (!existsSync(p)) throw new Error(`Chybí šablona ${key} (${p})`);
    cache.set(key, readFileSync(p, 'utf8').replace(/\s+$/, ''));
  }
  return cache.get(key);
}

function render(tpl, vars) {
  let out = tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`Neznámá proměnná {{${k}}}`);
    return vars[k];
  });
  if (vars.active) {
    out = out.replace(new RegExp(`data-nav="${vars.active}"`, 'g'), `data-nav="${vars.active}" aria-current="page"`);
  }
  return out;
}

const RE = /([ \t]*)<!-- @partial (\S+)((?: [\w-]+="[^"]*")*) -->[\s\S]*?<!-- @end \2 -->/g;
let changed = 0;
let stale = [];

for (const file of walk(ROOT)) {
  const site = siteOf(file);
  const src = readFileSync(file, 'utf8');
  const out = src.replace(RE, (whole, indent, name, attrStr) => {
    const attrs = Object.fromEntries([...attrStr.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    const root = attrs.root ?? '';
    const base = { ...config.common, ...config[site] };
    const vars = {
      ...base,
      ...attrs,
      root,
      year: String(config.common.year),
      legentHref: config.legacy.legentUrl || `${root}legent/index.html`,
      legacyHref: config.legent.legacyUrl || `${root}../index.html`,
    };
    const body = render(template(site, name), vars);
    return `${indent}<!-- @partial ${name}${attrStr} -->\n${body}\n${indent}<!-- @end ${name} -->`;
  });
  if (out !== src) {
    if (CHECK) stale.push(relative(ROOT, file));
    else { writeFileSync(file, out); changed++; }
  }
}

// Sdílený JS: zdroj assets/js/site.js → kopie pro samostatně nasaditelný web Legent AI
const SHARED = [
  ['assets/js/site.js', 'legent/assets/js/site.js'],
  // Pravidla agentů Legent AI pro živou ukázku na stránce legent/agenti.html (stejný kód jako agent)
  ['legent-agents/src/validators/cz.js', 'legent/assets/js/agents/validators/cz.js'],
  ['legent-agents/src/rules/invoice-rules.js', 'legent/assets/js/agents/rules/invoice-rules.js'],
];
for (const [from, to] of SHARED) {
  const src = '/* KOPIE z ' + from + ' — needitovat zde, spusťte npm run build */\n' + readFileSync(join(ROOT, from), 'utf8');
  const dest = join(ROOT, to);
  const cur = existsSync(dest) ? readFileSync(dest, 'utf8') : '';
  if (cur !== src) { if (CHECK) stale.push(to); else { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, src); changed++; } }
}

if (CHECK) {
  if (stale.length) {
    console.error('✗ Zastaralé partials (spusťte npm run build):\n  ' + stale.join('\n  '));
    process.exit(1);
  }
  console.log('✓ partials aktuální');
} else {
  console.log(`build: aktualizováno ${changed} souborů`);
}
