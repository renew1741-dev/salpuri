/* ============================================================
   살풀이 : 천기 — 잠금 해제(공유 해금) 퍼널 v3
   ------------------------------------------------------------
   · 맛보기 아래의 핵심 풀이를 블러 + 자물쇠로 가립니다.
   · [친구에게 공유하고 무료로 열기] → OS 공유창 → 즉시 잠금 해제
   · OS 공유창이 없거나·안 뜨거나·무응답(pending)이면
     → 인앱 [공유 바텀시트]가 반드시 뜹니다 (카톡 / 문자 / 링크 복사)
   · 어떤 환경(데스크톱·인앱 웹뷰·구형 WebView)에서도 "아무 반응 없음"은 없습니다.
   ------------------------------------------------------------
   ★ v3 — 카테고리(섹션)별 독립 잠금
     사주 · 아이사주 · 외모·점은 서로 다른 열쇠를 씁니다.
       salpuri_unlock_saju_v2 / salpuri_unlock_baby_v2 / salpuri_unlock_gaewun_v2
     예전 전역 키(salpuri_share_unlock_v1)는 읽지 않고 지웁니다 — 이전 테스트로
     열려 있던 기기도 새 카테고리별 잠금 화면부터 보게 하기 위해서입니다.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY_VER = 'v2';
  const LEGACY_KEY = 'salpuri_share_unlock_v1';
  const URL_LIVE = 'https://renew1741-dev.github.io/salpuri/';

  /* ---------- 👑 관리자 프리패스 ---------- */
  const ADMIN_KEY = 'salpuri_admin_mode';
  const ADMIN_CODE = 'salpuri83';

  /* data-vault 값이 곧 열쇠 이름입니다 (body/style → gaewun 별칭 허용) */
  const ALIAS = { body: 'gaewun', style: 'gaewun', point: 'gaewun' };
  const SECTION_LABEL = {
    saju: '내 사주 풀이',
    baby: '아이 사주 풀이',
    gaewun: '외모·점 풀이',
    naming: '작명 풀이'
  };
  const state = { shared: Object.create(null), at: Object.create(null), seen: Object.create(null) };

  function keyOf(sec) { return 'salpuri_unlock_' + sec + '_' + KEY_VER; }
  function secOf(x) {
    const raw = String(x == null ? '' : x).trim().toLowerCase();
    const s = ALIAS[raw] || raw || 'saju';
    return /^[a-z][a-z0-9_-]{1,23}$/.test(s) ? s : 'saju';
  }
  function labelOf(sec) { return SECTION_LABEL[sec] || '이 풀이'; }

  /* ---------- 👑 관리자 프리패스 (모든 가림막·결제 잠금 0개) ---------- */
  function isAdmin() {
    try { return localStorage.getItem(ADMIN_KEY) === '1'; } catch (e) { return false; }
  }

  function setAdmin(on, opts) {
    try {
      if (on) localStorage.setItem(ADMIN_KEY, '1');
      else localStorage.removeItem(ADMIN_KEY);
    } catch (e) {}
    apply();
    ['saju', 'baby', 'gaewun', 'naming'].forEach(s => refresh(s));
    document.dispatchEvent(new CustomEvent('salpuri:admin', { detail: { admin: !!on } }));
    if (!(opts && opts.silent)) {
      toast(on
        ? '👑 관리자 모드 ON — 모든 가림막과 결제 잠금이 풀렸습니다.'
        : '일반(손님) 모드로 돌아왔어요. 다시 점검할 때는 주소 뒤에 ?admin=salpuri83 을 붙여 들어오세요.', 3600);
    }
  }

  /* ?admin=salpuri83 (또는 #admin=salpuri83) → 프리패스 ON, ?admin=off → OFF */
  function handleAdminQuery() {
    let code = null;
    try {
      const q = new URLSearchParams(location.search);
      if (q.has('admin')) code = q.get('admin') || '';
      if (code == null && /(^|[#&])admin=/.test(location.hash)) {
        const m = location.hash.match(/admin=([^&]*)/);
        code = m ? decodeURIComponent(m[1]) : '';
      }
    } catch (e) {}
    if (code == null) return;
    if (/^(off|0|no|false)$/i.test(code)) setAdmin(false, { silent: true });
    else if (code === ADMIN_CODE) setAdmin(true, { silent: true });
    /* 주소창에서 admin 파라미터를 지워 새로고침·공유 시 남지 않게 한다 */
    try {
      const u = new URL(location.href);
      u.searchParams.delete('admin');
      if (/admin=/.test(u.hash)) u.hash = u.hash.replace(/([#&]?)admin=[^&]*/g, '').replace(/[#&]$/, '');
      history.replaceState(null, '', u.pathname + (u.search || '') + (u.hash || ''));
    } catch (e) {}
  }

  let badge = null;
  function ensureBadge() {
    if (badge && document.body.contains(badge)) return badge;
    badge = document.createElement('div');
    badge.className = 'admin-badge';
    badge.id = 'adminBadge';
    badge.hidden = true;
    badge.innerHTML = '<span class="ab-crown" aria-hidden="true">👑</span>'
      + '<b>관리자 모드 ON</b>'
      + '<a class="ab-dash" href="admin.html" title="관리자 대시보드 열기">대시보드</a>'
      + '<button type="button" class="ab-off" data-admin-off>일반모드로 보기</button>';
    badge.addEventListener('click', function (e) {
      const off = e.target.closest && e.target.closest('[data-admin-off]');
      if (off) { e.preventDefault(); setAdmin(false); }
    }, true);
    document.body.appendChild(badge);
    return badge;
  }
  function updateBadge() {
    const el = ensureBadge();
    const on = isAdmin();
    el.hidden = !on;
    document.body.classList.toggle('admin-mode', on);
  }

  function readSection(sec) {
    if (state.seen[sec]) return;
    state.seen[sec] = true;
    try {
      const o = JSON.parse(localStorage.getItem(keyOf(sec)) || '{}');
      state.shared[sec] = !!o.shared;
      state.at[sec] = o.at || null;
    } catch (e) { state.shared[sec] = false; }
  }
  function writeSection(sec) {
    try {
      localStorage.setItem(keyOf(sec), JSON.stringify({ shared: !!state.shared[sec], at: state.at[sec] || null }));
    } catch (e) {}
  }
  function load() {
    /* 예전 전역 키는 읽지 않습니다. 남아 있으면 지워서 새 잠금 화면부터 보이게 합니다. */
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) {}
    ['saju', 'baby', 'gaewun'].forEach(readSection);
    handleAdminQuery();
    ensureBadge();
    updateBadge();
  }

  /* 어떤 결제가 어떤 카테고리를 여는지 */
  const PAID_SECTIONS = {
    report: ['saju'],
    duo: ['saju'],
    talisman: ['saju'],
    vip: ['saju', 'baby', 'gaewun', 'naming'],
    naming: ['naming']
  };

  function paid(sec) {
    const P = global.Payment;
    if (!P) return false;
    const list = Object.keys(PAID_SECTIONS);
    for (let i = 0; i < list.length; i++) {
      if (PAID_SECTIONS[list[i]].indexOf(sec) < 0) continue;
      try { if (P.has(list[i])) return true; } catch (e) {}
    }
    return false;
  }

  /** 👯 2인 패키지 전용 — 1인권·VIP·부적 결제자는 제한 없음 */
  function duoLimited() {
    const P = global.Payment;
    if (!P || !P.duo) return false;
    try {
      const info = P.duo.info();
      return !!info.active && !info.unlimited;
    } catch (e) { return false; }
  }

  function isOpen(section) {
    const sec = secOf(section);
    if (isAdmin()) return true;              /* 👑 관리자 프리패스 — 모든 가림막·결제 잠금 해제 */
    readSection(sec);
    if (state.shared[sec]) return true;
    if (!paid(sec)) return false;
    /* 2인 패키지는 등록된 명식(최대 2명)에만 리포트·PDF를 열어 줍니다 */
    if (sec === 'saju' && duoLimited()) {
      const P = global.Payment;
      const a = global.__salpuriAnalysis;
      if (!a) return false;
      try {
        const r = P.duo.access(a);
        if (r.ok && r.justRegistered) {
          document.dispatchEvent(new CustomEvent('salpuri:duo', {
            detail: { chart: a, index: r.index, limit: r.limit }
          }));
        }
        return !!r.ok;
      } catch (e) { return false; }
    }
    return true;
  }
  function isShared(section) {
    const sec = secOf(section);
    readSection(sec);
    return !!state.shared[sec];
  }

  function toast(msg, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._vt);
    el._vt = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }

  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {}
  }

  /* ---------- 잠금 카드 마크업 ---------- */
  const LOCK_ITEMS = {
    saju: [
      '올해·내년 월별로 피할 달과 잡을 달',
      '재물·연애·직장 타이밍 심층 풀이',
      '외모·점 개운 처방(적정 kg·길점/흉점)',
      '10쪽 정밀 PDF 리포트',
      '스마트폰 부적 4종'
    ],
    baby: [
      '커서 빛날 재능·적성·진로 방향',
      '어릴 때 약해지기 쉬운 건강 포인트',
      '엄마·아빠를 위한 말 걸기 처방',
      '아이의 수호 오행 색·방·소품'
    ],
    gaewun: [
      '적정 체중 구간과 체형 처방',
      '살릴 점·뺄 점 도해',
      '말버릇·화법 처방',
      '매일의 개운(색·향·방향)'
    ]
  };

  function lockHTML(kind) {
    const items = LOCK_ITEMS[kind] || LOCK_ITEMS.saju;
    return `<div class="vault-lock" data-vault-lock="${kind}" role="region" aria-label="잠긴 핵심 풀이">
      <div class="vault-lock-in">
        <div class="vl-lock">🔒</div>
        <div class="vl-kicker">살풀이 : 천기 · 핵심 풀이</div>
        <h3 class="serif">이 아래부터는 핵심 풀이가 잠겨 있어요</h3>
        <ul class="vl-list">${items.map(t => `<li>${t}</li>`).join('')}</ul>
        <div class="vl-price"><s>정가 19,800원</s><b>오픈 특가 9,900원</b></div>
        <div class="vl-badge"><span>오픈 기념 한정</span> 친구에게 공유하면 지금 바로 무료 열람!</div>
        <button type="button" class="btn-gold vl-share" data-vault-share="${kind}">
          카톡·SNS로 친구에게 공유하고 무료로 열기
        </button>
        <div class="vl-sub">
          <button type="button" class="vl-mini" data-vault-buy="report">9,900원에 바로 열기</button>
          <button type="button" class="vl-mini" data-vault-copy="${kind}">링크 복사해서 열기</button>
        </div>
        <div class="vl-duo" data-duo-strip>
          <div class="vl-duo-head">
            <span class="vl-duo-tag">👯 추천 · 인기</span>
            <b class="vl-duo-title">2인 동반 패키지</b>
            <span class="vl-duo-price"><s>19,800원</s> 17,900원</span>
          </div>
          <p class="vl-duo-desc">나 + 지인 1명 · 서로 다른 명식 2개의 10쪽 리포트·PDF까지 · 1인당 8,950원</p>
          <button type="button" class="vl-duo-btn" data-vault-buy="duo">2인 패키지로 두 사람 보기 · 17,900원</button>
          <p class="vl-duo-note" data-duo-note hidden></p>
        </div>
        <p class="vl-fine">한 번 열면 이 기기에서 이 풀이는 계속 열려 있어요. 다른 메뉴는 따로 열립니다.</p>
      </div>
    </div>`;
  }

  /** 잠금 구역 전체를 감싼 마크업 */
  function wrap(innerHTML, kind, opts) {
    const o = opts || {};
    const h = o.h || 560;
    return `<div class="vault is-locked" data-vault="${kind || 'saju'}" style="--vault-h:${h}px">
      <div class="vault-inner">${innerHTML}</div>
      <div class="vault-fade" aria-hidden="true"></div>
      ${lockHTML(kind)}
    </div>`;
  }

  /* ---------- 화면 반영 (섹션별) ---------- */
  function apply() {
    let anyOpen = false;
    document.querySelectorAll('[data-vault]').forEach(v => {
      const sec = secOf(v.getAttribute('data-vault'));
      const open = isOpen(sec);
      if (open) anyOpen = true;
      v.classList.toggle('is-locked', !open);
      v.classList.toggle('is-open', open);
      const inner = v.querySelector('.vault-inner');
      if (inner) {
        if (open) inner.removeAttribute('inert');
        else inner.setAttribute('inert', '');
      }
      const lock = v.querySelector('.vault-lock');
      if (lock) lock.setAttribute('aria-hidden', open ? 'true' : 'false');
    });
    document.body.classList.toggle('vault-open', anyOpen);
    updateBadge();
  }

  function refresh(section) {
    const fn = global.__salpuriOnUnlock;
    if (typeof fn !== 'function') return;
    try { fn(secOf(section)); } catch (e) {}
  }

  function unlock(section, reason) {
    const sec = secOf(section);
    state.shared[sec] = true;
    state.at[sec] = new Date().toISOString();
    writeSection(sec);
    apply();
    refresh(sec);
    document.querySelectorAll('[data-vault]').forEach(v => {
      if (secOf(v.getAttribute('data-vault')) !== sec) return;
      if (!v.classList.contains('is-open')) return;
      v.classList.add('just-opened');
      setTimeout(() => v.classList.remove('just-opened'), 1400);
    });
    global.dispatchEvent(new CustomEvent('salpuri:unlock', { detail: { section: sec, reason: reason || 'share' } }));
  }

  function lock(section) {
    const sec = secOf(section);
    state.shared[sec] = false;
    writeSection(sec);
    apply();
    refresh(sec);
  }

  /* ---------- 공유 문구 ---------- */
  function sharePayload(kind) {
    const a = global.__salpuriAnalysis;
    const baby = global.__salpuriBaby;
    const gw = global.__salpuriGaewun;
    const sec = secOf(kind);
    if (sec === 'baby' && baby) {
      return {
        title: '살풀이 : 천기 — 아이 사주',
        text: `${baby.name || '우리 아이'}의 사주를 살풀이 : 천기에서 봤어요. 타고난 기질부터 재능·건강·양육 팁까지 아이 눈높이로 풀어줘요.`,
        url: URL_LIVE
      };
    }
    if (sec === 'gaewun') {
      const who = a && a.name ? a.name + ' 님' : '내';
      return {
        title: '살풀이 : 천기 — 외모·점',
        text: `${who} 사주 기운에 맞는 체형과 적정 몸무게, 어울리는 헤어, 복이 붙는 점(點)의 자리까지 살풀이 : 천기에서 봤어요.`,
        url: URL_LIVE
      };
    }
    if (a) {
      const S = global.Saju;
      const dp = a.pillars.find(p => p.pos === '일');
      const ganji = dp && dp.gan != null ? `${S.GAN[dp.gan]}${S.JI[dp.ji]}일주` : '내 사주';
      return {
        title: '살풀이 : 천기 — 내 사주 풀이',
        text: `${a.name ? a.name + ' 님의' : '내'} 사주는 ${ganji}. 살풀이 : 천기에서 촛불 아래 풀어봤어요.`,
        url: URL_LIVE
      };
    }
    if (gw) {
      return {
        title: '살풀이 : 천기 — 외모·점',
        text: '내 사주 기운에 맞는 체형과 적정 몸무게, 어울리는 헤어, 복이 붙는 점(點)의 자리까지. 살풀이 : 천기에서 봤어요.',
        url: URL_LIVE
      };
    }
    return { title: '살풀이 : 천기', text: '촛불 아래에서 내 명(命)을 풀어보는 곳, 살풀이 : 천기.', url: URL_LIVE };
  }

  function fullText(p) {
    const t = (p && p.text) || '';
    const u = (p && p.url) || URL_LIVE;
    return t ? `${t}\n${u}` : u;
  }

  /* ---------- 클립보드 (execCommand 우선 → clipboard API) ---------- */
  function copyText(text) {
    /* 1) 사용자 제스처 안에서 동기로 도는 execCommand — 인앱 웹뷰에서 가장 잘 먹습니다 */
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '0';
      ta.style.top = '0';
      ta.style.width = '1px';
      ta.style.height = '1px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      ta.remove();
      if (ok) return Promise.resolve(true);
    } catch (e) {}
    /* 2) 비동기 클립보드 API */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ============================================================
     인앱 공유 바텀시트
     ============================================================ */
  let sheet = null;
  let sheetPayload = null;
  let sheetOpts = {};

  const SHEET_COPY = {
    gate:   { title: '친구에게 공유하기', note: '공유하면 잠긴 핵심 풀이가 바로 열려요' },
    plain:  { title: '친구에게 공유하기', note: '아래에서 보내실 방법을 골라 주세요' },
    noUi:   { title: '공유창이 뜨지 않나요?', note: '아래 방법 중 하나를 고르면 바로 공유돼요' },
    stuck:  { title: '공유창을 열 수 없어요', note: '이 환경에서는 아래 방법으로 보내 주세요' },
    abort:  { title: '공유를 취소하셨어요', note: '아래에서 다시 보내시면 잠금이 풀려요' },
    failed: { title: '공유가 막혀 있어요', note: '아래 방법 중 하나로 보내 주세요' },
    save:   { title: '내 카톡에 저장해 두기', note: '카톡 [나와의 채팅]에 붙여넣으면 언제든 다시 들어올 수 있어요' }
  };

  function ensureSheet() {
    if (sheet && document.body.contains(sheet)) return sheet;
    sheet = document.createElement('div');
    sheet.className = 'ss-back';
    sheet.id = 'shareSheet';
    sheet.innerHTML = `
      <div class="ss-sheet" role="dialog" aria-modal="true" aria-labelledby="ssTitle">
        <div class="ss-grab" aria-hidden="true"></div>
        <div class="ss-head">
          <span class="ss-kicker">살풀이 : 천기</span>
          <h3 class="serif" id="ssTitle">친구에게 공유하기</h3>
          <p class="ss-note" id="ssNote">공유하면 잠긴 핵심 풀이가 바로 열려요</p>
        </div>
        <div class="ss-list">
          <button type="button" class="ss-item ss-kakao" data-ss="kakao">
            <span class="ss-ico" aria-hidden="true">💬</span>
            <span class="ss-tx"><b>카카오톡으로 공유</b><i>링크가 복사돼요 · 카톡에 붙여넣기만 하면 끝</i></span>
            <span class="ss-go" aria-hidden="true">›</span>
          </button>
          <button type="button" class="ss-item" data-ss="sms">
            <span class="ss-ico" aria-hidden="true">📱</span>
            <span class="ss-tx"><b>문자(SMS)로 공유</b><i>문자 앱에 내용이 채워진 채로 열려요</i></span>
            <span class="ss-go" aria-hidden="true">›</span>
          </button>
          <button type="button" class="ss-item" data-ss="copy">
            <span class="ss-ico" aria-hidden="true">🔗</span>
            <span class="ss-tx"><b>링크 복사하고 바로 잠금 해제</b><i>복사한 링크를 어디든 붙여넣기</i></span>
            <span class="ss-go" aria-hidden="true">›</span>
          </button>
          <button type="button" class="ss-item ss-native" data-ss="native" hidden>
            <span class="ss-ico" aria-hidden="true">📤</span>
            <span class="ss-tx"><b>다른 앱으로 공유</b><i>기기 공유창을 다시 열어 봅니다</i></span>
            <span class="ss-go" aria-hidden="true">›</span>
          </button>
        </div>
        <div class="ss-raw-wrap" id="ssRawWrap" hidden>
          <p id="ssRawHint">아래 문구를 길게 눌러 복사해 주세요.</p>
          <textarea class="ss-raw" id="ssRaw" readonly rows="3"></textarea>
        </div>
        <p class="ss-fine">보내 주시면 이 기기에서 핵심 풀이가 계속 열려 있어요.</p>
        <button type="button" class="ss-close" data-ss="close">닫기</button>
      </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', onSheetClick, true);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sheet && sheet.classList.contains('show')) closeSheet();
    });
    return sheet;
  }

  function openSheet(payload, opts, mode) {
    const el = ensureSheet();
    sheetPayload = payload || sharePayload('saju');
    sheetOpts = opts || {};
    const sec = secOf(sheetOpts.section);
    const c = SHEET_COPY[mode] || SHEET_COPY.plain;
    el.querySelector('#ssTitle').textContent = c.title;
    el.querySelector('#ssNote').textContent = mode === 'gate'
      ? `공유하면 ${labelOf(sec)}가 바로 열려요`
      : c.note;
    const rawWrap = el.querySelector('#ssRawWrap');
    rawWrap.hidden = true;
    el.querySelector('#ssRaw').value = fullText(sheetPayload);
    /* OS 공유창을 다시 시도할 수 있는 버튼은 지원될 때만 */
    const nativeBtn = el.querySelector('.ss-native');
    nativeBtn.hidden = !(typeof navigator.share === 'function');
    /* 카카오 문구: 잠금 게이트면 '공유하면 이 풀이가 열린다'를 앞세운다 */
    el.querySelector('.ss-fine').textContent = sheetOpts.unlock === false
      ? '친구에게 보내면 오늘의 명(命)을 함께 나눌 수 있어요.'
      : `보내 주시면 이 기기에서 ${labelOf(sec)}가 계속 열려 있어요.`;
    /* 💬 내 카톡에 저장 모드 — 잠금 해제가 아니라 '다시 오기'용 문구로 바꾼다 */
    if (mode === 'save' || sheetOpts.mode === 'save') {
      el.querySelector('#ssTitle').textContent = SHEET_COPY.save.title;
      el.querySelector('#ssNote').textContent = SHEET_COPY.save.note;
      const kb = el.querySelector('[data-ss="kakao"] .ss-tx');
      if (kb) kb.innerHTML = '<b>카카오톡 [나와의 채팅]에 저장</b><i>링크가 복사돼요 · 나와의 채팅에 붙여넣기만 하면 끝</i>';
      const cb = el.querySelector('[data-ss="copy"] .ss-tx');
      if (cb) cb.innerHTML = '<b>링크 복사해서 저장</b><i>메모·즐겨찾기 어디든 붙여넣어 두세요</i>';
      el.querySelector('.ss-fine').textContent = '카톡 나와의 채팅에 저장하면 언제든 다시 들어올 수 있어요.';
    }
    el.classList.add('show');
    document.body.classList.add('ss-open');
    return el;
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('show');
    document.body.classList.remove('ss-open');
  }

  function flashRaw(msg) {
    const el = ensureSheet();
    const wrapEl = el.querySelector('#ssRawWrap');
    wrapEl.hidden = false;
    el.querySelector('#ssRawHint').textContent = msg || '아래 문구를 길게 눌러 복사해 주세요.';
    const ta = el.querySelector('#ssRaw');
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); } catch (e) {}
  }

  function afterShare(reason) {
    if (sheetOpts.unlock !== false) {
      const sec = secOf(sheetOpts.section);
      unlock(sec, reason || 'share');
      toast(`고마워요! ${labelOf(sec)}가 열렸어요. 아래로 내려서 확인해 보세요.`, 3200);
    } else {
      toast('공유 링크를 준비했어요. 친구에게 붙여넣어 보내 주세요.', 2800);
    }
    closeSheet();
  }

  async function onSheetClick(e) {
    const btn = e.target.closest && e.target.closest('[data-ss]');
    if (!btn) {
      /* 바깥(딤 배경)을 누르면 닫기 */
      if (e.target === sheet) closeSheet();
      return;
    }
    const act = btn.getAttribute('data-ss');
    if (act === 'close') { closeSheet(); return; }
    e.preventDefault();
    e.stopPropagation();
    buzz(10);
    const p = sheetPayload || sharePayload('saju');
    const body = fullText(p);

    if (act === 'kakao') {
      btn.classList.add('busy');
      const ok = await copyText(body);
      btn.classList.remove('busy');
      if (ok) {
        afterShare('share');
        toast(sheetOpts.mode === 'save'
          ? '링크가 복사됐어요! 카톡 [나와의 채팅]에 붙여넣으면 저장돼요.'
          : '링크가 복사되었어요! 카카오톡에 붙여넣어 친구에게 보내주세요.', 3800);
      } else {
        flashRaw('복사가 막혀 있어요. 아래 문구를 길게 눌러 복사한 뒤 카카오톡에 붙여넣어 주세요.');
        toast('아래 문구를 길게 눌러 복사해 주세요.', 3200);
        if (sheetOpts.unlock !== false) unlock(sheetOpts.section, 'share');
      }
      return;
    }

    if (act === 'sms') {
      const ok = await copyText(body);
      const ua = navigator.userAgent || '';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      if (sheetOpts.unlock !== false) unlock(sheetOpts.section, 'share');
      closeSheet();
      if (!isMobile) {
        toast(ok ? '링크를 복사했어요. 문자는 휴대폰에서 보내 주세요.' : '문자는 휴대폰에서 보낼 수 있어요.', 3400);
        return;
      }
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const sep = isIOS ? '&' : '?';
      const smsUrl = `sms:${sep}body=${encodeURIComponent(p.text ? p.text + '\n' + p.url : p.url)}`;
      toast(ok ? '문자 앱에 내용을 채워 열게요. 보내기만 누르시면 돼요.'
               : '문자 앱에 내용을 채워 열게요. 안 열리면 링크를 붙여넣어 주세요.', 3400);
      try { global.location.href = smsUrl; } catch (err) {}
      return;
    }

    if (act === 'copy') {
      btn.classList.add('busy');
      const ok = await copyText(body);
      btn.classList.remove('busy');
      if (ok) {
        closeSheet();
        if (sheetOpts.unlock !== false) {
          unlock(sheetOpts.section, 'copy');
          toast(`링크를 복사했어요. 친구에게 붙여넣기로 보내 주세요. ${labelOf(secOf(sheetOpts.section))}가 열렸어요.`, 3800);
        } else {
          toast(sheetOpts.mode === 'save'
            ? '링크를 복사했어요. 카톡 [나와의 채팅]·메모에 붙여넣어 두세요.'
            : '링크를 복사했어요. 친구에게 붙여넣기로 보내 주세요.', 3200);
        }
      } else {
        flashRaw('복사가 막혀 있어요. 아래 문구를 길게 눌러 복사해 주세요.');
        toast('아래 문구를 길게 눌러 복사해 주세요.', 3200);
        if (sheetOpts.unlock !== false) unlock(sheetOpts.section, 'copy');
      }
      return;
    }

    if (act === 'native') {
      closeSheet();
      shareFlow(p, sheetOpts, true);
      return;
    }
  }

  /* ============================================================
     OS 공유창 시도 → 실패/무응답이면 반드시 시트
     ============================================================ */
  async function shareFlow(payload, opts, forceNative) {
    const p = payload || sharePayload('saju');
    const o = opts || {};
    const support = typeof navigator.share === 'function';

    if (!support) {
      /* 공유 API 자체가 없는 환경(데스크톱·구형 WebView) → 바로 시트 */
      openSheet(p, o, o.mode === 'gate' ? 'gate' : 'plain');
      return false;
    }

    let blurred = false;
    const onBlur = () => { blurred = true; };
    const onVis = () => { if (document.visibilityState === 'hidden') blurred = true; };
    global.addEventListener('blur', onBlur);
    global.addEventListener('pagehide', onBlur);
    document.addEventListener('visibilitychange', onVis);

    toast('공유창을 여는 중이에요…', 1500);

    const started = Date.now();
    let result = null;
    const run = (async () => {
      try { await navigator.share(p); return { ok: true }; }
      catch (err) { return { ok: false, err: err }; }
    })();
    run.then(r => { result = r; });

    const first = await Promise.race([run, sleep(1500).then(() => '__wait__')]);
    global.removeEventListener('blur', onBlur);
    global.removeEventListener('pagehide', onBlur);
    document.removeEventListener('visibilitychange', onVis);

    if (first === '__wait__') {
      /* 아직 pending — OS 공유창이 떴는지(포커스 아웃)로 판단 */
      if (blurred) {
        const late = await Promise.race([run, sleep(90000).then(() => '__never__')]);
        if (late === '__never__') { openSheet(p, o, 'stuck'); return false; }
        if (late.ok) { finishShare(o, 'share'); return true; }
        if (late.err && late.err.name === 'AbortError') { openSheet(p, o, 'abort'); return false; }
        openSheet(p, o, 'failed'); return false;
      }
      /* 공유창이 뜨지도 않았는데 응답도 없음 = 무반응 지옥 → 시트 */
      openSheet(p, o, forceNative ? 'stuck' : 'noUi');
      run.then(r => {
        if (r.ok) { closeSheet(); finishShare(o, 'share'); }
      });
      return false;
    }

    if (first.ok) {
      const elapsed = Date.now() - started;
      if (!blurred && elapsed < 450) {
        /* 즉시 resolve = 실제로 아무 창도 안 뜬 웹뷰 스텁 → 해제 + 시트로 대안 안내 */
        finishShare(o, 'share', true);
        openSheet(p, o, 'noUi');
        return true;
      }
      finishShare(o, 'share');
      return true;
    }

    if (first.err && first.err.name === 'AbortError') {
      openSheet(p, o, 'abort');
      toast('공유를 취소하시면 잠금은 그대로예요. 아래에서 다시 보내실 수 있어요.', 3400);
      return false;
    }
    openSheet(p, o, 'failed');
    return false;
  }

  function finishShare(o, reason, quiet) {
    if (o.unlock !== false) {
      const sec = secOf(o.section);
      unlock(sec, reason || 'share');
      if (!quiet) toast(`고마워요! ${labelOf(sec)}가 열렸어요. 아래로 내려서 확인해 보세요.`, 3200);
      else toast(`공유했어요! ${labelOf(sec)}가 열렸어요.`, 3000);
    } else if (!quiet) {
      toast(o.mode === 'save'
        ? '공유창에서 [카카오톡]을 고르고 [나와의 채팅]에 보내면 저장돼요.'
        : '공유창을 열었어요. 친구에게 보내 주세요.', 3000);
    }
  }

  /* ---------- 💬 내 카톡에 저장해 두기 (재방문용 · 잠금 해제 아님) ---------- */
  function saveToKakao() {
    const payload = {
      title: '🔮 살풀이 : 천기',
      text: '🔮 [살풀이 : 천기] 내 사주·오늘의 운세 다시 보기\n내일 아침 오늘의 운세도 여기서 바로 확인하세요!',
      url: URL_LIVE
    };
    toast('공유창이 열리면 [카카오톡] → [나와의 채팅]을 골라 주세요.', 2600);
    return shareFlow(payload, { unlock: false, mode: 'save', section: 'saju' });
  }

  /* ---------- 공개 API ---------- */
  function shareGate(kind) {
    const sec = secOf(kind);
    return shareFlow(sharePayload(sec), { unlock: true, mode: 'gate', section: sec });
  }

  /* ---------- 클릭 위임 (캡처 단계 — 내부 stopPropagation에 영향받지 않음) ---------- */
  function onceGuard(el) {
    const n = Date.now();
    if (el._vAt && n - el._vAt < 900) return false;
    el._vAt = n;
    return true;
  }

  function onClick(e) {
    const t = e.target.closest && e.target.closest('[data-vault-share],[data-vault-copy],[data-vault-buy]');
    if (!t) return;
    if (t.hasAttribute('data-vault-buy')) return;      // 결제는 app.js가 처리
    if (e.target.closest('[data-ss]')) return;          // 시트 내부 클릭은 시트가 처리
    e.preventDefault();
    if (!onceGuard(t)) return;
    buzz(10);
    const kind = t.getAttribute('data-vault-share') || t.getAttribute('data-vault-copy') || 'saju';
    const sec = secOf(kind);
    if (t.hasAttribute('data-vault-copy')) {
      const p = sharePayload(sec);
      copyText(fullText(p)).then(ok => {
        if (ok) {
          unlock(sec, 'copy');
          toast(`링크를 복사했어요. 붙여넣기로 보내 주시면 ${labelOf(sec)}가 열립니다.`, 3200);
        } else {
          openSheet(p, { unlock: true, section: sec }, 'failed');
        }
      });
      return;
    }
    shareGate(sec);
  }

  /* 캡처 단계 등록: 버튼 자체나 중간 DOM이 stopPropagation을 해도 항상 먼저 잡습니다 */
  document.addEventListener('click', onClick, true);
  /* 인앱 웹뷰에서 click이 유실되는 경우를 위한 보조 경로(같은 동작 1회만) */
  document.addEventListener('touchend', e => {
    const t = e.target.closest && e.target.closest('[data-vault-share]');
    if (!t) return;
    if (!onceGuard(t)) return;
    e.preventDefault();
    buzz(10);
    shareGate(t.getAttribute('data-vault-share') || 'saju');
  }, { capture: true, passive: false });

  load();

  global.Vault = {
    isOpen, isShared, unlock, lock, apply, refresh, wrap, lockHTML, shareGate, sharePayload,
    duoLimited,
    /* 👑 관리자 프리패스 */
    isAdmin: isAdmin,
    setAdmin: setAdmin,
    toggleAdmin: function () { setAdmin(!isAdmin()); },
    /* 새 공유 진입점: 상단·하단·결과 공유 버튼이 모두 이걸 씁니다 (opts.section으로 카테고리 지정) */
    share: shareFlow,
    saveToKakao,
    openSheet, closeSheet,
    sectionOf: secOf, labelOf, keyOf,
    get shared() { return isShared('saju'); },
    get sharedSections() {
      const out = {};
      ['saju', 'baby', 'gaewun', 'naming'].forEach(s => { out[s] = isShared(s); });
      return out;
    }
  };
})(window);
