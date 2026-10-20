/* map.js: the HQ floor plan on a 480x320 pixel canvas (shown at 2x), soldiers walking between rooms, clicks. */
(function () {
  'use strict';
  const G = window.GFX, RW = window.RW;
  const M = (window.MAP = {});
  const W = 480, H = 320;
  const COLX = [40, 184, 328], RW_ = 144;           // room columns
  const ROWY = [8, 116, 224], RH = 80;              // room rows
  const HALL = [102, 210];                          // hallway centre lines (H1 between rows 0-1, H2 between rows 1-2)
  const CORX = 24;                                  // vertical corridor centre (connects H1 and H2)
  let cv, ctx, bg, t = 0;
  const agents = [], alerts = {}, rooms = {};
  let clickFn = null, selected = null, hover = null;

  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };

  RW.rooms.forEach((r) => {
    const x = COLX[r.col], y = ROWY[r.row];
    const doorX = x + RW_ / 2, hall = r.row === 0 ? 0 : r.row === 1 ? 0 : 1;
    const inY = r.row === 0 ? y + RH - 10 : y + 10;
    rooms[r.id] = Object.assign({}, r, { x, y, w: RW_, h: RH, doorX, hall, inY, spots: [], used: [] });
  });

  /* ---------- static background ---------- */
  const FLOORS = {
    wood: ['#6b4a2e', '#5e4027', '#7a5636'], tile: ['#8d97a3', '#7f8994', '#9aa4b0'], carpet: ['#4a3a5a', '#423451', '#55436a'],
    carpet2: ['#3a4a6a', '#34425f', '#44557a'], concrete: ['#6e6a62', '#646058', '#7a766d'], tech: ['#2e3b48', '#28333f', '#36475a'],
  };
  function floor(b, x, y, w, h, kind, seed) {
    const [a, d, l] = FLOORS[kind], r = rng(seed);
    b.fillStyle = a; b.fillRect(x, y, w, h);
    if (kind === 'wood') for (let j = y; j < y + h; j += 6) { b.fillStyle = d; b.fillRect(x, j, w, 1); for (let i = x + ((j / 6) % 2) * 12; i < x + w; i += 24) b.fillRect(i, j, 1, 6); }
    else if (kind === 'tile' || kind === 'tech') for (let j = y; j < y + h; j += 12) for (let i = x; i < x + w; i += 12) { b.fillStyle = (i / 12 + j / 12) % 2 ? d : a; b.fillRect(i, j, 12, 12); b.fillStyle = l; b.fillRect(i, j, 12, 1); }
    else for (let n = 0; n < w * h / 18; n++) { b.fillStyle = r() < 0.5 ? d : l; b.fillRect(x + r() * w | 0, y + r() * h | 0, 1, 1); }
  }
  function desk(b, x, y, w, screen) {
    b.fillStyle = '#3a2a1c'; b.fillRect(x, y + 2, w, 12); b.fillStyle = '#8a6440'; b.fillRect(x, y, w, 10); b.fillStyle = '#a07a50'; b.fillRect(x, y, w, 2);
    if (screen) { b.fillStyle = '#1a1f27'; b.fillRect(x + w / 2 - 6, y - 7, 12, 8); b.fillStyle = screen; b.fillRect(x + w / 2 - 5, y - 6, 10, 5); b.fillStyle = '#1a1f27'; b.fillRect(x + w / 2 - 1, y + 1, 2, 2); }
    b.fillStyle = '#e8e1cc'; b.fillRect(x + 3, y + 3, 5, 4);
  }
  function plant(b, x, y) { b.fillStyle = '#6b4423'; b.fillRect(x - 3, y, 6, 6); b.fillStyle = '#2f7d32'; b.fillRect(x - 5, y - 7, 10, 8); b.fillStyle = '#4aa148'; b.fillRect(x - 3, y - 9, 5, 5); }
  function buildBg() {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const b = c.getContext('2d');
    // outside: night ground
    b.fillStyle = '#1b2a1e'; b.fillRect(0, 0, W, H); const r = rng(7);
    for (let n = 0; n < 500; n++) { b.fillStyle = r() < 0.5 ? '#223424' : '#162318'; b.fillRect(r() * W | 0, r() * H | 0, 1, 1); }
    // building slab
    b.fillStyle = '#20252c'; b.fillRect(4, 4, 472, 304);
    // halls + corridor
    floor(b, 8, 88, 464, 28, 'concrete', 3); floor(b, 8, 196, 464, 28, 'concrete', 4); floor(b, 8, 88, 32, 136, 'concrete', 5);
    b.fillStyle = '#8a3a2a'; b.fillRect(60, 101, 400, 2); b.fillRect(60, 209, 400, 2); // runner stripe
    Object.values(rooms).forEach((rm, i) => {
      floor(b, rm.x, rm.y, rm.w, rm.h, rm.floor, 11 + i);
      // walls (top wall thicker, lit)
      b.fillStyle = '#3c4552'; b.fillRect(rm.x, rm.y, rm.w, 6); b.fillStyle = '#56606e'; b.fillRect(rm.x, rm.y, rm.w, 1);
      b.fillStyle = '#2a313b'; b.fillRect(rm.x, rm.y + rm.h - 3, rm.w, 3); b.fillRect(rm.x, rm.y, 3, rm.h); b.fillRect(rm.x + rm.w - 3, rm.y, 3, rm.h);
      // door gap
      const dy = rm.row === 0 ? rm.y + rm.h - 3 : rm.y; floor(b, rm.doorX - 10, dy, 20, rm.row === 0 ? 3 : 6, rm.floor, 2);
      decorate(b, rm);
    });
    return c;
  }
  function decorate(b, rm) {
    const x = rm.x, y = rm.y, sp = rm.spots;
    const deskRow = (screen) => { [14, 56, 98].forEach((dx) => { desk(b, x + dx, y + 18, 32, screen); sp.push([x + dx + 16, y + 44]); }); sp.push([x + 30, y + 64], [x + 72, y + 64], [x + 114, y + 64]); };
    if (rm.id === 'cdr') {
      desk(b, x + 40, y + 18, 64, '#6aa7e0'); b.fillStyle = '#7a1f1f'; b.fillRect(x + 8, y + 30, 22, 30); b.fillStyle = '#9a3a3a'; b.fillRect(x + 8, y + 30, 22, 2); // rug
      plant(b, x + 128, y + 22); b.fillStyle = '#5a4a3a'; b.fillRect(x + 116, y + 50, 16, 20); // cabinet
      sp.push([x + 72, y + 44], [x + 52, y + 62], [x + 92, y + 62], [x + 20, y + 66]);
    } else if (rm.id === 'brief') {
      b.fillStyle = '#e8e1cc'; b.fillRect(x + 24, y + 8, 96, 14); b.fillStyle = '#c9c0a8'; b.fillRect(x + 24, y + 21, 96, 1);
      ['#e8d45a', '#e8d45a', '#9ad06a', '#e8a05a', '#9ad06a', '#e8d45a'].forEach((c, i) => { b.fillStyle = c; b.fillRect(x + 30 + i * 14, y + 11, 8, 7); });
      b.fillStyle = '#4a3a2a'; b.fillRect(x + 36, y + 38, 72, 22); b.fillStyle = '#6b5236'; b.fillRect(x + 36, y + 38, 72, 3);
      sp.push([x + 30, y + 46], [x + 114, y + 46], [x + 50, y + 68], [x + 72, y + 68], [x + 94, y + 68], [x + 72, y + 32]);
    } else if (rm.id === 'brk') {
      b.fillStyle = '#3a3f48'; b.fillRect(x + 10, y + 10, 18, 22); b.fillStyle = '#c0443a'; b.fillRect(x + 13, y + 14, 12, 4); b.fillStyle = '#e8e1cc'; b.fillRect(x + 16, y + 24, 6, 5); // coffee machine
      b.fillStyle = '#5a3a6a'; b.fillRect(x + 60, y + 14, 60, 14); b.fillStyle = '#6e4a82'; b.fillRect(x + 60, y + 14, 60, 4); // couch
      b.fillStyle = '#6b4a2e'; b.fillRect(x + 70, y + 44, 40, 16); plant(b, x + 130, y + 60);
      sp.push([x + 20, y + 40], [x + 76, y + 36], [x + 104, y + 36], [x + 60, y + 66], [x + 90, y + 66], [x + 120, y + 44]);
    } else if (rm.id === 's6') {
      for (let i = 0; i < 3; i++) { b.fillStyle = '#14181e'; b.fillRect(x + 8 + i * 14, y + 8, 12, 28); for (let j = 0; j < 6; j++) { b.fillStyle = j % 2 ? '#5fbf7a' : '#2a313b'; b.fillRect(x + 10 + i * 14, y + 11 + j * 4, 8, 2); } }
      b.fillStyle = '#1a1f27'; b.fillRect(x + 96, y + 10, 36, 26); b.fillStyle = '#b48cf0'; b.fillRect(x + 98, y + 12, 32, 18); b.fillStyle = '#1a1f27'; b.fillRect(x + 112, y + 36, 4, 6); b.fillRect(x + 104, y + 42, 20, 3);
      desk(b, x + 54, y + 48, 32, '#5fbf7a');
      sp.push([x + 70, y + 72], [x + 30, y + 50], [x + 30, y + 68], [x + 100, y + 66], [x + 120, y + 66], [x + 114, y + 52]);
      rm.terminal = [x + 114, y + 24];
    } else if (rm.id === 'eng') {
      b.fillStyle = '#3b7bd8'; b.fillRect(x + 20, y + 14, 104, 8); b.fillStyle = '#6aa6f0'; b.fillRect(x + 24, y + 16, 30, 1); b.fillRect(x + 70, y + 18, 40, 1);
      b.fillStyle = '#8a6440'; b.fillRect(x + 64, y + 10, 16, 16); b.fillStyle = '#5a4a3a'; b.fillRect(x + 70, y + 10, 4, 16); // bridge model
      desk(b, x + 14, y + 34, 32, '#e8d45a'); desk(b, x + 98, y + 34, 32, '#e8d45a');
      sp.push([x + 30, y + 58], [x + 114, y + 58], [x + 72, y + 40], [x + 50, y + 70], [x + 94, y + 70], [x + 72, y + 64]);
    } else if (rm.id === 's4') {
      deskRow('#e8a05a'); b.fillStyle = '#5a6a3a'; b.fillRect(x + 128, y + 54, 10, 10); b.fillRect(x + 118, y + 58, 10, 10); b.fillStyle = '#7a8a50'; b.fillRect(x + 128, y + 54, 10, 2); // crates
    } else if (rm.id === 's3') {
      deskRow('#6aa7e0'); b.fillStyle = '#b8a878'; b.fillRect(x + 46, y + 52, 52, 20); b.fillStyle = '#3b7bd8'; b.fillRect(x + 56, y + 54, 3, 16); b.fillStyle = '#c0443a'; b.fillRect(x + 64, y + 58, 4, 4); b.fillRect(x + 80, y + 62, 4, 4); // map table
    } else if (rm.id === 's2') { deskRow('#5fbf7a'); plant(b, x + 134, y + 70); }
    else { deskRow('#6aa7e0'); b.fillStyle = '#5a5f68'; b.fillRect(x + 128, y + 50, 10, 24); }
  }

  /* ---------- agents ---------- */
  const UNIFORM = { pants: '#857c5c', shirt: '#9a916e', shirt2: '#7f7758', cap: '#857c5c' };
  M.addAgent = function (a) {
    const look = Object.assign({ id: 'ag-' + a.id }, UNIFORM, a.look, a.civ ? { shirt: '#4a4f5a', shirt2: '#3a3f48', pants: '#2a2f38', cap: null } : {});
    const rm = rooms[a.room], spot = claim(rm);
    const ag = { id: a.id, name: a.name, look, room: a.room, spot, x: rm.spots[spot][0], y: rm.spots[spot][1], dir: 0, path: [], walkT: 0, bar: null, icon: null, hidden: !!a.hidden, label: a.label !== false };
    agents.push(ag); return ag;
  };
  M.agent = (id) => agents.find((a) => a.id === id);
  function claim(rm) { for (let i = 0; i < rm.spots.length; i++) if (!rm.used[i]) { rm.used[i] = true; return i; } return 0; }
  M.moveTo = function (id, roomId) {
    const a = M.agent(id), from = rooms[a.room], to = rooms[roomId];
    return new Promise((res) => {
      if (a.room === roomId) { res(); return; }
      from.used[a.spot] = false;
      const s = claim(to), pts = [];
      pts.push([from.doorX, from.inY], [from.doorX, HALL[from.hall]]);
      if (from.hall !== to.hall) pts.push([CORX, HALL[from.hall]], [CORX, HALL[to.hall]]);
      pts.push([to.doorX, HALL[to.hall]], [to.doorX, to.inY], to.spots[s]);
      a.path = pts; a.room = roomId; a.spot = s; a.arrive = res; a.hidden = false;
    });
  };
  M.place = function (id, roomId) { const a = M.agent(id), from = rooms[a.room], to = rooms[roomId]; from.used[a.spot] = false; const s = claim(to); a.room = roomId; a.spot = s; a.x = to.spots[s][0]; a.y = to.spots[s][1]; a.path = []; };
  M.setBar = (id, v) => { const a = M.agent(id); if (a) a.bar = v; };
  M.setIcon = (id, v) => { const a = M.agent(id); if (a) a.icon = v; };
  M.setAlert = (roomId, on) => { alerts[roomId] = on; };
  M.select = (id) => { selected = id; };
  M.onClick = (fn) => { clickFn = fn; };
  M.walking = (id) => { const a = M.agent(id); return a && a.path.length > 0; };

  M.update = function (speed) {
    t++;
    agents.forEach((a) => {
      if (!a.path.length) { a.walkT = 0; return; }
      let step = 0.9 * speed;
      while (step > 0 && a.path.length) {
        const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
        if (d <= step) { a.x = tx; a.y = ty; a.path.shift(); step -= d; }
        else { a.x += (dx / d) * step; a.y += (dy / d) * step; step = 0; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); }
      }
      a.walkT += speed;
      if (!a.path.length) { a.dir = 1; if (a.arrive) { const f = a.arrive; a.arrive = null; f(); } }
    });
  };

  M.draw = function () {
    if (!bg) bg = buildBg();
    ctx.drawImage(bg, 0, 0);
    // blinking lights + GenAI terminal glow
    const s6 = rooms.s6;
    if (Math.floor(t / 30) % 2) { ctx.fillStyle = 'rgba(180,140,240,.25)'; ctx.fillRect(s6.terminal[0] - 18, s6.terminal[1] - 14, 36, 26); }
    // room labels + alerts
    Object.values(rooms).forEach((rm) => {
      const w = G.measure(rm.name) + 6;
      ctx.fillStyle = 'rgba(10,12,16,.78)'; ctx.fillRect(rm.x + 4, rm.y + rm.h - 13, w, 10);
      G.text(ctx, rm.name, rm.x + 7, rm.y + rm.h - 12, '#e6e1d4');
      if (alerts[rm.id]) {
        const on = Math.floor(t / 20) % 2, ax = rm.x + rm.w - 18, ay = rm.y + 6;
        ctx.fillStyle = on ? '#e0675a' : '#a8443a'; ctx.fillRect(ax, ay, 12, 12); ctx.fillStyle = '#fff'; ctx.fillRect(ax + 5, ay + 2, 2, 6); ctx.fillRect(ax + 5, ay + 9, 2, 2);
        ctx.strokeStyle = 'rgba(224,103,90,.6)'; ctx.lineWidth = 1; ctx.strokeRect(rm.x + 1.5, rm.y + 1.5, rm.w - 3, rm.h - 3);
      }
    });
    // agents sorted by y
    agents.filter((a) => !a.hidden).sort((p, q) => p.y - q.y).forEach((a) => {
      const fr = a.path.length ? 1 + (Math.floor(a.walkT / 8) % 2) : 0, x = Math.round(a.x - 8), y = Math.round(a.y - 15);
      if (selected === a.id) { ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(a.x, a.y, 8, 3, 0, 0, 7); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 4, y + 14, 8, 2); }
      ctx.drawImage(G.person(a.look, a.dir, fr), x, y);
      if (a.bar != null) { ctx.fillStyle = '#0d1014'; ctx.fillRect(x - 1, y - 5, 18, 4); ctx.fillStyle = a.barColor || '#6aa7e0'; ctx.fillRect(x, y - 4, Math.round(16 * Math.min(1, a.bar)), 2); }
      if (a.icon) { ctx.fillStyle = a.icon === '!' ? '#e0675a' : '#d9a441'; ctx.fillRect(x + 12, y - 12, 7, 8); G.text(ctx, a.icon, x + 14, y - 11, '#14110c'); }
      if (a.label && (hover === a.id || selected === a.id)) { const n = a.name, w = G.measure(n) + 4; ctx.fillStyle = 'rgba(10,12,16,.85)'; ctx.fillRect(Math.round(a.x - w / 2), y + 17, w, 9); G.text(ctx, n, Math.round(a.x - w / 2) + 2, y + 18, '#e6e1d4'); }
    });
  };

  function hit(mx, my) {
    const a = agents.filter((q) => !q.hidden).sort((p, q) => q.y - p.y).find((q) => Math.abs(q.x - mx) < 7 && my > q.y - 16 && my < q.y + 2);
    if (a) return { agent: a.id };
    const rm = Object.values(rooms).find((r) => mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h);
    return rm ? { room: rm.id } : null;
  }
  M.init = function (canvas) {
    cv = canvas; ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const pos = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
    cv.addEventListener('click', (e) => { const h = hit(...pos(e)); if (h && clickFn) clickFn(h); });
    cv.addEventListener('mousemove', (e) => { const h = hit(...pos(e)); hover = h && h.agent; });
  };
  M.rooms = rooms;
  // build the background (and the room spots) before any agent is added
  M.prepare = function () { bg = buildBg(); };
})();
