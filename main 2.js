/* =========================================================
   main.js
   画面切り替え・公式レスキューモーダル・全体初期化
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  // ---- 画面切り替え ----
  const tabs = document.querySelectorAll('.tab');
  const screens = document.querySelectorAll('.screen');

  function goToStep(n){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.step === String(n)));
    screens.forEach(s => s.classList.toggle('active', s.dataset.screen === String(n)));
  }
  tabs.forEach(t => t.addEventListener('click', () => goToStep(t.dataset.step)));
  goToStep(0);

  // ---- 各ステップ初期化 ----
  initStep0();
  initStep1();
  initStep2();
  initStep3();

  // ---- 公式レスキュー ----
  const rescueBtn = document.getElementById('rescueBtn');
  const rescueModal = document.getElementById('rescueModal');
  const rescueClose = document.getElementById('rescueClose');
  const rescueContent = document.getElementById('rescueContent');

  let rescueBuilt = false;
  function buildRescueContent(){
    if(rescueBuilt) return;
    let html = '';
    STEP1_ORDER.forEach(key=>{
      const s = SHAPES[key];
      html += `<h4>${s.label}（${s.formula}）</h4><ul>`;
      s.rescueSteps.forEach(step => { html += `<li>${step}</li>`; });
      html += '</ul>';
    });
    rescueContent.innerHTML = html;
    rescueBuilt = true;
  }

  rescueBtn.addEventListener('click', () => {
    buildRescueContent();
    rescueModal.classList.remove('hidden');
  });
  rescueClose.addEventListener('click', () => rescueModal.classList.add('hidden'));
  rescueModal.addEventListener('click', (e) => {
    if(e.target === rescueModal) rescueModal.classList.add('hidden');
  });
});
