/* data.js: species, moves, quiz questions and the town map. Plain data, easy to extend.
   Question wording is paraphrased from the 2020 Scrum Guide. Verify against the current guide before teaching. */
(function () {
  'use strict';
  const D = (window.DATA = {});
  const P = (c, c2, c3) => ({ c, c2, c3 });
  /* topics: roles, events, artifacts, values */
  D.species = {
    sprintling: { id: 'sprintling', name: 'Sprintling', shape: 'leaf', pal: P('#58b858', '#3a8a3a', '#a8e090'), hp: 52, blurb: 'A cheerful sprout that loves a short, focused cycle.',
      moves: [['Plan Strike', 'events', 40], ['Role Call', 'roles', 36], ['Goal Beam', 'artifacts', 44], ['Value Burst', 'values', 40]] },
    backlogger: { id: 'backlogger', name: 'Backlogger', shape: 'note', pal: P('#5a8ee0', '#3a64b0', '#cfe0ff'), hp: 56, blurb: 'Carries a long, well-ordered list and never forgets an item.',
      moves: [['Refine', 'artifacts', 44], ['Order Up', 'roles', 38], ['Review Slash', 'events', 40], ['Empirical Eye', 'values', 38]] },
    standupper: { id: 'standupper', name: 'Standupper', shape: 'flame', pal: P('#f08a3a', '#c05a1a', '#ffc98a'), hp: 48, blurb: 'Burns bright for exactly fifteen minutes a day.',
      moves: [['Daily Flame', 'events', 46], ['Role Call', 'roles', 36], ['Goal Beam', 'artifacts', 40], ['Value Burst', 'values', 42]] },
    blocker: { id: 'blocker', name: 'Blocker', shape: 'rock', pal: P('#8a8a94', '#5a5a64', '#b4b4be'), hp: 40, wild: true, blurb: 'An impediment. Surfaces at the worst time.', atk: [['Stall', 5, 8], ['Dependency Drop', 6, 9]] },
    scopecreep: { id: 'scopecreep', name: 'Scope Creep', shape: 'vine', pal: P('#9a58b8', '#6a3a88', '#d0a0e8'), hp: 42, wild: true, blurb: 'Grows a little every day while nobody is looking.', atk: [['Just One More', 5, 8], ['Vine Wrap', 6, 9]] },
    zombie: { id: 'zombie', name: 'Zombie Standup', shape: 'zombie', pal: P('#8aa078', '#5a7048', '#b4c8a0'), hp: 40, wild: true, blurb: 'A meeting that went on long after its purpose died.', atk: [['Status Drone', 5, 8], ['Round Robin', 6, 9]] },
    goldplate: { id: 'goldplate', name: 'Gold Plating', shape: 'gold', pal: P('#e8c030', '#b08818', '#fff0a0'), hp: 44, wild: true, blurb: 'Polishes features nobody asked for.', atk: [['Shine', 5, 8], ['Extra Polish', 6, 9]] },
    micromanager: { id: 'micromanager', name: 'Micromanager', shape: 'boss', pal: P('#c0443a', '#8a2a24', '#e88a80'), hp: 95, boss: true, blurb: 'Wants a status update on the status update.', atk: [['Hover', 6, 10], ['CC Everyone', 7, 11], ['Reassign', 8, 12]] },
  };
  /* generic moves for caught impediments, now working for the team */
  D.caughtMoves = [['Heads Up', 'values', 38], ['Plan Strike', 'events', 38], ['Role Call', 'roles', 34], ['Goal Beam', 'artifacts', 40]];

  D.questions = [
    ['roles', 'Who is accountable for maximizing the value of the product?', ['Product Owner', 'Scrum Master', 'Developers', 'Stakeholders'], 0],
    ['roles', 'Who is accountable for creating a usable Increment every Sprint?', ['Developers', 'Product Owner', 'Project Manager', 'Stakeholders'], 0],
    ['roles', 'Who is accountable for the Scrum Team being effective and Scrum being understood?', ['Scrum Master', 'Product Owner', 'Developers', 'Sponsor'], 0],
    ['roles', 'Who is accountable for Product Backlog management?', ['Product Owner', 'Developers', 'Scrum Master', 'Whoever has time'], 0],
    ['roles', 'How big is a Scrum Team, typically?', ['10 or fewer people', 'Exactly 7', '15 to 20 people', 'As many as needed'], 0],
    ['roles', 'Who owns the Sprint Backlog plan, adjusting it during the Sprint?', ['Developers', 'Product Owner', 'Scrum Master', 'Stakeholders'], 0],
    ['events', 'What is the maximum length of a Sprint?', ['One month', 'Two weeks only', 'Six weeks', 'One quarter'], 0],
    ['events', 'What is the Daily Scrum time-box?', ['15 minutes', '30 minutes', '1 hour', 'As long as needed'], 0],
    ['events', 'Who can cancel a Sprint?', ['Only the Product Owner', 'The Scrum Master', 'Any Developer', 'The stakeholders'], 0],
    ['events', 'What is the purpose of the Sprint Retrospective?', ['Plan ways to improve quality and effectiveness', 'Demo to the CEO', 'Assign blame', 'Update the budget'], 0],
    ['events', 'What is the purpose of the Sprint Review?', ['Inspect the outcome and decide on adaptations', 'Approve developer pay', 'Plan the next release date only', 'Replace the Retrospective'], 0],
    ['events', 'What does Sprint Planning address?', ['Why, what and how for the Sprint', 'Only who does what', 'Only the budget', 'Only the Definition of Done'], 0],
    ['artifacts', 'What is the commitment for the Product Backlog?', ['Product Goal', 'Sprint Goal', 'Definition of Done', 'Release Plan'], 0],
    ['artifacts', 'What is the commitment for the Sprint Backlog?', ['Sprint Goal', 'Product Goal', 'Definition of Done', 'Velocity'], 0],
    ['artifacts', 'What is the commitment for the Increment?', ['Definition of Done', 'Sprint Goal', 'Product Goal', 'Test plan'], 0],
    ['artifacts', 'When does work count as part of an Increment?', ['It meets the Definition of Done', 'The developer says so', 'It compiles', 'The manager approves'], 0],
    ['artifacts', 'Which artifact holds the plan for the current Sprint?', ['Sprint Backlog', 'Product Backlog', 'Roadmap', 'Burn-up chart'], 0],
    ['values', 'Which is one of the three pillars of empiricism?', ['Transparency', 'Velocity', 'Hierarchy', 'Estimation'], 0],
    ['values', 'Which is NOT one of the five Scrum values?', ['Speed', 'Courage', 'Respect', 'Focus'], 0],
    ['values', 'Inspection without adaptation is...', ['Pointless', 'Enough', 'Required only at the end', 'Optional'], 0],
    ['values', 'Which value means being open about the work and the challenges?', ['Openness', 'Focus', 'Commitment', 'Courage'], 0],
  ].map(([topic, q, opts, a]) => ({ topic, q, opts, a }));

  /* ---- town map ---- */
  const W = 24, H = 18;
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const rect = (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch; };
  const set = (x, y, ch) => { g[y][x] = ch; };
  rect(0, 0, W, 1, 'T'); rect(0, H - 1, W, 1, 'T'); rect(0, 0, 1, H, 'T'); rect(W - 1, 0, 1, H, 'T');
  rect(1, 1, 22, 5, ','); rect(5, 3, 2, 1, 'T'); rect(17, 3, 2, 1, 'T'); rect(11, 1, 2, 1, '.'); rect(10, 2, 4, 1, '.');
  rect(1, 6, 22, 1, 'T'); rect(10, 6, 4, 1, '=');
  rect(10, 7, 4, 10, '=');
  rect(3, 8, 4, 2, 'R'); rect(3, 10, 4, 2, 'W'); set(3, 10, 'w'); set(6, 10, 'w'); set(4, 11, 'D'); rect(4, 12, 1, 2, '='); rect(4, 13, 9, 1, '=');
  rect(17, 8, 4, 2, 'B'); rect(17, 10, 4, 2, 'W'); set(17, 10, 'w'); set(20, 10, 'w'); set(18, 11, 'D'); rect(18, 12, 1, 2, '='); rect(11, 13, 8, 1, '=');
  rect(1, 14, 5, 3, '~'); rect(7, 15, 2, 1, '*'); rect(20, 15, 3, 1, '*'); rect(15, 15, 4, 1, '#'); rect(2, 7, 2, 1, '*'); rect(20, 7, 2, 1, '*');
  set(9, 8, 'S'); set(14, 16, '='); set(8, 16, '.');
  D.map = { w: W, h: H, rows: g.map((r) => r.join('')) };
  D.TILE = { '.': 0, ',': 1, '=': 2, T: 3, '~': 4, '*': 5, '#': 6, W: 7, R: 8, D: 9, w: 10, S: 11, B: 13 };
  D.signs = { '9,8': ['BACKLOG VILLAGE', 'Home of the Tactical Scrum Academy. Tall grass north: impediments roam there.'] };
  D.doors = { '4,11': ['The Dojo door is locked. Interiors are coming in the next build.'], '18,11': ["The Product Owner's office is locked. Interiors are coming in the next build."] };

  D.start = { x: 11, y: 15, dir: 1 };
  D.npcs = [
    { id: 'mentor', x: 11, y: 9, dir: 0, look: 'mentor', name: 'Master Kade' },
    { id: 'po', x: 15, y: 12, dir: 2, look: 'po', name: 'Pia' },
    { id: 'dev', x: 6, y: 14, dir: 0, look: 'dev', name: 'Dana' },
    { id: 'boss', x: 11, y: 2, dir: 0, look: 'boss', name: 'Manager Max', trainer: true, sight: 4 },
  ];
  D.wildTable = ['blocker', 'scopecreep', 'zombie', 'goldplate'];
})();
