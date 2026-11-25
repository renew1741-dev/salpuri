/* ============================================================
   살풀이 : 천기 — 방문 · 점사 · 결제 로깅 (analytics.js)
   ------------------------------------------------------------
   · 기록은 대표님 Google Sheet에 쌓입니다 (Apps Script 웹앱 경유).
   · 시각은 KST 기준 'YYYY-MM-DD HH:MM:SS' 로 보냅니다.
   · 네트워크가 막히면 localStorage 큐에 담아 두었다가 다음 기록 때 다시 보냅니다.
   · 관리자 프리패스(localStorage salpuri_admin_mode)가 켜져 있으면
     모든 기록에 admin:true 를 붙여 대시보드에서 [관리자 테스트]로 구분/제외할 수 있습니다.
   ============================================================ */
(function (global) {
  'use strict';

  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzIJ4UDjesjj9ywiOGY2IYHSuSpqElFGMnLw7y97VEwKcSNovmfKMsBVNB4LxM-4zWW/exec';
  const WKEY = 'sp-w-8307';
  const DEVICE_KEY = 'salpuri_device_id_v1';
  const QUEUE_KEY = 'salpuri_log_queue_v1';
  const SEEN_KEY = 'salpuri_log_seen_v1';
  const ADMIN_KEY = 'salpuri_admin_mode';

  function pad2(n) { return String(n).padStart(2, '0'); }

  /** KST 현재 시각 → 'YYYY-MM-DD HH:MM:SS' */
  function kstNow(d) {
    const t = d || new Date();
    try {
      const s = t.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
    } catch (e) {}
    const u = new Date(t.getTime() + 9 * 3600 * 1000);
    return `${u.getUTCFullYear()}-${pad2(u.getUTCMonth() + 1)}-${pad2(u.getUTCDate())} ` +
      `${pad2(u.getUTCHours())}:${pad2(u.getUTCMinutes())}:${pad2(u.getUTCSeconds())}`;
  }

  function adminOn() {
    try {
      if (global.Vault && typeof global.Vault.isAdmin === 'function') return !!global.Vault.isAdmin();
      return localStorage.getItem(ADMIN_KEY) === '1';
    } catch (e) { return false; }
  }

  function deviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id) {
        id = 'd' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
        localStorage.setItem(DEVICE_KEY, id);
      }
      return id;
    } catch (e) { return 'anon'; }
  }

  function deviceLabel() {
    const ua = navigator.userAgent || '';
    const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Android/.test(ua) ? 'Android'
        : /Windows/.test(ua) ? 'Windows'
          : /Mac OS X/.test(ua) ? 'Mac' : '기타';
    const br = /KAKAOTALK/i.test(ua) ? '카톡인앱'
      : /NAVER\(inapp/i.test(ua) ? '네이버인앱'
        : /Instagram/i.test(ua) ? '인스타인앱'
          : /Chrome\//.test(ua) && !/Edg\//.test(ua) ? 'Chrome'
            : /Safari\//.test(ua) && !/Chrome\//.test(ua) ? 'Safari'
              : /Edg\//.test(ua) ? 'Edge' : '웹';
    return os + '·' + br;
  }

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-40))); } catch (e) {}
  }

  function send(payload) {
    const body = JSON.stringify(payload);
    return fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      keepalive: body.length < 60000
    }).then(r => r.text()).then(txt => {
      try { return JSON.parse(txt); } catch (e) { return { ok: false }; }
    });
  }

  let flushing = false;
  function flush() {
    if (flushing) return;
    const q = readQueue();
    if (!q.length) return;
    flushing = true;
    const first = q[0];
    send(first).then(res => {
      flushing = false;
      if (res && res.ok) {
        const left = readQueue();
        left.shift();
        writeQueue(left);
        if (left.length) setTimeout(flush, 400);
      }
    }).catch(() => { flushing = false; });
  }

  /* 상품 금액 기준표 — 결제 로그에 금액이 빠져 있을 때 채워 넣습니다
     (2인 동반 패키지 = 17,900원 · 정가 19,800원) */
  const PRODUCT_PRICE = [
    { re: /2인\s*동반/, price: 17900 },
    { re: /VIP/i, price: 29900 },
    { re: /작명/, price: 29000 },
    { re: /부적/, price: 14900 },
    { re: /리포트/, price: 9900 }
  ];
  function priceOf(product) {
    const p = String(product || '');
    for (let i = 0; i < PRODUCT_PRICE.length; i++) {
      if (PRODUCT_PRICE[i].re.test(p)) return PRODUCT_PRICE[i].price;
    }
    return '';
  }

  /** 이벤트 1건 기록 */
  function log(type, data) {
    const d = data || {};
    const payload = {
      key: WKEY,
      type: String(type || '').slice(0, 20),
      ts: kstNow(),
      category: d.category || '',
      name: d.name || '',
      birth: d.birth || '',
      product: d.product || '',
      amount: d.amount == null || d.amount === '' ? priceOf(d.product) : d.amount,
      method: d.method || '',
      detail: d.detail || '',
      orderId: d.orderId || '',
      admin: adminOn(),
      device: deviceId() + ' ' + deviceLabel(),
      page: (location.pathname || '/') + (location.hash || '')
    };
    flush();
    send(payload).catch(() => {
      const q = readQueue();
      q.push(payload);
      writeQueue(q);
    });
    return payload;
  }

  /** 같은 카테고리·같은 명식의 반복 기록을 5분간 묶습니다(탭 전환 도배 방지) */
  function logReading(category, a, detail) {
    let seen = {};
    try { seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || '{}'); } catch (e) {}
    const birth = a && a.solar ? `${a.solar.y}-${pad2(a.solar.m)}-${pad2(a.solar.d)}` : '';
    const key = category + '|' + (a && a.name ? a.name : '') + '|' + birth + '|' + (detail || '');
    const now = Date.now();
    if (seen[key] && now - seen[key] < 5 * 60 * 1000) return null;
    seen[key] = now;
    const keys = Object.keys(seen);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete seen[k]);
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
    return log('reading', {
      category,
      name: a && a.name ? a.name : '',
      birth: birth ? birth + ' ' + (a.gender || '') + (a.timeKnown ? '' : ' · 시간모름') : '',
      detail: detail || ''
    });
  }

  /** 접속 기록 — 같은 탭에서 1분 안에 두 번 세지 않습니다 */
  function visit() {
    try {
      const k = 'salpuri_visit_at';
      const last = +sessionStorage.getItem(k) || 0;
      if (Date.now() - last < 60 * 1000) return null;
      sessionStorage.setItem(k, String(Date.now()));
    } catch (e) {}
    return log('visit');
  }

  function init() {
    try { flush(); } catch (e) {}
    visit();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') flush();
    });
  }

  global.SalpuriLog = { log, logReading, visit, flush, kstNow, adminOn, deviceLabel, priceOf, ENDPOINT };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
