// 「めんせき・たいせきラボ」画面と進行。
// テーマは一本の線：面積の公式（ふくしゅう）→ 底面積 × 高さ ＝ 体積。
// 記録（解いた数・正解数・まちがえた問題・バッジ）は localStorage にだけ保存する。
import { SHAPES, BASE_ORDER, STACK_BASES } from './data-shapes.js';
import { PUZZLE_PROBLEMS } from './data-puzzle.js';
import { DRILL_ROUNDING, drillNumber, makeDrillProblem } from './data-drill.js';
import { createMorph, svgEl, pts } from './morph.js';

let soundList = [];
try {
  ({ soundList } = await import('https://tt-sensei.github.io/sounds-recipe-/sounds.js'));
} catch {
  // 音は補助要素。読み込めなくても学習本体は続けられるようにする。
  soundList = [];
}

const root = document.querySelector('#app');
const NAVI_BASE = 'https://tt-sensei.github.io/navi-character-/assets/web';
const BADGE_BASE = 'https://tt-sensei.github.io/edu-assets/assets/web/badges';

export const NAVI_IMG = {
  home: `${NAVI_BASE}/groups/group-thinking.webp`,
  zukan: `${NAVI_BASE}/characters/tsuki/expressions/04-idea.webp`,
  stack: `${NAVI_BASE}/characters/kai/expressions/03-thinking.webp`,
  puzzle: `${NAVI_BASE}/characters/nami/expressions/07-encouraging.webp`,
  drill: `${NAVI_BASE}/characters/riku/expressions/02-happy.webp`,
  correctPose: `${NAVI_BASE}/characters/riku/fullbody/correct.webp`,
  retryPose: `${NAVI_BASE}/characters/saku/fullbody/retry.webp`
};

const MISSION_NAVI = {
  zukan: { img: NAVI_IMG.zukan, name: 'つき', comment: '面積の公式は、へんしんさせると理由がわかるよ。体積の前に、まずふくしゅう！' },
  stack: { img: NAVI_IMG.stack, name: 'かい', comment: '底面を1cmずつ積み上げると、そのまま体積になるんだ。' },
  puzzle: { img: NAVI_IMG.puzzle, name: 'なみ', comment: '複雑な形も、長方形に分ければ面積が出せるよ。' },
  drill: { img: NAVI_IMG.drill, name: 'りく', comment: 'どんな柱も「底面積 × 高さ」。式を自分で立ててみよう。' }
};

// ドリル中のナビ（全身）。場面ごとに声かけを変える。
const NAVI_CUES = {
  thinking: [
    { name: 'かい', image: 'kai/fullbody/thinking.webp' },
    { name: 'りく', image: 'riku/fullbody/pointing.webp' }
  ],
  hint: [
    { name: 'なみ', image: 'nami/fullbody/hint.webp' },
    { name: 'さく', image: 'saku/fullbody/hint.webp' }
  ],
  retry: [
    { name: 'そら', image: 'sora/fullbody/retry.webp' },
    { name: 'つき', image: 'tsuki/fullbody/retry.webp' }
  ],
  answer: [
    { name: 'かい', image: 'kai/fullbody/checking-note.webp' },
    { name: 'なみ', image: 'nami/fullbody/reaching-out.webp' },
    { name: 'さく', image: 'saku/fullbody/reading.webp' }
  ],
  correct: [
    { name: 'そら', image: 'sora/fullbody/correct.webp' },
    { name: 'さく', image: 'saku/fullbody/correct.webp' },
    { name: 'つき', image: 'tsuki/fullbody/correct.webp' },
    { name: 'りく', image: 'riku/fullbody/correct.webp' },
    { name: 'かい', image: 'kai/fullbody/correct.webp' },
    { name: 'なみ', image: 'nami/fullbody/correct.webp' }
  ]
};

// ---------- バッジ ----------
const BADGES = [
  { id: 'first-step', name: 'はじめの一歩', img: `${BADGE_BASE}/common/first-step/badge.webp`, desc: 'どれかのミッションで、はじめて一歩ふみ出す', test: s => s.stats.zukanMorphed.length >= 1 || s.stats.puzzleSolved.length >= 1 || s.stats.drillCorrect >= 1 },
  { id: 'zukan-master', name: 'ずかんマスター', img: `${BADGE_BASE}/math/geometry/badge.webp`, desc: '公式ずかんで5つの図形をぜんぶへんしんさせる', test: s => s.stats.zukanMorphed.length >= 5 },
  { id: 'stack-10', name: 'つみあげ名人', img: `${BADGE_BASE}/math/spatial-sense/badge.webp`, desc: 'つみあげラボで高さ10cmまで積む', test: s => s.stats.stackMaxHeight >= 10 },
  { id: 'puzzle-master', name: 'パズル名人', img: `${BADGE_BASE}/math/logical-thinking/badge.webp`, desc: 'ふくごうパズルを3問ぜんぶとく', test: s => s.stats.puzzleSolved.length >= 3 },
  { id: 'drill-10', name: 'ドリル10', img: `${BADGE_BASE}/common/great-answer/badge.webp`, desc: 'たいせきドリルで10問正解する', test: s => s.stats.drillCorrect >= 10 },
  { id: 'drill-30', name: 'ドリル30', img: `${BADGE_BASE}/math/number-sense/badge.webp`, desc: 'たいせきドリルで30問正解する', test: s => s.stats.drillCorrect >= 30 },
  { id: 'drill-50', name: 'ドリル50', img: `${BADGE_BASE}/math/measurement/badge.webp`, desc: 'たいせきドリルで50問正解する', test: s => s.stats.drillCorrect >= 50 },
  { id: 'lv3-hero', name: 'Lv.3チャレンジャー', img: `${BADGE_BASE}/common/level-up/badge.webp`, desc: 'Lv.3（いろいろな底面）で正解する', test: s => (s.stats.byLevel[3] || {}).correct >= 1 },
  { id: 'retry-hero', name: 'こくふくヒーロー', img: `${BADGE_BASE}/common/keep-going/badge.webp`, desc: 'まちがえた問題を3問こくふくする', test: s => s.stats.retryCleared >= 3 },
  { id: 'lab-master', name: 'ラボマスター', img: `${BADGE_BASE}/common/clear/badge.webp`, desc: 'ずかん・パズルを制覇して、ドリル30問正解する', test: s => s.stats.zukanMorphed.length >= 5 && s.stats.puzzleSolved.length >= 3 && s.stats.drillCorrect >= 30 }
];

// ---------- 記録と移行 ----------
const LS_KEY = 'taisekiLab.v2';
const OLD_DRILL_KEY = 'taiseki-drill-v1';
const OLD_SOUND_KEY = 'taiseki-sound-enabled';

function defaultState() {
  return {
    sound: true,
    stats: {
      drillAnswered: 0,
      drillCorrect: 0,
      byLevel: { 1: { answered: 0, correct: 0 }, 2: { answered: 0, correct: 0 }, 3: { answered: 0, correct: 0 } },
      puzzleSolved: [],
      zukanMorphed: [],
      stackMaxHeight: 0,
      retryCleared: 0,
      comboBest: 0
    },
    mistakes: { drill: [], puzzle: [] },
    badges: []
  };
}

function isDrillProblem(p) {
  return p && typeof p === 'object' && typeof p.key === 'string' &&
    typeof p.baseExpression === 'string' && Number.isFinite(Number(p.answer)) &&
    Number.isFinite(Number(p.solidHeight)) && Number.isFinite(Number(p.baseArea));
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      const d = defaultState();
      d.sound = raw.sound !== false;
      if (raw.stats) {
        const s = raw.stats, t = d.stats;
        t.drillAnswered = s.drillAnswered | 0;
        t.drillCorrect = s.drillCorrect | 0;
        t.retryCleared = s.retryCleared | 0;
        t.comboBest = s.comboBest | 0;
        t.stackMaxHeight = s.stackMaxHeight | 0;
        for (const lv of [1, 2, 3]) {
          if (s.byLevel && s.byLevel[lv]) {
            t.byLevel[lv].answered = s.byLevel[lv].answered | 0;
            t.byLevel[lv].correct = s.byLevel[lv].correct | 0;
          }
        }
        t.puzzleSolved = Array.isArray(s.puzzleSolved) ? s.puzzleSolved.filter(id => PUZZLE_PROBLEMS.some(p => p.id === id)) : [];
        t.zukanMorphed = Array.isArray(s.zukanMorphed) ? s.zukanMorphed.filter(k => BASE_ORDER.includes(k)) : [];
      }
      if (raw.mistakes) {
        d.mistakes.drill = Array.isArray(raw.mistakes.drill) ? raw.mistakes.drill.filter(isDrillProblem) : [];
        d.mistakes.puzzle = Array.isArray(raw.mistakes.puzzle) ? raw.mistakes.puzzle.filter(id => PUZZLE_PROBLEMS.some(p => p.id === id)) : [];
      }
      d.badges = Array.isArray(raw.badges) ? raw.badges.filter(id => BADGES.some(b => b.id === id)) : [];
      return d;
    }
  } catch { /* 読み込み失敗時は移行・初期化へ */ }

  // 初回：旧バージョン（taiseki-drill-v1 / taiseki-sound-enabled）から引き継ぐ
  const d = defaultState();
  try {
    const oldSound = localStorage.getItem(OLD_SOUND_KEY);
    if (oldSound !== null) d.sound = oldSound !== 'false';
    const old = JSON.parse(localStorage.getItem(OLD_DRILL_KEY) || 'null');
    if (old && typeof old === 'object') {
      d.stats.drillCorrect = old.totalCorrect | 0;
      d.stats.drillAnswered = Math.max(old.shown | 0, d.stats.drillCorrect);
      d.stats.comboBest = old.combo | 0;
      if (old.weak && typeof old.weak === 'object') {
        d.mistakes.drill = Object.values(old.weak).filter(isDrillProblem);
      }
      localStorage.removeItem(OLD_DRILL_KEY);
      localStorage.removeItem(OLD_SOUND_KEY);
    }
  } catch { /* 移行できなくても新規ではじめる */ }
  return d;
}

