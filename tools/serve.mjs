// Minimální statický server pro lokální náhled a testy: node tools/serve.mjs [port]
// Chová se jako GitHub Pages: /cesta → /cesta.html, /slozka/ → /slozka/index.html, jinak 404.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};

async function tryFile(p) {
  try { const s = await stat(p); return s.isFile() ? p : null; } catch { return null; }
}

export function startServer(port = 0) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    const base = join(ROOT, path);
    if (!base.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const file = (path.endsWith('/') && await tryFile(join(base, 'index.html')))
      || await tryFile(base) || await tryFile(base + '.html') || await tryFile(join(base, 'index.html'));
    if (!file) {
      const nf = path.startsWith('/legent/') ? join(ROOT, 'legent/404.html') : join(ROOT, '404.html');
      const body = await readFile(nf).catch(() => 'Not found');
      res.writeHead(404, { 'content-type': TYPES['.html'] }).end(body);
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.argv[2] || 8080);
  startServer(port).then(() => console.log(`Náhled: http://localhost:${port}/  (Legent AI: /legent/)`));
}
