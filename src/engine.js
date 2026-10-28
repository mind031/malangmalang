/* 말랑말랑 체스 엔진: 규칙 + AI. 브라우저(전역 MalangEngine)와 Node(module.exports) 양쪽에서 동작 */
(function (root) {
  'use strict';

  // 칸 번호: 0 = a8, 7 = h8, 56 = a1, 63 = h1. row 0 = 8단, col 0 = a열
  const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const isWhite = (p) => p !== '' && p === p.toUpperCase();
  const colorOf = (p) => (p === '' ? null : isWhite(p) ? 'w' : 'b');
  const other = (c) => (c === 'w' ? 'b' : 'w');
  const sqName = (i) => 'abcdefgh'[i & 7] + (8 - (i >> 3));
  const nameSq = (n) => (8 - Number(n[1])) * 8 + 'abcdefgh'.indexOf(n[0]);

  const DEFAULT_RULES = { castle: true, ep: true, promoChoice: true };

  function parseFEN(fen, rules) {
    const [placement, turn, castling, ep, half, full] = fen.trim().split(/\s+/);
    const b = new Array(64).fill('');
    let i = 0;
    for (const ch of placement) {
      if (ch === '/') continue;
      if (/\d/.test(ch)) i += Number(ch);
      else b[i++] = ch;
    }
    return {
      b,
      turn: turn || 'w',
      castle: {
        K: (castling || '').includes('K'), Q: (castling || '').includes('Q'),
        k: (castling || '').includes('k'), q: (castling || '').includes('q')
      },
      ep: ep && ep !== '-' ? nameSq(ep) : -1,
      half: Number(half || 0),
      full: Number(full || 1),
      rules: Object.assign({}, DEFAULT_RULES, rules || {}),
      keys: []
    };
  }

  function newGame(rules) {
    const s = parseFEN(START_FEN, rules);
    s.keys = [positionKey(s)];
    return s;
  }

  function positionKey(s) {
    let k = '';
    for (let i = 0; i < 64; i++) k += s.b[i] || '.';
    const c = s.castle;
    return k + s.turn + (c.K ? 'K' : '') + (c.Q ? 'Q' : '') + (c.k ? 'k' : '') + (c.q ? 'q' : '') + s.ep;
  }

  function attacked(b, sq, by) {
    const r = sq >> 3, c = sq & 7;
    const W = by === 'w';
    const P = W ? 'P' : 'p', N = W ? 'N' : 'n', B = W ? 'B' : 'b', R = W ? 'R' : 'r', Q = W ? 'Q' : 'q', K = W ? 'K' : 'k';
    const pr = W ? r + 1 : r - 1;
    if (pr >= 0 && pr < 8) {
      if (c > 0 && b[pr * 8 + c - 1] === P) return true;
      if (c < 7 && b[pr * 8 + c + 1] === P) return true;
    }
    for (const [dr, dc] of KNIGHT) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === N) return true;
    }
    for (const [dr, dc] of KING) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === K) return true;
    }
    for (const [dr, dc] of DIAG) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const p = b[rr * 8 + cc];
        if (p !== '') { if (p === B || p === Q) return true; break; }
        rr += dr; cc += dc;
      }
    }
    for (const [dr, dc] of ORTH) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const p = b[rr * 8 + cc];
        if (p !== '') { if (p === R || p === Q) return true; break; }
        rr += dr; cc += dc;
      }
    }
    return false;
  }

  function kingSquare(b, color) {
    const K = color === 'w' ? 'K' : 'k';
    for (let i = 0; i < 64; i++) if (b[i] === K) return i;
    return -1;
  }

  function inCheck(s, color) {
    const c = color || s.turn;
    const k = kingSquare(s.b, c);
    return k >= 0 && attacked(s.b, k, other(c));
  }

  function pseudoMoves(s, capturesOnly) {
    const b = s.b, me = s.turn, moves = [];
    const W = me === 'w';
    const promoKinds = s.rules.promoChoice ? ['q', 'r', 'b', 'n'] : ['q'];
    const add = (from, to, piece, cap, flag) => moves.push({ from, to, piece, cap, promo: '', flag: flag || '' });
    const addPawn = (from, to, piece, cap, flag) => {
      const tr = to >> 3;
      if (tr === 0 || tr === 7) {
        for (const k of promoKinds) moves.push({ from, to, piece, cap, promo: W ? k.toUpperCase() : k, flag: '' });
      } else add(from, to, piece, cap, flag);
    };
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (p === '' || colorOf(p) !== me) continue;
      const r = i >> 3, c = i & 7, t = p.toLowerCase();
      if (t === 'p') {
        const dir = W ? -1 : 1, start = W ? 6 : 1;
        const one = i + dir * 8;
        if (!capturesOnly && b[one] === '') {
          addPawn(i, one, p, '', '');
          const two = i + dir * 16;
          if (r === start && b[two] === '') add(i, two, p, '', 'double');
        } else if (capturesOnly && b[one] === '' && ((one >> 3) === 0 || (one >> 3) === 7)) {
          addPawn(i, one, p, '', '');
        }
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (cc < 0 || cc > 7) continue;
          const to = (r + dir) * 8 + cc;
          const q = b[to];
          if (q !== '' && colorOf(q) !== me) addPawn(i, to, p, q, '');
          else if (q === '' && s.rules.ep && to === s.ep) add(i, to, p, W ? 'p' : 'P', 'ep');
        }
      } else if (t === 'n' || t === 'k') {
        for (const [dr, dc] of (t === 'n' ? KNIGHT : KING)) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
          const to = rr * 8 + cc, q = b[to];
          if (q === '') { if (!capturesOnly) add(i, to, p, '', ''); }
          else if (colorOf(q) !== me) add(i, to, p, q, '');
        }
        if (t === 'k' && !capturesOnly && s.rules.castle) {
          const home = W ? 60 : 4;
          const opp = other(me);
          if (i === home && !attacked(b, home, opp)) {
            const canK = W ? s.castle.K : s.castle.k, canQ = W ? s.castle.Q : s.castle.q;
            const R = W ? 'R' : 'r';
            if (canK && b[home + 1] === '' && b[home + 2] === '' && b[home + 3] === R &&
              !attacked(b, home + 1, opp) && !attacked(b, home + 2, opp)) add(i, home + 2, p, '', 'castleK');
            if (canQ && b[home - 1] === '' && b[home - 2] === '' && b[home - 3] === '' && b[home - 4] === R &&
              !attacked(b, home - 1, opp) && !attacked(b, home - 2, opp)) add(i, home - 2, p, '', 'castleQ');
          }
        }
      } else {
        const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
        for (const [dr, dc] of dirs) {
          let rr = r + dr, cc = c + dc;
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            const to = rr * 8 + cc, q = b[to];
            if (q === '') { if (!capturesOnly) add(i, to, p, '', ''); }
            else { if (colorOf(q) !== me) add(i, to, p, q, ''); break; }
            rr += dr; cc += dc;
          }
        }
      }
    }
    return moves;
  }

  // track=true 이면 반복 판정용 기록을 남김(실제 대국), 탐색 중에는 false
  function makeMove(s, m, track) {
    const b = s.b.slice();
    const W = s.turn === 'w';
    b[m.to] = m.promo || m.piece;
    b[m.from] = '';
    if (m.flag === 'ep') b[(m.from & ~7) + (m.to & 7)] = '';
    if (m.flag === 'castleK') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = ''; }
    if (m.flag === 'castleQ') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = ''; }
    const castle = Object.assign({}, s.castle);
    if (m.piece === 'K') { castle.K = false; castle.Q = false; }
    if (m.piece === 'k') { castle.k = false; castle.q = false; }
    for (const sq of [m.from, m.to]) {
      if (sq === 63) castle.K = false;
      if (sq === 56) castle.Q = false;
      if (sq === 7) castle.k = false;
      if (sq === 0) castle.q = false;
    }
    const ns = {
      b,
      turn: W ? 'b' : 'w',
      castle,
      ep: m.flag === 'double' ? (m.from + m.to) / 2 : -1,
      half: (m.piece.toLowerCase() === 'p' || m.cap) ? 0 : s.half + 1,
      full: W ? s.full : s.full + 1,
      rules: s.rules,
      keys: s.keys
    };
    if (track) ns.keys = s.keys.concat([positionKey(ns)]);
    return ns;
  }

  function legalMoves(s) {
    const me = s.turn, opp = other(me);
    return pseudoMoves(s, false).filter((m) => {
      const ns = makeMove(s, m, false);
      return !attacked(ns.b, kingSquare(ns.b, me), opp);
    });
  }

  function legalCaptures(s) {
    const me = s.turn, opp = other(me);
    return pseudoMoves(s, true).filter((m) => {
      const ns = makeMove(s, m, false);
      return !attacked(ns.b, kingSquare(ns.b, me), opp);
    });
  }

  function insufficient(b) {
    const rest = [];
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (p === '' || p === 'K' || p === 'k') continue;
      const t = p.toLowerCase();
      if (t === 'p' || t === 'r' || t === 'q') return false;
      rest.push({ t, light: ((i >> 3) + (i & 7)) % 2 === 0 });
    }
    if (rest.length <= 1) return true;
    // 비숍만 남았고 모두 같은 색 칸이면 무승부
    return rest.every((x) => x.t === 'b') && rest.every((x) => x.light === rest[0].light);
  }

  // result: null(진행 중) | {type, winner}
  function gameResult(s) {
    const moves = legalMoves(s);
    if (moves.length === 0) {
      return inCheck(s) ? { type: 'checkmate', winner: other(s.turn) } : { type: 'stalemate', winner: null };
    }
    if (insufficient(s.b)) return { type: 'material', winner: null };
    if (s.half >= 100) return { type: 'fifty', winner: null };
    const key = s.keys[s.keys.length - 1];
    if (key && s.keys.filter((k) => k === key).length >= 3) return { type: 'repetition', winner: null };
    return null;
  }

  function perft(s, depth) {
    if (depth === 0) return 1;
    const moves = legalMoves(s);
    if (depth === 1) return moves.length;
    let n = 0;
    for (const m of moves) n += perft(makeMove(s, m, false), depth - 1);
    return n;
  }

  /* ---------------- AI ---------------- */
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50]
  };
  const MATE = 100000;

  function evaluate(s) {
    // 흰 떡 기준 점수를 계산해 지금 둘 차례 기준으로 돌려줌
    const b = s.b;
    let score = 0, heavy = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (p === '') continue;
      const t = p.toLowerCase();
      if (t === 'q') heavy += 2;
      else if (t === 'r' || t === 'b' || t === 'n') heavy += 1;
    }
    const endgame = heavy <= 4;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (p === '') continue;
      const t = p.toLowerCase();
      const W = p !== t;
      const idx = W ? i : (7 - (i >> 3)) * 8 + (i & 7);
      const table = t === 'k' && endgame ? PST.ke : PST[t];
      const v = VAL[t] + table[idx];
      score += W ? v : -v;
    }
    return s.turn === 'w' ? score : -score;
  }

  function orderMoves(moves) {
    return moves.sort((a, b) => {
      const sa = (a.cap ? VAL[a.cap.toLowerCase()] * 10 - VAL[a.piece.toLowerCase()] : 0) + (a.promo ? 800 : 0);
      const sb = (b.cap ? VAL[b.cap.toLowerCase()] * 10 - VAL[b.piece.toLowerCase()] : 0) + (b.promo ? 800 : 0);
      return sb - sa;
    });
  }

  function makeSearcher(deadline) {
    let nodes = 0, aborted = false;
    const timeUp = () => {
      if (aborted) return true;
      if ((++nodes & 1023) === 0 && deadline && Date.now() > deadline) aborted = true;
      return aborted;
    };
    function quiesce(s, alpha, beta, qd) {
      if (timeUp()) return 0;
      const stand = evaluate(s);
      if (stand >= beta) return beta;
      if (alpha < stand) alpha = stand;
      if (qd <= 0) return alpha;
      for (const m of orderMoves(legalCaptures(s))) {
        const score = -quiesce(makeMove(s, m, false), -beta, -alpha, qd - 1);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    }
    function negamax(s, depth, alpha, beta, ply, useQ) {
      if (timeUp()) return 0;
      const moves = legalMoves(s);
      if (moves.length === 0) return inCheck(s) ? -MATE + ply : 0;
      if (depth === 0) return useQ ? quiesce(s, alpha, beta, 6) : evaluate(s);
      for (const m of orderMoves(moves)) {
        const score = -negamax(makeMove(s, m, false), depth - 1, -beta, -alpha, ply + 1, useQ);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    }
    // exact=true 이면 모든 수의 정확한 점수를 구함(실수를 섞는 낮은 단계용)
    function rootScores(s, depth, useQ, first, exact) {
      let moves = orderMoves(legalMoves(s));
      if (first) moves = [first].concat(moves.filter((m) => !sameMove(m, first)));
      const out = [];
      let alpha = -Infinity;
      for (const m of moves) {
        const score = -negamax(makeMove(s, m, false), depth - 1, -Infinity, exact ? Infinity : -alpha, 1, useQ);
        if (aborted) break;
        out.push({ m, score });
        if (score > alpha) alpha = score;
      }
      return out;
    }
    return { rootScores, isAborted: () => aborted };
  }

  function sameMove(a, b) { return a && b && a.from === b.from && a.to === b.to && a.promo === b.promo; }

  const LEVELS = [
    { name: '아기 떡', random: 0.75, depth: 1, q: false, noise: 300 },
    { name: '꼬마 떡', random: 0.25, depth: 1, q: true, noise: 120 },
    { name: '보통 떡', random: 0.05, depth: 2, q: true, noise: 40 },
    { name: '똑똑 떡', random: 0, depth: 3, q: true, noise: 12 },
    { name: '대장 떡', random: 0, depth: 6, q: true, noise: 0, time: 1600 }
  ];

  // level: 0~4. rng는 테스트용으로 바꿀 수 있음
  function chooseMove(s, level, rng) {
    rng = rng || Math.random;
    const cfg = LEVELS[Math.max(0, Math.min(4, level))];
    const moves = legalMoves(s);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];
    if (cfg.random && rng() < cfg.random) return moves[Math.floor(rng() * moves.length)];
    const pickBest = (scored) => {
      let best = null, bestScore = -Infinity;
      for (const x of scored) {
        const v = x.score + (cfg.noise ? (rng() * 2 - 1) * cfg.noise : 0);
        if (v > bestScore) { bestScore = v; best = x.m; }
      }
      return best;
    };
    if (cfg.time) {
      const deadline = Date.now() + cfg.time;
      let best = null;
      for (let d = 1; d <= cfg.depth; d++) {
        const searcher = makeSearcher(deadline);
        const scored = searcher.rootScores(s, d, cfg.q, best);
        if (searcher.isAborted() && scored.length === 0) break;
        const top = scored.reduce((a, x) => (!a || x.score > a.score ? x : a), null);
        if (top) best = top.m;
        if (searcher.isAborted() || (top && Math.abs(top.score) > MATE - 100)) break;
      }
      return best || moves[0];
    }
    const searcher = makeSearcher(Date.now() + 4000);
    return pickBest(searcher.rootScores(s, cfg.depth, cfg.q, null, cfg.noise > 0)) || moves[0];
  }

  function hintMove(s) {
    const deadline = Date.now() + 1200;
    let best = null;
    for (let d = 1; d <= 4; d++) {
      const searcher = makeSearcher(deadline);
      const scored = searcher.rootScores(s, d, true, best);
      const top = scored.reduce((a, x) => (!a || x.score > a.score ? x : a), null);
      if (top) best = top.m;
      if (searcher.isAborted()) break;
    }
    return best;
  }

  const api = {
    START_FEN, parseFEN, newGame, legalMoves, makeMove, inCheck, gameResult, perft, attacked,
    kingSquare, positionKey, chooseMove, hintMove, evaluate, sqName, nameSq, colorOf, LEVELS, sameMove
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MalangEngine = api;
})(typeof self !== 'undefined' ? self : this);
