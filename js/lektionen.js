/* lektionen.js — Lektionspfad Stufe 1: Gating, Rendering, Lektions-Check.
   Baut auf data-curriculum.js (STUFE1_LEKTIONEN) und der bestehenden
   Exam-Engine aus exercises.js (exam, renderExamQuestion, renderExamDone) auf.
   AP 1.1: Struktur + Gating + funktionierender Check.
   AP 1.2 (folgt): größere Fragenpools, Cooldown nach Fehlversuch, SRS-Box-
   Demotion gescheiterter Items — bewusst hier noch nicht enthalten. */

/* ============================================================
   FORTSCHRITT — welche Lektion ist bestanden?
   Struktur: { <id>: { passed:bool, best:int, versuche:int, letzterVersuch:ts } }
   ============================================================ */
var LEKTIONEN_KEY = 'almiftah_lektionen';

function loadLektionenState(){
  try { return JSON.parse(localStorage.getItem(LEKTIONEN_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveLektionenState(data){
  try { localStorage.setItem(LEKTIONEN_KEY, JSON.stringify(data)); } catch(e){}
}

function lektionData(id){
  for(var i=0;i<STUFE1_LEKTIONEN.length;i++){ if(STUFE1_LEKTIONEN[i].id === id) return STUFE1_LEKTIONEN[i]; }
  return null;
}
function lektionBestanden(id){
  var data = loadLektionenState();
  return !!(data[id] && data[id].passed);
}

// 'bestanden' | 'offen' | 'gesperrt' | 'bald' (Inhalt noch nicht verfügbar, AP 1.3)
function lektionStatus(id){
  var lek = lektionData(id);
  if(!lek) return 'gesperrt';
  if(lek.contentPending) return 'bald';
  if(lektionBestanden(id)) return 'bestanden';
  if(id === 1) return 'offen';
  var vorherige = lektionData(id - 1);
  if(!vorherige) return 'offen';
  if(vorherige.contentPending) return 'offen'; // eine "bald"-Lektion blockiert nichts
  return lektionBestanden(id - 1) ? 'offen' : 'gesperrt';
}

function lektionBeschreibung(l){
  if(l.contentPending) return 'Wird in einem kommenden Ausbauschritt ergänzt.';
  if(l.typ === 'buchstaben') return 'Buchstaben: ' + l.letters.join('  ');
  var namen = (l.harakatIds || []).map(function(hid){ var h = findHaraka(hid); return h ? h.name : hid; });
  return 'Vokalzeichen: ' + namen.join(', ');
}

function findHaraka(id){
  for(var i=0;i<HARAKAT.length;i++){ if(HARAKAT[i].id === id) return HARAKAT[i]; }
  return null;
}
function findWoerterGruppe(titel){
  for(var i=0;i<WOERTER_GRUPPEN.length;i++){ if(WOERTER_GRUPPEN[i].titel === titel) return WOERTER_GRUPPEN[i]; }
  return null;
}

/* ============================================================
   RENDER: Lektionspfad (wiederverwendet .path/.stop/.medallion aus core.js)
   ============================================================ */
function renderLektionsPfad(containerId){
  var c = document.getElementById(containerId);
  if(!c) return;
  c.innerHTML = STUFE1_LEKTIONEN.map(function(l){
    var status = lektionStatus(l.id);
    var offenbar = (status === 'offen' || status === 'bestanden');
    var clickable = offenbar ? 'stop-clickable' : '';
    var onclick = offenbar ? 'onclick="openLektion(' + l.id + ')"' : '';
    var tag = offenbar ? 'button' : 'div';
    var badge;
    if(status === 'bestanden') badge = '<span class="badge badge-ready">✦ Gemeistert</span>';
    else if(status === 'offen') badge = '<span class="badge badge-ready">Verfügbar</span>';
    else if(status === 'bald') badge = '<span class="badge badge-soon">In Vorbereitung</span>';
    else badge = '<span class="badge badge-soon">🔒 Vorherige Lektion abschließen</span>';
    return '<' + tag + ' class="stop ' + clickable + '" ' + onclick + '>' +
      '<div class="medallion">' + medallionSVG(false) + '</div>' +
      '<div class="stop-body">' +
        '<p class="stop-index">Lektion ' + l.id + '</p>' +
        '<p class="stop-title-ar">' + esc(l.titelAr) + '</p>' +
        '<h3 class="stop-title-de">' + esc(l.titel) + '</h3>' +
        '<p class="stop-desc">' + esc(lektionBeschreibung(l)) + '</p>' +
        badge +
      '</div>' +
    '</' + tag + '>';
  }).join('');
}

/* ============================================================
   LEKTIONS-DETAIL
   ============================================================ */
var aktuelleLektion = null;

function openLektion(id){
  var status = lektionStatus(id);
  if(status === 'gesperrt' || status === 'bald') return;
  aktuelleLektion = lektionData(id);
  if(!aktuelleLektion) return;
  renderLektionDetail();
  go('lektion');
}

function renderLektionDetail(){
  var l = aktuelleLektion;
  if(!l) return;
  document.getElementById('lektion-titel-ar').textContent = l.titelAr;
  document.getElementById('lektion-head').textContent = 'Lektion ' + l.id + ' — ' + l.titel;
  document.getElementById('lektion-unter').textContent = lektionBeschreibung(l);

  var html = '';
  if(l.typ === 'buchstaben'){
    var cards = l.letters.map(function(ch){
      var letter = findLetter(ch);
      var done = doneLetters.has(ch) ? 'done' : '';
      return '<button class="letter-card ' + done + '" onclick="openLetter(\'' + ch + '\')">' +
        '<span class="glyph">' + ch + '</span><span class="lname">' + esc(letter ? letter.name : ch) + '</span></button>';
    }).join('');
    html += '<div class="letter-grid" style="max-width:26rem; margin:0 auto 2rem;">' + cards + '</div>';
  } else if(l.harakatIds && l.harakatIds.length){
    html += '<div class="harakat-list" style="padding:0;">' + l.harakatIds.map(function(hid){
      var h = findHaraka(hid);
      if(!h) return '';
      return '<div class="haraka-card">' +
        '<div class="haraka-glyph">' + esc(h.beispiel) + '</div>' +
        '<div class="haraka-body">' +
          '<div><span class="haraka-name">' + esc(h.name) + '</span> <span class="haraka-ex-tr">— ' + esc(h.tr) + '</span></div>' +
          '<div class="haraka-desc">' + esc(h.desc) + '</div>' +
        '</div>' +
        '<button class="haraka-listen" data-say="' + esc(h.beispiel) + '" aria-label="Anhören">▷</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  if(l.contentPending){
    html += '<p style="text-align:center; color:rgba(242,232,208,0.7); font-style:italic; padding:1rem;">Diese Lektion wird in einem kommenden Ausbauschritt ergänzt.</p>';
  }

  document.getElementById('lektion-inhalt').innerHTML = html;

  var btn = document.getElementById('lektion-check-btn');
  if(btn) btn.style.display = l.contentPending ? 'none' : '';
}

/* ============================================================
   LEKTIONS-CHECK — Fragen bauen (Buchstaben- und Harakat-Lektionen)
   ============================================================ */
function alleBisherigenBuchstaben(bisId){
  var out = [];
  STUFE1_LEKTIONEN.forEach(function(l){
    if(l.typ === 'buchstaben' && l.id < bisId && lektionBestanden(l.id)){
      l.letters.forEach(function(ch){ var f = findLetter(ch); if(f) out.push(f); });
    }
  });
  return out;
}

function letterFrageErkennen(l){
  var andere = shuffle(ALL_LETTERS.filter(function(x){ return x.ch !== l.ch; })).slice(0,3);
  return { typ:'buchstabe', frage:'Welcher Buchstabe ist das?', glyph:l.ch, richtig:l.name,
    optionen: shuffle([l.name].concat(andere.map(function(a){ return a.name; }))), audio:l.ch };
}
function letterFrageHoeren(l){
  var andere = shuffle(ALL_LETTERS.filter(function(x){ return x.ch !== l.ch; })).slice(0,3);
  return { typ:'hoeren', frage:'Welchen Buchstaben hörst du?', glyph:null, richtig:l.ch,
    optionen: shuffle([l.ch].concat(andere.map(function(a){ return a.ch; }))), audio:l.ch };
}

function buildLektionFragenBuchstaben(lek){
  var n = 10;
  var eigene = lek.letters.map(findLetter).filter(Boolean);
  var review = shuffle(alleBisherigenBuchstaben(lek.id));
  var reviewCount = Math.min(review.length, Math.round(n * 0.3));
  var neuCount = n - reviewCount;

  var fragen = [];
  var neuBasis = [];
  eigene.forEach(function(l){ neuBasis.push({ l:l, art:'erkennen' }); neuBasis.push({ l:l, art:'hoeren' }); });
  shuffle(neuBasis).slice(0, neuCount).forEach(function(item){
    fragen.push(item.art === 'erkennen' ? letterFrageErkennen(item.l) : letterFrageHoeren(item.l));
  });
  review.slice(0, reviewCount).forEach(function(l){
    fragen.push(Math.random() < 0.5 ? letterFrageErkennen(l) : letterFrageHoeren(l));
  });
  // auffüllen, falls eine kleine Lektion (z. B. 3 Buchstaben) + fehlende Review nicht auf n kommt
  while(fragen.length < n && eigene.length){
    var extra = eigene[Math.floor(Math.random() * eigene.length)];
    fragen.push(Math.random() < 0.5 ? letterFrageErkennen(extra) : letterFrageHoeren(extra));
  }
  return shuffle(fragen).slice(0, n);
}

// Sub-Typ eines buildHaQuestion()-Ergebnisses am Muster der richtigen Antwort erkennen
function haTyp(q){
  if(/[āīū]$/.test(q.richtig)) return 'lang';
  if(/(an|in|un)$/.test(q.richtig)) return 'tanwin';
  return 'kurz';
}
function haFrageZielTyp(zielTyp){
  for(var versuch=0; versuch<20; versuch++){
    var q = buildHaQuestion();
    if(haTyp(q) === zielTyp){
      return { typ:'haraka', frage:'Wie wird das ausgesprochen?', glyph:q.anzeige,
        richtig:q.richtig, optionen:q.optionen, audio:q.audio };
    }
  }
  // Fallback: irgendeine Haraka-Frage, falls der Zieltyp selten getroffen wurde
  var q2 = buildHaQuestion();
  return { typ:'haraka', frage:'Wie wird das ausgesprochen?', glyph:q2.anzeige,
    richtig:q2.richtig, optionen:q2.optionen, audio:q2.audio };
}
function wortFrage(w){
  return { typ:'wort', frage:'Wie liest man das?', glyph:w.ar,
    richtig:w.tr, optionen: shuffle([w.tr].concat(w.falsch)), audio:w.ar, de:w.de };
}
function woerterAusGruppen(titel){
  var out = [];
  (titel || []).forEach(function(t){
    var g = findWoerterGruppe(t);
    if(g) out = out.concat(g.woerter);
  });
  return out;
}

function buildLektionFragenHarakat(lek){
  var n = 10;
  var zielTyp = (lek.typ === 'harakat') ? 'kurz' : (lek.typ === 'madd') ? 'lang' : 'tanwin';
  var fragen = [];
  for(var i=0;i<6;i++){ fragen.push(haFrageZielTyp(zielTyp)); }
  var woerter = shuffle(woerterAusGruppen(lek.woerterTitel));
  woerter.slice(0, 4).forEach(function(w){ fragen.push(wortFrage(w)); });
  while(fragen.length < n){ fragen.push(haFrageZielTyp(zielTyp)); }
  return shuffle(fragen).slice(0, n);
}

function buildLektionFragen(lek){
  return (lek.typ === 'buchstaben') ? buildLektionFragenBuchstaben(lek) : buildLektionFragenHarakat(lek);
}

function lektionBestehensgrenze(n){ return Math.ceil(n * 0.9); } // 9/10

function startLektionCheck(id){
  var lek = lektionData(id);
  if(!lek || lek.contentPending) return;
  exerciseReturnView = 'lektion';
  exam.fragen = buildLektionFragen(lek);
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'lektion'; exam.lektionId = id;
  go('exercise');
  renderExamQuestion();
}

function handleLektionExamDone(){
  var lek = lektionData(exam.lektionId);
  if(!lek) return;
  var n = exam.fragen.length;
  var grenze = lektionBestehensgrenze(n);
  var bestanden = exam.richtig >= grenze;

  var data = loadLektionenState();
  var rec = data[lek.id] || { passed:false, best:0, versuche:0 };
  rec.versuche = (rec.versuche || 0) + 1;
  rec.best = Math.max(rec.best || 0, exam.richtig);
  rec.letzterVersuch = Date.now();
  if(bestanden) rec.passed = true;
  data[lek.id] = rec;
  saveLektionenState(data);
  syncAfterSession();
  renderLektionsPfad('lektionen-pfad');

  var body = document.getElementById('exercise-body');
  var naechste = lektionData(lek.id + 1);
  var naechsteSpielbar = naechste && lektionStatus(naechste.id) === 'offen';

  var weiter;
  if(bestanden && naechsteSpielbar){
    weiter = '<button class="btn-gold" onclick="openLektion(' + naechste.id + ')">Weiter: Lektion ' + naechste.id + ' ›</button>';
  } else if(bestanden){
    weiter = '<button class="btn-gold" onclick="go(\'letters\')">Zur Lektionsübersicht</button>';
  } else {
    weiter = '<button class="btn-gold" onclick="startLektionCheck(' + lek.id + ')">Nochmal versuchen</button>';
  }

  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star"' + (bestanden ? '' : ' style="opacity:.5;"') + '>✦</div>' +
      '<h2>' + exam.richtig + ' von ' + n + ' richtig</h2>' +
      '<p>' + (bestanden
        ? 'Lektion bestanden — „' + esc(lek.titel) + '" sitzt.'
        : 'Du brauchst ' + grenze + ' richtige Antworten. Schau dir die Lektion noch einmal an.') + '</p>' +
      weiter +
      '<div style="margin-top:1rem;">' +
        '<button class="btn-ghost" onclick="openLektion(' + lek.id + ')">Zurück zur Lektion</button>' +
      '</div>' +
    '</div>';
}
