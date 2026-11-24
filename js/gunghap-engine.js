/* ============================================================
   살풀이 : 천기 정밀 궁합 엔진 (Gunghap Engine)
   - 두 사람의 만세력(사주 4주)을 각각 산출해 겹쳐 봄
   - 일간 천간합·충·상생·상극, 일지 육합·삼합·반합·충·형·파·해
   - 오행 상호 보완도, 2026 병오년 인연 흐름
   - 종합 케미 점수(64~98) · 네 가지 축 · 총평
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const mod = (n, m) => ((n % m) + m) % m;
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
    { n: '갑기합', h: '甲己合', e: 2, m: '곧은 나무가 밭을 만나 뿌리를 내리는 합입니다. 서로의 자리를 탐내지 않고 오래 곁에 있는 사이입니다.' },
    { n: '을경합', h: '乙庚合', e: 3, m: '덩굴이 칼을 감아 버리는 합입니다. 부드러운 쪽이 단단한 쪽을 조용히 다스립니다.' },
    { n: '병신합', h: '丙辛合', e: 4, m: '한낮의 해와 보석이 만나 물이 되는 합입니다. 드러난 것과 감춰진 것이 서로를 비춥니다.' },
    { n: '정임합', h: '丁壬合', e: 0, m: '촛불과 큰 물이 만나 나무를 피우는 합입니다. 작은 불이 넓은 물을 데우는 사이입니다.' },
    { n: '무계합', h: '戊癸合', e: 1, m: '큰 산에 비가 내려 새것을 피우는 합입니다. 무뚝뚝한 쪽이 유난히 다정해집니다.' }
  ];

  const YUKHAP_META = [
    { n: '자축합', h: '子丑合', e: 2, m: '언 물과 얼어붙은 땅이 만나 저장의 흙이 됩니다. 말없이 곁을 지키는 사이입니다.' },
    { n: '인해합', h: '寅亥合', e: 0, m: '큰 나무와 겨울 물이 만나 봄을 준비합니다. 한 사람이 다른 사람의 성장을 빌려 줍니다.' },
    { n: '묘술합', h: '卯戌合', e: 1, m: '봄의 풀과 가을의 마른 땅이 만나 불을 품습니다. 서로에게 없던 열정이 생깁니다.' },
    { n: '진유합', h: '辰酉合', e: 3, m: '젖은 땅과 벼려진 쇠가 만나 단단해집니다. 함께 있으면 결론이 빨라집니다.' },
    { n: '사신합', h: '巳申合', e: 4, m: '뱀과 원숭이가 만나 물이 됩니다. 합이면서 형이기도 해서, 가까울수록 조심해야 하는 사이입니다.' },
    { n: '오미합', h: '午未合', e: 2, m: '한낮의 불과 늦여름의 흙이 만나 재가 됩니다. 뜨겁게 시작해 천천히 식는 사이입니다.' }
  ];

  const SAMHAP_META = [
    { e: 4, n: '신자진 수국', h: '申子辰 水局', m: '차갑고 깊은 기운이 모여 물의 판이 됩니다. 두 사람이 모이면 주변까지 조용히 가라앉습니다.' },
    { e: 1, n: '인오술 화국', h: '寅午戌 火局', m: '열정의 기운이 모여 불의 판이 됩니다. 함께 있으면 시작이 빠르고 지출도 빠릅니다.' },
    { e: 3, n: '사유축 금국', h: '巳酉丑 金局', m: '결단의 기운이 모여 쇠의 판이 됩니다. 둘이 앉으면 결론이 나고, 결론은 차갑습니다.' },
    { e: 0, n: '해묘미 목국', h: '亥卯未 木局', m: '성장의 기운이 모여 나무의 판이 됩니다. 서로를 키우지만, 한 사람이 지치면 둘 다 멈춥니다.' }
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

  /* ---------- 세운(2026 병오) ---------- */
  function saeunHit(a, year) {
    const y = year || 2026;
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
      return ['두 사람의 여덟 글자가 서로의 빈칸에 정확히 들어갑니다. 노력으로 만들 수 있는 합이 아니니, 이 합을 게을러서 흐리게 두지만 마십시오.',
        '천간이 합하고 배우자궁이 맞물립니다. 명리에서 가장 드문 형태의 인연 — 서로가 서로의 자리로 태어난 사이입니다.',
        '일간이 합을 이루고 일지가 서로를 붙듭니다. 이 관계는 시작보다 유지가 쉬운 쪽입니다. 어긋날 때도 원래 자리로 돌아옵니다.'][x.seed % 3];
    }
    if (hap && jBad) {
      return ['끌림이 먼저 오고 부딪힘이 뒤따르는 인연입니다. 손을 놓지만 않으면 몇 번이고 다시 이어지지만, 그 반복을 사랑으로 착각하면 둘 다 지칩니다.',
        '서로에게서 눈을 떼지 못하는데, 생활은 자꾸 어긋납니다. 이 관계의 성패는 감정이 아니라 시간표와 말투에서 갈립니다.'][x.seed % 2];
    }
    if (!hap && jGood) {
      if (dayJ.t === 'bihwa') {
        return ['같은 글자를 쓰는 두 사람입니다. 편안하고 설명이 필요 없지만, 그 편안함이 무관심으로 굳으면 관계가 아니라 동거가 됩니다.',
          '배우자궁이 같은 자리입니다. 서로의 습관을 고치려 하지 않는 한 이 관계는 오래 갑니다. 대신 설렘은 두 사람이 만들어야 합니다.'][x.seed % 2];
      }
      return ['한 사람이 다른 한 사람을 살리는 인연입니다. 요란하지 않지만 오래 가고, 헤어져도 자주 다시 만나게 되는 쪽입니다.',
        '일지가 맞물려 생활의 결이 닮습니다. 처음엔 설렘이 적어 보여도, 시간이 지날수록 이 관계가 가장 편안해집니다.'][x.seed % 2];
    }
    if (jBad) {
      return ['가까울수록 말의 온도를 조절해야 하는 사이입니다. 감정이 아니라 생활 방식이 부딪히니, 규칙을 정해 두면 오히려 오래 갑니다.',
        '서로를 아는 만큼 정확히 찌르는 사이입니다. 이 인연은 편안함보다 성장에 가깝습니다 — 다만 상처를 대가로 받습니다.'][x.seed % 2];
    }
    if (score >= 80) return '겉으로는 무난해 보이는데, 겹쳐 보면 조용히 서로를 받쳐 주는 자리가 있습니다. 큰 사건 없이 오래 가는 쪽입니다.';
    return '강하게 끌리는 자리도, 크게 부딪히는 자리도 없습니다. 이 관계는 두 사람이 무엇을 함께 만들기로 하느냐에 따라 값이 달라집니다.';
  }

  /* ---------- 오행 메타포 (A → B) ---------- */
  const ELEM_PAIR = [
    ['같은 숲에 선 두 그루의 나무. 바람이 불면 같은 방향으로 흔들리고, 그늘이 겹칠 때는 서로의 햇빛을 가립니다.',
      '당신의 나무가 상대의 불을 살립니다. 당신이 땔감이 되어 상대를 밝히는 사이 — 오래 타려면 당신도 마를 시간이 필요합니다.',
      '나무가 흙을 붙잡고 서는 사이. 상대가 당신의 뿌리를 받쳐 주지만, 당신이 뿌리를 내릴수록 상대는 단단해지기만 합니다.',
      '나무와 칼. 상대가 당신을 다듬는 만큼 베기도 합니다. 칼을 든 쪽이 힘을 조금만 빼면 이만한 스승이 없습니다.',
      '물이 나무를 기르는 사이. 상대의 말과 여유가 당신을 자라게 합니다. 다만 물이 넘치면 뿌리부터 무릅니다.'],
    ['상대의 나무가 당신의 불을 살립니다. 당신이 먼저 타오르면 상대가 재가 됩니다. 불의 크기를 아는 쪽이 이 관계를 오래 데웁니다.',
      '불과 불. 한 사람이 밝아지면 다른 사람도 밝아지지만, 한 사람이 흔들리면 둘 다 꺼집니다.',
      '불이 흙을 구워 단단하게 만드는 사이. 당신이 다그칠수록 상대는 굳습니다. 말의 열기를 반쯤 낮추십시오.',
      '불과 쇠. 당신의 열이 상대를 녹여 모양을 바꿉니다. 상대는 그 변화를 마음에 담아 두었다가 한 번에 말합니다.',
      '불과 물. 끌림이 강한 만큼 서로의 속도를 재는 시간이 필요합니다. 급하게 가면 한쪽만 젖습니다.'],
    ['당신의 흙에 상대의 나무가 뿌리를 내립니다. 당신이 품는 만큼 상대가 자라고, 상대가 자라는 만큼 당신은 파입니다.',
      '당신의 흙이 상대의 불을 받아 그릇이 됩니다. 담아내는 쪽이 당신이니, 담을 수 없는 날에는 미리 말하십시오.',
      '산과 밭. 두 사람이 다 움직이지 않아 편안하지만, 먼저 걷는 쪽이 없으면 풍경이 그대로입니다.',
      '흙이 쇠를 낳는 사이. 당신의 인내가 상대의 결단을 만듭니다. 다만 상대는 그 공을 당신에게 돌리지 않습니다.',
      '물과 흙. 당신이 중심을 잡으려 할수록 상대는 빠져나갈 길을 찾습니다. 둑을 낮추면 물이 고입니다.'],
    ['당신의 칼이 상대의 나무를 다듬습니다. 상대는 상처를 말하지 않고 자란 모습만 보여 줍니다. 그 침묵을 읽으십시오.',
      '상대의 불이 당신을 녹입니다. 당신이 단단할수록 상대는 더 뜨겁게 달립니다. 열기를 받을 때는 모양을 미리 정해 두십시오.',
      '쇠가 흙에서 나온 사이. 당신의 재능은 상대의 자리에서 비로소 값이 매겨집니다. 혼자 서면 날만 서 있습니다.',
      '칼과 칼. 서로의 날을 알아보아 가까워지고, 가까울수록 긁힙니다. 한 걸음의 거리가 이 관계의 예의입니다.',
      '쇠가 물을 만나 흐르는 사이. 상대의 유연함이 당신의 결단을 부드럽게 만듭니다. 당신은 상대에게 뼈대를 줍니다.'],
    ['당신의 물이 상대의 나무를 키웁니다. 당신이 없으면 상대는 마르고, 상대가 없으면 당신은 흐를 곳을 잃습니다.',
      '당신의 물이 상대의 불을 끄려 합니다. 미움 때문이 아니라 원래 그런 사이입니다. 불 가까이서는 조용히, 멀리서는 오래.',
      '물이 흙을 적시는 사이. 당신이 스며들수록 상대는 무너지지 않으려 단단해집니다.',
      '당신의 물이 상대의 쇠를 흐리게 합니다. 상대는 당신의 말에 오래 젖어 있습니다. 물기를 닦아 줄 때가 있습니다.',
      '두 줄기의 물. 만나면 같은 방향으로 흐르지만, 방향이 갈리면 조용히 멀어집니다.']
  ];

  /* ---------- 메인 ---------- */
  function analyze(a, b, typeId) {
    if (!a || !b) return { error: '두 사람의 명식을 먼저 계산해야 합니다.' };
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
    const s26a = saeunHit(a, 2026), s26b = saeunHit(b, 2026);
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

    /* 2026 월 흐름 */
    const months = [];
    [[nameA, a], [nameB, b]].forEach(([nm, p]) => {
      const ms = global.SajuText.monthly2026(p, 2026);
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
        { key: 'gan', label: '감정의 코드', en: 'HEART', value: ganAxis, note: g.t === 'hap' ? '일간이 합을 이뤄, 설명하지 않아도 통하는 자리가 있습니다.' : g.t === 'gen' ? '한쪽이 다른 쪽을 살리는 흐름입니다. 주는 쪽이 지치지 않게 해야 합니다.' : g.t === 'same' ? '같은 기운끼리라 편안하지만, 한 사람이 두 사람이 되기 쉽습니다.' : g.t === 'chung' ? '첫인상부터 긴장이 생기는 자리. 끌림과 거리두기가 번갈아 옵니다.' : '한쪽이 다른 쪽을 누르는 자리. 힘을 빼면 오히려 오래 갑니다.' },
        { key: 'ji', label: '생활의 결', en: 'DAILY', value: jiAxis, note: dayJ.good ? `${dayJ.name}(${dayJ.hanja}) — 잠자는 시간, 돈 쓰는 방식, 말의 속도가 닮습니다.` : `${dayJ.name}(${dayJ.hanja}) — 생활 리듬이 어긋납니다. 규칙을 정해 두면 크게 다치지 않습니다.` },
        { key: 'elem', label: '기운의 보완', en: 'FILL', value: elemAxis, note: comp.value >= 0.6 ? '서로에게 없는 기운을 채워 줍니다. 함께 있으면 판단이 맑아집니다.' : comp.value >= 0.35 ? '한쪽은 채워 주고 한쪽은 받기만 합니다. 받는 쪽이 무심해지지 않아야 합니다.' : '서로에게 없는 기운이 겹칩니다. 같은 약점을 함께 메워야 합니다.' },
        { key: 'year', label: '올해의 흐름', en: '2026', value: yearAxis, note: sPts > 1.5 ? '2026 병오년이 두 사람의 일지를 밀어 줍니다. 관계가 말로 확정되기 좋은 해입니다.' : sPts < -1.5 ? '2026 병오년이 두 사람 사이를 흔듭니다. 확정보다 확인이 필요한 해입니다.' : '2026년은 두 사람 사이에 큰 물결이 없습니다. 지금의 속도를 유지하십시오.' }
      ],
      saeun: { a: s26a, b: s26b, pts: sPts, months },
      tenA, tenB, officer, wealth, output,
      crossSum
    };
  }

  global.Gunghap = {
    analyze, TYPES, GAN_HAP_META, YUKHAP_META, SAMHAP_META, ELEM_PAIR,
    jiRelations, ganRel, complementOf, saeunHit, POS_KO, POS_SHORT
  };
})(window);
