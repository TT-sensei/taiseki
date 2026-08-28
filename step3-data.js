/* =========================================================
   step3-data.js
   ドリル問題のランダム生成・丸めルール
   ========================================================= */
const DRILL_ROUNDING = {
  decimals: 2,
  tolerance: 0.01,
  pi: 3.14
};

function drillRandomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drillPick(list){
  return list[Math.floor(Math.random() * list.length)];
}

function drillRound(value){
  const scale = Math.pow(10, DRILL_ROUNDING.decimals);
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function drillNumber(value){
  return Number.isInteger(value) ? String(value) : String(drillRound(value));
}

function buildDrillProblem(config){
  const answer = drillRound(config.baseArea * config.solidHeight);
  const problem = Object.assign({}, config, {
    answer,
    level: Number(config.level),
    roundingText: '',
    formulaNumbers: (config.baseExpression.match(/\d+(?:\.\d+)?/g) || []).map(Number)
  });
  problem.key = [problem.level, problem.type, problem.baseExpression, problem.solidHeight].join('|');
  problem.hints = [
    `${problem.baseName}の面積は「${problem.baseFormula}」で求めます。`,
    `図の数を入れると、底面の式は「${problem.baseExpression}」です。`,
    `底面の式を（　）に入れて、高さ ${problem.solidHeight} をかけます。計算はしなくて大丈夫です。`
  ];
  return problem;
}

function makeLevel1Problem(){
  if(Math.random() < 0.3){
    const side = drillRandomInt(2, 9);
    return buildDrillProblem({
      level:1, type:'cube', solidName:'立方体', baseName:'正方形', shape:'square',
      baseFormula:'一辺 × 一辺', baseExpression:`${side} × ${side}`,
      baseArea:side * side, solidHeight:side,
      dimensions:{side}, questionText:`一辺が ${side}cm の立方体です。`
    });
  }
  const width = drillRandomInt(2, 9);
  const depth = drillRandomInt(2, 8);
  const height = drillRandomInt(2, 10);
  return buildDrillProblem({
    level:1, type:'rect', solidName:'直方体', baseName:'長方形', shape:'rectangle',
    baseFormula:'たて × 横', baseExpression:`${depth} × ${width}`,
    baseArea:depth * width, solidHeight:height,
    dimensions:{width, depth, height}, questionText:`たて ${depth}cm、横 ${width}cm、高さ ${height}cm の直方体です。`
  });
}

function makeTriangleProblem(level){
  const base = drillRandomInt(3, level === 2 ? 10 : 14);
  const triangleHeight = drillRandomInt(2, level === 2 ? 8 : 12);
  const solidHeight = drillRandomInt(2, level === 2 ? 10 : 14);
  return buildDrillProblem({
    level, type:'triangle', solidName:'三角柱', baseName:'三角形', shape:'triangle',
    baseFormula:'底辺 × 高さ ÷ 2', baseExpression:`${base} × ${triangleHeight} ÷ 2`,
    baseArea:base * triangleHeight / 2, solidHeight,
    dimensions:{base, triangleHeight, solidHeight},
    questionText:`底面は、底辺 ${base}cm、高さ ${triangleHeight}cm の三角形です。柱の高さは ${solidHeight}cm です。`
  });
}

function makeParallelogramProblem(level){
  const base = drillRandomInt(4, level === 2 ? 10 : 14);
  const baseHeight = drillRandomInt(2, level === 2 ? 8 : 12);
  const solidHeight = drillRandomInt(2, level === 2 ? 10 : 14);
  return buildDrillProblem({
    level, type:'parallelogram', solidName:'四角柱', baseName:'平行四辺形', shape:'parallelogram',
    baseFormula:'底辺 × 高さ', baseExpression:`${base} × ${baseHeight}`,
    baseArea:base * baseHeight, solidHeight,
    dimensions:{base, baseHeight, solidHeight},
    questionText:`底面は、底辺 ${base}cm、高さ ${baseHeight}cm の平行四辺形です。柱の高さは ${solidHeight}cm です。`
  });
}

function makeCylinderProblem(level){
  const radius = drillRandomInt(2, level === 2 ? 6 : 10);
  const solidHeight = drillRandomInt(2, level === 2 ? 10 : 15);
  const baseArea = drillRound(radius * radius * DRILL_ROUNDING.pi);
  return buildDrillProblem({
    level, type:'circle', solidName:'円柱', baseName:'円', shape:'circle',
    baseFormula:'半径 × 半径 × 3.14', baseExpression:`${radius} × ${radius} × 3.14`,
    baseArea, solidHeight, dimensions:{radius, solidHeight},
    questionText:`底面の半径が ${radius}cm、高さが ${solidHeight}cm の円柱です。`
  });
}

function makeTrapezoidProblem(){
  const top = drillRandomInt(3, 8);
  const bottom = drillRandomInt(top + 2, 14);
  const baseHeight = drillRandomInt(3, 10);
  const solidHeight = drillRandomInt(3, 14);
  return buildDrillProblem({
    level:3, type:'trapezoid', solidName:'四角柱', baseName:'台形', shape:'trapezoid',
    baseFormula:'（上底 ＋ 下底）× 高さ ÷ 2', baseExpression:`（${top} ＋ ${bottom}）× ${baseHeight} ÷ 2`,
    baseArea:(top + bottom) * baseHeight / 2, solidHeight,
    dimensions:{top, bottom, baseHeight, solidHeight},
    questionText:`底面は、上底 ${top}cm、下底 ${bottom}cm、高さ ${baseHeight}cm の台形です。柱の高さは ${solidHeight}cm です。`
  });
}

function makeRhombusProblem(){
  const diagonal1 = drillRandomInt(4, 14);
  const diagonal2 = drillRandomInt(4, 14);
  const solidHeight = drillRandomInt(3, 14);
  return buildDrillProblem({
    level:3, type:'rhombus', solidName:'四角柱', baseName:'ひし形', shape:'rhombus',
    baseFormula:'対角線 × 対角線 ÷ 2', baseExpression:`${diagonal1} × ${diagonal2} ÷ 2`,
    baseArea:diagonal1 * diagonal2 / 2, solidHeight,
    dimensions:{diagonal1, diagonal2, solidHeight},
    questionText:`底面は、対角線が ${diagonal1}cm と ${diagonal2}cm のひし形です。柱の高さは ${solidHeight}cm です。`
  });
}

function makeDrillProblem(level){
  const selectedLevel = Number(level) || 1;
  if(selectedLevel === 1) return makeLevel1Problem();
  if(selectedLevel === 2) return drillPick([
    () => makeTriangleProblem(2),
    () => makeParallelogramProblem(2),
    () => makeCylinderProblem(2)
  ])();
  return drillPick([
    () => makeTriangleProblem(3),
    () => makeParallelogramProblem(3),
    makeTrapezoidProblem,
    makeRhombusProblem,
    () => makeCylinderProblem(3)
  ])();
}
