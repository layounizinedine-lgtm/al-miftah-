/* srs.js — Leitner-Wiederholungssystem + Tages-Session. */

/* ============================================================
   SRS — Leitner-System (spaced repetition)
   Boxes 1..5; correct → move up, wrong → back to box 1.
   Intervals grow so mastered items return less often.
   ============================================================ */
var SRS_KEY = 'almiftah_srs';
var DAY = 24*60*60*1000;
var BOX_INTERVAL = [0, 0, 1*DAY, 3*DAY, 7*DAY, 16*DAY]; // index = box (1..5)
var srsData = loadSRS();

function loadSRS(){
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveSRS(){
  try { localStorage.setItem(SRS_KEY, JSON.stringify(srsData)); } catch(e){}
}
function srsItem(ch){
  if(!srsData[ch]) srsData[ch] = { box:1, due:0, seen:false };
  return srsData[ch];
}
function alleSrsItems(){
  var items = ALL_LETTERS.map(function(l){ return { key:l.ch, art:'b', ref:l }; });
  if(stufe1Bestanden() && typeof ALLE_VOKABELN !== 'undefined'){
    ALLE_VOKABELN.forEach(function(v){ items.push({ key:'v:'+v.id, art:'v', ref:v }); });
  }
  return items;
}
function srsDue(){
  var now = Date.now();
  return alleSrsItems().filter(function(it){
    var s = srsData[it.key];
    return s && s.seen && s.due <= now;
  });
}
function srsNew(n){
  var res = [];
  var items = alleSrsItems();
  for(var i=0;i<items.length && res.length<n;i++){
    var s = srsData[items[i].key];
    if(!s || !s.seen) res.push(items[i]);
  }
  return res;
}
function srsGrade(key, correct){
  var it = srsItem(key);
  it.seen = true;
  it.box = correct ? Math.min(5, it.box + 1) : 1;
  it.due = Date.now() + BOX_INTERVAL[it.box];
  saveSRS();
}
function srsMastered(){
  var c = 0;
  alleSrsItems().forEach(function(it){ var s = srsData[it.key]; if(s && s.box >= 4) c++; });
  return c;
}
function itemZuFrage(it){
  if(it.art === 'v'){ return vokFrage(it.ref); }
  var l = it.ref;
  var andere = shuffle(ALL_LETTERS.filter(function(x){ return x.ch !== l.ch; })).slice(0,3);
  return { typ:'buchstabe', frage:'Welcher Buchstabe ist das?', glyph:l.ch,
    richtig:l.name, optionen: shuffle([l.name].concat(andere.map(function(a){ return a.name; }))),
    audio:l.ch, srsKey:l.ch };
}
function buildDailySession(){
  var due = srsDue();
  var fresh = srsNew(5);
  var deck = shuffle(due.concat(fresh)).slice(0, 12);
  if(deck.length === 0){ deck = shuffle(alleSrsItems()).slice(0, 8); }
  var fragen = deck.map(itemZuFrage);
  // AP 1.5: ein Silben-bauen-Element für Lesefluss-Wiederholung, wenn Wortmaterial vorhanden ist.
  if(typeof silbenPool === 'function' && typeof silbenFrage === 'function'){
    var pool = silbenPool();
    if(pool.length){ fragen.push(silbenFrage(pool[Math.floor(Math.random() * pool.length)])); }
  }
  return shuffle(fragen);
}

function updateDaily(){
  var dueN = srsDue().length;
  var newN = srsNew(5).length;
  var total = dueN + newN;
  var cEl = document.getElementById('daily-count');
  var sEl = document.getElementById('daily-sub');
  if(cEl) cEl.textContent = total;
  if(sEl){
    var parts = [];
    if(dueN > 0) parts.push(dueN + ' zur Wiederholung');
    if(newN > 0) parts.push(newN + ' neu');
    sEl.textContent = parts.length ? parts.join(' · ') : 'Alles wiederholt — starte eine freie Runde';
  }
  var mEl = document.getElementById('daily-mastered');
  if(mEl) mEl.textContent = srsMastered() + ' / ' + alleSrsItems().length;
}

