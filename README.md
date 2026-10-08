# Tactical Scrum (desktop app)

Scrum training boards with a military crosswalk toggle. Electron wrapper, no network, saves to one JSON file.

## Run it
```
npm install
npm start
```

## Build the Windows portable .exe
```
npm run dist:win
```
Output: `dist\Tactical-Scrum-0.2.0-portable.exe` (no installer, run it from anywhere, even a USB stick).
If electron-builder fails with "Cannot create symbolic link", turn on Windows Developer Mode (Settings > For developers) or run the terminal as Administrator, then retry.

## Build for Mac (no Mac needed)
Push this folder to a GitHub repo and run the "Build installers" workflow (Actions tab). It produces the .exe and a .dmg as downloadable artifacts. The .dmg is unsigned: on first launch, right-click the app and choose Open.

## Where data lives
Windows: `%APPDATA%\Tactical Scrum\tactical-scrum.json`. Setup > Export to file makes a copy you can keep or move.

## What v0.2 adds
- Setup: choose a Theme (default coyote, Army, Navy, Marine Corps, Air Force, Space Force, Coast Guard, USCYBERCOM). Each loads its usual planning process and a starter mission. Theme, planning process and mission can then be changed independently.
- Planning process panel at the bottom of every board (turn on "Military crosswalk"), plus a Planning process board.
- A Mission board with a brief, Product Goal and Definition of Done.
- References tab: searchable glossary and the Scrum Foundations and CSM learning objectives with a coverage checklist.
- Colors only. No seals, crests or logos.

## Files
- `main.js`, `preload.js`: Electron shell (window, save/load/export/import)
- `src/templates.js`: every board template as plain data. Add a board here and it appears in the "New board" menu.
- `src/themes.js`, `src/processes.js`, `src/missions.js`, `src/refs.js`: palettes, planning processes, missions, glossary and objectives as plain data
- `src/app.js`: the board engine
- `src/styles.css`, `src/fonts/`: coyote-and-black theme with fonts bundled for offline use

## Not built yet
Turn-based simulation (held on purpose), quiz engine, burn-down chart, PDF export, learning-objective tracker.
Crosswalk text is a proposal. Verify it against current doctrine before teaching.
