/* ============================================================
   살풀이 : 천기 정밀 궁합 해석·화면 생성
   - 종합 점수 · 네 축 · 오행 비교 · 상세 풀이 4장
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const TX = global.SajuText;
  const GAN = S.GAN, JI = S.JI, GAN_KO = S.GAN_KO, JI_KO = S.JI_KO;
  const ELEM_KO = S.ELEM_KO, ELEM_HANJA = S.ELEM_HANJA;
  const GAN_ELEM = S.GAN_ELEM, JI_ELEM = S.JI_ELEM;
  const TEN_GODS = S.TEN_GODS, TEN_GODS_HANJA = S.TEN_GODS_HANJA;
  const el = e => `${ELEM_KO[e]}(${ELEM_HANJA[e]})`;

  /* 조사 — "화(火)"·한자·한글 음절 모두 받침을 보고 고른다 */
  const HANJA_READ = {};
  S.GAN.forEach((h, i) => { HANJA_READ[h] = S.GAN_KO[i]; });
  S.JI.forEach((h, i) => { HANJA_READ[h] = S.JI_KO[i]; });
  ELEM_HANJA.forEach((h, i) => { HANJA_READ[h] = ELEM_KO[i]; });
  const baseOf = w => {
    const s = w == null ? '' : String(w);
    const m = s.match(/^([가-힣])\(/);
    if (m) return m[1];
    if (s && HANJA_READ[s]) return HANJA_READ[s];
    return s;
  };
  const josa = (w, a, b) => {
    const s = baseOf(w);
    if (!s) return b;
    const c = s.charCodeAt(s.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return b;
    return ((c - 0xAC00) % 28) ? a : b;
  };
  const iGa = w => josa(w, '이', '가');
  const eun = w => josa(w, '은', '는');
  const eul = w => josa(w, '을', '를');
  const wa = w => josa(w, '과', '와');
  const euro = w => josa(w, '으로', '로');
  /* 해석문 안의 '상대'를 두 사람 모두에게 어울리는 말로 */
  const third = s => s
    .replace(/상대에게/g, '곁의 사람에게')
    .replace(/상대는/g, '곁의 사람은')
    .replace(/상대가/g, '곁의 사람이')
    .replace(/상대를/g, '곁의 사람을')
    .replace(/상대의/g, '곁의 사람의')
    .replace(/상대/g, '곁의 사람');

  const POS_NAME = { 년: '년주', 월: '월주', 일: '일주', 시: '시주' };
  const POS_JI = { 년: '년지', 월: '월지', 일: '일지', 시: '시지' };

  const JI_SCENE = ['밤의 물', '얼음 밑의 저장', '이른 봄의 시작', '꽃이 피는 자리', '물기를 머금은 흙', '한낮으로 차오르는 열기',
    '정오의 불', '마른 땅의 끝', '단단한 결단', '가을의 서리', '문을 닫는 자리', '겨울의 깊은 물'];

  const ELEM_OVER = [
    '생각이 앞서 시작을 미룹니다',
    '감정이 먼저 올라와 말이 앞섭니다',
    '결정을 미루고 속으로 삭힙니다',
    '정을 잘 주지 않고 선을 긋습니다',
    '생각이 많아 잠이 얕습니다'
  ];
  const ELEM_LACK = [
    '새로 시작하는 일을 두려워합니다',
    '좋아해도 표현을 아낍니다',
    '중심을 잡기 어려워 쉽게 흔들립니다',
    '결단이 늦어 때를 놓칩니다',
    '지치면 회복이 느립니다'
  ];

  const TEN_SHORT = {
    0: '같은 결의 사람 — 거울을 보는 듯 편하지만, 한 사람이 두 사람이 되기 쉽습니다',
    1: '닮았는데 몫을 나눠야 하는 사람 — 가까울수록 경쟁심이 삐져나옵니다',
    2: '편안히 키워 주고 싶은 사람 — 대신 상대의 무심함에 서운해집니다',
    3: '자극이 되는 사람 — 표현을 끌어내지만 말이 날카로워집니다',
    4: '챙기고 싶어 손이 먼저 가는 사람 — 다만 그 마음이 통제로 보일 수 있습니다',
    5: '내 살림에 들이고 싶은 사람 — 안정적이되, 계산이 앞서면 정이 식습니다',
    6: '나를 긴장시키는 사람 — 끌림과 압박이 동시에 옵니다',
    7: '나를 책임지려 드는 사람 — 든든하지만, 기대가 어긋나면 원망이 됩니다',
    8: '내게 없는 눈을 가진 사람 — 신비롭고, 가끔 이해되지 않습니다',
    9: '나를 받쳐 주는 사람 — 편안함이 오래가지만, 기대기만 하면 무너집니다'
  };

  /* ---------- 요약 텍스트 ---------- */
  function datesOf(a) {
    const s = a.solar;
    return `${a.calendar === '음력' ? '음력 ' : ''}${s.y}.${String(s.m).padStart(2, '0')}.${String(s.d).padStart(2, '0')}`;
  }

  function shareText(x) {
    return `살풀이 : 천기 정밀 궁합 — ${x.nameA} · ${x.nameB}, ${x.score}점(${x.grade}). ${x.type.name}. 두 사람의 여덟 글자를 겹쳐 봤어요.`;
  }

  /* ---------- 명식 카드 ---------- */
  function natalCard(a, name, who) {
    const dp = a.pillars.find(p => p.pos === '일');
    const map = {};
    a.pillars.forEach(p => { map[p.pos] = p; });
    const cells = ['년', '월', '일', '시'].map(pos => {
      const p = map[pos];
      if (!p || p.gan == null) {
        return `<div class="gg-nc-p unknown"><em>${pos}</em><b>—</b><b>—</b></div>`;
      }
      return `<div class="gg-nc-p${pos === '일' ? ' day' : ''}">
        <em>${pos}</em>
        <b style="color:var(--w-${['wood', 'fire', 'earth', 'metal', 'water'][GAN_ELEM[p.gan]]})">${GAN[p.gan]}</b>
        <b style="color:var(--w-${['wood', 'fire', 'earth', 'metal', 'water'][JI_ELEM[p.ji]]})">${JI[p.ji]}</b>
      </div>`;
    }).join('');
    const pcts = a.ew.pct.map(v => Math.round(v * 100));
    const maxE = pcts.indexOf(Math.max(...pcts));
    const minE = pcts.indexOf(Math.min(...pcts));
    return `<div class="gg-natal-card">
      <div class="gg-nc-head">
        <span class="gg-nc-tag">${who}</span>
        <b class="serif">${name}</b>
        <span class="gg-nc-meta">${a.gender} · ${datesOf(a)} · ${a.timeKnown ? a.sijinName : '시간 모름'}</span>
      </div>
      <div class="gg-nc-pillars">${cells}</div>
      <p class="gg-nc-line">일간 <b>${GAN[dp.gan]}(${GAN_KO[dp.gan]}${ELEM_HANJA[a.dayElem]})</b> · ${a.strength.level}<br>
        ${el(maxE)} ${pcts[maxE]}% · ${el(minE)} ${pcts[minE]}% · 용신 ${el(a.yongsin.yong)}</p>
    </div>`;
  }

  /* ---------- 오행 비교 ---------- */
  function ohengBlock(x) {
    const { a, b, nameA, nameB } = x;
    const maxP = Math.max(0.05, ...a.ew.pct, ...b.ew.pct);
    const rows = [0, 1, 2, 3, 4].map(e => {
      const pa = Math.round(a.ew.pct[e] * 100), pb = Math.round(b.ew.pct[e] * 100);
      const varName = ['wood', 'fire', 'earth', 'metal', 'water'][e];
      return `<div class="gg-oh-row">
        <span class="gg-oh-nm">${ELEM_KO[e]}<em>${ELEM_HANJA[e]}</em></span>
        <div class="gg-oh-bars">
          <div class="gg-oh-bar a"><i style="width:${(a.ew.pct[e] / maxP * 100).toFixed(1)}%;background:var(--w-${varName})"></i></div>
          <div class="gg-oh-bar b"><i style="width:${(b.ew.pct[e] / maxP * 100).toFixed(1)}%;background:var(--w-${varName})"></i></div>
        </div>
        <span class="gg-oh-pct"><b>${pa}</b><em>${pb}</em></span>
      </div>`;
    }).join('');

    const c = x.complement;
    const fillLine = [];
    const fa = c.fillsA[0], fb = c.fillsB[0];
    if (fa && fa.theirs >= 0.02) {
      const w = el(fa.e);
      fillLine.push(`${nameA}에게 ${Math.round(fa.mine * 100)}%뿐인 ${w}${eul(w)} ${nameB}${iGa(nameB)} ${Math.round(fa.theirs * 100)}% 들고 있습니다`);
    }
    if (fb && fb.theirs >= 0.02) {
      const w = el(fb.e);
      fillLine.push(`${nameB}에게 ${Math.round(fb.mine * 100)}%뿐인 ${w}${eul(w)} ${nameA}${iGa(nameA)} ${Math.round(fb.theirs * 100)}% 들고 있습니다`);
    }

    return `<div class="gg-oh-legend">
        <span><i class="dot a"></i>${nameA}</span><span><i class="dot b"></i>${nameB}</span>
      </div>
      <div class="gg-oh">${rows}</div>
      <p class="gg-oh-note">${fillLine.length ? fillLine.join('. ') + '.' : '두 사람의 오행이 비슷하게 놓여 있어, 채워 주는 힘보다 함께 기우는 자리가 큽니다.'}
        <b>보완도 ${Math.round(c.value * 100)}%</b></p>`;
  }

  /* ---------- 네 축 ---------- */
  function axesBlock(x) {
    return x.axes.map(a => `<div class="gg-axis">
      <div class="gg-axis-head">
        <b class="serif">${a.label}</b><em>${a.en}</em>
        <span>${a.value}</span>
      </div>
      <div class="gg-axis-track"><i style="width:${a.value}%"></i></div>
      <p>${a.note}</p>
    </div>`).join('');
  }

  /* ---------- 겹친 글자 ---------- */
  function chipsBlock(x) {
    const seen = new Set();
    const list = x.interactions.filter(i => {
      if (i.kind === '일지' && !i.dayKey) return false;
      if (seen.has(i.label)) return false;
      seen.add(i.label);
      return true;
    }).slice(0, 6);
    return `<div class="gg-chips">` + list.map(i =>
      `<span class="gg-chip ${i.tone}">${i.label}</span>`
    ).join('') + `</div>`;
  }

  function interList(x) {
    const list = x.interactions.slice(0, 5);
    return `<ul class="gg-inter">` + list.map(i => {
      const pos = i.dayKey ? '배우자궁끼리' : `${POS_NAME[i.pos[0]]}${i.pos[0] === i.pos[1] ? '끼리' : `와 ${POS_NAME[i.pos[1]]} 사이`}`;
      return `<li class="${i.tone}"><b>${i.label}</b> — ${pos}. ${i.detail || ''}</li>`;
    }).join('') + `</ul>`;
  }

  /* ---------- ① 끌리는 이유 ---------- */
  function sec1(x) {
    const { a, b, nameA, nameB, gan, dayJ } = x;
    const eA = GAN_ELEM[a.dayGan], eB = GAN_ELEM[b.dayGan];
    const dpA = a.pillars.find(p => p.pos === '일'), dpB = b.pillars.find(p => p.pos === '일');
    const dmA = TX.DAY_MASTER[a.dayGan], dmB = TX.DAY_MASTER[b.dayGan];
    const metaA = (dmA.title.split('—')[1] || '').trim();
    const metaB = (dmB.title.split('—')[1] || '').trim();
    const sameGan = a.dayGan === b.dayGan;
    const out = [];

    let ganLine = '';
    const elA = el(eA), elB = el(eB);
    if (gan.t === 'hap') {
      ganLine = `${nameA}의 일간 <b>${GAN[dpA.gan]}(${GAN_KO[dpA.gan]})</b>${wa(GAN_KO[dpA.gan])} ${nameB}의 <b>${GAN[dpB.gan]}(${GAN_KO[dpB.gan]})</b>은 <b>${gan.meta.n}(${gan.meta.h})</b>입니다. ${gan.meta.m}`;
    } else if (gan.t === 'gen') {
      ganLine = `두 사람의 일간은 서로를 살리는 자리에 있습니다. ${elA}${iGa(elA)} ${elB}${eul(elB)} 낳고, 그 사이에서 한 사람의 재능이 다른 사람의 판이 됩니다. 명리에서 이 관계를 <b>“먹여 주는 인연”</b>이라 부릅니다. 한쪽이 일방적으로 주는 것처럼 보여도, 실제로는 받는 쪽이 오래 곁에 남습니다.`;
    } else if (gan.t === 'same') {
      ganLine = `두 사람의 일간은 같은 ${elA}입니다. 같은 기운끼리 만나면 설명이 필요 없습니다. 말이 반만 닿아도 알아듣고, 침묵이 어색하지 않습니다. 다만 거울을 마주 본 사이는 서로의 빈 곳도 그대로 비춥니다.`;
    } else if (gan.t === 'chung') {
      ganLine = `두 사람의 일간은 <b>${GAN[dpA.gan]}${GAN[dpB.gan]} 천간충(天干沖)</b>입니다. 명리에서 이 자리는 “부딪히면서 끌리는 자리”입니다. 첫인상부터 어딘가 불편하고, 그 불편이 오히려 오래 기억에 남습니다.`;
    } else {
      const r = gan.r1 || '';
      ganLine = `두 사람의 일간은 한쪽이 다른 쪽을 누르는 자리입니다. ${elA}${wa(elA)} ${elB} 사이에 긴장이 있고, 그 긴장이 관계를 늘 깨어 있게 합니다. ${r === 'resource' || r === 'officer' ? '누르는 쪽이 아니라 눌리는 쪽이 먼저 지치는 관계라, 강한 사람이 힘을 빼는 순간 관계가 편안해집니다.' : '누르는 쪽은 대개 모릅니다. 말로 확인하기 전에는 상대가 상처받았다는 것도 알기 어렵습니다.'}`;
    }

    const differ = !sameGan && Math.abs(eA - eB) !== 0;
    const metaLine = (sameGan && metaA === metaB)
      ? `두 사람 모두 ${metaA}입니다. `
      : `<b>${nameA}</b>${eun(nameA)} ${metaA}, <b>${nameB}</b>${eun(nameB)} ${metaB}. ` +
        (differ ? '본질이 이렇게 다르기 때문에 서로의 자리가 비어 보입니다. '
          : '본질이 같은 결이라 설명이 필요 없는 사이입니다. ');
    out.push(`<p>${metaLine}${ganLine}</p>`);

    const jp = dayJ.primary;
    let jiLine = '';
    if (jp.t === 'yukhap') {
      jiLine = `배우자궁이 <b>${jp.meta.n}(${jp.meta.h})</b>으로 묶였습니다. ${jp.meta.m} 잠드는 시간, 돈을 쓰는 손버릇, 서운함을 말로 꺼내는 타이밍이 닮습니다.`;
    } else if (jp.t === 'banhap' || jp.t === 'banghap') {
      jiLine = `배우자궁이 <b>${jp.name}(${jp.hanja})</b>을 이룹니다. ${jp.meta ? jp.meta.m : '두 사람의 생활 방향이 같은 쪽을 향합니다.'} 함께 무엇을 만들기 시작하면 그 일이 관계를 오래 붙잡아 줍니다.`;
    } else if (jp.t === 'bihwa') {
      jiLine = `배우자궁이 같은 글자입니다. 생활의 결이 같아 부딪힐 일이 적고, 대신 서로를 자극할 일도 적습니다. 이 관계는 설렘보다 안정에서 힘을 얻습니다.`;
    } else if (jp.t === 'chung') {
      jiLine = `배우자궁이 <b>${JI[dpA.ji]}${JI[dpB.ji]} 충(沖)</b>입니다. 충은 감정이 아니라 생활의 리듬이 어긋나는 자리입니다. 한 사람에게는 당연한 것이 다른 사람에게는 무례가 됩니다. 그래서 이 관계는 서로를 이해하는 속도보다 <b>시간표를 맞추는 속도</b>가 중요합니다.`;
    } else if (jp.t === 'hyeong') {
      jiLine = `배우자궁이 <b>형(刑)</b>입니다. 형은 미워서가 아니라 가까워서 생기는 압박입니다. 서로의 약점을 정확히 알기 때문에, 화가 나면 그 자리를 정확히 찌릅니다.`;
    } else if (jp.t === 'pa') {
      jiLine = `배우자궁이 <b>파(破)</b>입니다. 말로는 다정한데 손발이 안 맞습니다. 약속이 자꾸 어긋나고, 같은 일을 두 번 하게 됩니다. 대신 이 어긋남이 관계를 지루하지 않게 만듭니다.`;
    } else if (jp.t === 'hae') {
      jiLine = `배우자궁이 <b>해(害)</b>입니다. 겉으로 티가 나지 않고 속으로 삭는 자리입니다. 서운함을 말하지 않으면 관계가 아니라 각자의 상처만 쌓입니다.`;
    } else {
      jiLine = `배우자궁 사이에 특별한 합도 충도 없습니다. 두 사람의 관계는 하늘이 정해 둔 결보다, 두 사람이 매일 무엇을 말하고 무엇을 함께 하는지에서 만들어집니다.`;
    }
    out.push(`<p>${nameA}의 배우자궁은 <b>${JI[dpA.ji]}(${JI_KO[dpA.ji]})</b> — ${JI_SCENE[dpA.ji]}, ${nameB}는 <b>${JI[dpB.ji]}(${JI_KO[dpB.ji]})</b> — ${JI_SCENE[dpB.ji]}입니다. ${jiLine}</p>`);

    const stronger = a.strength.ratio >= b.strength.ratio ? nameA : nameB;
    const weaker = stronger === nameA ? nameB : nameA;
    const loveA = third(dmA.love), loveB = third(dmB.love);
    out.push(`<p>감정의 코드는 이렇습니다. ` +
      (sameGan ? `두 사람 모두 ${loveA}` : `${nameA}${eun(nameA)} ${loveA} ${nameB}${eun(nameB)} ${loveB}`) + ' ' +
      (sameGan
        ? '같은 언어를 쓰는 두 사람이니, 서로의 침묵을 오해하지 않는 것이 이 관계의 가장 큰 자산입니다.'
        : '기다리는 방식과 표현하는 방식이 달라서, 그 차이를 말로 옮기는 순간 관계가 한 단계 깊어집니다.') +
      ` 그래서 이 관계에서는 <b>${stronger}</b>${iGa(stronger)} 먼저 문을 열고, <b>${weaker}</b>${iGa(weaker)} 그 문을 닫지 않는 것이 시작입니다. 두 사람이 가까워지는 순간은 대개 말을 잘했을 때가 아니라, 한 사람이 말없이 기다려 주었을 때입니다.</p>`);

    const tgA = TEN_GODS[x.tenA], tgB = TEN_GODS[x.tenB];
    out.push(`<p>십성으로 보면 더 분명합니다. ${nameA}${iGa(nameA)} 본 ${nameB}${eun(nameB)} <b>${tgA}(${TEN_GODS_HANJA[x.tenA]})</b> — ${TEN_SHORT[x.tenA]}. 반대로 ${nameB}${iGa(nameB)} 본 ${nameA}${eun(nameA)} <b>${tgB}(${TEN_GODS_HANJA[x.tenB]})</b> — ${TEN_SHORT[x.tenB]}. 이 두 문장이 두 사람이 서로를 대하는 방식의 뿌리입니다.</p>`);

    const tA = `${GAN_KO[dpA.gan]}${ELEM_KO[eA]}`, tB = `${GAN_KO[dpB.gan]}${ELEM_KO[eB]}`;
    return { title: `끌림의 정체 — ${tA}${wa(tA)} ${tB}${iGa(tB)} 만났을 때`, paras: out };  }

  /* ---------- ② 갈등과 처방 ---------- */
  function sec2(x) {
    const { a, b, nameA, nameB } = x;
    const out = [];
    const bad = x.interactions.filter(i => i.tone === 'bad');
    const worst = bad[0];
    let fricLine;
    if (worst) {
      const isGan = worst.kind === '천간충';
      const posTxt = worst.dayKey ? '배우자궁끼리' : isGan
        ? `${POS_NAME[worst.pos[0]]}${wa(POS_NAME[worst.pos[0]])} ${POS_NAME[worst.pos[1]]} 사이`
        : `${POS_JI[worst.pos[0]]}${wa(POS_JI[worst.pos[0]])} ${POS_JI[worst.pos[1]]} 사이`;
      const body = {
        '충': '충(沖)은 정면으로 마주 서는 자리입니다. 한 사람이 밀면 다른 사람은 물러서지 않고 버팁니다. 이 관계에서 싸움은 의견 차이로 시작해 태도 문제로 번지고, 결국 “너는 원래 그렇다”는 말로 끝납니다.',
        '형': '형(刑)은 서로를 너무 잘 알아서 생기는 압박입니다. 상대가 어디를 찌르면 아픈지 정확히 알고, 화가 나면 그 자리를 정확히 찌릅니다.',
        '파': '파(破)는 계획이 자꾸 어긋나는 자리입니다. 마음은 같은데 시간과 방식이 계속 엇갈립니다. 이 어긋남을 “안 맞는다”로 읽으면 관계가 먼저 지칩니다.',
        '해': '해(害)는 겉으로 드러나지 않고 속으로 삭는 자리입니다. 웃으면서 넘긴 일이 쌓여 어느 날 갑자기 관계가 끊깁니다.',
        '천간충': '천간충은 말투와 태도에서 먼저 드러납니다. 같은 말도 한 사람에게는 농담, 다른 사람에게는 무례가 됩니다. 감정이 상한 쪽은 대개 말하지 않고, 말하지 않은 쪽이 오래 남습니다.'
      }[worst.kind] || '두 사람 사이에 마찰이 되는 글자가 하나 있습니다.';
      fricLine = `<p>가장 크게 부딪히는 자리는 <b>${worst.label}</b> — ${posTxt}입니다. ${body} 이 자리가 흔들리면 다른 모든 것이 함께 흔들립니다. 그래서 두 사람이 싸우는 날은 대개 이 글자가 먼저 움직인 날입니다.</p>`;
    } else {
      fricLine = `<p>두 사람 사이에는 충(沖)도 형(刑)도 없습니다. 이 관계의 위험은 부딪힘이 아니라 <b>무관심</b>입니다. 싸우지 않기 때문에 문제가 드러나지 않고, 드러나지 않기 때문에 어느 날 갑자기 멀어집니다. 한 달에 한 번은 불편한 말을 꺼내야 이 인연이 살아 있습니다.</p>`;
    }
    out.push(fricLine);

    const pa = a.ew.pct.map(v => Math.round(v * 100)), pb = b.ew.pct.map(v => Math.round(v * 100));
    const maxA = pa.indexOf(Math.max(...pa)), minA = pa.indexOf(Math.min(...pa));
    const maxB = pb.indexOf(Math.max(...pb)), minB = pb.indexOf(Math.min(...pb));
    out.push(`<p>숫자로 보면 이렇습니다. ${nameA}${eun(nameA)} ${el(maxA)} ${pa[maxA]}% · ${el(minA)} ${pa[minA]}%, ${nameB}${eun(nameB)} ${el(maxB)} ${pb[maxB]}% · ${el(minB)} ${pb[minB]}%입니다. ${nameA}${eun(nameA)} ${ELEM_OVER[maxA]}. ${nameB}${eun(nameB)} ${ELEM_OVER[maxB]}. 반대로 ${nameA}${eun(nameA)} ${ELEM_LACK[minA]}. ${nameB}${eun(nameB)} ${ELEM_LACK[minB]}. 이 두 문장이 두 사람이 싸우는 진짜 이유입니다 — 성격이 아니라 <b>기운의 쏠림</b>입니다.</p>`);

    const rx = [];
    const ruleByBad = {
      '충': '연락과 약속에 규칙을 두십시오. “답장은 하루 안에, 약속 변경은 하루 전에” 같은 문장 하나가 충을 절반으로 줄입니다.',
      '형': '화가 난 날에는 결론을 말하지 마십시오. 24시간 뒤에 다시 꺼내면 같은 말이 훨씬 덜 아프게 닿습니다.',
      '파': '같은 약속은 두 번 확인하십시오. 이 관계는 기억이 아니라 기록이 지켜 줍니다.',
      '해': '서운한 일은 그날 안에 한 문장으로 말하십시오. “괜찮다”는 말은 이 관계에서 가장 비싼 거짓말입니다.',
      '천간충': '말의 온도를 정해 두십시오. 중요한 이야기는 문자로, 가벼운 이야기는 통화로 나누면 오해가 줄어듭니다.'
    };
    rx.push(worst ? ruleByBad[worst.kind] || '중요한 결정은 감정이 가라앉은 뒤에 다시 꺼내십시오.' : '한 달에 한 번, 불편한 이야기를 꺼내는 자리를 만드십시오.');
    const gapA = x.complement.fillsA[0], gapB = x.complement.fillsB[0];
    if (gapA) {
      const g = el(gapA.e);
      rx.push(`${nameA}에게 ${g}${iGa(g)} 모자랍니다. ${TX.ELEM_REMEDY[gapA.e]} 이 기운을 ${nameB}${wa(nameB)} 함께 쓰는 습관이 관계의 빈 곳을 채웁니다.`);
    }
    if (gapB && (!gapA || gapB.e !== gapA.e)) {
      const g = el(gapB.e);
      rx.push(`${nameB}에게는 ${g}${iGa(g)} 부족합니다. ${TX.ELEM_REMEDY[gapB.e]}`);
    }
    const strongOne = a.strength.ratio >= b.strength.ratio ? a : b;
    const weakOne = strongOne === a ? b : a;
    const strongName = strongOne === a ? nameA : nameB;
    const weakName = weakOne === a ? nameA : nameB;
    rx.push(`${strongName}${eun(strongName)} ${strongOne.strength.level}이고 ${weakName}${eun(weakName)} ${weakOne.strength.level}입니다. 강한 쪽이 결정을 서두르면 약한 쪽은 대답만 하고 마음은 닫습니다. 결정은 ${weakName}의 속도에 맞추고, 대신 ${strongName}의 몫을 분명히 남겨 두십시오.`);

    out.push(`<p><b>현실 처방</b></p><ol class="gg-rx">${rx.map(r => `<li>${r}</li>`).join('')}</ol>`);
    const worstTitle = worst
      ? (worst.kind === '천간충' ? '천간충, 말투가 어긋나는 자리' : `${worst.kind}(${worst.hanja})${iGa(worst.kind)} 놓인 자리`)
      : '싸우지 않는 것이 위험한 사이';
    return { title: `부딪히는 지점 — ${worstTitle}`, paras: out };
  }

  /* ---------- ③ 올해 흐름 ---------- */
  function sec3(x) {
    const { a, b, nameA, nameB, type, saeun } = x;
    const out = [];
    const sA = saeun.a, sB = saeun.b;
    const yj = JI[sA.ji], yg = GAN[sA.gan];

    function chartLine(s, nm, p) {
      const jr = s.jr.filter(r => r.t !== 'none');
      const jtxt = jr.length ? jr.map(r => `${r.name}(${r.hanja})`).join(' · ') : '특별한 합충 없이';
      const gtxt = s.g.t === 'hap' ? '합' : s.g.t === 'chung' ? '충' : s.g.t === 'gen' ? '상생' : s.g.t === 'same' ? '비화' : '무난한 흐름';
      const ij = `${GAN[p.dayPillar.gan]}${JI[p.dayPillar.ji]}`;
      return `${nm}의 일주 <b>${ij}</b>${eun(ij)} ${yg}${yj}년을 만나 일지에 ${jtxt}, 일간에 ${gtxt}이 걸립니다`;
    }
    const sameChart = a.dayPillar.gan === b.dayPillar.gan && a.dayPillar.ji === b.dayPillar.ji;
    const flow = sA.pts + sB.pts;
    const flowLine = flow >= 2 ? '올해의 불이 두 사람의 자리를 함께 밝히는 해입니다. 관계를 말로 확정하기 좋고, 미뤄 둔 이야기를 꺼내기에도 나쁘지 않습니다.'
      : flow <= -2 ? '올해의 불이 두 사람의 자리를 흔드는 해입니다. 감정이 커지는데 결론은 늦어지니, 확정보다 확인이 필요합니다.'
        : '올해는 두 사람 사이에 큰 물결이 없습니다. 지금의 속도를 유지하는 것이 가장 좋은 선택입니다.';

    if (sameChart) {
      out.push(`<p>두 사람의 일주가 같습니다 — <b>${GAN[a.dayPillar.gan]}${JI[a.dayPillar.ji]}</b>. 드문 일입니다. 같은 자리에서 세상을 보고, 같은 약점을 공유합니다. ${chartLine(sA, '두 사람', a)}. ${flowLine}</p>`);
    } else {
      out.push(`<p>${chartLine(sA, nameA, a)}. ${chartLine(sB, nameB, b)}. ${flowLine}</p>`);
    }

    const mparts = saeun.months.map(g => {
      const good = g.hits.filter(h => h.good).slice(0, 1);
      const bads = g.hits.filter(h => !h.good).slice(0, 2);
      const bits = [];
      if (good.length) {
        const h = good[0], rn = h.r.name;
        bits.push(`${h.m.start} ${h.m.name}(${GAN[h.m.gan]}${JI[h.m.ji]}) — ${rn}${euro(rn)} 마음이 열리는 달`);
      }
      if (bads.length) {
        const h = bads[0], rn = h.r.name;
        const more = bads[1] ? `·${bads[1].m.start} ${bads[1].m.name}` : '';
        bits.push(`${h.m.start} ${h.m.name}${more}(${GAN[h.m.gan]}${JI[h.m.ji]}) — ${rn}${euro(rn)} 흔들리는 달`);
      }
      return bits.length ? bits.join(', ') : '';
    });
    if (mparts.some(Boolean)) {
      const line = sameChart && mparts[0] && mparts[0] === mparts[1]
        ? `두 사람 모두 ${mparts[0]}입니다. `
        : mparts.map((t, i) => t ? `<b>${saeun.months[i].name}</b>${eun(saeun.months[i].name)} ${t}입니다. ` : '').join('');
      out.push(`<p>달로 보면 이렇습니다. ${line}이 달에 결정할 일과 미룰 일을 나누십시오.</p>`);
    }

    const typeLine = {
      some: '아직 이름이 없는 사이입니다. 올해의 관건은 마음의 크기가 아니라 <b>관계를 무엇으로 부를 것인가</b>입니다. 상대가 먼저 정의를 내리게 두지 말고, 두 사람이 같은 단어를 쓰는지 확인하십시오. “만나는 사이”라는 말이 한 사람에게는 시작, 다른 사람에게는 부담입니다.',
      couple: '연인으로서 올해는 감정의 확인보다 <b>생활의 합</b>이 중요해집니다. 여행 한 번, 돈을 쓰는 방식 한 번이 관계의 다음 단계를 결정합니다. 서로의 가족·친구에게 언제 소개할지도 올해 안에 정해 두면 흔들리지 않습니다.',
      married: '부부로 살아온 시간이 있다면 올해는 <b>역할을 다시 나누는 해</b>입니다. 한 사람이 오래 맡아 온 일을 다른 사람이 한 번 맡아 보십시오. 그 하루가 서운함의 절반을 지웁니다. 큰 지출은 두 사람이 같은 날 함께 결정하는 규칙을 두십시오.',
      friend: '친구나 동업으로서 올해는 <b>돈과 시간의 경계</b>가 관건입니다. 함께 하는 일에 돈이 오가기 시작하면 몫과 기한을 문서로 남기십시오. 그것이 관계를 의심하는 것이 아니라, 관계를 오래 가게 하는 유일한 방법입니다.'
    }[type.id];
    out.push(`<p>${typeLine}</p>`);
    return { title: `2026 ${yg}${yj}년 — 두 사람 사이에 놓인 것`, paras: out };
  }

  /* ---------- ④ 한 마디 ---------- */
  function sec4(x) {
    const { nameA, nameB, score, grade, type } = x;
    const couple = `${nameA}${wa(nameA)} ${nameB}의 궁합은 감정이 아니라 습관에서 완성됩니다.`;
    const pairs = {
      some: `${nameA}${wa(nameA)} ${nameB} 사이에 필요한 것은 확신이 아니라 시간입니다. 지금 결론을 내리려 하지 말고, 다음 계절까지 두 사람이 같은 자리에 있는지만 보십시오. 그때도 곁에 있다면 그것이 답입니다.`,
      couple: `두 사람이 오래 가려면 사랑을 증명하지 말고 생활을 맞추십시오. ${couple} 같이 정한 규칙 세 개가 백 번의 고백보다 오래갑니다.`,
      married: `한집에서 오래 산다는 것은 운명이 아니라 매일의 선택입니다. ${nameA}${wa(nameA)} ${nameB}는 서로의 빈 곳을 이미 알고 있습니다. 그 빈 곳을 채워 주려 애쓰지 말고, 비어 있는 채로도 괜찮다고 말해 주십시오.`,
      friend: `${nameA}${wa(nameA)} ${nameB}의 인연은 편안함이 아니라 신뢰에서 옵니다. 서로의 자리를 탐내지 않는 한 이 관계는 오래갑니다. 대신 돈이 오가는 일만큼은 두 사람 사이에서도 분명히 하십시오.`
    };
    const close = score >= 85
      ? '이 궁합은 흔한 자리가 아닙니다. 다만 좋은 인연일수록 손을 놓는 순간이 오니, 그때 한 번만 더 붙잡으십시오.'
      : score >= 75
        ? '이 인연은 잘 맞아서가 아니라 서로를 다듬어서 완성됩니다. 그 다듬는 손이 거칠어지지 않게만 하십시오.'
        : '이 관계는 운에 맡기면 흐려지고, 사람이 손을 쓰면 남습니다. 오늘 한 가지만 바꿔 보십시오.';
    return {
      title: '살풀이 : 천기의 한 마디',
      paras: [`<p>${pairs[type.id]}</p>`,
        `<p class="gg-word serif">“${close}”</p>`,
        `<p class="gg-caption">${score}점 · ${grade} — 이 숫자는 정해진 결말이 아니라, 지금 두 사람 사이에 놓인 기운의 온도입니다.</p>`]
    };
  }

  /* ---------- 렌더 ---------- */
  function render(x) {
    const secs = [sec1(x), sec2(x), sec3(x), sec4(x)];
    const nums = ['①', '②', '③', '④'];
    const shortA = x.nameA.length > 6 ? x.nameA.slice(0, 6) : x.nameA;
    const shortB = x.nameB.length > 6 ? x.nameB.slice(0, 6) : x.nameB;
    const circ = 2 * Math.PI * 52;
    const dash = (circ * x.score / 100).toFixed(1);

    return `
    <div class="card gg-hero">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 정밀 궁합</div>
        <h2 class="serif" id="ggTitle">${shortA} · ${shortB}의 궁합</h2>
        <p>${x.type.name} · ${datesOf(x.a)} ${x.a.timeKnown ? x.a.sijinName : '시간 모름'} · ${datesOf(x.b)} ${x.b.timeKnown ? x.b.sijinName : '시간 모름'}</p>
      </div>
      <div class="gg-score-wrap">
        <svg class="gg-ring" viewBox="0 0 120 120" aria-label="궁합 점수 ${x.score}점">
          <defs>
            <linearGradient id="ggGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f6e3ad"/><stop offset="55%" stop-color="#d9b978"/><stop offset="100%" stop-color="#e2a35e"/>
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(217,185,120,.14)" stroke-width="6"/>
          <circle class="gg-ring-fill" cx="60" cy="60" r="52" fill="none" stroke="url(#ggGrad)" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${dash} ${circ.toFixed(1)}" transform="rotate(-90 60 60)"/>
        </svg>
        <div class="gg-score-txt"><b class="serif">${x.score}</b><span>점</span><em>${x.grade}</em></div>
      </div>
      <p class="gg-verdict serif">${x.verdict}</p>
      <p class="gg-lead">${x.lead}</p>
      ${chipsBlock(x)}
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">두 사람의 명식</h2><span class="en">TWO CHARTS</span></div>
      <div class="gg-natal">${natalCard(x.a, x.nameA, 'A')}${natalCard(x.b, x.nameB, 'B')}</div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">오행의 보완</h2><span class="en">ELEMENT EXCHANGE</span></div>
      ${ohengBlock(x)}
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">네 가지 축</h2><span class="en">FOUR AXES</span></div>
      <div class="gg-axes">${axesBlock(x)}</div>
      ${interList(x)}
    </div>

    <div class="card gg-read">
      <div class="section-head"><h2 class="serif">정밀 풀이</h2><span class="en">READING</span></div>
      ${secs.map((s, i) => `<div class="gg-sec">
        <div class="gg-sec-head"><span class="gg-no">${nums[i]}</span><h3 class="serif">${s.title}</h3></div>
        ${s.paras.join('')}
      </div>`).join('')}
    </div>

    <div class="card gg-share-card">
      <p class="gg-disclaim">궁합은 두 사람의 가능성을 읽는 것이지, 결말을 정하는 것이 아닙니다. 같은 여덟 글자도 매일의 말과 선택으로 다른 관계가 됩니다.</p>
      <div class="gg-actions">
        <button class="share-btn" id="shareGunghap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M12 3 8.5 6.5M12 3l3.5 3.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          상대에게 보내기 · 공유하기
        </button>
        <button class="btn-ghost" id="ggReset">다른 사람으로 다시 보기</button>
      </div>
    </div>`;
  }

  global.GunghapText = { render, shareText, datesOf };
})(window);
