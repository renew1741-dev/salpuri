/* ============================================================
   살풀이 : 천기 — 화면 제어 (app.js)
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const S = window.Saju;
  const TX = window.SajuText;
  const T = window.Tarot;
  const P = window.Payment;

  const state = {
    gender: '여',
    cal: '양력',
    sijin: null,        // null = 모름
    analysis: null,
    tab: 'saju',
    tarot: { cat: 'love', picked: [], reading: [] }
  };

  const toast = (msg, ms = 2200) => {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms);
  };

  /* ================= 안개 · 입자 ================= */
  function initFog() {
    const c = $('#fogCanvas'), ctx = c.getContext('2d');
    let W, H, puffs = [];
    const resize = () => {
      W = c.width = innerWidth; H = c.height = innerHeight;
      puffs = [];
      const n = Math.min(30, Math.round(innerWidth / 44));
      for (let i = 0; i < n; i++) {
        puffs.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 120 + Math.random() * 230,
          vx: (Math.random() - .5) * .28 + .06,
          vy: (Math.random() - .5) * .12 - .02,
          a: .028 + Math.random() * .05,
          hue: Math.random() < .34 ? '217,185,120' : (Math.random() < .5 ? '150,130,190' : '96,72,120')
        });
      }
    };
    resize();
    addEventListener('resize', resize, { passive: true });
    let t0 = performance.now();
    (function loop(now) {
      const dt = Math.min(48, now - t0); t0 = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of puffs) {
        p.x += p.vx * dt / 16; p.y += p.vy * dt / 16;
        if (p.x - p.r > W) p.x = -p.r;
        if (p.x + p.r < 0) p.x = W + p.r;
        if (p.y - p.r > H) p.y = -p.r;
        if (p.y + p.r < 0) p.y = H + p.r;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${p.hue},${p.a})`);
        g.addColorStop(.6, `rgba(${p.hue},${p.a * .35})`);
        g.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }

  function initGrain() {
    const c = $('#grainCanvas'), ctx = c.getContext('2d');
    const n = 160;
    const off = document.createElement('canvas');
    off.width = off.height = n;
    const octx = off.getContext('2d');
    const img = octx.createImageData(n, n);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    const draw = () => {
      c.width = innerWidth; c.height = innerHeight;
      ctx.fillStyle = ctx.createPattern(off, 'repeat');
      ctx.fillRect(0, 0, c.width, c.height);
    };
    draw();
    addEventListener('resize', draw, { passive: true });
  }

  /* ================= 사운드 ================= */
  const audio = {
    ctx: null, master: null, on: false, timer: null,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      const master = this.master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      // 낮게 깔리는 동양풍 드론 (D · A · E · F#)
      [146.83, 220.0, 293.66, 369.99].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = i === 0 ? 'sine' : (i === 3 ? 'triangle' : 'sine');
        o.frequency.value = f * (i === 3 ? 1 : 1);
        g.gain.value = i === 0 ? 0.10 : 0.035 / (i);
        lfo.frequency.value = 0.05 + i * 0.017;
        lg.gain.value = 0.008;
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(master);
        o.start(); lfo.start();
      });

      // 바람 소리 (필터드 노이즈)
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.2;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = 0.6;
      const ng = ctx.createGain(); ng.gain.value = 0.05;
      src.connect(bp); bp.connect(ng); ng.connect(master); src.start();

      // 풍경(風磬) 소리
      const notes = [587.33, 659.25, 783.99, 880.0, 1174.66, 987.77];
      const chime = () => {
        if (!this.on || !this.ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
        o.connect(g); g.connect(master);
        o.start(now); o.stop(now + 4.3);
      };
      this.chime = chime;
      setTimeout(chime, 400);
      this.timer = setInterval(chime, 5200);
    },
    start() {
      this.init();
      if (!this.ctx) return;
      this.ctx.resume();
      this.on = true;
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0.28, this.ctx.currentTime, 1.6);
      $('#soundBtn').classList.remove('off');
      $('#soundLabel').textContent = '몽환 사운드';
    },
    toggle() {
      if (!this.ctx) { this.start(); return; }
      this.on = !this.on;
      this.ctx.resume();
      this.master.gain.setTargetAtTime(this.on ? 0.28 : 0.0001, this.ctx.currentTime, 0.4);
      $('#soundBtn').classList.toggle('off', !this.on);
      $('#soundLabel').textContent = this.on ? '몽환 사운드' : '소리 꺼짐';
    },
    tap() {
      if (!this.on || !this.ctx) return;
      const now = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(920, now);
      o.frequency.exponentialRampToValueAtTime(1380, now + 0.1);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + 0.34);
    }
  };

  /* ================= 입장 ================= */
  const typeDialogue = (text, speed = 55) => {
    const el = $('#dialogue');
    el.innerHTML = '';
    let i = 0;
    clearInterval(el._t);
    el._t = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(el._t);
    }, speed);
  };

  function enter() {
    document.body.classList.add('opened');
    document.body.classList.remove('locked');
    audio.start();
    setTimeout(() => typeDialogue('어서 오세요… 당신의 명(命)이 어떤 빛으로 타고났는지, 한번 들여다볼까요.'), 550);
    setTimeout(() => $('#main').scrollIntoView({ block: 'start' }), 2600);
  }

  /* ================= 탭 ================= */
  function switchTab(id) {
    state.tab = id;
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + id));
    if (id === 'tarot') requestAnimationFrame(layoutFan);
    if (id === 'premium') renderPriceList();
    const panel = document.getElementById('panel-' + id);
    if (panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    audio.tap();
  }

  /* ================= 폼 ================= */
  function fillSelects() {
    const ySel = $('#birthYear'), mSel = $('#birthMonth'), dSel = $('#birthDay');
    ySel.innerHTML = ''; mSel.innerHTML = ''; dSel.innerHTML = '';
    for (let y = 2026; y >= 1940; y--) {
      const o = new Option(y + '년', y);
      if (y === 2000) o.selected = true;
      ySel.add(o);
    }
    for (let m = 1; m <= 12; m++) mSel.add(new Option(m + '월', m));
    for (let d = 1; d <= 31; d++) dSel.add(new Option(d + '일', d));
    mSel.value = 1; dSel.value = 1;
  }

  function leapMonthOf(y) {
    const row = window.LUNAR_TABLE[y - 1930];
    return row ? row[3] : 0;
  }

  function daysInMonth(y, m) {
    if (state.cal === '양력') {
      return new Date(y, m, 0).getDate();
    }
    const isLeap = state.cal === '음력윤달';
    const probe = (dd) => !!S.lunarToSolar(y, m, dd, isLeap);
    if (!probe(1)) return 0;
    return probe(30) ? 30 : 29;
  }

  function syncDaySelect() {
    const y = +$('#birthYear').value, m = +$('#birthMonth').value;
    const dSel = $('#birthDay');
    const max = daysInMonth(y, m);
    const cur = +dSel.value || 1;
    dSel.innerHTML = '';
    const limit = state.cal === '양력' ? max : (max || 30);
    for (let d = 1; d <= limit; d++) dSel.add(new Option(d + '일', d));
    dSel.value = Math.min(cur, limit);
    const hint = $('#lunarHint');
    if (state.cal === '양력') {
      hint.textContent = '1940년 ~ 2026년 출생 지원 · 양력 그대로 계산합니다.';
    } else {
      const lp = leapMonthOf(y);
      let t = `${y}년 음력은 ${lp ? '윤' + lp + '월' : '윤달 없음'} · 해당 월의 실제 일수만 선택됩니다.`;
      if (state.cal === '음력윤달' && lp) t += ` (윤${lp}월 1일 ~ ${daysInMonth(y, lp)}일)`;
      if (state.cal === '음력윤달' && !lp) t = `${y}년에는 윤달이 없습니다. 다른 해를 선택하거나 음력(평달)을 골라 주세요.`;
      hint.textContent = t;
    }
  }

  function buildTimeGrid() {
    const g = $('#timeGrid');
    g.innerHTML = '';
    const mk = (label, sub, val) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn' + (val === state.sijin ? ' active' : '');
      b.innerHTML = `${label}${sub ? `<small>${sub}</small>` : ''}`;
      b.onclick = () => {
        state.sijin = val;
        $$('.seg-btn', g).forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        audio.tap();
      };
      g.appendChild(b);
    };
    mk('모름', '시간 미상', null);
    S.SIJIN.forEach((name, i) => mk(name, S.SIJIN_RANGE[i], i));
  }

  function initForm() {
    fillSelects();
    $('#birthYear').addEventListener('change', syncDaySelect);
    $('#birthMonth').addEventListener('change', syncDaySelect);
    $$('#genderSeg .seg-btn').forEach(b => b.onclick = () => {
      state.gender = b.dataset.v;
      $$('#genderSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
    });
    $$('#calSeg .seg-btn').forEach(b => b.onclick = () => {
      state.cal = b.dataset.v;
      $$('#calSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      if (state.cal === '음력윤달') {
        const y = +$('#birthYear').value, lp = leapMonthOf(y);
        if (lp) $('#birthMonth').value = lp;
      }
      syncDaySelect();
      audio.tap();
    });
    buildTimeGrid();
    syncDaySelect();
  }

  /* ================= 사주 계산 ================= */
  function calc() {
    const name = $('#userName').value.trim();
    const y = +$('#birthYear').value, m = +$('#birthMonth').value, d = +$('#birthDay').value;
    if (state.cal === '음력윤달' && !leapMonthOf(y)) {
      toast('선택한 해에는 윤달이 없습니다. 음력(평달)을 선택해 주세요.');
      return;
    }
    const res = S.analyze({
      name, gender: state.gender,
      year: y, month: m, day: d,
      calendar: state.cal === '양력' ? '양력' : '음력',
      leap: state.cal === '음력윤달',
      sijin: state.sijin
    });
    if (res.error) { toast(res.error); return; }

    $('#formCard').classList.add('hidden');
    $('#resultPanel').classList.remove('show');
    $('#loadingPanel').classList.add('show');
    $('#loadingPanel').scrollIntoView({ block: 'center' });
    audio.tap();
    setTimeout(() => {
      state.analysis = res;
      renderResult(res);
      $('#loadingPanel').classList.remove('show');
      $('#resultPanel').classList.add('show');
      const label = name ? `${name} 님` : '당신';
      typeDialogue(`${label}의 사주에 ${S.ELEM_KO[res.yongsin.yong]}(${S.ELEM_HANJA[res.yongsin.yong]})의 기운이 부족하구나. 아래에서 확인해 보세요.`);
      $('#resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (P.unlocked().size) renderReport(res);
      renderPriceList();
    }, 1500);
  }

  const elemVar = ['--w-wood', '--w-fire', '--w-earth', '--w-metal', '--w-water'];

  function renderResult(a) {
    const GAN = S.GAN, JI = S.JI, GAN_KO = S.GAN_KO, JI_KO = S.JI_KO;

    // 제목
    $('#resultName').textContent = (a.name ? a.name + ' 님의 ' : '') + '사주 명식';
    const solarTxt = `양력 ${a.solar.y}.${String(a.solar.m).padStart(2, '0')}.${String(a.solar.d).padStart(2, '0')}`;
    const lunarTxt = a.lunar ? `음력 ${a.lunar.y}.${String(a.lunar.m).padStart(2, '0')}.${String(a.lunar.d).padStart(2, '0')}${a.lunar.leap ? '(윤)' : ''}` : '';
    $('#resultSub').textContent = `${solarTxt} · ${lunarTxt} · ${a.sijinName}${a.timeKnown ? '(' + S.SIJIN_RANGE[a.sijin] + ')' : ''} · ${a.gender}성`;

    // 기둥
    const grid = $('#pillarGrid');
    grid.innerHTML = '';
    a.pillars.forEach(p => {
      const d = document.createElement('div');
      d.className = 'pillar' + (p.pos === '일' ? ' is-day' : '') + (p.gan == null ? ' unknown' : '');
      const posName = { 년: '년주', 월: '월주', 일: '일주', 시: '시주' }[p.pos];
      const posDesc = { 년: '초년·조상', 월: '청년·부모', 일: '나·배우자', 시: '말년·자식' }[p.pos];
      if (p.gan == null) {
        d.innerHTML = `<div class="p-label"><em>${posName}</em><br>${posDesc}</div>
          <div class="gan">—</div><div class="ji">—</div><div class="han">시간 미상</div>`;
      } else {
        const eG = S.GAN_ELEM[p.gan], eJ = S.JI_ELEM[p.ji];
        d.innerHTML = `
          <div class="p-label"><em>${posName}</em><br>${posDesc}</div>
          <span class="elem-dot" style="background:var(${elemVar[eG]})"></span>
          <div class="gan serif" style="color:var(${elemVar[eG]})">${GAN[p.gan]}</div>
          <div class="han">${GAN_KO[p.gan]} · ${S.ELEM_HANJA[eG]}</div>
          <div class="ji serif" style="color:var(${elemVar[eJ]}); margin-top:6px">${JI[p.ji]}</div>
          <div class="han">${JI_KO[p.ji]} · ${S.ELEM_HANJA[eJ]}</div>
          <div class="tg">${p.pos === '일' ? '일간(나)' : S.TEN_GODS[p.ganTenGod]}<br><span style="opacity:.7">${S.TEN_GODS[p.jiTenGod]}(지)</span></div>
          <div class="jjg">${p.jiTenGodList.map(x => GAN_KO[x.gan]).join('·')}</div>`;
      }
      grid.appendChild(d);
    });

    // 범례
    $('#pillarLegend').innerHTML = S.ELEM_KO.map((k, i) =>
      `<span><i style="background:var(${elemVar[i]})"></i>${k}(${S.ELEM_HANJA[i]})</span>`).join('');

    // 절기 근거
    const mt = a.monthTerm;
    const termLine = $('#termLine');
    if (mt) {
      termLine.innerHTML = `<b>월건(月建)</b> ${mt.name} ${mt.dateLabel} ~ ${mt.nextName} ${mt.nextLabel} 사이 출생 → <b>${S.JI_KO[a.monthPillar.ji]}(${S.JI[a.monthPillar.ji]})월</b>` +
        (a.yearPillar.beforeLichun ? ` · <b>입춘 전</b> 출생이라 연주는 ${a.yearPillar.sajuYear}년 기준` : '');
    }

    // 오행
    renderRadar(a.ew.pct);
    const rows = $('#ohengRows');
    rows.innerHTML = a.ew.pct.map((v, i) => {
      const pc = Math.round(v * 100);
      return `<div class="oheng-row">
        <span class="nm">${S.ELEM_KO[i]}(${S.ELEM_HANJA[i]})</span>
        <div class="oheng-track"><div class="oheng-fill" style="width:0%;background:var(${elemVar[i]})" data-w="${pc}%"></div></div>
        <span class="pc">${pc}%</span></div>`;
    }).join('');
    requestAnimationFrame(() => {
      $$('.oheng-fill', rows).forEach(f => f.style.width = f.dataset.w);
    });

    // 강약 게이지
    renderGauge(a.strength.ratio);
    $('#strengthLabel').textContent = `${a.strength.level} · 일간 ${S.GAN[a.dayGan]}(${S.GAN_KO[a.dayGan]}) ${S.ELEM_KO[a.dayElem]} ${S.ELEM_HANJA[a.dayElem]}`;
    $('#strengthDesc').textContent = `아군(비겁·인성) ${Math.round(a.strength.support)} : 적군(식상·재성·관성) ${Math.round(a.strength.drain)}`;

    // 용신
    const ys = a.yongsin;
    $('#yongshinBox').innerHTML = [
      ['용신', ys.yong, 'main'], ['희신', ys.hee, ''], ['기신', ys.gi, '']
    ].map(([k, e, cls]) => `
      <div class="ys-item ${cls}">
        <div class="k">${k}</div>
        <div class="v serif" style="color:var(${elemVar[e]})">${S.ELEM_HANJA[e]}</div>
        <div class="k" style="margin-top:2px">${S.ELEM_KO[e]}</div>
      </div>`).join('');

    // 무료 풀이
    $('#freeReading').innerHTML = TX.buildFree(a);

    // 세운
    const s = a.saeun[0];
    $('#saeunGanji').innerHTML = `${S.GAN[s.gan]}${S.JI[s.ji]}<small>${s.year} ${S.GAN_KO[s.gan]}${S.JI_KO[s.ji]}년</small>`;
    const advice = s.tenGod <= 1 ? '내 힘으로 밀어붙이기보다 사람과 판을 정리하는 해입니다.'
      : s.tenGod <= 3 ? '만들고 표현하는 일이 성과로 이어지나, 말이 앞서면 계약에서 손해를 봅니다.'
        : s.tenGod <= 5 ? '돈이 실제로 움직이는 해입니다. 들어오고 나가는 돈을 같은 달에 정리하십시오.'
          : s.tenGod <= 7 ? '책임과 압박이 늘지만 그 자리가 다음 10년의 몫을 만듭니다.'
            : '배움과 재정비에 맞는 해입니다. 자격·문서·공부를 챙기면 내년의 발판이 됩니다.';
    $('#saeunText').innerHTML = `<b style="color:#f6e3ad">${s.tenGodName}</b>의 기운이 들어오는 해입니다. ${advice}` +
      (s.inter.length ? `<br><span style="color:#e2a35e">원국과 ${[...new Set(s.inter.map(i => i.type))].join('·')}${/합$|충$/.test([...new Set(s.inter.map(i => i.type))].pop()) ? '이' : '가'} 잡혀 변화가 큰 해입니다.</span>` : '') +
      `<br>다음 해 ${a.saeun[1].year}년은 ${S.GAN[a.saeun[1].gan]}${S.JI[a.saeun[1].ji]}년 · ${a.saeun[1].tenGodName}입니다.`;

    // 대운
    const nowY = new Date().getFullYear();
    $('#dwStrip').innerHTML = a.daewoon.list.map(d => {
      const cur = nowY >= d.startYear && nowY <= d.startYear + 9;
      return `<div class="dw-item ${cur ? 'cur' : ''}">
        <div class="g serif">${S.GAN[d.gan]}${S.JI[d.ji]}</div>
        <div class="a">${d.startAge}세~</div>
        <div class="a">${S.TEN_GODS[S.tenGod(a.dayGan, d.gan)]}</div></div>`;
    }).join('');
    $('#dwNote').textContent = `${a.daewoon.forward ? '순행(順行)' : '역행(逆行)'} · 대운수 ${a.daewoon.startAge}세 ` +
      `(절입까지 ${a.daewoon.days}일 ÷ 3) · ${a.gender}성 ${S.GAN_KO[a.yearPillar.gan]}년생`;

    // 잠금 문구
    const un = P.unlocked();
    if (un.size) $('#unlockBtn').textContent = '프리미엄 리포트 열람하기 (결제 완료)';
  }

  function renderRadar(pct) {
    const svg = $('#ohengRadar');
    const cx = 100, cy = 100, R = 66;
    const labels = ['목', '화', '토', '금', '수'];
    const ang = i => -Math.PI / 2 + i * 2 * Math.PI / 5;
    let g = '';
    // 격자
    for (let ring = 1; ring <= 4; ring++) {
      const r = R * ring / 4;
      const pts = [0, 1, 2, 3, 4].map(i => `${cx + r * Math.cos(ang(i))},${cy + r * Math.sin(ang(i))}`).join(' ');
      g += `<polygon points="${pts}" fill="none" stroke="rgba(217,185,120,${ring === 4 ? .3 : .12})" stroke-width="1"/>`;
    }
    [0, 1, 2, 3, 4].forEach(i => {
      g += `<line x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(ang(i))}" y2="${cy + R * Math.sin(ang(i))}" stroke="rgba(217,185,120,.12)"/>`;
    });
    // 데이터
    const max = Math.max(...pct, 0.28);
    const pts = pct.map((v, i) => {
      const r = R * Math.min(1, (v / max) * 0.94 + 0.04);
      return [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
    });
    g += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="rgba(217,185,120,.22)" stroke="#f6e3ad" stroke-width="1.4"/>`;
    pts.forEach((p, i) => {
      g += `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#f6e3ad"/>`;
    });
    // 라벨
    labels.forEach((l, i) => {
      const x = cx + (R + 16) * Math.cos(ang(i)), y = cy + (R + 16) * Math.sin(ang(i));
      g += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#9c9488" font-family="serif">${l}</text>`;
    });
    svg.innerHTML = g;
  }

  function renderGauge(ratio) {
    const svg = $('#strengthGauge');
    const cx = 120, cy = 108, r = 86;
    const pt = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    const arc = (a1, a2) => {
      const p1 = pt(a1, r), p2 = pt(a2, r);
      const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
      return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${r} ${r} 0 ${large} 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    };
    const t = Math.max(0, Math.min(1, ratio));
    const theta = Math.PI + Math.PI * t;   // 왼쪽(π) → 위(1.5π) → 오른쪽(2π)
    let g = `<path d="${arc(Math.PI, 2 * Math.PI)}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="11" stroke-linecap="round"/>`;
    g += `<path d="${arc(Math.PI, theta)}" fill="none" stroke="url(#gaugeGrad)" stroke-width="11" stroke-linecap="round"/>`;
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + Math.PI * i / 10;
      const p1 = pt(a, r + 9), p2 = pt(a, r + (i % 5 === 0 ? 16 : 13));
      g += `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}"
        stroke="rgba(217,185,120,${i % 5 === 0 ? .55 : .22})" stroke-width="1"/>`;
    }
    const nd = pt(theta, r - 14);
    g += `<line x1="${cx}" y1="${cy}" x2="${nd[0].toFixed(1)}" y2="${nd[1].toFixed(1)}" stroke="#f6e3ad" stroke-width="2" stroke-linecap="round"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#f6e3ad"/>`;
    g += `<text x="${cx}" y="${cy - 14}" text-anchor="middle" font-size="26" font-family="serif" fill="#f6e3ad">${Math.round(t * 100)}%</text>`;
    g += `<text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="10" fill="#9c9488" letter-spacing="2">SELF POWER</text>`;
    svg.innerHTML = `<defs><linearGradient id="gaugeGrad" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#60a5fa"/><stop offset="50%" stop-color="#f6e3ad"/><stop offset="100%" stop-color="#f87171"/></linearGradient></defs>` + g;
  }

  function resetForm() {
    $('#resultPanel').classList.remove('show');
    $('#formCard').classList.remove('hidden');
    typeDialogue('또 다른 이의 명이 궁금하신가요?');
    $('#formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ================= 타로 ================= */
  function initTarot() {
    $('#catRow').innerHTML = T.CATEGORIES.map(c =>
      `<button class="cat-btn ${c.id === state.tarot.cat ? 'active' : ''}" data-cat="${c.id}">
        <span class="ic">${c.icon}</span>${c.name}</button>`).join('');
    $$('#catRow .cat-btn').forEach(b => b.onclick = () => {
      state.tarot.cat = b.dataset.cat;
      $$('#catRow .cat-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
      if (state.tarot.picked.length === 3) renderReading();
    });

    $('#slotRow').innerHTML = T.POSITIONS.map((p, i) =>
      `<div class="slot">
        <div class="pos">${p.name}<small>${p.desc}</small></div>
        <div class="slot-card empty" data-slot="${i}">
          <div class="inner">
            <div class="face back">${T.cardBack()}</div>
            <div class="face front"></div>
          </div>
        </div>
      </div>`).join('');

    buildDeck();
    $('#resetTarot').onclick = () => { resetTarot(); };
    addEventListener('resize', () => { if (state.tab === 'tarot') layoutFan(); }, { passive: true });
  }

  function buildDeck() {
    const fan = $('#deckFan');
    fan.innerHTML = '';
    const order = T.TAROT.map((c, i) => ({ card: c, i })).sort(() => Math.random() - 0.5);
    order.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'fan-card';
      el.dataset.idx = idx;
      el.dataset.card = item.card.n;
      el.innerHTML = T.cardBack();
      el.onclick = () => pickCard(el);
      fan.appendChild(el);
    });
    // 카드마다 정/역을 미리 배정 (뽑을 때 확정)
    state.tarot.deck = order.map(o => o.card);
    layoutFan();
  }

  function layoutFan() {
    const stage = $('#deckStage');
    const cards = $$('#deckFan .fan-card');
    if (!cards.length || !stage) return;
    const w = stage.clientWidth || 340;
    const R = Math.min(w * 0.54, 300);
    const spread = Math.min(w < 460 ? 72 : 88, 3.9 * cards.length);
    cards.forEach((c, i) => {
      const t = cards.length === 1 ? 0.5 : i / (cards.length - 1);
      const deg = -spread / 2 + spread * t;
      const rad = deg * Math.PI / 180;
      const x = R * Math.sin(rad);
      const y = R * (1 - Math.cos(rad));
      c.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${deg}deg)`;
      c.style.setProperty('--fx', x + 'px');
      c.style.setProperty('--fy', y + 'px');
      c.style.setProperty('--fr', deg + 'deg');
      c.style.zIndex = 100 + i;
    });
  }

  function pickCard(el) {
    if (state.tarot.picked.length >= 3) return;
    const slotIdx = state.tarot.picked.length;
    const cardN = +el.dataset.card;
    const card = T.TAROT.find(c => c.n === cardN);
    const rev = Math.random() < 0.32;
    state.tarot.picked.push({ card, rev });
    el.classList.add('picked');
    audio.tap();

    const slot = $(`.slot-card[data-slot="${slotIdx}"]`);
    slot.classList.remove('empty');
    slot.querySelector('.face.front').innerHTML = `
      <div class="numeral">${card.numeral}</div>
      <div class="art-wrap">${T.ART[card.n]}</div>
      <div class="cname">${card.name}</div>
      <div class="cen">${card.en}</div>
      <div class="rev-mark">逆</div>`;
    if (rev) slot.classList.add('reversed');
    slot.style.transform = 'scale(.86)';
    slot.style.opacity = '.2';
    setTimeout(() => {
      slot.style.transition = 'transform .5s cubic-bezier(.2,.9,.3,1), opacity .4s';
      slot.style.transform = 'scale(1)';
      slot.style.opacity = '1';
    }, 30);
    setTimeout(() => slot.classList.add('flipped'), 330);

    const left = 3 - state.tarot.picked.length;
    $('#deckHint').textContent = left > 0 ? `카드 ${3 - left + 1}장째 · ${left}장 더 고르세요` : '세 장이 모두 놓였습니다';
    if (left === 0) setTimeout(renderReading, 1000);
  }

  function renderReading() {
    const { picked, cat } = state.tarot;
    if (picked.length < 3) return;
    const catObj = T.CATEGORIES.find(c => c.id === cat);
    const box = $('#readingBox');
    box.innerHTML = picked.map((p, i) => {
      const pos = T.POSITIONS[i];
      const txt = p.rev ? p.card.rev : p.card.up;
      return `<div class="read-item">
        <h4>${pos.name} · ${pos.desc}</h4>
        <h4><b>${p.card.name}</b> <span class="dir ${p.rev ? 'rev' : 'up'}">${p.rev ? '역방향' : '정방향'}</span></h4>
        <p>${txt}</p>
        <div class="cat">${catObj.icon} ${catObj.name} — ${p.card.cat[cat]}</div>
        <div class="key">${p.card.key}</div>
      </div>`;
    }).join('');

    const revCount = picked.filter(p => p.rev).length;
    const [a, b, c] = picked;
    const josa = (w, withB, noB) => {
      const c = w.charCodeAt(w.length - 1);
      if (c < 0xAC00 || c > 0xD7A3) return noB;
      return ((c - 0xAC00) % 28) ? withB : noB;
    };
    let summary = `<strong>${a.card.name}</strong>${josa(a.card.name, '이', '가')} 지금의 뿌리가 되고, ` +
      `<strong>${b.card.name}</strong>${josa(b.card.name, '이', '가')} 당신이 서 있는 자리이며, ` +
      `<strong>${c.card.name}</strong>${josa(c.card.name, '이', '가')} 향하는 방향입니다. `;
    summary += revCount === 0
      ? '세 장이 모두 정방향으로 놓였습니다. 지금 잡은 방향을 의심하지 말고 밀고 나가십시오. 이 흐름은 흔들리지 않습니다.'
      : revCount === 1
        ? '한 장이 역방향입니다. 그 자리에서만 잠시 멈추면 됩니다. 나머지 두 장의 힘이 충분히 버텨 줍니다.'
        : revCount === 2
          ? '두 장이 역방향입니다. 서두르면 같은 자리를 맴돕니다. 결정을 미루는 것이 이번 달의 정답입니다.'
          : '세 장이 모두 역방향으로 놓였습니다. 지금은 새로 시작할 때가 아니라 정리할 때입니다. 버릴 것을 먼저 정하십시오.';
    summary += `<br><br>${catObj.icon} <strong>${catObj.name}</strong> — ${catObj.intro} `;
    const strong = picked.map((p, i) => ({ p, w: GODW(p) })).sort((x, y) => y.w - x.w)[0];
    summary += `가장 힘이 실린 카드는 <strong>${strong.p.card.name}</strong>입니다. ${strong.p.card.cat[cat]}`;

    const sum = $('#readSummary');
    sum.innerHTML = summary;
    sum.classList.remove('hidden');
    sum.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function GODW(p) {
    // 정방향일수록, 그리고 카드 번호가 클수록 완성에 가깝다고 보는 단순 가중
    return (p.rev ? 0.6 : 1) + p.card.n / 40;
  }

  function resetTarot() {
    state.tarot.picked = [];
    $('#readingBox').innerHTML = '';
    $('#readSummary').classList.add('hidden');
    $('#deckHint').textContent = '부채꼴 카드 22장 중 3장을 직접 고르세요';
    $$('.slot-card').forEach(s => {
      s.classList.remove('flipped', 'reversed');
      s.classList.add('empty');
      s.style.transform = ''; s.style.opacity = ''; s.style.transition = '';
      s.querySelector('.face.front').innerHTML = '';
    });
    buildDeck();
    audio.tap();
  }

  /* ================= 상품 · 결제 ================= */
  function renderPriceList() {
    const un = P.unlocked();
    $('#priceList').innerHTML = ['report', 'talisman', 'vip'].map(id => {
      const p = P.PRODUCTS[id];
      const owned = p.unlock.every(k => un.has(k));
      return `<div class="price-item ${id === 'vip' ? 'featured' : ''} ${owned ? 'owned' : ''}">
        <div class="info">
          <span class="tagline">${p.badge}</span>
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
        </div>
        <div class="price">
          <span class="num">${p.price.toLocaleString()}원</span>
          <button data-buy="${id}">${owned ? '결제 완료' : '구매하기'}</button>
        </div>
      </div>`;
    }).join('');
    $$('#priceList [data-buy]').forEach(b => b.onclick = () => openPay(b.dataset.buy));
  }

  function openPay(productId) {
    if (!state.analysis) {
      toast('사주 명식을 먼저 조회해 주세요.');
      switchTab('saju');
      $('#formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const prod = P.PRODUCTS[productId];
    const un = P.unlocked();
    if (prod.unlock.every(k => un.has(k))) {
      toast('이미 결제하신 상품입니다. 리포트를 열람해 주세요.');
      switchTab('premium');
      return;
    }
    const demo = P.CONFIG.mode === 'demo';
    const box = $('#payModalBox');
    box.innerHTML = `
      <div class="modal-head">
        <h3 class="serif">${prod.name}</h3>
        <button class="modal-x" id="mClose">✕</button>
      </div>
      <div class="modal-prod">${prod.desc}${demo ? '<span class="demo-badge">테스트 결제</span>' : ''}</div>
      <div class="field">
        <label class="field-label" for="payName">성함</label>
        <input class="inp" id="payName" type="text" value="${state.analysis.name || ''}" placeholder="홍길동" />
      </div>
      <div class="field">
        <label class="field-label" for="payContact">연락처 (리포트·부적 발송)</label>
        <input class="inp" id="payContact" type="tel" placeholder="010-0000-0000" value="" />
      </div>
      <div class="field">
        <label class="field-label">결제 수단</label>
        <div class="pay-methods seg-2 seg" id="payMethodSeg">
          <button type="button" class="seg-btn active" data-m="CARD">신용·체크카드</button>
          <button type="button" class="seg-btn" data-m="EASY_PAY">카카오페이·토스페이</button>
        </div>
      </div>
      <div class="pay-sum"><span>결제 금액 (VAT 포함)</span><b>${prod.price.toLocaleString()}원</b></div>
      <button class="btn-gold" id="payGo">${prod.price.toLocaleString()}원 결제하기</button>
      <div class="pay-note">
        ${demo
          ? '현재 테스트 모드입니다. 실제 금액이 청구되지 않으며 결제 시연 후 프리미엄 리포트가 열립니다.<br>실제 판매 시에는 관리자 콘솔의 상점 ID·채널키를 js/payment.js 의 CONFIG 에 넣으면 포트원·토스페이먼츠 결제창이 호출됩니다.'
          : '결제창에서 결제를 완료하시면 이 화면으로 돌아와 리포트가 열립니다.'}
      </div>`;
    $$('#payMethodSeg .seg-btn').forEach(b => b.onclick = () => {
      $$('#payMethodSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      P.CONFIG.portone.payMethod = b.dataset.m;
      audio.tap();
    });
    $('#mClose').onclick = closePay;
    $('#payGo').onclick = doPay;
    $('#payModal').classList.add('show');
    audio.tap();
  }

  function closePay() {
    $('#payModal').classList.remove('show');
  }

  async function doPay() {
    const btn = $('#payGo');
    const name = $('#payName').value.trim();
    const contact = $('#payContact').value.trim();
    if (!contact) { toast('연락처를 입력해 주세요.'); $('#payContact').focus(); return; }
    btn.disabled = true;
    btn.textContent = '결제를 확인하는 중…';
    // 상품 판별: 모달 제목으로 역추적
    const title = $('#payModalBox .modal-head h3').textContent;
    const productId = Object.keys(P.PRODUCTS).find(k => P.PRODUCTS[k].name === title);

    const res = await P.pay(productId, { name, phone: contact });
    if (!res.ok) {
      toast(res.error || '결제가 완료되지 않았습니다.');
      btn.disabled = false;
      btn.textContent = '다시 시도';
      return;
    }
    const box = $('#payModalBox');
    box.innerHTML = `
      <div class="pay-step">
        <div class="done-icon">✓</div>
        <div class="big">결제가 완료되었습니다</div>
        <p>주문번호 <b style="color:#f6e3ad">${res.order.orderId}</b><br>
        ${P.PRODUCTS[productId].name}<br>
        프리미엄 리포트가 열렸습니다.${res.demo ? '<br><span class="demo-badge">테스트 결제</span>' : ''}</p>
        <button class="btn-gold mt20" id="payDone" style="max-width:220px;margin:20px auto 0">리포트 열기</button>
      </div>`;
    $('#payDone').onclick = () => {
      closePay();
      switchTab('premium');
      renderReport(state.analysis);
      setTimeout(() => $('#reportCard').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    };
    renderPriceList();
    if (P.unlocked().size) renderReport(state.analysis);
    $('#unlockBtn').textContent = '프리미엄 리포트 열람하기 (결제 완료)';
    $('#unlockBtn').onclick = () => { switchTab('premium'); };
  }

  function renderReport(a) {
    if (!a) return;
    const un = P.unlocked();
    if (!un.size) {
      $('#reportLocked').classList.remove('hidden');
      $('#reportBody').classList.add('hidden');
      $('#printRow').classList.add('hidden');
      return;
    }
    $('#reportLocked').classList.add('hidden');
    $('#reportBody').classList.remove('hidden');
    $('#printRow').classList.remove('hidden');
    $('#reportBody').innerHTML = TX.buildPremium(a);
    $('#printRow').classList.remove('hidden');
  }

  /* ================= 초기화 ================= */
  function init() {
    initFog();
    initGrain();
    initForm();
    initTarot();
    renderPriceList();

    $('#enterBtn').onclick = enter;
    $('#soundBtn').onclick = () => audio.toggle();
    $$('.tab').forEach(t => t.onclick = () => switchTab(t.dataset.tab));
    $('#calcBtn').onclick = calc;
    $('#resetBtn').onclick = resetForm;
    $('#unlockBtn').onclick = () => openPay('report');
    $('#goSaju').onclick = () => switchTab('saju');
    $('#payModal').onclick = (e) => { if (e.target.id === 'payModal') closePay(); };
    $('#printBtn').onclick = () => window.print();

    // URL 파라미터 복귀 처리(토스 successUrl)
    const q = new URLSearchParams(location.search);
    if (q.get('payment') === 'success') {
      toast('결제가 완료되었습니다. 명식을 조회하면 리포트가 열립니다.', 3200);
    } else if (q.get('payment') === 'fail') {
      toast('결제가 취소되었거나 실패했습니다.');
    }

    // 키보드 접근성: ESC 로 모달 닫기
    addEventListener('keydown', e => { if (e.key === 'Escape') closePay(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
