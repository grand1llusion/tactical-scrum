/* coa.js: COA comparison mini-game (MDMP step 5). By hand with simple 1-3 weights, or GenAI.mil-assisted
   with finer weights and a sensitivity sweep. The human sets criteria weights; the AI only computes. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const CRIT = [['time', 'Time to open'], ['sec', 'Far-bank security'], ['mkt', "Brenmoor's market road"], ['wx', 'Weather risk'], ['eng', 'Engineer assets needed']];
  const COAS = [
    { id: 'K', name: 'Kessel Bridge (bridge laid beside it)', r: { time: 1, sec: 3, mkt: 2, wx: 3, eng: 1 } },
    { id: 'M', name: 'Mill Ford', r: { time: 3, sec: 1, mkt: 2, wx: 2, eng: 2 }, fixed: { time: 1, wx: 1 } },
    { id: 'O', name: 'Otter Bend', r: { time: 2, sec: 3, mkt: 3, wx: 1, eng: 2 } },
  ];
  const WHY = { K: 'Light vehicles only until a bridge is laid; the bridge company needs lead time (strips 1, 6). Route Copper culverts (7). Nothing seen on the far bank (5). A laid bridge rides out the rain.',
    M: 'Shallow on the day-3 card (2), but an observation team sits on Hill 214 (5).', O: 'Firm banks, off the main route (3), nothing seen nearby (5), but thigh deep with a fast current.' };
  let st, done;

  function score(w, fixed) {
    return COAS.map((c) => { const r = Object.assign({}, c.r, fixed && c.fixed ? c.fixed : {}); return { c, total: CRIT.reduce((s, [k]) => s + r[k] * w[k], 0), r }; }).sort((a, b) => b.total - a.total);
  }
  function sweep() {
    const base = score(st.w, st.checked)[0].c.id, out = [];
    CRIT.forEach(([k, label]) => {
      for (let v = 1; v <= 5; v++) {
        if (v === st.w[k]) continue;
        const w = Object.assign({}, st.w, { [k]: v }), win = score(w, st.checked)[0].c;
        if (win.id !== base) { out.push(label + ' at ' + v + ' → ' + win.name.split(' (')[0] + ' wins'); break; }
      }
    });
    return out;
  }
  function render() {
    const body = $('#mbody'), max = st.mode === 'hand' ? 3 : 5;
    const res = score(st.w, st.checked), win = res[0].c.id;
    let h = '<div class="coa">';
    h += '<p>' + (st.mode === 'hand' ? '<b>By hand:</b> weights 1 to 3, the way most staffs do it on a whiteboard. Simple math, fast to brief.' : '<b>GenAI.mil-assisted:</b> weights 1 to 5 and a sensitivity sweep. <i>You</i> set the criteria and weights from the commander\'s guidance; GenAI.mil only does the math.') + '</p>';
    h += '<p class="xwalk">COL Hart: "Open a crossing the lead battalion can use within 72 hours, with the far bank secure and traffic under control, without shutting down Brenmoor\'s market road." Rain in about 36 hours (strip 4).</p>';
    h += '<table><tr><th>Criterion</th><th>Weight</th>' + COAS.map((c) => '<th>' + c.name.split(' (')[0] + '</th>').join('') + '</tr>';
    CRIT.forEach(([k, label]) => {
      h += '<tr><td>' + label + '</td><td><input type="range" min="1" max="' + max + '" value="' + Math.min(max, st.w[k]) + '" data-k="' + k + '" aria-label="Weight for ' + label + '"> ' + st.w[k] + '</td>';
      COAS.forEach((c) => { const stale = st.checked && c.fixed && c.fixed[k] != null; const v = stale ? c.fixed[k] : c.r[k]; h += '<td' + (stale ? ' class="stale" title="Corrected: the day-3 card was last month\'s (strip 11)"' : '') + '>' + v + '</td>'; });
      h += '</tr>';
    });
    h += '<tr><td><b>Weighted total</b></td><td></td>' + COAS.map((c) => { const t = res.find((x) => x.c === c).total; return '<td class="' + (c.id === win ? 'win' : '') + '">' + t + '</td>'; }).join('') + '</tr></table>';
    h += '<p class="mini">Ratings: 3 is best. ' + COAS.map((c) => '<b>' + c.name.split(' (')[0] + ':</b> ' + WHY[c.id]).join(' ') + '</p>';
    if (st.mode === 'ai') {
      h += '<p>' + (st.checked ? '<span class="pos">Sources checked:</span> the Mill Ford depth came from last month\'s day-3 card (strip 11). Its time and weather ratings are corrected.' : 'GenAI.mil took the ratings as given. It has not checked how current each source is.') + '</p>';
      if (st.swept) { const s = sweep(); h += '<p><b>Sensitivity sweep</b> (one weight at a time, others unchanged): ' + (s.length ? s.join('; ') : 'no single weight change flips the winner') + '.</p>'; }
    }
    h += '</div>';
    body.innerHTML = h;
    body.querySelectorAll('input[type=range]').forEach((r) => { r.oninput = () => { st.w[r.dataset.k] = +r.value; st.touched = true; render(); }; });
  }
  function buttons() {
    const o = $('#mopts'); o.innerHTML = '';
    const row = el('div', ''); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    const tab = (mode, label) => { const b = el('button', st.mode === mode ? 'primary' : '', label); b.onclick = () => { st.mode = mode; if (mode === 'hand') Object.keys(st.w).forEach((k) => { st.w[k] = Math.min(3, st.w[k]); }); render(); buttons(); }; row.append(b); };
    tab('hand', 'By hand (1 to 3)'); tab('ai', 'GenAI.mil-assisted (1 to 5)');
    o.append(row);
    if (st.mode === 'ai') {
      const c = el('button', '', st.checked ? 'Sources checked' : 'Ask GenAI.mil to list each rating\'s source and date'); c.disabled = st.checked; c.onclick = () => { st.checked = true; render(); buttons(); };
      const s = el('button', '', 'Run the sensitivity sweep'); s.onclick = () => { st.swept = true; render(); };
      o.append(c, s);
    }
    const rec = el('button', 'primary', 'Recommend the top COA to COL Hart'); rec.onclick = recommend; o.append(rec);
  }
  function recommend() {
    const res = score(st.w, st.checked), win = res[0].c, w = st.w;
    let pts = 0; const notes = [];
    const intent = ['time', 'sec', 'mkt'].every((k) => w[k] >= w.eng);
    if (intent) { pts += 20; notes.push(['+20', 'Your weights follow the commander\'s intent (time, security, market road at least as heavy as engineer assets).']); } else notes.push(['0', 'Your weights put engineer assets above what COL Hart named in his intent.']);
    if (st.mode === 'ai' && st.checked) { pts += 20; notes.push(['+20', 'You made GenAI.mil show its sources and caught the stale Mill Ford card.']); }
    else if (st.mode === 'ai') notes.push(['0', 'You trusted GenAI.mil\'s inputs without asking where they came from.']);
    if (st.mode === 'ai' && st.swept) { pts += 20; notes.push(['+20', 'You ran the sensitivity sweep, so you know how fragile the result is.']); }
    if (win.id === 'K') { pts += 40; notes.push(['+40', 'Inject 4 lands: the rain came a day early and both fords are unusable for three days. Your recommendation holds.']); }
    else if (st.swept) { pts += 20; notes.push(['+20', 'Inject 4 lands: the fords are underwater. You recommended a ford, but the sweep showed the weather weight could flip it, so you were ready to adapt.']); }
    else notes.push(['0', 'Inject 4 lands: the rain came a day early and both fords are unusable. Your recommendation is underwater.']);
    $('#mtitle').textContent = 'You recommended ' + win.name + ' · ' + pts + ' practice points';
    $('#mbody').innerHTML = '<table class="score">' + notes.map(([p, t]) => '<tr><td>' + t + '</td><td class="n ' + (p === '0' ? '' : 'pos') + '">' + p + '</td></tr>').join('') + '</table>' +
      '<div class="lesson">The lesson: a staff weighting is simple on purpose so humans can do it fast. GenAI.mil makes finer weights and a sensitivity sweep cheap, which shows how fragile a result is. But people pick the criteria and weights from the commander\'s guidance, people check that the inputs are current, and the commander decides.</div>';
    const o = $('#mopts'); o.innerHTML = '';
    const again = el('button', '', 'Try again'); again.onclick = () => window.COA.open(done);
    const back = el('button', 'primary', 'Done'); back.onclick = () => { $('#modal').hidden = true; if (done) done(); };
    o.append(again, back);
  }
  window.COA = {
    open(onClose) {
      done = onClose; st = { mode: 'hand', w: { time: 1, sec: 1, mkt: 1, wx: 1, eng: 1 }, checked: false, swept: false };
      $('#modal').hidden = false; $('#mtag').hidden = false; $('#mtag').textContent = 'MDMP 5 · COA comparison (practice)'; $('#mwho').textContent = 'Decision matrix';
      $('#mtitle').textContent = 'Compare three crossing COAs'; $('#mhelp').innerHTML = '';
      render(); buttons();
    },
  };
})();
