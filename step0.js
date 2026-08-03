/* =========================================================
   step0.js
   「あくしょん公式図鑑」5図形の変形アニメーション
   ========================================================= */
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs){
  const el = document.createElementNS(SVG_NS, tag);
  for(const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}
function pts(arr){ return arr.map(p=>p[0]+','+p[1]).join(' '); }

/* ---------- 1. 平行四辺形：切って、はみ出た三角形をスライド ---------- */
function buildParallelogram(svg){
  const A=[90,240], B=[250,240], C=[300,100], D=[140,100], E=[140,240];
  svg.appendChild(svgEl('line', Object.assign({class:'guide-dash'}, {x1:D[0],y1:D[1],x2:E[0],y2:E[1]})));
  const quad = svgEl('polygon', {points: pts([E,B,C,D]), class:'piece piece-outline fill-teal'});
  const tri  = svgEl('polygon', {points: pts([A,D,E]), class:'piece piece-outline fill-coral'});
  tri.style.transformOrigin = '0px 0px';
  svg.appendChild(quad);
  svg.appendChild(tri);
  return {
    trigger(on){ tri.style.transform = on ? 'translate(160px,0px)' : 'translate(0px,0px)'; }
  };
}

/* ---------- 2. 三角形：もう1つ複製して180°回転→合体 ---------- */
function buildTriangle(svg){
  const P1=[90,240], P2=[250,240], P3=[170,100];
  const M=[(P2[0]+P3[0])/2, (P2[1]+P3[1])/2];
  const tri1 = svgEl('polygon', {points: pts([P1,P2,P3]), class:'piece-outline fill-coral'});
  const tri2 = svgEl('polygon', {points: pts([P1,P2,P3]), class:'piece piece-outline fill-teal'});
  tri2.style.transformOrigin = M[0]+'px '+M[1]+'px';
  tri2.style.opacity = '0';
  svg.appendChild(tri1);
  svg.appendChild(tri2);
  return {
    trigger(on){
      tri2.style.opacity = on ? '1' : '0';
      tri2.style.transform = on ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  };
}

/* ---------- 3. 台形：もう1つ複製して180°回転→合体 ---------- */
function buildTrapezoid(svg){
  const a1=[160,100], a2=[240,100], b1=[90,240], b2=[250,240];
  const M=[(a2[0]+b2[0])/2, (a2[1]+b2[1])/2];
  const shape1 = svgEl('polygon', {points: pts([a1,a2,b2,b1]), class:'piece-outline fill-sun'});
  const shape2 = svgEl('polygon', {points: pts([a1,a2,b2,b1]), class:'piece piece-outline fill-teal'});
  shape2.style.transformOrigin = M[0]+'px '+M[1]+'px';
  shape2.style.opacity = '0';
  svg.appendChild(shape1);
  svg.appendChild(shape2);
  return {
    trigger(on){
      shape2.style.opacity = on ? '1' : '0';
      shape2.style.transform = on ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  };
}

/* ---------- 4. ひし形：外接する長方形が出現 ---------- */
function buildRhombus(svg){
  const cx=200, cy=170, dh=200, dv=140;
  const top=[cx,cy-dv/2], right=[cx+dh/2,cy], bottom=[cx,cy+dv/2], left=[cx-dh/2,cy];
  const rx0=cx-dh/2, ry0=cy-dv/2, rx1=cx+dh/2, ry1=cy+dv/2;
  svg.appendChild(svgEl('polygon', {points: pts([top,right,bottom,left]), class:'piece-outline fill-teal'}));
  const rect = svgEl('rect', {x:rx0,y:ry0,width:dh,height:dv, class:'rect-grow'});
  svg.appendChild(rect);
  // 4隅の三角形（長方形からひし形を引いた部分）
  const corners = [
    [[rx0,ry0],[cx,ry0],[rx0,cy]],
    [[rx1,ry0],[cx,ry0],[rx1,cy]],
    [[rx0,ry1],[cx,ry1],[rx0,cy]],
    [[rx1,ry1],[cx,ry1],[rx1,cy]]
  ];
  const cornerEls = corners.map(c=>{
    const el = svgEl('polygon', {points: pts(c), class:'half-shade'});
    svg.appendChild(el);
    return el;
  });
  return {
    trigger(on){
      rect.classList.toggle('show', on);
      cornerEls.forEach(el=>el.classList.toggle('show', on));
    }
  };
}

/* ---------- 5. 円：おうぎ形に切って並べ替え ---------- */
function buildCircle(svg){
  const cx=110, cy=170, r=70, N=20, delta=360/N;
  const toRad = d => d*Math.PI/180;
  const pointAt = (angleDeg) => [cx + r*Math.sin(toRad(angleDeg)), cy - r*Math.cos(toRad(angleDeg))];

  const w = 2*r*Math.sin(toRad(delta/2));
  const h = r*Math.cos(toRad(delta/2));
  const startX = 175, baseline = cy + h/2;

  const wedges = [];
  for(let i=0;i<N;i++){
    const centerAngle = i*delta;
    const a1 = centerAngle - delta/2, a2 = centerAngle + delta/2;
    const base1 = pointAt(a1), base2 = pointAt(a2);
    const poly = svgEl('polygon', {
      points: pts([[cx,cy], base1, base2]),
      class: 'piece piece-outline fill-teal'
    });
    poly.style.transformOrigin = cx+'px '+cy+'px';
    svg.appendChild(poly);

    const j = Math.floor(i/2);
    const targetAngle = (i%2===0) ? 0 : 180;
    const xTarget = startX + j*w;
    const yTarget = (i%2===0) ? baseline : baseline - h;
    const dx = xTarget - cx, dy = yTarget - cy;
    const rot = targetAngle - centerAngle;
    wedges.push({poly, dx, dy, rot});
  }
  return {
    trigger(on){
      wedges.forEach(wd=>{
        wd.poly.style.transform = on
          ? `translate(${wd.dx}px,${wd.dy}px) rotate(${wd.rot}deg)`
          : 'translate(0px,0px) rotate(0deg)';
      });
    }
  };
}

const STEP0_BUILDERS = {
  parallelogram: buildParallelogram,
  triangle: buildTriangle,
  trapezoid: buildTrapezoid,
  rhombus: buildRhombus,
  circle: buildCircle
};

function initStep0(){
  const grid = document.getElementById('shapeGrid');
  STEP1_ORDER.forEach(key=>{
    const meta = SHAPES[key];
    const card = document.createElement('div');
    card.className = 'shape-card';
    card.innerHTML = `
      <h3>${meta.label}</h3>
      <div class="shape-stage"></div>
      <div class="shape-actions">
        <button class="btn-morph">へんしん！</button>
        <span class="formula-tag">${meta.formula}</span>
      </div>
    `;
    grid.appendChild(card);
    const stage = card.querySelector('.shape-stage');
    const svg = svgEl('svg', {viewBox:'0 0 400 300'});
    stage.appendChild(svg);
    const ctrl = STEP0_BUILDERS[key](svg);
    const btn = card.querySelector('.btn-morph');
    const tag = card.querySelector('.formula-tag');
    let on = false;
    btn.addEventListener('click', ()=>{
      on = !on;
      ctrl.trigger(on);
      btn.textContent = on ? 'もとにもどす' : 'へんしん！';
      btn.classList.toggle('done', on);
      tag.classList.toggle('show', on);
    });
  });
}
