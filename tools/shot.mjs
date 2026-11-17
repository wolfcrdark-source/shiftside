// node tools/shot.mjs <query> <w> <h> <out> [waitMs]
import { chromium } from 'playwright'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [q, w, h, out, wait] = process.argv.slice(2);
const root = path.resolve('game');
const srv = http.createServer((rq, r) => { let f = path.join(root, rq.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(d); } }); }).listen(8766);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto('http://127.0.0.1:8766/' + (q || '')); await p.waitForTimeout(+(wait || 1500));
await p.screenshot({ path: out }); await b.close(); srv.close();
