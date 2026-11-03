/* =========================================================
   data-shapes.js
   ふくしゅう（公式ずかん）と、つみあげラボで共通利用する
   図形のメタデータ。面積の公式が、体積（底面積×高さ）に
   つながることを示すための土台データ。
   ========================================================= */

// 面積公式ずかんの図形（座標系は viewBox 0 0 400 300）
export const SHAPES = {

  parallelogram: {
    key: 'parallelogram',
    label: '平行四辺形',
    color: '#e08a00',
    formula: '底辺 × 高さ',
    formulaFilled: '160 × 140 ＝ 22400',
    rescueSteps: [
      'はみ出た三角形を、反対がわにスライドさせる',
      'すると、ぴったり長方形に変身する！',
      'だから面積は「底辺 × 高さ」で計算できる'
    ],
    base: 160, height: 140
  },

  triangle: {
    key: 'triangle',
    label: '三角形',
    color: '#ef5d4d',
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
    color: '#7c5cd6',
    formula: '（上底 ＋ 下底）× 高さ ÷ 2',
    formulaFilled: '（80 ＋ 160）× 140 ÷ 2 ＝ 16800',
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
    color: '#2e7cc4',
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
    color: '#0d9e8a',
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

// ふくしゅう・つみあげ共通の底面の並び
export const BASE_ORDER = ['parallelogram', 'triangle', 'trapezoid', 'rhombus', 'circle'];

// ずかん用の底面積（公式の数値例）
export function baseAreaOf(key) {
  const s = SHAPES[key];
  switch (key) {
    case 'parallelogram': return s.base * s.height;
    case 'triangle': return s.base * s.height / 2;
    case 'trapezoid': return (s.topBase + s.bottomBase) * s.height / 2;
    case 'rhombus': return s.diag1 * s.diag2 / 2;
    case 'circle': return Math.round(50 * 50 * 3.14);
    default: return 0;
  }
}

// つみあげラボの底面（cm単位の実寸データ）
export const STACK_BASES = {
  parallelogram: { expr: '8 × 3', area: 24, dimensions: { base: 8, baseHeight: 3 } },
  triangle: { expr: '6 × 6 ÷ 2', area: 18, dimensions: { base: 6, triangleHeight: 6 } },
  trapezoid: { expr: '（4 ＋ 8）× 3 ÷ 2', area: 18, dimensions: { top: 4, bottom: 8, baseHeight: 3 } },
  rhombus: { expr: '6 × 8 ÷ 2', area: 24, dimensions: { diagonal1: 6, diagonal2: 8 } },
  circle: { expr: '3 × 3 × 3.14', area: 28.26, dimensions: { radius: 3 } }
};
