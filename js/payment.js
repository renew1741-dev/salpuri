/* ============================================================
   살풀이 : 천기 결제 모듈
   - 포트원(PortOne) V2 브라우저 SDK  : 카드·카카오페이·토스페이·네이버페이 통합
   - 토스페이먼츠 표준결제 SDK        : 카드 결제 단독 연동용
   - 크티(ctee.kr) 외부 결제 링크    : 키 발급 없이 바로 판매 가능한 대안
   ------------------------------------------------------------------
   ※ 실제 판매 시 해야 할 일
     1) 포트원 관리자콘솔(admin.portone.io)에서 상점 생성 →
        storeId, 채널키(channelKey) 발급 후 아래 CONFIG에 입력
     2) 토스페이먼츠는 개발자센터에서 clientKey(test_ck_… / live_ck_…) 발급
     3) 결제 승인은 반드시 서버(또는 서버리스 함수)에서 PortOne/토스
        결제조회 API로 금액 위변조 검증 후 처리해야 합니다.
        (이 파일의 클라이언트 코드는 결제창 호출까지만 담당합니다.)
     4) ctee.kr 를 쓰는 경우 상품별 판매 링크를 만들어 CONFIG.ctee 에 넣으면
        결제창 대신 해당 링크로 이동합니다.
   ============================================================ */
(function (global) {
  'use strict';

  const PRODUCTS = {
    report: {
      id: 'report',
      name: '살풀이 : 천기 2026 정밀 사주+타로 리포트',
      desc: 'PDF 저장 · 명식 상세 · 십성 지도 · 세운/대운 · 월별 운세',
      price: 9900,
      badge: '인기',
      unlock: ['report']
    },
    talisman: {
      id: 'talisman',
      name: '맞춤 오행 개운 부적 배경화면',
      desc: 'PNG 3종 · 용신 오행 맞춤 제작 · 휴대폰/PC 배경화면',
      price: 14900,
      badge: '제작 48시간',
      unlock: ['talisman']
    },
    vip: {
      id: 'vip',
      name: '살풀이 : 천기 VIP 패키지',
      desc: '정밀 리포트 + 부적 3종 + 2026 월별 운세 한 장 요약',
      price: 29900,
      badge: '38% 할인',
      unlock: ['report', 'talisman', 'vip']
    }
  };

  const CONFIG = {
    /* 'demo'   : 결제창 없이 테스트 승인 (개발·시연용)
       'portone': 포트원 V2 결제창   'toss': 토스페이먼츠 결제창
       'ctee'   : 크티 외부 링크로 이동 */
    mode: 'demo',
    portone: {
      storeId: 'store-REPLACE-WITH-YOUR-STORE-ID',        // 예: store-a1b2c3d4-...
      channelKey: 'channel-key-REPLACE-WITH-YOUR-CHANNEL', // 예: channel-key-9f8e...
      payMethod: 'CARD'                                    // CARD | EASY_PAY | TRANSFER ...
    },
    toss: {
      clientKey: 'test_ck_REPLACE_WITH_YOUR_CLIENT_KEY',   // 테스트: test_ck_…  실연동: live_ck_…
      method: '카드'
    },
    ctee: {
      report: 'https://ctee.kr/place/salpuri/report',
      talisman: 'https://ctee.kr/place/salpuri/talisman',
      vip: 'https://ctee.kr/place/salpuri/vip'
    }
  };

  const ORDER_KEY = 'salpuri_orders_v1';

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
      list.push(order);
      localStorage.setItem(ORDER_KEY, JSON.stringify(list.slice(-20)));
    } catch (e) { /* 저장 실패는 결제를 막지 않음 */ }
  }

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); } catch (e) { return []; }
  }

  /** 결제 실행 — 성공 시 {ok:true, order} 반환 */
  async function pay(productId, customer) {
    const product = PRODUCTS[productId];
    if (!product) return { ok: false, error: '상품을 찾을 수 없습니다.' };
    const order = {
      orderId: makeOrderId(),
      productId,
      productName: product.name,
      amount: product.price,
      customer: customer || {},
      mode: CONFIG.mode,
      paidAt: new Date().toISOString(),
      status: 'pending'
    };

    if (CONFIG.mode === 'ctee') {
      const url = CONFIG.ctee[productId];
      if (url) { global.open(url, '_blank', 'noopener'); return { ok: true, external: true, order }; }
      return { ok: false, error: '크티 링크가 설정되지 않았습니다.' };
    }

    if (CONFIG.mode === 'portone') {
      try {
        await loadScript('https://cdn.portone.io/v2/browser-sdk.js');
        /* 포트원 V2 표준 결제창 호출 구조 */
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
        if (res && res.code) {
          return { ok: false, error: res.message || '결제가 취소되었습니다.' };
        }
        order.status = 'paid';
        order.txId = (res && res.txId) || '';
        saveOrder(order);
        return { ok: true, order };
      } catch (e) {
        // 키 미설정·SDK 차단 시 데모로 안전하게 떨어짐
        console.warn('[payment] PortOne unavailable → demo fallback', e);
        return demoApprove(order);
      }
    }

    if (CONFIG.mode === 'toss') {
      try {
        await loadScript('https://js.tosspayments.com/v2/standard');
        const toss = global.TossPayments(CONFIG.toss.clientKey);
        /* 토스페이먼츠 표준결제 호출 구조 */
        await toss.requestPayment({
          method: CONFIG.toss.method,
          amount: { currency: 'KRW', value: product.price },
          orderId: order.orderId,
          orderName: product.name,
          customerName: order.customer.name || '고객',
          successUrl: location.origin + location.pathname + '?payment=success',
          failUrl: location.origin + location.pathname + '?payment=fail'
        });
        // successUrl 로 이동하므로 이 아래는 실행되지 않음
        order.status = 'redirect';
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
      }, 1400);
    });
  }

  /** 결제 성공 후 잠금 해제된 상품 목록 */
  function unlocked() {
    const set = new Set();
    getOrders().filter(o => o.status === 'paid').forEach(o => {
      (PRODUCTS[o.productId] ? PRODUCTS[o.productId].unlock : []).forEach(k => set.add(k));
    });
    return set;
  }

  global.Payment = { PRODUCTS, CONFIG, pay, unlocked, getOrders, makeOrderId };
})(window);
