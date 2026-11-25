/* ============================================================
   살풀이 : 천기 정밀 궁합 엔진 (Gunghap Engine)
   - 두 사람의 만세력(사주 4주)을 각각 산출해 겹쳐 봄
   - 일간 천간합·충·상생·상극, 일지 육합·삼합·반합·충·형·파·해
   - 오행 상호 보완도, 올해 세운 인연 흐름
   - 종합 케미 점수(64~98) · 네 가지 축 · 총평
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const mod = (n, m) => ((n % m) + m) % m;
  const THIS_YEAR = new Date(Date.now() + 9 * 3600 * 1000).getUTCFullYear();
  const GAN = S.GAN, JI = S.JI, GAN_KO = S.GAN_KO, JI_KO = S.JI_KO;
  const ELEM_KO = S.ELEM_KO, ELEM_HANJA = S.ELEM_HANJA;
  const GAN_ELEM = S.GAN_ELEM, JI_ELEM = S.JI_ELEM;

  /* ---------- 관계 유형 ---------- */
  const TYPES = {
    some: { id: 'some', name: '썸 · 연애', short: '썸', en: 'SOME', line: '아직 이름 붙지 않은 사이' },
    couple: { id: 'couple', name: '연인 · 커플', short: '연인', en: 'COUPLE', line: '만난다고 말하는 사이' },
    married: { id: 'married', name: '부부 · 배우자', short: '부부', en: 'MARRIED', line: '한집에서 사는 사이' },
    friend: { id: 'friend', name: '친구 · 동업', short: '친구', en: 'FRIEND', line: '오래 곁에 두고 싶은 사이' }
  };

  /* ---------- 합·충·형·파·해 ---------- */
  const GAN_HAP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];   // 갑기 을경 병신 정임 무계
  const GAN_CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9]];         // 갑경 을신 병임 정계
  const YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  const SAMHAP = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
  const BANGHAP = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];
  const CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  const HYEONG_SETS = [[2, 5, 8], [1, 10, 7]];                // 인사신 · 축술미 삼형
  const PA = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [10, 7]];
  const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];

  const GAN_HAP_META = [
    { n: '갑기합', h: '甲己合', e: 2, m: '곧은 나무가 밭을 만나 뿌리를 내리는 합이에요. 서로의 자리를 탐내지 않고 오래 곁에 있는 사이예요.' },
    { n: '을경합', h: '乙庚合', e: 3, m: '덩굴이 칼을 감아 버리는 합이에요. 부드러운 쪽이 단단한 쪽을 조용히 다스려요.' },
    { n: '병신합', h: '丙辛合', e: 4, m: '한낮의 해와 보석이 만나 물이 되는 합이에요. 드러난 것과 감춰진 것이 서로를 비춰요.' },
    { n: '정임합', h: '丁壬合', e: 0, m: '촛불과 큰 물이 만나 나무를 피우는 합이에요. 작은 불이 넓은 물을 데우는 사이예요.' },
    { n: '무계합', h: '戊癸合', e: 1, m: '큰 산에 비가 내려 새것을 피우는 합이에요. 무뚝뚝한 쪽이 유난히 다정해져요.' }
  ];

  const YUKHAP_META = [
    { n: '자축합', h: '子丑合', e: 2, m: '언 물과 얼어붙은 땅이 만나 저장의 흙이 돼요. 말없이 곁을 지키는 사이예요.' },
    { n: '인해합', h: '寅亥合', e: 0, m: '큰 나무와 겨울 물이 만나 봄을 준비해요. 한 사람이 다른 사람의 성장을 빌려 줘요.' },
    { n: '묘술합', h: '卯戌合', e: 1, m: '봄의 풀과 가을의 마른 땅이 만나 불을 품어요. 서로에게 없던 열정이 생겨요.' },
    { n: '진유합', h: '辰酉合', e: 3, m: '젖은 땅과 벼려진 쇠가 만나 단단해집니다. 함께 있으면 결론이 빨라집니다.' },
    { n: '사신합', h: '巳申合', e: 4, m: '뱀과 원숭이가 만나 물이 돼요. 합이면서 형이기도 해서, 가까울수록 조심해야 하는 사이예요.' },
    { n: '오미합', h: '午未合', e: 2, m: '한낮의 불과 늦여름의 흙이 만나 재가 돼요. 뜨겁게 시작해 천천히 식는 사이예요.' }
  ];

  const SAMHAP_META = [
    { e: 4, n: '신자진 수국', h: '申子辰 水局', m: '차갑고 깊은 기운이 모여 물의 판이 돼요. 두 사람이 모이면 주변까지 조용히 가라앉아요.' },
    { e: 1, n: '인오술 화국', h: '寅午戌 火局', m: '열정의 기운이 모여 불의 판이 돼요. 함께 있으면 시작도 빠르고 지출도 빨라요.' },
    { e: 3, n: '사유축 금국', h: '巳酉丑 金局', m: '결단의 기운이 모여 쇠의 판이 돼요. 둘이 앉으면 결론이 나는데, 그 결론은 차가워요.' },
    { e: 0, n: '해묘미 목국', h: '亥卯未 木局', m: '성장의 기운이 모여 나무의 판이 돼요. 서로를 키우는데, 한 사람이 지치면 둘 다 멈춰요.' }
  ];

  const POS_KO = { 년: '년지(초년·가족)', 월: '월지(사회·부모)', 일: '일지(배우자궁)', 시: '시지(말년·자식)' };
  const POS_SHORT = { 년: '년주', 월: '월주', 일: '일주', 시: '시주' };

  const has = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const inSet = (set, a, b) => set.indexOf(a) >= 0 && set.indexOf(b) >= 0;

  /* 조사 — 한글 음절 받침 기준 */
  const josa = (w, a, b) => {
    const s = w == null ? '' : String(w);
    if (!s) return b;
    const c = s.charCodeAt(s.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return b;
    return ((c - 0xAC00) % 28) ? a : b;
  };
  const iGa = w => josa(w, '이', '가');
  const wa = w => josa(w, '과', '와');
  const eul = w => josa(w, '을', '를');

  /* ---------- 오행 관계 ---------- */
  function relOf(me, t) {
    if (me === t) return 'same';
    if (mod(me + 1, 5) === t) return 'output';    // 내가 상생
    if (mod(me + 2, 5) === t) return 'wealth';    // 내가 상극
    if (mod(t + 1, 5) === me) return 'resource';  // 상대가 나를 상생
    return 'officer';                             // 상대가 나를 상극
  }

  /* ---------- 천간 관계 ---------- */
  function ganRel(g1, g2) {
    const hi = GAN_HAP.findIndex(([x, y]) => (x === g1 && y === g2) || (x === g2 && y === g1));
    if (hi >= 0) return { t: 'hap', meta: GAN_HAP_META[hi] };
    if (has(GAN_CHUNG, g1, g2)) return { t: 'chung' };
    const e1 = GAN_ELEM[g1], e2 = GAN_ELEM[g2];
    const r1 = relOf(e1, e2);                     // A가 본 B
    const r2 = relOf(e2, e1);                     // B가 본 A
    let t = 'neutral';
    if (r1 === 'same') t = 'same';
    else if (r1 === 'output' || r2 === 'output') t = 'gen';
    else if (r1 === 'wealth' || r2 === 'wealth') t = 'control';
    else t = 'support';
    return { t, r1, r2 };
  }

  /* ---------- 지지 관계 ---------- */
  function jiRelations(x, y) {
    const out = [];
    const yi = YUKHAP.findIndex(([a, b]) => (a === x && b === y) || (a === y && b === x));
    if (yi >= 0) out.push({ t: 'yukhap', name: '육합', hanja: '六合', w: 13, good: true, meta: YUKHAP_META[yi] });
    const sg = SAMHAP.findIndex(g => g.indexOf(x) >= 0 && g.indexOf(y) >= 0);
    if (sg >= 0) {
      if (x === y) out.push({ t: 'bihwa', name: '비화', hanja: '比和', w: 4, good: true, meta: SAMHAP_META[sg] });
      else out.push({ t: 'banhap', name: '반합', hanja: '半合', w: 10, good: true, meta: SAMHAP_META[sg] });
    }
    const bg = BANGHAP.findIndex(g => g.indexOf(x) >= 0 && g.indexOf(y) >= 0);
    if (bg >= 0 && x !== y) out.push({ t: 'banghap', name: '방합', hanja: '方合', w: 8, good: true });
    if (has(CHUNG, x, y)) out.push({ t: 'chung', name: '충', hanja: '沖', w: -13, good: false });
    let hy = false;
    HYEONG_SETS.forEach(set => { if (inSet(set, x, y)) hy = true; });
    if ((x === 0 && y === 3) || (x === 3 && y === 0)) hy = true;          // 자묘 상형
    if (x === y && [4, 6, 9, 11].indexOf(x) >= 0) hy = true;              // 진진·오오·유유·해해 자형
    if (hy) out.push({ t: 'hyeong', name: '형', hanja: '刑', w: -9, good: false });
    if (has(PA, x, y)) out.push({ t: 'pa', name: '파', hanja: '破', w: -7, good: false });
    if (has(HAE, x, y)) out.push({ t: 'hae', name: '해', hanja: '害', w: -6, good: false });
    if (!out.length) out.push({ t: 'none', name: '무관', hanja: '—', w: 0, good: true });
    return out;
  }

  /* ---------- 오행 보완도 ---------- */
  function fillScore(a, b) {
    let need = 0, got = 0;
    for (let e = 0; e < 5; e++) {
      const gap = Math.max(0, 0.14 - a.ew.pct[e]);
      if (!gap) continue;
      need += gap;
      got += gap * Math.min(1, b.ew.pct[e] / 0.22);
    }
    return need ? got / need : 0.45;
  }

  function complementOf(a, b) {
    const fillsA = [], fillsB = [];
    for (let e = 0; e < 5; e++) {
      const pa = a.ew.pct[e], pb = b.ew.pct[e];
      if (pa < 0.14) fillsA.push({ e, mine: pa, theirs: pb, gap: 0.14 - pa });
      if (pb < 0.14) fillsB.push({ e, mine: pb, theirs: pa, gap: 0.14 - pb });
    }
    fillsA.sort((x, y) => y.gap - x.gap);
    fillsB.sort((x, y) => y.gap - x.gap);
    const fa = fillScore(a, b), fb = fillScore(b, a);
    return { value: (fa + fb) / 2, fa, fb, fillsA, fillsB };
  }

  /* ---------- 세운(올해) ---------- */
  function saeunHit(a, year) {
    const y = year || THIS_YEAR;
    const yg = mod(y - 4, 10), yj = mod(y - 4, 12);
    const dp = a.dayPillar;
    const g = ganRel(dp.gan, yg);
    const jr = jiRelations(dp.ji, yj);
    let pts = 0;
    if (g.t === 'hap') pts += 3;
    else if (g.t === 'chung') pts -= 3;
    else if (g.t === 'gen') pts += 1.2;
    else if (g.t === 'support') pts += 0.6;
    jr.forEach(r => { pts += r.w * 0.16; });
    return { year: y, gan: yg, ji: yj, g, jr, pts };
  }

  /* ---------- 전체 교차 스캔 ---------- */
  function crossScan(a, b) {
    const out = [];
    a.pillars.forEach(pa => {
      b.pillars.forEach(pb => {
        if (pa.gan != null && pb.gan != null) {
          const gi = GAN_HAP.findIndex(([x, y]) => (x === pa.gan && y === pb.gan) || (x === pb.gan && y === pa.gan));
          if (gi >= 0) {
            out.push({
              kind: '천간합', label: `${GAN[pa.gan]}–${GAN[pb.gan]} 합`, hanja: '合', tone: 'good', w: 3,
              detail: `${POS_SHORT[pa.pos]}의 ${GAN[pa.gan]}과 ${POS_SHORT[pb.pos]}의 ${GAN[pb.gan]}이 합을 이룹니다. ${GAN_HAP_META[gi].m}`,
              pos: [pa.pos, pb.pos]
            });
          } else if (has(GAN_CHUNG, pa.gan, pb.gan)) {
            out.push({
              kind: '천간충', label: `${GAN[pa.gan]}–${GAN[pb.gan]} 충`, hanja: '沖', tone: 'bad', w: -2.5,
              detail: `${POS_SHORT[pa.pos]}의 ${GAN[pa.gan]}과 ${POS_SHORT[pb.pos]}의 ${GAN[pb.gan]}이 부딪힙니다. 겉으로 드러나는 말투와 태도에서 먼저 어긋납니다.`,
              pos: [pa.pos, pb.pos]
            });
          }
        }
        if (pa.ji != null && pb.ji != null) {
          jiRelations(pa.ji, pb.ji).forEach(r => {
            if (r.t === 'none') return;
            if (r.t === 'bihwa') return;
            const w = r.t === 'yukhap' ? 2.4 : r.t === 'banhap' ? 2 : r.t === 'banghap' ? 1.6
              : r.t === 'chung' ? -2.4 : r.t === 'hyeong' ? -1.8 : r.t === 'pa' ? -1.4 : -1.2;
            out.push({
              kind: r.name, label: `${JI[pa.ji]}–${JI[pb.ji]} ${r.name}`,
              hanja: r.hanja, tone: r.good ? 'good' : 'bad', w,
              detail: `${POS_KO[pa.pos]}의 ${JI[pa.ji]}(${JI_KO[pa.ji]})${wa(JI_KO[pa.ji])} ${POS_KO[pb.pos]}의 ${JI[pb.ji]}(${JI_KO[pb.ji]})${iGa(JI_KO[pb.ji])} ${r.name}${eul(r.name)} 이룹니다.${r.meta ? ' ' + r.meta.m : ''}`,
              pos: [pa.pos, pb.pos]
            });
          });
        }
      });
    });
    return out;
  }

  /* ---------- 총평 ---------- */
  function verdictOf(x) {
    const { g, dayJ, score, type } = x;
    const jGood = dayJ.good && dayJ.t !== 'none';
    const jBad = !dayJ.good;
    const hap = g.t === 'hap';
    if (hap && jGood) {
      return ['두 사람의 여덟 글자가 서로의 빈칸에 정확히 들어가요. 노력으로 만들 수 있는 합이 아니니, 게을러서 흐리게 두지만 마세요.',
        '천간이 합하고 배우자궁이 맞물려요. 명리에서 가장 드문 형태의 인연 — 서로가 서로의 자리로 태어난 사이예요.',
        '일간이 합을 이루고 일지가 서로를 붙들어요. 이 관계는 시작보다 유지가 쉬운 쪽이에요. 어긋나도 원래 자리로 돌아와요.'][x.seed % 3];
    }
    if (hap && jBad) {
      return ['끌림이 먼저 오고 부딪힘이 뒤따르는 인연이에요. 손을 놓지만 않으면 몇 번이고 다시 이어지는데, 그 반복을 사랑으로 착각하면 둘 다 지쳐요.',
        '서로에게서 눈을 못 떼는데, 생활은 자꾸 어긋나요. 이 관계의 성패는 감정이 아니라 시간표와 말투에서 갈려요.'][x.seed % 2];
    }
    if (!hap && jGood) {
      if (dayJ.t === 'bihwa') {
        return ['같은 글자를 쓰는 두 사람이에요. 편안하고 설명이 필요 없는데, 그 편안함이 무관심으로 굳으면 관계가 아니라 동거가 돼요.',
          '배우자궁이 같은 자리예요. 서로의 습관을 고치려 하지 않는 한 이 관계는 오래가요. 대신 설렘은 두 사람이 만들어야 해요.'][x.seed % 2];
      }
      return ['한 사람이 다른 한 사람을 살리는 인연이에요. 요란하지 않은데 오래 가고, 헤어져도 자주 다시 만나게 되는 쪽이에요.',
        '일지가 맞물려 생활의 결이 닮았어요. 처음엔 설렘이 적어 보여도, 시간이 지날수록 이 관계가 제일 편안해져요.'][x.seed % 2];
    }
    if (jBad) {
      return ['가까울수록 말의 온도를 조절해야 하는 사이예요. 감정이 아니라 생활 방식이 부딪히니, 규칙을 정해 두면 오히려 오래가요.',
        '서로를 아는 만큼 정확히 찌르는 사이예요. 이 인연은 편안함보다 성장에 가까워요 — 다만 상처를 대가로 받아요.'][x.seed % 2];
    }
    if (score >= 80) return '겉으로는 무난해 보이는데, 겹쳐 보면 조용히 서로를 받쳐 주는 자리가 있어요. 큰 사건 없이 오래 가는 쪽이에요.';
    return '강하게 끌리는 자리도, 크게 부딪히는 자리도 없어요. 이 관계는 두 사람이 무엇을 함께 만들기로 하느냐에 따라 값이 달라져요.';
  }

  /* ---------- 오행 메타포 (A → B) ---------- */
  const ELEM_PAIR = [
    ['같은 숲에 선 두 그루의 나무. 바람이 불면 같은 방향으로 흔들리고, 그늘이 겹칠 때는 서로의 햇빛을 가립니다.',
      '당신의 나무가 상대의 불을 살려요. 당신이 땔감이 되어 상대를 밝히는 사이 — 오래 타려면 당신도 마를 시간이 필요해요.',
      '나무가 흙을 붙잡고 서는 사이예요. 상대가 당신의 뿌리를 받쳐 주는데, 당신이 뿌리를 내릴수록 상대는 단단해지기만 해요.',
      '나무와 칼. 상대가 당신을 다듬는 만큼 베기도 해요. 칼을 든 쪽이 힘을 조금만 빼면 이만한 스승이 없어요.',
      '물이 나무를 기르는 사이예요. 상대의 말과 여유가 당신을 자라게 해요. 다만 물이 넘치면 뿌리부터 무너져요.'],
    ['상대의 나무가 당신의 불을 살려요. 당신이 먼저 타오르면 상대가 재가 돼요. 불의 크기를 아는 쪽이 이 관계를 오래 데워요.',
      '불과 불. 한 사람이 밝아지면 다른 사람도 밝아지는데, 한 사람이 흔들리면 둘 다 꺼져요.',
      '불이 흙을 구워 단단하게 만드는 사이예요. 당신이 다그칠수록 상대는 굳어요. 말의 열기를 반쯤 낮춰 보세요.',
      '불과 쇠. 당신의 열이 상대를 녹여 모양을 바꿔요. 상대는 그 변화를 마음에 담아 두었다가 한 번에 말해요.',
      '불과 물. 끌림이 강한 만큼 서로의 속도를 재는 시간이 필요해요. 급하게 가면 한쪽만 젖어요.'],
    ['당신의 흙에 상대의 나무가 뿌리를 내려요. 당신이 품는 만큼 상대가 자라고, 상대가 자라는 만큼 당신은 파여요.',
      '당신의 흙이 상대의 불을 받아 그릇이 돼요. 담아내는 쪽이 당신이니, 담을 수 없는 날엔 미리 말해 주세요.',
      '산과 밭. 두 사람이 다 안 움직여서 편안한데, 먼저 걷는 쪽이 없으면 풍경이 그대로예요.',
      '흙이 쇠를 낳는 사이예요. 당신의 인내가 상대의 결단을 만들어요. 다만 상대는 그 공을 당신에게 돌리지 않아요.',
      '물과 흙. 당신이 중심을 잡으려 할수록 상대는 빠져나갈 길을 찾아요. 둑을 낮추면 물이 고여요.'],
    ['당신의 칼이 상대의 나무를 다듬어요. 상대는 상처를 말하지 않고 자란 모습만 보여 줘요. 그 침묵을 읽어 보세요.',
      '상대의 불이 당신을 녹여요. 당신이 단단할수록 상대는 더 뜨겁게 달려요. 열기를 받을 때는 모양을 미리 정해 두세요.',
      '쇠가 흙에서 나온 사이예요. 당신의 재능은 상대의 자리에서 비로소 값이 매겨져요. 혼자 서면 날만 서 있어요.',
      '칼과 칼. 서로의 날을 알아봐서 가까워지고, 가까울수록 긁혀요. 한 걸음의 거리가 이 관계의 예의예요.',
      '쇠가 물을 만나 흐르는 사이예요. 상대의 유연함이 당신의 결단을 부드럽게 만들어요. 당신은 상대에게 뼈대를 줘요.'],
    ['당신의 물이 상대의 나무를 키워요. 당신이 없으면 상대는 마르고, 상대가 없으면 당신은 흐를 곳을 잃어요.',
      '당신의 물이 상대의 불을 끄려 해요. 미움 때문이 아니라 원래 그런 사이예요. 불 가까이서는 조용히, 멀리서는 오래.',
      '물이 흙을 적시는 사이예요. 당신이 스며들수록 상대는 무너지지 않으려 단단해져요.',
      '당신의 물이 상대의 쇠를 흐리게 해요. 상대는 당신의 말에 오래 젖어 있어요. 물기를 닦아 줄 때가 있어요.',
      '두 줄기의 물. 만나면 같은 방향으로 흐르는데, 방향이 갈리면 조용히 멀어져요.']
  ];

  /* ---------- 메인 ---------- */
  function analyze(a, b, typeId) {
    if (!a || !b) return { error: '두 사람의 명식을 먼저 계산해야 해요.' };
    const type = TYPES[typeId] || TYPES.some;
    const nameA = a.name || '본인';
    const nameB = b.name || '상대';

    const g = ganRel(a.dayGan, b.dayGan);
    const dayJAll = jiRelations(a.dayPillar.ji, b.dayPillar.ji);
    const dayJ = dayJAll[0];

    /* 점수 */
    let score = 74;
    const add = [];
    // 1) 일간
    if (g.t === 'hap') { score += 11; add.push({ k: '일간합', v: 11 }); }
    else if (g.t === 'gen') { score += 8; add.push({ k: '일간 상생', v: 8 }); }
    else if (g.t === 'same') { score += 5; add.push({ k: '일간 비화', v: 5 }); }
    else if (g.t === 'support') { score += 3; add.push({ k: '일간 상생(역)', v: 3 }); }
    else if (g.t === 'chung') { score -= 5; add.push({ k: '일간충', v: -5 }); }
    else { score += 1; }
    // 2) 일지
    score += dayJ.w; add.push({ k: '일지 ' + dayJ.name, v: dayJ.w });
    if (dayJAll.length > 1) {
      const extra = dayJAll.slice(1).reduce((s, r) => s + r.w * 0.35, 0);
      score += extra; add.push({ k: '겹친 관계', v: Math.round(extra) });
    }
    // 3) 교차
    const cross = crossScan(a, b).filter(x => !(x.pos[0] === '일' && x.pos[1] === '일'));
    const crossSum = cross.reduce((s, x) => s + x.w, 0);
    score += Math.max(-6, Math.min(6, crossSum * 0.55));
    // 4) 오행 보완
    const comp = complementOf(a, b);
    score += Math.round((comp.value - 0.45) * 18);
    // 5) 강약 균형
    const diff = Math.abs(a.strength.ratio - b.strength.ratio);
    if (diff > 0.3) score += 2;
    if (a.strength.ratio >= 0.62 && b.strength.ratio >= 0.62) score -= 2;
    // 6) 세운
    const s26a = saeunHit(a, THIS_YEAR), s26b = saeunHit(b, THIS_YEAR);
    const sPts = s26a.pts + s26b.pts;
    score += Math.max(-4, Math.min(4, sPts * 0.7));
    // 7) 관계 유형 보정
    const tenA = S.tenGod(a.dayGan, b.dayGan);   // A가 본 B
    const tenB = S.tenGod(b.dayGan, a.dayGan);
    const officer = [6, 7].indexOf(tenA) >= 0 || [6, 7].indexOf(tenB) >= 0;
    const wealth = [4, 5].indexOf(tenA) >= 0 || [4, 5].indexOf(tenB) >= 0;
    const output = [2, 3].indexOf(tenA) >= 0 || [2, 3].indexOf(tenB) >= 0;
    if (type.id === 'some' || type.id === 'couple' || type.id === 'married') {
      if (officer) score += 2;
      if (wealth) score += 1;
    } else {
      if ([0, 1].indexOf(tenA) >= 0 || [0, 1].indexOf(tenB) >= 0) score += 2;
      if (output) score += 1;
    }
    score = Math.max(64, Math.min(98, Math.round(score)));

    const grade = score >= 95 ? '천생연분(天生緣分)'
      : score >= 90 ? '한 몸의 인연'
        : score >= 85 ? '깊은 인연'
          : score >= 78 ? '닮아가는 인연'
            : score >= 71 ? '손이 필요한 인연'
              : '각자의 길이 긴 인연';

    const seed = a.dayGan * 12 + a.dayPillar.ji + b.dayGan * 7 + b.dayPillar.ji;
    const verdict = verdictOf({ g, dayJ, score, type, seed });
    const lead = ELEM_PAIR[GAN_ELEM[a.dayGan]][GAN_ELEM[b.dayGan]];

    /* 네 가지 축 */
    const ganAxis = Math.max(35, Math.min(99, Math.round(66 + (g.t === 'hap' ? 30 : g.t === 'gen' ? 20 : g.t === 'same' ? 14 : g.t === 'chung' ? -18 : 4) + comp.value * 4)));
    const jiAxis = Math.max(30, Math.min(99, Math.round(62 + dayJ.w * 2.1 + (dayJAll.length > 1 ? dayJAll[1].w : 0))));
    const elemAxis = Math.round(38 + comp.value * 60);
    const yearAxis = Math.max(25, Math.min(95, Math.round(55 + sPts * 6)));

    /* 올해 월 흐름 */
    const months = [];
    [[nameA, a], [nameB, b]].forEach(([nm, p]) => {
      const ms = global.SajuText.monthly2026(p, THIS_YEAR);
      const hits = [];
      ms.forEach(m => {
        const rs = jiRelations(p.dayPillar.ji, m.ji).filter(r => r.t !== 'none');
        rs.forEach(r => {
          if (r.t === 'yukhap' || r.t === 'banhap') hits.push({ m, r, good: true });
          else if (r.t === 'chung' || r.t === 'hyeong' || r.t === 'pa' || r.t === 'hae') hits.push({ m, r, good: false });
        });
      });
      months.push({ name: nm, hits });
    });

    return {
      ok: true,
      type,
      a, b, nameA, nameB,
      score, grade, verdict, lead,
      gan: { t: g.t, meta: g.meta || null, tenA, tenB },
      dayJ: { primary: dayJ, all: dayJAll },
      interactions: (dayJ.t === 'none' ? cross : cross.concat([{ kind: '일지', label: `${JI[a.dayPillar.ji]}–${JI[b.dayPillar.ji]} ${dayJ.name}`, hanja: dayJ.hanja, tone: dayJ.good ? 'good' : 'bad', w: dayJ.w, detail: (dayJ.meta ? dayJ.meta.m : ''), pos: ['일', '일'], dayKey: true }]))
        .sort((x, y) => Math.abs(y.w) - Math.abs(x.w)),
      complement: comp,
      axes: [
        { key: 'gan', label: '감정의 코드', en: 'HEART', value: ganAxis, note: g.t === 'hap' ? '일간이 합을 이뤄서, 설명하지 않아도 통하는 자리가 있어요.' : g.t === 'gen' ? '한쪽이 다른 쪽을 살리는 흐름이에요. 주는 쪽이 지치지 않게 해야 해요.' : g.t === 'same' ? '같은 기운끼리라 편안한데, 한 사람이 두 사람이 되기 쉬워요.' : g.t === 'chung' ? '첫인상부터 긴장이 생기는 자리예요. 끌림과 거리두기가 번갈아 와요.' : '한쪽이 다른 쪽을 누르는 자리예요. 힘을 빼면 오히려 오래가요.' },
        { key: 'ji', label: '생활의 결', en: 'DAILY', value: jiAxis, note: dayJ.t === 'none' ? '배우자 자리 사이에 특별한 합도 충도 없어요. 생활 리듬은 두 사람이 맞춰 가는 쪽이에요.' : dayJ.good ? `${dayJ.name}(${dayJ.hanja}) — 잠자는 시간, 돈 쓰는 방식, 말의 속도가 닮았어요.` : `${dayJ.name}(${dayJ.hanja}) — 생활 리듬이 어긋나요. 규칙을 정해 두면 크게 다치지 않아요.` },
        { key: 'elem', label: '기운의 보완', en: 'FILL', value: elemAxis, note: comp.value >= 0.6 ? '서로에게 없는 기운을 채워 줘요. 함께 있으면 판단이 맑아져요.' : comp.value >= 0.35 ? '한쪽은 채워 주고 한쪽은 받기만 해요. 받는 쪽이 무심해지지 않아야 해요.' : '서로에게 없는 기운이 겹쳐요. 같은 약점을 함께 메워야 해요.' },
        { key: 'year', label: '올해의 흐름', en: String(THIS_YEAR), value: yearAxis, note: sPts > 1.5 ? `${THIS_YEAR}년이 두 사람의 일지를 밀어 줘요. 관계가 말로 확정되기 좋은 해예요.` : sPts < -1.5 ? `${THIS_YEAR}년이 두 사람 사이를 흔들어요. 확정보다 확인이 필요한 해예요.` : `${THIS_YEAR}년은 두 사람 사이에 큰 물결이 없어요. 지금 속도를 유지하세요.` }
      ],
      saeun: { a: s26a, b: s26b, pts: sPts, months, year: THIS_YEAR },
      tenA, tenB, officer, wealth, output,
      crossSum
    };
  }

  /* ============================================================
     💘 재미로 보는 코너 — 한눈팔 확률
     진짜 명리 판단이 아니라, 도화·역마·이성 기운·합충을 재료로
     12~88% 사이의 숫자를 만드는 유희용 계산입니다.
     ============================================================ */
  const WANDER_FLAVOR = {
    dohwa: {
      name: '인기 폭발형',
      line: '가만히 서 있어도 옆에서 번호를 물어보는 타입이에요. 잘생겨서가 아니라 사람을 편하게 만드는 분위기 때문이죠.',
      rx: '데이트 사진을 본인 SNS에 직접 올리게 하세요. "이 사람은 내 사람" 표시 하나가 제일 싸고 강한 잠금장치예요.',
      look: '사람 많은 자리에 혼자 보내지 마세요'
    },
    yeokma: {
      name: '떠돌이형',
      line: '바람보다는 혼자만의 시간과 취미에 푹 빠지는 타입이에요. 주말마다 어디론가 사라지는데, 정작 그 자리에 누가 있는지는 관심이 없어요.',
      rx: '주말 일정을 미리 같이 정하세요. 혼자 떠날 시간을 미리 넉넉히 주면 오히려 안 떠나요.',
      look: '갑자기 잡히는 당일 일정'
    },
    charm: {
      name: '인연 많은 형',
      line: '이성 기운이 두터워서 만남 자체는 끊이지 않아요. 문제는 바람기가 아니라 \'고르는 게 귀찮다\'는 쪽이에요.',
      rx: '관계의 이름을 분명히 하세요. 애매한 사이가 제일 위험해요. 이름표를 붙이는 순간 후보가 사라집니다.',
      look: '\'그냥 아는 사람\'이 자꾸 늘어나는 것'
    },
    loyalty: {
      name: '집 지킴형',
      line: '바람보다 집이 좋은 타입이에요. 약속과 루틴을 좋아하고, 낯선 사람보다 익숙한 얼굴이 편해요.',
      rx: '이런 사람은 잡는 게 아니라 놓아 주세요. 간섭이 늘면 그때 진짜로 도망갑니다. 대신 고마움을 말로 자주 하세요.',
      look: '이 사람이 갑자기 말을 아끼는 날'
    },
    neutral: {
      name: '평범한 사람형',
      line: '눈은 가끔 돌아가지만 발은 잘 안 움직이는, 세상에서 제일 흔하고 제일 안전한 타입이에요.',
      rx: '심심할 때 같이 뭐라도 하세요. 한눈팔 확률보다 \'심심해서 다툴 확률\'이 더 높은 사주예요.',
      look: '둘 다 폰만 보고 있는 저녁'
    },
    flirt: {
      name: '말로 하는 형',
      line: '행동은 안 하는데 말과 눈빛이 살짝 가벼운 타입이에요. 본인은 장난인데 받는 쪽은 진지해져서 문제가 생기죠.',
      rx: '장난과 다정함의 선을 말로 정해 두세요. "나 이거 좀 불편해"를 웃으면서 한 번 말하면 정리됩니다.',
      look: '술자리 다음 날의 "어제 그건 장난이었어"'
    }
  };

  function wanderOf(P, Q) {
    let n = 28;
    const has = name => (P.sals || []).some(s => s.name === name);
    const reasons = [];
    const add = (v, key, txt) => { n += v; reasons.push({ v, key, txt }); };

    if (has('도화살')) add(16, 'dohwa', '사람을 끄는 기운(도화)이 있어서 시선이 먼저 붙어요.');
    if (has('홍염살')) add(8, 'dohwa', '말과 눈빛에 사람을 끄는 결(홍염)이 배어 있어요.');
    if (has('역마살')) add(12, 'yeokma', '밖으로 도는 기운(역마)이 강해서 자리를 자주 비워요.');
    if (has('화개살')) add(-7, 'loyalty', '혼자 깊어지는 기운(화개)이 있어서 사람보다 취미 쪽이에요.');

    let cnt = 0;
    P.pillars.forEach(p => {
      if (!p || p.gan == null) return;
      if (p.ganTenGod === 4 || p.ganTenGod === 5) cnt += 1.2;
      if (p.jiTenGod === 4 || p.jiTenGod === 5) cnt += 1;
      if (p.ganTenGod === 6 || p.ganTenGod === 7) cnt += 1.2;
      if (p.jiTenGod === 6 || p.jiTenGod === 7) cnt += 1;
    });
    if (cnt >= 2.6) add(9, 'charm', '이성 기운(돈·직장 자리)이 두터워서 만남이 끊이지 않아요.');
    else if (cnt < 0.9) add(-5, 'loyalty', '이성 기운이 얇아서 눈을 잘 안 돌려요.');

    const st = P.dayPillar.stage;
    if (st === 1) add(8, 'flirt', '배우자 자리가 설렘·흔들림(목욕) 자리예요.');
    else if (st === 4) add(5, 'dohwa', '배우자 자리가 전성기(제왕) 자리라 존재감이 세요.');
    else if ([7, 8, 9, 10].includes(st)) add(-6, 'loyalty', '배우자 자리가 정리·창고 자리라 밖으로 잘 안 나가요.');

    const g = ganRel(P.dayGan, Q.dayGan);
    const j = jiRelations(P.dayPillar.ji, Q.dayPillar.ji)[0];
    if (g.t === 'hap') add(-9, 'loyalty', '두 사람 일간이 합이라 끌리는 방향이 한쪽으로 모여요.');
    if (j.t === 'yukhap') add(-7, 'loyalty', '배우자 자리가 잘 붙는 기운(육합)이라 발이 묶여 있어요.');
    if (j.t === 'chung' || j.t === 'hyeong' || j.t === 'pa') add(7, 'flirt', '배우자 자리가 부딪히는 기운이라 자극을 밖에서 찾기 쉬워요.');

    if (P.strength.ratio >= 0.62) add(3, 'neutral', '기운이 센 편이라 자기 주관이 세요.');
    else if (P.strength.ratio < 0.4) add(-4, 'loyalty', '기운이 얇아서 낯선 자극보다 익숙함을 찾아요.');

    n = Math.max(12, Math.min(88, Math.round(n)));
    const top = reasons.slice().sort((x, y) => Math.abs(y.v) - Math.abs(x.v))[0] || { key: 'neutral' };
    const flavor = WANDER_FLAVOR[top.key] || WANDER_FLAVOR.neutral;

    let tier, tierLine;
    if (n <= 24) { tier = '빙하기 국면'; tierLine = '이 사람은 바람이 아니라 마음의 문이 굳게 닫힌 타입이에요. 오히려 나를 향한 문이 안 열려 있을까 걱정하세요.'; }
    else if (n <= 39) { tier = '안정 국면'; tierLine = '눈이 돌아갈 자리가 거의 없어요. 이 사람이 한눈판다는 얘기가 들리면 그건 다른 사람이 이 사람 흉을 보는 거예요.'; }
    else if (n <= 54) { tier = '평범 국면'; tierLine = '눈은 가끔 돌아가는데 발은 안 움직여요. 사람 사는 게 다 그렇죠, 뭐.'; }
    else if (n <= 69) { tier = '매력 관리 국면'; tierLine = '인기는 있는데 선은 지키는 쪽이에요. 대신 이 사람 주변의 \'선\'이 이 사람보다 느슨할 수 있어요.'; }
    else if (n <= 79) { tier = '인기 폭발 국면'; tierLine = '가만히 있어도 누군가 다가오는 타입이에요. 이 사람 잘못이 아니라 이 사람 기운이 그런 거예요.'; }
    else { tier = '문이 열려 있는 국면'; tierLine = '솔직히 좀 걱정되는 숫자예요. 다만 확률은 \'가능성\'이지 \'예정\'이 아니에요. 잠금장치는 아래 처방에 있어요.'; }

    return { pct: n, tier, tierLine, flavor, reasons, topKey: top.key };
  }

  /* x = Gunghap.analyze 결과 */
  function wander(x) {
    const b = wanderOf(x.b, x.a);
    const a = wanderOf(x.a, x.b);
    const diff = b.pct - a.pct;
    const coupleLine = diff >= 12 ? `${x.nameB} 쪽이 ${diff}%p 더 인기 많은 조합이에요. 이 집은 상대를 자랑스러워해야 오래갑니다.`
      : diff <= -12 ? `${x.nameA} 쪽이 ${Math.abs(diff)}%p 더 인기 많은 조합이에요. 상대가 긴장 좀 하고 사는 게 이 관계에 약이에요.`
        : '두 사람 다 비슷비슷해요. 서로를 의심할 재료가 별로 없는 조합이에요.';
    return { partner: b, me: a, diff, coupleLine };
  }

  global.Gunghap = {
    analyze, wander, wanderOf, TYPES, GAN_HAP_META, YUKHAP_META, SAMHAP_META, ELEM_PAIR,
    jiRelations, ganRel, complementOf, saeunHit, POS_KO, POS_SHORT
  };
})(window);
