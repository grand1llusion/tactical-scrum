/* missions.js: heroes, costumes and missions as plain data. Add a mission by adding an entry to MISSIONS.
   Step types: {say:[speaker, text]}, {battle:{enemies:[ids], lv, intro, boss}}, {rest:true}, {end:true}. */
(function () {
  'use strict';
  const M = (window.FF = {});
  /* Colors only, no seals, crests or logos. */
  M.costumes = {
    civilian: {
      label: 'Civilian',
      kade: { id: 'ck', skin: '#e0b088', hair: '#c8c8c8', pants: '#2a2f45', shirt: '#2a3f6a', shirt2: '#1e2f52', tie: '#c8a45a' },
      pia: { id: 'cp', skin: '#b98660', hair: '#1f1612', pants: '#3a3a3a', shirt: '#4a4a52', shirt2: '#383840', tie: '#c0443a' },
      dana: { id: 'cd', skin: '#f0c9a0', hair: '#c0602a', pants: '#2a2a2a', shirt: '#6a5a48', shirt2: '#54463a', tie: '#3a8a5a' },
      sue: { id: 'cs', skin: '#d8a880', hair: '#3a2a20', pants: '#1f1f2a', shirt: '#7a2a3a', shirt2: '#5a1f2c', tie: '#e8d9b0' },
    },
    military: {
      label: 'Military',
      kade: { id: 'mk', skin: '#e0b088', hair: '#c8c8c8', pants: '#3d4a28', shirt: '#5a6a3a', shirt2: '#46542c', cap: '#46542c' },
      pia: { id: 'mp', skin: '#b98660', hair: '#1f1612', pants: '#1a2444', shirt: '#2a3a6a', shirt2: '#1f2c52', cap: '#ececec' },
      dana: { id: 'md', skin: '#f0c9a0', hair: '#c0602a', pants: '#2c3c58', shirt: '#4a6a9a', shirt2: '#385580' },
      sue: { id: 'ms', skin: '#d8a880', hair: '#3a2a20', pants: '#2a3a6a', shirt: '#a58a50', shirt2: '#86703c', cap: '#7a1f1f' },
    },
  };
  /* skills: [name, topic, power, kind] kind: one | all | heal | healall */
  M.heroes = [
    { key: 'kade', name: 'Kade', job: 'Scrum Master', hp: 78, atk: 8, spd: 1.0, skills: [['Facilitate', 'roles', 28, 'healall'], ['Remove Blocker', 'roles', 40, 'one']] },
    { key: 'pia', name: 'Pia', job: 'Product Owner', hp: 66, atk: 9, spd: 0.95, skills: [['Reorder Backlog', 'artifacts', 24, 'all'], ['Product Goal', 'artifacts', 44, 'one']] },
    { key: 'dana', name: 'Dana', job: 'Developer', hp: 72, atk: 12, spd: 1.1, skills: [['Daily Scrum', 'events', 42, 'one'], ['Sprint Burst', 'events', 26, 'all']] },
    { key: 'sue', name: 'Sue', job: 'Stakeholder', hp: 62, atk: 8, spd: 0.9, skills: [['Feedback', 'values', 40, 'one'], ['Openness', 'values', 36, 'heal']] },
  ];
  M.missions = [
    { id: 'm1', title: 'Sprint Zero', blurb: 'Clear the Impediments out.', steps: [
      { say: ['Kade', 'Welcome to Sprint Zero! The sprint where nothing is delivered and everything is estimated.'] },
      { say: ['Pia', 'The Backlog is a mess. Somebody ordered it by "vibes".'] },
      { say: ['Dana', 'Also, something is blocking the door. It looks like a rock with a grudge.'] },
      { say: ['Sue', 'Remember, every question you answer right makes our moves hit harder. No pressure! (Some pressure.)'] },
      { battle: { enemies: ['blocker', 'zombie'], lv: 4, intro: 'A Blocker and a Zombie Standup shuffle into the room!' } },
      { say: ['Kade', 'Impediments removed. That is my favorite part of the job. It is the whole job.'] },
      { rest: true },
      { say: ['Pia', 'More noise from the hallway. It sounds like somebody asking for "just one more thing".'] },
      { battle: { enemies: ['scopecreep', 'goldplate', 'scopecreep'], lv: 5, intro: 'Scope Creep brought friends. And a very shiny one.' } },
      { say: ['Dana', 'We did not need that gold plating. Nobody asked for the gold plating.'] },
      { say: ['Sue', 'Uh oh. Manager Max just walked in. He is carrying a clipboard and a lot of feelings.'] },
      { say: ['Manager Max', 'Quick sync? I need a status update on your status update. Also I will be approving every task.'] },
      { battle: { enemies: ['micromanager', 'blocker', 'zombie'], lv: 6, boss: true, intro: 'The Micromanager hovers over your Sprint!' } },
      { say: ['Manager Max', '...Fine. Maybe the team can self-manage. I will trust the process.'] },
      { end: true },
    ] },
    { id: 'm2', title: 'Mission 2', blurb: 'Coming soon: your scripts.', locked: true, steps: [] },
  ];
})();
