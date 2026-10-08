# Changelog

All notable changes to Tactical Scrum. Versions follow `package.json`.

## [Unreleased]
### Added
- References tab: the 24 Scrum Foundations learning objectives (January 2022), shown as SF 1.1 to SF 4.9 with board links. A qualifying course must cover these as well as the CSM objectives. CSM objectives are now labeled CSM 1.1 and so on; saved ticks still load.
- Mission board: a Product Goal row above the Sprint Goal row. The mission's goal fills the Product Goal; the Sprint Goal starts empty for Sprint Planning. Mission boards saved by 0.2.0 move their goal up automatically, unless the Sprint Goal was already changed.

### Fixed
- Empiricism dot vote and Scrum values: the column hint said shift-click adds a dot. A click on "+ dot" adds one; right-click or shift-click removes one. Boards saved by 0.2.0 pick up the corrected hint.

## [0.2.0] - 2026-10-05
### Added
- Setup: Theme, planning process and mission selectors. Picking a theme loads that service's usual process and a starter mission; each can then be changed on its own.
- Eight themes: default coyote, Army, Navy, Marine Corps, Air Force, Space Force, Coast Guard, USCYBERCOM. Colors only; no seals, crests or logos.
- Seven planning processes (MDMP, JPP, MCPP, NPP, AFPP, air tasking cycle, Planning P) with a proposed Scrum parallel per step, shown in a panel at the bottom of each board.
- Planning process board and mission board (brief, Sprint Goal, Definition of Done, starter backlog). Eight fictional, unclassified missions.
- References tab: searchable glossary and the CSM learning objectives with a coverage checklist.
- Footer stating the app is not an official DoD or service product.
- Build scripts use `--publish never`.

## [0.1.0] - 2026-10-05
### Added
- Electron desktop shell with local JSON save, export and import.
- Board engine with 18 templates tied to the course steps, editable notes, drag between columns, dot voting, answer-key reveal, timebox timer, forecast calculator, vision-pitch form.
- Setup tab: class name, operation name (always capitals), role names and colors.
- Military crosswalk toggle.
- GitHub Actions workflow to build the Windows `.exe` and Mac `.dmg`.
