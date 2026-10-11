# Tactical Scrum: Backlog Quest (prototype slice)

A GBA-style monster-battle game built on the Tactical Scrum content. Impediments (Blocker, Scope Creep, Zombie Standup, Gold Plating) roam the tall grass. Your teammates fight by answering Scrum Guide questions.

## Play
Open `game/index.html` in a browser. No build step, no network, no image or audio files: all art and music are generated in code.

Controls: arrows/WASD move, Z/Enter = A, X = B, M = mute. On-screen buttons work on touch screens.

## The slice
- Title screen with continue (saves to browser localStorage)
- Backlog Village: Master Kade (pick a starter), Pia (Retro Balls), Dana (heals), two locked buildings, a sign
- Tall grass with random encounters (levels 3-5)
- Quiz battles: each move has a topic (roles, events, artifacts, values). A right answer hits at full power, a wrong one at about a third and shows the answer. 21 questions, paraphrased from the 2020 Scrum Guide. Check wording before teaching.
- Weaken an Impediment, then throw a Retro Ball to turn it into a teammate (party up to 6, switch from the PARTY menu)
- Boss: Manager Max and the Micromanager, at the top of the grass

## Files
- `gfx.js`: tiles, characters, monsters, 5x7 bitmap font and UI boxes, all drawn in code
- `audio.js`: chiptune tracks (town, battle, boss, win, title) and sound effects (WebAudio)
- `data.js`: species, moves, quiz questions, map, NPCs
- `game.js`: engine (overworld, dialogue, menus, battle, save)

## Ideas for next
Building interiors, more towns themed on the military planning processes, gym-style Sprint Event trials, move-learning, a Pokedex-style glossary linked to `src/refs.js`, a real back-view for your monster, a pixel-tweaked player sprite, and an Electron wrapper.
