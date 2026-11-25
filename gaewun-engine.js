/* ============================================================
   살풀이 : 천기 — 개운 처방(開運處方) 엔진
   ① 체형 · 적정 운세 체중 ② 헤어 · 인상 ③ 신체 점(吉點·凶點)
   ④ 말투 · 화법 · 목소리 ⑤ 생활 개운(색·향·방향)
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const GAN_ELEM = S.GAN_ELEM;
  const ELEM_KO = S.ELEM_KO, ELEM_HANJA = S.ELEM_HANJA;
  const ELEM_DIRECTION = S.ELEM_DIRECTION, ELEM_COLORNAME = S.ELEM_COLORNAME;
  const ELEM_COLOR = S.ELEM_COLOR, ELEM_ORGAN = S.ELEM_ORGAN;
  const ELEM_TRAIT = S.ELEM_TRAIT;

  const el = e => `${ELEM_KO[e]}(${ELEM_HANJA[e]})`;
  const pct = v => Math.round(v * 100) + '%';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = v => Math.round(v * 10) / 10;
  const kgTxt = v => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));

  /* ---------- 조사 ---------- */
  const HANJA_READ = {};
  S.GAN.forEach((h, i) => { HANJA_READ[h] = S.GAN_KO[i]; });
  S.JI.forEach((h, i) => { HANJA_READ[h] = S.JI_KO[i]; });
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
  const eul = w => josa(w, '을', '를');

  /* ---------- 십성 세력 ---------- */
  const GPOS = { 년: 1.0, 월: 1.7, 일: 1.2, 시: 1.0 };
  const JPOS = { 년: 1.0, 월: 1.9, 일: 1.4, 시: 1.0 };
  function tenGodWeights(a) {
    const w = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    a.pillars.forEach(p => {
      if (!p || p.gan == null) return;
      if (p.ganTenGod != null) w[p.ganTenGod] += GPOS[p.pos] || 1;
      (p.jiTenGodList || []).forEach(j => { w[j.tenGod] += (JPOS[p.pos] || 1) * j.ratio; });
    });
    const total = w.reduce((x, y) => x + y, 0) || 1;
    const p = w.map(v => v / total);
    const group = {
      bigyeop: p[0] + p[1],
      siksang: p[2] + p[3],
      jaeseong: p[4] + p[5],
      gwansung: p[6] + p[7],
      inseong: p[8] + p[9]
    };
    const order = Object.keys(group).sort((x, y) => group[y] - group[x]);
    return { w, p, group, order, dominant: order[0], secondary: order[1], third: order[2] };
  }
  const GROUP_KO = { bigyeop: '비겁(比劫)', siksang: '식상(食傷)', jaeseong: '재성(財星)', gwansung: '관성(官星)', inseong: '인성(印星)' };

  /* ============================================================
     ① 체형 · 적정 운세 체중
     ============================================================ */
  const AVG_HEIGHT = { '여': 160, '남': 173 };
  const BANDS = {
    fill: { low: 20.4, lo: 22.3, hi: 23.9, ceil: 25.6 },
    reduce: { low: 19.6, lo: 21.0, hi: 22.7, ceil: 25.4 },
    balance: { low: 19.8, lo: 21.2, hi: 22.8, ceil: 24.8 }
  };
  const TYPE = {
    fill: { key: 'fill', name: '충전형', sub: '찌워야 운이 트이는 사주', short: '채워야 하는 몸' },
    reduce: { key: 'reduce', name: '감량형', sub: '비워야 운이 도는 사주', short: '덜어내야 하는 몸' },
    balance: { key: 'balance', name: '균형형', sub: '균형을 지켜야 운이 흐르는 사주', short: '지켜야 하는 몸' }
  };

  const BODY_SHAPE = {
    0: '팔다리와 목선이 길고 어깨보다 골반이 좁아서 위가 가벼운 체형이에요. 살이 오르면 팔뚝과 허벅지에 먼저 붙어요.',
    1: '얼굴과 상체에 기운이 모여서, 살이 오르면 볼·어깨·가슴부터 채워져요. 열이 위로 뜨기 쉬워 저녁엔 얼굴이 붉어지죠.',
    2: '뼈대가 단단하고 복부·허리·하체에 기운이 모여요. 굶어도 잘 안 빠지는데, 한 번 빠지면 오래 유지돼요.',
    3: '가슴과 어깨가 발달하고 피부 결이 얇아요. 살이 붙어도 단단하게 붙고, 마르면 뼈가 먼저 드러나죠.',
    4: '살집이 부드럽고 하체가 무거워요. 붓기가 오래가고, 몸이 붓는 날엔 판단도 같이 흐려져요.'
  };

  function bodyType(a) {
    const p = a.ew.pct, st = a.strength.ratio;
    const flow = p[0] + p[1], settle = p[2], outlet = p[3] + p[4], water = p[4];
    const tooThin = (st < 0.42 && settle < 0.24) || (settle < 0.14 && flow >= 0.40) || st < 0.32;
    const overfull = (st >= 0.56 && (settle >= 0.26 || flow <= 0.24 || water <= 0.07)) || st >= 0.66;
    let key = 'balance', reason = 'balance';
    if (tooThin) { key = 'fill'; reason = st < 0.42 ? 'weak' : 'empty-earth'; }
    else if (overfull) { key = 'reduce'; reason = settle >= 0.24 ? 'heavy-earth' : (water <= 0.07 ? 'dry-stuck' : 'strong'); }
    else if (settle >= 0.26 && flow < 0.30) { key = 'reduce'; reason = 'heavy-earth'; }
    else if (settle < 0.14 && water < 0.10) { key = 'fill'; reason = 'empty-earth'; }
    return { key, reason, flow, settle, outlet, water, st };
  }

  function body(a, opt) {
    opt = opt || {};
    const p = a.ew.pct;
    const bt = bodyType(a);
    const T = TYPE[bt.key];
    const band = BANDS[bt.key];

    /* 키 · 몸무게 */
    const hIn = opt.height ? clamp(+opt.height, 130, 210) : null;
    const wIn = opt.weight ? clamp(+opt.weight, 25, 200) : null;
    const key = hIn || AVG_HEIGHT[a.gender === '남' ? '남' : '여'];
    const keySource = hIn ? 'input' : 'average';
    const h2 = Math.pow(key / 100, 2);

    /* 사주 보정 계수 — 토가 두터울수록 위로, 수가 마르면 아래로 */
    const adj = clamp((p[2] - 0.20) * 1.4 + (bt.st - 0.50) * 1.8 - (p[4] - 0.10) * 0.8, -0.9, 0.9);

    const bmi = {
      std: r1(21.5 + adj * 0.5),
      low: r1(band.low + adj),
      lo: r1(band.lo + adj),
      hi: r1(band.hi + adj),
      ceil: r1(band.ceil + adj)
    };
    const kg = {
      std: r1(h2 * bmi.std),
      low: r1(h2 * bmi.low),
      lo: r1(h2 * bmi.lo),
      hi: r1(h2 * bmi.hi),
      ceil: r1(h2 * bmi.ceil)
    };
    if (kg.hi < kg.lo + 2) kg.hi = r1(kg.lo + 2);
    if (kg.low > kg.lo - 2) kg.low = r1(kg.lo - 2);
    if (kg.ceil < kg.hi + 2) kg.ceil = r1(kg.hi + 2);

    const cur = wIn;
    const bmiNow = cur ? r1(cur / h2) : null;
    let status = 'unknown';
    if (cur) {
      if (bt.key === 'reduce') {
        if (cur > kg.ceil) status = 'over';
        else if (cur > kg.hi) status = 'near';
        else if (cur < kg.low) status = 'low';
        else status = 'in';
      } else if (bt.key === 'fill') {
        if (cur < kg.low) status = 'thin';
        else if (cur < kg.lo) status = 'low';
        else if (cur <= kg.hi + 1.5) status = 'in';
        else status = 'over';
      } else {
        if (cur < kg.low) status = 'thin';
        else if (cur > kg.ceil) status = 'over';
        else if (cur > kg.hi) status = 'near';
        else status = 'in';
      }
    }

    /* 정렬된 오행 */
    const sorted = [0, 1, 2, 3, 4].sort((x, y) => p[y] - p[x]);
    const top = sorted[0], second = sorted[1], low = sorted[4], low2 = sorted[3];
    const maxE = top;

    /* 도해용 구간 */
    const gauge = {
      min: Math.max(30, Math.floor((kg.low - 7) / 5) * 5),
      max: Math.ceil((kg.ceil + 7) / 5) * 5,
      low: kg.low, lo: kg.lo, hi: kg.hi, ceil: kg.ceil, cur
    };

    /* ---- 진단 문장 ---- */
    let headline;
    if (bt.key === 'fill') {
      headline = bt.reason === 'weak'
        ? `사주를 보면 일간의 힘이 ${a.strength.label} 쪽이고 ${el(low)}${iGa(el(low))} ${pct(p[low])}로 얇아요. 몸이 마르면 기운을 담을 그릇이 먼저 비어서, 들어오는 재물도 오래 못 머물러요.`
        : `${el(top)}${iGa(el(top))} ${pct(p[top])}로 강하고 ${el(2)}${iGa(el(2))} ${pct(p[2])}로 비어 있는 사주예요. 만들고 뿜어내는 힘만 앞서서, 살이 빠질수록 재물이 모이지 않고 흩어져요.`;
    } else if (bt.key === 'reduce') {
      headline = bt.reason === 'dry-stuck'
        ? `${el(top)}${iGa(el(top))} ${pct(p[top])}로 두텁고 ${el(4)}${iGa(el(4))} ${pct(p[4])}로 말라 있는 사주예요. 기운이 돌 물길이 없어서 몸이 불수록 순환까지 같이 무거워지는 구조죠.`
        : `${el(2)}가 ${pct(p[2])}로 두텁고 일간의 힘도 ${a.strength.label} 쪽이에요. 담는 힘은 큰데 빼내는 힘이 약해서, 몸이 불면 기운이 그 자리에서 막혀요.`;
    } else {
      headline = `${el(maxE)}${iGa(el(maxE))} ${pct(p[maxE])}로 가장 두텁고 ${el(low)}${iGa(el(low))} ${pct(p[low])}로 가장 얇아서, 크게 치우치지 않고 ${a.strength.level}에 가까운 사주예요. 몸의 균형이 곧 운의 균형이라, 급하게 찌우거나 빼면 그대로 흐름이 흔들려요.`;
    }

    const numLine = bt.key === 'fill'
      ? `이 사주가 견디는 하한선은 ${kgTxt(kg.low)}kg이에요. <b>${kgTxt(kg.low)}kg 아래로 떨어지면 운의 흐름이 막히니까, ${kgTxt(kg.lo)}~${kgTxt(kg.hi)}kg 선까지는 채워서 기운을 눌러 두는 게</b> 좋아요.`
      : bt.key === 'reduce'
        ? `이 사주가 정체되는 선은 <b>${kgTxt(kg.ceil)}kg</b>이에요. 이 선을 넘기면 귀인과 재물이 같은 자리에서 맴돌아요. <b>${kgTxt(kg.hi)}kg 이하로 덜어내면</b> 막혀 있던 흐름이 열리고, ${kgTxt(kg.lo)}~${kgTxt(kg.hi)}kg가 제일 맑게 도는 구간이에요.`
        : `제일 막힘 없이 흐르는 구간은 <b>${kgTxt(kg.lo)}~${kgTxt(kg.hi)}kg</b>이에요. ${kgTxt(kg.low)}kg 아래로 마르면 기운이 얇아지고, ${kgTxt(kg.ceil)}kg 위로 불면 판단이 무거워져요.`;

    /* ---- 현재 상태 ---- */
    let statusTitle, statusText, delta = 0;
    if (!cur) {
      statusTitle = '몸무게를 넣으면 지금 어디쯤인지 바로 짚어 드려요';
      statusText = `지금 ${keySource === 'input' ? '넣어 주신 키' : '성별 평균 신장'} ${key}cm 기준으로 계산했어요. 아래에 현재 몸무게를 넣으면 ${bt.key === 'fill' ? '얼마나 채워야 하는지' : bt.key === 'reduce' ? '얼마나 덜어내야 하는지' : '지금 구간이 어디인지'} 바로 나와요.`;
    } else if (status === 'thin') {
      delta = r1(kg.lo - cur);
      statusTitle = `지금 ${kgTxt(cur)}kg — 하한선보다 ${kgTxt(r1(kg.low - cur))}kg 얇아요`;
      statusText = `이 몸으로는 들어오는 걸 담아 둘 그릇이 없어요. 돈이 들어와도 손에 안 남고, 인연도 닿기 전에 흩어지죠. <b>${delta}kg을 ${delta >= 5 ? '6개월' : '3개월'}에 나눠 채워 보세요.</b> 한 달에 ${kgTxt(r1(delta / (delta >= 5 ? 6 : 3)))}kg이면 이 사주가 견뎌요.`;
    } else if (status === 'low') {
      delta = r1(kg.lo - cur);
      statusTitle = `지금 ${kgTxt(cur)}kg — 목표 구간까지 ${delta}kg 남았어요`;
      statusText = `하한선은 넘겼는데 아직 여유가 없어요. ${bt.key === 'fill' ? '여기서 한 번 더 빠지면 재물이 새기 시작하는 자리예요' : '이 구간에서는 기운이 얇아서 결정을 미루게 돼요'}. <b>${delta}kg만 채워서 ${kgTxt(kg.lo)}kg 선에 올려 두세요.</b>`;
    } else if (status === 'in') {
      statusTitle = `지금 ${kgTxt(cur)}kg — 사주가 제일 좋아하는 구간이에요`;
      statusText = `이 몸을 유지하는 것 자체가 개운이에요. 급하게 줄이거나 늘리면 이 구간이 깨지니까, <b>${kgTxt(kg.lo)}~${kgTxt(kg.hi)}kg 폭을 1년 유지</b>하는 쪽으로 계획을 세우세요.`;
    } else if (status === 'near') {
      delta = r1(cur - kg.hi);
      statusTitle = `지금 ${kgTxt(cur)}kg — 목표 위로 ${delta}kg이에요`;
      statusText = `정체선까지는 여유가 있는데, 여기서 더 불면 순환이 둔해져요. <b>${delta}kg만 덜어내면</b> 지금 막힌 일 하나가 풀려요.`;
    } else if (status === 'over' && bt.key === 'fill') {
      delta = r1(cur - kg.hi);
      statusTitle = `지금 ${kgTxt(cur)}kg — 목표 구간 위로 ${delta}kg 넘었어요`;
      statusText = `이 사주는 채워야 하는 몸인데, 넘치는 살은 기운을 담는 그릇이 아니라 짐이 돼요. <b>더 찌우지 말고 지금 무게에서 3개월만 머물러 보세요.</b> ${kgTxt(kg.lo)}~${kgTxt(kg.hi)}kg로 천천히 돌아오면 돼요.`;
    } else if (status === 'over') {
      delta = r1(cur - kg.hi);
      statusTitle = `지금 ${kgTxt(cur)}kg — 정체선 ${kgTxt(kg.ceil)}kg을 ${kgTxt(r1(cur - kg.ceil))}kg 넘었어요`;
      statusText = `몸이 무거워진 만큼 판단도 늦어지고, 들어오려던 귀인이 문 앞에서 머물러요. <b>최소 ${kgTxt(kg.hi)}kg 이하로 덜어내야</b> 막힌 재물의 흐름이 열려요. 한 달 ${kgTxt(r1(Math.min(2.5, Math.max(1, delta / 6))))}kg 이내로, ${delta >= 5 ? '6개월' : '3개월'}에 나눠 빼세요.`;
    }

    /* ---- 실행 처방 ---- */
    const actions = [];
    if (bt.key === 'fill' || status === 'thin' || status === 'low') {
      actions.push({
        k: '먹는 순서', v: `아침을 거르지 마세요. 기운을 채우는 시간은 저녁이 아니라 아침이에요. 하루 단백질을 체중 1kg당 1.2g(약 ${Math.round((cur || kg.std) * 1.2)}g)으로 잡고, 첫 끼에 절반을 넣어 보세요.`
      });
      const months = delta >= 5 ? 6 : 3;
      const pace = r1(Math.max(0.8, delta / months));
      actions.push({
        k: '채우는 방식', v: `한 달에 ${kgTxt(pace)}kg 안쪽으로만 늘리세요. 급하게 찌운 살은 기운이 아니라 붓기로 남아서 오히려 흐름을 막아요.`
      });
      actions.push({
        k: '몸의 축', v: `${el(2)}의 기운을 받는 허리·배를 데워 주세요. 저녁에 온찜질 15분, 자기 전 복식호흡 20회면 충분해요.`
      });
    } else if (bt.key === 'reduce' || status === 'over' || status === 'near') {
      actions.push({
        k: '먹는 시간', v: `저녁 8시 이후엔 입을 닫아 보세요. ${el(2)}가 강한 사주는 밤에 먹은 게 그대로 몸에 남고, 다음 날 판단까지 무겁게 만들어요.`
      });
      actions.push({
        k: '비우는 방식', v: `한 달 ${kgTxt(r1(Math.min(2.5, Math.max(1, delta / 6 || 1.5))))}kg 이내로요. 물을 하루 1.5L로 늘리고 나트륨(국물·젓갈)부터 줄이면, 같은 운동으로도 두 배가 빠져요.`
      });
      actions.push({
        k: '몸의 축', v: `${el(4)}의 기운인 물길을 열어 주세요. 하루 30분 걷기 중 10분은 땀이 날 정도로, 저녁보다 오전에 하세요.`
      });
    } else {
      actions.push({
        k: '유지의 축', v: `지금 체중을 ±2kg 안에서 지켜 주세요. 사주가 균형일 때는 몸을 흔드는 것보다 리듬을 지키는 쪽이 운을 오래 끌어요.`
      });
      actions.push({
        k: '먹는 리듬', v: `하루 세 끼 시간이 30분 이상 어긋나지 않게 해 주세요. 시간이 흔들리면 ${el(maxE)}의 기운이 먼저 과열돼요.`
      });
      actions.push({
        k: '몸의 축', v: `${el(low)}의 기운을 보태 주세요. ${ELEM_ORGAN[low]} 쪽이 약한 사주라, 그 부위를 풀어 주는 스트레칭을 하루 10분 넣으면 좋아요.`
      });
    }

    return {
      type: T, typeKey: bt.key, reason: bt.reason,
      key, keySource, height: key, weight: cur, bmi: bmiNow,
      gender: a.gender === '남' ? '남' : '여',
      avgKey: AVG_HEIGHT[a.gender === '남' ? '남' : '여'],
      kg, bmiBand: bmi, gauge, status, statusTitle, statusText,
      headline, numLine, actions,
      shape: {
        top, topPct: p[top], low, lowPct: p[low],
        text: BODY_SHAPE[maxE],
        trait: ELEM_TRAIT[maxE]
      },
      flow: bt.flow, settle: bt.settle, outlet: bt.outlet, water: bt.water, strength: bt.st,
      figures: bt.key === 'reduce' ? 'reduce' : bt.key === 'fill' ? 'fill' : 'balance',
      meta: {
        topName: el(top), lowName: el(low),
        earthPct: pct(p[2]), firePct: pct(p[1]), woodPct: pct(p[0]),
        metalPct: pct(p[3]), waterPct: pct(p[4])
      }
    };
  }

  /* ============================================================
     ② 헤어 · 인상
     ============================================================ */
  const HAIR_COLOR = {
    0: { main: '올리브 브라운 · 다크 그린브라운', sub: '흑갈색에 녹기가 도는 톤', hex: '#6f7f4a', hex2: '#3f4a2b' },
    1: { main: '코퍼 브라운 · 밤 적갈', sub: '붉은 기가 은은한 웜톤', hex: '#9b5a3c', hex2: '#5e2f22' },
    2: { main: '카라멜 · 황토 브라운', sub: '노란 기가 도는 부드러운 밤색', hex: '#b08a52', hex2: '#6b4f2c' },
    3: { main: '애쉬 브라운 · 백금 그레이', sub: '재가 섞인 차가운 회색빛', hex: '#b9bcc4', hex2: '#6e727c' },
    4: { main: '청흑 · 다크 초콜릿', sub: '푸른 기가 도는 검정', hex: '#2b3444', hex2: '#12161f' }
  };
  const HAIR_LEN = {
    0: '어깨 아래 기장에 자연스러운 레이어를 두세요. 길게 두는 것 자체가 목(木)의 기운을 키워요.',
    1: '턱선 아래 5cm 정도 미디엄이 좋아요. 얼굴을 감싸되 끝은 가볍게 쳐서 열이 머리에 고이지 않게 하세요.',
    2: '어깨에 닿는 중간 기장이에요. 옆 볼륨을 눌러서 얼굴선이 세로로 길어 보이게 하는 게 핵심이에요.',
    3: '턱선에 붙는 단발이나 짧은 보브가 좋아요. 선이 곧게 서야 결단의 기운이 살아나요.',
    4: '가슴 아래로 긴 기장에 무거운 웨이브가 어울려요. 결은 흐르게 두되 정수리는 붙여야 물의 기운이 고이지 않아요.'
  };

  function hair(a) {
    const tg = tenGodWeights(a);
    const g = tg.group;
    const p = a.ew.pct;
    const yong = a.yongsin.yong, gi = a.yongsin.gi, hee = a.yongsin.hee;

    let open, openReason;
    if (g.inseong >= 0.30) {
      open = false;
      openReason = `인성(印星)이 ${pct(g.inseong)}로 두터운 사주예요. 생각이 앞서는 만큼 이마를 다 드러내면 머리로만 도는 인상이 돼요. 앞머리로 관록궁을 반쯤 덮어서 열을 내려 주세요.`;
    } else if (g.gwansung >= 0.24) {
      open = true;
      openReason = `관성(官星)이 ${pct(g.gwansung)}로 서 있는 사주예요. 관록궁(이마)이 열려야 직함·문서·윗사람의 인정이 붙어요. 이마를 드러내는 게 곧 개운이에요.`;
    } else if (g.siksang >= 0.32) {
      open = false;
      openReason = `식상(食傷)이 ${pct(g.siksang)}로 강해서 말과 재주가 날카로운 사주예요. 이마까지 열면 그 날이 그대로 드러나 적을 만들어요. 앞머리나 옆머리로 한 겹 감싸서 인상을 부드럽게 두세요.`;
    } else if (a.strength.ratio >= 0.55) {
      open = true;
      openReason = `일간의 힘이 ${a.strength.label} 쪽이에요. 기운이 넘치니까 이마를 열어 관록궁으로 내려보내야, 그 힘이 사람을 누르지 않고 자리를 잡아요.`;
    } else {
      open = false;
      openReason = `일간이 ${a.strength.label} 쪽이라 기운이 얇아요. 이마를 다 드러내면 인상이 야위어 보여서 귀인의 눈에 들기 어려워요. 앞머리를 얇게 내려 이마 윤곽만 남겨 주세요.`;
    }

    const lenKey = p[3] >= 0.24 ? 3 : p[0] >= 0.26 ? 0 : p[2] >= 0.24 ? 2 : p[1] >= 0.24 ? 1 : p[4] >= 0.22 ? 4 : 0;
    const volume = p[1] + p[0] >= 0.42
      ? '정수리와 앞머리에 볼륨을 주고 옆은 붙여 보세요. 위로 뜬 기운을 머리 모양으로 눌러 주는 방식이에요.'
      : p[3] >= 0.28
        ? '전체를 매트하게, 윤기보다 결로 보이게 하세요. 금(金)이 강한 사주는 반들거리는 머리가 오히려 날을 세워요.'
        : '옆 볼륨을 살짝 눌러 얼굴선을 세우고, 끝만 자연스럽게 말아 주세요.';

    const color = HAIR_COLOR[yong];
    const avoid = HAIR_COLOR[gi];

    const impression = [];
    if (open) impression.push('이마를 드러낼 때는 눈썹을 꼭 정리해 주세요. 이마가 열리면 시선이 눈썹으로 먼저 가는데, 흐트러진 눈썹은 열린 관록궁을 스스로 닫아 버려요.');
    else impression.push('앞머리를 내리더라도 눈은 꼭 드러내 주세요. 눈이 가려지면 생각만 커지고 결정이 더 늦어져요.');
    if (p[3] >= 0.28) impression.push('인상은 "차갑다"보다 "단정하다"로 읽히는 게 좋아요. 웃을 때 입꼬리를 2mm만 더 올려도 금(金)의 날이 복으로 바뀌어요.');
    else if (p[1] >= 0.26) impression.push('얼굴에 열이 오르는 사주예요. 목선을 드러내고 귀를 보이게 하면 열이 내려가서, 같은 얼굴이 더 차분하게 보여요.');
    else impression.push('눈과 입 사이에 힘을 빼 보세요. 턱에 힘이 들어가면 재물의 그릇이 굳어 보여요.');

    const tip = open
      ? '가르마는 6:4로 두세요. 센터 가르마는 관록궁을 반으로 갈라서, 애써 연 자리를 스스로 닫아요.'
      : '앞머리는 눈썹 위 5mm에서 자르세요. 눈을 덮는 순간 생각이 커지고 결정이 늦어져요.';
    const care = [
      `염색은 ${color.main} 계열로 하세요. ${color.sub}라서 ${el(yong)}의 기운을 머리에서 매일 받는 셈이에요.`,
      tip,
      `피할 톤은 ${avoid.main}이에요. ${el(gi)}의 기운이 강해지는 색이라, 머리부터 흐름이 무거워져요.`
    ];

    return {
      open, openReason, ten: tg, lenKey, length: HAIR_LEN[lenKey], volume,
      color, avoid, impression, care,
      title: open ? '이마를 여는 쪽' : '이마를 감싸는 쪽',
      alt: open ? '앞머리로 덮는 쪽' : '이마를 드러내는 쪽',
      yong, hee
    };
  }

  /* ============================================================
     ③ 신체 점(點) — 吉點 · 凶點
     ============================================================ */
  /* 좌표계: 얼굴 340×400 · 손 200×270 · 목 200×230 */
  const ZONES = [
    /* --- 얼굴 吉 --- */
    {
      id: 'gwanrok', kind: 'good', part: 'face', elem: 1, name: '관록궁', point: '이마 한가운데', x: 170, y: 128,
      why: m => `이마 한가운데는 관록궁(官祿宮)이에요. 사주에 화(火)가 ${m.firePct}로 ${m.fireHi ? '두터워서' : '자리하고 있어서'}, 이 자리에 점이 있으면 남의 일을 대신 짊어지는 자리로 태어난 사람이에요.`,
      act: '점은 빼지 말고 그대로 두세요. 다만 그 위를 앞머리로 덮지는 마세요. 관록궁이 가려지면 애쓴 일이 남의 공이 돼요.'
    },
    {
      id: 'gyowo', kind: 'good', part: 'face', elem: 0, name: '교우궁', point: '눈썹 안쪽 끝',
      x: 146, y: 172,
      why: m => `눈썹 안쪽 끝은 교우궁(交友宮)이에요. 목(木)이 ${m.woodPct}인 사주는 사람을 통해 일이 열리는 구조라, 이 자리의 점은 "먼저 손 내미는 사람"을 붙여 줘요.`,
      act: '이 자리를 만질 때는 용건부터 꺼내지 말고 안부를 먼저 두세요. 그 순서가 귀인을 오래 붙잡아요.'
    },
    {
      id: 'nandae', kind: 'good', part: 'face', elem: 2, name: '난대·정위', point: '코 옆 볼록한 곳',
      x: 151, y: 234,
      why: m => `코 옆의 난대(蘭臺)·정위(廷尉)는 재물 창고예요. 토(土)가 ${m.earthPct}인 사주에서 이 자리의 점은 "들어온 돈을 담는 그릇"이 돼요.`,
      act: '이 자리에 여드름이 나면 그달 지출부터 줄이세요. 창고의 문이 열린 달이에요.'
    },
    {
      id: 'earlobe', kind: 'good', part: 'face', elem: 3, name: '귓불', point: '귀 아래 둥근 살',
      x: 88, y: 244,
      why: m => `귓불은 수명과 복을 담는 자리예요. 금(金)이 ${m.metalPct}인 사주에서 이 자리의 점은 결단이 복으로 돌아온다는 표시예요.`,
      act: '귀를 가리는 머리 모양이나 큰 귀걸이는 피하세요. 이 자리가 드러나야 후원이 들어와요.'
    },
    /* --- 얼굴 凶 --- */
    {
      id: 'tear', kind: 'bad', part: 'face', elem: 4, name: '눈물점', point: '눈 아래 안쪽',
      x: 145, y: 220,
      why: m => `눈 아래 안쪽은 눈물점이에요. 수(水)가 ${m.waterPct}인 사주는 감정이 고이는 자리가 이미 넓어요. 여기에 점이 있으면 같은 일에 두 번 우는 자리라서, 재물보다 마음이 먼저 새요.`,
      act: '점을 빼는 것보다 잠을 먼저 늘리세요. 이 자리는 피로가 쌓인 달에 어두워지고, 그달엔 관계 문제도 같이 와요.'
    },
    {
      id: 'nosetip', kind: 'bad', part: 'face', elem: 2, name: '코끝', point: '코 끝 중앙',
      x: 170, y: 236,
      why: m => `코끝은 재물이 드나드는 문이에요. 토(土)가 ${m.earthPct}인 사주에서 이 자리에 점이 있으면 벌수록 새는 구조라서, 수입이 늘어도 통장은 비어 있어요.`,
      act: '이 자리에 점이 있다면 통장을 하나 더 만드세요. 들어오는 즉시 20%를 손대지 않는 계좌로 옮기는 게 유일한 처방이에요.'
    },
    {
      id: 'mouthside', kind: 'bad', part: 'face', elem: 4, name: '입가', point: '입꼬리 옆',
      x: 148, y: 268,
      why: m => `입꼬리 옆은 말과 씀씀이를 맡는 자리예요. 수(水)가 ${m.waterPct}인 사주에서 이 자리의 점은 구설과 지출이 같이 오는 자리예요.`,
      act: '술자리에서 이 자리가 붉어지면 그 자리에서 돈을 빌려주지 마세요. 안 돌아오는 돈은 대개 이 자리에서 나가요.'
    },
    {
      id: 'eyetail', kind: 'bad', part: 'face', elem: 0, name: '눈꼬리 바깥', point: '눈 바깥 끝',
      x: 214, y: 194,
      why: m => `눈꼬리 바깥은 인연과 시비가 갈리는 자리예요. 목(木)이 ${m.woodPct}인 사주는 이 자리에 점이 있으면 옳은 말 때문에 사람을 잃는 일이 생겨요.`,
      act: '맞는 말이라도 그 자리에서 하지 마세요. 하루를 두고 말하면 같은 말이 적이 아니라 은인이 돼요.'
    },
    {
      id: 'glabella', kind: 'bad', part: 'face', elem: 1, name: '인당', point: '눈썹 사이',
      x: 170, y: 166,
      why: m => `눈썹 사이 인당(印堂)은 마음의 문이에요. 화(火)가 ${m.firePct}인 사주에서 이 자리의 점은 조급함이 먼저 나간다는 표시예요.`,
      act: '결정을 앞두고 이 자리를 손끝으로 10초만 눌러 보세요. 조급함이 내려가면 같은 판단도 달라져요.'
    },
    /* --- 손 吉 --- */
    {
      id: 'palm-wealth', kind: 'good', part: 'hand', elem: 2, name: '금전궁', point: '손바닥 가운데',
      x: 118, y: 192,
      why: m => `손바닥 가운데 금전궁은 돈을 쥐는 자리예요. 토(土)가 ${m.earthPct}인 사주에서 이 자리의 점은 "쥐면 남는 손"이에요.`,
      act: '큰돈을 만질 때는 이 손바닥으로 영수증을 쥐고 한 번 접어 보세요. 쥐는 동작이 남기는 습관이 돼요.'
    },
    {
      id: 'wrist', kind: 'good', part: 'hand', elem: 4, name: '손목 안쪽', point: '손목 주름 위',
      x: 112, y: 250,
      why: m => `손목 안쪽은 기운이 몸으로 들어오는 문이에요. 수(水)가 ${m.waterPct}인 사주에서 이 자리의 점은 저축과 건강이 같이 붙는다는 표시예요.`,
      act: '시계나 팔찌를 이 자리에 두껍게 겹치지 마세요. 들어오는 길을 스스로 막는 셈이 돼요.'
    },
    /* --- 손 凶 --- */
    {
      id: 'finger-gap', kind: 'bad', part: 'hand', elem: 3, name: '손가락 사이', point: '검지·중지 사이',
      x: 92, y: 142,
      why: m => `손가락 사이는 새는 구멍이에요. 금(金)이 ${m.metalPct}인 사주는 버는 건 날카로운데 지키는 힘이 약해서, 이 자리에 점이 있으면 번 만큼 정확히 새요.`,
      act: '지출은 손이 아니라 통장에서 하세요. 현금과 간편결제를 줄이는 게 이 자리를 닫는 방법이에요.'
    },
    /* --- 목 吉 --- */
    {
      id: 'collarbone', kind: 'good', part: 'neck', elem: 3, name: '쇄골 중앙', point: '목 아래 오목한 곳',
      x: 100, y: 152,
      why: m => `쇄골 사이 오목한 곳은 후원이 들어오는 자리예요. 금(金)이 ${m.metalPct}인 사주에서 이 자리의 점은 위에서 내려오는 도움을 받는다는 표시예요.`,
      act: '이 자리를 드러내는 옷(브이넥·오픈 칼라)을 한 벌 두세요. 중요한 자리에서 후원이 붙는 옷이 돼요.'
    },
    /* --- 목 凶 --- */
    {
      id: 'throat', kind: 'bad', part: 'neck', elem: 4, name: '목 앞 오목', point: '목젖 아래',
      x: 100, y: 116,
      why: m => `목젖 아래 오목한 곳은 기운이 새는 자리예요. 수(水)가 ${m.waterPct}인 사주는 말로 기운을 빼는 구조라서, 이 자리에 점이 있으면 말하고 나서 꼭 후회해요.`,
      act: '중요한 통화 전에 이 자리에 손을 얹고 숨을 세 번 내쉬어 보세요. 세 번 뒤에 하는 말은 새지 않아요.'
    }
  ];

  function dots(a) {
    const p = a.ew.pct, yong = a.yongsin.yong, hee = a.yongsin.hee, gi = a.yongsin.gi;
    const maxE = p.indexOf(Math.max(...p));
    const meta = {
      firePct: pct(p[1]), woodPct: pct(p[0]), earthPct: pct(p[2]), metalPct: pct(p[3]), waterPct: pct(p[4]),
      fireHi: p[1] >= 0.24, earthHi: p[2] >= 0.24
    };
    const scored = ZONES.map(z => {
      const pv = p[z.elem];
      let s = 0;
      if (z.kind === 'good') {
        if (z.elem === yong) s += 3;
        if (z.elem === hee) s += 2;
        if (pv < 0.12) s += 2;
        if (pv > 0.30) s -= 2;
        if (z.part !== 'face') s += 0.4;
      } else {
        if (z.elem === gi) s += 3;
        if (z.elem === maxE) s += 2;
        if (pv > 0.26) s += 2;
        if (pv < 0.10) s -= 2;
        if (z.part !== 'face') s += 0.3;
      }
      return Object.assign({}, z, { score: s, pct: pv, whyText: z.why(meta) });
    });

    const pick = (kind, n) => {
      const pool = scored.filter(z => z.kind === kind).sort((x, y) => y.score - x.score);
      const by = part => pool.filter(z => z.part === part);
      const face = by('face'), hand = by('hand'), neck = by('neck');
      const out = [];
      // 얼굴 → 손 → 목 순으로 한 자리씩 배분해 세 도해가 모두 살아나게 한다
      const quota = [['face', n - 2], ['hand', 1], ['neck', 1]];
      quota.forEach(([part, cnt]) => {
        const src = by(part);
        for (let i = 0; i < cnt && src[i]; i++) out.push(src[i]);
      });
      // 비는 자리는 점수가 높은 나머지로 채운다
      pool.forEach(z => { if (out.length < n && out.indexOf(z) < 0) out.push(z); });
      return out.slice(0, n);
    };

    const good = pick('good', 4);
    const bad = pick('bad', 4);
    good.forEach((z, i) => { z.no = i + 1; });
    bad.forEach((z, i) => { z.no = good.length + i + 1; });

    const summary = `살릴 점 ${good.length}곳과 뺄 점 ${bad.length}곳을 골랐어요. ${el(yong)}의 기운이 약한 사주라서 ${A(good[0])} 쪽 점이 먼저 살아나고, ${el(gi)}의 기운이 도는 자리는 재물과 인연이 같이 새는 자리예요.`;
    function A(z) { return z ? `'${z.name}'` : '귀'; }

    return {
      good, bad, summary,
      yong, hee, gi,
      note: '점은 운명의 낙인이 아니라 기운이 머무는 자리예요. 좋은 점은 <b>가리고 다니지 마시고</b>, 나쁜 점은 <b>빼는 것보다 그 자리에 오는 습관을 끊는 게</b> 먼저예요.',
      faceDots: good.concat(bad).filter(z => z.part === 'face'),
      handDots: good.concat(bad).filter(z => z.part === 'hand'),
      neckDots: good.concat(bad).filter(z => z.part === 'neck')
    };
  }

  /* ============================================================
     ④ 말투 · 화법 · 목소리
     ============================================================ */
  const BADA = [
    { bad: '"아니 근데 그게 아니라"', good: '"그 말도 맞고, 제가 보는 건 이쪽입니다"', why: '식상이 강한 사주는 상대 말을 자르는 순간 신뢰를 잃어요. 인정 한 줄을 앞에 두면 같은 반박이 설득이 돼요.', tag: 'siksang' },
    { bad: '"솔직히 말하면"', good: '"제가 확인한 건 여기까지입니다"', why: '"솔직히"는 앞의 말이 거짓이었다는 신호로 들려요. 확인한 범위를 말하면 오히려 신뢰가 붙어요.', tag: 'bigyeop' },
    { bad: '"원래 그렇게 하는 거예요"', good: '"이번 건은 이 순서로 가면 빠릅니다"', why: '관성이 강한 사주는 규정으로 말할수록 사람이 멀어져요. 같은 말도 순서로 하면 내 편이 생겨요.', tag: 'gwansung' },
    { bad: '"혹시… 아마… 그런 것 같은데요"', good: '"제 판단은 이렇습니다"', why: '인성이 강한 사주는 확신을 미루는 말버릇이 습관이에요. 판단을 먼저 말하면 그 말의 무게가 달라져요.', tag: 'inseong' },
    { bad: '"그거 얼마예요?"', good: '"이게 우리 쪽에 남는 게 얼마입니까?"', why: '재성이 강한 사주는 가격을 먼저 물으면 계산하는 사람으로 읽혀요. 남는 걸 물으면 판을 보는 사람이 되죠.', tag: 'jaeseong' },
    { bad: '"제가 말했잖아요"', good: '"그때 이야기한 그 부분, 지금 확인해 보겠습니다"', why: '비겁이 강한 사주는 내가 옳았다는 걸 확인시켜 주고 싶어 해요. 그 한마디가 협력을 빼앗아요.', tag: 'bigyeop2' },
    { bad: '"다 제 잘못입니다"', good: '"이 부분은 제가, 이 부분은 함께 보면 좋겠습니다"', why: '관성·인성이 겹치면 책임을 다 삼키는 말이 나와요. 나눠서 말해야 다음에도 일이 맡겨져요.', tag: 'mix' },
    { bad: '"싫어요"', good: '"그건 어렵고, 대신 이건 됩니다"', why: '비겁이 강한 사주는 거절이 칼처럼 나가요. 대안을 붙이면 거절이 협상이 돼요.', tag: 'bigyeop3' }
  ];

  function speech(a) {
    const tg = tenGodWeights(a);
    const g = tg.group, p = a.ew.pct;
    const maxE = p.indexOf(Math.max(...p)), minE = p.indexOf(Math.min(...p));
    const yong = a.yongsin.yong;

    /* 목소리 */
    let pitch, pitchWhy;
    if (p[1] >= 0.26) {
      pitch = '지금은 톤이 위로 떠 있어요. 소리를 가슴에서 시작해서 한 단계 낮춰 보세요. 같은 말이 두 배로 무거워져요.';
      pitchWhy = `화(火)가 ${pct(p[1])}로 강해서 목소리에 열이 실려요. 열이 실린 목소리는 급해 보이고, 급한 목소리는 값을 깎아요.`;
    } else if (p[4] >= 0.26) {
      pitch = '톤은 낮아서 좋은데 끝이 흐려요. 문장의 마지막 한 글자를 또렷하게 끊어 보세요.';
      pitchWhy = `수(水)가 ${pct(p[4])}로 강해서 소리가 가라앉아요. 낮은 톤은 신뢰를 만들지만 흐린 끝은 확신이 없어 보여요.`;
    } else if (p[3] >= 0.26) {
      pitch = '톤이 날카롭게 서 있어요. 말끝을 살짝 눌러 내리면 같은 문장이 부드러워져요.';
      pitchWhy = `금(金)이 ${pct(p[3])}로 강해서 자음이 또렷한 대신 날이 서요. 정확함은 살리고 날만 눅이면 돼요.`;
    } else if (p[0] >= 0.26) {
      pitch = '속도가 먼저 나가요. 한 문장을 말하고 한 박자 쉬어 보세요.';
      pitchWhy = `목(木)이 ${pct(p[0])}로 강해서 말이 자라나는 속도로 나와요. 쉼이 없으면 좋은 말도 밀어내는 말이 돼요.`;
    } else {
      pitch = `톤은 ${el(yong)}의 결로 맞춰 보세요. ${el(yong)}이 약한 사주라서, 그 기운의 색을 띤 낮고 따뜻한 톤이 사람을 붙여요.`;
      pitchWhy = `오행이 고르게 놓인 사주예요. 어느 하나로 치우치기보다 용신의 결을 목소리에 입히는 쪽이 오래가요.`;
    }
    const speed = g.siksang >= 0.30
      ? '평소의 0.8배로. 지금 속도는 "재주 있는 사람"으로 들리고, 늦춘 속도는 "믿을 수 있는 사람"으로 들려요.'
      : g.inseong >= 0.30
        ? '생각을 다듬는 시간을 줄이고 첫 문장을 3초 안에 꺼내세요. 결론을 먼저, 이유를 뒤에요.'
        : g.gwansung >= 0.26
          ? '숫자와 근거를 앞에, 감정을 뒤에 두세요. 대신 마지막에 사람 한 줄을 붙이는 게 좋아요.'
          : '한 문장을 20자 안쪽으로 끊어 보세요. 길게 이어지는 문장은 비겁의 고집으로 들려요.';
    const ending = g.gwansung >= 0.26
      ? '"~하겠습니다"로 끝내 보세요. "~할게요"는 이 사주에서 약속의 무게를 스스로 깎아요.'
      : g.siksang >= 0.30
        ? '"~거든요·~잖아요"는 지우고 "~입니다"로 끝내 보세요. 재주는 내용으로 증명하는 거예요.'
        : g.inseong >= 0.30
          ? '"~인 것 같습니다"를 "~입니다"로 바꿔 보세요. 미루는 말버릇이 결론을 흐려요.'
          : '"~할게요"보다 "~하겠습니다"가 좋아요. 한 글자가 자리를 만들어 줘요.';

    /* 말버릇 — 주 십성 + 부 십성 */
    const main1 = BADA.filter(b => b.tag === tg.dominant || b.tag === tg.dominant + '2');
    const main2 = BADA.filter(b => b.tag === tg.dominant + '3');
    const sub = BADA.filter(b => b.tag === tg.secondary);
    const chosen = [];
    const push = b => { if (b && !chosen.some(c => c.bad === b.bad) && chosen.length < 3) chosen.push(b); };
    main1.slice(0, 2).forEach(push);
    sub.slice(0, 1).forEach(push);
    main2.forEach(push);
    BADA.forEach(push);

    return {
      tg, dominant: tg.dominant, secondary: tg.secondary,
      dominantKo: GROUP_KO[tg.dominant], secondaryKo: GROUP_KO[tg.secondary],
      shares: {
        bigyeop: pct(g.bigyeop), siksang: pct(g.siksang), jaeseong: pct(g.jaeseong),
        gwansung: pct(g.gwansung), inseong: pct(g.inseong)
      },
      pitch, pitchWhy, speed, ending,
      habits: chosen.slice(0, 3),
      summary: `이 사주의 말투는 ${GROUP_KO[tg.dominant]} ${pct(g[tg.dominant])}, ${GROUP_KO[tg.secondary]} ${pct(g[tg.secondary])}의 구조에서 나와요. ${toneLine(tg, g)}`,
      minE, maxE, yong
    };
  }
  function toneLine(tg, g) {
    if (tg.dominant === 'siksang') return '재주와 말이 먼저 나가는 사주라, 한 박자만 늦춰도 같은 말이 값이 돼요.';
    if (tg.dominant === 'bigyeop') return '내 힘으로 밀어붙이는 말투라, 상대 몫을 한 줄 남겨야 사람이 남아요.';
    if (tg.dominant === 'jaeseong') return '실리로 말하는 사주라, 감정 한 줄을 붙이면 같은 제안이 훨씬 잘 통해요.';
    if (tg.dominant === 'gwansung') return '격식과 정확으로 말하는 사주라, 순서를 먼저 말하면 반발이 사라져요.';
    return '생각이 깊어 말이 늦는 사주라, 첫 문장을 서두르는 연습이 곧 개운이에요.';
  }

  /* ============================================================
     ⑤ 생활 개운
     ============================================================ */
  const SWATCH = {
    0: ['#4f7a4a', '#8aa86b'],
    1: ['#a8443a', '#7a2f45'],
    2: ['#b08a52', '#d9c48f'],
    3: ['#c3c8d1', '#8a8f98'],
    4: ['#141a26', '#2f4a72']
  };
  const SCENT = {
    0: ['편백 · 히노키', '베르가못 · 레몬그라스', '녹차 · 무화과 잎'],
    1: ['제라늄 · 로즈', '시나몬 · 클로브', '네롤리 · 오렌지 블로섬'],
    2: ['샌달우드', '바닐라 · 통카빈', '비터 오렌지 · 캐모마일'],
    3: ['아이리스 · 머스크', '페퍼민트 · 유칼립투스', '화이트 티 · 코튼'],
    4: ['유향(프랑킨센스)', '미네랄 · 소금 · 해조', '블랙 티 · 시더우드']
  };
  const ITEM = {
    0: '나무로 된 것 — 목재 펜, 나무 손잡이, 초록 계열 천이에요.',
    1: '붉은 실 한 가닥 — 손목이나 지갑 안쪽에 두세요. 화(火)의 기운을 가장 싸게 부르는 방법이에요.',
    2: '도자기 소품 — 흙으로 구운 작은 그릇 하나를 책상에 두세요.',
    3: '금속 소품 — 시계, 반지, 금속 볼펜처럼 소리가 나는 물건이에요.',
    4: '유리 소품 — 투명한 유리잔이나 작은 수반이에요. 물을 담아 두면 더 좋아요.'
  };
  function living(a) {
    const yong = a.yongsin.yong, hee = a.yongsin.hee, gi = a.yongsin.gi;
    const c = ELEM_COLORNAME[yong], h = ELEM_COLORNAME[hee], g = ELEM_COLORNAME[gi];
    const dir = ELEM_DIRECTION[yong];
    const dirNote = ['동쪽', '남쪽', '중앙·집', '서쪽', '북쪽'][yong];
    const bed = yong === 2
      ? '머리를 중앙(벽) 쪽으로 두고 좌우로 흔들리지 않게 고정하세요. 토(土)는 흔들림 자체가 기운을 흩어요.'
      : `머리를 ${dir}으로 두세요. 방 구조상 어려우면 ${dir} 방향에 작은 조명이나 소품을 두는 걸로 대신하면 돼요.`;
    return {
      yong, yongName: el(yong),
      colors: {
        main: c[0], sub: c[1],
        hex: SWATCH[yong][0], hex2: SWATCH[yong][1],
        hexHee: SWATCH[hee][0],
        hee: h[0], avoid: g[0]
      },
      wallet: `${c[0]} 계열 지갑이나 폰케이스를 써 보세요. 안쪽에 ${c[1]}의 작은 것 하나(카드·천)를 넣어 두면 ${el(yong)}의 기운이 두 겹이 돼요.`,
      scent: SCENT[yong],
      bed, dir, dirNote,
      item: ITEM[yong],
      avoid: `${g[0]} 계열은 이번 해에 피하세요. ${el(gi)}의 기운이 도는 색이라, 들고 다니면 애써 모은 흐름이 그 색으로 새어 나가요.`,
      hours: [
        { k: '아침', v: `${c[0]} 옷을 입고 나가 보세요. 하루의 첫 결정은 옷에서 시작돼요.` },
        { k: '저녁', v: `잠들기 전 3분, ${dir}을 향해 앉아서 오늘 들어온 것 하나를 적어 보세요. 적는 행위가 ${el(2)}의 그릇을 만들어요.` }
      ]
    };
  }

  /* ============================================================
     전체
     ============================================================ */
  function build(a, opt) {
    const b = body(a, opt);
    return {
      body: b,
      hair: hair(a),
      dots: dots(a),
      speech: speech(a),
      living: living(a),
      meta: {
        name: a.name || '',
        pillars: a.pillars.filter(p => p.gan != null).map(p => S.GAN[p.gan] + S.JI[p.ji]).join(' · '),
        strength: a.strength.label,
        strengthLevel: a.strength.level,
        yongName: el(a.yongsin.yong),
        giName: el(a.yongsin.gi),
        gender: a.gender,
        sijin: a.timeKnown ? a.sijinName : '시간 모름'
      }
    };
  }

  global.Gaewun = {
    build, body, hair, dots, speech, living,
    tenGodWeights, ZONES, GROUP_KO, BANDS, TYPE, AVG_HEIGHT, SWATCH, josa, el
  };
})(window);
