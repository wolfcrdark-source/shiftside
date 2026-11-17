/* SHIFTSIDE - Game Off 2026 ("SHIFT"). MIT licence. Vanilla JS + Canvas 2D + WebAudio. No external assets. */
(() => {
'use strict';

// ---------- constants ----------
const W = 480, H = 800, LINE = 240, PY = 640, LANE = 96, HS = 14, PSZ = 19;
const LIGHT = '#f3efe6', DARK = '#0e0d14';
const ACCENTS = ['#ff3d7f', '#22d3ee', '#a3e635', '#fb923c', '#a78bfa', '#facc15', '#f43f5e', '#2dd4bf'];
const RANKS = ['Trainee', 'Day Shifter', 'Swing Shifter', 'Night Shifter', 'Graveyard Shift', 'Double Shifter',
  'Shift Lead', 'Shift Supervisor', 'Shift Master', 'Overlord of Overtime'];
const GOALS = [
  { t: 'Shift into GEAR 2', k: 'run', s: 'gear', n: 2 },
  { t: 'Collect 50 sparks', k: 'tot', s: 'sparks', n: 50 },
  { t: '5 close shifts in one run', k: 'run', s: 'close', n: 5 },
  { t: 'Grab a Golden Prism', k: 'tot', s: 'gold', n: 1 },
  { t: 'Score 3,000', k: 'run', s: 'score', n: 3000 },
  { t: 'Shift into GEAR 3', k: 'run', s: 'gear', n: 3 },
  { t: 'Reach a x4 multiplier', k: 'run', s: 'mult', n: 4 },
  { t: '100 close shifts in total', k: 'tot', s: 'close', n: 100 },
  { t: '8 PERFECT shifts in one run', k: 'run', s: 'perfect', n: 8 },
  { t: 'Survive 60 seconds', k: 'run', s: 'time', n: 60 },
  { t: 'Score 10,000', k: 'run', s: 'score', n: 10000 },
  { t: 'Shift into GEAR 5', k: 'run', s: 'gear', n: 5 },
  { t: 'Collect 1,000 sparks', k: 'tot', s: 'sparks', n: 1000 },
  { t: 'Reach a x8 multiplier', k: 'run', s: 'mult', n: 8 },
  { t: 'Score 30,000', k: 'run', s: 'score', n: 30000 },
  { t: 'Survive 150 seconds', k: 'run', s: 'time', n: 150 },
  { t: 'Clock into OVERTIME (gear 7)', k: 'run', s: 'gear', n: 7 },
  { t: 'Score 75,000', k: 'run', s: 'score', n: 75000 },
];
const TIPS = [
  'Shift at the last instant: PERFECT pays double.',
  'Your multiplier drains if you play it safe.',
  'Arrows with stripes will jump to the other side.',
  'Sparks keep your combo alive between walls.',
  'Golden Prism = OVERDRIVE. Smash everything.',
  'Sticky Keys popped up? Use the arrow keys or A / D.',
  'Each gear shifts the music up a key. Listen for it.',
];
const QS = new URLSearchParams(location.search);
const AUTOPLAY = QS.has('autoplay');
const COVER = QS.has('cover');

// ---------- save ----------
const SAVE_KEY = 'shiftside.v1';
const save = {
  best: 0, bestDist: 0, lastScore: 0, tut: false, mute: false, goals: 0,
  tot: { close: 0, sparks: 0, gold: 0, runs: 0, perfect: 0 },
  rb: { score: 0, gear: 1, close: 0, perfect: 0, mult: 1, time: 0, sparks: 0 },
};
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (s) { Object.assign(save, s); save.tot = Object.assign({ close: 0, sparks: 0, gold: 0, runs: 0, perfect: 0 }, s.tot); save.rb = Object.assign({ score: 0, gear: 1, close: 0, perfect: 0, mult: 1, time: 0, sparks: 0 }, s.rb); }
} catch (e) { /* ignore */ }
if (QS.has('fresh')) { save.tut = false; }
if (AUTOPLAY) save.tut = true;
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

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
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const fmt = n => Math.floor(n).toLocaleString('en-US');
const laneX = side => LINE + side * LANE;
function wpick(list) { let tot = 0; for (const [, w] of list) tot += w; let r = Math.random() * tot; for (const [v, w] of list) { r -= w; if (r <= 0) return v; } return list[0][0]; }

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
  AU.noise = b;
  AU.step = 0; AU.next = c.currentTime + 0.1;
  setInterval(schedule, 25);
}
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
const SFX = {
  shift(side) { if (!AU.c) return; tone(side < 0 ? 620 : 300, 0.09, 'triangle', 0.22, side < 0 ? 980 : 170); noise(0.07, 0.12, side < 0 ? 4000 : 1500); },
  bump() { tone(110, 0.06, 'square', 0.08, 90); },
  spark(i) { const n = 72 + PENT[i % 5] + 12 * Math.min(2, Math.floor(i / 5)); tone(mf(n), 0.12, 'sine', 0.16); tone(mf(n + 12), 0.08, 'triangle', 0.05); },
  close() { tone(mf(84), 0.1, 'square', 0.08); tone(mf(91), 0.16, 'triangle', 0.14, 0, null, AU.c && AU.c.currentTime + 0.04); },
  perfect() { if (!AU.c) return; const t = AU.c.currentTime; [84, 88, 91, 96].forEach((n, i) => tone(mf(n), 0.18, 'triangle', 0.15, 0, null, t + i * 0.035)); noise(0.2, 0.06, 9000, 'highpass'); },
  gear() { if (!AU.c) return; const t = AU.c.currentTime; [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(mf(n + run.key), 0.16, 'sawtooth', 0.08, 0, null, t + i * 0.045)); noise(0.5, 0.1, 600, 'lowpass'); },
  gold() { if (!AU.c) return; const t = AU.c.currentTime; for (let i = 0; i < 10; i++) tone(mf(84 + PENT[i % 5] + 12 * Math.floor(i / 5)), 0.2, 'sine', 0.12, 0, null, t + i * 0.03); },
  shield() { tone(mf(76), 0.3, 'sine', 0.2, mf(88)); },
  shatter() { noise(0.18, 0.3, 2500); tone(180, 0.15, 'square', 0.1, 60); },
  death() { if (!AU.c) return; noise(0.7, 0.6, 400, 'lowpass'); tone(220, 0.8, 'sawtooth', 0.25, 30); tone(90, 0.5, 'sine', 0.4, 30); },
  best() { if (!AU.c) return; const t = AU.c.currentTime; [72, 76, 79, 84, 79, 84].forEach((n, i) => tone(mf(n), 0.2, 'square', 0.08, 0, null, t + i * 0.08)); },
  drop() { tone(300, 0.25, 'triangle', 0.1, 120); },
  goal() { if (!AU.c) return; const t = AU.c.currentTime; [79, 84, 88].forEach((n, i) => tone(mf(n), 0.25, 'triangle', 0.12, 0, null, t + i * 0.07)); },
  ui() { tone(660, 0.05, 'square', 0.06); },
};
const PROG = [0, -4, -2, -5]; // i - VI - VII - v
function schedule() {
  const c = AU.c; if (!c || c.state !== 'running') return;
  const playing = state === 'play';
  const bpm = (playing ? 112 + run.gear * 5 : 96) * (run.od > 0 && playing ? 1.06 : 1);
  const sd = 60 / bpm / 4;
  while (AU.next < c.currentTime + 0.12) {
    const t = AU.next, st = AU.step % 16, bar = Math.floor(AU.step / 16) % 4;
    const root = 45 + (playing ? run.key : 0) + PROG[bar];
    const m = AU.mus;
    if (playing || state === 'title') {
      if (playing && st % 4 === 0) { tone(150, 0.14, 'sine', 0.55, 40, m, t); beatAt(t); }
      if (!playing && st % 8 === 0) beatAt(t);
      if (playing && run.gear >= 2 && (st === 4 || st === 12)) noise(0.12, 0.25, 1800, 'bandpass', m, t);
      if (st % 2 === 1 && (playing || st % 4 === 3)) noise(0.03, playing ? 0.12 : 0.05, 9000, 'highpass', m, t);
      if (st % 2 === 0) tone(mf(root + (st % 8 === 6 ? 12 : 0)), sd * 1.8, 'sawtooth', 0.16, 0, m, t);
      const arpOn = playing && (run.gear >= 3 || run.od > 0);
      if (arpOn || (!playing && st % 4 === 0)) {
        const ch = [0, 3, 7, 10, 12, 7, 3, 15][st % 8];
        tone(mf(root + 24 + ch), sd * 0.9, 'square', arpOn ? 0.05 : 0.035, 0, m, t);
      }
    }
    AU.next += sd; AU.step++;
  }
  const target = state === 'play' ? (run.od > 0 ? 9000 : 4200) : state === 'over' ? 500 : 900;
  AU.lp.frequency.setTargetAtTime(target, c.currentTime, 0.15);
}
const beats = [];
function beatAt(t) { beats.push(t); if (beats.length > 8) beats.shift(); }
function setMute(m) { save.mute = m; persist(); if (AU.c) AU.master.gain.setTargetAtTime(m ? 0 : 0.85, AU.c.currentTime, 0.02); }

