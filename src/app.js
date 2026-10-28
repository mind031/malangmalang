(function () {
  'use strict';
  const E = window.MalangEngine;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  /* ---------- 저장 ---------- */
  const KEY = 'malangmalang:v1';
  const WHITE_FILLS = ['#FFFCF5', '#FFE3E8', '#FFF0B8', '#DDF2D4'];
  const BLACK_FILLS = ['#6A6170', '#8A6A58', '#5C74B0', '#4E8C78'];
  const TILES = [['#FFF6E6', '#BFE6CF'], ['#FFF6EE', '#FFD3DD'], ['#F6FAFF', '#CFE0F7'], ['#FFFAEC', '#FFE3A8']];
  const LEVEL_NAMES = E.LEVELS.map((l) => l.name);
  const LEVEL_KINDS = ['p', 'p', 'n', 'b', 'k'];
  const TIMES = [0, 60, 180, 300];
  const TIME_NAMES = ['없음', '1분', '3분', '5분'];

  const uid = () => Math.random().toString(36).slice(2, 9);
  const wld = () => ({ w: 0, l: 0, d: 0 });
  function newProfile(name) {
    return { id: uid(), name, avatar: { kind: 'p', team: 'w' }, ai: [0, 1, 2, 3, 4].map(wld), local: wld(), online: wld() };
  }
  function defaultStore() {
    const p = newProfile('나');
    return {
      v: 1, profiles: [p], current: p.id,
      settings: { wf: 0, bf: 0, tiles: 0, sound: true, facing: true },
      setup: {
        ai: { team: 'w', level: 1, castle: false, ep: false, promoChoice: true, time: 0 },
        local: { team: 'w', castle: false, ep: false, promoChoice: true, time: 0 },
        online: { team: 'w', castle: false, ep: false, promoChoice: true, time: 0 }
      }
    };
  }
  let store;
  try {
    store = JSON.parse(localStorage.getItem(KEY));
    if (!store || store.v !== 1 || !Array.isArray(store.profiles) || !store.profiles.length) store = defaultStore();
  } catch (e) { store = defaultStore(); }
  store.setup.online = store.setup.online || { team: 'w', castle: false, ep: false, promoChoice: true, time: 0 };
  for (const p of store.profiles) p.online = p.online || wld();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 저장이 안 되는 환경 */ } };
  const me = () => store.profiles.find((p) => p.id === store.current) || store.profiles[0];

  function applyColors() {
    const r = document.documentElement.style;
    r.setProperty('--wf', WHITE_FILLS[store.settings.wf] || WHITE_FILLS[0]);
    r.setProperty('--bf', BLACK_FILLS[store.settings.bf] || BLACK_FILLS[0]);
    const t = TILES[store.settings.tiles] || TILES[0];
    r.setProperty('--tl', t[0]);
    r.setProperty('--td', t[1]);
  }

  /* ---------- 떡 그림 ---------- */
  const BODY = 'M18 96 C16 72 34 58 60 58 C86 58 104 72 102 96 C102 104 92 106 60 106 C28 106 18 104 18 96 Z';
  function pieceSVG(kind, team, mood) {
    const fill = team === 'w' ? 'var(--wf)' : 'var(--bf)';
    const F = `style="fill:${fill}"`;
    const eye = team === 'w' ? '#3A302C' : '#FFFFFF';
    const blush = team === 'w' ? '#FFB3B8' : '#F29AB0';
    let back = '', body = `<path d="${BODY}" ${F}/>`, hat = '', deco = '';
    switch (kind) {
      case 'k':
        hat = '<path d="M45 61 L43 45 Q43 41 47 43.5 L53 48 L57.5 40 Q60 36 62.5 40 L67 48 L73 43.5 Q77 41 77 45 L75 61 Q60 64 45 61 Z" fill="#FFD95C"/>';
        deco = '<circle cx="60" cy="52" r="2.6" fill="#FF8FA3"/>';
        break;
      case 'q':
        hat = '<path d="M60 56 C52 42 37 42 38 53 C39 63 52 62 60 56 Z" fill="#FF9DB4"/><path d="M60 56 C68 42 83 42 82 53 C81 63 68 62 60 56 Z" fill="#FF9DB4"/><circle cx="60" cy="56" r="5.5" fill="#FF7E9C"/>';
        break;
      case 'r':
        hat = '<path d="M44 61 V47 Q44 44 47 44 H49 Q51 44 51 47 V50 H56 V47 Q56 44 59 44 H61 Q64 44 64 47 V50 H69 V47 Q69 44 71 44 H73 Q76 44 76 47 V61 Q60 64 44 61 Z" fill="#B9C9F0"/>';
        break;
      case 'b':
        hat = '<path d="M46 61 C45 48 51 40 60 35 C69 40 75 48 74 61 Q60 64 46 61 Z" fill="#A6E0C4"/><circle cx="60" cy="32" r="5" fill="#FFFFFF"/><path d="M65 44 L60 52" fill="none"/>';
        break;
      case 'n':
        back = `<path d="M36 70 C30 56 33 44 40 44 C46 45 49 55 48 64 Z" ${F}/><path d="M84 70 C90 56 87 44 80 44 C74 45 71 55 72 64 Z" ${F}/>`;
        hat = '<path d="M50 62 C49 54 54 50 58 54 C60 48 66 49 66 55 C70 53 73 57 71 62 Q60 66 50 62 Z" fill="#FFAE6B"/>';
        deco = '<path d="M40 51 C38 56 39 60 41 63 M80 51 C82 56 81 60 79 63" stroke="#FF9DB4" stroke-width="3" fill="none" stroke-linecap="round"/>';
        break;
      default:
        body = `<path d="M60 76 C60 70 61 66 63 63" fill="none"/><path d="M63 64 C64 56 72 54 76 57 C74 63 68 66 63 64 Z" fill="#9ED98A"/><path d="M30 98 C28 82 42 75 60 75 C78 75 92 82 90 98 C90 104 82 106 60 106 C38 106 30 104 30 98 Z" ${F}/>`;
    }
    let face;
    if (mood === 'happy') {
      face = `<path d="M48 87 Q52 82 56 87 M64 87 Q68 82 72 87" stroke="${eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M56 90.5 Q60 97 64 90.5 Z" fill="#FF7E8F" stroke="${eye}" stroke-width="2.2" stroke-linejoin="round"/>`;
    } else if (mood === 'nervous') {
      face = `<circle cx="52" cy="86" r="2.6" fill="${eye}"/><circle cx="68" cy="86" r="2.6" fill="${eye}"/><path d="M55 92 Q57.5 89.5 60 92 Q62.5 94.5 65 92" stroke="${eye}" stroke-width="2.3" fill="none" stroke-linecap="round"/><path d="M88 64 Q93 72 88 76 Q83 72 88 64 Z" fill="#9FD8F2" stroke="#3A302C" stroke-width="2.2" stroke-linejoin="round"/>`;
    } else if (mood === 'sad') {
      face = `<path d="M48 85 Q52 89 56 85 M64 85 Q68 89 72 85" stroke="${eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M56.5 93 Q60 89.5 63.5 93" stroke="${eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    } else {
      face = `<circle cx="52" cy="86" r="3" fill="${eye}"/><circle cx="68" cy="86" r="3" fill="${eye}"/><path d="M57.5 91 Q60 93.5 62.5 91" stroke="${eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
    face += `<ellipse cx="43" cy="91" rx="5" ry="3" fill="${blush}"/><ellipse cx="77" cy="91" rx="5" ry="3" fill="${blush}"/>`;
    const dy = kind === 'p' ? 6 : 0;
    return `<svg class="mochi" viewBox="8 22 104 90" aria-hidden="true" focusable="false"><g filter="url(#mwob)" stroke="#3A302C" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">${back}${body}${hat}</g>${deco}<g transform="translate(0 ${dy})">${face}</g></svg>`;
  }
  const pc = (kind, team, mood, extra) => `<div ${extra || ''}>${pieceSVG(kind, team, mood)}</div>`;

  function josa(word, withFinal, withoutFinal) {
    const c = word.charCodeAt(word.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return word + withoutFinal;
    return word + ((c - 0xAC00) % 28 ? withFinal : withoutFinal);
  }
  const KIND_NAME = { k: '킹', q: '퀸', r: '룩', b: '비숍', n: '나이트', p: '폰' };
  const TEAM_NAME = { w: '흰 떡', b: '검은 떡' };
  const EXPLAIN = {
    k: '킹은 모든 방향으로 한 칸씩 걸어요. 킹이 잡히면 지니까 꼭 지켜 주세요!',
    q: '퀸은 가로, 세로, 대각선 어디든 쭉쭉 가요. 제일 힘센 떡이에요!',
    r: '룩은 가로와 세로로 쭉쭉 가요.',
    b: '비숍은 대각선으로만 쭉쭉 가요.',
    n: '나이트는 ㄱ자로 폴짝 뛰어요. 다른 떡을 넘어갈 수 있어요!',
    p: '폰은 앞으로 한 칸씩 가요. 처음엔 두 칸도 돼요. 잡을 땐 대각선 앞으로 가요.'
  };

  /* ---------- 효과음 ---------- */
  let ac = null;
  function audio() {
    if (!store.settings.sound) return null;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { return null; }
    return ac;
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + (when || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  const SFX = {
    pick: () => tone(880, 0.07, 'sine', 0.08, 0, 1100),
    move: () => tone(560, 0.14, 'sine', 0.22, 0, 260),
    capture: () => { tone(720, 0.09, 'triangle', 0.2, 0, 380); tone(430, 0.16, 'sine', 0.2, 0.08, 200); },
    check: () => { tone(1046, 0.18, 'triangle', 0.16); tone(1318, 0.26, 'triangle', 0.13, 0.12); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.17, i * 0.12)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.32, 'sine', 0.15, i * 0.17)),
    draw: () => [523, 523, 659].forEach((f, i) => tone(f, 0.2, 'sine', 0.14, i * 0.14)),
    tick: () => tone(1250, 0.035, 'square', 0.035),
    nope: () => tone(220, 0.14, 'sine', 0.12, 0, 160),
    tap: () => tone(660, 0.05, 'sine', 0.06)
  };

  /* ---------- 생각하는 일꾼(AI를 따로 돌려 화면이 멈추지 않게) ---------- */
  let worker = null, jobSeq = 0;
  const jobs = new Map();
  function runLocal(job) {
    return job.kind === 'hint' ? E.hintMove(job.s) : E.chooseMove(job.s, job.level);
  }
  try {
    const src = $('#engine-src').textContent +
      '\nself.onmessage=function(e){var d=e.data;var m=d.kind==="hint"?MalangEngine.hintMove(d.s):MalangEngine.chooseMove(d.s,d.level);self.postMessage({id:d.id,m:m});};';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = (e) => { const j = jobs.get(e.data.id); if (j) { jobs.delete(e.data.id); j.resolve(e.data.m); } };
    worker.onerror = () => {
      worker = null;
      for (const [id, j] of jobs) { jobs.delete(id); j.resolve(runLocal(j)); }
    };
  } catch (e) { worker = null; }
  function think(kind, s, level) {
    return new Promise((resolve) => {
      const job = { kind, s, level, resolve };
      if (worker) {
        const id = ++jobSeq;
        jobs.set(id, job);
        worker.postMessage({ id, kind, s, level });
      } else {
        setTimeout(() => resolve(runLocal(job)), 30);
      }
    });
  }

  /* ---------- 화면 전환 ---------- */
  const screens = ['start', 'setup', 'game', 'guide', 'profile', 'online'];
  let current = 'start';
  function show(name) {
    current = name;
    for (const s of screens) $('#screen-' + s).hidden = s !== name;
    if (name === 'start') renderStart();
    if (name === 'profile') renderProfile();
    if (name === 'game') requestAnimationFrame(layoutGame);
    const scr = $('#screen-' + name);
    scr.scrollTop = 0;
  }
  $$('.back').forEach((b) => b.addEventListener('click', () => { SFX.tap(); show('start'); }));

  /* ---------- 첫 화면 ---------- */
  function renderStart() {
    const p = me();
    $('#chipAv').innerHTML = pieceSVG(p.avatar.kind, p.avatar.team, 'happy');
    $('#chipName').textContent = p.name + ' · 전적';
  }
  function buildStatic() {
    const lineup = [['r', 'w', 'normal', 0], ['n', 'b', 'happy', 0.3], ['b', 'w', 'normal', 0.6], ['q', 'b', 'happy', 0.9], ['k', 'w', 'happy', 1.2], ['p', 'b', 'normal', 1.5]];
    $('#lineup').innerHTML = lineup.map(([k, t, m, d]) => pc(k, t, m, `style="animation-delay:${d}s"`)).join('');
    $('#icLocal').innerHTML = pc('k', 'w', 'happy') + pc('k', 'b', 'happy');
    $('#icAI').innerHTML = pc('b', 'b', 'normal');
    $('#icOnline').innerHTML = pc('n', 'w', 'happy');
    $('#onlineTrio').innerHTML = pc('n', 'w', 'happy', 'style="animation-delay:0s"') + pc('p', 'b', 'normal', 'style="animation-delay:.3s"') + pc('n', 'b', 'happy', 'style="animation-delay:.6s"');
    for (const t of ['w', 'b']) $(`[data-trio="${t}"]`).innerHTML = pc('q', t, 'normal') + pc('k', t, 'normal') + pc('n', t, 'normal');
    $('#levels').innerHTML = LEVEL_NAMES.map((n, i) => `<button type="button" class="level" data-level="${i}" aria-pressed="false">${pc(LEVEL_KINDS[i], 'b', 'normal')}<span>${n}</span></button>`).join('');
    $('#times').innerHTML = TIME_NAMES.map((n, i) => `<button type="button" class="pill" data-time="${i}" aria-pressed="false">${n}</button>`).join('');
    $('#promoRow').innerHTML = ['q', 'r', 'b', 'n'].map((k) => `<button type="button" data-promo="${k}">${pc(k, 'w', 'happy')}${KIND_NAME[k]}</button>`).join('');
    buildGuide();
    buildSwatches();
  }
  $('#modeAI').addEventListener('click', () => { SFX.tap(); openSetup('ai'); });
  $('#modeLocal').addEventListener('click', () => { SFX.tap(); openSetup('local'); });
  $('#modeOnline').addEventListener('click', () => { SFX.tap(); openOnline(); });
  $('#toGuide').addEventListener('click', () => { SFX.tap(); show('guide'); });
  $('#profileChip').addEventListener('click', () => { SFX.tap(); show('profile'); });

  /* ---------- 준비 화면 ---------- */
  let setupMode = 'ai';
  function openSetup(mode) {
    setupMode = mode;
    $('#setupTitle').textContent = { ai: 'AI랑 두기 준비', local: '같이 두기 준비', online: '온라인 방 만들기' }[mode];
    $('#teamLabel').textContent = mode === 'local' ? `${josa(me().name, '은', '는')} 어느 팀 할래?` : '어느 팀 할래?';
    $('#teamNote').textContent = { ai: '흰 떡 팀이 먼저 시작해요.', local: '상대는 반대 팀을 맡아요. 흰 떡 팀이 먼저 시작해요.', online: '친구는 반대 팀을 맡아요. 흰 떡 팀이 먼저 시작해요.' }[mode];
    $('#startGame').textContent = mode === 'online' ? '방 만들기' : '시작하기!';
    $('#levelBlock').hidden = mode !== 'ai';
    renderSetup();
    show('setup');
  }
  function renderSetup() {
    const cfg = store.setup[setupMode];
    $$('.team').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.team === cfg.team)));
    $$('.team').forEach((b) => {
      const on = b.dataset.team === cfg.team;
      $$('.trio > div', b).forEach((d, i) => { d.innerHTML = pieceSVG(['q', 'k', 'n'][i], b.dataset.team, on ? 'happy' : 'normal'); });
    });
    $$('.level').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.level) === store.setup.ai.level)));
    $$('#screen-setup .switch').forEach((b) => b.setAttribute('aria-pressed', String(!!cfg[b.dataset.rule])));
    $$('.pill').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.time) === cfg.time)));
  }
  $('#screen-setup').addEventListener('click', (e) => {
    const cfg = store.setup[setupMode];
    const t = e.target.closest('.team, .level, .switch, .pill');
    if (!t) return;
    SFX.tap();
    if (t.classList.contains('team')) cfg.team = t.dataset.team;
    if (t.classList.contains('level')) store.setup.ai.level = Number(t.dataset.level);
    if (t.classList.contains('switch')) cfg[t.dataset.rule] = !cfg[t.dataset.rule];
    if (t.classList.contains('pill')) cfg.time = Number(t.dataset.time);
    save();
    renderSetup();
  });
  $('#startGame').addEventListener('click', () => { SFX.tap(); if (setupMode === 'online') hostRoom(); else startGame(setupMode); });

  /* ---------- 게임 ---------- */
  let G = null;
  let token = 0; // 무르기나 새 판으로 낡은 AI 답을 버리기 위한 번호
  const pieceEls = new Map();

  function startGame(mode, given) {
    const cfg = given || store.setup[mode];
    const rules = { castle: !!cfg.castle, ep: !!cfg.ep, promoChoice: !!cfg.promoChoice };
    const s = E.newGame(rules);
    const ids = s.b.map((p, i) => (p ? 'p' + i : null));
    token++;
    G = {
      mode, human: cfg.team, level: store.setup.ai.level, rules, timeLimit: TIMES[cfg.time] || 0,
      s, ids, hist: [], caps: { w: [], b: [] }, sel: -1, last: null, hint: null, over: null,
      thinking: false, deadline: 0, recorded: false, warnShown: false, msg: null
    };
    G.flip = mode !== 'local' && G.human === 'b';
    for (const el of pieceEls.values()) el.remove();
    pieceEls.clear();
    buildBoard();
    $('#win').hidden = true;
    show('game');
    afterTurn(false);
  }

  function buildBoard() {
    const board = $('#board');
    let html = '';
    for (let d = 0; d < 64; d++) {
      const sq = G.flip ? 63 - d : d;
      const dark = ((d >> 3) + (d & 7)) % 2 === 1;
      html += `<button type="button" class="sq${dark ? ' d' : ''}" data-sq="${sq}" aria-label="${E.sqName(sq)}"></button>`;
    }
    board.innerHTML = html + '<div class="marks" id="marks"></div><div class="pieces" id="pieces"></div>';
  }
  const disp = (sq) => (G.flip ? 63 - sq : sq);
  const posStyle = (sq) => { const d = disp(sq); return `left:calc(var(--sq) * ${d & 7});top:calc(var(--sq) * ${d >> 3})`; };

  function isHumanTurn() {
    return G.mode === 'local' || G.s.turn === G.human;
  }
  function facingOn() { return G && G.mode === 'local' && store.settings.facing; }

  function legalFrom(sq) { return E.legalMoves(G.s).filter((m) => m.from === sq); }

  function moods() {
    const mood = new Array(64).fill('normal');
    if (G.over) {
      for (let i = 0; i < 64; i++) {
        const p = G.s.b[i];
        if (!p) continue;
        const t = E.colorOf(p);
        mood[i] = !G.over.winner ? 'happy' : t === G.over.winner ? 'happy' : 'sad';
      }
      return mood;
    }
    if (G.last) mood[G.last.to] = 'happy';
    if (G.sel >= 0) {
      mood[G.sel] = 'happy';
      for (const m of legalFrom(G.sel)) if (m.cap) mood[m.flag === 'ep' ? (m.from & ~7) + (m.to & 7) : m.to] = 'nervous';
    }
    if (E.inCheck(G.s)) mood[E.kingSquare(G.s.b, G.s.turn)] = 'nervous';
    return mood;
  }

  function renderPieces(animate) {
    const layer = $('#pieces');
    const mood = moods();
    const alive = new Set();
    for (let i = 0; i < 64; i++) {
      const id = G.ids[i];
      const p = G.s.b[i];
      if (!id || !p) continue;
      alive.add(id);
      const kind = p.toLowerCase(), team = E.colorOf(p);
      let el = pieceEls.get(id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'pc';
        el.innerHTML = '<div class="pc-body"></div>';
        layer.appendChild(el);
        pieceEls.set(id, el);
      }
      const flip = facingOn() && team === 'b';
      el.classList.toggle('flip', flip);
      el.setAttribute('style', posStyle(i));
      const sig = kind + team + mood[i];
      if (el.dataset.sig !== sig) { el.dataset.sig = sig; el.firstChild.innerHTML = pieceSVG(kind, team, mood[i]); }
      el.classList.toggle('cheer', !!(G.over && (G.over.winner ? team === G.over.winner : true) && (kind === 'k' || kind === 'q')));
    }
    for (const [id, el] of pieceEls) {
      if (!alive.has(id)) {
        pieceEls.delete(id);
        if (animate) { el.classList.add('eaten'); setTimeout(() => el.remove(), 260); } else el.remove();
      }
    }
  }

  function renderMarks() {
    const out = [];
    const mk = (sq, cls) => out.push(`<div class="mk ${cls}" style="${posStyle(sq)}"></div>`);
    if (G.last) { mk(G.last.from, 'last'); mk(G.last.to, 'last'); }
    if (!G.over && E.inCheck(G.s)) mk(E.kingSquare(G.s.b, G.s.turn), 'check');
    if (G.sel >= 0) {
      mk(G.sel, 'sel');
      const seen = new Set();
      for (const m of legalFrom(G.sel)) {
        if (seen.has(m.to)) continue;
        seen.add(m.to);
        if (m.cap) mk(m.flag === 'ep' ? m.to : m.to, 'ring');
        else mk(m.to, 'dot');
      }
    }
    if (G.hint) { mk(G.hint.from, 'hint-from'); mk(G.hint.to, 'hint-to'); }
    $('#marks').innerHTML = out.join('');
  }

  function playerInfo(color) {
    if (G.mode === 'ai') {
      if (color === G.human) return { name: me().name, sub: TEAM_NAME[color] + ' 팀' };
      return { name: LEVEL_NAMES[G.level], sub: 'AI · ' + TEAM_NAME[color] + ' 팀' };
    }
    if (color === G.human) return { name: me().name, sub: TEAM_NAME[color] + ' 팀' };
    if (G.mode === 'online') return { name: NET.oppName || '친구', sub: '온라인 · ' + TEAM_NAME[color] + ' 팀' };
    return { name: '친구', sub: TEAM_NAME[color] + ' 팀' };
  }

  function clockText(color) {
    if (!G.timeLimit || G.over) return '';
    if (G.mode === 'ai' && color !== G.human) return '';
    if (G.s.turn !== color) return fmt(G.timeLimit);
    return fmt(Math.max(0, Math.ceil((G.deadline - Date.now()) / 1000)));
  }
  const fmt = (sec) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');

  function cardHTML(color) {
    const info = playerInfo(color);
    const active = !G.over && G.s.turn === color;
    const caps = G.caps[color].map((p) => pc(p.toLowerCase(), E.colorOf(p), 'sad')).join('');
    return `<div class="card${active ? ' active' : ''}" data-card="${color}">
      <div class="av">${pieceSVG('k', color, active ? 'happy' : 'normal')}</div>
      <div class="who"><b></b><small>${info.sub}</small></div>
      <div class="caps" aria-label="잡은 떡 ${G.caps[color].length}개">${caps}</div>
      <div class="clock" data-clock="${color}">${clockText(color)}</div>
    </div>`;
  }

  function tipData(forColor) {
    if (G.over) {
      return { cls: '', av: ['k', G.over.winner || 'w', 'happy'], title: resultTitle(), text: '아래 버튼으로 한 판 더 둘 수 있어요.' };
    }
    const turn = G.s.turn;
    if (G.thinking) return { cls: 'wait', av: ['k', turn, 'normal'], title: `${josa(LEVEL_NAMES[G.level], '이', '가')} 생각 중이에요…`, text: '잠깐만 기다려 주세요.' };
    if (forColor && forColor !== turn) return { cls: 'wait', av: ['k', forColor, 'normal'], title: '잠깐 기다려요!', text: `${TEAM_NAME[turn]} 차례예요.` };
    if (G.msg) return G.msg;
    if (G.mode === 'online' && turn !== G.human) return { cls: 'wait', av: ['k', turn, 'normal'], title: `${josa(NET.oppName || '친구', '이', '가')} 생각 중이에요…`, text: '친구가 두면 바로 보여요.' };
    const check = E.inCheck(G.s);
    if (G.sel >= 0) {
      const p = G.s.b[G.sel];
      const kind = p.toLowerCase();
      const moves = legalFrom(G.sel);
      let text = EXPLAIN[kind];
      if (moves.some((m) => m.cap)) text += ' 분홍 동그라미를 누르면 잡아요.';
      if (moves.some((m) => m.flag.startsWith('castle'))) text += ' 킹이 두 칸 옆으로 가면 캐슬링이에요.';
      if (moves.some((m) => m.flag === 'ep')) text += ' 옆으로 지나간 폰을 앙파상으로 잡을 수 있어요.';
      return { cls: check ? 'check' : '', av: [kind, E.colorOf(p), 'happy'], title: `${josa(KIND_NAME[kind], '을', '를')} 골랐어요`, text };
    }
    if (check) return { cls: 'check', av: ['k', turn, 'nervous'], title: '체크! 킹이 위험해요', text: '킹을 피하거나, 막거나, 공격하는 떡을 잡아요.' };
    if (G.hint) return { cls: '', av: [G.s.b[G.hint.from].toLowerCase(), turn, 'happy'], title: '힌트예요!', text: '파란 점선 떡을 파란 동그라미로 옮겨 보세요.' };
    return { cls: '', av: ['k', turn, 'happy'], title: `${TEAM_NAME[turn]} 차례예요!`, text: '움직일 떡을 눌러 보세요.' };
  }
  function tipHTML(forColor) {
    const t = tipData(forColor);
    return `<div class="tip ${t.cls}" role="status"><div class="av">${pieceSVG(t.av[0], t.av[1], t.av[2])}</div><div><b></b><p></p></div></div>`;
  }
  function fillTip(container, forColor) {
    const t = tipData(forColor);
    container.innerHTML = tipHTML(forColor);
    $('b', container).textContent = t.title;
    $('p', container).textContent = t.text;
  }

  function actionsHTML(color, withMenu) {
    const canAct = !G.over && !G.thinking && (G.mode !== 'local' || G.s.turn === color || !color);
    const undoOk = !G.over && !G.thinking && canUndo();
    if (G.over) {
      return `<button type="button" class="btn pink" data-act="again">한 판 더!</button><button type="button" class="btn" data-act="home">처음으로</button>`;
    }
    return `<button type="button" class="btn" data-act="undo"${undoOk ? '' : ' disabled'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 L4 9 L9 4"/><path d="M4 9 H14 A6 6 0 0 1 14 21 H10"/></svg>무르기</button>
      <button type="button" class="btn" data-act="hint"${canAct && isHumanTurn() ? '' : ' disabled'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18 H15 M10 21 H14"/><path d="M12 3 A6 6 0 0 0 8.5 13.8 C9.3 14.4 9.5 15 9.5 15.5 H14.5 C14.5 15 14.7 14.4 15.5 13.8 A6 6 0 0 0 12 3 Z"/></svg>힌트</button>
      ${withMenu ? '<button type="button" class="icon-btn" data-act="menu" aria-label="메뉴"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 7 H19 M5 12 H19 M5 17 H19"/></svg></button>' : ''}`;
  }

  function canUndo() {
    if (!G.hist.length) return false;
    if (G.mode !== 'local') return G.hist.some((h) => h.s.turn === G.human);
    return true;
  }

  function renderPanels() {
    const bottom = G.flip ? 'b' : 'w', top = G.flip ? 'w' : 'b';
    const facing = facingOn();
    const wrap = $('#gWrap');
    if (facing) {
      $('#sideTop').innerHTML = '<div class="tipbox"></div>' + cardHTML(top) + `<div class="actions">${actionsHTML(top, false)}</div>`;
      $('#sideBottom').innerHTML = '<div class="tipbox"></div>' + cardHTML(bottom) + `<div class="actions">${actionsHTML(bottom, true)}</div>`;
      fillTip($('#sideTop .tipbox'), top);
      fillTip($('#sideBottom .tipbox'), bottom);
    } else {
      $('#sideTop').innerHTML = cardHTML(top);
      $('#sideBottom').innerHTML = cardHTML(bottom);
      fillTip($('#tipMain'), null);
      $('#actionsMain').innerHTML = actionsHTML(null, false);
    }
    for (const c of ['w', 'b']) { const el = $(`[data-card="${c}"] .who b`); if (el) el.textContent = playerInfo(c).name; }
    wrap.classList.toggle('facing', facing);
  }

  function render(animate) {
    if (!G) return;
    renderPieces(animate);
    renderMarks();
    renderPanels();
  }

  function layoutGame() {
    if (!G || current !== 'game') return;
    const scr = $('#screen-game');
    const wrap = $('#gWrap');
    const W = scr.clientWidth, H = scr.clientHeight - 24;
    const facing = facingOn();
    const landscape = !facing && W > H * 1.15;
    const wide = facing && W > H * 1.15;
    wrap.classList.toggle('landscape', landscape);
    wrap.classList.toggle('portrait', !landscape && !facing);
    wrap.classList.toggle('wide', wide);
    const frame = 30;
    const setSq = (size) => document.documentElement.style.setProperty('--sq', Math.max(28, Math.floor((size - frame) / 8)) + 'px');
    if (landscape || wide) {
      setSq(landscape ? Math.min(H, W - 300 - 24) : Math.min(H, W - 2 * 270 - 40));
      render(false);
      return;
    }
    setSq(Math.min(W, 300));
    render(false);
    // 판을 뺀 나머지(카드, 안내, 버튼)의 실제 높이를 재서 판 크기를 정함
    let chrome = 0, count = 0;
    for (const el of wrap.children) {
      if (el.classList.contains('g-board') || getComputedStyle(el).display === 'none') continue;
      chrome += el.offsetHeight; count++;
    }
    chrome += count * 10 + 12;
    setSq(Math.min(W, H - chrome));
    render(false);
  }
  window.addEventListener('resize', () => requestAnimationFrame(layoutGame));

  function applyMove(m, opts) {
    const prev = { s: G.s, ids: G.ids, caps: { w: G.caps.w.slice(), b: G.caps.b.slice() }, last: G.last };
    G.hist.push(prev);
    const n = G.ids.slice();
    const mover = G.s.turn;
    if (m.flag === 'ep') n[(m.from & ~7) + (m.to & 7)] = null;
    n[m.to] = n[m.from];
    n[m.from] = null;
    if (m.flag === 'castleK') { n[m.to - 1] = n[m.to + 1]; n[m.to + 1] = null; }
    if (m.flag === 'castleQ') { n[m.to + 1] = n[m.to - 2]; n[m.to - 2] = null; }
    if (m.cap) G.caps[mover].push(m.cap);
    G.ids = n;
    G.s = E.makeMove(G.s, m, true);
    G.last = { from: m.from, to: m.to };
    G.sel = -1;
    G.hint = null;
    G.msg = (opts && opts.msg) || null;
    if (G.mode === 'online' && mover === G.human && !(opts && opts.remote)) netSend({ t: 'move', from: m.from, to: m.to, promo: m.promo });
    if (m.cap) SFX.capture(); else SFX.move();
    render(true);
    const el = pieceEls.get(n[m.to]);
    if (el) { el.classList.remove('land'); void el.offsetWidth; el.classList.add('land'); }
    afterTurn(true);
  }

  function afterTurn(moved) {
    const res = E.gameResult(G.s);
    if (res) { finish(res); return; }
    if (moved && E.inCheck(G.s)) setTimeout(SFX.check, 160);
    startClock();
    render(false);
    if (G.mode === 'ai' && G.s.turn !== G.human) aiTurn();
  }

  async function aiTurn() {
    const my = ++token;
    G.thinking = true;
    render(false);
    const t0 = Date.now();
    const m = await think('move', G.s, G.level);
    const wait = Math.max(0, 550 - (Date.now() - t0));
    await new Promise((r) => setTimeout(r, wait));
    if (my !== token || !G || G.over) return;
    G.thinking = false;
    const real = m && E.legalMoves(G.s).find((x) => E.sameMove(x, m));
    if (real) applyMove(real);
    else render(false);
  }

  /* 한 수 생각 시간 */
  let clockTimer = null;
  function startClock() {
    clearInterval(clockTimer);
    G.warnShown = false;
    if (!G.timeLimit || G.over || (G.mode !== 'local' && G.s.turn !== G.human)) { G.deadline = 0; return; }
    G.deadline = Date.now() + G.timeLimit * 1000;
    clockTimer = setInterval(tickClock, 250);
  }
  function tickClock() {
    if (!G || G.over || !G.deadline || current !== 'game') return;
    if (!$('#menu').hidden || !$('#promo').hidden) { G.deadline += 250; return; }
    const left = Math.ceil((G.deadline - Date.now()) / 1000);
    const turn = G.s.turn;
    const el = $(`[data-clock="${turn}"]`);
    if (el) el.textContent = fmt(Math.max(0, left));
    const card = $(`[data-card="${turn}"]`);
    if (card) card.classList.toggle('warn', left <= 10 && left > 0);
    if (left <= 10 && left > 0 && el && el.dataset.lastTick !== String(left)) { el.dataset.lastTick = String(left); SFX.tick(); }
    if (left <= 0) {
      clearInterval(clockTimer);
      const moves = E.legalMoves(G.s);
      const m = moves[Math.floor(Math.random() * moves.length)];
      if (m) {
        const fixed = m.promo ? moves.find((x) => x.from === m.from && x.to === m.to && x.promo.toLowerCase() === 'q') || m : m;
        applyMove(fixed, { msg: { cls: 'check', av: [fixed.piece.toLowerCase(), turn, 'happy'], title: '시간이 다 됐어요!', text: '떡이 혼자 폴짝 움직였어요. 다음엔 조금 더 빨리 골라 봐요.' } });
      }
    }
  }

  /* 판 누르기 */
  $('#board').addEventListener('click', (e) => {
    const btn = e.target.closest('.sq');
    if (!btn || !G || G.over || G.thinking || !isHumanTurn()) return;
    audio();
    const sq = Number(btn.dataset.sq);
    const p = G.s.b[sq];
    if (G.sel >= 0) {
      const options = legalFrom(G.sel).filter((m) => m.to === sq);
      if (options.length) {
        G.msg = null;
        if (options.length > 1) { askPromo(options); return; }
        applyMove(options[0]);
        return;
      }
    }
    if (p && E.colorOf(p) === G.s.turn) {
      G.msg = null;
      if (G.sel === sq) { G.sel = -1; render(false); return; }
      const moves = legalFrom(sq);
      const el = pieceEls.get(G.ids[sq]);
      if (!moves.length) {
        G.sel = -1;
        SFX.nope();
        G.msg = E.inCheck(G.s)
          ? { cls: 'check', av: ['k', G.s.turn, 'nervous'], title: '이 떡은 킹을 못 지켜요', text: '체크일 땐 킹을 지킬 수 있는 떡만 움직일 수 있어요.' }
          : { cls: '', av: [p.toLowerCase(), G.s.turn, 'nervous'], title: '이 떡은 지금 못 움직여요', text: '길이 막혔거나, 움직이면 킹이 위험해져요.' };
        render(false);
        if (el) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); }
        return;
      }
      G.sel = sq;
      SFX.pick();
      render(false);
      if (el) { el.classList.remove('pick'); void el.offsetWidth; el.classList.add('pick'); }
      return;
    }
    if (G.sel >= 0) { G.sel = -1; render(false); }
  });

  /* 승급 고르기 */
  let promoOptions = null;
  function askPromo(options) {
    promoOptions = options;
    const team = G.s.turn;
    $$('#promoRow button').forEach((b) => { $('div', b).innerHTML = pieceSVG(b.dataset.promo, team, 'happy'); });
    $('#promo .sheet').style.transform = facingOn() && team === 'b' ? 'rotate(180deg)' : '';
    $('#promo').hidden = false;
  }
  $('#promoRow').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !promoOptions) return;
    const m = promoOptions.find((x) => x.promo.toLowerCase() === b.dataset.promo);
    promoOptions = null;
    $('#promo').hidden = true;
    if (m) applyMove(m);
  });

  /* 버튼들 */
  $('#screen-game').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    SFX.tap();
    if (act === 'undo') { if (G.mode === 'online') askUndo(); else doUndo(); }
    if (act === 'hint') doHint();
    if (act === 'menu') openMenu();
    if (act === 'again') playAgain();
    if (act === 'home') goHome();
  });
  $('#menuBtn').addEventListener('click', () => { SFX.tap(); openMenu(); });

  // toColor: 그 팀 차례가 될 때까지 되돌림(AI·온라인). 같이 두기는 한 수만
  function doUndo(toColor) {
    const target = toColor || (G.mode === 'local' ? null : G.human);
    if (!G.hist.length || (target && !G.hist.some((h) => h.s.turn === target))) return;
    token++;
    G.thinking = false;
    let h = G.hist.pop();
    if (target) while (h.s.turn !== target && G.hist.length) h = G.hist.pop();
    G.s = h.s; G.ids = h.ids; G.caps = h.caps; G.last = h.last;
    G.sel = -1; G.hint = null;
    G.msg = { cls: '', av: ['k', G.s.turn, 'happy'], title: '한 수 물렀어요', text: '다시 생각해서 둬 볼까요?' };
    for (const el of pieceEls.values()) el.remove();
    pieceEls.clear();
    render(false);
    startClock();
  }

  async function doHint() {
    if (!isHumanTurn() || G.thinking) return;
    const my = ++token;
    G.msg = { cls: 'wait', av: ['b', G.s.turn, 'normal'], title: '힌트를 찾고 있어요…', text: '똑똑 떡이 같이 생각해 볼게요.' };
    render(false);
    const m = await think('hint', G.s);
    if (my !== token || G.over) return;
    G.msg = null;
    G.sel = -1;
    G.hint = m ? { from: m.from, to: m.to } : null;
    render(false);
  }

  /* ---------- 온라인 대결 (방 번호로 두 기기를 직접 연결) ---------- */
  const NET = { peer: null, conn: null, role: null, code: '', oppName: '', cfg: null, started: false, joinTimer: null, waitingAgain: false };
  const PEER_PREFIX = 'malangmalang-v1-';
  const PEER_LIB = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  let joinDigits = '';

  function loadPeerLib() {
    if (window.Peer) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEER_LIB;
      s.onload = () => (window.Peer ? resolve() : reject(new Error('no Peer')));
      s.onerror = () => reject(new Error('load failed'));
      document.head.appendChild(s);
    });
  }
  const peerOptions = () => Object.assign({ debug: 0 }, window.MALANG_PEER || {});
  function onlineView(name) { for (const v of ['choose', 'join', 'wait']) $('#on-' + v).hidden = v !== name; }
  function onlineStatus(text, bad) {
    const el = $('#onStatus');
    el.textContent = text || '';
    el.classList.toggle('bad', !!bad);
  }
  function netSend(msg) { try { if (NET.conn && NET.conn.open) NET.conn.send(msg); } catch (e) { /* 연결이 끊긴 경우 */ } }
  function netClose() {
    clearTimeout(NET.joinTimer);
    const { conn, peer } = NET;
    NET.conn = null; NET.peer = null; NET.started = false; NET.waitingAgain = false;
    try { if (conn) conn.close(); } catch (e) { /* 이미 닫힘 */ }
    try { if (peer) peer.destroy(); } catch (e) { /* 이미 닫힘 */ }
  }
  function netLeave() { netSend({ t: 'bye' }); setTimeout(netClose, 200); }
  function canGoOnline() {
    if (typeof RTCPeerConnection === 'undefined') {
      onlineStatus('여기서는 온라인 대결을 할 수 없어요. 깃허브에 올린 주소에서 열어 주세요.', true);
      return false;
    }
    return true;
  }

  function openOnline() {
    netClose();
    joinDigits = '';
    renderDigits();
    onlineView('choose');
    onlineStatus('');
    show('online');
  }
  $('#onCreate').addEventListener('click', () => { SFX.tap(); openSetup('online'); });
  $('#onJoin').addEventListener('click', () => { SFX.tap(); joinDigits = ''; renderDigits(); onlineView('join'); onlineStatus('친구가 알려 준 방 번호 네 자리를 눌러요.'); });
  $('#onCancel').addEventListener('click', () => { SFX.tap(); openOnline(); });
  $('#numpad').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    SFX.tap();
    if (b.dataset.k === 'del') joinDigits = joinDigits.slice(0, -1);
    else if (b.dataset.k === 'go') { if (joinDigits.length === 4) joinRoom(joinDigits); return; }
    else if (joinDigits.length < 4) joinDigits += b.dataset.k;
    renderDigits();
  });
  function renderDigits() {
    const cells = $$('#joinCode span');
    cells.forEach((c, i) => { c.textContent = joinDigits[i] || ''; });
    $('#numpad [data-k="go"]').disabled = joinDigits.length !== 4;
  }

  async function hostRoom() {
    const cfg = Object.assign({}, store.setup.online);
    NET.cfg = cfg;
    netClose();
    show('online');
    onlineView('wait');
    $('#waitCode').textContent = '····';
    onlineStatus('방을 만들고 있어요…');
    if (!canGoOnline()) return;
    try { await loadPeerLib(); } catch (e) { onlineStatus('온라인 준비물을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', true); return; }
    NET.role = 'host';
    const tryOpen = (n) => {
      const code = String(1000 + Math.floor(Math.random() * 9000));
      const peer = new window.Peer(PEER_PREFIX + code, peerOptions());
      NET.peer = peer;
      peer.on('open', () => {
        NET.code = code;
        $('#waitCode').textContent = code;
        onlineStatus('친구를 기다리고 있어요. 친구 기기에서 “방 들어가기”를 누르고 이 번호를 넣어요.');
      });
      peer.on('error', (err) => {
        if (err && err.type === 'unavailable-id' && n < 6) { try { peer.destroy(); } catch (e) { /* 무시 */ } tryOpen(n + 1); return; }
        netError(err);
      });
      peer.on('connection', (conn) => {
        if (NET.conn) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
        bindConn(conn);
        conn.on('open', () => { NET.oppName = ''; hostStart(); });
      });
    };
    tryOpen(0);
  }

  function hostStart() {
    const cfg = NET.cfg;
    const rules = { castle: !!cfg.castle, ep: !!cfg.ep, promoChoice: !!cfg.promoChoice };
    netSend({ t: 'start', name: me().name, hostTeam: cfg.team, rules, time: cfg.time });
    NET.started = true;
    NET.waitingAgain = false;
    startGame('online', { team: cfg.team, castle: rules.castle, ep: rules.ep, promoChoice: rules.promoChoice, time: cfg.time });
  }

  async function joinRoom(code) {
    if (!canGoOnline()) return;
    onlineStatus('방을 찾고 있어요…');
    netClose();
    try { await loadPeerLib(); } catch (e) { onlineStatus('온라인 준비물을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', true); return; }
    NET.role = 'guest';
    const peer = new window.Peer(undefined, peerOptions());
    NET.peer = peer;
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code, { reliable: true });
      bindConn(conn);
      NET.joinTimer = setTimeout(() => { if (!NET.started) onlineStatus('방을 찾지 못했어요. 번호를 다시 확인해 주세요.', true); }, 12000);
    });
    peer.on('error', (err) => {
      if (err && err.type === 'peer-unavailable') onlineStatus('그 번호의 방이 없어요. 번호를 다시 확인해 주세요.', true);
      else netError(err);
    });
  }

  function bindConn(conn) {
    NET.conn = conn;
    conn.on('data', onNetData);
    conn.on('close', onNetLost);
    conn.on('error', onNetLost);
  }

  function netError(err) {
    const type = err && err.type;
    const text = type === 'browser-incompatible' ? '이 브라우저에서는 온라인 대결을 할 수 없어요.'
      : type === 'network' || type === 'server-error' || type === 'socket-error' ? '연결 서버에 닿지 않아요. 인터넷 연결을 확인해 주세요.'
        : '연결에 문제가 생겼어요. 잠시 뒤에 다시 해 주세요.';
    if (current === 'game' && G && G.mode === 'online') onNetLost();
    else onlineStatus(text, true);
  }

  function onNetData(d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'start' && NET.role === 'guest') {
      clearTimeout(NET.joinTimer);
      NET.oppName = String(d.name || '친구').slice(0, 10);
      NET.started = true;
      NET.waitingAgain = false;
      const rules = d.rules || {};
      netSend({ t: 'hello', name: me().name });
      startGame('online', { team: d.hostTeam === 'w' ? 'b' : 'w', castle: !!rules.castle, ep: !!rules.ep, promoChoice: !!rules.promoChoice, time: Number(d.time) || 0 });
      return;
    }
    if (d.t === 'hello' && NET.role === 'host') { NET.oppName = String(d.name || '친구').slice(0, 10); if (G) render(false); return; }
    if (d.t === 'full') { onlineStatus('이미 다른 친구가 들어간 방이에요.', true); netClose(); return; }
    if (!G || G.mode !== 'online') return;
    if (d.t === 'move') {
      if (G.over || G.s.turn === G.human) return;
      const m = E.legalMoves(G.s).find((x) => x.from === d.from && x.to === d.to && (x.promo || '') === (d.promo || ''));
      if (m) applyMove(m, { remote: true });
      return;
    }
    if (d.t === 'undo-ask') { showAsk(d.color); return; }
    if (d.t === 'undo-ok') { doUndo(G.human); return; }
    if (d.t === 'undo-no') {
      G.msg = { cls: '', av: ['k', G.human, 'normal'], title: '친구가 안 된대요', text: '이번 수는 그대로 두고 계속해요.' };
      render(false);
      return;
    }
    if (d.t === 'again') {
      if (NET.role === 'host') hostStart();
      return;
    }
    if (d.t === 'bye') { onNetLost(); }
  }

  function onNetLost() {
    if (!NET.conn && !NET.started) return;
    const wasPlaying = current === 'game' && G && G.mode === 'online';
    netClose();
    if (!wasPlaying) { if (current === 'online') onlineStatus('친구와 연결이 끊어졌어요.', true); return; }
    clearInterval(clockTimer);
    $('#ask').hidden = true;
    $('#win').hidden = true;
    showNotice('친구와 연결이 끊어졌어요', G.over ? '다음에 또 같이 둬요!' : '이 판은 전적에 남지 않아요.');
  }

  function askUndo() {
    if (!canUndo() || G.over) return;
    netSend({ t: 'undo-ask', color: G.human });
    G.msg = { cls: 'wait', av: ['k', G.human, 'normal'], title: '친구에게 물어보는 중…', text: '친구가 괜찮다고 하면 한 수 물러요.' };
    render(false);
  }
  let askColor = null;
  function showAsk(color) {
    askColor = color;
    $('#askTitle').textContent = `${josa(NET.oppName || '친구', '이', '가')} 한 수 물러 달래요`;
    $('#askText').textContent = '괜찮으면 “좋아요”를 눌러 주세요.';
    $('#askYes').hidden = false; $('#askNo').textContent = '안 돼요';
    $('#ask').hidden = false;
  }
  function showNotice(title, text) {
    askColor = null;
    $('#askTitle').textContent = title;
    $('#askText').textContent = text;
    $('#askYes').hidden = true; $('#askNo').textContent = '처음으로';
    $('#ask').hidden = false;
  }
  $('#askYes').addEventListener('click', () => {
    SFX.tap();
    $('#ask').hidden = true;
    if (askColor) { netSend({ t: 'undo-ok' }); doUndo(askColor); }
  });
  $('#askNo').addEventListener('click', () => {
    SFX.tap();
    $('#ask').hidden = true;
    if (askColor) { netSend({ t: 'undo-no' }); askColor = null; return; }
    show('start');
  });

  function onlineAgain() {
    if (!NET.conn) { openOnline(); return; }
    $('#win').hidden = true;
    if (NET.role === 'host') { hostStart(); return; }
    netSend({ t: 'again' });
    NET.waitingAgain = true;
    G.msg = { cls: 'wait', av: ['k', G.human, 'happy'], title: '친구에게 한 판 더 하자고 했어요', text: '방장이 준비되면 바로 시작해요.' };
    render(false);
  }

  /* ---------- 결과 ---------- */
  function resultTitle() {
    const r = G.over;
    if (!r.winner) return '비겼어요!';
    if (G.mode === 'ai') return r.winner === G.human ? `${TEAM_NAME[r.winner]} 팀이 이겼어요!` : `${josa(LEVEL_NAMES[G.level], '이', '가')} 이겼어요`;
    return `${TEAM_NAME[r.winner]} 팀이 이겼어요!`;
  }
  function resultSub() {
    const r = G.over;
    const loser = r.winner === 'w' ? 'b' : 'w';
    if (r.type === 'checkmate') {
      if (G.mode !== 'local' && r.winner !== G.human) return '아쉬워요! 다음 판에 다시 해 봐요.';
      return `체크메이트! ${TEAM_NAME[loser]} 킹이 더 이상 도망갈 곳이 없어요.`;
    }
    return {
      stalemate: '움직일 수 있는 떡이 없는데 체크는 아니에요. 스테일메이트예요.',
      material: '서로 체크메이트할 떡이 모자라요.',
      fifty: '50번 동안 잡지도, 폰을 움직이지도 않았어요.',
      repetition: '똑같은 모양이 세 번 나왔어요.'
    }[r.type] || '';
  }

  function finish(res) {
    G.over = res;
    G.sel = -1; G.hint = null; G.thinking = false;
    clearInterval(clockTimer);
    let stamp = '';
    if (!G.recorded) {
      G.recorded = true;
      const p = me();
      const outcome = !res.winner ? 'd' : res.winner === G.human ? 'w' : 'l';
      if (G.mode === 'ai') {
        const rec = p.ai[G.level];
        if (outcome === 'w' && rec.w === 0) {
          stamp = `${LEVEL_NAMES[G.level]} 도장 쾅!` + (G.level < 4 ? ` 다음은 ${LEVEL_NAMES[G.level + 1]}예요` : ' 대장 떡까지 이겼어요!');
        }
        rec[outcome]++;
      } else if (G.mode === 'online') {
        p.online[outcome]++;
      } else {
        p.local[outcome]++;
      }
      save();
    }
    render(true);
    const humanLost = G.mode !== 'local' && res.winner && res.winner !== G.human;
    setTimeout(() => {
      if (!res.winner) SFX.draw(); else if (humanLost) SFX.lose(); else SFX.win();
      showWin(stamp, humanLost);
    }, 650);
  }

  function showWin(stamp, humanLost) {
    const r = G.over;
    const team = r.winner || 'w';
    const mood = humanLost ? 'normal' : 'happy';
    $('#winTrio').innerHTML = pc('q', team, mood) + pc('k', team, 'happy') + pc('n', r.winner ? team : 'b', mood);
    $('#winTitle').textContent = resultTitle();
    $('#winSub').textContent = resultSub();
    const st = $('#winStamp');
    st.hidden = !stamp;
    st.textContent = stamp;
    $('#win .sheet').style.transform = facingOn() && r.winner === 'b' ? 'rotate(180deg)' : '';
    const conf = $('#confetti');
    conf.innerHTML = '';
    if (!humanLost) {
      const colors = ['#FFD95C', '#FF9DB4', '#A6E0C4', '#B9C9F0', '#FFAE6B', '#9ED98A'];
      let html = '';
      for (let i = 0; i < 46; i++) {
        const round = i % 3 === 0;
        html += `<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-duration:${2.4 + Math.random() * 2.2}s;animation-delay:${Math.random() * 1.2}s;${round ? 'border-radius:50%;width:13px;height:13px' : ''}"></i>`;
      }
      conf.innerHTML = html;
    }
    $('#win').hidden = false;
  }
  $('#again').addEventListener('click', () => { SFX.tap(); playAgain(); });
  $('#home').addEventListener('click', () => { SFX.tap(); goHome(); });
  function playAgain() {
    if (G.mode === 'online') { onlineAgain(); return; }
    startGame(G.mode);
  }
  function goHome() {
    clearInterval(clockTimer);
    token++;
    $('#win').hidden = true;
    if (G && G.mode === 'online') netLeave();
    show('start');
  }
  $('#seeBoard').addEventListener('click', () => { SFX.tap(); $('#win').hidden = true; render(false); });

  /* ---------- 메뉴 ---------- */
  function buildSwatches() {
    $('#wfSw').innerHTML = WHITE_FILLS.map((c, i) => `<button type="button" class="swatch" data-sw="wf" data-i="${i}" style="background:${c}" aria-label="흰 떡 색 ${i + 1}" aria-pressed="false"></button>`).join('');
    $('#bfSw').innerHTML = BLACK_FILLS.map((c, i) => `<button type="button" class="swatch" data-sw="bf" data-i="${i}" style="background:${c}" aria-label="검은 떡 색 ${i + 1}" aria-pressed="false"></button>`).join('');
    $('#tileSw').innerHTML = TILES.map((t, i) => `<button type="button" class="swatch tiles-swatch" data-sw="tiles" data-i="${i}" aria-label="판 색 ${i + 1}" aria-pressed="false"><span style="background:${t[0]}"></span><span style="background:${t[1]}"></span><span style="background:${t[1]}"></span><span style="background:${t[0]}"></span></button>`).join('');
  }
  function renderMenu() {
    $$('#menu .swatch').forEach((b) => b.setAttribute('aria-pressed', String(store.settings[b.dataset.sw] === Number(b.dataset.i))));
    $('#soundSwitch').setAttribute('aria-pressed', String(store.settings.sound));
    $('#facingSwitch').setAttribute('aria-pressed', String(store.settings.facing));
    $('#facingRow').hidden = !(G && G.mode === 'local');
  }
  function openMenu() {
    $('#menuMain').hidden = false;
    $('#menuQuit').hidden = true;
    renderMenu();
    $('#menu').hidden = false;
  }
  $('#menu').addEventListener('click', (e) => {
    if (e.target.id === 'menu') { $('#menu').hidden = true; return; }
    const sw = e.target.closest('.swatch');
    if (sw) {
      store.settings[sw.dataset.sw] = Number(sw.dataset.i);
      save(); applyColors(); renderMenu(); SFX.tap();
      if (G) { for (const el of pieceEls.values()) el.dataset.sig = ''; render(false); }
    }
  });
  $('#soundSwitch').addEventListener('click', () => { store.settings.sound = !store.settings.sound; save(); renderMenu(); SFX.tap(); });
  $('#facingSwitch').addEventListener('click', () => { store.settings.facing = !store.settings.facing; save(); renderMenu(); SFX.tap(); layoutGame(); });
  $('#menuClose').addEventListener('click', () => { SFX.tap(); $('#menu').hidden = true; });
  $('#quitAsk').addEventListener('click', () => {
    SFX.tap();
    if (!G || G.over) { $('#menu').hidden = true; show('start'); return; }
    $('#menuMain').hidden = true; $('#menuQuit').hidden = false;
  });
  $('#quitNo').addEventListener('click', () => { SFX.tap(); $('#menuMain').hidden = false; $('#menuQuit').hidden = true; });
  $('#quitYes').addEventListener('click', () => { SFX.tap(); $('#menu').hidden = true; goHome(); });

  /* ---------- 말 설명 ---------- */
  function buildGuide() {
    const glyph = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };
    const hat = { k: '노란 왕관', q: '분홍 리본', r: '성 모양 모자', b: '방울 고깔모자', n: '말 귀와 갈기', p: '새싹' };
    const pattern = (k) => {
      const cells = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const dr = r - 2, dc = c - 2;
        let cls = (r + c) % 2 ? 'd' : '';
        if (dr === 0 && dc === 0) cls += ' me';
        else if (k === 'k' && Math.abs(dr) <= 1 && Math.abs(dc) <= 1) cls += ' go';
        else if (k === 'q' && (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) cls += ' go';
        else if (k === 'r' && (dr === 0 || dc === 0)) cls += ' go';
        else if (k === 'b' && Math.abs(dr) === Math.abs(dc)) cls += ' go';
        else if (k === 'n' && ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2))) cls += ' go';
        else if (k === 'p' && dc === 0 && dr === -1) cls += ' go';
        else if (k === 'p' && dr === -1 && Math.abs(dc) === 1) cls += ' hit';
        cells.push(`<i class="${cls.trim()}"></i>`);
      }
      return `<div class="mini" aria-hidden="true">${cells.join('')}</div>`;
    };
    $('#guideGrid').innerHTML = ['k', 'q', 'r', 'b', 'n', 'p'].map((k) => `
      <div class="gcard">
        <div style="width: 84px; flex: none">${pieceSVG(k, 'w', 'happy')}</div>
        <div class="gtext">
          <b>${KIND_NAME[k]}</b>
          <span class="real">${hat[k]} · 진짜 체스 말 <span>${glyph[k]}</span></span>
          <p>${EXPLAIN[k]}</p>
        </div>
        ${pattern(k)}
      </div>`).join('');
  }

  /* ---------- 프로필 ---------- */
  const AV_KINDS = ['p', 'n', 'b', 'r', 'q', 'k'];
  function renderProfile() {
    const p = me();
    $('#plist').innerHTML = store.profiles.map((x) => `<button type="button" class="pitem" data-pid="${x.id}" aria-pressed="${x.id === p.id}">${pc(x.avatar.kind, x.avatar.team, x.id === p.id ? 'happy' : 'normal')}<span></span></button>`).join('');
    $$('#plist .pitem').forEach((b) => { $('span', b).textContent = store.profiles.find((x) => x.id === b.dataset.pid).name; });
    const tot = wld();
    for (const r of p.ai.concat([p.local, p.online])) { tot.w += r.w; tot.l += r.l; tot.d += r.d; }
    $('#pdetail').innerHTML = `
      <div class="pname">
        <button type="button" class="big-av" id="avBtn" aria-label="대표 떡 바꾸기">${pieceSVG(p.avatar.kind, p.avatar.team, 'happy')}</button>
        <label for="nameInput" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">이름</label>
        <input id="nameInput" maxlength="10" autocomplete="off">
      </div>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap"><p class="note" style="flex:1 1 220px">대표 떡을 누르면 모양이 바뀌어요. 이름은 눌러서 고칠 수 있어요.</p><button type="button" class="btn" id="avTeam" style="min-height:44px; font-size:17px">${p.avatar.team === 'w' ? '검은 떡으로' : '흰 떡으로'}</button></div>
      <div class="stats">
        <div class="stat" style="background: var(--yellow)"><b>${tot.w}</b><span>이겼어요</span></div>
        <div class="stat" style="background: #F1ECE6"><b>${tot.l}</b><span>졌어요</span></div>
        <div class="stat" style="background: var(--mint)"><b>${tot.d}</b><span>비겼어요</span></div>
      </div>
      <h2 class="label">AI 떡 이기기 도장</h2>
      <div class="stamps">${p.ai.map((r, i) => `<div class="stampbox${r.w ? ' on' : ''}">${pc(LEVEL_KINDS[i], 'b', r.w ? 'sad' : 'normal')}<b>${LEVEL_NAMES[i]}</b><small>${r.w ? '도장 쾅!' : '아직이에요'}</small><small>${r.w}승 ${r.l}패 ${r.d}무</small></div>`).join('')}</div>
      <p class="note">같이 두기: ${p.local.w}승 ${p.local.l}패 ${p.local.d}무 · 온라인: ${p.online.w}승 ${p.online.l}패 ${p.online.d}무</p>
      <div id="delArea">${store.profiles.length > 1 ? '<button type="button" class="danger" id="delProfile">이 프로필 지우기</button>' : ''}</div>`;
    $('#nameInput').value = p.name;
  }
  $('#screen-profile').addEventListener('click', (e) => {
    const item = e.target.closest('.pitem');
    if (item) { SFX.tap(); store.current = item.dataset.pid; save(); renderProfile(); return; }
    if (e.target.closest('#avBtn')) {
      SFX.pick();
      const p = me();
      p.avatar.kind = AV_KINDS[(AV_KINDS.indexOf(p.avatar.kind) + 1) % AV_KINDS.length];
      save(); renderProfile(); return;
    }
    if (e.target.id === 'avTeam') {
      SFX.tap();
      const p = me();
      p.avatar.team = p.avatar.team === 'w' ? 'b' : 'w';
      save(); renderProfile(); return;
    }
    if (e.target.id === 'delProfile') {
      $('#delArea').innerHTML = '<p style="font-size:15px; margin-bottom:8px">정말 지울까요? 전적도 함께 사라져요.</p><div class="row" style="display:flex; gap:10px"><button type="button" class="btn" id="delNo">그대로 두기</button><button type="button" class="btn pink" id="delYes">지우기</button></div>';
      return;
    }
    if (e.target.id === 'delNo') { renderProfile(); return; }
    if (e.target.id === 'delYes') {
      store.profiles = store.profiles.filter((x) => x.id !== store.current);
      store.current = store.profiles[0].id;
      save(); renderProfile();
    }
  });
  $('#screen-profile').addEventListener('input', (e) => {
    if (e.target.id !== 'nameInput') return;
    const v = e.target.value.trim();
    if (v) { me().name = v; save(); $$('#plist .pitem').forEach((b) => { if (b.dataset.pid === store.current) $('span', b).textContent = v; }); }
  });
  $('#addProfile').addEventListener('click', () => {
    SFX.tap();
    const p = newProfile('친구 ' + (store.profiles.length + 1));
    p.avatar.kind = AV_KINDS[store.profiles.length % AV_KINDS.length];
    store.profiles.push(p);
    store.current = p.id;
    save(); renderProfile();
    const inp = $('#nameInput'); inp.focus(); inp.select();
  });

  /* ---------- 시작 ---------- */
  applyColors();
  buildStatic();
  show('start');

  // 테스트용 손잡이
  window.__malang = { get G() { return G; }, startGame, store, E };
})();
