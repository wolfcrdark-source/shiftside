/* SHIFTSIDE v2 - Game Off 2026 ("SHIFT"). MIT licence. Vanilla JS + Canvas 2D + WebAudio. No external assets. */
(() => {
'use strict';

// ---------- constants ----------
const W = 480, H = 800, LINE = 240, PY = 640, LANE = 96, HS = 14, PSZ = 19, SLIT = 30;
const LIGHT = '#f3efe6', DARK = '#0e0d14';
const ZONES = [
  { name: 'DAYBREAK', acc: '#ff3d7f', motif: 0 },
  { name: 'SWING SHIFT', acc: '#22d3ee', motif: 1, mech: 'shifter', kb: 'Striped arrows: that wall is about to jump sides', tc: 'Striped arrows: that wall is about to jump sides' },
  { name: 'PRISM', acc: '#a3e635', motif: 2, mech: 'prism', kb: 'Hold BOTH Shift keys (or Space) to ride the line', tc: 'Hold BOTH thumbs down to ride the line' },
  { name: 'MIRROR', acc: '#fb923c', motif: 3, mech: 'mirror', kb: 'The worlds flip. Stay with your world!', tc: 'The worlds flip. Stay with your world!' },
  { name: 'BLACKOUT', acc: '#a78bfa', motif: 4, mech: 'blackout', kb: 'Lights out: walls flash on the beat', tc: 'Lights out: walls flash on the beat' },
  { name: 'RUSH HOUR', acc: '#facc15', motif: 5, mech: 'double', kb: 'Double arrows jump twice. Watch them all the way', tc: 'Double arrows jump twice. Watch them all the way' },
  { name: 'OVERTIME', acc: '#f43f5e', motif: 6, mech: 'remix', kb: 'Everything at once. Forever.', tc: 'Everything at once. Forever.' },
];
const RANKS = ['Trainee', 'Day Shifter', 'Swing Shifter', 'Night Shifter', 'Graveyard Shift', 'Double Shifter',
  'Shift Lead', 'Shift Supervisor', 'Shift Master', 'Overlord of Overtime'];
const SKINS = ['Square', 'Diamond', 'Circle', 'Hexagon', 'Star', 'Plus', 'Ring'];
const GOALS = [
  { t: 'Shift into GEAR 2', k: 'run', s: 'gear', n: 2 },
  { t: 'Collect 50 sparks', k: 'tot', s: 'sparks', n: 50 },
  { t: '5 close shifts in one run', k: 'run', s: 'close', n: 5 },
  { t: 'Grab a Golden Prism', k: 'tot', s: 'gold', n: 1 },
  { t: 'Score 3,000', k: 'run', s: 'score', n: 3000 },
  { t: 'Reach PRISM (gear 3)', k: 'run', s: 'gear', n: 3 },
  { t: 'Thread 5 prism walls in total', k: 'tot', s: 'thread', n: 5 },
  { t: 'Clear 3 RUSHES in total', k: 'tot', s: 'rush', n: 3 },
  { t: 'Reach a x4 multiplier', k: 'run', s: 'mult', n: 4 },
  { t: 'Survive a MIRROR flip (gear 4)', k: 'run', s: 'gear', n: 4 },
  { t: '8 PERFECT shifts in one run', k: 'run', s: 'perfect', n: 8 },
  { t: 'Score 10,000', k: 'run', s: 'score', n: 10000 },
  { t: 'Play a Daily Challenge', k: 'tot', s: 'daily', n: 1 },
  { t: 'Reach BLACKOUT (gear 5)', k: 'run', s: 'gear', n: 5 },
  { t: 'Collect 1,000 sparks', k: 'tot', s: 'sparks', n: 1000 },
  { t: 'Reach a x8 multiplier', k: 'run', s: 'mult', n: 8 },
  { t: 'Score 30,000', k: 'run', s: 'score', n: 30000 },
  { t: 'Clock into OVERTIME (gear 7)', k: 'run', s: 'gear', n: 7 },
  { t: 'Score 75,000', k: 'run', s: 'score', n: 75000 },
  { t: 'Survive 300 seconds', k: 'run', s: 'time', n: 300 },
];
const TIPS = [
  'Shift at the last instant: PERFECT pays double.',
  'Your multiplier drains if you play it safe.',
  'Every gear ends in a RUSH. Clear it to shift up.',
  'On the line you can hit walls on BOTH sides.',
  'Sparks on the line are risky... and worth 25.',
  'Golden Prism = OVERDRIVE. Smash everything.',
  'After a MIRROR flip, you stay in your world.',
  'Sticky Keys popped up? Use the arrow keys or A / D.',
  'Each gear shifts the music up a key. Listen for it.',
  'New skins unlock as your rank goes up. Press C.',
];
const QS = new URLSearchParams(location.search);
const AUTOPLAY = QS.has('autoplay');
const COVER = QS.has('cover');
const FAST = QS.has('fast');
const ZONE_START = Math.max(1, Math.min(12, parseInt(QS.get('zone') || '1', 10) || 1));

// ---------- save ----------
const SAVE_KEY = 'shiftside.v1';
const TOT0 = { close: 0, sparks: 0, gold: 0, runs: 0, perfect: 0, thread: 0, rush: 0, daily: 0 };
const RB0 = { score: 0, gear: 1, close: 0, perfect: 0, mult: 1, time: 0, sparks: 0 };
const save = { best: 0, bestDist: 0, lastScore: 0, tut: false, mute: false, goals: 0, skin: 0, seen: {}, daily: { d: '', best: 0, dist: 0 }, tot: Object.assign({}, TOT0), rb: Object.assign({}, RB0) };
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (s) { Object.assign(save, s); save.tot = Object.assign({}, TOT0, s.tot); save.rb = Object.assign({}, RB0, s.rb); save.seen = s.seen || {}; save.daily = Object.assign({ d: '', best: 0, dist: 0 }, s.daily); }
} catch (e) { /* ignore */ }
if (QS.has('fresh')) save.tut = false;
if (AUTOPLAY || ZONE_START > 1) save.tut = true;
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
if (save.daily.d !== today()) save.daily = { d: today(), best: 0, dist: 0 };

// ---------- canvas ----------
const cv = document.getElementById('c');
const cx = cv.getContext('2d', { alpha: false });
let cw, ch, dpr, S, OX, OY, VL, VR, VT, VB;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = window.innerWidth; ch = window.innerHeight;
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  S = Math.min(cw / W, ch / H);
  OX = (cw - W * S) / 2; OY = (ch - H * S) / 2;
  VL = -OX / S; VR = W + OX / S; VT = -OY / S; VB = H + OY / S;
}
window.addEventListener('resize', resize);
resize();

// ---------- helpers ----------
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const fmt = n => Math.floor(n).toLocaleString('en-US');
const laneX = side => LINE + side * LANE;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let grng = Math.random; // generation RNG (seeded in the Daily Challenge)
const gr = (a, b) => a + grng() * (b - a);
const gi = (a, b) => Math.floor(gr(a, b + 1));
function gw(list) { let tot = 0; for (const [, w] of list) tot += w; let r = grng() * tot; for (const [v, w] of list) { r -= w; if (r <= 0) return v; } return list[0][0]; }
const zoneOf = g => ZONES[Math.min(g, 7) - 1];
const isTouch = () => lastInputTouch || (window.matchMedia && matchMedia('(pointer: coarse)').matches);

