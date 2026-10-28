const E = require('../src/engine.js');
const assert = require('assert');
let pass = 0;
function check(name, got, want) {
  assert.strictEqual(got, want, `${name}: got ${got}, want ${want}`);
  pass++; console.log('ok', name, got);
}

// 표준 perft 수치 (규칙이 정확한지 확인)
const start = E.newGame();
check('start d1', E.perft(start, 1), 20);
check('start d2', E.perft(start, 2), 400);
check('start d3', E.perft(start, 3), 8902);
check('start d4', E.perft(start, 4), 197281);
const kiwi = E.parseFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
check('kiwipete d1', E.perft(kiwi, 1), 48);
check('kiwipete d2', E.perft(kiwi, 2), 2039);
check('kiwipete d3', E.perft(kiwi, 3), 97862);
const p3 = E.parseFEN('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
check('pos3 d4', E.perft(p3, 4), 43238);
const p4 = E.parseFEN('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
check('pos4 d3', E.perft(p4, 3), 9467);
const p5 = E.parseFEN('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');
check('pos5 d3', E.perft(p5, 3), 62379);

// 규칙 끄기
const noCastle = E.parseFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', { castle: false });
check('castle off', E.legalMoves(noCastle).filter((m) => m.flag.startsWith('castle')).length, 0);
const castleOn = E.parseFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
check('castle on', E.legalMoves(castleOn).filter((m) => m.flag.startsWith('castle')).length, 2);
const epPos = E.parseFEN('8/8/8/3pP3/8/8/8/4K2k w - d6 0 1');
check('ep on', E.legalMoves(epPos).filter((m) => m.flag === 'ep').length, 1);
const epOff = E.parseFEN('8/8/8/3pP3/8/8/8/4K2k w - d6 0 1', { ep: false });
check('ep off', E.legalMoves(epOff).filter((m) => m.flag === 'ep').length, 0);
const promo = E.parseFEN('8/P7/8/8/8/8/8/4K2k w - - 0 1');
check('promo choice', E.legalMoves(promo).filter((m) => m.promo).length, 4);
const promoAuto = E.parseFEN('8/P7/8/8/8/8/8/4K2k w - - 0 1', { promoChoice: false });
check('promo auto queen', E.legalMoves(promoAuto).filter((m) => m.promo === 'Q').length, 1);

// 결과 판정
const mate = E.parseFEN('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
check('fool mate', E.gameResult(mate).type, 'checkmate');
check('fool mate winner', E.gameResult(mate).winner, 'b');
const stale = E.parseFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
check('stalemate', E.gameResult(stale).type, 'stalemate');
const bare = E.parseFEN('8/8/4k3/8/8/3NK3/8/8 w - - 0 1');
check('insufficient', E.gameResult(bare).type, 'material');

// 반복 판정: 나이트를 두 번 왕복
let s = E.newGame();
const play = (from, to) => { const m = E.legalMoves(s).find((x) => x.from === E.nameSq(from) && x.to === E.nameSq(to)); s = E.makeMove(s, m, true); };
for (let i = 0; i < 2; i++) { play('g1', 'f3'); play('g8', 'f6'); play('f3', 'g1'); play('f6', 'g8'); }
check('repetition', E.gameResult(s) && E.gameResult(s).type, 'repetition');

// AI: 한 수 메이트를 찾는지
const mateIn1 = E.parseFEN('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1');
for (const lv of [2, 3, 4]) {
  const m = E.chooseMove(mateIn1, lv, () => 0.99);
  check('level ' + (lv + 1) + ' finds mate', E.sqName(m.to), 'd8');
}
const h = E.hintMove(mateIn1);
check('hint finds mate', E.sqName(h.to), 'd8');

// 단계별 생각 시간
for (let lv = 0; lv < 5; lv++) {
  let g = E.newGame();
  const t0 = Date.now();
  for (let i = 0; i < 6; i++) { const m = E.chooseMove(g, lv); g = E.makeMove(g, m, true); }
  console.log(`level ${lv + 1}: 6 moves in ${Date.now() - t0}ms`);
}
console.log('passed', pass);
