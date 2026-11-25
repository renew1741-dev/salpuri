/* ============================================================
   살풀이 : 천기 — 🔥 소름 돋아요 자체 카운터 (sooreum.gs)
   ------------------------------------------------------------
   쓰는 곳 : 「살풀이 천기 — 로그 백엔드」 Apps Script 프로젝트
             (스프레드시트 1t6dtF0jccq_YWDJRkKbgw8pXPDx03jQwunyGVYJU6Lk)

   왜 : 외부 무료 카운터(abacus.jasoncameron.dev)가 500 을 뱉어
        라이브에서 '지금까지 — 소름 돋아요' 로 보이던 문제를 없애기 위해
        우리 Apps Script + 시트 안에서 직접 셉니다.

   붙이는 방법
     1) 이 파일(sooreum.gs)을 프로젝트에 새 파일로 추가
     2) 기존 doGet / doPost 안에 라우팅 한 줄씩
          function doGet(e) {
            var srg = sooreumRoute_(e); if (srg) return srg;   // ← 추가
            ... 기존 코드
          function doPost(e) {
            ... body.key 검사 뒤
            var srh = sooreumPost_(body); if (srh) return srh;  // ← 추가
     3) [배포 관리 > 수정 > 새 버전] — 기존 URL 유지

   엔드포인트 (기존과 같은 /exec)
     GET  ?action=sooreum                      → { ok:true, count, serverTime }
     POST { key, type:'sooreum_hit', device }  → { ok:true, count, dup }
   ============================================================ */

var SR_SHEET = 'sooreum';
var SR_BASE = 6;   /* 2026-11-25 abacus 실측값에서 이어받음 — 부풀린 숫자 없음 */
var SR_HEAD = ['순번', '시각(KST)', '기기'];

/** sooreum 시트 (없으면 만들고 B1 에 이관 기준값을 심습니다) */
function srSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SR_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SR_SHEET);
    sh.getRange(1, 1).setValue('이관 기준값');
    sh.getRange(1, 2).setValue(SR_BASE);
    sh.getRange(2, 1).setValue('마지막 갱신');
    sh.getRange(2, 2).setValue(kst_());
    sh.getRange(3, 1, 1, 3).setValues([SR_HEAD]);
    sh.getRange(1, 1, 3, 1).setFontWeight('bold');
    sh.setFrozenRows(3);
  }
  return sh;
}

/** 총 횟수 = 이관 기준값 + 실제 방문자 줄 수 */
function srCount_(sh) {
  var base = Number(sh.getRange(1, 2).getValue()) || 0;
  var rows = Math.max(0, sh.getLastRow() - 3);
  return base + rows;
}

/** doGet 맨 앞에서 호출 — sooreum 요청이 아니면 null(기존 로그 조회로 넘김) */
function sooreumRoute_(e) {
  var p = (e && e.parameter) || {};
  if (String(p.action || '') !== 'sooreum') return null;
  var sh = srSheet_();
  return out_({ ok: true, count: srCount_(sh), serverTime: kst_() });
}

/** doPost 의 키 검사 뒤에서 호출 — sooreum_hit 이 아니면 null */
function sooreumPost_(body) {
  if (String((body && body.type) || '') !== 'sooreum_hit') return null;
  var sh = srSheet_();
  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (err) {}
  try {
    var dev = String((body && body.device) || '').slice(0, 60);
    var last = sh.getLastRow();
    /* 같은 기기에서 이미 누른 기록이 최근 1,000줄 안에 있으면 숫자를 올리지 않습니다 */
    if (dev && last >= 4) {
      var from = Math.max(4, last - 999);
      var seen = sh.getRange(from, 3, last - from + 1, 1).getValues();
      for (var i = 0; i < seen.length; i++) {
        if (String(seen[i][0]) === dev) {
          return out_({ ok: true, count: srCount_(sh), dup: true, serverTime: kst_() });
        }
      }
    }
    var row = last + 1;
    sh.getRange(row, 1).setValue(row - 3);
    sh.getRange(row, 2).setNumberFormat('@').setValue(kst_());
    sh.getRange(row, 3).setValue(dev);
    sh.getRange(2, 2).setNumberFormat('@').setValue(kst_());
    return out_({ ok: true, count: srCount_(sh), dup: false, serverTime: kst_() });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

/** 편집기에서 실행해 확인용: 시트를 만들고 현재 숫자를 로그에 남깁니다 */
function srSelfTest() {
  var sh = srSheet_();
  var n = srCount_(sh);
  Logger.log('sooreum count = ' + n);
  return n;
}
