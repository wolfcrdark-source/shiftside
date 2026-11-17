// Screenshots of each zone/mechanic: node tools/zones.mjs  (autoplay bot, ?zone=N)
import { chromium } from 'playwright'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('game'); const out = path.resolve(process.env.OUT || 'shots');
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(d); }); }).listen(8767);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const errors = []; const res = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
// shot spec: [name, zone, predicate-js, timeoutMs, viewport]
const specs = [
  ['v2_zone2_swing_shifter', 2, 'g => g.view && g.view.movers > 0', 30000],
  ['v2_zone3_prism_line', 3, 'g => g.line && g.view.prisms > 0', 30000],
  ['v2_zone4_mirror_flip', 4, 'g => g.flipping', 30000, '', null, 160],
  ['v2_zone4_mirrored', 4, 'g => g.mirror < 0 && !g.flipping && g.t > 8', 40000],
  ['v2_zone5_blackout', 5, 'g => g.blackout > 1 && g.blackout < 4.2', 30000],
  ['v2_zone6_rush_hour', 6, 'g => g.t > 6', 20000],
  ['v2_rush', 2, 'g => g.rushOn', 40000, '&fast=1'],
  ['v2_overtime', 7, 'g => g.t > 5', 20000],
  ['v2_mobile_prism', 3, 'g => g.line && g.view.prisms > 0', 30000, '', { width: 412, height: 839, isMobile: true, hasTouch: true, deviceScaleFactor: 2.6 }],
];
for (const [name, zone, pred, to, extra, vp, after] of specs) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) continue;
  const ctx = await b.newContext(vp ? { viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor } : { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${name}] ${m.text()}`); });
  p.on('pageerror', e => errors.push(`[${name}] pageerror ${e.message}`));
  await p.goto(`http://127.0.0.1:8767/?autoplay=1&zone=${zone}${extra || ''}`);
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < to) {
    ok = await p.evaluate(`(${pred})(window.__game)`).catch(() => false);
    if (ok) break; await sleep(40);
  }
  if (after) await sleep(after);
  await p.screenshot({ path: `${out}/${name}.png` });
  res[name] = { ok, waitedMs: Date.now() - t0, deaths: await p.evaluate(() => window.__game.deaths), gear: await p.evaluate(() => window.__game.gear), fps: await p.evaluate(() => window.__game.fps) };
  await ctx.close();
}
await b.close(); srv.close();
console.log(JSON.stringify({ res, errors }, null, 1));
fs.writeFileSync('/tmp/zones_result.json', JSON.stringify({ res, errors }, null, 1));
