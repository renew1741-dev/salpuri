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
  const Gunghap = window.Gunghap;
  const GunghapText = window.GunghapText;
  const Plus = window.Plus;
  const PlusText = window.PlusText;
  const Gaewun = window.Gaewun;
  const GaewunText = window.GaewunText;
  const Naming = window.Naming;
  const NamingText = window.NamingText;
  const BabyText = window.BabyText;
  const Vault = window.Vault;

  const state = {
    gender: '여',
    cal: '양력',
    sijin: null,        // null = 모름
    analysis: null,
    analysisSig: '',
    tab: 'saju',
    tarot: { cat: 'love', picked: [], reading: [] },
    gg: { rel: 'some', touchedA: false, result: null,
      a: { gender: '여', cal: '양력' }, b: { gender: '남', cal: '양력' } },
    yearly: 2026,
    tk: { purpose: 'move', range: 'month' },
    gw: { height: null, weight: null, shown: false },
    nm: {
      mode: 'reform', model: null, analysis: null, built: false,
      baby: { gender: '여', year: 2026, month: 11, day: 25, sijin: null }
    },
    baby: { gender: '여', cal: '양력', sijin: null, note: '', analysis: null },
    last: {}
  };

  const toast = (msg, ms = 2200) => {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms);
  };

  /* ================= 점사(點沙) 의식 로딩 ================= */
  const SEAL_SVG = `<svg viewBox="0 0 120 120" class="ritual-seal-svg" aria-hidden="true">
    <defs>
      <linearGradient id="rgold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f6e3ad"/><stop offset="50%" stop-color="#c9a24d"/><stop offset="100%" stop-color="#f6e3ad"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="54" fill="none" stroke="url(#rgold)" stroke-width="0.8" opacity=".55"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="url(#rgold)" stroke-width="0.5" opacity=".3" stroke-dasharray="2 6"/>
    <g class="seal-trigrams" fill="none" stroke="url(#rgold)" stroke-width="1.4" opacity=".7">
      <path d="M60 10 L60 20 M54 12 L54 18 M66 12 L66 18"/>
      <path d="M110 60 L100 60 M108 54 L102 54 M108 66 L102 66"/>
      <path d="M60 110 L60 100 M54 108 L54 102 M66 108 L66 102"/>
      <path d="M10 60 L20 60 M12 54 L18 54 M12 66 L18 66"/>
    </g>
    <g class="seal-taiji">
      <path d="M60 34 a26 26 0 0 1 0 52 a13 13 0 0 1 0 -26 a13 13 0 0 0 0 -26Z" fill="#f6e3ad" opacity=".92"/>
      <circle cx="60" cy="47" r="4.2" fill="#0a0710"/>
      <circle cx="60" cy="73" r="4.2" fill="#f6e3ad"/>
    </g>
  </svg>`;

  /** host 안에 촛불·태극 인장 의식을 재생하고 끝나면 cb */
  function playRitual(host, lines, cb) {
    const el = typeof host === 'string' ? $(host) : host;
    if (!el) { cb && cb(); return; }
    el.innerHTML = `<div class="ritual">
      <div class="ritual-halo"></div>
      <div class="ritual-seal">${SEAL_SVG}</div>
      <div class="ritual-candle"><i class="flame"></i><i class="wick"></i><i class="wax"></i><span class="candle-glow"></span></div>
      <div class="ritual-line serif"></div>
      <div class="ritual-dots"><i></i><i></i><i></i></div>
    </div>`;
    el.classList.remove('out');
    el.classList.add('show');
    const lineEl = el.querySelector('.ritual-line');
    const step = 620;
    lines.forEach((t, i) => {
      setTimeout(() => {
        lineEl.classList.remove('in');
        void lineEl.offsetWidth;
        lineEl.textContent = t;
        lineEl.classList.add('in');
      }, i * step);
    });
    const total = lines.length * step + 140;
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => {
        el.classList.remove('show', 'out');
        el.innerHTML = '';
        cb && cb();
      }, 280);
    }, total);
  }

  const RITUAL_SAJU = [
    '천간과 지지의 기운을 짚어보는 중...',
    '입춘과 절기의 문턱에서 명식을 세우는 중...',
    '올해의 살(煞)과 복(福)을 가르는 중...'
  ];
  const RITUAL_TAROT = [
    '세 장의 카드가 당신의 이야기를 겹치는 중...',
    '과거의 뿌리에서 현재의 자리를 읽는 중...',
    '올해의 살(煞)과 복(福)을 가르는 중...'
  ];
  const RITUAL_GUNGHAP = [
    '두 사람의 여덟 글자를 한 장에 겹쳐 놓는 중...',
    '일간과 일지, 오행의 빈 곳을 맞대는 중...',
    '올해 두 사람 사이에 놓인 흐름을 짚는 중...'
  ];

  /* ================= 안개 · 입자 ================= */
  const fog = { burstAt: 0 };   // 입장 클릭 시 안개가 좌우로 흩어지는 시점
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
      // 구름 걷힘: 클릭 직후 1.6초 동안 좌우·바깥으로 빠르게 밀려나며 옅어진다
      const burst = fog.burstAt ? Math.max(0, 1 - (now - fog.burstAt) / 1600) : 0;
      const bk = burst * burst;
      for (const p of puffs) {
        let vx = p.vx, vy = p.vy, aMul = 1;
        if (burst > 0) {
          const dir = p.x >= W / 2 ? 1 : -1;
          vx += dir * 30 * bk;
          vy += (p.y >= H / 2 ? 1 : -1) * 4 * bk;
          aMul = 1 - 0.6 * burst;
        }
        p.x += vx * dt / 16; p.y += vy * dt / 16;
        if (p.x - p.r > W) p.x = -p.r;
        if (p.x + p.r < 0) p.x = W + p.r;
        if (p.y - p.r > H) p.y = -p.r;
        if (p.y + p.r < 0) p.y = H + p.r;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${p.hue},${p.a * aMul})`);
        g.addColorStop(.6, `rgba(${p.hue},${p.a * .35 * aMul})`);
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

  /* ================= 사운드 (audio/bgm.mp3 루프) ================= */
  const BGM_VOLUME = 0.55;
  const audio = {
    el: null, on: false, fade: null, tapCtx: null,
    init() {
      if (this.el) return this.el;
      const el = document.createElement('audio');
      el.id = 'bgm';
      el.src = 'audio/bgm.mp3';
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('playsinline', '');
      el.addEventListener('error', () => { /* 파일이 없어도 페이지 동작에는 영향 없음 */ });
      document.body.appendChild(el);
      this.el = el;
      return el;
    },
    fadeTo(target, ms) {
      const el = this.el;
      if (!el) return;
      clearInterval(this.fade);
      const from = el.volume, t0 = performance.now();
      const dur = Math.max(80, ms);
      this.fade = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        const e = k * k * (3 - 2 * k);   // smoothstep
        el.volume = Math.min(1, Math.max(0, from + (target - from) * e));
        if (k >= 1) clearInterval(this.fade);
      }, 40);
    },
    play() {
      const el = this.init();
      const p = el.play();
      if (p && p.catch) p.catch(() => {});   // 자동재생 차단은 조용히 무시
    },
    duck(on) {                                // 내레이션 동안 BGM 0.55 → 0.25
      if (!this.on && !on) return;
      this.fadeTo(on ? 0.25 : BGM_VOLUME, on ? 900 : 2000);
    },
    start() {
      const el = this.init();
      this.on = true;
      clearTimeout(el._pauseT);
      if (el.paused) { el.volume = 0; this.play(); }
      this.fadeTo(BGM_VOLUME, 3200);         // 0 -> 0.55 부드러운 페이드인
      this.ui(true);
    },
    toggle() {
      const el = this.init();
      this.on = !this.on;
      clearTimeout(el._pauseT);
      if (this.on) {
        if (el.paused) { el.volume = 0; this.play(); }
        this.fadeTo(BGM_VOLUME, 1400);
      } else {
        this.fadeTo(0, 700);
        el._pauseT = setTimeout(() => { if (!this.on && this.el) this.el.pause(); }, 780);
      }
      this.ui(this.on);
    },
    ui(on) {
      const btn = $('#soundBtn');
      if (!btn) return;
      btn.classList.toggle('off', !on);
      btn.setAttribute('aria-pressed', String(!!on));
      $('#soundLabel').textContent = on ? '몽환 사운드' : '소리 꺼짐';
    },
    tap() {                                   // UI 터치음 (BGM과 별개)
      if (!this.on) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = this.tapCtx || (this.tapCtx = new AC());
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(920, now);
        o.frequency.exponentialRampToValueAtTime(1380, now + 0.1);
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.34);
      } catch (e) { /* 무시 */ }
    }
  };

  /* ================= 히어로 3컷 스토리 ================= */
  const STORY = [
    { caption: '잠깐, 발걸음 좀 멈춰 보실래요? 요즘 유독 일이 어긋나고 마음이 무거우셨다면, 그건 그냥 우연이 아닐지도 몰라요.',
      src: 'audio/narration-1.mp3?v=2', dur: 11.9 },
    { caption: '타고난 여덟 글자와 올해의 기운, 그리고 당신이 고른 타로 한 장에, 그 답이 적혀 있거든요.',
      src: 'audio/narration-2.mp3?v=2', dur: 9.1 },
    { caption: '남들에게는 차마 말하지 못했던 고민의 실마리, 지금 이 촛불 아래에서 조용히 풀어드릴게요.',
      src: 'audio/narration-3.mp3?v=2', dur: 9.7 }
  ];
  const TAIL = 1500;                          // 내레이션 뒤 여운

  const story = {
    i: 0, cycle: 0, started: false, narrOn: false, timers: [], typer: null, players: [], imgs: [], dots: [],
    init() {
      this.imgs = $$('.hero-img');
      this.dots = $$('.hero-dot');
      this.line = $('#dialogue');
      this.players = STORY.map((s, k) => {
        const a = new Audio();
        a.preload = 'auto';
        a.src = s.src;
        a.addEventListener('loadedmetadata', () => { if (isFinite(a.duration) && a.duration > 0) STORY[k].dur = a.duration; });
        a.addEventListener('ended', () => this.onEnd());
        a.addEventListener('error', () => {});     // 파일이 없어도 페이지 동작에는 영향 없음
        return a;
      });
      this.dots.forEach(d => d.addEventListener('click', () => {
        audio.tap();
        this.cycle = 0;
        this.show(+d.dataset.cut, true);
      }));
    },
    start() {
      this.started = true;
      this.show(0, true);
    },
    show(n, speak) {
      this.clearTimers();
      this.stopNarr();
      clearInterval(this.typer);
      this.i = n;
      this.imgs.forEach((im, k) => im.classList.toggle('on', k === n));
      this.dots.forEach((d, k) => {
        d.classList.toggle('on', k === n);
        d.setAttribute('aria-selected', String(k === n));
      });
      this.line.classList.add('swap');
      this.after(320, () => {                     // 페이지를 넘기듯 자막 페이드 전환
        this.line.classList.remove('swap');
        this.type(STORY[n].caption);
      });
      const speaks = speak && audio.on;
      if (speaks) {
        this.playNarr(n);
        // 안전장치 — 내레이션을 절대 자르지 않도록 실제 길이 + 9초 뒤에만 넘어간다.
        // (정상 재생 시에는 'ended' 이벤트가 먼저 도착해 TAIL 여운 후 넘어간다)
        this.after((STORY[n].dur + 9) * 1000, () => this.next());
      } else {
        this.after((STORY[n].dur + 1.5) * 1000, () => this.next());
      }
    },
    playNarr(n) {
      const p = this.players[n];
      if (!p) return;
      try { p.currentTime = 0; } catch (e) {}
      const pr = p.play();
      if (pr && pr.catch) pr.catch(() => {
        // 자동재생 차단·파일 오류 시: 소리 없이 같은 길이만큼 기다린 뒤 넘어간다
        this.narrOn = false;
        audio.duck(false);
        this.after((STORY[n].dur + 1.5) * 1000, () => this.next());
      });
      this.narrOn = true;
      audio.duck(true);
    },
    onEnd() {
      this.narrOn = false;
      audio.duck(false);
      this.after(TAIL, () => this.next());
    },
    next() {
      const n = this.i + 1;
      if (n >= STORY.length) { this.cycle++; this.show(0, this.cycle === 0); }   // 한 바퀴 뒤엔 조용히
      else this.show(n, this.cycle === 0);
    },
    stopNarr() {
      if (this.narrOn) audio.duck(false);
      this.narrOn = false;
      this.players.forEach(p => { try { p.pause(); } catch (e) {} });
    },
    toggleSound() {                              // 사운드 토글과 스토리 동기화
      if (audio.on) {
        if (this.started) { this.clearTimers(); this.playNarr(this.i); this.after((STORY[this.i].dur + 9) * 1000, () => this.next()); }
      } else {
        this.stopNarr();
        if (this.started) this.after((STORY[this.i].dur + 1.5) * 1000, () => this.next());
      }
    },
    halt() {                                     // 다른 대사가 나오면 스토리 정지
      this.started = false;
      this.clearTimers();
      clearInterval(this.typer);
      this.stopNarr();
    },
    type(text) {
      const el = this.line;
      clearInterval(this.typer);
      el.textContent = '';
      let i = 0;
      this.typer = setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(this.typer);
      }, 40);
    },
    after(ms, fn) {
      const t = setTimeout(() => {
        this.timers = this.timers.filter(x => x !== t);
        fn();
      }, ms);
      this.timers.push(t);
    },
    clearTimers() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
    }
  };

  const typeDialogue = (text, speed = 55) => {
    const el = $('#dialogue');
    if (story.started) story.halt();
    el.innerHTML = '';
    let i = 0;
    clearInterval(el._t);
    el._t = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(el._t);
    }, speed);
  };

  /* ================= 입장 ================= */
  let enterScrollT = null;                    // 입장 직후 히어로로 되돌리는 타이머(탭을 누르면 취소)
  function enter() {
    const body = document.body;
    if (body.classList.contains('opened')) return;
    fog.burstAt = performance.now();          // 안개 입자가 좌우로 쫙 흩어진다
    body.classList.add('clearing');
    body.classList.add('opened');             // 구름 장막 분리 + 금박 커튼 걷힘
    body.classList.remove('locked');
    audio.start();                            // 0 -> 0.55 페이드인
    setTimeout(() => story.start(), 2000);    // BGM이 깔린 뒤 첫 컷 내레이션
    enterScrollT = setTimeout(() => $('#main').scrollIntoView({ block: 'start' }), 3000);
  }

  /* ================= 탭 ================= */
  function switchTab(id) {
    state.tab = id;
    if (enterScrollT) { clearTimeout(enterScrollT); enterScrollT = null; }
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + id));
    if (id === 'tarot') requestAnimationFrame(layoutFan);
    if (id === 'premium') renderPriceList();
    if (id === 'today') renderTodayPanel();
    if (id === 'sinsal') renderSinsalPanel();
    if (id === 'yearly') renderYearPanel();
    if (id === 'wealth') renderWealthPanel();
    if (id === 'taekil') renderTaekilPanel();
    if (id === 'gaewun') renderGaewunPanel();
    if (id === 'naming') renderNamingPanel();
    if (id === 'gunghap') { syncGunghapA(); renderProfileBars(); }
    if (id === 'baby') { state.baby.analysis && !$('#babyResult').children.length && renderBaby(); }
    const panel = document.getElementById('panel-' + id);
    if (panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const nav = $('.tabs'), tabEl = document.querySelector(`.tab[data-tab="${id}"]`);
    if (nav && tabEl && nav.scrollWidth > nav.clientWidth + 4) {
      nav.scrollTo({ left: Math.max(0, tabEl.offsetLeft - (nav.clientWidth - tabEl.offsetWidth) / 2), behavior: 'smooth' });
    }
    audio.tap();
  }

  /* ================= 입력 공유 · 명식 재사용 ================= */
  const pad2 = n => String(n).padStart(2, '0');

  function profileInput() {
    return {
      name: $('#userName').value.trim(),
      gender: state.gender,
      year: +$('#birthYear').value,
      month: +$('#birthMonth').value,
      day: +$('#birthDay').value,
      calendar: state.cal === '양력' ? '양력' : '음력',
      leap: state.cal === '음력윤달',
      sijin: state.sijin
    };
  }

  function ensureAnalysis() {
    const inp = profileInput();
    const sig = JSON.stringify(inp);
    if (state.analysis && state.analysisSig === sig) return state.analysis;
    if (state.cal === '음력윤달' && !leapMonthOf(inp.year)) return { error: '선택한 해에는 윤달이 없어요. 사주 탭에서 음력(평달)을 골라 주세요.' };
    const res = S.analyze(inp);
    if (res && res.ok) { state.analysis = res; state.analysisSig = sig; }
    return res;
  }

  function renderProfileBars() {
    $$('.pf-slot').forEach(slot => {
      const a = state.analysis;
      const inp = profileInput();
      const meta = a
        ? `${a.gender} · ${a.solar.y}.${pad2(a.solar.m)}.${pad2(a.solar.d)} ${a.calendar} · ${a.timeKnown ? a.sijinName : '시간 모름'}`
        : `${inp.gender} · ${inp.year}.${pad2(inp.month)}.${pad2(inp.day)} ${inp.calendar === '음력' ? (inp.leap ? '음력(윤달)' : '음력') : '양력'} · ${inp.sijin == null ? '시간 모름' : S.SIJIN[inp.sijin]}`;
      slot.innerHTML = `<div class="pf-bar">
        <span class="pf-seal serif">煞</span>
        <div class="pf-txt"><b>${a && a.name ? a.name + ' 님 · ' : ''}${meta}</b><small>사주 탭에서 넣은 명식으로 계산해요</small></div>
        <button type="button" class="pf-edit" data-goto="saju">변경</button>
      </div>`;
    });
  }

  function panelError(msg) {
    return `<div class="card"><p class="small">${msg || '명식을 계산하지 못했어요.'}</p>
      <div class="center mt14"><button class="btn-ghost" data-goto="saju">사주 명식 입력하기</button></div></div>`;
  }

  function getAnalysis(host) {
    const res = ensureAnalysis();
    if (!res || res.error || !res.ok) { host.innerHTML = panelError(res && res.error); return null; }
    renderProfileBars();
    return res;
  }

  function renderTodayPanel() {
    const host = $('#todayBody');
    if (!host) return;
    const a = getAnalysis(host); if (!a) return;
    const x = Plus.today(a);
    state.last.today = x;
    host.innerHTML = PlusText.renderToday(x, a);
  }

  function renderSinsalPanel() {
    const host = $('#sinsalBody');
    if (!host) return;
    const a = getAnalysis(host); if (!a) return;
    const x = Plus.sinsal(a);
    state.last.sinsal = x;
    host.innerHTML = PlusText.renderSinsal(x, a);
  }

  function renderYearPanel() {
    const host = $('#yearlyBody');
    if (!host) return;
    const a = getAnalysis(host); if (!a) return;
    const x = Plus.yearly(a, state.yearly);
    state.last.yearly = x;
    host.innerHTML = PlusText.renderYear(x, a, state.yearly);
  }

  function renderWealthPanel() {
    const host = $('#wealthBody');
    if (!host) return;
    const a = getAnalysis(host); if (!a) return;
    const x = Plus.wealth(a);
    state.last.wealth = x;
    host.innerHTML = PlusText.renderWealth(x, a);
  }

  function renderTaekilPanel() {
    const host = $('#taekilBody');
    if (!host) return;
    const a = getAnalysis(host); if (!a) return;
    const x = Plus.taekil(a, state.tk.purpose, state.tk.range);
    state.last.taekil = { x, a };
    host.innerHTML = PlusText.renderTaekil(x, a);
  }

  /* ================= 개운 처방 ================= */
  function readGw() {
    const h = $('#gwHeight'), w = $('#gwWeight');
    state.gw.height = h && h.value !== '' ? +h.value : null;
    state.gw.weight = w && w.value !== '' ? +w.value : null;
  }

  function renderGaewunPanel() {
    const host = $('#gaewunBody');
    if (!host) return;
    const a = getAnalysis(host); if (!a) return;
    readGw();
    const x = Gaewun.build(a, { height: state.gw.height, weight: state.gw.weight });
    state.last.gaewun = { x, a };
    host.innerHTML = GaewunText.renderFree(x, a) + Vault.wrap(GaewunText.renderDeep(x, a), 'gaewun', { h: 520 });
    Vault.apply();
    state.gw.shown = true;
  }

  function softRenderGaewun() {
    if (!state.gw.shown) return;
    const host = $('#gaewunBody');
    if (!host || !host.children.length) return;
    const a = state.analysis;
    if (!a) return;
    readGw();
    const x = Gaewun.build(a, { height: state.gw.height, weight: state.gw.weight });
    state.last.gaewun = { x, a };
    host.innerHTML = GaewunText.renderFree(x, a) + Vault.wrap(GaewunText.renderDeep(x, a), 'gaewun', { h: 520 });
    Vault.apply();
  }

  /* ================= 개명 · 아기 작명 ================= */
  function kstToday() {
    const d = new Date(Date.now() + 9 * 3600e3);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }

  function nmDays(y, m) { return new Date(y, m, 0).getDate(); }

  function nmSyncDay() {
    const y = +$('#nmYear').value, m = +$('#nmMonth').value;
    const dSel = $('#nmDay');
    const cur = +dSel.value || 1;
    const max = nmDays(y, m);
    dSel.innerHTML = '';
    for (let d = 1; d <= max; d++) dSel.add(new Option(d + '일', d));
    dSel.value = Math.min(cur, max);
  }

  function namingPrice() {
    const p = P.PRODUCTS.naming || { price: 29000, listPrice: 39000 };
    return { sale: p.price, list: p.listPrice || p.price };
  }

  function initNamingForm() {
    const ySel = $('#nmYear');
    if (!ySel) return;
    const t = kstToday();
    const mSel = $('#nmMonth'), dSel = $('#nmDay'), tSel = $('#nmTime');
    for (let y = 2027; y >= 1950; y--) ySel.add(new Option(y + '년', y));
    for (let m = 1; m <= 12; m++) mSel.add(new Option(m + '월', m));
    ySel.value = t.y; mSel.value = t.m;
    nmSyncDay();
    dSel.value = t.d;
    tSel.innerHTML = '';
    tSel.add(new Option('시간 모름', ''));
    S.SIJIN.forEach((n, i) => tSel.add(new Option(`${n} · ${S.SIJIN_RANGE[i]}`, i)));
    state.nm.baby.year = t.y; state.nm.baby.month = t.m; state.nm.baby.day = t.d;

    $$('#nmModeSeg .seg-btn').forEach(b => b.onclick = () => {
      state.nm.mode = b.dataset.v;
      $$('#nmModeSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
      syncNamingMode();
    });
    $$('#nmBabyGender .seg-btn').forEach(b => b.onclick = () => {
      state.nm.baby.gender = b.dataset.v;
      $$('#nmBabyGender .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
      softNaming();
    });
    [ySel, mSel].forEach(s => s.onchange = () => { nmSyncDay(); softNaming(); });
    [dSel, tSel].forEach(s => s.onchange = () => softNaming());
    ['nmSurname', 'nmGiven'].forEach(id => {
      const el2 = document.getElementById(id);
      if (!el2) return;
      el2.addEventListener('input', () => {
        clearTimeout(el2._nmt);
        el2._nmt = setTimeout(softNaming, 520);
      });
      el2.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runNaming(true); } });
    });
    $('#nmCalcBtn').onclick = () => { audio.tap(); runNaming(true); };

    /* 오픈 특가 문구 — 상품 가격과 한 곳에서 관리 */
    const pr = namingPrice();
    const btn = $('#nmCalcBtn');
    if (btn) btn.dataset.price = pr.sale;
    syncNamingMode();
  }

  function syncNamingMode() {
    const baby = state.nm.mode === 'baby';
    const rf = $('#nmReformFields'), bf = $('#nmBabyFields'), gw = $('#nmGivenWrap');
    if (rf) rf.classList.toggle('hidden', baby);
    if (bf) bf.classList.toggle('hidden', !baby);
    if (gw) gw.classList.toggle('hidden', baby);
    const btn = $('#nmCalcBtn');
    if (btn) btn.textContent = baby ? '이 사주에 맞는 이름 5선 받기' : '이름 진단서 펼쳐보기';
    renderProfileBars();
    softNaming();
  }

  function readNamingInput() {
    return {
      mode: state.nm.mode,
      surname: (($('#nmSurname') || {}).value || '').trim(),
      given: (($('#nmGiven') || {}).value || '').trim(),
      gender: state.nm.mode === 'baby' ? state.nm.baby.gender : state.gender,
      baby: {
        year: +($('#nmYear') || {}).value, month: +($('#nmMonth') || {}).value,
        day: +($('#nmDay') || {}).value,
        sijin: ($('#nmTime') && $('#nmTime').value !== '') ? +$('#nmTime').value : null
      }
    };
  }

  function namingAnalysis(inp) {
    if (inp.mode !== 'baby') return ensureAnalysis();
    const b = inp.baby;
    const res = S.analyze({
      name: '', gender: inp.gender, year: b.year, month: b.month, day: b.day,
      calendar: '양력', leap: false, sijin: b.sijin
    });
    if (!res || res.error) return res;
    res.future = res.ts > Date.now();
    return res;
  }

  function runNaming(scroll) {
    const host = $('#nmResult');
    if (!host) return;
    const inp = readNamingInput();
    if (inp.mode !== 'baby') {
      /* 사주 탭을 먼저 돌리지 않았어도 지금 입력된 기본 명식으로 바로 진단한다 */
      const base = ensureAnalysis();
      if (!base || base.error || !base.ok) { host.innerHTML = panelError(base && base.error); return; }
    }
    if (!inp.surname) {
      toast('성씨를 먼저 입력해 주세요. (예: 김)');
      if ($('#nmSurname')) $('#nmSurname').focus();
      return;
    }
    const res = namingAnalysis(inp);
    if (!res || res.error || !res.ok) { host.innerHTML = panelError(res && res.error); return; }
    const model = Naming.build(res, {
      mode: inp.mode, surname: inp.surname, given: inp.given, gender: inp.gender
    });
    if (!model || model.error) { host.innerHTML = panelError(model && model.error); return; }
    state.nm.model = model;
    state.nm.analysis = res;
    state.nm.built = true;
    host.innerHTML = NamingText.render(model, res, { unlocked: P.has('naming'), price: namingPrice() });
    mountLikes();
    if (scroll) setTimeout(() => host.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function softNaming() {
    if (!state.nm.built) return;
    const inp = readNamingInput();
    if (!inp.surname) return;
    if (inp.mode === 'reform' && !inp.given && state.nm.model && state.nm.model.hasName) return;
    runNaming(false);
  }

  function renderNamingPanel() {
    const host = $('#nmResult');
    if (!host) return;
    /* 사주 탭에 이름을 넣어 두었다면 성/이름을 나눠 미리 채운다 */
    const a = state.analysis;
    if (a && a.name && $('#nmSurname') && !$('#nmSurname').value && !$('#nmGiven').value) {
      const chars = [...a.name.trim()];
      if (chars.length >= 2) {
        $('#nmSurname').value = chars[0];
        $('#nmGiven').value = chars.slice(1).join('');
      }
    }
    renderProfileBars();
    if (state.nm.built && state.nm.model) runNaming(false);
    else if (!host.innerHTML.trim()) {
      host.innerHTML = `<div class="card"><p class="small">성씨와 현재 이름(또는 아기 생년월일)을 넣고 <b>이름 진단서</b>를 펼쳐 보세요. 진단은 무료이고, 사주에 맞춘 이름 후보 5선은 오픈 특가로 열려요.</p></div>`;
    }
  }

  async function namingDemo() {
    if (P.has('naming')) { runNaming(true); return; }
    if (P.CONFIG.provider !== 'demo') { openPay('naming'); return; }
    const res = await P.pay('naming', { name: (state.nm.analysis && state.nm.analysis.name) || '', phone: '' });
    if (res && res.ok) {
      toast('데모 결제로 후보 5선을 열었어요.');
      runNaming(true);
    } else {
      toast((res && res.error) || '열지 못했어요.');
    }
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
      hint.textContent = '1940년 ~ 2026년 출생 지원 · 양력 그대로 계산해요.';
    } else {
      const lp = leapMonthOf(y);
      let t = `${y}년 음력은 ${lp ? '윤' + lp + '월' : '윤달 없음'} · 그 달에 실제로 있는 날짜만 고를 수 있어요.`;
      if (state.cal === '음력윤달' && lp) t += ` (윤${lp}월 1일 ~ ${daysInMonth(y, lp)}일)`;
      if (state.cal === '음력윤달' && !lp) t = `${y}년에는 윤달이 없어요. 다른 해를 고르거나 음력(평달)을 골라 주세요.`;
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
      toast('선택한 해에는 윤달이 없어요. 음력(평달)을 골라 주세요.');
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
    state.analysisSig = JSON.stringify({
      name, gender: state.gender, year: y, month: m, day: d,
      calendar: state.cal === '양력' ? '양력' : '음력', leap: state.cal === '음력윤달', sijin: state.sijin
    });

    $('#formCard').classList.add('hidden');
    $('#resultPanel').classList.remove('show');
    $('#resultPanel').classList.remove('reveal');
    audio.tap();
    playRitual('#ritualOverlay', RITUAL_SAJU, () => {
      state.analysis = res;
      renderResult(res);
      $('#resultPanel').classList.add('show');
      void $('#resultPanel').offsetWidth;
      $('#resultPanel').classList.add('reveal');
      const label = name ? `${name} 님` : '당신';
      typeDialogue(`${label}의 사주에는 ${S.ELEM_KO[res.yongsin.yong]}(${S.ELEM_HANJA[res.yongsin.yong]})의 기운이 약(藥)으로 쓰이는구나. 아래에서 확인해 보세요.`);
      const top = $('#resultPanel');
      top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (P.unlocked().size) renderReport(res);
      renderPriceList();
    });
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
          <div class="stage"><em>${p.stageName || ''}</em><span>${S.STAGE_HANJA[p.stage] || ''}</span></div>
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

    // 격국 · 십성 지도
    renderTenGodMap(a);

    // 맛보기(무료) + 잠금 구간 심층
    $('#freeReading').innerHTML = TX.buildTaste(a);
    const deepHost = $('#deepReading');
    if (deepHost) deepHost.innerHTML = TX.buildDeep(a);
    const snap = $('#gwSnapshot');
    if (snap) {
      try {
        const gx = Gaewun.build(a, {});
        snap.innerHTML = `<div class="baby-kv">
          <div><span>적정 체중</span><b>${GaewunText.kgTxt(gx.body.kg.lo)}~${GaewunText.kgTxt(gx.body.kg.hi)}kg <span style="color:#9c9488">(${gx.body.type.name} · ${gx.body.type.sub})</span></b></div>
          <div><span>살릴 점</span><b>${gx.dots.good.slice(0, 3).map(z => `${z.name}(${z.point})`).join(' · ')}</b></div>
          <div><span>뺄 점</span><b>${gx.dots.bad.slice(0, 3).map(z => `${z.name}(${z.point})`).join(' · ')}</b></div>
          <div><span>말버릇</span><b>“${(gx.speech.habits[0] || {}).bad || ''}” 대신 “${(gx.speech.habits[0] || {}).good || ''}”</b></div>
        </div>`;
      } catch (e) { snap.innerHTML = '<p class="small">개운 처방을 계산하지 못했어요. 외모·점 탭에서 다시 확인해 주세요.</p>'; }
    }
    window.__salpuriAnalysis = a;

    // 세운
    const s = a.saeun[0];
    $('#saeunGanji').innerHTML = `${S.GAN[s.gan]}${S.JI[s.ji]}<small>${s.year} ${S.GAN_KO[s.gan]}${S.JI_KO[s.ji]}년</small>`;
    const advice = s.tenGod <= 1 ? '내 힘으로 밀어붙이기보다 사람과 판을 정리하는 해예요.'
      : s.tenGod <= 3 ? '만들고 표현하는 일이 성과로 이어지는데, 말이 앞서면 계약에서 손해를 봐요.'
        : s.tenGod <= 5 ? '돈이 실제로 움직이는 해예요. 들어오고 나가는 돈을 같은 달에 정리해 보세요.'
          : s.tenGod <= 7 ? '책임과 압박이 늘지만 그 자리가 다음 10년의 몫을 만들어요.'
            : '배움과 재정비에 맞는 해예요. 자격·문서·공부를 챙기면 내년의 발판이 돼요.';
    $('#saeunText').innerHTML = `<b style="color:#f6e3ad">${s.tenGodName}</b>의 기운이 들어오는 해예요. ${advice}` +
      (s.inter.length ? `<br><span style="color:#e2a35e">원국과 ${[...new Set(s.inter.map(i => i.type))].join('·')}${/합$|충$/.test([...new Set(s.inter.map(i => i.type))].pop()) ? '이' : '가'} 잡혀서 변화가 큰 해예요.</span>` : '') +
      `<br>다음 해 ${a.saeun[1].year}년은 ${S.GAN[a.saeun[1].gan]}${S.JI[a.saeun[1].ji]}년 · ${a.saeun[1].tenGodName}이에요.`;

    // 2026 월별 — 잡을 달 · 피할 달
    const ms = TX.monthly2026(a);
    const good = TX.bestMonths(ms, 2), bad = TX.worstMonths(ms, 2);
    const monEl = $('#saeunMonths');
    if (monEl) {
      monEl.innerHTML = `<div class="mon-good"><span class="mk">잡아야 할 달</span>` +
        good.map(m => `<span class="mchip">${m.start} ${m.name}<b>${S.GAN[m.gan]}${S.JI[m.ji]}</b></span>`).join('') + `</div>` +
        `<div class="mon-bad"><span class="mk">피할 달</span>` +
        bad.map(m => `<span class="mchip">${m.start} ${m.name}<b>${S.GAN[m.gan]}${S.JI[m.ji]}</b></span>`).join('') + `</div>`;
    }

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
      `(절입까지 ${a.daewoon.days}일 ÷ 3) · ${a.gender}성 ${S.GAN_KO[a.yearPillar.gan]}${S.JI_KO[a.yearPillar.ji]}년생`;

    renderTalismans();
    if (Vault) Vault.apply();
  }

  function renderTenGodMap(a) {
    const host = $('#tgMap');
    if (!host) return;
    const groupOf = g => g <= 1 ? 'self' : g <= 3 ? 'output' : g <= 5 ? 'wealth' : g <= 7 ? 'officer' : 'resource';
    const gp = { self: 0, output: 0, wealth: 0, officer: 0, resource: 0 };
    const cnt = new Array(10).fill(0);
    a.pillars.forEach(p => {
      if (!p || p.gan == null) return;
      if (p.ganTenGod != null) { gp[groupOf(p.ganTenGod)] += 1.2; cnt[p.ganTenGod] += 1.2; }
      if (p.jiTenGod != null) { gp[groupOf(p.jiTenGod)] += 1; cnt[p.jiTenGod] += 1; }
    });
    const max = Math.max(1, ...Object.values(gp));
    const rows = [['비겁', 'self', '나를 세우는 힘'], ['식상', 'output', '만들어내는 힘'], ['재성', 'wealth', '재물을 다루는 힘'], ['관성', 'officer', '책임과 자리'], ['인성', 'resource', '배움과 후원']];
    const top = cnt.map((v, i) => ({ v, i })).filter(x => x.v > 0).sort((x, y) => y.v - x.v).slice(0, 3);
    host.innerHTML = `<div class="gk-line"><span class="gk-badge serif">${a.gyeokguk.hanja}</span>
      <div><b class="serif">${a.gyeokguk.name}</b><span>${a.gyeokguk.gist}</span></div></div>` +
      rows.map(([nm, key, desc]) => `<div class="tg-row"><span class="nm">${nm}<small>${desc}</small></span>
        <div class="tg-track"><i style="width:${Math.round(gp[key] / max * 100)}%"></i></div>
        <span class="v">${Math.round(gp[key] * 10) / 10}</span></div>`).join('') +
      `<div class="tg-chips">${top.map(t => `<span class="tg-chip">${S.TEN_GODS[t.i]}<em>${S.TEN_GODS_HANJA[t.i]}</em></span>`).join('')}</div>`;
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

  /* ================= 궁합 ================= */
  function buildGunghapForm() {
    ['A', 'B'].forEach(W => {
      const ySel = $('#gg' + W + 'Year'), mSel = $('#gg' + W + 'Month'), tSel = $('#ggTime' + W);
      for (let y = 2026; y >= 1940; y--) {
        const o = new Option(y + '년', y);
        if (y === 2000) o.selected = true;
        ySel.add(o);
      }
      for (let m = 1; m <= 12; m++) mSel.add(new Option(m + '월', m));
      mSel.value = 1;
      syncGGDays(W);
      tSel.add(new Option('모름 · 시간 미상', ''));
      S.SIJIN.forEach((n, i) => tSel.add(new Option(`${n} ${S.SIJIN_RANGE[i]}`, i)));
      tSel.value = '';

      $$('#ggGender' + W + ' .seg-btn').forEach(b => b.onclick = () => {
        state.gg[W.toLowerCase()].gender = b.dataset.v;
        $$('#ggGender' + W + ' .seg-btn').forEach(x => x.classList.toggle('active', x === b));
        if (W === 'A') state.gg.touchedA = true;
        audio.tap();
      });
      $$('#ggCal' + W + ' .seg-btn').forEach(b => b.onclick = () => {
        state.gg[W.toLowerCase()].cal = b.dataset.v;
        $$('#ggCal' + W + ' .seg-btn').forEach(x => x.classList.toggle('active', x === b));
        if (W === 'A') state.gg.touchedA = true;
        syncGGDays(W);
        audio.tap();
      });
      ['Year', 'Month'].forEach(k => $('#gg' + W + k).addEventListener('change', () => {
        if (W === 'A') state.gg.touchedA = true;
        syncGGDays(W);
      }));
      $('#ggName' + W).addEventListener('change', () => { if (W === 'A') state.gg.touchedA = true; });
      $('#gg' + W + 'Day').addEventListener('change', () => { if (W === 'A') state.gg.touchedA = true; });
      $('#ggTime' + W).addEventListener('change', () => { if (W === 'A') state.gg.touchedA = true; });
    });
  }

  function syncGGDays(W) {
    const cal = state.gg[W.toLowerCase()].cal;
    const y = +$('#gg' + W + 'Year').value, m = +$('#gg' + W + 'Month').value;
    const dSel = $('#gg' + W + 'Day');
    if (!dSel) return;
    const cur = +dSel.value || 1;
    let max;
    if (cal === '양력') max = new Date(y, m, 0).getDate();
    else {
      const leap = cal === '음력윤달';
      const probe = dd => !!S.lunarToSolar(y, m, dd, leap);
      max = probe(1) ? (probe(30) ? 30 : 29) : 0;
    }
    const limit = max || 30;
    dSel.innerHTML = '';
    for (let d = 1; d <= limit; d++) dSel.add(new Option(d + '일', d));
    dSel.value = Math.min(cur, limit);
  }

  function syncGunghapA() {
    if (state.gg.touchedA) return;
    const g = state.gg.a;
    g.gender = state.gender;
    g.cal = state.cal;
    $('#ggNameA').value = $('#userName').value.trim();
    $$('#ggGenderA .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.v === state.gender));
    $$('#ggCalA .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.v === state.cal));
    $('#ggAYear').value = $('#birthYear').value;
    $('#ggAMonth').value = $('#birthMonth').value;
    syncGGDays('A');
    $('#ggADay').value = $('#birthDay').value;
    $('#ggTimeA').value = state.sijin == null ? '' : String(state.sijin);
  }

  function ggInput(W) {
    const g = state.gg[W.toLowerCase()];
    const t = $('#ggTime' + W).value;
    const year = +$('#gg' + W + 'Year').value, month = +$('#gg' + W + 'Month').value, day = +$('#gg' + W + 'Day').value;
    if (g.cal === '음력윤달' && !leapMonthOf(year)) {
      toast((W === 'A' ? '본인' : '상대') + ': 선택한 해에는 윤달이 없어요. 음력(평달)을 골라 주세요.');
      return null;
    }
    return {
      name: $('#ggName' + W).value.trim(), gender: g.gender,
      year, month, day,
      calendar: g.cal === '양력' ? '양력' : '음력',
      leap: g.cal === '음력윤달',
      sijin: t === '' ? null : +t
    };
  }

  function calcGunghap() {
    const aIn = ggInput('A'), bIn = ggInput('B');
    if (!aIn || !bIn) return;
    const A = S.analyze(aIn), B = S.analyze(bIn);
    if (A.error) { toast('본인: ' + A.error); return; }
    if (B.error) { toast('상대: ' + B.error); return; }
    audio.tap();
    $('#ggFormCard').classList.add('hidden');
    $('#ggResult').innerHTML = '';
    playRitual('#ritualOverlay', RITUAL_GUNGHAP, () => {
      const x = Gunghap.analyze(A, B, state.gg.rel);
      state.gg.result = x;
      const host = $('#ggResult');
      host.innerHTML = GunghapText.render(x);
      host.classList.remove('reveal');
      void host.offsetWidth;
      host.classList.add('reveal');
      typeDialogue(`두 사람의 여덟 글자를 겹쳐 보니 ${x.score}점 — ${x.grade}. 화면에서 확인해 보세요.`);
      bindGunghapResult();
      host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function bindGunghapResult() {
    const s = $('#shareGunghap');
    if (s) s.onclick = () => {
      const x = state.gg.result;
      if (!x) return;
      shareSite(GunghapText.shareText(x));
    };
    const r = $('#ggReset');
    if (r) r.onclick = () => {
      $('#ggResult').innerHTML = '';
      $('#ggFormCard').classList.remove('hidden');
      typeDialogue('또 누구와의 인연이 궁금하신가요?');
      $('#ggFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
      audio.tap();
    };
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
    const cards = $$('#deckFan .fan-card').filter(c => !c.classList.contains('picked'));
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

  function flyCardToSlot(fromEl, slot, done) {
    const r1 = fromEl.getBoundingClientRect();
    const r2 = slot.getBoundingClientRect();
    if (!r1.width || !r2.width) { done && done(); return; }
    const flyer = document.createElement('div');
    flyer.className = 'fly-card';
    flyer.innerHTML = T.cardBack();
    flyer.style.cssText = `left:${r1.left}px;top:${r1.top}px;width:${r1.width}px;height:${r1.height}px`;
    document.body.appendChild(flyer);
    const dx = (r2.left + r2.width / 2) - (r1.left + r1.width / 2);
    const dy = (r2.top + r2.height / 2) - (r1.top + r1.height / 2);
    const sc = r2.width / r1.width;
    const anim = flyer.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 0 },
      { transform: `translate(${dx * .5}px, ${dy * .5 - 48}px) scale(${(sc + 1) / 2}) rotate(-9deg)`, offset: .5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(0deg)`, offset: 1 }
    ], { duration: 620, easing: 'cubic-bezier(.22,.8,.28,1)' });
    const finish = () => { flyer.remove(); done && done(); };
    if (anim.finished) anim.finished.then(finish).catch(finish); else setTimeout(finish, 660);
  }

  function slotBurst(slot) {
    const b = document.createElement('span');
    b.className = 'slot-burst';
    slot.appendChild(b);
    setTimeout(() => b.remove(), 1100);
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
    requestAnimationFrame(() => layoutFan());   // 남은 카드가 자리를 메운다

    const slot = $(`.slot-card[data-slot="${slotIdx}"]`);
    slot.classList.remove('empty', 'flipped');
    slot.querySelector('.face.front').innerHTML = `
      <div class="numeral">${card.numeral}</div>
      <div class="art-wrap">${T.ART[card.n]}</div>
      <div class="cname">${card.name}</div>
      <div class="cen">${card.en}</div>
      <div class="rev-mark">逆</div>`;
    if (rev) slot.classList.add('reversed');

    flyCardToSlot(el, slot, () => {
      slot.classList.add('flipped');
      slotBurst(slot);
    });

    const left = 3 - state.tarot.picked.length;
    $('#deckHint').textContent = left > 0 ? `카드 ${3 - left + 1}장째 · ${left}장 더 고르세요` : '세 장이 다 놓였어요 — 점사를 풀어낼게요';
    if (left === 0) setTimeout(() => revealReading(), 900);
  }

  /** 카드가 다 놓인 뒤 — 의식 로딩 후 해석 */
  function revealReading() {
    if (state.tarot.picked.length < 3) return;
    $('#readingBox').innerHTML = '';
    $('#readSummary').classList.add('hidden');
    playRitual('#ritualOverlay', RITUAL_TAROT, () => {
      renderReading();
      const box = $('#readingBox');
      box.classList.remove('unfold');
      void box.offsetWidth;
      box.classList.add('unfold');
    });
  }

  function renderReading() {
    const { picked, cat } = state.tarot;
    if (picked.length < 3) return;
    const catObj = T.CATEGORIES.find(c => c.id === cat);
    const box = $('#readingBox');
    box.innerHTML = `<div class="reading-head">
      <span class="rh-cat">${catObj.icon} ${catObj.name}</span>
      <p class="rh-frame">${catObj.frame}</p>
    </div>` + picked.map((p, i) => {
      const pos = T.POSITIONS[i];
      const frame = T.FRAME[cat][pos.id];
      const txt = p.rev ? p.card.rev : p.card.up;
      const bridge = i > 0 ? T.bridgeSentence(picked[i - 1], p) : '';
      return `<div class="read-item" style="--i:${i}">
        <div class="ri-head"><span class="ri-pos">${pos.name} · ${pos.desc}</span><span class="dir ${p.rev ? 'rev' : 'up'}">${p.rev ? '역방향 逆' : '정방향 正'}</span></div>
        <h4 class="serif">${p.card.name}<span class="ri-en">${p.card.en}</span></h4>
        <p class="ri-frame">${frame}</p>
        ${bridge ? `<p class="ri-bridge">${bridge}</p>` : ''}
        <p class="ri-main">${txt}</p>
        ${p.card.deep ? `<p class="ri-deep">${p.card.deep}</p>` : ''}
        <p class="ri-cat">${catObj.icon} ${p.card.cat[cat]}</p>
        <div class="ri-act"><b>이 카드가 권하는 것</b>${p.card.act}</div>
      </div>`;
    }).join('');

    const [a, b, c] = picked;
    const revCount = picked.filter(p => p.rev).length;
    const strong = picked.map(p => ({ p, w: (p.rev ? 0.65 : 1) + p.card.n / 60 })).sort((x, y) => y.w - x.w)[0].p;
    const sum = $('#readSummary');
    sum.innerHTML = `<div class="sum-eyebrow serif">세 장의 이야기</div>
      <p class="sum-lead">과거의 <strong>${a.card.name}</strong>, 현재의 <strong>${b.card.name}</strong>, 미래의 <strong>${c.card.name}</strong>. ` +
      `세 장을 겹쳐 놓으면 이 질문의 답은 <strong>${strong.card.name}</strong>에서 가장 크게 울립니다.</p>
      <p>${T.REV_NOTE[revCount]}</p>
      <p>${catObj.synth}</p>
      <p class="sum-strong">가장 힘이 실린 카드는 <strong>${strong.card.name}</strong> — ${strong.card.key}예요. ${strong.card.cat[cat]}</p>
      <div class="sum-act"><b>${catObj.icon} 지금 할 일</b>${catObj.act}</div>
      <p class="sum-note">타로는 정해진 미래가 아니라 지금 흐름을 비추는 거울이에요. 결정은 언제나 당신 몫이에요.</p>`;
    sum.classList.remove('hidden');
    const sr = $('#shareTarotRow'); if (sr) sr.classList.remove('hidden');
    sum.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetTarot() {
    state.tarot.picked = [];
    $('#readingBox').innerHTML = '';
    $('#readingBox').classList.remove('unfold');
    $('#readSummary').classList.add('hidden');
    const sr = $('#shareTarotRow'); if (sr) sr.classList.add('hidden');
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

  /* ================= 부적 갤러리 ================= */
  const TALISMANS = [
    { id: 'wealth', hanja: '財', name: '재물운', sub: '돈의 통로를 여는 부적',
      file: 'talisman-wealth.png', thumb: 'talisman-wealth-thumb.jpg', elems: [3],
      desc: '금빛 인장과 엽전, 흐르는 금가루. 들어오는 돈을 붙잡고 새는 구멍을 막는 기운이에요.' },
    { id: 'love', hanja: '緣', name: '인연운', sub: '끊어진 실을 잇는 부적',
      file: 'talisman-love.png', thumb: 'talisman-love-thumb.jpg', elems: [1],
      desc: '붉은 실과 금빛 고리, 달빛 아래 꽃잎. 인연이 닿는 방향을 열어 주는 기운이에요.' },
    { id: 'ward', hanja: '解', name: '액막이 · 살풀이', sub: '들어온 살을 풀어내는 부적',
      file: 'talisman-ward.png', thumb: 'talisman-ward-thumb.jpg', elems: [2, 4],
      desc: '금빛 나침환과 소금·재, 깃털. 몸과 집에 들어온 액을 씻어내는 기운이에요.' },
    { id: 'career', hanja: '昇', name: '성공 · 합격운', sub: '오르는 길을 여는 부적',
      file: 'talisman-career.png', thumb: 'talisman-career-thumb.jpg', elems: [0],
      desc: '달빛 아래 솟은 봉우리와 두 마리 학. 자리와 이름이 올라가는 기운이에요.' }
  ];

  const hasTalisman = () => P.has('talisman') || P.has('vip') || (Vault && Vault.isOpen());

  function renderTalismans() {
    const hosts = ['#talismanGrid', '#talismanGridVault'].map(h => $(h)).filter(Boolean);
    if (!hosts.length) return;
    const a = state.analysis;
    const yong = a ? a.yongsin.yong : null;
    const own = hasTalisman();
    const html = TALISMANS.map(t => {
      const fit = a && t.elems.includes(yong);
      return `<figure class="tal-item ${fit ? 'fit' : ''}" data-tal="${t.id}">
        <div class="tal-img">
          <img src="${t.thumb}" alt="${t.name} 부적 배경화면 미리보기" loading="lazy" decoding="async" />
          ${fit ? '<span class="tal-fit">이 명식에 맞음</span>' : ''}
          <span class="tal-zoom">미리보기</span>
        </div>
        <figcaption>
          <div class="tal-title"><b class="serif">${t.name}</b><em>${t.hanja}</em></div>
          <span class="tal-sub">${t.sub}</span>
          <span class="tal-state ${own ? 'on' : ''}">${own ? '내려받기 가능' : '구매 후 다운로드'}</span>
        </figcaption>
      </figure>`;
    }).join('');
    hosts.forEach(host => { host.innerHTML = html; });
    $$('[data-tal]').forEach(f => f.onclick = () => openTalView(f.dataset.tal));
  }

  function openTalView(id) {
    const t = TALISMANS.find(x => x.id === id);
    if (!t) return;
    const view = $('#talView');
    if (!view) return;
    const own = hasTalisman();
    view.querySelector('.tal-view-img').src = t.file;
    view.querySelector('.tal-view-img').alt = `${t.name} 부적 배경화면 1080×1920`;
    view.querySelector('.tv-meta').innerHTML =
      `<b class="serif">${t.name} <em>${t.hanja}</em></b><span>${t.desc}</span>
       <small>1080 × 1920 PNG · 스마트폰 배경화면 비율(9:16)</small>`;
    view.querySelector('.tv-actions').innerHTML = own
      ? `<a class="btn-gold tal-dl" href="${t.file}" download="살풀이-천기-부적-${t.name}.png">배경화면 내려받기</a>
         <button class="btn-ghost" id="tvAll">4종 모두 받기</button>`
      : `<button class="btn-gold" id="tvBuy">부적 4종 열기 · 14,900원</button>
         <span class="tv-note">결제하면 4종 전부 바로 내려받을 수 있어요.</span>`;
    view.classList.add('show');
    document.body.classList.add('tal-open');
    audio.tap();
    if (own) {
      const all = $('#tvAll');
      if (all) all.onclick = () => {
        TALISMANS.forEach((x, i) => setTimeout(() => {
          const a = document.createElement('a');
          a.href = x.file; a.download = `살풀이-천기-부적-${x.name}.png`;
          document.body.appendChild(a); a.click(); a.remove();
        }, i * 320));
        toast('부적 4종 다운로드를 시작했어요.');
      };
    } else {
      const buy = $('#tvBuy');
      if (buy) buy.onclick = () => { closeTalView(); openPay('talisman'); };
    }
  }

  function closeTalView() {
    const view = $('#talView');
    if (!view) return;
    view.classList.remove('show');
    document.body.classList.remove('tal-open');
  }

  /* ================= 🔥 소름 돋아요 (실시간 공감) ================= */
  /* 정직한 카운터 — 실제 방문자가 누른 숫자만 올라갑니다.
     1) 외부 무료 카운터(abacus.jasoncameron.dev, CORS 허용)로 전체 방문자 공유 숫자
     2) 통신이 막히면 localStorage에만 기록하는 폴백
     3) 한 브라우저당 1회 클릭 (localStorage 플래그) */
  const Like = {
    API: 'https://abacus.jasoncameron.dev',
    NS: 'salpuri-cheongi',
    KEY: 'sooreum-v2',
    LS_DONE: 'salpuri_like_done_v2',
    LS_CACHE: 'salpuri_like_cache_v2',
    count: null, loaded: false, busy: false, offline: false,
    done() { try { return localStorage.getItem(this.LS_DONE) === '1'; } catch (e) { return false; } },
    cached() { try { return +(localStorage.getItem(this.LS_CACHE) || 0) || 0; } catch (e) { return 0; } },
    set(n) {
      this.count = n;
      try { localStorage.setItem(this.LS_CACHE, String(n)); } catch (e) {}
      this.paint();
    },
    async refresh() {
      try {
        const r = await fetch(`${this.API}/get/${this.NS}/${this.KEY}`, { cache: 'no-store' });
        if (r.status === 404) { this.loaded = true; this.offline = false; this.set(this.count == null ? 0 : this.count); return; }
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        if (typeof j.value === 'number') { this.loaded = true; this.offline = false; this.set(j.value); return; }
        throw new Error('bad payload');
      } catch (e) {
        this.offline = true;
        if (this.count == null) this.set(this.cached());
      }
    },
    async up() {
      if (this.done()) { toast('이미 소름 돋으셨어요. 한 사람당 한 번이에요.'); return; }
      if (this.busy) return;
      this.busy = true;
      document.querySelectorAll('.like-btn, .like-top-btn').forEach(b => b.classList.add('pulse'));
      let ok = false;
      try {
        const r = await fetch(`${this.API}/hit/${this.NS}/${this.KEY}`, { cache: 'no-store' });
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        if (typeof j.value !== 'number') throw new Error('bad payload');
        this.set(j.value);
        this.offline = false;
        ok = true;
      } catch (e) {
        this.offline = true;
        this.set((this.count == null ? this.cached() : this.count) + 1);
      }
      try { localStorage.setItem(this.LS_DONE, '1'); } catch (e) {}
      this.busy = false;
      this.paint();
      toast(ok ? '🔥 소름 돋아요 — 한 표 남겼어요.' : '집계 서버가 잠시 응답하지 않아 이 기기에만 기록했어요.');
      setTimeout(() => document.querySelectorAll('.like-btn, .like-top-btn').forEach(b => b.classList.remove('pulse')), 900);
    },
    paint() {
      const done = this.done();
      const known = this.count != null;
      const txt = known ? this.count.toLocaleString('ko-KR') : '—';
      document.querySelectorAll('.like-num').forEach(n => { n.textContent = txt; });
      /* 결과 맨 마지막 버튼 — 🔥 소름 돋아요 · N */
      document.querySelectorAll('.like-btn').forEach(b => {
        b.classList.toggle('liked', done);
        const hideNum = known && this.count === 0;
        const n = b.querySelector('.like-num'), sep = b.querySelector('.like-sep');
        if (n) n.style.display = hideNum ? 'none' : '';
        if (sep) sep.style.display = hideNum ? 'none' : '';
        const t = b.querySelector('.like-txt');
        if (t) t.textContent = done ? '소름 돋았어요' : '소름 돋아요';
        b.setAttribute('aria-label', `소름 돋아요 — 실제 방문자 ${known ? txt : '확인 중'}명`);
      });
      /* 상단 고정 배지 — 지금까지 N명이 소름 돋아요 */
      document.querySelectorAll('.like-top-btn').forEach(b => {
        b.classList.toggle('liked', done);
        const zero = known && this.count === 0;
        const num = b.querySelector('.like-num');
        if (num) num.style.display = zero ? 'none' : '';
        const lead = b.querySelector('.like-lead'), tail = b.querySelector('.like-tail');
        if (lead && tail) {
          if (!known) { lead.textContent = '지금까지'; tail.textContent = ' 소름 돋아요'; }
          else if (zero) {
            lead.textContent = done ? '첫 번째로' : '아직 아무도';
            tail.textContent = done ? ' 소름 돋았어요' : ' 안 눌렀어요 · 첫 번째로 눌러 보세요';
          } else if (done) { lead.textContent = '나까지'; tail.textContent = '명이 소름 돋았어요'; }
          else { lead.textContent = '지금까지'; tail.textContent = '명이 소름 돋아요'; }
        }
        b.setAttribute('aria-label', `소름 돋아요 — 실제 방문자 ${known ? txt : '확인 중'}명`);
      });
    }
  };

  function likeHTML() {
    return `<button type="button" class="like-btn" data-like="1" aria-label="소름 돋아요 — 실제 방문자 수">
      <span class="like-fire" aria-hidden="true">🔥</span>
      <span class="like-txt">소름 돋아요</span>
      <span class="like-sep" aria-hidden="true">·</span>
      <b class="like-num">—</b>
    </button>`;
  }

  let likeLoading = false;
  function mountLikes() {
    let added = false;
    $$('.pl-share-row').forEach(row => {
      if (row.querySelector('.like-btn')) return;
      const wrap = document.createElement('div');
      wrap.className = 'like-row';
      wrap.innerHTML = likeHTML();
      row.appendChild(wrap);
      added = true;
    });
    ['#shareTarot', '#shareGunghap'].forEach(sel => {
      const btn = $(sel);
      if (!btn || !btn.parentNode) return;
      if (btn.parentNode.querySelector('.like-btn')) return;
      const wrap = document.createElement('span');
      wrap.className = 'like-inline';
      wrap.innerHTML = likeHTML();
      btn.parentNode.insertBefore(wrap, btn.nextSibling);
      added = true;
    });
    if (added) {
      Like.paint();
      if (!Like.loaded && !likeLoading) {
        likeLoading = true;
        Like.refresh().then(() => { likeLoading = false; });
      }
    }
    /* 상단 배지는 결과와 무관하게 항상 떠 있으므로 여기서도 숫자를 맞춘다 */
    Like.paint();
    if (!Like.loaded && !likeLoading) {
      likeLoading = true;
      Like.refresh().then(() => { likeLoading = false; });
    }
  }

  function watchLikes() {
    const main = $('#main');
    if (!main || !window.MutationObserver) return;
    let t = null;
    const obs = new MutationObserver(() => {
      if (t) return;
      t = setTimeout(() => { t = null; mountLikes(); }, 140);
    });
    obs.observe(main, { childList: true, subtree: true });
  }

  /* ================= 공유 ================= */
  async function shareSite(text) {
    const url = location.origin + location.pathname;
    const title = '살풀이 : 천기 — 정밀 만세력 · 신비 타로';
    const payload = { title, text, url };
    try {
      if (navigator.share) { await navigator.share(payload); return; }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const copy = async () => {
      const body = `${text}\n${url}`;
      try {
        await navigator.clipboard.writeText(body);
        toast('링크를 복사했어요. 붙여넣기로 공유해 보세요.');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = body;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        ta.remove();
        toast('링크를 복사했어요. 붙여넣기로 공유해 보세요.');
      }
    };
    copy();
  }

  function shareSaju() {
    const a = state.analysis;
    if (!a) { toast('사주 명식을 먼저 펼쳐 주세요.'); switchTab('saju'); return; }
    const dp = a.pillars.find(p => p.pos === '일');
    shareSite(`${a.name ? a.name + ' 님의' : '내'} 사주 명식 — ${S.GAN[dp.gan]}${S.JI[dp.ji]}일주 · ${a.gyeokguk.name} · 용신 ${S.ELEM_KO[a.yongsin.yong]}. 살풀이 : 천기에서 풀어봤어요.`);
  }

  function shareTarot() {
    const p = state.tarot.picked;
    if (p.length < 3) { toast('카드 세 장을 먼저 뽑아 주세요.'); switchTab('tarot'); return; }
    shareSite(`오늘의 타로 — 과거 ${p[0].card.name} · 현재 ${p[1].card.name} · 미래 ${p[2].card.name}. 살풀이 : 천기에서 뽑아봤어요.`);
  }

  function shareExtended(kind) {
    if (kind === 'saju') { shareSaju(); return; }
    const a = state.analysis;
    if (!a) { toast('명식을 먼저 조회해 주세요.'); switchTab('saju'); return; }
    if (kind === 'today') {
      const x = state.last.today || Plus.today(a);
      shareSite(`오늘의 일진 ${x.ganji.label} — ${x.score}점(${x.grade}). 행운의 방향은 ${x.luck.dir}, 색은 ${x.luck.color}. 살풀이 : 천기에서 봤어요.`);
    } else if (kind === 'sinsal') {
      const x = state.last.sinsal || Plus.sinsal(a);
      const names = x.items.slice(0, 3).map(i => i.name).join(' · ');
      shareSite(`내 사주의 살과 귀인 — ${names || '중립적인 명식'}. 살풀이 : 천기에서 풀어봤어요.`);
    } else if (kind === 'year') {
      const x = state.last.yearly || Plus.yearly(a, state.yearly);
      shareSite(`${x.year} ${x.ganji}년 — ${x.theme}. 잡을 달 ${x.best[0].start} ${x.best[0].name}, 피할 달 ${x.worst[0].start} ${x.worst[0].name}. 살풀이 : 천기.`);
    } else if (kind === 'wealth') {
      const x = state.last.wealth || Plus.wealth(a);
      shareSite(`내 돈의 그릇 — 사업·프리랜서 ${x.biz}%, 직장·조직 ${x.job}%. 살풀이 : 천기에서 봤어요.`);
    } else if (kind === 'taekil') {
      const last = state.last.taekil;
      if (!last) return;
      const t = last.x.top[0];
      shareSite(`${last.x.purpose.name} 길일 — ${t.m}/${t.d} (${t.wd}) ${t.ganji}일 ${t.score}점(${t.grade}). 살풀이 : 천기에서 골랐어요.`);
    } else if (kind === 'gaewun') {
      const last = state.last.gaewun;
      if (!last) { toast('개운 처방을 먼저 펼쳐 주세요.'); switchTab('gaewun'); return; }
      shareSite(GaewunText.shareText(last.x, last.a));
    } else if (kind === 'naming') {
      if (!state.nm.model) { toast('이름 진단서를 먼저 펼쳐 주세요.'); switchTab('naming'); return; }
      shareSite(NamingText.shareText(state.nm.model));
    }
  }

  /* ================= 상품 · 결제 ================= */
  function renderPriceList() {
    const un = P.unlocked();
    $('#priceList').innerHTML = ['report', 'talisman', 'vip'].map(id => {
      const p = P.PRODUCTS[id];
      const owned = p.unlock.every(k => un.has(k));
      const priceHTML = p.listPrice
        ? `<span class="num"><s>${p.listPrice.toLocaleString()}원</s> ${p.price.toLocaleString()}원</span>`
        : `<span class="num">${p.price.toLocaleString()}원</span>`;
      return `<div class="price-item ${id === 'vip' ? 'featured' : ''} ${owned ? 'owned' : ''}">
        <div class="info">
          <span class="tagline">${p.badge}</span>
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
        </div>
        <div class="price">
          ${priceHTML}
          <button data-buy="${id}">${owned ? '결제 완료' : '구매하기'}</button>
        </div>
      </div>`;
    }).join('');
    $$('#priceList [data-buy]').forEach(b => b.onclick = () => openPay(b.dataset.buy));
  }

  function openPay(productId) {
    const prod = P.PRODUCTS[productId];
    if (!prod) return;
    const un = P.unlocked();
    if (prod.unlock.every(k => un.has(k))) { toast('이미 결제하신 상품이에요.'); return; }
    if (productId !== 'talisman' && productId !== 'naming' && !state.analysis) {
      toast('사주 명식을 먼저 조회해 주세요.');
      switchTab('saju');
      $('#formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    state.payProduct = productId;
    const provider = P.CONFIG.provider;
    const demo = provider === 'demo';
    const box = $('#payModalBox');
    const methodNote = provider === 'transfer'
      ? '아래 계좌로 입금하시면 확인 후 열립니다.'
      : provider === 'ctee' ? '크티 결제 페이지로 이동해요.'
        : demo ? '지금은 테스트 모드예요. 실제 금액은 청구되지 않고, 결제 시연 후 바로 열려요.'
          : '결제창에서 결제를 완료하시면 이 화면으로 돌아와 열립니다.';
    const transfer = P.CONFIG.transfer;
    box.innerHTML = `
      <div class="modal-head">
        <h3 class="serif">${prod.name}</h3>
        <button class="modal-x" id="mClose" aria-label="닫기">✕</button>
      </div>
      <div class="modal-prod">${prod.desc}${demo ? '<span class="demo-badge">테스트 결제</span>' : ''}</div>
      ${provider === 'ctee' ? '' : `
      <div class="field">
        <label class="field-label" for="payName">성함</label>
        <input class="inp" id="payName" type="text" value="${state.analysis ? (state.analysis.name || '') : ''}" placeholder="홍길동" />
      </div>
      <div class="field">
        <label class="field-label" for="payContact">연락처 <b>리포트·부적 안내</b></label>
        <input class="inp" id="payContact" type="tel" placeholder="010-0000-0000" value="" />
      </div>`}
      ${provider === 'transfer' ? `
      <div class="deposit-box">
        <div class="dep-row"><span>입금 계좌</span><b>${transfer.bank} ${transfer.account}</b></div>
        <div class="dep-row"><span>예금주</span><b>${transfer.holder}</b></div>
        <div class="dep-row"><span>입금 금액</span><b>${prod.price.toLocaleString()}원</b></div>
        <div class="dep-row"><span>입금자명</span><b id="depNameView">-</b></div>
        <p class="dep-note">입금자명을 성함과 같게 넣고, ${transfer.minutes}분 안에 입금해 주세요. 확인되면 열람 권한이 열려요.</p>
      </div>` : ''}
      <div class="pay-sum"><span>결제 금액 (VAT 포함)</span><b>${prod.price.toLocaleString()}원</b></div>
      <button class="btn-gold" id="payGo">${provider === 'transfer' ? '입금했어요' : provider === 'ctee' ? '구매 페이지로 이동' : `${prod.price.toLocaleString()}원 결제하기`}</button>
      <div class="pay-note">${methodNote}</div>`;
    const mClose = $('#mClose'); if (mClose) mClose.onclick = closePay;
    const payGo = $('#payGo'); if (payGo) payGo.onclick = () => doPay(productId);
    const payName = $('#payName');
    const depView = $('#depNameView');
    if (payName && depView) payName.addEventListener('input', () => { depView.textContent = payName.value.trim() || '-'; });
    $('#payModal').classList.add('show');
    audio.tap();
  }

  function closePay() {
    $('#payModal').classList.remove('show');
  }

  async function doPay(productId) {
    const btn = $('#payGo');
    const nameEl = $('#payName');
    const contactEl = $('#payContact');
    const contact = contactEl ? contactEl.value.trim() : '';
    if (contactEl && !contact) { toast('연락처를 입력해 주세요.'); contactEl.focus(); return; }
    btn.disabled = true;
    btn.textContent = '확인하는 중…';
    const res = await P.pay(productId, { name: nameEl ? nameEl.value.trim() : '', phone: contact });

    if (!res.ok) {
      toast(res.error || '결제가 완료되지 않았어요.');
      btn.disabled = false;
      btn.textContent = '다시 시도';
      return;
    }
    const box = $('#payModalBox');

    if (res.external) {
      box.innerHTML = `
        <div class="pay-step">
          <div class="done-icon">↗</div>
          <div class="big">결제 페이지가 열렸어요</div>
          <p>새 창에서 결제를 완료하시면<br>주문 확인 후 이 화면의 상품이 열립니다.<br>
          <b style="color:#f6e3ad">주문번호 ${res.order.orderId}</b></p>
          <button class="btn-ghost mt20" id="payDone">닫기</button>
        </div>`;
      $('#payDone').onclick = closePay;
      return;
    }

    if (res.pending) {
      const t = res.transfer;
      box.innerHTML = `
        <div class="pay-step">
          <div class="done-icon">₩</div>
          <div class="big">입금을 기다리고 있어요</div>
          <p><b style="color:#f6e3ad">${t.bank} ${t.account}</b><br>예금주 ${t.holder} · ${res.order.amount.toLocaleString()}원<br>
          주문번호 <b style="color:#f6e3ad">${res.order.orderId}</b></p>
          <p class="small mt14">입금자명과 위 주문번호를 판매자에게 알려 주시면 확인 후 열립니다.</p>
          ${P.CONFIG.transfer.confirmCode ? `
          <div class="field" style="text-align:left;margin-top:16px">
            <label class="field-label" for="confirmCode">입금 확인 코드</label>
            <input class="inp" id="confirmCode" type="text" inputmode="numeric" placeholder="안내받은 코드" />
          </div>
          <button class="btn-gold" id="confirmGo">확인 코드로 열기</button>` : ''}
          <button class="btn-ghost mt14" id="payDone">닫기</button>
        </div>`;
      const cg = $('#confirmGo');
      if (cg) cg.onclick = () => {
        const r = P.confirmTransfer(res.order.orderId, $('#confirmCode').value);
        if (!r.ok) { toast(r.error); return; }
        finishPaid(res.order.productId, r.order, false);
      };
      const pd = $('#payDone'); if (pd) pd.onclick = closePay;
      renderPriceList();
      return;
    }

    finishPaid(productId, res.order, !!res.demo);
  }

  function finishPaid(productId, order, demo) {
    const box = $('#payModalBox');
    if (productId === 'naming') {
      box.innerHTML = `
        <div class="pay-step">
          <div class="done-icon">✓</div>
          <div class="big">이름 후보 5선이 열렸어요</div>
          <p>주문번호 <b style="color:#f6e3ad">${order.orderId}</b><br>
          ${P.PRODUCTS[productId].name}${demo ? '<br><span class="demo-badge">테스트 결제</span>' : ''}</p>
          <button class="btn-gold mt20" id="payDone" style="max-width:260px;margin:20px auto 0">후보 5선 보기</button>
        </div>`;
      $('#payDone').onclick = () => { closePay(); switchTab('naming'); runNaming(true); };
      renderPriceList();
      return;
    }
    const ownTalisman = P.has('talisman');
    box.innerHTML = `
      <div class="pay-step">
        <div class="done-icon">✓</div>
        <div class="big">결제가 완료됐어요</div>
        <p>주문번호 <b style="color:#f6e3ad">${order.orderId}</b><br>
        ${P.PRODUCTS[productId].name}${demo ? '<br><span class="demo-badge">테스트 결제</span>' : ''}</p>
        <button class="btn-gold mt20" id="payDone" style="max-width:240px;margin:20px auto 0">${ownTalisman ? '부적 · 리포트 열기' : '리포트 열기'}</button>
      </div>`;
    $('#payDone').onclick = () => {
      closePay();
      switchTab('premium');
      renderReport(state.analysis);
      renderTalismans();
      setTimeout(() => $('#reportCard').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    };
    renderPriceList();
    renderTalismans();
    if (P.has('report') && state.analysis) renderReport(state.analysis);
    const un = $('#unlockBtn');
    if (un) {
      un.textContent = P.has('report') ? '프리미엄 리포트 열람하기 (결제 완료)' : '정밀 리포트 열기 (9,900원)';
      un.onclick = () => { if (P.has('report')) switchTab('premium'); else openPay('report'); };
    }
  }

  function renderReport(a) {
    if (!a) return;
    if (!P.has('report') && !P.has('vip') && !(Vault && Vault.isOpen())) {
      $('#reportLocked').classList.remove('hidden');
      $('#reportBody').classList.add('hidden');
      $('#printRow').classList.add('hidden');
      return;
    }
    $('#reportLocked').classList.add('hidden');
    $('#reportBody').classList.remove('hidden');
    $('#printRow').classList.remove('hidden');
    $('#reportBody').innerHTML = TX.buildPremium(a);
  }

  /* ================= 👶 아이 사주 ================= */
  const RITUAL_BABY = [
    '아이의 첫 울음 시각까지 살펴보는 중...',
    '엄마 아빠 품에 처음 안긴 날의 기운을 짚는 중...',
    '이 아이가 크면서 펼칠 재주를 그려 보는 중...'
  ];

  function babySyncDay() {
    const y = +$('#babyYear').value, m = +$('#babyMonth').value;
    const dSel = $('#babyDay');
    if (!dSel) return;
    const cur = +dSel.value || 1;
    const max = new Date(y, m, 0).getDate();
    dSel.innerHTML = '';
    for (let d = 1; d <= max; d++) dSel.add(new Option(d + '일', d));
    dSel.value = Math.min(cur, max);
  }

  function initBabyForm() {
    const ySel = $('#babyYear');
    if (!ySel) return;
    const t = kstToday();
    const mSel = $('#babyMonth'), dSel = $('#babyDay'), tSel = $('#babyTime');
    for (let y = 2026; y >= 1940; y--) ySel.add(new Option(y + '년', y));
    for (let m = 1; m <= 12; m++) mSel.add(new Option(m + '월', m));
    ySel.value = Math.max(1940, t.y - 2);
    mSel.value = t.m;
    babySyncDay();
    dSel.value = t.d;
    tSel.innerHTML = '';
    tSel.add(new Option('시간 모름 · 세 기둥으로 봐요', ''));
    S.SIJIN.forEach((n, i) => tSel.add(new Option(`${n} · ${S.SIJIN_RANGE[i]}`, i)));

    $$('#babyGenderSeg .seg-btn').forEach(b => b.onclick = () => {
      state.baby.gender = b.dataset.v;
      $$('#babyGenderSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
    });
    $$('#babyCalSeg .seg-btn').forEach(b => b.onclick = () => {
      state.baby.cal = b.dataset.v;
      $$('#babyCalSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
    });
    $$('#babyChips .baby-chip').forEach(c => c.onclick = () => {
      state.baby.note = c.dataset.v || '';
      $$('#babyChips .baby-chip').forEach(x => x.classList.toggle('on', x === c));
      audio.tap();
      if (state.baby.analysis) renderBaby();
    });
    [ySel, mSel].forEach(el2 => el2.onchange = babySyncDay);
    const cb = $('#babyCalcBtn');
    if (cb) cb.onclick = calcBaby;
  }

  function calcBaby() {
    const name = ($('#babyName').value || '').trim();
    const y = +$('#babyYear').value, m = +$('#babyMonth').value, d = +$('#babyDay').value;
    const tRaw = $('#babyTime').value;
    const sijin = tRaw === '' ? null : +tRaw;
    if (state.baby.cal === '음력윤달' && !leapMonthOf(y)) {
      toast('선택한 해에는 윤달이 없어요. 음력(평달)을 골라 주세요.');
      return;
    }
    const res = S.analyze({
      name, gender: state.baby.gender, year: y, month: m, day: d,
      calendar: state.baby.cal === '양력' ? '양력' : '음력',
      leap: state.baby.cal === '음력윤달', sijin
    });
    if (!res || res.error) { toast((res && res.error) || '사주를 계산하지 못했어요.'); return; }
    if (res.ts > Date.now() + 86400e3) res.future = true;
    state.baby.analysis = res;
    window.__salpuriBaby = res;
    audio.tap();
    playRitual('#ritualOverlay', RITUAL_BABY, () => {
      renderBaby();
      const host = $('#babyResult');
      if (host) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderBaby() {
    const host = $('#babyResult');
    const a = state.baby.analysis;
    if (!host || !a) return;
    const name = a.name || '우리 아이';
    const o = { name: a.name || '', note: state.baby.note };
    const ij = TX.iljuOf(a);
    const t = BabyText.TALENT[a.dayGan];
    const sub = `양력 ${a.solar.y}.${pad2(a.solar.m)}.${pad2(a.solar.d)} · ${a.lunar ? `음력 ${a.lunar.y}.${pad2(a.lunar.m)}.${pad2(a.lunar.d)}${a.lunar.leap ? '(윤)' : ''} · ` : ''}${a.timeKnown ? a.sijinName : '시간 모름'} · ${a.gender === '여' ? '여아' : '남아'}`;
    host.innerHTML = `
      <div class="card baby-taste-card">
        <div class="result-title">
          <div class="result-brand serif">살풀이 : 천기(天機) · 아이 사주</div>
          <h2 class="serif">${name}의 사주</h2>
          <p>${sub}</p>
        </div>
        <div class="pillar-grid" id="babyPillars"></div>
        <div class="baby-hero-tag">
          <span>${ij.t}</span><span>${t.t}</span><span>${a.gyeokguk.name}</span>
        </div>
        <div class="hr-gold"></div>
        <div class="free-read" id="babyTaste">${BabyText.taste(a, o)}</div>
        <div class="taste-next"><i></i><b>아래로 내리면 재능·건강·양육 처방이 이어져요</b><i></i></div>
      </div>
      ${Vault.wrap(BabyText.deep(a, o), 'baby', { h: 560 })}
      <div class="card">
        <div class="naming-link">
          <span class="up-ico" style="flex:0 0 44px;width:44px;height:44px;font-size:20px">📜</span>
          <span class="nl-txt">
            <b>${name}에게 맞는 이름, 같이 볼까요?</b>
            <span>지금 넣은 생년월일 그대로 이름 다섯 개를 뽑아 드려요. 사주에 약이 되는 글자로만 골라요.</span>
          </span>
          <button type="button" class="btn-gold" data-baby-naming>아기 작명 5선 보기</button>
        </div>
        <div class="center mt14"><button class="btn-ghost" data-goto="saju">부모님 사주도 보기</button></div>
      </div>`;

    /* 기둥 4개 */
    const grid = $('#babyPillars');
    if (grid) {
      grid.innerHTML = a.pillars.map(p => {
        const posName = { 년: '년주', 월: '월주', 일: '일주', 시: '시주' }[p.pos];
        if (p.gan == null) return `<div class="pillar unknown"><div class="p-label"><em>${posName}</em></div><div class="gan">—</div><div class="ji">—</div><div class="han">시간 미상</div></div>`;
        const eG = S.GAN_ELEM[p.gan], eJ = S.JI_ELEM[p.ji];
        return `<div class="pillar${p.pos === '일' ? ' is-day' : ''}">
          <div class="p-label"><em>${posName}</em></div>
          <span class="elem-dot" style="background:var(${elemVar[eG]})"></span>
          <div class="gan serif" style="color:var(${elemVar[eG]})">${S.GAN[p.gan]}</div>
          <div class="han">${S.GAN_KO[p.gan]} · ${S.ELEM_HANJA[eG]}</div>
          <div class="ji serif" style="color:var(${elemVar[eJ]})">${S.JI[p.ji]}</div>
          <div class="han">${S.JI_KO[p.ji]} · ${S.ELEM_HANJA[eJ]}</div>
        </div>`;
      }).join('');
    }
    const bn = host.querySelector('[data-baby-naming]');
    if (bn) bn.onclick = () => gotoBabyNaming(a);
    Vault.apply();
    mountLikes && mountLikes();
  }

  function gotoBabyNaming(a) {
    state.nm.mode = 'baby';
    $$('#nmModeSeg .seg-btn').forEach(x => x.classList.toggle('active', x.dataset.v === 'baby'));
    state.nm.baby.gender = a.gender;
    const gsel = $$('#nmBabyGender .seg-btn');
    gsel.forEach(x => x.classList.toggle('active', x.dataset.v === a.gender));
    if ($('#nmYear')) {
      $('#nmYear').value = a.solar.y;
      $('#nmMonth').value = a.solar.m;
      nmSyncDay();
      $('#nmDay').value = a.solar.d;
      $('#nmTime').value = a.sijin == null ? '' : String(a.sijin);
    }
    /* 아이 이름이 '김서준'처럼 성+이름이면 성씨를 미리 채워 둔다 */
    if (a.name && $('#nmSurname') && !$('#nmSurname').value) {
      const chars = [...a.name.trim()];
      if (chars.length >= 3) { $('#nmSurname').value = chars[0]; }
    }
    switchTab('naming');
    syncNamingMode();
    if ($('#nmSurname') && $('#nmSurname').value) runNaming(true);
    else toast('성씨만 넣으면 아이 사주에 맞는 이름 5선이 나와요.', 3000);
  }

  /* ================= 초기화 ================= */
  function init() {
    initFog();
    initGrain();
    audio.init();          // BGM 미리 버퍼링(재생은 입장 클릭 때)
    story.init();          // 히어로 3컷 내레이션 프리로드
    initForm();
    initNamingForm();
    initTarot();
    watchLikes();
    mountLikes();
    buildGunghapForm();
    renderProfileBars();
    renderPriceList();
    renderTalismans();
    initBabyForm();

    /* 잠금 카드 주입 + 상태 반영 */
    $$('[data-vault]').forEach(v => {
      const lk = v.querySelector('.vault-lock');
      const kind = v.getAttribute('data-vault') || 'saju';
      if (lk && !lk.querySelector('.vault-lock-in')) lk.outerHTML = Vault.lockHTML(kind);
    });
    Vault.apply();
    window.__salpuriOnUnlock = () => {
      renderTalismans();
      if (state.analysis) renderReport(state.analysis);
      if (state.baby.analysis) renderBaby();
    };

    $('#enterBtn').onclick = enter;
    $('#soundBtn').onclick = () => { audio.toggle(); story.toggleSound(); };
    $$('.tab').forEach(t => t.onclick = () => switchTab(t.dataset.tab));
    $('#calcBtn').onclick = calc;
    const rst = $('#resetBtn'); if (rst) rst.onclick = resetForm;
    const ubEl = $('#unlockBtn');
    if (ubEl) ubEl.onclick = () => { if (P.has('report')) switchTab('premium'); else openPay('report'); };
    $('#goSaju').onclick = () => switchTab('saju');
    $('#payModal').onclick = (e) => { if (e.target.id === 'payModal') closePay(); };
    $('#printBtn').onclick = () => window.print();
    const vpdf = $('#vaultPdfBtn');
    if (vpdf) vpdf.onclick = () => {
      if (!Vault.isOpen()) { toast('공유하면 8쪽 리포트가 바로 열려요. 위 버튼을 눌러 주세요.'); return; }
      if (!state.analysis) { toast('명식을 먼저 조회해 주세요.'); return; }
      renderReport(state.analysis);
      switchTab('premium');
      toast('아래 [PDF로 저장 / 인쇄]를 누르면 8쪽 리포트가 저장돼요.', 3200);
      setTimeout(() => { const b = $('#printBtn'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 320);
    };

    // 공유
    const shareTop = $('#shareTop'), shareFoot = $('#shareFoot');
    if (shareTop) shareTop.onclick = () => shareSite('살풀이 : 천기 — 촛불 아래에서 내 명(命)을 풀어봤어요.');
    if (shareFoot) shareFoot.onclick = () => shareSite('살풀이 : 천기 — 촛불 아래에서 내 명(命)을 풀어봤어요.');
    const sSaju = $('#shareSaju'), sTarot = $('#shareTarot');
    if (sSaju) sSaju.onclick = shareSaju;
    if (sTarot) sTarot.onclick = shareTarot;
    const gcb = $('#ggCalcBtn');
    if (gcb) gcb.onclick = calcGunghap;
    $$('#ggRelSeg .seg-btn').forEach(b => b.onclick = () => {
      state.gg.rel = b.dataset.v;
      $$('#ggRelSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
    });
    $$('#yrSeg .seg-btn').forEach(b => b.onclick = () => {
      state.yearly = +b.dataset.v;
      $$('#yrSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
      renderYearPanel();
    });
    $$('#tkPurposeSeg .seg-btn').forEach(b => b.onclick = () => {
      state.tk.purpose = b.dataset.v;
      $$('#tkPurposeSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
      renderTaekilPanel();
    });
    $$('#tkRangeSeg .seg-btn').forEach(b => b.onclick = () => {
      state.tk.range = b.dataset.v;
      $$('#tkRangeSeg .seg-btn').forEach(x => x.classList.toggle('active', x === b));
      audio.tap();
      renderTaekilPanel();
    });
    const tkb = $('#tkCalcBtn');
    if (tkb) tkb.onclick = () => { audio.tap(); renderTaekilPanel(); };

    /* 개운 처방 */
    const gwb = $('#gwCalcBtn');
    if (gwb) gwb.onclick = () => {
      audio.tap();
      renderGaewunPanel();
      const t = $('#gaewunBody');
      if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    ['gwHeight', 'gwWeight'].forEach(id => {
      const el2 = document.getElementById(id);
      if (!el2) return;
      el2.addEventListener('input', () => {
        clearTimeout(el2._gwt);
        el2._gwt = setTimeout(softRenderGaewun, 420);
      });
      el2.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); renderGaewunPanel(); } });
    });

    /* 확장 메뉴 공유 · 메뉴 이동 */
    document.addEventListener('click', e => {
      const sh = e.target.closest && e.target.closest('[data-share]');
      if (sh) { shareExtended(sh.dataset.share); return; }
      const go = e.target.closest && e.target.closest('[data-goto]');
      if (go) {
        const id = go.dataset.goto;
        switchTab(id);
        if (id === 'saju') setTimeout(() => { const f = $('#formCard'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 320);
      }
      const like = e.target.closest && e.target.closest('.like-btn, .like-top-btn');
      if (like) { e.preventDefault(); Like.up(); return; }
      const buyV = e.target.closest && e.target.closest('[data-vault-buy]');
      if (buyV) { audio.tap(); openPay(buyV.getAttribute('data-vault-buy') || 'report'); return; }
      const buyNm = e.target.closest && e.target.closest('[data-nm-buy]');
      if (buyNm) { audio.tap(); openPay('naming'); return; }
      const demoNm = e.target.closest && e.target.closest('[data-nm-demo]');
      if (demoNm) { audio.tap(); namingDemo(); return; }
    });

    // 부적 라이트박스
    const view = $('#talView');
    if (view) {
      view.addEventListener('click', e => {
        if (e.target === view || e.target.classList.contains('tal-close')) closeTalView();
      });
      const x = view.querySelector('.tal-close');
      if (x) x.onclick = closeTalView;
    }

    // URL 파라미터 복귀 처리(토스 successUrl)
    const q = new URLSearchParams(location.search);
    if (q.get('payment') === 'success') {
      toast('결제가 완료됐어요. 명식을 조회하면 리포트가 열려요.', 3200);
    } else if (q.get('payment') === 'fail') {
      toast('결제가 취소됐거나 실패했어요.');
    }

    // 키보드 접근성: ESC 로 모달 닫기
    addEventListener('keydown', e => {
      if (e.key === 'Escape') { closePay(); closeTalView(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
