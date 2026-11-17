# SHIFTSIDE: Game Design (GitHub Game Off 2026, theme "SHIFT")

Made in November 2026 for Game Off 2026 (https://itch.io/jam/game-off-2026).
Submission deadline: 1 Dec 2026, 13:37 PST (2 Dec 2026, 03:07 IST). Target finish: 28 Nov 2026.

## Jam rules checked (jam page + official FAQ topic, read 17 Nov 2026)
- Start during the jam; templates/libraries are OK, but most work happens in November. This game is new: written from scratch in Nov 2026.
- Source must be in a **public GitHub repository** (any licence). We use MIT. The repo URL is asked for at submission.
- Any tools allowed. **AI use is allowed and must be disclosed** at submission (and in the README).
- Submit on itch.io before the deadline; pushing to GitHub alone does not enter the game.
- Only use assets we made or have rights to. Everything here is procedural (Canvas drawing + WebAudio synthesis), so no third-party assets at all.
- Judged by participants on Overall, Gameplay, Graphics, Audio, Innovation and Theme interpretation.

## Three concepts considered

### A. SHIFTSIDE (chosen)
The screen is split by a glowing vertical line: the left half is a light world (DAY), the right half a dark world (NIGHT). You are a small square riding the line while the world rushes toward you. **Left Shift** jumps you to the left world, **Right Shift** to the right world (or tap the left/right half of the screen; arrows and A/D also work). Walls fill one world at a time, so you are always choosing a side. Everything is drawn in "difference" mode, so whatever crosses the line inverts its colour. Every 20-ish seconds you **shift gear**: speed goes up, the music shifts key and the accent colour changes, with a short breather full of sparks first.
- Theme: four kinds of shift at once. The only buttons are the two Shift keys (straight from the jam brief), you shift between two worlds, you shift gears, and the music literally key-shifts. The rank titles are work shifts (Day Shifter, Night Shifter, Graveyard Shift...).
- Learn: one decision, "left or right?". Explaining it takes 2 seconds.
- Master: close shifts (dodging at the last instant) build a multiplier that drains if you play safe; zig-zags, long corridors with spark bait on the other side, and *shifter* walls that jump to your side mid-approach.
- Visually distinct: a stark two-tone split with colour inversion is readable in a thumbnail and doesn't look like anything else on the jam page.

### B. BIT SHIFT
You control a byte (8 lamps). Left/Right Shift does `<<` and `>>`. Falling "masks" must be matched by shifting your bits into the holes before they land. It's clever and on-theme but puzzly; new players stall thinking, so there's less "one more try" and it's harder to read at a glance.

### C. GEAR SHIFT
A one-button drag race: tap to shift up exactly in the rev-limiter's green band, and keep traffic lanes in your head. It has great juice potential but mastery tops out fast (it's a timing bar), and it's a familiar genre.

**Why A:** it's the simplest to learn (two buttons, one binary choice), it's deep through speed, close-shift risk/reward and pattern reading, it creates instant "one more try" with sub-second restarts, and it has the most striking look.

## Core loop (seconds)
1. Walls scroll down toward the player at y=640 (logical 480x800 field, scaled to fit any screen).
2. A wall occupies a whole side, so if it's on your side, shift.
3. Shifting within 0.35 s of a wall passing gives **CLOSE!** (+50 x mult); within 0.15 s gives **PERFECT!** (+100 x mult, hit-stop, chime).
4. Sparks (diamonds) give +10 x mult and keep the combo alive.
5. One hit ends the run, unless you have a shield or are in Overdrive.

