// uso: node tools/snap.cjs <html relativo a pantallas/> <out.png> [ancho] [alto] [esperaMs]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [,, rel, out, w = '1800', h = '900', wait = '600'] = process.argv;
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:40329' } });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', rel));
  await page.waitForFunction(() => window.done === true, null, { timeout: 15000 }).catch(() => errs.push('timeout waiting done'));
  await page.waitForTimeout(+wait);
  await page.screenshot({ path: out });
  if (errs.length) console.log(errs.join('\n'));
  await browser.close();
})();
