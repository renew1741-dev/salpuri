# 살풀이 : 천기 — 관리자 프리패스 & 실시간 로그 대시보드

## 1. 관리자 프리패스 (사이트)

- 주소: `https://renew1741-dev.github.io/salpuri/?admin=salpuri83`
  - 접속하면 `localStorage.salpuri_admin_mode = '1'` 저장 후 주소창에서 admin 파라미터를 자동 제거합니다.
  - `?admin=off` 로 일반(손님) 모드 복귀.
- 동작(`js/vault.js`): `Vault.isAdmin()` 이 true면 `isOpen()` 이 **모든 섹션(saju·baby·gaewun·naming)에서 true** → 가림막·결제 잠금 0개.
  - 리포트(`renderReport`), 부적 4종(`hasTalisman`), 작명 후보 5선(`NamingText.render({unlocked})`)까지 전부 열립니다.
- 하단 고정 뱃지: `👑 관리자 모드 ON · [대시보드] · [일반모드로 보기]` (인쇄 시 자동 숨김)
- 관리자 프리패스 상태에서 발생한 기록에는 `admin:true` 가 붙어 대시보드에서 `👑` 표시 / [관리자 테스트 제외]로 분리됩니다.

## 2. 실시간 로그 백엔드 (Google Apps Script + Google Sheet, 무료)

- Google Sheet: `살풀이 천기 — 방문·점사·결제 로그`
  `https://docs.google.com/spreadsheets/d/1t6dtF0jccq_YWDJRkKbgw8pXPDx03jQwunyGVYJU6Lk/edit`
  열: 번호 | 시각(KST) | 구분 | 카테고리 | 이름 | 생년월일·성별 | 상품 | 금액 | 결제수단 | 상세 | 관리자 | 기기 | 페이지 | 주문번호
- Apps Script 프로젝트: `살풀이 천기 — 로그 백엔드` (버전 3 배포, 실행=대표님 계정, 액세스=모든 사용자)
  - 엔드포인트 `https://script.google.com/macros/s/AKfycbzIJ4UDjesjj9ywiOGY2IYHSuSpqElFGMnLw7y97VEwKcSNovmfKMsBVNB4LxM-4zWW/exec`
  - `doPost` — 이벤트 1건 기록 (write key `sp-w-8307`)
  - `doGet?key=salpuri83&limit=4000` — 대시보드용 조회 (키 없으면 `unauthorized`)
  - 시각은 `'YYYY-MM-DD HH:MM:SS'` 텍스트로 저장(시트가 날짜로 변환하지 않게 처리), 응답에 `Access-Control-Allow-Origin: *` 확인.

## 3. 이벤트 (js/analytics.js · app.js)

| type | 언제 | 담기는 값 |
|---|---|---|
| visit | 페이지 로드(60초 중복 방지) | 기기 ID·OS/브라우저, 페이지 |
| reading | 사주·아이사주·궁합·오늘·신살·신년·재물·택일·외모·점·작명·타로 실행 | 카테고리, 이름, 생년월일·성별·시간유무, 일주·격국·카드 등 |
| share_unlock | 공유/링크복사로 잠금 해제 | 카테고리, 해금 방식 |
| pay_attempt | 결제 버튼 | 상품명, 금액, 결제수단 |
| pay_complete | 결제 완료(데모 포함) | 상품명, 금액, 수단, 주문번호 |

- 같은 카테고리·같은 명식의 reading 은 5분간 묶어 탭 전환 도배를 막습니다.
- 전송 실패 시 localStorage 큐에 담아 다음 기록 때 재전송.

## 4. 관리자 대시보드 (admin.html)

- 주소: `https://renew1741-dev.github.io/salpuri/admin.html` · PIN `salpuri83` (PIN 자체가 서버 조회 키 → 소스에 키 미노출)
- KPI(오늘 방문/점사/공유 해금/결제·매출), 카테고리 막대, 실시간 피드, 타임라인 표(날짜·시:분:초 | 구분 | 이름 | 카테고리/상품 | 상세 | 금액)
- 필터: 전체/점사/공유/결제/방문 · 오늘/7일/전체 · 카테고리 · 관리자 테스트 제외 · 검색
- 10초 자동갱신(토글), 새로고침, 잠그기, `[👑 내 폰 관리자 프리패스 켜기/끄기]`

## 5. 인쇄(PDF) 정리

- 관리자 뱃지·상점(가격표) 영역은 인쇄에서 제외, 여백·행간을 조여 **표지+8장 = 9쪽**으로 저장됩니다.

## 6. 확인이 필요한 것

- 읽기 PIN(`salpuri83`)은 정적 사이트 특성상 강한 보안이 아닙니다. 필요하면 추후 로그인/2차 키로 강화.
- 쓰기 키가 공개 JS에 있어 스팸 기록이 가능합니다(현재 type 검증만).
- 방문자 이름·생년월일이 대표님 시트에 쌓이므로 개인정보 수집 고지 문구는 별도 판단 필요.
