const { chromium } = require('playwright');
const fs = require('fs');
const lib = fs.readFileSync(__dirname + '/node_modules/peerjs/dist/peerjs.min.js', 'utf8');
const base = 'http://127.0.0.1:8080/';
(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function mk(name, url, w, h) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:8080' });
    await ctx.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ body: lib, contentType: 'text/javascript' }));
    await ctx.addInitScript(() => { window.MALANG_PEER = { host: '127.0.0.1', port: 9000, path: '/', secure: false, config: { iceServers: [] } }; });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    await p.goto(url);
    return p;
  }
  const host = await mk('host', base, 834, 1194);
  await host.click('#modeOnline'); await host.click('#onCreate'); await host.click('#startGame');
  await host.waitForFunction(() => /\d{4}/.test(document.querySelector('#waitCode').textContent), null, { timeout: 15000 });
  const link = await host.inputValue('#roomLink');
  console.log('link', link, 'share box visible', await host.isVisible('#shareBox'));
  await host.click('#copyLink'); await host.waitForTimeout(300);
  console.log('copy button', await host.textContent('#copyLink'), 'clipboard', await host.evaluate(() => navigator.clipboard.readText()));
  await host.screenshot({ path: 'l1-host.png' });
  const guest = await mk('guest', link, 390, 844);
  await guest.waitForFunction(() => window.__malang.G && window.__malang.G.mode === 'online', null, { timeout: 15000 });
  await host.waitForTimeout(600);
  console.log('guest hash after join', await guest.evaluate(() => location.hash || '(none)'));
  console.log('host', await host.evaluate(() => window.__malang.G.mode + ' ' + window.__malang.G.human), 'guest', await guest.evaluate(() => window.__malang.G.mode + ' ' + window.__malang.G.human));
  const bad = await mk('bad', base + '#room-0000', 390, 844);
  await bad.waitForTimeout(4000);
  console.log('bad link status', await bad.textContent('#onStatus'));
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