// ---------- game state ----------
let state = 'title';
let run = null, objs = [], parts = [], pops = [], toasts = [];
let shake = 0, hitStop = 0, timeScale = 1, tsTarget = 1, flash = 0, beatPulse = 0;
let overT = 0, overInfo = null, titleT = 0, clock = 0, lastInputTouch = false, pausedFrom = null;
const player = { side: 1, x: laneX(1), lastFrom: 0, lastT: -9, sq: 0, trail: [], bump: 0 };

function newRun(demo) {
  return {
    demo, t: 0, dist: 0, score: 0, speed: 290, gear: 1, gearT: 0, key: 0, accent: ACCENTS[0], accentT: 0,
    combo: 0, comboT: 0, mult: 1, maxMult: 1, close: 0, perfect: 0, sparks: 0, gold: 0, shifts: 0,
    od: 0, shield: false, inv: 0, cursor: VT - 60, patterns: 0, pity: 0,
    tutorial: !demo && !save.tut, script: [], kindUntil: 0, prompt: null, passedBest: false,
    sparkStreak: 0, deadT: 0, dead: false, nextGoalCheck: 0,
  };
}
function startRun(demo) {
  run = newRun(!!demo);
  objs = []; parts = []; pops = [];
  if (!demo) toasts = [];
  player.side = 1; player.x = laneX(1); player.lastT = -9; player.trail = []; player.sq = 0;
  timeScale = tsTarget = 1; hitStop = 0;
  if (run.tutorial) {
    run.kindUntil = 35;
    run.speed = 250;
    run.script = ['t_right', 't_left', 't_sparks', 't_zig', 't_gold'];
  }
  run.cursor = VT - 140;
  if (!demo) { state = 'play'; save.tot.runs++; persist(); }
}
function coverScene() {
  // static, hand-placed scene used only for the itch.io cover image (?cover=1)
  objs = [
    { k: 'block', side: 1, y: 455, len: 175, done: false, slide: 0 },
    { k: 'block', side: -1, y: 20, len: 120, done: false, slide: 0 },
    { k: 'block', side: 1, y: -160, len: 140, done: false, slide: 0 },
  ];
  for (let i = 0; i < 3; i++) objs.push({ k: 'spark', side: -1, y: 512 + i * 36, r: 9, done: false });
  objs.push({ k: 'gold', side: 1, y: 730, r: 16, done: false });
  player.side = -1; player.x = laneX(-1); player.sq = 0.5; player.lastT = 0;
  for (let i = 0; i < 18; i++) parts.push({ x: LINE, y: PY + rand(-14, 14), vx: 0, vy: 0, life: 99, max: 99, sz: rand(2, 6), col: null, ox: -rand(5, 70) });
  for (const p of parts) p.x = LINE + p.ox;
  run.accent = ACCENTS[0];
}
function gearSpeed(g) { return Math.min(1000, 290 + 75 * (g - 1)); }
function gearLen(g) { return 20 + 2 * g; }

// ---------- object factory ----------
function block(side, len, off, extra) { return Object.assign({ k: 'block', side, len, y: run.cursor - off - len, done: false, slide: 0 }, extra || {}); }
function spark(side, off) { return { k: 'spark', side, y: run.cursor - off, r: 9, done: false }; }
function item(kind, side, off) { return { k: kind, side, y: run.cursor - off, r: 16, done: false }; }
function gapFor(v, g) { return 34 + v * Math.max(0.2, 0.42 - 0.025 * g); }