// ---------- audio ----------
const AU = { c: null };
const PENT = [0, 3, 5, 7, 10];
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function audioInit() {
  if (AU.c) { if (AU.c.state === 'suspended') AU.c.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  let c; try { c = new AC(); } catch (e) { return; }
  AU.c = c;
  AU.master = c.createGain(); AU.master.gain.value = save.mute ? 0 : 0.85;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  AU.master.connect(comp); comp.connect(c.destination);
  AU.sfx = c.createGain(); AU.sfx.gain.value = 0.6; AU.sfx.connect(AU.master);
  AU.lp = c.createBiquadFilter(); AU.lp.type = 'lowpass'; AU.lp.frequency.value = 700; AU.lp.Q.value = 2;
  AU.mus = c.createGain(); AU.mus.gain.value = 0.32; AU.mus.connect(AU.lp); AU.lp.connect(AU.master);
  const len = c.sampleRate; const b = c.createBuffer(1, len, c.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AU.noise = b; AU.step = 0; AU.next = c.currentTime + 0.1;
  setInterval(schedule, 25);
}
const audioOn = () => AU.c && AU.c.state === 'running';
function tone(f, dur, type, vol, slide, dest, when) {
  const c = AU.c; if (!c) return;
  const t = when || c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.sfx); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol, freq, ftype, dest, when) {
  const c = AU.c; if (!c) return;
  const t = when || c.currentTime;
  const s = c.createBufferSource(); s.buffer = AU.noise;
  const f = c.createBiquadFilter(); f.type = ftype || 'bandpass'; f.frequency.value = freq || 1000;
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || AU.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const now = () => AU.c ? AU.c.currentTime : 0;
const arp = (notes, gap, type, vol, dur) => { if (!AU.c) return; const t = now(); notes.forEach((n, i) => tone(mf(n), dur || 0.18, type || 'triangle', vol || 0.12, 0, null, t + i * gap)); };
const SFX = {
  shift(side) { if (!AU.c) return; tone(side < 0 ? 620 : 300, 0.09, 'triangle', 0.22, side < 0 ? 980 : 170); noise(0.07, 0.12, side < 0 ? 4000 : 1500); },
  line() { tone(440, 0.12, 'sine', 0.18, 880); tone(660, 0.12, 'triangle', 0.08, 1320); },
  wallJump() { tone(200, 0.12, 'sawtooth', 0.08, 500); noise(0.08, 0.1, 2500); },
  bump() { tone(110, 0.06, 'square', 0.08, 90); },
  spark(i) { const n = 72 + PENT[i % 5] + 12 * Math.min(2, Math.floor(i / 5)); tone(mf(n), 0.12, 'sine', 0.16); tone(mf(n + 12), 0.08, 'triangle', 0.05); },
  lineSpark() { tone(mf(96), 0.1, 'sine', 0.14); tone(mf(103), 0.14, 'sine', 0.08, 0, null, now() + 0.03); },
  close() { tone(mf(84), 0.1, 'square', 0.08); tone(mf(91), 0.16, 'triangle', 0.14, 0, null, now() + 0.04); },
  perfect() { arp([84, 88, 91, 96], 0.035, 'triangle', 0.15); noise(0.2, 0.06, 9000, 'highpass'); },
  thread() { arp([79, 86, 91, 98], 0.03, 'sine', 0.16, 0.3); },
  prismNear() { tone(mf(100), 0.25, 'sine', 0.05, mf(108)); },
  gear() { arp([60, 64, 67, 72, 76, 79, 84].map(n => n + run.key), 0.045, 'sawtooth', 0.08, 0.16); noise(0.5, 0.1, 600, 'lowpass'); },
  rush() { arp([67, 67, 74, 79], 0.09, 'square', 0.1, 0.12); noise(0.4, 0.15, 5000, 'highpass'); },
  flip() { if (!AU.c) return; tone(160, 0.7, 'sawtooth', 0.12, 1400); noise(0.7, 0.15, 3000, 'bandpass'); },
  dark() { tone(500, 0.6, 'sawtooth', 0.12, 40); noise(0.3, 0.1, 300, 'lowpass'); },
  light() { tone(60, 0.4, 'sawtooth', 0.1, 600); },
  tick() { tone(mf(91), 0.04, 'square', 0.05); },
  gold() { arp([84, 87, 89, 91, 94, 96, 99, 101, 103, 106], 0.03, 'sine', 0.12, 0.2); },
  shield() { tone(mf(76), 0.3, 'sine', 0.2, mf(88)); },
  shatter() { noise(0.18, 0.3, 2500); tone(180, 0.15, 'square', 0.1, 60); },
  death() { if (!AU.c) return; noise(0.7, 0.6, 400, 'lowpass'); tone(220, 0.8, 'sawtooth', 0.25, 30); tone(90, 0.5, 'sine', 0.4, 30); },
  best() { arp([72, 76, 79, 84, 79, 84], 0.08, 'square', 0.08, 0.2); },
  drop() { tone(300, 0.25, 'triangle', 0.1, 120); },
  goal() { arp([79, 84, 88], 0.07, 'triangle', 0.12, 0.25); },
  ui() { tone(660, 0.05, 'square', 0.06); },
};
const PROG = [0, -4, -2, -5]; // i - VI - VII - v
const RUSH_MEL = [0, 3, 7, 10, 12, 10, 7, 3, 0, 5, 7, 12, 15, 12, 7, 5];
function bpmNow() { return state === 'play' && run ? 112 + Math.min(run.gear, 9) * 5 : 96; }
function schedule() {
  const c = AU.c; if (!c || c.state !== 'running') return;
  const playing = state === 'play';
  const bpm = bpmNow() * (playing && run.od > 0 ? 1.06 : 1);
  const sd = 60 / bpm / 4;
  while (AU.next < c.currentTime + 0.12) {
    const t = AU.next, st = AU.step % 16, bar = Math.floor(AU.step / 16) % 4;
    const root = 45 + (playing ? run.key : 0) + PROG[bar];
    const m = AU.mus;
    if (playing || state === 'title') {
      if (st % 4 === 0) beatAt(t);
      if (playing && st % 4 === 0) tone(150, 0.14, 'sine', 0.55, 40, m, t);
      if (playing && run.gear >= 2 && (st === 4 || st === 12)) noise(0.12, 0.25, 1800, 'bandpass', m, t);
      if (playing && run.rushOn && st % 2 === 1) noise(0.08, 0.14, 1800, 'bandpass', m, t);
      if (st % 2 === 1 && (playing || st % 4 === 3)) noise(0.03, playing ? 0.12 : 0.05, 9000, 'highpass', m, t);
      if (playing && run.blackout > 0 && st % 4 === 0) tone(mf(root + 36), 0.05, 'square', 0.06, 0, m, t);
      if (st % 2 === 0) tone(mf(root + (st % 8 === 6 ? 12 : 0)), sd * 1.8, 'sawtooth', 0.16, 0, m, t);
      const arpOn = playing && (run.gear >= 3 || run.od > 0);
      if (arpOn || (!playing && st % 4 === 0)) {
        const chd = [0, 3, 7, 10, 12, 7, 3, 15][st % 8];
        tone(mf(root + 24 + chd), sd * 0.9, 'square', arpOn ? 0.05 : 0.035, 0, m, t);
      }
      if (playing && run.rushOn && st % 2 === 0) tone(mf(root + 36 + RUSH_MEL[(AU.step / 2) % 16 | 0]), sd * 1.6, 'square', 0.07, 0, m, t);
    }
    AU.next += sd; AU.step++;
  }
  const target = state === 'play' ? (run.od > 0 || run.rushOn ? 9000 : run.blackout > 0 ? 1600 : 4200) : state === 'over' ? 500 : 900;
  AU.lp.frequency.setTargetAtTime(target, c.currentTime, 0.15);
}
const beats = [];
function beatAt(t) { beats.push(t); if (beats.length > 8) beats.shift(); }
function setMute(m) { save.mute = m; persist(); if (AU.c) AU.master.gain.setTargetAtTime(m ? 0 : 0.85, AU.c.currentTime, 0.02); }

// ---------- game state ----------
let state = 'title';
let run = null, objs = [], parts = [], pops = [], toasts = [];
let shake = 0, hitStop = 0, timeScale = 1, tsTarget = 1, flash = 0, beatPulse = 0, beatClock = 0;
let overT = 0, overInfo = null, titleT = 0, clock = 0, lastInputTouch = false, pausedFrom = null, nextDaily = false;
const player = { side: 1, x: laneX(1), lastFrom: 0, lastT: -9, sq: 0, trail: [], bump: 0, lineFrom: 1 };

function newRun(demo, daily) {
  return {
    demo, daily, t: 0, dist: 0, score: 0, speed: 290, gear: 1, gearT: 0, key: 0, accent: ZONES[0].acc,
    combo: 0, comboT: 0, mult: 1, maxMult: 1, close: 0, perfect: 0, sparks: 0, gold: 0, shifts: 0, threads: 0, rushes: 0,
    od: 0, shield: false, inv: 0, cursor: VT - 140, patterns: 0, pity: 0,
    tutorial: !demo && !save.tut && !daily, script: [], kindUntil: 0, prompt: null, passedBest: false,
    dead: false, nextGoalCheck: 0, rushQueued: false, rushOn: false,
    mirror: 1, flipFrom: 1, flipP: 1, blackout: 0, lastFlipT: 0, lastDarkT: 0, banner: null,
  };
}
function startRun(demo, daily) {
  run = newRun(!!demo, !!daily);
  grng = daily ? mulberry32((parseInt(today().replace(/-/g, ''), 10) * 2654435761) >>> 0) : Math.random;
  objs = []; parts = []; pops = [];
  if (!demo) toasts = [];
  player.side = 1; player.x = laneX(1); player.lastT = -9; player.trail = []; player.sq = 0; player.lineFrom = 1;
  timeScale = tsTarget = 1; hitStop = 0;
  if (run.tutorial) {
    run.kindUntil = 35; run.speed = 250;
    run.script = ['t_right', 't_left', 't_sparks', 't_zig', 't_gold'];
  } else if (!demo && ZONE_START > 1) {
    run.gear = ZONE_START; run.key = (2 * (ZONE_START - 1)) % 12; run.accent = zoneOf(run.gear).acc; run.speed = gearSpeed(run.gear);
    enterZone();
  }
  if (!demo) { state = 'play'; save.tot.runs++; if (daily) save.tot.daily++; persist(); if (!run.tutorial && ZONE_START === 1) showBanner(); }
}
function gearSpeed(g) { return Math.min(1000, 290 + 70 * (g - 1)); }
function gearLen(g) { return FAST ? 6 + g : 26 + 3 * g; }
function showBanner() {
  const z = zoneOf(run.gear);
  run.banner = { title: run.gear >= 7 ? 'OVERTIME ' + (run.gear - 6) : 'GEAR ' + run.gear + ' · ' + z.name,
    sub: z.mech ? (isTouch() ? z.tc : z.kb) : (run.daily ? 'DAILY CHALLENGE · ' + today() : (isTouch() ? 'Tap a side to jump into that world' : 'Left Shift / Right Shift')), t: 3.6 };
}
function enterZone() {
  const z = zoneOf(run.gear);
  if (z.mech === 'shifter') run.script.push('i_shifter');
  if (z.mech === 'prism') run.script.push('i_prism');
  if (z.mech === 'mirror') { run.script.push('flip'); run.lastFlipT = run.t; }
  if (z.mech === 'blackout') { run.script.push('dark'); run.lastDarkT = run.t; }
  if (z.mech === 'double') run.script.push('i_double');
  showBanner();
}
const mSign = () => run ? (run.flipP < 0.5 ? run.flipFrom : run.mirror) : 1;
const mxNow = () => run ? (run.flipP >= 1 ? run.mirror : run.flipFrom * Math.cos(Math.PI * run.flipP)) : 1;

// ---------- object factory ----------
function block(side, len, off, extra) { return Object.assign({ k: 'block', side, len, y: run.cursor - off - len, done: false, slide: 1, from: side, target: side, moves: null }, extra || {}); }
function spark(side, off) { return { k: 'spark', side, y: run.cursor - off, r: side === 0 ? 8 : 9, done: false }; }
function item(kind, side, off) { return { k: kind, side, y: run.cursor - off, r: 16, done: false }; }
function marker(kind, off, extra) { return Object.assign({ k: kind, side: 0, y: run.cursor - off, done: false }, extra || {}); }
function gapFor(v, g) { return 34 + v * Math.max(0.2, 0.42 - 0.025 * g); }
function shiftAtFor(v, k) { return PY - HS - Math.max(k === 2 ? 190 : 270, v * (k === 2 ? 0.38 : 0.56)); }
function finalSide(o) { if (o.moves && o.moves.length) return o.moves[o.moves.length - 1].to; return o.slide < 0.5 ? o.from : o.target; }

function genPattern() {
  const g = run.gear, v = run.speed, out = [];
  let top = 0;
  const add = o => { out.push(o); const off = run.cursor - o.y; if (off > top) top = off; };
  let name;
  if (run.script.length) name = run.script.shift();
  else if (run.demo) name = gw([['single', 30], ['zig', 30], ['long', 12], ['sparkline', 10], ['shifter', g >= 2 ? 14 : 0], ['prism', g >= 3 ? 16 : 0], ['linesparks', g >= 3 ? 8 : 0]]);
  else {
    if ((g === 4 && run.t - run.lastFlipT > 10) || (g >= 7 && run.t - run.lastFlipT > 17)) { name = 'flip'; run.lastFlipT = run.t; }
    else if ((g === 5 && run.t - run.lastDarkT > 11) || (g >= 7 && run.t - run.lastDarkT > 23)) { name = 'dark'; run.lastDarkT = run.t; }
    else {
      const opts = [['single', 26], ['zig', 30 + g * 3], ['long', 12], ['sparkline', g <= 2 ? 12 : 6]];
      if (g >= 2) opts.push(['stair', 12], ['shifter', g === 2 ? 26 : 12 + g]);
      if (g >= 3) opts.push(['prism', g === 3 ? 26 : 14], ['prismzig', g === 3 ? 12 : 10], ['linesparks', 8], ['corridor', 8]);
      if (g >= 4) opts.push(['shiftzig', 8 + g]);
      if (g >= 6) opts.push(['double', g === 6 ? 22 : 12], ['minirush', 10]);
      name = gw(opts);
    }
  }
  const s0 = grng() < 0.5 ? -1 : 1;
  const gp = gapFor(v, g);
  const intro = o => { o.intro = true; return o; };
  switch (name) {
    case 't_right': add(block(1, 170, 0, { teach: true })); break;
    case 't_left': add(block(-1, 170, 0, { teach: true })); break;
    case 't_sparks': for (let i = 0; i < 6; i++) add(spark(1, i * 55)); add(block(-1, 300, 0, { teach: true })); break;
    case 't_zig': { let off = 0; for (let i = 0; i < 4; i++) { add(block(i % 2 ? -1 : 1, 120, off, { teach: true })); off += 270; } break; }
    case 't_gold': for (let i = 0; i < 4; i++) add(spark(-1, i * 50)); add(item('gold', -1, 260)); run.pity = 0; break;
    case 'single': add(block(s0, gi(110, 220), 0)); break;
    case 'zig': {
      const n = Math.min(2 + Math.floor(g / 1.5) + gi(0, 1), 8); let off = 0, s = s0;
      for (let i = 0; i < n; i++) { const len = gi(70, 140); add(block(s, len, off)); off += len + gp + gr(0, 40); s = -s; }
      break;
    }
    case 'long': { const len = gi(420, 760); add(block(s0, len, 0)); for (let o = 60; o < len - 30; o += 70) add(spark(-s0, o)); break; }
    case 'sparkline': { let s = s0; for (let i = 0; i < 10; i++) { if (i % 4 === 3) s = -s; add(spark(s, i * 48)); } break; }
    case 'stair': { let off = 0; for (let i = 0; i < 3; i++) { const len = gi(90, 140); add(block(s0, len, off)); add(spark(s0, off + len + gp * 0.55)); off += len + gp * 1.25 + 40; } break; }
    case 'i_shifter': add(intro(block(s0, 150, 0, { moves: [{ at: shiftAtFor(v, 1), to: -s0 }] }))); run.cursor -= v * 0.8; break;
    case 'shifter': add(block(s0, gi(120, 180), 0, { moves: [{ at: shiftAtFor(v, 1), to: -s0 }] })); break;
    case 'i_double': add(intro(block(s0, 140, 0, { moves: [{ at: shiftAtFor(v, 1), to: -s0 }, { at: shiftAtFor(v, 2), to: s0 }] }))); run.cursor -= v * 0.6; break;
    case 'double': add(block(s0, gi(110, 150), 0, { moves: [{ at: shiftAtFor(v, 1), to: -s0 }, { at: shiftAtFor(v, 2), to: s0 }] })); break;
    case 'shiftzig': {
      let off = 0, s = s0; const n = 3 + Math.min(3, Math.floor(g / 3));
      for (let i = 0; i < n; i++) {
        const len = gi(90, 130);
        if (i === 1) add(block(-s, len, off, { moves: [{ at: shiftAtFor(v, 1), to: s }] })); else add(block(s, len, off));
        off += len + gp + 60; s = -s;
      }
      break;
    }
    case 'corridor': { const len = gi(300, 500); add(block(s0, len, 0)); add(block(-s0, gi(90, 130), len + gp + 20)); for (let o = 40; o < len; o += 80) add(spark(-s0, o)); break; }
    case 'i_prism': {
      for (let i = 0; i < 5; i++) add(spark(0, i * 46));
      add(intro(block(0, 120, 360, { prism: true })));
      run.cursor -= v * 0.7; break;
    }
    case 'prism': { const pre = grng() < 0.5; if (pre) add(block(s0, gi(90, 130), 0)); add(block(0, gi(80, 130), pre ? 130 + gp + 40 : 0, { prism: true })); break; }
    case 'prismzig': {
      let off = 0, s = s0;
      for (let i = 0; i < 4; i++) {
        const len = gi(80, 110);
        if (i === 2) add(block(0, len, off, { prism: true })); else { add(block(s, len, off)); s = -s; }
        off += len + gp + 50;
      }
      break;
    }
    case 'linesparks': {
      let off = 0;
      for (let i = 0; i < 3; i++) { const len = gi(90, 130); add(block(i % 2 ? -s0 : s0, len, off)); add(spark(0, off + len + (gp + 90) / 2)); off += len + gp + 90; }
      break;
    }
    case 'flip': run.cursor -= v * 0.5; add(marker('flip', 0)); run.cursor -= v * 1.1; break;
    case 'dark': {
      run.cursor -= v * 0.3;
      add(marker('dark', 0, { dur: run.gear >= 7 ? 3.5 : 5 }));
      if ((save.seen.blackout || 0) < 2) add(intro(block(s0, 160, v * 0.6)));
      run.cursor -= v * 0.3; break;
    }
    case 'minirush': case 'rush': {
      const beat = 60 / bpmNow(); let step = v * beat;
      const isRush = name === 'rush';
      const minGap = gapFor(v, g) + 10;
      let len = Math.max(70, step * 0.42);
      if (step - len < minGap) { step *= 2; len = Math.max(70, step * 0.4); }
      const n = isRush ? Math.min(4 + g, 10) : 4;
      let s = s0;
      for (let i = 0; i < n; i++) {
        const prism = g >= 3 && i > 0 && i < n - 1 && grng() < 0.22;
        const o = prism ? block(0, len * 0.8, i * step, { prism: true }) : block(s, len, i * step);
        if (isRush) { o.rush = true; if (i === 0) o.rushStart = true; if (i === n - 1) o.rushEnd = true; }
        add(o);
        if (!prism) { if (grng() < 0.72) s = -s; } else s = grng() < 0.5 ? -1 : 1;
      }
      if (isRush) run.cursor -= gp;
      break;
    }
  }
  run.patterns++; run.pity++;
  const roll = grng(), side = grng() < 0.5 ? -1 : 1; // always consumed so the Daily stays deterministic
  let extra = 0;
  if (!run.demo && !run.tutorial && name[1] !== '_' && name !== 'rush' && name !== 'flip') {
    if (run.od <= 0 && (run.pity >= 14 || roll < 0.06)) { add(item('gold', side, top + gp * 0.5 + 20)); run.pity = 0; extra = gp; }
    else if (!run.shield && roll > 0.965 && run.gear >= 2) { add(item('shield', side, top + gp * 0.5 + 20)); extra = gp; }
  }
  for (const o of out) objs.push(o);
  run.cursor -= top + gp + extra + gr(20, 80) + (name === 'sparkline' ? 40 : 0);
  if (name === 't_gold') run.cursor -= 120;
}
function breather() {
  const len = run.speed * 2.0;
  let s = player.side || 1;
  for (let i = 0; i < 14; i++) { if (i === 7) s = -s; objs.push(spark(s, 80 + i * (len - 120) / 14)); }
  run.cursor -= len;
}

// ---------- input ----------
const heldL = new Set(), heldR = new Set(), heldLine = new Set();
function clearHeld() { heldL.clear(); heldR.clear(); heldLine.clear(); }
const canAct = () => state === 'play' && run && !run.dead;
function onDown(s, id, touch) {
  lastInputTouch = !!touch;
  audioInit();
  (s < 0 ? heldL : s > 0 ? heldR : heldLine).add(id);
  if (state === 'title') { SFX.ui(); startRun(false, nextDaily); nextDaily = false; if (s) shiftTo(s); return; }
  if (state === 'over') { if (clock - overT > 0.45) { SFX.ui(); startRun(false, run && run.daily); if (s) shiftTo(s); } return; }
  if (state === 'pause') { state = pausedFrom || 'play'; clearHeld(); return; }
  if (!canAct()) return;
  if (s === 0 || (heldL.size && heldR.size)) { toLine(); return; }
  const w = s * mSign();
  if (w !== player.side) shiftTo(w); else { player.bump = 0.12; SFX.bump(); }
}
function onUp(s, id) {
  (s < 0 ? heldL : s > 0 ? heldR : heldLine).delete(id);
  if (!canAct() || player.side !== 0) return;
  if (heldLine.size || (heldL.size && heldR.size)) return;
  if (heldL.size) shiftTo(-mSign()); else if (heldR.size) shiftTo(mSign()); else shiftTo(player.lineFrom || 1);
}
function shiftTo(target) {
  if (!run || target === player.side) return;
  player.lastFrom = player.side; player.side = target; player.lastT = run.t;
  if (target !== 0) player.lineFrom = target;
  player.sq = 1; run.shifts++;
  if (!run.demo) SFX.shift(target);
  for (let i = 0; i < 10; i++) parts.push({ x: LINE, y: PY + rand(-14, 14), vx: target * rand(80, 380), vy: rand(-120, 120), life: rand(0.2, 0.45), max: 0.45, sz: rand(2, 5) });
}
function toLine() {
  if (!run || player.side === 0) return;
  player.lineFrom = player.side; player.lastFrom = player.side; player.side = 0; player.lastT = run.t; player.sq = 1;
  if (!run.demo) SFX.line();
  for (let i = 0; i < 14; i++) parts.push({ x: LINE, y: PY + rand(-30, 30), vx: rand(-60, 60), vy: rand(-300, 300), life: rand(0.2, 0.5), max: 0.5, sz: rand(2, 4), col: run.accent });
}
const keySide = { ShiftLeft: -1, ShiftRight: 1, ArrowLeft: -1, ArrowRight: 1, KeyA: -1, KeyD: 1, Space: 0, KeyW: 0, ArrowUp: 0 };
function cycleSkin() { audioInit(); save.skin = (save.skin + 1) % skinsUnlocked(); persist(); SFX.ui(); }
function skinsUnlocked() { return Math.min(SKINS.length, 1 + rankOf(doneCount())); }
function goTitle() { state = 'title'; run = null; clearHeld(); }
window.addEventListener('keydown', e => {
  if (e.code === 'KeyM') { audioInit(); setMute(!save.mute); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (state === 'play') { pausedFrom = 'play'; state = 'pause'; clearHeld(); } else if (state === 'pause') state = 'play';
    else if (state === 'over' && e.code === 'Escape') goTitle();
    return;
  }
  let s = keySide[e.code];
  if (s === undefined && e.key === 'Shift') s = e.location === 2 ? 1 : -1;
  if (e.repeat) { if (s !== undefined) e.preventDefault(); return; }
  if (state === 'title' && (e.code === 'ArrowDown' || e.code === 'KeyS')) { e.preventDefault(); nextDaily = true; onDown(1, 'kDaily', false); heldR.delete('kDaily'); return; }
  if (state === 'title' && e.code === 'KeyC') { cycleSkin(); return; }
  if (e.code === 'Enter' && state !== 'play') { e.preventDefault(); onDown(1, 'kEnter', false); heldR.delete('kEnter'); return; }
  if (s === undefined) return;
  e.preventDefault();
  onDown(s, 'k' + (e.code || e.location), false);
}, { passive: false });
window.addEventListener('keyup', e => {
  let s = keySide[e.code];
  if (s === undefined && e.key === 'Shift') s = e.location === 2 ? 1 : -1;
  if (s === undefined) return;
  onUp(s, 'k' + (e.code || e.location));
});
const UI = { daily: null, skin: null, menu: null };
const inBox = (b, x, y) => b && x > b[0] && x < b[2] && y > b[1] && y < b[3];
function muteHit(lx, ly) { return lx > Math.min(VR, W + 200) - 70 && ly < VT + 70; }
const ptrSide = new Map();
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); cv.focus();
  const lx = (e.clientX - OX) / S, ly = (e.clientY - OY) / S;
  if (muteHit(lx, ly) && state !== 'play') { audioInit(); setMute(!save.mute); return; }
  if (state === 'play' && muteHit(lx, ly)) { pausedFrom = 'play'; state = 'pause'; clearHeld(); return; }
  if (state === 'title' && inBox(UI.skin, lx, ly)) { cycleSkin(); return; }
  if (state === 'title' && inBox(UI.daily, lx, ly)) nextDaily = true;
  if (state === 'over' && inBox(UI.menu, lx, ly)) { goTitle(); return; }
  const s = e.clientX < cw / 2 ? -1 : 1;
  ptrSide.set(e.pointerId, s);
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  onDown(s, 'p' + e.pointerId, e.pointerType !== 'mouse');
}, { passive: false });
const ptrUp = e => { const s = ptrSide.get(e.pointerId); if (s === undefined) return; ptrSide.delete(e.pointerId); onUp(s, 'p' + e.pointerId); };
cv.addEventListener('pointerup', ptrUp); cv.addEventListener('pointercancel', ptrUp);
['touchstart', 'touchmove', 'touchend', 'gesturestart', 'dblclick', 'contextmenu'].forEach(ev => document.addEventListener(ev, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') { pausedFrom = 'play'; state = 'pause'; clearHeld(); } });
window.addEventListener('blur', () => { clearHeld(); if (state === 'play' && !AUTOPLAY) { pausedFrom = 'play'; state = 'pause'; } });

// ---------- bot (attract mode + ?autoplay) ----------
let botCool = 0;
function predictSide(o) { let fs = o.slide < 0.5 ? o.from : o.target; if (o.moves) for (const m of o.moves) if (m.at < PY) fs = m.to; return fs; }
function botThink(dt) {
  botCool -= dt; if (botCool > 0) return;
  const look = run.speed * 0.42 + 60;
  const danger = pos => {
    let d = Infinity;
    for (const o of objs) {
      if (o.k !== 'block' || o.done || o.smashed || o.y > PY + HS + 4) continue;
      const fs = predictSide(o);
      const hits = fs === 0 ? pos !== 0 : (pos === 0 || fs === pos);
      if (hits) d = Math.min(d, Math.max(0, PY - HS - (o.y + o.len)));
    }
    return d;
  };
  const cur = player.side, D = { '-1': danger(-1), '0': danger(0), '1': danger(1) };
  const act = to => { if (to === 0) toLine(); else shiftTo(to); botCool = 0.05; };
  if (cur === 0) {
    const best = D['-1'] >= D['1'] ? -1 : 1;
    if (D[best] >= look * 0.8 || D[best] > D['0']) act(best);
    return;
  }
  if (D[cur] < look) {
    if (D[-cur] > D[cur] + 10 && D[-cur] >= D['0']) act(-cur);
    else if (D['0'] > D[cur] + 10) act(0);
    return;
  }
  if (D[-cur] > look * 1.6) {
    for (const o of objs) if ((o.k === 'spark' || o.k === 'gold' || o.k === 'shield') && !o.done && o.side === -cur && o.y > PY - look && o.y < PY) { act(-cur); botCool = 0.12; return; }
  }
  if (D['0'] > look * 1.3) {
    for (const o of objs) if (o.k === 'spark' && o.side === 0 && !o.done && o.y > PY - 60 && o.y < PY) { act(0); botCool = 0.1; return; }
  }
}

// ---------- update ----------
function addPop(text, x, y, size, col, life) { pops.push({ text, x, y, size: size || 26, col: col || null, life: life || 0.9, max: life || 0.9 }); }
function toast(text, col) { toasts.push({ text, col: col || (run ? run.accent : ZONES[0].acc), life: 2.6, max: 2.6 }); }
function burst(x, y, n, spd, col) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(spd * 0.3, spd); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.9), max: 0.9, sz: rand(2, 7), col }); } }
function addCombo(n) { run.combo += n; run.comboT = 3; const m = Math.min(8, 1 + Math.floor(run.combo / 5)); if (m > run.mult) { run.mult = m; if (!run.demo) { addPop('x' + m, LINE, PY - 90, 40, run.accent, 1); SFX.goal(); } } run.maxMult = Math.max(run.maxMult, run.mult); }
function gain(pts) { run.score += pts * run.mult; }
function onBeat() { beatPulse = 1; if (run && run.blackout > 0 && state === 'play') SFX.tick(); }

