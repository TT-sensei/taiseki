/* =========================================================
   step2.js
   複合図形パズル：切り取り線 → 色あわせ入力 → こたえあわせ
   ========================================================= */
function initStep2(){
  const svg = document.getElementById('puzzleSvg');
  const splitBtn = document.getElementById('splitBtn');
  const formEl = document.getElementById('puzzleForm');
  const checkBtn = document.getElementById('checkBtn');
  const feedbackEl = document.getElementById('puzzleFeedback');
  const counterEl = document.getElementById('problemCounter');
  const prevBtn = document.getElementById('prevProblemBtn');
  const nextBtn = document.getElementById('nextProblemBtn');
  const bonusPanel = document.getElementById('bonusPanel');

  let idx = 0;
  let split = false;
  const solved = new Set();

  function currentProblem(){ return STEP2_PROBLEMS[idx]; }

  function renderFigure(){
    const p = currentProblem();
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 400 320');

    if(!split){
      const outlinePts = p.outline;
      svg.appendChild(svgEl('polygon', {points: pts(outlinePts), class:'region-plain'}));
      if(p.holeOutline){
        svg.appendChild(svgEl('polygon', {points: pts(p.holeOutline), class:'region-plain', fill:'#F3F7ED'}));
      }
    } else {
      p.regions.forEach(r=>{
        const el = svgEl('polygon', {points: pts(r.points), class: r.key==='red' ? 'region-red' : 'region-blue'});
        svg.appendChild(el);
      });
      p.cutLines.forEach(c=>{
        svg.appendChild(svgEl('line', {x1:c.x1,y1:c.y1,x2:c.x2,y2:c.y2, class:'cut-line show'}));
      });
      p.labels.forEach(l=>{
        const t = svgEl('text', {x:l.x, y:l.y, 'text-anchor':l.anchor||'middle', class:'dim-label'});
        t.textContent = l.text;
        svg.appendChild(t);
      });
    }
  }

  function renderForm(){
    const p = currentProblem();
    if(!split){
      formEl.innerHTML = '<p style="opacity:.6;font-weight:600;">まずは図形に「切り取り線」を入れてみよう。</p>';
      checkBtn.disabled = true;
      return;
    }
    const op = p.type === 'sum' ? '＋' : '－';
    let html = '面積 ＝ ( ';
    const b = p.blanks;
    html += inputTag(b[0]) + ' × ' + inputTag(b[1]) + ' ) ' + op + ' ( ' + inputTag(b[2]) + ' × ' + inputTag(b[3]) + ' )<br>';
    html += '　　＝ ' + inputTag({id:'total', color:null, label:'合計', answer:p.totalAnswer}) + ' cm²';
    formEl.innerHTML = html;
    checkBtn.disabled = false;
  }

  function inputTag(b){
    const colorClass = b.color === 'red' ? ' c-red' : (b.color === 'blue' ? ' c-blue' : '');
    const swatch = b.color ? `<span class="swatch-tag" style="background:${b.color==='red'?'var(--red)':'var(--blue)'}"></span>` : '';
    return `${swatch}<input type="number" inputmode="numeric" class="eq-input${colorClass}" data-id="${b.id}">`;
  }

  function updateNav(){
    counterEl.textContent = (idx+1) + ' / ' + STEP2_PROBLEMS.length;
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === STEP2_PROBLEMS.length - 1;
    bonusPanel.classList.toggle('hidden', !(solved.size === STEP2_PROBLEMS.length));
  }

  function loadProblem(i){
    idx = i;
    split = false;
    feedbackEl.className = 'puzzle-feedback';
    feedbackEl.textContent = '';
    splitBtn.disabled = false;
    renderFigure();
    renderForm();
    updateNav();
  }

  splitBtn.addEventListener('click', ()=>{
    split = true;
    splitBtn.disabled = true;
    renderFigure();
    renderForm();
  });

  checkBtn.addEventListener('click', ()=>{
    const p = currentProblem();
    const allBlanks = [...p.blanks, {id:'total', color:null, label:'合計', answer:p.totalAnswer}];
    let firstWrong = null;
    formEl.querySelectorAll('.eq-input').forEach(inp=>{
      inp.classList.remove('wrong');
      const bDef = allBlanks.find(x=>x.id === inp.dataset.id);
      const val = parseFloat(inp.value);
      if(isNaN(val) || Math.abs(val - bDef.answer) > 0.01){
        inp.classList.add('wrong');
        if(!firstWrong) firstWrong = bDef;
      }
    });
    if(firstWrong){
      const colorText = firstWrong.color === 'red' ? '赤色' : (firstWrong.color === 'blue' ? '青色' : '');
      const dimText = firstWrong.label ? firstWrong.label.replace(/^(赤|青|大|あなの)/, '') : '';
      feedbackEl.className = 'puzzle-feedback hint';
      feedbackEl.textContent = colorText
        ? `おしい！${colorText}の長方形の${dimText}をもういちど図で見てみよう。`
        : '計算をもういちど見直してみよう。かけ算の答えはあってるかな？';
    } else {
      feedbackEl.className = 'puzzle-feedback ok';
      feedbackEl.textContent = 'せいかい！🎉 色あわせがバッチリできたね。';
      solved.add(idx);
      updateNav();
    }
  });

  prevBtn.addEventListener('click', ()=>{ if(idx>0) loadProblem(idx-1); });
  nextBtn.addEventListener('click', ()=>{ if(idx<STEP2_PROBLEMS.length-1) loadProblem(idx+1); });

  loadProblem(0);
}