function genPattern() {
  const g = run.gear, v = run.speed, out = [];
  let top = 0; // farthest offset used
  const add = o => { out.push(o); const off = run.cursor - o.y; if (off > top) top = off; };
  let name;
  if (run.script.length) name = run.script.shift();
  else {
    const opts = [['single', 30], ['zig', 30 + g * 3], ['long', 14], ['sparkline', g <= 2 ? 12 : 6]];
    if (g >= 2) opts.push(['stair', 14], ['shifter', 10 + g * 2]);
    if (g >= 3) opts.push(['shiftzig', 8 + g * 2], ['corridor', 10]);
    name = wpick(opts);
  }
  const s0 = Math.random() < 0.5 ? -1 : 1;
  const gp = gapFor(v, g);
  switch (name) {
    case 't_right': add(block(1, 170, 0, { teach: true })); break;
    case 't_left': add(block(-1, 170, 0, { teach: true })); break;
    case 't_sparks': for (let i = 0; i < 6; i++) add(spark(1, i * 55)); add(block(-1, 300, 0, { teach: true })); break;
    case 't_zig': { let off = 0; for (let i = 0; i < 4; i++) { const len = 120; add(block(i % 2 ? -1 : 1, len, off, { teach: true })); off += len + 150; } break; }
    case 't_gold': for (let i = 0; i < 4; i++) add(spark(-1, i * 50)); add(item('gold', -1, 260)); run.pity = 0; break;
    case 'single': add(block(s0, irand(110, 220), 0)); break;
    case 'zig': {
      const n = Math.min(2 + Math.floor(g / 1.5) + irand(0, 1), 8); let off = 0, s = s0;
      for (let i = 0; i < n; i++) { const len = irand(70, 140); add(block(s, len, off)); off += len + gp + rand(0, 40); s = -s; }
      break;
    }
    case 'long': {
      const len = irand(420, 760); add(block(s0, len, 0));
      for (let o = 60; o < len - 30; o += 70) add(spark(-s0, o));
      break;
    }
    case 'sparkline': {
      let s = s0; for (let i = 0; i < 10; i++) { if (i % 4 === 3) s = -s; add(spark(s, i * 48)); }
      break;
    }
    case 'stair': {
      let off = 0; for (let i = 0; i < 3; i++) { const len = irand(90, 140); add(block(s0, len, off)); add(spark(s0, off + len + gp * 0.55)); off += len + gp * 1.25 + 40; }
      break;
    }
    case 'shifter': {
      const shiftAt = PY - HS - Math.max(260, v * 0.55);
      add(block(s0, irand(120, 180), 0, { to: -s0, shiftAt }));
      break;
    }
    case 'shiftzig': {
      let off = 0, s = s0; const n = 3 + Math.min(3, Math.floor(g / 3));
      for (let i = 0; i < n; i++) {
        const len = irand(90, 130);
        if (i === 1) { add(block(-s, len, off, { to: s, shiftAt: PY - HS - Math.max(260, v * 0.55) })); }
        else add(block(s, len, off));
        off += len + gp + 60; s = -s;
      }
      break;
    }
    case 'corridor': {
      const len = irand(300, 500); add(block(s0, len, 0)); add(block(-s0, irand(90, 130), len + gp + 20));
      for (let o = 40; o < len; o += 80) add(spark(-s0, o));
      break;
    }
  }
  run.patterns++; run.pity++;
  // variable rewards (with pity timer)
  let extra = 0;
  if (!run.tutorial || !run.script.length) {
    const goldChance = run.pity >= 14 ? 1 : 0.06;
    if (!run.demo && name.indexOf('t_') !== 0 && run.od <= 0 && Math.random() < goldChance) {
      add(item('gold', Math.random() < 0.5 ? -1 : 1, top + gp * 0.5 + 20)); run.pity = 0; extra = gp;
    } else if (!run.shield && Math.random() < 0.035 && run.gear >= 2) {
      add(item('shield', Math.random() < 0.5 ? -1 : 1, top + gp * 0.5 + 20)); extra = gp;
    }
  }
  for (const o of out) objs.push(o);
  run.cursor -= top + gp + extra + rand(20, 80) + (name === 'sparkline' ? 40 : 0);
  if (name === 't_gold') run.cursor -= 120;
}
function breather() {
  // empty stretch with a spark arc right after a gear shift
  const len = run.speed * 2.0;
  let s = player.side;
  for (let i = 0; i < 14; i++) { if (i === 7) s = -s; objs.push(spark(s, 80 + i * (len - 120) / 14)); }
  run.cursor -= len;
}

// ---------- input ----------
function onInput(side, touch) {
  lastInputTouch = !!touch;
  audioInit();
  if (state === 'title') { SFX.ui(); startRun(false); if (side) shiftTo(side); return; }
  if (state === 'over') { if (clock - overT > 0.45) { SFX.ui(); startRun(false); if (side) shiftTo(side); } return; }
  if (state === 'pause') { state = pausedFrom || 'play'; return; }
  if (state === 'play' && !run.dead) {
    const target = side || -player.side;
    if (target !== player.side) shiftTo(target);
    else { player.bump = 0.12; SFX.bump(); }
  }
}
function shiftTo(target) {
  player.lastFrom = player.side; player.side = target; player.lastT = run.t;
  player.sq = 1; run.shifts++;
  if (!run.demo) SFX.shift(target);
  for (let i = 0; i < 10; i++) parts.push({ x: LINE, y: PY + rand(-14, 14), vx: target * rand(80, 380), vy: rand(-120, 120), life: rand(0.2, 0.45), max: 0.45, sz: rand(2, 5) });
}
const keyMap = { ShiftLeft: -1, ShiftRight: 1, ArrowLeft: -1, ArrowRight: 1, KeyA: -1, KeyD: 1, Space: 0, KeyW: 0, ArrowUp: 0, ArrowDown: 0, KeyS: 0, Enter: 0 };
window.addEventListener('keydown', e => {
  if (e.code === 'KeyM') { audioInit(); setMute(!save.mute); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') { if (state === 'play') { pausedFrom = 'play'; state = 'pause'; } else if (state === 'pause') state = 'play'; e.preventDefault(); return; }
  if (e.code in keyMap || e.key === 'Shift') {
    e.preventDefault();
    if (e.repeat) return;
    let side = keyMap[e.code];
    if (side === undefined) side = e.location === 2 ? 1 : -1; // fallback for browsers without code
    onInput(side, false);
  }
}, { passive: false });
function muteHit(px, py) { const lx = (px - OX) / S, ly = (py - OY) / S; return lx > Math.min(VR, W + 200) - 70 && ly < VT + 70; }
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  cv.focus();
  if (muteHit(e.clientX, e.clientY) && state !== 'play') { audioInit(); setMute(!save.mute); return; }
  if (state === 'play' && muteHit(e.clientX, e.clientY)) { pausedFrom = 'play'; state = 'pause'; return; }
  onInput(e.clientX < cw / 2 ? -1 : 1, e.pointerType !== 'mouse');
}, { passive: false });
['touchstart', 'touchmove', 'touchend', 'gesturestart', 'dblclick', 'contextmenu'].forEach(ev => document.addEventListener(ev, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') { pausedFrom = 'play'; state = 'pause'; } });
window.addEventListener('blur', () => { if (state === 'play' && !AUTOPLAY) { pausedFrom = 'play'; state = 'pause'; } });

// ---------- bot (attract mode + ?autoplay test hook) ----------
let botCool = 0;
function finalSide(o) { return (o.to && !o.shifted) ? o.to : o.side; }
function botThink(dt) {
  botCool -= dt; if (botCool > 0) return;
  const look = run.speed * 0.42 + 50;
  const danger = side => {
    let d = Infinity;
    for (const o of objs) {
      if (o.k !== 'block' || o.done || o.smashed) continue;
      const fs = (o.to && !o.shifted && o.y + o.len < (o.shiftAt || 0)) ? o.to : (o.slide > 0.5 ? o.to : o.side);
      if (fs !== side) continue;
      const bottom = o.y + o.len;
      if (o.y > PY + HS) continue;
      d = Math.min(d, Math.max(0, PY - HS - bottom));
    }
    return d;
  };
  const cur = player.side, dc = danger(cur);
  if (dc < look) { const dn = danger(-cur); if (dn > dc + 10) { onInputBot(-cur); botCool = 0.06; } return; }
  // go for sparks / prizes on the other side if safe
  if (danger(-cur) > look * 1.6) {
    for (const o of objs) if ((o.k === 'spark' || o.k === 'gold' || o.k === 'shield') && !o.done && o.side === -cur && o.y > PY - look && o.y < PY) { onInputBot(-cur); botCool = 0.12; break; }
  }
}
function onInputBot(side) { if (run.demo) shiftTo(side); else onInput(side, false); }

// ---------- update ----------
function addPop(text, x, y, size, col, life) { pops.push({ text, x, y, size: size || 26, col: col || null, life: life || 0.9, max: life || 0.9 }); }
function toast(text, col) { toasts.push({ text, col: col || run.accent, life: 2.6, max: 2.6 }); }
function burst(x, y, n, spd, col) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(spd * 0.3, spd); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.9), max: 0.9, sz: rand(2, 7), col }); } }
function addCombo(n) { run.combo += n; run.comboT = 3; const m = Math.min(8, 1 + Math.floor(run.combo / 5)); if (m > run.mult) { run.mult = m; if (!run.demo) { addPop('x' + m, LINE, PY - 90, 40, run.accent, 1); SFX.goal(); } } run.maxMult = Math.max(run.maxMult, run.mult); }
function gain(pts) { run.score += pts * run.mult; }

