/* main.js — Initialisierung nach DOMContentLoaded. Zuletzt laden. */

document.addEventListener('DOMContentLoaded', function(){
  renderPath('intro-path');
  renderPath('start-path');
  renderLetters();
  renderHarakat();
  renderWoerter();
  renderThemen();
  renderDialoge();
  initSupabase();
  updateAccountUI();
  if('speechSynthesis' in window){
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function(){ window.speechSynthesis.getVoices(); };
  }
});
