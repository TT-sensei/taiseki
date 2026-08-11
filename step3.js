/* =========================================================
   step3.js
   体積ドリルUI・localStorage・にがて復習
   ========================================================= */
function initStep3(){
  const STORAGE_KEY = 'taiseki-drill-v1';
  const defaultState = {level:1, weakOnly:false, combo:0, totalCorrect:0, shown:0, weak:{}};
  let state = loadState();
  let currentProblem = null;
  let hintLevel = 0;
  let answered = false;

  const levelSelector = document.getElementById('levelSelector');
  const weakToggle = document.getElementById('weakToggle');
  const weakCount = document.getElementById('weakCount');
  const correctCount = document.getElementById('drillCorrectCount');
  const comboDisplay = document.getElementById('comboDisplay');
  const comboCount = document.getElementById('comboCount');
  const panel = document.getElementById('drillPanel');
  const empty = document.getElementById('drillEmpty');
  const levelTag = document.getElementById('drillLevelTag');
  const modeTag = document.getElementById('drillModeTag');
  const problemNumber = document.getElementById('drillProblemNumber');
  const solidName = document.getElementById('drillSolidName');
  const questionText = document.getElementById('drillQuestionText');
  const baseRoleText = document.getElementById('baseRoleText');
  const heightRoleText = document.getElementById('heightRoleText');
  const answerForm = document.getElementById('drillAnswerForm');
  const answerInput = document.getElementById('drillAnswer');
  const feedback = document.getElementById('drillFeedback');
  const hint = document.getElementById('drillHint');
  const hintBtn = document.getElementById('drillHintBtn');
  const nextBtn = document.getElementById('drillNextBtn');

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(!saved || typeof saved !== 'object') return Object.assign({}, defaultState);
      return Object.assign({}, defaultState, saved, {weak:saved.weak && typeof saved.weak === 'object' ? saved.weak : {}});
    }catch(_){ return Object.assign({}, defaultState); }
  }

  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(_){}
    updateToolbar();
  }

  function updateToolbar(){
    levelSelector.querySelectorAll('.level-btn').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.level) === state.level));
    weakToggle.checked = state.weakOnly;
    weakCount.textContent = Object.keys(state.weak).length;
    correctCount.textContent = state.totalCorrect;
    comboCount.textContent = state.combo;
    comboDisplay.classList.toggle('hidden', state.combo < 2);
  }

  function weakProblemsForLevel(){
    return Object.values(state.weak).filter(problem => Number(problem.level) === state.level);
  }

  function nextProblem(){
    hintLevel = 0;
    answered = false;
    feedback.className = 'drill-feedback';
    feedback.textContent = '';
    hint.classList.add('hidden');
    hint.textContent = '';
    hintBtn.classList.remove('hidden');
    hintBtn.disabled = false;
    hintBtn.textContent = 'ヒントを1つ見る';
    nextBtn.classList.add('hidden');
    answerInput.disabled = false;
    answerInput.value = '';
    answerForm.querySelector('button').disabled = false;

    if(state.weakOnly){
      const weakList = weakProblemsForLevel();
      if(weakList.length === 0){
        currentProblem = null;
        panel.classList.add('hidden');
        empty.classList.remove('hidden');
        updateToolbar();
        return;
      }
      currentProblem = weakList[Math.floor(Math.random() * weakList.length)];
    }else{
      currentProblem = makeDrillProblem(state.level);
    }

    state.shown += 1;
    saveState();
    panel.classList.remove('hidden');
    empty.classList.add('hidden');
    renderProblem();
  }

  function renderProblem(){
    const p = currentProblem;
    levelTag.textContent = `Lv.${p.level}`;
    modeTag.classList.toggle('hidden', !state.weakOnly);
    problemNumber.textContent = `${state.shown}問目`;
    solidName.textContent = p.solidName;
    questionText.innerHTML = `${p.questionText}<br><strong>体積を求めましょう。</strong>${p.roundingText ? `<small>${p.roundingText}</small>` : ''}`;
    baseRoleText.textContent = `${p.baseName} → ？ cm²`;
    heightRoleText.textContent = `${p.solidHeight} cm`;
    renderDrillDiagram(p);
  }

  function renderDrillDiagram(p){
    const svg = document.getElementById('drillSvg');
    const d = p.dimensions;
    const dimensionsToShow=[{
      from:{x:dimensionAnchor(p),y:0,z:0},to:{x:dimensionAnchor(p),y:p.solidHeight,z:0},
      text:`高さ ${p.solidHeight}cm`,role:'height',offset:-7
    }];
    const internalLines=[];
    if(p.shape==='circle'){
      dimensionsToShow.push({from:{x:0,y:0,z:0},to:{x:d.radius,y:0,z:0},text:`半径 ${d.radius}cm`,role:'base',offset:10});
      internalLines.push({from:{x:0,y:0,z:0},to:{x:d.radius,y:0,z:0},role:'base'});
    }else if(p.shape==='square'){
      dimensionsToShow.push({from:{x:-d.side/2,y:0,z:d.side/2},to:{x:d.side/2,y:0,z:d.side/2},text:`一辺 ${d.side}cm`,role:'base',offset:13});
    }else if(p.shape==='rectangle'){
      dimensionsToShow.push(
        {from:{x:-d.width/2,y:0,z:d.depth/2},to:{x:d.width/2,y:0,z:d.depth/2},text:`横 ${d.width}cm`,role:'base',offset:13},
        {from:{x:-d.width/2,y:0,z:-d.depth/2},to:{x:-d.width/2,y:0,z:d.depth/2},text:`たて ${d.depth}cm`,role:'base',offset:-13}
      );
    }else{
      const text=p.shape==='triangle' ? `底辺 ${d.base}cm` :
        p.shape==='parallelogram' ? `底辺 ${d.base}cm` :
        p.shape==='trapezoid' ? `下底 ${d.bottom}cm` : `対角線 ${d.diagonal1}cm・${d.diagonal2}cm`;
      dimensionsToShow.push({from:{x:-baseWidth(p)/2,y:0,z:baseDepth(p)/2},to:{x:baseWidth(p)/2,y:0,z:baseDepth(p)/2},text,role:'base',offset:13});
      if(p.shape==='triangle' || p.shape==='parallelogram' || p.shape==='trapezoid'){
        internalLines.push({from:{x:0,y:0,z:-baseDepth(p)/2},to:{x:0,y:0,z:baseDepth(p)/2},role:'base'});
      }
    }
    SolidSVG.renderPrism(svg,{
      width:360,height:280,shape:p.shape,dimensions:d,solidHeight:p.solidHeight,
      color:'#63bdb7',baseColor:'#ff5d5d',angle:-42,
      dimensionsToShow,internalLines,baseLabel:'底面'
    });
  }

  function baseWidth(p){
    const d=p.dimensions;
    return d.base || d.bottom || d.diagonal1 || d.width || d.side || (d.radius ? d.radius*2 : 7);
  }

  function baseDepth(p){
    const d=p.dimensions;
    return d.triangleHeight || d.baseHeight || d.diagonal2 || d.depth || d.side || (d.radius ? d.radius*2 : 5);
  }

  function dimensionAnchor(p){
    return baseWidth(p)/2+1.5;
  }

  function showHint(){
    if(!currentProblem || hintLevel >= currentProblem.hints.length) return;
    hintLevel += 1;
    hint.classList.remove('hidden');
    hint.innerHTML = `<small>ヒント ${hintLevel}</small><p>${currentProblem.hints[hintLevel - 1]}</p>`;
    if(hintLevel >= 2) baseRoleText.textContent = `${currentProblem.baseName} → ${drillNumber(currentProblem.baseArea)} cm²`;
    if(hintLevel === currentProblem.hints.length){
      hintBtn.textContent = 'ヒントは全部見たよ';
      hintBtn.disabled = true;
    }else{
      hintBtn.textContent = 'ヒントをもう1つ見る';
    }
  }

  function checkAnswer(event){
    event.preventDefault();
    if(!currentProblem || answered) return;
    const value = Number(answerInput.value);
    if(answerInput.value.trim() === ''){
      feedback.className = 'drill-feedback hint';
      feedback.textContent = 'まずは答えの数を入れてみよう。';
      return;
    }
    if(Math.abs(value - currentProblem.answer) <= DRILL_ROUNDING.tolerance){
      answered = true;
      state.combo += 1;
      state.totalCorrect += 1;
      if(state.weakOnly) delete state.weak[currentProblem.key];
      saveState();
      feedback.className = 'drill-feedback ok';
      feedback.innerHTML = state.combo >= 2
        ? `せいかい！ <strong>${state.combo}コンボ！</strong> 底面積 × 高さで求められたね。`
        : 'せいかい！ 底面積 × 高さで求められたね。';
      baseRoleText.textContent = `${currentProblem.baseName} → ${drillNumber(currentProblem.baseArea)} cm²`;
      answerInput.disabled = true;
      answerForm.querySelector('button').disabled = true;
      hintBtn.classList.add('hidden');
      nextBtn.classList.remove('hidden');
    }else{
      state.combo = 0;
      state.weak[currentProblem.key] = currentProblem;
      saveState();
      feedback.className = 'drill-feedback hint';
      feedback.textContent = 'おしい！ まず赤い「底面積」を出してから、青い「高さ」をかけてみよう。';
      if(hintLevel === 0) showHint();
    }
  }

  levelSelector.addEventListener('click', event => {
    const button = event.target.closest('.level-btn');
    if(!button) return;
    state.level = Number(button.dataset.level);
    state.combo = 0;
    saveState();
    nextProblem();
  });
  weakToggle.addEventListener('change', () => {
    state.weakOnly = weakToggle.checked;
    state.combo = 0;
    saveState();
    nextProblem();
  });
  document.getElementById('returnNormalBtn').addEventListener('click', () => {
    state.weakOnly = false;
    saveState();
    nextProblem();
  });
  answerForm.addEventListener('submit', checkAnswer);
  hintBtn.addEventListener('click', showHint);
  nextBtn.addEventListener('click', nextProblem);

  updateToolbar();
  nextProblem();
}