const state = loadState();
function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* 保存できなくても続ける */ }
}
persist();

// ---------- 音 ----------
class SoundController {
  constructor() { this.context = null; this.recipes = Array.isArray(soundList) ? soundList : []; }
  play(id) {
    if (!state.sound || !this.recipes.length) return;
    const recipe = this.recipes.find(item => item.id === id);
    if (!recipe) return;
    try {
      if (!this.context) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.context = new AC();
      }
      if (this.context.state === 'suspended') this.context.resume();
      recipe.play(this.context, 0.72);
    } catch { /* 効果音の失敗で操作を止めない */ }
  }
}
const sounds = new SoundController();

// ---------- 小物 ----------
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}
function fxPop(el) {
  if (el && window.EduEffects) { try { window.EduEffects.play(el, 'edu-kinetic-pop'); } catch { /* 演出は補助 */ } }
}
function fxConfetti(el, n = 16) {
  if (el && window.EduEffects) { try { window.EduEffects.confetti(el, n); } catch { /* 演出は補助 */ } }
}
function mistakeCount() { return state.mistakes.drill.length + state.mistakes.puzzle.length; }

let toastTimer = null;
function showBadgeToast(badge) {
  document.querySelector('.badge-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'badge-toast';
  el.innerHTML = `<img src="${badge.img}" alt=""><div><b>バッジをゲット！「${escapeHtml(badge.name)}」</b><small>${escapeHtml(badge.desc)}</small></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  sounds.play('badge');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 500); }, 3400);
}
function checkBadges() {
  for (const badge of BADGES) {
    if (!state.badges.includes(badge.id) && badge.test(state)) {
      state.badges.push(badge.id);
      persist();
      showBadgeToast(badge);
    }
  }
}

// ---------- 画面共通 ----------
let screen = 'home';
function shell(content) {
  return `
  <div class="lab-app">
    <header class="app-header">
      <div class="app-header-inner">
        <button class="app-brand" data-action="home" aria-label="ホームへ">
          <span class="brand-mark">積</span>
          <span><strong>めんせき・たいせきラボ</strong><small>TT-sensei · 5〜6年生 算数</small></span>
        </button>
        <div class="header-actions">
          ${screen !== 'home' ? '<button class="header-btn" data-action="home">ホーム</button>' : ''}
          <button class="header-btn" data-action="rescue">こうしき</button>
          <button class="header-btn sound-toggle" data-action="sound" aria-pressed="${state.sound}">${state.sound ? '🔊 音 ON' : '🔇 音 OFF'}</button>
        </div>
      </div>
    </header>
    <main class="lab-main" id="main"><div class="lab-container">${content}</div></main>
    <footer class="lab-footer">TT-sensei <span>学ぶ · 挑戦する · できるようになる</span></footer>
  </div>
  <div id="rescueRoot"></div>`;
}

function render() {
  stopKeypad();
  if (screen === 'home') { root.innerHTML = shell(renderHome()); }
  else if (screen === 'zukan') { root.innerHTML = shell(renderZukan()); mountZukan(); }
  else if (screen === 'stack') { root.innerHTML = shell(renderStack()); mountStack(); }
  else if (screen === 'puzzle') { root.innerHTML = shell(renderPuzzle()); mountPuzzle(); }
  else if (screen === 'drill') { root.innerHTML = shell(renderDrill()); mountDrill(); }
  else if (screen === 'retry') { root.innerHTML = shell(renderRetry()); mountRetry(); }
  else if (screen === 'records') { root.innerHTML = shell(renderRecords()); }
  else if (screen === 'result') { root.innerHTML = shell(renderResult()); fxConfetti(root.querySelector('.result-card'), 18); }
  window.scrollTo(0, 0);
}

function go(next) {
  screen = next;
  sounds.play('page');
  render();
}

// ---------- ホーム ----------
function progressHTML(done, total, label) {
  const pct = total ? Math.round(done / total * 100) : 0;
  return `<div class="m-progress"><div class="progress-track"><div class="progress-value" style="width:${pct}%"></div></div><div class="progress-label">${label}</div></div>`;
}
function renderHome() {
  const m = mistakeCount();
  const zukanDone = state.stats.zukanMorphed.length;
  const puzzleDone = state.stats.puzzleSolved.length;
  return `
  <section class="home-hero edu-kinetic-pop">
    <img src="${NAVI_IMG.home}" alt="考えているナビキャラたち">
    <div>
      <h1>面積の公式が、<span class="hl">体積</span>につながる。</h1>
      <p>面積は「体積に入る前のふくしゅう」。底面の面積に高さをかけると体積になる――その一本の線を、4つのミッションでたどろう。</p>
      <div class="hero-tags"><span>めんせきの ふくしゅう</span><span>底面積 × 高さ ＝ 体積</span><span>たいせき本編</span></div>
    </div>
  </section>

  <div class="flow-card" aria-label="体積の考え方">
    <div class="flow-step base"><b>底面積</b><small>底面の形の面積を出す（ふくしゅうの公式が使える）</small></div>
    <div class="flow-op">×</div>
    <div class="flow-step height"><b>高さ</b><small>1cmの板を何まい積んだか</small></div>
    <div class="flow-op">＝</div>
    <div class="flow-step volume"><b>体積</b><small>立体の かさ が求まる</small></div>
  </div>

  <h2 class="section-title">めんせきの ふくしゅう <span class="tag review">ふくしゅう</span></h2>
  <p class="section-sub">体積に入る前に、面積の公式を思い出そう。公式は「なぜそうなるか」が分かると忘れないよ。</p>
  <div class="mission-grid">
    <button class="mission-btn review" data-action="go" data-screen="zukan">
      <img src="${MISSION_NAVI.zukan.img}" alt="${MISSION_NAVI.zukan.name}">
      <span class="m-body">
        <span class="m-title">こうしきずかん <span class="tag review">ふくしゅう</span>${zukanDone >= 5 ? '<span class="tag done">かんりょう</span>' : ''}</span>
        <span class="m-desc">5つの図形をへんしんさせて、面積公式の成り立ちを体感する。</span>
        <span class="m-hint">${MISSION_NAVI.zukan.name}：${MISSION_NAVI.zukan.comment}</span>
        ${progressHTML(zukanDone, 5, `へんしんさせた図形 ${zukanDone} / 5`)}
      </span>
      <span class="m-arrow">→</span>
    </button>
  </div>

  <h2 class="section-title">たいせき <span class="tag main">本編</span></h2>
  <p class="section-sub">ここからが体積の本編。積んで、割って、式を立てて、「底面積×高さ」の見方を自分のものにしよう。</p>
  <div class="mission-grid">
    <button class="mission-btn" data-action="go" data-screen="stack">
      <img src="${MISSION_NAVI.stack.img}" alt="${MISSION_NAVI.stack.name}">
      <span class="m-body">
        <span class="m-title">つみあげラボ</span>
        <span class="m-desc">底面に高さ1cmの板を積んで、「底面積×高さ＝体積」を目で確かめる。立体はドラッグで回せる。</span>
        <span class="m-hint">${MISSION_NAVI.stack.name}：${MISSION_NAVI.stack.comment}</span>
        ${progressHTML(Math.min(state.stats.stackMaxHeight, 10), 10, `いちばん高く積んだ高さ ${state.stats.stackMaxHeight}cm / 10cm`)}
      </span>
      <span class="m-arrow">→</span>
    </button>
    <button class="mission-btn" data-action="go" data-screen="puzzle">
      <img src="${MISSION_NAVI.puzzle.img}" alt="${MISSION_NAVI.puzzle.name}">
      <span class="m-body">
        <span class="m-title">ふくごうパズル</span>
        <span class="m-desc">L字・穴あき・T字の複合図形を分けて、面積の式を完成させるパズル。</span>
        <span class="m-hint">${MISSION_NAVI.puzzle.name}：${MISSION_NAVI.puzzle.comment}</span>
        ${progressHTML(puzzleDone, PUZZLE_PROBLEMS.length, `解けた問題 ${puzzleDone} / ${PUZZLE_PROBLEMS.length}`)}
      </span>
      <span class="m-arrow">→</span>
    </button>
    <button class="mission-btn" data-action="go" data-screen="drill">
      <img src="${MISSION_NAVI.drill.img}" alt="${MISSION_NAVI.drill.name}">
      <span class="m-body">
        <span class="m-title">たいせきドリル</span>
        <span class="m-desc">直方体・立方体／角柱・円柱／いろいろな底面。式を自分で立てて、体積まで求める。</span>
        <span class="m-hint">${MISSION_NAVI.drill.name}：${MISSION_NAVI.drill.comment}</span>
        ${progressHTML(Math.min(state.stats.drillCorrect, 30), 30, `ドリル正解 ${state.stats.drillCorrect}問（30問でバッジ）`)}
      </span>
      <span class="m-arrow">→</span>
    </button>
  </div>

  <h2 class="section-title">記録と再挑戦</h2>
  <div class="tool-grid">
    <button class="tool-btn" data-action="go" data-screen="retry">
      <span><b>まちがえた問題</b><small>${m ? '記録した問題に 再挑戦しよう。正解すると消えていくよ' : 'まちがえた問題は ここに たまります'}</small></span>
      <span class="count-badge ${m ? '' : 'zero'}">${m}</span>
    </button>
    <button class="tool-btn" data-action="go" data-screen="records">
      <span><b>学習の記録</b><small>ドリル正解 ${state.stats.drillCorrect}問 · パズル ${puzzleDone}/${PUZZLE_PROBLEMS.length}問 · バッジ ${state.badges.length}/${BADGES.length}こ</small></span>
    </button>
  </div>
  <div class="badge-strip" aria-label="ゲットしたバッジ">
    ${state.badges.length ? state.badges.map(id => { const b = BADGES.find(x => x.id === id); return `<img src="${b.img}" alt="${escapeHtml(b.name)}" title="${escapeHtml(b.name)}">`; }).join('') : '<span class="none">バッジは、ミッションを進めると集まります。</span>'}
  </div>
  <p class="foot-note">記録は、この端末の中にだけ保存されます。</p>`;
}

// ---------- 公式レスキュー ----------
function openRescue() {
  const rr = document.getElementById('rescueRoot');
  if (!rr) return;
  const blocks = BASE_ORDER.map(key => {
    const s = SHAPES[key];
    return `<div class="rescue-block"><h4>${escapeHtml(s.label)}（${escapeHtml(s.formula)}）</h4><ul>${s.rescueSteps.map(st => `<li>${escapeHtml(st)}</li>`).join('')}</ul></div>`;
  }).join('');
  rr.innerHTML = `
  <div class="rescue-modal" data-action="rescue-close">
    <div class="rescue-inner">
      <button class="rescue-close" data-action="rescue-close-btn" aria-label="とじる">✕</button>
      <h3>公式レスキュー</h3>
      <div class="rescue-core">体積 ＝ 底面積 × 高さ</div>
      ${blocks}
    </div>
  </div>`;
  sounds.play('bookOpen');
}
function closeRescue() {
  const rr = document.getElementById('rescueRoot');
  if (rr) rr.innerHTML = '';
}

// ---------- 数字フィールド＆画面内テンキー ----------
// タブレットで押しやすい大きなキーで、数フィールドへ入力する。
let activeField = null;
function stopKeypad() { activeField = null; }
function fieldVal(el) { return el ? (el.dataset.value || '') : ''; }
function setField(el, value) {
  if (!el) return;
  el.dataset.value = value;
  el.textContent = value;
  el.classList.remove('invalid');
}
function focusField(el) {
  document.querySelectorAll('.num-field.active').forEach(f => f.classList.remove('active'));
  activeField = el;
  if (el) {
    el.classList.add('active');
    // 値の入った欄を選んだ直後の最初の入力は、書き直しとして置き換える
    el.dataset.fresh = '1';
  }
}
function keypadHTML() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del', 'clear'];
  return `<div class="keypad" role="group" aria-label="数字キー">${keys.map(k => {
    if (k === 'del') return '<button type="button" class="kp-del" data-kp="del" aria-label="1文字消す">⌫</button>';
    if (k === 'clear') return '<button type="button" class="kp-fn" data-kp="clear">けす</button>';
    return `<button type="button" data-kp="${k}">${k}</button>`;
  }).join('')}</div>`;
}
function pressKey(k) {
  if (!activeField || activeField.classList.contains('locked')) return;
  let v = fieldVal(activeField);
  const fresh = activeField.dataset.fresh === '1';
  if (k === 'del') v = v.slice(0, -1);
  else if (k === 'clear') v = '';
  else if (k === '.') { if (fresh) v = ''; if (!v.includes('.')) v = v ? v + '.' : '0.'; }
  else if (/^\d$/.test(k)) { if (fresh) v = ''; if (v.replace('.', '').length < 7) v = (v === '0' ? k : v + k); }
  activeField.dataset.fresh = '';
  setField(activeField, v);
  sounds.play('click');
}
const OP_CYCLE = ['×', '＋', '－', '÷'];
function cycleOp(chip) {
  if (chip.classList.contains('locked')) return;
  const cur = chip.dataset.value || '';
  const next = OP_CYCLE[(OP_CYCLE.indexOf(cur) + 1) % OP_CYCLE.length];
  chip.dataset.value = next;
  chip.textContent = next;
  chip.classList.remove('invalid');
  sounds.play('click');
}

// ---------- ずかん（ふくしゅう） ----------
function renderZukan() {
  const cards = BASE_ORDER.map(key => {
    const s = SHAPES[key];
    const done = state.stats.zukanMorphed.includes(key);
    return `
    <div class="shape-card" data-shape-card="${key}">
      <div class="shape-card-head">
        <h3><span class="dot" style="background:${s.color}"></span>${escapeHtml(s.label)}</h3>
        ${done ? '<span class="tag done">へんしんずみ</span>' : ''}
      </div>
      <div class="shape-stage"></div>
      <div class="shape-actions">
        <button class="btn-morph" data-action="morph" data-key="${key}">へんしん！</button>
        <span class="formula-tag">${escapeHtml(s.formula)}</span>
      </div>
      <div class="shape-why">
        <h4>なぜ、この公式になるの？</h4>
        <ol>${s.rescueSteps.map(st => `<li>${escapeHtml(st)}</li>`).join('')}</ol>
        <span class="filled">ためし計算：${escapeHtml(s.formulaFilled)}</span>
      </div>
    </div>`;
  }).join('');
  return `
  <div class="lead-card">
    <img src="${MISSION_NAVI.zukan.img}" alt="${MISSION_NAVI.zukan.name}">
    <p>ここは「めんせきの ふくしゅう」。面積の公式を、図形をへんしんさせて確かめよう。<small>面積が出せると、体積は「底面積 × 高さ」で求められるようになるよ。</small></p>
  </div>
  <div class="shape-grid">${cards}</div>
  <div class="next-guide">
    <button class="btn-primary" data-action="go" data-screen="stack">ふくしゅうの次は、つみあげラボへ →</button>
  </div>`;
}

function mountZukan() {
  document.querySelectorAll('[data-shape-card]').forEach(card => {
    const key = card.dataset.shapeCard;
    const stage = card.querySelector('.shape-stage');
    const svg = svgEl('svg', { viewBox: '0 0 400 300' });
    stage.appendChild(svg);
    const ctrl = createMorph(svg, key);
    const btn = card.querySelector('[data-action="morph"]');
    const tag = card.querySelector('.formula-tag');
    const why = card.querySelector('.shape-why');
    let on = false;
    if (state.stats.zukanMorphed.includes(key)) {
      // 変形済みの図形は、開いたときに変形後の姿から見せる
      on = true;
      ctrl.set(true);
      btn.textContent = 'もとにもどす';
      btn.classList.add('done');
      tag.classList.add('show');
      why.classList.add('show');
    }
    btn.addEventListener('click', () => {
      on = !on;
      ctrl.set(on);
      btn.textContent = on ? 'もとにもどす' : 'へんしん！';
      btn.classList.toggle('done', on);
      tag.classList.toggle('show', on);
      why.classList.toggle('show', on);
      if (on) {
        sounds.play('sparkle');
        if (!state.stats.zukanMorphed.includes(key)) {
          state.stats.zukanMorphed.push(key);
          persist();
          checkBadges();
          const head = card.querySelector('.shape-card-head');
          if (head && !head.querySelector('.tag.done')) {
            head.insertAdjacentHTML('beforeend', '<span class="tag done">へんしんずみ</span>');
          }
        }
      } else {
        sounds.play('page');
      }
    });
  });
}

// ---------- つみあげラボ ----------
const stackState = { key: 'parallelogram', height: 1, angle: -42, sidesOn: false, sides: 24 };
function renderStack() {
  const navi = MISSION_NAVI.stack;
  const pickers = BASE_ORDER.map(key => {
    const s = SHAPES[key];
    const b = STACK_BASES[key];
    return `<button class="picker-btn ${key === stackState.key ? 'active' : ''}" data-action="stack-base" data-key="${key}"><span class="pk-swatch" style="background:${s.color}"></span><span>${escapeHtml(s.label)}<small>底面積 ${drillNumber(b.area)}cm²</small></span></button>`;
  }).join('');
  return `
  <div class="lead-card">
    <img src="${navi.img}" alt="${navi.name}">
    <p>底面をえらんで、1cmの板を積み上げよう。何まい積んだかが「高さ」だよ。<small>立体は、左右にドラッグすると見る向きを変えられます。</small></p>
  </div>
  <div class="stack-layout">
    <div class="base-picker" role="group" aria-label="底面を選ぶ">${pickers}</div>
    <section class="card stack-stage">
      <div class="solid-instruction">↔ 図を左右にドラッグすると、見る向きを変えられます</div>
      <div class="stack-canvas" id="stackCanvas"></div>
      <div class="stack-controls">
        <div class="height-ctrl">
          <span class="h-label">たかさ</span>
          <div class="height-btns">
            <button class="step-btn" data-action="stack-minus" aria-label="高さを1cm下げる">－</button>
            <span class="height-value" id="heightVal">1 cm</span>
            <button class="step-btn" data-action="stack-plus" aria-label="高さを1cm上げる">＋</button>
          </div>
          <input type="range" id="heightSlider" min="1" max="10" step="1" value="1" aria-label="高さのスライダー">
        </div>
        <div class="side-toggle-row hidden" id="sideRow">
          <label><input type="checkbox" id="sideToggle"> 角をふやして円柱に近づける</label>
          <input type="range" id="sideSlider" min="3" max="48" step="1" value="24" disabled aria-label="角の数">
          <span id="sideVal" class="progress-label">24角形</span>
        </div>
      </div>
      <div class="formula-readout" id="volumeFormula"></div>
      <div class="navi-row" style="margin-top:14px">
        <img src="${navi.img}" alt="${navi.name}">
        <p class="bubble" id="stackNaviMsg"><b>${navi.name}：</b>${navi.comment}</p>
      </div>
    </section>
  </div>`;
}

function mountStack() {
  const canvasEl = document.getElementById('stackCanvas');
  const slider = document.getElementById('heightSlider');
  const heightVal = document.getElementById('heightVal');
  const formulaEl = document.getElementById('volumeFormula');
  const sideRow = document.getElementById('sideRow');
  const sideToggle = document.getElementById('sideToggle');
  const sideSlider = document.getElementById('sideSlider');
  const sideVal = document.getElementById('sideVal');
  const naviMsg = document.getElementById('stackNaviMsg');
  canvasEl.innerHTML = '<svg class="stack-solid-svg" viewBox="0 0 420 320" role="img" aria-label="底面を積み重ねてできる柱体"></svg>';
  const svg = canvasEl.querySelector('svg');
  let dragStart = null;

  function renderStackSolid() {
    const key = stackState.key;
    const meta = SHAPES[key];
    const base = STACK_BASES[key];
    const h = stackState.height;
    const isCircle = key === 'circle';
    sideRow.classList.toggle('hidden', !isCircle);
    const circleSides = isCircle && stackState.sidesOn ? stackState.sides : 48;
    window.SolidSVG.renderPrism(svg, {
      width: 420, height: 320,
      shape: isCircle ? 'circle' : key,
      dimensions: base.dimensions,
      solidHeight: h, color: meta.color, angle: stackState.angle,
      circleSides, layers: h, baseLabel: '底面',
      dimensionsToShow: [{
        from: { x: 5.6, y: 0, z: 0 }, to: { x: 5.6, y: h, z: 0 },
        text: `高さ ${h}cm`, role: 'height', offset: -8
      }]
    });
    slider.value = String(h);
    heightVal.textContent = `${h} cm`;
    const vol = Math.round(base.area * h * 100) / 100;
    formulaEl.innerHTML = `<span class="fr-base">底面積（${base.expr} ＝ ${drillNumber(base.area)}cm²）</span> × <span class="fr-height">高さ（${h}cm）</span> ＝ <span class="fr-vol">体積 ${drillNumber(vol)}cm³</span><small>1cmの板が ${h} まい つまれているよ</small>`;
    naviMsg.innerHTML = h === 1
      ? `<b>かい：</b>まずは1cm。高さ1cmの体積は、底面積と同し数になるね。`
      : `<b>かい：</b>${h}cmまで積んだね。底面積 ${drillNumber(base.area)}cm² が ${h} まい分で、体積は ${drillNumber(vol)}cm³ だよ。`;
    if (h > state.stats.stackMaxHeight) {
      state.stats.stackMaxHeight = h;
      persist();
      checkBadges();
    }
  }

  document.querySelectorAll('[data-action="stack-base"]').forEach(btn => {
    btn.addEventListener('click', () => {
      stackState.key = btn.dataset.key;
      document.querySelectorAll('[data-action="stack-base"]').forEach(b => b.classList.toggle('active', b === btn));
      sounds.play('decide');
      renderStackSolid();
    });
  });
  document.querySelector('[data-action="stack-minus"]').addEventListener('click', () => {
    stackState.height = Math.max(1, stackState.height - 1);
    sounds.play('click');
    renderStackSolid();
  });
  document.querySelector('[data-action="stack-plus"]').addEventListener('click', () => {
    stackState.height = Math.min(10, stackState.height + 1);
    sounds.play('decide');
    renderStackSolid();
  });
  slider.addEventListener('input', () => { stackState.height = Number(slider.value); renderStackSolid(); });
  sideToggle.addEventListener('change', () => {
    stackState.sidesOn = sideToggle.checked;
    sideSlider.disabled = !sideToggle.checked;
    renderStackSolid();
  });
  sideSlider.addEventListener('input', () => {
    stackState.sides = Number(sideSlider.value);
    sideVal.textContent = `${stackState.sides}角形`;
    renderStackSolid();
  });

  svg.addEventListener('pointerdown', e => {
    dragStart = { x: e.clientX, angle: stackState.angle };
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('dragging');
  });
  svg.addEventListener('pointermove', e => {
    if (!dragStart) return;
    stackState.angle = Math.max(-72, Math.min(-18, dragStart.angle + (e.clientX - dragStart.x) * 0.22));
    renderStackSolid();
  });
  const stopDrag = e => {
    if (svg.hasPointerCapture && svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    dragStart = null;
    svg.classList.remove('dragging');
  };
  svg.addEventListener('pointerup', stopDrag);
  svg.addEventListener('pointercancel', stopDrag);

  renderStackSolid();
}

// ---------- ふくごうパズル ----------
const puzzleState = { idx: 0, split: false };
function renderPuzzle() {
  const navi = MISSION_NAVI.puzzle;
  const tabs = PUZZLE_PROBLEMS.map((p, i) => `
    <button class="puzzle-tab ${i === puzzleState.idx ? 'active' : ''}" data-action="puzzle-tab" data-idx="${i}">${i + 1}. ${escapeHtml(p.title)} ${state.stats.puzzleSolved.includes(p.id) ? '<span class="solved-mark">✓</span>' : ''}</button>`).join('');
  const allSolved = state.stats.puzzleSolved.length >= PUZZLE_PROBLEMS.length;
  return `
  <div class="lead-card">
    <img src="${navi.img}" alt="${navi.name}">
    <p>切り取り線を入れて、2つの長方形に分けよう。色に合わせて式を完成させると、面積が分かるよ。<small>数字は、下の大きなキーで入れられます。</small></p>
  </div>
  <div class="puzzle-tabs">${tabs}</div>
  <div class="puzzle-layout">
    <section class="card puzzle-figure">
      <svg id="puzzleSvg" viewBox="0 0 400 320" role="img" aria-label="複合図形"></svg>
      <div class="split-row">
        <button class="btn-secondary" id="splitBtn" data-action="puzzle-split">✂️ 切り取り線を入れる</button>
      </div>
    </section>
    <section class="card puzzle-answer">
      <div class="navi-row">
        <img src="${navi.img}" alt="${navi.name}">
        <p class="bubble" id="puzzleNaviMsg"><b>${navi.name}：</b>まずは図形に「切り取り線」を入れてみよう。</p>
      </div>
      <div id="puzzleForm" class="puzzle-form"></div>
      <div class="formula-actions">
        <button class="btn-primary" id="puzzleCheckBtn" data-action="puzzle-check" disabled>こたえあわせ</button>
      </div>
      <div id="puzzleFeedback"></div>
      ${keypadHTML()}
    </section>
  </div>
  <div id="puzzleBonus"></div>
  ${allSolved ? bonusHTML() : ''}`;
}
function bonusHTML() {
  return `<div class="bonus-panel edu-kinetic-pop"><h3>🎁 プチ発見コーナー</h3><p>柱体をななめにけずると…中学校で習う「すい体（角すい・円すい）」になるよ！体積は、もとの柱体のなんと <strong>3分の1</strong>！</p></div>`;
}

function mountPuzzle() {
  const svg = document.getElementById('puzzleSvg');
  const formEl = document.getElementById('puzzleForm');
  const checkBtn = document.getElementById('puzzleCheckBtn');
  const splitBtn = document.getElementById('splitBtn');
  const feedbackEl = document.getElementById('puzzleFeedback');
  const naviMsg = document.getElementById('puzzleNaviMsg');
  const p = PUZZLE_PROBLEMS[puzzleState.idx];
  const alreadySolved = state.stats.puzzleSolved.includes(p.id);
  puzzleState.split = false;

  function renderFigure() {
    svg.innerHTML = '';
    if (!puzzleState.split) {
      svg.appendChild(svgEl('polygon', { points: pts(p.outline), class: 'region-plain' }));
      if (p.holeOutline) svg.appendChild(svgEl('polygon', { points: pts(p.holeOutline), class: 'region-plain', fill: '#ffffff' }));
    } else {
      p.regions.forEach(r => {
        svg.appendChild(svgEl('polygon', { points: pts(r.points), class: r.key === 'red' ? 'region-red' : 'region-blue' }));
      });
      p.cutLines.forEach(c => {
        svg.appendChild(svgEl('line', { x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2, class: 'cut-line show' }));
      });
      p.labels.forEach(l => {
        const t = svgEl('text', { x: l.x, y: l.y, 'text-anchor': l.anchor || 'middle', class: 'dim-label' });
        t.textContent = l.text;
        svg.appendChild(t);
      });
    }
  }
  function fieldHTML(b) {
    const sw = b.color ? `<span class="swatch-tag" style="background:${b.color === 'red' ? 'var(--base-red)' : 'var(--height-blue)'}"></span>` : '';
    return `${sw}<button type="button" class="num-field small ${b.color ? 'c-' + b.color : ''}" data-puzzle-field="${b.id}" aria-label="${escapeHtml(b.label)}"></button>`;
  }
  function renderForm() {
    if (!puzzleState.split) {
      formEl.innerHTML = '<p style="color:var(--muted);font-weight:700;">切り取り線を入れると、式づくりの欄が出てきます。</p>';
      checkBtn.disabled = true;
      return;
    }
    const op = p.type === 'sum' ? '＋' : '－';
    const b = p.blanks;
    formEl.innerHTML = `面積 ＝ （ ${fieldHTML(b[0])} × ${fieldHTML(b[1])} ）<span class="op">${op}</span>（ ${fieldHTML(b[2])} × ${fieldHTML(b[3])} ）<br>＝ <button type="button" class="num-field small" data-puzzle-field="total" aria-label="合計の面積"></button> cm²`;
    checkBtn.disabled = false;
    const first = formEl.querySelector('.num-field');
    if (first) focusField(first);
  }

  document.querySelectorAll('[data-action="puzzle-tab"]').forEach(tab => {
    tab.addEventListener('click', () => {
      puzzleState.idx = Number(tab.dataset.idx);
      sounds.play('decide');
      render();
    });
  });
  splitBtn.addEventListener('click', () => {
    puzzleState.split = true;
    splitBtn.disabled = true;
    naviMsg.innerHTML = `<b>なみ：</b>2つの長方形に分かれたね。色に合わせて、たてとよこの長さを図から読み取ろう。`;
    sounds.play('decide');
    renderFigure();
    renderForm();
  });
  checkBtn.addEventListener('click', () => {
    const defs = [...p.blanks, { id: 'total', color: null, label: '合計', answer: p.totalAnswer }];
    let firstWrong = null;
    formEl.querySelectorAll('[data-puzzle-field]').forEach(f => {
      const def = defs.find(d => d.id === f.dataset.puzzleField);
      const v = parseFloat(fieldVal(f));
      const bad = Number.isNaN(v) || Math.abs(v - def.answer) > 0.01;
      f.classList.toggle('invalid', bad);
      if (bad && !firstWrong) firstWrong = def;
    });
    if (firstWrong) {
      if (!state.mistakes.puzzle.includes(p.id)) {
        state.mistakes.puzzle.push(p.id);
        persist();
      }
      const colorText = firstWrong.color === 'red' ? '赤色' : (firstWrong.color === 'blue' ? '青色' : '');
      feedbackEl.innerHTML = `<div class="feedback ng">${colorText ? `おしい！${colorText}の長方形の「${escapeHtml(firstWrong.label.replace(/^(赤|青|大|あなの)/, ''))}」を、図の中でもういちど見てみよう。` : '計算をもういちど見直してみよう。かけ算の答えは合っているかな？'} まちがえた問題に記録したよ。あとから再挑戦できます。</div>`;
      naviMsg.innerHTML = `<b>なみ：</b>だいじょうぶ、図と見比べれば必ず見つかるよ。`;
      sounds.play('wrong');
      return;
    }
    feedbackEl.innerHTML = `<div class="feedback ok">せいかい！ 色あわせがバッチリできたね。面積は ${p.totalAnswer}cm² です。</div>`;
    naviMsg.innerHTML = `<b>なみ：</b>すごい！ 分けて考える力がついてきたね。`;
    sounds.play('correct');
    fxConfetti(formEl, 12);
    if (!state.stats.puzzleSolved.includes(p.id)) {
      state.stats.puzzleSolved.push(p.id);
    }
    state.mistakes.puzzle = state.mistakes.puzzle.filter(id => id !== p.id);
    persist();
    checkBadges();
    if (state.stats.puzzleSolved.length >= PUZZLE_PROBLEMS.length && !document.querySelector('.bonus-panel')) {
      document.getElementById('puzzleBonus').innerHTML = bonusHTML();
    }
  });

  if (alreadySolved) {
    naviMsg.innerHTML = `<b>なみ：</b>この問題は解けたよ。もう一度、自分の力で確かめてみよう。`;
  }
  renderFigure();
  renderForm();
}

// ---------- たいせきドリル ----------
const drill = {
  level: 1, mode: 'normal',
  problem: null, hintLevel: 0, answered: false, counted: false, scored: false,
  combo: 0, shownCount: 0,
  retryQueue: [], retryTotal: 0, retryClearedNow: 0
};
let resultData = null;

function renderDrill() {
  const navi = MISSION_NAVI.drill;
  const inRetry = drill.mode === 'retry';
  const levels = [1, 2, 3].map(lv => `
    <button class="level-btn ${drill.level === lv ? 'active' : ''}" data-action="drill-level" data-level="${lv}"><b>Lv.${lv}</b><span>${['直方体・立方体', '角柱・円柱', 'いろいろな底面'][lv - 1]}</span></button>`).join('');
  return `
  ${inRetry ? `
  <div class="lead-card">
    <img src="${NAVI_IMG.retryPose}" alt="再挑戦を応援するさく" style="height:76px">
    <p>まちがえた問題への再挑戦中。<small>正解すると、記録から1問ずつ消えていくよ（こくふく）。</small></p>
  </div>` : `
  <div class="level-grid" role="group" aria-label="レベルを選ぶ">${levels}</div>
  <div class="drill-stats">
    <span class="stat-chip">正解 <b id="drillCorrectCount">${state.stats.drillCorrect}</b>問</span>
    <span class="stat-chip ${drill.combo >= 2 ? 'combo' : 'hidden'}" id="comboChip">🔥 <b id="comboCount">${drill.combo}</b>コンボ！</span>
    <span class="stat-chip">まちがえた問題 <b>${state.mistakes.drill.length}</b>問</span>
  </div>`}
  <div class="drill-layout">
    <section class="card drill-visual">
      <svg id="drillSvg" class="drill-svg" viewBox="0 0 360 280" role="img" aria-label="体積を求める立体"></svg>
      <div><span class="role-legend"><span class="role-base">■ 底面積</span><span class="role-height">■ 高さ</span></span></div>
      <div class="navi-row tall">
        <img id="drillNaviImg" src="${NAVI_BASE}/characters/kai/fullbody/thinking.webp" alt="考えるかい">
        <p class="bubble" id="drillNaviMsg"><b>かい：</b>赤い底面の式を先につくろう。</p>
      </div>
    </section>
    <section class="card drill-answer">
      <div class="drill-head">
        <span class="tag main" id="drillLevelTag">Lv.${drill.level}</span>
        ${inRetry ? '<span class="tag review">再挑戦</span>' : ''}
        <span class="q-num" id="drillQNum"></span>
      </div>
      <span class="solid-name" id="drillSolidName"></span>
      <h2 id="drillQText"></h2>
      <div class="role-cards">
        <div class="role-card base-card"><small>① 赤い底面の式</small><strong id="baseRoleText">図の数を使って式をつくる</strong></div>
        <div class="role-card height-card"><small>② 青い高さ</small><strong id="heightRoleText">？ cm</strong></div>
      </div>
      <div class="formula-box">
        <div class="formula-box-head"><b>体積を表す式と答え</b><span class="attempt-note">まずは1回、自分で挑戦</span></div>
        <p class="formula-help">数をタップして下のキーで入れて、演算子（しかく）はタップで切り替えます。</p>
        <div class="formula-line" aria-label="体積の式">
          <span class="f-label">底面：</span>
          <span id="drillBaseBuilder" style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:2px"></span>
          <button type="button" class="op-chip" id="drillVolumeOp" data-op aria-label="底面積と高さの演算子"></button>
          <button type="button" class="num-field" id="drillHeightField" aria-label="高さの数"></button>
          <span class="f-eq">＝</span>
          <button type="button" class="num-field" id="drillVolumeField" aria-label="体積の答え"></button>
          <span class="f-unit">cm³</span>
        </div>
        ${keypadHTML()}
        <div class="formula-actions">
          <button class="btn-secondary" id="drillHintBtn" data-action="drill-hint">ヒントを1つ見る</button>
          <button class="btn-primary" id="drillCheckBtn" data-action="drill-check">式と答えをたしかめる</button>
          <button class="btn-primary hidden" id="drillNextBtn" data-action="drill-next">つぎの問題 ▶</button>
        </div>
      </div>
      <div id="drillFeedback"></div>
      <div id="drillHint" class="hint-box hidden"></div>
      <div id="drillSkip" class="skip-panel hidden">
        <p>一度考えたね。計算がむずかしいときは、ナビに答えを聞けます。</p>
        <button class="btn-secondary" data-action="drill-skip" style="width:100%">🧮 計算をスキップして、答えを聞く</button>
      </div>
      <div id="drillReveal" class="answer-reveal hidden"><small>ナビが教えてくれた答え</small><strong id="drillRevealText"></strong></div>
    </section>
  </div>
  <p class="foot-note" style="display:none">${escapeHtml(navi.name)}</p>`;
}

// --- 式の解析（旧 step3.js の検証ロジックを移植） ---
function normalizeFormula(raw) {
  return String(raw || '')
    .trim()
    .replace(/[０-９．]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[×✕xX＊]/g, '*')
    .replace(/[÷／]/g, '/')
    .replace(/[＋]/g, '+')
    .replace(/[−－]/g, '-')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/\s+/g, '');
}
function parseFormula(raw) {
  const source = normalizeFormula(raw);
  if (!source || /[^0-9.+*/()\-]/.test(source)) return null;
  const tokens = [];
  const numbers = [];
  const canonical = v => { const n = Number(v); return Number.isFinite(n) ? String(n) : ''; };
  for (let i = 0; i < source.length;) {
    const m = source.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
    if (m) {
      const value = Number(m[0]);
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: 'number', value });
      numbers.push(canonical(value));
      i += m[0].length;
      continue;
    }
    const ch = source[i];
    if ('+-*/()'.includes(ch)) { tokens.push({ type: ch }); i += 1; continue; }
    return null;
  }
  let pos = 0;
  function parseExpression() {
    let v = parseTerm();
    while (v !== null && pos < tokens.length && (tokens[pos].type === '+' || tokens[pos].type === '-')) {
      const op = tokens[pos].type; pos += 1;
      const r = parseTerm();
      if (r === null) return null;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    while (v !== null && pos < tokens.length && (tokens[pos].type === '*' || tokens[pos].type === '/')) {
      const op = tokens[pos].type; pos += 1;
      const r = parseFactor();
      if (r === null || (op === '/' && r === 0)) return null;
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function parseFactor() {
    const t = tokens[pos];
    if (!t) return null;
    if (t.type === 'number') { pos += 1; return t.value; }
    if (t.type === '(') {
      pos += 1;
      const v = parseExpression();
      if (v === null || !tokens[pos] || tokens[pos].type !== ')') return null;
      pos += 1;
      return v;
    }
    return null;
  }
  const value = parseExpression();
  if (value === null || pos !== tokens.length || !Number.isFinite(value)) return null;
  return { value, numbers };
}
function usesRequiredNumbers(numbers, problem) {
  const expected = problem.formulaNumbers.map(v => String(Number(v))).sort();
  const actual = numbers.slice().sort();
  return expected.length === actual.length && expected.every((v, i) => v === actual[i]);
}
function displayFormula(raw) {
  return String(raw).replace(/[xX*]/g, '×').replace(/\//g, '÷').replace(/\+/g, '＋').replace(/-/g, '－');
}
function baseWithBrackets(raw) {
  const shown = displayFormula(raw);
  return /^[（(].*[）)]$/.test(shown) ? shown : `（${shown}）`;
}

// --- ドリルの描画 ---
function drillBaseWidth(p) {
  const d = p.dimensions;
  return d.base || d.bottom || d.diagonal1 || d.width || d.side || (d.radius ? d.radius * 2 : 7);
}
function drillBaseDepth(p) {
  const d = p.dimensions;
  return d.triangleHeight || d.baseHeight || d.diagonal2 || d.depth || d.side || (d.radius ? d.radius * 2 : 5);
}
function renderDrillDiagram(p) {
  const svg = document.getElementById('drillSvg');
  if (!svg) return;
  const d = p.dimensions;
  const anchor = drillBaseWidth(p) / 2 + 1.5;
  const dimensionsToShow = [{
    from: { x: anchor, y: 0, z: 0 }, to: { x: anchor, y: p.solidHeight, z: 0 },
    text: `高さ ${p.solidHeight}cm`, role: 'height', offset: -7
  }];
  const internalLines = [];
  if (p.shape === 'circle') {
    dimensionsToShow.push({ from: { x: 0, y: 0, z: 0 }, to: { x: d.radius, y: 0, z: 0 }, text: `半径 ${d.radius}cm`, role: 'base', offset: 10 });
    internalLines.push({ from: { x: 0, y: 0, z: 0 }, to: { x: d.radius, y: 0, z: 0 }, role: 'base' });
  } else if (p.shape === 'square') {
    dimensionsToShow.push({ from: { x: -d.side / 2, y: 0, z: d.side / 2 }, to: { x: d.side / 2, y: 0, z: d.side / 2 }, text: `一辺 ${d.side}cm`, role: 'base', offset: 13 });
  } else if (p.shape === 'rectangle') {
    dimensionsToShow.push(
      { from: { x: -d.width / 2, y: 0, z: d.depth / 2 }, to: { x: d.width / 2, y: 0, z: d.depth / 2 }, text: `横 ${d.width}cm`, role: 'base', offset: 13 },
      { from: { x: -d.width / 2, y: 0, z: -d.depth / 2 }, to: { x: -d.width / 2, y: 0, z: d.depth / 2 }, text: `たて ${d.depth}cm`, role: 'base', offset: -13 }
    );
  } else {
    const text = p.shape === 'triangle' ? `底辺 ${d.base}cm`
      : p.shape === 'parallelogram' ? `底辺 ${d.base}cm`
      : p.shape === 'trapezoid' ? `下底 ${d.bottom}cm` : `対角線 ${d.diagonal1}cm・${d.diagonal2}cm`;
    dimensionsToShow.push({ from: { x: -drillBaseWidth(p) / 2, y: 0, z: drillBaseDepth(p) / 2 }, to: { x: drillBaseWidth(p) / 2, y: 0, z: drillBaseDepth(p) / 2 }, text, role: 'base', offset: 13 });
    if (p.shape === 'triangle' || p.shape === 'parallelogram' || p.shape === 'trapezoid') {
      internalLines.push({ from: { x: 0, y: 0, z: -drillBaseDepth(p) / 2 }, to: { x: 0, y: 0, z: drillBaseDepth(p) / 2 }, role: 'base' });
    }
  }
  window.SolidSVG.renderPrism(svg, {
    width: 360, height: 280, shape: p.shape, dimensions: d, solidHeight: p.solidHeight,
    color: '#63bdb7', baseColor: '#ff5d5d', angle: -42,
    dimensionsToShow, internalLines, baseLabel: '底面'
  });
}

function setDrillNavi(mood, message) {
  const img = document.getElementById('drillNaviImg');
  const msg = document.getElementById('drillNaviMsg');
  if (!img || !msg) return;
  const choices = NAVI_CUES[mood] || NAVI_CUES.thinking;
  const choice = choices[(drill.shownCount + drill.hintLevel) % choices.length];
  img.src = `${NAVI_BASE}/characters/${choice.image}`;
  img.alt = choice.name;
  msg.innerHTML = `<b>${choice.name}：</b>${escapeHtml(message)}`;
}

function buildBaseBuilder(p) {
  const builder = document.getElementById('drillBaseBuilder');
  builder.innerHTML = '';
  const tokens = String(p.baseExpression || '').match(/\d+(?:\.\d+)?|[×＋－−÷()（）]/g) || [];
  tokens.forEach(tok => {
    if (/^\d/.test(tok)) {
      const f = document.createElement('button');
      f.type = 'button';
      f.className = 'num-field';
      f.dataset.baseNum = '1';
      f.setAttribute('aria-label', '底面の数');
      builder.appendChild(f);
    } else if ('×＋－−÷'.includes(tok)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'op-chip';
      chip.dataset.baseOp = '1';
      chip.setAttribute('aria-label', '底面の演算子');
      builder.appendChild(chip);
    } else {
      const span = document.createElement('span');
      span.className = 'formula-static';
      span.dataset.baseStatic = tok === '(' ? '(' : ')';
      span.textContent = tok === '(' ? '（' : '）';
      builder.appendChild(span);
    }
  });
}
function collectBaseExpression() {
  const builder = document.getElementById('drillBaseBuilder');
  return [...builder.querySelectorAll('[data-base-num],[data-base-op],[data-base-static]')].map(el => {
    if (el.dataset.baseStatic) return el.dataset.baseStatic;
    return el.dataset.value || '';
  }).join('');
}
function lockDrillInputs(lock) {
  document.querySelectorAll('#drillBaseBuilder .num-field, #drillBaseBuilder .op-chip, #drillVolumeOp, #drillHeightField, #drillVolumeField')
    .forEach(el => el.classList.toggle('locked', lock));
}

function mountDrill() {
  document.querySelectorAll('[data-action="drill-level"]').forEach(btn => {
    btn.addEventListener('click', () => {
      drill.level = Number(btn.dataset.level);
      drill.combo = 0;
      drill.problem = null;
      sounds.play('decide');
      render();
    });
  });
  nextDrillProblem();
}

function nextDrillProblem() {
  drill.hintLevel = 0;
  drill.answered = false;
  drill.counted = false;
  drill.scored = false;
  if (drill.mode === 'retry') {
    if (!drill.retryQueue.length) { finishRetrySession(); return; }
    drill.problem = drill.retryQueue[0];
  } else {
    drill.problem = makeDrillProblem(drill.level);
  }
  drill.shownCount += 1;
  const p = drill.problem;
  document.getElementById('drillLevelTag').textContent = `Lv.${p.level}`;
  document.getElementById('drillQNum').textContent = drill.mode === 'retry'
    ? `再挑戦 ${drill.retryTotal - drill.retryQueue.length + 1} / ${drill.retryTotal}問`
    : `${drill.shownCount}問目`;
  document.getElementById('drillSolidName').textContent = p.solidName;
  document.getElementById('drillQText').innerHTML = `${escapeHtml(p.questionText)}<br><strong>体積の式と答えを入れましょう。</strong><small>まずは1回、自分で計算してみよう。</small>`;
  document.getElementById('baseRoleText').textContent = '図の数を使って式をつくる';
  document.getElementById('heightRoleText').textContent = `${drillNumber(p.solidHeight)} cm`;
  document.getElementById('drillFeedback').innerHTML = '';
  document.getElementById('drillHint').classList.add('hidden');
  document.getElementById('drillSkip').classList.add('hidden');
  document.getElementById('drillReveal').classList.add('hidden');
  document.getElementById('drillCheckBtn').classList.remove('hidden');
  document.getElementById('drillNextBtn').classList.add('hidden');
  const hintBtn = document.getElementById('drillHintBtn');
  hintBtn.classList.remove('hidden');
  hintBtn.disabled = false;
  hintBtn.textContent = 'ヒントを1つ見る';
  buildBaseBuilder(p);
  const heightField = document.getElementById('drillHeightField');
  const volumeField = document.getElementById('drillVolumeField');
  setField(heightField, '');
  setField(volumeField, '');
  const op = document.getElementById('drillVolumeOp');
  op.dataset.value = '';
  op.textContent = '';
  op.classList.remove('invalid');
  renderDrillDiagram(p);
  setDrillNavi('thinking', 'まずは赤い底面の式と、体積の答えに挑戦してみよう。');
  const first = document.querySelector('#drillBaseBuilder .num-field');
  if (first) focusField(first);
}

function drillFeedback(html, ok) {
  document.getElementById('drillFeedback').innerHTML = `<div class="feedback ${ok ? 'ok' : 'ng'}">${html}</div>`;
}
function recordDrillMistake(p) {
  if (!state.mistakes.drill.some(x => x.key === p.key)) {
    state.mistakes.drill.push(p);
    persist();
  }
}
function countFirstCheck() {
  if (drill.counted) return;
  drill.counted = true;
  if (drill.mode === 'normal') {
    state.stats.drillAnswered += 1;
    state.stats.byLevel[drill.problem.level].answered += 1;
    persist();
  }
}
function showDrillHint() {
  const p = drill.problem;
  if (!p || drill.hintLevel >= p.hints.length) return;
  drill.hintLevel += 1;
  const box = document.getElementById('drillHint');
  box.classList.remove('hidden');
  box.innerHTML = `<small>ヒント ${drill.hintLevel}</small><p>${escapeHtml(p.hints[drill.hintLevel - 1])}</p>`;
  if (drill.hintLevel >= 2) document.getElementById('baseRoleText').textContent = `「${p.baseFormula}」を使う`;
  const btn = document.getElementById('drillHintBtn');
  if (drill.hintLevel >= p.hints.length) { btn.textContent = 'ヒントは全部見たよ'; btn.disabled = true; }
  else btn.textContent = 'ヒントをもう1つ見る';
  setDrillNavi('hint', '公式を見ながら、図の数を順に入れてみよう。');
  sounds.play('hint');
}
function drillIssue(message, naviText, invalidEls) {
  countFirstCheck();
  drill.combo = 0;
  if (drill.mode === 'normal') recordDrillMistake(drill.problem);
  (invalidEls || []).forEach(el => { if (el) el.classList.add('invalid'); });
  drillFeedback(`${escapeHtml(message)}${drill.mode === 'normal' ? ' まちがえた問題に記録したよ。' : ''}`, false);
  document.getElementById('drillSkip').classList.remove('hidden');
  if (drill.hintLevel === 0) showDrillHint();
  setDrillNavi('retry', naviText);
  sounds.play('wrong');
  updateComboChip();
}
function updateComboChip() {
  const chip = document.getElementById('comboChip');
  if (!chip) return;
  chip.classList.toggle('hidden', drill.combo < 2);
  const c = document.getElementById('comboCount');
  if (c) c.textContent = drill.combo;
  const cc = document.getElementById('drillCorrectCount');
  if (cc) cc.textContent = state.stats.drillCorrect;
}
function finishDrillCorrect(baseRaw, heightRaw, volumeRaw) {
  const p = drill.problem;
  drill.answered = true;
  countFirstCheck();
  const wasMistake = state.mistakes.drill.some(x => x.key === p.key);
  let overcomeNote = '';
  if (drill.mode === 'retry') {
    state.mistakes.drill = state.mistakes.drill.filter(x => x.key !== p.key);
    drill.retryQueue.shift();
    drill.retryClearedNow += 1;
    state.stats.retryCleared += 1;
    overcomeNote = ' こくふくできたね！';
  } else {
    if (!drill.scored) {
      drill.scored = true;
      state.stats.drillCorrect += 1;
      state.stats.byLevel[p.level].correct += 1;
    }
    if (wasMistake) {
      state.mistakes.drill = state.mistakes.drill.filter(x => x.key !== p.key);
      state.stats.retryCleared += 1;
      overcomeNote = ' 前にまちがえた問題も、こくふくできたね！';
    }
  }
  drill.combo += 1;
  if (drill.combo > state.stats.comboBest) state.stats.comboBest = drill.combo;
  persist();
  checkBadges();
  const shownBase = baseWithBrackets(baseRaw);
  drillFeedback(`せいかい！${drill.combo >= 2 ? ` ${drill.combo}コンボ！` : ''} ${shownBase} × ${heightRaw} ＝ ${volumeRaw} cm³。${overcomeNote}`, true);
  document.getElementById('baseRoleText').textContent = shownBase;
  document.getElementById('heightRoleText').textContent = `${heightRaw} cm`;
  lockDrillInputs(true);
  document.getElementById('drillCheckBtn').classList.add('hidden');
  document.getElementById('drillSkip').classList.add('hidden');
  document.getElementById('drillHintBtn').classList.add('hidden');
  const nextBtn = document.getElementById('drillNextBtn');
  nextBtn.classList.remove('hidden');
  nextBtn.textContent = (drill.mode === 'retry' && !drill.retryQueue.length) ? '結果を見る ▶' : 'つぎの問題 ▶';
  setDrillNavi('correct', '式も答えもばっちり！ 計算できたね。');
  sounds.play(drill.combo === 3 ? 'combo3' : drill.combo === 5 ? 'combo5' : 'correct');
  fxConfetti(document.getElementById('drillSvg'), 10);
  updateComboChip();
}
function checkDrillAnswer() {
  const p = drill.problem;
  if (!p || drill.answered) return;
  const baseRaw = collectBaseExpression();
  const opEl = document.getElementById('drillVolumeOp');
  const heightEl = document.getElementById('drillHeightField');
  const volumeEl = document.getElementById('drillVolumeField');
  const heightRaw = fieldVal(heightEl);
  const volumeRaw = fieldVal(volumeEl);
  document.querySelectorAll('#drillBaseBuilder .num-field, #drillBaseBuilder .op-chip').forEach(el => el.classList.remove('invalid'));

  if (!baseRaw || !opEl.dataset.value || !heightRaw || !volumeRaw) {
    drillFeedback('式の数・演算子・高さ・答えを入れて、1回挑戦してみよう。', false);
    if (!baseRaw) document.querySelectorAll('#drillBaseBuilder .num-field, #drillBaseBuilder .op-chip').forEach(el => el.classList.add('invalid'));
    if (!opEl.dataset.value) opEl.classList.add('invalid');
    if (!heightRaw) heightEl.classList.add('invalid');
    if (!volumeRaw) volumeEl.classList.add('invalid');
    document.getElementById('drillSkip').classList.remove('hidden');
    setDrillNavi('retry', '一度入力してみたね。わからないときは、ぼくに聞いてね。');
    sounds.play('wrong');
    return;
  }
  if (opEl.dataset.value !== '×') {
    drillIssue('底面積と高さは「×」でつなごう。', '底面積と高さは、かけ算でつなぐよ。', [opEl]);
    return;
  }
  const parsedBase = parseFormula(baseRaw);
  if (!parsedBase || !usesRequiredNumbers(parsedBase.numbers, p)) {
    drillIssue('赤い底面には、図にある数と演算子を使って式を入れよう。', '図の赤い底面だけを見て、使う数と演算子を確かめよう。',
      [...document.querySelectorAll('#drillBaseBuilder .num-field, #drillBaseBuilder .op-chip')]);
    return;
  }
  if (Math.abs(parsedBase.value - p.baseArea) > DRILL_ROUNDING.tolerance) {
    drillIssue('赤い底面の公式を見直してみよう。', 'かける数・足す数・÷2 が合っているかを見直そう。',
      [...document.querySelectorAll('#drillBaseBuilder .num-field, #drillBaseBuilder .op-chip')]);
    return;
  }
  if (!/^\d+(?:\.\d+)?$/.test(heightRaw) || Math.abs(Number(heightRaw) - p.solidHeight) > DRILL_ROUNDING.tolerance) {
    drillIssue('青い高さの数を、立体のたて向きの長さから入れよう。', '青い「高さ」の数を、図からもう一度見つけよう。', [heightEl]);
    return;
  }
  if (!/^\d+(?:\.\d+)?$/.test(volumeRaw) || Math.abs(Number(volumeRaw) - p.answer) > DRILL_ROUNDING.tolerance) {
    drillIssue('体積の答えをもう一度計算してみよう。わからなければ、ナビに聞いて大丈夫。', '答えの計算がむずかしければ、ぼくに聞いてね。', [volumeEl]);
    return;
  }
  finishDrillCorrect(baseRaw, heightRaw, volumeRaw);
}
function revealDrillAnswer() {
  const p = drill.problem;
  if (!p || drill.answered) return;
  drill.answered = true;
  countFirstCheck();
  drill.combo = 0;
  if (drill.mode === 'normal') recordDrillMistake(p);
  const expression = `${baseWithBrackets(p.baseExpression)} × ${drillNumber(p.solidHeight)}`;
  document.getElementById('drillRevealText').textContent = `${expression} ＝ ${drillNumber(p.answer)} cm³`;
  document.getElementById('drillReveal').classList.remove('hidden');
  document.getElementById('drillSkip').classList.add('hidden');
  drillFeedback('ナビが答えを教えてくれたよ。式の形を写して、次の問題で使ってみよう。', false);
  document.getElementById('baseRoleText').textContent = baseWithBrackets(p.baseExpression);
  document.getElementById('heightRoleText').textContent = `${drillNumber(p.solidHeight)} cm`;
  lockDrillInputs(true);
  document.getElementById('drillCheckBtn').classList.add('hidden');
  document.getElementById('drillHintBtn').classList.add('hidden');
  const nextBtn = document.getElementById('drillNextBtn');
  nextBtn.classList.remove('hidden');
  if (drill.mode === 'retry') {
    // 答えを聞いた問題は記録に残したまま、次へ進む
    drill.retryQueue.shift();
    nextBtn.textContent = !drill.retryQueue.length ? '結果を見る ▶' : 'つぎの問題 ▶';
  }
  setDrillNavi('answer', `答えは ${drillNumber(p.answer)}cm³。式はこの形だよ。`);
  sounds.play('answer');
  updateComboChip();
}
function finishRetrySession() {
  const cleared = drill.retryClearedNow;
  const total = drill.retryTotal;
  drill.mode = 'normal';
  drill.problem = null;
  resultData = {
    title: cleared >= total ? 'ぜんぶ こくふく！' : '再挑戦、おつかれさま！',
    pose: cleared >= total ? NAVI_IMG.correctPose : NAVI_IMG.retryPose,
    message: cleared >= total
      ? 'まちがえた問題を全部解き直せたね。「底面積 × 高さ」の見方が強くなったよ。'
      : '答えを聞いた問題は記録に残っているよ。また今度、挑戦しよう。',
    nums: [[`${cleared}問`, 'こくふく'], [`${total - cleared}問`, 'のこり'], [`${mistakeCount()}件`, '記録ぜんぶ']],
    backScreen: 'home'
  };
  sounds.play(cleared >= total ? 'allclear' : 'clear');
  screen = 'result';
  render();
}

// ---------- 再挑戦 ----------
function renderRetry() {
  const dList = state.mistakes.drill;
  const pList = state.mistakes.puzzle;
  if (!dList.length && !pList.length) {
    return `
    <section class="card result-card edu-kinetic-pop">
      <img class="pose" src="${NAVI_IMG.retryPose}" alt="応援するさく">
      <h2>まちがえた問題は ありません</h2>
      <p>ドリルやパズルでまちがえた問題は、ここに記録されます。<br>記録がたまったら、ここへ再挑戦しに来てね。</p>
      <button class="btn-primary" data-action="go" data-screen="drill">たいせきドリルへ →</button>
    </section>`;
  }
  const drillItems = dList.map(p => `
    <div class="retry-item">
      <span><b>${escapeHtml(p.solidName)}（Lv.${p.level}）</b><small>底面の式：${escapeHtml(p.baseExpression)}、高さ ${drillNumber(p.solidHeight)}cm</small></span>
      <span class="go">ドリル</span>
    </div>`).join('');
  const puzzleItems = pList.map(id => {
    const p = PUZZLE_PROBLEMS.find(x => x.id === id);
    const idx = PUZZLE_PROBLEMS.indexOf(p);
    return `<button class="retry-item" data-action="retry-puzzle" data-idx="${idx}"><span><b>ふくごうパズル：${escapeHtml(p.title)}</b><small>パズルの画面で、もう一度挑戦しよう</small></span><span class="go">開く →</span></button>`;
  }).join('');
  return `
  <h2 class="section-title">まちがえた問題 <span class="count-badge ${mistakeCount() ? '' : 'zero'}" style="min-width:44px;height:44px;font-size:1.1rem">${mistakeCount()}</span></h2>
  <p class="section-sub">正解すると、記録から消えていきます（こくふく）。</p>
  ${dList.length ? `
  <h3 style="margin:18px 0 10px">たいせきドリル（${dList.length}問）</h3>
  ${drillItems}
  <button class="btn-primary" data-action="retry-drill-start" style="width:100%">ドリルの再挑戦をはじめる</button>` : ''}
  ${pList.length ? `
  <h3 style="margin:22px 0 10px">ふくごうパズル（${pList.length}問）</h3>
  ${puzzleItems}` : ''}`;
}
function mountRetry() { /* 一覧は data-action の委譲で処理する */ }

// ---------- 学習の記録 ----------
function renderRecords() {
  const s = state.stats;
  const acc = s.drillAnswered ? Math.round(s.drillCorrect / s.drillAnswered * 100) : null;
  const badgeCells = BADGES.map(b => {
    const got = state.badges.includes(b.id);
    return `<div class="badge-cell ${got ? '' : 'locked'}"><img src="${b.img}" alt=""><b>${escapeHtml(b.name)}</b><small>${escapeHtml(b.desc)}</small></div>`;
  }).join('');
  return `
  <h2 class="section-title">学習の記録</h2>
  <div class="records-grid">
    <section class="card record-card">
      <h3>📐 めんせきの ふくしゅう</h3>
      <p><span class="big-num">${s.zukanMorphed.length}</span> / 5 図形</p>
      <p>公式ずかんで変形させた図形の数。全部変形させると、公式の理由がそろいます。</p>
    </section>
    <section class="card record-card">
      <h3>🧱 つみあげラボ</h3>
      <p><span class="big-num">${s.stackMaxHeight}</span> cm</p>
      <p>いちばん高く積んだ高さ。底面積 × 高さ の関係を、目で確かめた記録です。</p>
    </section>
    <section class="card record-card">
      <h3>🧩 ふくごうパズル</h3>
      <p><span class="big-num">${s.puzzleSolved.length}</span> / ${PUZZLE_PROBLEMS.length} 問</p>
      <p>解けた問題：${s.puzzleSolved.length ? s.puzzleSolved.map(id => escapeHtml(PUZZLE_PROBLEMS.find(p => p.id === id).title)).join('、') : 'まだありません'}</p>
    </section>
    <section class="card record-card">
      <h3>✏️ たいせきドリル</h3>
      <p><span class="big-num">${s.drillCorrect}</span> 問 正解</p>
      <p>挑戦した問題 ${s.drillAnswered}問${acc !== null ? ` · 正答率 ${acc}%` : ''}<br>Lv.1：${s.byLevel[1].correct}問 ／ Lv.2：${s.byLevel[2].correct}問 ／ Lv.3：${s.byLevel[3].correct}問<br>最高コンボ ${s.comboBest} · こくふく ${s.retryCleared}問</p>
    </section>
    <section class="card record-card">
      <h3>🔁 まちがえた問題</h3>
      <p>のこり <span class="big-num">${mistakeCount()}</span> 件</p>
      <p>ドリル ${state.mistakes.drill.length}問 · パズル ${state.mistakes.puzzle.length}問。再挑戦で正解すると消えます。</p>
      <button class="btn-secondary" data-action="go" data-screen="retry">再挑戦の画面へ</button>
    </section>
  </div>
  <h2 class="section-title">バッジコレクション <span class="tag main">${state.badges.length} / ${BADGES.length}</span></h2>
  <div class="badge-grid">${badgeCells}</div>
  <p class="foot-note">記録は、この端末の中にだけ保存されます。旧バージョンのドリル記録は、初回起動時に引き継ぎました。</p>`;
}

// ---------- 結果 ----------
function renderResult() {
  const r = resultData || { title: 'おつかれさま！', pose: NAVI_IMG.correctPose, message: '', nums: [], backScreen: 'home' };
  return `
  <section class="card result-card">
    <img class="pose" src="${r.pose}" alt="">
    <h2>${escapeHtml(r.title)}</h2>
    <p>${escapeHtml(r.message)}</p>
    <div class="result-nums">${r.nums.map(([n, l]) => `<div class="rn"><b>${escapeHtml(n)}</b><small>${escapeHtml(l)}</small></div>`).join('')}</div>
    <button class="btn-primary" data-action="go" data-screen="${r.backScreen}">ホームへもどる</button>
  </section>`;
}

// ---------- 全体のイベント ----------
root.addEventListener('click', e => {
  const field = e.target.closest('.num-field');
  if (field && !field.classList.contains('locked')) { focusField(field); return; }
  const kp = e.target.closest('[data-kp]');
  if (kp) { pressKey(kp.dataset.kp); return; }
  const op = e.target.closest('.op-chip');
  if (op) { cycleOp(op); return; }

  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;
  if (action === 'home') { drill.mode = 'normal'; go('home'); }
  else if (action === 'go') { if (t.dataset.screen === 'drill') drill.mode = 'normal'; go(t.dataset.screen); }
  else if (action === 'sound') {
    state.sound = !state.sound;
    persist();
    render();
    if (state.sound) sounds.play('decide');
  }
  else if (action === 'rescue') openRescue();
  else if (action === 'rescue-close-btn') closeRescue();
  else if (action === 'rescue-close' && e.target === t) closeRescue();
  else if (action === 'retry-drill-start') {
    if (!state.mistakes.drill.length) return;
    drill.mode = 'retry';
    drill.retryQueue = [...state.mistakes.drill];
    drill.retryTotal = drill.retryQueue.length;
    drill.retryClearedNow = 0;
    drill.combo = 0;
    sounds.play('start');
    go('drill');
  }
  else if (action === 'retry-puzzle') {
    puzzleState.idx = Number(t.dataset.idx);
    go('puzzle');
  }
  else if (action === 'drill-hint') showDrillHint();
  else if (action === 'drill-check') checkDrillAnswer();
  else if (action === 'drill-skip') revealDrillAnswer();
  else if (action === 'drill-next') {
    sounds.play('start');
    if (drill.mode === 'retry' && !drill.retryQueue.length) finishRetrySession();
    else render();
  }
});

document.addEventListener('keydown', e => {
  if (!activeField || activeField.classList.contains('locked')) return;
  if (e.key >= '0' && e.key <= '9') { pressKey(e.key); e.preventDefault(); }
  else if (e.key === '.') { pressKey('.'); e.preventDefault(); }
  else if (e.key === 'Backspace') { pressKey('del'); e.preventDefault(); }
});

// ---------- 初期表示 ----------
render();
