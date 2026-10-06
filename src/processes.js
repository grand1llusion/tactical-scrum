/* Planning processes and a proposed Scrum parallel for each step.
   `status`: 'sourced' = step names confirmed from a public doctrine summary during the build;
   'verify' = written from general knowledge, check against current doctrine before teaching.
   The Scrum parallels are the author's proposal in every case. */
(function () {
  'use strict';
  var PAR = {
    init: ['Product Owner brings the need and a draft Product Goal; first refinement conversation.', 'No commander "directs" the Product Owner; the Product Owner owns the ordering.'],
    ma:   ['Backlog refinement: turn the mission into clear, ordered Product Backlog items. Check Definition of Ready.', 'Mission analysis ends with a restated mission; refinement never really ends.'],
    cod:  ['Sprint Planning, the "how": Developers sketch options for the top items.', 'Staffs often build several full COAs. Scrum prefers one plan for one Sprint.'],
    wg:   ['Test the plan against what could go wrong. Developers surface risks in Sprint Planning; a short spike works like a rehearsal.', 'Wargaming is a formal event; Scrum folds it into planning and the Daily Scrum.'],
    cmp:  ['Product Owner orders by value and risk; Developers size the work.', 'Comparison criteria are explicit in doctrine. In Scrum the ordering rationale must be visible too.'],
    app:  ['Sprint Goal agreed; Product Owner and Developers commit to it.', 'No approval authority sits above the team for how the work is done.'],
    trans:['The Sprint begins and the Developers take over the plan. The Product Owner stays reachable.', 'Transition hands a plan to others to execute; in Scrum the same team plans and does.'],
    ord:  ['Sprint Backlog published, the Sprint starts, the Daily Scrum begins.', 'An order is a document; the Sprint Backlog is a living plan the Developers change daily.']
  };
  function S(arr) { return arr.map(function (a, i) { var p = PAR[a[1]]; return { n: i + 1, name: a[0], out: a[2], scrum: p[0], fric: p[1] }; }); }

  window.PROCESSES = [
    { id: 'mdmp', name: 'MDMP (Army)', service: 'Army', status: 'verify',
      note: 'Military Decision Making Process. Seven steps.',
      steps: S([
        ['Receipt of mission', 'init', 'Alert the staff, gather tools, issue initial guidance.'],
        ['Mission analysis', 'ma', 'Facts and assumptions, tasks, restated mission, initial intent.'],
        ['COA development', 'cod', 'Build options that meet the intent.'],
        ['COA analysis (wargame)', 'wg', 'Walk each option against likely enemy actions.'],
        ['COA comparison', 'cmp', 'Compare options against criteria.'],
        ['COA approval', 'app', 'Commander selects the COA and issues guidance.'],
        ['Orders production, dissemination, transition', 'ord', 'Write the order, brief it, hand it to execution.']
      ]) },
    { id: 'jpp', name: 'JPP (Joint)', service: 'Joint', status: 'verify',
      note: 'Joint Planning Process. Seven steps. Used by USCYBERCOM and joint headquarters.',
      steps: S([
        ['Planning initiation', 'init', 'Receive guidance and set up the planning team.'],
        ['Mission analysis', 'ma', 'Understand the problem, restate the mission.'],
        ['COA development', 'cod', 'Develop options.'],
        ['COA analysis and wargaming', 'wg', 'Test each option.'],
        ['COA comparison', 'cmp', 'Compare options.'],
        ['COA approval', 'app', 'Commander approves a COA.'],
        ['Plan or order development', 'ord', 'Write the plan or order.']
      ]) },
    { id: 'mcpp', name: 'MCPP (Marine Corps)', service: 'Marine Corps', status: 'sourced',
      note: 'Marine Corps Planning Process. Six steps. Step names confirmed from a public summary of MCWP 5-10.',
      steps: S([
        ['Problem framing', 'ma', 'Define the problem before solving it.'],
        ['COA development', 'cod', 'Generate options.'],
        ['COA wargaming', 'wg', 'Test the options.'],
        ['COA comparison and decision', 'cmp', 'Compare and decide. The decision comes with the comparison.'],
        ['Orders development', 'ord', 'Turn the decision into orders.'],
        ['Transition', 'trans', 'Hand the plan to those who execute it.']
      ]) },
    { id: 'npp', name: 'NPP (Navy)', service: 'Navy', status: 'sourced',
      note: 'Navy Planning Process. Six steps. Step names confirmed from a public Navy planning overview (NWP 5-01 family).',
      steps: S([
        ['Mission analysis', 'ma', 'Analyze the environment, define the problem.'],
        ['COA development', 'cod', 'Generate options.'],
        ['COA analysis (wargaming)', 'wg', 'Test each option.'],
        ['COA comparison and decision', 'cmp', 'Compare options and select one.'],
        ['Plans and orders development', 'ord', 'Produce the plan or order.'],
        ['Transition', 'trans', 'Pass the plan to execution.']
      ]) },
    { id: 'afpp', name: 'AFPP (Air Force)', service: 'Air Force', status: 'sourced',
      note: 'Air Force Planning Process. Seven steps. Step names confirmed from the public AFDP 5-0 one-pager.',
      steps: S([
        ['Planning initiation', 'init', 'Identify the need for planning.'],
        ['Mission analysis', 'ma', 'Understand the problem and requirements.'],
        ['COA development', 'cod', 'Create courses of action.'],
        ['COA analysis and wargaming', 'wg', 'Examine each option in detail.'],
        ['COA comparison', 'cmp', 'Weigh the options.'],
        ['COA approval', 'app', 'Select the preferred COA.'],
        ['Plans and orders development', 'ord', 'Turn the approach into directives.']
      ]) },
    { id: 'ato', name: 'Air tasking cycle (ATO)', service: 'Air Force', status: 'verify',
      note: 'The repeating cycle that produces the Air Tasking Order. A good Sprint-shaped comparison: a fixed cycle, a defined output, then assess and repeat.',
      steps: [
        { n: 1, name: 'Objectives, effects, guidance', out: 'Commander sets what the next cycle should achieve.', scrum: 'Sprint Goal and Product Goal conversation.', fric: 'The cycle is a fixed rhythm; the Sprint timebox is too.' },
        { n: 2, name: 'Target development', out: 'Build and prioritize the candidate target list.', scrum: 'Backlog refinement: build and order the candidate items.', fric: '' },
        { n: 3, name: 'Weaponeering and allocation', out: 'Match capabilities to the priorities.', scrum: 'Sprint Planning: match Developers\' capacity to the top items.', fric: 'Allocation is directed; in Scrum Developers pull the work.' },
        { n: 4, name: 'Air tasking order development', out: 'Produce and issue the order for the cycle.', scrum: 'Sprint Backlog published.', fric: '' },
        { n: 5, name: 'Execution planning and force execution', out: 'Fly the order, adjust in real time.', scrum: 'The Sprint: work and Daily Scrum, adapting the plan toward the Sprint Goal.', fric: '' },
        { n: 6, name: 'Combat assessment', out: 'Assess what worked and feed the next cycle.', scrum: 'Sprint Review (inspect the Increment) and Retrospective (inspect the process).', fric: 'Assessment of effects differs from reviewing a working Increment.' }
      ] },
    { id: 'planningp', name: 'Planning P (Coast Guard / ICS)', service: 'Coast Guard', status: 'verify',
      note: 'The incident action planning cycle from the Incident Command System, widely used by the Coast Guard. Shortened here to seven steps.',
      steps: [
        { n: 1, name: 'Incident briefing and initial assessment', out: 'Understand the situation and what is already in place.', scrum: 'Product Goal conversation and first backlog.', fric: '' },
        { n: 2, name: 'Establish objectives', out: 'Incident commander sets objectives for the operational period.', scrum: 'Sprint Goal.', fric: 'ICS objectives come from the commander; the Sprint Goal is negotiated by the Scrum Team.' },
        { n: 3, name: 'Tactics meeting', out: 'Choose strategies and tactics.', scrum: 'Sprint Planning, the "how".', fric: '' },
        { n: 4, name: 'Planning meeting', out: 'Final review of the plan and resources.', scrum: 'Sprint Planning: confirm the Sprint Backlog fits capacity.', fric: '' },
        { n: 5, name: 'Prepare and approve the incident action plan', out: 'Write and sign the plan.', scrum: 'Sprint Backlog agreed.', fric: 'The plan is signed and fixed for the period; the Sprint Backlog stays adjustable.' },
        { n: 6, name: 'Operations briefing and new period begins', out: 'Brief the teams, start the operational period.', scrum: 'Sprint starts; first Daily Scrum.', fric: '' },
        { n: 7, name: 'Execute, assess progress, revise', out: 'Work the plan, measure, feed the next cycle.', scrum: 'Daily Scrum, Sprint Review, Retrospective.', fric: '' }
      ] }
  ];
})();
