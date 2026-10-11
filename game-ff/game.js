/* game.js: Backlog Quest FF. Mission select, story scenes and a side-view party battle with an active-time gauge (wait mode). */
(function () {
  'use strict';
  const G = window.GFX, SND = window.SND, DATA = window.DATA, FF = window.FF;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = 240, H = 160, SAVE = 'backlogquest.ff.v1';
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const S = { mode: 'title', costume: 'civilian', done: {}, t: 0, party: [], xp: 0, plv: 5, coffee: 3, speaker: null, recent: [] };
  const ui = { text: null, menu: null, quiz: null, target: null, waiter: null, fade: 0, flash: 0, title: { sel: 0 } };
  let B = null;
  const floaters = [];

  /* ---------- save ---------- */
  function persist() { try { localStorage.setItem(SAVE, JSON.stringify({ costume: S.costume, done: S.done })); } catch (e) { /* storage may be blocked */ } }
  (function restore() { try { const d = JSON.parse(localStorage.getItem(SAVE)); if (d) { S.costume = d.costume || 'civilian'; S.done = d.done || {}; } } catch (e) { /* ignore */ } })();

  /* ---------- input ---------- */
  const held = {}, KEYS = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', z: 'a', Enter: 'a', ' ': 'a', x: 'b', Escape: 'b', Backspace: 'b' };
  function press(k) { SND.init(); if (ui.waiter) ui.waiter(k); }
  addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') { SND.toggleMute(); return; }
    const k = KEYS[e.key]; if (!k) return; e.preventDefault();
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
    ui.menu = Object.assign({ opts, sel: 0, cols: 1 }, cfg || {});
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
  /* pick one of `list` (enemies or heroes) with up/down; returns the item or null on cancel */
  async function pickTarget(list) {
    ui.target = { list, i: 0 };
    for (;;) {
      const k = await nextKey(), t = ui.target;
      if (k === 'a') { SND.sfx('select'); break; }
      if (k === 'b') { t.i = -1; SND.sfx('back'); break; }
      if (k === 'up' || k === 'left') { t.i = (t.i + list.length - 1) % list.length; SND.sfx('blip'); }
      if (k === 'down' || k === 'right') { t.i = (t.i + 1) % list.length; SND.sfx('blip'); }
    }
    const r = ui.target.i < 0 ? null : list[ui.target.i]; ui.target = null; return r;
  }

  /* ---------- party ---------- */
  function buildParty() {
    S.plv = 5; S.xp = 0; S.coffee = 3;
    S.party = FF.heroes.map((h) => ({ key: h.key, name: h.name, job: h.job, max: h.hp + 10, hp: h.hp + 10, atk: h.atk, spd: h.spd, skills: h.skills, gauge: Math.random() * 60, def: false, off: 0, blink: false, ko: false }));
  }
  const look = (h) => FF.costumes[S.costume][h.key];
  const needXp = () => S.plv * 14;
  const livingHeroes = () => S.party.filter((h) => h.hp > 0);
  const addFloat = (x, y, txt, col) => floaters.push({ x, y, txt, col, age: 0 });

  /* ---------- missions ---------- */
  async function runMission(m) {
    buildParty(); S.mode = 'scene'; SND.play('town');
    for (let i = 0; i < m.steps.length; i++) {
      const st = m.steps[i];
      if (st.say) { S.speaker = st.say[0]; await say(st.say[0] + ': ' + st.say[1]); S.speaker = null; }
      else if (st.rest) { S.party.forEach((h) => { h.hp = h.max; h.ko = false; }); S.coffee = Math.min(5, S.coffee + 2); SND.sfx('heal'); S.mode = 'scene'; await say('The team takes a quick Retrospective. Everybody is back to full energy. (+2 Coffee)'); }
      else if (st.battle) {
        let won = false;
        while (!won) { won = await battle(st.battle); if (!won) await say('The team regroups. Kade: "That was a learning opportunity." Let us try again!'); }
        S.mode = 'scene'; SND.play('town');
      } else if (st.end) {
        SND.play('win');
        await say('MISSION COMPLETE: ' + m.title + '! You exposed the Micromanager and the team learned to self-manage.');
        S.done[m.id] = true; persist();
      }
    }
    await anim(25, (t) => { ui.fade = t; });
    S.mode = 'title'; SND.play('gate');
    await anim(25, (t) => { ui.fade = 1 - t; }); ui.fade = 0;
    titleLoop();
  }

  /* ---------- battle ---------- */
  const SLOT = { 1: [[50, 38]], 2: [[34, 22], [78, 54]], 3: [[18, 10], [76, 36], [24, 62]] };
  async function battle(cfg) {
    const boss = !!cfg.boss;
    const en = cfg.enemies.map((id, i) => {
      const sp = DATA.species[id], lv = cfg.lv + (id === 'micromanager' ? 1 : 0), mx = sp.hp + lv * 2;
      return { sp, id, lv, hp: mx, max: mx, gauge: Math.random() * 40, spd: id === 'micromanager' ? 0.5 : 0.4 + Math.random() * 0.12, alpha: 1, blink: false, off: 0, big: id === 'micromanager' };
    });
    // slots: boss first/larger on the left; others stack on the right of it
    const slots = boss ? [[22, 30], [100, 12], [100, 66]] : SLOT[en.length];
    en.forEach((e, i) => { e.x = slots[i][0]; e.y = slots[i][1]; e.size = e.big ? 64 : 48; });
    B = { en, banner: null, fleeOk: !boss };
    S.mode = 'battle'; SND.play(boss ? 'boss' : 'battle'); SND.sfx('encounter');
    for (let i = 0; i < 3; i++) { ui.flash = 1; await wait(5); ui.flash = 0; await wait(5); }
    S.party.forEach((h) => { h.gauge = Math.random() * 60; h.def = false; });
    await banner(cfg.intro || 'Impediments appear!', 70);
    for (;;) {
      await wait(1);
      S.party.forEach((h) => { if (h.hp > 0) h.gauge = Math.min(100, h.gauge + h.spd); });
      B.en.forEach((e) => { if (e.hp > 0) e.gauge = Math.min(100, e.gauge + e.spd); });
      const readyH = S.party.filter((h) => h.hp > 0 && h.gauge >= 100).sort((a, b) => b.gauge - a.gauge)[0];
      const readyE = B.en.filter((e) => e.hp > 0 && e.gauge >= 100)[0];
      if (readyH) { await heroTurn(readyH); }
      else if (readyE) { await enemyTurn(readyE); }
      if (!B.en.some((e) => e.hp > 0)) { const r = await victory(cfg); B = null; return r; }
      if (!livingHeroes().length) { await defeat(); B = null; return false; }
    }
  }
  async function banner(txt, n) { B.banner = txt; await wait(n || 36); B.banner = null; }

  async function heroTurn(h) {
    h.def = false;
    for (;;) {
      B.active = h;
      const c = await menu(['Attack', 'Skill', 'Defend', 'Item'], { cols: 2, battle: true, label: h.name + ' (' + h.job + ')' });
      if (c === 0) {
        const t = await pickTarget(B.en.filter((e) => e.hp > 0)); if (!t) continue;
        B.active = null; await lunge(h); await banner(h.name + ' attacks!', 14);
        await dmgEnemy(t, Math.round((h.atk + S.plv) * (0.9 + Math.random() * 0.25)), false); break;
      }
      if (c === 1) {
        const si = await menu(h.skills.map((s) => s[0] + '  (' + s[1] + ')'), { battle: true, cancel: true, label: 'Skill: needs a right answer' });
        if (si < 0) continue;
        const sk = h.skills[si]; let tgt = null;
        if (sk[3] === 'one') { tgt = await pickTarget(B.en.filter((e) => e.hp > 0)); if (!tgt) continue; }
        else if (sk[3] === 'heal') { tgt = await pickTarget(S.party.filter((x) => x.hp > 0)); if (!tgt) continue; }
        B.active = null;
        await banner(h.name + ' uses ' + sk[0] + '!', 24);
        const r = await quiz(sk[1]);
        if (r.ok) await banner('Correct!', 20); else await banner('Not quite: ' + r.answer, 90);
        const mult = r.ok ? (Math.random() < 0.125 ? 1.5 : 1) : 0.35;
        await lunge(h);
        if (sk[3] === 'one') await dmgEnemy(tgt, Math.round((sk[2] * 0.5 + S.plv * 0.9 + h.atk * 0.5) * mult * (0.9 + Math.random() * 0.2)), mult > 1);
        else if (sk[3] === 'all') { for (const e of B.en.filter((x) => x.hp > 0)) await dmgEnemy(e, Math.round((sk[2] * 0.5 + S.plv * 0.9 + h.atk * 0.4) * mult), false, true); }
        else if (sk[3] === 'heal') await healHero(tgt, Math.round((sk[2] * 0.8 + S.plv * 2) * (r.ok ? 1 : 0.4)));
        else if (sk[3] === 'healall') { for (const x of livingHeroes()) await healHero(x, Math.round((sk[2] * 0.7 + S.plv * 1.5) * (r.ok ? 1 : 0.4)), true); }
        break;
      }
      if (c === 2) { B.active = null; h.def = true; await banner(h.name + ' takes cover from the status meeting.', 40); break; }
      if (c === 3) {
        const ic = await menu(['Coffee x' + S.coffee + '  (heal one)', 'Back'], { battle: true, cancel: true, label: 'Item' });
        if (ic !== 0) continue;
        if (S.coffee <= 0) { await banner('Out of coffee. A tragedy.', 40); continue; }
        const t = await pickTarget(S.party.filter((x) => x.hp > 0)); if (!t) continue;
        B.active = null; S.coffee--; SND.sfx('item'); await banner(h.name + ' hands over a Coffee.', 24);
        await healHero(t, 45); break;
      }
    }
    B.active = null; h.gauge = 0;
  }
  async function lunge(h) { await anim(8, (t) => { h.off = -Math.sin(t * Math.PI) * 18; }); h.off = 0; }
  async function dmgEnemy(e, dmg, crit, quiet) {
    SND.sfx(crit ? 'crit' : 'hit');
    for (let i = 0; i < 4; i++) { e.blink = !e.blink; await wait(3); } e.blink = false;
    dmg = Math.max(1, dmg); e.hp = Math.max(0, e.hp - dmg);
    addFloat(e.x + e.size / 2, e.y + 6, String(dmg), crit ? '#ffd84a' : '#ffffff');
    await wait(quiet ? 8 : 18);
    if (e.hp <= 0) { SND.sfx('faint'); await anim(18, (t) => { e.alpha = 1 - t; }); }
  }
  async function healHero(h, amt, quiet) {
    h.hp = Math.min(h.max, h.hp + amt); SND.sfx('heal');
    addFloat(heroX(h) + 12, heroY(h), '+' + amt, '#7ee08a'); await wait(quiet ? 8 : 24);
  }
  async function enemyTurn(e) {
    e.gauge = 0;
    const [name, lo, hi] = pick(e.sp.atk);
    const tgt = pick(livingHeroes());
    await banner((e.big ? '' : '') + e.sp.name + ' uses ' + name + '!', 24);
    await anim(8, (t) => { e.off = Math.sin(t * Math.PI) * 14; }); e.off = 0;
    SND.sfx('hit');
    for (let i = 0; i < 4; i++) { tgt.blink = !tgt.blink; await wait(3); } tgt.blink = false;
    let dmg = lo + rnd(hi - lo + 1) + Math.floor(e.lv / 3); if (tgt.def) dmg = Math.ceil(dmg / 2);
    tgt.hp = Math.max(0, tgt.hp - dmg); addFloat(heroX(tgt) + 12, heroY(tgt), String(dmg), '#ff9a8a');
    await wait(16);
    if (tgt.hp <= 0) { SND.sfx('faint'); tgt.ko = true; await banner(tgt.name + ' is out of energy!', 40); }
  }
  async function victory(cfg) {
    SND.play('win'); await wait(20);
    const gain = B.en.reduce((s, e) => s + (e.big ? 90 : 14 + e.lv * 3), 0);
    await say('The Impediments were resolved! Everyone gained ' + gain + ' XP.', { auto: 70 });
    S.xp += gain;
    while (S.xp >= needXp()) {
      S.xp -= needXp(); S.plv++; S.party.forEach((h) => { h.max += 6; h.atk += 1; if (h.hp > 0) h.hp = Math.min(h.max, h.hp + 12); });
      SND.sfx('levelup'); await say('The team grew to Lv. ' + S.plv + '! Max HP and attack went up.', { auto: 70 });
    }
    S.party.forEach((h) => { if (h.hp <= 0) { h.hp = Math.ceil(h.max * 0.25); h.ko = false; } h.def = false; });
    await anim(20, (t) => { ui.fade = t; }); S.mode = 'scene'; await anim(20, (t) => { ui.fade = 1 - t; }); ui.fade = 0;
    return true;
  }
  async function defeat() {
    await say('The whole team is out of energy...', { auto: 60 });
    S.party.forEach((h) => { h.hp = h.max; h.ko = false; h.def = false; }); S.coffee = Math.max(S.coffee, 2);
    await anim(20, (t) => { ui.fade = t; }); S.mode = 'scene'; await anim(20, (t) => { ui.fade = 1 - t; }); ui.fade = 0;
  }

  /* ---------- drawing ---------- */
  const heroX = (h) => 178 + (S.party.indexOf(h) % 2) * 10 + h.off;
  const heroY = (h) => 4 + S.party.indexOf(h) * 26;
  function drawCursor(x, y) { R('#1a1610', x, y, 1, 7); R('#1a1610', x + 1, y + 1, 1, 5); R('#1a1610', x + 2, y + 2, 1, 3); R('#1a1610', x + 3, y + 3, 1, 1); }
  function arrowDown(x, y) { R('#ffd84a', x, y, 7, 1); R('#ffd84a', x + 1, y + 1, 5, 1); R('#ffd84a', x + 2, y + 2, 3, 1); R('#ffd84a', x + 3, y + 3, 1, 1); }

  function drawBg(kind) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (kind === 'battle') { g.addColorStop(0, '#2a3a5a'); g.addColorStop(0.62, '#6a86b0'); g.addColorStop(0.62, '#4a6a3a'); g.addColorStop(1, '#2a4a24'); }
    else { g.addColorStop(0, '#d8c7a0'); g.addColorStop(0.55, '#e8dcc0'); g.addColorStop(0.55, '#8a6a42'); g.addColorStop(1, '#5a4228'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (kind === 'battle') { for (let i = 0; i < 26; i++) R('#3c5a2e', (i * 47) % 240, 78 + ((i * 31) % 36), 4, 1); for (let i = 0; i < 18; i++) R('#a8c0e0', (i * 59) % 240, (i * 13) % 60, 1, 1); }
    else { for (let x = 0; x < W; x += 40) { R('#cdbf9f', x, 0, 1, 88); } R('#a89a78', 0, 86, W, 2); R('#6b4423', 28, 20, 36, 50); R('#8a5a2b', 31, 23, 30, 47); R('#8fd3ff', 150, 24, 40, 34); R('#d6f0ff', 152, 26, 14, 14); R('#4f3118', 168, 24, 2, 34); R('#4f3118', 150, 40, 40, 2); }
  }
  function drawHero(h, x, y, big) {
    const img = G.person(look(h), big ? 0 : 2, 0);
    if (h.blink) return;
    ctx.globalAlpha = h.hp <= 0 ? 0.35 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(Math.round(x + 16), Math.round(y + 29), 12, 3, 0, 0, 7); ctx.fill();
    ctx.drawImage(img, Math.round(x), Math.round(y + (h.hp <= 0 ? 6 : 0)), 32, 32);
    ctx.globalAlpha = 1;
  }
  function drawBattle() {
    drawBg('battle');
    B.en.forEach((e) => {
      if (e.alpha <= 0 || e.blink) return;
      ctx.fillStyle = 'rgba(20,40,16,.5)'; ctx.beginPath(); ctx.ellipse(e.x + e.size / 2 + e.off, e.y + e.size - 2, e.size / 2.4, 5, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = e.alpha;
      const bob = Math.round(Math.sin(S.t / 20 + e.x) * 1.5);
      ctx.drawImage(G.monster(e.sp, false), 0, 0, 32, 32, Math.round(e.x + e.off), Math.round(e.y + bob), e.size, e.size);
      ctx.globalAlpha = 1;
      if (e.hp > 0) G.bar(ctx, e.x + 4, e.y + e.size + 4, e.size - 8, e.hp / e.max);
    });
    S.party.forEach((h) => { const x = heroX(h), y = heroY(h); drawHero(h, x - (B.active === h ? 10 : 0), y); });
    floaters.forEach((f) => { const y = f.y - Math.min(14, f.age / 2); G.text(ctx, f.txt, f.x - G.measure(f.txt) / 2 + 1, y + 1, '#1a1610'); G.text(ctx, f.txt, f.x - G.measure(f.txt) / 2, y, f.col); });
    if (ui.target) { const t = ui.target.list[ui.target.i]; if (t) { if (t.sp) arrowDown(t.x + t.size / 2 - 3, t.y - 6 + Math.round(Math.sin(S.t / 6) * 1.5)); else arrowDown(heroX(t) + 12, heroY(t) - 4 + Math.round(Math.sin(S.t / 6) * 1.5)); } }
    if (B.banner) { const w = G.measure(B.banner) + 16; G.box(ctx, Math.round(120 - w / 2), 4, w, 16, true); G.text(ctx, B.banner, Math.round(120 - w / 2) + 8, 8, '#f3ead0'); }
    // status panel
    G.box(ctx, 116, 116, 120, 42); R('#fbf6e6', 119, 119, 114, 36);
    S.party.forEach((h, i) => {
      const y = 119 + i * 9, act = B.active === h;
      if (act) drawCursor(119, y + 1);
      G.text(ctx, h.name, 125, y, h.hp <= 0 ? '#a04a3a' : '#2b2118');
      G.text(ctx, h.hp + '/' + h.max, 156, y, h.hp <= 0 ? '#a04a3a' : '#2b2118');
      R('#1a1610', 190, y + 1, 41, 5); R('#4a4a4a', 191, y + 2, 39, 3);
      R(h.gauge >= 100 ? '#ffd84a' : '#4aa3ff', 191, y + 2, Math.round(39 * h.gauge / 100), 3);
    });
  }
  function drawScene() {
    drawBg('scene');
    S.party.forEach((h, i) => {
      const x = 40 + i * 42, y = 66 + (S.speaker && S.speaker.startsWith(h.name) ? -Math.abs(Math.round(Math.sin(S.t / 7) * 3)) : 0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 16, 96, 12, 3, 0, 0, 7); ctx.fill();
      ctx.drawImage(G.person(look(h), 0, 0), x, y, 32, 32);
    });
    if (S.speaker === 'Manager Max') ctx.drawImage(G.person(G.looks.boss, 0, 0), 192, 66, 32, 32);
  }
  function drawTitle() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e2a4a'); g.addColorStop(0.5, '#c8845a'); g.addColorStop(0.51, '#3a2a1a'); g.addColorStop(1, '#1a1208');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) R('#fff3c0', (i * 61) % 240, (i * 17) % 60, 1, 1);
    bigText('BACKLOG QUEST', 120, 6, 3, '#ffe9a8'); bigText('FRONT LINE EDITION', 120, 34, 1, '#f08a3a');
    const missions = FF.missions;
    G.box(ctx, 14, 48, 212, 74, true);
    missions.forEach((m, i) => {
      const y = 56 + i * 20, sel = ui.title.sel === i, col = m.locked ? '#8a7a5a' : '#f3ead0';
      if (sel) drawCursor(21, y + 1);
      G.text(ctx, (S.done[m.id] ? '* ' : '') + m.title, 32, y, col);
      G.text(ctx, m.blurb, 32, y + 8, '#a89a78');
    });
    const ci = missions.length, y = 56 + ci * 20 + 2;
    if (ui.title.sel === ci) drawCursor(21, y + 1);
    G.text(ctx, 'Uniform: < ' + FF.costumes[S.costume].label + ' >', 32, y, '#f3ead0');
    S.party = S.party.length ? S.party : [];
    FF.heroes.forEach((h, i) => ctx.drawImage(G.person(FF.costumes[S.costume][h.key], 0, 0), 70 + i * 28, 126 + Math.round(Math.sin(S.t / 12 + i) * 2), 24, 24));
  }
  function bigText(str, x, y, sc, color) {
    const w = G.measure(str) + 2, c = document.createElement('canvas'); c.width = w; c.height = 9;
    G.text(c.getContext('2d'), str, 1, 0, color);
    ctx.drawImage(c, 0, 0, w, 9, Math.round(x - (w * sc) / 2), y, w * sc, 9 * sc);
  }
  function drawUI() {
    const t = ui.text;
    if (t) {
      G.box(ctx, 4, 112, 232, 44);
      let n = t.shown;
      t.lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, n)); n -= ln.length; if (s) G.text(ctx, s, 14, 120 + i * 12); });
      if (t.shown >= t.total && Math.floor(S.t / 20) % 2) { R('#1a1610', 222, 146, 5, 1); R('#1a1610', 223, 147, 3, 1); R('#1a1610', 224, 148, 1, 1); }
    }
    const m = ui.menu;
    if (m && m.battle) {
      G.box(ctx, 4, 116, 110, 42);
      G.text(ctx, m.label, 12, 120, '#8a7448');
      if (m.cols === 2) m.opts.forEach((o, i) => { const cx = 20 + (i % 2) * 48, cy = 132 + Math.floor(i / 2) * 12; if (i === m.sel) drawCursor(cx - 9, cy + 1); G.text(ctx, o, cx, cy); });
      else m.opts.forEach((o, i) => { const cy = 130 + i * 11; if (i === m.sel) drawCursor(12, cy + 1); G.text(ctx, o, 22, cy); });
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

  /* ---------- title ---------- */
  async function titleLoop() {
    const rows = () => FF.missions.length + 1;
    for (;;) {
      const k = await nextKey(), ci = FF.missions.length;
      if (k === 'up' && ui.title.sel > 0) ui.title.sel--;
      else if (k === 'down' && ui.title.sel < rows() - 1) ui.title.sel++;
      else if (ui.title.sel === ci && (k === 'left' || k === 'right' || k === 'a')) { S.costume = S.costume === 'civilian' ? 'military' : 'civilian'; SND.sfx('select'); persist(); }
      else if (k === 'a' && ui.title.sel < ci) {
        const m = FF.missions[ui.title.sel];
        if (m.locked) { SND.sfx('wrong'); continue; }
        SND.sfx('select');
        await anim(20, (t) => { ui.fade = t; });
        buildParty(); S.mode = 'scene';
        await anim(20, (t) => { ui.fade = 1 - t; }); ui.fade = 0;
        runMission(m); return;
      }
    }
  }

  /* ---------- loop ---------- */
  function update() {
    S.t++;
    for (let i = tickers.length - 1; i >= 0; i--) {
      const k = tickers[i];
      if (k.fn) { k.i++; k.fn(Math.min(1, k.i / k.total)); if (k.i >= k.total) { tickers.splice(i, 1); k.res(); } }
      else if (--k.n <= 0) { tickers.splice(i, 1); k.res(); }
    }
    for (let i = floaters.length - 1; i >= 0; i--) if (++floaters[i].age > 40) floaters.splice(i, 1);
    const t = ui.text;
    if (t) {
      if (t.shown < t.total) t.shown = Math.min(t.total, t.shown + (S.t % 2 ? 1 : 2));
      else if (t.auto && ++t.timer > t.auto && ui.waiter) ui.waiter('auto');
    }
  }
  function draw() {
    if (S.mode === 'title') drawTitle(); else if (S.mode === 'battle' && B) drawBattle(); else drawScene();
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
  SND.play('gate');
  titleLoop(); requestAnimationFrame(frame);
  window.__ff = { S, ui, say, battle, FF, DATA, get B() { return B; } };
})();
