/* ============================================================
   살풀이 : 천기 결제 모듈 v3
   ------------------------------------------------------------
   실제 판매 방식이 정해지면 CONFIG.provider 값 하나만 바꾸면 됩니다.
     'demo'     : 결제창 없이 승인 시뮬레이션 (기본값 · 테스트 배지 표시)
     'ctee'     : 크티(ctee.kr) 상품 링크로 이동 — 키 발급 없이 바로 판매
     'transfer' : 계좌이체 + 입금자명 확인 모달 (수동 확인 코드 방식)
     'portone'  : 포트원 V2 결제창 (카드·카카오페이·토스페이 통합)
     'toss'     : 토스페이먼츠 표준결제 (카드)
   ------------------------------------------------------------
   ※ 실제 판매 전 반드시 할 일
     1) ctee.kr 에서 상품 3개를 만들고 판매 링크를 CONFIG.ctee 에 넣습니다.
        (가장 빠른 실전 경로 · 카드 등록 없이 판매 가능)
     2) 계좌이체로 받을 경우 CONFIG.transfer 의 은행·계좌·예금주를 채우고,
        입금 확인 후 구매자에게 알려 줄 확인 코드(confirmCode)를 정합니다.
     3) 포트원/토스로 갈 경우 키를 넣고, 승인 검증은 반드시 서버(또는 서버리스
        함수)에서 결제조회 API로 금액을 확인한 뒤 처리해야 합니다.
        이 파일의 클라이언트 코드는 결제창 호출까지만 담당합니다.
   ============================================================ */
