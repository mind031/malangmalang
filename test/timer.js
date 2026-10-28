const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1194, height: 834 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await p.click('#modeLocal'); await p.click('.pill[data-time="1"]'); await p.click('#startGame');
  await p.waitForTimeout(500);
  console.log('clock', await p.textContent('[data-clock="w"]'));
  await p.evaluate(() => { window.__malang.G.deadline = Date.now() + 3000; });
  await p.waitForTimeout(3800);
  console.log('after timeout', await p.evaluate(() => JSON.stringify({ plies: window.__malang.G.hist.length, turn: window.__malang.G.s.turn })));
  await p.screenshot({ path: 'shots/t-timeout.png' });
  // 승급 고르기 화면
  await p.evaluate(() => {
    const M = window.__malang; M.startGame('local');
    const G = M.G; G.s = M.E.parseFEN('8/P6k/8/8/8/8/8/4K3 w - - 0 1', G.rules); G.s.keys = [];
    G.ids = G.s.b.map((x, i) => (x ? 'z' + i : null));
  });
  await p.click('.sq[data-sq="8"]'); await p.click('.sq[data-sq="0"]'); await p.waitForTimeout(300);
  console.log('promo shown', await p.isVisible('#promo'));
  await p.screenshot({ path: 'shots/t-promo.png' });
  await p.click('#promoRow button[data-promo="n"]'); await p.waitForTimeout(300);
  console.log('promoted to', await p.evaluate(() => window.__malang.G.s.b[0]));
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
