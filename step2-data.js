/* =========================================================
   step2-data.js
   複合図形パズルの問題データ（L字・穴あき・T字）
   viewBox は共通で 0 0 400 320
   ========================================================= */
const STEP2_PROBLEMS = [

  // ---------- 問題1：L字型（たし算） ----------
  {
    id: 'L',
    title: 'L字型のたてもの',
    type: 'sum',
    outline: [[70,80],[250,80],[250,180],[370,180],[370,280],[70,280]],
    cutLines: [ {x1:250,y1:180,x2:250,y2:280} ],
    regions: [
      { key:'red',  points:[[70,80],[250,80],[250,280],[70,280]] },
      { key:'blue', points:[[250,180],[370,180],[370,280],[250,280]] }
    ],
    labels: [
      {x:52,  y:185, text:'20cm', anchor:'middle'},
      {x:160, y:66,  text:'18cm', anchor:'middle'},
      {x:388, y:235, text:'10cm', anchor:'middle'},
      {x:310, y:172, text:'12cm', anchor:'middle'}
    ],
    blanks: [
      {id:'r_h', color:'red',  label:'赤のたて', answer:20},
      {id:'r_w', color:'red',  label:'赤のよこ', answer:18},
      {id:'b_h', color:'blue', label:'青のたて', answer:10},
      {id:'b_w', color:'blue', label:'青のよこ', answer:12}
    ],
    totalAnswer: 480,
    hint: 'おしい！{color}の長方形の{dim}の長さを図の中でもういちど見てみよう。'
  },

  // ---------- 問題2：穴あき型（ひき算） ----------
  {
    id: 'HOLE',
    title: 'あなあきプレート',
    type: 'subtract',
    outline: [[70,70],[370,70],[370,270],[70,270]],
    holeOutline: [[175,135],[265,135],[265,205],[175,205]],
    cutLines: [
      {x1:175,y1:135,x2:265,y2:135}, {x1:265,y1:135,x2:265,y2:205},
      {x1:265,y1:205,x2:175,y2:205}, {x1:175,y1:205,x2:175,y2:135}
    ],
    regions: [
      { key:'red',  points:[[70,70],[370,70],[370,270],[70,270]] },
      { key:'blue', points:[[175,135],[265,135],[265,205],[175,205]] }
    ],
    labels: [
      {x:50,  y:170, text:'16cm', anchor:'middle'},
      {x:220, y:55,  text:'20cm', anchor:'middle'},
      {x:220, y:122, text:'6cm', anchor:'middle'},
      {x:220, y:222, text:'8cm', anchor:'middle'}
    ],
    blanks: [
      {id:'r_h', color:'red',  label:'大のたて', answer:16},
      {id:'r_w', color:'red',  label:'大のよこ', answer:20},
      {id:'b_h', color:'blue', label:'あなのたて', answer:6},
      {id:'b_w', color:'blue', label:'あなのよこ', answer:8}
    ],
    totalAnswer: 272,
    hint: 'おしい！{color}の長方形の{dim}の長さを図の中でもういちど見てみよう。'
  },

  // ---------- 問題3：T字型（たし算） ----------
  {
    id: 'T',
    title: 'T字型のかんばん',
    type: 'sum',
    outline: [[100,70],[300,70],[300,130],[240,130],[240,270],[160,270],[160,130],[100,130]],
    cutLines: [ {x1:160,y1:130,x2:240,y2:130} ],
    regions: [
      { key:'red',  points:[[100,70],[300,70],[300,130],[100,130]] },
      { key:'blue', points:[[160,130],[240,130],[240,270],[160,270]] }
    ],
    labels: [
      {x:200, y:56,  text:'24cm', anchor:'middle'},
      {x:320, y:100, text:'6cm', anchor:'middle'},
      {x:200, y:287, text:'8cm', anchor:'middle'},
      {x:142, y:200, text:'14cm', anchor:'middle'}
    ],
    blanks: [
      {id:'r_h', color:'red',  label:'赤のたて', answer:6},
      {id:'r_w', color:'red',  label:'赤のよこ', answer:24},
      {id:'b_h', color:'blue', label:'青のたて', answer:14},
      {id:'b_w', color:'blue', label:'青のよこ', answer:8}
    ],
    totalAnswer: 256,
    hint: 'おしい！{color}の長方形の{dim}の長さを図の中でもういちど見てみよう。'
  }
];
