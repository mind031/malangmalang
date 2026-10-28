const { chromium } = require('playwright');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, '../dist/index.html');
const sq = (n) => (8 - Number(n[1])) * 8 + 'abcdefgh'.indexOf(n[0]);
(async () => {
  const b = await chromium.launch();
  const errors = [];
  for (const [w, h, name] of [[1194, 834, 'ipad-land'], [834, 1194, 'ipad-port'], [390, 844, 'phone']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(url); await p.waitForTimeout(200);
    if (name !== 'phone') await p.screenshot({ path: `shots/q-start-${name}.png` });
    await p.click('#modeLocal'); await p.click('#startGame'); await p.waitForTimeout(400);
    await p.click(`.sq[data-sq="${sq('e2')}"]`); await p.click(`.sq[data-sq="${sq('e4')}"]`); await p.waitForTimeout(400);
    await p.click(`.sq[data-sq="${sq('g8')}"]`); await p.waitForTimeout(300);
    await p.screenshot({ path: `shots/q-facing-${name}.png` });
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 1194, height: 834 } });
  await p.goto(url); await p.click('#toGuide'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/q-guide.png' });
  console.log('errors', JSON.stringify(errors));
  await b.close();
})();