function update(rdt) {
  clock += rdt;
  beatPulse = Math.max(0, beatPulse - rdt * 4);
  if (audioOn()) { while (beats.length && beats[0] <= AU.c.currentTime) { beats.shift(); onBeat(); } }
  else { beatClock += rdt; const bd = 60 / bpmNow(); if (beatClock >= bd) { beatClock -= bd; onBeat(); } }
  if (state === 'pause') return;
  if (state === 'title') {
    titleT += rdt;
    if (!run || !run.demo || run.dead) { startRun(true); if (COVER) coverScene(); }
    if (COVER) { updateFx(rdt); return; }
  }
  if (hitStop > 0) { hitStop -= rdt; updateFx(rdt * 0.15); return; }
  timeScale += (tsTarget - timeScale) * Math.min(1, rdt * 12);
  const dt = rdt * timeScale;
  if (state === 'over') { updateWorld(dt * 0.25, rdt); updateFx(rdt); return; }
  updateWorld(dt, rdt);
  updateFx(rdt);
}

function updateWorld(dt, rdt) {
  if (!run) return;
  const R = run;
  const tx = player.side === 0 ? LINE : laneX(player.side);
  const dx = tx - player.x, step = rdt * 2100;
  player.x += Math.abs(dx) < step ? dx : Math.sign(dx) * step;
  player.sq = Math.max(0, player.sq - rdt * 6); player.bump = Math.max(0, player.bump - rdt);
  player.trail.push({ x: player.x, y: PY }); if (player.trail.length > 10) player.trail.shift();
  if (R.flipP < 1) R.flipP = Math.min(1, R.flipP + rdt / 0.75);
  if (R.banner) { R.banner.t -= rdt; if (R.banner.t <= 0) R.banner = null; }
  if (R.dead) { for (const o of objs) o.y += R.speed * dt * 0.3; return; }

  R.t += dt;
  if (!R.demo && state === 'play') {
    R.gearT += dt;
    if (!R.tutorial && !R.rushQueued && R.gearT >= gearLen(R.gear) - 2) { R.rushQueued = true; R.script.unshift('rush'); }
    if (R.tutorial && R.t > 30 && !R.script.length) { R.tutorial = false; save.tut = true; persist(); toast('Tutorial done. Now it gets real.'); R.gearT = Math.max(R.gearT, gearLen(R.gear) - 8); showBanner(); }
  }
  if (R.demo && R.t > 22 && R.gear < 3) { R.gear++; R.key += 2; R.accent = zoneOf(R.gear).acc; R.t = 0; }
  const base = R.tutorial ? 250 : gearSpeed(R.gear) * (1 + Math.min(0.15, R.gearT * 0.006));
  R.speed += (base * (R.od > 0 ? 1.12 : 1) - R.speed) * Math.min(1, dt * 2);
  const v = R.speed * dt;
  R.dist += v; R.cursor += v;
  if (!R.demo) gain(R.speed * dt * 0.02);
  let guard = 0;
  while (R.cursor > VT - 120 && guard++ < 20) genPattern();
  if (R.od > 0) { R.od -= dt; if (R.od <= 0 && !R.demo) addPop('OVERDRIVE OVER', LINE, PY - 160, 22); }
  if (R.inv > 0) R.inv -= dt;
  if (R.blackout > 0) { R.blackout -= dt; if (R.blackout <= 0 && !R.demo) { SFX.light(); addPop('LIGHTS ON', LINE, PY - 200, 26, R.accent); } }
  if (R.comboT > 0) { R.comboT -= dt; if (R.comboT <= 0) { if (R.combo >= 5 && !R.demo) { addPop('COMBO DROPPED', LINE, PY - 120, 22, '#888'); SFX.drop(); } R.combo = 0; R.mult = 1; } }

  const pside = player.x < LINE - 12 ? -1 : player.x > LINE + 12 ? 1 : 0;
  const pt = PY - HS, pb = PY + HS;
  R.prompt = null; let slow = 1, rushVisible = false;
  for (const o of objs) {
    const prevBottom = o.y + (o.len || 0);
    o.y += v;
    if (o.k === 'flip' || o.k === 'dark') {
      if (!o.done && o.y >= PY - 10) { o.done = true; if (o.k === 'flip') doFlip(); else doDark(o.dur); }
      if (!o.done && o.k === 'flip' && o.y > PY - 260 && (save.seen.mirror || 0) < 2 && !R.demo) slow = Math.min(slow, 0.45);
      continue;
    }
    if (o.k === 'block') {
      if (o.moves && o.moves.length && o.y + o.len >= o.moves[0].at) {
        const m = o.moves.shift(); o.from = o.side; o.target = m.to; o.slide = 0; if (!R.demo) SFX.wallJump();
      }
      if (o.slide < 1) { o.slide = Math.min(1, o.slide + dt / 0.16); if (o.slide >= 0.5) o.side = o.target; }
      if (o.rush && o.y + o.len > VT && !o.passed) rushVisible = true;
      if (o.rushStart && !o.announced && o.y + o.len > VT && !R.demo) { o.announced = true; SFX.rush(); addPop('RUSH!', LINE, 260, 54, R.accent, 1.2); shake = Math.max(shake, 4); }
      if (o.prism && !o.chimed && o.y + o.len > VT && !R.demo) { o.chimed = true; SFX.prismNear(); }
      if (o.rushEnd && !o.gearDone && (o.y > pb || o.smashed)) { o.gearDone = true; R.rushes++; if (!R.demo) { save.tot.rush++; gearUp(); } }
      if (o.done || o.smashed) { if (o.y > pb) o.passed = true; continue; }
      const bottom = o.y + o.len;
      if (R.tutorial && o.teach && o.side === player.side && bottom > pt - 230 && o.y < pb) { slow = 0.1; R.prompt = -o.side; }
      if (o.intro && !R.demo && bottom > pt - 300 && o.y < pb) {
        const mech = o.prism ? 'prism' : o.moves !== null ? (zoneOf(R.gear).mech === 'double' ? 'double' : 'shifter') : 'blackout';
        if ((save.seen[mech] || 0) < 2) { slow = Math.min(slow, 0.4); o.introMech = mech; }
        if (o.prism && player.side !== 0) R.prompt = 'line';
      }
      const hit = o.side === 0 ? pside !== 0 : (pside === 0 || pside === o.side);
      if (bottom > pt && o.y < pb && hit) {
        if (R.od > 0 || R.inv > 0) { smash(o, R.od > 0 ? 'SMASH' : null); continue; }
        if (R.shield) { R.shield = false; R.inv = 1; smash(o, 'SHIELD!'); SFX.shield(); continue; }
        if (!R.demo && R.t < R.kindUntil) { smash(o, 'FREE SAVE!'); R.inv = 0.6; toast('First shift is on the house!'); continue; }
        die(); return;
      }
      if (prevBottom <= pt && bottom > pt && !R.demo) {
        const since = R.t - player.lastT;
        if (o.side === 0) {
          if (pside === 0) {
            R.threads++; save.tot.thread++;
            if (since < 0.35) { const pf = since < 0.15; gain(pf ? 150 : 75); addCombo(3); hitStop = 0.04; addPop(pf ? 'PERFECT THREAD!' : 'THREADED!', LINE, PY - 70, 30, R.accent); burst(LINE, PY, 16, 380, R.accent); if (pf) { R.perfect++; save.tot.perfect++; } R.close++; save.tot.close++; }
            else { gain(25); addCombo(1); addPop('THREAD', LINE, PY - 60, 20); }
            SFX.thread();
          }
        } else if (player.lastFrom === o.side && pside !== o.side && since < 0.35) {
          if (since < 0.15 && !R.tutorial) { R.perfect++; save.tot.perfect++; gain(100); addCombo(3); hitStop = 0.045; shake = Math.max(shake, 5); addPop('PERFECT!', laneX(-o.side), PY - 70, 34, R.accent); SFX.perfect(); burst(LINE, PY, 18, 420, R.accent); flash = 0.25; }
          else { gain(50); addCombo(2); addPop('CLOSE!', laneX(-o.side), PY - 60, 26); SFX.close(); burst(LINE, PY, 8, 260); }
          R.close++; save.tot.close++;
        }
      }
      if (o.y > pb) { o.done = true; o.passed = true; if (o.introMech) save.seen[o.introMech] = (save.seen[o.introMech] || 0) + 1; }
    } else if (!o.done) {
      if (R.od > 0 && o.k === 'spark' && o.side === pside && o.y > PY - 260 && o.y < PY) o.y += v * 0.6;
      if (Math.abs(o.y - PY) < HS + o.r && pside === o.side) {
        o.done = true;
        if (R.demo) continue;
        if (o.k === 'spark') {
          R.sparks++; save.tot.sparks++; addCombo(1);
          if (o.side === 0) { gain(25); SFX.lineSpark(); burst(LINE, o.y, 10, 200, R.accent); addPop('+' + 25 * R.mult, LINE + 46, o.y - 10, 18, R.accent); }
          else { gain(10); SFX.spark(R.combo); burst(laneX(o.side), o.y, 6, 160); addPop('+' + 10 * R.mult, laneX(o.side) + o.side * 40, o.y - 10, 16); }
        } else if (o.k === 'gold') { R.gold++; save.tot.gold++; R.od = 5; gain(250); addCombo(5); SFX.gold(); flash = 0.6; shake = 10; hitStop = 0.07; burst(laneX(o.side), o.y, 40, 520, '#facc15'); addPop('OVERDRIVE!', LINE, PY - 200, 46, '#facc15', 1.4); }
        else if (o.k === 'shield') { R.shield = true; SFX.shield(); burst(laneX(o.side), o.y, 20, 300, '#22d3ee'); addPop('SHIELD', LINE, PY - 150, 30, '#22d3ee'); }
      }
    }
  }
  R.rushOn = rushVisible;
  if (R.flipP < 1) slow = Math.min(slow, 0.35);
  tsTarget = slow;
  objs = objs.filter(o => o.y < VB + 40 && !(o.done && o.k !== 'block'));
  if (R.demo || state !== 'play') { if (R.demo) botThink(dt); return; }
  if (AUTOPLAY) botThink(dt);
  const bestDist = R.daily ? save.daily.dist : save.bestDist, bestScore = R.daily ? save.daily.best : save.best;
  if (!R.passedBest && bestDist > 0 && R.dist >= bestDist && bestScore > 0) { R.passedBest = true; addPop('PAST YOUR BEST!', LINE, PY - 240, 30, R.accent, 1.4); SFX.best(); }
  const rb = save.rb;
  rb.score = Math.max(rb.score, Math.floor(R.score)); rb.gear = Math.max(rb.gear, R.gear); rb.close = Math.max(rb.close, R.close);
  rb.perfect = Math.max(rb.perfect, R.perfect); rb.mult = Math.max(rb.mult, R.maxMult); rb.time = Math.max(rb.time, Math.floor(R.t)); rb.sparks = Math.max(rb.sparks, R.sparks);
  if (clock > R.nextGoalCheck) { R.nextGoalCheck = clock + 0.25; checkGoals(true); }
}
function doFlip() {
  const R = run; R.flipFrom = R.mirror; R.mirror = -R.mirror; R.flipP = 0;
  if (R.demo) return;
  SFX.flip(); shake = Math.max(shake, 8); flash = 0.4;
  addPop('MIRROR!', LINE, 300, 52, R.accent, 1.3);
  save.seen.mirror = (save.seen.mirror || 0) + 1;
  for (let i = 0; i < 40; i++) parts.push({ x: LINE + rand(-200, 200), y: rand(VT, VB), vx: rand(-500, 500), vy: rand(-40, 40), life: rand(0.3, 0.8), max: 0.8, sz: rand(2, 6) });
}
function doDark(dur) {
  run.blackout = dur;
  if (run.demo) return;
  SFX.dark(); flash = 0.3; addPop('BLACKOUT', LINE, 300, 50, run.accent, 1.3);
}
function goalVal(gl) { return Math.min(gl.n, (gl.k === 'tot' ? save.tot : save.rb)[gl.s] || 0); }
function goalProg(gl) { const v = (gl.k === 'tot' ? save.tot : save.rb)[gl.s] || 0; if (gl.s === 'gear' || gl.s === 'mult') return clamp((v - 1) / (gl.n - 1), 0, 1); return Math.min(1, v / gl.n); }
function checkGoals(live) {
  save.gdone = save.gdone || [];
  let changed = false;
  for (let i = 0; i < GOALS.length; i++) {
    if (save.gdone[i]) continue;
    if (i >= save.goals + 3) break;
    if (goalProg(GOALS[i]) >= 1) { save.gdone[i] = 1; changed = true; if (live) { toast('GOAL ✓ ' + GOALS[i].t); SFX.goal(); } }
  }
  while (save.gdone[save.goals]) save.goals++;
  if (changed) {
    const before = rankOf(save.lastRankGoals || 0), nowR = rankOf(doneCount()); save.lastRankGoals = doneCount();
    if (nowR > before && live) { toast('RANK UP: ' + RANKS[nowR], '#facc15'); if (nowR < SKINS.length) toast('New skin: ' + SKINS[nowR] + ' (press C on the title)', '#facc15'); }
    persist();
  }
}
function doneCount() { return (save.gdone || []).filter(Boolean).length; }
function rankOf(n) { return Math.min(RANKS.length - 1, Math.floor(n / 2)); }
function activeGoalList() { const out = []; save.gdone = save.gdone || []; for (let i = save.goals; i < GOALS.length && out.length < 3; i++) if (!save.gdone[i]) out.push(GOALS[i]); return out; }

