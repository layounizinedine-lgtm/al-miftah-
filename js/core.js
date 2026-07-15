/* core.js — Basis: esc, Speicher (doneLetters), View-Switching (go), Audio (speak), shuffle. Zuerst laden. */

/* ============================================================
   FOUNDATION — Sicherheit (esc), Supabase, Auth, Cloud-Sync
   ============================================================ */

// --- XSS-Schutz: JEDER dynamische Wert läuft hier durch, bevor er in innerHTML landet ---
function esc(s){
  if(s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}


/* ============================================================
   PROGRESS (localStorage placeholder — Supabase later)
   ============================================================ */
var STORE_KEY = 'almiftah_letters_done';
function loadDone(){
  try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]')); }
  catch(e){ return new Set(); }
}
function saveDone(set){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(set))); } catch(e){}
}
var doneLetters = loadDone();


/* ============================================================
   VIEW SWITCHING
   ============================================================ */
function go(view){
  var views = document.querySelectorAll('.view');
  for(var i=0;i<views.length;i++){ views[i].classList.remove('active'); }
  var el = document.getElementById('view-' + view);
  if(el) el.classList.add('active');
  if(view === 'start' && typeof updateDaily === 'function'){ updateDaily(); }
  if(view === 'stufe2' && typeof renderThemen === 'function'){ renderThemen(); }
  if(view === 'stufe2' && typeof renderDialoge === 'function'){ renderDialoge(); }
  window.scrollTo(0,0);
}


/* ============================================================
   AUDIO — browser speech synthesis (ar)
   ============================================================ */
function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-SA';
  u.rate = 0.75;
  var voices = window.speechSynthesis.getVoices();
  for(var i=0;i<voices.length;i++){
    if(voices[i].lang && voices[i].lang.indexOf('ar') === 0){ u.voice = voices[i]; break; }
  }
  window.speechSynthesis.speak(u);
}

// Audio erst nach echter Nutzer-Geste automatisch abspielen (iOS-sicher)
var audioUnlocked = false;
document.addEventListener('click', function(e){
  audioUnlocked = true;
  var t = e.target && e.target.closest ? e.target.closest('[data-say]') : null;
  if(t){ speak(t.getAttribute('data-say')); }
});


function shuffle(a){
  a = a.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}

var exerciseReturnView = 'letters';
