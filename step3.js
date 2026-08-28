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
  let activeFormulaInput = null;

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
  const baseInput = document.getElementById('drillBaseExpression');
  const heightInput = document.getElementById('drillHeightExpression');
  const formulaPad = document.getElementById('drillFormulaPad');
  const checkFormulaBtn = document.getElementById('drillCheckFormulaBtn');
  const feedback = document.getElementById('drillFeedback');
  const hint = document.getElementById('drillHint');
  const hintBtn = document.getElementById('drillHintBtn');
  const nextBtn = document.getElementById('drillNextBtn');
  const navi = document.getElementById('drillNavi');
  const naviImage = document.getElementById('drillNaviImage');
  const naviMessage = document.getElementById('drillNaviMessage');

  activeFormulaInput = baseInput;

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

  function keypadNumbersFor(problem){
    const all = formulaNumbersFor(problem).concat(canonicalNumber(problem.solidHeight));
    return all.filter((value, index) => all.indexOf(value) === index);
  }

  function addPadButton(label, kind, action){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `formula-pad-key${kind ? ` ${kind}` : ''}`;
    button.textContent = label;
    if(action === 'backspace' || action === 'clear') button.dataset.action = action;
    else button.dataset.token = label;
    formulaPad.appendChild(button);
  }

  function renderFormulaPad(){
    formulaPad.textContent = '';
    if(!currentProblem) return;
    keypadNumbersFor(currentProblem).forEach(value => addPadButton(value, 'number'));
    ['×', '÷', '＋', '（', '）'].forEach(value => addPadButton(value, 'operator'));
    addPadButton('⌫', 'action', 'backspace');
    addPadButton('C', 'action', 'clear');
  }

  function clearFormulaInputs(){
    [baseInput, heightInput].forEach(input => {
      input.value = '';
      input.disabled = false;
      input.classList.remove('invalid');
    });
    activeFormulaInput = baseInput;
    checkFormulaBtn.disabled = false;
    formulaPad.querySelectorAll('button').forEach(button => { button.disabled = false; });
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
    questionText.innerHTML = `${p.questionText}<br><strong>体積を表す式をつくりましょう。</strong><small>答えの計算はしません。</small>`;
    baseRoleText.textContent = '図の数を使って式をつくる';
    heightRoleText.textContent = `${drillNumber(p.solidHeight)} cm`;
    renderDrillDiagram(p);
    renderFormulaPad();
    setNavi('thinking', '赤い底面の式を（　）に入れてから、高さをかけよう。');
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
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/\s+/g, '');
  }

  function parseFormula(raw){
    const source = normalizeFormula(raw);
    if(!source || /[^0-9.+*/()]/.test(source)) return null;

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

  function insertAtCursor(input, token){
    if(!input || input.disabled) return;
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    input.value = input.value.slice(0, start) + token + input.value.slice(end);
    const cursor = start + token.length;
    input.focus();
    input.setSelectionRange(cursor, cursor);
    input.classList.remove('invalid');
  }

  function eraseAtCursor(input){
    if(!input || input.disabled) return;
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    if(start === end && start === 0) return;
    const removeStart = start === end ? start - 1 : start;
    input.value = input.value.slice(0, removeStart) + input.value.slice(end);
    input.focus();
    input.setSelectionRange(removeStart, removeStart);
    input.classList.remove('invalid');
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
    if(hintLevel === 0) showHint();
    setNavi('retry', naviText);
    playSound('playTryAgain');
  }

  function displayFormula(raw){
    return String(raw).replace(/[xX*]/g, '×').replace(/\//g, '÷').replace(/\+/g, '＋');
  }

  function checkAnswer(event){
    event.preventDefault();
    if(!currentProblem || answered) return;
    const baseRaw = baseInput.value.trim();
    const heightRaw = heightInput.value.trim();
    baseInput.classList.remove('invalid');
    heightInput.classList.remove('invalid');

    if(!baseRaw || !heightRaw){
      feedback.className = 'drill-feedback hint';
      feedback.textContent = '赤い底面の式と、青い高さの数を入れてみよう。';
      if(!baseRaw) baseInput.classList.add('invalid');
      if(!heightRaw) heightInput.classList.add('invalid');
      return;
    }

    const parsedBase = parseFormula(baseRaw);
    if(!parsedBase || !usesRequiredNumbers(parsedBase ? parsedBase.numbers : [], currentProblem)){
      showFormulaIssue('赤い底面には、図にある数と ×・÷・＋ を使って式を入れよう。', baseInput, '図の赤い底面だけを見て、使う数を確かめよう。');
      return;
    }
    if(Math.abs(parsedBase.value - currentProblem.baseArea) > DRILL_ROUNDING.tolerance){
      showFormulaIssue('赤い底面の公式を見直してみよう。必要ならヒントを見てみよう。', baseInput, 'かける数・足す数・÷2 が合っているかを見直そう。');
      return;
    }

    const normalizedHeight = normalizeFormula(heightRaw);
    if(!/^\d+(?:\.\d+)?$/.test(normalizedHeight) || Math.abs(Number(normalizedHeight) - currentProblem.solidHeight) > DRILL_ROUNDING.tolerance){
      showFormulaIssue('青い高さの数を、立体のたて向きの長さから入れよう。', heightInput, '青い「高さ」の数を、図からもう一度見つけよう。');
      return;
    }

    answered = true;
    state.combo += 1;
    state.totalCorrect += 1;
    if(state.weakOnly) delete state.weak[currentProblem.key];
    saveState();
    feedback.className = 'drill-feedback ok';
    feedback.textContent = state.combo >= 2
      ? `せいかい！ ${state.combo}コンボ！ 体積を「（${displayFormula(baseRaw)}）× ${normalizedHeight}」と表せたね。計算はスキップでOK！`
      : `せいかい！ 体積を「（${displayFormula(baseRaw)}）× ${normalizedHeight}」と表せたね。計算はスキップでOK！`;
    baseRoleText.textContent = `（${displayFormula(baseRaw)}）`;
    heightRoleText.textContent = `${normalizedHeight} cm`;
    [baseInput, heightInput].forEach(input => { input.disabled = true; });
    formulaPad.querySelectorAll('button').forEach(button => { button.disabled = true; });
    checkFormulaBtn.disabled = true;
    hintBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    setNavi('correct', '体積を表す式ができたね！ 計算はここでおしまい。');
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
  [baseInput, heightInput].forEach(input => {
    input.addEventListener('focus', () => { activeFormulaInput = input; });
    input.addEventListener('input', () => { input.classList.remove('invalid'); });
  });
  formulaPad.addEventListener('click', event => {
    const button = event.target.closest('.formula-pad-key');
    if(!button || button.disabled) return;
    const input = activeFormulaInput || baseInput;
    if(button.dataset.action === 'backspace') eraseAtCursor(input);
    else if(button.dataset.action === 'clear'){
      input.value = '';
      input.classList.remove('invalid');
      input.focus();
    }else if(button.dataset.token){
      insertAtCursor(input, button.dataset.token);
    }
  });
  answerForm.addEventListener('submit', checkAnswer);
  hintBtn.addEventListener('click', showHint);
  nextBtn.addEventListener('click', nextProblem);

  updateToolbar();
  nextProblem();
}