function update(rdt) {
  clock += rdt;
  beatPulse = Math.max(0, beatPulse - rdt * 4);
  if (AU.c) { while (beats.length && beats[0] <= AU.c.currentTime) { beats.shift(); beatPulse = 1; } }
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
  // player movement uses real time so slow-mo never makes controls feel sluggish
  const tx = laneX(player.side);
  const dx = tx - player.x; const step = rdt * 2100;
  player.x += Math.abs(dx) < step ? dx : Math.sign(dx) * step;
  player.sq = Math.max(0, player.sq - rdt * 6); player.bump = Math.max(0, player.bump - rdt);
  player.trail.push({ x: player.x, y: PY }); if (player.trail.length > 10) player.trail.shift();
  if (R.dead) { for (const o of objs) o.y += R.speed * dt * 0.3; return; }

  R.t += dt;
  if (!R.demo && state === 'play') {
    R.gearT += dt;
    if (R.gearT >= gearLen(R.gear) && !R.tutorial) gearUp();
    if (R.tutorial && R.t > 30 && !R.script.length) { R.tutorial = false; save.tut = true; persist(); toast('Tutorial done. Now it gets real.'); R.gearT = gearLen(R.gear) - 1.5; }
  }
  if (R.demo && R.t > 24 && R.gear < 3) { R.gear++; R.key += 2; R.accent = ACCENTS[(R.gear - 1) % ACCENTS.length]; R.t = 0; }
  const base = R.tutorial ? 250 : gearSpeed(R.gear) * (1 + Math.min(0.15, R.gearT * 0.007));
  R.speed += (base * (R.od > 0 ? 1.12 : 1) - R.speed) * Math.min(1, dt * 2);
  const v = R.speed * dt;
  R.dist += v; R.cursor += v;
  if (!R.demo) gain(R.speed * dt * 0.02);
  while (R.cursor > VT - 120) {
    genPattern();
    // ensure the cursor is placed above the screen
  }
  if (R.od > 0) { R.od -= dt; if (R.od <= 0 && !R.demo) addPop('OVERDRIVE OVER', LINE, PY - 160, 22); }
  if (R.inv > 0) R.inv -= dt;
  if (R.comboT > 0) { R.comboT -= dt; if (R.comboT <= 0) { if (R.combo >= 5 && !R.demo) { addPop('COMBO DROPPED', LINE, PY - 120, 22, '#888'); SFX.drop(); } R.combo = 0; R.mult = 1; } }

  const pside = player.x < LINE - 12 ? -1 : player.x > LINE + 12 ? 1 : 0;
  const pt = PY - HS, pb = PY + HS;
  R.prompt = null; tsTarget = 1;
  for (const o of objs) {
    const prevBottom = o.y + (o.len || 0);
    o.y += v;
    if (o.k === 'block') {
      if (o.to && !o.shifted && o.y + o.len >= o.shiftAt) { o.shifted = true; o.slideT = 0; if (!R.demo) SFX.shift(o.to); }
      if (o.shifted && o.slide < 1) { o.slide = Math.min(1, o.slide + dt / 0.16); if (o.slide >= 0.5 && o.side !== o.to) { o.side = o.to; } }
      if (o.done || o.smashed) continue;
      const bottom = o.y + o.len;
      // tutorial: slow time and show the prompt until the player shifts away
      if (R.tutorial && o.teach && o.side === player.side && bottom > pt - 230 && o.y < pb) { tsTarget = 0.1; R.prompt = -o.side; }
      if (bottom > pt && o.y < pb && pside === o.side) {
        if (R.od > 0 || R.inv > 0) { smash(o, R.od > 0 ? 'SMASH' : null); continue; }
        if (R.shield) { R.shield = false; R.inv = 1; smash(o, 'SHIELD!'); SFX.shield(); continue; }
        if (!R.demo && R.t < R.kindUntil) { smash(o, 'FREE SAVE!'); R.inv = 0.6; toast('First shift is on the house!'); continue; }
        die(o); return;
      }
      if (prevBottom <= pt && bottom > pt) {
        // the wall's front edge just reached you: was it a near-miss?
        const since = R.t - player.lastT;
        if (!R.demo && player.lastFrom === o.side && pside !== o.side && since < 0.35) {
          if (since < 0.15 && !R.tutorial) { R.perfect++; save.tot.perfect++; gain(100); addCombo(3); hitStop = 0.045; shake = Math.max(shake, 5); addPop('PERFECT!', laneX(-o.side), PY - 70, 34, run.accent); SFX.perfect(); burst(LINE, PY, 18, 420, run.accent); flash = 0.25; }
          else { gain(50); addCombo(2); addPop('CLOSE!', laneX(-o.side), PY - 60, 26); SFX.close(); burst(LINE, PY, 8, 260); }
          R.close++; save.tot.close++;
        }
      }
      if (o.y > pb) o.done = true;
    } else if (!o.done) {
      const near = R.od > 0 && o.k === 'spark' && o.side === pside && o.y > PY - 260 && o.y < PY;
      if (near) o.y += v * 0.6;
      if (Math.abs(o.y - PY) < HS + o.r && pside === o.side) {
        o.done = true;
        if (R.demo) continue;
        if (o.k === 'spark') { R.sparks++; save.tot.sparks++; gain(10); addCombo(1); SFX.spark(R.combo); burst(laneX(o.side), o.y, 6, 160); addPop('+' + 10 * R.mult, laneX(o.side) + o.side * 40, o.y - 10, 16); }
        else if (o.k === 'gold') { R.gold++; save.tot.gold++; R.od = 5; gain(250); addCombo(5); SFX.gold(); flash = 0.6; shake = 10; hitStop = 0.07; burst(laneX(o.side), o.y, 40, 520, '#facc15'); addPop('OVERDRIVE!', LINE, PY - 200, 46, '#facc15', 1.4); }
        else if (o.k === 'shield') { R.shield = true; SFX.shield(); burst(laneX(o.side), o.y, 20, 300, '#22d3ee'); addPop('SHIELD', LINE, PY - 150, 30, '#22d3ee'); }
      }
    }
  }
  if (R.tutorial && R.prompt) tsTarget = 0.1;
  objs = objs.filter(o => o.y < VB + 40 && !(o.done && o.k !== 'block' && o.k !== 'spark') && !(o.k === 'spark' && o.done));
  if (R.demo || state !== 'play') { if (R.demo) botThink(dt); return; }
  if (AUTOPLAY) botThink(dt);
  // ghost best line
  if (!R.passedBest && save.bestDist > 0 && R.dist >= save.bestDist && save.best > 0) { R.passedBest = true; addPop('PAST YOUR BEST!', LINE, PY - 240, 30, run.accent, 1.4); SFX.best(); }
  // live stats + goals
  const rb = save.rb;
  rb.score = Math.max(rb.score, Math.floor(R.score)); rb.gear = Math.max(rb.gear, R.gear); rb.close = Math.max(rb.close, R.close);
  rb.perfect = Math.max(rb.perfect, R.perfect); rb.mult = Math.max(rb.mult, R.maxMult); rb.time = Math.max(rb.time, Math.floor(R.t)); rb.sparks = Math.max(rb.sparks, R.sparks);
  if (clock > R.nextGoalCheck) { R.nextGoalCheck = clock + 0.25; checkGoals(true); }
}
function goalProg(gl) { const v = (gl.k === 'tot' ? save.tot : save.rb)[gl.s] || 0; if (gl.s === 'gear' || gl.s === 'mult') return clamp((v - 1) / (gl.n - 1), 0, 1); return Math.min(1, v / gl.n); }
function goalVal(gl) { return Math.min(gl.n, (gl.k === 'tot' ? save.tot : save.rb)[gl.s] || 0); }
function activeGoals() { return GOALS.slice(save.goals, save.goals + 3); }
function checkGoals(live) {
  // goals complete in order of the list but any of the three active ones may finish; we mark finished in-place
  save.gdone = save.gdone || [];
  let changed = false;
  for (let i = 0; i < GOALS.length; i++) {
    if (save.gdone[i]) continue;
    if (i >= save.goals + 3) break;
    if (goalProg(GOALS[i]) >= 1) {
      save.gdone[i] = 1; changed = true;
      if (live) { toast('GOAL ✓ ' + GOALS[i].t); SFX.goal(); }
    }
  }
  while (save.gdone[save.goals]) save.goals++;
  if (changed) { const before = rankOf(save.lastRankGoals || 0), now = rankOf(doneCount()); save.lastRankGoals = doneCount(); if (now > before && live) toast('RANK UP: ' + RANKS[now], '#facc15'); persist(); }
}
function doneCount() { return (save.gdone || []).filter(Boolean).length; }
function rankOf(n) { return Math.min(RANKS.length - 1, Math.floor(n / 2)); }
function activeGoalList() { const out = []; save.gdone = save.gdone || []; for (let i = save.goals; i < GOALS.length && out.length < 3; i++) if (!save.gdone[i]) out.push(GOALS[i]); return out; }