function gearUp() {
  const R = run; R.gear++; R.gearT = 0; R.rushQueued = false; R.key = (R.key + 2) % 12; R.accent = zoneOf(R.gear).acc;
  objs = objs.filter(o => o.y > VT - 20);
  R.cursor = Math.min(VT - 40, ...objs.map(o => o.y));
  R.script = R.script.filter(n => n !== 'rush');
  breather();
  enterZone();
  SFX.gear(); flash = 0.35; shake = Math.max(shake, 6);
  addPop(R.gear <= 6 ? 'GEAR ' + R.gear : 'OVERTIME ' + (R.gear - 6), LINE, 300, 56, R.accent, 1.6);
  addPop('KEY SHIFT ▲', LINE, 350, 18, null, 1.6);
  burst(LINE, PY, 30, 600, R.accent);
}
function smash(o, label) {
  o.smashed = true; o.done = true;
  const x = o.side === 0 ? LINE : LINE + o.side * 120, y = clamp(PY - 40, o.y, o.y + o.len);
  burst(x, y, 30, 520); burst(x, y, 10, 300, run.accent);
  gain(100); shake = Math.max(shake, 8); hitStop = 0.04;
  if (!run.demo) SFX.shatter();
  if (label) addPop(label, LINE, PY - 110, 28, run.accent);
}
function die() {
  const R = run; R.dead = true;
  if (R.demo) { startRun(true); return; }
  hitStop = 0.14; shake = 22; flash = 1; tsTarget = 0.25;
  burst(player.x, PY, 60, 700); burst(player.x, PY, 20, 400, R.accent);
  SFX.death();
  const score = Math.floor(R.score);
  const prevBest = R.daily ? save.daily.best : save.best;
  const newBest = score > prevBest;
  if (newBest) { if (R.daily) { save.daily.best = score; save.daily.dist = R.dist; } else { save.best = score; save.bestDist = R.dist; } setTimeout(() => SFX.best(), 700); }
  save.lastScore = score; save.tut = true;
  checkGoals(false); persist();
  let msg = null;
  if (newBest && prevBest > 0) msg = 'NEW BEST! +' + fmt(score - prevBest);
  else if (newBest) msg = R.daily ? 'First Daily score today!' : 'First score on the board!';
  else if (score >= prevBest * 0.8) msg = 'SO CLOSE: only ' + fmt(prevBest - score) + ' from your best!';
  if (!msg && R.gear < 7 && (R.rushQueued || gearLen(R.gear) - R.gearT < 8)) msg = 'So close to ' + zoneOf(R.gear + 1).name + '!';
  if (!msg) {
    let bestG = null, bp = 0;
    for (const gl of activeGoalList()) { const p = goalProg(gl); if (p > bp) { bp = p; bestG = gl; } }
    if (bestG && bp >= 0.5) msg = 'Almost: ' + bestG.t + ' (' + fmt(goalVal(bestG)) + '/' + fmt(bestG.n) + ')';
  }
  overInfo = { score, newBest, best: R.daily ? save.daily.best : save.best, daily: R.daily, dist: Math.floor(R.dist / 40), gear: R.gear, close: R.close, perfect: R.perfect, sparks: R.sparks, mult: R.maxMult, time: R.t, msg, tip: pick(TIPS), threads: R.threads, rushes: R.rushes };
  setTimeout(() => { if (run === R) { state = 'over'; overT = clock; tsTarget = 1; clearHeld(); } }, 650);
  window.__game.deaths++;
}
function updateFx(dt) {
  shake = Math.max(0, shake - dt * 60);
  flash = Math.max(0, flash - dt * 2.5);
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; p.life -= dt; }
  parts = parts.filter(p => p.life > 0); if (parts.length > 450) parts.splice(0, parts.length - 450);
  for (const p of pops) { p.y -= 40 * dt; p.life -= dt; }
  pops = pops.filter(p => p.life > 0);
  for (const t of toasts) t.life -= dt;
  toasts = toasts.filter(t => t.life > 0);
}
function coverScene() {
  objs = [
    { k: 'block', side: 1, y: 455, len: 175, done: false, slide: 1, from: 1, target: 1, moves: null },
    { k: 'block', side: -1, y: 20, len: 120, done: false, slide: 1, from: -1, target: -1, moves: null },
    { k: 'block', side: 0, prism: true, y: -150, len: 110, done: false, slide: 1, from: 0, target: 0, moves: null },
  ];
  for (let i = 0; i < 3; i++) objs.push({ k: 'spark', side: -1, y: 512 + i * 36, r: 9, done: false });
  objs.push({ k: 'gold', side: 1, y: 730, r: 16, done: false });
  player.side = -1; player.x = laneX(-1); player.sq = 0.5; player.lastT = 0;
  for (let i = 0; i < 18; i++) parts.push({ x: LINE - rand(5, 70), y: PY + rand(-14, 14), vx: 0, vy: 0, life: 99, max: 99, sz: rand(2, 6) });
  run.accent = ZONES[0].acc;
}

