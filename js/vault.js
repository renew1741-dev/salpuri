/* ============================================================
   살풀이 : 천기 — 잠금 해제(공유 해금) 퍼널 v1
   ------------------------------------------------------------
   · 맛보기 아래의 핵심 풀이를 블러 + 자물쇠로 가립니다.
   · [카톡·SNS로 공유하고 무료로 열기] → navigator.share/링크 복사
     → 곧바로 잠금 해제(localStorage에 기억)
   · 2026-11-27 이후 PG 실결제로 전환할 때는 Payment.pay() 성공 시
     Vault.unlock('paid')만 호출하면 됩니다.
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

  /* ---------- 공유 ---------- */
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

  function copyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    if (ok) return Promise.resolve(true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }

  async function shareGate(kind) {
    const p = sharePayload(kind);
    try {
      if (navigator.share) {
        await navigator.share(p);
        unlock('share');
        toast('고마워요! 잠금이 풀렸어요. 아래로 내려서 확인해 보세요.', 3200);
        return true;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        toast('공유를 취소하시면 잠금은 그대로예요. 아래 [링크 복사해서 열기]로도 열 수 있어요.', 3600);
        return false;
      }
      /* 공유 미지원·차단 → 복사로 대체 */
    }
    const ok = await copyText(`${p.text}\n${p.url}`);
    if (ok) {
      unlock('copy');
      toast('링크를 복사했어요. 친구에게 붙여넣기로 보내 주세요. 잠금이 풀렸어요.', 3600);
      return true;
    }
    toast('공유가 막혀 있어요. 잠시 뒤 다시 시도해 주세요.', 3000);
    return false;
  }

  /* ---------- 클릭 위임 ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-vault-share],[data-vault-copy],[data-vault-buy]');
    if (!t) return;
    if (t.hasAttribute('data-vault-buy')) return;      // 결제는 app.js가 처리
    e.preventDefault();
    const kind = t.getAttribute('data-vault-share') || t.getAttribute('data-vault-copy') || 'saju';
    if (t.hasAttribute('data-vault-copy')) {
      const p = sharePayload(kind);
      copyText(`${p.text}\n${p.url}`).then(ok => {
        if (ok) {
          unlock('copy');
          toast('링크를 복사했어요. 붙여넣기로 보내 주시면 잠금이 풀립니다.', 3200);
        } else {
          toast('링크 복사가 막혀 있어요. 공유 버튼을 눌러 주세요.', 3000);
        }
      });
      return;
    }
    shareGate(kind);
  });

  load();

  global.Vault = {
    isOpen, unlock, lock, apply, refresh, wrap, lockHTML, shareGate, sharePayload,
    get shared() { return state.shared; }
  };
})(window);
