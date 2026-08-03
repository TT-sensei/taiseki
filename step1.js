/* =========================================================
   step1.js
   「高さ1cmの魔法」：底面をえらび、高さを重ねて柱体をつくる
   ========================================================= */

// 実寸っぽく見せるための cm 単位のデモ値（Step0の巨大なpx値とは別に用意）
const STEP1_BASE = {
  parallelogram: { a:'底辺8cm × 高さ3cm', area:24 },
  triangle:      { a:'底辺6cm × 高さ6cm ÷ 2', area:18 },
  trapezoid:     { a:'(上底4cm＋下底8cm) × 高さ3cm ÷ 2', area:18 },
  rhombus:       { a:'対角線6cm × 対角線8cm ÷ 2', area:24 },
  circle:        { a:'半径3cm × 半径3cm × 3.14', area:28.26 }
};

// 底面アイコン（フラットな上から見た図）のポイント定義。viewBoxは 0 0 120 120。
function footprintPoints(key, sides){
  const cx=60, cy=60;
  if(key==='parallelogram'){
    return [[24,90],[80,90],[96,30],[40,30]];
  }
  if(key==='triangle'){
    return [[20,95],[100,95],[60,25]];
  }
  if(key==='trapezoid'){
    return [[46,25],[74,25],[95,95],[25,95]];
  }
  if(key==='rhombus'){
    return [[60,20],[100,60],[60,100],[20,60]];
  }
  if(key==='circle'){
    const n = sides || 24;
    const r = 42;
    const arr=[];
    for(let i=0;i<n;i++){
      const ang = (i/n)*Math.PI*2 - Math.PI/2;
      arr.push([cx+r*Math.cos(ang), cy+r*Math.sin(ang)]);
    }
    return arr;
  }
  return [];
}

function initStep1(){
  const pickerEl = document.getElementById('shapePicker');
  const canvasEl = document.getElementById('stackCanvas');
  const heightSlider = document.getElementById('heightSlider');
  const heightVal = document.getElementById('heightVal');
  const sideToggle = document.getElementById('sideCountToggle');
  const sideSlider = document.getElementById('sideSlider');
  const formulaEl = document.getElementById('volumeFormula');

  let currentKey = 'parallelogram';
  let currentHeight = 1;

  // ---- 底面ピッカー ----
  pickerEl.innerHTML = '';
  STEP1_ORDER.forEach(key=>{
    const meta = SHAPES[key];
    const btn = document.createElement('button');
    btn.className = 'picker-btn';
    btn.dataset.key = key;
    btn.innerHTML = `<span class="pk-swatch" style="background:${meta.color}"></span>${meta.label}`;
    btn.addEventListener('click', ()=>{
      currentKey = key;
      const isCircle = key === 'circle';
      sideToggle.disabled = !isCircle;
      if(!isCircle){ sideToggle.checked = false; sideSlider.disabled = true; }
      updatePicker();
      render();
    });
    pickerEl.appendChild(btn);
  });
  function updatePicker(){
    [...pickerEl.children].forEach(b=>b.classList.toggle('active', b.dataset.key === currentKey));
  }
  updatePicker();

  // ---- SVGステージ構築 ----
  canvasEl.innerHTML = '';
  const svg = svgEl('svg', {viewBox:'0 0 220 320', width:'100%', height:'100%'});
  canvasEl.appendChild(svg);

  const footLabel = svgEl('text', {x:110,y:14,'text-anchor':'middle', class:'dim-label'});
  footLabel.textContent = '底面（うえから見た図）';
  svg.appendChild(footLabel);

  const footGroup = svgEl('g', {transform:'translate(50,10) scale(0.85)'});
  svg.appendChild(footGroup);
  const footPoly = svgEl('polygon', {class:'piece-outline', points:''});
  footGroup.appendChild(footPoly);

  const towerLabel = svgEl('text', {x:110,y:150,'text-anchor':'middle', class:'dim-label'});
  towerLabel.textContent = 'たかさ（1cmずつ）';
  svg.appendChild(towerLabel);

  const towerGroup = svgEl('g');
  svg.appendChild(towerGroup);

  const LAYER_W = 110, LAYER_H = 15, TOWER_X = 55, TOWER_BOTTOM = 305;

  function render(){
    const meta = SHAPES[currentKey];
    const sides = sideToggle.checked ? parseInt(sideSlider.value,10) : 24;
    footPoly.setAttribute('points', pts(footprintPoints(currentKey, sides)));
    footPoly.setAttribute('fill', hexToRgba(meta.color, 0.5));
    footPoly.setAttribute('stroke', '#1F3A3D');

    // タワー再描画
    towerGroup.innerHTML = '';
    for(let i=0;i<currentHeight;i++){
      const y = TOWER_BOTTOM - (i+1)*LAYER_H;
      const rect = svgEl('rect', {
        x: TOWER_X, y, width: LAYER_W, height: LAYER_H-2,
        rx:3,
        fill: hexToRgba(meta.color, i%2===0 ? 0.85 : 0.6),
        stroke:'#1F3A3D', 'stroke-width':1.5,
        class: (i===currentHeight-1) ? 'layer-pop' : ''
      });
      towerGroup.appendChild(rect);
      const label = svgEl('text', {x: TOWER_X+LAYER_W+8, y: y+LAYER_H-4, class:'dim-label', 'font-size':10});
      label.textContent = (i+1)+'cm';
      towerGroup.appendChild(label);
    }

    const base = STEP1_BASE[currentKey];
    const vol = Math.round(base.area * currentHeight * 100)/100;
    formulaEl.innerHTML = `底面積 (${base.a} ＝ <b>${base.area}cm²</b>) × 高さ (<b>${currentHeight}cm</b>) ＝ 体積 <b>${vol}cm³</b>`;

    const sideLabel = document.querySelector('.side-toggle');
    if(sideToggle.checked){
      const nearCircle = sides >= 20;
      sideLabel.nextElementSibling && null;
    }
  }

  heightSlider.addEventListener('input', ()=>{
    currentHeight = parseInt(heightSlider.value,10);
    heightVal.textContent = currentHeight;
    render();
  });
  sideToggle.addEventListener('change', ()=>{
    sideSlider.disabled = !sideToggle.checked;
    render();
  });
  sideSlider.addEventListener('input', render);

  render();
}

function hexToRgba(hex, alpha){
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
