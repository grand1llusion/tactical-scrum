/* game.js: Redwater HQ build 1 (Developer role, setup + Sprint 1). Flow, decisions, scoring, panels.
   Scoring is plain data in the decision log so a server can replay it later. */
(function () {
  'use strict';
  const RW = window.RW, MAP = window.MAP, G = window.GFX;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const BEST = 'redwater.best.v1';

  const S = {
    started: false, student: '', phase: 'setup', hour: 0, sprintLen: 24, adj: 0, score: 0, possible: 0, helpUsed: 0,
    speed: 1, modal: false, items: [], strips: new Set(), sel: null, log: [], cats: {}, goal: null, events: [], flags: {}, aiBusy: null, ended: false,
  };

  /* ---------- scoring ---------- */
  function award(pts, clockH, label, cat) {
    S.score += pts; S.adj += clockH || 0;
    S.cats[cat || 'Other'] = (S.cats[cat || 'Other'] || 0) + pts;
    S.log.push({ t: +S.hour.toFixed(2), phase: S.phase, label, pts, clock: clockH || 0 });
    flash('#scoredelta', pts, ''); if (clockH) flash('#clockdelta', clockH, 'h');
    if (pts || clockH) feed('<b>' + (pts >= 0 ? '+' : '') + pts + '</b> ' + esc(label) + (clockH ? ' (' + (clockH > 0 ? '+' : '') + clockH + ' h)' : ''));
    hud();
  }
  const possible = (n) => { S.possible += n; };
  function flash(sel, v, unit) { const e = $(sel); if (!v) return; e.textContent = (v > 0 ? '+' : '') + v + unit; e.className = 'delta ' + (v > 0 ? 'up' : 'down'); clearTimeout(e._t); e._t = setTimeout(() => { e.textContent = ''; }, 2200); }
  const remaining = () => 72 - (S.phase === 'setup' ? 0 : S.hour) + S.adj;
  const fmtH = (h) => { const n = Math.max(0, h), hh = Math.floor(n), mm = Math.floor((n - hh) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
  function hud() {
    $('#score').textContent = S.score;
    $('#clock').textContent = fmtH(remaining());
    $('#sprint').textContent = S.phase === 'sprint' ? 'Sprint 1 · H+' + fmtH(S.hour) + ' of 24:00' : S.phase === 'setup' ? 'Setup' : S.phase === 'review' ? 'Sprint 1 · Review' : 'Sprint 1 · ended';
  }
  function feed(html) { const f = $('#feed'), d = el('div', '', '<span>[' + (S.phase === 'setup' ? 'setup' : 'H+' + fmtH(S.hour)) + ']</span> ' + html); f.prepend(d); }
  function toast(msg, ms) { const t = $('#toast'); t.innerHTML = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, ms || 3200); }

  /* ---------- modal ---------- */
  function openModal(tag, who, title, bodyHtml) {
    S.modal = true; $('#modal').hidden = false;
    $('#mtag').textContent = tag || ''; $('#mtag').hidden = !tag; $('#mwho').textContent = who || '';
    $('#mtitle').textContent = title; $('#mbody').innerHTML = bodyHtml || ''; $('#mopts').innerHTML = ''; $('#mhelp').innerHTML = '';
  }
  function closeModal() { $('#modal').hidden = true; S.modal = false; }
  function cont(label) {
    return new Promise((res) => { $('#mopts').innerHTML = ''; $('#mhelp').innerHTML = ''; const b = el('button', 'primary', esc(label || 'Continue')); b.onclick = () => res(); $('#mopts').append(b); b.focus(); });
  }
  /* ask: options [{text, pts, clock, ok, lesson, cat}] → chosen option after feedback. cfg.hint = coach line */
  function ask(cfg) {
    openModal(cfg.tag, cfg.who, cfg.title, cfg.body);
    const opts = cfg.keepOrder ? cfg.options : shuffle(cfg.options);
    const best = Math.max(...opts.map((o) => o.pts || 0));
    possible(best);
    return new Promise((res) => {
      const btns = opts.map((o) => { const b = el('button', '', esc(o.text)); b.onclick = () => pick(o); $('#mopts').append(b); return { b, o }; });
      const help = $('#mhelp'), coach = el('span', 'coach', '');
      help.append(coach);
      const mk = (label, cost, fn) => { const b = el('button', '', label); b.onclick = () => { S.helpUsed++; award(-cost, 0, 'Help: ' + label.split(' (')[0], 'Help'); fn(); b.disabled = true; }; help.append(b); };
      if (cfg.hint) mk('Hint (−10)', 10, () => { coach.textContent = cfg.hint; });
      mk('Show me (−25)', 25, () => { const wrong = btns.filter((x) => !x.o.ok); wrong.slice(0, Math.max(0, wrong.length - 1)).forEach((x) => { x.b.disabled = true; }); });
      mk('Take over (−50)', 50, () => { const r = btns.find((x) => x.o.ok); if (r) pick(r.o, true); });
      async function pick(o) {
        award(o.pts || 0, o.clock || 0, cfg.logLabel ? cfg.logLabel + ': ' + o.text.slice(0, 48) : o.text.slice(0, 60), cfg.cat);
        S.log[S.log.length - 1].decision = cfg.id; S.log[S.log.length - 1].strong = !!o.ok;
        if (o.lesson || cfg.after) {
          $('#mbody').innerHTML += '<div class="lesson' + (o.ok ? '' : ' neg') + '">' + (o.ok ? '<b>Strong call.</b> ' : '<b>Not the strongest call.</b> ') + esc(o.lesson || '') + '</div>' + (cfg.after ? cfg.after(o) : '');
          await cont();
        }
        if (!cfg.keepOpen) closeModal();
        res(o);
      }
    });
  }
  function info(tag, who, title, body, label) { openModal(tag, who, title, body); return cont(label).then(closeModal); }

  /* ---------- fit call ---------- */
  async function fitCall(n) {
    const f = RW.fit[n];
    const choice = await ask({ id: 'fit' + n, tag: f.step, who: 'Fit call', title: 'How should the cell run this step?', cat: 'MDMP fit calls', keepOpen: true,
      body: '<p>Pick how the planning cell should run this MDMP step: like Scrum, blended, or as traditional staff work.</p>',
      hint: n === 1 ? 'Who owns the initial guidance and timeline, and what does the Product Owner do with it?' : 'Does this step build a list of work that keeps changing as reports come in?',
      options: ['Scrum-style', 'Blended', 'Traditional staff work'].map((t) => ({ text: t, pts: t === f.answer ? 20 : 0, ok: t === f.answer })), keepOrder: true });
    await ask({ id: 'fitwhy' + n, tag: f.step, who: 'Fit call', title: 'Why? (you said: ' + choice.text + ')', cat: 'MDMP fit calls',
      body: '<p>Pick the reason that best supports the right call.</p>',
      options: f.reasons.map(([t, ok]) => ({ text: t, pts: ok ? 20 : 0, ok, lesson: ok ? 'That is the answer key: ' + f.answer + '.' : 'The answer key says ' + f.answer + '. ' + f.reasons.find((r) => r[1])[0] })) });
  }

  /* ---------- items ---------- */
  const item = (id) => S.items.find((i) => i.id === id);
  const depsDone = (it) => !(it.needs || []).some((n) => { const d = item(n); return d && d.state !== 'done'; });
  const isHuman = (id) => id && id !== 'genai';
  function renderBoard() {
    const board = $('#board'); board.innerHTML = '';
    const cols = [['todo', 'To do'], ['doing', 'In progress'], ['check', 'Needs second-planner check'], ['done', 'Done']];
    const sprintItems = S.items.filter((i) => i.inSprint);
    cols.forEach(([st, label]) => {
      const list = sprintItems.filter((i) => i.state === st);
      const c = el('div', 'col'); c.append(el('h4', '', label + ' (' + list.length + ')'));
      list.forEach((it) => c.append(cardEl(it)));
      board.append(c);
    });
    $('#goalchip').textContent = S.goal ? 'Goal: ' + S.goal.short : '';
    const pbl = $('#pbl'); pbl.innerHTML = '';
    S.items.filter((i) => !i.inSprint).forEach((it) => {
      const d = el('div', 'pcard', esc(it.title));
      if (S.phase === 'sprint') { const b = el('button', 'ghost', 'Pull in'); b.style.cssText = 'float:right;font-size:11px;padding:0 6px'; b.onclick = () => { it.inSprint = true; feed('Pulled <b>' + esc(it.title) + '</b> into the Sprint.'); renderBoard(); }; d.prepend(b); }
      pbl.append(d);
    });
  }
  function cardEl(it) {
    const c = el('div', 'card ' + it.state + (it.state === 'todo' && !depsDone(it) ? ' blocked' : '') + (S.sel === it.id ? ' sel' : ''));
    c.append(el('div', 't', esc(it.title)));
    const who = it.assignee ? (it.assignee === 'genai' ? 'GenAI.mil' : nameOf(it.assignee)) : '';
    const meta = [MAP.rooms[it.room].name.split(' +')[0], it.hours + ' h'];
    if (it.state === 'todo' && !depsDone(it)) meta.push('waiting on ' + it.needs.filter((n) => item(n) && item(n).state !== 'done').map((n) => item(n).title.replace('Reconnoiter ', 'Recon ')).join(', '));
    if (who) meta.push((it.state === 'check' ? 'checker: ' : '') + who);
    if (it.state === 'check' && !it.checker) meta.push('worked by ' + nameOf(it.worker));
    c.append(el('div', 'm', meta.map(esc).map((m) => '<span>' + m + '</span>').join('')));
    if (it.state === 'doing' || (it.state === 'check' && it.checker)) { const b = el('div', 'bar'); const p = it.state === 'doing' ? it.progress / it.hours : it.cprog; b.append(Object.assign(el('i'), { style: 'width:' + Math.round(p * 100) + '%' })); c.append(b); }
    if (S.phase === 'sprint' && (it.state === 'todo' || (it.state === 'check' && !it.checker))) {
      const acts = el('div', 'acts');
      const ab = el('button', '', it.state === 'check' ? 'Assign a checker' : 'Assign'); ab.onclick = (e) => { e.stopPropagation(); select(it.id); };
      acts.append(ab);
      if (it.state === 'todo') { const ai = el('button', 'ai', 'Send to GenAI.mil'); ai.onclick = (e) => { e.stopPropagation(); sendToAI(it); }; acts.append(ai); }
      c.append(acts);
    }
    c.onclick = () => select(it.id);
    return c;
  }
  function select(id) {
    const it = item(id); if (!it) return;
    if (S.phase !== 'sprint') return;
    if (!(it.state === 'todo' || (it.state === 'check' && !it.checker))) { S.sel = null; renderAll(); return; }
    if (it.state === 'todo' && !depsDone(it)) { toast(esc(it.title) + ' is waiting on other work to be Done first.'); return; }
    S.sel = S.sel === id ? null : id; renderAll();
    if (S.sel) toast('Now click a teammate in the roster or on the map' + (it.state === 'check' ? ' to do the second-planner check.' : '.'), 2600);
  }
  const nameOf = (id) => (id === 'you' ? 'You' : id === 'genai' ? 'GenAI.mil' : (RW.team.find((m) => m.id === id) || {}).name || id);
  const busy = (id) => S.items.some((i) => (i.state === 'doing' && i.assignee === id) || (i.state === 'check' && i.checker === id));

  function assignTo(mateId) {
    const it = item(S.sel); if (!it) return;
    if (mateId === 'genai') { if (it.state === 'check') { toast('GenAI.mil can\'t be your second planner. The Definition of Done says a second <i>planner</i> checks it.'); return; } sendToAI(it); return; }
    if (busy(mateId)) { toast(nameOf(mateId) + ' is already working on something. One thing at a time keeps work flowing.'); return; }
    if (it.state === 'check') {
      if (it.worker === mateId) { toast('The second-planner check needs a different person from the one who did the work.'); return; }
      it.checker = mateId; it.cprog = 0; feed('<b>' + nameOf(mateId) + '</b> checks <b>' + esc(it.title) + '</b>.');
    } else {
      it.state = 'doing'; it.assignee = mateId; it.worker = mateId; it.progress = 0; feed('<b>' + nameOf(mateId) + '</b> starts <b>' + esc(it.title) + '</b>.');
    }
    MAP.moveTo(mateId, it.room);
    S.sel = null; renderAll();
  }
  function sendToAI(it) {
    if (it.state !== 'todo') return;
    if (!depsDone(it)) { toast('That item is waiting on other work.'); return; }
    if (it.ai === 'none') { award(-10, 0, 'Tried to send recon to GenAI.mil', 'AI calls'); toast(RW.aiNotes.none, 3800); return; }
    if (S.aiBusy) { toast('GenAI.mil is already working on ' + esc(item(S.aiBusy).title) + '.'); return; }
    it.state = 'doing'; it.assignee = 'genai'; it.worker = 'genai'; it.progress = 0; S.aiBusy = it.id; S.sel = null;
    feed('<b>GenAI.mil</b> starts <b>' + esc(it.title) + '</b> (about 3 times faster).'); renderAll();
  }

  /* ---------- work simulation ---------- */
  function tickWork(dh) {
    S.items.forEach((it) => {
      if (!it.inSprint) return;
      if (it.state === 'doing') {
        let rate;
        if (it.assignee === 'genai') rate = 3;
        else { if (MAP.walking(it.assignee)) return; const m = RW.team.find((q) => q.id === it.assignee); rate = (m && m.home === it.room) || (it.assignee === 'you' && it.room === 's3') ? 1.5 : 1; }
        it.progress = Math.min(it.hours, it.progress + dh * rate);
        if (it.assignee !== 'genai') MAP.setBar(it.assignee, it.progress / it.hours);
        if (it.progress >= it.hours) finishWork(it);
      } else if (it.state === 'check' && it.checker && !MAP.walking(it.checker)) {
        it.cprog = Math.min(1, it.cprog + dh);
        MAP.setBar(it.checker, it.cprog);
        if (it.cprog >= 1) finishCheck(it);
      }
    });
  }
  function reveal(n, by) {
    if (S.strips.has(n)) return false;
    S.strips.add(n); feed('Evidence strip <b>' + n + '</b> logged' + (by ? ' by ' + esc(by) : '') + '.'); renderEvidence(); return true;
  }
  function finishWork(it) {
    const by = it.assignee;
    if (by !== 'genai') MAP.setBar(by, null); else S.aiBusy = null;
    (it.strips || []).forEach((n) => reveal(n, nameOf(by)));
    if (it.uses11 && !S.strips.has(11)) it.flawed = true;
    if (by === 'genai') {
      possible(20);
      if (it.ai === 'good') { award(20, 1, 'GenAI.mil used well: ' + it.title, 'AI calls'); toast('<b>GenAI.mil:</b> ' + RW.aiNotes.good, 4200); }
      else if (it.ai === 'bad') { award(-30, -2, 'GenAI.mil made an enemy judgment: ' + it.title, 'AI calls'); toast('<b>GenAI.mil:</b> ' + RW.aiNotes.bad, 5200); }
      else if (it.ai === 'risky') { toast('<b>GenAI.mil</b> finished the assessment fast. ' + (it.flawed ? 'Did anyone check how current the ford readings are?' : 'Strip 11 was already logged, so it used the right depth.'), 4600); if (!it.flawed) award(10, 1, 'GenAI.mil compiled the assessment with current sources', 'AI calls'); }
    }
    it.state = 'check'; it.assignee = null; it.checker = null; it.cprog = 0;
    if (it.id === 're') { possible(20); award(20, 2, 'Engineer request in early (bridge company in 30 h, not 60 h)', 'Mission'); }
    if (it.id === 'rm' && !S.flags.inject2) S.flags.inject2Due = true;
    renderAll();
  }
  function finishCheck(it) {
    MAP.setBar(it.checker, null);
    (it.check || []).forEach((n) => { if (reveal(n, nameOf(it.checker))) { possible(40); award(40, 2, 'Second planner caught the stale Mill Ford reading (strip 11)', 'Evidence'); toast('<b>' + nameOf(it.checker) + ':</b> "Hold on, this Mill Ford card says day 3. That\'s last month\'s recon. The river is up 40 cm since." Strip 11 logged.', 5200); } });
    it.state = 'done'; possible(10); award(10, 0, 'Done to the Definition of Done: ' + it.title, 'Done work');
    renderAll();
  }

  /* ---------- panels ---------- */
  function renderRoster() {
    const r = $('#roster'); r.innerHTML = '';
    const mates = [{ id: 'you', name: 'You', role: 'Developer (Plans)', look: { skin: '#e0b088', hair: '#4a3020' } }].concat(RW.team);
    mates.forEach((m) => {
      const d = el('div', 'mate' + (S.sel ? ' target' : ''));
      const c = document.createElement('canvas'); c.width = 16; c.height = 16; const a = MAP.agent(m.id);
      c.getContext('2d').drawImage(G.person(a.look, 0, 0), 0, 0); d.append(c);
      const it = S.items.find((i) => (i.state === 'doing' && i.assignee === m.id) || (i.state === 'check' && i.checker === m.id));
      const st = it ? (MAP.walking(m.id) ? 'Walking to ' + MAP.rooms[it.room].name.split(' +')[0] : (it.state === 'check' ? 'Checking: ' : '') + it.title + ' ' + Math.round((it.state === 'doing' ? it.progress / it.hours : it.cprog) * 100) + '%') : 'Free · ' + MAP.rooms[a.room].name.split(' +')[0];
      d.append(el('div', '', '<div class="n">' + esc(m.name) + '</div><div class="s">' + esc(m.role) + ' · ' + esc(st) + '</div>'));
      d.onclick = () => { if (S.sel) assignTo(m.id); else { MAP.select(m.id); if (m.quip) toast('<b>' + esc(m.name) + ':</b> "' + esc(m.quip) + '"'); } };
      r.append(d);
    });
    const ai = el('div', 'mate ai' + (S.sel ? ' target' : ''));
    const ait = S.aiBusy && item(S.aiBusy);
    ai.innerHTML = '<canvas width="16" height="16"></canvas><div><div class="n">GenAI.mil terminal</div><div class="s">S6 · ' + (ait ? esc(ait.title) + ' ' + Math.round(ait.progress / ait.hours * 100) + '%' : 'Ready. Approved military LLMs.') + '</div></div>';
    const g = ai.querySelector('canvas').getContext('2d'); g.fillStyle = '#1a1f27'; g.fillRect(1, 2, 14, 10); g.fillStyle = '#b48cf0'; g.fillRect(2, 3, 12, 8); g.fillStyle = '#1a1f27'; g.fillRect(6, 12, 4, 3);
    ai.onclick = () => { if (S.sel) assignTo('genai'); else toast('GenAI.mil drafts, formats, cross-checks and does the math fast. It can\'t put eyes on a river, can\'t be your second planner, and doesn\'t make the commander\'s call.', 4500); };
    r.append(ai);
  }
  function renderEvidence() {
    const e = $('#evidence'); e.innerHTML = '';
    [...S.strips].sort((a, b) => b - a).forEach((n) => e.append(el('div', 'strip', '<b>#' + n + '</b> ' + esc(RW.strips[n]))));
    $('#stripcount').textContent = S.strips.size + ' of 11';
  }
  function renderAll() { renderBoard(); renderRoster(); hud(); }

  /* ---------- agents on the map ---------- */
  function placeAgents() {
    MAP.prepare();
    MAP.addAgent({ id: 'you', name: 'You', room: 's3', look: { skin: '#e0b088', hair: '#4a3020' } });
    RW.team.forEach((m) => MAP.addAgent({ id: m.id, name: m.name, room: m.home, look: m.look }));
    MAP.addAgent({ id: 'hart', name: 'COL Hart', room: 'cdr', look: { skin: '#e8c0a0', hair: '#bdbdbd' } });
    MAP.addAgent({ id: 'dunn', name: 'MAJ Dunn (PO)', room: 'brief', look: RW.po.look });
    MAP.addAgent({ id: 'vega', name: 'CPT Vega (SM)', room: 'brief', look: RW.sm.look });
    MAP.addAgent({ id: 'cole', name: 'LTC Cole', room: 's1', look: { skin: '#d8a880', hair: '#5a4a3a' }, hidden: true });
    MAP.onClick((h) => {
      if (h.agent) { const m = RW.team.find((q) => q.id === h.agent) || (h.agent === 'you' && { id: 'you' }); if (S.sel && m) assignTo(h.agent); else { MAP.select(h.agent); const q = RW.team.find((x) => x.id === h.agent); if (q) toast('<b>' + esc(q.name) + '</b>, ' + esc(q.role) + ': "' + esc(q.quip) + '"'); } }
      else if (h.room === 's6' && S.sel) assignTo('genai');
      else if (h.room) { const rm = MAP.rooms[h.room]; toast('<b>' + esc(rm.name) + '</b>' + (rm.event ? ' · hosts ' + esc(rm.event) : '')); }
    });
  }

  /* ---------- setup phase ---------- */
  async function setup() {
    S.phase = 'setup'; $('#phase').textContent = 'MDMP 1 · Receipt of mission'; hud();
    await info('MDMP 1 · Receipt of mission', 'COL Hart, brigade commander (fictional)', "Commander's guidance",
      '<div class="quote">"In 72 hours our lead battalion must cross the Redwater River with its heavy vehicles. Kessel Bridge, the obvious crossing, is damaged. Recon has found two possible fords: Mill Ford to the north and Otter Bend to the south. The far bank is lightly held; we don\'t know exactly by whom or where. Rain is coming. My intent: open a crossing the lead battalion can use within 72 hours, with the far bank secure and traffic under control, without shutting down Brenmoor\'s market road."</div><p>You are a Developer (Plans) in the brigade\'s crossing planning cell. MAJ Dunn is your Product Owner and CPT Vega your Scrum Master. Everything here is fictional.</p><p class="xwalk">Product Goal: A secured crossing that carries the first vehicles within 72 hours.</p>', 'Got it');
    reveal(10, 'COL Hart');
    await fitCall(1);
    await ask({ id: 'timeline', tag: 'MDMP 1 · Receipt of mission', who: 'AI call', title: 'The planning timeline', cat: 'AI calls',
      body: '<p>Someone has to build the planning timeline: 72 hours, with the one-third, two-thirds rule for the battalions. How do you do it?</p>',
      hint: 'Which part is arithmetic, and which part needs a human before it goes out?',
      options: [
        { text: 'Have GenAI.mil do the timeline math, then check it before it goes out', pts: 20, clock: 1, ok: true, lesson: 'Timeline math is exactly the kind of work AI does well. A human still checks it before release.' },
        { text: 'Do it by hand on the whiteboard', pts: 0, clock: -1, lesson: 'Fine, but slow. Arithmetic is a good place to let GenAI.mil save you an hour.' },
        { text: 'Let GenAI.mil build it and send it straight to the battalions', pts: -30, clock: -2, lesson: 'Nothing should leave the cell without a human review. The AI drafts; people release.' }] });
    S.phase = 'refine'; $('#phase').textContent = 'MDMP 2 · Mission analysis';
    await fitCall(2);
    await ask({ id: 'split', tag: 'MDMP 2 · Refinement', who: 'MAJ Dunn (PO)', title: '"Reconnoiter crossing sites" is one big item', cat: 'Scrum calls',
      body: '<p>The starter backlog has one item for all the recon. What do you suggest to MAJ Dunn?</p>', hint: 'Smaller items can be finished, checked and learned from sooner.',
      options: [
        { text: 'Split it into Kessel Bridge, Mill Ford and Otter Bend', pts: 20, ok: true, lesson: 'Three smaller items flow and finish independently. Each recon can be Done and checked on its own.' },
        { text: 'Keep it as one item so nobody loses track', pts: -10, lesson: 'One giant item hides progress until everything is finished. Splitting is the pack\'s first refinement move.' }] });
    const added = await pickAdds();
    await ask({ id: 'challenge', tag: 'MDMP 2 · Refinement', who: 'You, looking at the backlog', title: '"Request engineer support" sits above the recon items. Odd?', cat: 'Role calls',
      body: '<p>We don\'t know which site yet, but the request is ordered high. What do you do?</p>', hint: 'Who orders the Product Backlog? And what can a Developer do about it?',
      options: [
        { text: 'Ask MAJ Dunn openly why it\'s ordered there', pts: 20, ok: true, lesson: 'Good challenge. Her answer: the request has a long lead time, so it may need to go early. The backlog emerges as the team learns.' },
        { text: 'Quietly move it down the backlog yourself', pts: -25, clock: -1, lesson: 'Role trap. The Product Owner is accountable for ordering the Product Backlog. Developers challenge it out loud; they don\'t reorder it.' },
        { text: 'Say nothing; it\'s not your job', pts: 0, lesson: 'Developers are expected to question and help refine the backlog. Asking would have helped.' }] });
    // build the backlog
    S.items = RW.items.filter((i) => (i.id !== 'ct' || added.ct) && (i.id !== 'ov' || added.ov)).map((i) => Object.assign({ state: 'todo', progress: 0, inSprint: false }, i, { needs: (i.needs || []).filter((n) => n !== 'ct' || added.ct) }));
    renderAll();
    await planning();
  }
  function pickAdds() {
    possible(20);
    openModal('MDMP 2 · Refinement', 'MAJ Dunn (PO)', 'Which items from COL Hart\'s guidance belong on the backlog?', '<p>Tick every item that should be added. (Each right tick +10, each wrong tick −10.)</p>');
    const choices = [['ct', 'Assess civilian traffic on Route Copper', true], ['ov', 'Set up the crossing overlay', true], ['brief', 'Brief COL Hart every hour on everything', false], ['paint', 'Repaint the motor pool in case the commander walks by', false]];
    shuffle(choices).forEach(([id, t]) => { const l = el('label', '', '<input type="checkbox" id="add-' + id + '"> ' + esc(t)); $('#mopts').append(l); });
    return new Promise((res) => {
      const b = el('button', 'primary', 'Add to the backlog'); $('#mopts').append(b);
      b.onclick = async () => {
        const got = {}; let pts = 0;
        choices.forEach(([id, , ok]) => { const on = $('#add-' + id).checked; got[id] = on; if (on) pts += ok ? 10 : -10; });
        award(pts, 0, 'Backlog items added from the guidance', 'Scrum calls');
        $('#mbody').innerHTML += '<div class="lesson' + (pts >= 20 ? '' : ' neg') + '">The guidance names Brenmoor\'s market road and a crossing everyone can see, so civilian traffic and the overlay belong. Hourly briefings and paint jobs aren\'t backlog items.</div>';
        await cont(); closeModal(); res(got);
      };
    });
  }
  async function planning() {
    S.phase = 'planning'; $('#phase').textContent = 'MDMP 2 · Sprint Planning';
    const goals = [
      { id: 'site', short: 'Recommend a crossing site', text: 'Recommend the crossing site with the best chance of carrying heavy vehicles within 72 hours.', pts: 20, ok: true, lesson: 'A clear, single objective that leaves the team room to decide how.' },
      { id: 'know', short: 'Know all three sites', text: 'Know the condition of all three crossing sites.', pts: 20, ok: true, lesson: 'A good goal: one coherent objective for the Sprint.' },
      { id: 'all', short: 'Finish everything', text: 'Finish every item on the Product Backlog.', pts: -20, lesson: 'That\'s a to-do list, not a goal. A Sprint Goal is one objective that gives the Sprint coherence.' },
      { id: 'slides', short: '40 slides', text: 'Build COL Hart a 40-slide deck about the river.', pts: -20, lesson: 'The PowerPoint Ranger would be proud. A Sprint Goal is about value, not slide count.' },
    ];
    const g = await ask({ id: 'goal', tag: 'Sprint Planning ↔ COA development to orders, in one short window', who: 'MAJ Dunn (PO) and the Developers', title: 'Pick the Sprint Goal for Sprint 1 (24 hours)', cat: 'Scrum calls', body: '<p>The Product Owner proposes how this Sprint adds value; the whole team agrees the Sprint Goal.</p>', hint: 'A Sprint Goal is one objective, not a list.', options: goals });
    S.goal = g;
    // choose items
    openModal('Sprint Planning', 'The Developers', 'What will you pull into Sprint 1?', '<p>The Developers select the items they forecast for the Sprint. Pick what serves the goal: <b>' + esc(g.text) + '</b> You can pull more in later.</p>');
    S.items.forEach((it) => { const l = el('label', '', '<input type="checkbox" id="pull-' + it.id + '"' + (['rk', 'rm', 'ro', 'as'].includes(it.id) ? ' checked' : '') + '> ' + esc(it.title) + ' <span class="mini">(' + it.hours + ' h)</span>'); $('#mopts').append(l); });
    await new Promise((res) => { const b = el('button', 'primary', 'Start Sprint 1'); b.onclick = res; $('#mopts').append(b); });
    S.items.forEach((it) => { it.inSprint = $('#pull-' + it.id).checked; });
    closeModal();
    startSprint();
  }

  /* ---------- the Sprint ---------- */
  function startSprint() {
    S.phase = 'sprint'; S.hour = 0; $('#phase').textContent = 'MDMP 2 · Mission analysis';
    feed('Sprint 1 started. Goal: <b>' + esc(S.goal.text) + '</b>');
    toast('Sprint 1 is running. Click a card, then click a teammate to assign it. Cards in "Needs check" need a different person to do the second-planner check.', 6000);
    S.events = [
      { at: 1.5, fn: () => { reveal(4, 'S2 weather desk'); } },
      { at: 4, fn: inject1 },
      { at: 6, fn: () => { reveal(9, 'S3 air defense desk'); } },
      { at: 8, fn: daily },
      { at: 11, fn: impediment },
      { at: 14, fn: aiDecision },
      { at: 16, fn: () => { if (!S.flags.inject2) return inject2(true); } },
      { at: 18.5, fn: coffee },
      { at: 24, fn: endSprint },
    ];
    renderAll();
  }
  async function inject1() {
    const cole = MAP.agent('cole'); cole.hidden = false; MAP.place('cole', 's1'); MAP.setAlert('s3', true);
    await MAP.moveTo('cole', MAP.agent('you').room);
    await ask({ id: 'inject1', tag: 'Inject 1 · The liaison', who: 'LTC Cole, division logistics liaison (fictional)', title: '"Drop what you\'re doing."', cat: 'Injects',
      body: '<div class="quote">"Hey. I need a fuel and water estimate for the lead battalion\'s crossing night by noon. Drop what you\'re doing. Your boss will understand."</div>',
      hint: 'Who decides what new work the team takes on?',
      options: [
        { text: '"Sir, let me bring in MAJ Dunn, our Product Owner. New work goes through her so she can order it against the Sprint Goal."', pts: 30, clock: 1, ok: true, lesson: 'Exactly. The PO decides: add it to the Product Backlog and order it, or, if it fits without endangering the Sprint Goal, negotiate with the Developers.' },
        { text: 'Drop your task and start the estimate', pts: -20, clock: -2, lesson: 'Your Sprint Goal just lost a Developer and nobody decided that. Ask in the debrief: who chose this over the goal?' },
        { text: 'Promise it by noon and work through the night', pts: -20, clock: -1, lesson: 'Heroics hide the trade-off. The Product Owner should decide whether this work is worth more than the Sprint Goal.' },
        { text: 'Ignore him and hope he leaves', pts: -10, lesson: 'He outranks the problem. Be polite and route it to the Product Owner instead.' }] });
    MAP.setAlert('s3', false); cole.hidden = true; MAP.place('cole', 's1');
    S.items.push({ id: 'fuel', title: 'Fuel and water estimate (LTC Cole)', room: 's4', hours: 3, ai: 'good', state: 'todo', progress: 0, inSprint: false, needs: [] });
    feed('MAJ Dunn added <b>Fuel and water estimate</b> to the Product Backlog and ordered it.'); renderAll();
  }
  async function daily() {
    MAP.setAlert('brief', true);
    await ask({ id: 'daily', tag: 'Daily Scrum ↔ looks like a battle update, but the Developers own it', who: 'Briefing room · 15 minutes', title: 'Daily Scrum', cat: 'Scrum calls',
      body: '<p>The Developers have 15 minutes. What should this Daily Scrum focus on?</p>', hint: 'What is the Daily Scrum for, and who is it for?',
      options: [
        { text: 'Progress toward the Sprint Goal and an adjusted plan for the next day of work', pts: 30, ok: true, lesson: 'That\'s the purpose. It\'s the Developers\' planning huddle, not a report to anyone.' },
        { text: 'A status brief by section for the boss', pts: -20, clock: -1, lesson: 'A status brief is a real staff event, just not the Daily Scrum. Don\'t fold one into the other.' },
        { text: 'Solve the culvert problem in full detail right now', pts: -10, clock: -1, lesson: 'Spot the problem, then take it offline after the 15 minutes with the people who need to be there.' }] });
    MAP.setAlert('brief', false);
  }
  async function inject2(late) {
    S.flags.inject2 = true;
    const rm = item('rm'); if (!rm || !rm.inSprint || rm.state !== 'check') return;
    MAP.setAlert('s2', true);
    const o = await ask({ id: 'inject2', tag: 'Inject 2 · The shortcut', who: 'A card slid under your keyboard', title: '"Nobody will check."', cat: 'Injects',
      body: '<div class="quote">"The PO would love a firm Mill Ford assessment at the Review. You can mark it Done now if you skip the second planner\'s check on your Definition of Done. Nobody will check."</div>',
      hint: 'What does the Definition of Done protect?',
      options: [
        { text: 'Refuse. It isn\'t Done until a second planner checks it.', pts: 30, ok: true, lesson: 'The Definition of Done is a commitment. Bending it creates rework later, and trust is hard to win back.' },
        { text: 'Tell the team openly and decide together not to bend the DoD', pts: 30, ok: true, lesson: 'Transparency and courage. The team owns its Definition of Done together.' },
        { text: 'Take the shortcut and mark it Done', pts: -20, lesson: 'Shortcut taken. Watch what happens to the Mill Ford reading later.' }] });
    MAP.setAlert('s2', false);
    if (!o.ok) { if (rm.checker) MAP.setBar(rm.checker, null); rm.state = 'done'; rm.shortcut = true; rm.checker = null; feed('Mill Ford recon marked <b>Done</b> without the second-planner check.'); renderAll(); }
  }
  async function impediment() {
    MAP.setAlert('eng', true);
    await ask({ id: 'imped', tag: 'Impediment', who: '1LT Novak, Engineer cell', title: '"The culverts on Route Copper are a problem."', cat: 'Scrum calls',
      body: '<div class="quote">"Two culverts are damaged 2 km short of Kessel Bridge. Clearing them needs engineer equipment our cell doesn\'t control."</div>',
      hint: 'Who helps remove impediments the team can\'t solve itself?',
      options: [
        { text: 'Log it on the impediment board and raise it with CPT Vega (SM) now', pts: 30, clock: 1, ok: true, lesson: 'Make it visible and get the Scrum Master working on removing it, while the team keeps going on what it can do.' },
        { text: 'Quietly plan around it and don\'t mention it', pts: -20, clock: -1, lesson: 'Hidden impediments become surprises at the Review. Transparency first.' },
        { text: 'Stop all route work until someone else fixes it', pts: -10, clock: -2, lesson: 'Raise it and keep moving on what you can do. Waiting silently costs hours.' }] });
    MAP.setAlert('eng', false);
  }
  async function aiDecision() {
    MAP.setAlert('s6', true);
    await ask({ id: 'aidecide', tag: 'AI call', who: 'SPC Patel, S6', title: '"Chief, GenAI.mil can just pick the site."', cat: 'AI calls',
      body: '<div class="quote">"I can paste every report we have into GenAI.mil, have it pick the best crossing site and send the recommendation straight to COL Hart. Like four seconds."</div>',
      hint: 'Which parts of this are computation, and which are judgment?',
      options: [
        { text: 'Use it to line up every report with its source and time, then the team writes the recommendation', pts: 30, clock: 1, ok: true, lesson: 'AI is great at lining up evidence and spotting gaps. The judgment, and the call on which reports are current, stay with the planners. The decision stays with the commander.' },
        { text: 'Let it pick the site and send it to COL Hart', pts: -30, clock: -2, lesson: 'The AI just made a recommendation nobody checked and sent it past the whole team. Choosing which COAs go forward isn\'t its job.' },
        { text: 'Ban GenAI.mil from the cell entirely', pts: -10, lesson: 'Too far. Used well, it saves hours on drafting, timing math and cross-checking.' }] });
    MAP.setAlert('s6', false);
  }
  async function coffee() {
    MAP.setAlert('brk', true);
    await ask({ id: 'coffee', tag: 'Critical asset failure', who: 'SGT Wu, S4', title: 'The coffee machine is down.', cat: 'Scrum calls',
      body: '<p>Morale is falling faster than the river is rising. SGT Wu wants to drop everything and fix it.</p>', hint: 'Whose job is removing impediments?',
      options: [
        { text: 'Tell CPT Vega; the Scrum Master can chase it while you keep working', pts: 10, ok: true, lesson: 'Even silly impediments go to the Scrum Master. The coffee was restored within the hour.' },
        { text: 'Everyone stops to fix the coffee machine', pts: -10, clock: -1, lesson: 'Six planners and one coffee machine. The Sprint Goal did not get closer.' }] });
    MAP.setAlert('brk', false);
  }

  async function endSprint() {
    S.phase = 'review'; hud(); $('#phase').textContent = 'Sprint Review ↔ in-progress review';
    S.items.forEach((it) => { if (it.assignee && it.assignee !== 'genai') MAP.setBar(it.assignee, null); });
    const done = (id) => { const i = item(id); return i && i.state === 'done'; };
    const met = S.goal.id === 'site' ? done('as') : S.goal.id === 'know' ? done('rk') && done('rm') && done('ro') : S.goal.id === 'all' ? S.items.every((i) => i.state === 'done') : false;
    possible(50);
    if (met) award(50, 2, 'Sprint Goal met', 'Mission'); else feed('Sprint Goal <b>not met</b>.');
    await info('Sprint 1 ends', 'Timebox reached', met ? 'Sprint Goal met' : 'Sprint Goal not met', '<p>' + esc(S.goal.text) + '</p><p>' + S.items.filter((i) => i.state === 'done').length + ' items Done. Work that isn\'t Done goes back to the Product Backlog for MAJ Dunn to reorder.</p>', 'On to the Sprint Review');
    await review(); await retro(); await finish();
  }
  async function review() {
    MAP.setAlert('cdr', true);
    await ask({ id: 'review1', tag: 'Sprint Review ↔ in-progress review with the commander', who: 'Lead battalion S3 (stakeholder)', title: '"Where and when do my vehicles cross?"', cat: 'Injects',
      body: '<div class="quote">"I care about one thing: getting my heavy vehicles across in one night. Show me what\'s actually Done. No slides."</div>', hint: 'What does the Sprint Review inspect?',
      options: [
        { text: 'Show only the Done items and the evidence behind them', pts: 30, ok: true, lesson: 'The Review inspects the Increment: what is actually Done. Unfinished work isn\'t shown as if it were done.' },
        { text: 'Walk through every item, including half-finished ones, as if they were done', pts: -20, lesson: 'That hides the real state of the work. Transparency is the first pillar.' },
        { text: 'Present the 40-slide deck', pts: -20, lesson: 'He said no slides. The Review is a working session, not a presentation.' }] });
    const as = item('as'), rm = item('rm');
    if ((as && as.state === 'done' && as.flawed) || (rm && rm.shortcut && !S.strips.has(11))) {
      award(-40, -3, 'Stale Mill Ford reading reached the stakeholder', 'Evidence');
      await info('Sprint Review', 'Lead battalion S3', 'The bill comes due', '<div class="quote">"This uses a Mill Ford depth from last month. Your own S2 says the river is 40 centimeters higher. You nearly routed my heavy vehicles into a ford they can\'t use."</div><div class="lesson neg">Strip 11 was there to be found. A second-planner check on the Mill Ford recon catches it; a shortcut or an unchecked GenAI.mil summary doesn\'t.</div>', 'Ouch. Continue');
      reveal(11, 'the lead battalion S3');
    }
    await ask({ id: 'review2', tag: 'Sprint Review', who: 'Lead battalion S3 (stakeholder)', title: '"I also need a holding area."', cat: 'Injects',
      body: '<div class="quote">"I need a holding area on the near bank and a crossing time for each company."</div>', hint: 'Where does new work go, and who orders it?',
      options: [
        { text: 'Thank him; MAJ Dunn adds it to the Product Backlog and orders it', pts: 30, ok: true, lesson: 'Exactly how the Review is meant to work: inspect the outcome and adapt the Product Backlog.' },
        { text: 'Promise it by tonight', pts: -20, clock: -1, lesson: 'A Developer just committed the team without the Product Owner. Let the PO order it.' },
        { text: '"That\'s out of scope."', pts: -10, lesson: 'It serves the Product Goal. Capture it; the PO decides when.' }] });
    MAP.setAlert('cdr', false);
  }
  async function retro() {
    MAP.setAlert('brk', true);
    const shortcut = (item('rm') || {}).shortcut;
    await ask({ id: 'retro', tag: 'Sprint Retrospective ↔ an AAR that puts one fix into the next plan', who: 'Break room', title: 'Pick one improvement for Sprint 2', cat: 'Scrum calls',
      body: '<p>The Retrospective must produce at least one concrete improvement the team will actually do next Sprint.</p>', hint: 'Concrete and doable beats grand and vague.',
      options: [
        { text: shortcut ? 'Add "source date checked" to the Definition of Done and never skip the second-planner check' : 'Add "source date checked" to the Definition of Done', pts: 20, ok: true, lesson: 'Concrete, small and tied to what happened. That is a good Retrospective outcome.' },
        { text: 'Send every outside request to MAJ Dunn first, and post that on the door', pts: 20, ok: true, lesson: 'Concrete and doable. It protects the Sprint Goal from walk-up requests.' },
        { text: 'Work harder', pts: -10, lesson: 'Not an improvement anyone can act on. Pick something specific.' },
        { text: 'Buy a second coffee machine', pts: 0, lesson: 'Honestly not the worst idea, but it won\'t fix how the team plans.' }] });
    MAP.setAlert('brk', false);
  }
  async function finish() {
    S.ended = true; S.phase = 'ended'; hud();
    possible(75); if (!S.helpUsed) award(75, 0, 'No help used', 'Help');
    const pct = Math.max(0, Math.round((S.score / Math.max(1, S.possible)) * 100)), medal = pct >= 85 ? 'Gold' : pct >= 70 ? 'Silver' : pct >= 50 ? 'Bronze' : 'No medal';
    const ok = remaining() > 48 - 6; // slice: on track if the clock holds near the planned 48 h left
    let best = null; try { best = JSON.parse(localStorage.getItem(BEST) || 'null'); } catch (e) { /* storage may be blocked */ }
    const isBest = !best || S.score > best.score;
    if (isBest) try { localStorage.setItem(BEST, JSON.stringify({ score: S.score, pct, at: new Date().toISOString(), student: S.student })); } catch (e) { /* ignore */ }
    const rows = Object.entries(S.cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<tr><td>' + esc(k) + '</td><td class="n ' + (v >= 0 ? 'pos' : 'neg') + '">' + (v >= 0 ? '+' : '') + v + '</td></tr>').join('');
    openModal('Sprint 1 complete', 'Build 1 ends here', medal + ' · ' + S.score + ' points (' + pct + '% of what was possible)',
      '<p>Mission clock: <b>' + fmtH(remaining()) + '</b> left (' + (ok ? 'on track' : 'behind') + '). ' + (isBest ? '<b>New best score.</b>' : 'Best so far: ' + best.score + '.') + '</p><table class="score">' + rows + '</table><p class="mini">Sprints 2 and 3 (river rising, the XO at the Daily Scrum, the division approval window) come in build 2. Every decision above is in the run log, ready for the server to replay.</p>');
    const again = el('button', 'primary', 'Play again'); again.onclick = () => location.reload();
    const coa = el('button', '', 'Try the COA weighting mini-game'); coa.onclick = () => { closeModal(); window.COA.open(); };
    const logb = el('button', '', 'Copy the decision log (JSON)');
    logb.onclick = () => { const txt = JSON.stringify({ student: S.student, score: S.score, possible: S.possible, goal: S.goal.id, log: S.log }, null, 1); navigator.clipboard && navigator.clipboard.writeText(txt).then(() => toast('Decision log copied.'), () => toast('Copy failed; your browser blocked the clipboard.')); };
    $('#mopts').append(again, coa, logb);
  }

  /* ---------- title ---------- */
  function title() {
    let best = null; try { best = JSON.parse(localStorage.getItem(BEST) || 'null'); } catch (e) { /* ignore */ }
    openModal('Operation Redwater Crossing · fictional, unclassified', 'Build 1', 'Redwater HQ',
      '<div class="title-screen"><p>Run the brigade\'s crossing planning cell through MDMP with Scrum, and decide where GenAI.mil helps and where it must not lead.</p>' +
      '<div class="roles"><button class="on">Developer<br><span class="mini">assign the work</span></button><button disabled>Product Owner<br><span class="mini">build 2</span></button><button disabled>Scrum Master<br><span class="mini">build 2</span></button></div>' +
      '<p><label>Student number <input type="text" id="studentno" maxlength="12" placeholder="optional for now" autocomplete="off"></label></p>' +
      (best ? '<p class="mini">Your best: ' + best.score + ' points (' + best.pct + '%)</p>' : '') + '</div>');
    const go = el('button', 'primary', 'Start the mission'); go.onclick = () => { S.student = ($('#studentno').value || '').trim(); closeModal(); S.started = true; setup(); };
    const coa = el('button', '', 'Practice: COA weighting mini-game'); coa.onclick = () => { closeModal(); window.COA.open(() => title()); };
    $('#mopts').append(go, coa);
  }

  /* ---------- loop ---------- */
  document.querySelectorAll('#speed button').forEach((b) => b.onclick = () => { S.speed = +b.dataset.s; document.querySelectorAll('#speed button').forEach((x) => x.classList.toggle('on', x === b)); });
  addEventListener('keydown', (e) => { if (e.key === ' ' && !S.modal && e.target === document.body) { e.preventDefault(); const nb = document.querySelector('#speed button[data-s="' + (S.speed ? 0 : 1) + '"]'); nb.click(); } });
  $('#hintbtn').onclick = () => {
    if (S.phase !== 'sprint') { toast('Hints appear inside each decision.'); return; }
    S.helpUsed++; award(-10, 0, 'Help: map hint', 'Help');
    const chk = S.items.find((i) => i.inSprint && i.state === 'check' && !i.checker);
    const ready = S.items.find((i) => i.inSprint && i.state === 'todo' && depsDone(i));
    const rm = item('rm');
    let h = 'Everything is moving. Watch for alerts over rooms.';
    if (rm && rm.inSprint && rm.state === 'check' && !rm.checker) h = 'Mill Ford recon needs a second planner. A careful check is where the stale reading gets caught.';
    else if (chk) h = esc(chk.title) + ' needs a second-planner check by someone who didn\'t do the work.';
    else if (ready) h = esc(ready.title) + ' is ready to assign.';
    toast(h, 4200);
  };
  let rosterT = 0;
  function frame() {
    const running = S.phase === 'sprint' && !S.modal && S.speed > 0;
    if (running) {
      const dh = S.speed / 600; S.hour = Math.min(24, S.hour + dh);
      tickWork(dh);
      if (!S.evBusy) {
        let fn = null;
        if (S.flags.inject2Due && !S.flags.inject2) { S.flags.inject2Due = false; fn = inject2; }
        else { const ev = S.events.find((e) => !e.done && S.hour >= e.at); if (ev) { ev.done = true; fn = ev.fn; } }
        if (fn) { S.evBusy = true; Promise.resolve(fn()).then(() => { S.evBusy = false; renderAll(); }); }
      }
      if (++rosterT % 15 === 0) { renderAll(); }
    }
    MAP.update(S.modal ? 0 : Math.max(S.speed, S.phase === 'sprint' ? 0 : 1));
    MAP.draw(); if (S.phase === 'sprint') hud();
    requestAnimationFrame(frame);
  }
  MAP.init($('#map')); placeAgents(); renderAll(); renderEvidence();
  window.__rw = { S, item, assignTo, select, sendToAI };
  requestAnimationFrame(frame);
  title();
})();
