#!/usr/bin/env node
/* Batería común de pruebas para las 5 versiones del menú Koi Tea.
   Uso: node suite.js /ruta/abs/vN.html [--json] [--shots dir]
   Usa los data-testid definidos en SPEC.md. Cada paso es independiente: si uno falla, sigue con los demás. */
const path = require('path');
const { open, overflow, axe, smallTargets } = require('./pw.js');

const file = process.argv[2];
const asJson = process.argv.includes('--json');
const shotsIdx = process.argv.indexOf('--shots');
const shotsDir = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;
if (!file) { console.error('uso: node suite.js /ruta/vN.html'); process.exit(2); }

const T = id => `[data-testid="${id}"]`;
const results = [];
let taps = 0;
function rec(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) }); }

async function visible(page, id) { const l = page.locator(T(id)).first(); return (await l.count()) > 0 && await l.isVisible().catch(() => false); }
async function tap(page, id, opts = {}) {
  const l = page.locator(T(id)).first();
  if (!(await l.count())) throw new Error(`no existe ${id}`);
  await l.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await l.click({ timeout: opts.timeout || 4000, force: !!opts.force });
  taps++;
  await page.waitForTimeout(opts.wait == null ? 450 : opts.wait);
}
async function text(page, id) { const l = page.locator(T(id)).first(); return (await l.count()) ? (await l.innerText()).replace(/\s+/g, ' ').trim() : null; }
async function pressed(page, id) {
  return page.locator(T(id)).first().evaluate(el => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-checked') === 'true' || el.checked === true || el.getAttribute('aria-selected') === 'true').catch(() => null);
}
async function disabled(page, id) {
  return page.locator(T(id)).first().evaluate(el => el.disabled === true || el.getAttribute('aria-disabled') === 'true').catch(() => null);
}
async function escapeAll(page) { for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } }
async function toMenu(page) { if (await visible(page, 'go-menu')) await tap(page, 'go-menu'); }
async function ensureCart(page) {
  if (await visible(page, 'cart-total') || await visible(page, 'cart-empty')) return;
  if (!(await visible(page, 'open-cart'))) { await escapeAll(page); await toMenu(page); }
  await tap(page, 'open-cart');
}
const has = (s, v) => s != null && s.replace(/[,\s]/g, '').includes(String(v));

