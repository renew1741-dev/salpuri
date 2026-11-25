/* ============================================================
   살풀이 : 천기 — 개운 처방 화면 생성
   ① 체형·체중 ② 헤어 ③ 신체 점 ④ 말투 ⑤ 생활 개운
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const G = global.Gaewun;
  const el = e => `${S.ELEM_KO[e]}(${S.ELEM_HANJA[e]})`;
  const n = v => Math.round(v * 10) / 10;
  const kgTxt = v => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));

  const who = a => (a.name ? `${a.name} 님` : '당신');

  function shareRow(tag, label) {
    return `<div class="pl-share-row">
      <button class="share-btn" data-share="${tag}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M12 3 8.5 6.5M12 3l3.5 3.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${label || '친구에게 보내기'}
      </button>
    </div>`;
  }

  /* ============================================================
     체형 실루엣
     ============================================================ */
  function silhouette(cx, top, H, o) {
    const base = top + H;
    const headR = H * 0.060;
    const headCy = top + headR;
    const shoulderY = headCy + headR + H * 0.052;
    const waistY = shoulderY + H * 0.150;
    const hipY = waistY + H * 0.100;
    const kneeY = hipY + H * 0.195;
    const ankleY = base - H * 0.012;
    const sh = H * o.sh, ws = H * o.ws, hp = H * o.hp;
    const cls = o.cls || '';

    const torso =
      `M ${n(cx - sh * 0.44)} ${n(shoulderY - H * 0.020)} ` +
      `C ${n(cx - sh * 0.80)} ${n(shoulderY - H * 0.010)} ${n(cx - sh)} ${n(shoulderY + H * 0.012)} ${n(cx - sh)} ${n(shoulderY + H * 0.040)} ` +
      `C ${n(cx - sh + 1)} ${n(waistY - H * 0.045)} ${n(cx - ws - 2)} ${n(waistY - H * 0.028)} ${n(cx - ws)} ${n(waistY)} ` +
      `C ${n(cx - ws - 1)} ${n(hipY - H * 0.032)} ${n(cx - hp + 1)} ${n(hipY - H * 0.020)} ${n(cx - hp)} ${n(hipY)} ` +
      `Q ${n(cx)} ${n(hipY + H * 0.022)} ${n(cx + hp)} ${n(hipY)} ` +
      `C ${n(cx + hp - 1)} ${n(hipY - H * 0.020)} ${n(cx + ws + 1)} ${n(hipY - H * 0.032)} ${n(cx + ws)} ${n(waistY)} ` +
      `C ${n(cx + ws + 2)} ${n(waistY - H * 0.028)} ${n(cx + sh - 1)} ${n(waistY - H * 0.045)} ${n(cx + sh)} ${n(shoulderY + H * 0.040)} ` +
      `C ${n(cx + sh)} ${n(shoulderY + H * 0.012)} ${n(cx + sh * 0.80)} ${n(shoulderY - H * 0.010)} ${n(cx + sh * 0.44)} ${n(shoulderY - H * 0.020)} Z`;

    const legL =
      `M ${n(cx - hp * 0.96)} ${n(hipY - H * 0.010)} ` +
      `C ${n(cx - hp * 0.86)} ${n(hipY + H * 0.060)} ${n(cx - hp * 0.66)} ${n(kneeY - H * 0.03)} ${n(cx - hp * 0.54)} ${n(ankleY)} ` +
      `L ${n(cx - hp * 0.16)} ${n(ankleY)} ` +
      `C ${n(cx - hp * 0.22)} ${n(kneeY - H * 0.02)} ${n(cx - hp * 0.20)} ${n(hipY + H * 0.055)} ${n(cx - hp * 0.04)} ${n(hipY + H * 0.022)} Z`;
    const mirror = d => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${n(2 * cx - (+x))} ${y}`);
    const armL =
      `M ${n(cx - sh * 0.90)} ${n(shoulderY + H * 0.036)} ` +
      `C ${n(cx - sh * 1.04)} ${n(waistY - H * 0.02)} ${n(cx - sh * 0.96)} ${n(hipY)} ${n(cx - sh * 0.66)} ${n(hipY + H * 0.050)} ` +
      `L ${n(cx - sh * 0.54)} ${n(hipY + H * 0.040)} ` +
      `C ${n(cx - sh * 0.76)} ${n(hipY - H * 0.02)} ${n(cx - sh * 0.80)} ${n(waistY - H * 0.02)} ${n(cx - sh * 0.72)} ${n(shoulderY + H * 0.042)} Z`;
    const armR = mirror(armL);

    return `<g class="gw-fig ${cls}">
      <circle class="gw-fig-head" cx="${n(cx)}" cy="${n(headCy)}" r="${n(headR)}" />
      <path class="gw-fig-neck" d="M ${n(cx - 7)} ${n(headCy + headR * 0.62)} L ${n(cx - 8)} ${n(shoulderY)} L ${n(cx + 8)} ${n(shoulderY)} L ${n(cx + 7)} ${n(headCy + headR * 0.62)}" />
      <path class="gw-fig-body" d="${torso}" />
      <path class="gw-fig-limbs" d="${legL}" />
      <path class="gw-fig-limbs" d="${mirror(legL)}" />
      <path class="gw-fig-limbs" d="${armL}" />
      <path class="gw-fig-limbs" d="${armR}" />
      <path class="gw-fig-axis" d="M ${n(cx)} ${n(shoulderY + H * 0.06)} L ${n(cx)} ${n(hipY - H * 0.02)}" />
    </g>`;
  }

  function bodyFigures(b) {
    const shapes = {
      thin: { sh: 0.062, ws: 0.044, hp: 0.058, cls: 'is-risk' },
      ideal: { sh: 0.096, ws: 0.078, hp: 0.094, cls: 'is-ideal' },
      full: { sh: 0.122, ws: 0.132, hp: 0.142, cls: 'is-risk' }
    };
    if (b.figures === 'balance') {
      return `<div class="gw-figs three">
        <svg viewBox="0 0 340 250" class="gw-fig-svg" aria-label="체형 비교 도해 — 마른 체형, 적정 체형, 넘친 체형">
          <line class="gw-fig-ground" x1="16" y1="234" x2="324" y2="234" />
          ${silhouette(62, 26, 206, shapes.thin)}
          ${silhouette(170, 18, 220, shapes.ideal)}
          ${silhouette(278, 26, 206, shapes.full)}
          <text class="gw-fig-label" x="62" y="252" text-anchor="middle">마르면 샌다</text>
          <text class="gw-fig-label is-gold" x="170" y="252" text-anchor="middle">지금의 균형</text>
          <text class="gw-fig-label" x="278" y="252" text-anchor="middle">불면 막힌다</text>
        </svg>
      </div>`;
    }
    const risk = b.figures === 'reduce' ? shapes.full : shapes.thin;
    const rl = b.figures === 'reduce' ? '불면 막힌다' : '마르면 샌다';
    return `<div class="gw-figs">
      <svg viewBox="0 0 300 250" class="gw-fig-svg" aria-label="체형 비교 도해 — 위험한 체형과 이상적 체형">
        <line class="gw-fig-ground" x1="14" y1="234" x2="286" y2="234" />
        ${silhouette(80, 26, 206, risk)}
        ${silhouette(214, 18, 220, shapes.ideal)}
        <text class="gw-fig-label" x="80" y="252" text-anchor="middle">${rl}</text>
        <text class="gw-fig-label is-gold" x="214" y="252" text-anchor="middle">운이 고이는 체형</text>
      </svg>
    </div>`;
  }

  /* ============================================================
     체중 게이지
     ============================================================ */
  function gaugeSVG(b) {
    const g = b.gauge;
    const W = 320, x0 = 18, x1 = 302;
    const pos = v => x0 + (clamp((v - g.min) / (g.max - g.min), 0, 1)) * (x1 - x0);
    function clamp(v, a, c) { return Math.max(a, Math.min(c, v)); }
    const px = { low: pos(g.low), lo: pos(g.lo), hi: pos(g.hi), ceil: pos(g.ceil), cur: g.cur ? pos(g.cur) : null };
    const curTxt = g.cur ? kgTxt(g.cur) + 'kg' : '';
    return `<svg viewBox="0 0 320 86" class="gw-gauge" aria-label="적정 체중 구간 게이지">
      <defs>
        <linearGradient id="gwBand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8d6f3c"/><stop offset="50%" stop-color="#f6e3ad"/><stop offset="100%" stop-color="#8d6f3c"/>
        </linearGradient>
      </defs>
      <rect class="gw-gauge-track" x="${x0}" y="34" width="${x1 - x0}" height="10" rx="5" />
      <rect class="gw-gauge-band" x="${px.lo}" y="34" width="${px.hi - px.lo}" height="10" rx="5" fill="url(#gwBand)" />
      <line class="gw-gauge-line low" x1="${px.low}" y1="24" x2="${px.low}" y2="54" />
      <line class="gw-gauge-line ceil" x1="${px.ceil}" y1="24" x2="${px.ceil}" y2="54" />
      <text class="gw-gauge-t" x="${px.low}" y="18" text-anchor="middle">하한 ${kgTxt(g.low)}</text>
      <text class="gw-gauge-t" x="${(px.lo + px.hi) / 2}" y="64" text-anchor="middle">${kgTxt(g.lo)}~${kgTxt(g.hi)}kg</text>
      <text class="gw-gauge-t" x="${px.ceil}" y="18" text-anchor="middle">정체 ${kgTxt(g.ceil)}</text>
      ${px.cur != null ? `<g class="gw-gauge-cur">
        <line x1="${px.cur}" y1="28" x2="${px.cur}" y2="50" />
        <circle cx="${px.cur}" cy="39" r="4" />
        <text x="${px.cur}" y="80" text-anchor="${px.cur > x1 - 34 ? 'end' : px.cur < x0 + 34 ? 'start' : 'middle'}">지금 ${curTxt}</text>
      </g>` : ''}
    </svg>`;
  }

  /* ============================================================
     헤어 도해
     ============================================================ */
  function hairBust(cx, o) {
    const cy = 74, r = 30;
    const face = `<ellipse class="gw-hair-face" cx="${cx}" cy="${cy}" rx="${r * 0.86}" ry="${r * 1.12}" />`;
    const neck = `<path class="gw-hair-face" d="M ${cx - 10} ${cy + r * 0.95} L ${cx - 9} ${cy + r * 1.5} L ${cx + 9} ${cy + r * 1.5} L ${cx + 10} ${cy + r * 0.95}" />`;
    const shoulder = `<path class="gw-hair-shoulder" d="M ${cx - 44} ${cy + r * 2.05} C ${cx - 40} ${cy + r * 1.45} ${cx - 18} ${cy + r * 1.42} ${cx - 12} ${cy + r * 1.5} L ${cx + 12} ${cy + r * 1.5} C ${cx + 18} ${cy + r * 1.42} ${cx + 40} ${cy + r * 1.45} ${cx + 44} ${cy + r * 2.05} Z" />`;
    const eyes = `<g class="gw-hair-feat">
      <path d="M ${cx - 15} ${cy - 1} q 4 -4 8 0" /><path d="M ${cx + 7} ${cy - 1} q 4 -4 8 0" />
      <path d="M ${cx + 1} ${cy + 6} l 0 8 q 3 2 5 0" /><path d="M ${cx - 7} ${cy + 21} q 7 4 14 0" />
    </g>`;
    const hairOpen = `<g class="gw-hair-mass">
      <path d="M ${cx - 33} ${cy + 12} C ${cx - 40} ${cy - 26} ${cx - 18} ${cy - 38} ${cx} ${cy - 38} C ${cx + 18} ${cy - 38} ${cx + 40} ${cy - 26} ${cx + 33} ${cy + 12} C ${cx + 30} ${cy - 2} ${cx + 26} ${cy - 13} ${cx + 14} ${cy - 16} C ${cx + 4} ${cy - 18} ${cx - 8} ${cy - 17} ${cx - 15} ${cy - 13} C ${cx - 26} ${cy - 8} ${cx - 30} ${cy + 1} ${cx - 33} ${cy + 12} Z" />
      <path d="M ${cx - 34} ${cy + 10} C ${cx - 46} ${cy + 34} ${cx - 40} ${cy + 52} ${cx - 30} ${cy + 62} C ${cx - 34} ${cy + 40} ${cx - 33} ${cy + 24} ${cx - 30} ${cy + 12} Z" />
      <path d="M ${cx + 34} ${cy + 10} C ${cx + 46} ${cy + 34} ${cx + 40} ${cy + 52} ${cx + 30} ${cy + 62} C ${cx + 34} ${cy + 40} ${cx + 33} ${cy + 24} ${cx + 30} ${cy + 12} Z" />
      <path class="gw-hair-line" d="M ${cx - 6} ${cy - 34} q 16 6 22 26" />
      <path class="gw-hair-line" d="M ${cx + 28} ${cy - 14} q 6 20 2 34" />
    </g>`;
    const hairClosed = `<g class="gw-hair-mass">
      <path d="M ${cx - 34} ${cy + 16} C ${cx - 42} ${cy - 26} ${cx - 18} ${cy - 40} ${cx} ${cy - 40} C ${cx + 18} ${cy - 40} ${cx + 42} ${cy - 26} ${cx + 34} ${cy + 16} C ${cx + 32} ${cy + 4} ${cx + 27} ${cy - 6} ${cx + 20} ${cy - 8} C ${cx + 12} ${cy - 10} ${cx + 4} ${cy + 2} ${cx - 2} ${cy + 1} C ${cx - 10} ${cy - 1} ${cx - 16} ${cy - 4} ${cx - 22} ${cy + 1} C ${cx - 28} ${cy + 6} ${cx - 32} ${cy + 10} ${cx - 34} ${cy + 16} Z" />
      <path d="M ${cx - 34} ${cy + 14} C ${cx - 46} ${cy + 36} ${cx - 40} ${cy + 54} ${cx - 29} ${cy + 64} C ${cx - 34} ${cy + 42} ${cx - 33} ${cy + 26} ${cx - 30} ${cy + 14} Z" />
      <path d="M ${cx + 34} ${cy + 14} C ${cx + 46} ${cy + 36} ${cx + 40} ${cy + 54} ${cx + 29} ${cy + 64} C ${cx + 34} ${cy + 42} ${cx + 33} ${cy + 26} ${cx + 30} ${cy + 14} Z" />
      <path class="gw-hair-line" d="M ${cx - 20} ${cy - 24} q 10 18 4 30" />
      <path class="gw-hair-line" d="M ${cx + 12} ${cy - 26} q 12 16 6 26" />
    </g>`;
    return `<g class="gw-bust ${o.highlight ? 'is-pick' : ''} ${o.open ? 'is-open' : 'is-closed'}">
      ${o.open ? hairOpen : hairClosed}
      ${shoulder}${neck}${face}${eyes}
    </g>`;
  }

  /* ============================================================
     얼굴 · 손 · 목 도해
     ============================================================ */
  /* 점 이름표 자리 — 도해마다 겹치지 않게 손으로 정해 둔 좌표 */
  const LABEL_POS = {
    gwanrok: [14, -13, 'start'],
    gyowo: [-15, 3, 'end'],
    nandae: [-15, 3, 'end'],
    earlobe: [-15, 16, 'end'],
    tear: [-15, 14, 'end'],
    nosetip: [16, 10, 'start'],
    mouthside: [-15, 7, 'end'],
    eyetail: [15, -7, 'start'],
    glabella: [12, -15, 'start'],
    'palm-wealth': [13, -4, 'start'],
    wrist: [13, 15, 'start'],
    'finger-gap': [13, -11, 'start'],
    collarbone: [15, 12, 'start'],
    throat: [15, -3, 'start']
  };
  function dotMark(z, kind) {
    const lp = LABEL_POS[z.id] || [13, -10, 'start'];
    const lab = `<text class="gw-dot-lab ${kind}" x="${z.x + lp[0]}" y="${z.y + lp[1]}" text-anchor="${lp[2]}">${z.name}</text>`;
    if (kind === 'good') {
      return `<g class="gw-dot good" data-zone="${z.id}">
        <circle class="gw-dot-halo" cx="${z.x}" cy="${z.y}" r="13" />
        <circle class="gw-dot-core" cx="${z.x}" cy="${z.y}" r="7.5" />
        <text class="gw-dot-no" x="${z.x}" y="${z.y + 3.4}" text-anchor="middle">${z.no}</text>
        ${lab}
      </g>`;
    }
    return `<g class="gw-dot bad" data-zone="${z.id}">
      <circle class="gw-dot-halo bad" cx="${z.x}" cy="${z.y}" r="12" />
      <path class="gw-dot-x" d="M ${z.x - 4.6} ${z.y - 4.6} L ${z.x + 4.6} ${z.y + 4.6} M ${z.x + 4.6} ${z.y - 4.6} L ${z.x - 4.6} ${z.y + 4.6}" />
      <text class="gw-dot-xno" x="${z.x}" y="${z.y - 10}" text-anchor="middle">${z.no}</text>
      ${lab}
    </g>`;
  }

  function faceSVG(x) {
    const marks = x.faceDots.map(z => dotMark(z, z.kind)).join('');
    return `<svg viewBox="0 38 340 300" class="gw-face" aria-label="얼굴의 길점과 흉점 도해">
      <defs>
        <radialGradient id="gwFace" cx="50%" cy="40%" r="62%">
          <stop offset="0%" stop-color="#33263f"/><stop offset="100%" stop-color="#100c18"/>
        </radialGradient>
      </defs>
      <path class="gw-face-hair" d="M 170 58 C 100 58 68 114 74 192 C 77 246 86 288 96 316 L 120 308 C 106 262 104 208 110 182 C 120 148 142 134 170 134 C 198 134 220 148 230 182 C 236 208 234 262 220 308 L 244 316 C 254 288 263 246 266 192 C 272 114 240 58 170 58 Z" />
      <ellipse class="gw-face-oval" cx="170" cy="210" rx="86" ry="110" fill="url(#gwFace)" />
      <ellipse class="gw-face-ear" cx="84" cy="224" rx="11" ry="24" />
      <ellipse class="gw-face-ear" cx="256" cy="224" rx="11" ry="24" />
      <g class="gw-face-feat">
        <path d="M 114 178 q 28 -13 50 -3" />
        <path d="M 226 178 q -28 -13 -50 -3" />
        <ellipse cx="140" cy="196" rx="16.5" ry="7" />
        <ellipse cx="200" cy="196" rx="16.5" ry="7" />
        <circle cx="140" cy="196" r="3.4" class="gw-face-pupil" />
        <circle cx="200" cy="196" r="3.4" class="gw-face-pupil" />
        <path d="M 170 190 L 170 226" />
        <path d="M 156 232 q 14 7 28 0" />
        <path d="M 160 231 q 2 5 4 0" />
        <path d="M 180 231 q -2 5 -4 0" />
        <path d="M 154 268 q 16 8 32 0" />
        <path d="M 158 280 q 12 5 24 0" />
      </g>
      ${marks}
    </svg>`;
  }

  function handSVG(x) {
    const marks = x.handDots.map(z => dotMark(z, z.kind)).join('');
    return `<svg viewBox="0 0 200 275" class="gw-hand" aria-label="손과 손목의 길점과 흉점 도해">
      <g class="gw-hand-shape">
        <path d="M 68 256 L 66 164 C 48 170 36 186 42 198 C 48 210 60 211 67 203 L 66 152
          L 66 98 Q 66 84 77 84 Q 88 84 88 98 L 88 152
          L 96 152 L 96 84 Q 96 70 107 70 Q 118 70 118 84 L 118 152
          L 126 152 L 126 92 Q 126 78 137 78 Q 148 78 148 92 L 148 152
          L 156 152 L 156 112 Q 156 98 166 98 Q 176 98 176 112 L 176 180
          C 176 214 156 240 136 248 L 136 258 L 68 258 Z" />
        <path class="gw-hand-line" d="M 76 196 q 48 -14 92 4" />
        <path class="gw-hand-line" d="M 80 216 q 40 -8 84 6" />
        <path class="gw-hand-line" d="M 98 158 q 16 12 22 34" />
        <path class="gw-hand-line" d="M 70 240 q 40 8 64 2" />
      </g>
      ${marks}
    </svg>`;
  }

  function neckSVG(x) {
    const marks = x.neckDots.map(z => dotMark(z, z.kind)).join('');
    return `<svg viewBox="0 0 200 210" class="gw-neck" aria-label="목과 쇄골의 길점과 흉점 도해">
      <ellipse class="gw-neck-head" cx="100" cy="46" rx="31" ry="37" />
      <g class="gw-neck-shape">
        <path d="M 83 74 L 83 108 C 83 120 62 126 46 135 C 28 145 22 158 24 172 L 24 192 L 176 192 L 176 172 C 178 158 172 145 154 135 C 138 126 117 120 117 108 L 117 74 Z" />
        <path class="gw-neck-line" d="M 100 144 Q 78 151 58 147" />
        <path class="gw-neck-line" d="M 100 144 Q 122 151 142 147" />
      </g>
      ${marks}
    </svg>`;
  }

  function dotLegend(list, kind) {
    return `<div class="gw-legend-col ${kind}">
      <div class="gw-legend-h"><b>${kind === 'good' ? '살릴 점' : '뺄 점'}</b><span>${kind === 'good' ? '吉點 · 남겨야 재물이 고인다' : '凶點 · 여기로 재물·인연이 샌다'}</span></div>
      ${list.map(z => `<div class="gw-legend-item">
        <span class="gw-legend-no">${z.no}</span>
        <div class="gw-legend-txt">
          <b>${z.name} <em>${z.point}</em></b>
          <p>${z.whyText}</p>
          <p class="gw-legend-act">${z.act}</p>
        </div>
      </div>`).join('')}
    </div>`;
  }

  /* ============================================================
     카드들
     ============================================================ */
  function cardBody(b) {
    const T = b.type;
    const sk = b.shape;
    return `<div class="card">
      <div class="section-head"><h2 class="serif">① 체형 · 적정 운세 체중</h2><span class="en">BODY</span></div>
      <div class="gw-type-row">
        <div class="gw-type-badge">
          <b class="serif">${T.name}</b>
          <span>${T.sub}</span>
        </div>
        <div class="gw-type-meta">
          <div><span>기준 신장</span><b>${b.key}cm${b.keySource === 'average' ? ' <em>평균</em>' : ''}</b></div>
          <div><span>현재</span><b>${b.weight ? kgTxt(b.weight) + 'kg' : '—'}</b></div>
          <div><span>BMI</span><b>${b.bmi ? b.bmi : '—'}</b></div>
        </div>
      </div>

      ${bodyFigures(b)}
      ${gaugeSVG(b)}

      <div class="gw-kg-triple">
        <div class="gw-kg-cell low"><span>하한선</span><b>${kgTxt(b.kg.low)}<small>kg</small></b><em>이 아래로 마르면 기운이 막힌다</em></div>
        <div class="gw-kg-cell band"><span>목표 구간</span><b>${kgTxt(b.kg.lo)}~${kgTxt(b.kg.hi)}<small>kg</small></b><em>사주가 가장 좋아하는 무게</em></div>
        <div class="gw-kg-cell ceil"><span>정체선</span><b>${kgTxt(b.kg.ceil)}<small>kg</small></b><em>이 위로 불면 순환이 둔해진다</em></div>
      </div>

      <p class="gw-numline serif">${b.numLine}</p>

      <div class="gw-status ${b.status}">
        <b class="serif">${b.statusTitle}</b>
        <p>${b.statusText}</p>
      </div>

      <div class="gw-actions">
        ${b.actions.map((x, i) => `<div class="gw-act"><span>${String(i + 1).padStart(2, '0')}</span><div><b>${x.k}</b><p>${x.v}</p></div></div>`).join('')}
      </div>

      <p class="gw-fine">체형은 ${el(b.shape.top)} ${Math.round(b.shape.topPct * 100)}% · ${el(b.shape.low)} ${Math.round(b.shape.lowPct * 100)}%의 배치에서 나온 ${b.shape.trait}의 몸이에요. ${b.shape.text}</p>
      <p class="gw-note">체중 조절은 병이나 드시는 약에 따라 달라져요. 몸에 이상이 느껴지면 이 처방보다 진료가 먼저예요.</p>
    </div>`;
  }

  function cardHair(h) {
    return `<div class="card">
      <div class="section-head"><h2 class="serif">② 헤어 · 인상 처방</h2><span class="en">HAIR</span></div>
      <div class="gw-hair-svg-wrap">
        <svg viewBox="0 0 300 210" class="gw-hair-svg" aria-label="헤어 스타일 비교 도해">
          ${hairBust(76, { open: true, highlight: h.open, tag: '이마 개방' })}
          ${hairBust(220, { open: false, highlight: !h.open, tag: '이마 감쌈' })}
          <text class="gw-hair-cap ${h.open ? 'is-gold' : ''}" x="76" y="198" text-anchor="middle">${h.open ? '관록궁을 연다' : '관록궁을 덮는다'}</text>
          <text class="gw-hair-cap ${h.open ? '' : 'is-gold'}" x="220" y="198" text-anchor="middle">${h.open ? '관록궁을 덮는다' : '관록궁을 연다'}</text>
        </svg>
      </div>
      <div class="gw-pick-line"><span>당신의 처방</span><b class="serif">${h.title}</b></div>
      <p class="gw-body-text">${h.openReason}</p>

      <div class="gw-hair-facts">
        <div class="gw-fact"><span>기장</span><p>${h.length}</p></div>
        <div class="gw-fact"><span>볼륨</span><p>${h.volume}</p></div>
      </div>

      <div class="gw-swatch-row">
        <div class="gw-swatch"><i style="background:${h.color.hex}"></i><i style="background:${h.color.hex2}"></i></div>
        <div class="gw-swatch-txt"><b>${h.color.main}</b><span>${h.color.sub}</span></div>
        <div class="gw-swatch avoid"><i style="background:${h.avoid.hex}"></i></div>
        <div class="gw-swatch-txt"><b>피할 톤</b><span>${h.avoid.main}</span></div>
      </div>

      <div class="gw-care">
        ${h.care.map((c, i) => `<p><span>${String(i + 1).padStart(2, '0')}</span>${c}</p>`).join('')}
      </div>
      <div class="gw-actions">
        ${h.impression.map((c, i) => `<div class="gw-act"><span>${String(i + 1).padStart(2, '0')}</span><div><b>인상</b><p>${c}</p></div></div>`).join('')}
      </div>
    </div>`;
  }

  function cardDots(x) {
    const faceGood = x.good.filter(z => z.part === 'face');
    const faceBad = x.bad.filter(z => z.part === 'face');
    return `<div class="card">
      <div class="section-head"><h2 class="serif">③ 재물·건강이 들어오는 점 — 살릴 점과 뺄 점</h2><span class="en">MARKS</span></div>
      <p class="gw-lead">${x.summary}</p>
      <div class="gw-dot-legend-top">
        <span class="gw-chip good"><i></i>살릴 점 吉</span>
        <span class="gw-chip bad"><i></i>뺄 점 凶</span>
        <span class="gw-chip">번호는 그림의 번호와 같아요</span>
      </div>

      <div class="gw-face-wrap">
        ${faceSVG(x)}
        <div class="gw-face-side">
          ${faceGood.length ? dotLegend(faceGood, 'good') : ''}
          ${faceBad.length ? dotLegend(faceBad, 'bad') : ''}
        </div>
      </div>

      <div class="hr-gold"></div>

      <div class="gw-body-marks">
        <div class="gw-mark-box">
          <div class="gw-mark-h"><b class="serif">손 · 손목</b><span>HAND</span></div>
          ${handSVG(x)}
          ${x.handDots.length ? `<div class="gw-mark-list">${x.handDots.map(z => `<div class="gw-ml-item ${z.kind}">
            <span class="gw-legend-no">${z.no}</span><div><b>${z.name}</b><em>${z.kind === 'good' ? '살릴 점' : '뺄 점'}</em><p>${z.act}</p></div>
          </div>`).join('')}</div>` : ''}
        </div>
        <div class="gw-mark-box">
          <div class="gw-mark-h"><b class="serif">목 · 쇄골</b><span>NECK</span></div>
          ${neckSVG(x)}
          ${x.neckDots.length ? `<div class="gw-mark-list">${x.neckDots.map(z => `<div class="gw-ml-item ${z.kind}">
            <span class="gw-legend-no">${z.no}</span><div><b>${z.name}</b><em>${z.kind === 'good' ? '살릴 점' : '뺄 점'}</em><p>${z.act}</p></div>
          </div>`).join('')}</div>` : ''}
        </div>
      </div>

      <p class="gw-note">${x.note}</p>
    </div>`;
  }

  function cardSpeech(s) {
    return `<div class="card">
      <div class="section-head"><h2 class="serif">④ 말투 · 화법 · 목소리 톤</h2><span class="en">VOICE</span></div>
      <p class="gw-lead">${s.summary}</p>

      <div class="gw-ten-bars">
        ${[['내 편', s.shares.bigyeop, s.dominant === 'bigyeop'], ['표현', s.shares.siksang, s.dominant === 'siksang'], ['돈', s.shares.jaeseong, s.dominant === 'jaeseong'], ['직장', s.shares.gwansung, s.dominant === 'gwansung'], ['공부', s.shares.inseong, s.dominant === 'inseong']]
      .map(([k, v, on]) => `<div class="gw-ten-bar ${on ? 'on' : ''}"><span>${k}</span><i><b style="width:${v}"></b></i><em>${v}</em></div>`).join('')}
      </div>

      <div class="gw-voice-grid">
        <div class="gw-voice"><span>목소리 높낮이</span><p>${s.pitch}</p><em>${s.pitchWhy}</em></div>
        <div class="gw-voice"><span>말하는 속도</span><p>${s.speed}</p></div>
        <div class="gw-voice"><span>어미 처리</span><p>${s.ending}</p></div>
      </div>

      <div class="hr-gold"></div>
      <div class="section-head"><h2 class="serif">이렇게 말하면 손해 · 이렇게 바꾸면 붙는다</h2><span class="en">REWRITE</span></div>
      <div class="gw-say-list">
        ${s.habits.map((h, i) => `<div class="gw-say">
          <div class="gw-say-no">${String(i + 1).padStart(2, '0')}</div>
          <div class="gw-say-body">
            <div class="gw-say-bad"><span>이렇게 말하면 손해</span><b>${h.bad}</b></div>
            <div class="gw-say-good"><span>이렇게 바꾸면 돈·사람이 붙는다</span><b>${h.good}</b></div>
            <p>${h.why}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function cardLiving(l) {
    return `<div class="card">
      <div class="section-head"><h2 class="serif">⑤ 매일의 개운 — 색 · 향 · 방향</h2><span class="en">DAILY</span></div>
      <p class="gw-lead">나를 살리는 행운 기운(용신) ${l.yongName}을 매일 몸에 두는 게 제일 값싼 개운이에요. 큰 의식이 아니라 지갑 색, 향, 머리 방향에서 시작돼요.</p>

      <div class="gw-live-grid">
        <div class="gw-live">
          <span>지갑 · 폰케이스</span>
          <div class="gw-live-colors">
            <i style="background:${l.colors.hex}"></i><i style="background:${l.colors.hexHee}"></i>
          </div>
          <b>${l.colors.main} · ${l.colors.sub}</b>
          <p>${l.wallet}</p>
        </div>
        <div class="gw-live">
          <span>향 계열</span>
          <b>${l.scent.join(' · ')}</b>
          <p>방에는 한 가지 향만 두세요. 여러 향이 섞이면 ${l.yongName}의 결이 흐려져요.</p>
        </div>
        <div class="gw-live">
          <span>잠자는 머리 방향</span>
          <b>${l.dir}</b>
          <p>${l.bed}</p>
        </div>
        <div class="gw-live">
          <span>가까이 둘 소품</span>
          <b>${l.item.split('—')[0]}</b>
          <p>${l.item}</p>
        </div>
      </div>

      <div class="gw-hours">
        ${l.hours.map(h => `<div><b>${h.k}</b><p>${h.v}</p></div>`).join('')}
      </div>
      <p class="gw-note">${l.avoid}</p>
    </div>`;
  }

  /* ============================================================
     키 미입력 — 평균 신장 기준 안내 (결과 맨 위)
     ============================================================ */
  function avgNote(b) {
    if (b.keySource !== 'average') return '';
    return `<div class="gw-avg-note" role="note">
        <div class="gw-avg-tx">
          <b>지금은 ${b.gender === '남' ? '남성' : '여성'} 평균 키 ${b.key}cm 기준이에요</b>
          <p>위 <b>키(cm)</b> 칸에 실제 키를 넣으면 이 카드가 키에 맞춰 바로 다시 계산돼요. 첫 화면 명식 입력란에 넣어도 이어지고, 165cm와 182cm는 적정 구간이 10kg 넘게 차이 나요.</p>
        </div>
        <button type="button" class="gw-avg-btn" data-gw-focus="height">내 키 넣기</button>
      </div>`;
  }

  /* ============================================================
     전체 렌더
     ============================================================ */
  function renderFree(x, a) {
    const m = x.meta;
    const b = x.body;
    return `<div class="card gw-hero">
      <div class="result-title">
        <div class="result-brand serif">살풀이 : 천기(天機) · 외모 · 점 처방</div>
        <h2 class="serif">${who(a)}의 외모 · 점 처방</h2>
        <p>${m.pillars} · ${m.sijin} · ${m.strengthLevel} · 나를 살리는 기운 ${m.yongName}</p>
      </div>
      ${avgNote(b)}
      <div class="gw-hero-tags">
        <span class="gw-tag main">${x.body.type.name}</span>
        <span class="gw-tag">${x.hair.title}</span>
        <span class="gw-tag">${x.speech.dominantKo} 우세</span>
      </div>
      <div class="gw-hero-keys">
        <div><span>목표 체중</span><b>${kgTxt(x.body.kg.lo)}~${kgTxt(x.body.kg.hi)}<small>kg</small></b></div>
        <div><span>살릴 점</span><b>${x.dots.good.length}<small>곳</small></b></div>
        <div><span>뺄 점</span><b>${x.dots.bad.length}<small>곳</small></b></div>
        <div><span>말버릇 처방</span><b>${x.speech.habits.length}<small>개</small></b></div>
      </div>
      <p class="gw-lead serif">${x.body.headline}</p>
      <p class="gw-hero-num">${x.body.numLine}</p>
    </div>`;
  }

  function renderDeep(x, a) {
    return `${cardBody(x.body)}
    ${cardHair(x.hair)}
    ${cardDots(x.dots)}
    ${cardSpeech(x.speech)}
    ${cardLiving(x.living)}

    <div class="card">
      <p class="gw-note">이 처방은 사주의 오행·십성 배치에서 나온 상징적인 조언이에요. 병을 진단하거나 치료하는 건 아니고, 몸에 이상이 있으면 의료진 판단이 먼저예요.</p>
      ${shareRow('gaewun', '내 외모·점 처방 보내기')}
      <div class="center mt14"><button class="btn-ghost" data-goto="saju">생년월일 다시 입력하기</button></div>
    </div>`;
  }

  function render(x, a) { return renderFree(x, a) + renderDeep(x, a); }

  function shareText(x, a) {
    const b = x.body, h = x.hair, s = x.speech;
    const name = a.name ? `${a.name} 님의` : '내';
    return `${name} 개운 처방 — ${b.type.name}(${b.type.sub}). 목표 체중 ${kgTxt(b.kg.lo)}~${kgTxt(b.kg.hi)}kg · ${h.title} · ${s.dominantKo} 우세라 ${s.habits[0] ? '말버릇 하나만 바꿔도' : ''} 흐름이 달라집니다. 살풀이 : 천기에서 봤어요.`;
  }

  global.GaewunText = { render, renderFree, renderDeep, shareText, silhouette, bodyFigures, hairBust, gaugeSVG, faceSVG, handSVG, neckSVG, kgTxt };
})(window);
