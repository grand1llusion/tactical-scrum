/* game.js: Backlog Quest engine (overworld, dialogue, quiz battles, save). Async/await drives all scripted flow. */
(function () {
  'use strict';
  const G = window.GFX, SND = window.SND, DATA = window.DATA;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = 240, H = 160, TS = 16, SAVE = 'backlogquest.v1';
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const S = { mode: 'title', party: [], items: { ball: 0 }, flags: {}, steps: 0, t: 0 };
  const p = { x: DATA.start.x, y: DATA.start.y, dir: DATA.start.dir, ox: 0, oy: 0, moving: false, tx: 0, ty: 0, walkT: 0 };
  const ui = { text: null, menu: null, quiz: null, waiter: null, fade: 0, flash: 0, busy: false, title: { sel: 0 } };
  let B = null; // battle visuals/state
  const npcs = DATA.npcs.map((n) => Object.assign({}, n));

  /* ---------- input ---------- */
  const held = {}, KEYS = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', z: 'a', Enter: 'a', ' ': 'a', x: 'b', Escape: 'b', Backspace: 'b' };
  let pendingA = false;
  function press(k) {
    SND.init();
    if (ui.waiter) ui.waiter(k); else if (k === 'a') pendingA = true;
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') { SND.toggleMute(); return; }
    const k = KEYS[e.key]; if (!k) return;
    e.preventDefault();
    if (!held[k]) { held[k] = true; press(k); }
  });
  addEventListener('keyup', (e) => { const k = KEYS[e.key]; if (k) held[k] = false; });
  document.querySelectorAll('#pad button').forEach((b) => {
    const k = b.dataset.k;
    const dn = (e) => { e.preventDefault(); if (!held[k]) { held[k] = true; press(k); } };
    const up = (e) => { e.preventDefault(); held[k] = false; };
    b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
  });
  const nextKey = () => new Promise((res) => { ui.waiter = (k) => { ui.waiter = null; res(k); }; });

  /* ---------- timing helpers (frame based) ---------- */
  const tickers = [];
  const wait = (n) => new Promise((res) => tickers.push({ n, res }));
  const anim = (n, fn) => new Promise((res) => tickers.push({ n, res, fn, i: 0, total: n }));

  /* ---------- dialogue / menus / quiz ---------- */
  async function say(str, opts) {
    opts = opts || {};
    const lines = G.wrap(str, 206), pages = [];
    for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
    for (const pg of pages) {
      ui.text = { lines: pg, shown: 0, total: pg.join('').length, timer: 0, auto: opts.auto || 0 };
      for (;;) {
        const k = await nextKey();
        if (k !== 'a' && k !== 'b') continue;
        if (ui.text.shown < ui.text.total && k !== 'auto') { ui.text.shown = ui.text.total; continue; }
        break;
      }
      SND.sfx('blip');
    }
    ui.text = null;
  }
  async function menu(opts, cfg) {
    cfg = cfg || {};
    ui.menu = Object.assign({ opts, sel: cfg.sel || 0, cols: 1 }, cfg);
    for (;;) {
      const k = await nextKey(), m = ui.menu, n = opts.length;
      if (k === 'a') { SND.sfx('select'); break; }
      if (k === 'b' && m.cancel) { m.sel = -1; SND.sfx('back'); break; }
      const c = m.cols; let s = m.sel;
      if (k === 'up') s -= c; else if (k === 'down') s += c; else if (k === 'left' && c > 1) s -= 1; else if (k === 'right' && c > 1) s += 1;
      if (s >= 0 && s < n && s !== m.sel) { m.sel = s; SND.sfx('blip'); }
    }
    const r = ui.menu.sel; ui.menu = null; return r;
  }
  async function quiz(topic) {
    S.recent = S.recent || [];
    let pool = DATA.questions.filter((q) => q.topic === topic && !S.recent.includes(q));
    if (!pool.length) { S.recent = S.recent.filter((q) => q.topic !== topic); pool = DATA.questions.filter((q) => q.topic === topic); }
    const q = pick(pool); S.recent.push(q); if (S.recent.length > 8) S.recent.shift();
    const order = shuffle([0, 1, 2, 3]);
    ui.quiz = { q, opts: order.map((i) => q.opts[i]), correct: order.indexOf(q.a), sel: 0, reveal: false };
    for (;;) {
      const k = await nextKey(), z = ui.quiz;
      if (k === 'a') break;
      if (k === 'up' && z.sel > 0) { z.sel--; SND.sfx('blip'); } else if (k === 'down' && z.sel < 3) { z.sel++; SND.sfx('blip'); }
    }
    const z = ui.quiz; z.reveal = true;
    const ok = z.sel === z.correct; SND.sfx(ok ? 'right' : 'wrong');
    await wait(55);
    const ans = z.opts[z.correct]; ui.quiz = null;
    return { ok, answer: ans };
  }

  /* ---------- party ---------- */
  const spOf = (m) => DATA.species[m.sp];
  const movesOf = (m) => spOf(m).moves || DATA.caughtMoves;
  const maxHp = (sp, lv) => sp.hp + lv * 2;
  const mkMon = (id, lv) => { const sp = DATA.species[id]; const mx = maxHp(sp, lv); return { sp: id, lv, hp: mx, max: mx, xp: 0 }; };
  const need = (m) => m.lv * 12;
  const healAll = () => S.party.forEach((m) => { m.hp = m.max; });
  const alive = () => S.party.find((m) => m.hp > 0);

  /* ---------- save / load ---------- */
  function save() {
    try { localStorage.setItem(SAVE, JSON.stringify({ party: S.party, items: S.items, flags: S.flags, x: p.x, y: p.y, dir: p.dir })); } catch (e) { /* storage may be blocked */ }
  }
  function load() {
    try { const d = JSON.parse(localStorage.getItem(SAVE)); if (!d) return false; S.party = d.party; S.items = d.items; S.flags = d.flags; p.x = d.x; p.y = d.y; p.dir = d.dir; return true; } catch (e) { return false; }
  }
  const hasSave = () => { try { return !!localStorage.getItem(SAVE); } catch (e) { return false; } };

  /* ---------- world ---------- */
  const tileAt = (x, y) => (x < 0 || y < 0 || x >= DATA.map.w || y >= DATA.map.h ? 'T' : DATA.map.rows[y][x]);
  const npcAt = (x, y) => npcs.find((n) => !(n.gone) && n.x === x && n.y === y);
  const DX = [0, 0, -1, 1], DY = [1, -1, 0, 0], DIRN = { down: 0, up: 1, left: 2, right: 3 };
  const blocked = (x, y) => G.SOLID.has(DATA.TILE[tileAt(x, y)]) || !!npcAt(x, y);

  function startGame(fresh) {
    S.mode = 'world';
    if (fresh) { S.party = []; S.items = { ball: 0 }; S.flags = {}; p.x = DATA.start.x; p.y = DATA.start.y; p.dir = DATA.start.dir; }
    npcs.forEach((n) => { n.gone = false; });
    SND.play('town');
    if (fresh) intro();
  }
  async function intro() {
    ui.busy = true;
    await say('Welcome to Backlog Village, home of the Tactical Scrum Academy!');
    await say('Master Kade is waiting on the path north of here. Go and talk to him. (Arrows move, Z/Enter = A, X = B)');
    ui.busy = false;
  }

  async function talk(n) {
    ui.busy = true;
    n.dir = { 0: 1, 1: 0, 2: 3, 3: 2 }[p.dir];
    if (n.id === 'mentor') {
      if (!S.party.length) {
        await say('Ah, a new recruit! I am Master Kade. Out in the tall grass, Impediments lurk. They feed on confusion.');
        await say('You cannot face them alone. Choose a teammate, one who can answer Scrum questions under pressure.');
        const c = await menu(['Sprintling', 'Backlogger', 'Standupper'], { x: 8, y: 8, w: 90, cancel: false });
        const id = ['sprintling', 'backlogger', 'standupper'][c], sp = DATA.species[id];
        await say(sp.name + ': ' + sp.blurb);
        const yes = await menu(['Yes', 'No'], { x: 8, y: 8, w: 50, cancel: true });
        if (yes !== 0) { await say('Take your time. Talk to me again when you are ready.'); ui.busy = false; return; }
        S.party.push(mkMon(id, 5)); S.items.ball = 3; SND.sfx('item');
        await say('You and ' + sp.name + ' are now a Scrum Team! Master Kade also gave you 3 Retro Balls.');
        await say('In battle, every move needs a correct answer to hit at full strength. A wrong answer weakens it. Weaken an Impediment, then throw a Retro Ball to turn it into a teammate!');
        S.flags.starter = true; save();
      } else if (S.flags.boss) {
        await say('You exposed the Micromanager! The Academy is proud. More of the Backlog opens in the next build.');
      } else {
        await say('Remember: Transparency, Inspection, Adaptation. Dana at the pond can heal your team, and Pia has Retro Balls.');
      }
    } else if (n.id === 'po') {
      if (S.items.ball < 5) { S.items.ball = 5; SND.sfx('item'); await say("Hi, I'm Pia, the Product Owner. Every Backlog needs good ordering. Here, I topped up your Retro Balls to 5!"); save(); }
      else await say('Value first! Remember: the Product Goal is the long-term objective for the Product Backlog.');
    } else if (n.id === 'dev') {
      healAll(); SND.sfx('heal');
      await say("I'm Dana, a Developer. Time for a quick Daily Standup! Your whole team feels refreshed.");
      save();
    } else if (n.id === 'boss') {
      if (S.flags.boss) await say('...I was only asking for an update.');
      else { await bossFight(); }
    }
    ui.busy = false;
  }

  async function bossFight() {
    const n = npcs.find((x) => x.id === 'boss');
    await say('Manager Max: Oh good, you are here. Quick sync? Can you send me a status update on the status update?');
    await say('Manager Max: I need to approve every task before your team starts. Let my Micromanager show you how it is done!');
    const won = await battle('micromanager', 7, { boss: true });
    if (won) {
      S.flags.boss = true; n.dir = 0;
      await say('Manager Max: ...Fine. Maybe the team can self-manage. I will trust the process.');
      SND.play('win'); await say('SLICE COMPLETE! You exposed the Micromanager and earned the Academy\'s trust. To be continued: Sprint Planning, new towns and more Impediments.');
      SND.play('town'); save();
    }
  }

  async function onStep() {
    S.steps++;
    if (S.steps % 6 === 0) save();
    if (p.y <= 6 && !S.party.length) {
      ui.busy = true; SND.sfx('bump');
      await say('Wait! It is not safe in the tall grass alone. Come and see Master Kade first.');
      p.y = 7; p.ox = p.oy = 0; p.dir = 0; ui.busy = false; return;
    }
    const boss = npcs.find((n) => n.id === 'boss');
    if (!S.flags.boss && S.party.length && Math.abs(p.x - boss.x) <= 1 && p.y > boss.y && p.y <= boss.y + 4 && p.y >= 2) {
      ui.busy = true; await talk(boss); return;
    }
    if (tileAt(p.x, p.y) === ',' && S.party.length && alive() && Math.random() < 0.13) {
      ui.busy = true;
      await battle(pick(DATA.wildTable), 3 + rnd(3), {});
      ui.busy = false;
    }
  }

  function updateWorld() {
    if (p.moving) {
      p.walkT++;
      p.ox += DX[p.dir] * 2; p.oy += DY[p.dir] * 2;
      if (Math.abs(p.ox) >= TS || Math.abs(p.oy) >= TS) { p.x = p.tx; p.y = p.ty; p.ox = p.oy = 0; p.moving = false; onStep(); }
      return;
    }
    p.walkT = 0;
    if (ui.busy) { pendingA = false; return; }
    if (pendingA) {
      pendingA = false;
      const fx = p.x + DX[p.dir], fy = p.y + DY[p.dir], n = npcAt(fx, fy);
      if (n) { talk(n); return; }
      const key = fx + ',' + fy;
      if (DATA.signs[key]) { ui.busy = true; say(DATA.signs[key].join(' ')).then(() => { ui.busy = false; }); return; }
      if (DATA.doors[key]) { ui.busy = true; say(DATA.doors[key][0]).then(() => { ui.busy = false; }); return; }
    }
    for (const k of ['up', 'down', 'left', 'right']) {
      if (!held[k]) continue;
      const d = DIRN[k]; p.dir = d;
      const nx = p.x + DX[d], ny = p.y + DY[d];
      if (blocked(nx, ny)) { if (!p.bumped) { SND.sfx('bump'); p.bumped = true; } return; }
      p.bumped = false; p.tx = nx; p.ty = ny; p.moving = true; return;
    }
    p.bumped = false;
  }

  /* ---------- battle ---------- */
  async function battle(enemyId, elv, cfg) {
    const prevMode = S.mode;
    SND.play(cfg.boss ? 'boss' : 'battle'); SND.sfx('encounter');
    for (let i = 0; i < 3; i++) { ui.flash = 1; await wait(5); ui.flash = 0; await wait(5); }
    const esp = DATA.species[enemyId], emax = maxHp(esp, elv);
    B = { en: { sp: enemyId, lv: elv, hp: emax, max: emax }, ally: alive(), enX: 0, enY: 0, enHide: false, alHide: false, enShow: 0, alShow: 0, ball: null, hpEn: emax, hpAl: 0, enBlink: false, alBlink: false, boss: !!cfg.boss, won: false };
    B.hpAl = B.ally.hp; S.mode = 'battle';
    ui.flash = 0;
    await anim(30, (t) => { B.enShow = t; B.alShow = t; });
    await say(cfg.boss ? 'Micromanager wants to hover over your Sprint!' : 'A wild ' + esp.name + ' appeared!', { auto: 40 });
    await say('Go, ' + spOf(B.ally).name + '!', { auto: 25 });
    let done = false;
    while (!done) {
      const act = await menu(['FIGHT', 'BAG', 'PARTY', 'RUN'], { battle: true, cols: 2, x: 132, y: 112, w: 104, h: 48, prompt: 'What will ' + spOf(B.ally).name + ' do?' });
      let used = false;
      if (act === 0) used = await fightMenu();
      else if (act === 1) { const r = await bagMenu(); used = r.used; if (r.caught) { done = true; B.won = true; break; } }
      else if (act === 2) used = await partyMenu(false);
      else if (act === 3) {
        if (cfg.boss) { await say("There's no running from a micromanager!", { auto: 40 }); used = true; }
        else if (Math.random() < 0.75) { SND.sfx('back'); await say('Got away safely!', { auto: 30 }); done = true; break; }
        else { await say("Couldn't get away!", { auto: 30 }); used = true; }
      }
      if (!used) continue;
      if (B.en.hp <= 0) { await winBattle(); done = true; B.won = true; break; }
      await enemyTurn();
      if (B.ally.hp <= 0) {
        await faintAlly();
        const nxt = alive();
        if (!nxt) { await whiteout(); done = true; break; }
        await say('Choose the next teammate!', { auto: 25 });
        await partyMenu(true);
      }
    }
    const won = B.won; B = null;
    await anim(20, (t) => { ui.fade = t; });
    S.mode = prevMode; SND.play('town');
    await anim(20, (t) => { ui.fade = 1 - t; }); ui.fade = 0;
    save();
    return won;
  }

  async function fightMenu() {
    const mv = movesOf(B.ally);
    const c = await menu(mv.map((m) => m[0]), { battle: true, cols: 2, x: 4, y: 112, w: 150, h: 48, cancel: true, moves: mv });
    if (c < 0) return false;
    const [name, topic, power] = mv[c];
    await say(spOf(B.ally).name + ' uses ' + name + '! Answer to land it!', { auto: 25 });
    const r = await quiz(topic);
    let mult = 1, crit = false;
    if (r.ok) { crit = Math.random() < 0.125; if (crit) mult = 1.5; }
    else { mult = 0.35; }
    if (r.ok) await say(crit ? 'Correct! A critical hit of understanding!' : 'Correct!', { auto: 20 });
    else await say('Not quite. The answer was: ' + r.answer, { auto: 80 });
    const dmg = Math.max(1, Math.round((power * 0.32 + B.ally.lv * 0.9) * mult * (0.9 + Math.random() * 0.2)));
    await attackAnim(true, crit);
    await hurt(B.en, dmg, false);
    return true;
  }

  async function attackAnim(fromAlly, crit) {
    SND.sfx(crit ? 'crit' : 'hit');
    // lunge
    await anim(8, (t) => { if (fromAlly) { B.alLunge = Math.sin(t * Math.PI) * 14; } else { B.enLunge = -Math.sin(t * Math.PI) * 14; } });
    B.alLunge = 0; B.enLunge = 0;
    for (let i = 0; i < 4; i++) { if (fromAlly) B.enBlink = !B.enBlink; else B.alBlink = !B.alBlink; await wait(4); }
    B.enBlink = false; B.alBlink = false;
  }

  async function hurt(target, dmg, isAlly) {
    const from = target.hp; target.hp = Math.max(0, target.hp - dmg);
    const key = isAlly ? 'hpAl' : 'hpEn';
    await anim(24, (t) => { B[key] = from + (target.hp - from) * t; });
    B[key] = target.hp;
  }

  async function enemyTurn() {
    const sp = DATA.species[B.en.sp], [name, lo, hi] = pick(sp.atk);
    await say((B.boss ? 'Micromanager' : 'Wild ' + sp.name) + ' uses ' + name + '!', { auto: 28 });
    await attackAnim(false, false);
    const dmg = lo + rnd(hi - lo + 1) + Math.floor(B.en.lv / 3);
    await hurt(B.ally, dmg, true);
  }

  async function faintAlly() {
    SND.sfx('faint');
    await anim(24, (t) => { B.alSink = t; });
    B.alHide = true; B.alSink = 0;
    await say(spOf(B.ally).name + ' is out of energy!', { auto: 35 });
  }

  async function whiteout() {
    await say('Your whole team is out of energy... You head back to the Dojo to rest.', { auto: 60 });
    healAll(); p.x = DATA.start.x; p.y = DATA.start.y; p.dir = 1; p.ox = p.oy = 0;
  }

  async function winBattle() {
    SND.sfx('faint');
    await anim(24, (t) => { B.enSink = t; });
    B.enHide = true;
    SND.play('win');
    await say(B.boss ? 'You exposed the Micromanager!' : 'The wild ' + DATA.species[B.en.sp].name + ' was resolved!', { auto: 50 });
    const gain = B.boss ? 90 : 14 + B.en.lv * 3, m = B.ally;
    await say(spOf(m).name + ' gained ' + gain + ' XP.', { auto: 40 });
    m.xp += gain;
    while (m.xp >= need(m)) {
      m.xp -= need(m); m.lv++; const nm = maxHp(spOf(m), m.lv), d = nm - m.max; m.max = nm; m.hp = Math.min(m.max, m.hp + d + 6); B.hpAl = m.hp;
      SND.sfx('levelup'); await say(spOf(m).name + ' grew to Lv. ' + m.lv + '!', { auto: 55 });
    }
    S.party.forEach((x) => { if (x !== m && x.hp > 0) x.xp += Math.floor(gain / 3); });
  }

  async function bagMenu() {
    const c = await menu(['Retro Ball x' + S.items.ball, 'Back'], { x: 124, y: 70, w: 112, cancel: true });
    if (c !== 0) return { used: false };
    if (S.items.ball <= 0) { await say('You are out of Retro Balls!', { auto: 40 }); return { used: false }; }
    if (B.boss) { await say("You can't Retro a micromanager. He's not an impediment, he's a person!", { auto: 70 }); return { used: false }; }
    if (S.party.length >= 6) { await say('Your team is full.', { auto: 40 }); return { used: false }; }
    S.items.ball--;
    await say('You threw a Retro Ball!', { auto: 20 });
    SND.sfx('throw');
    B.ball = { x: 30, y: 90, show: true, open: false };
    await anim(30, (t) => { B.ball.x = 30 + 150 * t; B.ball.y = 90 - Math.sin(t * Math.PI) * 50 - t * 40; });
    B.enHide = true; B.ball.y = 76; B.ball.x = 184;
    const frac = B.en.hp / B.en.max, chance = 0.22 + (1 - frac) * 0.65;
    let shakes = 0;
    for (let i = 0; i < 3; i++) {
      await wait(18); SND.sfx('shake'); await anim(10, (t) => { B.ball.tilt = Math.sin(t * Math.PI * 2) * 0.5; }); B.ball.tilt = 0;
      if (Math.random() < Math.min(0.95, 0.35 + chance)) shakes++; else break;
    }
    if (shakes === 3 || Math.random() < chance * 0.5) {
      SND.sfx('caught'); B.ball.done = true;
      const sp = DATA.species[B.en.sp];
      await say('Gotcha! ' + sp.name + ' joined your team!', { auto: 70 });
      const m = { sp: B.en.sp, lv: B.en.lv, hp: Math.max(1, B.en.hp), max: B.en.max, xp: 0 }; S.party.push(m);
      return { used: true, caught: true };
    }
    B.ball = null; B.enHide = false;
    await say('Oh no! It broke free!', { auto: 40 });
    return { used: true };
  }

  async function partyMenu(forced) {
    for (;;) {
      const labels = S.party.map((m) => spOf(m).name + '  Lv' + m.lv + '  HP ' + m.hp + '/' + m.max);
      const c = await menu(labels, { x: 6, y: 8, w: 168, cancel: !forced });
      if (c < 0) return false;
      const m = S.party[c];
      if (m.hp <= 0) { await say(spOf(m).name + ' has no energy left!', { auto: 40 }); continue; }
      if (m === B.ally) { await say(spOf(m).name + ' is already in battle.', { auto: 40 }); continue; }
      B.ally = m; B.hpAl = m.hp; B.alHide = false;
      await say('Go, ' + spOf(m).name + '!', { auto: 28 });
      return true;
    }
  }

  /* ---------- drawing ---------- */
  function drawWorld() {
    const camX = Math.max(0, Math.min(DATA.map.w * TS - W, p.x * TS + p.ox - (W / 2 - 8))), camY = Math.max(0, Math.min(DATA.map.h * TS - H, p.y * TS + p.oy - (H / 2 - 8)));
    const water = Math.floor(S.t / 30) % 2;
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    for (let j = y0; j <= y0 + 10; j++) for (let i = x0; i <= x0 + 15; i++) {
      let id = DATA.TILE[tileAt(i, j)]; if (id === 4 && water) id = 14;
      ctx.drawImage(G.tiles[id], i * TS - camX, j * TS - camY);
    }
    const draws = npcs.filter((n) => !n.gone).map((n) => ({ y: n.y * TS, img: G.person(G.looks[n.look], n.dir, 0), x: n.x * TS, yy: n.y * TS }));
    const fr = p.moving ? 1 + (Math.floor(p.walkT / 4) % 2) : 0;
    draws.push({ y: p.y * TS + p.oy, img: G.person(G.looks.player, p.dir, fr), x: p.x * TS + p.ox, yy: p.y * TS + p.oy });
    draws.sort((a, b) => a.y - b.y).forEach((d) => ctx.drawImage(d.img, Math.round(d.x - camX), Math.round(d.yy - camY - 2)));
    // grass overlay so feet are hidden in tall grass
    if (tileAt(p.x, p.y) === ',' && !p.moving) ctx.drawImage(G.tiles[1], 0, 8, 16, 8, Math.round(p.x * TS - camX), Math.round(p.y * TS - camY + 8), 16, 8);
  }

  function drawMon(sp, back, x, y, alpha, sink, lunge, blink) {
    if (blink) return;
    const img = G.monster(sp, back), h = 64 - Math.round(64 * sink);
    ctx.globalAlpha = alpha * (1 - sink * 0.5);
    ctx.drawImage(img, 0, 0, 32, Math.max(1, Math.round(32 * (1 - sink))), Math.round(x + lunge), Math.round(y + (64 - h)), 64, Math.max(1, h));
    ctx.globalAlpha = 1;
  }

  function drawInfo(x, y, name, lv, hp, max, withNum, xpFrac) {
    G.box(ctx, x, y, 104, withNum ? 34 : 26, true);
    G.text(ctx, name, x + 6, y + 4, '#f3ead0'); G.text(ctx, 'Lv' + lv, x + 98 - G.measure('Lv' + lv), y + 4, '#f3ead0');
    G.text(ctx, 'HP', x + 6, y + 14, '#f0c030'); G.bar(ctx, x + 22, y + 17, 72, Math.max(0, hp / max));
    if (withNum) { G.text(ctx, Math.max(0, Math.ceil(hp)) + '/' + max, x + 56, y + 21, '#f3ead0'); R('#1a1610', x + 6, y + 30, 92, 2); R('#4aa3ff', x + 6, y + 30, Math.round(92 * Math.min(1, xpFrac)), 2); }
  }

  function drawBattle() {
    const g = ctx.createLinearGradient(0, 0, 0, 112); g.addColorStop(0, '#9fd4ff'); g.addColorStop(0.6, '#d8f0ff'); g.addColorStop(0.6, '#7ec86a'); g.addColorStop(1, '#4e9a3c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 112);
    for (let i = 0; i < 30; i++) R('#6cb85a', (i * 53) % 240, 70 + ((i * 29) % 42), 3, 1);
    ctx.fillStyle = 'rgba(40,80,30,.55)'; ctx.beginPath(); ctx.ellipse(184, 76, 38, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(60, 108, 46, 10, 0, 0, 7); ctx.fill();
    const bob = Math.round(Math.sin(S.t / 20) * 1.5);
    const e = B.en, esp = DATA.species[e.sp];
    if (!B.enHide) drawMon(esp, false, 152 + (B.enLunge || 0), 16 + bob, B.enShow, B.enSink || 0, 0, B.enBlink);
    if (!B.alHide) drawMon(spOf(B.ally), true, 28, 44 - bob, B.alShow, B.alSink || 0, B.alLunge || 0, B.alBlink);
    if (B.ball && !B.ball.done) { const bl = B.ball; R('#1a1610', bl.x - 5, bl.y - 5, 10, 10); R('#e8433a', bl.x - 4, bl.y - 4, 8, 4); R('#f3ead0', bl.x - 4, bl.y, 8, 4); R('#1a1610', bl.x - 4, bl.y - 1, 8, 1); R('#fff', bl.x - 1, bl.y - 1, 2, 3); }
    if (B.ball && B.ball.done) { const bl = B.ball; R('#1a1610', bl.x - 5, bl.y - 5, 10, 10); R('#ffd84a', bl.x - 4, bl.y - 4, 8, 8); }
    drawInfo(8, 8, esp.name, e.lv, B.hpEn, e.max, false);
    const a = B.ally; drawInfo(128, 76, spOf(a).name, a.lv, B.hpAl, a.max, true, a.xp / need(a));
  }

  function drawCursor(x, y) { R('#1a1610', x, y, 1, 7); R('#1a1610', x + 1, y + 1, 1, 5); R('#1a1610', x + 2, y + 2, 1, 3); R('#1a1610', x + 3, y + 3, 1, 1); }

  function drawUI() {
    const t = ui.text;
    if (S.mode === 'battle' && !ui.quiz) {
      if (!ui.menu || !ui.menu.battle) { G.box(ctx, 4, 112, 232, 44); }
      else {
        G.box(ctx, 4, 112, 232, 44);
      }
    }
    if (t) {
      G.box(ctx, 4, 112, 232, 44);
      let n = t.shown;
      t.lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, n)); n -= ln.length; if (s) G.text(ctx, s, 14, 120 + i * 12); });
      if (t.shown >= t.total && Math.floor(S.t / 20) % 2) { R('#1a1610', 222, 146, 5, 1); R('#1a1610', 223, 147, 3, 1); R('#1a1610', 224, 148, 1, 1); }
    }
    const m = ui.menu;
    if (m && m.battle) {
      G.box(ctx, 4, 112, 232, 44);
      if (m.prompt) { G.wrap(m.prompt, 112).forEach((ln, i) => G.text(ctx, ln, 14, 122 + i * 12)); }
      if (m.moves) {
        // moves menu: left side shows detail of selected
        const mv = m.moves[m.sel];
        G.text(ctx, mv[1].toUpperCase(), 168, 122, '#8a7448'); G.text(ctx, 'Power ' + mv[2], 168, 134, '#6b5a3a'); G.text(ctx, 'Quiz move', 168, 146, '#6b5a3a');
        m.opts.forEach((o, i) => { const cx = 18 + (i % 2) * 70, cy = 120 + Math.floor(i / 2) * 16; if (i === m.sel) drawCursor(cx - 8, cy + 1); G.text(ctx, o, cx, cy); });
      } else {
        G.box(ctx, 132, 112, 104, 44);
        m.opts.forEach((o, i) => { const cx = 150 + (i % 2) * 44, cy = 122 + Math.floor(i / 2) * 16; if (i === m.sel) drawCursor(cx - 10, cy + 1); G.text(ctx, o, cx, cy); });
      }
    } else if (m) {
      const h = m.opts.length * 12 + 10, w = m.w || 100;
      G.box(ctx, m.x, m.y, w, h);
      m.opts.forEach((o, i) => { if (i === m.sel) drawCursor(m.x + 8, m.y + 6 + i * 12 + 1); G.text(ctx, o, m.x + 18, m.y + 5 + i * 12); });
    }
    const q = ui.quiz;
    if (q) {
      G.box(ctx, 4, 40, 232, 118);
      G.text(ctx, 'SCRUM CHECK: ' + q.q.topic.toUpperCase(), 14, 46, '#8a7448');
      G.wrap(q.q.q, 212).slice(0, 3).forEach((ln, i) => G.text(ctx, ln, 14, 58 + i * 11));
      q.opts.forEach((o, i) => {
        const y = 94 + i * 15;
        if (q.reveal) { if (i === q.correct) R('#b8ecb0', 10, y - 2, 220, 13); else if (i === q.sel) R('#f0b0a8', 10, y - 2, 220, 13); }
        else if (i === q.sel) R('#e8dca8', 10, y - 2, 220, 13);
        if (i === q.sel) drawCursor(13, y + 1);
        G.text(ctx, o, 24, y);
      });
    }
  }

  function bigText(str, x, y, sc, color) {
    const w = G.measure(str) + 2, c = document.createElement('canvas'); c.width = w; c.height = 9;
    G.text(c.getContext('2d'), str, 1, 0, color);
    ctx.drawImage(c, 0, 0, w, 9, Math.round(x - (w * sc) / 2), y, w * sc, 9 * sc);
  }

  function drawTitle() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1f3a'); g.addColorStop(0.55, '#c8845a'); g.addColorStop(0.56, '#3a2a1a'); g.addColorStop(1, '#1a1208');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) R('#fff3c0', (i * 61) % 240, (i * 17) % 70, 1, 1);
    for (let i = 0; i < 8; i++) R('#3a2a1a', i * 34 - (S.t / 4) % 34, 84 - (i % 3) * 6, 34, 40);
    ['sprintling', 'backlogger', 'standupper'].forEach((id, i) => { const bob = Math.round(Math.sin(S.t / 14 + i * 2) * 3); ctx.drawImage(G.monster(DATA.species[id], false), 40 + i * 64, 104 + bob - 6, 48, 48); });
    bigText('TACTICAL SCRUM', 120, 16, 3, '#ffe9a8'); bigText('BACKLOG QUEST', 120, 52, 2, '#f08a3a');
    const opts = hasSave() ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
    G.box(ctx, 84, 76, 72, opts.length * 12 + 10, true);
    opts.forEach((o, i) => { if (ui.title.sel === i) drawCursor(92, 84 + i * 12); G.text(ctx, o, 102, 82 + i * 12, '#f3ead0'); });
  }

  async function titleLoop() {
    for (;;) {
      const opts = hasSave() ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
      const k = await nextKey();
      if (k === 'up' && ui.title.sel > 0) ui.title.sel--; else if (k === 'down' && ui.title.sel < opts.length - 1) ui.title.sel++;
      else if (k === 'a') {
        SND.sfx('select');
        const fresh = opts[ui.title.sel] === 'NEW GAME';
        if (!fresh) load();
        await anim(20, (t) => { ui.fade = t; });
        startGame(fresh);
        await anim(20, (t) => { ui.fade = 1 - t; }); ui.fade = 0;
        return;
      }
    }
  }

  /* ---------- main loop ---------- */
  function update() {
    S.t++;
    for (let i = tickers.length - 1; i >= 0; i--) {
      const k = tickers[i];
      if (k.fn) { k.i++; k.fn(Math.min(1, k.i / k.total)); if (k.i >= k.total) { tickers.splice(i, 1); k.res(); } }
      else if (--k.n <= 0) { tickers.splice(i, 1); k.res(); }
    }
    const t = ui.text;
    if (t) {
      if (t.shown < t.total) t.shown = Math.min(t.total, t.shown + (S.t % 2 ? 1 : 2));
      else if (t.auto && ++t.timer > t.auto && ui.waiter) ui.waiter('auto');
    }
    if (S.mode === 'world') updateWorld();
  }
  function draw() {
    if (S.mode === 'title') drawTitle(); else if (S.mode === 'battle' && B) drawBattle(); else drawWorld();
    drawUI();
    if (ui.flash) R('#fff', 0, 0, W, H);
    if (ui.fade > 0) { ctx.globalAlpha = ui.fade; R('#000', 0, 0, W, H); ctx.globalAlpha = 1; }
  }
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
    draw(); requestAnimationFrame(frame);
  }
  titleLoop(); requestAnimationFrame(frame);
  window.__bq = { S, p, ui, say, battle, startGame, save, get B() { return B; }, DATA, npcs };
})();
