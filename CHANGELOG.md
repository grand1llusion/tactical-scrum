# Changelog

All notable changes to Tactical Scrum. Versions follow `package.json`.

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
