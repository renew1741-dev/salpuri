/* ============================================================
   살풀이 : 천기 — 만세력 확장 메뉴 엔진
   ① 신살·귀인  ② 오늘의 운세(일진)  ③ 신년·12개월
   ④ 재물·사업·적성  ⑤ 택일(길일)
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const TX = global.SajuText;
  const mod = (n, m) => ((n % m) + m) % m;
  const GAN = S.GAN, JI = S.JI, GAN_KO = S.GAN_KO, JI_KO = S.JI_KO;
  const GAN_ELEM = S.GAN_ELEM, JI_ELEM = S.JI_ELEM;
  const ELEM_KO = S.ELEM_KO, ELEM_HANJA = S.ELEM_HANJA;
  const br = (x, y) => global.Gunghap.jiRelations(x, y);
  const el = e => `${ELEM_KO[e]}(${ELEM_HANJA[e]})`;

  /* ---------- 조사 ----------
     한글 음절 · 한자(子·甲…) · "수(水)" 표기를 모두 받아 받침을 보고 조사를 고른다. */
  const HANJA_READ = {};
  GAN.forEach((h, i) => { HANJA_READ[h] = GAN_KO[i]; });
  JI.forEach((h, i) => { HANJA_READ[h] = JI_KO[i]; });
  function baseOf(w) {
    const s = w == null ? '' : String(w);
    const m = s.match(/^([가-힣])\(/);
    if (m) return m[1];
    if (s && HANJA_READ[s]) return HANJA_READ[s];
    return s;
  }
  function josa(w, a, b) {
    const s = baseOf(w);
    if (!s) return b;
    const c = s.charCodeAt(s.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return b;
    return ((c - 0xAC00) % 28) ? a : b;
  }
  const iGa = w => josa(w, '이', '가');
  const eun = w => josa(w, '은', '는');
  const wa = w => josa(w, '과', '와');
  const eul = w => josa(w, '을', '를');

  /* ---------- KST 날짜 ---------- */
  function kstNow() {
    const d = new Date(Date.now() + 9 * 3600 * 1000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay(), hh: d.getUTCHours() };
  }
  function dayGanjiOf(y, m, d) {
    const idx = S.dayGanjiIndex(S.toJDN(y, m, d));
    return { idx, gan: idx % 10, ji: idx % 12 };
  }
  const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
  const wdOf = (y, m, d) => WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const fmt = (y, m, d) => `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;

  /* ============================================================
     ① 신살 · 귀인
     ============================================================ */
  const SAMHAP_SAL = [
    { g: [8, 0, 4], dohwa: 9, yeokma: 2, hwagae: 4 },
    { g: [2, 6, 10], dohwa: 3, yeokma: 8, hwagae: 10 },
    { g: [5, 9, 1], dohwa: 6, yeokma: 11, hwagae: 1 },
    { g: [11, 3, 7], dohwa: 0, yeokma: 5, hwagae: 7 }
  ];
  const CHEONEUL = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 8: [5, 3], 9: [5, 3], 7: [2, 6] };
  const MUNCHANG = { 0: 5, 1: 6, 2: 8, 3: 9, 4: 8, 5: 9, 6: 11, 7: 0, 8: 2, 9: 3 };
  const HONGYEOM = { 0: 6, 1: 6, 2: 2, 3: 7, 4: 4, 5: 4, 6: 10, 7: 9, 8: 0, 9: 8 };
  const HAKDANG = [11, 2, 8, 5, 8];                     // 목해 화인 토신 금사 수신
  const WOLDEOK = { 2: 2, 6: 2, 10: 2, 8: 8, 0: 8, 4: 8, 5: 6, 9: 6, 1: 6, 11: 0, 3: 0, 7: 0 };
  const CHEONDEOK = { 2: [3], 3: [8], 4: [8], 5: [7], 6: [11], 7: [0], 8: [9], 9: [2], 10: [2], 11: [1], 0: [5], 1: [6] };
  const GWEGANG = [[6, 4], [6, 10], [8, 4], [4, 10]];
  const BAEKHO = [[0, 4], [1, 7], [2, 10], [3, 1], [4, 4], [8, 10], [9, 1]];

  const SINSAL_INFO = {
    '도화살': { h: '桃花煞', tag: '매력', mean: '사람의 시선을 끄는 힘이에요. 이성뿐 아니라 대중의 마음을 잡는 자리라서, 얼굴보다 분위기에서 나와요. 사람이 모이는 곳에 서면 이 기운이 먼저 움직여요.', use: '호감은 재능이고 선택은 별개의 일이에요. 결정 전에 상대의 행동을 한 달만 지켜보세요. 무대가 있는 일에 쓰면 그대로 돈이 돼요.' },
    '역마살': { h: '驛馬煞', tag: '이동', mean: '한곳에 머물기보다 움직이면서 기회를 잡는 자리예요. 이사·출장·이직·해외처럼 자리를 옮기는 일에서 운이 트여요.', use: '한 해에 한 번은 큰 이동을 계획하되 돌아올 자리는 꼭 남기세요. 움직임이 잦을수록 기록을 남겨야 자산이 돼요.' },
    '화개살': { h: '華蓋煞', tag: '몰입', mean: '예술·종교·탐구에 깊이 빠지는 힘이에요. 혼자 있는 시간이 곧 생산인 사람이라, 사람들 사이에서도 한 겹 비어 있는 자리가 있어요.', use: '몰입한 결과를 한 달에 한 번은 밖으로 꺼내 놓으세요. 혼자만 아는 재주는 재주로 남고, 꺼낸 재주만 값이 매겨져요.' },
    '홍염살': { h: '紅艶煞', tag: '색', mean: '말과 눈빛에 사람을 끄는 결이 배어 있어요. 조용한데 눈에 띄고, 다정한데 선이 분명한 사람이에요.', use: '사적인 자리보다 일하는 무대에서 쓰세요. 감정에 기대면 관계가 꼬이고, 콘텐츠·영업·상담에 쓰면 무기가 돼요.' },
    '백호살': { h: '白虎煞', tag: '기세', mean: '급한 성질과 강한 생명력이 같이 있어요. 위기에서 남보다 빨리 움직이고, 한 번 물면 놓지 않죠.', use: '차량·칼·운동처럼 몸을 쓰는 일에서 한 번 더 확인하세요. 이 기세는 다스리면 결단이 되고, 놓으면 사고가 돼요.' },
    '괴강살': { h: '魁罡煞', tag: '강단', mean: '한번 마음먹으면 물러서지 않는 기세예요. 어려운 자리에서 오히려 강해지고, 남이 못 내리는 결정을 대신 내요.', use: '중요한 결정 전에 반대 의견을 한 사람에게 꼭 들어보세요. 이 기운은 혼자 쓸 때 제일 위험해요.' },
    '천을귀인': { h: '天乙貴人', tag: '귀인', mean: '막히는 순간에 사람이 나타나는 자리예요. 그것도 부탁하지 않았는데 먼저 손을 내미는 사람으로 와요.', use: '도움을 받은 날, 그 사람에게 결과를 꼭 알려 주세요. 그 한 번의 보고가 귀인을 오래 붙잡아요.' },
    '문창귀인': { h: '文昌貴人', tag: '글', mean: '글과 말로 먹고사는 팔자예요. 문서·강의·기록이 쌓이면 그대로 자산이 되고, 말 한마디로 사람을 움직여요.', use: '매일 한 문단이라도 써 보세요. 이 사주는 기록이 곧 재물이에요.' },
    '학당귀인': { h: '學堂貴人', tag: '배움', mean: '배움이 끊기지 않는 자리예요. 자격·학위·전문 교육이 사람을 살리고, 가르치는 자리에서 이름이 남아요.', use: '한 해에 하나씩 자격을 붙여 보세요. 이 기운은 배우는 동안에만 움직여요.' },
    '월덕귀인': { h: '月德貴人', tag: '덕', mean: '덕으로 사람을 얻는 자리예요. 나이 들수록 주변이 남고, 위기 때 뜻밖의 사람이 도와줘요.', use: '베푼 걸 기억하지 마세요. 이 기운은 계산이 없을 때만 돌아와요.' },
    '천덕귀인': { h: '天德貴人', tag: '복', mean: '큰 액을 작게 넘기는 복이에요. 위기를 겪어도 결정적인 순간에 빠져나오는 자리가 있어요.', use: '위기에서 남을 탓하지 마세요. 그 태도가 이 복을 다음에도 불러요.' }
  };

  function sinsal(a) {
    const items = [];
    const push = (key, hits) => {
      if (!hits.length) return;
      const info = SINSAL_INFO[key];
      items.push({
        key, name: key, hanja: info.h, tag: info.tag,
        hits, mean: info.mean, use: info.use,
        kind: ['천을귀인', '문창귀인', '학당귀인', '월덕귀인', '천덕귀인'].indexOf(key) >= 0 ? 'noble' : 'sal'
      });
    };
    const branches = a.pillars.filter(p => p && p.ji != null).map(p => ({ pos: p.pos, ji: p.ji }));
    const chars = [];
    a.pillars.forEach(p => { if (p && p.gan != null) chars.push({ pos: p.pos, gan: p.gan }); });
    const uniq = arr => {
      const seen = new Set(); const out = [];
      arr.forEach(h => { const k = h.pos + ':' + (h.ji != null ? 'j' + h.ji : 'g' + h.gan); if (!seen.has(k)) { seen.add(k); out.push(h); } });
      return out;
    };
    const scanJi = target => branches.filter(b => b.ji === target).map(b => ({ pos: b.pos, ji: b.ji }));
    const scanGan = target => chars.filter(c => c.gan === target).map(c => ({ pos: c.pos, gan: c.gan }));

    // 삼합 기반 살 — 년지·일지 두 기준
    const bases = [a.pillars.find(p => p.pos === '년'), a.pillars.find(p => p.pos === '일')].filter(Boolean);
    ['도화살', '역마살', '화개살'].forEach((key, i) => {
      const field = ['dohwa', 'yeokma', 'hwagae'][i];
      const hits = [];
      bases.forEach(b => {
        const g = SAMHAP_SAL.find(s => s.g.indexOf(b.ji) >= 0);
        if (!g) return;
        scanJi(g[field]).forEach(h => hits.push(h));
      });
      push(key, uniq(hits));
    });

    push('홍염살', scanJi(HONGYEOM[a.dayGan]));
    push('백호살', BAEKHO.some(([g, j]) => g === a.dayGan && j === a.dayPillar.ji) ? [{ pos: '일', ji: a.dayPillar.ji }] : []);
    push('괴강살', GWEGANG.some(([g, j]) => g === a.dayGan && j === a.dayPillar.ji) ? [{ pos: '일', ji: a.dayPillar.ji }] : []);
    push('천을귀인', uniq(CHEONEUL[a.dayGan].map(j => scanJi(j)).flat()));
    push('문창귀인', scanJi(MUNCHANG[a.dayGan]));
    push('학당귀인', scanJi(HAKDANG[GAN_ELEM[a.dayGan]]));

    const mj = a.monthPillar ? a.monthPillar.ji : a.dayPillar.ji;
    push('월덕귀인', uniq(scanGan(WOLDEOK[mj])));
    const cd = CHEONDEOK[mj] || [];
    push('천덕귀인', uniq(cd.map(t => {
      const byJi = scanJi(t);
      return byJi.length ? byJi : scanGan(t);
    }).flat()));

    const order = ['천을귀인', '천덕귀인', '월덕귀인', '문창귀인', '학당귀인', '도화살', '홍염살', '역마살', '화개살', '괴강살', '백호살'];
    items.sort((x, y) => order.indexOf(x.name) - order.indexOf(y.name));
    const noble = items.filter(i => i.kind === 'noble').length;
    const sal = items.filter(i => i.kind === 'sal').length;

    let summary;
    if (noble && sal) summary = `귀인 ${noble}개와 살(煞) ${sal}개가 같이 있어요. 귀인이 살을 눌러 주는 구조라서, 살은 재능으로 쓰이고 귀인은 결정적인 순간에 와요.`;
    else if (noble) summary = `귀인 ${noble}개가 두드러지고 큰 살(煞)은 없어요. 이 사주는 사람과 문서에서 운이 열리는 쪽이에요.`;
    else if (sal) summary = `살(煞) ${sal}개가 두드러지고 귀인은 약해요. 혼자 힘으로 뚫는 사주라서, 사람을 만드는 습관이 곧 개운법이에요.`;
    else summary = '두드러진 살(煞)도 귀인도 없어요. 운이 사람과 습관에 그대로 반응하는, 맑고 중립적인 사주예요.';

    return { ok: true, items, noble, sal, summary };
  }

  /* ============================================================
     ② 오늘의 운세 (일진)
     ============================================================ */
  const SIJIN = S.SIJIN, SIJIN_RANGE = S.SIJIN_RANGE;

  function today(a, when) {
    const t = when || kstNow();
    const dj = dayGanjiOf(t.y, t.m, t.d);
    const dp = a.dayPillar;
    const ten = S.tenGod(a.dayGan, dj.gan);
    const jrAll = br(dp.ji, dj.ji);
    const jr = jrAll[0];
    const gHap = global.Gunghap.ganRel(a.dayGan, dj.gan);
    const gm = a.gongmang && a.gongmang.jis.indexOf(dj.ji) >= 0;

    let score = 62;
    const reasons = [];
    if (gHap.t === 'hap') { score += 9; reasons.push(`오늘의 천간 ${GAN[dj.gan]}${iGa(GAN[dj.gan])} 내 일간 ${GAN[a.dayGan]}${wa(GAN[a.dayGan])} 잘 맞아요`); }
    else if (gHap.t === 'chung') { score -= 9; reasons.push(`오늘의 천간 ${GAN[dj.gan]}${iGa(GAN[dj.gan])} 내 일간과 부딪혀요`); }
    else if (gHap.t === 'gen') { score += 5; reasons.push('오늘 기운이 내 기운을 살려 줘요'); }
    else if (gHap.t === 'same') { score += 2; reasons.push('오늘 기운이 내 기운과 같은 결이에요'); }
    else if (gHap.t === 'control') { score -= 3; reasons.push('오늘 기운이 내 기운을 눌러요'); }
    jrAll.forEach(r => { if (r.t !== 'none') { score += r.w * 1.1; reasons.push(`오늘 일지 ${JI[dj.ji]}${iGa(JI[dj.ji])} 내 배우자 자리와 ${r.name}(${r.hanja})${eul(r.name)} 이뤄요`); } });
    const GOOD_TEN = { 2: 7, 3: -4, 4: 4, 5: 6, 6: -5, 7: 7, 8: 2, 9: 5, 0: 1, 1: -3 };
    score += GOOD_TEN[ten];
    const ye = [GAN_ELEM[dj.gan], JI_ELEM[dj.ji]];
    const yong = a.yongsin.yong, gi = a.yongsin.gi;
    if (ye.indexOf(yong) >= 0) { score += 5; reasons.push(`오늘 기운에 용신 ${el(yong)}${iGa(el(yong))} 들어 있어요`); }
    if (ye.indexOf(a.yongsin.hee) >= 0) score += 2;
    if (ye.indexOf(gi) >= 0) { score -= 5; reasons.push(`기신 ${el(gi)}${iGa(el(gi))} 강한 날이에요`); }
    if (gm) { score -= 5; reasons.push('내 공망(空亡)에 드는 날 — 서두르면 헛수고예요'); }
    score = Math.max(32, Math.min(98, Math.round(score)));

    const grade = score >= 88 ? '아주 좋은 날' : score >= 76 ? '좋은 날' : score >= 64 ? '무난한 날' : score >= 52 ? '조심할 날' : '피하는 날';

    /* 영역별 한 줄 */
    const wealth = ten === 4 || ten === 5 ? '돈이 실제로 움직이는 날이에요. 미뤄 둔 수금·견적·정산을 오늘 처리해 보세요.'
      : ten === 2 || ten === 3 ? '만들고 파는 일이 먹히는 날이에요. 대신 값을 낮춰 팔면 그 손실이 오래가요.'
        : ten === 0 || ten === 1 ? '지출이 새기 쉬운 날이에요. 지인과의 돈 거래는 오늘만은 미뤄 두세요.'
          : ten === 6 || ten === 7 ? '책임과 서류가 몰리는 날이에요. 확인 없이 서명하지 마세요.'
            : '문서·공부·정리에 힘이 붙는 날이에요. 자격과 기록을 챙기면 남아요.';
    const social = jr.good && jr.t !== 'none' ? '사람을 만나면 일이 풀려요. 먼저 연락할 이유가 하나쯤 생기는 날이에요.'
      : !jr.good ? '말이 세지기 쉬운 날이에요. 답장을 보내기 전에 한 번만 다시 읽어 보세요.'
        : '관계에 큰 파도는 없어요. 오래 미룬 안부 하나가 오히려 값을 해요.';
    const minE = a.ew.pct.indexOf(Math.min(...a.ew.pct)), maxE = a.ew.pct.indexOf(Math.max(...a.ew.pct));
    const health = ye.indexOf(maxE) >= 0 ? `${S.ELEM_ORGAN[maxE]} 쪽이 과열되기 쉬워요. 물과 잠을 먼저 챙기세요.`
      : ye.indexOf(minE) >= 0 ? `${S.ELEM_ORGAN[minE]} 쪽이 신호를 보내는 날이에요. 무리한 일정은 하나만 줄이세요.`
        : '몸의 큰 신호는 없어요. 다만 저녁 이후의 판단은 믿지 마세요.';

    /* 시간대 — 오늘 일지와의 합·충 */
    const hours = SIJIN.map((name, i) => {
      const rs = br(dj.ji, i);
      const good = rs.some(r => r.t === 'yukhap' || r.t === 'banhap');
      const bad = rs.some(r => r.t === 'chung' || r.t === 'hyeong' || r.t === 'pa');
      return { i, name, range: SIJIN_RANGE[i], good, bad };
    });
    const goodHours = hours.filter(h => h.good).slice(0, 2);
    const badHours = hours.filter(h => h.bad).slice(0, 2);

    /* 한 문단 총평 */
    const tenName = S.TEN_GODS[ten];
    const summary = score >= 76
      ? `${tenName}의 기운이 내 자리에 곱게 들어오는 날이에요. ${jr.good && jr.t !== 'none'
        ? '일지가 맞물려 사람과 일이 같이 움직이니까, 미뤄 둔 연락과 결정을 오늘 꺼내 보세요'
        : '큰 걸림돌은 없으니까 혼자 결론 내리기보다 한 사람을 거쳐 말하면 결과가 남아요'}. 오늘 한 일은 이번 주 안에 다시 돌아와요.`
      : score >= 62
        ? `${tenName}의 기운이 오는 무난한 날이에요. 새로 벌이기보다 정리와 확인에 쓰세요. 오늘 내린 판단은 하루 뒤에 다시 볼 때 제일 정확해요.`
        : `${tenName}의 기운이 내 자리와 부딪히는 날이에요. 계약·서명·큰 지출은 미루고, 말은 반 박자 늦게 꺼내세요. 오늘은 이기는 날이 아니라 지키는 날이에요.`;

    const color = a.yongsin.yong;
    return {
      ok: true, date: { y: t.y, m: t.m, d: t.d, wd: WEEKDAY[t.wd], label: `${t.y}년 ${t.m}월 ${t.d}일 (${WEEKDAY[t.wd]})` },
      ganji: { gan: dj.gan, ji: dj.ji, label: `${GAN[dj.gan]}${JI[dj.ji]}일` },
      ten, tenName, score, grade, reasons, summary,
      lines: { wealth, social, health },
      goodHours, badHours,
      luck: {
        color: S.ELEM_COLORNAME[color][0], color2: S.ELEM_COLORNAME[color][1],
        dir: S.ELEM_DIRECTION[color], num: S.ELEM_NUM[color], elem: color
      }
    };
  }

  /* ============================================================
     ③ 신년 · 12개월
     ============================================================ */
  function yearly(a, year) {
    const y = year || 2026;
    const months = TX.monthly2026(a, y).map(m => ({
      ...m, score: Math.max(34, Math.min(96, Math.round(48 + (m.score - 0.42) * 62)))
    }));
    const sorted = months.slice().sort((x, y2) => y2.score - x.score);
    const best = sorted.slice(0, 2), worst = sorted.slice(-2).reverse();
    const yg = mod(y - 4, 10), yj = mod(y - 4, 12);
    const ten = S.tenGod(a.dayGan, yg);
    const jr = br(a.dayPillar.ji, yj);
    const quarters = [0, 1, 2, 3].map(q => {
      const ms = months.slice(q * 3, q * 3 + 3);
      const avg = Math.round(ms.reduce((s, m) => s + m.score, 0) / 3);
      const top = ms.slice().sort((x, y2) => y2.score - x.score)[0];
      const theme = ['봄 — 시작과 계약', '여름 — 확장과 지출', '가을 — 수확과 정리', '겨울 — 저장과 정비'][q];
      const label = avg >= 78 ? '밀어붙일 분기' : avg >= 64 ? '무리 없는 분기' : avg >= 54 ? '정리할 분기' : '지킬 분기';
      const act = avg >= 78
        ? `제일 좋은 달은 <b>${top.start} ${top.name}</b>이에요. 미뤄 둔 일을 이 달에 밀면 결과가 남아요.`
        : avg >= 64
          ? `중심은 <b>${top.start} ${top.name}</b>이에요. 새 일을 벌이기보다 마무리에 힘을 쓰면 값이 올라요.`
          : `그나마 나은 달이 <b>${top.start} ${top.name}</b>이에요. 이 분기에는 계약·투자·이사를 겹치지 않게 두세요.`;
      return { q: q + 1, theme, avg, top, label, act };
    });
    return {
      ok: true, year: y, gan: yg, ji: yj, ganji: `${GAN[yg]}${JI[yj]}`, ten, tenName: S.TEN_GODS[ten],
      theme: TX.SAEUN_THEME[ten], body: TX.SAEUN_BODY[ten],
      months, best, worst, quarters,
      jr: jr.filter(r => r.t !== 'none')
    };
  }

  /* ============================================================
     ④ 재물 · 사업 · 적성
     ============================================================ */
  const WEALTH_PATH = {
    년: '가족과 오래된 인맥 — 어릴 때부터 이어진 사람을 통해 돈이 들어와요. 새 인맥을 만드는 것보다 아는 사람을 다시 찾는 쪽이 빨라요.',
    월: '직장과 거래처, 부모 세대 — 조직 안에서 인정받는 게 곧 수입이에요. 이직보다 지금 자리에서 이름을 올리는 편이 남아요.',
    일: '내 이름과 배우자 — 1인 사업, 개인 브랜드, 배우자와의 공동 작업에서 돈이 붙어요. 회사 이름보다 내 이름을 걸어야 해요.',
    시: '후배와 온라인, 말년의 자산 — 콘텐츠·교육·온라인처럼 시간이 지나도 남는 통로가 맞아요. 지금 심어 두면 5년 뒤에 거둬요.'
  };

  function wealth(a) {
    const cnt = new Array(10).fill(0);
    a.pillars.forEach(p => {
      if (!p || p.gan == null) return;
      if (p.ganTenGod != null) cnt[p.ganTenGod] += 1.2;
      cnt[p.jiTenGod] += 1;
    });
    const self = cnt[0] + cnt[1], output = cnt[2] + cnt[3], money = cnt[4] + cnt[5], officer = cnt[6] + cnt[7], resource = cnt[8] + cnt[9];
    const bizRaw = output * 1.15 + cnt[4] * 1.35 + cnt[6] * 0.75 + cnt[0] * 0.4;
    const jobRaw = cnt[7] * 1.35 + cnt[9] * 1.05 + cnt[5] * 1.0 + cnt[1] * 0.5 + cnt[8] * 0.55;
    const biz = Math.round(Math.max(12, Math.min(88, bizRaw / (bizRaw + jobRaw || 1) * 100)) / 5) * 5;

    const wealthPillars = a.pillars.filter(p => p && p.gan != null && ((p.ganTenGod != null && (p.ganTenGod === 4 || p.ganTenGod === 5)) || p.jiTenGod === 4 || p.jiTenGod === 5));
    const mainPath = wealthPillars.length ? WEALTH_PATH[wealthPillars[0].pos] : '재성이 드러나지 않은 사주예요. 돈은 재능과 이름을 따라 늦게 와요. 값을 낮춰 파는 일이 이 사주에 제일 해로워요.';

    const jeong = cnt[5], pyeon = cnt[4];
    const structure = jeong > pyeon * 1.4 ? '반복되는 수입을 쌓는 구조예요. 월급·임대·정기 결제처럼 같은 돈이 다시 들어오는 장치를 늘리세요.'
      : pyeon > jeong * 1.4 ? '여러 곳에서 돈이 들어오는 구조예요. 통장을 하나로 두면 새는 구멍을 못 봐요. 계좌를 용도별로 나누세요.'
        : '버는 힘과 모으는 힘이 같이 있어요. 들어온 돈의 일정 비율을 먼저 떼어 두는 규칙 하나면 충분해요.';

    const caution = [];
    if (cnt[1] > 0.8) caution.push('겁재(劫財)가 살아 있는 사주예요. 지인 보증·동업·지인 대출이 이 사주에서 제일 크게 새는 구멍이에요.');
    if (cnt[4] > 1.2) caution.push('편재가 강해서 큰돈의 흐름을 먼저 봐요. 다만 한곳에 몰아넣는 투자는 이 사주가 제일 크게 다치는 자리예요.');
    if (cnt[6] > 0.9) caution.push('편관이 강해서 압박이 오면 판을 키우려 해요. 그 순간의 결단은 대개 손실로 돌아와요.');
    if (cnt[3] > 0.9) caution.push('상관이 살아 있어서 말과 아이디어가 앞서요. 계약서에 없는 말은 하지 마세요.');
    if (!caution.length) caution.push('재물을 크게 해치는 살은 두드러지지 않아요. 문제는 속도보다 관리 — 수입의 20%를 손대지 않는 통장으로 먼저 보내세요.');

    const timing = a.daewoon.list.map(d => {
      const tg = S.tenGod(a.dayGan, d.gan);
      const good = tg === 4 || tg === 5 ? 2 : tg === 2 || tg === 3 ? 1 : 0;
      return { ...d, tg, tgName: S.TEN_GODS[tg], good };
    }).filter(d => d.good > 0).slice(0, 3);

    const age = new Date().getFullYear() - a.solar.y;
    const nowDw = a.daewoon.list.find(d => age >= d.startAge && age <= d.endAge) || a.daewoon.list[0];
    const nowTg = S.tenGod(a.dayGan, nowDw.gan);
    const nowNote = nowTg === 4 || nowTg === 5 ? '돈이 직접 움직이는 10년이에요. 벌어들인 걸 남기는 구조를 이 안에 만드세요.'
      : nowTg === 2 || nowTg === 3 ? '만들고 파는 힘이 붙는 10년이에요. 수입 통로를 여러 개로 늘리되, 값을 낮춰 팔지는 마세요.'
        : nowTg === 6 || nowTg === 7 ? '자리와 책임이 먼저 오는 10년이에요. 돈은 그 뒤를 따라와요. 이름을 올리는 데 쓰세요.'
          : nowTg === 8 || nowTg === 9 ? '배움과 문서로 판을 바꾸는 10년이에요. 자격과 전문성이 곧 수입이 돼요.'
            : '경쟁과 분배가 같이 오는 10년이에요. 사람과 돈의 경계를 문서로 남기세요.';
    const verdict = biz >= 62 ? '사업이나 프리랜서 쪽에 몸이 더 맞는 사주예요. 조직에 오래 얹혀 있으면 재능이 값으로 안 바뀌어요.'
      : biz >= 45 ? '직장과 사업 사이의 사주예요. 조직에서 이름을 쌓은 뒤 그 이름으로 개인 일을 붙이는 순서가 제일 안전해요.'
        : '조직 안에서 힘을 내는 사주예요. 다만 회사 이름에만 기대면 나중에 남는 게 적어요. 내 이름의 결과물을 옆에 두세요.';

    return {
      ok: true, biz, job: 100 - biz, powers: { self, output, money, officer, resource, cnt },
      mainPath, structure, caution, timing, nowDw: { ...nowDw, tgName: S.TEN_GODS[nowTg] }, nowNote,
      verdict, jeong, pyeon
    };
  }

  /* ============================================================
     ⑤ 택일
     ============================================================ */
  const PURPOSES = {
    move: { id: 'move', name: '이사', en: 'MOVE', weight: { move: 1 }, tip: '이사는 옮겨 가는 날의 기운이 새 집의 첫 기운이 돼요. 충일과 공망일은 피하세요.' },
    open: { id: 'open', name: '개업 · 사업', en: 'OPEN', weight: { open: 1 }, tip: '개업은 첫 손님을 받는 날의 기운을 3년간 끌고 가요. 재성일과 천을귀인일이 제일 좋아요.' },
    contract: { id: 'contract', name: '중요 계약', en: 'CONTRACT', weight: { contract: 1 }, tip: '계약은 서명하는 날의 기운이 문서에 남아요. 관성일과 육합일을 고르세요.' },
    wedding: { id: 'wedding', name: '결혼 · 상견례', en: 'WEDDING', weight: { wedding: 1 }, tip: '혼인은 두 집안의 기운이 겹치는 날이에요. 육합·천덕귀인일이 제일 좋고 충일은 피하세요.' }
  };

  function rangeOf(kind, now) {
    const t = now || kstNow();
    const y = t.y, m = t.m;
    if (kind === 'next') {
      const nm = m === 12 ? 1 : m + 1, ny = m === 12 ? y + 1 : y;
      const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
      return { label: `${ny}년 ${nm}월`, from: { y: ny, m: nm, d: 1 }, days: last };
    }
    if (kind === '60') return { label: '향후 60일', from: { y, m, d: t.d }, days: 60 };
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { label: `${y}년 ${m}월`, from: { y, m, d: t.d }, days: last - t.d + 1 };
  }

  function taekil(a, purposeId, rangeKind, now) {
    const purpose = PURPOSES[purposeId] || PURPOSES.move;
    const range = rangeOf(rangeKind, now);
    const dp = a.dayPillar;
    const yong = a.yongsin.yong, gi = a.yongsin.gi;
    const gw = a.gongmang ? a.gongmang.jis : [];
    const cheon = CHEONEUL[a.dayGan] || [];
    const cheonD = CHEONDEOK[a.monthPillar ? a.monthPillar.ji : dp.ji] || [];
    const days = [];
    for (let k = 0; k < range.days; k++) {
      const jdn = S.toJDN(range.from.y, range.from.m, range.from.d) + k;
      const dt = S.fromJDN(jdn);
      const dj = dayGanjiOf(dt.y, dt.m, dt.d);
      let score = 56;
      const rs = [];
      const jr = br(dp.ji, dj.ji);
      jr.forEach(r => {
        if (r.t === 'yukhap') { score += 14; rs.push(`일지 ${JI[dj.ji]}${wa(JI[dj.ji])} 육합 — 자리가 맞물리는 날`); }
        else if (r.t === 'banhap' || r.t === 'banghap') { score += 9; rs.push(`일지와 ${r.name} — 기운이 모이는 날이에요`); }
        else if (r.t === 'chung') { score -= 22; rs.push('일지와 충(沖) — 옮기고 어긋나기 쉬운 날이에요'); }
        else if (r.t === 'hyeong') { score -= 12; rs.push('일지와 형(刑) — 말과 절차가 꼬이기 쉬운 날'); }
        else if (r.t === 'pa') { score -= 9; rs.push('일지와 파(破) — 계획이 한 번 어긋나는 날이에요'); }
        else if (r.t === 'hae') { score -= 8; rs.push('일지와 해(害) — 겉은 괜찮은데 속이 상하는 날이에요'); }
      });
      if (cheon.indexOf(dj.ji) >= 0) { score += 12; rs.push('천을귀인일 — 막히면 누가 나타나는 날이에요'); }
      const gHap = global.Gunghap.ganRel(a.dayGan, dj.gan);
      if (gHap.t === 'hap') { score += 7; rs.push('일간 합 — 사람과 말이 잘 붙는 날이에요'); }
      if (gHap.t === 'chung') { score -= 8; rs.push('일간 충 — 말투가 어긋나기 쉬운 날이에요'); }
      const ten = S.tenGod(a.dayGan, dj.gan);
      const tenBonus = { 2: 5, 3: -4, 4: 4, 5: 6, 6: -5, 7: 7, 8: 1, 9: 5, 0: -1, 1: -5 };
      score += tenBonus[ten];
      if ([5, 7, 2, 9].indexOf(ten) >= 0) rs.push(`${S.TEN_GODS[ten]}일 — ${ten === 5 ? '돈이 남는' : ten === 7 ? '문서와 신뢰가 서는' : ten === 2 ? '편안히 먹고사는' : '배움과 도움이 붙는'} 날이에요`);
      const ye = [GAN_ELEM[dj.gan], JI_ELEM[dj.ji]];
      if (ye.indexOf(yong) >= 0) { score += 6; rs.push(`용신 ${el(yong)}${iGa(el(yong))} 드는 날이에요`); }
      if (ye.indexOf(gi) >= 0) { score -= 6; rs.push(`기신 ${el(gi)}${iGa(el(gi))} 드는 날이에요`); }
      if (gw.indexOf(dj.ji) >= 0) { score -= 8; rs.push('내 공망(空亡)에 드는 날 — 채워지지 않는 자리예요'); }
      if (cheonD.indexOf(dj.gan) >= 0 || cheonD.indexOf(dj.ji) >= 0) { score += 8; rs.push('천덕귀인일 — 큰 액을 작게 넘기는 날이에요'); }

      if (purpose.id === 'move') {
        if (dj.ji === 2 || dj.ji === 8) { score += 5; rs.push('역마의 기운이 도는 날 — 이동에 맞아요'); }
        if (ye.indexOf(2) >= 0) { score += 3; rs.push('흙의 기운 — 집과 자리가 안정돼요'); }
      } else if (purpose.id === 'open') {
        if (ten === 4 || ten === 5) { score += 6; rs.push('재성일 — 손님이 돈을 남기는 날이에요'); }
        if (ten === 3) score -= 4;
      } else if (purpose.id === 'contract') {
        if (ten === 7) { score += 6; rs.push('정관일 — 문서가 반듯하게 서는 날이에요'); }
        if (ten === 1) { score -= 4; }
      } else if (purpose.id === 'wedding') {
        if (jr.some(r => r.t === 'yukhap')) { score += 4; }
        if (ten === 6) { score -= 5; rs.push('편관일 — 예식 절차가 급해지기 쉬운 날이에요'); }
      }
      score = Math.max(18, Math.min(98, Math.round(score)));
      days.push({
        y: dt.y, m: dt.m, d: dt.d, wd: wdOf(dt.y, dt.m, dt.d), ganji: `${GAN[dj.gan]}${JI[dj.ji]}`,
        gan: dj.gan, ji: dj.ji, ten, tenName: S.TEN_GODS[ten], score,
        grade: score >= 85 ? '대길' : score >= 72 ? '길' : score >= 60 ? '무난' : '피함',
        reasons: rs
      });
    }
    const sorted = days.slice().sort((x, y2) => y2.score - x.score || (x.d - y2.d));
    /* Top 5 — ‘무난’ 이상인 날만. 그런 날이 없으면 상위 3일만 남긴다 */
    const goodOnes = sorted.filter(d => d.score >= 60);
    const top = (goodOnes.length ? goodOnes : sorted).slice(0, 5);
    const avoid = days.filter(d => d.score < 56 && top.indexOf(d) < 0)
      .sort((x, y2) => x.score - y2.score || (x.d - y2.d)).slice(0, 3);
    return { ok: true, purpose, range, days, top, avoid, from: range.from };
  }

  global.Plus = { sinsal, today, yearly, wealth, taekil, PURPOSES, rangeOf, SINSAL_INFO, dayGanjiOf, kstNow, fmt, wdOf };
})(window);
