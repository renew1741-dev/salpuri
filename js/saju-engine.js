/* ============================================================
   살풀이 : 천기 만세력 엔진 (Saju Engine)
   - 음력→양력 변환(1940~2030 한국 음양력 대조표)
   - 24절기(절입) 기준 연주·월주
   - JDN(율리우스 적일) 기반 일주 (60갑자 무오차)
   - 오호둔법(월간)·오서둔법(시간)
   - 십성·지장간·오행 분포·신강신약·용신·대운·세운·신살
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 기본 상수 ---------- */
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const GAN_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const GAN_READ = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const JI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const JI_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const JI_ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  const GAN_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];      // 0목 1화 2토 3금 4수
  const JI_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const ELEM_HANJA = ['木', '火', '土', '金', '水'];
  const ELEM_KO = ['목', '화', '토', '금', '수'];
  const ELEM_COLOR = ['#4ade80', '#f87171', '#f0b429', '#d6dbe4', '#60a5fa'];
  const ELEM_DIRECTION = ['동쪽', '남쪽', '중앙·집', '서쪽', '북쪽'];
  const ELEM_NUM = ['3·8', '2·7', '5·10', '4·9', '1·6'];
  const ELEM_COLORNAME = [
    ['초록·청록', '연둣빛·옥색'],
    ['빨강·주홍', '보라·자주'],
    ['노랑·황금', '베이지·카키'],
    ['흰색·은색', '회색·메탈'],
    ['검정·남색', '파랑·청색']
  ];
  const ELEM_ORGAN = ['간·담·눈', '심장·혈압·소장', '위장·비장·소화기', '폐·기관지·피부', '신장·방광·생식기'];
  const ELEM_TRAIT = [
    '성장과 추진력, 새로 시작하는 힘',
    '열정과 표현력, 사람을 끌어당기는 빛',
    '신뢰와 중심, 재물을 담아내는 그릇',
    '결단과 실행력, 옥석을 가려내는 칼날',
    '지혜와 유연함, 깊은 통찰과 흐름'
  ];

  /* 지장간(支藏干) — [천간 index, 비중] */
  const JIJANGGAN = [
    [[4, 1.0]],                                  // 子 계
    [[5, 0.60], [4, 0.20], [7, 0.20]],           // 丑 기 계 신
    [[0, 0.60], [2, 0.30], [4, 0.10]],           // 寅 갑 병 무
    [[1, 1.0]],                                  // 卯 을
    [[4, 0.60], [1, 0.30], [9, 0.10]],           // 辰 무 을 계
    [[2, 0.60], [4, 0.30], [6, 0.10]],           // 巳 병 무 경
    [[3, 0.70], [5, 0.30]],                      // 午 정 기
    [[5, 0.60], [3, 0.30], [1, 0.10]],           // 未 기 정 을
    [[6, 0.60], [8, 0.30], [4, 0.10]],           // 申 경 임 무
    [[7, 1.0]],                                  // 酉 신
    [[4, 0.60], [7, 0.30], [3, 0.10]],           // 戌 무 신 정
    [[8, 0.70], [0, 0.30]]                       // 亥 임 갑
  ];

  const SIJIN = ['자시', '축시', '인시', '묘시', '진시', '사시', '오시', '미시', '신시', '유시', '술시', '해시'];
  const SIJIN_RANGE = [
    '23:00~00:59', '01:00~02:59', '03:00~04:59', '05:00~06:59',
    '07:00~08:59', '09:00~10:59', '11:00~12:59', '13:00~14:59',
    '15:00~16:59', '17:00~18:59', '19:00~20:59', '21:00~22:59'
  ];

  /* 24절기 (소한부터) — [이름, 태양황경] */
  const TERM_INFO = [
    ['소한', 285], ['대한', 300], ['입춘', 315], ['우수', 330],
    ['경칩', 345], ['춘분', 0], ['청명', 15], ['곡우', 30],
    ['입하', 45], ['소만', 60], ['망종', 75], ['하지', 90],
    ['소서', 105], ['대서', 120], ['입추', 135], ['처서', 150],
    ['백로', 165], ['추분', 180], ['한로', 195], ['상강', 210],
    ['입동', 225], ['소설', 240], ['대설', 255], ['동지', 270]
  ];

  const mod = (n, m) => ((n % m) + m) % m;

  /* ---------- JDN ---------- */
  function toJDN(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
      Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function fromJDN(jdn) {
    let a = jdn + 32044;
    let b = Math.floor((4 * a + 3) / 146097);
    let c = a - Math.floor(146097 * b / 4);
    let d = Math.floor((4 * c + 3) / 1461);
    let e = c - Math.floor(1461 * d / 4);
    let m = Math.floor((5 * e + 2) / 153);
    return {
      d: e - Math.floor((153 * m + 2) / 5) + 1,
      m: m + 3 - 12 * Math.floor(m / 10),
      y: 100 * b + d - 4800 + Math.floor(m / 10)
    };
  }
  /* 60갑자 index — 2000-01-01 = 戊午(index 54) 기준 검증 완료 */
  function dayGanjiIndex(jdn) { return mod(jdn + 49, 60); }

  /* ---------- 음양력 ---------- */
  const LUNAR_START = 1930; // LUNAR_TABLE[0]의 음력 연도

  function lunarYearRow(y) {
    const idx = y - LUNAR_START;
    const t = global.LUNAR_TABLE;
    return t && t[idx] ? t[idx] : null;
  }

  /** 해당 음력 연도의 달 순서(윤달 포함) */
  function monthSeq(row) {
    const days = row[4], leap = row[3];
    const seq = [];
    let mi = 0;
    for (let i = 0; i < days.length; i++) {
      if (leap && i === leap) {
        seq.push({ month: leap, leap: true, len: days[i] });
      } else {
        mi++;
        seq.push({ month: mi, leap: false, len: days[i] });
      }
    }
    return seq;
  }

  /** 음력 → 양력. 실패 시 null */
  function lunarToSolar(y, m, d, isLeap) {
    const row = lunarYearRow(y);
    if (!row) return null;
    if (m < 1 || m > 12) return null;
    const [sy, sm, sd] = row;
    const seq = monthSeq(row);
    let cum = 0, target = null;
    for (const s of seq) {
      if (s.month === m && s.leap === !!isLeap) { target = s; break; }
      cum += s.len;
    }
    if (!target) return null;
    if (d < 1 || d > target.len) return null;
    const jdn = toJDN(sy, sm, sd) + cum + (d - 1);
    return fromJDN(jdn);
  }

  /** 양력 → 음력 (결과 표시용) */
  function solarToLunar(y, m, d) {
    const jdn = toJDN(y, m, d);
    for (let ly = y; ly >= y - 2; ly--) {
      const row = lunarYearRow(ly);
      if (!row) continue;
      const [sy, sm, sd] = row;
      const startJdn = toJDN(sy, sm, sd);
      if (jdn < startJdn) continue;
      let cum = 0;
      for (const s of monthSeq(row)) {
        if (jdn < startJdn + cum + s.len) {
          return { y: ly, m: s.month, d: jdn - startJdn - cum + 1, leap: s.leap };
        }
        cum += s.len;
      }
    }
    return null;
  }

  /* ---------- 절기 ---------- */
  /** 해당 연도 절기 Date 배열(24개, 소한부터) — KST */
  function termsOfYear(y) {
    const a = global.SOLAR_TERMS[y];
    if (!a) return null;
    return a.map(mins => new Date(Date.UTC(y, 0, 1, 0, 0, 0) - 9 * 3600000 + mins * 60000));
  }

  /** 특정 시각 기준 12절(節) 중 마지막으로 지난 절 */
  function lastSectionTerm(ts) {
    const base = ts.getTime();
    let best = null;
    for (let y = ts.getFullYear() - 1; y <= ts.getFullYear() + 1; y++) {
      const t = termsOfYear(y);
      if (!t) continue;
      for (let i = 0; i < 24; i += 2) { // 12절 = 짝수 index
        const d = t[i];
        if (d.getTime() <= base && (!best || d.getTime() > best.date.getTime())) {
          best = { date: d, index: i, year: y };
        }
      }
    }
    return best;
  }

  /** 다음 절입 (대운수 계산용) */
  function nextSectionTerm(ts) {
    const base = ts.getTime();
    let best = null;
    for (let y = ts.getFullYear() - 1; y <= ts.getFullYear() + 1; y++) {
      const t = termsOfYear(y);
      if (!t) continue;
      for (let i = 0; i < 24; i += 2) {
        const d = t[i];
        if (d.getTime() > base && (!best || d.getTime() < best.date.getTime())) {
          best = { date: d, index: i, year: y };
        }
      }
    }
    return best;
  }

  function lichunOf(y) {
    const t = termsOfYear(y);
    return t ? t[2] : null; // index 2 = 입춘
  }

  /** 절기 시각을 KST 표기 문자열로 */
  function termLabel(d) {
    const k = new Date(d.getTime() + 9 * 3600000);
    const p = n => String(n).padStart(2, '0');
    return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
  }

  /* ---------- 기둥 계산 ---------- */
  /** ts: KST 기준 순간(ms). solarYear: KST 기준 역년 */
  function yearPillar(ts, solarYear) {
    const lc = lichunOf(solarYear);
    const before = lc && ts < lc.getTime();
    const sajuYear = before ? solarYear - 1 : solarYear;
    return {
      sajuYear,
      gan: mod(sajuYear - 4, 10),
      ji: mod(sajuYear - 4, 12),
      beforeLichun: !!before,
      lichun: lc,
      note: before ? `${solarYear}년 입춘 전 출생 → ${sajuYear}년 간지` : null
    };
  }

  function monthPillar(ts, yearGan) {
    const term = lastSectionTerm(new Date(ts));
    if (!term) return null;
    const i = term.index;
    const order = (i === 0) ? 12 : i / 2;       // 인월=1 … 자월=11, 축월=12
    const ji = mod(i / 2 + 1, 12);
    // 오호둔법: 甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
    const gan = mod((yearGan % 5) * 2 + 2 + (order - 1), 10);
    return { gan, ji, order, term, termName: TERM_INFO[i][0] };
  }

  function dayPillar(y, m, d, isJasi) {
    let jdn = toJDN(y, m, d);
    if (isJasi) jdn += 1; // 자시(23시 이후)는 다음 날 일주로 산출
    const idx = dayGanjiIndex(jdn);
    return { gan: idx % 10, ji: idx % 12, index: idx, jdn };
  }

  function hourPillar(dayGan, sijinIndex) {
    // 오서둔법: 甲己日起甲子時
    const gan = mod((dayGan % 5) * 2 + sijinIndex, 10);
    return { gan, ji: sijinIndex };
  }

  /* ---------- 십성 ---------- */
  const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  const TEN_GODS_HANJA = ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'];

  function elementRelation(meElem, targetElem) {
    if (meElem === targetElem) return 'same';
    if (mod(meElem + 1, 5) === targetElem) return 'output';   // 내가 생함
    if (mod(meElem + 2, 5) === targetElem) return 'wealth';   // 내가 극함
    if (mod(targetElem + 1, 5) === meElem) return 'resource'; // 나를 생함
    return 'officer';                                        // 나를 극함
  }

  function tenGod(dayGan, targetGan) {
    const me = GAN_ELEM[dayGan], t = GAN_ELEM[targetGan];
    const samePolarity = (dayGan % 2) === (targetGan % 2);
    switch (elementRelation(me, t)) {
      case 'same': return samePolarity ? 0 : 1;      // 비견 / 겁재
      case 'output': return samePolarity ? 2 : 3;    // 식신 / 상관
      case 'wealth': return samePolarity ? 4 : 5;    // 편재 / 정재
      case 'officer': return samePolarity ? 6 : 7;   // 편관 / 정관
      case 'resource': return samePolarity ? 8 : 9;  // 편인 / 정인
    }
    return 0;
  }

  /* ---------- 오행 세력 ---------- */
  const JI_POS_W = { 년: 1.0, 월: 2.6, 일: 1.4, 시: 1.0 };
  const GAN_POS_W = { 년: 0.9, 월: 1.2, 일: 1.0, 시: 0.9 };

  function elementWeights(pillars, dayGan) {
    const w = [0, 0, 0, 0, 0];
    const detail = [];
    // 일간 본인
    w[GAN_ELEM[dayGan]] += 1.0;
    pillars.forEach(p => {
      if (!p || p.gan == null) return;
      const pos = p.pos;
      if (!p.ganIsDay) {
        w[GAN_ELEM[p.gan]] += GAN_POS_W[pos];
      }
      JIJANGGAN[p.ji].forEach(([g, ratio]) => {
        w[GAN_ELEM[g]] += JI_POS_W[pos] * ratio;
      });
    });
    const total = w.reduce((a, b) => a + b, 0) || 1;
    const pct = w.map(v => v / total);
    return { w, pct, total };
  }

  /* ---------- 신강·신약 ---------- */
  function strengthOf(pillars, dayGan, ew) {
    const me = GAN_ELEM[dayGan];
    let support = 0, drain = 0;
    for (let e = 0; e < 5; e++) {
      const rel = e === me ? 'same' : elementRelation(me, e);
      if (rel === 'same' || rel === 'resource') support += ew.w[e];
      else drain += ew.w[e];
    }
    const ratio = support / (support + drain || 1);
    let level, label;
    if (ratio >= 0.66) { level = '태강(太强)'; label = '아주 강함'; }
    else if (ratio >= 0.55) { level = '신강(身强)'; label = '강함'; }
    else if (ratio >= 0.46) { level = '중화(中和)'; label = '균형'; }
    else if (ratio >= 0.37) { level = '신약(身弱)'; label = '약함'; }
    else { level = '태약(太弱)'; label = '아주 약함'; }
    return { ratio, level, label, support, drain };
  }

  /* ---------- 용신 ---------- */
  function yongsinOf(dayGan, ew, strength) {
    const me = GAN_ELEM[dayGan];
    const selfGang = strength.ratio >= 0.55;
    const selfYak = strength.ratio < 0.46;
    const score = [0, 0, 0, 0, 0];
    for (let e = 0; e < 5; e++) {
      const rel = elementRelation(me, e);
      let s = 0;
      if (selfGang) {
        if (rel === 'wealth') s = 1.15;
        else if (rel === 'officer') s = 1.05;
        else if (rel === 'output') s = 0.95;
        else if (rel === 'resource') s = -0.5;
        else s = -0.6;
      } else if (selfYak) {
        if (rel === 'resource') s = 1.15;
        else if (rel === 'same') s = 0.95;
        else if (rel === 'output') s = -0.35;
        else if (rel === 'wealth') s = -0.55;
        else s = -0.35;
      } else {
        // 중화 → 부족한 오행 보충
        s = 0.5 - ew.pct[e];
      }
      // 원국에 뿌리가 있으면 가점, 지나치게 많으면 감점
      if (ew.pct[e] > 0.02) s += 0.12;
      if (ew.pct[e] > 0.34) s -= 0.25;
      score[e] = s;
    }
    const order = [0, 1, 2, 3, 4].sort((a, b) => score[b] - score[a]);
    const yong = order[0], hee = order[1];
    const gi = order[4];
    return { yong, hee, gi, score, selfGang, selfYak };
  }

  /* ---------- 십이운성(十二運星) ---------- */
  const STAGE_NAMES = ['장생', '목욕', '관대', '임관', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
  const STAGE_HANJA = ['長生', '沐浴', '冠帶', '臨官', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養'];
  /* 일간별 장생지 — 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯 */
  const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
  function stageOf(dayGan, ji) {
    const dir = dayGan % 2 === 0 ? 1 : -1;          // 양간 순행 · 음간 역행
    return mod((ji - STAGE_START[dayGan]) * dir, 12);
  }

  /* ---------- 격국(格局) ---------- */
  const GYEOKGUK = {
    0: { name: '건록격', hanja: '建祿格', gist: '내 이름으로 서는 사람', strength: '자기 힘으로 판을 만들고, 남이 세운 판에 얹혀 살지 않아요.', shadow: '도움을 청할 순간을 놓쳐서 혼자 다 짊어지죠.', advice: '동업이나 공동명의는 처음부터 문서로 몫을 나누세요.' },
    1: { name: '양인격', hanja: '羊刃格', gist: '칼날을 품은 추진력', strength: '결정적인 순간에 남이 못 내리는 결단을 대신 내요.', shadow: '날이 서 있어서 가까운 사람을 베고 나서 후회하죠.', advice: '결정을 말로 옮기기 전에 하루만 두세요.' },
    2: { name: '식신격', hanja: '食神格', gist: '꾸준히 먹고사는 그릇', strength: '손으로 결과물을 내는 일에서 오래 먹고살아요.', shadow: '편안함에 기대다가 판을 키울 타이밍을 놓치죠.', advice: '한 가지를 10년 굴릴 구조로 만들어 두세요.' },
    3: { name: '상관격', hanja: '傷官格', gist: '틀을 뒤집는 재주', strength: '남들이 당연하게 여긴 걸 의심하는 눈이 있어요.', shadow: '옳은 말도 서열을 건드려서 적을 만들어요.', advice: '윗사람에게는 결론보다 순서를 먼저 말하세요.' },
    4: { name: '편재격', hanja: '偏財格', gist: '돈이 흐르는 자리를 아는 눈', strength: '유통·영업·투자에서 남보다 한 발 먼저 움직여요.', shadow: '들어오는 속도만큼 새는 구멍도 커요.', advice: '수입의 20%는 손대지 않는 통장으로 먼저 보내세요.' },
    5: { name: '정재격', hanja: '正財格', gist: '차곡차곡 쌓는 성실', strength: '반복되는 수입을 안정적으로 굴리는 힘이 있어요.', shadow: '큰 기회 앞에서 계산이 앞서서 놓쳐요.', advice: '한 번은 계산을 접고 작게 시험해 보세요.' },
    6: { name: '편관격', hanja: '偏官格', gist: '압박을 이기는 사람', strength: '경쟁·규제·위기 관리에서 존재감이 커져요.', shadow: '스스로를 몰아서 몸이 먼저 신호를 보내요.', advice: '잠을 줄여 일을 늘리는 방식부터 끊으세요.' },
    7: { name: '정관격', hanja: '正官格', gist: '반듯한 자리와 명예', strength: '직함·자격·공식 절차를 갖출수록 운이 열려요.', shadow: '체면 때문에 손해인 걸 알면서도 못 물러서죠.', advice: '체면이 걸린 자리일수록 숫자로 따져 보세요.' },
    8: { name: '편인격', hanja: '偏印格', gist: '남다른 공부의 눈', strength: '남이 안 보는 분야를 파고들어 전문성이 돼요.', shadow: '생각이 실행을 앞질러서 시작을 미뤄요.', advice: '완벽한 준비 대신 이번 주에 한 번 공개해 보세요.' },
    9: { name: '정인격', hanja: '正印格', gist: '배움과 보호의 그릇', strength: '문서·자격·후원이 사람을 살려요.', shadow: '보호받는 자리에 오래 머물러서 혼자 설 때를 놓쳐요.', advice: '후원에 기대는 일 하나를 내 힘으로 바꿔 보세요.' }
  };

  const GYEOKGUK_WOLGEOB = {
    name: '월겁격', hanja: '月劫格', gist: '내 힘을 이웃과 나누는 사람',
    strength: '사람을 모으고 함께 판을 키우는 힘이 있어요.',
    shadow: '내가 세운 판을 남이 가져가도 말을 못 해요.',
    advice: '처음부터 몫과 기한을 문서로 남기세요.'
  };

  function gyeokgukOf(pillars, dayGan, monthJi) {
    const hidden = JIJANGGAN[monthJi];
    const exposed = pillars.filter(p => p && p.gan != null && p.pos !== '일').map(p => p.gan);
    let chosen = hidden[0][0], how = '본기(本氣)';
    for (const [g] of hidden) {
      if (exposed.includes(g)) { chosen = g; how = '투출(透出)'; break; }
    }
    const tg = tenGod(dayGan, chosen);
    const LOK = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];       // 갑인 을묘 병사 정오 무사 기오 경신 신유 임해 계자
    const YANGIN = [3, 2, 6, 5, 6, 5, 9, 8, 0, 11];   // 갑묘 을인 병오 정사 무오 기사 경유 신신 임자 계해
    let info = GYEOKGUK[tg];
    if (tg === 0 && monthJi !== LOK[dayGan]) info = GYEOKGUK_WOLGEOB;
    if (tg === 1 && monthJi !== YANGIN[dayGan]) info = GYEOKGUK_WOLGEOB;
    return Object.assign({}, info, { tenGod: tg, gan: chosen, how, monthJi });
  }

  /* ---------- 신살 ---------- */
  const SAMHAP = [
    { group: [8, 0, 4], dohwa: 9, yeokma: 2, hwagae: 4 },   // 申子辰
    { group: [2, 6, 10], dohwa: 3, yeokma: 8, hwagae: 10 }, // 寅午戌
    { group: [5, 9, 1], dohwa: 6, yeokma: 11, hwagae: 1 },  // 巳酉丑
    { group: [11, 3, 7], dohwa: 0, yeokma: 5, hwagae: 7 }   // 亥卯未
  ];
  const CHEONEUL = { 0: [[1, 7]], 4: [[1, 7]], 6: [[1, 7]], 1: [[0, 8]], 5: [[0, 8]], 2: [[11, 9]], 3: [[11, 9]], 8: [[5, 3]], 9: [[5, 3]], 7: [[2, 6]] };
  const MUNCHANG = { 0: 5, 1: 6, 2: 8, 3: 9, 4: 8, 5: 9, 6: 11, 7: 0, 8: 2, 9: 3 };

  function salsOf(pillars, dayGan) {
    const list = [];
    const jis = pillars.filter(p => p && p.ji != null).map(p => p.ji);
    const branches = new Set(jis);

    (CHEONEUL[dayGan] || []).forEach(ji => {
      if (branches.has(ji)) list.push({ name: '천을귀인', hanja: '天乙貴人', desc: '막힐 때마다 나를 끌어주는 사람이 나타납니다.' });
    });
    if (branches.has(MUNCHANG[dayGan])) list.push({ name: '문창귀인', hanja: '文昌貴人', desc: '글과 말, 공부로 이름을 얻는 총명함이 있어요.' });

    const samhapBase = jis[0]; // 년지 기준
    const dayBase = pillars.find(p => p && p.pos === '일') ? pillars.find(p => p.pos === '일').ji : samhapBase;
    [samhapBase, dayBase].forEach(base => {
      const g = SAMHAP.find(s => s.group.includes(base));
      if (!g) return;
      if (branches.has(g.dohwa)) list.push({ name: '도화살', hanja: '桃花煞', desc: '이성과 대중의 시선을 끄는 매력이 있어요.' });
      if (branches.has(g.yeokma)) list.push({ name: '역마살', hanja: '驛馬煞', desc: '한곳에 머물기보다 움직이며 기회를 잡아요.' });
      if (branches.has(g.hwagae)) list.push({ name: '화개살', hanja: '華蓋煞', desc: '예술·종교·탐구에 깊이 빠지는 기질이 있어요.' });
    });
    // 일주 기준 특수 신살 — 괴강(魁罡)·백호(白虎)
    const day = pillars.find(p => p && p.pos === '일');
    if (day) {
      if ([[6, 4], [6, 10], [8, 4], [4, 10]].some(([g, j]) => g === day.gan && j === day.ji))
        list.push({ name: '괴강살', hanja: '魁罡煞', desc: '한 번 마음먹으면 물러서지 않는 강한 기세가 있어요.' });
      if ([[0, 4], [1, 7], [2, 10], [3, 1], [4, 4], [8, 10], [9, 1]].some(([g, j]) => g === day.gan && j === day.ji))
        list.push({ name: '백호살', hanja: '白虎煞', desc: '급한 성질과 강한 생명력이 함께 있어, 다스리면 큰 힘이 됩니다.' });
    }
    return dedupe(list);
  }

  /** 공망(空亡) — 일주 기준 비어 있는 두 지지 */
  function gongmangOf(pillars, dayIdx) {
    const gm = gongmang(dayIdx);
    const hits = pillars.filter(p => p && p.ji != null && gm.includes(p.ji)).map(p => ({ pos: p.pos, ji: p.ji }));
    return { jis: gm, hits };
  }
  function dedupe(arr) {
    const seen = new Set(); const out = [];
    arr.forEach(x => { if (!seen.has(x.name)) { seen.add(x.name); out.push(x); } });
    return out;
  }
  function gongmang(dayGanjiIdx) {
    const sun = Math.floor(((dayGanjiIdx % 10) - (dayGanjiIdx % 12) + 12) % 12);
        // 갑자순 시작 index = dayGanjiIdx - (dayGanjiIdx % 10)
    const start = dayGanjiIdx - (dayGanjiIdx % 10);
    const m1 = (start + 10) % 12, m2 = (start + 11) % 12;
    return [m1, m2];
  }

  /* ---------- 합·충 ---------- */
  const YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  const CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  const GANHAP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];

  function interactions(natalJis, natalGans, targetGan, targetJi) {
    const out = [];
    natalGans.forEach((g, i) => {
      if (g == null) return;
      GANHAP.forEach(([a, b]) => {
        if ((g === a && targetGan === b) || (g === b && targetGan === a)) {
          out.push({ type: '천간합', text: `${GAN[i]}${GAN_KO[i]}과 ${GAN[targetGan]}의 합` });
        }
      });
    });
    natalJis.forEach((j, i) => {
      if (j == null) return;
      YUKHAP.forEach(([a, b]) => {
        if ((j === a && targetJi === b) || (j === b && targetJi === a)) out.push({ type: '육합', text: '지지 육합 — 인연이 묶이는 힘' });
      });
      CHUNG.forEach(([a, b]) => {
        if ((j === a && targetJi === b) || (j === b && targetJi === a)) out.push({ type: '충', text: '지지 충 — 변화와 이동의 신호' });
      });
    });
    return out;
  }

  /* ---------- 대운 ---------- */
  function daewoonList(birthTs, solarYear, monthGan, monthJi, yearGan, gender) {
    const yangYear = yearGan % 2 === 0;
    const forward = (yangYear && gender === '남') || (!yangYear && gender === '여');
    const birth = new Date(birthTs);
    const ref = forward ? nextSectionTerm(birth) : lastSectionTerm(birth);
    let days = 0;
    if (ref) {
      days = Math.abs(ref.date.getTime() - birthTs) / 86400000;
    }
    const years = Math.floor(days / 3);
    const months = Math.round((days - years * 3) * 4);
    // 3일 = 1년, 1일 = 4개월. 반올림하되 최소 1세(0세 대운은 쓰지 않음)
    const startAge = Math.max(1, Math.round(days / 3));
    const list = [];
    for (let i = 1; i <= 9; i++) {
      const step = forward ? i : -i;
      const gi = mod(monthGan + step, 10);
      const ji = mod(monthJi + step, 12);
      const age = startAge + (i - 1) * 10;
      list.push({
        gan: gi, ji,
        startAge: age,
        endAge: age + 9,
        startYear: solarYear + age,
        index: i
      });
    }
    return { forward, startAge, years, months, days: Math.round(days * 10) / 10, list };
  }

  /* ---------- 세운 ---------- */
  function saeunOf(year, dayGan) {
    const gan = mod(year - 4, 10);
    const ji = mod(year - 4, 12);
    return { year, gan, ji, tenGod: tenGod(dayGan, gan) };
  }

  /** 생월의 절입 구간 정보 (예: 소서 7/8 01:27 ~ 입추 8/8 11:14 → 미월) */
  function monthTermInfo(y, mp) {
    if (!mp || !mp.term) return null;
    const t = termsOfYear(mp.term.year);
    if (!t) return null;
    const i = mp.term.index;
    const idxNext = i + 2;
    let nextName = null, nextDate = null;
    if (idxNext < 24) { nextName = TERM_INFO[idxNext][0]; nextDate = t[idxNext]; }
    else {
      const tn = termsOfYear(mp.term.year + 1);
      if (tn) { nextName = TERM_INFO[0][0]; nextDate = tn[0]; }
    }
    return {
      name: TERM_INFO[i][0], date: t[i], dateLabel: termLabel(t[i]),
      nextName, nextDate, nextLabel: nextDate ? termLabel(nextDate) : ''
    };
  }

  /* ---------- 메인 분석 ---------- */
  function analyze(input) {
    const { year, month, day, gender, calendar, leap, sijin, hour } = input;

    // 1) 양력 기준일 산출
    let solar = { y: year, m: month, d: day };
    let lunarInfo = null;
    const errors = [];
    if (calendar === '음력') {
      const conv = lunarToSolar(year, month, day, !!leap);
      if (!conv) {
        return { error: '음력 ' + year + '년 ' + month + '월 ' + day + '일' + (leap ? '(윤달)' : '') + '은 없는 날짜예요.' };
      }
      solar = conv;
      lunarInfo = { y: year, m: month, d: day, leap: !!leap };
    } else {
      lunarInfo = solarToLunar(solar.y, solar.m, solar.d);
    }

    // 2) 시각: 모름이면 12시(정오)로 계산하되 시주는 미상 처리
    const knownTime = sijin !== null && sijin !== undefined;
    const hourVal = knownTime ? (sijin * 2 - 1 + 24) % 24 : 12; // 자시 → 23시
    // KST 고정 오프셋(+9)으로 계산 — 브라우저 시간대·서머타임과 무관하게 동일 결과
    const ts = Date.UTC(solar.y, solar.m - 1, solar.d, hourVal - 9, 0, 0);
    const birth = new Date(ts);

    // 3) 사주 사기둥
    const yp = yearPillar(ts, solar.y);
    const mp = monthPillar(ts, yp.gan);
    const isJasi = knownTime && sijin === 0;
    const dp = dayPillar(solar.y, solar.m, solar.d, isJasi);
    const hp = knownTime ? hourPillar(dp.gan, sijin) : null;

    const dayGan = dp.gan;

    const pillars = [
      { pos: '년', label: '년주', gan: yp.gan, ji: yp.ji },
      { pos: '월', label: '월주', gan: mp.gan, ji: mp.ji },
      { pos: '일', label: '일주', gan: dp.gan, ji: dp.ji, ganIsDay: true },
      { pos: '시', label: '시주', gan: hp ? hp.gan : null, ji: hp ? hp.ji : null }
    ];

    // 4) 십성 · 십이운성 부여
    pillars.forEach(p => {
      if (!p || p.gan == null) return;
      p.ganTenGod = (p.pos === '일') ? null : tenGod(dayGan, p.gan);
      p.jiTenGod = tenGod(dayGan, JIJANGGAN[p.ji][0][0]);
      p.jiTenGodList = JIJANGGAN[p.ji].map(([g, r]) => ({
        gan: g, ratio: r, tenGod: tenGod(dayGan, g)
      }));
    });
    pillars.forEach(p => {
      if (!p || p.ji == null) return;
      p.stage = stageOf(dayGan, p.ji);
      p.stageName = STAGE_NAMES[p.stage];
    });

    const ew = elementWeights(pillars, dayGan);
    const strength = strengthOf(pillars, dayGan, ew);
    const ys = yongsinOf(dayGan, ew, strength);
    const sals = salsOf(pillars, dayGan);
    const gongmangInfo = gongmangOf(pillars, dp.index);
    const gyeokguk = gyeokgukOf(pillars, dayGan, mp.ji);
    const dw = daewoonList(ts, solar.y, mp.gan, mp.ji, yp.gan, gender);

    // 5) 세운 — 해가 바뀌어도 그해 기준으로 계산한다
    const currentYear = new Date(Date.now() + 9 * 3600 * 1000).getUTCFullYear();
    const saeun = [saeunOf(currentYear, dayGan), saeunOf(currentYear + 1, dayGan)];
    saeun.forEach(s => {
      s.inter = interactions(
        pillars.filter(p => p.ji != null).map(p => p.ji),
        pillars.map(p => p.gan),
        s.gan, s.ji
      );
      s.tenGodName = TEN_GODS[s.tenGod];
    });

    return {
      ok: true,
      name: input.name || '',
      gender,
      calendar,
      solar,
      lunar: lunarInfo,
      timeKnown: knownTime,
      sijin: knownTime ? sijin : null,
      sijinName: knownTime ? SIJIN[ sijin ] : '모름',
      birth,
      ts,
      hourVal,
      pillars,
      dayGan,
      dayElem: GAN_ELEM[dayGan],
      yearPillar: yp,
      monthPillar: mp,
      monthTerm: monthTermInfo(solar.y, mp),
      dayPillar: dp,
      hourPillar: hp,
      ew,
      strength,
      yongsin: ys,
      sals,
      gongmang: gongmangInfo,
      gyeokguk,
      daewoon: dw,
      saeun,
      terms: termsOfYear(solar.y)
    };
  }

  global.Saju = {
    analyze,
    lunarToSolar,
    solarToLunar,
    toJDN,
    fromJDN,
    dayGanjiIndex,
    tenGod,
    termsOfYear,
    termLabel,
    GAN, GAN_KO, JI, JI_KO, JI_ANIMAL,
    GAN_ELEM, JI_ELEM,
    ELEM_HANJA, ELEM_KO, ELEM_COLOR, ELEM_TRAIT,
    ELEM_DIRECTION, ELEM_NUM, ELEM_COLORNAME, ELEM_ORGAN,
    JIJANGGAN, TEN_GODS, TEN_GODS_HANJA, TERM_INFO, SIJIN, SIJIN_RANGE,
    STAGE_NAMES, STAGE_HANJA, stageOf, GYEOKGUK, gyeokgukOf,
    mod
  };
})(window);
