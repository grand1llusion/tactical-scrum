/* data.js: Operation Redwater Crossing content for Redwater HQ (build 1: setup + Sprint 1).
   Source: Tactical Scrum Mission Pack 02. Everything is fictional and unclassified. */
(function () {
  'use strict';
  const D = (window.RW = {});

  D.strips = {
    1: 'Recon, Kessel Bridge: the center span is cracked. Engineers say light vehicles only until it is repaired or a temporary bridge is laid beside it.',
    2: 'Recon, Mill Ford: water knee to thigh deep. Near bank firm; far bank soft for about 30 meters. The recon card is marked "day 3."',
    3: 'Recon, Otter Bend: water thigh deep with a faster current. Both banks firm. 4 km south of Route Copper on a single-lane, unpaved track.',
    4: 'Weather: heavy rain forecast to start in about 36 hours. The river usually rises within 12 hours of heavy rain.',
    5: 'A small observation team was seen on Hill 214, which overlooks Mill Ford. Nothing seen near Otter Bend or Kessel Bridge.',
    6: 'Engineer battalion: "Request a bridge company before noon tomorrow and it can be on site in 30 hours. After that, 60 hours."',
    7: 'Route Copper to Kessel Bridge: two culverts are damaged 2 km short of the bridge. The track to Otter Bend is single-lane and unpaved.',
    8: 'Brenmoor holds its market tomorrow. Civilian traffic on Route Copper is heavy from 0700 to 1200.',
    9: 'One short-range air defense section is available for 24 hours only, starting whenever the brigade asks for it.',
    10: 'The lead battalion reaches its release point in 72 hours and needs to cross its heavy vehicles in one night.',
    11: 'S2 note: the Mill Ford recon card marked "day 3" is from last month\'s recon, not this week\'s. The river has risen about 40 cm since then.',
  };

  /* rooms: id, name, row (0..2), col (0..2), scrum event tag */
  D.rooms = [
    { id: 'cdr', name: "Commander's office", row: 0, col: 0, floor: 'wood', event: 'Sprint Review' },
    { id: 's2', name: 'S2 Intelligence', row: 0, col: 1, floor: 'tile' },
    { id: 's3', name: 'S3 Operations', row: 0, col: 2, floor: 'carpet' },
    { id: 's1', name: 'S1 Personnel', row: 1, col: 0, floor: 'tile' },
    { id: 'brief', name: 'Briefing room', row: 1, col: 1, floor: 'carpet2', event: 'Planning · Daily Scrum' },
    { id: 's4', name: 'S4 Logistics', row: 1, col: 2, floor: 'concrete' },
    { id: 's6', name: 'S6 Signal · GenAI.mil', row: 2, col: 0, floor: 'tech' },
    { id: 'eng', name: 'Engineer cell', row: 2, col: 1, floor: 'concrete' },
    { id: 'brk', name: 'Break room', row: 2, col: 2, floor: 'wood', event: 'Retrospective' },
  ];

  /* the planning cell. home = room where they are fastest. All names invented. */
  D.team = [
    { id: 'ortiz', name: 'SFC Ortiz', role: 'Developer (Recon)', home: 's2', look: { skin: '#c68a5e', hair: '#1f1612' }, quip: 'Eyes on, or it did not happen.' },
    { id: 'banks', name: 'SGT Banks', role: 'Developer (Recon)', home: 's2', look: { skin: '#f0c9a0', hair: '#c8a060' }, quip: 'I brought snacks. For the river.' },
    { id: 'novak', name: '1LT Novak', role: 'Developer (Engineer)', home: 'eng', look: { skin: '#e8b890', hair: '#6a3a20' }, quip: 'That bridge is load-bearing drama.' },
    { id: 'kim', name: 'SSG Kim', role: 'Developer (Engineer)', home: 'eng', look: { skin: '#e0b088', hair: '#14110c' }, quip: 'Culverts are just tunnels with anxiety.' },
    { id: 'grant', name: 'SSG Grant', role: 'Developer (Fires/AD)', home: 's3', look: { skin: '#8a5a3a', hair: '#14110c' }, quip: 'Twenty-four hours of air defense. No pressure.' },
    { id: 'wu', name: 'SGT Wu', role: 'Developer (Logistics)', home: 's4', look: { skin: '#f0c9a0', hair: '#2a1a14' }, quip: 'The coffee machine is a critical asset.' },
    { id: 'patel', name: 'SPC Patel', role: 'Developer (Signal)', home: 's6', look: { skin: '#b0784e', hair: '#14110c' }, quip: 'Chief, GenAI.mil can do that in like four seconds.' },
  ];
  D.po = { name: 'MAJ Dunn', role: 'Product Owner', look: { skin: '#d8a880', hair: '#3a2a20' } };
  D.sm = { name: 'CPT Vega', role: 'Scrum Master', look: { skin: '#c68a5e', hair: '#2a1a14' } };

  /* Product Backlog after refinement. ai: good | risky | bad | none (cannot: needs eyes on)
     strips: revealed when Done. check: revealed by a human second-planner check. needs: Done first. */
  D.items = [
    { id: 'rk', title: 'Reconnoiter Kessel Bridge', room: 's2', hours: 4, strips: [1, 7], ai: 'none' },
    { id: 'rm', title: 'Reconnoiter Mill Ford', room: 's2', hours: 4, strips: [2, 5], check: [11], ai: 'none' },
    { id: 'ro', title: 'Reconnoiter Otter Bend', room: 's2', hours: 4, strips: [3], ai: 'none' },
    { id: 'as', title: 'Assess bridge and ford capacity', room: 'eng', hours: 5, needs: ['rk', 'rm', 'ro'], uses11: true, ai: 'risky' },
    { id: 're', title: 'Request engineer support', room: 's3', hours: 2, strips: [6], ai: 'good' },
    { id: 'rc', title: 'Plan route clearance to the crossing', room: 'eng', hours: 4, needs: ['rk'], ai: 'good' },
    { id: 'sec', title: 'Position security on the far bank', room: 's3', hours: 3, needs: ['rm'], ai: 'bad' },
    { id: 'fad', title: 'Coordinate fires and air defense', room: 's3', hours: 3, ai: 'good' },
    { id: 'ct', title: 'Assess civilian traffic on Route Copper', room: 's4', hours: 2, strips: [8], ai: 'good' },
    { id: 'tcp', title: 'Set traffic control points', room: 's4', hours: 4, needs: ['ct'], ai: 'good' },
    { id: 'ov', title: 'Set up the crossing overlay', room: 's6', hours: 3, ai: 'good' },
  ];
  D.aiNotes = {
    good: 'Good use: drafting, formatting, timing math and cross-checking are where GenAI.mil saves real hours.',
    risky: 'Risky use: GenAI.mil compiled the assessment fast, but it cannot judge which reports are current. It used whatever depth it was given.',
    bad: 'Poor use: GenAI.mil guessed where the enemy is and wrote it like fact. Judgments about the enemy stay with the S2 and the planners.',
    none: 'GenAI.mil cannot put eyes on a river. Recon needs a human.',
  };

  /* fit calls (answer key = the approved MDMP table) */
  D.fit = {
    1: { step: 'MDMP 1 · Receipt of mission', answer: 'Blended',
      reasons: [
        ['Commander\'s guidance becomes Product Owner input and the first Product Goal, but the initial guidance and timeline belong to the commander.', true],
        ['Receipt of mission is pure paperwork, so Scrum has nothing to add.', false],
        ['The team should self-organize the commander\'s intent.', false]] },
    2: { step: 'MDMP 2 · Mission analysis', answer: 'Scrum-style',
      reasons: [
        ['Facts, assumptions and tasks become the Product Backlog, and running estimates stay live like refinement. Just remember mission analysis ends and refinement never does.', true],
        ['Mission analysis needs the commander\'s approval at every step, which Scrum forbids.', false],
        ['Scrum only works for software, so treat it like one long Sprint.', false]] },
  };
})();
