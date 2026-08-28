/* =========================================================
   sound.js
   Web Audio APIだけで鳴らす、短くやさしい効果音
   ========================================================= */
window.EduSound = (() => {
  const STORAGE_KEY = 'taiseki-sound-enabled';
  let enabled = true;
  let audioContext = null;

  try{
    enabled = localStorage.getItem(STORAGE_KEY) !== 'false';
  }catch(_){}

  function getContext(){
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return null;
    if(!audioContext) audioContext = new AudioContextClass();
    return audioContext;
  }

  function withContext(callback){
    if(!enabled) return;
    const context = getContext();
    if(!context) return;
    const play = () => callback(context);
    if(context.state === 'suspended'){
      context.resume().then(play).catch(()=>{});
    }else{
      play();
    }
  }

  function tone(context, start, frequency, duration, volume, type){
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playCorrect(){
    withContext(context => {
      const start = context.currentTime + 0.01;
      tone(context, start, 523.25, 0.13, 0.035, 'triangle');
      tone(context, start + 0.09, 659.25, 0.16, 0.04, 'triangle');
      tone(context, start + 0.18, 783.99, 0.22, 0.045, 'triangle');
    });
  }

  function playTryAgain(){
    withContext(context => {
      const start = context.currentTime + 0.01;
      tone(context, start, 440, 0.11, 0.022, 'sine');
      tone(context, start + 0.1, 392, 0.14, 0.018, 'sine');
    });
  }

  function isEnabled(){ return enabled; }

  function setEnabled(nextValue){
    enabled = Boolean(nextValue);
    try{ localStorage.setItem(STORAGE_KEY, String(enabled)); }catch(_){}
  }

  return {playCorrect, playTryAgain, isEnabled, setEnabled};
})();