(function (global) {
  'use strict';

  const PRODUCTS = {
    report: {
      id: 'report',
      name: '살풀이 : 천기 2026 정밀 사주 리포트 (9쪽)',
      desc: '9쪽 리포트 · 기질·재물·인연·2026 월별 길흉·대운·살풀이 처방 · PDF 저장',
      price: 9900,
      badge: '인기',
      unlock: ['report']
    },
    duo: {
      id: 'duo',
      name: '👯 2인 동반 정밀 사주 패키지',
      desc: '나 + 지인 1명 · 서로 다른 명식 2개 · 각 9쪽 정밀 리포트 + PDF 저장 · 1인당 8,950원',
      price: 17900,
      listPrice: 19800,
      badge: '👯 추천 · 인기',
      unlock: ['report', 'duo'],
      slots: 2
    },
    talisman: {
      id: 'talisman',
      name: '개운 부적 배경화면 4종',
      desc: '재물·인연·액막이·성공 4종 · 1080×1920 고해상 PNG · 휴대폰 배경화면',
      price: 14900,
      badge: '즉시 다운로드',
      unlock: ['talisman']
    },
    vip: {
      id: 'vip',
      name: '살풀이 : 천기 VIP 패키지',
      desc: '정밀 리포트 + 부적 4종 + 2026 월별 운세 한 장 요약',
      price: 29900,
      badge: '38% 할인',
      unlock: ['report', 'talisman', 'vip']
    },
    naming: {
      id: 'naming',
      name: '사주 맞춤 개명·아기 작명 후보 5선',
      desc: '이름 진단서 + 후보 5선 · 발음오행 상생 · 한자 81수리 · 사주 보완 해설',
      price: 29000,
      listPrice: 39000,
      badge: '오픈 특가',
      unlock: ['naming']
    }
  };

  const CONFIG = {
    provider: 'demo',
    transfer: {
      bank: '',                 // 예: 국민은행
      account: '',              // 예: 123-456-7890-12
      holder: '',               // 예금주
      minutes: 60,              // 입금 기한(분)
      confirmCode: ''           // 입금 확인 후 구매자에게 알려 줄 코드 (미설정 시 확인 기능 숨김)
    },
    ctee: {
      report: '',               // 예: https://ctee.kr/place/salpuri/report
      duo: '',
      talisman: '',
      vip: '',
      naming: ''
    },
    portone: {
      storeId: '',
      channelKey: '',
      payMethod: 'CARD'
    },
    toss: {
      clientKey: '',
      method: '카드'
    }
  };

  const ORDER_KEY = 'salpuri_orders_v1';
  const DUO_KEY = 'salpuri_duo_charts_v1';
  const DUO_LIMIT = 2;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error('sdk load failed: ' + src));
      document.head.appendChild(s);
    });
  }

  function makeOrderId() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `SP-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  function saveOrder(order) {
    try {
      const list = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
      const idx = list.findIndex(o => o.orderId === order.orderId);
      if (idx >= 0) list[idx] = order; else list.push(order);
      localStorage.setItem(ORDER_KEY, JSON.stringify(list.slice(-30)));
    } catch (e) { /* 저장 실패는 결제를 막지 않음 */ }
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); } catch (e) { return []; }
  }

  function findLatest(productId) {
    const list = getOrders().filter(o => o.productId === productId);
    return list.length ? list[list.length - 1] : null;
  }

  /** 결제 실행 — {ok:true, order} / {ok:true, pending:true, order} / {ok:false, error} */
  async function pay(productId, customer) {
    const product = PRODUCTS[productId];
    if (!product) return { ok: false, error: '상품을 찾을 수 없어요.' };
    const order = {
      orderId: makeOrderId(),
      productId,
      productName: product.name,
      amount: product.price,
      customer: customer || {},
      provider: CONFIG.provider,
      paidAt: new Date().toISOString(),
      status: 'pending'
    };

    if (CONFIG.provider === 'ctee') {
      const url = CONFIG.ctee[productId];
      if (!url) return { ok: false, error: '크티 링크가 아직 설정되지 않았어요.' };
      order.status = 'external';
      saveOrder(order);
      global.open(url, '_blank', 'noopener');
      return { ok: true, external: true, order };
    }

    if (CONFIG.provider === 'transfer') {
      const t = CONFIG.transfer;
      if (!t.bank || !t.account) return { ok: false, error: '입금 계좌가 아직 설정되지 않았어요.' };
      order.status = 'awaiting_transfer';
      order.transfer = { bank: t.bank, account: t.account, holder: t.holder, minutes: t.minutes };
      saveOrder(order);
      return { ok: true, pending: true, order, transfer: order.transfer };
    }

    if (CONFIG.provider === 'portone' && CONFIG.portone.storeId && CONFIG.portone.channelKey) {
      try {
        await loadScript('https://cdn.portone.io/v2/browser-sdk.js');
        const res = await global.PortOne.requestPayment({
          storeId: CONFIG.portone.storeId,
          channelKey: CONFIG.portone.channelKey,
          paymentId: order.orderId,
          orderName: product.name,
          totalAmount: product.price,
          currency: 'CURRENCY_KRW',
          payMethod: CONFIG.portone.payMethod,
          customer: {
            fullName: order.customer.name || '고객',
            phoneNumber: order.customer.phone || '',
            email: order.customer.email || ''
          },
          redirectUrl: location.origin + location.pathname + '?payment=redirect',
          noticeUrls: []
        });
        if (res && res.code) return { ok: false, error: res.message || '결제가 취소됐어요.' };
        order.status = 'paid';
        order.txId = (res && res.txId) || '';
        saveOrder(order);
        return { ok: true, order };
      } catch (e) {
        console.warn('[payment] PortOne unavailable → demo fallback', e);
        return demoApprove(order);
      }
    }

    if (CONFIG.provider === 'toss' && CONFIG.toss.clientKey) {
      try {
        await loadScript('https://js.tosspayments.com/v2/standard');
        const toss = global.TossPayments(CONFIG.toss.clientKey);
        await toss.requestPayment({
          method: CONFIG.toss.method,
          amount: { currency: 'KRW', value: product.price },
          orderId: order.orderId,
          orderName: product.name,
          customerName: order.customer.name || '고객',
          successUrl: location.origin + location.pathname + '?payment=success',
          failUrl: location.origin + location.pathname + '?payment=fail'
        });
        order.status = 'redirect';
        saveOrder(order);
        return { ok: true, order };
      } catch (e) {
        console.warn('[payment] Toss unavailable → demo fallback', e);
        return demoApprove(order);
      }
    }

    return demoApprove(order);
  }

  function demoApprove(order) {
    return new Promise(resolve => {
      setTimeout(() => {
        order.status = 'paid';
        order.demo = true;
        order.txId = 'DEMO-' + order.orderId.slice(-6);
        saveOrder(order);
        resolve({ ok: true, order, demo: true });
      }, 1200);
    });
  }

  /** 계좌이체 — 입금 확인 코드로 수동 승인 */
  function confirmTransfer(orderId, code) {
    const order = getOrders().find(o => o.orderId === orderId);
    if (!order) return { ok: false, error: '주문을 찾을 수 없어요.' };
    if (order.status === 'paid') return { ok: true, order };
    if (!CONFIG.transfer.confirmCode) return { ok: false, error: '입금 확인 기능이 설정되지 않았어요.' };
    if (String(code || '').trim() !== String(CONFIG.transfer.confirmCode)) {
      return { ok: false, error: '확인 코드가 맞지 않아요.' };
    }
    order.status = 'paid';
    order.confirmedAt = new Date().toISOString();
    saveOrder(order);
    return { ok: true, order };
  }

  /** 결제 성공 후 잠금 해제된 상품 목록 */
  function unlocked() {
    const set = new Set();
    getOrders().filter(o => o.status === 'paid').forEach(o => {
      (PRODUCTS[o.productId] ? PRODUCTS[o.productId].unlock : []).forEach(k => set.add(k));
    });
    return set;
  }
  const has = key => unlocked().has(key);

  /* ============================================================
     👯 2인 동반 패키지 — 명식 슬롯(최대 2개)
     ------------------------------------------------------------
     · duo 결제자는 서로 다른 명식 2개까지 리포트·PDF를 열 수 있습니다.
     · 1인권(report)·부적·VIP 결제자와 관리자 프리패스는 인원 제한이 없습니다.
     · 명식 지문 = 이름 + 양력 생년월일 + 성별
     ============================================================ */
  const pad2 = n => String(n).padStart(2, '0');

  function readDuo() {
    try {
      const v = JSON.parse(localStorage.getItem(DUO_KEY) || '[]');
      return Array.isArray(v) ? v.filter(x => x && x.key).slice(0, 8) : [];
    } catch (e) { return []; }
  }
  function writeDuo(list) {
    try { localStorage.setItem(DUO_KEY, JSON.stringify((list || []).slice(0, 8))); } catch (e) {}
  }

  function chartKey(a) {
    if (!a || !a.solar) return '';
    const nm = String(a.name || '').replace(/\s+/g, '').slice(0, 12);
    const b = `${a.solar.y}-${pad2(a.solar.m)}-${pad2(a.solar.d)}`;
    return `${nm}|${b}|${a.gender || ''}`;
  }

  function adminOn() {
    try { return !!(global.Vault && typeof global.Vault.isAdmin === 'function' && global.Vault.isAdmin()); } catch (e) { return false; }
  }

  /** 1인권·부적·VIP 결제자 — 명식 수 제한 없음 */
  function fullChartAccess() {
    return getOrders().some(o => o.status === 'paid' && ['report', 'talisman', 'vip'].indexOf(o.productId) >= 0);
  }

  function duoInfo() {
    const charts = readDuo().map(c => ({
      key: c.key, name: c.name || '', birth: c.birth || '', gender: c.gender || '', at: c.at || ''
    }));
    return {
      active: has('duo'),
      unlimited: fullChartAccess() || adminOn(),
      limit: DUO_LIMIT,
      used: charts.length,
      remaining: Math.max(0, DUO_LIMIT - charts.length),
      charts
    };
  }

  /** 등록하지 않고 현재 명식의 상태만 확인 */
  function duoPeek(a) {
    const info = duoInfo();
    const key = chartKey(a);
    const idx = key ? info.charts.findIndex(c => c.key === key) : -1;
    const blocked = !!info.active && !info.unlimited && idx < 0 && info.used >= DUO_LIMIT;
    return Object.assign({}, info, {
      key,
      registered: idx >= 0,
      index: idx >= 0 ? idx + 1 : 0,
      full: blocked,
      blocked
    });
  }

  /** 현재 명식을 슬롯에 등록하고 열람 가능 여부를 돌려준다 (이미 있으면 그대로 통과) */
  function duoAccess(a) {
    const p = duoPeek(a);
    if (!p.active) return Object.assign(p, { ok: false, inactive: true });
    if (p.unlimited) return Object.assign(p, { ok: true });
    if (p.registered) return Object.assign(p, { ok: true });
    if (p.used >= DUO_LIMIT) return Object.assign(p, { ok: false });
    if (!p.key) return Object.assign(p, { ok: false, noKey: true });
    const list = readDuo();
    list.push({
      key: p.key,
      name: (a && a.name) || '',
      birth: a && a.solar ? `${a.solar.y}-${pad2(a.solar.m)}-${pad2(a.solar.d)}` : '',
      gender: (a && a.gender) || '',
      at: new Date().toISOString()
    });
    writeDuo(list);
    const info = duoInfo();
    return Object.assign({}, info, {
      key: p.key,
      registered: true,
      index: info.used,
      ok: true,
      justRegistered: true
    });
  }

  /** 등록한 명식 한 칸을 비운다 (다른 사람으로 바꿀 때) */
  function duoRelease(key) {
    writeDuo(readDuo().filter(c => c.key !== key));
    return duoInfo();
  }
  function duoReset() {
    writeDuo([]);
    return duoInfo();
  }

  global.Payment = {
    PRODUCTS, CONFIG, pay, confirmTransfer, unlocked, has,
    getOrders, findLatest, makeOrderId,
    duo: {
      info: duoInfo,
      peek: duoPeek,
      access: duoAccess,
      release: duoRelease,
      reset: duoReset,
      key: chartKey,
      limit: DUO_LIMIT
    }
  };
})(window);
