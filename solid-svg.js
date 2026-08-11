/* =========================================================
   solid-svg.js
   算数教材向けの共通SVG立体描画エンジン。
   3D座標 (x, y, z) を斜投影し、柱体を同じ規則で描く。
   ========================================================= */
(function(global){
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text){
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function polygonPoints(points){
    return points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  }

  function regularPolygon(sides, radius, rotation){
    const result = [];
    for(let i = 0; i < sides; i += 1){
      const angle = rotation + Math.PI * 2 * i / sides;
      result.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
    }
    return result;
  }

  function baseForShape(shape, dimensions, circleSides){
    const d = dimensions || {};
    switch(shape){
      case 'square': {
        const side = d.side || 5;
        return [[-side/2,-side/2],[side/2,-side/2],[side/2,side/2],[-side/2,side/2]];
      }
      case 'rectangle': {
        const width = d.width || 7;
        const depth = d.depth || 4;
        return [[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]];
      }
      case 'triangle': {
        const width = d.base || 6;
        const depth = d.triangleHeight || 5;
        return [[-width/2,depth/2],[width/2,depth/2],[0,-depth/2]];
      }
      case 'parallelogram': {
        const width = d.base || 7;
        const depth = d.baseHeight || 4;
        const lean = Math.min(width * .28, depth * .55);
        return [[-width/2+lean,-depth/2],[width/2+lean,-depth/2],[width/2-lean,depth/2],[-width/2-lean,depth/2]];
      }
      case 'trapezoid': {
        const top = d.top || 4;
        const bottom = d.bottom || 8;
        const depth = d.baseHeight || 4;
        return [[-top/2,-depth/2],[top/2,-depth/2],[bottom/2,depth/2],[-bottom/2,depth/2]];
      }
      case 'rhombus': {
        const width = d.diagonal1 || 7;
        const depth = d.diagonal2 || 5;
        return [[0,-depth/2],[width/2,0],[0,depth/2],[-width/2,0]];
      }
      case 'circle':
        return regularPolygon(circleSides || 48, d.radius || 3, -Math.PI/2);
      default:
        return baseForShape('rectangle', d, circleSides);
    }
  }

  function createProjector(options, base, height){
    const angle = (options.angle === undefined ? -42 : options.angle) * Math.PI / 180;
    const elevation = (options.elevation === undefined ? 27 : options.elevation) * Math.PI / 180;
    const width = options.width || 360;
    const heightPx = options.height || 280;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rise = Math.sin(elevation);

    function raw(point){
      const rx = point.x * cos - point.z * sin;
      const depth = point.x * sin + point.z * cos;
      return {x:rx, y:depth * rise - point.y, depth};
    }

    const samples = [];
    base.forEach(([x,z]) => {
      samples.push(raw({x,y:0,z}), raw({x,y:height,z}));
    });
    let minX = Math.min(...samples.map(p => p.x));
    let maxX = Math.max(...samples.map(p => p.x));
    let minY = Math.min(...samples.map(p => p.y));
    let maxY = Math.max(...samples.map(p => p.y));
    const pad = options.padding || {left:34,right:82,top:28,bottom:52};
    const usableW = width - pad.left - pad.right;
    const usableH = heightPx - pad.top - pad.bottom;
    const scale = Math.min(usableW / Math.max(1,maxX-minX), usableH / Math.max(1,maxY-minY));
    const offsetX = pad.left + (usableW - (maxX-minX)*scale)/2 - minX*scale;
    const offsetY = pad.top + (usableH - (maxY-minY)*scale)/2 - minY*scale;

    return function project(point){
      const p = raw(point);
      return {x:offsetX+p.x*scale, y:offsetY+p.y*scale, depth:p.depth, scale};
    };
  }

  function line(group, a, b, className, extra){
    group.appendChild(el('line', Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}, extra || {})));
  }

  function addText(group, point, text, className, attrs){
    group.appendChild(el('text', Object.assign({x:point.x,y:point.y,class:className}, attrs || {}), text));
  }

  function addDimension(group, project, spec){
    const a = project(spec.from);
    const b = project(spec.to);
    const dx = b.x-a.x;
    const dy = b.y-a.y;
    const length = Math.hypot(dx,dy) || 1;
    const nx = -dy/length;
    const ny = dx/length;
    const offset = spec.offset || 0;
    const p1 = {x:a.x+nx*offset,y:a.y+ny*offset};
    const p2 = {x:b.x+nx*offset,y:b.y+ny*offset};
    const klass = spec.role === 'height' ? 'solid-dimension solid-height-dimension' : 'solid-dimension';
    line(group,p1,p2,klass);
    const tick = 5;
    line(group,{x:p1.x-nx*tick,y:p1.y-ny*tick},{x:p1.x+nx*tick,y:p1.y+ny*tick},klass);
    line(group,{x:p2.x-nx*tick,y:p2.y-ny*tick},{x:p2.x+nx*tick,y:p2.y+ny*tick},klass);
    addText(group,{x:(p1.x+p2.x)/2+nx*13,y:(p1.y+p2.y)/2+ny*13},spec.text,'solid-dimension-text'+(spec.role === 'height' ? ' solid-height-text' : ''),{'text-anchor':'middle'});
  }

  function renderPrism(svg, options){
    const config = Object.assign({
      width:360,
      height:280,
      shape:'rectangle',
      solidHeight:6,
      color:'#1FA6A0',
      baseColor:'#ff5d5d',
      showHiddenEdges:true,
      circleSides:48,
      layers:0
    }, options || {});
    const base = config.base || baseForShape(config.shape, config.dimensions, config.circleSides);
    const solidHeight = Math.max(.25, Number(config.solidHeight) || 1);
    const project = createProjector(config,base,solidHeight);
    const bottom = base.map(([x,z]) => project({x,y:0,z}));
    const top = base.map(([x,z]) => project({x,y:solidHeight,z}));
    const centerBottom = project({x:0,y:0,z:0});

    svg.setAttribute('viewBox',`0 0 ${config.width} ${config.height}`);
    svg.innerHTML = '';
    const scene = el('g',{class:'solid-scene'});
    svg.appendChild(scene);

    const sides = base.map((_,i) => {
      const next = (i+1)%base.length;
      const depth = (bottom[i].depth+bottom[next].depth)/2;
      return {i,next,depth,front:((bottom[i].y+bottom[next].y)/2) >= centerBottom.y};
    }).sort((a,b) => a.depth-b.depth);

    sides.forEach(side => {
      if(!side.front) return;
      scene.appendChild(el('polygon',{
        points:polygonPoints([top[side.i],top[side.next],bottom[side.next],bottom[side.i]]),
        class:'solid-side-face',
        fill:config.color
      }));
    });

    scene.appendChild(el('polygon',{points:polygonPoints(bottom),class:'solid-base-face',fill:config.baseColor}));

    if(config.layers > 1){
      for(let layer=1; layer<config.layers; layer+=1){
        const y = solidHeight*layer/config.layers;
        const ring = base.map(([x,z]) => project({x,y,z}));
        scene.appendChild(el('polygon',{points:polygonPoints(ring),class:'solid-layer-line'}));
      }
    }

    if(config.shape === 'circle' && config.circleSides >= 20){
      const silhouettes=[
        bottom.reduce((best,point,index)=>point.x<bottom[best].x ? index : best,0),
        bottom.reduce((best,point,index)=>point.x>bottom[best].x ? index : best,0)
      ];
      silhouettes.forEach(index=>line(scene,top[index],bottom[index],'solid-edge'));
    }else{
      sides.forEach(side => {
        const klass = side.front ? 'solid-edge' : 'solid-edge solid-hidden-edge';
        if(side.front || config.showHiddenEdges) line(scene,top[side.i],bottom[side.i],klass);
      });
    }

    sides.forEach(side => {
      const klass = side.front ? 'solid-base-edge' : 'solid-base-edge solid-hidden-edge';
      if(side.front || config.showHiddenEdges) line(scene,bottom[side.i],bottom[side.next],klass);
    });

    scene.appendChild(el('polygon',{points:polygonPoints(top),class:'solid-top-face',fill:config.color}));

    if(Array.isArray(config.internalLines)){
      config.internalLines.forEach(spec => {
        const a=project(spec.from), b=project(spec.to);
        line(scene,a,b,spec.role === 'base' ? 'solid-base-helper' : 'solid-helper');
      });
    }

    const annotations = el('g',{class:'solid-annotations'});
    svg.appendChild(annotations);
    (config.dimensionsToShow || []).forEach(spec => addDimension(annotations,project,spec));
    if(config.baseLabel){
      addText(annotations,{x:centerBottom.x,y:centerBottom.y+18},config.baseLabel,'solid-base-label',{'text-anchor':'middle'});
    }
    return {project,base,bottom,top};
  }

  global.SolidSVG = {renderPrism,baseForShape,regularPolygon};
})(window);
