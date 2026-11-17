// Headless test for SHIFTSIDE v2: node tools/test.mjs
// Serves ./game, drives it with real keyboard / touch input via Playwright + system Chrome,
// runs the autoplay bot for 95 s, and writes shots/ + tools/test_report.json.
import { chromium, devices } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('game'); const shots = path.resolve('shots'); fs.mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8765);
const URL = 'http://127.0.0.1:8765/';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const report = { version: 'v2', date: new Date().toString(), errors: [], fps: {}, scenarios: {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function watch(page, tag) {
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') report.errors.push(`[${tag}] console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => report.errors.push(`[${tag}] pageerror: ${e.message}`));
  page.on('requestfailed', q => report.errors.push(`[${tag}] requestfailed: ${q.url()}`));
  page.on('request', q => { if (!q.url().startsWith(URL) && !q.url().startsWith('data:')) report.errors.push(`[${tag}] external request: ${q.url()}`); });
}
const g = (page, k) => page.evaluate(k => window.__game[k], k);
const ONLY = process.env.ONLY || '123456';

// A "decent human" that plays with the real keyboard: it only reacts to walls within a human look-ahead,
// adds a 150-300 ms reaction delay, sometimes hesitates, and holds BOTH Shift keys to ride the line for prisms.
async function humanPlay(page, ms, opts = {}) {
  const PY = 640, HS = 14;
  const log = { presses: 0, lineRides: 0, runs: [], deaths0: await g(page, 'deaths') };
  let aware = null, heldBoth = false, runStart = Date.now(), gear3At = null, lastGear = 1;
  const t0 = Date.now(); let shotsTaken = 0;
  const key = s => (s < 0 ? 'ShiftLeft' : 'ShiftRight');
  while (Date.now() - t0 < ms) {
    const st = await g(page, 'state');
    if (st === 'over') {
      log.runs.push({ secs: +((Date.now() - runStart) / 1000).toFixed(1), gear: lastGear, gear3AtSecs: gear3At });
      if (heldBoth) { await page.keyboard.up('ShiftLeft'); await page.keyboard.up('ShiftRight'); heldBoth = false; }
      if (opts.overShot && !shotsTaken) { await sleep(900); await page.screenshot({ path: opts.overShot }); shotsTaken++; }
      await sleep(600); await page.keyboard.press('ShiftRight'); log.presses++;
      runStart = Date.now(); gear3At = null; lastGear = 1; continue;
    }
    if (st !== 'play') { await sleep(50); continue; }
    const prompt = await g(page, 'prompt');
    if (prompt === -1 || prompt === 1) { await sleep(200); await page.keyboard.press(key(prompt)); log.presses++; continue; }
    const v = await g(page, 'view'); if (!v) { await sleep(30); continue; }
    const gear = await g(page, 'gear'); if (gear > lastGear) { lastGear = gear; if (gear >= 3 && gear3At === null) gear3At = +((Date.now() - runStart) / 1000).toFixed(1); }
    // awareness: a threat on our position within ~0.9 s of travel starts a 150-300 ms reaction timer;
    // once it has elapsed we move as soon as another position is safer (that's how players handle zig-zags)
    const lookFar = v.speed * 0.9 + 60;
    const danger = pos => { let d = 1e9; for (const w of v.walls) { const hits = w.side === 0 ? pos !== 0 : (pos === 0 || w.side === pos); if (hits && w.top < PY + HS) d = Math.min(d, Math.max(0, PY - HS - w.bottom)); } return d; };
    const D = { '-1': danger(-1), '0': danger(0), '1': danger(1) };
    const threat = D[v.side] < lookFar;
    if (!threat) aware = null;
    else if (!aware) aware = { since: Date.now(), react: 150 + Math.random() * 150 + (Math.random() < (opts.slip || 0.08) ? 200 + Math.random() * 200 : 0) };
    let want = v.side;
    if (aware && Date.now() - aware.since >= aware.react) {
      if (v.side === 0) { const b = D['-1'] >= D['1'] ? -1 : 1; if (D[b] > D['0'] || D[b] > lookFar * 0.5) want = b; }
      else if (D[-v.side] > D[v.side] + 10 && D[-v.side] >= D['0']) want = -v.side;
      else if (D['0'] > D[v.side] + 10) want = 0;
    }
    if (want !== v.side) {
      if (want === 0) { await page.keyboard.down('ShiftLeft'); await page.keyboard.down('ShiftRight'); heldBoth = true; log.lineRides++; }
      else if (heldBoth) { const ss = want * v.mirror; await page.keyboard.up(key(-ss)); await page.keyboard.up(key(ss)); heldBoth = false; }
      else await page.keyboard.press(key(want * v.mirror));
      log.presses++; aware = null;
    }
    if (opts.midShot && Date.now() - t0 > opts.midShotAt && !opts._mid) { opts._mid = true; await page.screenshot({ path: opts.midShot }); }
    await sleep(15);
  }
  if (heldBoth) { await page.keyboard.up('ShiftLeft'); await page.keyboard.up('ShiftRight'); }
  log.runs.push({ secs: +((Date.now() - runStart) / 1000).toFixed(1), gear: lastGear, gear3AtSecs: gear3At, unfinished: true });
  log.deaths = (await g(page, 'deaths')) - log.deaths0;
  log.finalState = await g(page, 'state'); log.finalGear = await g(page, 'gear');
  return log;
}

// 1) Desktop, fresh player: title -> scripted tutorial -> ~150 s of "decent human" keyboard play (tuning check)
if (ONLY.includes('1'))
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(); watch(page, 'desktop-human');
  await page.goto(URL); await sleep(2500);
  await page.screenshot({ path: `${shots}/01_title.png` });
  report.fps.title = await g(page, 'fps');
  await page.keyboard.press('ShiftRight'); await sleep(200);
  await sleep(1500); await page.screenshot({ path: `${shots}/02_tutorial.png` });
  const log = await humanPlay(page, 150000, { overShot: `${shots}/05_gameover.png` });
  log.audio = await g(page, 'audio'); log.fps = await g(page, 'fps'); log.minFps = await g(page, 'minFps');
  log.totals = (await g(page, 'save')).tot;
  report.scenarios.desktopHumanKeyboard = log;
  await ctx.close();
}
// 2) Returning player, desktop: daily challenge via ↓, skin cycle via C, death -> instant restart
if (ONLY.includes('2'))
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('shiftside.v1')) localStorage.setItem('shiftside.v1', JSON.stringify({ tut: true, best: 4200, bestDist: 9000, goals: 6, gdone: [1, 1, 1, 1, 1, 1], lastRankGoals: 6 })); });
  const page = await ctx.newPage(); watch(page, 'daily');
  await page.goto(URL); await sleep(800);
  await page.keyboard.press('KeyC'); await sleep(100); await page.keyboard.press('KeyC'); await sleep(300);
  const skin = (await g(page, 'save')).skin;
  await page.screenshot({ path: `${shots}/01b_title_skins_daily.png` });
  await page.keyboard.press('ArrowDown'); await sleep(500);
  const daily = await g(page, 'daily');
  let waited = 0; while (await g(page, 'state') !== 'over' && waited < 25000) { await sleep(250); waited += 250; }
  await sleep(900); await page.screenshot({ path: `${shots}/05b_daily_gameover.png` });
  const t0 = Date.now(); await page.keyboard.press('ShiftRight');
  let restarted = false; for (let i = 0; i < 40; i++) { if (await g(page, 'state') === 'play' && await g(page, 't') < 2) { restarted = true; break; } await sleep(10); }
  report.scenarios.dailyAndRestart = { skinAfterTwoC: skin, dailyStarted: daily, reachedGameOver: waited < 25000, restarted, restartMs: Date.now() - t0, stillDaily: await g(page, 'daily') };
  await ctx.close();
}
// 3) Autoplay bot for 95 s (fast gears so it crosses every zone), fps + mid-game shots
if (ONLY.includes('3'))
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(); watch(page, 'autoplay');
  await page.goto(URL + '?autoplay=1&fast=1'); await sleep(800);
  const fps = [], zones = new Set(); let restarts = 0;
  for (let i = 0; i < 95; i++) {
    await sleep(1000); fps.push(await g(page, 'fps')); zones.add(await g(page, 'zone'));
    if (await g(page, 'state') === 'over') { restarts++; await sleep(500); await page.keyboard.press('ShiftRight'); }
    if (i === 30) await page.screenshot({ path: `${shots}/03_autoplay_30s.png` });
  }
  report.fps.autoplay = { min: Math.min(...fps), max: Math.max(...fps), avg: +(fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1), minFpsHook: await g(page, 'minFps') };
  report.scenarios.autoplay95s = { deaths: await g(page, 'deaths'), restarts, finalGear: await g(page, 'gear'), zonesSeen: [...zones], score: await g(page, 'score'), stats: await g(page, 'stats') };
  await ctx.close();
}
// 4) Mobile (Pixel 7, touch): taps + two-thumb hold to ride the line, no scroll/zoom
if (ONLY.includes('4'))
{
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('shiftside.v1')) localStorage.setItem('shiftside.v1', JSON.stringify({ tut: true })); });
  const page = await ctx.newPage(); watch(page, 'mobile');
  await page.goto(URL); await sleep(1500);
  await page.screenshot({ path: `${shots}/06_mobile_title.png` });
  const vw = page.viewportSize();
  const cdp = await ctx.newCDPSession(page);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const L = { x: vw.width * 0.25, y: vw.height * 0.7, id: 1 }, R = { x: vw.width * 0.75, y: vw.height * 0.7, id: 2 };
  await page.touchscreen.tap(R.x, R.y); await sleep(400);
  // two-thumb hold -> line
  await touch('touchStart', [L]); await sleep(60); await touch('touchStart', [L, R]); await sleep(250);
  const onLine = await g(page, 'line');
  await touch('touchEnd', [L]); await sleep(80); const afterRelease = await g(page, 'view'); await touch('touchEnd', []);
  let taps = 0; const start = Date.now(), fps = [];
  while (Date.now() - start < 30000) {
    const st = await g(page, 'state');
    if (st === 'over') { await sleep(700); await page.screenshot({ path: `${shots}/07_mobile_gameover.png` }); await page.touchscreen.tap(R.x, R.y); taps++; continue; }
    await page.touchscreen.tap(Math.random() < 0.5 ? L.x : R.x, R.y); taps++;
    await sleep(250 + Math.random() * 300);
    if (taps === 25) await page.screenshot({ path: `${shots}/06b_mobile_play.png` });
    if (taps % 10 === 0) fps.push(await g(page, 'fps'));
  }
  const scroll = await page.evaluate(() => ({ sx: scrollX, sy: scrollY, sw: document.documentElement.scrollWidth, cw: innerWidth, sh: document.documentElement.scrollHeight, ch: innerHeight, vp: document.querySelector('meta[name=viewport]').content }));
  report.scenarios.mobileTouch = { twoThumbLine: onLine, releaseLeftThumbGoesRight: afterRelease && afterRelease.side === 1, taps, deaths: await g(page, 'deaths'), fps, scroll };
  await ctx.close();
}
// 5) Cover image 630x500
if (ONLY.includes('5'))
{
  const ctx = await browser.newContext({ viewport: { width: 630, height: 500 } });
  const page = await ctx.newPage(); watch(page, 'cover');
  await page.goto(URL + '?cover=1'); await sleep(2500);
  await page.screenshot({ path: `${shots}/cover_630x500.png` });
  await ctx.close();
}
// 6) Returning player, "decent human" with more slips (15%) for 150 s: how far do typical runs get?
if (ONLY.includes('6'))
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('shiftside.v1')) localStorage.setItem('shiftside.v1', JSON.stringify({ tut: true })); });
  const page = await ctx.newPage(); watch(page, 'desktop-human-returning');
  await page.goto(URL); await sleep(800);
  await page.keyboard.press('ShiftRight'); await sleep(100);
  const log = await humanPlay(page, 150000, { slip: 0.15, midShot: `${shots}/04_human_midrun.png`, midShotAt: 70000 });
  report.scenarios.desktopHumanReturning = log;
  await ctx.close();
}
await browser.close(); srv.close();
try { report.zones = JSON.parse(fs.readFileSync('/tmp/zones_result.json', 'utf8')); } catch (e) { /* zones.mjs not run */ }
fs.writeFileSync('tools/test_report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
