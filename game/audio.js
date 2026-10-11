/* audio.js: chiptune music + sound effects synthesised with WebAudio. No audio files. */
(function () {
  'use strict';
  const A = (window.SND = {});
  let ctx = null, master = null, muted = false, cur = null, timer = null, noiseBuf = null;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freq = (n) => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0; const s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12; return 440 * Math.pow(2, (s - 69) / 12); };
  const parse = (s) => s.trim().split(/\s+/).map((t) => { const [n, b] = t.split(':'); return [n, parseFloat(b || '1')]; });

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.22; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (cur) A.play(cur.name);
  };
  A.toggleMute = function () { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.22; return muted; };

  function tone(t, f, dur, wave, vol, slide) {
    if (!ctx || !f) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + Math.max(0.011, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, hp) {
    if (!ctx) return;
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 3000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }

  /* tracks: bpm, channels [{w: wave, v: volume, n: "note:beats ..."}], drums: pattern string per beat (k=kick h=hat s=snare .=rest) */
  const TRACKS = {
    town: { bpm: 112, ch: [
      { w: 'square', v: 0.30, n: 'E5:1 G5:1 C6:1.5 B5:.5 A5:1 G5:1 E5:2  F5:1 A5:1 D6:1.5 C6:.5 B5:1 A5:1 G5:2  E5:1 G5:1 C6:1.5 E6:.5 D6:1 C6:1 A5:2  G5:1 F5:1 E5:1 D5:1 C5:4' },
      { w: 'triangle', v: 0.50, n: 'C3:2 G3:2 C3:2 G3:2  F3:2 C4:2 F3:2 C4:2  A2:2 E3:2 A2:2 E3:2  G2:2 D3:2 G2:4' },
      { w: 'square', v: 0.10, n: 'C4:.5 E4:.5 G4:.5 E4:.5 C4:.5 E4:.5 G4:.5 E4:.5 C4:.5 E4:.5 G4:.5 E4:.5 C4:.5 E4:.5 G4:.5 E4:.5  F4:.5 A4:.5 C5:.5 A4:.5 F4:.5 A4:.5 C5:.5 A4:.5 F4:.5 A4:.5 C5:.5 A4:.5 F4:.5 A4:.5 C5:.5 A4:.5  A3:.5 C4:.5 E4:.5 C4:.5 A3:.5 C4:.5 E4:.5 C4:.5 A3:.5 C4:.5 E4:.5 C4:.5 A3:.5 C4:.5 E4:.5 C4:.5  G3:.5 B3:.5 D4:.5 B3:.5 G3:.5 B3:.5 D4:.5 B3:.5 C4:4' },
    ], drums: '' },
    battle: { bpm: 168, ch: [
      { w: 'square', v: 0.28, n: 'A4:.5 A4:.5 C5:.5 A4:.5 E5:1 D5:.5 C5:.5  B4:.5 B4:.5 D5:.5 B4:.5 F5:1 E5:.5 D5:.5  A4:.5 A4:.5 C5:.5 A4:.5 E5:1 G5:.5 A5:.5  G5:1 E5:1 D5:1 B4:1' },
      { w: 'sawtooth', v: 0.16, n: 'A2:.5 A2:.5 A3:.5 A2:.5 A2:.5 A3:.5 A2:.5 A3:.5  G2:.5 G2:.5 G3:.5 G2:.5 G2:.5 G3:.5 G2:.5 G3:.5  F2:.5 F2:.5 F3:.5 F2:.5 F2:.5 F3:.5 F2:.5 F3:.5  E2:.5 E2:.5 E3:.5 E2:.5 E2:.5 E3:.5 E2:.5 E3:.5' },
    ], drums: 'k.hsk.hsk.hsk.hs' },
    boss: { bpm: 184, ch: [
      { w: 'square', v: 0.28, n: 'D5:.5 D5:.5 F5:.5 D5:.5 A5:1 G5:.5 F5:.5  C5:.5 C5:.5 E5:.5 C5:.5 G5:1 F5:.5 E5:.5  D5:.5 D5:.5 F5:.5 A5:.5 D6:1 C6:.5 A5:.5  G5:.5 A5:.5 Bb5:.5 A5:.5 G5:1 F5:1' },
      { w: 'sawtooth', v: 0.16, n: 'D2:.5 D3:.5 D2:.5 D3:.5 D2:.5 D3:.5 D2:.5 D3:.5  C2:.5 C3:.5 C2:.5 C3:.5 C2:.5 C3:.5 C2:.5 C3:.5  Bb1:.5 Bb2:.5 Bb1:.5 Bb2:.5 Bb1:.5 Bb2:.5 Bb1:.5 Bb2:.5  A1:.5 A2:.5 A1:.5 A2:.5 A1:.5 A2:.5 A1:.5 A2:.5' },
    ], drums: 'k.hsk.hsk.hsk.hs' },
    win: { bpm: 150, loop: false, ch: [
      { w: 'square', v: 0.3, n: 'C5:.5 C5:.5 C5:.5 C5:1 Ab4:1 Bb4:1 C5:.5 Bb4:.5 C5:3' },
      { w: 'triangle', v: 0.5, n: 'C3:.5 C3:.5 C3:.5 C3:1 Ab2:1 Bb2:1 C3:3.5' },
    ], drums: '' },
    gate: { bpm: 90, ch: [
      { w: 'triangle', v: 0.4, n: 'A3:1 E4:1 A4:1 E4:1  F3:1 C4:1 F4:1 C4:1  G3:1 D4:1 G4:1 D4:1  E3:1 B3:1 E4:2' },
      { w: 'square', v: 0.12, n: 'C5:2 B4:2 A4:2 G4:2  A4:2 G4:2 E4:4' },
    ], drums: '' },
  };

  A.play = function (name) {
    if (cur && cur.name === name) return;
    A.stop();
    const tr = TRACKS[name]; cur = { name, tr };
    if (!ctx) return;
    const spb = 60 / tr.bpm, chans = tr.ch.map((c) => ({ notes: parse(c.n), i: 0, t: 0, c }));
    const len = Math.max(...chans.map((c) => c.notes.reduce((s, n) => s + n[1], 0)));
    cur.start = ctx.currentTime + 0.08; cur.next = chans.map(() => 0); cur.chans = chans; cur.len = len; cur.dstep = 0; cur.dnext = cur.start;
    const pump = () => {
      if (!cur || cur.name !== name) return;
      const horizon = ctx.currentTime + 0.3;
      chans.forEach((c) => {
        for (;;) {
          const when = cur.start + (c.cycle || 0) * len * spb + c.t * spb;
          if (when > horizon) break;
          if ((c.cycle || 0) > 0 && tr.loop === false) break;
          const [n, b] = c.notes[c.i];
          if (n !== '-') tone(when, freq(n), b * spb * 0.95, c.c.w, c.c.v);
          c.t += b; c.i++;
          if (c.i >= c.notes.length) { c.i = 0; c.t = 0; c.cycle = (c.cycle || 0) + 1; }
        }
      });
      if (tr.drums) {
        while (cur.dnext < horizon) {
          const ch = tr.drums[cur.dstep % tr.drums.length];
          if (ch === 'k') tone(cur.dnext, 120, 0.1, 'triangle', 0.5, 0.3);
          else if (ch === 's') noise(cur.dnext, 0.09, 0.35, 1500);
          else if (ch === 'h') noise(cur.dnext, 0.03, 0.15, 6000);
          cur.dnext += spb / 2; cur.dstep++;
        }
      }
    };
    timer = setInterval(pump, 40); pump();
  };
  A.stop = function () { if (timer) clearInterval(timer); timer = null; cur = null; };

  const sfxTable = {
    blip: (t) => tone(t, 880, 0.05, 'square', 0.25),
    select: (t) => { tone(t, 660, 0.05, 'square', 0.25); tone(t + 0.05, 990, 0.07, 'square', 0.25); },
    back: (t) => tone(t, 440, 0.08, 'square', 0.22, 0.6),
    bump: (t) => tone(t, 110, 0.06, 'square', 0.3),
    hit: (t) => { noise(t, 0.16, 0.7, 800); tone(t, 220, 0.14, 'sawtooth', 0.3, 0.3); },
    crit: (t) => { noise(t, 0.2, 0.8, 600); tone(t, 330, 0.18, 'sawtooth', 0.35, 0.25); tone(t + 0.1, 880, 0.12, 'square', 0.25); },
    miss: (t) => tone(t, 300, 0.2, 'triangle', 0.35, 0.4),
    right: (t) => { tone(t, 784, 0.08, 'square', 0.28); tone(t + 0.08, 1047, 0.14, 'square', 0.28); },
    wrong: (t) => { tone(t, 220, 0.12, 'sawtooth', 0.3); tone(t + 0.12, 165, 0.2, 'sawtooth', 0.3); },
    heal: (t) => [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.09, f, 0.12, 'triangle', 0.4)),
    encounter: (t) => { for (let i = 0; i < 8; i++) tone(t + i * 0.05, i % 2 ? 300 : 600, 0.06, 'square', 0.25); },
    throw: (t) => tone(t, 400, 0.4, 'square', 0.2, 2.5),
    shake: (t) => tone(t, 180, 0.1, 'triangle', 0.4),
    caught: (t) => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.1, f, 0.14, 'square', 0.28)),
    faint: (t) => tone(t, 400, 0.6, 'sawtooth', 0.3, 0.1),
    levelup: (t) => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(t + i * 0.08, f, 0.12, 'square', 0.28)),
    item: (t) => [880, 1175, 1568].forEach((f, i) => tone(t + i * 0.07, f, 0.1, 'triangle', 0.4)),
  };
  A.sfx = function (name) { if (ctx && sfxTable[name]) sfxTable[name](ctx.currentTime + 0.005); };
})();
