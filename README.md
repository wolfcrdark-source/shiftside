# SHIFTSIDE

**Two worlds. Two Shift keys. One line.**

An entry for **GitHub Game Off 2026** (theme: **SHIFT**). It's a fast, minimalist arcade game built from scratch in November 2026.

The screen is split by a glowing line: a light DAY world on the left and a dark NIGHT world on the right. Walls rush toward you and each one fills a whole world, so you are always deciding which side to be on. **Left Shift** jumps you into the left world and **Right Shift** into the right one. Hold **both** to ride the line itself. Shift at the last instant for CLOSE and PERFECT bonuses, build your multiplier before it drains, grab Golden Prisms for OVERDRIVE, and fight through six zones and an endless OVERTIME. With every gear the speed rises, the colours change and the music **shifts key**.

## What's new in v2
- **Six zones, each with a signature hazard**, introduced slowly with a one-line prompt:
  1. DAYBREAK: walls, zig-zags, sparks
  2. SWING SHIFT: *shifter walls* that jump sides (striped arrows)
  3. PRISM: *prism walls* fill both worlds except a slit on the line. Hold both Shifts (or both thumbs) to **ride the line** through them, and grab risky *line sparks*.
  4. MIRROR: at a marker line the worlds *flip sides* with a card-flip animation. You stay in your world and the controls stay screen-left/right.
  5. BLACKOUT: above a visibility edge you only see silhouettes, and the walls flash on the beat
  6. RUSH HOUR: *double shifters* that jump twice, plus mini-rushes
  7. OVERTIME: an endless remix of everything, with flips and blackouts on timers and speed rising to the cap
- **RUSH set-pieces:** every gear ends in a beat-spaced wall chorus with its own melody. Clear it to shift up.
- **Daily Challenge:** the same wall sequence for everyone each day, with its own best score.
- **Unlockable skins:** Square, Diamond, Circle, Hexagon, Star, Plus and Ring, earned through goal ranks.
- **20 shift goals**, danger chevrons for fast walls, "So close to <next zone>!" on game over, and per-mechanic sound cues.

## Controls
| Action | Keyboard | Touch / mouse |
|---|---|---|
| Jump to the left side | **Left Shift** (or ← / A) | Tap/click the left half |
| Jump to the right side | **Right Shift** (or → / D) | Tap/click the right half |
| Ride the line (hold) | Hold **both Shifts**, or hold Space / ↑ / W | Hold both thumbs (one on each half) |
| Daily Challenge (title) | ↓ / S | DAILY CHALLENGE button |
| Change skin (title) | C | Skin chip (top left) |
| Pause | P or Esc (Esc on game over = menu) | Pause icon (top right) |
| Mute | M | Speaker icon on the title/game-over screens |

Releasing one of the two held Shifts rolls you onto the side that is still held. After a MIRROR flip, Left Shift still means "go to the left of the screen".

> On Windows, pressing Shift five times can open the *Sticky Keys* prompt. Pick "No" or use the arrow keys or A / D. (Yes, the jam brief warned us.)

## Features
- Tutorial by doing on your first run: time slows down and the game shows which side to shift to. Hits in the first 35 s are free saves.
- Close shifts / PERFECT shifts / prism THREADS (with hit-stop), a draining combo multiplier up to x8, sparks, Golden Prism Overdrive (with a pity timer) and shield orbs.
- Six zones plus OVERTIME, each ending in a RUSH. Each gear brings a breather full of sparks, and the speed, colour, background motif and musical key all shift.
- A ghost "BEST" line that scrolls past at your best distance (separately for the Daily).
- 20 shift goals (3 active at a time, which can complete mid-run), work-shift ranks from *Trainee* to *Overlord of Overtime*, and skins unlocked by rank.
- A game-over stats card with near-miss feedback and instant restart.
- Procedural everything: Canvas 2D graphics drawn in "difference" mode, so anything crossing the line inverts, plus WebAudio-synthesised sound effects and a 16-step music sequencer.
- Works on desktop and mobile (responsive, multi-touch, no scroll or zoom). Progress is saved in localStorage.

## Run it
It's a static site with no build step and no dependencies at runtime.
```
cd game && python3 -m http.server 8000   # then open http://localhost:8000
```
Opening `game/index.html` directly from disk also works.

URL options for testing: `?autoplay=1` (the built-in bot plays and handles every mechanic), `?zone=N` (start at gear N), `?fast=1` (short gears), `?daily=1` (with autoplay), `?cover=1` (cover-image scene).

### Tests (optional)
```
npm install            # installs Playwright (dev only)
node tools/zones.mjs   # screenshots of every zone/mechanic (shots/v2_*.png)
node tools/test.mjs    # real keyboard/touch play, 95 s autoplay, daily, restart; writes shots/ and tools/test_report.json
node tools/record.mjs  # records video/shiftside_v2_gameplay.mp4 (needs ffmpeg)
```
The test uses the system Chrome at `/usr/bin/google-chrome` (override it with `CHROME=/path/to/chrome`).

## Project layout
```
game/            the playable build (index.html at root, js/game.js)
shots/           screenshots + 630x500 cover image
tools/           headless test + screenshot scripts
design.md        design document (concepts, theme, psychology, tuning)
itch_page.md     itch.io page text and upload settings
game.zip         upload-ready HTML5 build (index.html at the zip root)
```

## Credits
- Design, code, art and audio: Anush B, with an AI assistant (see below).
- No third-party assets, fonts or libraries ship in the game. Text uses the player's system fonts.

## AI disclosure
This game was made with heavy AI assistance, in line with the Game Off 2026 rules, which allow AI if it's disclosed:
- **Code:** written by an AI coding assistant (Grok Bot) and directed, reviewed and play-tested by the author.
- **Design:** brainstormed with the AI assistant, drawing on game-design and psychology research notes (flow, variable rewards, near-miss and goal-gradient effects).
- **Art and audio:** no AI-generated images or audio. All visuals are drawn procedurally with Canvas 2D code, and all sound and music are synthesised at runtime with WebAudio code. That code was itself AI-assisted.
- **Testing:** automated Playwright tests and screenshots were written and run with AI assistance.

## Licence
MIT. See [LICENSE](LICENSE).
