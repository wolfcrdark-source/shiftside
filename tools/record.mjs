// Records a ~70 s gameplay video of SHIFTSIDE v2: node tools/record.mjs
// Title screen (3 s), then the autoplay bot from gear 3 (PRISM) with short gears so every zone appears.
// Output: video/shiftside_v2_gameplay.mp4 (H.264, yuv420p, 1280x720). Needs ffmpeg (or Playwright's ffmpeg).
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const root = path.resolve('game');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8766);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmp = '/tmp/vid_v2'; fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: tmp, size: { width: 1280, height: 720 } } });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto('http://127.0.0.1:8766/'); await sleep(3500);
await page.goto('http://127.0.0.1:8766/?autoplay=1&fast=1&zone=3');
const zones = new Set();
while (Date.now() - t0 < 72000) { await sleep(1000); zones.add(await page.evaluate(() => window.__game.zone)); }
const deaths = await page.evaluate(() => window.__game.deaths);
const video = page.video();
await ctx.close(); await browser.close(); srv.close();
const webm = await video.path();
fs.mkdirSync('video', { recursive: true });
const out = 'video/shiftside_v2_gameplay.mp4';
let ff = 'ffmpeg';
try { execFileSync(ff, ['-version']); } catch (e) { const d = path.join(process.env.HOME, '.cache/ms-playwright'); const sub = fs.readdirSync(d).find(n => n.startsWith('ffmpeg')); ff = path.join(d, sub, 'ffmpeg-linux'); }
execFileSync(ff, ['-y', '-i', webm, '-ss', '0.3', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
console.log(JSON.stringify({ out, zones: [...zones], deaths }));
