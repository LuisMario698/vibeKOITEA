// Hojas de contacto para revisión: por versión y vuelta, cuadros a mitad de cada capítulo (pared completa).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const out = process.argv[2]; const scale = +(process.argv[3] || 0.3);
(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:40329' } });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../dev/index.html'));
  await page.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 });
  const vs = await page.evaluate(() => KT.versions.map(v => ({ id: v.id, d: v.duration, n: v.cycles || 1, ch: (v.chapters || []).map(c => [c.t, c.label]), take: v.takeover || null, format: v.format })));
  for (const v of vs) {
    for (let c = 0; c < v.n; c++) {
      const times = v.ch.map((x, i) => { const end = i < v.ch.length - 1 ? v.ch[i + 1][0] : v.d; return +(x[0] + (end - x[0]) * 0.55).toFixed(2); });
      if (v.take && v.take.cycle === c) times.push(+(v.take.t + 3).toFixed(2), +(v.take.t + 5.5).toFixed(2));
      const data = await page.evaluate(({ id, times, c, scale }) => {
        const W = Math.round(1080 * scale), H = Math.round(1920 * scale), G = Math.round(KT.GAP * scale), pad = 14, lab = 28;
        const cols = times.length, sheet = document.createElement('canvas');
        sheet.width = (W * 3 + G * 2) + pad * 2; sheet.height = (H + lab + pad) * cols + pad; const sg = sheet.getContext('2d');
        sg.fillStyle = '#2b2523'; sg.fillRect(0, 0, sheet.width, sheet.height);
        times.forEach((t, r) => {
          const y = pad + r * (H + lab + pad);
          sg.fillStyle = '#fff'; sg.font = '600 18px sans-serif'; sg.fillText(id + ' · vuelta ' + (c + 1) + ' · t=' + t + ' s', pad, y + 18);
          ['L', 'C', 'R'].forEach((s, i) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; KT.renderAt(id, t, s, cv, c); sg.drawImage(cv, pad + i * (W + G), y + lab); });
        });
        return sheet.toDataURL('image/png');
      }, { id: v.id, times, c, scale });
      const f = path.join(out, `${v.id}_vuelta${c + 1}.png`);
      fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
      console.log(f, times.join(','));
    }
  }
  console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await browser.close();
})();
