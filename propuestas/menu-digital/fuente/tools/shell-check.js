// Prueba la página contenedora: carga, cambio de versiones, iframes, pantalla completa, desbordes, axe.
const path = require('path');
const { open, overflow, axe, smallTargets } = require('./pw.js');
const file = process.argv[2]; const out = process.argv[3] || '/tmp';
(async () => {
  for (const vp of [{ w: 1280, h: 860, m: false, n: 'desk' }, { w: 390, h: 844, m: true, n: 'mob' }, { w: 768, h: 1000, m: true, n: 'tab' }]) {
    for (const dark of [false, true]) {
      const { browser, page, errors } = await open(file, { width: vp.w, height: vp.h, isMobile: vp.m, dark });
      const tag = vp.n + (dark ? '-dark' : '');
      await page.waitForTimeout(800);
      const info = await page.evaluate(() => ({ frames: document.querySelectorAll('#screen iframe').length, s: getComputedStyle(document.getElementById('device')).getPropertyValue('--s'), w: document.getElementById('device').getBoundingClientRect().width, h: document.getElementById('device').getBoundingClientRect().height }));
      const inner = await page.frameLocator('#screen iframe:not([hidden])').locator('body').innerText().catch(e => 'ERR ' + e.message);
      console.log(tag, JSON.stringify(info), 'iframe text:', inner.slice(0, 40).replace(/\n/g, ' '));
      await page.screenshot({ path: path.join(out, `shell-${tag}.png`), fullPage: false });
      if (!dark) {
        for (const v of ['v2', 'v3', 'v4', 'v5']) { await page.click(`#tab-${v}`); await page.waitForTimeout(300); }
        const n = await page.evaluate(() => [document.querySelectorAll('#screen iframe').length, location.hash, [...document.querySelectorAll('.vnote')].filter(x => !x.hidden).map(x => x.id).join(',')]);
        console.log('  after tabs:', JSON.stringify(n));
        await page.click('#fs-open'); await page.waitForTimeout(300);
        const fs = await page.evaluate(() => { const r = document.getElementById('device').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), !document.getElementById('fs-close').hidden]; });
        console.log('  fullscreen:', JSON.stringify(fs));
        await page.screenshot({ path: path.join(out, `shell-${tag}-fs.png`) });
        await page.keyboard.press('Escape'); await page.waitForTimeout(200);
        const fs2 = await page.evaluate(() => document.getElementById('device').classList.contains('is-fs'));
        console.log('  fullscreen closed:', !fs2);
        console.log('  overflow:', JSON.stringify(await overflow(page)));
        const ax = await axe(page); console.log('  axe:', JSON.stringify(ax.filter(x => x.impact === 'critical' || x.impact === 'serious').map(x => [x.id, x.nodes.length, x.nodes[0] && x.nodes[0].target])));
        console.log('  small targets:', JSON.stringify((await smallTargets(page)).slice(0, 8)));
      }
      console.log('  errors:', JSON.stringify(errors));
      await browser.close();
    }
  }
})().catch(e => { console.error(e); process.exit(1); });
