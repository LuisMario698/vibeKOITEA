// Renderiza cuadros de una versión a PNG (pared completa con el hueco real entre pantallas).
// uso: node tools/shoot.cjs --v v1 --t 0,4.5,9 [--scale 0.5] [--out dir] [--page dist|dev] [--slots] [--perf]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2); const opt = {};
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) { const k = args[i].slice(2); const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true; opt[k] = v; } }
const ROOT = path.resolve(__dirname, '..');
const pageFile = path.join(ROOT, opt.page === 'dist' ? 'dist/index.html' : 'dev/index.html');
const out = path.resolve(opt.out || path.join(ROOT, 'shots')); fs.mkdirSync(out, { recursive: true });
const scale = +(opt.scale || 0.5);
(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:40329' } });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + pageFile);
  await page.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 }).catch(() => errs.push('timeout: __ktReady'));
  const ids = opt.v ? String(opt.v).split(',') : await page.evaluate(() => KT.versions.map(v => v.id));
  for (const id of ids) {
    const info = await page.evaluate(id => { const v = KT.versions.find(x => x.id === id); return v ? { d: v.duration, f: v.format, ch: (v.chapters || []).map(c => c.t) } : null; }, id);
    if (!info) { errs.push('no existe ' + id); continue; }
    let times = opt.t ? String(opt.t).split(',').map(Number) : info.ch.map(t => t + 1.5).concat([info.d - 0.05]);
    for (const t of times) {
      const res = await page.evaluate(({ id, t, scale, slots, cycle }) => {
        const v = KT.versions.find(x => x.id === id), W = Math.round(1080 * scale), H = Math.round(1920 * scale), G = Math.round(KT.GAP * scale);
        const full = document.createElement('canvas'); full.width = W * 3 + G * 2; full.height = H; const fg = full.getContext('2d');
        fg.fillStyle = '#E6D3BA'; fg.fillRect(0, 0, full.width, full.height);
        const per = {}, times = {};
        ['L', 'C', 'R'].forEach((s, i) => {
          const c = document.createElement('canvas'); c.width = W; c.height = H;
          const t0 = performance.now(); KT.renderAt(id, t, s, c, cycle); times[s] = performance.now() - t0;
          fg.drawImage(c, i * (W + G), 0);
          if (slots) per[s] = c.toDataURL('image/png');
        });
        return { wall: full.toDataURL('image/png'), per, times };
      }, { id, t, scale, slots: !!opt.slots, cycle: +(opt.cycle || 0) });
      const name = `${id}${opt.cycle ? '_c' + opt.cycle : ''}_t${String(t).replace('.', '_')}`;
      fs.writeFileSync(path.join(out, name + '_wall.png'), Buffer.from(res.wall.split(',')[1], 'base64'));
      for (const s of Object.keys(res.per)) fs.writeFileSync(path.join(out, `${name}_${s}.png`), Buffer.from(res.per[s].split(',')[1], 'base64'));
      console.log(name, 'ms L/C/R:', Object.values(res.times).map(x => x.toFixed(1)).join('/'));
    }
    if (opt.perf) {
      const perf = await page.evaluate(({ id, d }) => {
        const c = document.createElement('canvas'); c.width = 540; c.height = 960; const N = 60, res = {};
        ['L', 'C', 'R'].forEach(s => { const t0 = performance.now(); for (let k = 0; k < N; k++) KT.renderAt(id, (k / N) * d, s, c); res[s] = ((performance.now() - t0) / N).toFixed(2); });
        return res;
      }, { id, d: info.d });
      console.log(id, 'avg ms/frame @540w:', JSON.stringify(perf));
    }
  }
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n')); else console.log('no console errors');
  await browser.close();
})();
