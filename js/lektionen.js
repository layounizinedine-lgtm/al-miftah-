/* lektionen.js — Lektionspfad Stufe 1: Gating, Rendering, Lektions-Check.
   Baut auf data-curriculum.js (STUFE1_LEKTIONEN) und der bestehenden
   Exam-Engine aus exercises.js (exam, renderExamQuestion, renderExamDone) auf.
   AP 1.1: Struktur + Gating + funktionierender Check.
   AP 1.2: Fragenpool ≥40 pro Lektion (Erkennen/Hören/Formen bzw. Haraka/Lesen),
   10-Minuten-Cooldown nach Fehlversuch (übersteht Reload), gescheiterte Items
   werden per srsKey automatisch in SRS-Box 1 zurückgestuft (über die bestehende
   examAnswer()-Bewertung in exercises.js), Selbstauskunft entfernt — das
   ✦-Sternchen einer Lektion 1-7 kommt ausschließlich vom bestandenen Check. */

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
// Zulassungsvoraussetzung für die normale Stufenprüfung (AP 1.6):
// alle 12 Lektionen müssen bestanden sein.
function alleLektionenBestanden(){
  return STUFE1_LEKTIONEN.every(function(l){ return lektionBestanden(l.id); });
}

// Cooldown nach Fehlversuch: 10 Minuten, bevor der Check erneut gestartet werden darf.
var LEKTION_COOLDOWN_MS = 10 * 60 * 1000;
function lektionCooldownRestMs(id){
  var data = loadLektionenState();
  var rec = data[id];
  if(!rec || !rec.cooldownUntil) return 0;
  return Math.max(0, rec.cooldownUntil - Date.now());
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
  if(l.typ === 'sonderzeichen') return 'Sonderzeichen: ' + SONDERZEICHEN.map(function(s){ return s.zeichen; }).join('  ');
  if(l.typ === 'sonne-mond') return 'Die Assimilationsregel des bestimmten Artikels اَلْ';
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
var lektionCooldownTimer = null;

function openLektion(id){
  var status = lektionStatus(id);
  if(status === 'gesperrt' || status === 'bald') return;
  aktuelleLektion = lektionData(id);
  if(!aktuelleLektion) return;
  renderLektionDetail();
  go('lektion');

  if(lektionCooldownTimer) clearInterval(lektionCooldownTimer);
  lektionCooldownTimer = setInterval(function(){
    if(!aktuelleLektion || aktuelleLektion.id !== id){ clearInterval(lektionCooldownTimer); return; }
    if(lektionCooldownRestMs(id) <= 0){ clearInterval(lektionCooldownTimer); }
    renderLektionDetail();
  }, 30000);
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
  } else if(l.typ === 'sonderzeichen'){
    html += '<div class="harakat-list" style="padding:0;">' + SONDERZEICHEN.map(function(s){
      var beispiele = s.beispiele.map(function(w){ return esc(w.ar) + ' — ' + esc(w.de); }).join(' · ');
      return '<div class="haraka-card">' +
        '<div class="haraka-glyph">' + esc(s.zeichen) + '</div>' +
        '<div class="haraka-body">' +
          '<div><span class="haraka-name">' + esc(s.name) + '</span> <span class="haraka-ex-tr">— ' + esc(s.tr) + '</span></div>' +
          '<div class="haraka-desc">' + esc(s.desc) + '</div>' +
          '<div class="haraka-hilfe">✦ ' + esc(s.hilfe) + '</div>' +
          '<div class="haraka-desc" style="margin-top:.4rem; font-style:italic;">' + beispiele + '</div>' +
        '</div>' +
        '<button class="haraka-listen" data-say="' + esc(s.zeichen) + '" aria-label="Anhören">▷</button>' +
      '</div>';
    }).join('') + '</div>';
  } else if(l.typ === 'sonne-mond'){
    html += '<div style="max-width:34rem; margin:0 auto 1.5rem; padding:1.2rem; background:rgba(15,61,61,0.5); border:1px solid rgba(201,162,39,0.25); border-radius:10px; text-align:center;">' +
      '<p style="font-family:\'Cormorant Garamond\',serif; font-style:italic; color:rgba(242,232,208,0.85); margin:0 0 .8rem;">' +
        'Folgt auf اَلْ ein <strong>Sonnenbuchstabe</strong>, verschmilzt das Lām mit ihm — man hört es doppelt (asch-schams). ' +
        'Folgt ein <strong>Mondbuchstabe</strong>, bleibt das Lām klar hörbar (al-qamar).</p>' +
      '<div class="detail-glyph" style="font-size:1.6rem; margin:.4rem 0;" lang="ar" dir="rtl">' + SONNENBUCHSTABEN.join(' ') + '</div>' +
      '<div style="font-size:.8rem; color:rgba(242,232,208,0.6); margin:0 0 .8rem;">Sonnenbuchstaben (14)</div>' +
      '<div class="detail-glyph" style="font-size:1.6rem; margin:.4rem 0;" lang="ar" dir="rtl">' + MONDBUCHSTABEN.join(' ') + '</div>' +
      '<div style="font-size:.8rem; color:rgba(242,232,208,0.6);">Mondbuchstaben (14)</div>' +
    '</div>';
    html += '<div class="harakat-list" style="padding:0;">' + SONNENMOND_WOERTER.map(function(w){
      return '<div class="haraka-card">' +
        '<div class="haraka-glyph" style="width:auto; min-width:96px; padding:0 .6rem; font-size:1.4rem;">' + esc(w.ar) + '</div>' +
        '<div class="haraka-body"><div><span class="haraka-name">' + esc(w.tr) + '</span> <span class="haraka-ex-tr">— ' + esc(w.de) + '</span></div></div>' +
        '<button class="haraka-listen" data-say="' + esc(w.ar) + '" aria-label="Anhören">▷</button>' +
      '</div>';
    }).join('') + '</div>';
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

  // AP 1.5: Silbenlesen (L9) und Lesefluss/Schnell-Lesen (L12) — beide
  // Übungstypen sind bewusst in beiden Lektionen erreichbar.
  if(l.id === 9 || l.id === 12){
    html += '<div style="text-align:center; margin:1rem 0 1.5rem; display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap;">' +
      '<button class="btn-ghost" onclick="startSilbenUebung()">🧩 Silben bauen</button>' +
      '<button class="btn-ghost" onclick="startSchnellLesen()">⚡ Schnell-Lesen</button>' +
    '</div>';
  }

  var restMs = lektionCooldownRestMs(l.id);
  var data = loadLektionenState();
  var schwach = (data[l.id] && data[l.id].schwachePunkte) || [];
  if(restMs > 0 && schwach.length){
    html += '<div style="margin:0 auto 1rem; max-width:34rem; padding:1rem; background:rgba(122,46,46,0.15); border:1px solid rgba(227,128,111,0.3); border-radius:8px; text-align:center;">' +
      '<p style="font-family:\'Cormorant Garamond\',serif; font-style:italic; color:rgba(242,232,208,0.8); margin:0 0 .6rem;">Diese Punkte haben dich zuletzt gestolpert:</p>' +
      '<div style="display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center;">' +
        schwach.map(function(s){
          return findLetter(s)
            ? '<button class="letter-card" style="width:54px;height:54px;" onclick="openLetter(\'' + s + '\')" lang="ar" dir="rtl"><span class="glyph" style="font-size:1.3rem;">' + s + '</span></button>'
            : '<span class="badge badge-soon" lang="ar" dir="auto">' + esc(s) + '</span>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  document.getElementById('lektion-inhalt').innerHTML = html;

  var btn = document.getElementById('lektion-check-btn');
  if(!btn) return;
  if(l.contentPending){
    btn.style.display = 'none';
  } else if(restMs > 0){
    btn.style.display = '';
    btn.disabled = true;
    btn.textContent = '⏳ Nächster Versuch in ' + Math.ceil(restMs / 60000) + ' Min.';
  } else {
    btn.style.display = '';
    btn.disabled = false;
    btn.textContent = '✦ Lektion-Check starten';
  }
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

// srsKey = der Buchstabe selbst: nutzt die bestehende SRS-Bewertung in
// examAnswer() (exercises.js) automatisch mit — eine falsche Antwort stuft
// den Buchstaben ohne weiteres Zutun auf SRS-Box 1 zurück.
function letterFrageErkennen(l){
  var andere = shuffle(ALL_LETTERS.filter(function(x){ return x.ch !== l.ch; })).slice(0,3);
  return { typ:'buchstabe', frage:'Welcher Buchstabe ist das?', glyph:l.ch, richtig:l.name,
    optionen: shuffle([l.name].concat(andere.map(function(a){ return a.name; }))), audio:l.ch, srsKey:l.ch };
}
function letterFrageHoeren(l){
  var andere = shuffle(ALL_LETTERS.filter(function(x){ return x.ch !== l.ch; })).slice(0,3);
  return { typ:'hoeren', frage:'Welchen Buchstaben hörst du?', glyph:null, richtig:l.ch,
    optionen: shuffle([l.ch].concat(andere.map(function(a){ return a.ch; }))), audio:l.ch, srsKey:l.ch };
}
// Formen-Frage: zeigt den Buchstaben in einer zufälligen Kontextform
// (isoliert/Anfang/Mitte/Ende bzw. nur isoliert/Ende bei nicht verbindenden
// Buchstaben) und fragt nach dem Namen — trainiert das Erkennen der Form,
// nicht nur der isolierten Grundform.
function letterFrageFormErkennen(l){
  var f = forms(l.ch);
  var moeglich = NON_CONNECTING.has(l.ch) ? [f.isolated, f.fin] : [f.isolated, f.init, f.med, f.fin];
  var glyph = moeglich[Math.floor(Math.random() * moeglich.length)];
  var andere = shuffle(ALL_LETTERS.filter(function(x){ return x.ch !== l.ch; })).slice(0,3);
  return { typ:'buchstabe', frage:'Welcher Buchstabe ist das — in dieser Form?', glyph:glyph, richtig:l.name,
    optionen: shuffle([l.name].concat(andere.map(function(a){ return a.name; }))), audio:l.ch, srsKey:l.ch };
}

// Kandidaten-Pool für eine Buchstaben-Lektion (≥ 40 auch bei der kleinsten
// Lektion, L2 mit 3 Buchstaben: 3 × 7 Varianten × 3 Fragearten = 63).
function buildLektionPoolBuchstaben(lek){
  var VARIANTS = 7;
  var pool = [];
  lek.letters.forEach(function(ch){
    var l = findLetter(ch);
    if(!l) return;
    for(var i=0;i<VARIANTS;i++){
      pool.push(letterFrageErkennen(l));
      pool.push(letterFrageHoeren(l));
      pool.push(letterFrageFormErkennen(l));
    }
  });
  return pool;
}
function buildLektionReviewPoolBuchstaben(lek){
  var pool = [];
  alleBisherigenBuchstaben(lek.id).forEach(function(l){
    pool.push(letterFrageErkennen(l));
    pool.push(letterFrageHoeren(l));
    pool.push(letterFrageFormErkennen(l));
  });
  return pool;
}

function buildLektionFragenBuchstaben(lek){
  // Ab Lektion 2 belegt eine Schreibaufgabe (AP 1.4) einen der 10 Plätze.
  var hatSchreibaufgabe = lek.id >= 2;
  var n = hatSchreibaufgabe ? 9 : 10;
  var reviewVerfuegbar = alleBisherigenBuchstaben(lek.id).length > 0;
  var reviewCount = reviewVerfuegbar ? 3 : 0; // ~30% Altstoff, sobald welcher besteht
  var neuCount = n - reviewCount;

  // Pflicht-Abdeckung: jeder Buchstabe der Lektion kommt mindestens einmal vor,
  // mit zufälliger Frageart (Erkennen/Hören/Formen).
  var pflicht = lek.letters.map(function(ch){
    var l = findLetter(ch);
    var art = Math.floor(Math.random() * 3);
    if(art === 0) return letterFrageErkennen(l);
    if(art === 1) return letterFrageHoeren(l);
    return letterFrageFormErkennen(l);
  });
  var restCount = Math.max(0, neuCount - pflicht.length);
  var pool = buildLektionPoolBuchstaben(lek);
  var rest = shuffle(pool).slice(0, restCount);

  var reviewAuswahl = [];
  if(reviewCount){
    reviewAuswahl = shuffle(buildLektionReviewPoolBuchstaben(lek)).slice(0, reviewCount);
  }
  var fragen = shuffle(pflicht.concat(rest, reviewAuswahl)).slice(0, n);
  if(hatSchreibaufgabe){
    var schreibCh = lek.letters[Math.floor(Math.random() * lek.letters.length)];
    fragen.push(schreibFrage(schreibCh));
  }
  return shuffle(fragen);
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

function lektionZielTyp(lek){
  return (lek.typ === 'harakat') ? 'kurz' : (lek.typ === 'madd') ? 'lang' : 'tanwin';
}
// Welche früheren Vokal-Typen werden kumulativ mitgeprüft?
// L9 (lang) wiederholt L8 (kurz); L10 (tanwin) wiederholt L8 + L9.
function harakatReviewTypen(lek){
  if(lek.typ === 'madd') return ['kurz'];
  if(lek.typ === 'tanwin') return ['kurz', 'lang'];
  return [];
}

// Kandidaten-Pool ≥ 40: 30 Haraka-Varianten + 3 Distraktor-Varianten je Lesewort.
function buildLektionPoolHarakat(lek){
  var zielTyp = lektionZielTyp(lek);
  var pool = [];
  for(var i=0;i<30;i++){ pool.push(haFrageZielTyp(zielTyp)); }
  woerterAusGruppen(lek.woerterTitel).forEach(function(w){
    for(var j=0;j<3;j++){ pool.push(wortFrage(w)); }
  });
  return pool;
}

function buildLektionFragenHarakat(lek){
  var n = 10;
  var reviewTypen = harakatReviewTypen(lek);
  var reviewCount = reviewTypen.length ? 3 : 0;
  var neuCount = n - reviewCount;

  var pool = buildLektionPoolHarakat(lek);
  var neuAuswahl = shuffle(pool).slice(0, neuCount);

  var reviewAuswahl = [];
  if(reviewCount){
    var reviewPool = [];
    reviewTypen.forEach(function(t){ for(var i=0;i<10;i++){ reviewPool.push(haFrageZielTyp(t)); } });
    reviewAuswahl = shuffle(reviewPool).slice(0, reviewCount);
  }
  return shuffle(neuAuswahl.concat(reviewAuswahl)).slice(0, n);
}

/* ============================================================
   LEKTIONS-CHECK — Sonderzeichen (L11) & Sonnen-/Mondbuchstaben (L12)
   ============================================================ */
function sonderzeichenFrageErkennen(s){
  var andere = shuffle(SONDERZEICHEN.filter(function(x){ return x.id !== s.id; })).slice(0,3);
  return { typ:'buchstabe', frage:'Welches Sonderzeichen ist das?', glyph:s.zeichen, richtig:s.name,
    optionen: shuffle([s.name].concat(andere.map(function(a){ return a.name; }))), audio:s.zeichen };
}
function sonderzeichenWortFrage(w){
  return { typ:'wort', frage:'Wie liest man das?', glyph:w.ar, richtig:w.tr,
    optionen: shuffle([w.tr].concat(w.falsch)), audio:w.ar, de:w.de };
}
// Pool >= 40: 10 Zeichen × 3 Erkennen-Varianten + 20 Wörter × 2 Lese-Varianten = 70.
function buildLektionPoolSonderzeichen(){
  var pool = [];
  SONDERZEICHEN.forEach(function(s){
    for(var i=0;i<3;i++){ pool.push(sonderzeichenFrageErkennen(s)); }
  });
  ALLE_SONDERZEICHEN_WOERTER.forEach(function(w){
    for(var j=0;j<2;j++){ pool.push(sonderzeichenWortFrage(w)); }
  });
  return pool;
}
function buildLektionFragenSonderzeichen(){
  // Pflicht-Abdeckung: jedes der 10 Sonderzeichen kommt genau einmal vor —
  // füllt die 10 Fragen bereits vollständig und deckt alles ab.
  var pflicht = SONDERZEICHEN.map(function(s){
    return Math.random() < 0.5
      ? sonderzeichenFrageErkennen(s)
      : sonderzeichenWortFrage(s.beispiele[Math.floor(Math.random() * s.beispiele.length)]);
  });
  return shuffle(pflicht);
}

function sonnenmondWortFrage(w){
  return { typ:'wort', frage:'Wie liest man das (mit „der/die/das")?', glyph:w.ar, richtig:w.tr,
    optionen: shuffle([w.tr].concat(w.falsch)), audio:w.ar, de:w.de };
}
function sonnenmondArtFrage(ch){
  var istSonne = SONNENBUCHSTABEN.indexOf(ch) >= 0;
  var richtig = istSonne ? 'Sonnenbuchstabe' : 'Mondbuchstabe';
  return { typ:'buchstabe', frage:'Sonnen- oder Mondbuchstabe?', glyph:ch, richtig:richtig,
    optionen: ['Sonnenbuchstabe','Mondbuchstabe'], audio:ch };
}
// Zwei getrennte Pools (>= 40 je Pool): Lesefragen und Sonnen/Mond-Einordnung.
function buildLektionPoolSonnenMondWort(){
  var pool = [];
  SONNENMOND_WOERTER.forEach(function(w){ for(var i=0;i<3;i++){ pool.push(sonnenmondWortFrage(w)); } });
  return pool;
}
function buildLektionPoolSonnenMondArt(){
  var pool = [];
  SONNENBUCHSTABEN.concat(MONDBUCHSTABEN).forEach(function(ch){ for(var j=0;j<3;j++){ pool.push(sonnenmondArtFrage(ch)); } });
  return pool;
}
function buildLektionFragenSonnenMond(){
  var wortFragen = shuffle(buildLektionPoolSonnenMondWort()).slice(0,6);
  var artFragen = shuffle(buildLektionPoolSonnenMondArt()).slice(0,4);
  return shuffle(wortFragen.concat(artFragen));
}

function buildLektionFragen(lek){
  if(lek.typ === 'buchstaben') return buildLektionFragenBuchstaben(lek);
  if(lek.typ === 'sonderzeichen') return buildLektionFragenSonderzeichen();
  if(lek.typ === 'sonne-mond') return buildLektionFragenSonnenMond();
  return buildLektionFragenHarakat(lek);
}

function lektionBestehensgrenze(n){ return Math.ceil(n * 0.9); } // 9/10

function startLektionCheck(id){
  var lek = lektionData(id);
  if(!lek || lek.contentPending) return;
  if(lektionCooldownRestMs(id) > 0) return; // Schutz, falls UI umgangen wird
  exerciseReturnView = 'lektion';
  exam.fragen = buildLektionFragen(lek);
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'lektion'; exam.lektionId = id;
  exam.lektionFalsch = [];
  go('exercise');
  renderExamQuestion();
}

// Dedupliziert gescheiterte Fragen auf ihren eigentlichen Lerngegenstand
// (bei Buchstaben-Fragen der Buchstabe selbst, sonst die richtige Antwort).
function lektionSchwacheItems(falschListe){
  var seen = {}, out = [];
  falschListe.forEach(function(q){
    var key = (q.typ === 'buchstabe' || q.typ === 'hoeren') ? q.audio : q.richtig;
    if(seen[key]) return;
    seen[key] = 1;
    out.push(key);
  });
  return out;
}

function handleLektionExamDone(){
  var lek = lektionData(exam.lektionId);
  if(!lek) return;
  var n = exam.fragen.length;
  var grenze = lektionBestehensgrenze(n);
  var bestanden = exam.richtig >= grenze;
  var schwach = lektionSchwacheItems(exam.lektionFalsch || []);

  var data = loadLektionenState();
  var rec = data[lek.id] || { passed:false, best:0, versuche:0 };
  rec.versuche = (rec.versuche || 0) + 1;
  rec.best = Math.max(rec.best || 0, exam.richtig);
  rec.letzterVersuch = Date.now();
  if(bestanden){
    rec.passed = true;
    delete rec.cooldownUntil;
    delete rec.schwachePunkte;
  } else {
    rec.cooldownUntil = Date.now() + LEKTION_COOLDOWN_MS;
    rec.schwachePunkte = schwach;
  }
  data[lek.id] = rec;
  saveLektionenState(data);

  // Das ✦-Sternchen der Buchstaben-Bibliothek kommt ausschließlich vom Check.
  if(bestanden && lek.typ === 'buchstaben'){
    lek.letters.forEach(function(ch){ doneLetters.add(ch); });
    saveDone(doneLetters);
    if(typeof renderLetters === 'function') renderLetters();
  }

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
    weiter = '<button class="btn-ghost" onclick="openLektion(' + lek.id + ')">Zurück zur Lektion</button>';
  }

  var schwachHtml = '';
  if(!bestanden && schwach.length){
    var minuten = Math.ceil(LEKTION_COOLDOWN_MS / 60000);
    schwachHtml =
      '<div style="margin:1.2rem auto; max-width:26rem; padding:1rem; background:rgba(122,46,46,0.15); border:1px solid rgba(227,128,111,0.3); border-radius:8px;">' +
        '<p style="font-family:\'Cormorant Garamond\',serif; font-style:italic; color:rgba(242,232,208,0.8); margin:0 0 .6rem;">Diese Punkte haben dich gestolpert:</p>' +
        '<div style="display:flex; gap:.4rem; flex-wrap:wrap; justify-content:center;">' +
          schwach.map(function(s){ return '<span class="badge badge-soon" lang="ar" dir="auto">' + esc(s) + '</span>'; }).join('') +
        '</div>' +
        '<p style="font-size:.85rem; color:rgba(242,232,208,0.6); font-style:italic; margin:.8rem 0 0;">Nächster Versuch möglich in ' + minuten + ' Minuten.</p>' +
      '</div>';
  }

  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star"' + (bestanden ? '' : ' style="opacity:.5;"') + '>✦</div>' +
      '<h2>' + exam.richtig + ' von ' + n + ' richtig</h2>' +
      '<p>' + (bestanden
        ? 'Lektion bestanden — „' + esc(lek.titel) + '" sitzt.'
        : 'Du brauchst ' + grenze + ' richtige Antworten.') + '</p>' +
      schwachHtml +
      weiter +
    '</div>';
}
