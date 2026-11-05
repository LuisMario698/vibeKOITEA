/* Motor de la página: selector de versiones, pared con las 3 pantallas, reloj, línea de tiempo y ficha. */
(function () {
  'use strict';
  const KT = window.KT, $ = id => document.getElementById(id);
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtT = s => (Math.floor(s / 60) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : Math.floor(s) + ' s');

  const S = { v: null, view: 'wall', playing: !RM, playhead: 0, cycle: 0, lamps: false, sides: 'hoy', visible: true, states: new Map(), errors: new Set(), dirtySides: true };
  KT.state = S;

  function versions() { return KT.versions.slice().sort((a, b) => a.n - b.n); }
  function byId(id) { return KT.versions.find(v => v.id === id); }

  /* ---------- Construcción del selector ---------- */
  function buildPicker() {
    const box = $('vpick'); if (!box) return;
    box.innerHTML = versions().map(v => `
      <button class="vcard" id="pick-${v.id}" data-id="${v.id}" aria-pressed="false">
        <span class="vnum">Versión ${v.n}</span>
        <b class="vname">${esc(v.name)}</b>
        <span class="vtags"><span class="vtag ${v.format === 'triple' ? 'tri' : 'one'}">${v.format === 'triple' ? 'Tres pantallas' : 'Pantalla central'}</span>${v.pick ? '<span class="vtag pick">Elegida</span>' : ''}</span>
        <span class="vline">${esc(v.tagline || '')}</span>
      </button>`).join('');
    box.querySelectorAll('.vcard').forEach(b => b.addEventListener('click', () => select(b.dataset.id, true)));
  }

  /* ---------- Pared y lienzos ---------- */
  const slots = ['L', 'C', 'R'];
  const cv = {}, cx = {};
  function buildWall() {
    slots.forEach(s => { cv[s] = $('cv-' + s); cx[s] = cv[s].getContext('2d', { alpha: false }); });
    layout();
    window.addEventListener('resize', () => { layout(); });
    document.addEventListener('fullscreenchange', () => { setTimeout(layout, 60); const fb = $('btn-full'); if (fb) fb.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false'); });
  }
  // tamaños: las 3 pantallas con el hueco real entre ellas (240/1080 del ancho)
  function layout() {
    const wall = $('wall'), row = $('tvrow'); if (!wall || !row) return;
    const fs = !!document.fullscreenElement;
    const W = wall.clientWidth, Hmax = fs ? window.innerHeight * 0.86 : Math.min(window.innerHeight * 0.74, 860);
    const gapR = KT.GAP / KT.SW, bez = 0.018;
    let tvW;
    if (S.view === 'wall') {
      tvW = Math.min((W * 0.92) / (3 + 2 * gapR), (Hmax / 16) * 9);
      row.style.setProperty('--gap', Math.round(tvW * gapR - tvW * bez * 2) + 'px');
    } else {
      tvW = Math.min(W * 0.86, (Hmax / 16) * 9, 520);
      row.style.setProperty('--gap', '0px');
    }
    row.style.setProperty('--tvw', Math.floor(tvW) + 'px');
    row.dataset.view = S.view;
    sizeCanvases();
  }
  function sizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    slots.forEach(s => {
      const c = cv[s]; if (!c) return;
      const w = Math.max(90, Math.min(1080, Math.round((c.clientWidth || 200) * dpr)));
      if (c.width !== w) { c.width = w; c.height = Math.round((w * 16) / 9); S.dirtySides = true; }
    });
  }

  /* ---------- Render ---------- */
  function stateFor(v) {
    if (!S.states.has(v.id)) { let st = {}; try { st = (v.setup && v.setup(KT)) || {}; } catch (e) { console.error(v.id, 'setup', e); } S.states.set(v.id, st); }
    return S.states.get(v.id);
  }
  function drawSlot(v, s, t) {
    const c = cv[s], g = cx[s]; if (!c || !c.width) return;
    const sc = c.width / KT.SW;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (v.format !== 'triple' && s !== 'C') { g.setTransform(sc, 0, 0, sc, 0, 0); (S.sides === 'crema' ? KT.sidesCream : KT.legacy)(g, s); return; }
    const x0 = v.format === 'triple' ? KT.X0[s] : 0;
    const view = { slot: s, x0, w: KT.SW, h: KT.SH, worldW: v.format === 'triple' ? KT.WORLD3 : KT.SW, format: v.format, scale: sc, cycle: S.cycle % (v.cycles || 1) };
    g.setTransform(sc, 0, 0, sc, -x0 * sc, 0);
    g.save();
    try { v.draw(g, t, view, stateFor(v)); }
    catch (e) {
      if (!S.errors.has(v.id + s)) { S.errors.add(v.id + s); console.error('Error en ' + v.id + ' (' + s + ')', e); }
      g.restore(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#2A2523'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#FBF3E8'; g.font = `500 ${Math.round(c.width / 16)}px ${KT.F.sans}`; g.textAlign = 'center'; g.fillText('Error de animación', c.width / 2, c.height / 2);
    }
    g.restore();
    g.globalAlpha = 1; g.setLineDash([]); g.globalCompositeOperation = 'source-over';
  }
  function render(t) {
    const v = S.v; if (!v) return;
    const active = S.view === 'wall' ? slots : ['C'];
    active.forEach(s => {
      if (v.format !== 'triple' && s !== 'C') { if (S.dirtySides) drawSlot(v, s, t); return; }
      drawSlot(v, s, t);
    });
    if (S.view === 'wall') S.dirtySides = false;
  }
  KT.renderAt = function (id, t, slot, canvas, cycle, sides) { // usado por las pruebas, el modo kiosco y la exportación
    const v = byId(id); const g = canvas.getContext('2d'); const sc = canvas.width / KT.SW;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (v.format !== 'triple' && slot !== 'C') { g.setTransform(sc, 0, 0, sc, 0, 0); (sides === 'crema' ? KT.sidesCream : KT.legacy)(g, slot); return; }
    const x0 = v.format === 'triple' ? KT.X0[slot] : 0;
    g.setTransform(sc, 0, 0, sc, -x0 * sc, 0); g.save();
    v.draw(g, t, { slot, x0, w: KT.SW, h: KT.SH, worldW: v.format === 'triple' ? KT.WORLD3 : KT.SW, format: v.format, scale: sc, cycle: (cycle || 0) % (v.cycles || 1) }, stateFor(v));
    g.restore();
  };

  /* ---------- Línea de tiempo ---------- */
  function buildTimeline() {
    const v = S.v, track = $('tl-track'), labels = $('tl-labels'); if (!track) return;
    const ch = (v.chapters || [{ t: 0, label: v.name }]).slice().sort((a, b) => a.t - b.t);
    track.innerHTML = ch.map((c, i) => { const end = i < ch.length - 1 ? ch[i + 1].t : v.duration; return `<span class="seg" style="flex:${(end - c.t).toFixed(2)}"><i></i></span>`; }).join('') + '<span class="head" id="tl-head"></span>';
    labels.innerHTML = ch.map((c, i) => { const end = i < ch.length - 1 ? ch[i + 1].t : v.duration; return `<button class="chap" data-t="${c.t}" style="flex:${(end - c.t).toFixed(2)}"><span>${fmtT(c.t)}</span>${esc(c.label)}</button>`; }).join('');
    labels.querySelectorAll('.chap').forEach(b => b.addEventListener('click', () => { seek(+b.dataset.t + 0.01); }));
    $('tl-total').textContent = fmtT(v.duration);
    const tb = $('btn-take');
    if (tb) { tb.hidden = !v.takeover; if (v.takeover) tb.textContent = v.takeover.label || 'Ver la toma de las tres pantallas'; }
  }
  function seek(t) { const v = S.v; S.playhead = KT.clamp(t, 0, v.duration - 0.001); if (!S.playing) { render(KT.wrap(S.playhead, v.duration)); updateTimeline(KT.wrap(S.playhead, v.duration)); } }
  function updateTimeline(t) {
    const v = S.v, head = $('tl-head'); if (!head) return;
    head.style.left = ((t / v.duration) * 100).toFixed(3) + '%';
    const segs = $('tl-track').querySelectorAll('.seg'), ch = (v.chapters || []).slice().sort((a, b) => a.t - b.t);
    segs.forEach((sg, i) => { const a = ch[i] ? ch[i].t : 0, b = i < ch.length - 1 ? ch[i + 1].t : v.duration; const p = KT.clamp((t - a) / (b - a)); sg.firstChild.style.width = (p * 100).toFixed(2) + '%'; sg.classList.toggle('on', t >= a && t < b); });
    const cur = $('tl-cur'); if (cur) cur.textContent = (Math.floor(t * 10) / 10).toFixed(1) + ' s';
    const cyc = $('tl-cyc'); if (cyc) { const n = v.cycles || 1; cyc.hidden = n < 2; cyc.textContent = (v.cycleLabel || 'Ciclo') + ' ' + ((S.cycle % n) + 1) + ' de ' + n; }
    const labels = $('tl-labels').querySelectorAll('.chap'); labels.forEach((l, i) => { const a = ch[i] ? ch[i].t : 0, b = i < ch.length - 1 ? ch[i + 1].t : v.duration; l.classList.toggle('on', t >= a && t < b); });
  }
  function bindScrub() {
    const tr = $('tl-track'); if (!tr) return;
    let drag = false;
    const at = e => { const r = tr.getBoundingClientRect(); return KT.clamp((e.clientX - r.left) / r.width) * S.v.duration; };
    tr.addEventListener('pointerdown', e => { drag = true; tr.setPointerCapture(e.pointerId); seek(at(e)); });
    tr.addEventListener('pointermove', e => { if (drag) seek(at(e)); });
    tr.addEventListener('pointerup', () => { drag = false; });
    tr.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seek(S.playhead + 1); if (e.key === 'ArrowLeft') seek(S.playhead - 1); });
  }

  /* ---------- Ficha de la versión ---------- */
  function buildInfo() {
    const v = S.v, box = $('vinfo'); if (!box) return;
    const I = v.info || {};
    const ch = (v.chapters || []).slice().sort((a, b) => a.t - b.t);
    box.innerHTML = `
      <div class="vi-main">
        <p class="eyebrow">Versión ${v.n} · ${v.format === 'triple' ? 'Tres pantallas sincronizadas' : 'Solo pantalla central'} · loop de ${v.duration} s</p>
        <h2>${esc(v.name)}</h2>
        <p class="lede">${esc(I.concept || '')}</p>
        ${I.why ? `<h3>Por qué encaja con Koi Tea</h3><p>${esc(I.why)}</p>` : ''}
        ${I.signature ? `<div class="sig"><span class="k">Momento firma</span><p>${esc(I.signature)}</p></div>` : ''}
      </div>
      <div class="vi-side">
        <h3>Guion del loop</h3>
        <ol class="beats">${ch.map((c, i) => { const end = i < ch.length - 1 ? ch[i + 1].t : v.duration; return `<li><button data-t="${c.t}"><span class="tt">${c.t}–${end} s</span><b>${esc(c.label)}</b>${c.note ? `<span class="nn">${esc(c.note)}</span>` : ''}</button></li>`; }).join('')}</ol>
        <dl class="specs">${(I.specs || []).map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>
      </div>`;
    box.querySelectorAll('.beats button').forEach(b => b.addEventListener('click', () => { seek(+b.dataset.t + 0.01); $('stage').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); }));
  }

  /* ---------- Selección y controles ---------- */
  function select(id, fromUser) {
    const v = byId(id) || versions()[0]; if (!v) return;
    const changed = S.v !== v; S.v = v; S.dirtySides = true;
    document.querySelectorAll('.vcard').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === v.id ? 'true' : 'false'));
    const card = $('pick-' + v.id), wrap = card && card.closest('.vpick-wrap');
    if (wrap && wrap.scrollWidth > wrap.clientWidth) { const r = card.offsetLeft - (wrap.clientWidth - card.offsetWidth) / 2; wrap.scrollTo({ left: Math.max(0, r), behavior: fromUser && !RM ? 'smooth' : 'auto' }); }
    $('wall').dataset.format = v.format;
    if (changed) { S.cycle = 0; S.playhead = RM ? (v.still != null ? v.still : (v.chapters && v.chapters[1] ? v.chapters[1].t + 2 : 2)) : 0; }
    buildTimeline(); buildInfo(); layout();
    if (fromUser) { try { history.replaceState(null, '', '#' + v.id); } catch (e) { location.hash = v.id; } }
    render(KT.wrap(S.playhead, v.duration)); updateTimeline(KT.wrap(S.playhead, v.duration));
    sidesUI();
  }
  // etiqueta, accesibilidad y selector de laterales según el formato
  function sidesUI() {
    const v = S.v, cream = S.sides === 'crema', central = v.format !== 'triple';
    const lbl = $('stage-label'); if (lbl) lbl.textContent = (!central ? 'Las tres pantallas cuentan una sola escena; las laterales siguen siendo el menú.' : cream ? 'Solo cambia la pantalla central; las laterales se muestran recoloreadas en crema, sin animación.' : 'Solo cambia la pantalla central; las laterales se muestran como están hoy.') + ' Precios ilustrativos.';
    const names = { L: 'izquierda', C: 'central', R: 'derecha' };
    slots.forEach(sl => { if (cv[sl]) cv[sl].setAttribute('aria-label', !central || sl === 'C' ? `${v.name}, pantalla ${names[sl]}: ${v.tagline || ''}` : `Pantalla ${names[sl]}: menú ${cream ? 'recoloreado en crema' : 'como está hoy'}`); });
    const sg = $('sides-seg'); if (sg) sg.hidden = !central;
    document.querySelectorAll('[data-sides-btn]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sidesBtn === S.sides ? 'true' : 'false'));
  }
  function setSides(m) { S.sides = m; S.dirtySides = true; sidesUI(); render(KT.wrap(S.playhead, S.v.duration)); }
  function setPlaying(p) { S.playing = p; const b = $('btn-play'); if (b) { b.setAttribute('aria-pressed', p ? 'true' : 'false'); b.querySelector('span').textContent = p ? 'Pausar' : 'Reproducir'; } }
  function setView(view) {
    S.view = view; S.dirtySides = true;
    document.querySelectorAll('[data-view-btn]').forEach(b => b.setAttribute('aria-pressed', b.dataset.viewBtn === view ? 'true' : 'false'));
    layout(); render(KT.wrap(S.playhead, S.v.duration));
  }
  function bindControls() {
    $('btn-play').addEventListener('click', () => setPlaying(!S.playing));
    $('btn-restart').addEventListener('click', () => { S.cycle = 0; seek(0); });
    const tb = $('btn-take');
    if (tb) tb.addEventListener('click', () => { const v = S.v; if (!v || !v.takeover) return; const n = v.cycles || 1; S.cycle = S.cycle - (S.cycle % n) + v.takeover.cycle; seek(v.takeover.t); if (!S.playing) setPlaying(true); });
    document.querySelectorAll('[data-view-btn]').forEach(b => b.addEventListener('click', () => setView(b.dataset.viewBtn)));
    document.querySelectorAll('[data-sides-btn]').forEach(b => b.addEventListener('click', () => setSides(b.dataset.sidesBtn)));
    const fb = $('btn-full');
    if (fb) fb.addEventListener('click', () => {
      const st = $('stage');
      if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen().catch(() => {}); return; }
      if (st.requestFullscreen) st.requestFullscreen().catch(() => { fb.textContent = 'Pantalla completa no disponible aquí'; });
    });
    const lb = $('btn-lamps');
    if (lb) lb.addEventListener('click', () => { S.lamps = !S.lamps; $('wall').classList.toggle('lamps', S.lamps); lb.setAttribute('aria-pressed', S.lamps ? 'true' : 'false'); });
    window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId(id) && (!S.v || S.v.id !== id)) select(id, false); });
    if ('IntersectionObserver' in window) { new IntersectionObserver(es => es.forEach(e => (S.visible = e.isIntersecting)), { threshold: 0.01 }).observe($('stage')); }
  }

  /* ---------- Bucle ---------- */
  let last = 0;
  function frame(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    if (S.v && S.visible && !document.hidden) {
      if (S.playing) { S.playhead += dt; if (S.playhead >= S.v.duration) { S.playhead -= S.v.duration; S.cycle++; } }
      const t = KT.wrap(S.playhead, S.v.duration);
      if (S.playing || S.needs) { render(t); updateTimeline(t); S.needs = false; }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Modo kiosco: una pantalla a pantalla completa, sincronizada por reloj ----------
     URL: ?screen=L|C|R&v=v3[&gap=240&dy=0&lat=0]. Todas las pantallas calculan el mismo instante a partir de
     la hora (Date.now, disciplinada por chrony en la red del local) y un ancla común: la apertura de Koi Tea. */
  KT.kiosk = function () {
    let q; try { q = new URLSearchParams(location.search); } catch (e) { return false; }
    const slot = (q.get('screen') || '').toUpperCase(); if (!['L', 'C', 'R'].includes(slot)) return false;
    const v = byId(q.get('v') || 'v1') || versions()[0];
    const dy = parseFloat(q.get('dy')) || 0, lat = parseFloat(q.get('lat')) || 0, sides = q.get('sides') === 'crema' ? 'crema' : 'hoy';
    const EPOCH = Date.UTC(2026, 10, 1, 17 + 7, 30);   // 1 nov 2026, 17:30 en Sonora (UTC−7)
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;padding:0;background:#000;overflow:hidden;cursor:none';
    const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block'; document.body.appendChild(c);
    const g = c.getContext('2d', { alpha: false });
    const size = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); };
    size(); window.addEventListener('resize', size);
    try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* opcional */ }
    const tmp = document.createElement('canvas');
    function tick() {
      const total = (Date.now() - EPOCH + lat) / 1000, n = v.cycles || 1;
      const cyc = Math.floor(total / v.duration) % n, t = ((total % v.duration) + v.duration) % v.duration;
      const sc = Math.min(c.width / KT.SW, c.height / KT.SH), w = Math.round(KT.SW * sc), h = Math.round(KT.SH * sc);
      if (tmp.width !== w) { tmp.width = w; tmp.height = h; }
      KT.renderAt(v.id, t, slot, tmp, cyc, sides);
      g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(tmp, Math.round((c.width - w) / 2), Math.round((c.height - h) / 2 + dy * sc));
      requestAnimationFrame(tick);
    }
    KT.fontsReady.then(() => requestAnimationFrame(tick));
    return true;
  };

  KT.boot = function () {
    if (KT.kiosk()) return;
    if (!document.getElementById('wall')) return;
    buildPicker(); buildWall(); bindControls(); bindScrub();
    const first = location.hash.slice(1);
    select(byId(first) ? first : versions()[0].id, false);
    setPlaying(!RM);
    if (RM) { const n = $('rm-note'); if (n) n.hidden = false; }
    requestAnimationFrame(frame);
    KT.fontsReady.then(() => { S.dirtySides = true; S.needs = true; KT._layoutCache.clear(); render(KT.wrap(S.playhead, S.v.duration)); window.__ktReady = true; });
  };
})();
