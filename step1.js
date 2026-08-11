/* =========================================================
   step1.js
   「高さ1cmの魔法」：同じ底面を1cmずつ積み重ねて柱体をつくる
   ========================================================= */
const STEP1_BASE = {
  parallelogram: {a:'底辺8cm × 高さ3cm',area:24,dimensions:{base:8,baseHeight:3}},
  triangle: {a:'底辺6cm × 高さ6cm ÷ 2',area:18,dimensions:{base:6,triangleHeight:6}},
  trapezoid: {a:'(上底4cm＋下底8cm) × 高さ3cm ÷ 2',area:18,dimensions:{top:4,bottom:8,baseHeight:3}},
  rhombus: {a:'対角線6cm × 対角線8cm ÷ 2',area:24,dimensions:{diagonal1:6,diagonal2:8}},
  circle: {a:'半径3cm × 半径3cm × 3.14',area:28.26,dimensions:{radius:3}}
};

function initStep1(){
  const pickerEl=document.getElementById('shapePicker');
  const canvasEl=document.getElementById('stackCanvas');
  const heightSlider=document.getElementById('heightSlider');
  const heightVal=document.getElementById('heightVal');
  const sideToggle=document.getElementById('sideCountToggle');
  const sideSlider=document.getElementById('sideSlider');
  const formulaEl=document.getElementById('volumeFormula');
  let currentKey='parallelogram';
  let currentHeight=1;
  let viewAngle=-42;

  pickerEl.innerHTML='';
  STEP1_ORDER.forEach(key=>{
    const meta=SHAPES[key];
    const btn=document.createElement('button');
    btn.className='picker-btn';
    btn.dataset.key=key;
    btn.innerHTML=`<span class="pk-swatch" style="background:${meta.color}"></span>${meta.label}`;
    btn.addEventListener('click',()=>{
      currentKey=key;
      const isCircle=key==='circle';
      sideToggle.disabled=!isCircle;
      if(!isCircle){ sideToggle.checked=false; sideSlider.disabled=true; }
      updatePicker();
      render();
    });
    pickerEl.appendChild(btn);
  });

  function updatePicker(){
    [...pickerEl.children].forEach(button=>button.classList.toggle('active',button.dataset.key===currentKey));
  }
  updatePicker();

  canvasEl.innerHTML=`
    <div class="solid-instruction">↔ 図を左右にドラッグすると、見る向きを変えられます</div>
    <svg class="stack-solid-svg" viewBox="0 0 420 320" role="img" aria-label="底面を1cmずつ積み重ねてできる柱体"></svg>`;
  const svg=canvasEl.querySelector('svg');
  let dragStart=null;

  function render(){
    const meta=SHAPES[currentKey];
    const base=STEP1_BASE[currentKey];
    const circleSides=sideToggle.checked ? Number(sideSlider.value) : 48;
    const shape=currentKey==='circle' ? 'circle' : currentKey;
    SolidSVG.renderPrism(svg,{
      width:420,height:320,shape,dimensions:base.dimensions,
      solidHeight:currentHeight,color:meta.color,angle:viewAngle,
      circleSides,layers:currentHeight,baseLabel:'底面',
      dimensionsToShow:[{
        from:{x:5.6,y:0,z:0},to:{x:5.6,y:currentHeight,z:0},
        text:`高さ ${currentHeight}cm`,role:'height',offset:-8
      }]
    });
    const vol=Math.round(base.area*currentHeight*100)/100;
    formulaEl.innerHTML=`底面積 (${base.a} ＝ <b>${base.area}cm²</b>) × 高さ (<b>${currentHeight}cm</b>) ＝ 体積 <b>${vol}cm³</b>`;
  }

  function pointerX(event){ return event.clientX; }
  svg.addEventListener('pointerdown',event=>{
    dragStart={x:pointerX(event),angle:viewAngle};
    svg.setPointerCapture(event.pointerId);
    svg.classList.add('dragging');
  });
  svg.addEventListener('pointermove',event=>{
    if(!dragStart) return;
    viewAngle=Math.max(-72,Math.min(-18,dragStart.angle+(pointerX(event)-dragStart.x)*.22));
    render();
  });
  function stopDrag(event){
    if(svg.hasPointerCapture && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    dragStart=null;
    svg.classList.remove('dragging');
  }
  svg.addEventListener('pointerup',stopDrag);
  svg.addEventListener('pointercancel',stopDrag);

  heightSlider.addEventListener('input',()=>{
    currentHeight=Number(heightSlider.value);
    heightVal.textContent=currentHeight;
    render();
  });
  sideToggle.addEventListener('change',()=>{
    sideSlider.disabled=!sideToggle.checked;
    render();
  });
  sideSlider.addEventListener('input',render);
  render();
}
