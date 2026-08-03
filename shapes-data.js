/* =========================================================
   shapes-data.js
   Step0/Step1 で共通利用する図形の座標・メタデータ。
   viewBox は 0 0 400 300 に統一。
   ========================================================= */
const SHAPES = {

  parallelogram: {
    key: 'parallelogram',
    label: '平行四辺形',
    color: '#1FA6A0',
    formula: '底辺 × 高さ',
    formulaFilled: '160 × 140 ＝ 22400',
    rescueSteps: [
      'はみ出た三角形を、反対がわにスライドさせる',
      'すると、ぴったり長方形に変身する！',
      'だから面積は「底辺 × 高さ」で計算できる'
    ],
    // 台形/三角形と違い「切って移動」なので専用ロジックを step0.js に持つ
    base: 160, height: 140
  },

  triangle: {
    key: 'triangle',
    label: '三角形',
    color: '#FF6F5E',
    formula: '底辺 × 高さ ÷ 2',
    formulaFilled: '160 × 140 ÷ 2 ＝ 11200',
    rescueSteps: [
      '同じ三角形をもう1つ用意して、180°まわす',
      '2つをぴったり合体させると平行四辺形になる',
      '平行四辺形の半分が元の三角形。だから ÷2 する'
    ],
    base: 160, height: 140
  },

  trapezoid: {
    key: 'trapezoid',
    label: '台形',
    color: '#FFB100',
    formula: '(上底 ＋ 下底) × 高さ ÷ 2',
    formulaFilled: '(80 ＋ 160) × 140 ÷ 2 ＝ 16800',
    rescueSteps: [
      '同じ台形をもう1つ、180°まわして横に合体',
      '大きな平行四辺形ができる（底辺＝上底＋下底）',
      'その半分が元の台形。だから ÷2 する'
    ],
    topBase: 80, bottomBase: 160, height: 140
  },

  rhombus: {
    key: 'rhombus',
    label: 'ひし形',
    color: '#4D96FF',
    formula: '対角線 × 対角線 ÷ 2',
    formulaFilled: '200 × 140 ÷ 2 ＝ 14000',
    rescueSteps: [
      'ひし形がすっぽり入る長方形を書く',
      '長方形のたて・よこは、ひし形の対角線と同じ長さ',
      'ひし形は、その長方形のちょうど半分。だから ÷2 する'
    ],
    diag1: 200, diag2: 140
  },

  circle: {
    key: 'circle',
    label: '円',
    color: '#B084F5',
    formula: '半径 × 半径 × 3.14',
    formulaFilled: '50 × 50 × 3.14 ＝ 7850',
    rescueSteps: [
      '円を細かいピース（おうぎ形）に切る',
      'ピースを互い違いに並べると、長方形に近づく',
      'たては半径、よこは円周の半分＝「半径×3.14」'
    ],
    radius: 100
  }
};

// Step1 で使う「底面の一覧」(键・表示名・色は SHAPES と共有)
const STEP1_ORDER = ['parallelogram','triangle','trapezoid','rhombus','circle'];

function baseAreaOf(key){
  const s = SHAPES[key];
  switch(key){
    case 'parallelogram': return s.base * s.height;
    case 'triangle': return s.base * s.height / 2;
    case 'trapezoid': return (s.topBase + s.bottomBase) * s.height / 2;
    case 'rhombus': return s.diag1 * s.diag2 / 2;
    case 'circle': return Math.round(50*50*3.14);
    default: return 0;
  }
}
