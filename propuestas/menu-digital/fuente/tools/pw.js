// Helper Playwright compartido para probar los prototipos de Koi Tea.
// Uso: const {open} = require('/ruta/koi5/tools/pw.js');
//      const {browser, page, errors} = await open('/ruta/archivo.html', {width:390, height:844, dark:false});
// - Carga vía file:// con proxy configurado para que Google Fonts cargue.
// - Junta errores de consola y de página en `errors`.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
async function open(file, opts = {}) {
  const { width = 390, height = 844, dark = false, scale = 1, reducedMotion = false, isMobile = true } = opts;
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:44373', bypass: 'localhost,127.0.0.1' } });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: dark ? 'dark' : 'light', reducedMotion: reducedMotion ? 'reduce' : 'no-preference', isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[console.${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', r => errors.push(`[requestfailed] ${r.url()} ${r.failure() && r.failure().errorText}`));
  const url = file.startsWith('http') || file.startsWith('file:') ? file : 'file://' + file;
  await page.goto(url, { waitUntil: 'load' });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (e) {}
  await page.waitForTimeout(300);
  return { browser, ctx, page, errors };
}
// Revisa desbordes horizontales: devuelve elementos cuyo borde derecho sale del viewport.
async function overflow(page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth; const out = [];
    if (document.documentElement.scrollWidth > W + 1) out.push({ el: 'document', scrollWidth: document.documentElement.scrollWidth, W });
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width && r.right > W + 1 && cs.position !== 'fixed' && !el.closest('[data-allow-overflow]')) {
        // ignora hijos de contenedores con overflow-x scroll/auto/hidden
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') { clipped = true; break; } p = p.parentElement; }
        if (!clipped) out.push({ el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), right: Math.round(r.right), W });
      }
    });
    return out.slice(0, 30);
  });
}
// Revisa fuentes realmente cargadas.
async function fonts(page) {
  return page.evaluate(() => Array.from(document.fonts || []).filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).filter((v, i, a) => a.indexOf(v) === i));
}
module.exports = { open, overflow, fonts };

// Auditoría automática con axe-core (WCAG 2.x A/AA). Devuelve violaciones resumidas.
async function axe(page, opts = {}) {
  const path = require('path');
  await page.addScriptTag({ path: path.join(__dirname, 'node_modules/axe-core/axe.min.js') });
  return page.evaluate(async (o) => {
    const r = await window.axe.run(o.context || document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 6).map(n => ({ target: n.target.join(' '), summary: (n.failureSummary || '').split('\n').slice(0, 3).join(' ') })) }));
  }, opts);
}
// Objetivos táctiles menores a min px (botones, enlaces, inputs visibles).
async function smallTargets(page, min = 44) {
  return page.evaluate((m) => {
    const out = [];
    document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="radio"], [role="checkbox"], [tabindex]:not([tabindex="-1"])').forEach(el => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') return;
      if (el.type === 'hidden') return;
      if (r.width < m || r.height < m) out.push({ el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    });
    return out.slice(0, 40);
  }, min);
}
module.exports.axe = axe;
module.exports.smallTargets = smallTargets;
