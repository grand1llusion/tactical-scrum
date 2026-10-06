/* Tactical Scrum: board engine. Vanilla JS, no network. State is saved as one JSON file by the Electron shell
   (window.api), or to localStorage when opened in a plain browser for testing. */
(function () {
  'use strict';

  var TPL = window.TEMPLATES, THEMES = window.THEMES, PROCS = window.PROCESSES, MIS = window.MISSIONS, GLOSS = window.GLOSSARY, OBJ = window.OBJECTIVES;
  var KEY = 'tacticalScrum.v3';
  var ROLE_KEYS = ['po', 'sm', 'd1', 'd2'];
  var DEFAULT_ROLES = {
    po: { name: 'Product Owner', color: '#e39a63' },
    sm: { name: 'Scrum Master', color: '#9db27a' },
    d1: { name: 'Developer (Collector)', color: '#8fb0c8' },
    d2: { name: 'Developer (Analyst)', color: '#e0c060' }
  };
  var GENERIC_MIL = [
    ['Product Goal / Sprint Goal', 'Commander\'s intent, mission statement', 'Strong fit. A goal is one objective at a time.'],
    ['Product Backlog (ordered 1 to N)', 'Specified, implied and essential tasks from mission analysis', 'Fit. Scrum\'s order is visible and changes every Sprint.'],
    ['Sprint Planning', 'COA development through orders production', 'Scrum plans one short window; MDMP plans a whole operation.'],
    ['Definition of Done', 'Task standards and conditions', 'Strong fit.'],
    ['Daily Scrum', 'Battle update / sync', 'Developers own it, not the commander.'],
    ['Sprint Review', 'Rehearsal / decision-point review', 'Partial fit.'],
    ['Retrospective', 'After Action Review', 'Strong fit.'],
    ['Impediment', 'Friction, risk', 'Scrum Master helps clear it.'],
    ['Changing priority mid-Sprint', 'FRAGORD', 'Scrum protects the Sprint Goal; negotiate with the Product Owner.']
  ];
  var TIMERS = [['Plan 15', 15], ['Work 6', 6], ['Daily 3', 3], ['Review 3', 3], ['Retro 10', 10], ['1', 1], ['5', 5]];

  var $ = function (id) { return document.getElementById(id); };
  var S, saveTimer = null, armed = {}, dragId = null;
  var api = window.api || null;

  /* ---------- helpers ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid(p) { return (p || 'n') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function str(v, d, max) { return typeof v === 'string' ? v.slice(0, max || 200) : d; }
  function hex(c, d) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c.toLowerCase() : d; }
  function inkOn(h) {
    var r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) > 0.4 ? '#14130f' : '#ffffff';
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'text') { e.textContent = attrs[k]; }
        else if (k === 'class') { e.className = attrs[k]; }
        else if (k.slice(0, 2) === 'on') { e.addEventListener(k.slice(2), attrs[k]); }
        else if (attrs[k] !== false && attrs[k] != null) { e.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
      }
    }
    (kids || []).forEach(function (c) { if (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); } });
    return e;
  }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function theme() { return byId(THEMES, S.theme) || THEMES[0]; }
  function proc() { return byId(PROCS, S.processId) || PROCS[0]; }
  function mission() { return byId(MIS, S.missionId) || MIS[0]; }
  function tplOf(b) { return TPL.filter(function (t) { return t.id === b.tpl; })[0] || TPL[TPL.length - 1]; }

  /* ---------- state ---------- */
  function makeBoard(tplId) {
    var t = TPL.filter(function (x) { return x.id === tplId; })[0] || TPL[TPL.length - 1];
    return {
      id: uid('b'), tpl: t.id, title: t.name, goal: '', revealed: false, fields: {},
      zones: clone(t.zones),
      notes: t.notes.map(function (n) { return { id: uid(), text: n.t, zone: n.z, role: n.r || '', dots: 0, key: n.k || '' }; })
    };
  }
  function makeMissionBoard(mid) {
    var m = byId(MIS, mid) || MIS[0], b = makeBoard('sprint');
    b.title = 'Mission: ' + m.name; b.goal = m.goal; b.mission = m.id;
    b.notes = m.tasks.map(function (t) { return { id: uid(), text: t, zone: 'bl', role: '', dots: 0, key: '' }; });
    return b;
  }
  function makeProcessBoard(pid) {
    var p = byId(PROCS, pid) || PROCS[0], b = makeBoard('process');
    b.title = 'Process: ' + p.name; b.process = p.id;
    b.zones = p.steps.map(function (st) { return { id: 'st' + st.n, name: st.n + '. ' + st.name, sub: st.out }; });
    return b;
  }
  function defaults() {
    var s = {
      klass: 'Tactical Scrum', op: 'Operation Stealthy Agile', crosswalk: false,
      theme: 'default', processId: 'mdmp', missionId: 'stealthy', covered: {},
      roles: clone(DEFAULT_ROLES), boards: [], active: 0
    };
    ['agreements', 'agenda', 'roles', 'estimate', 'moscow'].forEach(function (id) { s.boards.push(makeBoard(id)); });
    s.boards.push(makeMissionBoard(s.missionId)); s.boards.push(makeProcessBoard(s.processId)); s.boards.push(makeBoard('retro'));
    return s;
  }
  function normalize(raw) {
    var s = defaults();
    if (!raw || typeof raw !== 'object') { return s; }
    s.klass = str(raw.klass, s.klass, 40); s.op = str(raw.op, s.op, 40);
    if (byId(THEMES, raw.theme)) { s.theme = raw.theme; }
    if (byId(PROCS, raw.processId)) { s.processId = raw.processId; }
    if (byId(MIS, raw.missionId)) { s.missionId = raw.missionId; }
    s.covered = {};
    if (raw.covered && typeof raw.covered === 'object') { Object.keys(raw.covered).slice(0, 60).forEach(function (k) { if (raw.covered[k] === true) { s.covered[str(k, '', 8)] = true; } }); }
    s.crosswalk = raw.crosswalk === true;
    ROLE_KEYS.forEach(function (k) {
      var r = raw.roles && raw.roles[k];
      if (r) { s.roles[k].name = str(r.name, s.roles[k].name, 40) || s.roles[k].name; s.roles[k].color = hex(r.color, s.roles[k].color); }
    });
    if (Array.isArray(raw.boards) && raw.boards.length) {
      s.boards = raw.boards.slice(0, 60).map(function (b) {
        var base = makeBoard(b && b.tpl);
        base.id = str(b && b.id, base.id, 30) || base.id;
        base.title = str(b && b.title, base.title, 60) || base.title;
        base.goal = str(b && b.goal, '', 120);
        base.revealed = !!(b && b.revealed);
        base.mission = b && byId(MIS, b.mission) ? b.mission : '';
        base.process = b && byId(PROCS, b.process) ? b.process : '';
        base.fields = {};
        if (b && b.fields && typeof b.fields === 'object') {
          Object.keys(b.fields).slice(0, 20).forEach(function (k) { base.fields[str(k, '', 20)] = str(String(b.fields[k]), '', 120); });
        }
        if (Array.isArray(b && b.zones) && b.zones.length) {
          base.zones = b.zones.slice(0, 12).map(function (z, i) {
            var t0 = base.zones[i] || {};
            var o = clone(t0);
            o.id = str(z.id, o.id || 'z' + i, 20); o.name = str(z.name, o.name || 'Zone', 40); o.sub = str(z.sub, o.sub || '', 80);
            return o;
          });
        }
        if (Array.isArray(b && b.notes)) {
          var zids = base.zones.map(function (z) { return z.id; });
          base.notes = b.notes.slice(0, 200).map(function (n) {
            return {
              id: str(n && n.id, '', 30) || uid(), text: str(n && n.text, 'New note', 120) || 'New note',
              zone: zids.indexOf(n && n.zone) >= 0 ? n.zone : zids[0], role: ROLE_KEYS.indexOf(n && n.role) >= 0 ? n.role : '',
              dots: Math.max(0, Math.min(30, parseInt(n && n.dots, 10) || 0)), key: str(n && n.key, '', 20)
            };
          });
        }
        return base;
      });
    }
    if (!s.boards.some(function (b) { return b.mission; })) { s.boards.push(makeMissionBoard(s.missionId)); }
    if (!s.boards.some(function (b) { return b.process; })) { s.boards.push(makeProcessBoard(s.processId)); }
    s.active = Math.max(0, Math.min(s.boards.length - 1, parseInt(raw.active, 10) || 0));
    return s;
  }
  function board() { return S.boards[S.active]; }

  /* ---------- persistence ---------- */
  function setMsg(t) { var m = $('setMsg'); if (m) { m.textContent = t; } }
  function persist() {
    var text = JSON.stringify(S);
    if (api && api.save) { api.save(text).catch(function () { setMsg('Could not save to disk.'); }); return; }
    try { localStorage.setItem(KEY, text); } catch (e) { /* ignore */ }
  }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); }
  function loadState() {
    if (api && api.load) { return api.load().then(function (t) { return t ? JSON.parse(t) : null; }).catch(function () { return null; }); }
    var t = null; try { t = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    var v = null; try { v = t ? JSON.parse(t) : null; } catch (e) { v = null; }
    return Promise.resolve(v);
  }

  /* ---------- masthead and tabs ---------- */
  function lumOf(h) {
    var v = [1, 3, 5].map(function (i) { var x = parseInt(h.slice(i, i + 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function applyTheme() {
    var c = theme().c, r = document.documentElement.style, dark = lumOf(c.ground) < 0.3;
    var map = { ground: 'ground', panel: 'panel', band: 'band', bandink: 'bandink', ink: 'ink', ink2: 'ink2', line: 'line', btnfg: 'btn-fg', focus: 'focus', zone: 'zone', zonehi: 'zone-hi', paper: 'paper', note: 'n0', accent: 'accent' };
    Object.keys(map).forEach(function (k) { r.setProperty('--' + map[k], c[k]); });
    r.setProperty('--warn', dark ? '#e3a73c' : '#8a5a00'); r.setProperty('--warnfg', dark ? '#14130f' : '#ffffff');
    r.setProperty('--danger', dark ? '#ff9a88' : '#8c2a1f'); r.setProperty('--ok', dark ? '#8fd99b' : '#2f5d2a');
    r.setProperty('--onstatus', dark ? '#10120f' : '#ffffff');
    r.setProperty('--onfocus', lumOf(c.focus) > 0.4 ? '#14130f' : '#ffffff');
    r.setProperty('color-scheme', dark ? 'dark' : 'light');
  }
  function renderMast() {
    applyTheme();
    $('klass').textContent = S.klass;
    $('op').textContent = S.op.toUpperCase();
    document.title = S.klass;
  }
  function showTab(name) {
    $('boardsView').hidden = name !== 'boards'; $('setupView').hidden = name !== 'setup'; $('refsView').hidden = name !== 'refs';
    $('tabBoards').setAttribute('aria-selected', name === 'boards' ? 'true' : 'false');
    $('tabSetup').setAttribute('aria-selected', name === 'setup' ? 'true' : 'false');
    $('tabRefs').setAttribute('aria-selected', name === 'refs' ? 'true' : 'false');
    if (name === 'boards') { renderBoards(); } else if (name === 'setup') { renderSetup(); } else { renderRefs(); }
  }

  /* ---------- roles ---------- */
  function roleOf(key) { return S.roles[key]; }
  function zoneLabel(z) {
    if (z.role === 'po' || z.role === 'sm') { return S.roles[z.role].name; }
    if (z.role === 'dev') { return 'Developers'; }
    return z.name;
  }
  function zoneColor(z) {
    if (z.role === 'po' || z.role === 'sm') { return S.roles[z.role].color; }
    if (z.role === 'dev') { return S.roles.d1.color; }
    return '';
  }

  /* ---------- boards view ---------- */
  function renderBoards() {
    // sidebar
    var ul = $('boardList'); ul.textContent = '';
    S.boards.forEach(function (b, i) {
      var t = tplOf(b);
      var btn = el('button', { type: 'button', 'aria-current': i === S.active ? 'true' : 'false',
        onclick: function () { S.active = i; save(); renderBoards(); } }, [
        el('span', { class: 'st', text: t.step ? String(t.step) : '·' }), el('span', { text: b.title })
      ]);
      ul.appendChild(el('li', null, [btn]));
    });
    var sel = $('newTpl');
    if (!sel.options.length) {
      TPL.filter(function (t) { return !t.hidden; }).forEach(function (t) { sel.appendChild(el('option', { value: t.id, text: (t.step ? t.step + '. ' : '') + t.name })); });
    }
    renderToolbar(); renderCue(); renderGoal(); renderVision(); renderZones(); renderCalc(); renderMil();
  }

  var timer = { left: 0, run: null, label: '' };
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
  function timerWidget() {
    var wrap = el('div', { class: 'timer', id: 'timerBox', role: 'group', 'aria-label': 'Timebox' });
    var out = el('output', { id: 'timerOut', text: fmt(timer.left) });
    var sel = el('select', { 'aria-label': 'Timebox preset' }, TIMERS.map(function (t) { return el('option', { value: String(t[1]), text: t[0] + (t[0].indexOf(' ') < 0 ? ' min' : ' min') }); }));
    var go = el('button', { type: 'button', class: 'btn small', text: timer.run ? 'Pause' : 'Start' });
    var rs = el('button', { type: 'button', class: 'btn small alt', text: 'Reset' });
    function setFromSel() { timer.left = parseInt(sel.value, 10) * 60; out.textContent = fmt(timer.left); wrap.classList.remove('done'); }
    sel.addEventListener('change', function () { stopTimer(); setFromSel(); go.textContent = 'Start'; });
    go.addEventListener('click', function () {
      if (timer.run) { stopTimer(); go.textContent = 'Start'; return; }
      if (timer.left <= 0) { setFromSel(); }
      wrap.classList.remove('done');
      timer.run = setInterval(function () {
        timer.left -= 1; out.textContent = fmt(Math.max(0, timer.left));
        if (timer.left <= 0) { stopTimer(); go.textContent = 'Start'; wrap.classList.add('done'); }
      }, 1000);
      go.textContent = 'Pause';
    });
    rs.addEventListener('click', function () { stopTimer(); setFromSel(); go.textContent = 'Start'; });
    if (!timer.left && !timer.run) { setFromSel(); }
    wrap.appendChild(sel); wrap.appendChild(out); wrap.appendChild(go); wrap.appendChild(rs);
    return wrap;
  }
  function stopTimer() { if (timer.run) { clearInterval(timer.run); timer.run = null; } }

  function twoStep(key, label, fn) {
    var b = el('button', { type: 'button', class: 'btn small danger', text: label });
    b.addEventListener('click', function () {
      if (armed[key]) { armed[key] = false; fn(); return; }
      armed[key] = true; b.classList.add('armed'); b.textContent = 'Click again to confirm';
      setTimeout(function () { if (armed[key]) { armed[key] = false; b.classList.remove('armed'); b.textContent = label; } }, 3500);
    });
    return b;
  }

  function renderToolbar() {
    var b = board(), t = tplOf(b), tb = $('toolbar'); tb.textContent = '';
    if (t.step) { tb.appendChild(el('span', { class: 'step', text: 'STEP ' + t.step })); }
    var title = el('input', { type: 'text', class: 'title', value: b.title, maxlength: '60', 'aria-label': 'Board title' });
    title.addEventListener('input', function () { b.title = title.value; save(); });
    title.addEventListener('change', function () { renderBoards(); });
    tb.appendChild(title);
    if (t.kind !== 'vision') {
      tb.appendChild(el('button', { type: 'button', class: 'btn small', text: '+ Note', onclick: function () { addNote(b.zones[0].id); } }));
    }
    if (t.key) {
      tb.appendChild(el('button', { type: 'button', class: 'btn small' + (b.revealed ? ' on' : ''), text: b.revealed ? 'Hide answer key' : 'Show answer key',
        'aria-pressed': b.revealed ? 'true' : 'false', onclick: function () { b.revealed = !b.revealed; save(); renderBoards(); } }));
    }
    if (t.vote) {
      tb.appendChild(el('button', { type: 'button', class: 'btn small alt', text: 'Sort by dots', onclick: function () {
        b.notes.sort(function (a, c) { return c.dots - a.dots; }); save(); renderZones(); } }));
      tb.appendChild(el('button', { type: 'button', class: 'btn small alt', text: 'Clear dots', onclick: function () {
        b.notes.forEach(function (n) { n.dots = 0; }); save(); renderZones(); } }));
    }
    tb.appendChild(el('button', { type: 'button', class: 'btn small' + (S.crosswalk ? ' on' : ''), text: S.crosswalk ? 'Military crosswalk: ON' : 'Military crosswalk: OFF',
      'aria-pressed': S.crosswalk ? 'true' : 'false', onclick: function () { S.crosswalk = !S.crosswalk; save(); renderBoards(); } }));
    tb.appendChild(timerWidget());
    tb.appendChild(twoStep('reset' + b.id, 'Reset board', function () {
      var f = b.mission ? makeMissionBoard(b.mission) : b.process ? makeProcessBoard(b.process) : makeBoard(b.tpl); b.zones = f.zones; b.notes = f.notes; b.revealed = false; b.fields = {}; b.goal = f.goal; save(); renderBoards();
    }));
    if (S.boards.length > 1) {
      tb.appendChild(twoStep('del' + b.id, 'Delete board', function () {
        S.boards.splice(S.active, 1); S.active = Math.max(0, S.active - 1); save(); renderBoards();
      }));
    }
  }
  function renderCue() {
    var c = $('cue'), t = tplOf(board());
    var b = board(), m = b.mission ? byId(MIS, b.mission) : null, p = b.process ? byId(PROCS, b.process) : null;
    c.hidden = !t.cue && !m; c.textContent = '';
    if (m) {
      c.appendChild(el('div', null, [el('b', { text: 'Mission: ' }), document.createTextNode(m.scenario)]));
      c.appendChild(el('div', null, [el('b', { text: 'Definition of Done: ' }), document.createTextNode(m.dod.join('; ') + '.')]));
      c.appendChild(el('div', { class: 'hint' }, [document.createTextNode('Fictional and unclassified. Edit freely.')]));
    }
    if (p) { c.appendChild(el('div', null, [el('b', { text: p.name + ': ' }), document.createTextNode(p.note)])); }
    if (t.cue) { c.appendChild(el('div', null, [el('b', { text: 'Facilitator cue: ' }), document.createTextNode(t.cue)])); }
  }
  function renderGoal() {
    var g = $('goalRow'), b = board(), t = tplOf(b);
    g.hidden = !t.goal; g.textContent = '';
    if (!t.goal) { return; }
    var inp = el('input', { type: 'text', id: 'goalIn', value: b.goal, maxlength: '120', placeholder: 'One sentence: what is this Sprint for?' });
    inp.addEventListener('input', function () { b.goal = inp.value; save(); });
    g.appendChild(el('label', { for: 'goalIn', text: 'Sprint Goal' })); g.appendChild(inp);
  }

  /* ---------- vision form ---------- */
  var VISION = [
    ['For', 'target customer'], ['who', 'has this need'], ['the', 'product name'], ['is a', 'product category'],
    ['that', 'key benefit'], ['Unlike', 'primary alternative'], ['our product', 'main difference']
  ];
  function renderVision() {
    var host = $('visionHost'), b = board(), t = tplOf(b);
    host.hidden = t.kind !== 'vision'; host.textContent = '';
    if (t.kind !== 'vision') { return; }
    var box = el('div', { class: 'vision' }, [el('h3', { text: 'Elevator pitch' })]);
    var p = el('p', { class: 'sentence' });
    VISION.forEach(function (v, i) {
      p.appendChild(el('span', { class: 'lbl', text: v[0] + ' ' }));
      var inp = el('input', { type: 'text', value: b.fields['v' + i] || '', placeholder: v[1], maxlength: '120', 'aria-label': v[0] + ' ' + v[1], size: String(Math.max(12, v[1].length + 2)) });
      inp.addEventListener('input', function () { b.fields['v' + i] = inp.value; save(); });
      p.appendChild(inp); p.appendChild(document.createTextNode(' '));
    });
    box.appendChild(p);
    box.appendChild(el('p', { class: 'hint', text: 'Give it out loud in 30 seconds. Start the timer.' }));
    host.appendChild(box);
  }

  /* ---------- zones and notes ---------- */
  function renderZones() {
    var b = board(), t = tplOf(b), zs = $('zones'); zs.textContent = '';
    zs.hidden = t.kind === 'vision' && !b.zones.length;
    b.zones.forEach(function (z) {
      var list = el('div', { class: 'zlist', 'data-zone': z.id });
      var notes = b.notes.filter(function (n) { return n.zone === z.id; });
      notes.forEach(function (n) { list.appendChild(buildNote(n, b, t)); });
      var head = el('header', null, [
        el('h3', null, [el('span', { text: zoneLabel(z) }), el('span', { class: 'cnt', text: String(notes.length) })]),
        z.sub ? el('span', { class: 'sub', text: z.sub }) : null
      ]);
      if (zoneColor(z)) { head.style.setProperty('--zc', zoneColor(z)); }
      var zone = el('section', { class: 'zone', 'aria-label': zoneLabel(z) }, [head, list,
        el('button', { type: 'button', class: 'add', text: '+ add note', onclick: function () { addNote(z.id); } })
      ]);
      if (S.crosswalk && z.mil) { head.appendChild(el('span', { class: 'zmil', text: z.mil })); }
      wireZone(zone, list, z.id);
      zs.appendChild(zone);
    });
    zs.style.gridAutoColumns = 'minmax(' + (b.zones.length > 5 ? 170 : 210) + 'px,1fr)';
  }
  function buildNote(n, b, t) {
    var color = n.role && S.roles[n.role] ? S.roles[n.role].color : theme().c.note;
    var note = el('div', { class: 'note', draggable: 'true', 'data-id': n.id, tabindex: '0', role: 'group', 'aria-label': 'Note: ' + n.text });
    note.style.setProperty('--nc', color); note.style.setProperty('--nk', inkOn(color));
    var txt = el('div', { class: 't', text: n.text, title: 'Double-click to edit' });
    txt.addEventListener('dblclick', function () { startEdit(note, txt, n); });
    note.addEventListener('keydown', function (e) {
      if (e.target !== note) { return; }
      if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); startEdit(note, txt, n); }
      if (e.key === 'Delete') { deleteNote(n.id); }
    });
    note.appendChild(txt);
    var bar = el('div', { class: 'bar' });
    var rd = el('button', { type: 'button', class: 'rd', title: 'Cycle role color', 'aria-label': 'Cycle role color' });
    rd.style.setProperty('--rc', color);
    rd.addEventListener('click', function () {
      var order = [''].concat(ROLE_KEYS), i = order.indexOf(n.role || '');
      n.role = order[(i + 1) % order.length]; save(); renderZones();
    });
    bar.appendChild(rd);
    if (t.vote) {
      var d = el('button', { type: 'button', class: 'dots', 'aria-label': n.dots + ' dots. Click to add, shift-click or right-click to remove.', title: 'Click: add a dot. Shift-click or right-click: remove one.' });
      if (n.dots) { for (var i = 0; i < Math.min(n.dots, 8); i++) { d.appendChild(el('span', { class: 'pip' })); } if (n.dots > 8) { d.appendChild(document.createTextNode('+' + (n.dots - 8))); } }
      else { d.textContent = '+ dot'; }
      d.addEventListener('click', function (e) { n.dots = Math.max(0, n.dots + (e.shiftKey ? -1 : 1)); save(); renderZones(); });
      d.addEventListener('contextmenu', function (e) { e.preventDefault(); n.dots = Math.max(0, n.dots - 1); save(); renderZones(); });
      bar.appendChild(d);
    }
    if (t.key && b.revealed && n.key && n.zone !== 'pool') {
      var ok = n.zone === n.key;
      bar.appendChild(el('span', { class: 'badge ' + (ok ? 'ok' : 'no'), text: ok ? 'CORRECT' : 'MOVE TO: ' + keyName(b, n.key) }));
    } else if (t.key && b.revealed && n.key && n.zone === 'pool') {
      bar.appendChild(el('span', { class: 'badge', text: 'GOES IN: ' + keyName(b, n.key) }));
    }
    note.appendChild(bar);
    note.appendChild(el('button', { type: 'button', class: 'x', text: '×', 'aria-label': 'Delete note', title: 'Delete', onclick: function () { deleteNote(n.id); } }));
    note.addEventListener('dragstart', function (e) {
      if (txt.isContentEditable) { e.preventDefault(); return; }
      dragId = n.id; note.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', n.id); } catch (x) { /* ignore */ }
    });
    note.addEventListener('dragend', function () { dragId = null; note.classList.remove('drag'); clearOver(); });
    return note;
  }
  function keyName(b, id) { var z = b.zones.filter(function (x) { return x.id === id; })[0]; return z ? zoneLabel(z) : id; }

  function addNote(zoneId) {
    var b = board(), n = { id: uid(), text: 'New note', zone: zoneId, role: '', dots: 0, key: '' };
    b.notes.push(n); save(); renderZones(); renderCalc();
    var node = document.querySelector('.note[data-id="' + n.id + '"]');
    if (node) { startEdit(node, node.querySelector('.t'), n, true); node.scrollIntoView({ block: 'nearest' }); }
  }
  function deleteNote(id) {
    var b = board(); b.notes = b.notes.filter(function (n) { return n.id !== id; }); save(); renderZones(); renderCalc();
  }
  function startEdit(note, txt, n, selectAll) {
    if (txt.isContentEditable) { return; }
    var before = n.text;
    txt.setAttribute('contenteditable', 'plaintext-only'); note.draggable = false; txt.focus();
    var r = document.createRange(); r.selectNodeContents(txt); if (!selectAll) { r.collapse(false); }
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    function finish(cancel) {
      txt.removeEventListener('blur', onBlur); txt.removeEventListener('keydown', onKey);
      txt.removeAttribute('contenteditable'); note.draggable = true;
      var v = (txt.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      if (cancel || !v) { v = before; }
      n.text = v; txt.textContent = v; note.setAttribute('aria-label', 'Note: ' + v); save(); note.focus();
    }
    function onBlur() { finish(false); }
    function onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(false); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(true); }
    }
    txt.addEventListener('blur', onBlur); txt.addEventListener('keydown', onKey);
  }

  /* drag and drop between zones */
  function clearOver() {
    Array.prototype.forEach.call(document.querySelectorAll('.zone.over'), function (z) { z.classList.remove('over'); });
    Array.prototype.forEach.call(document.querySelectorAll('.drop-line'), function (d) { d.remove(); });
  }
  function insertIndex(list, y) {
    var cards = Array.prototype.filter.call(list.children, function (c) { return c.classList.contains('note') && !c.classList.contains('drag'); });
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { return { i: i, ref: cards[i] }; }
    }
    return { i: cards.length, ref: null };
  }
  function wireZone(zone, list, zid) {
    zone.addEventListener('dragover', function (e) {
      if (!dragId) { return; }
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      clearOver(); zone.classList.add('over');
      var pos = insertIndex(list, e.clientY), line = el('div', { class: 'drop-line' });
      if (pos.ref) { list.insertBefore(line, pos.ref); } else { list.appendChild(line); }
    });
    zone.addEventListener('dragleave', function (e) { if (!zone.contains(e.relatedTarget)) { zone.classList.remove('over'); } });
    zone.addEventListener('drop', function (e) {
      if (!dragId) { return; }
      e.preventDefault();
      var pos = insertIndex(list, e.clientY), id = dragId; dragId = null;
      moveNote(id, zid, pos.i);
    });
  }
  function moveNote(id, zid, idx) {
    var b = board(), n = b.notes.filter(function (x) { return x.id === id; })[0];
    if (!n) { return; }
    b.notes = b.notes.filter(function (x) { return x.id !== id; });
    n.zone = zid;
    var inZone = b.notes.filter(function (x) { return x.zone === zid; });
    if (idx >= inZone.length) {
      var last = inZone[inZone.length - 1];
      if (last) { b.notes.splice(b.notes.indexOf(last) + 1, 0, n); } else { b.notes.push(n); }
    } else { b.notes.splice(b.notes.indexOf(inZone[idx]), 0, n); }
    save(); renderZones(); renderCalc();
  }

  /* ---------- calculators ---------- */
  function num(v, d) { var x = parseFloat(v); return isFinite(x) && x >= 0 ? x : d; }
  function renderCalc() {
    var c = $('calc'), b = board(), t = tplOf(b); c.textContent = '';
    c.hidden = !t.calc; if (!t.calc) { return; }
    var pts = 0, items = 0;
    b.zones.forEach(function (z) { if (z.weight) { var k = b.notes.filter(function (n) { return n.zone === z.id; }).length; pts += k * z.weight; items += k; } });
    c.appendChild(el('h3', { text: 'Forecast calculator' }));
    c.appendChild(el('p', { class: 'hint', text: 'Points come from the size columns. The forecast is a conversation starter, not a promise: recalculate each Sprint.' }));
    var grid = el('div', { class: 'grid' });
    var out = el('div', { class: 'result' });
    function field(key, label, def) {
      var inp = el('input', { type: 'number', min: '0', step: 'any', id: 'f_' + key, value: b.fields[key] != null ? b.fields[key] : def });
      inp.addEventListener('input', function () { b.fields[key] = inp.value; save(); calc(); });
      grid.appendChild(el('div', { class: 'field' }, [el('label', { for: 'f_' + key, text: label }), inp]));
    }
    field('vel', 'Velocity (points per Sprint)', '10');
    field('len', 'Sprint length (weeks)', '2');
    field('cost', 'Team cost per Sprint (optional)', '0');
    c.appendChild(grid); c.appendChild(out);
    function calc() {
      var vel = num(b.fields.vel, 10), len = num(b.fields.len, 2), cost = num(b.fields.cost, 0);
      var sprints = vel > 0 ? Math.ceil(pts / vel) : 0;
      out.textContent = '';
      [[pts + '', 'total points (' + items + ' items)'], [sprints + '', 'Sprints'], [(sprints * len) + '', 'weeks'], [cost ? '$' + Math.round(sprints * cost).toLocaleString() : '—', 'estimated cost']].forEach(function (r) {
        out.appendChild(el('div', null, [el('b', { text: r[0] }), el('span', { text: r[1] })]));
      });
    }
    calc();
  }

  /* ---------- crosswalk panel ---------- */
  function renderMil() {
    var m = $('mil'), b = board(), t = tplOf(b); m.textContent = '';
    m.hidden = !S.crosswalk; if (!S.crosswalk) { return; }
    var rows = t.mil && t.mil.rows && t.mil.rows.length ? t.mil.rows : GENERIC_MIL;
    var p = proc();
    m.appendChild(el('span', { class: 'warn', text: 'PROPOSAL: VERIFY AGAINST CURRENT DOCTRINE BEFORE TEACHING' }));
    m.appendChild(el('h3', null, [document.createTextNode('Planning process: ' + p.name), el('span', { class: 'pill', text: p.status === 'sourced' ? 'STEPS CONFIRMED FROM A PUBLIC SUMMARY' : 'STEPS FROM GENERAL KNOWLEDGE: VERIFY' })]));
    m.appendChild(el('p', { class: 'hint', text: p.note }));
    var pt = el('table', null, [el('thead', null, [el('tr', null, ['Step', 'What happens', 'Scrum parallel (proposal)', 'Friction'].map(function (h) { return el('th', { text: h }); }))])]);
    var pb = el('tbody');
    p.steps.forEach(function (st) { pb.appendChild(el('tr', null, [st.n + '. ' + st.name, st.out, st.scrum, st.fric || '\u2014'].map(function (c) { return el('td', { text: c }); }))); });
    pt.appendChild(pb); m.appendChild(pt);
    m.appendChild(el('h4', { text: 'This board' + (t.mil && t.mil.head ? ': ' + t.mil.head : '') }));
    var tb = el('table', null, [el('thead', null, [el('tr', null, ['Scrum', 'MDMP / JPP / unit equivalent', 'Fit and friction'].map(function (h) { return el('th', { text: h }); }))])]);
    var body = el('tbody');
    rows.forEach(function (r) { body.appendChild(el('tr', null, r.map(function (c) { return el('td', { text: c }); }))); });
    tb.appendChild(body); m.appendChild(tb);
    m.appendChild(el('p', { class: 'hint', text: 'Scrum terms follow the 2020 Scrum Guide. Change the planning process in Setup.' }));
  }

  /* ---------- setup tab ---------- */
  function renderSetup() {
    fillSelect('selTheme', THEMES, S.theme, function (t) { return t.name; });
    fillSelect('selProc', PROCS, S.processId, function (t) { return t.name; });
    fillSelect('selMis', MIS, S.missionId, function (t) { return t.service + ': ' + t.name; });
    $('themeNote').textContent = theme().from + ' Loads ' + byId(PROCS, theme().process).name + ' and the "' + byId(MIS, theme().mission).name + '" mission.';
    $('procNote').textContent = proc().note + (proc().status === 'sourced' ? '' : ' Steps from general knowledge: verify.');
    $('misNote').textContent = mission().scenario;
    $('inKlass').value = S.klass; $('inOp').value = S.op;
    var rr = $('roleRows'); rr.textContent = '';
    var labels = { po: 'Product Owner', sm: 'Scrum Master', d1: 'Developer 1', d2: 'Developer 2' };
    ROLE_KEYS.forEach(function (k) {
      var col = el('input', { type: 'color', value: S.roles[k].color, 'aria-label': labels[k] + ' color' });
      var nm = el('input', { type: 'text', value: S.roles[k].name, maxlength: '40', 'aria-label': labels[k] + ' name' });
      col.addEventListener('input', function () { S.roles[k].color = hex(col.value, S.roles[k].color); save(); });
      nm.addEventListener('input', function () { S.roles[k].name = nm.value || DEFAULT_ROLES[k].name; save(); });
      rr.appendChild(el('div', { class: 'rolerow' }, [col, nm, el('small', { text: 'Slot: ' + labels[k] })]));
    });
    $('dataNote').textContent = api && api.where ? 'Saved automatically to your user data folder as tactical-scrum.json.' : 'Browser test mode: saved in this browser only.';
  }

  function fillSelect(id, list, cur, label) {
    var sel = $(id); sel.textContent = '';
    list.forEach(function (x) { var o = el('option', { value: x.id, text: label(x) }); if (x.id === cur) { o.selected = true; } sel.appendChild(o); });
  }
  function replaceBoard(flag, nb) {
    var i = -1;
    S.boards.forEach(function (b, k) { if (b[flag] && i < 0) { i = k; } });
    if (i >= 0) { S.boards[i] = nb; } else { S.boards.push(nb); }
  }
  function rebuildMission() { replaceBoard('mission', makeMissionBoard(S.missionId)); }
  function rebuildProcess() { replaceBoard('process', makeProcessBoard(S.processId)); }
  function changeTheme(id) {
    var th = byId(THEMES, id); if (!th) { return; }
    var prev = mission(); S.theme = id; S.processId = th.process; S.missionId = th.mission;
    if (S.op.toUpperCase() === prev.op.toUpperCase()) { S.op = mission().op; }
    rebuildMission(); rebuildProcess(); save(); renderMast(); renderSetup();
    setMsg('Theme loaded: ' + th.name + '. The mission and process boards were rebuilt.');
  }
  function changeProcess(id) {
    S.processId = id; rebuildProcess(); save(); renderSetup(); setMsg('Planning process changed. The process board was rebuilt.');
  }
  function changeMission(id) {
    var prev = mission(); S.missionId = id;
    if (S.op.toUpperCase() === prev.op.toUpperCase()) { S.op = mission().op; }
    rebuildMission(); save(); renderMast(); renderSetup(); setMsg('Mission changed. The mission board was rebuilt.');
  }

  /* ---------- references ---------- */
  function openTemplate(id) {
    var i = -1; S.boards.forEach(function (b, k) { if (b.tpl === id && i < 0) { i = k; } });
    if (i < 0) { S.boards.push(makeBoard(id)); i = S.boards.length - 1; save(); }
    S.active = i; save(); showTab('boards');
  }
  function goButtons(ids) {
    return (ids || []).map(function (id) {
      var t = byId(TPL, id); if (!t) { return null; }
      return el('button', { type: 'button', class: 'go', text: 'Open: ' + t.name, onclick: function () { openTemplate(id); } });
    });
  }
  function renderGlossary() {
    var q = ($('gSearch').value || '').toLowerCase().trim(), host = $('gList'); host.textContent = '';
    GLOSS.filter(function (g) { return !q || g.term.toLowerCase().indexOf(q) >= 0 || g.def.toLowerCase().indexOf(q) >= 0; }).forEach(function (g) {
      host.appendChild(el('details', null, [el('summary', { text: g.term }), el('p', { text: g.def }), el('div', null, goButtons(g.b))]));
    });
    if (!host.firstChild) { host.appendChild(el('p', { class: 'hint', text: 'No terms match.' })); }
  }
  function renderObjectives() {
    var host = $('objList'); host.textContent = ''; var total = 0, done = 0, lastG = '';
    OBJ.forEach(function (grp) {
      if (grp.g !== lastG) { host.appendChild(el('div', { class: 'objg', text: grp.g })); lastG = grp.g; }
      host.appendChild(el('div', { class: 'objh', text: grp.h }));
      grp.items.forEach(function (it) {
        total++; if (S.covered[it[0]]) { done++; }
        var cb = el('input', { type: 'checkbox', id: 'ob' + it[0] });
        cb.checked = !!S.covered[it[0]];
        cb.addEventListener('change', function () { if (cb.checked) { S.covered[it[0]] = true; } else { delete S.covered[it[0]]; } save(); renderObjectives(); });
        host.appendChild(el('div', { class: 'objrow' }, [
          el('label', { for: 'ob' + it[0] }, [cb, el('span', { class: 'no', text: it[0] }), el('span', { text: it[1] })])
        ].concat(goButtons(it[2]))));
      });
    });
    $('objProg').textContent = done + ' of ' + total + ' objectives covered.';
  }
  function renderRefs() { renderGlossary(); renderObjectives(); }

  /* ---------- wiring ---------- */
  function wire() {
    $('tabBoards').addEventListener('click', function () { showTab('boards'); });
    $('tabSetup').addEventListener('click', function () { showTab('setup'); });
    $('tabRefs').addEventListener('click', function () { showTab('refs'); });
    $('selTheme').addEventListener('change', function () { changeTheme($('selTheme').value); });
    $('selProc').addEventListener('change', function () { changeProcess($('selProc').value); });
    $('selMis').addEventListener('change', function () { changeMission($('selMis').value); });
    $('gSearch').addEventListener('input', renderGlossary);
    $('addBoard').addEventListener('click', function () {
      var b = makeBoard($('newTpl').value); S.boards.push(b); S.active = S.boards.length - 1; save(); renderBoards();
    });
    $('inKlass').addEventListener('input', function () { S.klass = $('inKlass').value || 'Tactical Scrum'; save(); renderMast(); });
    $('inOp').addEventListener('input', function () { S.op = $('inOp').value; save(); renderMast(); });
    $('btnExport').addEventListener('click', function () {
      var text = JSON.stringify(S, null, 2);
      if (api && api.exportJson) { api.exportJson(text).then(function (p) { setMsg(p ? 'Exported to ' + p : 'Export cancelled.'); }); return; }
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = 'tactical-scrum.json'; a.click(); setMsg('Download started.');
    });
    $('btnImport').addEventListener('click', function () {
      if (api && api.importJson) {
        api.importJson().then(function (t) {
          if (!t) { setMsg('Import cancelled.'); return; }
          try { S = normalize(JSON.parse(t)); save(); renderMast(); showTab('setup'); setMsg('Imported.'); } catch (e) { setMsg('That file is not valid Tactical Scrum JSON.'); }
        });
        return;
      }
      setMsg('Import works in the desktop app.');
    });
    var rb = $('btnReset');
    rb.addEventListener('click', function () {
      if (armed.all) { armed.all = false; rb.classList.remove('armed'); rb.textContent = 'Reset everything'; S = defaults(); save(); renderMast(); showTab('setup'); setMsg('Reset to defaults.'); return; }
      armed.all = true; rb.classList.add('armed'); rb.textContent = 'Click again to erase all boards';
      setTimeout(function () { armed.all = false; rb.classList.remove('armed'); rb.textContent = 'Reset everything'; }, 3500);
    });
    window.addEventListener('pagehide', function () { if (saveTimer) { clearTimeout(saveTimer); persist(); } });
    document.addEventListener('dragover', function (e) { if (dragId) { e.preventDefault(); } });
    document.addEventListener('drop', function (e) { if (dragId) { e.preventDefault(); } });
  }

  loadState().then(function (raw) {
    S = normalize(raw); wire(); renderMast(); showTab('boards');
    window.__TS = { state: function () { return S; } };
  });
})();
