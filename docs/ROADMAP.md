# Roadmap

Status as of 2026-10-06. Build one increment at a time.

| # | Increment | Status | Version |
|---|-----------|--------|---------|
| 1 | Package the board as a desktop app (Electron, portable `.exe`) | Built. Run `npm run dist:win` on your machine to produce the `.exe`. | 0.1.0 |
| 2 | Board templates (roles sort, MoSCoW, size columns, timeline, retro, and more) | Done | 0.1.0 |
| 3 | Timer, parking lot, dot voting | Done | 0.1.0 |
| 4 | Themes, planning-process crosswalk, missions | Done (needs doctrine and color verification) | 0.2.0 |
| 5 | References tab and objective coverage checklist | Done | 0.2.0 |
| 6 | Knowledge checks and question bank (true/false, matching) | Planned | |
| 7 | Burn-down chart from the sprint board | Planned | |
| 8 | Exports (board to PDF or JSON, coverage record) | Planned (JSON export exists) | |
| 9 | Turn-based simulation game (see below) | Held on purpose | |
| 10 | Static web build for the training-team demo | Planned | |
| 11 | Shared live boards and logins | Not started. Needs a backend. | |

## Simulation design (held)
A turn-based game that plays small simulations one at a time. Each main role is asked for an action and the learner clicks the right one.
- **Correct:** the simulation plays out the right movements.
- **Incorrect:** it pauses, greys the screen and shows an explanation.
This also covers the one-on-one mode where the app plays the roles a real team would supply.

## Decisions log
| Date | Decision |
|------|----------|
| 2026-10-05 | Desktop app first (Electron, Windows). Mac only through the free online build. |
| 2026-10-05 | Templates before simulation. Simulation held. |
| 2026-10-05 | Military crosswalk is a toggle, with the planning process panel at the bottom. |
| 2026-10-05 | Theme colors from service brand colors plus colors abstracted from the everyday uniform pattern. No seals, crests or logos. |
| 2026-10-05 | Missions are native to each service. Only the USCYBERCOM mission is cyber-flavored. |
| 2026-10-05 | First audience is a certified training team: prototype and proof of concept, a snippet of how the class would run. |
| 2026-10-05 | Default look stays coyote tan with OPERATION STEALTHY AGILE until someone changes the theme. |

## Principles
- Missions and notes are fictional and unclassified.
- Do not copy course publisher material. Write original wording.
- Every doctrine claim is a proposal until verified (see VERIFICATION.md).
