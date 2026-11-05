// Tiempo de render por cuadro en la página real (vista Pared, 1440 px), por versión.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve(__dirname, '../dev/index.html'));
  await p.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 });
  for (const id of ['v1', 'v2', 'v3', 'v4', 'v5']) {
    const r = await p.evaluate(async id => {
      location.hash = id; await new Promise(r => setTimeout(r, 300));
      const v = KT.versions.find(x => x.id === id), cvs = ['L', 'C', 'R'].map(s => document.getElementById('cv-' + s));
      const N = 40; const t0 = performance.now();
      for (let k = 0; k < N; k++) { const t = (k / N) * v.duration; ['L', 'C', 'R'].forEach((s, i) => { if (v.format === 'triple' || s === 'C') KT.renderAt(id, t, s, cvs[i], 0); }); }
      return { ms: (performance.now() - t0) / N, w: cvs[1].width };
    }, id);
    console.log(id, 'ms/cuadro (3 pantallas, ancho de lienzo ' + r.w + ' px):', r.ms.toFixed(1));
  }
  await b.close();
})();
