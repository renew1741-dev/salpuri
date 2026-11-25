/* ============================================================
   살풀이 : 천기 — 실제 PDF 파일 생성·다운로드 (js/pdf.js)
   ------------------------------------------------------------
   · 인쇄 대화상자(window.print) 없이 진짜 .pdf 파일을 만들어 저장합니다.
   · 리포트 10쪽을 오프스크린 스테이지(css/pdf.css)에 밝은 인쇄 테마로 다시 그린 뒤
     html2canvas 로 2배 해상도 캔버스로 뜨고, jsPDF 로 A4(210×297mm) 페이지에 담습니다.
     (한글은 폰트 임베딩이 아니라 그림으로 들어가므로 절대 깨지지 않습니다)
   · 안드로이드 인앱 웹뷰(카톡·스레드·인스타)에서 blob 다운로드가 막히면
     Chrome 열기(intent://) · 공유로 저장 · 인쇄(PDF) 보조 수단을 안내합니다.
   ============================================================ */
(function (global) {
  'use strict';

  var H2C_SRC = 'js/html2canvas.min.js?v=1.4.1';
  var JSPDF_SRC = 'js/jspdf.umd.min.js?v=2.5.1';

  var PAGE_W = 794;          /* A4 폭 96dpi */
  var PAGE_H = 1123;         /* A4 높이 96dpi */
  var A4_W_MM = 210, A4_H_MM = 297;
  var SCALE = 2;             /* 2배 해상도 → 인쇄 품질 */
  var IMG_QUALITY = 0.92;

  var assetsReady = null;
  var busy = false;

  /* ---------------- 유틸 ---------------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { reject(new Error('스크립트를 불러오지 못했습니다: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureAssets() {
    if (assetsReady) return assetsReady;
    var jobs = [];
    if (!global.html2canvas) jobs.push(loadScript(H2C_SRC));
    if (!(global.jspdf && global.jspdf.jsPDF)) jobs.push(loadScript(JSPDF_SRC));
    assetsReady = Promise.all(jobs).then(function () {
      if (!global.html2canvas) throw new Error('html2canvas 로드 실패');
      if (!(global.jspdf && global.jspdf.jsPDF)) throw new Error('jsPDF 로드 실패');
      return true;
    }).catch(function (e) { assetsReady = null; throw e; });
    return assetsReady;
  }

  function waitFonts() {
    if (!(document.fonts && document.fonts.ready)) return Promise.resolve();
    return Promise.race([
      document.fonts.ready,
      new Promise(function (r) { setTimeout(r, 2500); })
    ]);
  }

  function nextFrame() {
    return new Promise(function (r) { setTimeout(r, 16); });
  }

  function safeFileName(name) {
    var n = (name || '').replace(/[\\/:*?"<>|\r\n\t]/g, '').trim();
    if (n.length > 24) n = n.slice(0, 24);
    return '살풀이천기_' + (n || '리포트') + '_정밀리포트.pdf';
  }

  function isInApp() {
    var ua = navigator.userAgent || '';
    if (/KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Threads|NAVER\(|DaumApps|Line\/|Twitter|musical_ly|Bytedance|Snapchat/i.test(ua)) return true;
    if (/Android/i.test(ua) && /;\s*wv\)/i.test(ua)) return true;   /* 안드로이드 일반 웹뷰 */
    return false;
  }

  function isAndroid() { return /Android/i.test(navigator.userAgent || ''); }
  function isIOS() { return /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (/Macintosh/.test(navigator.userAgent || '') && 'ontouchend' in document); }

  function chromeIntentUrl() {
    var host = location.host + location.pathname + (location.search || '');
    var https = location.origin + location.pathname + (location.search || '');
    return 'intent://' + host + '#Intent;scheme=https;package=com.android.chrome;' +
      'S.browser_fallback_url=' + encodeURIComponent(https) + ';end';
  }

  /* ---------------- 리포트 10쪽을 PDF 스테이지로 ---------------- */
  function buildStage(a) {
    var textMod = global.SajuText;
    if (!textMod || typeof textMod.buildPremium !== 'function') {
      throw new Error('리포트 생성 모듈(SajuText)을 찾지 못했습니다.');
    }
    var old = document.getElementById('pdfStage');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var probe = document.createElement('div');
    probe.innerHTML = textMod.buildPremium(a);
    var pages = [].slice.call(probe.querySelectorAll('.rep-page'));
    if (!pages.length) throw new Error('리포트 내용이 비어 있습니다.');

    var host = document.createElement('div');
    host.id = 'pdfStage';
    host.className = 'pdf-stage';
    host.setAttribute('aria-hidden', 'true');

    var who = a && a.name ? (a.name + ' 님') : '';
    var total = pages.length;

    pages.forEach(function (pg, i) {
      var sheet = document.createElement('div');
      sheet.className = 'pdf-sheet' + (pg.classList.contains('report-head') ? ' pdf-cover' : '');
      sheet.setAttribute('data-page', String(i + 1));
      sheet.appendChild(pg);

      var foot = document.createElement('div');
      foot.className = 'pdf-foot';
      foot.innerHTML = '<span class="pdf-foot-brand">살풀이 : 천기 · 天機</span>' +
        '<span>' + (who ? who + ' · ' : '') + '정밀 사주 리포트</span>' +
        '<span class="pdf-foot-num">' + (i + 1) + ' / ' + total + '</span>';
      sheet.appendChild(foot);

      host.appendChild(sheet);
    });

    document.body.appendChild(host);
    return {
      host: host,
      sheets: [].slice.call(host.querySelectorAll('.pdf-sheet'))
    };
  }

  /* ---------------- 캔버스로 뜨기 ---------------- */
  function captureSheet(sheet) {
    var h = Math.max(PAGE_H, Math.ceil(sheet.getBoundingClientRect().height));
    return global.html2canvas(sheet, {
      scale: SCALE,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: PAGE_W,
      height: h,
      windowWidth: PAGE_W,
      windowHeight: h,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 8000,
      removeContainer: true
    });
  }

  /* ---------------- 캔버스 → 이미지 데이터 (메모리 즉시 해제) ---------------- */
  function encodeCanvas(canvas) {
    var ratio = canvas.height / canvas.width;
    var data, type = 'PNG';
    try {
      data = canvas.toDataURL('image/png');
      /* PNG 가 너무 무거우면(쪽당 3.5MB 이상) JPEG 로 대체 */
      if (data.length > 4800000) {
        data = canvas.toDataURL('image/jpeg', IMG_QUALITY);
        type = 'JPEG';
      }
    } catch (e) {
      data = canvas.toDataURL('image/jpeg', IMG_QUALITY);
      type = 'JPEG';
    }
    try { canvas.width = 0; canvas.height = 0; } catch (e) {}
    return { data: data, type: type, ratio: ratio };
  }

  /* ---------------- PDF 조립 ---------------- */
  function assemble(images) {
    var JsPDF = global.jspdf.jsPDF;
    var pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    images.forEach(function (img, idx) {
      if (idx > 0) pdf.addPage('a4', 'portrait');
      var ratio = img.ratio;                            /* 높이/폭 */
      var w = A4_W_MM, h = A4_W_MM * ratio;
      if (h > A4_H_MM) { h = A4_H_MM; w = A4_H_MM / ratio; }
      var x = (A4_W_MM - w) / 2, y = (A4_H_MM - h) / 2;
      pdf.addImage(img.data, img.type, x, y, w, h, 'p' + (idx + 1), 'MEDIUM');
      img.data = null;                                  /* 쪽마다 즉시 비움 */
    });

    return { pdf: pdf };
  }

  /* ---------------- 다운로드 ---------------- */
  function saveBlob(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    a.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(a);
    try { a.click(); } catch (e) {}
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 4000);
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 120000);
  }

  /* ---------------- 진행/안내 오버레이 ---------------- */
  var ui = null;

  function buildUI() {
    if (ui) return ui;
    var wrap = document.createElement('div');
    wrap.className = 'pdf-ui';
    wrap.id = 'pdfUi';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML =
      '<div class="pdf-ui-card">' +
        '<div class="pdf-ui-head">' +
          '<span class="pdf-ui-kicker">살풀이 : 천기 · PDF</span>' +
          '<h3 class="pdf-ui-title" id="pdfUiTitle">PDF 만드는 중…</h3>' +
          '<p class="pdf-ui-sub" id="pdfUiSub">열 쪽을 한 장씩 그려서 묶는 중이에요.</p>' +
        '</div>' +
        '<div class="pdf-ui-bar"><i id="pdfUiBar" style="width:6%"></i></div>' +
        '<div class="pdf-ui-prog" id="pdfUiProg">0 / 8 쪽</div>' +
        '<div class="pdf-ui-actions" id="pdfUiActions"></div>' +
        '<div class="pdf-ui-help" id="pdfUiHelp" hidden>' +
          '<p><b>저장이 시작되지 않았다면</b> 인앱 브라우저(카카오톡·스레드·인스타그램)의 다운로드 제한입니다. 아래 방법 중 하나로 받으실 수 있어요.</p>' +
          '<ol>' +
            '<li>카톡으로 보내시려면 <b>[💬 내 카톡(공유)으로 PDF 보내기]</b> → <b>카카오톡</b> → <b>나와의 채팅</b></li>' +
            '<li>오른쪽 위 <b>⋮</b>(또는 <b>···</b>) → <b>다른 브라우저로 열기</b> → 크롬/삼성인터넷</li>' +
            '<li>아래 <b>[크롬으로 열기]</b> 를 누르면 크롬에서 같은 화면이 열립니다. 사주를 한 번 더 조회한 뒤 다시 저장해 주세요.</li>' +
            '<li><b>[🖨️ 인쇄로 PDF 저장]</b> → 인쇄 화면에서 프린터 대신 <b>PDF로 저장</b>을 고르세요.</li>' +
          '</ol>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    ui = {
      wrap: wrap,
      title: wrap.querySelector('#pdfUiTitle'),
      sub: wrap.querySelector('#pdfUiSub'),
      bar: wrap.querySelector('#pdfUiBar'),
      prog: wrap.querySelector('#pdfUiProg'),
      actions: wrap.querySelector('#pdfUiActions'),
      help: wrap.querySelector('#pdfUiHelp')
    };
    return ui;
  }

  function showUI(opts) {
    var u = buildUI();
    u.wrap.classList.add('show');
    u.wrap.classList.toggle('is-busy', !!(opts && opts.busy));
    u.title.textContent = (opts && opts.title) || 'PDF 만드는 중…';
    u.sub.textContent = (opts && opts.sub) || '';
    u.sub.style.whiteSpace = 'pre-line';
    u.prog.textContent = (opts && opts.prog) || '';
    u.prog.hidden = !(opts && opts.prog) && !(opts && opts.busy);
    u.bar.parentNode.hidden = !(opts && opts.busy);
    setProgress(opts && opts.pct ? opts.pct : 0);

    u.actions.innerHTML = '';
    ((opts && opts.actions) || []).forEach(function (act) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pdf-ui-btn' + (act.primary ? ' primary' : '');
      b.textContent = act.label;
      b.onclick = act.onClick;
      u.actions.appendChild(b);
    });
    u.actions.hidden = !u.actions.children.length;

    if (opts && opts.help) { u.help.hidden = false; } else { u.help.hidden = true; }
  }

  function hideUI() {
    if (!ui) return;
    ui.wrap.classList.remove('show', 'is-busy');
  }

  function setProgress(pct) {
    if (!ui) return;
    ui.bar.style.width = Math.max(4, Math.min(100, Math.round(pct || 0))) + '%';
  }

  /* ---------------- 메인: PDF 만들어 저장 ---------------- */
  function saveReport(analysis) {
    if (busy) return Promise.resolve({ ok: false, reason: 'busy' });
    if (!analysis) {
      showUI({
        title: '명식을 먼저 조회해 주세요',
        sub: '사주를 한 번 조회한 뒤에 리포트 PDF를 만들 수 있어요.',
        actions: [{ label: '닫기', onClick: hideUI }]
      });
      return Promise.resolve({ ok: false, reason: 'no-analysis' });
    }

    busy = true;
    var fileName = safeFileName(analysis.name);
    var stage = null;

    showUI({ busy: true, title: 'PDF 만드는 중…', sub: '열 쪽을 한 장씩 그려서 묶는 중이에요.', prog: '준비 중', pct: 4 });

    return waitFonts()
      .then(function () { return ensureAssets(); })
      .then(function () {
        setProgress(8);
        stage = buildStage(analysis);
        var sheets = stage.sheets;
        var images = [];

        var chain = Promise.resolve();
        sheets.forEach(function (sheet, i) {
          chain = chain.then(function () {
            if (ui) {
              ui.prog.hidden = false;
              ui.prog.textContent = (i + 1) + ' / ' + sheets.length + ' 쪽';
            }
            setProgress(10 + (i / sheets.length) * 78);
            return nextFrame().then(function () { return captureSheet(sheet); })
              .then(function (canvas) {
                images.push(encodeCanvas(canvas));
                setProgress(10 + ((i + 1) / sheets.length) * 78);
              });
          });
        });
        return chain.then(function () {
          /* 스테이지를 먼저 걷어 메모리를 비운다 */
          if (stage && stage.host && stage.host.parentNode) stage.host.parentNode.removeChild(stage.host);
          return images;
        });
      })
      .then(function (images) {
        if (ui) { ui.prog.textContent = '파일로 묶는 중'; }
        setProgress(92);
        return nextFrame().then(function () { return assemble(images); });
      })
      .then(function (built) {
        var blob = built.pdf.output('blob');
        if (ui) { ui.prog.textContent = '저장 시작'; }
        setProgress(100);
        saveBlob(blob, fileName);
        return { ok: true, blob: blob, fileName: fileName, bytes: blob.size, pages: (stage ? stage.sheets.length : 0), inApp: isInApp() };
      })
      .then(function (res) {
        var mb = (res.bytes / 1048576).toFixed(1);
        var acts = [{ label: '닫기', onClick: hideUI }];

        /* 💬 내 카톡(공유)으로 PDF 보내기 — 파일 자체를 공유 시트로 넘긴다 */
        acts.unshift({
          label: '💬 내 카톡(공유)으로 PDF 보내기',
          primary: true,
          onClick: function () { sharePdfFile(res); }
        });

        if (isAndroid() && res.inApp) {
          acts.unshift({
            label: '🌐 크롬으로 열기',
            onClick: function () {
              try { location.href = chromeIntentUrl(); } catch (e) {}
            }
          });
        }
        acts.push({
          label: '저장이 안 되나요?',
          onClick: function () { showHelp(res, mb); }
        });

        showUI({
          busy: false,
          title: '✅ ' + res.pages + '쪽 PDF를 만들었어요',
          sub: res.fileName + ' · ' + mb + 'MB · 다운로드 폴더를 확인해 주세요.' +
            (res.inApp ? '\n다운로드가 안 보이면 [저장이 안 되나요?]를 눌러 주세요.' : ''),
          pct: 100,
          actions: acts
        });
        return res;
      })
      .catch(function (err) {
        showUI({
          busy: false,
          title: 'PDF를 만들지 못했어요',
          sub: (err && err.message ? err.message : '알 수 없는 오류') + ' — 인쇄로 저장하면 같은 10쪽 리포트를 받으실 수 있어요.',
          actions: [
            { label: '🖨️ 인쇄로 PDF 저장', primary: true, onClick: function () { hideUI(); setTimeout(function () { try { global.print(); } catch (e) {} }, 120); } },
            { label: '다시 시도', onClick: function () { hideUI(); saveReport(analysis); } },
            { label: '닫기', onClick: hideUI }
          ]
        });
        return { ok: false, error: (err && err.message) || String(err) };
      })
      .then(function (out) {
        busy = false;
        if (stage && stage.host && stage.host.parentNode) stage.host.parentNode.removeChild(stage.host);
        return out;
      });
  }

  /* ---------------- 💬 PDF 파일 자체를 공유(카톡 나와의 채팅 등) ---------------- */
  function makeFile(res) {
    try { return new File([res.blob], res.fileName, { type: 'application/pdf' }); }
    catch (e) { return null; }
  }

  function canShareFiles(file) {
    try {
      return !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
    } catch (e) { return false; }
  }

  function showHelp(res, mb) {
    showUI({
      title: 'PDF 파일이 만들어졌어요',
      sub: res.fileName + ' · ' + res.pages + '쪽 · ' + mb + 'MB',
      help: true,
      actions: [
        { label: '💬 내 카톡(공유)으로 PDF 보내기', primary: true, onClick: function () { sharePdfFile(res); } },
        { label: '저장 다시 시도', onClick: function () { saveBlob(res.blob, res.fileName); } },
        (isAndroid() ? { label: '🌐 크롬으로 열기', onClick: function () { try { location.href = chromeIntentUrl(); } catch (e) {} } } : null),
        { label: '🖨️ 인쇄로 PDF 저장', onClick: function () { hideUI(); setTimeout(function () { try { global.print(); } catch (e) {} }, 120); } },
        { label: '닫기', onClick: hideUI }
      ].filter(Boolean)
    });
  }

  function sharePdfFile(res) {
    var file = makeFile(res);

    /* 공유 시트를 쓸 수 없으면(인앱 웹뷰 등) 저장을 시도하고 안내만 띄운다 */
    if (!canShareFiles(file)) {
      saveBlob(res.blob, res.fileName);
      showUI({
        title: '이 브라우저에선 파일 직접 전송이 막혀 있어요',
        sub: '인앱 브라우저에선 파일 직접 전송이 막혀 있어요. 저장된 PDF를 카톡에 첨부하거나, ' +
          '오른쪽 위 ⋮ → 다른 브라우저(크롬)로 열기 후 눌러주세요!',
        help: true,
        actions: [
          (isAndroid() ? { label: '🌐 크롬으로 열기', primary: true, onClick: function () { try { location.href = chromeIntentUrl(); } catch (e) {} } } : null),
          { label: '저장 다시 시도', primary: !isAndroid(), onClick: function () { saveBlob(res.blob, res.fileName); } },
          { label: '🖨️ 인쇄로 PDF 저장', onClick: function () { hideUI(); setTimeout(function () { try { global.print(); } catch (e) {} }, 120); } },
          { label: '닫기', onClick: hideUI }
        ].filter(Boolean)
      });
      return Promise.resolve({ ok: false, reason: 'no-file-share' });
    }

    var payload = {
      files: [file],
      title: '살풀이 : 천기 — 정밀 사주 리포트',
      text: '살풀이 : 천기 10쪽 정밀 리포트 (올해·내년 달력)'
    };
    return Promise.resolve()
      .then(function () { return navigator.share(payload); })
      .then(function () {
        showUI({
          title: '공유 창을 열었어요',
          sub: '카카오톡을 고르면 [나와의 채팅]으로 PDF가 바로 전송돼요.',
          pct: 100,
          actions: [
            { label: '💬 한 번 더 보내기', primary: true, onClick: function () { sharePdfFile(res); } },
            { label: '닫기', onClick: hideUI }
          ]
        });
        return { ok: true };
      })
      .catch(function (err) {
        var aborted = err && (err.name === 'AbortError' || /abort|cancel/i.test(err.message || ''));
        if (aborted) return { ok: false, reason: 'cancel' };
        /* 공유가 실패하면 저장으로 되돌린다 */
        saveBlob(res.blob, res.fileName);
        showUI({
          title: '공유 창을 열지 못했어요',
          sub: '대신 PDF 파일을 저장했어요. 카톡에 파일을 첨부해 보내주세요.',
          pct: 100,
          actions: [
            { label: '💬 다시 시도', primary: true, onClick: function () { sharePdfFile(res); } },
            { label: '닫기', onClick: hideUI }
          ]
        });
        return { ok: false, reason: 'share-failed', error: (err && err.message) || '' };
      });
  }

  function preload() { return ensureAssets().catch(function () {}); }

  global.SalpuriPDF = {
    saveReport: saveReport,
    preload: preload,
    isInApp: isInApp,
    fileNameFor: function (a) { return safeFileName(a && a.name); }
  };})(window);