function gearUp() {
  const R = run; R.gear++; R.gearT = 0; R.key = (R.key + 2) % 12; R.accent = ACCENTS[(R.gear - 1) % ACCENTS.length]; R.accentT = 1;
  // breather: clear what hasn't arrived yet, then a spark arc
  objs = objs.filter(o => o.y > VT - 20);
  R.cursor = Math.min(VT - 40, ...objs.map(o => o.y), VT - 40);
  breather();
  SFX.gear(); flash = 0.35; shake = Math.max(shake, 6);
  addPop(R.gear <= 6 ? 'GEAR ' + R.gear : 'OVERTIME ' + (R.gear - 6), LINE, 300, 56, R.accent, 1.6);
  addPop('KEY SHIFT ▲', LINE, 350, 18, null, 1.6);
}
function smash(o, label) {
  o.smashed = true; o.done = true;
  const x = LINE + o.side * 120, y = clamp(PY - 40, o.y, o.y + o.len);
  burst(x, y, 30, 520); burst(x, y, 10, 300, run.accent);
  gain(100); shake = Math.max(shake, 8); hitStop = 0.04;
  if (!run.demo) SFX.shatter();
  if (label) addPop(label, LINE, PY - 110, 28, run.accent);
}
function die(o) {
  const R = run; R.dead = true;
  if (R.demo) { startRun(true); return; }
  hitStop = 0.14; shake = 22; flash = 1; tsTarget = 0.25;
  burst(player.x, PY, 60, 700); burst(player.x, PY, 20, 400, R.accent);
  SFX.death();
  // stats
  const score = Math.floor(R.score), prevBest = save.best;
  const newBest = score > prevBest;
  if (newBest) { save.best = score; save.bestDist = R.dist; setTimeout(() => SFX.best(), 700); }
  save.lastScore = score; save.tut = true;
  checkGoals(false);
  persist();
  let msg = null;
  if (newBest && prevBest > 0) msg = 'NEW BEST! +' + fmt(score - prevBest);
  else if (newBest) msg = 'First score on the board!';
  else if (score >= prevBest * 0.8) msg = 'SO CLOSE: only ' + fmt(prevBest - score) + ' from your best!';
  if (!msg) {
    let bestG = null, bp = 0;
    for (const gl of activeGoalList()) { const p = goalProg(gl); if (p > bp) { bp = p; bestG = gl; } }
    if (bestG && bp >= 0.5) msg = 'Almost: ' + bestG.t + ' (' + fmt(goalVal(bestG)) + '/' + fmt(bestG.n) + ')';
  }
  overInfo = { score, newBest, best: save.best, dist: Math.floor(R.dist / 40), gear: R.gear, close: R.close, perfect: R.perfect, sparks: R.sparks, mult: R.maxMult, time: R.t, msg, tip: pick(TIPS), shifts: R.shifts };
  setTimeout(() => { if (run === R) { state = 'over'; overT = clock; tsTarget = 1; } }, 650);
  window.__game.deaths++;
}
function updateFx(dt) {
  shake = Math.max(0, shake - dt * 60);
  flash = Math.max(0, flash - dt * 2.5);
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3; p.life -= dt; }
  parts = parts.filter(p => p.life > 0); if (parts.length > 400) parts.splice(0, parts.length - 400);
  for (const p of pops) { p.y -= 40 * dt; p.life -= dt; }
  pops = pops.filter(p => p.life > 0);
  for (const t of toasts) t.life -= dt;
  toasts = toasts.filter(t => t.life > 0);
  if (run && run.accentT > 0) run.accentT -= dt;
}

