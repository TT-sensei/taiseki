/* =========================================================
   step3.js
   体積ドリルUI・式入力・計算スキップ・にがて復習
   ========================================================= */
function initStep3(){
  const STORAGE_KEY = 'taiseki-drill-v1';
  const defaultState = {level:1, weakOnly:false, combo:0, totalCorrect:0, shown:0, weak:{}};
  const NAVI_ROOT = 'https://tt-sensei.github.io/navi-character-/assets/web/characters/';
  const NAVI_CUES = {
    thinking:[
      {name:'かい', image:'kai/fullbody/thinking.webp'},
      {name:'りく', image:'riku/fullbody/pointing.webp'}
    ],
    hint:[
      {name:'なみ', image:'nami/fullbody/hint.webp'},
      {name:'さく', image:'saku/fullbody/hint.webp'}
    ],
    retry:[
      {name:'そら', image:'sora/fullbody/retry.webp'},
      {name:'つき', image:'tsuki/fullbody/retry.webp'}
    ],
    answer:[
      {name:'かい', image:'kai/fullbody/checking-note.webp'},
      {name:'なみ', image:'nami/fullbody/reaching-out.webp'},
      {name:'さく', image:'saku/fullbody/reading.webp'}
    ],
    correct:[
      {name:'そら', image:'sora/fullbody/correct.webp'},
      {name:'さく', image:'saku/fullbody/correct.webp'},
      {name:'つき', image:'tsuki/fullbody/correct.webp'},
      {name:'りく', image:'riku/fullbody/correct.webp'},
      {name:'かい', image:'kai/fullbody/correct.webp'},
      {name:'なみ', image:'nami/fullbody/correct.webp'}
    ]
  };

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
  const baseBuilder = document.getElementById('drillBaseBuilder');
  const volumeOperatorInput = document.getElementById('drillVolumeOperator');
  const heightInput = document.getElementById('drillHeightExpression');
  const volumeInput = document.getElementById('drillVolumeAnswer');
  const checkFormulaBtn = document.getElementById('drillCheckFormulaBtn');
  const feedback = document.getElementById('drillFeedback');
  const hint = document.getElementById('drillHint');
  const hintBtn = document.getElementById('drillHintBtn');
  const nextBtn = document.getElementById('drillNextBtn');
  const skipPanel = document.getElementById('drillSkipPanel');
  const skipCalculationBtn = document.getElementById('drillSkipCalculationBtn');
  const answerReveal = document.getElementById('drillAnswerReveal');
  const answerRevealText = document.getElementById('drillAnswerRevealText');
  const navi = document.getElementById('drillNavi');
  const naviImage = document.getElementById('drillNaviImage');
  const naviMessage = document.getElementById('drillNaviMessage');

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

  function setNavi(mood, message){
    const choices = NAVI_CUES[mood] || NAVI_CUES.thinking;
    const choice = choices[(state.shown + state.totalCorrect + hintLevel) % choices.length];
    navi.dataset.mood = mood;
    naviImage.src = NAVI_ROOT + choice.image;
    naviImage.alt = message ? `${choice.name}が話している` : choice.name;
    naviMessage.textContent = message;
  }

  function canonicalNumber(value){
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : '';
  }

  function formulaNumbersFor(problem){
    if(Array.isArray(problem.formulaNumbers) && problem.formulaNumbers.length){
      return problem.formulaNumbers.map(value => canonicalNumber(value));
    }
    return (String(problem.baseExpression || '').match(/\d+(?:\.\d+)?/g) || []).map(value => canonicalNumber(value));
  }

  function baseFormulaTokens(problem){
    return String(problem.baseExpression || '').match(/\d+(?:\.\d+)?|[×＋－−÷()（）]/g) || [];
  }

  function renderFormulaBuilder(problem){
    baseBuilder.textContent = '';
    baseFormulaTokens(problem).forEach(token => {
      if(/^\d/.test(token)){
        const input = document.createElement('input');
        input.type = 'number';
        input.inputMode = 'decimal';
        input.min = '0';
        input.step = 'any';
        input.autocomplete = 'off';
        input.className = 'formula-input formula-number-input';
        input.placeholder = '数';
        input.setAttribute('aria-label', '底面の数');
        input.dataset.formulaToken = 'number';
        baseBuilder.appendChild(input);
      }else if('×＋－−÷'.includes(token)){
        const select = document.createElement('select');
        select.className = 'formula-operator-select';
        select.setAttribute('aria-label', '底面の演算子');
        select.dataset.formulaToken = 'operator';
        [['','選ぶ'],['×','×'],['＋','＋'],['－','－'],['÷','÷']].forEach(([value,label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          select.appendChild(option);
        });
        baseBuilder.appendChild(select);
      }else{
        const span = document.createElement('span');
        span.className = 'formula-static-token';
        span.dataset.formulaToken = 'static';
        span.textContent = token === '(' ? '（' : token === ')' ? '）' : token;
        baseBuilder.appendChild(span);
      }
    });
  }

  function collectBaseExpression(){
    return [...baseBuilder.querySelectorAll('[data-formula-token]')].map(element => {
      if(element.matches('input, select')) return element.value.trim();
      return element.textContent;
    }).join('');
  }

  function clearFormulaInputs(){
    [heightInput, volumeInput].forEach(input => {
      input.value = '';
      input.disabled = false;
      input.classList.remove('invalid');
    });
    volumeOperatorInput.value = '';
    baseBuilder.querySelectorAll('input').forEach(input => {
      input.value = '';
      input.disabled = false;
      input.classList.remove('invalid');
    });
    baseBuilder.querySelectorAll('select').forEach(select => {
      select.value = '';
      select.disabled = false;
      select.classList.remove('invalid');
    });
    checkFormulaBtn.disabled = false;
    skipPanel.classList.add('hidden');
    skipCalculationBtn.disabled = false;
    answerReveal.classList.add('hidden');
    answerRevealText.textContent = '';
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
    clearFormulaInputs();

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
    questionText.innerHTML = `${p.questionText}<br><strong>体積の式と答えを入れましょう。</strong><small>まずは1回、自分で計算してみよう。</small>`;
    baseRoleText.textContent = '図の数を使って式をつくる';
    heightRoleText.textContent = `${drillNumber(p.solidHeight)} cm`;
    renderDrillDiagram(p);
    renderFormulaBuilder(p);
    volumeOperatorInput.value = '';
    setNavi('thinking', 'まずは赤い底面の式と、体積の答えに挑戦してみよう。');
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
    if(hintLevel >= 2) baseRoleText.textContent = `「${currentProblem.baseFormula}」を使う`;
    if(hintLevel === currentProblem.hints.length){
      hintBtn.textContent = 'ヒントは全部見たよ';
      hintBtn.disabled = true;
    }else{
      hintBtn.textContent = 'ヒントをもう1つ見る';
    }
    setNavi('hint', '公式を見ながら、図の数を順に入れてみよう。');
  }

  function normalizeFormula(raw){
    return String(raw || '')
      .trim()
      .replace(/[０-９．]/g, character => String.fromCharCode(character.charCodeAt(0) - 0xFEE0))
      .replace(/[×✕xX＊]/g, '*')
      .replace(/[÷／]/g, '/')
      .replace(/[＋]/g, '+')
      .replace(/[−－]/g, '-')
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/\s+/g, '');
  }

  function parseFormula(raw){
    const source = normalizeFormula(raw);
    if(!source || /[^0-9.+*/()\-]/.test(source)) return null;

    const tokens = [];
    const numbers = [];
    for(let index=0; index<source.length; ){
      const numberMatch = source.slice(index).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
      if(numberMatch){
        const text = numberMatch[0];
        const value = Number(text);
        if(!Number.isFinite(value)) return null;
        tokens.push({type:'number', value});
        numbers.push(canonicalNumber(value));
        index += text.length;
        continue;
      }
      const character = source[index];
      if('+-*/()'.includes(character)){
        tokens.push({type:character});
        index += 1;
        continue;
      }
      return null;
    }

    let position = 0;
    function parseExpression(){
      let value = parseTerm();
      while(value !== null && position < tokens.length && (tokens[position].type === '+' || tokens[position].type === '-')){
        const operator = tokens[position].type;
        position += 1;
        const right = parseTerm();
        if(right === null) return null;
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    }
    function parseTerm(){
      let value = parseFactor();
      while(value !== null && position < tokens.length && (tokens[position].type === '*' || tokens[position].type === '/')){
        const operator = tokens[position].type;
        position += 1;
        const right = parseFactor();
        if(right === null || (operator === '/' && right === 0)) return null;
        value = operator === '*' ? value * right : value / right;
      }
      return value;
    }
    function parseFactor(){
      const token = tokens[position];
      if(!token) return null;
      if(token.type === 'number'){
        position += 1;
        return token.value;
      }
      if(token.type === '('){
        position += 1;
        const value = parseExpression();
        if(value === null || !tokens[position] || tokens[position].type !== ')') return null;
        position += 1;
        return value;
      }
      return null;
    }

    const value = parseExpression();
    if(value === null || position !== tokens.length || !Number.isFinite(value)) return null;
    return {value, numbers};
  }

  function usesRequiredNumbers(numbers, problem){
    const expected = formulaNumbersFor(problem).sort();
    const actual = numbers.slice().sort();
    return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
  }

  function playSound(method){
    if(window.EduSound && typeof window.EduSound[method] === 'function') window.EduSound[method]();
  }

  function showFormulaIssue(message, input, naviText){
    state.combo = 0;
    state.weak[currentProblem.key] = currentProblem;
    saveState();
    feedback.className = 'drill-feedback hint';
    feedback.textContent = message;
    if(input) input.classList.add('invalid');
    skipPanel.classList.remove('hidden');
    skipCalculationBtn.disabled = false;
    if(hintLevel === 0) showHint();
    setNavi('retry', naviText);
    playSound('playTryAgain');
  }

  function displayFormula(raw){
    return String(raw).replace(/[xX*]/g, '×').replace(/\//g, '÷').replace(/\+/g, '＋').replace(/-/g, '－');
  }

  function baseWithBrackets(raw){
    const shown = displayFormula(raw);
    return /^[（(].*[）)]$/.test(shown) ? shown : `（${shown}）`;
  }

  function markFormulaInputsInvalid(){
    baseBuilder.querySelectorAll('input,select').forEach(input => input.classList.add('invalid'));
  }

  function disableFormulaInputs(){
    baseBuilder.querySelectorAll('input,select').forEach(input => { input.disabled = true; });
    [volumeOperatorInput, heightInput, volumeInput].forEach(input => { input.disabled = true; });
  }

  function revealCalculationAnswer(){
    if(!currentProblem || answered) return;
    answered = true;
    state.combo = 0;
    state.weak[currentProblem.key] = currentProblem;
    saveState();
    const expression = `${baseWithBrackets(currentProblem.baseExpression)} × ${drillNumber(currentProblem.solidHeight)}`;
    answerRevealText.textContent = `${expression} ＝ ${drillNumber(currentProblem.answer)} cm³`;
    answerReveal.classList.remove('hidden');
    skipPanel.classList.add('hidden');
    feedback.className = 'drill-feedback hint';
    feedback.textContent = 'ナビが答えを教えてくれたよ。式の形を写して、次の問題で使ってみよう。';
    baseRoleText.textContent = baseWithBrackets(currentProblem.baseExpression);
    heightRoleText.textContent = `${drillNumber(currentProblem.solidHeight)} cm`;
    disableFormulaInputs();
    checkFormulaBtn.disabled = true;
    hintBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    setNavi('answer', `答えは ${drillNumber(currentProblem.answer)}cm³。式はこの形だよ。`);
    playSound('playTryAgain');
  }

  function checkAnswer(event){
    event.preventDefault();
    if(!currentProblem || answered) return;
    const baseRaw = collectBaseExpression();
    const heightRaw = heightInput.value.trim();
    const volumeRaw = volumeInput.value.trim();
    baseBuilder.querySelectorAll('input,select').forEach(input => input.classList.remove('invalid'));
    [volumeOperatorInput, heightInput, volumeInput].forEach(input => input.classList.remove('invalid'));

    if(!baseRaw || !heightRaw || !volumeRaw || !volumeOperatorInput.value){
      feedback.className = 'drill-feedback hint';
      feedback.textContent = '式の数・演算子・高さ・答えを入れて、1回挑戦してみよう。';
      if(!baseRaw) markFormulaInputsInvalid();
      if(!volumeOperatorInput.value) volumeOperatorInput.classList.add('invalid');
      if(!heightRaw) heightInput.classList.add('invalid');
      if(!volumeRaw) volumeInput.classList.add('invalid');
      skipPanel.classList.remove('hidden');
      setNavi('retry', '一度入力してみたね。わからないときは、ぼくに聞いてね。');
      playSound('playTryAgain');
      return;
    }

    if(volumeOperatorInput.value !== '×'){
      showFormulaIssue('底面積と高さは「×」でつなごう。', volumeOperatorInput, '底面積と高さは、かけ算でつなぐよ。');
      return;
    }

    const parsedBase = parseFormula(baseRaw);
    if(!parsedBase || !usesRequiredNumbers(parsedBase ? parsedBase.numbers : [], currentProblem)){
      markFormulaInputsInvalid();
      showFormulaIssue('赤い底面には、図にある数と演算子を使って式を入れよう。', null, '図の赤い底面だけを見て、使う数と演算子を確かめよう。');
      return;
    }
    if(Math.abs(parsedBase.value - currentProblem.baseArea) > DRILL_ROUNDING.tolerance){
      markFormulaInputsInvalid();
      showFormulaIssue('赤い底面の公式を見直してみよう。', null, 'かける数・足す数・÷2 が合っているかを見直そう。');
      return;
    }

    const normalizedHeight = normalizeFormula(heightRaw);
    if(!/^\d+(?:\.\d+)?$/.test(normalizedHeight) || Math.abs(Number(normalizedHeight) - currentProblem.solidHeight) > DRILL_ROUNDING.tolerance){
      showFormulaIssue('青い高さの数を、立体のたて向きの長さから入れよう。', heightInput, '青い「高さ」の数を、図からもう一度見つけよう。');
      return;
    }

    const normalizedVolume = normalizeFormula(volumeRaw);
    if(!/^\d+(?:\.\d+)?$/.test(normalizedVolume) || Math.abs(Number(normalizedVolume) - currentProblem.answer) > DRILL_ROUNDING.tolerance){
      showFormulaIssue('体積の答えをもう一度計算してみよう。わからなければ、ナビに聞いて大丈夫。', volumeInput, '答えの計算がむずかしければ、ぼくに聞いてね。');
      return;
    }

    answered = true;
    state.combo += 1;
    state.totalCorrect += 1;
    if(state.weakOnly) delete state.weak[currentProblem.key];
    saveState();
    const shownBase = baseWithBrackets(baseRaw);
    feedback.className = 'drill-feedback ok';
    feedback.textContent = state.combo >= 2
      ? `せいかい！ ${state.combo}コンボ！ ${shownBase} × ${normalizedHeight} ＝ ${normalizedVolume} cm³。`
      : `せいかい！ ${shownBase} × ${normalizedHeight} ＝ ${normalizedVolume} cm³。`;
    baseRoleText.textContent = shownBase;
    heightRoleText.textContent = `${normalizedHeight} cm`;
    disableFormulaInputs();
    checkFormulaBtn.disabled = true;
    skipPanel.classList.add('hidden');
    answerReveal.classList.add('hidden');
    hintBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    setNavi('correct', '式も答えもばっちり！ 計算できたね。');
    playSound('playCorrect');
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
  baseBuilder.addEventListener('input', event => event.target.classList.remove('invalid'));
  baseBuilder.addEventListener('change', event => event.target.classList.remove('invalid'));
  [volumeOperatorInput, heightInput, volumeInput].forEach(input => {
    input.addEventListener('input', () => { input.classList.remove('invalid'); });
    input.addEventListener('change', () => { input.classList.remove('invalid'); });
  });
  answerForm.addEventListener('submit', checkAnswer);
  hintBtn.addEventListener('click', showHint);
  nextBtn.addEventListener('click', nextProblem);
  skipCalculationBtn.addEventListener('click', revealCalculationAnswer);

  updateToolbar();
  nextProblem();
}
