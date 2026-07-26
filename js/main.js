/* main.js — Initialisierung nach DOMContentLoaded. Zuletzt laden. */

document.addEventListener('DOMContentLoaded', function(){
  renderPath('intro-path');
  renderPath('start-path');
  renderLetters();
  renderLektionsPfad('lektionen-pfad');
  renderHarakat();
  renderWoerter();
  renderThemen();
  renderDialoge();
  renderKapitelListe('kapitel-liste');
  initSupabase();
  updateAccountUI();
  if('speechSynthesis' in window){
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function(){ window.speechSynthesis.getVoices(); };
  }

  // Arabische Inhalte für Screenreader auszeichnen — initial und bei jeder
  // dynamischen DOM-Änderung (deckt alle Übungs-Renders automatisch ab).
  if(typeof markArabic === 'function'){
    markArabic(document.body);
    if(window.MutationObserver){
      var obs = new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          for(var j=0;j<muts[i].addedNodes.length;j++){
            var n = muts[i].addedNodes[j];
            if(n.nodeType === 1) markArabic(n);
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }
});
