# Redwater HQ (build 1)

A KoJi-style top-down brigade HQ game for the Tactical Scrum class. Players run Operation Redwater Crossing (Mission Pack 02) through MDMP, deciding where Scrum fits, where traditional staff work stays, and where GenAI.mil should and shouldn't help. The design doc lives in Claude Docs ("Redwater HQ: Game Design Draft").

## Play
Open `hq/index.html` in a desktop browser. No build step, no network. Everything is fictional and unclassified.

## What build 1 covers
- Role picker (Developer playable; Product Owner and Scrum Master in build 2)
- Setup: COL Hart's guidance, fit calls for MDMP steps 1 and 2, the timeline AI call, backlog refinement, Sprint Planning
- Sprint 1 (24 game hours, about 4 minutes at 1x): assign cards to soldiers, second-planner checks for the Definition of Done, evidence strips, the GenAI.mil terminal
- Injects 1 and 2, a Daily Scrum, an impediment, an AI decision, Stakeholder A at the Review, a Retrospective
- Mission clock and score, help tiers (hint, show me, take over), end screen with a breakdown, local best score, decision log as JSON
- COA weighting mini-game (MDMP 5): by hand vs GenAI.mil-assisted with a sensitivity sweep and a stale-source trap

## Files
- `data.js`: strips, rooms, team, backlog items, fit-call answer key
- `map.js`: the pixel floor plan, soldiers and walking routes
- `game.js`: flow, decisions, scoring, panels
- `coa.js`: the COA comparison mini-game
- `gfx.js`: pixel sprites and the bitmap font (shared with the earlier prototypes)

## Next
Build 2: Sprints 2 and 3 (Injects 2b to 5, Stakeholder B), Product Owner and Scrum Master roles. Build 3: AWS backend (S3 + CloudFront, Cognito, API Gateway + Lambda replaying the decision log, DynamoDB), instructor-only score chart, Strands Decider 2B grading free-text inject answers with low-confidence flags.
