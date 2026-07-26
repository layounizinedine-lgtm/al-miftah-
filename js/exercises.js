/* exercises.js — Pfad, Buchstaben-Detail, alle Übungen, Vokabeln, Dialog-UI, Stufenprüfung. */

/* ============================================================
   RENDER: PATH (levels) — used on intro + start
   ============================================================ */
var STAGES = [
  { idx:'Erste Stufe',   ar:'الحروف',           de:'Buchstaben & Schrift', desc:'Formen erkennen, verbinden und schreiben lernen — ganz ohne Vorwissen. Aussprache von Anfang an.', ready:true,  view:'letters', wine:false },
  { idx:'Zweite Stufe',  ar:'الأساسيات',        de:'Erste Wörter & Sätze', desc:'Alltagsvokabular, einfache Sätze und erste Gespräche — thematisch aufgebaut.', ready:false, view:null, wine:false },
  { idx:'Dritte Stufe',  ar:'القواعد والأفعال', de:'Grammatik & Verben',   desc:'Konjugation, Satzbau und Struktur — das Gerüst, das aus Wörtern echte Sprache macht.', ready:false, view:null, wine:false },
  { idx:'Vierte Stufe',  ar:'الإتقان والترجمة', de:'Meisterschaft & Übersetzung', desc:'Klassische und moderne Texte lesen, verstehen und ins Deutsche übertragen.', ready:false, view:null, wine:true }
];

function medallionSVG(wine){
  var fill = wine ? '#7a2e2e' : '#0f3d3d';
  return '<svg viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="46" fill="' + fill + '" stroke="#c9a227" stroke-width="2"/>' +
      '<g stroke="#e0bb45" stroke-width="1.4" fill="none">' +
        '<path d="M50 13 L88 50 L50 87 L12 50 Z"/>' +
        '<path d="M28 28 L72 28 L72 72 L28 72 Z"/>' +
      '</g>' +
    '</svg>';
}

function renderPath(containerId){
  var c = document.getElementById(containerId);
  var bestanden = stufe1Bestanden();
  c.innerHTML = STAGES.map(function(s, i){
    var clickable = s.ready ? 'stop-clickable' : '';
    var onclick = s.ready ? 'onclick="go(\'' + s.view + '\')"' : '';
    var tag = s.ready ? 'button' : 'div';
    var badge;
    if(s.ready){
      badge = bestanden
        ? '<span class="badge badge-ready">✦ Gemeistert</span>'
        : '<span class="badge badge-ready">Verfügbar</span>';
    } else if(i === 1){
      if(bestanden){
        badge = '<span class="badge badge-ready">Verfügbar</span>';
        clickable = 'stop-clickable';
        onclick = 'onclick="go(\'stufe2\')"';
        tag = 'button';
      } else {
        badge = '<span class="badge badge-soon">🔒 Gesperrt — Prüfung Stufe 1 ablegen</span>';
      }
    } else {
      badge = '<span class="badge badge-soon">Bald verfügbar</span>';
    }
    return '<' + tag + ' class="stop ' + clickable + '" ' + onclick + '>' +
      '<div class="medallion">' + medallionSVG(s.wine) + '</div>' +
      '<div class="stop-body">' +
        '<p class="stop-index">' + s.idx + '</p>' +
        '<p class="stop-title-ar">' + s.ar + '</p>' +
        '<h3 class="stop-title-de">' + s.de + '</h3>' +
        '<p class="stop-desc">' + s.desc + '</p>' +
        badge +
      '</div>' +
    '</' + tag + '>';
  }).join('');
}


/* ============================================================
   RENDER: LETTER GROUPS
   ============================================================ */
function renderLetters(){
  var c = document.getElementById('letter-groups');
  c.innerHTML = LETTER_GROUPS.map(function(g){
    var cards = g.letters.map(function(l){
      var done = doneLetters.has(l.ch) ? 'done' : '';
      return '<button class="letter-card ' + done + '" onclick="openLetter(\'' + l.ch + '\')">' +
        '<span class="glyph">' + l.ch + '</span>' +
        '<span class="lname">' + l.name + '</span>' +
      '</button>';
    }).join('');
    return '<div class="group">' +
      '<div class="group-head">' +
        '<span class="group-title">' + g.title + '</span>' +
        '<span class="group-num">' + g.letters.length + ' Buchstaben</span>' +
      '</div>' +
      '<div class="letter-grid">' + cards + '</div>' +
    '</div>';
  }).join('');
}


/* ============================================================
   LETTER DETAIL OVERLAY
   ============================================================ */
function findLetter(ch){
  for(var i=0;i<ALL_LETTERS.length;i++){ if(ALL_LETTERS[i].ch === ch) return ALL_LETTERS[i]; }
  return null;
}

function openLetter(ch){
  var l = findLetter(ch);
  if(!l) return;
  var f = forms(ch);
  var nonConn = NON_CONNECTING.has(ch);
  var sheet = document.getElementById('letter-detail-sheet');

  var formsBlock = nonConn
    ? '<div class="forms-grid">' +
         '<div class="form-cell"><span class="fglyph">' + f.isolated + '</span><span class="flabel">Einzeln</span></div>' +
         '<div class="form-cell"><span class="fglyph">' + f.fin + '</span><span class="flabel">Am Ende</span></div>' +
       '</div>' +
       '<p class="form-note">Dieser Buchstabe verbindet sich nicht mit dem folgenden — er hat nur diese zwei Formen.</p>'
    : '<div class="forms-grid">' +
         '<div class="form-cell"><span class="fglyph">' + f.isolated + '</span><span class="flabel">Einzeln</span></div>' +
         '<div class="form-cell"><span class="fglyph">' + f.init + '</span><span class="flabel">Am Anfang</span></div>' +
         '<div class="form-cell"><span class="fglyph">' + f.med + '</span><span class="flabel">In der Mitte</span></div>' +
         '<div class="form-cell"><span class="fglyph">' + f.fin + '</span><span class="flabel">Am Ende</span></div>' +
       '</div>';

  sheet.innerHTML =
    '<button class="sheet-close" onclick="closeLetter()" aria-label="Schließen">×</button>' +
    '<div style="clear:both"></div>' +
    '<div class="detail-glyph">' + ch + '</div>' +
    '<div class="detail-name">' + l.name + '</div>' +
    '<div class="detail-translit">' + l.tr + '</div>' +
    '<p class="detail-sound">' + l.sound + '</p>' +
    '<button class="btn-gold listen-btn" data-say="' + esc(ch) + '">▷ Anhören</button>' +
    '<div class="forms-title">— Formen im Wort —</div>' +
    formsBlock +
    '<div style="text-align:center; margin-top:2rem; display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap;">' +
      '<button class="btn-ghost" onclick="fromDetailToWriting(\'' + ch + '\')">✎ Schreiben</button>' +
    '</div>';

  document.getElementById('letter-detail').classList.add('active');
}
function closeLetter(){
  document.getElementById('letter-detail').classList.remove('active');
  if(window.speechSynthesis) window.speechSynthesis.cancel();
}
// Kein Selbstauskunfts-"✓ Gelernt" mehr (AP 1.2): das ✦-Sternchen (doneLetters)
// wird ausschließlich durch einen bestandenen Lektions-Check vergeben,
// siehe handleLektionExamDone() in lektionen.js.
document.getElementById('letter-detail').addEventListener('click', function(e){
  if(e.target === this) closeLetter();
});
document.getElementById('auth-overlay').addEventListener('click', function(e){
  if(e.target === this) closeAuth();
});


/* ============================================================
   EXERCISE — "Welcher Buchstabe ist das?"  (frei ODER SRS)
   ============================================================ */
var exQuestions = [];
var exIndex = 0;
var exCorrect = 0;
var exRichtigIdx = 0;
var haRichtigIdx = 0;
var woRichtigIdx = 0;
var hoRichtigIdx = 0;


function exBack(){ go(exerciseReturnView || 'letters'); }

function startExercise(){
  exerciseReturnView = 'letters';
  exQuestions = shuffle(ALL_LETTERS).slice(0, 10);
  exIndex = 0; exCorrect = 0;
  go('exercise');
  renderQuestion();
}

function startDaily(){
  exerciseReturnView = 'start';
  exam.fragen = buildDailySession();
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'daily';
  go('exercise');
  renderExamQuestion();
}

