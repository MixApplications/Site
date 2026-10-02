// Local preview of _site/ the way GitHub Pages serves it: /foo -> /foo.html,
// /dir/ -> /dir/index.html, unknown paths -> /404.html with status 404.
//   npm run build && npm run serve   (PORT=8765 by default)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '_site');
const PORT = Number(process.env.PORT) || 8765;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  const base = path.join(ROOT, clean);
  if (!base.startsWith(ROOT)) return null;
  for (const c of [base, base + '.html', path.join(base, 'index.html')]) {
    try { if (fs.statSync(c).isFile()) return c; } catch {}
  }
  return null;
}

http.createServer((req, res) => {
  const file = resolve(req.url);
  const target = file || path.join(ROOT, '404.html');
  res.writeHead(file ? 200 : 404, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`serving _site on http://127.0.0.1:${PORT}`));