(async () => {
  const { browser, page, errors } = await open(file, { width: 390, height: 844 });
  const shot = async n => { if (shotsDir) await page.screenshot({ path: path.join(shotsDir, n + '.png') }); };
  try {
    await shot('00-inicio');
    const K = await page.evaluate(() => !!window.KOI && !!window.KoiCup);
    rec('módulos compartidos cargados', K);
    for (const id of ['lang-es', 'lang-en', 'cur-mxn', 'cur-usd']) rec(`toggle ${id} en el DOM`, (await page.locator(T(id)).count()) > 0);
    await toMenu(page);
    const ids = await page.evaluate(() => window.KOI.drinks.map(d => d.id));
    const missing = [];
    for (const id of ids) if (!(await page.locator(T('drink-' + id)).count())) missing.push(id);
    rec('15 bebidas con drink-<id>', missing.length === 0, missing.length ? 'faltan: ' + missing.join(', ') : '');

    // Toques mínimos para mostrar en caja una Classic Milk Tea por defecto
    taps = 0;
    try {
      if (await page.locator(T('quick-add-classic')).count()) await tap(page, 'quick-add-classic');
      else { await tap(page, 'drink-classic'); await tap(page, 'add-to-cart'); }
      await ensureCart(page);
      await tap(page, 'checkout-counter');
      const code = await text(page, 'order-code');
      rec('pedido rápido llega a caja', /K-[A-Z][2-9]{3}/.test(code || ''), `código ${code}; ${taps} toques`);
      results.minTaps = taps;
    } catch (e) { rec('pedido rápido llega a caja', false, e.message); }
    await escapeAll(page);
    // vaciar carrito
    try { await ensureCart(page); for (let i = 0; i < 6 && await page.locator(T('line-remove')).count(); i++) await tap(page, 'line-remove', { wait: 350 }); rec('carrito se vacía con line-remove', await visible(page, 'cart-empty')); } catch (e) { rec('carrito se vacía con line-remove', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // Flujo A: Taro grande + tapioca + jelly de lichi, 50%, poco hielo, x2
    try {
      await tap(page, 'drink-taro');
      const p0 = await text(page, 'unit-price'); rec('precio base taro $90', has(p0, 90), p0);
      await tap(page, 'size-grande', { wait: 250 }); const p1 = await text(page, 'unit-price'); rec('grande suma $15 → 105', has(p1, 105), p1);
      rec('tapioca preseleccionada en taro', await pressed(page, 'topping-tapioca'));
      await tap(page, 'topping-jelly-lichi', { wait: 250 }); const p2 = await text(page, 'unit-price'); rec('segundo topping suma $15 → 120', has(p2, 120), p2);
      rec('topping agotado deshabilitado (pop-cereza)', await disabled(page, 'topping-pop-cereza'));
      // límite de 3 toppings
      await tap(page, 'topping-pop-mango', { wait: 200 }); await tap(page, 'topping-jelly-cafe', { wait: 250 });
      const sel = []; for (const t of ['tapioca', 'jelly-lichi', 'pop-mango', 'jelly-cafe']) sel.push(await pressed(page, 'topping-' + t));
      rec('máximo 3 toppings', sel.filter(Boolean).length === 3, JSON.stringify(sel));
      // regresar a 2 toppings: quitar los que estén marcados además de tapioca y jelly-lichi
      for (const t of ['pop-mango', 'jelly-cafe']) if (await pressed(page, 'topping-' + t)) await tap(page, 'topping-' + t, { wait: 200 });
      if (!(await pressed(page, 'topping-tapioca'))) await tap(page, 'topping-tapioca', { wait: 200 });
      if (!(await pressed(page, 'topping-jelly-lichi'))) await tap(page, 'topping-jelly-lichi', { wait: 200 });
      const p3 = await text(page, 'unit-price'); rec('vuelve a $120 con 2 toppings', has(p3, 120), p3);
      await tap(page, 'sweet-50', { wait: 200 }); rec('dulzor 50% marcado', await pressed(page, 'sweet-50'));
      await tap(page, 'ice-less', { wait: 200 }); rec('poco hielo marcado', await pressed(page, 'ice-less'));
      await tap(page, 'qty-inc', { wait: 200 });
      await shot('10-ficha-taro');
      await tap(page, 'add-to-cart');
      rec('flujo taro agregado', true);
    } catch (e) { rec('flujo taro agregado', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // Flujo B: smoothie sin dulzor ni hielo
    try {
      await tap(page, 'drink-smooth-mango');
      const sweetVis = await visible(page, 'sweet-50'), iceVis = await visible(page, 'ice-less');
      rec('smoothie sin controles de dulzor/hielo', !sweetVis && !iceVis, `sweet visible=${sweetVis} ice visible=${iceVis}`);
      await tap(page, 'add-to-cart');
    } catch (e) { rec('smoothie sin controles de dulzor/hielo', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // Bebida agotada
    try {
      const dl = page.locator(T('drink-smooth-maracuya')).first();
      const dis = await dl.evaluate(el => el.disabled === true || el.getAttribute('aria-disabled') === 'true');
      let blocked = dis;
      if (!dis) {
        await dl.scrollIntoViewIfNeeded().catch(() => {}); await dl.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(400);
        const add = page.locator(T('add-to-cart')).first();
        blocked = !(await add.count()) || !(await add.isVisible().catch(() => false)) || await add.evaluate(el => el.disabled === true || el.getAttribute('aria-disabled') === 'true');
      }
      rec('bebida agotada no se puede agregar', blocked);
    } catch (e) { rec('bebida agotada no se puede agregar', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // Carrito y totales MXN
    try {
      await ensureCart(page);
      await shot('20-carrito');
      const n = await page.locator(T('cart-line')).count(); rec('2 líneas en el carrito', n === 2, n);
      const t0 = await text(page, 'cart-total'); rec('total MXN $330', has(t0, 330), t0);
      const sm = () => page.locator(T('cart-line')).filter({ hasText: /Smoothie de Mango|Mango Smoothie/ }).first();
      await sm().locator(T('line-inc')).click(); await page.waitForTimeout(350);
      const t1 = await text(page, 'cart-total'); rec('subir cantidad → $420', has(t1, 420), t1);
      await sm().locator(T('line-dec')).click(); await page.waitForTimeout(350);
      const t2 = await text(page, 'cart-total'); rec('bajar cantidad → $330', has(t2, 330), t2);
    } catch (e) { rec('carrito y totales MXN', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // USD: el esperado se calcula con la misma regla del módulo compartido
    const EXP = await page.evaluate(() => { let c = KOI.addToCart([], 'taro', { size: 'grande', sweet: 50, ice: 'less', toppings: ['tapioca', 'jelly-lichi'] }, 2); c = KOI.addToCart(c, 'smooth-mango', KOI.defaultConfig(KOI.drink('smooth-mango')), 1); return { usd: KOI.money(KOI.cartTotal(c, 'usd'), 'usd', 'bare') }; });
    try {
      await tap(page, 'cur-usd');
      await ensureCart(page);
      const t = await text(page, 'cart-total'); rec(`total USD ${EXP.usd} (desde $330 MXN)`, has(t, EXP.usd), t);
    } catch (e) { rec('total USD', false, e.message); }

    // Cierre en caja
    try {
      await tap(page, 'checkout-counter');
      const c1 = await text(page, 'order-code');
      rec('código de pedido', /K-[A-Z][2-9]{3}/.test(c1 || ''), c1);
      await shot('30-caja');
    } catch (e) { rec('código de pedido', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // WhatsApp
    try {
      await ensureCart(page);
      await tap(page, 'checkout-whatsapp');
      await page.locator(T('wa-name')).first().fill('Ana'); await page.locator(T('wa-time')).first().fill('18:30'); await page.waitForTimeout(350);
      const m = await page.locator(T('wa-message')).first().evaluate(el => el.value != null && el.tagName !== 'DIV' ? el.value : el.innerText);
      rec('mensaje WhatsApp con bebida, nombre y total', /Taro Milk Tea/.test(m) && /Ana/.test(m) && /330/.test(m) && m.includes(EXP.usd), m.slice(0, 160).replace(/\n/g, ' / '));
      await shot('40-whatsapp');
    } catch (e) { rec('mensaje WhatsApp', false, e.message); }
    await escapeAll(page); await toMenu(page);

    // Idioma
    try {
      await tap(page, 'lang-en');
      const n = await text(page, 'drink-maracuya-green');
      rec('EN traduce nombres (Passion Fruit)', /Passion/i.test(n || ''), n);
      await shot('50-en');
      await tap(page, 'lang-es'); await tap(page, 'cur-mxn');
    } catch (e) { rec('cambio de idioma', false, e.message); }

    rec('consola sin errores', errors.length === 0, errors.slice(0, 5).join(' | '));
    // Accesibilidad y objetivos táctiles en inicio
    await escapeAll(page);
    try { const v = await axe(page); const bad = v.filter(x => x.impact === 'critical' || x.impact === 'serious'); rec('axe sin critical/serious (inicio)', bad.length === 0, bad.map(x => x.id + ':' + x.nodes.length).join(', ')); } catch (e) { rec('axe', false, e.message); }
    try { const s = await smallTargets(page); rec('objetivos táctiles ≥44px (inicio)', s.length === 0, s.slice(0, 6).map(x => `${x.el}"${x.text}" ${x.w}x${x.h}`).join('; ')); } catch (e) { rec('objetivos táctiles', false, e.message); }
  } finally {
    await browser.close();
  }
  // Desbordes por ancho
  for (const w of [320, 360, 390, 430, 1280]) {
    const { browser: b, page: p } = await open(file, { width: w, height: w > 600 ? 800 : 780, isMobile: w <= 600 });
    try { const o = await overflow(p); rec(`sin desborde a ${w}px`, o.length === 0, o.slice(0, 4).map(x => `${x.el} → ${x.right}`).join('; ')); } finally { await b.close(); }
  }
  const okN = results.filter(r => r.ok).length;
  if (asJson) console.log(JSON.stringify({ file, ok: okN, total: results.length, minTaps: results.minTaps || null, results }, null, 1));
  else {
    for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
    console.log(`\n${okN}/${results.length} ok · toques mínimos a caja: ${results.minTaps || '?'}`);
  }
})().catch(e => { console.error('ERROR', e); process.exit(1); });
