/* ============================================================
   살풀이 : 천기 해석문 생성 (사주 원국 → 무료 요약 + 프리미엄 리포트)
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const { GAN, GAN_KO, JI, JI_KO, ELEM_KO, ELEM_HANJA, ELEM_COLOR, ELEM_TRAIT,
    ELEM_DIRECTION, ELEM_NUM, ELEM_COLORNAME, ELEM_ORGAN, TEN_GODS, TEN_GODS_HANJA } = S;

  const el = n => `${ELEM_KO[n]}(${ELEM_HANJA[n]})`;
  const pct = (v) => Math.round(v * 100);

  /* ---------- 일간(日干) 성격 ---------- */
  const DAY_MASTER = {
    0: {
      title: '갑목(甲木) — 하늘로 곧게 뻗는 큰 나무',
      body: '당신의 본질은 곧은 줄기입니다. 옆으로 휘지 않고 위로 자라려는 마음이 강해서, 처음 세운 뜻을 끝까지 밀고 나가는 힘이 있습니다. 남에게 기대기보다 스스로 서려 하고, 잘못된 것을 보면 참지 못하는 정의감도 있습니다. 다만 줄기가 곧을수록 부러질 때 소리가 큰 법이라, 유연함을 잃으면 인간관계에서 혼자만 상처받기 쉽습니다.',
      keyword: '개척 · 소신 · 성장'
    },
    1: {
      title: '을목(乙木) — 담을 타고 오르는 덩굴',
      body: '당신은 부드럽지만 결코 약하지 않습니다. 바위를 만나면 돌아가고, 벽을 만나면 기어오르며 결국 원하는 자리에 닿는 사람입니다. 눈치가 빠르고 분위기를 읽는 감각이 뛰어나 사람들 사이에서 없어서는 안 될 존재가 됩니다. 다만 남의 기대에 맞추다 보면 정작 내가 원하는 것을 잊어버리기 쉬우니, 가끔은 혼자만의 자리를 확보해야 합니다.',
      keyword: '적응 · 친화 · 끈기'
    },
    2: {
      title: '병화(丙火) — 세상을 밝히는 태양',
      body: '당신은 숨길 수 없는 사람입니다. 기분이 좋으면 온 사방이 환해지고, 속이 상하면 주변까지 어두워집니다. 앞에 있는 사람을 먼저 챙기고, 무리의 중심에 서는 데 거부감이 없습니다. 화려한 자리보다 사람을 밝히는 일에서 힘을 냅니다. 다만 감정의 기복이 그대로 드러나므로, 결정을 내릴 때 한 박자만 늦추면 훨씬 멀리 갑니다.',
      keyword: '열정 · 리더십 · 직관'
    },
    3: {
      title: '정화(丁火) — 어둠 속 촛불',
      body: '당신은 크게 타오르기보다 오래 비추는 불입니다. 조용하지만 한 사람의 마음을 깊이 밝히고, 그 온기를 오래 기억하게 만듭니다. 섬세하고 직관이 좋아 남들이 놓친 것을 먼저 알아챕니다. 다만 촛불은 바람에 약합니다. 주변의 무관심이나 거친 말에 쉽게 흔들리니, 스스로를 지키는 조용한 공간이 반드시 필요합니다.',
      keyword: '섬세 · 헌신 · 직관'
    },
    4: {
      title: '무토(戊土) — 만물을 품는 큰 산',
      body: '당신은 쉽게 흔들리지 않는 중심입니다. 말보다 행동이 앞서고, 한 번 맡은 일은 소리 없이 끝까지 해냅니다. 주변 사람들이 위기 때 가장 먼저 찾는 사람이 당신입니다. 다만 산은 움직이지 않아서 때로 고집이 됩니다. 변화가 필요한 순간에도 "원래 이랬다"에 기대면 기회를 놓치니, 한 걸음만 옮겨보는 연습이 약입니다.',
      keyword: '신뢰 · 안정 · 포용'
    },
    5: {
      title: '기토(己土) — 곡식을 기르는 밭',
      body: '당신은 키우는 사람입니다. 사람과 일을 돌보고, 조용히 뒤에서 판을 정리합니다. 드러나지 않아도 실제로 일이 굴러가게 만드는 힘이 당신에게 있습니다. 다만 밭은 남의 것을 먼저 먹입니다. 정작 자기 몫을 챙기지 못해 속앓이를 하는 일이 많으니, 받을 것은 분명히 받는 연습이 필요합니다.',
      keyword: '배려 · 실무 · 축적'
    },
    6: {
      title: '경금(庚金) — 벼려진 큰 칼',
      body: '당신은 결단의 사람입니다. 망설이기보다 자르고, 미련을 남기지 않습니다. 위기에서 오히려 침착해지고, 남들이 못 하는 결정을 대신 내립니다. 다만 칼은 날이 서 있어 가까운 사람도 베기 쉽습니다. 옳은 말도 순서와 온도를 지키면 훨씬 많은 사람이 당신을 따릅니다.',
      keyword: '결단 · 추진 · 의리'
    },
    7: {
      title: '신금(辛金) — 세공된 보석',
      body: '당신은 정밀함의 사람입니다. 대충 넘기지 못하고, 작은 결점을 먼저 봅니다. 그 눈이 당신을 전문가로 만들지만, 동시에 스스로를 가장 혹독하게 채찍질합니다. 미적 감각과 완성도에 대한 기준이 높아 결과물은 늘 좋지만, 그 과정에서 지치는 일이 많습니다. 스스로에게 관대해지는 것이 곧 실력입니다.',
      keyword: '정교 · 완성도 · 자존'
    },
    8: {
      title: '임수(壬水) — 바다로 흐르는 큰 물',
      body: '당신은 넓게 보는 사람입니다. 작은 규칙에 갇히기보다 큰 흐름을 읽고, 막히면 다른 길로 돌아갑니다. 지식과 정보를 빨아들이는 힘이 좋아 어떤 분야든 빠르게 장악합니다. 다만 물은 담는 그릇이 없으면 흩어집니다. 마감과 루틴을 정해두면 당신의 가능성은 몇 배가 됩니다.',
      keyword: '통찰 · 확장 · 유연'
    },
    9: {
      title: '계수(癸水) — 풀잎에 맺힌 이슬',
      body: '당신은 조용히 스며드는 사람입니다. 말보다 분위기로 사람을 읽고, 상대가 말하지 않은 감정까지 알아챕니다. 그래서 사람들은 당신에게 이상하게 위로를 받습니다. 다만 이슬은 쉽게 증발합니다. 생각이 많아지는 밤이 길어지면 몸이 먼저 지치므로, 손을 움직이는 단순한 일로 머리를 식히는 것이 좋습니다.',
      keyword: '감수성 · 관찰 · 공감'
    }
  };

  /* ---------- 십성 해석 ---------- */
  const TEN_GOD_TEXT = {
    0: { name: '비견', short: '자기 힘으로 서는 힘', body: '내 몫을 스스로 지키는 기운입니다. 경쟁에서 물러서지 않고, 내 이름으로 무언가를 해내야 직성이 풀립니다. 동업이나 공동 작업에서는 몫과 역할을 처음부터 문서로 남겨야 탈이 없습니다.' },
    1: { name: '겁재', short: '빼앗고 빼앗기는 힘', body: '판을 키우는 추진력이자, 돈이 새는 구멍입니다. 크게 벌고 크게 쓰는 흐름이 생기므로 보증·동업·지인 대출에는 특히 신중해야 합니다.' },
    2: { name: '식신', short: '먹고사는 재주', body: '꾸준히 만들어내는 힘입니다. 요리·콘텐츠·교육처럼 손으로 결과물을 내는 일에서 길게 먹고삽니다. 욕심을 부리지 않아도 생활이 무너지지 않는 복이 있습니다.' },
    3: { name: '상관', short: '틀을 깨는 재주', body: '남들이 당연하게 여기는 것을 뒤집어 보는 눈입니다. 기획·마케팅·창작·강의에서 빛나지만, 조직의 위계와는 부딪치기 쉬워 말을 아끼는 훈련이 필요합니다.' },
    4: { name: '편재', short: '돌아다니는 큰 돈', body: '여러 곳에서 돈이 들어오는 구조입니다. 유통·영업·투자처럼 돈이 흐르는 자리에 서면 감각이 살아나지만, 한곳에 몰빵하는 투자는 위험합니다.' },
    5: { name: '정재', short: '차곡차곡 쌓는 돈', body: '성실하게 모으는 재물의 그릇입니다. 급등보다는 반복되는 수입, 월급·임대·정기 구독 같은 구조에서 강합니다. 숫자를 관리하는 습관이 곧 재산입니다.' },
    6: { name: '편관', short: '나를 벼리는 압박', body: '쉽지 않은 자리가 오히려 나를 단단하게 만듭니다. 경쟁·규제·위기 관리 쪽에서 강하고, 위기 때 존재감이 커집니다. 다만 스스로를 너무 몰아붙이면 몸이 먼저 신호를 보냅니다.' },
    7: { name: '정관', short: '반듯한 자리와 명예', body: '책임과 신뢰로 평가받는 기운입니다. 직함·자격·공식 절차를 갖출수록 운이 열리고, 규칙을 지키는 사람들과 잘 맞습니다. 조직에서 인정받는 길이 멀지 않습니다.' },
    8: { name: '편인', short: '남다른 공부의 눈', body: '남들이 안 보는 분야를 파고드는 힘입니다. 전문 자격·연구·상담·역술처럼 특수한 지식에서 두각을 보입니다. 생각이 많아 실행이 늦어지는 것만 잡으면 무기가 됩니다.' },
    9: { name: '정인', short: '받쳐주는 어른과 배움', body: '배움과 보호의 기운입니다. 문서·학위·자격·후원이 나를 살립니다. 윗사람의 인정을 받기 쉽고, 공부를 멈추지 않는 한 운이 끊기지 않습니다.' }
  };

  /* ---------- 오행 부족 시 조언 ---------- */
  const ELEM_REMEDY = [
    '새벽과 봄, 시작하는 힘. 아침 산책과 초록 식물, 새로 배우는 습관이 부족한 기운을 채웁니다.',
    '한낮과 여름, 드러내는 힘. 사람 앞에 서는 일, 운동으로 땀 흘리기, 밝은 조명이 기운을 올립니다.',
    '환절기와 저녁, 붙잡아 두는 힘. 규칙적인 식사와 저축, 흙을 만지는 일이 중심을 잡아 줍니다.',
    '가을과 해질녘, 정리하는 힘. 물건을 버리고 마감을 지키는 습관, 흰색 소품이 결단을 돕습니다.',
    '밤과 겨울, 흐르는 힘. 충분한 수분과 잠, 조용히 생각을 정리하는 시간이 지혜를 깨웁니다.'
  ];

  /* ---------- 세운 테마 ---------- */
  const SAEUN_THEME = {
    0: '내 이름으로 판을 벌이는 해', 1: '경쟁과 분배가 함께 오는 해',
    2: '만들고 베푸는 일이 늘어나는 해', 3: '틀을 깨고 말이 앞서는 해',
    4: '큰돈의 흐름이 보이는 해', 5: '현실 수입이 단단해지는 해',
    6: '압박과 성장이 함께 오는 해', 7: '자리와 신뢰가 올라가는 해',
    8: '공부와 재정비의 해', 9: '배움과 후원이 들어오는 해'
  };

  /* ---------- 유틸 ---------- */
  function topGods(a, n) {
    const cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    a.pillars.forEach(p => {
      if (p.gan != null && p.ganTenGod != null) cnt[p.ganTenGod] += 1.2;
      if (p.jiTenGod != null) cnt[p.jiTenGod] += 1;
    });
    return cnt.map((v, i) => ({ i, v, name: TEN_GODS[i] })).filter(x => x.v > 0).sort((x, y) => y.v - x.v);
  }

  function godGroup(g) {
    if (g <= 1) return 'self';
    if (g <= 3) return 'output';
    if (g <= 5) return 'wealth';
    if (g <= 7) return 'officer';
    return 'resource';
  }

  function groupPower(a) {
    const g = { self: 0, output: 0, wealth: 0, officer: 0, resource: 0 };
    topGods(a, 10).forEach(x => { g[godGroup(x.i)] += x.v; });
    return g;
  }

  function fmtPillar(p) {
    if (!p || p.gan == null) return '';
    return `${GAN[p.gan]}${JI[p.ji]} ${GAN_KO[p.gan]}${JI_KO[p.ji]}`;
  }

  function monthly2026(a, year) {
    const y = year || 2026;
    const yGan = S.mod(y - 4, 10);
    const names = ['인월', '묘월', '진월', '사월', '오월', '미월', '신월', '유월', '술월', '해월', '자월', '축월'];
    const startDays = ['2/4', '3/5', '4/5', '5/5', '6/6', '7/7', '8/7', '9/8', '10/8', '11/7', '12/7', '1/5'];
    const yong = a.yongsin.yong, hee = a.yongsin.hee, gi = a.yongsin.gi;
    const out = [];
    for (let k = 0; k < 12; k++) {
      const order = k + 1;
      const gan = ((yGan % 5) * 2 + 2 + (order - 1)) % 10;
      const ji = (order + 1) % 12;
      const tg = S.tenGod(a.dayGan, gan);
      // 원국 기준 길흉: 십성 성질(기본) + 용신/희신/기신 오행 가중
      let score = GOD_WEIGHT[tg];
      [S.GAN_ELEM[gan], S.JI_ELEM[ji]].forEach(e => {
        if (e === yong) score += 0.22;
        else if (e === hee) score += 0.1;
        else if (e === gi) score -= 0.2;
      });
      out.push({ order, name: names[k], start: startDays[k], gan, ji, tenGod: tg, score });
    }
    return out;
  }

  const GOD_WEIGHT = [0.55, 0.35, 0.75, 0.45, 0.8, 0.85, 0.4, 0.8, 0.6, 0.7];

  /* ---------- 무료 요약 ---------- */
  function buildFree(a) {
    const dm = DAY_MASTER[a.dayGan];
    const strong = a.strength.ratio >= 0.55;
    const weak = a.strength.ratio < 0.46;
    const gods = topGods(a, 10);
    const top = gods[0] ? TEN_GOD_TEXT[gods[0].i] : null;
    const gp = groupPower(a);
    const wealthStrong = gp.wealth >= 1.8;
    const officerStrong = gp.officer >= 1.6;
    const s2026 = a.saeun[0];
    const yong = a.yongsin.yong;
    const lack = a.ew.pct.indexOf(Math.min(...a.ew.pct));

    const lines = [];
    lines.push(`<p><strong>일간(타고난 나) — ${dm.title}</strong><br>${dm.body.split('.').slice(0, 2).join('.')}.</p>`);

    lines.push(`<p><strong>기운의 균형 — ${a.strength.level}</strong><br>` +
      `원국은 ${el(a.dayElem)} 일간을 중심으로 ${el(yong)}의 기운이 가장 필요한 구조입니다. ` +
      `다섯 가지 기운 가운데 ${el(lack)}이 ${pct(a.ew.pct[lack])}%로 가장 얇아, ` +
      `이 기운을 채우는 선택이 곧 개운(開運)입니다.</p>`);

    if (top) {
      lines.push(`<p><strong>가장 강하게 드러난 재주 — ${top.name}(${TEN_GODS_HANJA[gods[0].i]})</strong><br>${top.body}</p>`);
    }

    lines.push(`<p><strong>재물 — ${wealthStrong ? '돈의 그릇이 큰 편' : (gp.wealth > 0 ? '버는 힘보다 지키는 힘이 중요한 편' : '재성(財星)이 드러나지 않은 편')}</strong><br>` +
      (wealthStrong
        ? '재성(財星)이 원국에 자리 잡고 있어 돈이 들어오는 통로가 여럿입니다. 다만 재물은 늘 관리하는 사람에게 머뭅니다. 수입의 일정 비율을 자동으로 떼어 놓는 구조를 만들면 흐름이 오래갑니다.'
        : '재물은 한 번에 크게 오기보다 사람과 일을 통해 천천히 쌓이는 쪽입니다. 큰돈보다 반복되는 작은 수입을 여러 개 만드는 전략이 당신에게 맞습니다.') + `</p>`);

    lines.push(`<p><strong>인연 — ${officerStrong || gp.wealth > 1.2 ? '관계의 기복을 스스로 다스려야 하는 편' : '한 사람에게 깊게 기우는 편'}</strong><br>` +
      `일지(배우자궁)는 ${fmtPillar(a.pillars.find(p => p.pos === '일'))}입니다. ` +
      '가까운 사람에게는 표현을 아끼지 마십시오. 이 사주는 말보다 행동으로 마음을 보여주다가 오해를 사는 자리에서 한 번 크게 다칠 수 있습니다.</p>');

    lines.push(`<p><strong>건강 — ${el(a.ew.pct.indexOf(Math.max(...a.ew.pct))) } 과다, ${el(lack)} 부족</strong><br>` +
      `${ELEM_ORGAN[a.ew.pct.indexOf(Math.max(...a.ew.pct))]} 쪽은 과열되기 쉽고, ${ELEM_ORGAN[lack]} 쪽은 신호를 늦게 알아채기 쉽습니다. ` +
      ELEM_REMEDY[lack] + `</p>`);

    lines.push(`<p><strong>2026 병오년 — ${SAEUN_THEME[s2026.tenGod]} </strong><br>` +
      `${s2026.tenGodName}의 기운이 들어오는 해입니다. ` +
      (s2026.tenGod <= 1 ? '내 힘으로 밀어붙이기보다 판을 정리하고 사람을 고르는 데 쓰면 이득이 큽니다. 지출보다 사람 관리에 시간을 쓰십시오.'
        : s2026.tenGod <= 3 ? '만들고 표현하는 일이 성과로 이어집니다. 다만 말이 앞서면 계약에서 손해를 보니 문서로 확인하십시오.'
          : s2026.tenGod <= 5 ? '돈이 실제로 움직이는 해입니다. 들어오는 돈과 나가는 돈을 같은 달에 정리하면 남는 것이 확실히 달라집니다.'
            : s2026.tenGod <= 7 ? '책임이 늘고 압박이 따르지만, 그 자리가 다음 10년의 몫을 만들어 줍니다. 무리한 확장은 금물입니다.'
              : '배움과 재정비에 적합한 해입니다. 자격·공부·문서를 챙기면 내년의 발판이 됩니다.') + `</p>`);

    lines.push(`<p style="color:#f3dc9f"><strong>주의 — ${a.sals.some(s => s.name === '역마살') ? '움직임이 많은 해, 몸을 혹사하지 마십시오.' : '결정을 미루는 습관이 가장 큰 손실입니다.'}</strong><br>` +
      `${a.strength.ratio >= 0.66 ? '기운이 너무 강해 스스로를 몰아붙이는 경향이 있습니다. 잠을 줄여 일을 늘리는 방식은 이 사주에서 가장 빨리 몸을 상하게 하는 길입니다.'
        : a.strength.ratio < 0.37 ? '기운이 얇아 혼자 감당하려다 무너지기 쉽습니다. 도움을 청하는 것이 능력이라는 점을 기억하십시오.'
          : '균형이 잡혀 있어 큰 위험은 적지만, 사람 문제로 마음이 흔들리면 판단이 늦어집니다.'}</p>`);

    return lines.join('');
  }

  /* ---------- 프리미엄 리포트 ---------- */
  function buildPremium(a) {
    const dm = DAY_MASTER[a.dayGan];
    const gods = topGods(a, 10);
    const gp = groupPower(a);
    const yong = a.yongsin.yong, hee = a.yongsin.hee, gi = a.yongsin.gi;
    const pcts = a.ew.pct.map(pct);
    const maxE = pcts.indexOf(Math.max(...pcts));
    const minE = pcts.indexOf(Math.min(...pcts));
    const now = a.daewoon.list.find(d => new Date().getFullYear() >= d.startYear && new Date().getFullYear() <= d.startYear + 9) || a.daewoon.list[0];
    const next = a.daewoon.list.find(d => d.startYear > now.startYear) || now;
    const s26 = a.saeun[0], s27 = a.saeun[1];
    const months = monthly2026(a);

    const sec = [];
    const h = (n, t) => `<h3>${n}. ${t}</h3>`;

    /* 표지 — 브랜드 · 발행 정보 */
    const today = new Date();
    const stamp = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}`;
    sec.push(`<div class="report-head">
      <div class="report-brand">살풀이 <span>:</span> 천기</div>
      <div class="report-brand-sub">天機 · 命理 · TAROT</div>
      <h2 class="report-title">2026 정밀 사주 · 타로 리포트</h2>
      <p class="report-meta">${a.name ? a.name + ' 님' : '당신'} · ${stamp} 발행</p>
    </div>`);

    /* 1. 총평 */
    sec.push(h(1, '명(命)의 첫인상'));
    sec.push(`<p>${a.name || '당신'} 님의 사주는 <strong>${a.yearPillar.sajuYear}년 ${GAN[a.yearPillar.gan]}${JI[a.yearPillar.ji]}년(年) ${GAN[a.monthPillar.gan]}${JI[a.monthPillar.ji]}월(月) ${GAN[a.dayPillar.gan]}${JI[a.dayPillar.ji]}일(日)</strong>` +
      `${a.timeKnown ? ` ${GAN[a.hourPillar.gan]}${JI[a.hourPillar.ji]}시(時)` : ' (시주 미상)'}로 짜여 있습니다. ` +
      `일간은 ${dm.title}이며, 기운의 세기는 ${a.strength.level}(지지 세력 ${Math.round(a.strength.ratio * 100)}%)입니다.</p>`);
    sec.push(`<p>이 명식에서 가장 먼저 눈에 들어오는 것은 <strong>${el(maxE)}의 기운(${pcts[maxE]}%)</strong>과 <strong>${el(minE)}의 결핍(${pcts[minE]}%)</strong>입니다. ` +
      `원국에서 넘치는 기운은 당신이 타고난 재주이고, 비어 있는 기운은 평생 채워 넣어야 할 숙제입니다. ` +
      `그래서 ${el(yong)}을 용신(用神)으로 삼습니다. ${ELEM_TRAIT[yong]}이 당신의 운을 여는 열쇠입니다.</p>`);

    /* 2. 기질 */
    sec.push(h(2, '타고난 기질 — 일간 심층'));
    sec.push(`<p>${dm.body}</p>`);
    sec.push(`<p>키워드는 <strong>${dm.keyword}</strong>입니다. ` +
      (a.strength.ratio >= 0.55
        ? '기운이 강한 편이라 자기 판단을 쉽게 굽히지 않습니다. 이 힘은 큰일을 혼자 결정해야 하는 자리에서 무기가 되지만, 가까운 사람에게는 고집으로 읽힙니다. 결정을 말로 설명하는 습관 하나가 대인운을 크게 바꿉니다.'
        : a.strength.ratio < 0.46
          ? '기운이 얇은 편이라 주변의 영향을 많이 받습니다. 좋은 사람 곁에 있으면 놀랄 만큼 성장하지만, 소모적인 인간관계에서는 순식간에 지칩니다. 사람을 고르는 일이 곧 운을 고르는 일입니다.'
          : '기운이 균형을 이루고 있어 어느 한쪽으로 치우치지 않습니다. 대신 스스로 강한 추진력을 만들지 않으면 평균에 머무르기 쉬우니, 의도적으로 판을 키우는 선택이 필요합니다.' ) + '</p>');

    /* 3. 십성 지도 */
    sec.push(h(3, '십성(十星) 지도 — 재주와 인생의 문법'));
    sec.push(`<p>원국에서 드러난 기운을 십성으로 나누면 <strong>${gods.slice(0, 3).map(g => `${TEN_GOD_TEXT[g.i].name}(${TEN_GODS_HANJA[g.i]})`).join(' · ')}</strong> 순으로 강합니다.</p>`);
    gods.slice(0, 3).forEach(g => {
      sec.push(`<p><strong>${TEN_GOD_TEXT[g.i].name} — ${TEN_GOD_TEXT[g.i].short}</strong><br>${TEN_GOD_TEXT[g.i].body}</p>`);
    });
    const missing = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => !gods.some(g => g.i === i));
    if (missing.length) {
      sec.push(`<p>반대로 <strong>${missing.map(i => TEN_GOD_TEXT[i].name).join('·')}</strong>은(는) 원국에 뚜렷하게 드러나지 않습니다. ` +
        '이 영역은 타고난 재주라기보다 나중에 의식적으로 길러야 하는 부분입니다. 부족한 십성을 사람으로 채우는 것이 이 사주의 오래된 지혜입니다.</p>');
    }

    /* 4. 재물 */
    sec.push(h(4, '재물운 — 돈의 그릇과 흐름'));
    const wealthLine = gp.wealth >= 2.4 ? '재성이 두텁게 자리한 사주입니다. 돈이 사람을 따라오는 구조이니, 돈을 쫓기보다 사람과 일을 잘 관리하면 재물이 붙습니다.'
      : gp.wealth >= 1 ? '재성이 원국에 자리하고 있으나 두텁지는 않습니다. 한 번에 크게 벌기보다 통로를 여러 개 만드는 방식이 맞습니다.'
        : '재성이 뚜렷하지 않아 돈이 저절로 모이는 구조는 아닙니다. 대신 전문성과 명예를 쌓으면 그 뒤에 재물이 따라오는 사주입니다.';
    sec.push(`<p>${wealthLine}</p>`);
    sec.push(`<p>재물의 성격은 <strong>${gp.wealth >= 2.4 ? '편재(偏財)형 — 유통·영업·투자에서 감각이 살아나는 큰돈의 흐름' : gp.wealth >= 1 ? '정재(正財)형 — 반복되는 수입과 성실한 축적' : '관성(官星)형 — 직함과 전문성에서 나오는 안정적 소득'}</strong>으로 보는 것이 자연스럽습니다. ` +
      `2026 병오년에는 ${s26.tenGodName}의 기운이 들어와 ${s26.tenGod <= 3 ? '벌어들이는 활동이 늘고 지출도 함께 늘어납니다. 벌 때와 쓸 때를 분리하는 계좌 구조가 유효합니다.' : s26.tenGod <= 5 ? '실제로 돈이 움직이는 해입니다. 미뤄둔 수금·정산·계약을 이 해에 정리하면 남는 것이 달라집니다.' : '큰 지출보다 자리와 책임이 늘어나는 쪽으로 재물이 따라옵니다. 무리한 확장보다 안정적 계약을 택하십시오.'}</p>`);
    sec.push(`<p>재물의 방향은 <strong>${ELEM_DIRECTION[yong]}</strong>, 숫자는 <strong>${ELEM_NUM[yong]}</strong>, 색은 <strong>${ELEM_COLORNAME[yong][0]}</strong> 계열이 맞습니다. 통장·지갑·사무 공간에 이 기운을 두면 판단이 흐려지지 않습니다.</p>`);

    /* 5. 인연 */
    sec.push(h(5, '애정과 배우자 — 인연의 방향'));
    const dayJi = a.pillars.find(p => p.pos === '일').ji;
    sec.push(`<p>배우자궁인 일지(日支)는 <strong>${JI[dayJi]}(${JI_KO[dayJi]})</strong>입니다. ` +
      `${['子', '午', '卯', '酉'].includes(JI[dayJi]) ? '도화의 자리라 인연이 끊이지 않고, 상대가 먼저 다가오는 일이 많습니다. 다만 선택의 폭이 넓다는 것과 좋은 선택은 다른 문제입니다.'
        : ['寅', '申', '巳', '亥'].includes(JI[dayJi]) ? '역마의 자리라 멀리서 인연이 오거나, 이동·여행·타지에서 만남이 성립합니다. 한곳에 머무는 관계보다 함께 움직이는 관계가 오래갑니다.'
          : ['辰', '戌', '丑', '未'].includes(JI[dayJi]) ? '토의 자리라 인연이 늦게, 그러나 단단하게 옵니다. 서두르면 오히려 흔들리니 신뢰가 쌓이는 속도를 존중하십시오.'
            : '차분한 자리라 관계가 깊어지는 데 시간이 걸리지만 한 번 맺으면 오래갑니다.'}</p>`);
    sec.push(`<p>${a.gender === '여' ? '여성 사주에서 인연은 관성(官星)으로 봅니다. ' : '남성 사주에서 인연은 재성(財星)으로 봅니다. '}` +
      `${a.gender === '여' ? (gp.officer >= 1.6 ? '관성이 두터워 인연이 많고 이성의 관심도 꾸준합니다. 다만 상대를 고르는 기준이 흔들리면 좋은 인연을 놓칩니다.' : '관성이 얇아 스스로 다가가야 관계가 시작되는 편입니다. 기다리는 것보다 먼저 표현하는 쪽이 이 사주에 맞습니다.')
        : (gp.wealth >= 1.6 ? '재성이 두터워 인연이 자연스럽게 이어집니다. 다만 재물과 인연이 같은 통로에 있어, 돈 문제가 관계를 흔드는 지점을 조심해야 합니다.' : '재성이 얇아 관계에서 적극성이 필요합니다. 마음이 있어도 표현하지 않으면 상대는 알지 못합니다.')}</p>`);
    sec.push(`<p>인연의 시기는 대운과 세운이 배우자궁을 건드리는 해에 열립니다. 현재 대운은 <strong>${GAN[now.gan]}${JI[now.ji]} 대운(${now.startAge}~${now.endAge}세, ${now.startYear}~${now.startYear + 9}년)</strong>이고, ` +
      `2026년은 ${s26.tenGodName}, 2027년은 ${s27.tenGodName}의 기운이 들어옵니다. ` +
      `${[2, 3].includes(s26.tenGod) || [2, 3].includes(s27.tenGod) ? '표현과 만남이 늘어나는 해라 관계가 시작되기 좋은 흐름입니다.' : '관계를 서두르기보다 신뢰를 쌓는 해입니다. 소개나 모임에서 오래 볼 사람을 고르십시오.'}</p>`);

    /* 6. 일과 사업 */
    sec.push(h(6, '일과 사업 — 어떤 자리에서 힘이 나는가'));
    sec.push(`<p>${gp.officer >= 1.6 ? '관성(官星)이 강해 조직·직책·공식 절차 안에서 힘을 냅니다. 규모가 있는 조직에서 책임을 맡을수록 운이 따르고, 혼자 뛰기보다 시스템을 타고 오르는 쪽이 빠릅니다.' : gp.officer > 0 ? '관성이 적당히 있어 조직과 개인의 중간 지점에서 강합니다. 직장 경력을 유지하면서 개인 프로젝트를 병행하는 형태가 이상적입니다.' : '관성이 얇아 정해진 위계보다 자기 방식이 통하는 자리에서 강합니다. 프리랜서·1인 사업·전문직이 맞습니다.'}</p>`);
    sec.push(`<p>${gp.output >= 1.6 ? '식상(食傷)이 강해 만들어내는 힘이 큽니다. 기획·제작·교육·콘텐츠처럼 결과물이 남는 일에서 성과가 확실합니다.' : '식상이 두텁지 않아 새로 만드는 일보다 잘 돌아가게 만드는 일에 강합니다. 운영·관리·컨설팅 쪽이 안정적입니다.'}</p>`);
    sec.push(`<p>오행으로 보면 <strong>${el(yong)}의 분야</strong>가 당신의 재능이 가장 잘 발휘되는 영역입니다. ${['목 — 교육·출판·의류·식물·기획', '화 — 미디어·마케팅·요식·뷰티·전자', '토 — 부동산·건설·중개·농식품·중개서비스', '금 — 금융·기계·의료기기·법률·정밀제조', '수 — 무역·물류·여행·IT·데이터'][yong]} 쪽에서 같은 노력으로 더 큰 결과를 냅니다.</p>`);

    /* 7. 건강 */
    sec.push(h(7, '건강 — 기운이 새는 자리'));
    sec.push(`<p><strong>${el(maxE)} ${pcts[maxE]}% · ${el(minE)} ${pcts[minE]}%</strong>. ` +
      `${ELEM_ORGAN[maxE]}은 과열되기 쉽고, ${ELEM_ORGAN[minE]}은 약해져도 늦게 알아챕니다. ` +
      `이 사주에서 가장 흔한 패턴은 <strong>피로를 참다가 한 번에 크게 무너지는 것</strong>입니다.</p>`);
    sec.push(`<p>${ELEM_REMEDY[minE]}</p>`);
    sec.push(`<p>특히 ${['봄', '여름', '환절기', '가을', '겨울'][gi === 3 ? 3 : 4]}철과 ${a.daewoon.list[1].startAge}세 전후의 대운 교체기에 몸의 신호가 먼저 나타납니다. 정기 검진은 미루지 마십시오.</p>`);

    /* 8. 세운 */
    sec.push(h(8, '2026 병오년 세운 — 월별 흐름'));
    sec.push(`<p>2026년은 <strong>병오(丙午)</strong>년입니다. 천간 병화(丙火)는 당신에게 <strong>${s26.tenGodName}</strong>, 지지 오화(午火)도 같은 계열의 기운으로 들어옵니다. ` +
      `${SAEUN_THEME[s26.tenGod]}이라는 큰 주제가 한 해를 관통합니다.</p>`);
    if (s26.inter.length) {
      const tTypes = s26.inter.map(i => i.type).filter((v, i, arr) => arr.indexOf(v) === i);
      const josa = /(합|충)$/.test(tTypes[tTypes.length - 1]) ? '이' : '가';
      sec.push(`<p>원국과의 관계에서는 ${tTypes.join('·')}${josa} 잡힙니다. ` +
        '이 해에는 예정에 없던 변화가 생기기 쉬우니, 큰 결정은 한 번 더 확인하는 절차를 두십시오.</p>');
    }
    sec.push('<table class="m-table"><thead><tr><th>월</th><th>절입</th><th>월건</th><th>십성</th><th>흐름</th></tr></thead><tbody>');
    months.forEach(m => {
      const w = m.score;
      const label = w >= 0.82 ? '길(吉)' : w >= 0.62 ? '무난' : '주의';
      const note = m.tenGod <= 1 ? '내 힘을 쓰는 달, 경쟁과 분배' : m.tenGod <= 3 ? '만들고 표현하는 달, 성과와 구설' :
        m.tenGod <= 5 ? '돈이 움직이는 달, 수입과 지출' : m.tenGod <= 7 ? '책임과 압박의 달, 성장의 대가' : '배움과 재정비의 달, 문서와 인연';
      const mName = (m.order === 12) ? '축월' : m.name;
      const mStart = (m.order === 12) ? '1/5' : m.start;
      sec.push(`<tr><td>${mStart}</td><td>${mName}</td><td>${GAN[m.gan]}${JI[m.ji]}</td><td>${TEN_GODS[m.tenGod]}</td><td><span class="tag ${label === '길(吉)' ? 'good' : label === '주의' ? 'bad' : 'mid'}">${label}</span> ${note}</td></tr>`);
    });
    sec.push('</tbody></table>');
    sec.push(`<p>가장 힘이 실리는 달은 <strong>${months.slice().sort((x, y) => y.score - x.score).slice(0, 3).map(m => m.start + ' ' + m.name).join(', ')}</strong>이고, ` +
      `계약·서명을 피하는 편이 좋은 달은 <strong>${months.slice().sort((x, y) => x.score - y.score).slice(0, 2).map(m => m.start + ' ' + m.name).join(', ')}</strong>입니다. ` +
      '같은 일도 어느 달에 하느냐에 따라 결과가 달라지는 것이 세운의 법칙입니다.</p>');
    sec.push(`<p>2027년은 <strong>정미(丁未)</strong>년으로 ${s27.tenGodName}의 기운이 이어집니다. 2026년에 벌인 일의 결실이 2027년에 모양을 갖추므로, 올해는 씨를 뿌리는 해로 쓰는 것이 좋습니다.</p>`);

    /* 9. 대운 */
    sec.push(h(9, '대운(大運) — 10년의 흐름'));
    sec.push(`<p>${a.gender}성 · ${a.yearPillar.gan % 2 === 0 ? '양(陽)' : '음(陰)'}년생이라 대운은 <strong>${a.daewoon.forward ? '순행(順行)' : '역행(逆行)'}</strong>으로 흐릅니다. ` +
      `태어난 날에서 ${a.daewoon.forward ? '다음' : '직전'} 절입까지 ${a.daewoon.days}일이므로 대운수는 <strong>${a.daewoon.startAge}세</strong>입니다.</p>`);
    sec.push('<table class="m-table"><thead><tr><th>대운</th><th>나이</th><th>기간</th><th>십성</th><th>성격</th></tr></thead><tbody>');
    a.daewoon.list.forEach(d => {
      const tg = S.tenGod(a.dayGan, d.gan);
      const cur = d.index === now.index ? ' class="cur"' : '';
      sec.push(`<tr${cur}><td>${GAN[d.gan]}${JI[d.ji]}</td><td>${d.startAge}~${d.endAge}세</td><td>${d.startYear}~${d.startYear + 9}</td><td>${TEN_GODS[tg]}</td><td>${TEN_GOD_TEXT[tg].short}</td></tr>`);
    });
    sec.push('</tbody></table>');
    sec.push(`<p>지금은 <strong>${GAN[now.gan]}${JI[now.ji]} 대운</strong>의 ${TEN_GOD_TEXT[S.tenGod(a.dayGan, now.gan)].name} 구간입니다. ${TEN_GOD_TEXT[S.tenGod(a.dayGan, now.gan)].body} ` +
      `다음 대운 <strong>${GAN[next.gan]}${JI[next.ji]}(${next.startYear}년부터)</strong>으로 넘어가는 시점에 삶의 형태가 한 번 크게 바뀌는 것이 이 사주의 특징입니다.</p>`);

    /* 10. 개운 */
    sec.push(h(10, '개운법 — 용신으로 사는 법'));
    sec.push(`<p><strong>용신 ${el(yong)} · 희신 ${el(hee)} · 기신 ${el(gi)}</strong></p>`);
    sec.push(`<p>
      · 방위 — ${ELEM_DIRECTION[yong]} 방향의 자리, 창가, 책상 배치<br>
      · 색 — ${ELEM_COLORNAME[yong].join(', ')}<br>
      · 숫자 — ${ELEM_NUM[yong]}<br>
      · 생활 — ${ELEM_REMEDY[yong]}<br>
      · 사람 — ${el(yong)}이 강한 사람(또는 ${el(yong)} 일간)과 함께할 때 판단이 맑아집니다.<br>
      · 피할 것 — ${el(gi)}의 기운이 넘치는 환경(과한 ${ELEM_TRAIT[gi].split(',')[0]})은 판단을 흐립니다.</p>`);
    sec.push(`<p>개운은 특별한 의식이 아니라 <strong>매일 반복되는 선택을 용신 쪽으로 옮기는 일</strong>입니다. 아침에 어느 방향으로 앉는지, 어떤 색을 입는지, 누구와 시간을 쓰는지가 10년 뒤의 명(命)을 다시 씁니다.</p>`);

    return sec.join('');
  }

  global.SajuText = { buildFree, buildPremium, DAY_MASTER, TEN_GOD_TEXT, ELEM_REMEDY, monthly2026 };
})(window);