function renderQuestion(){
  var body = document.getElementById('exercise-body');
  if(exIndex >= exQuestions.length){ renderExDone(); return; }
  var q = exQuestions[exIndex];

  var others = shuffle(ALL_LETTERS.filter(function(l){ return l.ch !== q.ch; })).slice(0,3);
  var options = shuffle([q].concat(others));
  exRichtigIdx = options.indexOf(q);
  var pct = Math.round((exIndex / exQuestions.length) * 100);

  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">Welcher Buchstabe ist das?</div>' +
    '<div class="ex-glyph">' + q.ch + '</div>' +
    '<div class="ex-options">' +
      options.map(function(o, idx){
        return '<button class="ex-option" data-idx="' + idx + '" onclick="answer(this)">' + esc(o.name) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
}

function answer(btn){
  var q = exQuestions[exIndex];
  var correct = q.ch;
  var buttons = document.querySelectorAll('.ex-option');
  for(var i=0;i<buttons.length;i++){ buttons[i].disabled = true; }
  var fb = document.getElementById('ex-feedback');
  var isRight = (parseInt(btn.getAttribute('data-idx'), 10) === exRichtigIdx);

  if(isRight){
    btn.classList.add('correct');
    exCorrect++;
    fb.textContent = 'Richtig ✦';
    fb.className = 'ex-feedback good';
    // Kein automatisches "gelernt" mehr für einen einzelnen Klick (AP 1.2):
    // das ✦-Sternchen kommt ausschließlich vom bestandenen Lektions-Check.
  } else {
    btn.classList.add('wrong');
    if(buttons[exRichtigIdx]) buttons[exRichtigIdx].classList.add('correct');
    fb.textContent = 'Das war ' + findLetter(correct).name;
    fb.className = 'ex-feedback bad';
  }

  speak(correct);
  setTimeout(function(){ exIndex++; renderQuestion(); }, 1400);
}

function renderExDone(){
  var body = document.getElementById('exercise-body');
  renderLetters();
  updateDaily();
  syncAfterSession();
  var perfect = (exCorrect === exQuestions.length);
  var msg = perfect ? 'Makellos! Du kennst diese Buchstaben.' : 'Gut gemacht — Wiederholung festigt das Wissen.';
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + exCorrect + ' von ' + exQuestions.length + ' richtig</h2>' +
      '<p>' + msg + '</p>' +
      '<button class="btn-gold" onclick="startExercise()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;">' +
        '<button class="btn-ghost" onclick="go(\'letters\')">Zurück zu den Buchstaben</button>' +
      '</div>' +
    '</div>';
}


function renderHarakat(){
  var c = document.getElementById('harakat-list');
  if(!c) return;
  var html = '';
  var letzteGruppe = null;
  HARAKAT.forEach(function(h){
    if(h.gruppe !== letzteGruppe){
      letzteGruppe = h.gruppe;
      html += '<div class="group-head" style="margin-top:1.6rem;"><span class="group-title">' + esc(h.gruppe) + '</span></div>';
    }
    html += '<div class="haraka-card">' +
      '<div class="haraka-glyph">' + esc(h.beispiel) + '</div>' +
      '<div class="haraka-body">' +
        '<div><span class="haraka-name">' + esc(h.name) + '</span>' +
        ' <span class="haraka-ex-tr">— ' + esc(h.tr) + '</span></div>' +
        '<div class="haraka-desc">' + esc(h.desc) + '</div>' +
        '<div class="haraka-hilfe">✦ ' + esc(h.hilfe) + '</div>' +
      '</div>' +
      '<button class="haraka-listen" data-say="' + esc(h.beispiel) + '" aria-label="Anhören">▷</button>' +
    '</div>';
  });
  c.innerHTML = html;
}

/* --- Harakat-Übung: "Wie klingt das?" --- */
var haQuestions = [];
var haIndex = 0;
var haCorrect = 0;

// Übungspool: kurze & lange Vokale + alle drei Tanwin-Arten an bekannten Buchstaben
var HA_BASES = ['ب','ت','ن','م','ل','ك','د','ر','س','ف'];

function buildHaQuestion(){
  var base = HA_BASES[Math.floor(Math.random()*HA_BASES.length)];
  var baseName = findLetter(base) ? findLetter(base).tr.replace(/ʾ|ʿ/g,'') : base;
  var k = baseName.charAt(0); // z.B. 'b' von bāʾ
  var r = Math.random();
  if(r < 0.4){
    // kurze Vokale: ba / bi / bu
    var kurz = [ { z:'\u064E', v:'a' }, { z:'\u0650', v:'i' }, { z:'\u064F', v:'u' } ];
    var w = kurz[Math.floor(Math.random()*3)];
    return { anzeige: base + w.z, richtig: k + w.v,
      optionen: shuffle(['a','i','u'].map(function(v){ return k + v; })),
      audio: base + w.z };
  }
  if(r < 0.75){
    // Tanwin: ban / bin / bun — Fathatan mit stummem Alif-Träger
    var tan = [
      { anzeige: base + '\u064B\u0627', v:'an' },
      { anzeige: base + '\u064D', v:'in' },
      { anzeige: base + '\u064C', v:'un' }
    ];
    var t = tan[Math.floor(Math.random()*3)];
    return { anzeige: t.anzeige, richtig: k + t.v,
      optionen: shuffle(['an','in','un'].map(function(v){ return k + v; })),
      audio: t.anzeige };
  }
  // lange Vokale: bā / bī / bū
  var lang = [
    { anzeige: base + '\u064E\u0627', v:'ā' },
    { anzeige: base + '\u0650\u064A', v:'ī' },
    { anzeige: base + '\u064F\u0648', v:'ū' }
  ];
  var lg = lang[Math.floor(Math.random()*3)];
  return { anzeige: lg.anzeige, richtig: k + lg.v,
    optionen: shuffle(['ā','ī','ū'].map(function(v){ return k + v; })),
    audio: lg.anzeige };
}

function startHarakatExercise(){
  exerciseReturnView = 'harakat';
  haQuestions = [];
  for(var i=0;i<12;i++){ haQuestions.push(buildHaQuestion()); }
  haIndex = 0; haCorrect = 0;
  go('exercise');
  renderHaQuestion();
}

function renderHaQuestion(){
  var body = document.getElementById('exercise-body');
  if(haIndex >= haQuestions.length){ renderHaDone(); return; }
  var q = haQuestions[haIndex];
  haRichtigIdx = q.optionen.indexOf(q.richtig);
  var pct = Math.round((haIndex / haQuestions.length) * 100);

  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">Wie wird das ausgesprochen?</div>' +
    '<div class="ex-glyph">' + esc(q.anzeige) + '</div>' +
    '<div class="ex-options">' +
      q.optionen.map(function(o, idx){
        return '<button class="ex-option" data-idx="' + idx + '" onclick="haAnswer(this)">' + esc(o) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
}

function haAnswer(btn){
  var q = haQuestions[haIndex];
  var buttons = document.querySelectorAll('.ex-option');
  for(var i=0;i<buttons.length;i++){ buttons[i].disabled = true; }
  var fb = document.getElementById('ex-feedback');

  if(parseInt(btn.getAttribute('data-idx'), 10) === haRichtigIdx){
    btn.classList.add('correct');
    haCorrect++;
    fb.textContent = 'Richtig ✦';
    fb.className = 'ex-feedback good';
  } else {
    btn.classList.add('wrong');
    if(buttons[haRichtigIdx]) buttons[haRichtigIdx].classList.add('correct');
    fb.textContent = 'Das war „' + q.richtig + '"';
    fb.className = 'ex-feedback bad';
  }
  speak(q.audio);
  setTimeout(function(){ haIndex++; renderHaQuestion(); }, 1400);
}

function renderHaDone(){
  var body = document.getElementById('exercise-body');
  var msg = (haCorrect === haQuestions.length)
    ? 'Perfekt! Du hörst die Vokale sicher heraus.'
    : 'Gut gemacht — die Vokalzeichen setzen sich mit jeder Runde fester.';
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + haCorrect + ' von ' + haQuestions.length + ' richtig</h2>' +
      '<p>' + msg + '</p>' +
      '<button class="btn-gold" onclick="startHarakatExercise()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;">' +
        '<button class="btn-ghost" onclick="go(\'harakat\')">Zurück zu den Vokalzeichen</button>' +
      '</div>' +
    '</div>';
}


function renderWoerter(){
  var c = document.getElementById('woerter-list');
  if(!c) return;
  c.innerHTML = WOERTER_GRUPPEN.map(function(g){
    var karten = g.woerter.map(function(w){
      return '<div class="haraka-card">' +
        '<div class="haraka-glyph" style="width:auto; min-width:72px; padding:0 .6rem; font-size:2rem;">' + esc(w.ar) + '</div>' +
        '<div class="haraka-body">' +
          '<div><span class="haraka-name">' + esc(w.tr) + '</span>' +
          ' <span class="haraka-ex-tr">— ' + esc(w.de) + '</span></div>' +
        '</div>' +
        '<button class="haraka-listen" data-say="' + esc(w.ar) + '" aria-label="Anhören">▷</button>' +
      '</div>';
    }).join('');
    return '<div class="group">' +
      '<div class="group-head"><span class="group-title">' + esc(g.titel) + '</span></div>' +
      '<p style="font-size:.9rem; color:rgba(242,232,208,0.65); font-style:italic; margin:.2rem 0 1rem;">' + esc(g.hinweis) + '</p>' +
      karten +
    '</div>';
  }).join('');
}

/* --- Übung: "Wie liest man das?" --- */
var woQuestions = [];
var woIndex = 0;
var woCorrect = 0;

function startWoerterExercise(){
  exerciseReturnView = 'woerter';
  woQuestions = shuffle(ALLE_WOERTER).slice(0, 10);
  woIndex = 0; woCorrect = 0;
  go('exercise');
  renderWoQuestion();
}

function renderWoQuestion(){
  var body = document.getElementById('exercise-body');
  if(woIndex >= woQuestions.length){ renderWoDone(); return; }
  var q = woQuestions[woIndex];
  var optionen = shuffle([q.tr].concat(q.falsch));
  woRichtigIdx = optionen.indexOf(q.tr);
  var pct = Math.round((woIndex / woQuestions.length) * 100);

  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">Wie liest man das?</div>' +
    '<div class="ex-glyph" style="font-size:clamp(3.5rem, 16vw, 6rem);">' + esc(q.ar) + '</div>' +
    '<div class="ex-options" style="grid-template-columns:1fr;">' +
      optionen.map(function(o, idx){
        return '<button class="ex-option" data-idx="' + idx + '" onclick="woAnswer(this)">' + esc(o) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
}

function woAnswer(btn){
  var q = woQuestions[woIndex];
  var buttons = document.querySelectorAll('.ex-option');
  for(var i=0;i<buttons.length;i++){ buttons[i].disabled = true; }
  var fb = document.getElementById('ex-feedback');

  if(parseInt(btn.getAttribute('data-idx'), 10) === woRichtigIdx){
    btn.classList.add('correct');
    woCorrect++;
    fb.textContent = 'Richtig ✦ — ' + q.de;
    fb.className = 'ex-feedback good';
  } else {
    btn.classList.add('wrong');
    if(buttons[woRichtigIdx]) buttons[woRichtigIdx].classList.add('correct');
    fb.textContent = 'Es heißt „' + q.tr + '" — ' + q.de;
    fb.className = 'ex-feedback bad';
  }
  speak(q.ar);
  setTimeout(function(){ woIndex++; renderWoQuestion(); }, 1600);
}

function renderWoDone(){
  var body = document.getElementById('exercise-body');
  var msg = (woCorrect === woQuestions.length)
    ? 'Hervorragend — du liest schon echte Wörter!'
    : 'Gut gemacht! Achte besonders auf Sukun und Schadda — sie verändern das ganze Wort.';
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + woCorrect + ' von ' + woQuestions.length + ' richtig</h2>' +
      '<p>' + msg + '</p>' +
      '<button class="btn-gold" onclick="startWoerterExercise()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;">' +
        '<button class="btn-ghost" onclick="go(\'woerter\')">Zurück zu den Wörtern</button>' +
      '</div>' +
    '</div>';
}

/* ============================================================
   HÖR-DRILL — Ähnlich klingende Buchstaben unterscheiden
   Die klassische Anfängerhürde: ح/ه، س/ص، ت/ط، ك/ق …
   ============================================================ */
var HOER_GRUPPEN = [
  ['ح','ه'],
  ['ح','خ'],
  ['س','ص'],
  ['ت','ط'],
  ['ك','ق'],
  ['ذ','ز','ظ'],
  ['د','ض'],
  ['ث','س']
];

function buildHoerQuestion(){
  var gruppe = HOER_GRUPPEN[Math.floor(Math.random()*HOER_GRUPPEN.length)];
  var ziel = gruppe[Math.floor(Math.random()*gruppe.length)];
  return { richtig: ziel, optionen: shuffle(gruppe.slice()), audio: ziel };
}

var hoQuestions = [];
var hoIndex = 0;
var hoCorrect = 0;

function startHoerDrill(){
  exerciseReturnView = 'letters';
  hoQuestions = [];
  for(var i=0;i<10;i++){ hoQuestions.push(buildHoerQuestion()); }
  hoIndex = 0; hoCorrect = 0;
  go('exercise');
  renderHoQuestion();
}

function renderHoQuestion(){
  var body = document.getElementById('exercise-body');
  if(hoIndex >= hoQuestions.length){ renderHoDone(); return; }
  var q = hoQuestions[hoIndex];
  hoRichtigIdx = q.optionen.indexOf(q.richtig);
  var pct = Math.round((hoIndex / hoQuestions.length) * 100);

  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">Welchen Buchstaben hörst du?</div>' +
    '<button class="ex-play" data-say="' + esc(q.audio) + '" aria-label="Abspielen">▷</button>' +
    '<div class="ex-options" style="grid-template-columns:repeat(' + q.optionen.length + ',1fr);">' +
      q.optionen.map(function(o, idx){
        return '<button class="ex-option ar-opt" data-idx="' + idx + '" onclick="hoAnswer(this)">' + esc(o) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>' +
    '<p style="font-size:.85rem; color:rgba(242,232,208,0.5); font-style:italic; margin-top:1rem;">Tippe ▷, so oft du willst — dann wähle.</p>';

  // nur auto-abspielen, wenn der Nutzer die Audio-Ausgabe bereits per Geste freigegeben hat (iOS-sicher)
  if(audioUnlocked){ speak(q.audio); }
}

function hoAnswer(btn){
  var q = hoQuestions[hoIndex];
  var buttons = document.querySelectorAll('.ex-option');
  for(var i=0;i<buttons.length;i++){ buttons[i].disabled = true; }
  var fb = document.getElementById('ex-feedback');
  var l = findLetter(q.richtig);
  var name = l ? l.name : q.richtig;

  if(parseInt(btn.getAttribute('data-idx'), 10) === hoRichtigIdx){
    btn.classList.add('correct');
    hoCorrect++;
    fb.textContent = 'Richtig ✦ — das war ' + name;
    fb.className = 'ex-feedback good';
  } else {
    btn.classList.add('wrong');
    if(buttons[hoRichtigIdx]) buttons[hoRichtigIdx].classList.add('correct');
    fb.textContent = 'Das war ' + name;
    fb.className = 'ex-feedback bad';
  }
  speak(q.richtig);
  setTimeout(function(){ hoIndex++; renderHoQuestion(); }, 1500);
}

function renderHoDone(){
  var body = document.getElementById('exercise-body');
  var msg = (hoCorrect === hoQuestions.length)
    ? 'Beeindruckend — dein Ohr unterscheidet die schweren Paare!'
    : 'Gut! Diese Laute brauchen Zeit — jede Runde schärft dein Ohr.';
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + hoCorrect + ' von ' + hoQuestions.length + ' richtig</h2>' +
      '<p>' + msg + '</p>' +
      '<button class="btn-gold" onclick="startHoerDrill()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;">' +
        '<button class="btn-ghost" onclick="go(\'letters\')">Zurück zu den Buchstaben</button>' +
      '</div>' +
    '</div>';
}


/* ============================================================
   STUFE 2 — Vokabeln (Daten aus vokabeln.js, SRS-Schlüssel 'v:<id>')
   ============================================================ */
var VOKAB_THEMEN = (typeof VOKABELN_DATA !== 'undefined') ? VOKABELN_DATA : [];
var ALLE_VOKABELN = [];
VOKAB_THEMEN.forEach(function(t){ t.vocab.forEach(function(v){ ALLE_VOKABELN.push(v); }); });
var aktuellesThema = null;

function renderThemen(){
  var c = document.getElementById('themen-list');
  if(!c) return;
  if(VOKAB_THEMEN.length === 0){
    c.innerHTML = '<p style="text-align:center; color:rgba(242,232,208,0.7);">Die Vokabeldatei (vokabeln.js) wurde nicht gefunden. Bitte zusammen mit index.html hochladen.</p>';
    return;
  }
  var kopf = '<div class="group-head" style="margin-top:1.6rem;"><span class="group-title">Wortschatz-Themen</span>' +
    '<span class="group-num">' + VOKAB_THEMEN.length + ' Themenfelder</span></div>' +
    '<p style="font-size:.9rem; color:rgba(242,232,208,0.65); font-style:italic; margin:.2rem 0 1rem;">Wähle ein Themenfeld und lerne seine Wörter — sie tauchen in den Gesprächen wieder auf.</p>';
  c.innerHTML = kopf + VOKAB_THEMEN.map(function(t){
    var gelernt = t.vocab.filter(function(v){ var it = srsData['v:'+v.id]; return it && it.box >= 4; }).length;
    var icon = t.icon || t.vocab[0].arabic.charAt(0);
    var lekN = t.lektionen ? t.lektionen.length + ' Lektionen · ' : '';
    return '<button class="haraka-card stop-clickable" style="width:100%; text-align:left; cursor:pointer;" onclick="openThema(' + t.id + ')">' +
      '<div class="haraka-glyph" style="width:auto; min-width:76px; padding:0 .5rem; font-size:1.25rem;">' + esc(icon) + '</div>' +
      '<div class="haraka-body">' +
        '<div class="haraka-name">' + esc(t.name) + (t.nameAr ? ' <span class="haraka-ex-tr" style="font-size:.9rem;">' + esc(t.nameAr) + '</span>' : '') + '</div>' +
        '<div class="haraka-desc">' + t.vocab.length + ' Wörter · ' + lekN + gelernt + ' im Gedächtnis</div>' +
      '</div>' +
      '<span style="color:var(--gold-bright); font-size:1.3rem;">›</span>' +
    '</button>';
  }).join('');
}

function findThema(id){
  for(var i=0;i<VOKAB_THEMEN.length;i++){ if(VOKAB_THEMEN[i].id === id) return VOKAB_THEMEN[i]; }
  return null;
}
function findVokabel(id){
  for(var i=0;i<ALLE_VOKABELN.length;i++){ if(ALLE_VOKABELN[i].id === id) return ALLE_VOKABELN[i]; }
  return null;
}

function openThema(id){
  aktuellesThema = findThema(id);
  if(!aktuellesThema) return;
  document.getElementById('thema-head').textContent = aktuellesThema.name;
  document.getElementById('thema-titel-de').textContent = aktuellesThema.name;
  if(aktuellesThema.nameAr){ document.getElementById('thema-titel-ar').textContent = aktuellesThema.nameAr; }
  renderThemaWoerter();
  go('thema');
}

function renderThemaWoerter(){
  var c = document.getElementById('thema-woerter');
  if(!c || !aktuellesThema) return;
  c.innerHTML = aktuellesThema.vocab.map(function(v){
    var it = srsData['v:'+v.id];
    var stern = (it && it.box >= 4) ? ' <span style="color:var(--gold-bright);">✦</span>' : '';
    return '<div class="haraka-card">' +
      '<button style="all:unset; cursor:pointer; flex:1; display:flex; gap:1.2rem; align-items:center;" onclick="openVokabel(' + v.id + ')">' +
        '<div class="haraka-glyph" style="width:auto; min-width:88px; padding:0 .6rem; font-size:1.7rem;">' + esc(v.arabic) + '</div>' +
        '<div class="haraka-body">' +
          '<div class="haraka-name">' + esc(v.translations.de) + stern + '</div>' +
          '<div class="haraka-desc" style="opacity:.7;">' + esc(v.wordType) + '</div>' +
        '</div>' +
      '</button>' +
      '<button class="haraka-listen" data-say="' + esc(v.arabic) + '" aria-label="Anhören">▷</button>' +
    '</div>';
  }).join('');
}

function openVokabel(id){
  var v = findVokabel(id);
  if(!v) return;
  var sheet = document.getElementById('vokabel-detail-sheet');

  var teile = '';
  if(v.plural){
    teile += '<div class="form-cell" style="grid-column:span 2;"><span class="fglyph" style="font-size:1.5rem;">' + esc(v.plural) + '</span><span class="flabel">Plural</span></div>';
  }
  if(v.opposite){
    teile += '<div class="form-cell" style="grid-column:span 2;"><span class="fglyph" style="font-size:1.5rem;">' + esc(v.opposite) + '</span><span class="flabel">Gegenteil</span></div>';
  }

  var verwandteBlock = '';
  if(v.mehrData && v.mehrData.verwandte && v.mehrData.verwandte.length){
    verwandteBlock =
      '<div class="forms-title">— Wortfamilie —</div>' +
      '<div style="display:flex; flex-direction:column; gap:.5rem;">' +
      v.mehrData.verwandte.map(function(w){
        return '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,61,61,0.5); border:1px solid rgba(201,162,39,0.2); border-radius:6px; padding:.6rem .9rem;">' +
          '<span style="font-family:\'Noto Naskh Arabic\',serif; font-weight:700; font-size:1.25rem; color:#fdf8ec;">' + esc(w.arabisch) + '</span>' +
          '<span style="color:rgba(242,232,208,0.75); font-size:.9rem;">' + esc(w.deutsch) + '</span>' +
        '</div>';
      }).join('') +
      '</div>';
  }

  sheet.innerHTML =
    '<button class="sheet-close" onclick="closeVokabel()" aria-label="Schließen">×</button>' +
    '<div style="clear:both"></div>' +
    '<div class="detail-glyph" style="font-size:clamp(3rem, 14vw, 5rem);">' + esc(v.arabic) + '</div>' +
    '<div class="detail-name">' + esc(v.translations.de) + '</div>' +
    '<div class="detail-translit">' + esc(v.wordType) + '</div>' +
    '<button class="btn-gold listen-btn" data-say="' + esc(v.arabic) + '">▷ Anhören</button>' +
    (teile ? '<div class="forms-title">— Formen —</div><div class="forms-grid" style="grid-template-columns:1fr 1fr;">' + teile + '</div>' : '') +
    '<div class="forms-title">— Beispielsatz —</div>' +
    '<div style="text-align:center; background:rgba(15,61,61,0.5); border:1px solid rgba(201,162,39,0.2); border-radius:8px; padding:1rem;">' +
      '<div style="font-family:\'Noto Naskh Arabic\',serif; font-weight:700; font-size:1.4rem; color:#fdf8ec; margin-bottom:.4rem;">' + esc(v.exampleArabic) + '</div>' +
      '<div style="color:rgba(242,232,208,0.8); font-style:italic;">' + esc(v.exampleTranslation.de) + '</div>' +
      '<button class="haraka-listen" style="margin-top:.6rem;" data-say="' + esc(v.exampleArabic) + '">▷</button>' +
    '</div>' +
    verwandteBlock;

  document.getElementById('vokabel-detail').classList.add('active');
}
function closeVokabel(){
  document.getElementById('vokabel-detail').classList.remove('active');
  if(window.speechSynthesis) window.speechSynthesis.cancel();
}
document.getElementById('vokabel-detail').addEventListener('click', function(e){
  if(e.target === this) closeVokabel();
});

/* --- Vokabel-Fragen (für Themen-Übung UND Tages-Session) --- */
function distinctBy(arr, keyFn){ var seen = {}, out = []; arr.forEach(function(x){ var k = keyFn(x); if(!seen[k]){ seen[k] = 1; out.push(x); } }); return out; }

function vokFrageArDe(v){
  var pool = distinctBy(ALLE_VOKABELN.filter(function(x){ return x.id !== v.id && x.translations.de !== v.translations.de; }), function(x){ return x.translations.de; });
  var andere = shuffle(pool).slice(0,3);
  return { typ:'wort', frage:'Was bedeutet dieses Wort?', glyph:v.arabic,
    richtig:v.translations.de,
    optionen: shuffle([v.translations.de].concat(andere.map(function(a){ return a.translations.de; }))),
    audio:v.arabic, srsKey:'v:'+v.id };
}
function vokFrageDeAr(v){
  var pool = distinctBy(ALLE_VOKABELN.filter(function(x){ return x.id !== v.id && x.arabic !== v.arabic; }), function(x){ return x.arabic; });
  var andere = shuffle(pool).slice(0,3);
  return { typ:'dear', frage:'Wie heißt das auf Arabisch?', glyph:'„' + v.translations.de + '"',
    richtig:v.arabic,
    optionen: shuffle([v.arabic].concat(andere.map(function(a){ return a.arabic; }))),
    audio:v.arabic, srsKey:'v:'+v.id };
}
function vokFrage(v){
  return (Math.random() < 0.5) ? vokFrageArDe(v) : vokFrageDeAr(v);
}

function startVokabelExercise(){
  exerciseReturnView = 'thema';
  if(!aktuellesThema) return;
  var deck = shuffle(aktuellesThema.vocab).slice(0, 10);
  exam.fragen = deck.map(vokFrage);
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'vokabel';
  go('exercise');
  renderExamQuestion();
}


function renderDialoge(){
  var c = document.getElementById('dialoge-list');
  if(!c) return;
  var html = '<div class="group-head"><span class="group-title">Erste Gespräche — Lesen mit Harakat</span>' +
    '<span class="group-num">' + DIALOGE.length + ' Dialoge</span></div>' +
    '<p style="font-size:.9rem; color:rgba(242,232,208,0.65); font-style:italic; margin:.2rem 0 1rem;">Kurz, simpel, voll vokalisiert — jedes Gespräch nutzt Wörter aus den Themenfeldern.</p>';
  html += DIALOGE.map(function(d){
    var done = dialogeDone.has(d.id) ? ' <span style="color:var(--gold-bright);">✦</span>' : '';
    return '<button class="haraka-card stop-clickable" style="width:100%; text-align:left; cursor:pointer;" onclick="openDialog(' + d.id + ')">' +
      '<div class="haraka-glyph" style="font-size:1.35rem; width:auto; min-width:72px; padding:0 .5rem;">' + esc(d.titelAr) + '</div>' +
      '<div class="haraka-body">' +
        '<div class="haraka-name">' + esc(d.titel) + done + '</div>' +
        '<div class="haraka-desc">' + esc(d.unter) + ' · ' + d.zeilen.length + ' Sätze · ' + d.fragen.length + ' Fragen</div>' +
      '</div>' +
      '<span style="color:var(--gold-bright); font-size:1.3rem;">›</span>' +
    '</button>';
  }).join('');
  c.innerHTML = html;
}

function findDialog(id){
  for(var i=0;i<DIALOGE.length;i++){ if(DIALOGE[i].id === id) return DIALOGE[i]; }
  return null;
}

/* ============================================================
   DIALOG-MODI (AP 2.2): Lesen (Standard) · Hören (verdeckt,
   zeilenweise aufdecken) · Rollenspiel (Person 1 spricht die App,
   Person 2 wird aus Wort-Kacheln in der richtigen Reihenfolge
   gebaut — gleiches Tipp-Prinzip wie „Silben bauen", AP 1.5).
   ============================================================ */
var dialogMode = 'lesen';
var dialogHoerenAufgedeckt = {};
var dialogRollenspielOrder = {};
var dialogRollenspielShuffle = {};

function openDialog(id){
  var d = findDialog(id);
  if(!d) return;
  aktuellerDialog = d;
  document.getElementById('dialog-titel-ar').textContent = d.titelAr;
  document.getElementById('dialog-head').textContent = d.titel;
  document.getElementById('dialog-unter').textContent = d.unter;
  dialogMode = 'lesen';
  dialogHoerenAufgedeckt = {};
  dialogRollenspielOrder = {};
  dialogRollenspielShuffle = {};
  updateDialogModeButtons();
  renderDialogBody();
  go('dialog');
}

function setDialogMode(mode){
  dialogMode = mode;
  dialogHoerenAufgedeckt = {};
  dialogRollenspielOrder = {};
  dialogRollenspielShuffle = {};
  updateDialogModeButtons();
  renderDialogBody();
}

function updateDialogModeButtons(){
  ['lesen', 'hoeren', 'rollenspiel'].forEach(function(m){
    var btn = document.getElementById('dlg-mode-' + m);
    if(btn) btn.classList.toggle('active', m === dialogMode);
  });
}

function renderDialogBody(){
  if(dialogMode === 'hoeren'){ renderDialogHoeren(); return; }
  if(dialogMode === 'rollenspiel'){ renderDialogRollenspiel(); return; }
  renderDialogLesen();
}

function dialogQuizTrailerHtml(){
  return '<div style="text-align:center; margin-top:1.2rem;">' +
    '<button class="btn-gold" onclick="startDialogQuiz()">Verstanden? → Quiz starten</button>' +
  '</div>';
}

function renderDialogLesen(){
  var d = aktuellerDialog;
  var body = document.getElementById('dialog-body');
  body.classList.remove('hide-help');
  var html = '<div class="dlg-intro">Lies laut mit — tippe ▷, um jeden Satz zu hören.</div>';
  html += d.zeilen.map(function(z, i){
    var seite = (z.s === 'A') ? '' : ' b';
    return '<div class="dlg-line' + seite + '">' +
      '<div class="dlg-bubble">' +
        '<div class="dlg-sprecher">' + esc(z.s === 'A' ? 'Person 1' : 'Person 2') + '</div>' +
        '<div class="dlg-ar">' + esc(z.ar) + '</div>' +
        '<div class="dlg-tr">' + esc(z.tr) + '</div>' +
        '<div class="dlg-de">' + esc(z.de) + '</div>' +
        '<button class="dlg-play" onclick="speakDialogZeile(' + d.id + ',' + i + ')" aria-label="Anhören">▷</button>' +
      '</div>' +
    '</div>';
  }).join('');
  html += '<div class="dlg-controls">' +
    '<button class="btn-ghost" onclick="dialogAlleAnhoeren()">▷ Ganzes Gespräch anhören</button>' +
    '<button class="btn-ghost" id="dlg-help-btn" onclick="toggleDialogHilfe()">Übersetzung ausblenden</button>' +
  '</div>' +
  dialogQuizTrailerHtml();
  body.innerHTML = html;
}

function renderDialogHoeren(){
  var d = aktuellerDialog;
  var body = document.getElementById('dialog-body');
  var html = '<div class="dlg-intro">Höre zuerst, lies danach — tippe ▷, um jede Zeile aufzudecken.</div>';
  html += d.zeilen.map(function(z, i){
    var seite = (z.s === 'A') ? '' : ' b';
    var aufgedeckt = !!dialogHoerenAufgedeckt[i];
    var inhalt = aufgedeckt
      ? '<div class="dlg-ar">' + esc(z.ar) + '</div><div class="dlg-tr">' + esc(z.tr) + '</div><div class="dlg-de">' + esc(z.de) + '</div>'
      : '<div class="dlg-de" style="font-style:italic; opacity:.6;">— verdeckt, zum Aufdecken anhören —</div>';
    return '<div class="dlg-line' + seite + '">' +
      '<div class="dlg-bubble">' +
        '<div class="dlg-sprecher">' + esc(z.s === 'A' ? 'Person 1' : 'Person 2') + '</div>' +
        inhalt +
        '<button class="dlg-play" onclick="dialogHoerenAufdecken(' + i + ')" aria-label="Anhören und aufdecken">▷</button>' +
      '</div>' +
    '</div>';
  }).join('');
  html += dialogQuizTrailerHtml();
  body.innerHTML = html;
}

function dialogHoerenAufdecken(i){
  var d = aktuellerDialog;
  if(!d || !d.zeilen[i]) return;
  dialogHoerenAufgedeckt[i] = true;
  speak(d.zeilen[i].ar);
  renderDialogHoeren();
}

function renderDialogRollenspiel(){
  var d = aktuellerDialog;
  var body = document.getElementById('dialog-body');
  var html = '<div class="dlg-intro">Person 1 spricht die App — baue die Antwort von Person 2 aus den Wort-Kacheln.</div>';
  html += d.zeilen.map(function(z, i){
    if(z.s === 'A'){
      return '<div class="dlg-line">' +
        '<div class="dlg-bubble">' +
          '<div class="dlg-sprecher">Person 1</div>' +
          '<div class="dlg-ar">' + esc(z.ar) + '</div>' +
          '<div class="dlg-tr">' + esc(z.tr) + '</div>' +
          '<div class="dlg-de">' + esc(z.de) + '</div>' +
          '<button class="dlg-play" onclick="speakDialogZeile(' + d.id + ',' + i + ')" aria-label="Anhören">▷</button>' +
        '</div>' +
      '</div>';
    }
    var woerter = dialogZeileWoerter(z.ar);
    var reihenfolge = dialogRollenspielShuffle[i] || (dialogRollenspielShuffle[i] = shuffle(woerter.map(function(_, wi){ return wi; })));
    var soweit = dialogRollenspielOrder[i] || [];
    var fertig = soweit.length === woerter.length;
    var inhalt = fertig
      ? ('<div class="dlg-ar">' + esc(z.ar) + '</div><div class="dlg-tr">' + esc(z.tr) + '</div><div class="dlg-de">' + esc(z.de) + '</div>')
      : ('<div class="silben-antwort" id="dlg-antwort-' + i + '" lang="ar" dir="rtl">' + esc(woerter.slice(0, soweit.length).join(' ')) + '</div>' +
         '<div class="silben-pool">' +
           reihenfolge.map(function(wi){
             var schonDran = soweit.indexOf(wi) !== -1;
             return '<button class="silben-kachel' + (schonDran ? ' correct' : '') + '" ' + (schonDran ? 'disabled' : '') +
               ' onclick="dlgRollenspielTippe(' + i + ',' + wi + ', this)" lang="ar" dir="rtl">' + esc(woerter[wi]) + '</button>';
           }).join('') +
         '</div>');
    return '<div class="dlg-line b">' +
      '<div class="dlg-bubble">' +
        '<div class="dlg-sprecher">Person 2 — du</div>' +
        inhalt +
      '</div>' +
    '</div>';
  }).join('');
  html += dialogQuizTrailerHtml();
  body.innerHTML = html;
}

function dlgRollenspielTippe(zeilenIdx, wi, btn){
  var d = aktuellerDialog;
  var z = d.zeilen[zeilenIdx];
  var woerter = dialogZeileWoerter(z.ar);
  var arr = dialogRollenspielOrder[zeilenIdx] || (dialogRollenspielOrder[zeilenIdx] = []);
  var erwartet = arr.length;
  if(wi === erwartet){
    arr.push(wi);
    btn.classList.add('correct'); btn.disabled = true;
    var anzeige = document.getElementById('dlg-antwort-' + zeilenIdx);
    if(anzeige) anzeige.textContent = woerter.slice(0, arr.length).join(' ');
    if(arr.length === woerter.length){
      speak(z.ar);
      setTimeout(function(){ renderDialogRollenspiel(); }, 900);
    }
  } else {
    btn.classList.add('wrong');
    setTimeout(function(){ btn.classList.remove('wrong'); }, 350);
  }
}

function speakDialogZeile(dialogId, zeilenIdx){
  var d = findDialog(dialogId);
  if(d && d.zeilen[zeilenIdx]){ speak(d.zeilen[zeilenIdx].ar); }
}

function dialogAlleAnhoeren(){
  if(!aktuellerDialog || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  var voices = window.speechSynthesis.getVoices();
  var arVoice = null;
  for(var i=0;i<voices.length;i++){
    if(voices[i].lang && voices[i].lang.indexOf('ar') === 0){ arVoice = voices[i]; break; }
  }
  aktuellerDialog.zeilen.forEach(function(z){
    var u = new SpeechSynthesisUtterance(z.ar);
    u.lang = 'ar-SA'; u.rate = 0.75;
    if(arVoice) u.voice = arVoice;
    window.speechSynthesis.speak(u);
  });
}

function toggleDialogHilfe(){
  var body = document.getElementById('dialog-body');
  body.classList.toggle('hide-help');
  var btn = document.getElementById('dlg-help-btn');
  if(btn) btn.textContent = body.classList.contains('hide-help') ? 'Übersetzung einblenden' : 'Übersetzung ausblenden';
}

// AP 2.2: 2 Kachel-Satz-Produktionsfragen pro Dialog, live aus den
// Dialogzeilen abgeleitet (kein zusätzliches Datenerfassen nötig — trägt
// automatisch auch alle künftigen Dialoge). Je 1 Distraktor-Kachel, die
// garantiert kein Teil der Lösung ist.
function kachelsatzFragenAusDialog(d, anzahl){
  var kandidaten = d.zeilen.filter(function(z){ return dialogZeileWoerter(z.ar).length >= 2; });
  var gewaehlt = shuffle(kandidaten.slice()).slice(0, anzahl);
  var alleWoerter = [];
  d.zeilen.forEach(function(z){ dialogZeileWoerter(z.ar).forEach(function(w){ alleWoerter.push(w); }); });
  return gewaehlt.map(function(z){
    var woerter = dialogZeileWoerter(z.ar);
    var vokForms = (typeof ALLE_VOKABELN !== 'undefined') ? ALLE_VOKABELN.map(function(v){ return v.arabic; }) : [];
    var kandidatenDistraktor = shuffle(FUNKTIONSWOERTER.concat(alleWoerter, vokForms).filter(function(w){ return woerter.indexOf(w) === -1; }));
    var distraktor = kandidatenDistraktor[0];
    return { typ:'kachelsatz', frage:'Baue den Satz aus den Kacheln', woerter:woerter, distraktor:distraktor, tr:z.tr, de:z.de, ar:z.ar };
  });
}

function startDialogQuiz(){
  exerciseReturnView = 'dialog';
  if(!aktuellerDialog) return;
  var mcFragen = shuffle(aktuellerDialog.fragen).map(function(f){
    return { typ:f.typ, frage:f.frage, glyph:f.glyph, richtig:f.richtig,
      optionen: shuffle(f.optionen.slice()), audio:(f.typ === 'wort') ? f.glyph : f.richtig };
  });
  var kachelFragen = kachelsatzFragenAusDialog(aktuellerDialog, 2);
  exam.fragen = shuffle(mcFragen.concat(kachelFragen));
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'dialog';
  go('exercise');
  renderExamQuestion();
}

function renderKachelsatzFrage(q){
  var body = document.getElementById('exercise-body');
  var pct = Math.round((exam.index / exam.fragen.length) * 100);
  dialogKachelsatzReihenfolge = [];
  var reihenfolge = shuffle(q.woerter.map(function(_, i){ return i; }).concat(['d']));
  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">' + esc(q.frage) + ' — „' + esc(q.de) + '"</div>' +
    '<div class="silben-antwort" id="dlg-kachelsatz-antwort" lang="ar" dir="rtl"></div>' +
    '<div class="silben-pool" id="dlg-kachelsatz-pool">' +
      reihenfolge.map(function(i){
        var wort = (i === 'd') ? q.distraktor : q.woerter[i];
        return '<button class="silben-kachel" data-i="' + i + '" onclick="dlgKachelsatzTippe(\'' + i + '\', this)" lang="ar" dir="rtl">' + esc(wort) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
}

var dialogKachelsatzReihenfolge = [];
function dlgKachelsatzTippe(i, btn){
  var q = exam.fragen[exam.index];
  var erwartet = dialogKachelsatzReihenfolge.length;
  if(i !== 'd' && parseInt(i, 10) === erwartet){
    dialogKachelsatzReihenfolge.push(q.woerter[erwartet]);
    btn.classList.add('correct'); btn.disabled = true;
    document.getElementById('dlg-kachelsatz-antwort').textContent = dialogKachelsatzReihenfolge.join(' ');
    if(dialogKachelsatzReihenfolge.length === q.woerter.length){
      var fb = document.getElementById('ex-feedback');
      fb.textContent = 'Richtig ✦ — ' + q.tr; fb.className = 'ex-feedback good';
      exam.richtig++;
      speak(q.ar);
      setTimeout(function(){ exam.index++; renderExamQuestion(); }, 1400);
    }
  } else {
    btn.classList.add('wrong');
    setTimeout(function(){ btn.classList.remove('wrong'); }, 350);
  }
}

/* ============================================================
   SATZBAU-ÜBUNG (AP 2.3) — Kachel-Sätze aus den Beispielsätzen der
   Vokabeln (exampleArabic/exampleTranslation). Nutzt denselben
   generischen Mechanismus wie die Kachel-Satz-Fragen im Dialog-Quiz
   (AP 2.2): renderKachelsatzFrage()/dlgKachelsatzTippe() sind bereits
   typ-generisch und werden hier unverändert wiederverwendet.
   Der Distraktor wird strukturell außerhalb der Satzwörter gewählt
   (Filter schließt sie aus) — er kann daher nie Teil der Lösung sein.
   ============================================================ */
function satzbauEintragVonVokabel(v){
  if(!v || !v.exampleArabic || !v.exampleTranslation || !v.exampleTranslation.de) return null;
  var woerter = dialogZeileWoerter(v.exampleArabic);
  if(woerter.length < 2) return null;
  return { ar:v.exampleArabic, woerter:woerter, de:v.exampleTranslation.de };
}
function satzbauPool(){
  return ALLE_VOKABELN.map(satzbauEintragVonVokabel).filter(Boolean);
}
// Nur Sätze aus bereits kontaktierten Lektion-2-Lektionen (Erstkontakt-Prinzip
// aus AP 2.1) — für die Tages-Session, damit dort nichts Unbekanntes auftaucht.
function satzbauPoolBesucht(){
  if(typeof besuchteVokabIds !== 'function') return [];
  var besucht = besuchteVokabIds();
  return ALLE_VOKABELN.filter(function(v){ return besucht.has(v.id); }).map(satzbauEintragVonVokabel).filter(Boolean);
}
function satzbauFrage(eintrag){
  var vokForms = ALLE_VOKABELN.map(function(v){ return v.arabic; });
  var kandidaten = shuffle(FUNKTIONSWOERTER.concat(vokForms).filter(function(w){ return eintrag.woerter.indexOf(w) === -1; }));
  return { typ:'kachelsatz', frage:'Baue den Satz aus den Kacheln', woerter:eintrag.woerter, distraktor:kandidaten[0], tr:eintrag.de, de:eintrag.de, ar:eintrag.ar };
}


/* ============================================================
   STUFENPRÜFUNG — 20 gemischte Fragen, ab 80% bestanden
   Bestehen schaltet die nächste Stufe frei (+ dient als Skip-Test)
   ============================================================ */
var EXAM_KEY = 'almiftah_exams';
var examData = loadExams();

function loadExams(){
  try { return JSON.parse(localStorage.getItem(EXAM_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveExams(){
  try { localStorage.setItem(EXAM_KEY, JSON.stringify(examData)); } catch(e){}
}
function stufe1Bestanden(){
  return !!(examData.stufe1 && examData.stufe1.passed);
}

/* ============================================================
   STUFENPRÜFUNG 2.0 (AP 1.6) — 27 Fragen aus allen 12 Lektionen:
   6 Erkennen · 4 Hören · 5 Vokale/Tanwin · 5 Lesen · 4 Sonderzeichen ·
   3 Sonne/Mond. Bestehen ab 85%. Zulassung nur mit allen 12 Lektionen
   bestanden (Ausnahme: "Kann ich schon"-Skip). 30-Min-Cooldown nach
   Fehlversuch, Fragen werden pro Versuch aus Pools ≥5× gezogen und
   meiden dabei die Fragen des letzten Versuchs, damit sich zwei
   aufeinanderfolgende Prüfungen nicht wiederholen.
   Bewusst nicht enthalten: der "3 Schreiben"-Anteil aus dem Masterplan —
   erfordert die Stroke-Order-Engine aus AP 1.4, die es noch nicht gibt.
   ============================================================ */
var PRUEFUNG_COOLDOWN_MS = 30 * 60 * 1000;
function pruefungCooldownRestMs(){
  var rec = examData.stufe1;
  if(!rec || !rec.cooldownUntil) return 0;
  return Math.max(0, rec.cooldownUntil - Date.now());
}
function pruefungFrageKey(q){
  return (q.typ === 'buchstabe' || q.typ === 'hoeren') ? q.audio : q.richtig;
}
// Zieht n Fragen aus dem Pool, meidet dabei Fragen aus "vermeiden" (letzter
// Versuch) — fällt nur auf den vollen Pool zurück, wenn zu wenige frische übrig sind.
function pruefungOhneWiederholung(pool, n, vermeiden){
  var frisch = pool.filter(function(q){ return vermeiden.indexOf(pruefungFrageKey(q)) < 0; });
  var quelle = frisch.length >= n ? frisch : pool;
  return shuffle(quelle).slice(0, n);
}

function buildExam2(){
  var vermeiden = (examData.stufe1 && examData.stufe1.letzteFragenIds) || [];
  var fragen = [];

  // 6 Erkennen (Pool 28 Buchstaben × 5 Varianten = 140)
  var erkennenPool = [];
  ALL_LETTERS.forEach(function(l){ for(var i=0;i<5;i++){ erkennenPool.push(letterFrageErkennen(l)); } });
  fragen = fragen.concat(pruefungOhneWiederholung(erkennenPool, 6, vermeiden));

  // 4 Hören (Pool 80)
  var hoerenPool = [];
  for(var h=0; h<80; h++){
    var hq = buildHoerQuestion();
    hoerenPool.push({ typ:'hoeren', frage:'Welchen Buchstaben hörst du?', glyph:null,
      richtig:hq.richtig, optionen:hq.optionen, audio:hq.audio });
  }
  fragen = fragen.concat(pruefungOhneWiederholung(hoerenPool, 4, vermeiden));

  // 5 Vokale/Tanwin (Pool 80, deckt L8-L10 ab)
  var harakaPool = [];
  for(var v=0; v<80; v++){
    var q = buildHaQuestion();
    harakaPool.push({ typ:'haraka', frage:'Wie wird das ausgesprochen?', glyph:q.anzeige,
      richtig:q.richtig, optionen:q.optionen, audio:q.audio });
  }
  fragen = fragen.concat(pruefungOhneWiederholung(harakaPool, 5, vermeiden));

  // 5 Lesen (Pool 26 Wörter × 5 Varianten = 130)
  var lesenPool = [];
  ALLE_WOERTER.forEach(function(w){
    for(var j=0;j<5;j++){
      lesenPool.push({ typ:'wort', frage:'Wie liest man das?', glyph:w.ar,
        richtig:w.tr, optionen: shuffle([w.tr].concat(w.falsch)), audio:w.ar, de:w.de });
    }
  });
  fragen = fragen.concat(pruefungOhneWiederholung(lesenPool, 5, vermeiden));

  // 4 Sonderzeichen (L11; Pool 10×3 Erkennen + 20×3 Lesen = 90)
  var szPool = [];
  SONDERZEICHEN.forEach(function(s){ for(var k=0;k<3;k++){ szPool.push(sonderzeichenFrageErkennen(s)); } });
  ALLE_SONDERZEICHEN_WOERTER.forEach(function(w){ for(var m=0;m<3;m++){ szPool.push(sonderzeichenWortFrage(w)); } });
  fragen = fragen.concat(pruefungOhneWiederholung(szPool, 4, vermeiden));

  // 3 Sonne/Mond (L12; Pool 28×3 Lesen + 28×3 Einordnen = 168)
  var smPool = [];
  SONNENMOND_WOERTER.forEach(function(w){ for(var p=0;p<3;p++){ smPool.push(sonnenmondWortFrage(w)); } });
  SONNENBUCHSTABEN.concat(MONDBUCHSTABEN).forEach(function(ch){ for(var q2=0;q2<3;q2++){ smPool.push(sonnenmondArtFrage(ch)); } });
  fragen = fragen.concat(pruefungOhneWiederholung(smPool, 3, vermeiden));

  return shuffle(fragen);
}

var exam = { fragen:[], index:0, richtig:0, aktiv:false, mode:'pruefung' };

// Normaler Einstieg: erfordert alle 12 Lektionen bestanden.
function startStufenpruefung(){
  if(typeof alleLektionenBestanden === 'function' && !alleLektionenBestanden()){
    alert('Schließe zuerst alle 12 Lektionen ab, um zur Stufenprüfung zu gelangen.');
    go('letters');
    return;
  }
  starteStufenpruefungIntern();
}
// "Kann ich schon"-Weg: bewusst ohne Lektions-Gate, führt aber durch dieselbe Prüfung.
function startStufenpruefungSkip(){
  starteStufenpruefungIntern();
}
function starteStufenpruefungIntern(){
  var restMs = pruefungCooldownRestMs();
  if(restMs > 0){
    alert('Der nächste Versuch ist erst in ' + Math.ceil(restMs / 60000) + ' Minuten möglich.');
    return;
  }
  exerciseReturnView = 'letters';
  exam.fragen = buildExam2();
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'pruefung';
  examData.stufe1 = examData.stufe1 || { passed:false, best:0, versuche:0, history:[] };
  examData.stufe1.letzteFragenIds = exam.fragen.map(pruefungFrageKey);
  saveExams();
  go('exercise');
  renderExamQuestion();
}

function renderExamQuestion(){
  var body = document.getElementById('exercise-body');
  if(exam.index >= exam.fragen.length){ renderExamDone(); return; }
  var q = exam.fragen[exam.index];
  if(q.typ === 'schreiben'){ renderExamSchreibenFrage(q); return; }
  if(q.typ === 'silben'){ renderSilbenFrage(q); return; }
  if(q.typ === 'kachelsatz'){ renderKachelsatzFrage(q); return; }
  var pct = Math.round((exam.index / exam.fragen.length) * 100);
  var glyphSize = (q.typ === 'wort') ? 'style="font-size:clamp(3.5rem, 16vw, 6rem);"' : '';
  var cols = (q.typ === 'wort') ? 'style="grid-template-columns:1fr;"' : '';
  if(q.typ === 'hoeren'){ cols = 'style="grid-template-columns:repeat(' + q.optionen.length + ',1fr);"'; }
  if(q.typ === 'dear'){ cols = 'style="grid-template-columns:1fr 1fr;"'; }
  var optKlasse = (q.typ === 'hoeren' || q.typ === 'dear') ? 'ex-option ar-opt' : 'ex-option';

  var kopf = (exam.mode === 'pruefung')
    ? '<div class="ex-question">Prüfung · Frage ' + (exam.index+1) + ' von ' + exam.fragen.length + '</div>'
    : '';

  var mitte;
  if(q.typ === 'hoeren'){
    mitte = '<button class="ex-play" data-say="' + esc(q.audio) + '" aria-label="Abspielen">▷</button>';
  } else if(q.typ === 'dear'){
    mitte = '<div class="ex-glyph" style="font-family:\'Cormorant Garamond\',serif; font-size:clamp(1.6rem,6vw,2.4rem); font-style:italic;">' + esc(q.glyph) + '</div>';
  } else {
    mitte = '<div class="ex-glyph" ' + glyphSize + '>' + esc(q.glyph) + '</div>';
  }

  exam.richtigIdx = q.optionen.indexOf(q.richtig);
  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    kopf +
    '<div class="ex-question" style="margin-top:-.8rem;">' + esc(q.frage) + '</div>' +
    mitte +
    '<div class="ex-options" ' + cols + '>' +
      q.optionen.map(function(o, idx){
        return '<button class="' + optKlasse + '" data-idx="' + idx + '" onclick="examAnswer(this)">' + esc(o) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';

  if(q.typ === 'hoeren' && audioUnlocked){ speak(q.audio); }
}

function examAnswer(btn){
  var q = exam.fragen[exam.index];
  var buttons = document.querySelectorAll('.ex-option');
  for(var i=0;i<buttons.length;i++){ buttons[i].disabled = true; }
  var fb = document.getElementById('ex-feedback');
  var isRight = (parseInt(btn.getAttribute('data-idx'), 10) === exam.richtigIdx);

  if(isRight){
    btn.classList.add('correct');
    exam.richtig++;
    fb.textContent = 'Richtig ✦' + (q.de ? ' — ' + q.de : '');
    fb.className = 'ex-feedback good';
  } else {
    btn.classList.add('wrong');
    if(buttons[exam.richtigIdx]) buttons[exam.richtigIdx].classList.add('correct');
    fb.textContent = 'Richtig wäre: ' + q.richtig;
    fb.className = 'ex-feedback bad';
  }
  if(q.srsKey){ srsGrade(q.srsKey, isRight); }
  if((exam.mode === 'lektion' || exam.mode === 'lektion2') && !isRight){
    if(!exam.lektionFalsch) exam.lektionFalsch = [];
    exam.lektionFalsch.push(q);
  }
  if(q.audio){ speak(q.audio); }
  setTimeout(function(){ exam.index++; renderExamQuestion(); }, 1300);
}

/* ============================================================
   SCHREIBEN-FRAGE im Lektions-Check (AP 1.4, ab Lektion 2)
   Eigene, schlanke Canvas-Instanz — unabhängig vom großen
   Schreibtrainer (writing.js), gleiche Flächen-Präzision wie dort.
   Bestehen ab 70%.
   ============================================================ */
var EX_WSIZE = 220;
var exWriteCtx = null, exWriteDrawing = false, exWriteLast = null;
var exWriteMaskFlag = null, exWriteMaskTotal = 0;

function schreibFrage(ch){
  return { typ:'schreiben', frage:'Schreibe diesen Buchstaben nach', ch:ch, richtig:ch, srsKey:ch };
}

function renderExamSchreibenFrage(q){
  var body = document.getElementById('exercise-body');
  var pct = Math.round((exam.index / exam.fragen.length) * 100);
  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">Schreibe diesen Buchstaben nach</div>' +
    '<div class="detail-glyph" style="font-size:2.4rem;" lang="ar" dir="rtl">' + esc(q.ch) + '</div>' +
    '<div class="write-stage" style="width:' + EX_WSIZE + 'px; height:' + EX_WSIZE + 'px; margin:0 auto 1rem;">' +
      '<canvas id="ex-write-back" width="' + EX_WSIZE + '" height="' + EX_WSIZE + '"></canvas>' +
      '<canvas id="ex-write-front" width="' + EX_WSIZE + '" height="' + EX_WSIZE + '"></canvas>' +
    '</div>' +
    '<div style="display:flex; gap:.6rem; justify-content:center;">' +
      '<button class="btn-ghost" onclick="exSchreibenLoeschen()">↺ Löschen</button>' +
      '<button class="btn-gold" id="ex-schreiben-fertig" onclick="exSchreibenFertig()">Fertig</button>' +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
  exSchreibenSetup(q.ch);
}

function exSchreibenSetup(ch){
  var back = document.getElementById('ex-write-back');
  var front = document.getElementById('ex-write-front');
  var backCtx = back.getContext('2d');
  exWriteCtx = front.getContext('2d');
  var fontSize = Math.round(EX_WSIZE * 0.75);

  backCtx.fillStyle = 'rgba(224,187,69,0.18)';
  backCtx.font = 'bold ' + fontSize + 'px "Noto Naskh Arabic", serif';
  backCtx.textAlign = 'center'; backCtx.textBaseline = 'middle';
  backCtx.fillText(ch, EX_WSIZE/2, EX_WSIZE/2 + 6);

  var m = document.createElement('canvas'); m.width = EX_WSIZE; m.height = EX_WSIZE;
  var mc = m.getContext('2d');
  mc.fillStyle = '#fff';
  mc.font = 'bold ' + fontSize + 'px "Noto Naskh Arabic", serif';
  mc.textAlign = 'center'; mc.textBaseline = 'middle';
  mc.fillText(ch, EX_WSIZE/2, EX_WSIZE/2 + 6);
  var data = mc.getImageData(0,0,EX_WSIZE,EX_WSIZE).data;
  exWriteMaskFlag = new Uint8Array(EX_WSIZE*EX_WSIZE);
  var maskCount = 0;
  for(var y=0;y<EX_WSIZE;y+=2){
    for(var x=0;x<EX_WSIZE;x+=2){
      var i = (y*EX_WSIZE+x)*4;
      if(data[i+3] > 80){ exWriteMaskFlag[y*EX_WSIZE+x] = 1; maskCount++; }
    }
  }
  exWriteMaskTotal = maskCount;

  front.addEventListener('pointerdown', exWDown);
  front.addEventListener('pointermove', exWMove);
  window.addEventListener('pointerup', exWUp);
  front.addEventListener('touchstart', function(e){ e.preventDefault(); exWDown(tPos(e)); }, {passive:false});
  front.addEventListener('touchmove',  function(e){ e.preventDefault(); exWMove(tPos(e)); }, {passive:false});
  front.addEventListener('touchend',   function(e){ e.preventDefault(); exWUp(); }, {passive:false});
}

function exWPos(e){
  var front = document.getElementById('ex-write-front');
  var rect = front.getBoundingClientRect();
  var sx = front.width / rect.width, sy = front.height / rect.height;
  return { x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy };
}
function exWDown(e){ if(e.preventDefault) e.preventDefault(); exWriteDrawing = true; exWriteLast = exWPos(e); exWDot(exWriteLast); }
function exWMove(e){ if(!exWriteDrawing) return; if(e.preventDefault) e.preventDefault(); var p = exWPos(e); exWStroke(exWriteLast, p); exWriteLast = p; }
function exWUp(){ exWriteDrawing = false; }
function exWDot(p){ exWriteCtx.fillStyle = '#e0bb45'; exWriteCtx.beginPath(); exWriteCtx.arc(p.x, p.y, 7, 0, Math.PI*2); exWriteCtx.fill(); }
function exWStroke(a, b){
  exWriteCtx.strokeStyle = '#e0bb45'; exWriteCtx.lineWidth = 13; exWriteCtx.lineCap = 'round'; exWriteCtx.lineJoin = 'round';
  exWriteCtx.beginPath(); exWriteCtx.moveTo(a.x, a.y); exWriteCtx.lineTo(b.x, b.y); exWriteCtx.stroke();
}
function exSchreibenLoeschen(){ exWriteCtx.clearRect(0,0,EX_WSIZE,EX_WSIZE); }

function exSchreibenFertig(){
  var q = exam.fragen[exam.index];
  var data = exWriteCtx.getImageData(0,0,EX_WSIZE,EX_WSIZE).data;
  var paintedTotal = 0, paintedInMask = 0;
  for(var y=0;y<EX_WSIZE;y+=2){
    for(var x=0;x<EX_WSIZE;x+=2){
      var mi = y*EX_WSIZE+x;
      if(data[mi*4+3] > 0){ paintedTotal++; if(exWriteMaskFlag[mi]) paintedInMask++; }
    }
  }
  var hitRatio = exWriteMaskTotal ? paintedInMask / exWriteMaskTotal : 0;
  var strayRatio = paintedTotal > 0 ? (paintedTotal - paintedInMask) / paintedTotal : 0;
  // Gleiche Erfolgsschwelle wie im Haupt-Schreibtrainer (AP 0.1/1.2), dort
  // bereits kalibriert und geprüft: eine subtraktive Kombi-Formel mit festem
  // 70%-Cutoff erwies sich als unerreichbar (selbst perfektes Nachfahren des
  // Skelettpfads erreicht wegen fester Stiftbreite vs. variabler Glyphenbreite
  // nur ~60-70% Flächentreffer). hitRatio>=60% UND strayRatio<=25% trennt
  // gutes Nachzeichnen zuverlässig von Kritzeln (das >90% Streuung erzeugt).
  var isRight = (hitRatio >= 0.60 && strayRatio <= 0.25);
  var anzeige = Math.round(hitRatio * 100);

  document.getElementById('ex-schreiben-fertig').disabled = true;
  var fb = document.getElementById('ex-feedback');
  if(isRight){ fb.textContent = 'Gut getroffen ✦ (' + anzeige + '%)'; fb.className = 'ex-feedback good'; exam.richtig++; }
  else { fb.textContent = 'Übe die Form noch — (' + anzeige + '%)'; fb.className = 'ex-feedback bad'; }

  if(q.srsKey){ srsGrade(q.srsKey, isRight); }
  if(exam.mode === 'lektion' && !isRight){
    if(!exam.lektionFalsch) exam.lektionFalsch = [];
    exam.lektionFalsch.push(q);
  }
  setTimeout(function(){ exam.index++; renderExamQuestion(); }, 1300);
}

/* ============================================================
   SILBEN BAUEN (AP 1.5) — Kacheln in der richtigen Reihenfolge tippen.
   Eigenständige Übung UND als Fragetyp 'silben' im Exam-Engine-Dispatch
   (für die Tages-Session).
   ============================================================ */
var silbenWoerter = [];
var silbenIndex = 0;
var silbenCorrect = 0;
var silbenAktuelleReihenfolge = [];

function silbenPool(){ return SILBEN_WOERTER.filter(function(w){ return w.silben.length >= 2; }); }

function startSilbenUebung(){
  exerciseReturnView = 'letters';
  silbenWoerter = shuffle(silbenPool()).slice(0, 8);
  silbenIndex = 0; silbenCorrect = 0;
  go('exercise');
  renderSilbenFrage();
}

function silbenFrage(w){ return { typ:'silben', wort:w }; }

function renderSilbenFrage(q){
  var body = document.getElementById('exercise-body');
  var w, pct, kopf;
  if(q){ // eingebettet im Exam-Engine-Dispatch (Tages-Session)
    w = q.wort; pct = Math.round((exam.index / exam.fragen.length) * 100); kopf = '';
  } else { // eigenständige Übung
    if(silbenIndex >= silbenWoerter.length){ renderSilbenDone(); return; }
    w = silbenWoerter[silbenIndex]; pct = Math.round((silbenIndex / silbenWoerter.length) * 100); kopf = '';
  }
  silbenAktuelleReihenfolge = [];
  var poolReihenfolge = shuffle(w.silben.map(function(_, i){ return i; }));

  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    kopf +
    '<div class="ex-question">Baue das Wort für „' + esc(w.de) + '"</div>' +
    '<button class="ex-play" data-say="' + esc(w.ar) + '" aria-label="Abspielen">▷</button>' +
    '<div class="silben-antwort" id="silben-antwort" lang="ar" dir="rtl"></div>' +
    '<div class="silben-pool" id="silben-pool">' +
      poolReihenfolge.map(function(i){
        return '<button class="silben-kachel" data-i="' + i + '" onclick="silbenTippe(' + i + ', this, ' + (q ? 'true' : 'false') + ')" lang="ar" dir="rtl">' + esc(w.silben[i]) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
}

function silbenTippe(i, btn, eingebettet){
  var w = eingebettet ? exam.fragen[exam.index].wort : silbenWoerter[silbenIndex];
  var erwartet = silbenAktuelleReihenfolge.length;
  if(i === erwartet){
    silbenAktuelleReihenfolge.push(w.silben[i]);
    btn.classList.add('correct'); btn.disabled = true;
    document.getElementById('silben-antwort').textContent = silbenAktuelleReihenfolge.join('');
    if(silbenAktuelleReihenfolge.length === w.silben.length){
      var fb = document.getElementById('ex-feedback');
      fb.textContent = 'Richtig ✦ — ' + w.tr; fb.className = 'ex-feedback good';
      speak(w.ar);
      if(eingebettet){
        exam.richtig++;
        setTimeout(function(){ exam.index++; renderExamQuestion(); }, 1400);
      } else {
        silbenCorrect++;
        setTimeout(function(){ silbenIndex++; renderSilbenFrage(); }, 1400);
      }
    }
  } else {
    btn.classList.add('wrong');
    setTimeout(function(){ btn.classList.remove('wrong'); }, 350);
  }
}

function renderSilbenDone(){
  var body = document.getElementById('exercise-body');
  var msg = (silbenCorrect === silbenWoerter.length) ? 'Makellos zusammengesetzt! ✦' : 'Gut gemacht — Silben werden mit jeder Runde vertrauter.';
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + silbenCorrect + ' von ' + silbenWoerter.length + ' richtig</h2>' +
      '<p>' + msg + '</p>' +
      '<button class="btn-gold" onclick="startSilbenUebung()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;"><button class="btn-ghost" onclick="go(\'letters\')">Zurück</button></div>' +
    '</div>';
}

/* ============================================================
   SCHNELL-LESEN (AP 1.5) — Lesefluss mit Zeitbonus.
   Punkte gelten nur für diese Übungsrunde (kein app-weites XP-System —
   das ist erst Phase 6 des Masterplans); Tempo motiviert, entscheidet
   aber nicht über Bestehen.
   ============================================================ */
var schnellWoerter = [];
var schnellIndex = 0;
var schnellPunkte = 0;
var schnellStart = 0;
var schnellRichtigIdx = 0;

function startSchnellLesen(){
  exerciseReturnView = 'letters';
  schnellWoerter = shuffle(ALLE_WOERTER.concat(SILBEN_WOERTER)).slice(0, 10);
  schnellIndex = 0; schnellPunkte = 0;
  go('exercise');
  renderSchnellFrage();
}

function renderSchnellFrage(){
  var body = document.getElementById('exercise-body');
  if(schnellIndex >= schnellWoerter.length){ renderSchnellDone(); return; }
  var w = schnellWoerter[schnellIndex];
  var optionen = shuffle([w.tr].concat(w.falsch));
  schnellRichtigIdx = optionen.indexOf(w.tr);
  schnellStart = Date.now();
  var pct = Math.round((schnellIndex / schnellWoerter.length) * 100);
  body.innerHTML =
    '<div class="ex-progress"><div class="ex-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="ex-question">Schnell gelesen? · Punkte: ' + schnellPunkte + '</div>' +
    '<div class="ex-glyph" style="font-size:clamp(3.5rem, 16vw, 6rem);" lang="ar" dir="rtl">' + esc(w.ar) + '</div>' +
    '<div class="ex-options" style="grid-template-columns:1fr 1fr;">' +
      optionen.map(function(o, idx){
        return '<button class="ex-option" data-idx="' + idx + '" onclick="schnellAntwort(this)">' + esc(o) + '</button>';
      }).join('') +
    '</div>' +
    '<div class="ex-feedback" id="ex-feedback" role="status" aria-live="polite"></div>';
}

function schnellAntwort(btn){
  var w = schnellWoerter[schnellIndex];
  var buttons = document.querySelectorAll('.ex-option');
  for(var i=0;i<buttons.length;i++){ buttons[i].disabled = true; }
  var isRight = (parseInt(btn.getAttribute('data-idx'), 10) === schnellRichtigIdx);
  var elapsedSec = (Date.now() - schnellStart) / 1000;
  var fb = document.getElementById('ex-feedback');

  if(isRight){
    btn.classList.add('correct');
    var bonus = elapsedSec <= 3 ? 2 : 1;
    schnellPunkte += bonus;
    fb.textContent = 'Richtig ✦ +' + bonus + ' Punkte (' + elapsedSec.toFixed(1) + 's)';
    fb.className = 'ex-feedback good';
  } else {
    if(buttons[schnellRichtigIdx]) buttons[schnellRichtigIdx].classList.add('correct');
    btn.classList.add('wrong');
    fb.textContent = 'Es heißt „' + w.tr + '"';
    fb.className = 'ex-feedback bad';
  }
  speak(w.ar);
  setTimeout(function(){ schnellIndex++; renderSchnellFrage(); }, 1300);
}

function renderSchnellDone(){
  var body = document.getElementById('exercise-body');
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + schnellPunkte + ' Punkte gesammelt</h2>' +
      '<p>Tempo motiviert — für deinen Fortschritt zählt trotzdem vor allem, dass du liest.</p>' +
      '<button class="btn-gold" onclick="startSchnellLesen()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;"><button class="btn-ghost" onclick="go(\'letters\')">Zurück</button></div>' +
    '</div>';
}

function renderExamDone(){
  exam.aktiv = false;
  var body = document.getElementById('exercise-body');
  var n = exam.fragen.length;

  if(exam.mode === 'lektion'){
    if(typeof handleLektionExamDone === 'function') handleLektionExamDone();
    return;
  }

  if(exam.mode === 'lektion2'){
    if(typeof handleLektion2ExamDone === 'function') handleLektion2ExamDone();
    return;
  }

  if(exam.mode === 'pruefung'){
    var grenze = Math.ceil(n * 0.85);
    var bestandenJetzt = exam.richtig >= grenze;
    var rec = examData.stufe1 || { passed:false, best:0, versuche:0, history:[] };
    rec.versuche = (rec.versuche || 0) + 1;
    rec.best = Math.max(rec.best || 0, exam.richtig);
    rec.history = (rec.history || []).concat([{ ts: Date.now(), score: exam.richtig, von: n }]).slice(-20);

    if(bestandenJetzt){
      var vorher = !!rec.passed;
      rec.passed = true;
      rec.date = new Date().toISOString();
      delete rec.cooldownUntil;
      examData.stufe1 = rec;
      saveExams();
      renderPath('intro-path');
      renderPath('start-path');
      syncAfterSession();
      body.innerHTML =
        '<div class="ex-done">' +
          '<div class="star" style="font-size:4rem;">✦</div>' +
          '<h2>Bestanden — ' + exam.richtig + ' von ' + n + '</h2>' +
          '<p>' + (vorher ? 'Stufe 1 erneut gemeistert. Stark!' : 'Du hast Stufe 1 gemeistert. <strong>Stufe 2 ist jetzt freigeschaltet!</strong>') + '</p>' +
          '<button class="btn-gold" onclick="go(\'start\')">Zur Übersicht</button>' +
        '</div>';
    } else {
      rec.cooldownUntil = Date.now() + PRUEFUNG_COOLDOWN_MS;
      examData.stufe1 = rec;
      saveExams();
      var restMs = pruefungCooldownRestMs();
      var retryBtn = restMs > 0
        ? '<button class="btn-gold" disabled>⏳ Nächster Versuch in ' + Math.ceil(restMs / 60000) + ' Min.</button>'
        : '<button class="btn-gold" onclick="startStufenpruefung()">Nochmal versuchen</button>';
      body.innerHTML =
        '<div class="ex-done">' +
          '<div class="star" style="opacity:.5;">✦</div>' +
          '<h2>' + exam.richtig + ' von ' + n + ' — noch nicht ganz</h2>' +
          '<p>Du brauchst ' + grenze + ' richtige Antworten. Übe noch etwas — die Lektionen warten auf dich.</p>' +
          retryBtn +
          '<div style="margin-top:1rem;">' +
            '<button class="btn-ghost" onclick="go(\'letters\')">Zurück zum Üben</button>' +
          '</div>' +
        '</div>';
    }
    return;
  }

  // daily / vokabel modes
  renderLetters();
  updateDaily();
  syncAfterSession();
  var msg;
  if(exam.mode === 'dialog'){
    msg = (exam.richtig === n)
      ? 'Du hast das Gespräch komplett verstanden! ✦'
      : 'Lies das Gespräch noch einmal — beim zweiten Mal sitzt es.';
  } else {
    msg = (exam.richtig === n)
      ? 'Makellos! Weiter so.'
      : 'Gut gemacht — dein Fortschritt wurde gespeichert.';
  }
  var again;
  if(exam.mode === 'vokabel'){
    again = '<button class="btn-gold" onclick="startVokabelExercise()">Nochmal üben</button>' +
      '<div style="margin-top:1rem;"><button class="btn-ghost" onclick="go(\'thema\')">Zurück zum Thema</button></div>';
  } else if(exam.mode === 'dialog'){
    if(aktuellerDialog && exam.richtig === n){
      dialogeDone.add(aktuellerDialog.id);
      saveDialogeDone(dialogeDone);
    }
    var dId = aktuellerDialog ? aktuellerDialog.id : 0;
    again = '<button class="btn-gold" onclick="openDialog(' + dId + ')">Zurück zum Gespräch</button>' +
      '<div style="margin-top:1rem;"><button class="btn-ghost" onclick="go(\'stufe2\')">Alle Gespräche</button></div>';
  } else {
    again = '<button class="btn-gold" onclick="go(\'start\')">Zur Übersicht</button>';
  }
  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star">✦</div>' +
      '<h2>' + exam.richtig + ' von ' + n + ' richtig</h2>' +
      '<p>' + msg + '</p>' +
      again +
    '</div>';
}

