# SHIFTSIDE

**Two worlds. Two Shift keys. One line.**

An entry for **GitHub Game Off 2026** (theme: **SHIFT**). It's a fast, minimalist arcade game built from scratch in November 2026.

The screen is split by a glowing line: a light DAY world on the left and a dark NIGHT world on the right. Walls rush toward you and each one fills a whole world, so you are always deciding which side to be on. **Left Shift** jumps you into the left world and **Right Shift** into the right one. Shift at the last instant for CLOSE and PERFECT bonuses, build your multiplier before it drains, grab Golden Prisms for OVERDRIVE, and shift up through the gears. With every gear the speed rises, the colours change and the music **shifts key**.

## Controls
| Action | Keyboard | Touch / mouse |
|---|---|---|
| Jump to the left world | **Left Shift** (or ← / A) | Tap/click the left half |
| Jump to the right world | **Right Shift** (or → / D) | Tap/click the right half |
| Toggle sides | Space / ↑ / ↓ / W / S | |
| Pause | P or Esc | Pause icon (top right) |
| Mute | M | Speaker icon on the title/game-over screens |

> On Windows, pressing Shift five times can open the *Sticky Keys* prompt. Pick "No" or use the arrow keys or A / D. (Yes, the jam brief warned us.)

## Features
- Tutorial by doing on your first run: time slows down and the game shows which side to shift to. The first run is forgiving: hits in the first 35 s are free saves.
- Close shifts / PERFECT shifts (with hit-stop), a draining combo multiplier up to x8, sparks, Golden Prism Overdrive (with a pity timer) and shield orbs.
- Gear shifts every ~20 s, each with a short breather full of sparks. Speed, colour and the music's key all shift up.
- A ghost "BEST" line that scrolls past at your best distance.
- 18 shift goals (3 active at a time, which can complete mid-run) and work-shift ranks from *Trainee* to *Overlord of Overtime*.
- A game-over stats card with "so close" feedback and instant restart.
- Procedural everything: Canvas 2D graphics drawn in "difference" mode, so anything crossing the line inverts, plus WebAudio-synthesised sound effects and a 16-step music sequencer.
- Works on desktop and mobile (responsive, no scroll or zoom). Progress is saved in localStorage.

## Run it
It's a static site with no build step and no dependencies at runtime.
```
cd game && python3 -m http.server 8000   # then open http://localhost:8000
```
Opening `game/index.html` directly from disk also works.

`?autoplay=1` lets the built-in bot play (used for automated testing).

### Tests (optional)
```
npm install            # installs Playwright (dev only)
node tools/test.mjs    # serves ./game, plays ~3 minutes headless, writes shots/ and tools/test_report.json
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
