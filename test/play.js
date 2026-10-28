const { chromium } = require('playwright');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, '../dist/index.html');
const sq = (n) => (8 - Number(n[1])) * 8 + 'abcdefgh'.indexOf(n[0]);
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  async function page(w, h) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => errors.push('pageerror ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await p.goto(url);
    await p.waitForTimeout(300);
    return p;
  }
  const click = (p, from) => p.click(`.sq[data-sq="${sq(from)}"]`);
  const move = async (p, a, b) => { await click(p, a); await p.waitForTimeout(120); await click(p, b); await p.waitForTimeout(450); };

  // 1. 아이패드 가로: 첫 화면 → 같이 두기(마주 보기) → 바보 메이트
  let p = await page(1194, 834);
  await p.screenshot({ path: 'shots/1-start.png' });
  await p.click('#modeLocal');
  await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/2-setup-local.png' });
  await p.click('#startGame');
  await p.waitForTimeout(400);
  await click(p, 'e2');
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'shots/3-facing-select.png' });
  await click(p, 'e2');
  await move(p, 'f2', 'f3'); await move(p, 'e7', 'e5'); await move(p, 'g2', 'g4');
  await click(p, 'd8'); await p.waitForTimeout(200); await click(p, 'h4');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/4-facing-mate.png' });
  console.log('local result', await p.evaluate(() => JSON.stringify(window.__malang.G.over)));
  await p.close();

  // 2. 아이패드 가로: AI 보통 떡, 몇 수 두고 무르기·힌트
  p = await page(1194, 834);
  await p.click('#modeAI'); await p.waitForTimeout(150);
  await p.click('.level[data-level="2"]');
  await p.click('#startGame'); await p.waitForTimeout(400);
  await move(p, 'e2', 'e4'); await p.waitForTimeout(1200);
  await move(p, 'g1', 'f3'); await p.waitForTimeout(1200);
  await click(p, 'f1'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'shots/5-ai-landscape.png' });
  await click(p, 'f1');
  console.log('history len', await p.evaluate(() => window.__malang.G.hist.length));
  await p.click('[data-act="undo"]'); await p.waitForTimeout(400);
  console.log('after undo', await p.evaluate(() => window.__malang.G.hist.length));
  await p.click('[data-act="hint"]'); await p.waitForTimeout(2000);
  console.log('hint', await p.evaluate(() => JSON.stringify(window.__malang.G.hint)));
  await p.screenshot({ path: 'shots/6-hint.png' });
  await p.click('#menuBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/7-menu.png' });
  await p.click('#quitAsk'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'shots/7b-menu-quit.png' });
  await p.click('#quitNo');
  await p.click('#menuClose');
  await p.close();

  // 3. 휴대폰 세로: AI 대장 떡, 사람이 검은 떡
  p = await page(390, 844);
  await p.click('#modeAI'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'shots/8-setup-phone.png', fullPage: true });
  await p.click('.team[data-team="b"]');
  await p.click('.level[data-level="4"]');
  await p.click('#startGame'); await p.waitForTimeout(2600);
  await p.screenshot({ path: 'shots/9-phone-black.png' });
  console.log('ai first move hist', await p.evaluate(() => window.__malang.G.hist.length));
  await p.close();

  // 4. AI끼리 자동으로 끝까지(아기 떡 vs 사람 대신 랜덤) — 오류 없는지
  p = await page(1194, 834);
  await p.click('#modeAI'); await p.waitForTimeout(100);
  await p.click('.team[data-team="w"]');
  await p.click('.level[data-level="0"]');
  await p.click('#startGame'); await p.waitForTimeout(300);
  for (let i = 0; i < 600; i++) {
    const done = await p.evaluate(() => { const G = window.__malang.G; return !!G.over; });
    if (done) break;
    const mv = await p.evaluate(() => {
      const { G, E } = window.__malang;
      if (G.thinking || G.s.turn !== G.human) return null;
      const ms = E.legalMoves(G.s);
      const caps = ms.filter((m) => m.cap);
      const m = (caps.length ? caps : ms)[Math.floor(Math.random() * (caps.length ? caps.length : ms.length))];
      return [m.from, m.to];
    });
    if (mv) {
      await p.click(`.sq[data-sq="${mv[0]}"]`); await p.click(`.sq[data-sq="${mv[1]}"]`);
      if (await p.isVisible('#promo')) await p.click('#promoRow button[data-promo="q"]');
    }
    await p.waitForTimeout(mv ? 120 : 400);
  }
  await p.waitForTimeout(1200);
  console.log('auto game', await p.evaluate(() => JSON.stringify({ over: window.__malang.G.over, plies: window.__malang.G.hist.length })));
  await p.screenshot({ path: 'shots/10-auto-end.png' });
  if (await p.isVisible('#home')) { await p.click('#home'); } else { await p.evaluate(() => document.querySelector('[data-act=menu], #menuBtn').click()); await p.click('#quitAsk'); await p.click('#quitYes'); }
  await p.waitForTimeout(200);
  await p.click('#profileChip'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/11-profile.png' });
  await p.click('#modeOnline').catch(() => {});
  await p.close();

  p = await page(1194, 834);
  await p.click('#toGuide'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/12-guide.png' });
  await p.close();
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
