const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve(__dirname, '../dev/index.html'));
  await p.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 });
  for (const id of ['v1', 'v2', 'v3', 'v4', 'v5']) {
    await p.evaluate(id => { location.hash = id; }, id);
    await p.waitForTimeout(600);
    await p.evaluate(() => document.getElementById('stage').scrollIntoView({ block: 'center' }));
    const r = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); let worst = 0, last = t0; function f(now) { worst = Math.max(worst, now - last); last = now; n++; if (now - t0 < 3000) requestAnimationFrame(f); else res({ fps: n / ((now - t0) / 1000), worst }); } requestAnimationFrame(f); }));
    console.log(id, 'fps', r.fps.toFixed(1), 'peor intervalo', r.worst.toFixed(0), 'ms');
  }
  await b.close();
})();
