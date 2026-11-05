// Exporta una versión a MP4 H.264 cuadro por cuadro (render determinista por tiempo).
// uso: node tools/export.cjs --v v1 [--fps 30] [--cycles all|1] [--out carpeta] [--preview] [--from 0 --to 10]
//   central  → <id>_C_1080x1920_30p.mp4 (+ versión girada para USB: _USB_1920x1080.mp4)
//   tres     → <id>_L/C/R_1080x1920_30p.mp4 con exactamente los mismos cuadros
//   --preview → además un MP4 de la pared completa a 1280 px de ancho, para enviar por mensaje
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) { const k = args[i].slice(2); const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true; opt[k] = v; }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(opt.out || path.join(ROOT, 'export')); fs.mkdirSync(OUT, { recursive: true });
const FPS = +(opt.fps || 30);

function ff(argsList, name) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...argsList], { stdio: ['pipe', 'inherit', 'inherit'] });
  p.on('exit', c => { if (c) console.error('ffmpeg falló en', name, c); });
  return p;
}
const H264 = ['-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-maxrate', '12M', '-bufsize', '24M', '-g', String(FPS * 2), '-movflags', '+faststart'];
const write = (p, buf) => new Promise(res => { if (!p.stdin.write(buf)) p.stdin.once('drain', res); else res(); });
const close = p => new Promise(res => { p.on('exit', res); p.stdin.end(); });

(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:40329' } });
  const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(ROOT, 'dev/index.html'));
  await page.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 });
  const v = await page.evaluate(id => { const v = KT.versions.find(x => x.id === id); return v && { id: v.id, d: v.duration, n: v.cycles || 1, format: v.format, name: v.name }; }, opt.v);
  if (!v) throw new Error('No existe la versión ' + opt.v);
  const cycles = opt.cycles === '1' ? 1 : v.n;
  const total = Math.round(v.d * FPS) * cycles;
  const from = opt.from != null ? Math.round(+opt.from * FPS) : 0, to = opt.to != null ? Math.round(+opt.to * FPS) : total;
  const triple = v.format === 'triple';
  const W = triple ? 3720 : 1080, H = 1920;
  // lienzo de trabajo dentro de la página
  await page.evaluate(({ W, H }) => { const c = document.createElement('canvas'); c.id = 'xp'; c.width = W; c.height = H; c.style.cssText = 'position:fixed;left:0;top:0;'; document.body.appendChild(c); }, { W, H });
  const base = `${v.id}_${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const outs = triple ? ['L', 'C', 'R'] : ['C'];
  const procs = {};
  outs.forEach((s, i) => {
    const crop = triple ? ['-vf', `crop=1080:1920:${i * 1320}:0`] : [];
    procs[s] = ff(['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', ...crop, ...H264, path.join(OUT, `${base}_${s}_1080x1920_${FPS}p.mp4`)], s);
  });
  let prev = null;
  if (opt.preview) {
    prev = ff(['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-vf', triple ? 'scale=1280:-2' : 'scale=540:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '24', '-movflags', '+faststart', path.join(OUT, `${base}_preview.mp4`)], 'preview');
  }
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    const cyc = Math.floor(f / Math.round(v.d * FPS)), t = (f % Math.round(v.d * FPS)) / FPS;
    const b64 = await page.evaluate(({ id, t, cyc, triple }) => {
      const c = document.getElementById('xp'), g = c.getContext('2d');
      g.fillStyle = '#E6D3BA'; g.setTransform(1, 0, 0, 1, 0, 0); g.fillRect(0, 0, c.width, c.height);
      const tmp = window.__xpTmp || (window.__xpTmp = Object.assign(document.createElement('canvas'), { width: 1080, height: 1920 }));
      (triple ? ['L', 'C', 'R'] : ['C']).forEach((s, i) => { KT.renderAt(id, t, s, tmp, cyc); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, i * 1320, 0); });
      const d = g.getImageData(0, 0, c.width, c.height).data;
      // base64 por bloques (evita límites de argumentos)
      let s = ''; const CH = 0x8000;
      for (let i = 0; i < d.length; i += CH) s += String.fromCharCode.apply(null, d.subarray(i, i + CH));
      return btoa(s);
    }, { id: v.id, t, cyc, triple });
    const buf = Buffer.from(b64, 'base64');
    await Promise.all(outs.map(s => write(procs[s], buf)).concat(prev ? [write(prev, buf)] : []));
    if ((f - from) % (FPS * 5) === 0) { const el = (Date.now() - t0) / 1000, done = f - from + 1; console.log(`${v.id}: ${done}/${to - from} cuadros · ${(el / done * 1000).toFixed(0)} ms/cuadro · faltan ~${Math.round((to - from - done) * el / done)} s`); }
  }
  await Promise.all(outs.map(s => close(procs[s])).concat(prev ? [close(prev)] : []));
  // versión para USB de TV de consumo (girada 90° en sentido horario: la TV se giró a la derecha)
  if (!triple && !opt.nousb) {
    await new Promise(res => { const p = ff(['-i', path.join(OUT, `${base}_C_1080x1920_${FPS}p.mp4`), '-vf', 'transpose=2', ...H264, path.join(OUT, `${base}_USB_1920x1080_${FPS}p.mp4`)], 'usb'); p.on('exit', res); p.stdin.end(); });
  }
  console.log('listo en', ((Date.now() - t0) / 1000).toFixed(0), 's →', OUT);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
