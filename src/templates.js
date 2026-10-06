/* Board templates for Tactical Scrum.
   Each template is plain data. The board engine in app.js renders any of them.
   Role-named zones (role: 'po' | 'sm' | 'dev') pick up names and colors from the Setup tab.
   Crosswalk text (mil) is a PROPOSAL and must be verified against current doctrine before teaching. */
(function () {
  'use strict';

  var Z = function (id, name, sub, extra) {
    var z = { id: id, name: name, sub: sub || '' };
    if (extra) { for (var k in extra) { z[k] = extra[k]; } }
    return z;
  };

  var TEMPLATES = [
    {
      id: 'agreements', step: 1, name: 'Working agreements',
      desc: 'Class rules plus the team\'s own agreements.',
      cue: 'Ask: "What do we need from each other to learn fast in this room?" Add the first agreement yourself, then let the learner add theirs.',
      zones: [Z('agree', 'Agreements', 'How we work together'), Z('park', 'Parking lot', 'Good questions for later')],
      notes: [
        { t: 'Mission first, people always', z: 'agree' },
        { t: 'Cameras on when we can', z: 'agree' },
        { t: 'One conversation at a time', z: 'agree' }
      ],
      mil: { head: 'Standards and ground rules', rows: [
        ['Working agreement', 'Unit SOP / standards the team sets for itself', 'Scrum teams write their own; an SOP usually comes from above.'],
        ['Parking lot', 'Deferred issues list', 'Same idea: capture it, do not lose it, do not derail the session.']
      ] }
    },
    {
      id: 'warmup', step: 2, name: 'Warm-up timeline',
      desc: 'Add a note (name plus a fun answer) and slide it along an experience scale.',
      cue: 'Ask each person to write their name and one fun fact, then place it where their Scrum or agile experience sits.',
      zones: [Z('x0', 'Brand new', 'No Scrum experience'), Z('x1', 'Heard of it', 'Read or watched'), Z('x2', 'Used it', 'On a team'), Z('x3', 'Coached it', 'Led others')],
      notes: [],
      mil: { head: 'Know your audience', rows: [
        ['Experience scale', 'Unit / staff experience assessment', 'Use it to decide how much military translation the learner needs.']
      ] }
    },
    {
      id: 'agenda', step: 3, name: 'Agenda Kanban',
      desc: 'The course itself shown as a board, in two sprints.',
      cue: 'Walk the board once. Say: "The course is a Scrum team. This is our Sprint Backlog." Move a card to Done as you finish each topic.',
      goal: true,
      zones: [Z('bl', 'Course backlog', 'Topics ordered by the trainer'), Z('s1', 'Sprint 1', 'Day 1'), Z('s2', 'Sprint 2', 'Day 2'), Z('dn', 'Done', 'Covered and checked')],
      notes: [
        { t: 'Why Scrum: complexity and empiricism', z: 'bl' }, { t: 'Roles', z: 'bl' }, { t: 'Estimation', z: 'bl' },
        { t: 'Simulation: two sprints', z: 'bl' }, { t: 'Backlog and refinement', z: 'bl' }, { t: 'Sprint planning', z: 'bl' },
        { t: 'Daily Scrum, review, retrospective', z: 'bl' }, { t: 'Impediments and technical debt', z: 'bl' }
      ],
      mil: { head: 'Battle rhythm view', rows: [
        ['Timebox', 'Time-phased battle rhythm', 'Strong fit. Both fix the clock first and fit the work inside it.'],
        ['Done column', 'Task completion against standards', 'Done means the Definition of Done is met, not "mostly finished".']
      ] }
    },
    {
      id: 'vuca', step: 5, name: 'Empiricism dot vote',
      desc: 'Dot-vote where each pillar would be hardest at work.',
      cue: 'Give each person three dots. Ask: "Where would this be hardest in your unit?" Then ask why the top item scored highest.',
      vote: true,
      zones: [Z('v', 'Where is it hardest at work?', 'Shift-click a note to add a dot, right-click to remove one')],
      notes: [
        { t: 'Transparency: everyone sees the same real status', z: 'v' },
        { t: 'Inspection: we check progress often enough to catch problems', z: 'v' },
        { t: 'Adaptation: we change course when inspection says to', z: 'v' }
      ],
      mil: { head: 'Complexity and decision cycles', rows: [
        ['Inspection and adaptation', 'Assess and adjust (OODA-style decision cycle)', 'Describes the same loop at different scales.'],
        ['VUCA', 'Operating environment (volatile, uncertain, complex, ambiguous)', 'Common military vocabulary already; use it.']
      ] }
    },
    {
      id: 'principles', step: 6, name: 'Agile principles vote',
      desc: 'Pick the two principles that matter most right now and say why.',
      cue: 'Ask for two dots. Ask: "Why this one, and why now?" Keep the answers to one sentence each.',
      vote: true,
      zones: [Z('p', 'Principles', 'Short labels. Ask the learner to read the full principle from the Agile Manifesto site.')],
      notes: [
        { t: 'Deliver value early and often', z: 'p' }, { t: 'Welcome changing requirements', z: 'p' },
        { t: 'Deliver working product frequently', z: 'p' }, { t: 'Business and developers work together daily', z: 'p' },
        { t: 'Build around motivated people and trust them', z: 'p' }, { t: 'Face-to-face conversation is best', z: 'p' },
        { t: 'Working product is the measure of progress', z: 'p' }, { t: 'Keep a sustainable pace', z: 'p' },
        { t: 'Technical excellence and good design', z: 'p' }, { t: 'Simplicity: maximize work not done', z: 'p' },
        { t: 'Self-organizing teams', z: 'p' }, { t: 'Reflect and adjust at regular intervals', z: 'p' }
      ],
      mil: { head: 'Doctrine echoes', rows: [
        ['Welcome change', 'Flexibility / adapt to the situation', 'Intent stays fixed; methods flex.'],
        ['Trust motivated people', 'Mission command: disciplined initiative within intent', 'Strong fit on trust and initiative.'],
        ['Reflect and adjust', 'After Action Review', 'Strong fit.']
      ] }
    },
    {
      id: 'values', step: 7, name: 'Scrum values',
      desc: 'Two dots on the five values plus a "why" note.',
      cue: 'Ask for two dots. Add a "why" note for the top one. Ask for a moment from their career where it was missing.',
      vote: true,
      zones: [Z('v', 'Values', 'Shift-click for a dot, right-click to remove'), Z('why', 'Why', 'One sentence per value')],
      notes: [
        { t: 'Commitment', z: 'v' }, { t: 'Focus', z: 'v' }, { t: 'Openness', z: 'v' }, { t: 'Respect', z: 'v' }, { t: 'Courage', z: 'v' }
      ],
      mil: { head: 'Values crosswalk', rows: [
        ['Scrum values', 'Army Values / unit ethos', 'Compare, do not equate. Courage and respect overlap with the Army Values of the same names.']
      ] }
    },
    {
      id: 'framework', step: 8, name: 'Scrum framework sort',
      desc: 'Place the roles, events and artifacts into the right group.',
      cue: 'Say: "Sort these without looking anything up." Reveal the key, then ask the learner to explain any card they missed.',
      key: true,
      zones: [Z('pool', 'Unsorted', 'Drag from here'), Z('acc', 'Accountabilities', 'Who'), Z('evt', 'Events', 'When'), Z('art', 'Artifacts and commitments', 'What')],
      notes: [
        { t: 'Product Owner', z: 'pool', k: 'acc' }, { t: 'Scrum Master', z: 'pool', k: 'acc' }, { t: 'Developers', z: 'pool', k: 'acc' },
        { t: 'Sprint', z: 'pool', k: 'evt' }, { t: 'Sprint Planning', z: 'pool', k: 'evt' }, { t: 'Daily Scrum', z: 'pool', k: 'evt' },
        { t: 'Sprint Review', z: 'pool', k: 'evt' }, { t: 'Sprint Retrospective', z: 'pool', k: 'evt' },
        { t: 'Product Backlog', z: 'pool', k: 'art' }, { t: 'Sprint Backlog', z: 'pool', k: 'art' }, { t: 'Increment', z: 'pool', k: 'art' },
        { t: 'Product Goal', z: 'pool', k: 'art' }, { t: 'Sprint Goal', z: 'pool', k: 'art' }, { t: 'Definition of Done', z: 'pool', k: 'art' }
      ],
      mil: { head: 'Framework to staff process', rows: [
        ['Sprint Planning', 'COA development through orders production (one window)', 'Scrum plans one short window; MDMP plans a whole operation.'],
        ['Daily Scrum', 'Battle update / sync', 'Developers own it, not the commander.'],
        ['Sprint Review', 'Rehearsal / decision-point review', 'Partial fit. Review inspects the Increment with stakeholders.'],
        ['Sprint Retrospective', 'After Action Review', 'Strong fit.']
      ] }
    },
    {
      id: 'roles', step: 9, name: 'Roles sort',
      desc: 'Drag 20 responsibilities to the role that owns them.',
      cue: 'Let the learner sort all 20 first. Reveal the key. For each miss ask: "What would break if the wrong role did this?"',
      key: true,
      zones: [Z('pool', 'Unsorted', 'Drag from here'), Z('po', 'Product Owner', '', { role: 'po' }), Z('sm', 'Scrum Master', '', { role: 'sm' }), Z('dev', 'Developers', '', { role: 'dev' })],
      notes: [
        { t: 'Orders the Product Backlog', z: 'pool', k: 'po' },
        { t: 'Communicates the Product Goal', z: 'pool', k: 'po' },
        { t: 'Writes clear Product Backlog items', z: 'pool', k: 'po' },
        { t: 'Makes the Product Backlog visible and understood', z: 'pool', k: 'po' },
        { t: 'Negotiates priorities with stakeholders', z: 'pool', k: 'po' },
        { t: 'Decides to cancel a Sprint', z: 'pool', k: 'po' },
        { t: 'Decides what goes into the Product Backlog', z: 'pool', k: 'po' },
        { t: 'Coaches the team in self-management', z: 'pool', k: 'sm' },
        { t: 'Helps remove impediments', z: 'pool', k: 'sm' },
        { t: 'Makes sure events happen and stay in the timebox', z: 'pool', k: 'sm' },
        { t: 'Facilitates stakeholder collaboration when needed', z: 'pool', k: 'sm' },
        { t: 'Helps the organization adopt Scrum', z: 'pool', k: 'sm' },
        { t: 'Helps find ways to define the Product Goal', z: 'pool', k: 'sm' },
        { t: 'Creates the Sprint Backlog', z: 'pool', k: 'dev' },
        { t: 'Plans the work for the Sprint', z: 'pool', k: 'dev' },
        { t: 'Holds the Daily Scrum', z: 'pool', k: 'dev' },
        { t: 'Sizes the items (owns the estimates)', z: 'pool', k: 'dev' },
        { t: 'Meets the Definition of Done', z: 'pool', k: 'dev' },
        { t: 'Adapts the plan every day toward the Sprint Goal', z: 'pool', k: 'dev' },
        { t: 'Holds each other accountable as professionals', z: 'pool', k: 'dev' }
      ],
      mil: { head: 'Roles crosswalk', rows: [
        ['Product Owner', 'Holder of intent and priorities (closest: commander\'s intent plus the J/G/S-3 priority call)', 'No exact match. A Product Owner does not command people.'],
        ['Scrum Master', 'No clean equivalent. People compare it to an XO or chief of staff running the battle rhythm.', 'A Scrum Master does not direct the work or command anyone.'],
        ['Developers', 'The staff or operators doing the work', 'Self-managing inside the Sprint Goal. This is the biggest culture gap with a chain of command.']
      ] }
    },
    {
      id: 'hats', step: 10, name: 'Multi-hatting',
      desc: 'What goes wrong when one person wears two or three hats?',
      cue: 'Assign a pairing. Ask the learner to write what breaks. Bonus: talk through rotating the Scrum Master.',
      zones: [Z('pd', 'PO + Developer', 'Orders the work and does it'), Z('sd', 'SM + Developer', 'Protects the process and does the work'), Z('ps', 'PO + SM', 'Sets priority and coaches the process'), Z('all', 'All three hats', 'One person, everything')],
      notes: [],
      mil: { head: 'Dual-hatting', rows: [
        ['Multi-hatting', 'Dual-hatted staff officer / additional duties', 'Familiar. The risk is the same: the second job loses.']
      ] }
    },
    {
      id: 'estimate', step: 13, name: 'Estimation and forecast',
      desc: 'Size items relatively, total the points, forecast sprints.',
      cue: 'Pick the smallest item and call it XS. Size everything else against it. Then enter velocity and see what the forecast says.',
      calc: 'forecast',
      zones: [
        Z('pool', 'Unsized', 'Drag from here'),
        Z('xs', 'XS', '1 point', { weight: 1 }), Z('s', 'S', '2 points', { weight: 2 }), Z('m', 'M', '3 points', { weight: 3 }),
        Z('l', 'L', '5 points', { weight: 5 }), Z('xl', 'XL', '8 points', { weight: 8 })
      ],
      notes: [
        { t: 'Update the vendor contact roster', z: 'pool' }, { t: 'Write the shift-handoff checklist', z: 'pool' },
        { t: 'Build the weekly status brief', z: 'pool' }, { t: 'Stand up a shared tracker', z: 'pool' },
        { t: 'Brief the new section chief', z: 'pool' }
      ],
      mil: { head: 'Estimation', rows: [
        ['Relative size and velocity', 'Staff running estimate / planning factors', 'Different purpose. Velocity forecasts the team\'s own capacity; it is not a performance score.'],
        ['Forecast in sprints', 'Time-phased plan against a deadline', 'A forecast is not a promise. Update it every Sprint.']
      ] }
    },
    {
      id: 'dord', step: 15, name: 'Definition of Ready and Done',
      desc: 'Sort sample criteria, discard what does not fit, add your own.',
      cue: 'Ask: "What must be true before the team starts?" (Ready) and "What must be true to call it finished?" (Done). Let the learner discard weak criteria.',
      zones: [Z('pool', 'Candidates', 'Drag from here'), Z('dor', 'Definition of Ready', 'Before we start'), Z('dod', 'Definition of Done', 'Before we call it finished'), Z('no', 'Discard', 'Not useful')],
      notes: [
        { t: 'Acceptance criteria written', z: 'pool' }, { t: 'Dependencies identified', z: 'pool' }, { t: 'Small enough for one Sprint', z: 'pool' },
        { t: 'Peer reviewed', z: 'pool' }, { t: 'Tested against the acceptance criteria', z: 'pool' }, { t: 'Documented where the team can find it', z: 'pool' },
        { t: 'Briefed to the stakeholder', z: 'pool' }, { t: 'Everyone has read it', z: 'pool' }
      ],
      mil: { head: 'Standards', rows: [
        ['Definition of Done', 'Task standards and conditions / criteria for success', 'Strong fit.'],
        ['Definition of Ready', 'Planning inputs received (guidance, warning order)', 'Proposal only. Check with your own staff process.']
      ] }
    },
    {
      id: 'vision', step: 16, name: 'Product vision pitch',
      kind: 'vision',
      desc: 'Fill in the elevator pitch, then give it in 30 seconds.',
      cue: 'Fill in each blank in order. Time a 30-second pitch. Ask: "Would a stranger know what we are building and why?"',
      zones: [],
      notes: [],
      mil: { head: 'Vision and intent', rows: [
        ['Product vision / Product Goal', 'Commander\'s intent: purpose and end state', 'Proposal. A goal is one objective at a time; intent also carries key tasks.'],
        ['Unlike (alternative)', 'Course of action comparison', 'Name what you are NOT doing.']
      ] }
    },
    {
      id: 'moscow', step: 19, name: 'MoSCoW ordering',
      desc: 'Sort every backlog item into Must, Should, Could, Won\'t, then vote the order of the Musts.',
      cue: 'Sort first. Then give each person dots to order the Musts. Ask: "What are we choosing NOT to do?"',
      vote: true,
      zones: [Z('pool', 'Unsorted', 'Drag from here'), Z('must', 'Must', 'Without it we fail'), Z('should', 'Should', 'Important, not vital'), Z('could', 'Could', 'Nice to have'), Z('wont', 'Won\'t (this time)', 'Explicitly out')],
      notes: [
        { t: 'Single sign-on for the roster', z: 'pool' }, { t: 'Emergency alert to all members', z: 'pool' },
        { t: 'Export roster to a spreadsheet', z: 'pool' }, { t: 'Dark mode', z: 'pool' }, { t: 'Role-based permissions', z: 'pool' }
      ],
      mil: { head: 'Prioritizing tasks', rows: [
        ['Must / Should / Could / Won\'t', 'Essential, specified and implied tasks; priorities and risk acceptance', 'Proposal. Won\'t is like deliberately accepting risk by not doing something.'],
        ['Product Backlog order', 'Priority of effort', 'Scrum orders 1 to N with no ties and re-orders every Sprint.']
      ] }
    },
    {
      id: 'sprint', step: 20, name: 'Sprint board',
      desc: 'Plan, work, review. The classic four-column board.',
      cue: 'Run the timers: plan 15, work 6, daily 3, work 6, review up to 3, retro 10 (the course pattern). Only the Developers move cards to Done.',
      goal: true,
      zones: [Z('bl', 'Product Backlog', 'Ordered by the Product Owner'), Z('sb', 'Sprint Backlog', 'Pulled by the Developers'), Z('ip', 'In Progress', 'Owned by the Developers'), Z('dn', 'Done', 'Meets the Definition of Done')],
      notes: [
        { t: 'Confirm actor overlap with prior reporting', z: 'bl', r: 'd1' },
        { t: 'Pull badge-access logs for the site', z: 'bl', r: 'd1' },
        { t: 'Correlate timing with shift change', z: 'bl', r: 'd2' }
      ],
      mil: { head: 'Execution view', rows: [] }
    },
    {
      id: 'retro', step: 21, name: 'Retrospective',
      desc: 'Went well and opportunities, then What / So what / Now what for one fix.',
      cue: 'Silent writing first, then group. Pick ONE fix and put it in the next Sprint Backlog.',
      zones: [Z('well', 'Went well', 'Keep doing'), Z('opp', 'Opportunities', 'Could be better'), Z('what', 'What?', 'What happened'), Z('sowhat', 'So what?', 'Why it matters'), Z('now', 'Now what?', 'The one fix')],
      notes: [],
      mil: { head: 'After Action Review', rows: [
        ['Went well / Opportunities', 'Sustain / Improve', 'Strong fit.'],
        ['One fix into the next Sprint', 'Lessons learned made into action', 'Scrum forces the fix into the next plan; many AARs stop at the list.']
      ] }
    },
    {
      id: 'impediments', step: 29, name: 'Impediment log',
      desc: 'Sort blockers by who can fix them.',
      cue: 'Ask for one real impediment from the learner\'s unit. Decide: can the team fix it, or does it need escalation?',
      zones: [Z('raised', 'Raised', 'Just surfaced'), Z('int', 'Internal', 'The team can fix'), Z('ext', 'External', 'Needs escalation'), Z('gone', 'Removed', 'Cleared')],
      notes: [],
      mil: { head: 'Friction and risk', rows: [
        ['Impediment', 'Friction / risk / obstacle', 'Fit. The Scrum Master helps clear it; it does not become a command decision unless escalated.']
      ] }
    },
    {
      id: 'parking', step: 33, name: 'Parking lot and takeaways',
      desc: 'Key takeaways (aim for five per team) and questions for later.',
      cue: 'Close each block by asking for two takeaways each.',
      zones: [Z('take', 'Key takeaways', 'At least five per team'), Z('park', 'Parking lot', 'Questions for later')],
      notes: [],
      mil: { head: 'Closing', rows: [
        ['Key takeaways', 'AAR key sustains and improves', 'Same habit.']
      ] }
    },
    {
      id: 'process', step: 0, hidden: true, name: 'Planning process',
      desc: 'The selected planning process, one column per step.',
      cue: 'Move the mission\'s work through each step. Add a note for what you would produce there, then compare it to the Scrum parallel in the crosswalk panel.',
      zones: [],
      notes: [],
      mil: { head: 'Planning process', rows: [] }
    },
    {
      id: 'blank', step: 0, name: 'Blank board',
      desc: 'Three empty columns for anything else.',
      cue: '',
      zones: [Z('a', 'Column A'), Z('b', 'Column B'), Z('c', 'Column C')],
      notes: [],
      mil: { head: 'General crosswalk', rows: [] }
    }
  ];

  window.TEMPLATES = TEMPLATES;
})();
