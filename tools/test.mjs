// Headless test: node tools/test.mjs  (serves ./game on :8765 and drives it with Playwright + system Chrome)
import { chromium, devices } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('game'); const shots = path.resolve('shots'); fs.mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8765);
const URL = 'http://127.0.0.1:8765/';
const exe = process.env.CHROME || '/usr/bin/google-chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const report = { errors: [], fps: {}, notes: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function watch(page, tag) {
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') report.errors.push(`[${tag}] console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => report.errors.push(`[${tag}] pageerror: ${e.message}`));
  page.on('requestfailed', q => report.errors.push(`[${tag}] requestfailed: ${q.url()}`));
  page.on('request', q => { if (!q.url().startsWith(URL)) report.errors.push(`[${tag}] external request: ${q.url()}`); });
}
const g = (page, k) => page.evaluate(k => window.__game[k], k);

// 1) Desktop, fresh player: title -> tutorial by doing (real Shift keys) -> 60+ s of real keyboard play
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(); watch(page, 'desktop');
  await page.goto(URL); await sleep(2500);
  await page.screenshot({ path: `${shots}/01_title.png` });
  report.fps.title = await g(page, 'fps');
  await page.keyboard.press('ShiftRight'); await sleep(300);
  // simple external player: reads which side the prompt wants during the tutorial, otherwise taps keys
  const start = Date.now(); let presses = 0, tutPrompts = 0, shotMid = false; const fpsSamples = [];
  while (Date.now() - start < 70000) {
    const st = await g(page, 'state');
    const prompt = await g(page, 'prompt');
    if (st === 'play' && prompt) { tutPrompts++; await sleep(150); await page.keyboard.press(prompt < 0 ? 'ShiftLeft' : 'ShiftRight'); presses++; }
    else if (st === 'over') { await sleep(600); await page.keyboard.press('ShiftLeft'); presses++; }
    else { await page.keyboard.press(Math.random() < 0.5 ? 'ShiftLeft' : 'ShiftRight'); presses++; await sleep(120 + Math.random() * 380); }
    if (!shotMid && Date.now() - start > 9000 && st === 'play') { await page.screenshot({ path: `${shots}/02_tutorial.png` }); shotMid = true; }
    if ((Date.now() - start) % 5000 < 200) fpsSamples.push(await g(page, 'fps'));
  }
  report.desktopKeyboard = { presses, tutPrompts, deaths: await g(page, 'deaths'), state: await g(page, 'state'), fpsSamples, save: await g(page, 'save') };
  await ctx.close();
}
// 2) Desktop autoplay (built-in bot drives the real input path) for 75 s: mid-game screenshots + fps
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(); watch(page, 'autoplay');
  await page.goto(URL + '?autoplay=1'); await sleep(1000);
  const fps = []; let shot = 0;
  for (let i = 0; i < 75; i++) {
    await sleep(1000); fps.push(await g(page, 'fps'));
    if (await g(page, 'state') === 'over') { await page.keyboard.press('ShiftRight'); }
    if (i === 20 || i === 45) await page.screenshot({ path: `${shots}/0${i === 20 ? 3 : 4}_play_gear${await g(page, 'gear')}.png` });
  }
  report.fps.autoplay = fps; report.autoplay = { deaths: await g(page, 'deaths'), gear: await g(page, 'gear'), score: await g(page, 'score'), t: await g(page, 't') };
  await ctx.close();
}
// 3) Mobile (touch emulation, portrait): taps on halves, check no scroll/zoom, then force a game over screenshot
{
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage(); watch(page, 'mobile');
  await page.goto(URL); await sleep(1500);
  await page.screenshot({ path: `${shots}/06_mobile_title.png` });
  const vw = page.viewportSize();
  const start = Date.now(); let taps = 0, overShot = false;
  while (Date.now() - start < 25000) {
    const prompt = await g(page, 'prompt');
    const side = prompt || (Math.random() < 0.5 ? -1 : 1);
    await page.touchscreen.tap(side < 0 ? vw.width * 0.25 : vw.width * 0.75, vw.height * 0.6); taps++;
    await sleep(prompt ? 150 : 200 + Math.random() * 300);
    
    if (Date.now() - start > 12000 && !overShot && taps % 10 === 0) await page.screenshot({ path: `${shots}/06b_mobile_play.png` });
  }
  const scroll = await page.evaluate(() => ({ sx: scrollX, sy: scrollY, sw: document.documentElement.scrollWidth, cw: innerWidth, sh: document.documentElement.scrollHeight, ch: innerHeight, vp: document.querySelector('meta[name=viewport]').content }));
  report.mobile = { taps, deaths: await g(page, 'deaths'), fps: await g(page, 'fps'), scroll };
  await ctx.close();
}
// 4) Returning player, desktop: no input -> death -> game-over card -> instant restart
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('shiftside.v1')) localStorage.setItem('shiftside.v1', JSON.stringify({ tut: true, best: 4200, bestDist: 9000 })); });
  const page = await ctx.newPage(); watch(page, 'gameover');
  await page.goto(URL); await sleep(800);
  await page.keyboard.press('ShiftLeft');
  // play a little with random keys, then stop pressing so a wall gets us
  for (let i = 0; i < 12; i++) { await page.keyboard.press(i % 2 ? 'ShiftLeft' : 'ShiftRight'); await sleep(350); }
  let waited = 0; while (await g(page, 'state') !== 'over' && waited < 20000) { await sleep(250); waited += 250; }
  await sleep(900);
  await page.screenshot({ path: `${shots}/05_gameover.png` });
  const t0 = Date.now(); await page.keyboard.press('ShiftRight');
  let restarted = false; for (let i = 0; i < 20; i++) { if (await g(page, 'state') === 'play' && await g(page, 't') < 2) { restarted = true; break; } await sleep(25); }
  report.restart = { reachedGameOver: waited < 20000, restarted, restartMs: Date.now() - t0 };
  await ctx.close();
}
// 5) Mobile returning player: game over card on a phone
{
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('shiftside.v1')) localStorage.setItem('shiftside.v1', JSON.stringify({ tut: true, best: 9000, bestDist: 20000, goals: 0 })); });
  const page = await ctx.newPage(); watch(page, 'mobile-over');
  await page.goto(URL); await sleep(800);
  const vw = page.viewportSize();
  await page.touchscreen.tap(vw.width * 0.75, vw.height * 0.6);
  for (let i = 0; i < 10; i++) { await page.touchscreen.tap(i % 2 ? vw.width * 0.25 : vw.width * 0.75, vw.height * 0.6); await sleep(400); }
  let waited = 0; while (await g(page, 'state') !== 'over' && waited < 20000) { await sleep(250); waited += 250; }
  await sleep(900);
  await page.screenshot({ path: `${shots}/07_mobile_gameover.png` });
  await ctx.close();
}
// 6) Cover image 630x500
{
  const ctx = await browser.newContext({ viewport: { width: 630, height: 500 } });
  const page = await ctx.newPage(); watch(page, 'cover');
  await page.goto(URL + '?cover=1'); await sleep(3200);
  await page.screenshot({ path: `${shots}/cover_630x500.png` });
  await ctx.close();
}
await browser.close(); srv.close();
fs.writeFileSync('tools/test_report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
