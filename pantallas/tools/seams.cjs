// Prueba de costuras: |cuadro(c, d−1/30) − cuadro(c+1, 0)| comparado con la diferencia típica entre cuadros vecinos.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../dev/index.html'));
  await p.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 });
  const res = await p.evaluate(() => {
    const W = 270, H = 480, dt = 1 / 30, out = [];
    const cv = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
    const grab = (id, t, s, c) => { const k = cv(); KT.renderAt(id, t, s, k, c); return k.getContext('2d').getImageData(0, 0, W, H).data; };
    const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return s / (a.length / 4) / 3; };
    for (const v of KT.versions) {
      const n = v.cycles || 1, slots = v.format === 'triple' ? ['L', 'C', 'R'] : ['C'];
      for (let c = 0; c < n; c++) {
        for (const s of slots) {
          const seam = diff(grab(v.id, v.duration - dt, s, c), grab(v.id, 0, s, (c + 1) % n));
          let typ = 0, mx = 0; const samples = 12;
          for (let k = 0; k < samples; k++) { const t = (k + 0.37) * v.duration / samples; const d = diff(grab(v.id, t, s, c), grab(v.id, t + dt, s, c)); typ += d; mx = Math.max(mx, d); }
          const det = diff(grab(v.id, 12.345, s, c), grab(v.id, 12.345, s, c));
          out.push({ v: v.id, c, s, seam: +seam.toFixed(2), typ: +(typ / samples).toFixed(2), max: +mx.toFixed(2), det: +det.toFixed(3) });
        }
      }
    }
    return out;
  });
  res.forEach(r => console.log(`${r.v} vuelta ${r.c + 1}→${(r.c + 1) % 3 + 1} ${r.s}: costura ${r.seam} · típica ${r.typ} · máx ${r.max} · determinismo ${r.det}${r.seam > Math.max(1.5, r.max * 1.5) ? '  <-- SALTO' : ''}`));
  await b.close();
})();
