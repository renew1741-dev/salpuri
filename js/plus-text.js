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
      <p class="small">두드러진 살(煞)이 없습니다. 살이 없다는 것은 큰 파도 없이 흐른다는 뜻이고, 그만큼 운이 사람과 습관에 그대로 반응합니다.</p></div>`}

    <div class="card">
      <p class="sn-note">살(煞)은 나쁜 것이 아니라 <b>크기가 큰 기운</b>입니다. 다스리면 재능이 되고, 놓으면 사고가 됩니다. 귀인은 그 기운을 눌러 주는 사람입니다 — 귀인은 찾는 것이 아니라 <b>보고하는 습관</b>으로 붙잡는 것입니다.</p>
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
        ${!x.goodHours.length && !x.badHours.length ? '<p class="small">오늘은 특별히 갈리는 시간대가 없습니다. 평소의 리듬대로 움직이십시오.</p>' : ''}
      </div>
      <div class="td-luck">
        <div class="td-luck-item"><span>행운의 색</span><b>${x.luck.color}</b><i class="td-swatch" style="background:var(--w-${['wood', 'fire', 'earth', 'metal', 'water'][x.luck.elem]})"></i><small>${x.luck.color2}</small></div>
        <div class="td-luck-item"><span>방향</span><b>${x.luck.dir}</b></div>
        <div class="td-luck-item"><span>숫자</span><b>${x.luck.num.replace('·', ', ')}</b></div>
      </div>
      <p class="td-note">용신 ${el(x.luck.elem)}의 기운을 오늘 하루 가까이 두십시오. 개운은 큰 의식이 아니라 오늘 어느 쪽으로 앉고 무엇을 입는지에서 시작됩니다.</p>
      ${shareRow('today', '오늘의 운세 보내기')}
    </div>`;
  }

  /* ================= ③ 신년 · 12개월 ================= */
  function renderYear(x, a, year) {
    const max = 100, min = 30;
    const h = s => Math.max(12, Math.round((s - min) / (max - min) * 100));
    const bars = x.months.map(m => `<div class="yr-bar ${x.best.some(b => b.order === m.order) ? 'best' : x.worst.some(b => b.order === m.order) ? 'worst' : ''}">
      <span class="yr-b-val">${m.score}</span>
      <i style="height:${h(m.score)}%"></i>
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
      ${x.jr.length ? `<p class="yr-jr">원국과 <b>${[...new Set(x.jr.map(r => r.name))].join('·')}</b>이 잡혀, 예정에 없던 변화가 생기기 쉬운 해입니다.</p>` : ''}
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">12개월의 흐름</h2><span class="en">12 MONTHS</span></div>
      <div class="yr-chart">${bars}</div>
      <div class="yr-legend"><span><i class="best"></i>잡을 달</span><span><i class="worst"></i>피할 달</span></div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">잡아야 할 달 · 피할 달</h2><span class="en">PICK & AVOID</span></div>
      <div class="yr-picks">
        ${x.best.map(m => `<div class="yr-pick good"><span>${m.start} ${m.name} <b>${GAN[m.gan]}${JI[m.ji]}</b></span><p>${m.act}</p></div>`).join('')}
        ${x.worst.map(m => `<div class="yr-pick bad"><span>${m.start} ${m.name} <b>${GAN[m.gan]}${JI[m.ji]}</b></span><p>${m.act}</p></div>`).join('')}
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
      <p class="td-note">세운은 같은 일도 어느 달에 하느냐로 결과가 갈립니다. 잡을 달에는 결정을, 피할 달에는 정리를 두십시오.</p>
      ${shareRow('year', '신년운세 보내기')}
    </div>`;
  }

  /* ================= ④ 재물 · 사업 · 적성 ================= */
  function renderWealth(x, a) {
    return `<div class="card">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 재물 · 적성</div>
        <h2 class="serif">${who(a)}의 돈의 그릇</h2>
        <p>재성 ${Math.round((x.powers.cnt[4] + x.powers.cnt[5]) * 10) / 10} · 관성 ${Math.round((x.powers.cnt[6] + x.powers.cnt[7]) * 10) / 10} · 식상 ${Math.round((x.powers.cnt[2] + x.powers.cnt[3]) * 10) / 10} · 인성 ${Math.round((x.powers.cnt[8] + x.powers.cnt[9]) * 10) / 10}</p>
      </div>
      <div class="wl-ratio">
        <div class="wl-bar"><i style="width:${x.biz}%"></i></div>
        <div class="wl-ratio-legend"><span><b>${x.biz}%</b> 사업 · 프리랜서</span><span><b>${x.job}%</b> 직장 · 조직</span></div>
      </div>
      <p class="wl-verdict serif">${x.verdict}</p>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">돈이 모이는 구조</h2><span class="en">MONEY PATH</span></div>
      <p><b>${x.pyeon > x.jeong ? '편재' : x.jeong > x.pyeon ? '정재' : '정재·편재'}</b> — ${x.structure}</p>
      <div class="hr-gold"></div>
      <p>${x.mainPath}</p>
      <div class="wl-scores">
        <div><span>비겁</span><i style="width:${Math.min(100, x.powers.self * 25)}%"></i><em>${Math.round(x.powers.self * 10) / 10}</em></div>
        <div><span>식상</span><i style="width:${Math.min(100, x.powers.output * 25)}%"></i><em>${Math.round(x.powers.output * 10) / 10}</em></div>
        <div><span>재성</span><i style="width:${Math.min(100, x.powers.money * 25)}%"></i><em>${Math.round(x.powers.money * 10) / 10}</em></div>
        <div><span>관성</span><i style="width:${Math.min(100, x.powers.officer * 25)}%"></i><em>${Math.round(x.powers.officer * 10) / 10}</em></div>
        <div><span>인성</span><i style="width:${Math.min(100, x.powers.resource * 25)}%"></i><em>${Math.round(x.powers.resource * 10) / 10}</em></div>
      </div>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">투자 · 동업 주의점</h2><span class="en">RISK</span></div>
      <ul class="wl-caution">${x.caution.map(c => `<li>${c}</li>`).join('')}</ul>
      <div class="hr-gold"></div>
      <p class="small">지금은 <b>${x.nowDw.startAge}세부터 ${x.nowDw.tgName}</b> 대운입니다. 같은 재능도 대운의 십성에 따라 값이 두 배가 되거나 반으로 줄어듭니다. ${x.nowNote}</p>
    </div>

    <div class="card">
      <div class="section-head"><h2 class="serif">재물이 트이는 대운</h2><span class="en">10 YEARS</span></div>
      ${x.timing.length ? `<div class="wl-timing">${x.timing.map(d => `<div class="wl-t">
        <div class="wl-t-g serif">${GAN[d.gan]}${JI[d.ji]}</div>
        <div><b>${d.startAge}세 ~ ${d.endAge}세</b><span>${d.startYear}~${d.startYear + 9} · ${d.tgName} 대운</span></div>
        <em>${d.good === 2 ? '재성' : '식상'}</em>
      </div>`).join('')}</div>
      <p class="small">이 대운에 판을 키우고, 그 앞뒤 대운에 정리하십시오. 재물은 버는 시기와 지키는 시기가 따로 옵니다.</p>`
        : '<p class="small">재성·식상 대운이 두드러지지 않습니다. 이 사주는 대운보다 습관과 전문성에서 돈이 붙습니다. 매달 같은 날 같은 금액을 떼어 두는 규칙이 대운보다 강합니다.</p>'}
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
      ${x.top[0] && x.top[0].score < 60 ? `<p class="small">이 기간에는 크게 길한 날이 없습니다. 그래도 고르라면 아래 날이 가장 낲습니다.</p>` : ''}
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
        ${x.avoid.map(d => `<div class="tk-av"><b>${d.m}/${d.d} (${d.wd})</b><span>${d.ganji}일 · ${d.score}점</span><p>${d.reasons[0] || '기운이 어긋나는 날입니다.'}</p></div>`).join('')}
      </div>
      <p class="small">이 날은 계약·서명·큰 지출을 미루십시오. 같은 일도 하루 차이로 결과가 갈립니다.</p>
    </div>` : ''}

    <div class="card">
      <p class="td-note">택일은 좋은 날을 고르는 일이지, 나쁜 날을 피해 도망가는 일이 아닙니다. 급한 일이라면 좋은 <b>시간</b>을 고르십시오 — 같은 날도 시진에 따라 기운이 달라집니다.</p>
      ${shareRow('taekil', '좋은 날 보내기')}
    </div>`;
  }

  global.PlusText = { renderSinsal, renderToday, renderYear, renderWealth, renderTaekil };
})(window);
