# Backlog Quest: Front Line Edition (Final Fantasy style)

A second take on Backlog Quest. The whole team fights at once in side-view battles with an active-time gauge. The original monster-battle version stays untouched in `../game/`.

Open `game-ff/index.html` in a browser. Arrows/WASD move the cursor, Z/Enter = A, X = B, M = mute. On-screen buttons work on touch screens.

## What is in it
- Mission select start screen (one mission playable, one placeholder). Missions are plain data in `missions.js`: say, battle, rest and end steps.
- Uniform toggle on the start screen: Civilian (suits and ties) or Military (varied uniforms, colors only, no insignia).
- Party of four: Kade (Scrum Master), Pia (Product Owner), Dana (Developer), Sue (Stakeholder). Each has a topic and two skills.
- Battle: gauges fill, a hero acts when full. Time pauses while you choose (wait mode). Commands: Attack, Skill, Defend, Item (Coffee).
- Skills need a right answer to hit at full power. Questions are paraphrased from the 2020 Scrum Guide. Check wording before teaching.
- Three fights, ending with the Micromanager boss. Shared team XP and levels.

## Files
`gfx.js`, `audio.js`, `data.js` are copies of the ones in `../game/` (gfx has suit and tie support). `missions.js` holds heroes, costumes and missions. `game.js` is the engine.