// ---------- drawing ----------
function setT(sx, sy) { cx.setTransform(S * dpr, 0, 0, S * dpr, (OX + sx) * dpr, (OY + sy) * dpr); }
function text(str, x, y, size, align, weight, col, base) {
  cx.font = (weight || 800) + ' ' + size + 'px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  cx.textAlign = align || 'center'; cx.textBaseline = base || 'middle';
  if (col) cx.fillStyle = col;
  cx.fillText(str, x, y);
}
function rr(x, y, w, h, r) { cx.beginPath(); if (cx.roundRect) cx.roundRect(x, y, w, h, r); else cx.rect(x, y, w, h); }
function shapePath(skin, s) {
  cx.beginPath();
  switch (SKINS[skin] || 'Square') {
    case 'Diamond': cx.moveTo(0, -s * 1.25); cx.lineTo(s * 1.25, 0); cx.lineTo(0, s * 1.25); cx.lineTo(-s * 1.25, 0); cx.closePath(); break;
    case 'Circle': cx.arc(0, 0, s * 1.1, 0, Math.PI * 2); break;
    case 'Hexagon': for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; cx.lineTo(Math.cos(a) * s * 1.15, Math.sin(a) * s * 1.15); } cx.closePath(); break;
    case 'Star': for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? s * 0.6 : s * 1.35; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); break;
    case 'Plus': { const a = s * 0.42, b = s * 1.15; cx.moveTo(-a, -b); cx.lineTo(a, -b); cx.lineTo(a, -a); cx.lineTo(b, -a); cx.lineTo(b, a); cx.lineTo(a, a); cx.lineTo(a, b); cx.lineTo(-a, b); cx.lineTo(-a, a); cx.lineTo(-b, a); cx.lineTo(-b, -a); cx.lineTo(-a, -a); cx.closePath(); break; }
    case 'Ring': cx.arc(0, 0, s * 1.15, 0, Math.PI * 2); cx.moveTo(s * 0.55, 0); cx.arc(0, 0, s * 0.55, 0, Math.PI * 2, true); break;
    default: cx.rect(-s, -s, s * 2, s * 2);
  }
}
function wallSpans(o) {
  const L = [VL - 10, LINE - 3], Rr = [LINE + 3, VR + 10];
  if (o.prism) return [[VL - 10, LINE - SLIT], [LINE + SLIT, VR + 10]];
  if (o.slide < 1) {
    const e = 1 - Math.pow(1 - o.slide, 3), f = o.from < 0 ? L : Rr, t = o.target < 0 ? L : Rr;
    return [[f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e]];
  }
  return [o.side < 0 ? L : Rr];
}
function drawMotif(R, motif) {
  const d = R ? R.dist : clock * 300;
  if (motif === 6) motif = Math.floor(clock / 5) % 6;
  cx.globalAlpha = 0.06;
  if (motif === 0 || motif === 4) { const sc = d % 80; for (let y = VT - 80 + sc; y < VB; y += 80) cx.fillRect(VL, y, VR - VL, 2); }
  if (motif === 1) { const sc = d % 90, k = (VR - VL) * 0.35; cx.beginPath(); for (let y = VT - k - 90 + sc; y < VB; y += 90) { cx.moveTo(VL, y); cx.lineTo(VR, y + k); cx.lineTo(VR, y + k + 3); cx.lineTo(VL, y + 3); cx.closePath(); } cx.fill(); }
  if (motif === 2) { const sc = d % 120; cx.beginPath(); for (let y = VT - 120 + sc; y < VB; y += 120) for (let x = LINE - 455; x < LINE + 455; x += 70) { cx.moveTo(x, y); cx.lineTo(x + 18, y + 30); cx.lineTo(x - 18, y + 30); cx.closePath(); } cx.fill(); }
  if (motif === 3) { const sc = d % 60; for (let y = VT - 60 + sc; y < VB; y += 60) for (let q = 1; q < 9; q++) { cx.fillRect(LINE - q * 34 - 1, y, 2, 18); cx.fillRect(LINE + q * 34 - 1, y, 2, 18); } }
  if (motif === 5) { cx.globalAlpha = 0.1; for (let i = 0; i < 16; i++) { const lx = LINE + (i % 2 ? 1 : -1) * (30 + (i * 37) % 210); const ly = ((d * 2.2) + i * 113) % (VB - VT + 300) + VT - 150; cx.fillRect(lx, ly, 2, 90 + (R ? R.speed / 8 : 20)); } }
  cx.globalAlpha = 0.08;
  for (let i = 0; i < 6; i++) { const lx = LINE + (i % 2 ? 1 : -1) * (40 + (i * 53) % 190); const ly = ((d * 1.7) + i * 191) % (VB - VT + 200) + VT - 100; cx.fillRect(lx, ly, 2, 60 + (R ? R.speed / 12 : 20)); }
  cx.globalAlpha = 1;
}
function draw() {
  const sx = shake ? rand(-shake, shake) * 0.5 : 0, sy = shake ? rand(-shake, shake) * 0.5 : 0;
  const R = run, mx = mxNow();
  const acc = R ? R.accent : ZONES[0].acc;
  const sxw = x => LINE + (x - LINE) * mx;
  setT(0, 0);
  cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1;
  const tgt = R ? R.mirror : 1;
  cx.fillStyle = tgt > 0 ? LIGHT : DARK; cx.fillRect(VL - 20, VT - 20, LINE - VL + 20, VB - VT + 40);
  cx.fillStyle = tgt > 0 ? DARK : LIGHT; cx.fillRect(LINE, VT - 20, VR - LINE + 20, VB - VT + 40);
  setT(sx, sy);
  cx.save();
  cx.translate(LINE, 0); cx.scale(Math.abs(mx) < 0.002 ? 0.002 : mx, 1); cx.translate(-LINE, 0);
  cx.fillStyle = LIGHT; cx.fillRect(VL - 20, VT - 20, LINE - VL + 20, VB - VT + 40);
  cx.fillStyle = DARK; cx.fillRect(LINE, VT - 20, VR - LINE + 20, VB - VT + 40);
  cx.globalCompositeOperation = 'difference'; cx.fillStyle = '#ffffff';
  drawMotif(R, R ? zoneOf(R.gear).motif : 0);
  let bestY = null;
  if (R && !R.demo && state !== 'title') {
    const bd = R.daily ? save.daily.dist : save.bestDist;
    if (bd > 0) { const by = PY - (bd - R.dist); if (by > VT - 20 && by < VB) { bestY = by; cx.globalAlpha = R.passedBest ? 0.35 : 0.8; for (let x = VL; x < VR; x += 22) cx.fillRect(x, by, 12, 3); cx.globalAlpha = 1; } }
  }
  const cutY = PY - 330, dark = R && R.blackout > 0 && state !== 'title';
  const darkA = o => { if (!dark) return 1; if (o.y + (o.len || 0) > cutY) return 1; return Math.max(0.13, beatPulse * 1.1 - 0.05); };
  if (R) for (const o of objs) {
    if (o.k !== 'block' || o.smashed) continue;
    const a = darkA(o); if (a <= 0.01) continue;
    for (const [x0, x1] of wallSpans(o)) {
      cx.globalAlpha = a; cx.fillRect(x0, o.y, x1 - x0, o.len);
      cx.globalAlpha = 0.45 * a; cx.fillRect(x0, o.y + o.len - 8, x1 - x0, 3);
      if (o.prism) {
        cx.globalAlpha = 0.35 * a; cx.save(); cx.beginPath(); cx.rect(x0, o.y, x1 - x0, o.len); cx.clip(); cx.beginPath();
        for (let q = -o.len; q < x1 - x0 + o.len; q += 22) { cx.moveTo(x0 + q, o.y); cx.lineTo(x0 + q + 10, o.y); cx.lineTo(x0 + q + 10 + o.len, o.y + o.len); cx.lineTo(x0 + q + o.len, o.y + o.len); cx.closePath(); }
        cx.fill(); cx.restore();
      }
    }
    if (o.moves && o.moves.length && o.slide >= 1) {
      const nm = o.moves.length, dir = o.moves[0].to;
      cx.globalAlpha = ((Math.sin(clock * 18) > 0) ? 1 : 0.55) * a;
      const ax = LINE + o.side * 110;
      cx.beginPath();
      for (let q = -1; q <= 1; q++) {
        const yy = o.y + o.len / 2 + q * 34;
        if (yy < o.y + 12 || yy > o.y + o.len - 12) continue;
        for (let n = 0; n < nm; n++) { const off = n * 22 * -dir; cx.moveTo(ax + off - dir * 26, yy - 14); cx.lineTo(ax + off + dir * 18, yy); cx.lineTo(ax + off - dir * 26, yy + 14); cx.lineTo(ax + off - dir * 14, yy); cx.closePath(); }
      }
      cx.fill();
    }
    cx.globalAlpha = 1;
  }
  if (R) for (const o of objs) {
    if (o.done || o.k !== 'spark' || o.side === 0) continue;
    cx.globalAlpha = darkA(o);
    const x = laneX(o.side), r = o.r * (1 + 0.15 * Math.sin(clock * 10 + o.y * 0.05));
    cx.beginPath(); cx.moveTo(x, o.y - r); cx.lineTo(x + r * 0.7, o.y); cx.lineTo(x, o.y + r); cx.lineTo(x - r * 0.7, o.y); cx.closePath(); cx.fill();
  }
  cx.globalAlpha = 1;
  for (const p of parts) if (!p.col) { cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); }
  cx.globalAlpha = 1;
  if (R && !R.dead) {
    for (let i = 0; i < player.trail.length; i++) { const t = player.trail[i]; cx.globalAlpha = (i / player.trail.length) * 0.25; cx.save(); cx.translate(t.x, t.y + (player.trail.length - i) * 3); shapePath(save.skin, PSZ * 0.3); cx.fill('evenodd'); cx.restore(); }
    cx.globalAlpha = 1;
    const sq = player.sq, bx = player.bump > 0 ? Math.sin(player.bump * 80) * 4 : 0;
    cx.save(); cx.translate(player.x + bx, PY); cx.rotate(((player.side || 1) * sq) * 0.6); cx.scale(1 + 0.35 * sq, 1 - 0.25 * sq);
    shapePath(save.skin, PSZ); cx.fill('evenodd'); cx.restore();
  }
  cx.globalCompositeOperation = 'source-over';
  if (dark) {
    const g = cx.createLinearGradient(0, cutY - 120, 0, cutY);
    g.addColorStop(0, 'rgba(20,16,40,' + (0.42 * (1 - beatPulse)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(20,16,40,0)');
    cx.fillStyle = 'rgba(20,16,40,' + (0.42 * (1 - beatPulse)).toFixed(3) + ')'; cx.fillRect(VL, VT, VR - VL, cutY - 120 - VT);
    cx.fillStyle = g; cx.fillRect(VL, cutY - 120, VR - VL, 120);
    cx.fillStyle = acc; cx.globalAlpha = 0.55 + 0.45 * beatPulse;
    for (let x = VL; x < VR; x += 18) cx.fillRect(x, cutY, 10, 2);
    cx.globalAlpha = 1;
  }
  const lw = 3 + beatPulse * 3 + (R && R.od > 0 ? 3 : 0) + (player.side === 0 && state === 'play' ? 3 : 0);
  cx.fillStyle = acc; cx.globalAlpha = 0.16; cx.fillRect(LINE - lw * 1.6, VT - 20, lw * 3.2, VB - VT + 40);
  cx.globalAlpha = 1; cx.fillRect(LINE - lw / 2, VT - 20, lw, VB - VT + 40);
  if (R) {
    for (const o of objs) {
      if (o.done) continue;
      if (o.k === 'block' && o.prism && !o.smashed) {
        cx.globalAlpha = darkA(o) * (0.7 + 0.3 * Math.sin(clock * 12));
        cx.fillStyle = acc; cx.fillRect(LINE - SLIT, o.y, 3, o.len); cx.fillRect(LINE + SLIT - 3, o.y, 3, o.len); cx.globalAlpha = 1;
      }
      if (o.k === 'spark' && o.side === 0) {
        const a = darkA(o); if (a <= 0.01) continue; cx.globalAlpha = a;
        const r = o.r * (1 + 0.2 * Math.sin(clock * 12 + o.y * 0.05));
        cx.fillStyle = '#fff'; cx.beginPath(); cx.moveTo(LINE, o.y - r * 1.3); cx.lineTo(LINE + r, o.y); cx.lineTo(LINE, o.y + r * 1.3); cx.lineTo(LINE - r, o.y); cx.closePath(); cx.fill();
        cx.strokeStyle = '#0e0d14'; cx.lineWidth = 2; cx.stroke(); cx.globalAlpha = 1;
      }
      if (o.k === 'gold' || o.k === 'shield') {
        const x = laneX(o.side), r = o.r + Math.sin(clock * 8) * 2, c = o.k === 'gold' ? '#facc15' : '#22d3ee', a = darkA(o);
        cx.globalAlpha = 0.3 * a; cx.fillStyle = c; cx.beginPath(); cx.arc(x, o.y, r * 2, 0, 7); cx.fill();
        cx.globalAlpha = a; cx.save(); cx.translate(x, o.y); cx.rotate(clock * 2); cx.beginPath();
        if (o.k === 'gold') { for (let i = 0; i < 6; i++) { const q = i * Math.PI / 3; cx.lineTo(Math.cos(q) * r, Math.sin(q) * r); } } else cx.arc(0, 0, r, 0, 7);
        cx.closePath(); cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.stroke(); cx.restore(); cx.globalAlpha = 1;
      }
      if (o.k === 'flip' || o.k === 'dark') {
        cx.fillStyle = acc; cx.globalAlpha = 0.9;
        for (let x = VL; x < VR; x += 26) cx.fillRect(x, o.y - 3, 16, 6);
        cx.globalAlpha = 0.18; cx.fillRect(VL, o.y - 22, VR - VL, 44); cx.globalAlpha = 1;
      }
    }
    if (!R.dead) {
      if (R.shield) { cx.strokeStyle = '#22d3ee'; cx.lineWidth = 3; cx.beginPath(); cx.arc(player.x, PY, PSZ * 1.6 + Math.sin(clock * 6) * 2, 0, 7); cx.stroke(); }
      if (R.od > 0) { cx.fillStyle = '#facc15'; cx.globalAlpha = 0.35 + 0.2 * Math.sin(clock * 20); cx.beginPath(); cx.arc(player.x, PY, PSZ * 2.2, 0, 7); cx.fill(); cx.globalAlpha = 1; }
      if (player.side === 0) { cx.strokeStyle = acc; cx.lineWidth = 3; cx.globalAlpha = 0.85; cx.beginPath(); cx.arc(player.x, PY, PSZ * 1.5 + beatPulse * 4, 0, 7); cx.stroke(); cx.globalAlpha = 1; }
      if (R.inv > 0 && !R.od) { cx.strokeStyle = acc; cx.globalAlpha = 0.6; cx.lineWidth = 2; cx.strokeRect(player.x - PSZ * 1.3, PY - PSZ * 1.3, PSZ * 2.6, PSZ * 2.6); cx.globalAlpha = 1; }
    }
  }
  for (const p of parts) if (p.col) { cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillStyle = p.col; cx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); }
  cx.globalAlpha = 1;
  cx.restore();
  // un-mirrored overlays
  if (R && bestY !== null) { cx.globalCompositeOperation = 'difference'; cx.globalAlpha = R.passedBest ? 0.35 : 0.8; text('BEST ' + fmt(R.daily ? save.daily.best : save.best), LINE + 70, bestY - 14, 16, 'center', 800, '#fff'); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; }
  if (R && state !== 'title') for (const o of objs) if ((o.k === 'flip' || o.k === 'dark') && !o.done) text(o.k === 'flip' ? '⇄  MIRROR  ⇄' : '◐  BLACKOUT  ◐', LINE, o.y - 32, 18, 'center', 900, acc);
  if (R && state === 'play' && R.gear >= 4) {
    for (const o of objs) {
      if (o.k !== 'block' || o.smashed) continue;
      const b = o.y + o.len, win = R.speed * 0.4; if (b > VT || b < VT - win) continue;
      cx.fillStyle = acc; cx.globalAlpha = 1 - (VT - b) / win;
      for (const s of (o.side === 0 ? [-1, 1] : [o.side])) { const x = sxw(laneX(s)); cx.beginPath(); cx.moveTo(x - 16, VT + 6); cx.lineTo(x + 16, VT + 6); cx.lineTo(x, VT + 22); cx.closePath(); cx.fill(); }
      cx.globalAlpha = 1;
    }
  }
  if (R && R.prompt && state === 'play') drawPrompt(R.prompt, sxw);
  for (const p of pops) {
    const a = Math.min(1, p.life / p.max * 2), sc = 1 + Math.max(0, (p.life - p.max + 0.15)) * 3;
    cx.globalAlpha = a;
    if (p.col) text(p.text, sxw(p.x), p.y, p.size * sc, 'center', 900, p.col);
    else { cx.globalCompositeOperation = 'difference'; text(p.text, sxw(p.x), p.y, p.size * sc, 'center', 900, '#fff'); cx.globalCompositeOperation = 'source-over'; }
  }
  cx.globalAlpha = 1;
  if (flash > 0) { setT(0, 0); cx.globalCompositeOperation = 'difference'; cx.globalAlpha = Math.min(0.5, flash * 0.5); cx.fillStyle = '#fff'; cx.fillRect(VL, VT, VR - VL, VB - VT); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; }
  setT(0, 0);
  if (state === 'play' || state === 'pause') drawHUD();
  if (state === 'title') drawTitle();
  if (state === 'over') drawOver();
  if (state === 'pause') drawPause();
  drawToasts();
  if (!COVER) drawMute();
}
function drawPrompt(p, sxw) {
  const touch = isTouch();
  if (p === 'line') {
    const pulse = 1 + 0.06 * Math.sin(clock * 10);
    cx.save(); cx.translate(LINE, PY - 175); cx.scale(pulse, pulse);
    cx.fillStyle = run.accent; rr(-135, -40, 270, 80, 16); cx.fill();
    text(touch ? 'HOLD BOTH THUMBS' : 'HOLD BOTH SHIFTS', 0, -10, 22, 'center', 900, '#0e0d14');
    text(touch ? 'ride the line through the slit' : '(or Space) ride the line through the slit', 0, 18, 14, 'center', 800, '#0e0d14');
    cx.restore(); return;
  }
  const x = sxw(laneX(p)), pulse = 1 + 0.08 * Math.sin(clock * 10), ss = Math.sign(x - LINE);
  cx.save(); cx.translate(x, PY - 150); cx.scale(pulse, pulse);
  cx.fillStyle = run.accent; rr(-92, -46, 184, 92, 16); cx.fill();
  text(ss < 0 ? '◀' : '▶', 0, -14, 30, 'center', 900, '#0e0d14');
  text(touch ? (ss < 0 ? 'TAP LEFT' : 'TAP RIGHT') : (ss < 0 ? 'LEFT SHIFT' : 'RIGHT SHIFT'), 0, 22, 22, 'center', 900, '#0e0d14');
  cx.restore();
  cx.globalCompositeOperation = 'difference';
  text('Walls fill a whole side. Shift away!', LINE, PY + 90, 18, 'center', 800, '#fff');
  cx.globalCompositeOperation = 'source-over';
}
function drawGearStick(x, y, gear, acc) {
  cx.globalCompositeOperation = 'difference'; cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.globalAlpha = 0.8;
  cx.beginPath();
  for (let i = 0; i < 3; i++) { cx.moveTo(x + i * 16, y); cx.lineTo(x + i * 16, y + 32); }
  cx.moveTo(x, y + 16); cx.lineTo(x + 32, y + 16); cx.stroke();
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  const g = Math.min(6, gear) - 1, kx = x + Math.floor(g / 2) * 16, ky = y + (g % 2 ? 32 : 0);
  cx.fillStyle = acc; cx.beginPath(); cx.arc(kx, ky, 7, 0, 7); cx.fill();
}
function drawHUD() {
  const R = run, top = Math.max(VT, -60) + 14;
  cx.globalCompositeOperation = 'difference';
  text(fmt(R.score), LINE, top + 34, 46, 'center', 900, '#fff');
  cx.globalAlpha = 0.6; text(R.daily ? 'DAILY BEST ' + fmt(Math.max(save.daily.best, Math.floor(R.score))) : 'BEST ' + fmt(Math.max(save.best, Math.floor(R.score))), LINE, top + 70, 15, 'center', 800, '#fff'); cx.globalAlpha = 1;
  text(Math.floor(R.dist / 40) + ' m', 20, top + 76, 16, 'left', 800, '#fff');
  text(R.gear <= 6 ? 'GEAR ' + R.gear : 'OT ' + (R.gear - 6), 64, top + 14, 16, 'left', 900, '#fff');
  cx.globalAlpha = 0.75; text(zoneOf(R.gear).name, 64, top + 34, 12, 'left', 900, '#fff'); cx.globalAlpha = 1;
  cx.globalCompositeOperation = 'source-over';
  drawGearStick(20, top + 8, R.gear, R.accent);
  const mx = W - 20;
  cx.globalCompositeOperation = 'difference';
  text('x' + R.mult, mx - 40, top + 30, 34, 'right', 900, '#fff');
  cx.globalCompositeOperation = 'source-over';
  if (R.comboT > 0) { cx.fillStyle = R.accent; cx.fillRect(mx - 130, top + 56, 90 * (R.comboT / 3), 6); }
  if (!R.tutorial) {
    const p = Math.min(1, R.gearT / gearLen(R.gear)); cx.fillStyle = R.accent; cx.globalAlpha = 0.85; cx.fillRect(LINE - 60, top + 86, 120 * p, 4); cx.globalAlpha = 0.25; cx.fillRect(LINE - 60, top + 86, 120, 4); cx.globalAlpha = 1;
    if (R.rushQueued) { cx.globalAlpha = 0.6 + 0.4 * beatPulse; text('RUSH → ' + (R.gear < 6 ? zoneOf(R.gear + 1).name : 'OVERTIME ' + (R.gear - 5)), LINE, top + 102, 13, 'center', 900, R.accent); cx.globalAlpha = 1; }
  }
  if (R.banner) {
    const a = Math.min(1, R.banner.t * 2, (3.6 - R.banner.t) * 5);
    cx.globalAlpha = a; cx.fillStyle = 'rgba(14,13,20,0.9)'; rr(LINE - 205, top + 116, 410, 56, 14); cx.fill();
    cx.strokeStyle = R.accent; cx.lineWidth = 2; cx.stroke();
    text(R.banner.title, LINE, top + 134, 20, 'center', 900, R.accent);
    text(R.banner.sub, LINE, top + 157, 13, 'center', 800, '#f3efe6');
    cx.globalAlpha = 1;
  }
  if (R.od > 0) { cx.fillStyle = '#facc15'; cx.fillRect(0, VB - 10, W * (R.od / 5), 10); text('OVERDRIVE', LINE, VB - 28, 20, 'center', 900, '#facc15'); }
  if (R.blackout > 0) { cx.fillStyle = R.accent; cx.fillRect(0, VB - 6, W * Math.min(1, R.blackout / 5), 6); }
}
function drawTitle() {
  const t = titleT;
  cx.globalCompositeOperation = 'difference';
  const y0 = COVER ? 270 : 196 + Math.sin(t * 2) * 6, k = COVER ? 1.45 : 1;
  text('SHIFT', LINE, y0, 104 * k, 'center', 900, '#fff');
  text('SIDE', LINE, y0 + 92 * k, 104 * k, 'center', 900, '#fff');
  text('Two worlds. Two Shift keys. One line.', LINE, y0 + (COVER ? 225 : 158), COVER ? 24 : 19, 'center', 800, '#fff');
  if (COVER) { cx.globalCompositeOperation = 'source-over'; return; }
  const touch = isTouch();
  cx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 5);
  text(touch ? 'TAP LEFT or RIGHT to start' : 'Press  ⇧ SHIFT  to start', LINE, y0 + 212, 24, 'center', 900, '#fff');
  cx.globalAlpha = 0.8;
  text(touch ? 'Tap a side to jump · hold both thumbs = ride the line' : 'Shift = jump to that side · hold BOTH = ride the line', LINE, y0 + 244, 14, 'center', 700, '#fff');
  if (!touch) text('(arrows / A D also work · ↓ daily · C skin · M mute · P pause)', LINE, y0 + 264, 12, 'center', 700, '#fff');
  cx.globalAlpha = 1;
  if (save.best > 0) text('BEST ' + fmt(save.best) + '  ·  ' + RANKS[rankOf(doneCount())].toUpperCase(), LINE, y0 + 296, 16, 'center', 900, '#fff');
  cx.globalCompositeOperation = 'source-over';
  drawGoals(LINE, y0 + 318, 0.97);
  const dy = y0 + 458;
  UI.daily = [LINE - 150, dy, LINE + 150, dy + 48];
  cx.fillStyle = ZONES[0].acc; rr(LINE - 150, dy, 300, 48, 24); cx.fill();
  text('★ DAILY CHALLENGE' + (touch ? '' : '  (↓)'), LINE, dy + 17, 16, 'center', 900, '#0e0d14');
  text(save.daily.best > 0 ? 'today\'s best ' + fmt(save.daily.best) : 'same walls for everyone today', LINE, dy + 35, 11, 'center', 800, '#0e0d14');
  const sy = Math.max(VT, -60) + 14;
  UI.skin = [12, sy, 152, sy + 42];
  cx.fillStyle = 'rgba(14,13,20,0.88)'; rr(12, sy, 140, 42, 12); cx.fill();
  cx.save(); cx.translate(34, sy + 21); cx.fillStyle = '#f3efe6'; shapePath(save.skin, 9); cx.fill('evenodd'); cx.restore();
  text(SKINS[save.skin] + '  ' + (save.skin + 1) + '/' + skinsUnlocked(), 52, sy + 15, 12, 'left', 900, '#f3efe6');
  text(skinsUnlocked() < SKINS.length ? 'next skin at next rank' : 'all skins unlocked', 52, sy + 30, 10, 'left', 700, '#9a97a8');
}
function drawGoals(x, y, alpha) {
  const gl = activeGoalList(); if (!gl.length) return;
  cx.globalAlpha = alpha; cx.fillStyle = 'rgba(14,13,20,0.95)';
  const w = 330, h = 30 + gl.length * 34;
  rr(x - w / 2, y, w, h, 12); cx.fill();
  text('SHIFT GOALS', x, y + 16, 13, 'center', 900, '#9a97a8');
  gl.forEach((g, i) => {
    const yy = y + 36 + i * 34, p = goalProg(g);
    text(g.t, x - w / 2 + 14, yy, 14, 'left', 800, '#f3efe6');
    text(fmt(goalVal(g)) + '/' + fmt(g.n), x + w / 2 - 14, yy, 13, 'right', 800, p >= 0.8 ? '#facc15' : '#9a97a8');
    cx.fillStyle = '#2a2836'; cx.fillRect(x - w / 2 + 14, yy + 10, w - 28, 4);
    cx.fillStyle = p >= 0.8 ? '#facc15' : (run ? run.accent : ZONES[0].acc); cx.fillRect(x - w / 2 + 14, yy + 10, (w - 28) * p, 4);
  });
  cx.globalAlpha = 1;
}
function drawOver() {
  const o = overInfo; if (!o) return;
  const a = Math.min(1, (clock - overT) * 4);
  cx.globalAlpha = a * 0.7; cx.fillStyle = '#000'; cx.fillRect(VL, VT, VR - VL, VB - VT); cx.globalAlpha = a;
  const x = LINE, w = 360, y = 70;
  cx.fillStyle = 'rgba(14,13,20,0.96)'; rr(x - w / 2, y, w, 450, 18); cx.fill();
  cx.strokeStyle = run.accent; cx.lineWidth = 3; cx.stroke();
  text(o.daily ? 'DAILY · SHIFT OVER' : 'SHIFT OVER', x, y + 38, o.daily ? 26 : 30, 'center', 900, '#f3efe6');
  text(fmt(o.score), x, y + 90, 58, 'center', 900, run.accent);
  text((o.daily ? 'DAILY BEST ' : 'BEST ') + fmt(o.best), x, y + 130, 16, 'center', 800, '#9a97a8');
  if (o.newBest) {
    cx.save(); cx.translate(x + 120, y + 70); cx.rotate(-0.25); const sc = 1 + Math.max(0, 0.4 - (clock - overT)) * 2; cx.scale(sc, sc);
    cx.strokeStyle = '#facc15'; cx.lineWidth = 3; cx.strokeRect(-52, -18, 104, 36); text('NEW BEST', 0, 1, 18, 'center', 900, '#facc15'); cx.restore();
  }
  const zone = (o.gear <= 6 ? 'G' + o.gear + ' ' : '') + zoneOf(o.gear).name + (o.gear > 6 ? ' ' + (o.gear - 6) : '');
  const rows = [['Distance', o.dist + ' m'], ['Zone reached', zone], ['Close shifts', o.close + '  (' + o.perfect + ' perfect)'], ['Prisms threaded', o.threads], ['Rushes cleared', o.rushes], ['Sparks', o.sparks], ['Best multiplier', 'x' + o.mult]];
  rows.forEach((r, i) => { const yy = y + 164 + i * 25; text(r[0], x - w / 2 + 24, yy, 15, 'left', 700, '#9a97a8'); text(String(r[1]), x + w / 2 - 24, yy, 15, 'right', 900, '#f3efe6'); });
  if (o.msg) text(o.msg, x, y + 354, o.msg.length > 34 ? 14 : 16, 'center', 900, o.newBest ? '#facc15' : run.accent);
  text(o.tip, x, y + 382, 12, 'center', 700, '#9a97a8');
  const ready = clock - overT > 0.45;
  cx.globalAlpha = a * (ready ? 0.6 + 0.4 * Math.sin(clock * 6) : 0.3);
  text(isTouch() ? 'TAP to shift again' : 'Press SHIFT to shift again', x, y + 416, 18, 'center', 900, '#f3efe6');
  cx.globalAlpha = a;
  UI.menu = [x + w / 2 - 80, y, x + w / 2, y + 34];
  text('menu ≡', x + w / 2 - 14, y + 15, 12, 'right', 800, '#9a97a8');
  drawGoals(x, y + 464, a);
  cx.globalAlpha = 1;
}
function drawPause() {
  cx.globalAlpha = 0.6; cx.fillStyle = '#000'; cx.fillRect(VL, VT, VR - VL, VB - VT); cx.globalAlpha = 1;
  text('PAUSED', LINE, 360, 54, 'center', 900, '#f3efe6');
  text('Press any Shift key or tap to resume', LINE, 410, 17, 'center', 700, '#9a97a8');
}
function drawToasts() {
  toasts.forEach((t, i) => {
    cx.globalAlpha = Math.min(1, t.life * 3, (t.max - t.life) * 6);
    const y = (state === 'play' ? 230 : VT + 80) + i * 40;
    cx.font = '900 16px "Trebuchet MS", system-ui, sans-serif';
    const w = cx.measureText(t.text).width + 30;
    cx.fillStyle = 'rgba(14,13,20,0.9)'; rr(LINE - w / 2, y - 16, w, 32, 16); cx.fill();
    cx.strokeStyle = t.col; cx.lineWidth = 2; cx.stroke();
    text(t.text, LINE, y + 1, 16, 'center', 900, '#f3efe6');
  });
  cx.globalAlpha = 1;
}
function drawMute() {
  const x = Math.min(VR, W + 200) - 34, y = VT + 34;
  cx.globalCompositeOperation = 'difference'; cx.fillStyle = '#fff'; cx.strokeStyle = '#fff'; cx.globalAlpha = 0.7; cx.lineWidth = 2.5;
  if (state === 'play') { cx.fillRect(x - 8, y - 10, 5, 20); cx.fillRect(x + 3, y - 10, 5, 20); }
  else {
    cx.beginPath(); cx.moveTo(x - 12, y - 5); cx.lineTo(x - 6, y - 5); cx.lineTo(x + 1, y - 11); cx.lineTo(x + 1, y + 11); cx.lineTo(x - 6, y + 5); cx.lineTo(x - 12, y + 5); cx.closePath(); cx.fill();
    if (save.mute) { cx.beginPath(); cx.moveTo(x + 5, y - 6); cx.lineTo(x + 15, y + 6); cx.moveTo(x + 15, y - 6); cx.lineTo(x + 5, y + 6); cx.stroke(); }
    else { cx.beginPath(); cx.arc(x + 3, y, 8, -0.8, 0.8); cx.stroke(); }
  }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}

