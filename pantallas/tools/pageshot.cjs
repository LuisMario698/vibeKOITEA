// Captura de la página completa. uso: node tools/pageshot.cjs out.png [ancho] [alto] [light|dark] [full] [hash] [page=dist|dev]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [,, out, w = '1400', h = '1000', scheme = 'light', full = 'no', hash = '', pg = 'dev'] = process.argv;
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:40329' } });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: scheme });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', pg === 'dist' ? 'dist/index.html' : 'dev/index.html') + (hash ? '#' + hash : ''));
  await page.waitForFunction(() => window.__ktReady === true, null, { timeout: 20000 }).catch(() => errs.push('timeout'));
  await page.waitForTimeout(2500);
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (ov.sw > ov.cw) errs.push('HORIZONTAL OVERFLOW ' + JSON.stringify(ov));
  await page.screenshot({ path: out, fullPage: full === 'full' });
  console.log(errs.length ? errs.join('\n') : 'ok, no errors', JSON.stringify(ov));
  await browser.close();
})();
