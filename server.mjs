import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml' };
createServer((req,res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const requested = raw === '/' ? '/index.html' : raw;
  const target = normalize(join(root, requested));
  if (!target.startsWith(root) || !existsSync(target)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type':types[extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store' });
  createReadStream(target).pipe(res);
}).listen(8765, () => console.log('WB Peak Area is running at http://localhost:8765'));
