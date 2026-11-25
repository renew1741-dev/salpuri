/* ============================================================
   살풀이 : 천기 — 잠금 해제(공유 해금) 퍼널 v2
   ------------------------------------------------------------
   · 맛보기 아래의 핵심 풀이를 블러 + 자물쇠로 가립니다.
   · [친구에게 공유하고 무료로 열기] → OS 공유창 → 즉시 잠금 해제
   · OS 공유창이 없거나·안 뜨거나·무응답(pending)이면
     → 인앱 [공유 바텀시트]가 반드시 뜹니다 (카톡 / 문자 / 링크 복사)
   · 어떤 환경(데스크톱·인앱 웹뷰·구형 WebView)에서도 "아무 반응 없음"은 없습니다.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'salpuri_share_unlock_v1';
  const URL_LIVE = 'https://renew1741-dev.github.io/salpuri/';
  const state = { shared: false, at: null };

  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || '{}');
      state.shared = !!o.shared;
      state.at = o.at || null;
    } catch (e) { state.shared = false; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ shared: state.shared, at: state.at })); } catch (e) {}
  }

  function paid() {
    const P = global.Payment;
    if (!P) return false;
    try { return !!(P.has('report') || P.has('vip') || P.has('talisman')); } catch (e) { return false; }
  }

  function isOpen() { return state.shared || paid(); }

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
      '2026·2027 월별로 피할 달과 잡을 달',
      '재물·연애·직장 타이밍 심층 풀이',
      '외모·점 개운 처방(적정 kg·길점/흉점)',
      '8쪽 정밀 PDF 리포트',
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
        <div class="vl-badge"><span>오픈 7일 한정</span> 친구에게 공유하면 지금 바로 무료 열람!</div>
        <button type="button" class="btn-gold vl-share" data-vault-share="${kind}">
          카톡·SNS로 친구에게 공유하고 무료로 열기
        </button>
        <div class="vl-sub">
          <button type="button" class="vl-mini" data-vault-buy="report">9,900원에 바로 열기</button>
          <button type="button" class="vl-mini" data-vault-copy="${kind}">링크 복사해서 열기</button>
        </div>
        <p class="vl-fine">한 번 열면 이 기기에서는 계속 열려 있어요. 결제 없이도 전부 보실 수 있어요.</p>
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

  /* ---------- 화면 반영 ---------- */
  function apply() {
    const open = isOpen();
    document.querySelectorAll('[data-vault]').forEach(v => {
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
    document.body.classList.toggle('vault-open', open);
  }

  function refresh() {
    if (typeof global.__salpuriOnUnlock === 'function' && isOpen()) {
      try { global.__salpuriOnUnlock(); } catch (e) {}
    }
  }

  function unlock(reason) {
    state.shared = true;
    state.at = new Date().toISOString();
    save();
    apply();
    refresh();
    document.querySelectorAll('.vault.is-open').forEach(v => {
      v.classList.add('just-opened');
      setTimeout(() => v.classList.remove('just-opened'), 1400);
    });
    global.dispatchEvent(new CustomEvent('salpuri:unlock', { detail: { reason: reason || 'share' } }));
  }

  function lock() {
    state.shared = false;
    save();
    apply();
  }

  /* ---------- 공유 문구 ---------- */
  function sharePayload(kind) {
    const a = global.__salpuriAnalysis;
    const baby = global.__salpuriBaby;
    if (kind === 'baby' && baby) {
      return {
        title: '살풀이 : 천기 — 아이 사주',
        text: `${baby.name || '우리 아이'}의 사주를 살풀이 : 천기에서 봤어요. 타고난 기질부터 재능·건강·양육 팁까지 아이 눈높이로 풀어줘요.`,
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
    failed: { title: '공유가 막혀 있어요', note: '아래 방법 중 하나로 보내 주세요' }
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
    const c = SHEET_COPY[mode] || SHEET_COPY.plain;
    el.querySelector('#ssTitle').textContent = c.title;
    el.querySelector('#ssNote').textContent = c.note;
    const rawWrap = el.querySelector('#ssRawWrap');
    rawWrap.hidden = true;
    el.querySelector('#ssRaw').value = fullText(sheetPayload);
    /* OS 공유창을 다시 시도할 수 있는 버튼은 지원될 때만 */
    const nativeBtn = el.querySelector('.ss-native');
    nativeBtn.hidden = !(typeof navigator.share === 'function');
    /* 카카오 문구: 잠금 게이트면 '공유하면 잠금이 풀린다'를 앞세운다 */
    el.querySelector('.ss-fine').textContent = sheetOpts.unlock === false
      ? '친구에게 보내면 오늘의 명(命)을 함께 나눌 수 있어요.'
      : '보내 주시면 이 기기에서 핵심 풀이가 계속 열려 있어요.';
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
      unlock(reason || 'share');
      toast('고마워요! 잠금이 풀렸어요. 아래로 내려서 확인해 보세요.', 3200);
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
        toast('링크가 복사되었어요! 카카오톡에 붙여넣어 친구에게 보내주세요.', 3800);
      } else {
        flashRaw('복사가 막혀 있어요. 아래 문구를 길게 눌러 복사한 뒤 카카오톡에 붙여넣어 주세요.');
        toast('아래 문구를 길게 눌러 복사해 주세요.', 3200);
        if (sheetOpts.unlock !== false) unlock('share');
      }
      return;
    }

    if (act === 'sms') {
      const ok = await copyText(body);
      const ua = navigator.userAgent || '';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      if (sheetOpts.unlock !== false) unlock('share');
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
          unlock('copy');
          toast('링크를 복사했어요. 친구에게 붙여넣기로 보내 주세요. 잠금이 풀렸어요.', 3800);
        } else {
          toast('링크를 복사했어요. 친구에게 붙여넣기로 보내 주세요.', 3200);
        }
      } else {
        flashRaw('복사가 막혀 있어요. 아래 문구를 길게 눌러 복사해 주세요.');
        toast('아래 문구를 길게 눌러 복사해 주세요.', 3200);
        if (sheetOpts.unlock !== false) unlock('copy');
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
      unlock(reason || 'share');
      if (!quiet) toast('고마워요! 잠금이 풀렸어요. 아래로 내려서 확인해 보세요.', 3200);
      else toast('공유했어요! 잠금이 풀렸어요.', 3000);
    } else if (!quiet) {
      toast('공유창을 열었어요. 친구에게 보내 주세요.', 2600);
    }
  }

  /* ---------- 공개 API ---------- */
  function shareGate(kind) {
    return shareFlow(sharePayload(kind), { unlock: true, mode: 'gate' });
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
    if (t.hasAttribute('data-vault-copy')) {
      const p = sharePayload(kind);
      copyText(fullText(p)).then(ok => {
        if (ok) {
          unlock('copy');
          toast('링크를 복사했어요. 붙여넣기로 보내 주시면 잠금이 풀립니다.', 3200);
        } else {
          openSheet(p, { unlock: true }, 'failed');
        }
      });
      return;
    }
    shareGate(kind);
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
    isOpen, unlock, lock, apply, refresh, wrap, lockHTML, shareGate, sharePayload,
    /* 새 공유 진입점: 상단·하단·결과 공유 버튼이 모두 이걸 씁니다 */
    share: shareFlow,
    openSheet, closeSheet,
    get shared() { return state.shared; }
  };
})(window);