// ---------- drawing ----------
function setT(sx, sy) { cx.setTransform(S * dpr, 0, 0, S * dpr, (OX + sx) * dpr, (OY + sy) * dpr); }
function text(str, x, y, size, align, weight, col, base) {
  cx.font = (weight || 800) + ' ' + size + 'px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  cx.textAlign = align || 'center'; cx.textBaseline = base || 'middle';
  if (col) cx.fillStyle = col;
  cx.fillText(str, x, y);
}
function draw() {
  const sx = shake ? rand(-shake, shake) * 0.5 : 0, sy = shake ? rand(-shake, shake) * 0.5 : 0;
  setT(0, 0);
  cx.globalCompositeOperation = 'source-over';
  cx.globalAlpha = 1;
  // halves (extend to screen edges)
  cx.fillStyle = LIGHT; cx.fillRect(VL - 20, VT - 20, LINE - VL + 20, VB - VT + 40);
  cx.fillStyle = DARK; cx.fillRect(LINE, VT - 20, VR - LINE + 20, VB - VT + 40);
  setT(sx, sy);
  const R = run;
  const acc = R ? R.accent : ACCENTS[0];
  const dim = 1;
  // scrolling guide lines (inverted)
  cx.globalCompositeOperation = 'difference';
  cx.fillStyle = '#ffffff';
  const scroll = R ? R.dist % 80 : 0;
  cx.globalAlpha = 0.06;
  for (let y = VT - 80 + scroll; y < VB; y += 80) cx.fillRect(VL, y, VR - VL, 2);
  // speed streaks
  cx.globalAlpha = 0.08;
  for (let i = 0; i < 6; i++) { const lx = LINE + (i % 2 ? 1 : -1) * (40 + (i * 53) % 190); const ly = ((R ? R.dist * 1.7 : clock * 300) + i * 191) % (VB - VT + 200) + VT - 100; cx.fillRect(lx, ly, 2, 60 + (R ? R.speed / 12 : 20)); }
  cx.globalAlpha = 1;
  // ghost best line
  if (R && !R.demo && save.bestDist > 0 && state !== 'title') {
    const by = PY - (save.bestDist - R.dist);
    if (by > VT - 20 && by < VB) {
      cx.globalAlpha = R.passedBest ? 0.35 : 0.8;
      for (let x = VL; x < VR; x += 22) cx.fillRect(x, by, 12, 3);
      text('BEST ' + fmt(save.best), LINE + 70, by - 14, 16, 'center', 800);
      cx.globalAlpha = 1;
    }
  }
  // walls
  if (R) for (const o of objs) {
    if (o.k !== 'block' || o.smashed) continue;
    let x0, x1;
    if (o.to && o.shifted && o.slide < 1) {
      const e = easeOut(o.slide), fl = -o.to < 0;
      const fx0 = fl ? VL - 10 : LINE + 3, fx1 = fl ? LINE - 3 : VR + 10;
      const tx0 = fl ? LINE + 3 : VL - 10, tx1 = fl ? VR + 10 : LINE - 3;
      x0 = fx0 + (tx0 - fx0) * e; x1 = fx1 + (tx1 - fx1) * e;
    } else if (o.side < 0) { x0 = VL - 10; x1 = LINE - 3; } else { x0 = LINE + 3; x1 = VR + 10; }
    cx.globalAlpha = dim; cx.fillRect(x0, o.y, x1 - x0, o.len);
    // hatch pattern on the wall's front edge + arrows on shifters
    cx.globalAlpha = 0.45 * dim;
    cx.fillRect(x0, o.y + o.len - 8, x1 - x0, 3);
    if (o.to && !o.shifted) {
      const blink = (Math.sin(clock * 18) > 0) ? 1 : 0.55;
      cx.globalAlpha = blink;
      const ax = LINE + o.side * 110, dir = o.to;
      for (let k = -1; k <= 1; k++) {
        const yy = o.y + o.len / 2 + k * 34;
        if (yy < o.y + 12 || yy > o.y + o.len - 12) continue;
        cx.beginPath(); cx.moveTo(ax - dir * 26, yy - 14); cx.lineTo(ax + dir * 18, yy); cx.lineTo(ax - dir * 26, yy + 14); cx.lineTo(ax - dir * 14, yy); cx.closePath(); cx.fill();
      }
    }
    cx.globalAlpha = 1;
  }
  // sparks
  cx.globalAlpha = dim;
  if (R) for (const o of objs) {
    if (o.done) continue;
    if (o.k === 'spark') {
      const x = laneX(o.side), r = o.r * (1 + 0.15 * Math.sin(clock * 10 + o.y * 0.05));
      cx.beginPath(); cx.moveTo(x, o.y - r); cx.lineTo(x + r * 0.7, o.y); cx.lineTo(x, o.y + r); cx.lineTo(x - r * 0.7, o.y); cx.closePath(); cx.fill();
    }
  }
  // particles (inverted)
  for (const p of parts) if (!p.col) { cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); }
  cx.globalAlpha = 1;
  // player
  if (R && !R.dead) {
    for (let i = 0; i < player.trail.length; i++) { const t = player.trail[i]; cx.globalAlpha = (i / player.trail.length) * 0.25; const s = PSZ * 0.6; cx.fillRect(t.x - s / 2, t.y - s / 2 + (player.trail.length - i) * 3, s, s); }
    cx.globalAlpha = dim;
    const sq = player.sq, bx = player.bump > 0 ? Math.sin(player.bump * 80) * 4 : 0;
    const w = PSZ * 2 * (1 + 0.35 * sq), h = PSZ * 2 * (1 - 0.25 * sq);
    cx.save(); cx.translate(player.x + bx, PY); cx.rotate((player.side * sq) * 0.6);
    cx.fillRect(-w / 2, -h / 2, w, h);
    cx.restore(); cx.globalAlpha = 1;
  }
  // normal-mode colour accents
  cx.globalCompositeOperation = 'source-over';
  // centre line
  const lw = 3 + beatPulse * 3 + (R && R.od > 0 ? 3 : 0);
  cx.fillStyle = acc; cx.globalAlpha = 0.16; cx.fillRect(LINE - lw * 1.6, VT - 20, lw * 3.2, VB - VT + 40);
  cx.globalAlpha = 1; cx.fillRect(LINE - lw / 2, VT - 20, lw, VB - VT + 40);
  if (R) {
    for (const o of objs) {
      if (o.done) continue;
      if (o.k === 'gold' || o.k === 'shield') {
        const x = laneX(o.side), r = o.r + Math.sin(clock * 8) * 2, c = o.k === 'gold' ? '#facc15' : '#22d3ee';
        cx.globalAlpha = 0.3; cx.fillStyle = c; cx.beginPath(); cx.arc(x, o.y, r * 2, 0, 7); cx.fill();
        cx.globalAlpha = 1; cx.save(); cx.translate(x, o.y); cx.rotate(clock * 2);
        cx.beginPath();
        if (o.k === 'gold') { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } }
        else cx.arc(0, 0, r, 0, 7);
        cx.closePath(); cx.fill(); cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.stroke(); cx.restore();
      }
    }
    // player rim (accent) + shield + overdrive glow
    if (!R.dead) {
      if (R.shield) { cx.strokeStyle = '#22d3ee'; cx.lineWidth = 3; cx.beginPath(); cx.arc(player.x, PY, PSZ * 1.6 + Math.sin(clock * 6) * 2, 0, 7); cx.stroke(); }
      if (R.od > 0) { cx.fillStyle = '#facc15'; cx.globalAlpha = 0.35 + 0.2 * Math.sin(clock * 20); cx.beginPath(); cx.arc(player.x, PY, PSZ * 2.2, 0, 7); cx.fill(); cx.globalAlpha = 1; }
      if (R.inv > 0 && !R.od) { cx.strokeStyle = acc; cx.globalAlpha = 0.6; cx.lineWidth = 2; cx.strokeRect(player.x - PSZ * 1.3, PY - PSZ * 1.3, PSZ * 2.6, PSZ * 2.6); cx.globalAlpha = 1; }
    }
  }
  for (const p of parts) if (p.col) { cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillStyle = p.col; cx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); }
  cx.globalAlpha = 1;
  // tutorial prompt
  if (R && R.prompt && state === 'play') drawPrompt(R.prompt);
  // pops
  for (const p of pops) {
    const a = Math.min(1, p.life / p.max * 2), sc = 1 + Math.max(0, (p.life - p.max + 0.15)) * 3;
    cx.globalAlpha = a;
    if (p.col) { text(p.text, p.x, p.y, p.size * sc, 'center', 900, p.col); }
    else { cx.globalCompositeOperation = 'difference'; text(p.text, p.x, p.y, p.size * sc, 'center', 900, '#fff'); cx.globalCompositeOperation = 'source-over'; }
  }
  cx.globalAlpha = 1;
  // flash
  if (flash > 0) { setT(0, 0); cx.globalCompositeOperation = 'difference'; cx.globalAlpha = Math.min(0.5, flash * 0.5); cx.fillStyle = '#fff'; cx.fillRect(VL, VT, VR - VL, VB - VT); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; setT(sx, sy); }
  setT(0, 0);
  if (state === 'play' || state === 'pause') drawHUD();
  if (state === 'title') drawTitle();
  if (state === 'over') drawOver();
  if (state === 'pause') drawPause();
  drawToasts();
  if (!COVER) drawMute();
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function drawPrompt(side) {
  const x = laneX(side), y = PY - 150, pulse = 1 + 0.08 * Math.sin(clock * 10);
  cx.save(); cx.translate(x, y); cx.scale(pulse, pulse);
  cx.fillStyle = run.accent; cx.globalAlpha = 0.95;
  cx.beginPath(); cx.roundRect ? cx.roundRect(-92, -46, 184, 92, 16) : cx.rect(-92, -46, 184, 92); cx.fill();
  cx.globalAlpha = 1;
  const touch = lastInputTouch || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  text(side < 0 ? '◀' : '▶', 0, -14, 30, 'center', 900, '#0e0d14');
  text(touch ? (side < 0 ? 'TAP LEFT' : 'TAP RIGHT') : (side < 0 ? 'LEFT SHIFT' : 'RIGHT SHIFT'), 0, 22, 22, 'center', 900, '#0e0d14');
  cx.restore();
  cx.globalCompositeOperation = 'difference';
  text('Walls fill a whole side. Shift away!', LINE, PY + 90, 18, 'center', 800, '#fff');
  cx.globalCompositeOperation = 'source-over';
}
function drawGearStick(x, y, gear, acc) {
  // little H-pattern gear gate
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
  cx.globalAlpha = 0.6; text('BEST ' + fmt(Math.max(save.best, Math.floor(R.score))), LINE, top + 70, 15, 'center', 800, '#fff'); cx.globalAlpha = 1;
  text(Math.floor(R.dist / 40) + ' m', 20, top + 76, 16, 'left', 800, '#fff');
  text(R.gear <= 6 ? 'GEAR ' + R.gear : 'OVERTIME', 64, top + 22, 16, 'left', 900, '#fff');
  cx.globalCompositeOperation = 'source-over';
  drawGearStick(20, top + 8, R.gear, R.accent);
  // multiplier + combo drain bar
  const mx = W - 20;
  cx.globalCompositeOperation = 'difference';
  text('x' + R.mult, mx - 40, top + 30, 34, 'right', 900, '#fff');
  cx.globalCompositeOperation = 'source-over';
  if (R.comboT > 0) { cx.fillStyle = R.accent; cx.fillRect(mx - 130, top + 56, 90 * (R.comboT / 3), 6); }
  // gear progress (almost-there bar)
  if (!R.tutorial) { const p = Math.min(1, R.gearT / gearLen(R.gear)); cx.fillStyle = R.accent; cx.globalAlpha = 0.85; cx.fillRect(LINE - 60, top + 86, 120 * p, 4); cx.globalAlpha = 0.25; cx.fillRect(LINE - 60, top + 86, 120, 4); cx.globalAlpha = 1; }
  if (R.od > 0) { cx.fillStyle = '#facc15'; cx.fillRect(0, VB - 10, W * (R.od / 5), 10); text('OVERDRIVE', LINE, VB - 28, 20, 'center', 900, '#facc15'); }
}
function drawTitle() {
  const t = titleT;
  cx.globalCompositeOperation = 'difference';
  cx.fillStyle = '#fff';
  const y0 = COVER ? 270 : 210 + Math.sin(t * 2) * 6, k = COVER ? 1.45 : 1;
  text('SHIFT', LINE, y0, 104 * k, 'center', 900, '#fff');
  text('SIDE', LINE, y0 + 92 * k, 104 * k, 'center', 900, '#fff');
  text('Two worlds. Two Shift keys. One line.', LINE, y0 + (COVER ? 225 : 160), COVER ? 24 : 19, 'center', 800, '#fff');
  if (COVER) { cx.globalCompositeOperation = 'source-over'; return; }
  const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  cx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 5);
  text(touch ? 'TAP LEFT or RIGHT to start' : 'Press  ⇧ SHIFT  to start', LINE, y0 + 225, 24, 'center', 900, '#fff');
  cx.globalAlpha = 0.75;
  text(touch ? 'Tap a side to jump into that world' : 'Left Shift = left world · Right Shift = right world', LINE, y0 + 262, 15, 'center', 700, '#fff');
  text(touch ? '' : '(arrows or A / D work too · M mute · P pause)', LINE, y0 + 284, 13, 'center', 700, '#fff');
  cx.globalAlpha = 1;
  if (save.best > 0) {
    text('BEST ' + fmt(save.best) + '  ·  ' + RANKS[rankOf(doneCount())].toUpperCase(), LINE, y0 + 330, 17, 'center', 900, '#fff');
  }
  cx.globalCompositeOperation = 'source-over';
  if (!COVER) drawGoals(LINE, y0 + 370, 0.92);
}
function drawGoals(x, y, alpha) {
  const gl = activeGoalList(); if (!gl.length) return;
  cx.globalAlpha = alpha;
  cx.fillStyle = 'rgba(14,13,20,0.95)';
  const w = 330, h = 30 + gl.length * 34;
  cx.beginPath(); cx.roundRect ? cx.roundRect(x - w / 2, y, w, h, 12) : cx.rect(x - w / 2, y, w, h); cx.fill();
  text('SHIFT GOALS', x, y + 16, 13, 'center', 900, '#9a97a8');
  gl.forEach((g, i) => {
    const yy = y + 36 + i * 34, p = goalProg(g);
    text(g.t, x - w / 2 + 14, yy, 14, 'left', 800, '#f3efe6');
    text(fmt(goalVal(g)) + '/' + fmt(g.n), x + w / 2 - 14, yy, 13, 'right', 800, p >= 0.8 ? '#facc15' : '#9a97a8');
    cx.fillStyle = '#2a2836'; cx.fillRect(x - w / 2 + 14, yy + 10, w - 28, 4);
    cx.fillStyle = p >= 0.8 ? '#facc15' : (run ? run.accent : ACCENTS[0]); cx.fillRect(x - w / 2 + 14, yy + 10, (w - 28) * p, 4);
  });
  cx.globalAlpha = 1;
}
function drawOver() {
  const o = overInfo; if (!o) return;
  const a = Math.min(1, (clock - overT) * 4);
  cx.globalAlpha = a * 0.7; cx.fillStyle = '#000'; cx.fillRect(VL, VT, VR - VL, VB - VT); cx.globalAlpha = a;
  const x = LINE, w = 360, y = 90;
  cx.fillStyle = 'rgba(14,13,20,0.96)';
  cx.beginPath(); cx.roundRect ? cx.roundRect(x - w / 2, y, w, 420, 18) : cx.rect(x - w / 2, y, w, 420); cx.fill();
  cx.strokeStyle = run.accent; cx.lineWidth = 3; cx.stroke();
  text('SHIFT OVER', x, y + 34, 30, 'center', 900, '#f3efe6');
  text(fmt(o.score), x, y + 92, 58, 'center', 900, run.accent);
  text('BEST ' + fmt(o.best), x, y + 132, 16, 'center', 800, '#9a97a8');
  if (o.newBest) {
    cx.save(); cx.translate(x + 120, y + 70); cx.rotate(-0.25); const sc = 1 + Math.max(0, 0.4 - (clock - overT)) * 2; cx.scale(sc, sc);
    cx.strokeStyle = '#facc15'; cx.lineWidth = 3; cx.strokeRect(-52, -18, 104, 36); text('NEW BEST', 0, 1, 18, 'center', 900, '#facc15'); cx.restore();
  }
  const rows = [['Distance', o.dist + ' m'], ['Top gear', o.gear <= 6 ? 'GEAR ' + o.gear : 'OVERTIME ' + (o.gear - 6)], ['Close shifts', o.close + '  (' + o.perfect + ' perfect)'], ['Sparks', o.sparks], ['Best multiplier', 'x' + o.mult], ['Time', o.time.toFixed(1) + ' s']];
  rows.forEach((r, i) => { const yy = y + 170 + i * 27; text(r[0], x - w / 2 + 24, yy, 15, 'left', 700, '#9a97a8'); text(String(r[1]), x + w / 2 - 24, yy, 15, 'right', 900, '#f3efe6'); });
  if (o.msg) text(o.msg, x, y + 345, o.msg.length > 34 ? 14 : 16, 'center', 900, o.newBest ? '#facc15' : run.accent);
  text(o.tip, x, y + 372, 12, 'center', 700, '#9a97a8');
  const ready = clock - overT > 0.45;
  cx.globalAlpha = a * (ready ? 0.6 + 0.4 * Math.sin(clock * 6) : 0.3);
  const touch = lastInputTouch || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  text(touch ? 'TAP to shift again' : 'Press SHIFT to shift again', x, y + 400, 18, 'center', 900, '#f3efe6');
  cx.globalAlpha = a;
  drawGoals(x, y + 440, a);
  cx.globalAlpha = 1;
}
function drawPause() {
  cx.globalAlpha = 0.6; cx.fillStyle = '#000'; cx.fillRect(VL, VT, VR - VL, VB - VT); cx.globalAlpha = 1;
  text('PAUSED', LINE, 360, 54, 'center', 900, '#f3efe6');
  text('Press any Shift key or tap to resume', LINE, 410, 17, 'center', 700, '#9a97a8');
}
function drawToasts() {
  toasts.forEach((t, i) => {
    const a = Math.min(1, t.life * 3, (t.max - t.life) * 6);
    cx.globalAlpha = a;
    const y = (state === 'play' ? 150 : VT + 40) + i * 40 + Math.max(0, (t.max - t.life) < 0.15 ? 20 : 0);
    cx.font = '900 16px "Trebuchet MS", system-ui, sans-serif';
    const w = cx.measureText(t.text).width + 30;
    cx.fillStyle = 'rgba(14,13,20,0.9)'; cx.beginPath(); cx.roundRect ? cx.roundRect(LINE - w / 2, y - 16, w, 32, 16) : cx.rect(LINE - w / 2, y - 16, w, 32); cx.fill();
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

// ---------- loop ----------
window.__game = { deaths: 0, fps: 0, frames: 0, get state() { return state; }, get score() { return run ? Math.floor(run.score) : 0; }, get gear() { return run ? run.gear : 0; }, get t() { return run ? run.t : 0; }, get save() { return save; }, get prompt() { return run ? run.prompt : null; }, get audio() { return AU.c ? AU.c.state : 'none'; }, get dist() { return run ? Math.floor(run.dist / 40) : 0; } };
const ft = [];
let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  ft.push(rdt); if (ft.length > 120) ft.shift();
  window.__game.frames++;
  if (window.__game.frames % 30 === 0) { const avg = ft.reduce((a, b) => a + b, 0) / ft.length; window.__game.fps = avg > 0 ? Math.round(1 / avg) : 0; }
  try { update(rdt); draw(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
if (AUTOPLAY) { setTimeout(() => { startRun(false); }, 300); }
requestAnimationFrame(frame);
})();
