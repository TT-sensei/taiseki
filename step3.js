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
    const top = shapePoints(p.shape, 0, -62);
    const bottom = shapePoints(p.shape, 0, 55);
    if(p.shape === 'circle'){
      svg.innerHTML = `
        <ellipse cx="165" cy="80" rx="74" ry="30" class="drill-top"/>
        <path d="M91 80 V205 M239 80 V205" class="drill-side"/>
        <ellipse cx="165" cy="205" rx="74" ry="30" class="drill-base"/>
        <line x1="165" y1="205" x2="239" y2="205" class="drill-radius"/>
        <text x="195" y="225" class="drill-dim">半径 ${p.dimensions.radius}cm</text>
        ${heightArrow(p.solidHeight)}`;
      return;
    }
    const pairs = top.map((point, index) => `<line x1="${point[0]}" y1="${point[1]}" x2="${bottom[index][0]}" y2="${bottom[index][1]}" class="drill-side"/>`).join('');
    svg.innerHTML = `
      <polygon points="${top.map(x=>x.join(',')).join(' ')}" class="drill-top"/>
      ${pairs}
      <polygon points="${bottom.map(x=>x.join(',')).join(' ')}" class="drill-base"/>
      ${baseLabels(p)}
      ${heightArrow(p.solidHeight)}`;
  }

  function shapePoints(shape, dx, dy){
    const sets = {
      square:[[105,75],[225,75],[225,165],[105,165]],
      rectangle:[[85,82],[245,82],[245,158],[85,158]],
      triangle:[[165,55],[255,165],[75,165]],
      parallelogram:[[115,65],[255,65],[215,165],[75,165]],
      trapezoid:[[125,65],[215,65],[255,165],[75,165]],
      rhombus:[[165,48],[255,115],[165,182],[75,115]]
    };
    return (sets[shape] || sets.rectangle).map(p => [p[0] + dx, p[1] + dy]);
  }

  function heightArrow(value){
    return `<line x1="290" y1="76" x2="290" y2="218" class="drill-height"/><path d="M284 86 L290 76 L296 86 M284 208 L290 218 L296 208" class="drill-height-tip"/><text x="300" y="152" class="drill-height-text">${value}cm</text>`;
  }

  function baseLabels(p){
    const d = p.dimensions;
    if(p.shape === 'rectangle') return `<text x="115" y="253" class="drill-dim">横 ${d.width}cm</text><text x="38" y="185" class="drill-dim">たて ${d.depth}cm</text>`;
    if(p.shape === 'square') return `<text x="125" y="253" class="drill-dim">一辺 ${d.side}cm</text>`;
    if(p.shape === 'triangle') return `<text x="130" y="253" class="drill-dim">底辺 ${d.base}cm</text><text x="70" y="205" class="drill-dim">高さ ${d.triangleHeight}cm</text>`;
    if(p.shape === 'parallelogram') return `<text x="128" y="253" class="drill-dim">底辺 ${d.base}cm</text><text x="62" y="205" class="drill-dim">高さ ${d.baseHeight}cm</text>`;
    if(p.shape === 'trapezoid') return `<text x="138" y="138" class="drill-dim">上底 ${d.top}cm</text><text x="125" y="253" class="drill-dim">下底 ${d.bottom}cm</text><text x="55" y="205" class="drill-dim">高さ ${d.baseHeight}cm</text>`;
    return `<text x="78" y="205" class="drill-dim">対角線 ${d.diagonal1}cm・${d.diagonal2}cm</text>`;
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
