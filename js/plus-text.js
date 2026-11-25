/* ============================================================
   살풀이 : 천기 — 확장 메뉴 화면 생성
   ① 신살·귀인 ② 오늘의 운세 ③ 신년·12개월 ④ 재물·적성 ⑤ 택일
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const P = global.Plus;
  const GAN = S.GAN, JI = S.JI, GAN_KO = S.GAN_KO, JI_KO = S.JI_KO;
  const ELEM_KO = S.ELEM_KO, ELEM_HANJA = S.ELEM_HANJA;
  const el = e => `${ELEM_KO[e]}(${ELEM_HANJA[e]})`;

  function who(a) { return a.name ? `${a.name} 님` : '당신'; }
  function shareRow(tag, label) {
    return `<div class="pl-share-row">
      <button class="share-btn" data-share="${tag}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M12 3 8.5 6.5M12 3l3.5 3.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${label || '친구에게 보내기'}
      </button>
    </div>`;
  }
  const POS_NAME = { 년: '년주', 월: '월주', 일: '일주', 시: '시주' };

  /* ================= ① 신살 · 귀인 ================= */
  function renderSinsal(x, a) {
    const nobles = x.items.filter(i => i.kind === 'noble');
    const sals = x.items.filter(i => i.kind === 'sal');
    const item = (i) => `<div class="sn-item ${i.kind}">
      <div class="sn-head">
        <b class="serif">${i.name}</b><em>${i.hanja}</em>
        <span class="sn-tag">${i.tag}</span>
        <span class="sn-pos">${i.hits.map(h => POS_NAME[h.pos]).join(' · ')}</span>
      </div>
      <p class="sn-mean">${i.mean}</p>
      <p class="sn-use"><b>쓰는 법</b> ${i.use}</p>
    </div>`;
    return `<div class="card">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 신살 · 귀인</div>
        <h2 class="serif">${who(a)}의 살(煞)과 귀인</h2>
        <p>${a.pillars.filter(p => p.gan != null).map(p => `${GAN[p.gan]}${JI[p.ji]}`).join(' · ')} · ${a.timeKnown ? a.sijinName : '시간 모름'} 기준</p>
      </div>
      <p class="pl-summary serif">${x.summary}</p>
      <div class="sn-counts">
        <span><b>${x.noble}</b>귀인</span><span><b>${x.sal}</b>살(煞)</span>
      </div>
    </div>

    ${nobles.length ? `<div class="card">
      <div class="section-head"><h2 class="serif">귀인 — 사람과 문서</h2><span class="en">NOBLE</span></div>
      ${nobles.map(item).join('')}
    </div>` : ''}

    ${sals.length ? `<div class="card">
      <div class="section-head"><h2 class="serif">살(煞) — 재능과 그림자</h2><span class="en">CHARM</span></div>
      ${sals.map(item).join('')}
    </div>` : `<div class="card"><div class="section-head"><h2 class="serif">살(煞)</h2><span class="en">CHARM</span></div>
      <p class="small">두드러진 살(煞)이 없어요. 살이 없다는 건 큰 파도 없이 흐른다는 뜻이고, 그만큼 운이 사람과 습관에 그대로 반응해요.</p></div>`}

    <div class="card">
      <p class="sn-note">살(煞)은 나쁜 게 아니라 <b>크기가 큰 기운</b>이에요. 다스리면 재능이 되고, 놓으면 사고가 돼요. 귀인은 그 기운을 눌러 주는 사람이에요 — 귀인은 찾는 게 아니라 <b>보고하는 습관</b>으로 붙잡는 거예요.</p>
      ${shareRow('sinsal', '내 귀인 알려주기')}
    </div>`;
  }

  /* ================= ② 오늘의 운세 ================= */
  function renderToday(x, a) {
    const circ = 2 * Math.PI * 52;
    const dash = (circ * x.score / 100).toFixed(1);
    return `<div class="card td-hero">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 오늘의 일진</div>
        <h2 class="serif">${who(a)}의 오늘</h2>
        <p>${x.date.label} · 일진 <b>${x.ganji.label}</b> · ${x.tenName}의 날</p>
      </div>
      <div class="gg-score-wrap">
        <svg class="gg-ring" viewBox="0 0 120 120" aria-label="오늘의 운세 ${x.score}점">
          <defs><linearGradient id="tdGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f6e3ad"/><stop offset="55%" stop-color="#d9b978"/><stop offset="100%" stop-color="#e2a35e"/>
          </linearGradient></defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(217,185,120,.14)" stroke-width="6"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#tdGrad)" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${dash} ${circ.toFixed(1)}" transform="rotate(-90 60 60)"/>
        </svg>
        <div class="gg-score-txt"><b class="serif">${x.score}</b><span>점</span><em>${x.grade}</em></div>
      </div>
      <ul class="td-reasons">${[...new Set(x.reasons)].slice(0, 4).map(r => `<li>${r}</li>`).join('')}</ul>
      <p class="pl-summary serif">${x.summary}</p>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">세 가지 자리</h2><span class="en">TODAY'S THREE</span></div>
      <div class="td-lines">
        <div class="td-line"><span class="td-k">재물</span><p>${x.lines.wealth}</p></div>
        <div class="td-line"><span class="td-k">대인</span><p>${x.lines.social}</p></div>
        <div class="td-line"><span class="td-k">건강</span><p>${x.lines.health}</p></div>
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">시간과 방향</h2><span class="en">TIMING</span></div>
      <div class="td-hours">
        ${x.goodHours.length ? `<div class="td-hour good"><span>잡을 시간</span>${x.goodHours.map(h => `<b>${h.name} ${h.range}</b>`).join('')}</div>` : ''}
        ${x.badHours.length ? `<div class="td-hour bad"><span>피할 시간</span>${x.badHours.map(h => `<b>${h.name} ${h.range}</b>`).join('')}</div>` : ''}
        ${!x.goodHours.length && !x.badHours.length ? '<p class="small">오늘은 특별히 갈리는 시간대가 없어요. 평소 리듬대로 움직이세요.</p>' : ''}
      </div>
      <div class="td-luck">
        <div class="td-luck-item"><span>행운의 색</span><b>${x.luck.color}</b><i class="td-swatch" style="background:var(--w-${['wood', 'fire', 'earth', 'metal', 'water'][x.luck.elem]})"></i><small>${x.luck.color2}</small></div>
        <div class="td-luck-item"><span>방향</span><b>${x.luck.dir}</b></div>
        <div class="td-luck-item"><span>숫자</span><b>${x.luck.num.replace('·', ', ')}</b></div>
      </div>
      <p class="td-note">나를 살리는 행운 기운 ${el(x.luck.elem)}을 오늘 하루 가까이 두세요. 개운은 큰 의식이 아니라 오늘 어느 쪽으로 앉고 무엇을 입는지에서 시작돼요.</p>
      ${shareRow('today', '오늘의 운세 보내기')}
    </div>`;
  }

  /* ================= ③ 신년 · 12개월 ================= */
  const BADGE_LEGEND = '🎯 대박 좋은 달 · 🌱 좋은 달 · 🌿 무난한 달 · ⚠️ 지갑·입 조심할 달 · 🚨 조심할 달';

  function calCell(m, showYear) {
    const b = m.badge || { cls: 'calm', icon: '🌿', label: '무난한 달' };
    return `<div class="yr-cell y${m.yearTag || ''}">
      ${showYear ? `<span class="yr-year">${m.yearTag}</span>` : ''}
      <span class="yr-badge ${b.cls}">${b.icon} ${b.label}</span>
      <b class="yr-sc">${m.score}</b>
      <p class="yr-keep"><b>챙기기</b> ${m.keep || m.act}</p>
      <p class="yr-avoid"><b>피하기</b> ${m.avoid || '무리한 확장'}</p>
      <p class="yr-mood">${m.vibe || ''}</p>
    </div>`;
  }

  function calendarCard(x, other) {
    const both = !!other;
    const pairs = x.months.map((m, i) => {
      const o = both ? other.months[i] : null;
      const main = Object.assign({}, m, { yearTag: x.year });
      const alt = o ? Object.assign({}, o, { yearTag: other.year }) : null;
      const best = !alt ? m.badge.cls : ([m, o].sort((p, q) => q.score - p.score)[0].badge.cls);
      return `<div class="yr-row ${best}">
        <div class="yr-row-h"><b>${m.start}</b><span>${m.name}</span><em>~${m.endStart}</em></div>
        ${calCell(main, both)}
        ${alt ? calCell(alt, both) : ''}
      </div>`;
    }).join('');

    const bestOf = xx => xx.months.slice().sort((p, q) => q.score - p.score)[0];
    const worstOf = xx => xx.months.slice().sort((p, q) => p.score - q.score)[0];

    return `<div class="card yr-cal-card" id="yrCalCard">
      <div class="section-head"><h2 class="serif">${both ? `${x.year}·${other.year} 달력` : `${x.year}년 달력`}</h2><span class="en">CALENDAR</span></div>
      <p class="yr-cal-lead">${BADGE_LEGEND}</p>
      ${both ? `<div class="yr-viewseg" id="yrViewSeg">
        <button type="button" class="active" data-yrview="both">두 해 함께</button>
        <button type="button" data-yrview="${x.year}">${x.year}만</button>
        <button type="button" data-yrview="${other.year}">${other.year}만</button>
      </div>` : ''}
      <div class="yr-cal" id="yrCal" data-view="both">
        ${pairs}
      </div>
      ${both ? `<div class="yr-cal-sum">
        <div><span>${x.year} 최고의 달</span><b>${bestOf(x).start} ${bestOf(x).name}</b><em>${bestOf(x).score}점 · ${bestOf(x).badge.label}</em></div>
        <div><span>${x.year} 조심할 달</span><b>${worstOf(x).start} ${worstOf(x).name}</b><em>${worstOf(x).score}점 · ${worstOf(x).badge.label}</em></div>
        <div><span>${other.year} 최고의 달</span><b>${bestOf(other).start} ${bestOf(other).name}</b><em>${bestOf(other).score}점 · ${bestOf(other).badge.label}</em></div>
        <div><span>${other.year} 조심할 달</span><b>${worstOf(other).start} ${worstOf(other).name}</b><em>${worstOf(other).score}점 · ${worstOf(other).badge.label}</em></div>
      </div>` : ''}
      <p class="td-note">달의 경계는 1일이 아니라 절입(節入) 시각이에요. 그래서 1월 초생은 전 해의 마지막 달(축월)로 봅니다. 배지 하나만 기억해도 그 달에 뭘 할지 정해져요.</p>
      ${shareRow('year', '이 달력 보내기')}
    </div>`;
  }

  function renderYear(x, a, year, other) {
    const bars = x.months.map(m => `<div class="yr-bar ${m.badge.cls}">
      <span class="yr-b-val">${m.score}</span>
      <i style="height:${Math.max(12, m.score)}%"></i>
      <span class="yr-b-m">${m.start}<br>${m.name.replace('월', '')}</span>
    </div>`).join('');
    return `<div class="card">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · ${year}년 신년운세</div>
        <h2 class="serif">${who(a)}의 ${year} ${x.ganji}년</h2>
        <p>${x.tenName}의 기운 · 절기 기준 12개월</p>
      </div>
      <p class="yr-theme serif">${x.theme}</p>
      <p class="yr-body">${x.body}</p>
      ${x.jr.length ? `<p class="yr-jr">원국과 <b>${[...new Set(x.jr.map(r => r.name))].join('·')}</b>이 잡혀서, 예정에 없던 변화가 생기기 쉬운 해예요. 큰 결정은 한 번 더 확인하세요.</p>` : ''}
      <div class="yr-cal-sum mini">
        <div><span>올해 최고의 달</span><b>${x.best[0].start} ${x.best[0].name}</b><em>${x.best[0].badge.label}</em></div>
        <div><span>올해 조심할 달</span><b>${x.worst[0].start} ${x.worst[0].name}</b><em>${x.worst[0].badge.label}</em></div>
      </div>
    </div>

    ${calendarCard(x, other)}

    <div class="card">
      <div class="section-head"><h2 class="serif">12개월 기운 그래프</h2><span class="en">12 MONTHS</span></div>
      <div class="yr-chart">${bars}</div>
      <div class="yr-legend"><span><i class="jackpot"></i>대박</span><span><i class="good"></i>좋음</span><span><i class="calm"></i>무난</span><span><i class="warn"></i>조심</span><span><i class="bad"></i>위험</span></div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">잡아야 할 달 · 피할 달</h2><span class="en">PICK & AVOID</span></div>
      <div class="yr-picks">
        ${x.best.map(m => `<div class="yr-pick ${m.badge.cls}"><span>${m.start} ${m.name} <b>${GAN[m.gan]}${JI[m.ji]}</b><em class="yr-badge ${m.badge.cls}">${m.badge.icon} ${m.badge.label}</em></span><p><b>이 달엔</b> ${m.keep}</p></div>`).join('')}
        ${x.worst.map(m => `<div class="yr-pick ${m.badge.cls}"><span>${m.start} ${m.name} <b>${GAN[m.gan]}${JI[m.ji]}</b><em class="yr-badge ${m.badge.cls}">${m.badge.icon} ${m.badge.label}</em></span><p><b>이것만 피하세요</b> ${m.avoid}</p></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">분기별 조언</h2><span class="en">QUARTERS</span></div>
      <div class="yr-quarters">
        ${x.quarters.map(q => `<div class="yr-q">
          <div class="yr-q-head"><span>${q.q}분기</span><b class="serif">${q.theme}</b><em>${q.avg}점 · ${q.label}</em></div>
          <p>${q.act}</p>
        </div>`).join('')}
      </div>
      <p class="td-note">세운은 같은 일도 어느 달에 하느냐로 결과가 갈려요. 배지가 🎯·🌱인 달에는 결정을, ⚠️·🚨인 달에는 정리를 두세요.</p>
    </div>`;
  }

  /* ================= ④ 재물 · 사업 · 적성 ================= */
  function renderWealth(x, a) {
    return `<div class="card">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 재물 · 적성</div>
        <h2 class="serif">${who(a)}의 돈의 그릇</h2>
        <p>돈 ${Math.round((x.powers.cnt[4] + x.powers.cnt[5]) * 10) / 10} · 직장 ${Math.round((x.powers.cnt[6] + x.powers.cnt[7]) * 10) / 10} · 표현 ${Math.round((x.powers.cnt[2] + x.powers.cnt[3]) * 10) / 10} · 공부 ${Math.round((x.powers.cnt[8] + x.powers.cnt[9]) * 10) / 10} <span style="opacity:.7">(돈·결과물 / 직장·명예 / 표현·재능 / 공부·도움)</span></p>
      </div>
      <div class="wl-ratio">
        <div class="wl-bar"><i style="width:${x.biz}%"></i></div>
        <div class="wl-ratio-legend"><span><b>${x.biz}%</b> 사업 · 프리랜서</span><span><b>${x.job}%</b> 직장 · 조직</span></div>
      </div>
      <p class="wl-verdict serif">${x.verdict}</p>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">돈이 모이는 구조</h2><span class="en">MONEY PATH</span></div>
      <p><b>${x.pyeon > x.jeong ? '돌아다니는 큰돈(편재)' : x.jeong > x.pyeon ? '차곡차곡 모으는 돈(정재)' : '모으는 돈 + 큰돈(정재·편재)'}</b> — ${x.structure}</p>
      <div class="hr-gold"></div>
      <p>${x.mainPath}</p>
      <div class="wl-scores">
        <div><span>내 편<br><em style="font-style:normal;opacity:.6">비겁</em></span><i style="width:${Math.min(100, x.powers.self * 25)}%"></i><em>${Math.round(x.powers.self * 10) / 10}</em></div>
        <div><span>표현<br><em style="font-style:normal;opacity:.6">식상</em></span><i style="width:${Math.min(100, x.powers.output * 25)}%"></i><em>${Math.round(x.powers.output * 10) / 10}</em></div>
        <div><span>돈<br><em style="font-style:normal;opacity:.6">재성</em></span><i style="width:${Math.min(100, x.powers.money * 25)}%"></i><em>${Math.round(x.powers.money * 10) / 10}</em></div>
        <div><span>직장<br><em style="font-style:normal;opacity:.6">관성</em></span><i style="width:${Math.min(100, x.powers.officer * 25)}%"></i><em>${Math.round(x.powers.officer * 10) / 10}</em></div>
        <div><span>공부<br><em style="font-style:normal;opacity:.6">인성</em></span><i style="width:${Math.min(100, x.powers.resource * 25)}%"></i><em>${Math.round(x.powers.resource * 10) / 10}</em></div>
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">투자 · 동업 주의점</h2><span class="en">RISK</span></div>
      <ul class="wl-caution">${x.caution.map(c => `<li>${c}</li>`).join('')}</ul>
      <div class="hr-gold"></div>
      <p class="small">지금은 <b>${x.nowDw.startAge}세부터 ${x.nowDw.tgName}</b> 대운이에요. 같은 재능도 대운의 십성에 따라 값이 두 배가 되거나 반으로 줄어요. ${x.nowNote}</p>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">재물이 트이는 대운</h2><span class="en">10 YEARS</span></div>
      ${x.timing.length ? `<div class="wl-timing">${x.timing.map(d => `<div class="wl-t">
        <div class="wl-t-g serif">${GAN[d.gan]}${JI[d.ji]}</div>
        <div><b>${d.startAge}세 ~ ${d.endAge}세</b><span>${d.startYear}~${d.startYear + 9} · ${d.tgName} 대운</span></div>
        <em>${d.good === 2 ? '재성' : '식상'}</em>
      </div>`).join('')}</div>
      <p class="small">이 대운에 판을 키우고, 앞뒤 대운에 정리하세요. 재물은 버는 시기와 지키는 시기가 따로 와요.</p>`
        : '<p class="small">재성·식상 대운이 두드러지지 않아요. 이 사주는 대운보다 습관과 전문성에서 돈이 붙어요. 매달 같은 날 같은 금액을 떼어 두는 규칙이 대운보다 강해요.</p>'}
      ${shareRow('wealth', '내 돈의 그릇 보내기')}
    </div>`;
  }

  /* ================= ⑤ 택일 ================= */
  function renderTaekil(x, a) {
    return `<div class="card">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 택일</div>
        <h2 class="serif">${who(a)}의 ${x.purpose.name} 길일</h2>
        <p>${x.range.label} · 일진과 원국을 대조한 결과</p>
      </div>
      <p class="tk-tip">${x.purpose.tip}</p>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">가장 좋은 날 — Top ${x.top.length}</h2><span class="en">BEST DAYS</span></div>
      ${x.top[0] && x.top[0].score < 60 ? `<p class="small">이 기간에는 크게 길한 날이 없어요. 그래도 고르라면 아래 날이 제일 나아요.</p>` : ''}
      <div class="tk-list">
        ${x.top.map((d, i) => `<div class="tk-day ${d.grade === '대길' ? 'top' : ''}">
          <div class="tk-date">
            <b class="serif">${d.m}/${d.d}</b>
            <span>${d.wd}요일 · ${d.ganji}일</span>
          </div>
          <div class="tk-body">
            <div class="tk-head"><em>${i + 1}순위</em><span class="tk-grade ${d.grade === '대길' ? 'great' : ''}">${d.grade} · ${d.score}점</span><span class="tk-ten">${d.tenName}</span></div>
            <ul>${d.reasons.slice(0, 4).map(r => `<li>${r}</li>`).join('')}</ul>
          </div>
        </div>`).join('')}
      </div>
    </div>

    ${x.avoid.length ? `<div class="card">
      <div class="section-head"><h2 class="serif">피할 날</h2><span class="en">AVOID</span></div>
      <div class="tk-avoid">
        ${x.avoid.map(d => `<div class="tk-av"><b>${d.m}/${d.d} (${d.wd})</b><span>${d.ganji}일 · ${d.score}점</span><p>${d.reasons[0] || '기운이 어긋나는 날이에요.'}</p></div>`).join('')}
      </div>
      <p class="small">이 날은 계약·서명·큰 지출을 미루세요. 같은 일도 하루 차이로 결과가 갈려요.</p>
    </div>` : ''}

    <div class="card">
      <p class="td-note">택일은 좋은 날을 고르는 일이지, 나쁜 날을 피해 도망가는 일은 아니에요. 급한 일이라면 좋은 <b>시간</b>을 고르세요 — 같은 날도 시진에 따라 기운이 달라져요.</p>
      ${shareRow('taekil', '좋은 날 보내기')}
    </div>`;
  }

  global.PlusText = { renderSinsal, renderToday, renderYear, renderWealth, renderTaekil };
})(window);
