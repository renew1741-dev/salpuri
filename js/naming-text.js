/* ============================================================
   살풀이 : 천기 — 개명 · 아기 작명 화면 생성
   ① 이름 진단서(무료) ② 오행 대조 ③ 후보 5선(유료 해금) ④ 공유
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const EK = S.ELEM_KO, EH = S.ELEM_HANJA, EC = S.ELEM_COLOR;
  const GAN = S.GAN, JI = S.JI, GAN_KO = S.GAN_KO;
  const el = e => `${EK[e]}(${EH[e]})`;
  const pctTxt = v => (v * 100 < 1 ? '1% 미만' : Math.round(v * 100) + '%');
  const won = n => Number(n).toLocaleString('ko-KR');
  const who = a => (a.name ? `${a.name} 님` : '당신');

  function pillarsLine(a) {
    return a.pillars.filter(p => p.gan != null)
      .map(p => `${GAN[p.gan]}${JI[p.ji]}`).join(' ');
  }

  function shareRow(label) {
    return `<div class="pl-share-row">
      <button class="share-btn" data-share="naming">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M12 3 8.5 6.5M12 3l3.5 3.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${label || '이름 진단서 공유하기'}
      </button>
    </div>`;
  }

  /* ============================================================
     점수 링
     ============================================================ */
  function ring(score, label) {
    const circ = 2 * Math.PI * 52;
    const dash = (circ * score / 100).toFixed(1);
    return `<div class="gg-score-wrap">
      <svg class="gg-ring" viewBox="0 0 120 120" aria-label="이름 궁합 ${score}점">
        <defs><linearGradient id="nmGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f6e3ad"/><stop offset="55%" stop-color="#d9b978"/><stop offset="100%" stop-color="#e2a35e"/>
        </linearGradient></defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(217,185,120,.14)" stroke-width="6"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="url(#nmGrad)" stroke-width="6" stroke-linecap="round"
          stroke-dasharray="${dash} ${circ.toFixed(1)}" transform="rotate(-90 60 60)"/>
      </svg>
      <div class="gg-score-txt"><b class="serif">${score}</b><span>점</span><em>${label}</em></div>
    </div>`;
  }

  /* ============================================================
     ① 이름 진단서
     ============================================================ */
  function heroCard(model, a) {
    const cur = model.current;
    if (!cur) return '';
    return `<div class="card nm-hero">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 이름 감정</div>
        <h2 class="serif">‘${cur.full}’ 이름 진단서</h2>
        <p>${a.solar.y}.${String(a.solar.m).padStart(2, '0')}.${String(a.solar.d).padStart(2, '0')} · ${a.gender} · ${pillarsLine(a)} · 일간 ${GAN_KO[a.dayGan]}(${EH[a.dayElem]})</p>
      </div>
      ${ring(cur.score.total, cur.band.t)}
      <p class="nm-verdict serif">발음오행 ${cur.score.sound}/30 · 사주 보완 ${cur.score.saju}/45 · 수리 ${cur.score.suri}/25</p>
      <div class="nm-need">${model.needLine}</div>
      <p class="small center mt10">이름 궁합은 사주가 필요로 하는 오행을 이름이 얼마나 채우는지(45) · 성과 이름의 발음오행 흐름(30) · 한글 획수의 사격(25)으로 계산합니다.</p>
    </div>`;
  }

  /* ============================================================
     ② 사주 ↔ 이름 오행 대조
     ============================================================ */
  function compareCard(model) {
    const rows = model.rows.map(r => {
      const pc = Math.round(r.pct * 100);
      const cnt = r.nameCount;
      const dots = r.nameLen
        ? Array.from({ length: r.nameLen }, (_, i) => `<i class="${i < cnt ? 'on' : ''}"></i>`).join('')
        : Array.from({ length: 3 }, () => '<i></i>').join('');
      return `<div class="nm-row">
        <span class="nm-elem" style="color:${EC[r.e]}">${EK[r.e]}<small>${EH[r.e]}</small></span>
        <span class="nm-mark ${r.mark === '용신' ? 'yong' : r.mark === '희신' ? 'hee' : r.mark === '기신' ? 'gi' : ''}">${r.mark || ''}</span>
        <div class="nm-bar"><i style="width:${Math.max(2, pc)}%;background:${EC[r.e]}"></i></div>
        <span class="nm-pct">${pc}%</span>
        <span class="nm-dots">${dots}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="section-head"><h2 class="serif">사주와 이름, 오행을 겹쳐 보다</h2><span class="en">ELEMENT</span></div>
      <div class="nm-rows-head"><span>오행</span><span></span><span>사주의 세기</span><span></span><span>이름</span></div>
      ${rows}
      <div class="nm-legend">
        <span><b class="yong">용신</b> 이름으로 채워야 할 기운</span>
        <span><b class="hee">희신</b> 용신을 받쳐 주는 기운</span>
        <span><b class="gi">기신</b> 이름에서 피해야 할 기운</span>
      </div>
      <p class="small">이름 쪽 점(●)은 이름 글자의 초성 발음오행입니다. 성씨는 타고나는 몫이라 보완 계산에서 제외하고, 이름 두 글자만 봅니다.</p>
    </div>`;
  }

  /* ============================================================
     ③ 진단 문단
     ============================================================ */
  function diagCard(model, a) {
    const cur = model.current;
    const paras = cur ? cur.paras : babyParas(model, a);
    const issues = cur ? cur.issues : [];
    const goods = cur ? cur.goods : [];

    return `<div class="card">
      <div class="section-head"><h2 class="serif">${cur ? '무엇이 어긋나 있는가' : '이 사주에 이름을 얹는다면'}</h2><span class="en">DIAGNOSIS</span></div>
      ${paras.map(p => `<p class="nm-para serif">${p}</p>`).join('')}
      ${issues.length ? `<div class="nm-issues">
        <b class="nm-blk-title">어긋난 지점 ${issues.length}곳</b>
        <ul>${issues.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>` : ''}
      ${goods.length ? `<div class="nm-goods">
        <b class="nm-blk-title">지금 이름이 살려 주는 곳</b>
        <ul>${goods.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>` : ''}
      ${cur ? `<p class="small">사격은 한글 획수로 계산했습니다. 실제 한자를 쓰고 계시면 획수가 달라 수리도 조금 달라질 수 있습니다.</p>` : ''}
    </div>`;
  }

  function babyParas(model, a) {
    const n = model.need;
    const elS = global.Naming.elSubj, elO = global.Naming.elObj;
    const paras = [];
    paras.push(`아직 이름이 없는 사주입니다. 일간은 ${GAN_KO[a.dayGan]}(${EH[a.dayElem]})이고, 여덟 글자에서 ${elS(n.top)} ${pctTxt(n.topPct)}로 가장 두껍고 ${elS(n.low)} ${pctTxt(n.lowPct)}로 가장 마릅니다. 용신은 ${el(n.yong)}, 희신은 ${el(n.hee)}, 기신은 ${el(n.gi)}입니다.`);
    paras.push(`작명에서 먼저 정할 것은 이름의 뜻이 아니라 방향입니다. 이 사주는 ${elO(n.yong)} 세워야 ${n.strong.indexOf('약') >= 0 ? '기운이 버티고' : '넘치는 기운이 빠져나갑니다'}. ${elS(n.top)} ${pctTxt(n.topPct)}로 이미 두꺼우니, 이름에 ${elO(n.top)} 또 얹으면 같은 자리에서 힘이 새는 구조가 됩니다.`);
    paras.push(`이름은 성을 포함해 세 글자의 첫소리로 읽힙니다. 하루에도 수십 번 불리는 소리이므로, 초성의 오행이 사주와 상생으로 이어지느냐가 평생의 결을 조금씩 바꿉니다. 여기에 한자 획수의 사격(원·형·이·정)이 초년·청년·중년·말년의 흐름을 더합니다.`);
    if (a.future) paras.push(`지금은 출산 예정일 기준 명식입니다. 실제 태어난 시각이 예정과 다르면 시주가 달라지므로, 출생 후 시간을 넣고 한 번 더 확인하시길 권합니다.`);
    return paras;
  }

  /* ============================================================
     ④ 후보 5선 — 잠금 / 해금
     ============================================================ */
  function flowHTML(c) {
    const seq = [...c.surnameElem.map(s => ({ ch: s.ch, e: s.e })), ...c.elems.map(x => ({ ch: x.ch, e: x.e }))];
    let h = '<div class="nm-flow">';
    seq.forEach((s, i) => {
      if (i) {
        const r = c.relations[i - 1];
        h += `<span class="nm-rel ${r ? r.rel : ''}">${r ? r.relKo : ''}</span>`;
      }
      h += `<span class="nm-chip" style="--ec:${EC[s.e]}"><b>${s.ch}</b><small>${EK[s.e]}</small></span>`;
    });
    return h + '</div>';
  }

  function gyeokHTML(c) {
    return `<div class="nm-gyeok">${c.gyeok.filter(g => ['원격', '형격', '이격', '정격'].indexOf(g.label) >= 0).map(g =>
      `<div class="nm-gyeok-item g${g.grade}"><span>${g.label}</span><b>${g.n}</b><em>${g.name} · ${g.gradeKo}</em></div>`
    ).join('')}</div>`;
  }

  function candCard(c, idx) {
    return `<div class="nm-cand ${idx === 0 ? 'top' : ''}">
      <div class="nm-cand-head">
        <span class="nm-rank">${idx + 1}순위</span>
        <div class="nm-cand-name serif">${c.full}<small>${c.hanjaText}</small></div>
        <div class="nm-cand-score"><b>${c.score.total}</b><span>점</span></div>
      </div>
      <p class="nm-cand-headline">${c.head}</p>
      ${flowHTML(c)}
      <p class="nm-hanja-line">${c.hanjaFull}</p>
      ${gyeokHTML(c)}
      <ul class="nm-why">${c.why.map(w => `<li>${w}</li>`).join('')}</ul>
      <p class="nm-cand-foot">발음오행 ${c.score.sound} · 사주 보완 ${c.score.saju} · 수리 ${c.score.suri}</p>
    </div>`;
  }

  function candCardLocked(model, price) {
    const list = model.candidates.map(c => `<div class="nm-lock-row">
      <span class="nm-rank">${c.rank}</span>
      <b class="serif">${c.full}</b>
      <em>${'?'.repeat(c.given.length)}</em>
      <span class="nm-lock-score">${c.score.total}점</span>
    </div>`).join('');

    const first = model.candidates[0];
    const preview = first ? first.why[0] : '';

    return `<div class="card nm-lock">
      <div class="section-head"><h2 class="serif">사주 맞춤 이름 후보 5선</h2><span class="en">5 NAMES</span></div>
      <p class="small">${global.Naming.elObj(model.need.yong)} 세우고 ${global.Naming.elObj(model.need.gi)} 피하도록, 발음오행 상생과 한자 사격을 함께 통과한 이름들입니다. 후보마다 한자·수리·해설이 붙습니다.</p>
      <div class="nm-lock-list">${list}</div>
      <div class="nm-preview">
        <span class="nm-preview-tag">${first ? first.full : ''} · 1순위 해설</span>
        <p>${preview}</p>
        <div class="nm-preview-veil"><span>🔒</span>후보 5선 전체 해설과 한자·수리</div>
      </div>
      <div class="nm-cta">
        <div class="nm-price"><s>${won(price.list)}원</s><b>${won(price.sale)}원</b><span>오픈 특가</span></div>
        <button class="btn-gold" data-nm-buy="1">후보 5선 전체 열기</button>
        <button class="btn-ghost nm-demo-btn" data-nm-demo="1">데모로 먼저 열어보기</button>
        <p class="small">결제 즉시 이 화면에서 열립니다. 현장 결제 연동 전까지는 데모(테스트 결제)로 전체 내용을 확인하실 수 있습니다.</p>
      </div>
    </div>`;
  }

  function candCardOpen(model, price) {
    const cur = model.current;
    const gain = model.gain;
    const gainLine = cur && gain != null
      ? `<div class="nm-gain">지금 이름 <b>${cur.score.total}점</b> → 1순위 <b>${model.candidates[0].score.total}점</b>${gain > 0 ? ` <span>+${gain}</span>` : ''}</div>`
      : '';
    return `<div class="card nm-open">
      <div class="section-head"><h2 class="serif">사주 맞춤 이름 후보 5선</h2><span class="en">5 NAMES</span></div>
      ${gainLine}
      <p class="small">같은 이름이라도 어떤 한자를 쓰느냐에 따라 사격이 달라집니다. 각 후보는 그 이름에서 사격이 가장 좋은 조합으로 골랐습니다. 사격은 형격(청년)·이격(중년)·정격(말년)을 중심으로 보고, 원격(조상운)은 참고로만 봅니다.</p>
      ${model.candidates.map((c, i) => candCard(c, i)).join('')}
      <p class="small">최종 결정 전에는 가족이 부르는 소리와 한자 뜻을 함께 확인하십시오. 이름은 한 번 정하면 오래 쓰는 것이니, 마음에 드는 두세 개를 3일쯤 불러 보고 고르셔도 좋습니다.</p>
    </div>`;
  }

  /* ============================================================
     ⑤ 설득 카드
     ============================================================ */
  function pitchCard(model) {
    return `<div class="card nm-pitch">
      <div class="section-head"><h2 class="serif">이름 하나가 바꾸는 것</h2><span class="en">WHY NAME</span></div>
      <p class="nm-para serif">${model.hook}</p>
      <ul class="nm-points">
        <li><b>부르는 소리</b> 이름은 하루에도 수십 번 불리는 유일한 주문입니다. 사주가 타고난 기운이라면, 이름은 평생 반복되는 소리입니다.</li>
        <li><b>발음오행</b> 성과 이름의 첫소리가 상생으로 이어지는지를 봅니다. 여기서 어긋나면 같은 사주라도 일이 한 박자 늦게 풀립니다.</li>
        <li><b>81수리</b> 한자 획수로 초년·청년·중년·말년의 흐름을 봅니다. 뜻이 좋아도 수리가 흉한 자리에서는 남는 것이 적습니다.</li>
      </ul>
      <p class="small">철학관 작명 의뢰는 보통 10만~15만 원, 상담 20~30분에 이름 석 자를 받습니다. 여기서는 만세력으로 사주를 먼저 끝까지 읽고, 사주의 빈 칸을 정한 뒤 그 칸에 맞는 발음오행·한자·수리를 조합해 드립니다.</p>
    </div>`;
  }

  /* ============================================================
     render
     ============================================================ */
  function render(model, a, o) {
    o = o || {};
    const price = o.price || { list: 39000, sale: 29000 };
    const unlocked = !!o.unlocked;
    const cur = model.current;

    const isBaby = model.mode === 'baby';
    const head = cur ? heroCard(model, a) : `<div class="card nm-hero">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · ${isBaby ? '아기 작명' : '개명 후보'}</div>
        <h2 class="serif">${isBaby ? `${model.surname}씨 아기의 사주` : `${model.surname}씨에게 맞는 이름`}</h2>
        <p>${a.solar.y}.${String(a.solar.m).padStart(2, '0')}.${String(a.solar.d).padStart(2, '0')}${a.timeKnown ? ' ' + a.sijinName : ' 시간 모름'} · ${a.gender} · ${pillarsLine(a)} · 일간 ${GAN_KO[a.dayGan]}(${EH[a.dayElem]})</p>
      </div>
      <div class="nm-need">${model.needLine}</div>
      <p class="small center mt10">${isBaby
        ? '아직 이름이 없으니 점수 대신 사주가 필요로 하는 글자를 먼저 보여 드립니다. 이름을 붙이면 그 이름의 점수와 해설이 바로 나옵니다.'
        : '지금 이름을 비워 두셨습니다. 이름을 넣으면 그 이름의 점수와 어긋난 지점을 짚어 드리고, 아래에는 사주에 맞춘 개명 후보 5선을 세웠습니다.'}</p>
    </div>`;

    return head +
      compareCard(model) +
      diagCard(model, a) +
      pitchCard(model) +
      (unlocked ? candCardOpen(model, price) : candCardLocked(model, price)) +
      `<div class="card">${shareRow()}</div>`;
  }

  function shareText(model) {
    const cur = model.current;
    if (cur) {
      return `‘${cur.full}’ 이름 진단 ${cur.score.total}점 — ${cur.band.t}. ${model.needLine} 살풀이 : 천기에서 내 이름을 사주에 견줘 봤어요.`;
    }
    const top = model.candidates[0];
    return `${model.surname}씨 아기 사주에 맞는 이름 후보 1순위 — ${top ? top.full + '(' + top.hanjaText + ') ' + top.score.total + '점' : ''}. 살풀이 : 천기에서 지어봤어요.`;
  }

  global.NamingText = { render, shareText, babyParas };
})(window);