## Reward design (reused from our earlier research: /workspace/mindblown/research.md)
| Principle | How SHIFTSIDE uses it |
|---|---|
| Fixed + variable rewards (Hopson; variable-ratio schedules) | Distance points and sparks are reliable. **Golden Prism** (~6% per pattern, pity-timer guarantees one within 14 patterns) gives OVERDRIVE: 5 s of smashing walls for points, faster music and an open filter. **Shield** orbs are rare. |
| Flow (Csikszentmihalyi, Chen) | Speed ramps within each gear (+15%), then a **gear shift** bumps it, preceded by a 2 s breather full of sparks. That's a sawtooth difficulty curve. Wall gaps are always >= reaction time + player size. |
| Near-miss (Reid; Clark et al. 2009) | Close/Perfect shifts *are* near-misses that you get paid for. Game over says "SO CLOSE: only N points from your best" when within 20%. |
| Loss aversion (Kahneman & Tversky) | The multiplier (up to x8) drains after 3 s without a close shift or spark, with "COMBO DROPPED" feedback. Playing safe costs you. |
| Ghost best score | A dashed **BEST** line scrolls past at your best distance, and passing it triggers "NEW BEST!" mid-run. The HUD shows the best score under the current score. |
| Zeigarnik / goal gradient | 18 sequential goals, 3 active at once, with progress bars on title and game over. Game over names the goal you are closest to finishing ("Almost: 8 PERFECT shifts (6/8)"). Goals complete live, mid-run, with a toast. Every 2 goals raise your rank (Trainee to Overlord of Overtime). |
| Kind scripted first run | The first-ever run is a tutorial by doing: a wall comes on your side, time slows to 12% and a big arrow/key prompt shows which side to shift to; it waits for you. Then sparks, a zig-zag, and a guaranteed Golden Prism at about 20 s. For the first 35 s of that run, hits shatter the wall instead of killing you ("first shift is on the house"). |
| Peak-end rule | Death = hit-stop, big shake, a burst of inverted shards, slow-motion, then a clean stats card with a NEW BEST stamp. Retry is one keypress or tap away (0.45 s guard against accidental presses). |
| Juice | Screen shake, particles at the line on every shift, squash/stretch, trail, hit-stop on Perfect and death, score popups, a beat-synced line pulse and gear-coloured accents. |
| Mastery | Wall patterns get introduced one at a time by gear: singles and short zig-zags, then long corridors with bait sparks, stairs, shifter walls (telegraphed with arrows), and longer zig-zags. |

No ads, no currencies, no timers that nag you to come back, no fake scarcity. Ethical "one more try" only.

## Difficulty
- Speed: 290 + 75 x (gear - 1) units/s, +15% within a gear, capped at 1000.
- Gear length: 20 + 2 x gear seconds. Gears 1-6 are shown on an H-pattern gearstick in the HUD; past that it's OVERTIME.
- Wall gap between alternating sides >= 30 + speed x max(0.2, 0.42 - 0.025 x gear) units.
- Shifter walls switch sides at least 0.5 s before reaching you.

## Controls
- Keyboard: Left Shift / Right Shift (primary). Arrow keys or A/D also work. Space toggles sides. P/Esc pauses, M mutes.
- Touch/mouse: tap or click the left or right half of the screen.
- Windows warning: pressing Shift 5 times can open the Sticky Keys prompt. The title screen mentions using the arrow keys if that happens (a nod to the jam brief's joke).

## Audio (all WebAudio, procedural)
- SFX: shift whoosh (higher pitch for the left/day side, lower for night), sparks climbing a pentatonic scale with the combo, Close/Perfect chimes, gear-up arpeggio, overdrive sparkle, shield, wall shatter, death crunch and a new-best fanfare.
- Music: a 16-step sequencer (kick, hat, snare, bass, arpeggio) on an i-VI-VII-v progression. Tempo rises and the **key shifts up 2 semitones each gear**. It's low-passed on the title and game-over screens and opens up in play and further in Overdrive.

## Tech
- Vanilla JS + Canvas 2D, no libraries, no network requests. Files: index.html, js/game.js.
- Responsive: a fixed 480x800 logical field scaled to fit, with backgrounds and walls extended to the screen edges. DPR capped at 2.
- Mobile: viewport user-scalable=no, touch-action:none, overscroll none, pointerdown input.
- Saves to localStorage key `shiftside.v1`: best score/distance, totals, per-run bests, goals, mute and the tutorial flag.
- Test hooks: `?autoplay=1` lets the built-in bot play (it also drives the title-screen attract mode). `window.__game` exposes state/fps for tests.
