/* gfx.js: all artwork is generated in code (no image files). Tiles, characters, monsters, UI and a crisp text renderer. */
(function () {
  'use strict';
  const G = (window.GFX = {});
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const R = (x, c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
  const disc = (x, c, cx, cy, rx, ry) => {
    x.fillStyle = c;
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++)
      if ((i * i) / (rx * rx + 0.5) + (j * j) / (ry * ry + 0.5) <= 1) x.fillRect(Math.round(cx + i), Math.round(cy + j), 1, 1);
  };

  /* outline + simple light/shade pass. Gives everything the same chunky GBA look. */
  function finish(ctx, w, h, outline, shade) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    const A = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : d[(j * w + i) * 4 + 3]);
    const out = ctx.createImageData(w, h); out.data.set(d);
    const o = out.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4;
      if (A(i, j) === 0) {
        if (outline && (A(i - 1, j) || A(i + 1, j) || A(i, j - 1) || A(i, j + 1))) { o[k] = outline[0]; o[k + 1] = outline[1]; o[k + 2] = outline[2]; o[k + 3] = 255; }
      } else if (shade) {
        let t = 0;
        if (!A(i - 1, j - 1) && !A(i, j - 1) || !A(i - 1, j) && !A(i - 1, j - 1)) t = 28;
        else if (!A(i + 1, j + 1) && !A(i, j + 1) || !A(i + 1, j) && !A(i + 1, j + 1)) t = -34;
        o[k] = Math.max(0, Math.min(255, d[k] + t)); o[k + 1] = Math.max(0, Math.min(255, d[k + 1] + t)); o[k + 2] = Math.max(0, Math.min(255, d[k + 2] + t));
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  /* ---------- tiles (16x16) ---------- */
  const T = {};
  const tile = (id, fn) => { const [c, x] = mk(16, 16); fn(x, rng(id * 977 + 13)); T[id] = c; };
  const grassBase = (x, r) => {
    R(x, '#5fae4a', 0, 0, 16, 16);
    for (let n = 0; n < 26; n++) R(x, r() < 0.5 ? '#4e9a3c' : '#78c25e', (r() * 16) | 0, (r() * 16) | 0, 1, 1);
  };
  tile(0, grassBase);
  tile(1, (x, r) => {
    R(x, '#3f8a3a', 0, 0, 16, 16);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const bx = i * 4 + (j % 2) * 2, by = j * 4;
      R(x, '#2a6b2c', bx, by + 1, 1, 3); R(x, '#8bd36b', bx, by, 1, 1); R(x, '#2a6b2c', bx + 2, by + 2, 1, 2); R(x, '#8bd36b', bx + 2, by + 1, 1, 1);
    }
  });
  tile(2, (x, r) => { R(x, '#d8b878', 0, 0, 16, 16); for (let n = 0; n < 22; n++) R(x, r() < 0.5 ? '#c4a35f' : '#e8cf95', (r() * 16) | 0, (r() * 16) | 0, 1 + (r() * 2 | 0), 1); });
  tile(3, (x, r) => {
    grassBase(x, r); R(x, '#6b4423', 6, 11, 4, 5); R(x, '#4f3118', 9, 11, 1, 5);
    disc(x, '#2f7d32', 8, 7, 7, 6); disc(x, '#44a047', 6, 5, 4, 3); disc(x, '#7ed071', 5, 4, 1, 1);
    for (let n = 0; n < 6; n++) R(x, '#256427', 3 + (r() * 10 | 0), 8 + (r() * 4 | 0), 2, 1);
  });
  const water = (id, off) => tile(id, (x) => {
    R(x, '#3b7bd8', 0, 0, 16, 16);
    for (let j = 0; j < 4; j++) { R(x, '#6aa6f0', (j * 5 + off) % 14, j * 4 + 1, 4, 1); R(x, '#2c62b8', (j * 7 + off + 6) % 14, j * 4 + 3, 3, 1); }
  });
  water(4, 0); water(14, 5);
  tile(5, (x, r) => { grassBase(x, r); [[2, 3, '#e8433a'], [9, 2, '#ffe14d'], [5, 9, '#ffffff'], [12, 11, '#e8433a'], [2, 13, '#ffe14d']].forEach(([a, b, c]) => { R(x, c, a, b, 2, 2); R(x, '#2f7d32', a, b + 2, 1, 2); }); });
  tile(6, (x, r) => { grassBase(x, r); R(x, '#8a5a2b', 0, 6, 16, 2); R(x, '#8a5a2b', 0, 10, 16, 2); R(x, '#6b4423', 1, 4, 3, 10); R(x, '#6b4423', 12, 4, 3, 10); R(x, '#a9743a', 1, 4, 1, 10); R(x, '#a9743a', 12, 4, 1, 10); });
  const wall = (x) => { R(x, '#e8dcc0', 0, 0, 16, 16); for (let j = 0; j < 4; j++) { R(x, '#cdbf9f', 0, j * 4 + 3, 16, 1); for (let i = 0; i < 3; i++) R(x, '#cdbf9f', ((i * 6 + (j % 2) * 3) % 16), j * 4, 1, 3); } R(x, '#a89a78', 0, 15, 16, 1); };
  tile(7, wall);
  const roof = (id, a, b, hi) => tile(id, (x) => { R(x, a, 0, 0, 16, 16); for (let j = 0; j < 4; j++) { R(x, b, 0, j * 4 + 3, 16, 1); for (let i = 0; i < 4; i++) R(x, b, ((i * 5 + (j % 2) * 3) % 16), j * 4, 1, 3); R(x, hi, 0, j * 4, 16, 1); } });
  roof(8, '#b83a2e', '#8f2a22', '#d4574a'); roof(13, '#3a5fb8', '#2a4690', '#5a82d6');
  tile(9, (x) => { wall(x); R(x, '#4f3118', 3, 1, 10, 15); R(x, '#8a5a2b', 4, 2, 8, 14); R(x, '#a9743a', 4, 2, 1, 14); R(x, '#4f3118', 8, 2, 1, 14); R(x, '#ffd84a', 10, 9, 2, 2); });
  tile(10, (x) => { wall(x); R(x, '#4f3118', 3, 3, 10, 9); R(x, '#8fd3ff', 4, 4, 8, 7); R(x, '#d6f0ff', 4, 4, 3, 3); R(x, '#4f3118', 7, 4, 2, 7); R(x, '#4f3118', 4, 7, 8, 1); R(x, '#8a5a2b', 2, 12, 12, 2); });
  tile(11, (x, r) => { grassBase(x, r); R(x, '#6b4423', 7, 8, 2, 8); R(x, '#4f3118', 2, 2, 12, 8); R(x, '#d9b36c', 3, 3, 10, 6); R(x, '#8a6a30', 4, 5, 8, 1); R(x, '#8a6a30', 4, 7, 6, 1); });
  G.tiles = T;
  G.SOLID = new Set([3, 4, 6, 7, 8, 9, 10, 11, 13, 14]);

  /* ---------- characters (16x16, dir 0 down 1 up 2 left 3 right, 2 walk frames + idle) ---------- */
  const charCache = {};
  G.person = function (look, dir, frame) {
    const key = look.id + dir + frame;
    if (charCache[key]) return charCache[key];
    const [c, x] = mk(16, 16);
    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0, bob = frame ? 0 : 0;
    R(x, 'rgba(0,0,0,.25)', 4, 14, 8, 2);
    R(x, look.pants, 5, 11 + (step > 0 ? 0 : 0), 2, 3 + (step > 0 ? 1 : 0)); R(x, look.pants, 9, 11, 2, 3 + (step < 0 ? 1 : 0));
    R(x, '#2b2118', 5, 13 + (step > 0 ? 1 : 0), 2, 1); R(x, '#2b2118', 9, 13 + (step < 0 ? 1 : 0), 2, 1);
    R(x, look.shirt, 4, 6, 8, 6); R(x, look.shirt2, 4, 10, 8, 2); R(x, look.skin, 3, 7, 1, 4); R(x, look.skin, 12, 7, 1, 4);
    R(x, look.skin, 5, 1, 6, 6);
    if (dir === 1) { R(x, look.hair, 5, 1, 6, 6); }
    else {
      R(x, look.hair, 5, 0, 6, 3); R(x, look.hair, 5, 1, 1, 4); R(x, look.hair, 10, 1, 1, 4);
      if (dir === 0) { R(x, '#1b1410', 6, 4, 1, 2); R(x, '#1b1410', 9, 4, 1, 2); }
      else if (dir === 2) { R(x, '#1b1410', 6, 4, 1, 2); R(x, look.hair, 9, 1, 2, 5); }
      else { R(x, '#1b1410', 9, 4, 1, 2); R(x, look.hair, 5, 1, 2, 5); }
    }
    if (look.cap) { R(x, look.cap, 4, 0, 8, 3); R(x, look.cap, 5, -0, 6, 1); if (dir === 0) R(x, look.cap, 4, 3, 8, 1); else if (dir === 2) R(x, look.cap, 2, 3, 4, 1); else if (dir === 3) R(x, look.cap, 10, 3, 4, 1); }
    finish(x, 16, 16, [30, 22, 14], false);
    return (charCache[key] = c);
  };
  G.looks = {
    player: { id: 'p', skin: '#f0c9a0', hair: '#4a3020', pants: '#3b3f5c', shirt: '#c8a45a', shirt2: '#a98440', cap: '#2b2b2b' },
    mentor: { id: 'm', skin: '#e0b088', hair: '#d8d8d8', pants: '#5a4a32', shirt: '#4a7a4a', shirt2: '#385e38' },
    po: { id: 'po', skin: '#b98660', hair: '#1f1612', pants: '#2a3a6a', shirt: '#3a5fb8', shirt2: '#2a4690' },
    dev: { id: 'dv', skin: '#f0c9a0', hair: '#c0602a', pants: '#4a4a4a', shirt: '#e8e8e8', shirt2: '#bcbcbc' },
    boss: { id: 'bs', skin: '#f0c9a0', hair: '#222222', pants: '#202020', shirt: '#9c2a2a', shirt2: '#7c1c1c' },
  };

  /* ---------- monsters (32x32, drawn then outlined/shaded) ---------- */
  const monCache = {};
  const eyes = (x, lx, rx, y, mood) => {
    [lx, rx].forEach((ex, i) => {
      R(x, '#fff', ex - 1, y - 1, 4, 4); R(x, '#14110c', ex + (i ? 0 : 1), y, 2, 3);
      if (mood === 'angry') R(x, '#14110c', ex - 1 + (i ? 0 : 0), y - 2 + (i ? 0 : 1) * 0, 4, 1);
    });
  };
  const SHAPES = {
    leaf(x, s) {
      disc(x, s.c2, 8, 10, 3, 5); disc(x, s.c2, 24, 10, 3, 5); disc(x, s.c, 16, 20, 10, 9); disc(x, s.c3, 16, 23, 6, 5);
      R(x, s.c2, 15, 4, 2, 6); disc(x, '#7ed071', 20, 5, 4, 2); disc(x, '#7ed071', 12, 6, 3, 2);
      disc(x, s.c, 9, 28, 3, 2); disc(x, s.c, 23, 28, 3, 2);
    },
    note(x, s) {
      R(x, s.c, 6, 9, 20, 20); R(x, s.c2, 6, 9, 20, 4); [16, 20, 24].forEach((y) => R(x, s.c3, 9, y, 14, 1));
      disc(x, s.c2, 9, 8, 2, 2); disc(x, s.c2, 23, 8, 2, 2); R(x, s.c2, 8, 28, 4, 3); R(x, s.c2, 20, 28, 4, 3);
    },
    flame(x, s) {
      disc(x, s.c, 16, 21, 10, 9); disc(x, s.c3, 16, 24, 6, 5);
      disc(x, '#ffb72e', 16, 9, 5, 6); disc(x, '#ffe27a', 16, 11, 3, 4); disc(x, '#ffb72e', 10, 12, 2, 3); disc(x, '#ffb72e', 22, 12, 2, 3);
      R(x, s.c2, 8, 29, 5, 2); R(x, s.c2, 19, 29, 5, 2);
    },
    rock(x, s) {
      disc(x, s.c, 16, 19, 11, 10); disc(x, s.c, 10, 12, 5, 5); disc(x, s.c, 22, 13, 6, 5); disc(x, s.c3, 17, 24, 7, 4);
      R(x, s.c2, 14, 9, 1, 6); R(x, s.c2, 15, 14, 3, 1); R(x, s.c2, 23, 20, 1, 6);
    },
    vine(x, s) {
      disc(x, s.c, 16, 18, 9, 9); disc(x, s.c3, 16, 21, 6, 5);
      [[5, 8], [27, 9], [4, 22], [28, 23], [10, 3], [22, 3], [16, 29]].forEach(([a, b], i) => { disc(x, s.c2, a, b, 3, 3); R(x, s.c2, Math.min(a, 16) + (a < 16 ? 2 : -2) * 0, Math.min(b, 16), 1, 1); });
      R(x, s.c2, 6, 10, 4, 2); R(x, s.c2, 23, 10, 4, 2); R(x, s.c2, 6, 21, 4, 2); R(x, s.c2, 23, 22, 4, 2);
    },
    zombie(x, s) {
      disc(x, s.c, 16, 14, 8, 8); R(x, s.c, 9, 20, 14, 9); R(x, s.c3, 9, 25, 14, 4);
      R(x, s.c2, 2, 18, 8, 3); R(x, s.c2, 22, 18, 8, 3); R(x, s.c, 2, 21, 3, 2); R(x, s.c, 27, 21, 3, 2);
      R(x, s.c2, 10, 29, 4, 2); R(x, s.c2, 18, 29, 4, 2); R(x, '#4a2a2a', 12, 20, 8, 1);
    },
    gold(x, s) {
      disc(x, s.c, 16, 18, 11, 10); disc(x, s.c3, 16, 22, 7, 5); R(x, s.c2, 12, 6, 8, 3); R(x, s.c2, 10, 8, 12, 2);
      [[4, 6], [28, 10], [6, 27], [27, 26]].forEach(([a, b]) => { R(x, '#fff7c0', a, b - 2, 1, 5); R(x, '#fff7c0', a - 2, b, 5, 1); });
    },
    boss(x, s) {
      disc(x, s.c, 16, 18, 12, 11); disc(x, s.c3, 16, 22, 8, 5); R(x, s.c2, 8, 5, 16, 4);
      [[3, 14], [29, 14], [4, 25], [28, 25], [8, 3], [24, 3]].forEach(([a, b]) => { disc(x, '#f0c9a0', a, b, 2, 2); });
      R(x, '#222', 26, 6, 4, 1); disc(x, '#8fd3ff', 29, 9, 2, 2);
    },
  };
  const FACES = {
    leaf: (x) => { eyes(x, 11, 19, 17); R(x, '#14110c', 14, 23, 4, 1); R(x, '#14110c', 15, 24, 2, 1); },
    note: (x) => { eyes(x, 10, 19, 14); R(x, '#14110c', 14, 21, 4, 1); },
    flame: (x) => { eyes(x, 11, 19, 18); R(x, '#14110c', 14, 25, 4, 1); R(x, '#14110c', 13, 24, 1, 1); R(x, '#14110c', 18, 24, 1, 1); },
    rock: (x) => { eyes(x, 11, 17, 17, 'angry'); R(x, '#8a1c1c', 11, 18, 1, 1); R(x, '#14110c', 12, 24, 8, 1); R(x, '#fff', 13, 23, 1, 1); R(x, '#fff', 17, 23, 1, 1); },
    vine: (x) => { eyes(x, 11, 19, 16); R(x, '#14110c', 12, 23, 8, 1); R(x, '#d8d8d8', 13, 24, 1, 1); R(x, '#d8d8d8', 18, 24, 1, 1); },
    zombie: (x) => { R(x, '#fff', 11, 11, 4, 4); R(x, '#14110c', 12, 12, 2, 2); R(x, '#14110c', 18, 11, 1, 1); R(x, '#14110c', 21, 11, 1, 1); R(x, '#14110c', 19, 12, 2, 2); R(x, '#14110c', 18, 14, 1, 1); R(x, '#14110c', 21, 14, 1, 1); R(x, '#14110c', 12, 17, 8, 1); },
    gold: (x) => { eyes(x, 11, 19, 16); R(x, '#14110c', 13, 23, 6, 1); R(x, '#14110c', 19, 22, 1, 1); R(x, '#ffd84a', 18, 15, 5, 1); R(x, '#ffd84a', 18, 19, 5, 1); },
    boss: (x) => { eyes(x, 10, 19, 15, 'angry'); R(x, '#14110c', 12, 23, 8, 1); R(x, '#14110c', 11, 22, 1, 1); R(x, '#14110c', 20, 22, 1, 1); },
  };
  G.monster = function (sp, back) {
    const key = sp.id + (back ? 'b' : 'f');
    if (monCache[key]) return monCache[key];
    const [c, x] = mk(32, 32);
    SHAPES[sp.shape](x, sp.pal);
    finish(x, 32, 32, [24, 18, 14], true);
    if (!back) FACES[sp.shape](x);
    return (monCache[key] = c);
  };

  /* ---------- text + UI: own proportional 5x7 bitmap font, so it looks identical on every machine ---------- */
  const FONT_SRC = `
A .###. #...# #...# ##### #...# #...# #...#
B ####. #...# #...# ####. #...# #...# ####.
C .###. #...# #.... #.... #.... #...# .###.
D ####. #...# #...# #...# #...# #...# ####.
E ##### #.... #.... ####. #.... #.... #####
F ##### #.... #.... ####. #.... #.... #....
G .###. #...# #.... #.### #...# #...# .###.
H #...# #...# #...# ##### #...# #...# #...#
I .###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.
J ..### ...#. ...#. ...#. ...#. #..#. .##..
K #...# #..#. #.#.. ##... #.#.. #..#. #...#
L #.... #.... #.... #.... #.... #.... #####
M #...# ##.## #.#.# #.#.# #...# #...# #...#
N #...# ##..# #.#.# #..## #...# #...# #...#
O .###. #...# #...# #...# #...# #...# .###.
P ####. #...# #...# ####. #.... #.... #....
Q .###. #...# #...# #...# #.#.# #..#. .##.#
R ####. #...# #...# ####. #.#.. #..#. #...#
S .#### #.... #.... .###. ....# ....# ####.
T ##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..
U #...# #...# #...# #...# #...# #...# .###.
V #...# #...# #...# #...# #...# .#.#. ..#..
W #...# #...# #...# #.#.# #.#.# ##.## #...#
X #...# #...# .#.#. ..#.. .#.#. #...# #...#
Y #...# #...# .#.#. ..#.. ..#.. ..#.. ..#..
Z ##### ....# ...#. ..#.. .#... #.... #####
0 .###. #...# #..## #.#.# ##..# #...# .###.
1 ..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.
2 .###. #...# ....# ...#. ..#.. .#... #####
3 ####. ....# ....# .###. ....# ....# ####.
4 ...#. ..##. .#.#. #..#. ##### ...#. ...#.
5 ##### #.... ####. ....# ....# #...# .###.
6 .###. #.... #.... ####. #...# #...# .###.
7 ##### ....# ...#. ..#.. .#... .#... .#...
8 .###. #...# #...# .###. #...# #...# .###.
9 .###. #...# #...# .#### ....# ....# .###.
a ..... ..... .###. ....# .#### #...# .####
b #.... #.... #.##. ##..# #...# ##..# #.##.
c ..... ..... .###. #...# #.... #...# .###.
d ....# ....# .##.# #..## #...# #..## .##.#
e ..... ..... .###. #...# ##### #.... .###.
f ..##. .#..# .#... ###.. .#... .#... .#...
g ..... ..... .#### #...# #...# .#### ....# .###.
h #.... #.... #.##. ##..# #...# #...# #...#
i ..#.. ..... .##.. ..#.. ..#.. ..#.. .###.
j ...#. ..... ..##. ...#. ...#. ...#. ...#. .##..
k #.... #.... #..#. #.#.. ##... #.#.. #..#.
l .##.. ..#.. ..#.. ..#.. ..#.. ..#.. .###.
m ..... ..... ##.#. #.#.# #.#.# #.#.# #.#.#
n ..... ..... #.##. ##..# #...# #...# #...#
o ..... ..... .###. #...# #...# #...# .###.
p ..... ..... ####. #...# #...# ####. #.... #....
q ..... ..... .#### #...# #...# .#### ....# ....#
r ..... ..... #.##. ##..# #.... #.... #....
s ..... ..... .#### #.... .###. ....# ####.
t .#... .#... ###.. .#... .#... .#..# ..##.
u ..... ..... #...# #...# #...# #..## .##.#
v ..... ..... #...# #...# #...# .#.#. ..#..
w ..... ..... #...# #...# #.#.# #.#.# .#.#.
x ..... ..... #...# .#.#. ..#.. .#.#. #...#
y ..... ..... #...# #...# #...# .#### ....# .###.
z ..... ..... ##### ...#. ..#.. .#... #####
. ..... ..... ..... ..... ..... .##.. .##..
, ..... ..... ..... ..... ..... .##.. .##.. .#...
! ..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..
? .###. #...# ....# ...#. ..#.. ..... ..#..
: ..... .##.. .##.. ..... .##.. .##.. .....
; ..... .##.. .##.. ..... .##.. .##.. .#...
' ..#.. ..#.. .#... ..... ..... ..... .....
" .#.#. .#.#. ..... ..... ..... ..... .....
- ..... ..... ..... ##### ..... ..... .....
+ ..... ..#.. ..#.. ##### ..#.. ..#.. .....
( ...#. ..#.. .#... .#... .#... ..#.. ...#.
) .#... ..#.. ...#. ...#. ...#. ..#.. .#...
/ ....# ....# ...#. ..#.. .#... #.... #....
% ##..# ##..# ...#. ..#.. .#... #..## #..##
& .##.. #..#. #.#.. .#... #.#.# #..#. .##.#
= ..... ..... ##### ..... ##### ..... .....
< ...#. ..#.. .#... #.... .#... ..#.. ...#.
> .#... ..#.. ...#. ....# ...#. ..#.. .#...
* ..... #.#.# .###. ##### .###. #.#.# .....
_ ..... ..... ..... ..... ..... ..... #####
`;
  const GLYPH = {};
  FONT_SRC.trim().split('\n').forEach((ln) => {
    const ch = ln[0], rows = ln.slice(2).split(' ');
    let w = 0; const rects = [];
    rows.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') { rects.push([x, y]); w = Math.max(w, x + 1); } });
    GLYPH[ch] = { w, rects };
  });
  const adv = (ch) => (ch === ' ' ? 3 : (GLYPH[ch] || GLYPH['?']).w + 1);
  G.measure = (str) => { let w = 0; for (const ch of str) w += adv(ch); return Math.max(0, w - 1); };
  G.text = function (ctx, str, X, Y, color) {
    ctx.fillStyle = color || '#2b2118'; X = Math.round(X); Y = Math.round(Y);
    let cx = X;
    for (const ch of str) {
      if (ch !== ' ') { const g = GLYPH[ch] || GLYPH['?']; for (const [x, y] of g.rects) ctx.fillRect(cx + x, Y + y, 1, 1); }
      cx += adv(ch);
    }
    return cx - X;
  };
  G.box = function (x, X, Y, W, H, dark) {
    R(x, dark ? '#1a1610' : '#3b3222', X, Y, W, H);
    R(x, dark ? '#e8d9b0' : '#f3ead0', X + 1, Y + 1, W - 2, H - 2);
    R(x, dark ? '#1a1610' : '#8a7448', X + 2, Y + 2, W - 4, H - 4);
    R(x, dark ? '#2a241a' : '#fbf6e6', X + 3, Y + 3, W - 6, H - 6);
  };
  G.bar = function (x, X, Y, W, frac) {
    R(x, '#1a1610', X - 1, Y - 1, W + 2, 5); R(x, '#4a4a4a', X, Y, W, 3);
    const col = frac > 0.5 ? '#3fcf5a' : frac > 0.2 ? '#f0c030' : '#e8433a';
    R(x, col, X, Y, Math.max(0, Math.round(W * frac)), 3);
  };
  G.wrap = function (str, maxPx) {
    const out = []; let line = '';
    str.split(' ').forEach((w) => { const t = line ? line + ' ' + w : w; if (G.measure(t) > maxPx && line) { out.push(line); line = w; } else line = t; });
    if (line) out.push(line); return out;
  };
})();
