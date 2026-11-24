/* ============================================================
   살풀이 : 천기 — 개명 · 아기 작명 엔진
   ------------------------------------------------------------
   ① 한글 자모 분해 (초성 · 중성 · 종성)
   ② 발음오행 (훈민정음 해례본 오행 배속)
   ③ 81수리 사격(원·형·이·정) 길흉
   ④ 사주 용신·희신·기신 대조 → 이름 궁합 점수
   ⑤ 사주에 맞는 이름 후보 5선 생성 (한자·음훈·획수)
   ============================================================ */
(function (global) {
  'use strict';
  const S = global.Saju;
  const EK = S.ELEM_KO;          // ['목','화','토','금','수']
  const EH = S.ELEM_HANJA;       // ['木','火','土','金','水']
  const el = e => `${EK[e]}(${EH[e]})`;

  /* ============================================================
     ① 한글 자모
     ============================================================ */
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  /* 발음오행 — 아음(ㄱㅋ)목 · 설음(ㄴㄷㄹㅌ)화 · 후음(ㅇㅎ)토 · 치음(ㅅㅈㅊ)금 · 순음(ㅁㅂㅍ)수 */
  const CHO_ELEM = [0, 0, 1, 1, 1, 1, 4, 4, 4, 3, 3, 2, 3, 3, 3, 0, 1, 4, 2];
  const CHO_STROKE = [1, 2, 1, 2, 4, 3, 3, 4, 8, 2, 4, 1, 3, 6, 4, 2, 3, 4, 3];

  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JUNG_STROKE = [2, 3, 3, 4, 2, 3, 3, 4, 2, 4, 5, 3, 3, 2, 4, 5, 3, 3, 1, 2, 1];

  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JONG_STROKE = [0, 1, 2, 3, 1, 2, 2, 2, 3, 4, 6, 5, 4, 5, 6, 5, 3, 4, 6, 2, 4, 1, 3, 4, 2, 3, 4, 3];

  /** 한글 한 글자 → { ch, cho, jung, jong, e, s } */
  function syllable(ch) {
    const code = ch.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return { ch, cho: null, jung: null, jong: null, e: null, s: 0, hangul: false };
    const ci = Math.floor(code / 588);
    const ji = Math.floor((code % 588) / 28);
    const ki = code % 28;
    return {
      ch, hangul: true,
      cho: CHO[ci], jung: JUNG[ji], jong: JONG[ki],
      e: CHO_ELEM[ci],
      s: CHO_STROKE[ci] + JUNG_STROKE[ji] + JONG_STROKE[ki]
    };
  }

  /* ============================================================
     ② 오행 관계
     ============================================================ */
  /* 상생: 목→화→토→금→수→목 / 상극: 목→토→수→화→금→목 */
  function relation(from, to) {
    if (from == null || to == null) return 'unknown';
    if (from === to) return 'bi';
    if ((from + 1) % 5 === to) return 'sang';      // 성이 이름을 생한다
    if ((to + 1) % 5 === from) return 'sangRev';   // 이름이 성을 생한다(역생·상생)
    if ((from + 2) % 5 === to) return 'geuk';      // 성이 이름을 극한다
    if ((to + 2) % 5 === from) return 'yeok';      // 이름이 성을 극한다
    return 'unknown';
  }
  const REL_KO = { sang: '상생', sangRev: '역생(상생)', bi: '비화', geuk: '상극', yeok: '역극', unknown: '미상' };
  const REL_SIGN = { sang: '→', sangRev: '↩', bi: '=', geuk: '⇥', yeok: '⇤', unknown: '·' };
  function REL_TXT(r) {
    const f = `${EK[r.from.e]}(${EH[r.from.e]})`, t = `${EK[r.to.e]}(${EH[r.to.e]})`;
    if (r.rel === 'geuk') return `‘${r.from.ch}’의 ${f}이 ‘${r.to.ch}’의 ${t}를 거스릅니다`;
    if (r.rel === 'yeok') return `‘${r.to.ch}’의 ${t}가 ‘${r.from.ch}’의 ${f}을 거스릅니다`;
    if (r.rel === 'sangRev') return `‘${r.to.ch}’의 ${t}가 ‘${r.from.ch}’의 ${f}을 생하는 역생입니다`;
    if (r.rel === 'sang') return `‘${r.from.ch}’의 ${f}이 ‘${r.to.ch}’의 ${t}를 생합니다`;
    return `‘${r.from.ch}’의 ${f}과 ‘${r.to.ch}’의 ${t}가 같은 기운(비화)입니다`;
  }

  /* 조사 — 마지막 글자의 받침 유무로 이/가 · 을/를 · 과/와 */
  function josaEnd(word, withJong, withoutJong) {
    const s = String(word || '');
    const c = s.charCodeAt(s.length - 1) - 0xAC00;
    const has = c >= 0 && c <= 11171 && c % 28 !== 0;
    return has ? withJong : withoutJong;
  }
  const elSubj = e => `${EK[e]}(${EH[e]})${josaEnd(EK[e], '이', '가')}`;
  const elObj = e => `${EK[e]}(${EH[e]})${josaEnd(EK[e], '을', '를')}`;
  const elConj = e => `${EK[e]}(${EH[e]})${josaEnd(EK[e], '과', '와')}`;

  /* ============================================================
     ③ 81수리
     ============================================================ */
  const SURI = {
    1: ['태초격', 3], 2: ['분리격', 0], 3: ['명예격', 3], 4: ['부정격', 0], 5: ['성공격', 3],
    6: ['계승격', 2], 7: ['독립격', 2], 8: ['개물격', 2], 9: ['궁박격', 0], 10: ['공허격', 0],
    11: ['신성격', 3], 12: ['박약격', 0], 13: ['지모격', 3], 14: ['이산격', 0], 15: ['통솔격', 3],
    16: ['덕망격', 3], 17: ['건창격', 2], 18: ['발전격', 2], 19: ['고난격', 0], 20: ['허망격', 0],
    21: ['두령격', 3], 22: ['중절격', 0], 23: ['융창격', 3], 24: ['축재격', 3], 25: ['건실격', 2],
    26: ['영웅시비격', 0], 27: ['대인격', 1], 28: ['파란격', 0], 29: ['성공격', 2], 30: ['부몽격', 0],
    31: ['융창격', 3], 32: ['순풍격', 3], 33: ['승천격', 3], 34: ['파멸격', 0], 35: ['평범격', 2],
    36: ['의협격', 0], 37: ['인덕격', 3], 38: ['복덕격', 1], 39: ['안락격', 3], 40: ['무상격', 0],
    41: ['대공격', 3], 42: ['고행격', 0], 43: ['산재격', 0], 44: ['마장격', 0], 45: ['대지격', 3],
    46: ['불행격', 0], 47: ['출세격', 3], 48: ['유덕격', 3], 49: ['변화격', 0], 50: ['불행격', 0],
    51: ['길흉격', 1], 52: ['약진격', 3], 53: ['내허격', 0], 54: ['무공격', 0], 55: ['미달격', 0],
    56: ['한탄격', 0], 57: ['노력격', 2], 58: ['후영격', 2], 59: ['재화격', 0], 60: ['동요격', 0],
    61: ['영화격', 2], 62: ['고독격', 0], 63: ['길상격', 3], 64: ['침체격', 0], 65: ['휘양격', 3],
    66: ['망세격', 0], 67: ['천복격', 3], 68: ['명지격', 3], 69: ['정지격', 0], 70: ['침몰격', 0],
    71: ['만달격', 1], 72: ['상반격', 0], 73: ['평길격', 2], 74: ['우매격', 0], 75: ['정수격', 1],
    76: ['이산격', 0], 77: ['전후격', 1], 78: ['선곤격', 1], 79: ['종극격', 0], 80: ['은둔격', 0],
    81: ['환원격', 3]
  };
  const GRADE_KO = { 3: '대길', 2: '길', 1: '반길반흉', 0: '흉' };
  function suri(n) {
    if (!n || n < 1) n = 1;
    const i = ((n - 1) % 81) + 1;
    const [name, grade] = SURI[i];
    return { n: i, raw: n, name, grade, gradeKo: GRADE_KO[grade] };
  }

  /** 사격(원·형·이·정) — 성 획수 배열 + 이름 획수 배열 */
  function saGyeok(surStrokes, givenStrokes) {
    const surSum = surStrokes.reduce((a, b) => a + b, 0);
    const givSum = givenStrokes.reduce((a, b) => a + b, 0);
    const total = surSum + givSum;
    const single = surStrokes.length === 1;
    const oneGiven = givenStrokes.length === 1;
    const won = surSum + (single ? 1 : 0);                       // 원격(조상·초년)
    const hyeong = surSum + (givenStrokes[0] || 0);              // 형격(청년·부모)
    const i = (givenStrokes[0] || 0) + (givenStrokes[1] || (oneGiven ? 1 : 0)); // 이격(중년·배우자)
    const jeong = total;                                         // 정격(말년·총운)
    const oe = total - hyeong + (oneGiven ? 1 : 0);              // 외격
    return [
      { key: 'won', label: '원격', hanja: '元格', sub: '조상 · 초년', ...suri(won) },
      { key: 'hyeong', label: '형격', hanja: '亨格', sub: '청년 · 부모', ...suri(hyeong) },
      { key: 'i', label: '이격', hanja: '利格', sub: '중년 · 배우자', ...suri(i) },
      { key: 'jeong', label: '정격', hanja: '貞格', sub: '말년 · 총운', ...suri(jeong) },
      { key: 'oe', label: '외격', hanja: '外格', sub: '대인 · 사회', ...suri(oe) }
    ];
  }

  /* ============================================================
     성씨 한자 · 획수
     ============================================================ */
  const SURNAMES = {
    '김': ['金', 8], '이': ['李', 7], '박': ['朴', 6], '최': ['崔', 11], '정': ['鄭', 19],
    '강': ['姜', 9], '조': ['趙', 14], '윤': ['尹', 4], '장': ['張', 11], '임': ['林', 8],
    '한': ['韓', 17], '오': ['吳', 7], '서': ['徐', 10], '신': ['申', 5], '권': ['權', 22],
    '황': ['黃', 12], '안': ['安', 6], '송': ['宋', 7], '류': ['柳', 9], '유': ['劉', 15],
    '전': ['全', 6], '홍': ['洪', 9], '고': ['高', 10], '문': ['文', 4], '양': ['梁', 11],
    '손': ['孫', 10], '배': ['裵', 14], '백': ['白', 5], '허': ['許', 11], '남': ['南', 9],
    '심': ['沈', 8], '노': ['盧', 16], '하': ['河', 8], '곽': ['郭', 15], '성': ['成', 6],
    '차': ['車', 7], '주': ['朱', 6], '우': ['禹', 9], '구': ['具', 8], '민': ['閔', 12],
    '진': ['陳', 16], '지': ['池', 7], '엄': ['嚴', 20], '원': ['元', 4], '천': ['千', 3],
    '방': ['方', 4], '공': ['孔', 4], '현': ['玄', 5], '함': ['咸', 9], '변': ['卞', 4],
    '염': ['廉', 13], '여': ['呂', 7], '추': ['秋', 9], '도': ['都', 16], '소': ['蘇', 22],
    '석': ['石', 5], '선': ['宣', 9], '설': ['薛', 19], '마': ['馬', 10], '길': ['吉', 6],
    '연': ['延', 7], '위': ['魏', 18], '표': ['表', 8], '명': ['明', 8], '기': ['奇', 8],
    '반': ['潘', 16], '왕': ['王', 4], '금': ['琴', 13], '옥': ['玉', 5], '육': ['陸', 16],
    '인': ['印', 6], '맹': ['孟', 8], '제': ['諸', 16], '모': ['牟', 6], '탁': ['卓', 8],
    '국': ['國', 11], '어': ['魚', 11], '은': ['殷', 10], '편': ['片', 4], '용': ['龍', 16],
    '예': ['芮', 8], '봉': ['奉', 8], '사': ['史', 5], '부': ['夫', 4], '가': ['賈', 13],
    '복': ['卜', 2], '태': ['太', 4], '목': ['睦', 13], '형': ['邢', 11], '피': ['皮', 5],
    '두': ['杜', 7], '감': ['甘', 5], '음': ['陰', 11], '빈': ['賓', 14], '동': ['董', 15],
    '온': ['溫', 13], '호': ['扈', 11], '경': ['慶', 15], '남궁': ['南宮', 18], '황보': ['皇甫', 21],
    '제갈': ['諸葛', 30], '선우': ['鮮于', 22], '독고': ['獨孤', 25], '동방': ['東方', 12]
  };
  const TWO_CHAR_SURNAMES = ['남궁', '황보', '제갈', '선우', '독고', '동방'];

  function parseSurname(str) {
    const s = (str || '').trim();
    if (!s) return null;
    const two = TWO_CHAR_SURNAMES.find(x => s.startsWith(x));
    const key = two || s.slice(0, 1);
    const info = SURNAMES[key];
    const chars = [...key];
    const syl = chars.map(syllable);
    if (info) {
      const per = chars.length === 1 ? [info[1]] : [Math.round(info[1] * 0.55), Math.round(info[1] * 0.45)];
      return { key, hanja: info[0], strokes: per, sum: info[1], known: true, syl, given: s.slice(key.length) };
    }
    const sum = syl.reduce((a, b) => a + b.s, 0);
    return { key, hanja: null, strokes: syl.map(x => x.s), sum, known: false, syl, given: s.slice(key.length) };
  }

  /* ============================================================
     ④ 이름 한자 사전 (음 · 훈 · 필획)
     ============================================================ */
  const HANJA = {
    '서': [['瑞', '상서로울', 13], ['序', '차례', 7], ['書', '글', 10]],
    '연': [['娟', '예쁠', 10], ['姸', '고울', 9], ['延', '늘일', 7]],
    '윤': [['潤', '윤택할', 16], ['允', '진실로', 4], ['胤', '이을', 9]],
    '지': [['智', '지혜', 12], ['志', '뜻', 7], ['芝', '지초', 8]],
    '우': [['宇', '집', 6], ['佑', '도울', 7], ['雨', '비', 8]],
    '하': [['夏', '여름', 10], ['河', '물', 8], ['荷', '연꽃', 11]],
    '아': [['雅', '우아할', 12], ['娥', '예쁠', 10]],
    '린': [['麟', '기린', 23], ['璘', '옥빛', 16]],
    '수': [['秀', '빼어날', 7], ['洙', '물가', 9], ['守', '지킬', 6]],
    '유': [['柔', '부드러울', 9], ['裕', '넉넉할', 13], ['由', '말미암을', 5]],
    '채': [['彩', '채색', 11], ['采', '캘', 8], ['菜', '나물', 11]],
    '원': [['媛', '아름다운 여자', 12], ['源', '근원', 14], ['元', '으뜸', 4]],
    '예': [['睿', '슬기로울', 14], ['藝', '재주', 21], ['芮', '풀', 8]],
    '소': [['昭', '밝을', 9], ['素', '본디', 10], ['韶', '풍류', 14]],
    '율': [['律', '법칙', 9], ['栗', '밤', 10]],
    '시': [['詩', '시', 13], ['時', '때', 10], ['施', '베풀', 9]],
    '은': [['恩', '은혜', 10], ['銀', '은', 14], ['殷', '성할', 10]],
    '나': [['娜', '아리따울', 10], ['那', '어찌', 7]],
    '다': [['多', '많을', 6], ['茶', '차', 12]],
    '인': [['仁', '어질', 4], ['寅', '범', 11]],
    '가': [['佳', '아름다울', 8], ['嘉', '아름다울', 14]],
    '빈': [['彬', '빛날', 11], ['斌', '빛날', 11]],
    '민': [['旻', '하늘', 8], ['敏', '민첩할', 11], ['民', '백성', 5]],
    '진': [['眞', '참', 10], ['珍', '보배', 10], ['振', '떨칠', 11]],
    '현': [['賢', '어질', 15], ['炫', '빛날', 9], ['玄', '검을', 5]],
    '미': [['美', '아름다울', 9], ['媚', '아름다울', 12]],
    '혜': [['惠', '은혜', 12], ['慧', '슬기로울', 15]],
    '세': [['世', '인간 세상', 5], ['洗', '씻을', 9]],
    '도': [['道', '길', 13], ['度', '법도', 9]],
    '준': [['俊', '준걸', 9], ['準', '법도', 13], ['峻', '높을', 10]],
    '호': [['浩', '넓을', 10], ['昊', '하늘', 8]],
    '건': [['健', '굳셀', 11], ['建', '세울', 9]],
    '선': [['善', '착할', 12], ['宣', '베풀', 9], ['仙', '신선', 5]],
    '훈': [['勳', '공', 16], ['訓', '가르칠', 10]],
    '환': [['煥', '빛날', 13], ['桓', '굳셀', 10]],
    '승': [['承', '이을', 8], ['勝', '이길', 12], ['昇', '오를', 8]],
    '재': [['在', '있을', 6], ['宰', '재상', 10], ['材', '재목', 7]],
    '태': [['泰', '클', 10], ['太', '클', 4]],
    '성': [['成', '이룰', 6], ['星', '별', 9], ['聖', '성인', 13]],
    '동': [['東', '동녘', 8], ['桐', '오동나무', 10]],
    '규': [['圭', '홀', 6], ['奎', '별', 9]],
    '정': [['正', '바를', 5], ['貞', '곧을', 9], ['晶', '맑을', 12]],
    '영': [['永', '길', 5], ['英', '꽃부리', 9], ['榮', '영화', 14]],
    '상': [['相', '서로', 9], ['尙', '오히려', 8], ['祥', '복', 11]],
    '경': [['慶', '경사', 15], ['景', '볕', 12], ['京', '서울', 8]],
    '찬': [['燦', '빛날', 17], ['璨', '옥빛', 18]],
    '혁': [['赫', '빛날', 14], ['革', '고칠', 9]],
    '석': [['錫', '주석', 16], ['石', '돌', 5], ['碩', '클', 14]],
    '명': [['明', '밝을', 8], ['銘', '새길', 14]],
    '보': [['寶', '보배', 20], ['甫', '클', 7]],
    '병': [['炳', '밝을', 9], ['秉', '잡을', 8]],
    '주': [['珠', '구슬', 10], ['周', '두루', 8]]
  };

  /* ============================================================
     ⑤ 이름 풀 (시대감각 반영 · 한자 조합 가능 음절만)
     ============================================================ */
  const NAMES_F = [
    '서연', '서윤', '지우', '하윤', '지아', '하린', '수아', '지유', '채원', '예린',
    '소율', '예원', '시은', '유나', '다인', '나윤', '가은', '아린', '윤서', '은서',
    '다은', '연우', '수빈', '하은', '지민', '서아', '유진', '예진', '하율', '시아',
    '윤아', '다현', '채린', '미소', '소연', '지은', '혜원', '민서', '지윤', '예은',
    '세아', '수민', '유빈', '소민', '다연', '하진', '은채', '서진',
    '보미', '보영', '미나', '미주', '명선', '미영'
  ];
  const NAMES_M = [
    '도윤', '하준', '서준', '지호', '준우', '민준', '예준', '건우', '우진', '선우',
    '지훈', '현우', '도현', '지환', '승우', '준서', '유준', '시우', '은우', '재윤',
    '태윤', '성민', '재현', '동현', '민재', '규민', '태민', '승현', '정우', '영재',
    '상우', '경민', '찬영', '재원', '도훈', '건호', '준혁', '성훈', '태호', '승민',
    '지성', '우성', '현준', '정훈', '민호', '태준', '상현', '영호',
    '범준', '범석', '명현', '명준', '보현', '병준'
  ];

  /* ============================================================
     ⑥ 사주 결핍 · 용신 판단
     ============================================================ */
  function needsOf(a) {
    const pct = a.ew.pct.slice();
    let top = 0, low = 0;
    for (let i = 1; i < 5; i++) {
      if (pct[i] > pct[top]) top = i;
      if (pct[i] < pct[low]) low = i;
    }
    return {
      pct, top, low,
      yong: a.yongsin.yong, hee: a.yongsin.hee, gi: a.yongsin.gi,
      strong: a.strength.level, strengthLabel: a.strength.label,
      ratio: a.strength.ratio,
      topPct: pct[top], lowPct: pct[low], yongPct: pct[a.yongsin.yong], giPct: pct[a.yongsin.gi]
    };
  }

  /** 이름 한 글자가 그 사주에 얼마나 약이 되는지 (-1 ~ 1) */
  function fit(e, need) {
    if (e == null) return -0.3;
    let f = -0.12;
    if (e === need.yong) f = 1;
    else if (e === need.hee) f = 0.8;
    else if (e === need.gi) f = -0.85;
    else if (e === need.low) f = 0.55;
    else if (e === need.top) f = -0.42;
    return f;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pctTxt = v => {
    const p = v * 100;
    return p < 1 ? '1% 미만' : Math.round(p) + '%';
  };

  /* ============================================================
     ⑦ 점수 — 발음오행 30 · 사주 보완 45 · 수리 25
     ============================================================ */
  function scoreOf(elems, relations, gyeok) {
    /* 발음오행 */
    const val = { sang: 1, sangRev: 0.78, bi: 0.45, geuk: -1, yeok: -1, unknown: 0 };
    const pAvg = relations.length
      ? relations.reduce((s, r) => s + (val[r.rel] != null ? val[r.rel] : 0), 0) / relations.length
      : 0;
    const sound = 30 * clamp((pAvg + 1) / 2, 0, 1);

    /* 사주 보완 */
    const fAvg = elems.length ? elems.reduce((s, e) => s + e.fit, 0) / elems.length : 0;
    const saju = 45 * clamp((fAvg + 0.6) / 1.6, 0, 1);

    /* 수리 — 형·이·정 (원격은 조상운이라 참고) */
    const keys = ['hyeong', 'i', 'jeong'];
    const chosen = gyeok.filter(g => keys.indexOf(g.key) >= 0);
    const gSum = chosen.reduce((s, g) => s + g.grade, 0);
    const suriScore = 25 * (gSum / (chosen.length * 3 || 1));

    return {
      total: Math.round(clamp(sound + saju + suriScore, 0, 100)),
      sound: Math.round(sound), saju: Math.round(saju), suri: Math.round(suriScore),
      goodGyeok: chosen.filter(g => g.grade >= 2).length,
      badGyeok: chosen.filter(g => g.grade === 0).length
    };
  }

  function bandOf(score) {
    if (score >= 86) return { k: 'great', t: '이름이 사주를 받쳐 주는 이름' };
    if (score >= 74) return { k: 'good', t: '무난하게 사주를 돕는 이름' };
    if (score >= 60) return { k: 'mid', t: '한두 곳이 어긋난 이름' };
    if (score >= 46) return { k: 'low', t: '보완이 필요한 이름' };
    return { k: 'bad', t: '사주와 어긋나 복을 깎는 이름' };
  }

  /* ============================================================
     ⑧ 한자 조합 선택 — 사격이 가장 좋은 조합
     ============================================================ */
  function bestHanja(given, surStrokes) {
    const syls = [...given];
    if (syls.some(s => !HANJA[s])) return null;
    const lists = syls.map(s => HANJA[s]);
    let best = null;
    const walk = (idx, acc) => {
      if (idx === lists.length) {
        const strokes = acc.map(h => h[2]);
        const gyeok = saGyeok(surStrokes, strokes);
        const keys = ['hyeong', 'i', 'jeong'];
        const score = gyeok.filter(g => keys.indexOf(g.key) >= 0)
          .reduce((s, g) => s + g.grade, 0) - (gyeok.find(g => g.key === 'oe').grade === 0 ? 1.2 : 0);
        if (!best || score > best.score) best = { chars: acc.slice(), strokes, gyeok, score };
        return;
      }
      lists[idx].forEach(h => { acc.push(h); walk(idx + 1, acc); acc.pop(); });
    };
    walk(0, []);
    return best;
  }

  /* ============================================================
     ⑨ 현재 이름 진단
     ============================================================ */
  function analyzeName(a, surStr, givenStr) {
    const sur = parseSurname(surStr);
    const givenChars = [...(givenStr || '').trim()];
    const need = needsOf(a);
    if (!sur || !givenChars.length) return null;

    const gSyl = givenChars.map(syllable);
    const all = [...sur.syl, ...gSyl];
    const elems = all.map((s, i) => ({
      ch: s.ch, e: s.e, s: s.s, role: i < sur.syl.length ? '성' : '이름'
    }));
    const relations = [];
    for (let i = 0; i < all.length - 1; i++) {
      relations.push({
        from: all[i], to: all[i + 1],
        rel: relation(all[i].e, all[i + 1].e)
      });
    }
    const gyeok = saGyeok(sur.strokes, gSyl.map(s => s.s));

    /* 이름 쪽만 사주 보완 계산 (성씨는 타고나는 몫) */
    const nameElems = elems.filter(x => x.role === '이름')
      .map(x => ({ ...x, fit: fit(x.e, need) }));
    const nameRelations = [];
    for (let i = sur.syl.length - 1; i < all.length - 1; i++) {
      const rel = relations[i];
      if (rel) nameRelations.push(rel);
    }
    const score = scoreOf(nameElems, nameRelations, gyeok);

    return {
      full: sur.key + givenChars.join(''),
      surname: sur, given: givenChars.join(''), givenChars,
      elems, nameElems, relations, nameRelations, gyeok, need,
      score, band: bandOf(score.total)
    };
  }

  /* ============================================================
     ⑩ 후보 5선
     ============================================================ */
  function evaluateName(a, sur, given, gender, need) {
    const syls = [...given].map(syllable);
    if (syls.some(s => s.e == null)) return null;
    const hanja = bestHanja(given, sur.strokes);
    if (!hanja) return null;

    const all = [...sur.syl, ...syls];
    const relations = [];
    for (let i = 0; i < all.length - 1; i++) {
      relations.push({ from: all[i], to: all[i + 1], rel: relation(all[i].e, all[i + 1].e) });
    }
    const nameRelations = relations.slice(sur.syl.length - 1);
    const nameElems = syls.map((s, i) => ({
      ch: s.ch, e: s.e, s: s.s, hanja: hanja.chars[i],
      fit: fit(s.e, need)
    }));
    const score = scoreOf(nameElems, nameRelations, hanja.gyeok);

    return {
      given, full: sur.key + given, syls, nameElems, relations, nameRelations,
      hanja, gyeok: hanja.gyeok, score, band: bandOf(score.total),
      gender, sur
    };
  }

  function pickCandidates(a, sur, gender, opts) {
    const need = needsOf(a);
    const pool = gender === '남' ? NAMES_M : NAMES_F;
    const exclude = (opts && opts.exclude) || '';
    const scored = [];
    pool.forEach(nm => {
      if (nm === exclude) return;
      const c = evaluateName(a, sur, nm, gender, need);
      if (c) scored.push(c);
    });
    scored.sort((x, y) => y.score.total - x.score.total);

    /* 발음오행 흐름이 같거나 같은 글자를 세 번 쓰는 후보는 건너뛴다 — 다섯 가지 결로 */
    const picked = [], sigs = {}, sylUse = {};
    const sig = c => c.nameElems.map(e => e.e).join('-');
    const goodEnough = c => c.score.total >= 42;
    const usable = nm => [...nm].every(ch => (sylUse[ch] || 0) < 2);
    const take = c => {
      picked.push(c);
      sigs[sig(c)] = 1;
      [...c.given].forEach(ch => { sylUse[ch] = (sylUse[ch] || 0) + 1; });
    };
    const hasClash = c => c.relations.some(r => r.rel === 'geuk' || r.rel === 'yeok');
    /* ① 발음오행이 부딪히지 않고 흐름과 글자가 겹치지 않는 이름 → ② 충돌 없는 이름 → ③ 나머지 */
    for (const c of scored) {
      if (picked.length >= 5) break;
      if (!goodEnough(c) || hasClash(c) || !usable(c.given)) continue;
      if (sigs[sig(c)]) continue;
      take(c);
    }
    for (const c of scored) {
      if (picked.length >= 5) break;
      if (picked.indexOf(c) >= 0 || hasClash(c) || !goodEnough(c) || !usable(c.given)) continue;
      take(c);
    }
    for (const c of scored) {
      if (picked.length >= 5) break;
      if (picked.indexOf(c) >= 0 || !goodEnough(c)) continue;
      take(c);
    }
    if (picked.length < 5) {
      for (const c of scored) {
        if (picked.length >= 5) break;
        if (picked.indexOf(c) < 0) picked.push(c);
      }
    }
    /* 순위는 점수 순으로 — 흐름·글자 중복만 피하고, 최종 배열은 점수 내림차순 */
    return picked.sort((x, y) => y.score.total - x.score.total);
  }

  /* ============================================================
     ⑪ 서술 — 왜 이 이름이 약이 되는가
     ============================================================ */
  const NEED_PHRASE = {
    yong: '사주가 가장 목말라하는',
    hee: '용신을 받쳐 주는',
    low: '가장 비어 있는',
    top: '이미 넘치는',
    gi: '기신인'
  };

  function flowDesc(c) {
    const seq = c.relations.map(r => {
      const a = r.from.e == null ? '미상' : EK[r.from.e];
      const b = r.to.e == null ? '미상' : EK[r.to.e];
      return `${a}${REL_SIGN[r.rel]}${b}`;
    });
    const geuk = c.relations.filter(r => r.rel === 'geuk' || r.rel === 'yeok');
    const sang = c.relations.filter(r => r.rel === 'sang');
    let verdict;
    if (geuk.length) verdict = '한 곳에서 기운이 부딪힙니다';
    else if (sang.length === c.relations.length) verdict = '세 글자가 한 방향으로 흐릅니다';
    else verdict = '기운이 끊기지 않고 이어집니다';
    return { seq, geuk, sang, verdict };
  }

  function hanjaDesc(c) {
    return c.nameElems.map(e => `${e.hanja[0]}(${e.hanja[1]} ${e.ch} · ${e.hanja[2]}획)`).join(' · ');
  }

  function headOf(c, need) {
    const hasYong = c.nameElems.some(e => e.e === need.yong);
    const hasHee = c.nameElems.some(e => e.e === need.hee);
    const hasLow = c.nameElems.some(e => e.e === need.low);
    if (hasYong && c.score.total >= 80) return '사주의 빈 칸을 정면으로 채우는 이름';
    if (hasYong) return '막힌 기운을 뚫는 이름';
    if (hasHee) return '용신의 기운을 이어 주는 이름';
    if (hasLow) return '마른 오행을 채워 균형을 돌리는 이름';
    return '흐름을 거스르지 않는 무난한 이름';
  }

  function whyOf(c, a, need) {
    const out = [];
    const nameE = c.nameElems.map(e => e.e);
    const hasYong = nameE.indexOf(need.yong) >= 0;
    const hasHee = nameE.indexOf(need.hee) >= 0;
    const hasLow = nameE.indexOf(need.low) >= 0;
    const hasGi = nameE.indexOf(need.gi) >= 0;
    const hasTop = nameE.indexOf(need.top) >= 0;

    /* 발음오행 */
    const fd = flowDesc(c);
    const first = c.relations[0];
    if (first) {
      const fEl = first.from.e == null ? '미상' : el(first.from.e);
      const toE = c.syls[0].e;
      const toRo = `${el(toE)}${toE == null ? '로' : josaEnd(EK[toE], '으로', '로')}`;
      const lastE = c.relations[c.relations.length - 1].to.e;
      const seqRo = fd.seq.join(' · ') + (lastE == null ? '로' : josaEnd(EK[lastE], '으로', '로'));
      out.push(`성 ‘${c.sur.key}’의 ${fEl}에서 이름 ‘${c.syls[0].ch}’의 ${toRo} ${REL_KO[first.rel]} — 세 글자의 발음오행은 ${seqRo} 이어져 ${fd.verdict}.`);
    }

    /* 사주 */
    const bits = [];
    if (hasYong) bits.push(`이 사주가 가장 목말라하는 ${el(need.yong)} — ${pctTxt(need.yongPct)}뿐인 기운을 이름이 정면으로 세웁니다`);
    if (hasHee) bits.push(`희신 ${elSubj(need.hee)} 받쳐 주어 ${el(need.yong)}의 기운이 끊기지 않고 돌아갑니다`);
    if (hasLow && need.low !== need.yong && need.low !== need.hee) bits.push(`${elSubj(need.low)} ${pctTxt(need.lowPct)}로 거의 비어 있었는데 그 자리를 채웁니다`);
    if (!hasGi) bits.push(`기신인 ${elObj(need.gi)} 이름에서 비켜 세웁니다`);
    if (hasTop) bits.push(`${elSubj(need.top)} ${pctTxt(need.topPct)}로 두꺼운데 이름에도 한 자 들어가 조금 과합니다`);
    if (!bits.length) bits.push(`넘치는 ${elObj(need.top)} 더 밀지 않고, 빈 ${el(need.low)} 쪽으로 기운을 돌립니다`);
    out.push(bits.join('. ') + '.');

    /* 수리 */
    const g = c.gyeok.filter(x => ['hyeong', 'i', 'jeong'].indexOf(x.key) >= 0);
    const goodTxt = g.filter(x => x.grade >= 2).map(x => `${x.label} ${x.n}수 ${x.name}·${x.gradeKo}`);
    const badTxt = g.filter(x => x.grade === 0).map(x => `${x.label} ${x.n}수 ${x.name}`);
    const gLine = goodTxt.length
      ? `한자 획수로 본 사격은 ${goodTxt.join(', ')} — ${badTxt.length ? `${badTxt.join(', ')}은 흉수라 아쉽습니다` : '형·이·정 세 격이 모두 길합니다'}`
      : `한자 획수로 본 사격에서 ${badTxt.join(', ') || '길수가 드물고'} 흉수를 피하지 못했습니다`;
    out.push(gLine + '.');

    /* 글자 뜻 */
    out.push(`${hanjaDesc(c)} — ${c.nameElems.map(e => `${e.hanja[0]}${josaEnd(e.ch, '은', '는')} ‘${e.hanja[1]}’`).join(', ')}의 뜻을 가진 글자입니다.`);
    return out;
  }

  function candidateView(c, a, need, idx) {
    return {
      rank: idx + 1,
      given: c.given, full: c.full,
      hanja: c.nameElems.map(e => ({ h: e.hanja[0], m: e.hanja[1], s: e.hanja[2], ch: e.ch })),
      hanjaText: c.nameElems.map(e => e.hanja[0]).join(''),
      hanjaFull: hanjaDesc(c),
      elems: c.nameElems.map(e => ({ ch: e.ch, e: e.e, el: el(e.e), pct: a.ew.pct[e.e], role: '이름' })),
      surnameElem: c.sur.syl.map(s => ({ ch: s.ch, e: s.e, el: el(s.e) })),
      relations: c.relations.map(r => ({
        from: r.from.ch, to: r.to.ch, rel: r.rel, relKo: REL_KO[r.rel]
      })),
      gyeok: c.gyeok.map(g => ({ label: g.label, hanja: g.hanja, sub: g.sub, n: g.n, name: g.name, grade: g.grade, gradeKo: g.gradeKo })),
      score: c.score,
      band: c.band,
      head: headOf(c, need),
      why: whyOf(c, a, need),
      flow: flowDesc(c)
    };
  }

  /* ============================================================
     ⑫ 진단서 문장
     ============================================================ */
  function currentNarrative(cur, a) {
    const need = cur.need;
    const gan = S.GAN_KO[a.dayGan];
    const paras = [];

    paras.push(`사주는 일간 ${gan}(${EH[a.dayElem]})을 축으로 서 있습니다. 여덟 글자에서 ${elSubj(need.top)} ${pctTxt(need.topPct)}로 가장 두껍고, ${elSubj(need.low)} ${pctTxt(need.lowPct)}로 거의 마릅니다. 용신은 ${el(need.yong)}, 희신은 ${el(need.hee)}, 기신은 ${el(need.gi)}입니다 — 이름으로 채워야 할 칸은 ${elConj(need.yong)} ${el(need.hee)}입니다.`);

    const nameDesc = cur.elems.map((x) => {
      const e = x.e == null ? '한글 아님' : `초성 ${allCho(x.ch)} → ${el(x.e)}`;
      return `${x.role} ‘${x.ch}’의 ${e}`;
    });
    paras.push(`지금 이름 ‘${cur.full}’을 발음오행으로 풀면 이렇습니다. ${nameDesc.join(', ')}.`);

    /* 어긋난 지점 */
    const issues = [];
    const giCount = cur.nameElems.filter(x => x.e === need.gi).length;
    if (giCount) {
      issues.push(`기신인 ${elSubj(need.gi)} 이름에 ${giCount}자 들어 있습니다. 사주에서 이미 눌러야 할 기운을 이름이 한 번 더 얹은 구조라, 결정의 순간마다 같은 자리에서 미끄러지는 일이 반복됩니다.`);
    }
    if (!cur.nameElems.some(x => x.e === need.yong)) {
      issues.push(`용신 ${elSubj(need.yong)} 이름에는 한 번도 나오지 않습니다. 사주가 가장 필요로 하는 기운을 이름이 받쳐 주지 못하고 있는 셈입니다.`);
    }
    const topCount = cur.nameElems.filter(x => x.e === need.top).length;
    if (topCount && need.topPct > 0.28 && need.top !== need.gi) {
      issues.push(`${elSubj(need.top)} 사주에 ${pctTxt(need.topPct)}로 이미 넘치는데 이름에도 ${topCount}자가 겹칩니다. 넘치는 기운을 더 미는 이름은 재물이 새고 사람이 지치는 자리를 만듭니다.`);
    }
    if (need.lowPct < 0.12 && !cur.nameElems.some(x => x.e === need.low)) {
      issues.push(`${elSubj(need.low)} ${pctTxt(need.lowPct)}로 비어 있는데 이름이 그 칸을 메우지 못합니다.`);
    }
    cur.relations.forEach(r => {
      if (r.rel === 'geuk' || r.rel === 'yeok') {
        issues.push(`발음오행에서 ${REL_TXT(r)}. 이름 안에서 기운이 꺾이면 성과 이름 사이에 늘 한 박자 어긋난 감각이 남습니다.`);
      }
    });
    const badG = cur.gyeok.filter(g => ['won', 'hyeong', 'i', 'jeong'].indexOf(g.key) >= 0 && g.grade === 0);
    if (badG.length) {
      const list = badG.map(g => `${g.label} ${g.n}수 ${g.name}`).join(', ');
      issues.push(`한글 획수로 본 ${list}${'이'} 흉수입니다. ${badG[0].sub}처럼 그 수리가 놓인 구간에서는 같은 노력에도 남는 것이 적고, 사람과 돈이 끊기는 일이 겹칩니다.`);
    }

    const goods = [];
    if (cur.nameElems.some(x => x.e === need.hee)) goods.push(`희신 ${elSubj(need.hee)} 이름에 있어 사주를 부드럽게 받쳐 줍니다.`);
    if (cur.relations.every(r => r.rel === 'sang' || r.rel === 'sangRev' || r.rel === 'bi')) goods.push('성과 이름의 발음오행이 상생·비화로 이어져 소리가 거스르지 않습니다.');
    const goodG = cur.gyeok.filter(g => ['won', 'hyeong', 'i', 'jeong'].indexOf(g.key) >= 0 && g.grade >= 2);
    if (goodG.length) goods.push(`${goodG.map(g => `${g.label} ${g.n}수 ${g.name}`).join(', ')}의 길수가 받쳐 줍니다.`);

    return { paras, issues, goods };
  }

  function allCho(ch) {
    const s = syllable(ch);
    return s.cho || '—';
  }

  /* ============================================================
     ⑬ build — 화면이 쓰는 한 덩어리 모델
     ============================================================ */
  function build(a, opts) {
    opts = opts || {};
    const mode = opts.mode === 'baby' ? 'baby' : 'reform';
    const surnameStr = (opts.surname || '').trim();
    const givenStr = (opts.given || '').trim();
    const sur = parseSurname(surnameStr);
    if (!a || !a.ok) return { error: '명식을 먼저 계산해 주세요.' };
    if (!sur) return { error: '성씨를 입력해 주세요. (예: 김 · 이 · 박 · 최)' };

    const need = needsOf(a);
    const gender = opts.gender || a.gender;
    const model = {
      ok: true, mode, surname: sur.key, surKnown: sur.known, surnameHanja: sur.hanja,
      surnameStrokes: sur.strokes, need, a, gender,
      current: null, candidates: [], hasName: false
    };

    if (mode === 'reform' && givenStr) {
      const cur = analyzeName(a, surnameStr, givenStr);
      if (cur) {
        const nar = currentNarrative(cur, a);
        model.hasName = true;
        model.current = {
          full: cur.full, given: cur.given,
          elems: cur.elems.map(x => ({ ch: x.ch, role: x.role, e: x.e, el: x.e == null ? '—' : el(x.e), strokes: x.s, pct: x.e == null ? 0 : a.ew.pct[x.e] })),
          relations: cur.relations.map(r => ({ from: r.from.ch, to: r.to.ch, rel: r.rel, relKo: REL_KO[r.rel], fromEl: r.from.e == null ? '—' : el(r.from.e), toEl: r.to.e == null ? '—' : el(r.to.e) })),
          gyeok: cur.gyeok.map(g => ({ label: g.label, hanja: g.hanja, sub: g.sub, n: g.n, name: g.name, grade: g.grade, gradeKo: g.gradeKo })),
          score: cur.score, band: cur.band,
          paras: nar.paras, issues: nar.issues, goods: nar.goods,
          strokesNote: '한글 획수 기준'
        };
      }
    }

    model.candidates = pickCandidates(a, sur, gender, { exclude: mode === 'reform' ? givenStr : '' })
      .map((c, i) => candidateView(c, a, need, i));

    /* 후보 1순위와 현재 이름의 격차 */
    if (model.current && model.candidates.length) {
      model.gain = model.candidates[0].score.total - model.current.score.total;
    }

    /* 사주 → 이름 비교용 5행 */
    model.rows = [0, 1, 2, 3, 4].map(e => ({
      e, el: el(e), pct: a.ew.pct[e],
      nameCount: model.current ? model.current.elems.filter(x => x.role === '이름' && x.e === e).length : 0,
      nameLen: model.current ? model.current.elems.filter(x => x.role === '이름').length : 0,
      mark: e === need.yong ? '용신' : e === need.hee ? '희신' : e === need.gi ? '기신' : e === need.top ? '과다' : e === need.low ? '부족' : ''
    }));

    model.hook = '13년간 명리를 보며 가장 안타까웠던 건, 좋은 사주를 타고나고도 이름의 오행이 사주와 어긋나 복(福)을 깎아먹는 경우입니다. 사주의 빈 칸을 채우는 이름 하나가 평생의 운을 받칩니다.';

    model.needLine = need.hee !== need.yong
      ? `이 사주에 이름으로 채워야 할 글자는 ${elConj(need.yong)} ${el(need.hee)}, 피해야 할 글자는 ${el(need.gi)}입니다.`
      : `이 사주에 이름으로 채워야 할 글자는 ${el(need.yong)}, 피해야 할 글자는 ${el(need.gi)}입니다.`;
    return model;
  }

  global.Naming = {
    HANJA, NAMES_F, NAMES_M, SURI, SURNAMES,
    syllable, relation, suri, saGyeok, parseSurname, needsOf, fit,
    analyzeName, pickCandidates, evaluateName, build, bandOf,
    REL_KO, GRADE_KO, el, elSubj, elObj, elConj, josaEnd, pctTxt, REL_TXT
  };
})(window);
