/* Theme palettes. Colors only: no seals, crests, logos or service marks.
   Values are approximations drawn from each service's published brand colors plus two or three colors
   abstracted from its everyday uniform pattern. Re-check against the current brand pages before public use.
   Token meaning: ground = page, panel = side panels, band = masthead, bandink = text on the masthead, ink = text on those,
   ink2 = secondary text, line = borders, btnfg = text on ink-colored buttons, zone/zonehi = columns,
   paper = input fields, note = default sticky note, accent = zone top bars and focus. */
(function () {
  'use strict';
  window.THEMES = [
    { id: 'default', name: 'Tactical Scrum (coyote)', process: 'mdmp', mission: 'stealthy',
      from: 'Coyote tan and black, the original look.',
      c: { bandink: '#14130f', ground: '#d8cba8', panel: '#eae1c8', band: '#b39a6b', ink: '#14130f', ink2: '#3c382c', line: '#7b6b48', btnfg: '#eee4c8',
           focus: '#2f4a2a', zone: '#e4dabb', zonehi: '#d4c594', paper: '#f6f0dc', note: '#e4c95f', accent: '#14130f' } },
    { id: 'army', name: 'U.S. Army', process: 'mdmp', mission: 'army',
      from: 'Army black and gold, with OCP tan and green from the everyday uniform.',
      c: { bandink: '#000000', ground: '#d9d2b8', panel: '#ebe6d2', band: '#ffcb05', ink: '#000000', ink2: '#33311f', line: '#6b6446', btnfg: '#ffcb05',
           focus: '#4a5a2c', zone: '#e3dcc2', zonehi: '#cfc69c', paper: '#f7f3e3', note: '#ffcb05', accent: '#5a6b3a' } },
    { id: 'navy', name: 'U.S. Navy', process: 'npp', mission: 'navy',
      from: 'Navy blue and gold, with the dark blue and black of the working uniform.',
      c: { bandink: '#f2ecd8', ground: '#101a2c', panel: '#17233a', band: '#0a1424', ink: '#f2ecd8', ink2: '#b9c3d6', line: '#4a5d80', btnfg: '#0a1424',
           focus: '#e2bb4a', zone: '#1b2a45', zonehi: '#26385b', paper: '#0f1829', note: '#e2bb4a', accent: '#e2bb4a' } },
    { id: 'marines', name: 'U.S. Marine Corps', process: 'mcpp', mission: 'marines',
      from: 'Scarlet and gold, with the green, brown and tan of the woodland digital pattern.',
      c: { bandink: '#f6efe0', ground: '#d4d0b4', panel: '#e6e3cc', band: '#8f1220', ink: '#15130e', ink2: '#3a3926', line: '#5c5a38', btnfg: '#ffc72c',
           focus: '#8f1220', zone: '#dedab8', zonehi: '#c7c18d', paper: '#f4f1de', note: '#ffc72c', accent: '#4f5b32' } },
    { id: 'airforce', name: 'U.S. Air Force', process: 'afpp', mission: 'airforce',
      from: 'Air Force blues and yellow, with the OCP neutrals.',
      c: { bandink: '#ffffff', ground: '#d7dbe6', panel: '#e8ebf2', band: '#001689', ink: '#0c1020', ink2: '#2e3550', line: '#5a6690', btnfg: '#ffcd00',
           focus: '#001689', zone: '#dfe3ee', zonehi: '#c4cbe0', paper: '#f6f7fb', note: '#ffcd00', accent: '#002169' } },
    { id: 'spaceforce', name: 'U.S. Space Force', process: 'jpp', mission: 'spaceforce',
      from: 'Black, deep blue and silver.',
      c: { bandink: '#e8ebf2', ground: '#0d0f14', panel: '#151922', band: '#05060a', ink: '#e8ebf2', ink2: '#a9b0c2', line: '#3c4458', btnfg: '#05060a',
           focus: '#7fb2ff', zone: '#171c28', zonehi: '#222a3d', paper: '#0b0d12', note: '#9fb4d6', accent: '#4f86e0' } },
    { id: 'coastguard', name: 'U.S. Coast Guard', process: 'planningp', mission: 'coastguard',
      from: 'Coast Guard blue and racing-stripe orange-red, with the working-uniform blue.',
      c: { bandink: '#ffffff', ground: '#d5dce8', panel: '#e7ecf4', band: '#003087', ink: '#0b1020', ink2: '#2a3552', line: '#5b6a8f', btnfg: '#ffffff',
           focus: '#c5321f', zone: '#dde4f0', zonehi: '#c2cde3', paper: '#f5f7fb', note: '#f2a07b', accent: '#c5321f' } },
    { id: 'cybercom', name: 'USCYBERCOM', process: 'jpp', mission: 'cybercom',
      from: 'Dark slate with gold and a cyan data accent. Joint, so it uses no one service\'s colors.',
      c: { bandink: '#e9edf5', ground: '#0e1522', panel: '#141d2e', band: '#070b13', ink: '#e9edf5', ink2: '#a8b3c8', line: '#394a66', btnfg: '#070b13',
           focus: '#38c6d9', zone: '#18233a', zonehi: '#22314f', paper: '#0b111c', note: '#d4af37', accent: '#38c6d9' } }
  ];
})();
