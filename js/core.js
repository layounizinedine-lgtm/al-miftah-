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
  if(view === 'stufe2' && typeof renderDialoge === 'function'){ renderDialoge(); }
  if(view === 'stufe2' && typeof renderKapitelListe === 'function'){ renderKapitelListe('kapitel-liste'); }
  if(view === 'woerter-bibliothek' && typeof renderThemen === 'function'){ renderThemen(); }
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

/* ============================================================
   A11Y — Tastaturbedienung & arabische Sprachauszeichnung
   ============================================================ */
// Antwort-Optionen der aktiven Übung per Zahltasten 1–9 wählen (Bedienung ohne Maus)
document.addEventListener('keydown', function(e){
  if(e.altKey || e.ctrlKey || e.metaKey) return;
  var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  if(tag === 'input' || tag === 'textarea') return;
  if(e.key >= '1' && e.key <= '9'){
    var ex = document.getElementById('view-exercise');
    if(!ex || !ex.classList.contains('active')) return;
    var opts = ex.querySelectorAll('.ex-option:not([disabled])');
    var idx = parseInt(e.key, 10) - 1;
    if(opts[idx]){ e.preventDefault(); opts[idx].click(); }
  }
});

// Arabische Textknoten für Screenreader auszeichnen (korrekte Aussprache + RTL).
// Regex-Guard sorgt dafür, dass nur echt-arabische Inhalte markiert werden
// (z. B. bleibt eine lateinische ex-glyph bei „Wie heißt das auf Arabisch?" unmarkiert).
var AR_RE = /[؀-ۿ]/;
var AR_SEL = '.glyph,.fglyph,.detail-glyph,.detail-name,.haraka-glyph,.haraka-ex,' +
  '.dlg-ar,.ar-opt,.ex-glyph,.app-name-ar,.stop-title-ar,.daily-ar,.topbar h2,' +
  '.page-head h1,.footer .ar';
function markArabic(root){
  root = root || document.body;
  if(root.nodeType !== 1) return;
  var els = [];
  // den Wurzelknoten selbst einschließen (bei innerHTML-Sets ist das Zielelement
  // oft direkt ein hinzugefügter Knoten, den querySelectorAll nicht erfasst)
  if(root.matches && root.matches(AR_SEL)) els.push(root);
  if(root.querySelectorAll){
    var found = root.querySelectorAll(AR_SEL);
    for(var k=0;k<found.length;k++) els.push(found[k]);
  }
  for(var i=0;i<els.length;i++){
    var el = els[i];
    if(AR_RE.test(el.textContent || '')){
      el.setAttribute('lang', 'ar');
      el.setAttribute('dir', 'rtl');
    }
  }
}


function shuffle(a){
  a = a.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}

var exerciseReturnView = 'letters';