// ---------- loop + test hooks ----------
window.__game = {
  deaths: 0, fps: 0, frames: 0, minFps: 999,
  get state() { return state; }, get score() { return run ? Math.floor(run.score) : 0; }, get gear() { return run ? run.gear : 0; },
  get zone() { return run ? zoneOf(run.gear).name : ''; }, get t() { return run ? run.t : 0; }, get save() { return save; },
  get prompt() { return run ? run.prompt : null; }, get audio() { return AU.c ? AU.c.state : 'none'; }, get dist() { return run ? Math.floor(run.dist / 40) : 0; },
  get mirror() { return run ? run.mirror : 1; }, get blackout() { return run ? run.blackout : 0; }, get line() { return player.side === 0; },
  get daily() { return run ? run.daily : false; }, get rushOn() { return run ? run.rushOn : false; }, get flipping() { return run ? run.flipP < 1 : false; },
  get stats() { return run ? { threads: run.threads, rushes: run.rushes, close: run.close, perfect: run.perfect, sparks: run.sparks } : null; },
  // what a human can see: walls near the player (world sides) + current mirror, so external test players can react
  get view() { return run ? { side: player.side, mirror: mSign(), speed: run.speed, movers: objs.filter(o => o.k === 'block' && o.moves && o.moves.length && o.y > 200).length, prisms: objs.filter(o => o.prism && !o.done && o.y + o.len > PY - 400 && o.y < PY + HS).length, walls: objs.filter(o => o.k === 'block' && !o.done && !o.smashed && o.y < PY + HS && o.y + o.len > PY - 480).map(o => ({ side: predictSide(o), bottom: Math.round(o.y + o.len), top: Math.round(o.y) })) } : null; },
};
const ft = [];
let last = performance.now(), fpsWarm = 0;
function frame(nowT) {
  const rdt = Math.min(0.05, Math.max(0, (nowT - last) / 1000)); last = nowT;
  ft.push(rdt); if (ft.length > 120) ft.shift();
  window.__game.frames++;
  if (window.__game.frames % 30 === 0) { const avg = ft.reduce((a, b) => a + b, 0) / ft.length; window.__game.fps = avg > 0 ? Math.round(1 / avg) : 0; if (++fpsWarm > 4) window.__game.minFps = Math.min(window.__game.minFps, window.__game.fps); }
  try { update(rdt); draw(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
if (AUTOPLAY) setTimeout(() => { startRun(false, QS.has('daily')); }, 300);
requestAnimationFrame(frame);
})();
