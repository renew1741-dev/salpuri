/* ============================================================
   살풀이 : 천기 타로 — 메이저 아르카나 22장 + 3카드 스프레드
   각 카드의 일러스트는 인라인 SVG(금박 선화)로 그립니다.
   ============================================================ */
(function (global) {
  'use strict';

  const G = '#e2c07a';      // 금박
  const G2 = '#f6e3ad';     // 밝은 금
  const INK = '#1a1220';

  /* 공통: 부드러운 빛 */
  const glow = `<circle cx="60" cy="86" r="52" fill="url(#gl)" opacity="0.85"/>`;

  const S = (inner, extra = '') => `
<svg viewBox="0 0 120 180" class="card-art" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="gl" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#6b4b8a" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#2a1b3d" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0a0710" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${G2}"/><stop offset="100%" stop-color="${G}"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#gold)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
  ${inner}
  </g>
</svg>`;

  /* ---------- 22장 아트 ---------- */
  const ART = {
    0: S(`${glow}
      <circle cx="96" cy="34" r="13"/><g opacity=".6">${Array.from({ length: 8 }, (_, i) => {
        const a = i * Math.PI / 4; return `<line x1="${96 + 16 * Math.cos(a)}" y1="${34 + 16 * Math.sin(a)}" x2="${96 + 21 * Math.cos(a)}" y2="${34 + 21 * Math.sin(a)}"/>`;
      }).join('')}</g>
      <path d="M6 150 L40 132 L74 150" /><path d="M74 150 L74 176" opacity=".5"/>
      <circle cx="58" cy="86" r="6"/>
      <path d="M58 92 L52 122 M58 92 L66 120" />
      <path d="M54 100 L40 112 L34 104" />
      <path d="M56 92 L52 78 L58 70"/>
      <path d="M64 96 L74 100 L70 84"/>
      <path d="M40 112 L30 118"/><path d="M30 118 L24 112 L30 106 L36 112" opacity=".8"/>
      <circle cx="78" cy="128" r="4"/><path d="M78 132 L80 142 L86 146 M78 132 L72 142 L66 144" opacity=".8"/>`),
    1: S(`${glow}
      <path d="M60 24 c-8 0 -8 12 0 12 c8 0 8 -12 0 -12Z"/>
      <circle cx="60" cy="40" r="7"/>
      <path d="M60 47 L60 92 M60 56 L40 74 M60 56 L80 74"/>
      <path d="M40 74 L36 60"/><path d="M80 74 L86 62"/>
      <path d="M34 120 L86 120 M38 120 L38 146 L82 146 L82 120"/>
      <circle cx="46" cy="112" r="4"/><path d="M46 108 L46 116"/>
      <path d="M60 108 L60 116 M56 112 L64 112"/>
      <path d="M71 110 L74 116 L68 116 Z"/>
      <path d="M30 40 A 24 24 0 0 1 62 20" opacity=".35"/>`),
    2: S(`${glow}
      <path d="M24 40 L24 156 M96 40 L96 156"/>
      <path d="M18 40 L30 40 M18 156 L30 156 M90 40 L102 40 M90 156 L102 156"/>
      <path d="M60 34 c-9 0 -13 8 -10 16 c2 5 6 8 10 8 c4 0 8 -3 10 -8 c3 -8 -1 -16 -10 -16Z"/>
      <path d="M46 62 C52 54 68 54 74 62 L74 132 L46 132 Z"/>
      <path d="M60 70 L60 120" opacity=".4"/>
      <path d="M50 70 L70 70" opacity=".4"/>
      <path d="M40 140 a 26 12 0 0 0 40 0" opacity=".7"/>
      <path d="M52 148 L68 148" opacity=".5"/>
      <circle cx="34" cy="70" r="3" opacity=".7"/><circle cx="86" cy="70" r="3" opacity=".7"/>`),
    3: S(`${glow}
      <path d="M46 40 h28 v18 h-28z" opacity=".5"/>
      <path d="M50 44 l4 -0 l3 -5 l3 5 l4 0" opacity=".7"/>
      <circle cx="60" cy="34" r="9"/>
      <path d="M60 25 l2 6 6 1 -4 4 1 6 -5 -3 -5 3 1 -6 -4 -4 6 -1z" opacity=".9"/>
      <path d="M60 43 L60 66"/>
      <path d="M44 70 C48 62 72 62 76 70 L82 140 L38 140 Z"/>
      <path d="M60 78 L60 130" opacity=".35"/>
      <path d="M34 96 C34 88 44 88 44 96 M34 96 v34 M44 96 v34" opacity=".7"/>
      <path d="M76 96 C76 88 86 88 86 96 M76 96 v34 M86 96 v34" opacity=".7"/>
      <path d="M52 100 c4 6 12 6 16 0 c-2 8 -14 8 -16 0Z" opacity=".6"/>`),
    4: S(`${glow}
      <path d="M18 156 L18 60 L60 40 L102 60 L102 156"/>
      <path d="M30 60 L30 156 M90 60 L90 156" opacity=".4"/>
      <path d="M24 60 L30 52 L36 60 M84 60 L90 52 L96 60" opacity=".7"/>
      <circle cx="60" cy="52" r="7"/>
      <path d="M60 59 L60 84"/>
      <path d="M52 96 L52 150 L68 150 L68 96 Z"/>
      <path d="M60 96 L60 150" opacity=".35"/>
      <path d="M72 88 L88 88 L88 108 L72 108 Z" opacity=".6"/>
      <path d="M80 80 L80 88 M80 108 L80 118"/><circle cx="80" cy="122" r="4" opacity=".7"/>
      <path d="M12 156 L108 156"/>
      <path d="M20 40 L32 26 L44 40" opacity=".35"/>`),
    5: S(`${glow}
      <path d="M60 26 L60 62"/>
      <path d="M48 62 h24 v6 h-24z" opacity=".5"/>
      <path d="M52 40 c0 -8 16 -8 16 0 v14 h-16z" opacity=".5"/>
      <path d="M60 20 l4 8 h-8z" opacity=".8"/>
      <circle cx="60" cy="52" r="0"/>
      <path d="M44 74 C50 66 70 66 76 74 L80 148 L40 148 Z"/>
      <path d="M60 82 L60 140" opacity=".35"/>
      <path d="M40 148 L80 148"/>
      <g opacity=".8"><path d="M40 100 L34 106 M34 100 L40 106"/><circle cx="37" cy="103" r="6" opacity=".5"/></g>
      <g opacity=".8"><path d="M86 100 L80 106 M80 100 L86 106"/><circle cx="83" cy="103" r="6" opacity=".5"/></g>
      <path d="M86 112 L86 148 M70 112 L70 148" opacity=".4"/>
      <path d="M50 112 L50 148" opacity=".3"/>`),
    6: S(`${glow}
      <circle cx="60" cy="30" r="10"/><g opacity=".55">${Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6; return `<line x1="${60 + 12 * Math.cos(a)}" y1="${30 + 12 * Math.sin(a)}" x2="${60 + 17 * Math.cos(a)}" y2="${30 + 17 * Math.sin(a)}"/>`;
      }).join('')}</g>
      <path d="M60 44 c-6 0 -10 6 -10 10 c0 8 10 12 10 12 c0 0 10 -4 10 -12 c0 -4 -4 -10 -10 -10Z" opacity=".8"/>
      <path d="M36 54 C46 44 74 44 84 54" opacity=".5"/>
      <circle cx="34" cy="92" r="6"/><path d="M34 98 L34 140 M34 108 L24 122 M34 108 L44 122 M34 140 L26 156 M34 140 L42 156"/>
      <circle cx="86" cy="92" r="6"/><path d="M86 98 L86 140 M86 108 L76 122 M86 108 L96 122 M86 140 L78 156 M86 140 L94 156"/>
      <path d="M52 84 L52 100 M44 92 L60 92" opacity=".5"/>
      <path d="M60 148 L60 168" opacity=".4"/><path d="M40 168 L80 168" opacity=".4"/>`),
    7: S(`${glow}
      <path d="M26 74 L94 74 L94 126 L26 126 Z"/>
      <path d="M34 74 L34 60 L86 60 L86 74" opacity=".6"/>
      <path d="M44 74 L44 60 M60 74 L60 60 M76 74 L76 60" opacity=".4"/>
      <path d="M60 88 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" opacity=".9"/>
      <circle cx="40" cy="100" r="4" opacity=".6"/><circle cx="80" cy="100" r="4" opacity=".6"/>
      <circle cx="60" cy="126" r="7"/><path d="M60 133 L60 150"/>
      <path d="M44 150 L76 150" />
      <path d="M30 150 L38 140 L46 150Z" opacity=".6"/><path d="M74 150 L82 140 L90 150Z" opacity=".6"/>
      <path d="M14 168 L106 168" opacity=".4"/>
      <path d="M20 40 L100 40" opacity=".25"/>`),
    8: S(`${glow}
      <path d="M60 22 c-7 0 -7 10 0 10 c7 0 7 -10 0 -10Z"/>
      <circle cx="60" cy="42" r="7"/>
      <path d="M60 49 L60 96 M60 58 L44 76 M60 58 L78 74"/>
      <path d="M44 76 L40 96" /><path d="M78 74 L84 92"/>
      <path d="M38 108 c10 -14 24 -14 30 -6 c6 8 18 6 24 -4" opacity=".8"/>
      <path d="M42 118 c6 -6 14 -6 18 0" opacity=".5"/>
      <circle cx="58" cy="112" r="9" opacity=".8"/>
      <path d="M52 106 l3 4 M64 108 l-3 3" opacity=".8"/>
      <path d="M60 120 C60 134 54 142 44 148" opacity=".4"/>
      <path d="M26 152 C30 162 90 162 94 152" opacity=".35"/>`),
    9: S(`${glow}
      <path d="M52 30 c-8 0 -12 8 -10 14 c2 5 6 6 10 6 c4 0 8 -1 10 -6 c2 -6 -2 -14 -10 -14Z"/>
      <path d="M68 34 C76 40 80 54 74 64" opacity=".5"/>
      <path d="M46 52 C40 70 34 96 40 124 L80 124 C84 96 78 70 74 52 Z"/>
      <path d="M80 124 L82 148 L40 148 L40 124" opacity=".75"/>
      <path d="M60 60 L60 120" opacity=".25"/>
      <path d="M86 62 L86 96"/>
      <circle cx="86" cy="104" r="10"/>
      <path d="M86 98 l2 5 5 1 -4 4 1 5 -4 -3 -4 3 1 -5 -4 -4 5 -1z" opacity=".9"/>
      <path d="M86 114 L86 120" opacity=".5"/>
      <path d="M20 148 L100 148"/>
      <path d="M16 60 L24 44 L32 60" opacity=".3"/>`),
    10: S(`${glow}
      <circle cx="60" cy="86" r="30"/>
      <circle cx="60" cy="86" r="22"/><circle cx="60" cy="86" r="8"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const a = i * Math.PI / 4;
        return `<line x1="${60 + 8 * Math.cos(a)}" y1="${86 + 8 * Math.sin(a)}" x2="${60 + 30 * Math.cos(a)}" y2="${86 + 30 * Math.sin(a)}"/>`;
      }).join('')}
      <path d="M60 56 L60 44" opacity=".6"/>
      <path d="M84 74 C96 74 98 96 84 98" opacity=".6"/>
      <path d="M36 74 C24 74 22 96 36 98" opacity=".6"/>
      <path d="M50 116 c6 6 14 6 20 0" opacity=".6"/>
      <path d="M20 150 C34 140 46 140 58 150 M62 150 C74 140 86 140 100 150" opacity=".4"/>
      <path d="M30 34 L36 26 L42 34 L48 26 L54 34" opacity=".3"/>`),
    11: S(`${glow}
      <path d="M60 20 L60 52"/>
      <path d="M40 52 L80 52" />
      <path d="M60 52 L60 96"/>
      <path d="M52 96 L52 140 L68 140 L68 96 Z" opacity=".5"/>
      <path d="M44 60 L30 60 M76 60 L92 60" opacity=".7"/>
      <path d="M30 60 L22 92 M30 60 L38 92" opacity=".7"/>
      <path d="M22 92 C22 104 38 104 38 92" opacity=".7"/>
      <path d="M92 60 L92 90" opacity=".7"/>
      <path d="M84 90 L100 90 M92 90 L86 100 M92 90 L98 100" opacity=".7"/>
      <circle cx="60" cy="34" r="8" opacity=".5"/>
      <path d="M20 156 L100 156" opacity=".4"/>`),
    12: S(`${glow}
      <path d="M36 26 L84 26" stroke-width="1.6"/>
      <path d="M40 26 L40 40 M80 26 L80 40" opacity=".6"/>
      <path d="M60 40 L60 62"/>
      <path d="M60 62 c-9 0 -13 8 -10 16 c2 5 6 7 10 7 c4 0 8 -2 10 -7 c3 -8 -1 -16 -10 -16Z" transform="rotate(180 60 74)"/>
      <path d="M60 62 L60 96 M60 76 L46 96 M60 76 L74 96"/>
      <path d="M46 96 L44 116 M74 96 L76 116"/>
      <circle cx="60" cy="24" r="14" opacity=".3"/>
      <path d="M28 148 L92 148" opacity=".35"/>
      <path d="M60 116 L60 148" opacity=".5"/>`),
    13: S(`${glow}
      <path d="M30 148 L90 148" opacity=".3"/>
      <circle cx="60" cy="58" r="18"/>
      <path d="M52 54 a 3 3 0 1 0 0.1 0" /><path d="M68 54 a 3 3 0 1 0 0.1 0"/>
      <path d="M56 68 L64 68 M60 64 L60 68" opacity=".7"/>
      <path d="M60 40 L60 30 M50 44 L44 36 M70 44 L76 36" opacity=".5"/>
      <path d="M60 76 L60 120 M60 92 L44 108 M60 92 L76 108" opacity=".8"/>
      <path d="M60 120 L52 148 M60 120 L68 148" opacity=".8"/>
      <path d="M92 34 C96 58 96 86 88 110" opacity=".7"/>
      <path d="M82 30 C94 58 94 84 84 96" opacity=".8"/>
      <path d="M40 30 l4 6 l-4 6 l-4 -6z" opacity=".5"/>
      <path d="M22 148 C26 138 34 132 40 140" opacity=".4"/>`),
    14: S(`${glow}
      <path d="M60 26 c-8 0 -8 12 0 12 c8 0 8 -12 0 -12Z"/>
      <path d="M40 46 C46 36 74 36 80 46 L86 120 L34 120 Z"/>
      <path d="M60 50 L60 112" opacity=".3"/>
      <path d="M40 62 L22 76 L26 84" opacity=".8"/>
      <path d="M80 62 L98 70 L102 78" opacity=".8"/>
      <path d="M26 84 C28 92 38 92 40 84 Z" opacity=".7"/>
      <path d="M102 78 C100 86 90 86 88 78 Z" opacity=".7"/>
      <path d="M30 90 C40 96 46 84 56 92" opacity=".5"/>
      <path d="M90 84 C82 92 74 92 66 100" opacity=".5"/>
      <path d="M50 120 L50 150 M70 120 L70 150" opacity=".6"/>
      <path d="M20 150 L100 150" opacity=".3"/>`),
    15: S(`${glow}
      <path d="M60 28 L60 40"/>
      <path d="M40 40 c-4 -8 4 -14 10 -8 M80 40 c4 -8 -4 -14 -10 -8" opacity=".8"/>
      <circle cx="60" cy="52" r="12"/>
      <path d="M54 46 C54 60 66 60 66 46" opacity=".8"/>
      <path d="M48 64 C52 60 68 60 72 64 L76 100 L44 100 Z" opacity=".8"/>
      <path d="M40 44 L30 30 M80 44 L90 30" opacity=".6"/>
      <path d="M46 100 L44 130 M74 100 L76 130" opacity=".7"/>
      <path d="M34 130 L54 130 M66 130 L86 130" opacity=".7"/>
      <path d="M30 140 C40 150 80 150 90 140" opacity=".4"/>
      <circle cx="34" cy="146" r="3" opacity=".5"/><circle cx="86" cy="146" r="3" opacity=".5"/>
      <path d="M60 80 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" opacity=".5"/>`),
    16: S(`${glow}
      <path d="M40 156 L40 70 L80 70 L80 156" />
      <path d="M44 82 L44 148 M76 82 L76 148" opacity=".35"/>
      <path d="M40 70 L60 56 L80 70"/>
      <path d="M36 56 L84 56" opacity=".7"/>
      <path d="M44 50 L50 56 M76 50 L70 56" opacity=".6"/>
      <path d="M78 20 L62 54 L72 56 L54 92" stroke-width="1.5"/>
      <path d="M78 20 l-6 8 M84 30 l-8 4" opacity=".5"/>
      <path d="M40 100 L30 92 L36 104 L26 104" opacity=".6"/>
      <path d="M80 108 L90 100 L84 112 L94 112" opacity=".6"/>
      <path d="M60 156 L60 166" opacity=".4"/>
      <path d="M18 156 L102 156" opacity=".4"/>
      <circle cx="48" cy="96" r="3" opacity=".5"/><circle cx="70" cy="120" r="3" opacity=".5"/>`),
    17: S(`${glow}
      <path d="M60 24 L63 38 L76 34 L67 44 L80 50 L66 52 L70 66 L60 56 L50 66 L54 52 L40 50 L53 44 L44 34 L57 38 Z" opacity=".95"/>
      <circle cx="24" cy="60" r="2.4" opacity=".7"/><circle cx="96" cy="52" r="2.4" opacity=".7"/>
      <circle cx="34" cy="34" r="2" opacity=".5"/><circle cx="88" cy="32" r="2" opacity=".5"/>
      <circle cx="20" cy="94" r="1.8" opacity=".5"/><circle cx="102" cy="86" r="1.8" opacity=".5"/>
      <circle cx="60" cy="84" r="1.6" opacity=".4"/>
      <path d="M44 96 C40 104 44 110 50 108 C46 116 52 120 56 116" opacity=".7"/>
      <path d="M78 96 C82 104 78 112 72 110" opacity=".7"/>
      <path d="M52 116 C54 124 50 130 44 134 C54 136 60 132 60 124" opacity=".5"/>
      <path d="M70 112 C72 122 78 128 86 132" opacity=".4"/>
      <path d="M22 140 C34 148 86 148 98 140" opacity=".35"/>
      <path d="M26 156 L94 156" opacity=".25"/>`),
    18: S(`${glow}
      <circle cx="60" cy="44" r="14"/>
      <path d="M46 44 C52 32 68 32 74 44 C68 54 52 54 46 44Z" opacity=".5"/>
      <path d="M56 40 a 1.6 1.6 0 1 0 .1 0" /><path d="M64 40 a 1.6 1.6 0 1 0 .1 0"/>
      <path d="M58 48 c1.5 1.5 3 1.5 4 0" opacity=".7"/>
      <path d="M30 74 L30 140 M30 88 L40 74" opacity=".6"/>
      <path d="M90 74 L90 140 M90 88 L80 74" opacity=".6"/>
      <path d="M22 70 L38 70" opacity=".5"/><path d="M82 70 L98 70" opacity=".5"/>
      <path d="M44 152 C48 142 52 138 58 134 C64 130 70 134 74 142 C78 150 82 152 88 150" opacity=".7"/>
      <circle cx="46" cy="140" r="4" opacity=".6"/><circle cx="74" cy="140" r="4" opacity=".6"/>
      <path d="M52 110 C56 116 64 116 68 110" opacity=".4"/>
      <path d="M60 96 L60 118" opacity=".35"/>
      <path d="M48 96 C48 92 56 90 60 94 C64 90 72 92 72 96" opacity=".35"/>`),
    19: S(`${glow}
      <circle cx="60" cy="46" r="17"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        return `<line x1="${60 + 19 * Math.cos(a)}" y1="${46 + 19 * Math.sin(a)}" x2="${60 + 25 * Math.cos(a)}" y2="${46 + 25 * Math.sin(a)}"/>`;
      }).join('')}
      <path d="M54 42 a2 2 0 1 0 .1 0 M66 42 a2 2 0 1 0 .1 0" opacity=".7"/>
      <path d="M55 51 c3 3 7 3 10 0" opacity=".7"/>
      <path d="M38 156 L38 128 L50 128 L50 156 M70 156 L70 128 L82 128 L82 156" opacity=".5"/>
      <circle cx="60" cy="120" r="9"/>
      <path d="M60 129 L60 148 M60 136 L50 144 M60 136 L70 144 M60 148 L54 158 M60 148 L66 158"/>
      <path d="M76 144 L84 132" opacity=".6"/>
      <path d="M20 158 L100 158" opacity=".4"/>
      <path d="M24 118 l3 8 -3 8 -3 -8z" opacity=".4"/><path d="M96 118 l3 8 -3 8 -3 -8z" opacity=".4"/>`),
    20: S(`${glow}
      <path d="M60 22 L60 46"/>
      <path d="M46 46 C52 40 68 40 74 46" opacity=".5"/>
      <path d="M44 40 C36 44 32 56 36 64" opacity=".6"/>
      <path d="M76 40 C84 44 88 56 84 64" opacity=".6"/>
      <path d="M46 60 L60 108 L74 60 Z" opacity=".8"/>
      <circle cx="60" cy="70" r="3" opacity=".6"/>
      <path d="M34 82 C24 78 20 70 22 62" opacity=".4"/>
      <path d="M86 82 C96 78 100 70 98 62" opacity=".4"/>
      <path d="M40 128 C44 120 50 116 54 120 C58 124 54 132 48 134 C54 136 60 132 62 126" opacity=".5"/>
      <path d="M66 128 C70 120 76 116 80 120 C84 124 80 132 74 134" opacity=".5"/>
      <path d="M60 140 L60 160" opacity=".4"/>
      <path d="M18 160 L102 160" opacity=".35"/>`),
    21: S(`${glow}
      <ellipse cx="60" cy="90" rx="34" ry="44"/>
      <ellipse cx="60" cy="90" rx="28" ry="38" opacity=".5"/>
      <path d="M60 52 L62 60 L70 60 L64 65 L66 73 L60 68 L54 73 L56 65 L50 60 L58 60 Z" opacity=".7"/>
      <circle cx="60" cy="86" r="7"/>
      <path d="M60 93 L60 116 M60 98 L48 106 M60 98 L72 106 M60 116 L54 130 M60 116 L66 130" opacity=".9"/>
      <path d="M48 86 C44 82 46 78 50 78" opacity=".4"/>
      <path d="M72 86 C76 82 74 78 70 78" opacity=".4"/>
      <circle cx="26" cy="40" r="4" opacity=".5"/><circle cx="94" cy="40" r="4" opacity=".5"/>
      <circle cx="26" cy="142" r="4" opacity=".5"/><circle cx="94" cy="142" r="4" opacity=".5"/>
      <path d="M22 40 L30 40 M22 40 L26 36 M22 40 L26 44" opacity=".4"/>
      <path d="M90 142 L98 142 M94 138 L94 146" opacity=".4"/>`)
  };

  /* ---------- 카드 데이터 ---------- */
  const TAROT = [
    { n: 0, numeral: '0', name: '바보', en: 'THE FOOL', key: '순수 · 시작 · 자유',
      up: '아직 아무것도 정해지지 않았다는 것이 이 카드의 힘입니다. 계산보다 발걸음이 먼저 나가고, 그 무모함이 예상 밖의 문을 엽니다.',
      rev: '준비 없이 뛰어드는 것이 아니라, 뛰고 싶은 마음을 두려워하는 상태입니다. 완벽해질 때까지 기다리면 그 문은 닫힙니다.',
      cat: { love: '설렘은 계산보다 먼저 옵니다. 상대의 조건표를 접어두는 편이 낫습니다.', money: '작게 시작하는 지출이 크게 돌아오는 구조입니다. 첫걸음을 미루는 것이 유일한 손실입니다.', work: '정해진 길이 아니라 새로 만드는 길에서 성과가 납니다.', today: '오늘은 계획을 반쯤 접어도 괜찮은 날입니다.' } },
    { n: 1, numeral: 'I', name: '마법사', en: 'THE MAGICIAN', key: '의지 · 재능 · 실행',
      up: '필요한 도구는 이미 당신 손안에 있습니다. 무엇을 만들지 분명히 말하는 순간, 흩어져 있던 것들이 하나의 결과로 모입니다.',
      rev: '재주는 있는데 방향이 흩어져 있습니다. 여러 가지를 동시에 벌이면 어느 것도 완성되지 않습니다.',
      cat: { love: '말과 행동이 일치할 때 관계가 급격히 가까워집니다.', money: '기술과 재능이 곧 수입이 되는 통로가 보입니다.', work: '기획과 실행을 혼자 묶을 수 있는 자리에서 강합니다.', today: '오늘 한 번의 제안이 다음 달을 바꿉니다.' } },
    { n: 2, numeral: 'II', name: '여사제', en: 'THE HIGH PRIESTESS', key: '직관 · 비밀 · 침묵',
      up: '아직 말할 때가 아닙니다. 눈에 보이는 정보보다 마음속에서 조용히 올라오는 감각이 정답에 가깝습니다.',
      rev: '직감을 알면서도 무시하고 있습니다. 남의 말에 기대는 순간 판단이 흐려집니다.',
      cat: { love: '상대의 진심은 말보다 침묵에서 드러납니다. 서두르지 마십시오.', money: '섣부른 계약보다 한 번 더 확인하는 것이 재물을 지킵니다.', work: '공개하지 않은 준비가 곧 큰 무기가 됩니다.', today: '오늘은 말수를 줄일수록 이깁니다.' } },
    { n: 3, numeral: 'III', name: '여황제', en: 'THE EMPRESS', key: '풍요 · 돌봄 · 결실',
      up: '뿌린 것이 익어가는 시기입니다. 사람을 돌보고 일을 가꾼 만큼 결과가 눈에 보이게 돌아옵니다.',
      rev: '돌보느라 정작 자신을 비워두고 있습니다. 주는 것과 받는 것의 균형이 무너지면 풍요도 멈춥니다.',
      cat: { love: '애정이 넘치되 상대를 다스리려 하면 반대로 흐릅니다.', money: '생활과 관련된 지출이 곧 수익으로 이어집니다.', work: '꾸준히 가꾼 것이 평가받는 시기입니다.', today: '오늘은 몸을 아끼는 것이 가장 생산적인 일입니다.' } },
    { n: 4, numeral: 'IV', name: '황제', en: 'THE EMPEROR', key: '질서 · 책임 · 통제',
      up: '규칙을 세우는 사람이 판을 가집니다. 지금 필요한 것은 감정이 아니라 구조입니다.',
      rev: '통제하려는 마음이 강해져 사람이 떠나고 있습니다. 단단함과 완고함은 종이 한 장 차이입니다.',
      cat: { love: '관계에도 규칙이 필요합니다. 다만 상대를 관리하려 들면 신뢰가 상합니다.', money: '예산과 기준을 문서로 정하면 재물이 새지 않습니다.', work: '책임을 맡는 자리가 곧 성장의 자리입니다.', today: '오늘 결정한 규칙을 3일만 지켜보십시오.' } },
    { n: 5, numeral: 'V', name: '교황', en: 'THE HIEROPHANT', key: '전통 · 배움 · 조언',
      up: '혼자 판단하기보다 검증된 방법과 조언자가 답을 줍니다. 배움에 투자하면 그대로 돌아옵니다.',
      rev: '틀에 박힌 방식이 지금 상황에는 맞지 않습니다. 관습을 따르는 것이 오히려 손해입니다.',
      cat: { love: '소개나 가족·지인의 연결이 인연의 통로가 됩니다.', money: '검증된 상품과 정석적인 절차가 재물을 지킵니다.', work: '자격·교육·공식 절차가 다음 단계의 열쇠입니다.', today: '오늘은 누군가의 조언을 그대로 들어볼 만한 날입니다.' } },
    { n: 6, numeral: 'VI', name: '연인', en: 'THE LOVERS', key: '선택 · 인연 · 조화',
      up: '마음이 향하는 곳이 분명해지는 시기입니다. 두 가지 사이에서 고민하고 있다면, 끌리는 쪽이 이미 답입니다.',
      rev: '선택을 미루는 동안 기회가 흐려지고 있습니다. 둘 다 잡으려 하면 둘 다 놓칩니다.',
      cat: { love: '인연이 구체化되는 흐름입니다. 마음을 말로 옮기십시오.', money: '공동의 결정이 재물의 방향을 가릅니다. 함께 정하십시오.', work: '협업에서 좋은 짝을 만나면 성과가 두 배가 됩니다.', today: '오늘의 선택 하나가 석 달 뒤를 가릅니다.' } },
    { n: 7, numeral: 'VII', name: '전차', en: 'THE CHARIOT', key: '전진 · 승리 · 절제',
      up: '멈춰 있던 것이 움직이기 시작합니다. 두 마리 말을 동시에 다루듯 감정과 이성을 함께 묶어야 목적지에 닿습니다.',
      rev: '속도만 앞서 방향을 잃었습니다. 잠깐 세워 고삐를 다시 잡으십시오.',
      cat: { love: '밀어붙이면 가까워지고, 조급하면 멀어집니다.', money: '움직이는 돈에서 성과가 납니다. 다만 과속은 금물입니다.', work: '경쟁에서 앞서는 흐름입니다. 목표를 하나로 좁히십시오.', today: '오늘 미뤄둔 연락 하나가 판을 바꿉니다.' } },
    { n: 8, numeral: 'VIII', name: '힘', en: 'STRENGTH', key: '용기 · 인내 · 부드러운 힘',
      up: '이기는 힘이 아니라 다스리는 힘입니다. 사자를 쓰다듬는 손처럼, 강한 것을 부드럽게 다룰 때 진짜 실력이 나옵니다.',
      rev: '자신의 감정을 누르고만 있습니다. 참는 것과 다스리는 것은 다릅니다.',
      cat: { love: '상대를 이기려 하지 않고 품으려 할 때 관계가 살아납니다.', money: '급한 지출을 한 번 눌러보십시오. 그것이 수익입니다.', work: '힘든 구간을 버티는 사람이 결국 남습니다.', today: '오늘은 화를 한 번 삼키면 이깁니다.' } },
    { n: 9, numeral: 'IX', name: '은둔자', en: 'THE HERMIT', key: '탐구 · 고독 · 지혜',
      up: '잠시 물러나 혼자만의 시간을 가질 때 답이 보입니다. 지금은 사람보다 생각이 필요한 때입니다.',
      rev: '혼자 있는 것이 회피가 되고 있습니다. 문을 닫은 채로는 아무것도 확인할 수 없습니다.',
      cat: { love: '거리를 두는 것이 관계를 정리하는 시간이 됩니다.', money: '큰 결정보다 지출을 점검할 때입니다.', work: '공부와 연구에 몰입하면 다음 분기의 무기가 됩니다.', today: '오늘은 한 시간만 조용히 있으십시오.' } },
    { n: 10, numeral: 'X', name: '운명의 수레바퀴', en: 'WHEEL OF FORTUNE', key: '전환 · 순환 · 기회',
      up: '흐름이 바뀝니다. 올라가던 것이 내려가고 내려가던 것이 올라가는 자리에서, 준비한 사람에게 기회가 걸립니다.',
      rev: '같은 자리에서 맴돌고 있습니다. 방식이 아니라 타이밍을 바꿔야 합니다.',
      cat: { love: '예상하지 못한 곳에서 인연이 들어옵니다.', money: '흐름을 타면 한 번에 벌고, 거스르면 한 번에 잃습니다.', work: '판이 바뀌는 시기입니다. 자리를 옮길 기회가 옵니다.', today: '오늘 온 연락은 흘려보내지 마십시오.' } },
    { n: 11, numeral: 'XI', name: '정의', en: 'JUSTICE', key: '균형 · 진실 · 인과',
      up: '지금은 감정보다 사실이 중요합니다. 정확하게 계산하고 공정하게 나누면 결과가 오래갑니다.',
      rev: '한쪽으로 기운 판단이 문제를 만들고 있습니다. 감정으로 내린 결정을 다시 보십시오.',
      cat: { love: '주고받음이 균형을 이룰 때 관계가 안정됩니다.', money: '장부와 계약서를 확인하십시오. 숫자가 답을 줍니다.', work: '공정한 절차가 당신을 보호합니다.', today: '오늘의 서명은 한 번 더 읽고 하십시오.' } },
    { n: 12, numeral: 'XII', name: '매달린 사람', en: 'THE HANGED MAN', key: '정지 · 관점 · 희생',
      up: '멈춘 것이 실패가 아닙니다. 반대로 보면 지금까지 보이지 않던 것이 보입니다.',
      rev: '멈춰야 할 때인데 버티고 있습니다. 놓아야 할 것을 놓지 않아 더 오래 묶여 있습니다.',
      cat: { love: '기다림이 관계의 방향을 결정합니다. 조급함이 유일한 적입니다.', money: '당장의 손해가 다음의 이득으로 바뀌는 구조를 보십시오.', work: '잠시 물러나는 것이 전략이 됩니다.', today: '오늘은 결정을 미루는 것이 정답입니다.' } },
    { n: 13, numeral: 'XIII', name: '죽음', en: 'DEATH', key: '종결 · 재생 · 정리',
      up: '끝내야 새것이 들어옵니다. 관계든 일이든 이미 생명이 다한 것을 붙잡고 있지는 않습니까.',
      rev: '끝난 것을 끝이라고 인정하지 못해 같은 자리에서 반복하고 있습니다.',
      cat: { love: '정리해야 할 감정이 있습니다. 끝은 다음 인연의 시작입니다.', money: '지출 구조를 한 번 갈아엎을 시기입니다.', work: '방식을 버리고 새 체계로 옮길 때입니다.', today: '오늘 버린 하나가 공간을 만듭니다.' } },
    { n: 14, numeral: 'XIV', name: '절제', en: 'TEMPERANCE', key: '조절 · 융합 · 회복',
      up: '두 가지를 섞어 제3의 답을 만드는 힘입니다. 서두르지 않고 온도를 맞추면 몸과 마음이 회복됩니다.',
      rev: '균형이 깨져 한쪽으로 쏠려 있습니다. 무엇을 줄여야 하는지 이미 알고 있습니다.',
      cat: { love: '다름을 섞어가는 과정이 관계의 실체입니다.', money: '수입과 지출의 온도를 맞추면 자연히 남습니다.', work: '두 분야를 겸하는 자리에서 독특한 강점이 생깁니다.', today: '오늘은 과한 것을 하나 줄이십시오.' } },
    { n: 15, numeral: 'XV', name: '악마', en: 'THE DEVIL', key: '집착 · 유혹 · 속박',
      up: '끊고 싶은데 끊지 못하는 것이 있습니다. 사슬은 사실 느슨하지만, 스스로 목에 걸고 있는 경우가 많습니다.',
      rev: '속박에서 벗어나기 시작했습니다. 사슬이 풀리는 순간은 생각보다 가깝습니다.',
      cat: { love: '집착과 애정을 구별해야 하는 시기입니다.', money: '급한 돈, 손쉬운 수익에 손대면 대가가 큽니다.', work: '좋지 않은 조건을 참고 있는지 점검하십시오.', today: '오늘 한 번의 유혹이 석 달을 묶습니다.' } },
    { n: 16, numeral: 'XVI', name: '탑', en: 'THE TOWER', key: '붕괴 · 각성 · 재건',
      up: '무너지는 것은 무너져야 할 것이었습니다. 충격 뒤에 남는 것이 당신의 진짜 기반입니다.',
      rev: '작은 균열이 보이는데 덮어두고 있습니다. 미리 손보면 큰 붕괴를 막을 수 있습니다.',
      cat: { love: '숨겨둔 갈등이 드러나는 시기입니다. 드러난 뒤가 더 중요합니다.', money: '예상 밖의 지출에 대비하십시오. 안전판이 필요합니다.', work: '기존 방식이 흔들립니다. 재건 계획을 미리 세우십시오.', today: '오늘의 불편함은 신호입니다. 무시하지 마십시오.' } },
    { n: 17, numeral: 'XVII', name: '별', en: 'THE STAR', key: '희망 · 치유 · 방향',
      up: '어둠이 걷히고 방향이 보입니다. 지금 느끼는 희망은 근거 없는 낙관이 아니라 정확한 예감입니다.',
      rev: '희망을 잃은 것이 아니라 잠시 가려진 것입니다. 아주 작은 성공 하나로 다시 보입니다.',
      cat: { love: '진심이 통하는 인연이 가까이 있습니다.', money: '작지만 꾸준한 수입이 길을 만듭니다.', work: '장기 목표를 다시 세우기 좋은 시기입니다.', today: '오늘 밤 잠들기 전 원하는 것을 한 줄 적으십시오.' } },
    { n: 18, numeral: 'XVIII', name: '달', en: 'THE MOON', key: '불안 · 환영 · 무의식',
      up: '보이는 것이 전부가 아닙니다. 확신이 서지 않을 때는 결정을 미루고, 마음이 편한 쪽을 기억하십시오.',
      rev: '안개가 걷히고 있습니다. 불안의 정체를 확인하면 크지 않습니다.',
      cat: { love: '상대의 말보다 상황을 보십시오. 오해가 관계를 흔듭니다.', money: '숨은 비용을 확인해야 합니다. 계약서의 작은 글씨를 보십시오.', work: '정보가 부족합니다. 확인 전에는 움직이지 마십시오.', today: '오늘은 큰 결정을 피하십시오.' } },
    { n: 19, numeral: 'XIX', name: '태양', en: 'THE SUN', key: '성취 · 기쁨 · 명료',
      up: '가장 밝은 카드입니다. 숨기던 것이 드러나고, 노력한 만큼 인정받습니다. 지금 하는 일을 계속하십시오.',
      rev: '성과가 완전하지는 않지만 방향은 맞습니다. 조급함이 유일한 방해입니다.',
      cat: { love: '관계가 밝아지는 시기입니다. 표현하면 그대로 돌아옵니다.', money: '들어오는 돈이 늘어납니다. 다만 씀씀이도 함께 늘지 않게 하십시오.', work: '실력이 드러나 평가받습니다.', today: '오늘은 밝은 쪽으로 말하십시오. 그것이 운입니다.' } },
    { n: 20, numeral: 'XX', name: '심판', en: 'JUDGEMENT', key: '부활 · 소명 · 결산',
      up: '지나간 일이 다시 불려 나옵니다. 그것은 후회가 아니라 마무리입니다. 오래 묵힌 일을 지금 정리하면 새 국면이 열립니다.',
      rev: '과거의 일을 아직 붙잡고 있습니다. 용서하지 않으면 다시 시작할 수 없습니다.',
      cat: { love: '오래된 인연이 다시 연결되거나 매듭지어집니다.', money: '잊고 있던 채권·환급·정산을 확인하십시오.', work: '미뤄둔 일을 끝내면 다음 자리가 보입니다.', today: '오늘 미뤄둔 그 일을 10분만 하십시오.' } },
    { n: 21, numeral: 'XXI', name: '세계', en: 'THE WORLD', key: '완성 · 통합 · 다음 문',
      up: '한 주기가 완결됩니다. 오래 준비한 일이 형태를 갖추고, 다음 무대로 넘어갈 자격이 생깁니다.',
      rev: '거의 다 왔는데 마지막 한 조각이 남았습니다. 미완의 그 부분이 전체를 붙잡고 있습니다.',
      cat: { love: '관계가 안정된 자리에 도달합니다. 다음 단계를 논의할 시기입니다.', money: '큰 흐름이 마무리되고 새 주기가 시작됩니다.', work: '완성과 인정이 함께 옵니다. 다음 판을 준비하십시오.', today: '오늘 하나를 끝내면 다음이 열립니다.' } }
  ];

  const CATEGORIES = [
    { id: 'love', name: '연애 · 인연', icon: '♥', intro: '마음과 인연의 흐름을 봅니다.' },
    { id: 'money', name: '재물 · 금전', icon: '₩', intro: '돈이 들어오고 나가는 길을 봅니다.' },
    { id: 'work', name: '직장 · 사업', icon: '◆', intro: '일과 자리의 흐름을 봅니다.' },
    { id: 'today', name: '오늘의 운', icon: '☾', intro: '오늘 하루의 결을 봅니다.' }
  ];

  const POSITIONS = [
    { id: 'past', name: '과거', desc: '지금의 뿌리' },
    { id: 'now', name: '현재', desc: '지금 서 있는 자리' },
    { id: 'future', name: '미래', desc: '흐름이 향하는 곳' }
  ];

  /* 카드 뒷면 — 금박 문양 */
  function cardBack() {
    return `<svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" class="back-art">
      <defs>
        <radialGradient id="bk" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#2a1a3d"/><stop offset="60%" stop-color="#150d20"/>
          <stop offset="100%" stop-color="#08050d"/>
        </radialGradient>
        <linearGradient id="bframe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f6e3ad"/><stop offset="50%" stop-color="#c9a24d"/>
          <stop offset="100%" stop-color="#f6e3ad"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="180" fill="url(#bk)"/>
      <rect x="6" y="6" width="108" height="168" rx="6" fill="none" stroke="url(#bframe)" stroke-width="1.1"/>
      <rect x="10" y="10" width="100" height="160" rx="4" fill="none" stroke="#c9a24d" stroke-width="0.5" opacity=".55"/>
      <g stroke="#d9b978" stroke-width="0.7" fill="none" opacity=".85" transform="translate(60,90)">
        <circle r="30" opacity=".8"/><circle r="24" opacity=".5"/><circle r="10" opacity=".9"/>
        ${Array.from({ length: 12 }, (_, i) => {
          const a = i * Math.PI / 6;
          return `<line x1="${10 * Math.cos(a)}" y1="${10 * Math.sin(a)}" x2="${30 * Math.cos(a)}" y2="${30 * Math.sin(a)}" opacity=".6"/>`;
        }).join('')}
        ${Array.from({ length: 8 }, (_, i) => {
          const a = i * Math.PI / 4 + 0.39;
          return `<circle cx="${38 * Math.cos(a)}" cy="${38 * Math.sin(a)}" r="1.6" opacity=".5"/>`;
        }).join('')}
        <path d="M0 -30 L0 -44 M0 30 L0 44 M-30 0 L-44 0 M30 0 L44 0" opacity=".5"/>
        <path d="M-22 -22 L-32 -32 M22 -22 L32 -32 M-22 22 L-32 32 M22 22 L32 32" opacity=".35"/>
      </g>
      <text x="60" y="27" text-anchor="middle" font-size="9" fill="#d9b978" opacity=".75" font-family="serif" letter-spacing="3">天機</text>
      <text x="60" y="163" text-anchor="middle" font-size="8" fill="#d9b978" opacity=".55" font-family="serif" letter-spacing="2">살풀이</text>
    </svg>`;
  }

  function cardFront(card) {
    return `<div class="face front">
      <div class="numeral">${card.numeral}</div>
      <div class="art-wrap">${ART[card.n]}</div>
      <div class="cname">${card.name}</div>
      <div class="cen">${card.en}</div>
      <div class="rev-mark">逆</div>
    </div>`;
  }

  global.Tarot = { TAROT, CATEGORIES, POSITIONS, cardBack, cardFront, ART };
})(window);
