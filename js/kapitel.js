/* kapitel.js — Stufe 2: Kapitel-/Lektionsstruktur mit Gating (AP 2.1).
   Analog zu lektionen.js (Stufe 1), aber auf den bereits in vokabeln.js
   vorbereiteten `lektionen:[{nr, vokIds}]`-Feldern der 10 Themenfelder. */

var KAPITEL_KEY = 'almiftah_kapitel';

function loadKapitelState(){
  try { return JSON.parse(localStorage.getItem(KAPITEL_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveKapitelState(data){
  try { localStorage.setItem(KAPITEL_KEY, JSON.stringify(data)); } catch(e){}
}
function lek2Key(themaId, nr){ return themaId + '_' + nr; }

function lek2Data(themaId, nr){
  var thema = findThema(themaId);
  if(!thema || !thema.lektionen) return null;
  var l = null;
  for(var i=0;i<thema.lektionen.length;i++){ if(thema.lektionen[i].nr === nr){ l = thema.lektionen[i]; break; } }
  if(!l) return null;
  var vokabeln = l.vokIds.map(function(id){ return findVokabel(id); }).filter(Boolean);
  return { themaId:thema.id, thema:thema, nr:nr, vokIds:l.vokIds, vokabeln:vokabeln };
}

function lek2Bestanden(themaId, nr){
  var data = loadKapitelState();
  var rec = data[lek2Key(themaId, nr)];
  return !!(rec && rec.passed);
}
function kapitelBestanden(themaId){
  var thema = findThema(themaId);
  if(!thema || !thema.lektionen || !thema.lektionen.length) return false;
  return thema.lektionen.every(function(l){ return lek2Bestanden(themaId, l.nr); });
}
// Zulassungsvoraussetzung für spätere Kapitel-übergreifende Prüfungen (AP 2.x/3.x).
function alleKapitelBestanden(){
  return VOKAB_THEMEN.every(function(t){ return kapitelBestanden(t.id); });
}

function kapitelStatus(themaId){
  var idx = VOKAB_THEMEN.findIndex(function(t){ return t.id === themaId; });
  if(idx === -1) return 'gesperrt';
  if(kapitelBestanden(themaId)) return 'bestanden';
  if(idx === 0) return 'offen';
  var vorheriges = VOKAB_THEMEN[idx - 1];
  return kapitelBestanden(vorheriges.id) ? 'offen' : 'gesperrt';
}

function lek2Status(themaId, nr){
  if(lek2Bestanden(themaId, nr)) return 'bestanden';
  var idx = VOKAB_THEMEN.findIndex(function(t){ return t.id === themaId; });
  if(idx === -1) return 'gesperrt';
  if(nr === 1){
    if(idx === 0) return 'offen';
    var vorheriges = VOKAB_THEMEN[idx - 1];
    return kapitelBestanden(vorheriges.id) ? 'offen' : 'gesperrt';
  }
  return lek2Bestanden(themaId, nr - 1) ? 'offen' : 'gesperrt';
}

// Cooldown nach Fehlversuch: gleiche 10-Minuten-Regel wie in Stufe 1 (AP 1.2),
// eigener Speicherplatz (almiftah_kapitel), damit sich beide Systeme nicht
// gegenseitig stören.
var LEKTION2_COOLDOWN_MS = 10 * 60 * 1000;
function lek2CooldownRestMs(themaId, nr){
  var data = loadKapitelState();
  var rec = data[lek2Key(themaId, nr)];
  if(!rec || !rec.cooldownUntil) return 0;
  return Math.max(0, rec.cooldownUntil - Date.now());
}

// SRS-Anbindung (AP 2.1-Abnahme: "SRS übernimmt alle Lektionswörter nach
// Erst-Kontakt"): eine Lektion 2 gilt als kontaktiert, sobald sie einmal
// geöffnet wurde — unabhängig davon, ob der Check schon bestanden ist.
function besuchteVokabIds(){
  var data = loadKapitelState();
  var set = {};
  Object.keys(data).forEach(function(key){
    var rec = data[key];
    if(!rec || !rec.besucht) return;
    var parts = key.split('_');
    var lek = lek2Data(parseInt(parts[0], 10), parseInt(parts[1], 10));
    if(lek){ lek.vokIds.forEach(function(id){ set[id] = 1; }); }
  });
  return { has: function(id){ return !!set[id]; } };
}

/* ============================================================
   RENDER: Kapitel-Liste (view-stufe2) + Kapitel-Detail (view-kapitel)
   ============================================================ */
function renderKapitelListe(containerId){
  var c = document.getElementById(containerId);
  if(!c) return;
  if(!VOKAB_THEMEN.length){ c.innerHTML = ''; return; }
  c.innerHTML = VOKAB_THEMEN.map(function(t, i){
    var status = kapitelStatus(t.id);
    var offenbar = (status === 'offen' || status === 'bestanden');
    var clickable = offenbar ? 'stop-clickable' : '';
    var onclick = offenbar ? 'onclick="openKapitel(' + t.id + ')"' : '';
    var tag = offenbar ? 'button' : 'div';
    var lekListe = t.lektionen || [];
    var lekBestanden = lekListe.filter(function(l){ return lek2Bestanden(t.id, l.nr); }).length;
    var badge;
    if(status === 'bestanden') badge = '<span class="badge badge-ready">✦ Gemeistert</span>';
    else if(status === 'offen') badge = '<span class="badge badge-ready">Verfügbar</span>';
    else badge = '<span class="badge badge-soon">🔒 Vorheriges Kapitel abschließen</span>';
    return '<' + tag + ' class="stop ' + clickable + '" ' + onclick + '>' +
      '<div class="medallion">' + medallionSVG(false) + '</div>' +
      '<div class="stop-body">' +
        '<p class="stop-index">Kapitel ' + (i + 1) + '</p>' +
        '<p class="stop-title-ar">' + esc(t.nameAr || '') + '</p>' +
        '<h3 class="stop-title-de">' + esc(t.name) + '</h3>' +
        '<p class="stop-desc">' + lekListe.length + ' Lektionen · ' + lekBestanden + '/' + lekListe.length + ' bestanden</p>' +
        badge +
      '</div>' +
    '</' + tag + '>';
  }).join('');
}

var aktuellesKapitel = null;

function openKapitel(id){
  var status = kapitelStatus(id);
  if(status === 'gesperrt') return;
  aktuellesKapitel = findThema(id);
  if(!aktuellesKapitel) return;
  renderKapitelDetail();
  go('kapitel');
}

function renderKapitelDetail(){
  var t = aktuellesKapitel;
  if(!t) return;
  document.getElementById('kapitel-titel-ar').textContent = t.nameAr || '';
  document.getElementById('kapitel-head').textContent = t.name;
  document.getElementById('kapitel-unter').textContent = (t.lektionen || []).length + ' Lektionen · ' + t.vocab.length + ' Wörter';

  var c = document.getElementById('kapitel-pfad');
  c.innerHTML = (t.lektionen || []).map(function(l){
    var status = lek2Status(t.id, l.nr);
    var offenbar = (status === 'offen' || status === 'bestanden');
    var clickable = offenbar ? 'stop-clickable' : '';
    var onclick = offenbar ? 'onclick="openLektion2(' + t.id + ',' + l.nr + ')"' : '';
    var tag = offenbar ? 'button' : 'div';
    var vorschau = l.vokIds.slice(0, 4).map(function(id){ var v = findVokabel(id); return v ? v.translations.de : ''; }).filter(Boolean).join(', ');
    var badge;
    if(status === 'bestanden') badge = '<span class="badge badge-ready">✦ Gemeistert</span>';
    else if(status === 'offen') badge = '<span class="badge badge-ready">Verfügbar</span>';
    else badge = '<span class="badge badge-soon">🔒 Vorherige Lektion abschließen</span>';
    return '<' + tag + ' class="stop ' + clickable + '" ' + onclick + '>' +
      '<div class="medallion">' + medallionSVG(false) + '</div>' +
      '<div class="stop-body">' +
        '<p class="stop-index">Lektion ' + l.nr + '</p>' +
        '<h3 class="stop-title-de">' + l.vokIds.length + ' Wörter</h3>' +
        '<p class="stop-desc">' + esc(vorschau) + (l.vokIds.length > 4 ? ' …' : '') + '</p>' +
        badge +
      '</div>' +
    '</' + tag + '>';
  }).join('');
}

/* ============================================================
   LEKTION-2-DETAIL (view-lektion2)
   ============================================================ */
var aktuelleLektion2 = null;
var lektion2CooldownTimer = null;

function openLektion2(themaId, nr){
  var status = lek2Status(themaId, nr);
  if(status === 'gesperrt') return;
  aktuelleLektion2 = lek2Data(themaId, nr);
  if(!aktuelleLektion2) return;

  var data = loadKapitelState();
  var key = lek2Key(themaId, nr);
  var rec = data[key] || { passed:false, best:0, versuche:0 };
  rec.besucht = true; // Erstkontakt für die SRS-Übernahme
  data[key] = rec;
  saveKapitelState(data);

  renderLektion2Detail();
  go('lektion2');

  if(lektion2CooldownTimer) clearInterval(lektion2CooldownTimer);
  lektion2CooldownTimer = setInterval(function(){
    if(!aktuelleLektion2 || aktuelleLektion2.themaId !== themaId || aktuelleLektion2.nr !== nr){ clearInterval(lektion2CooldownTimer); return; }
    if(lek2CooldownRestMs(themaId, nr) <= 0){ clearInterval(lektion2CooldownTimer); }
    renderLektion2Detail();
  }, 30000);
}

function renderLektion2Detail(){
  var l = aktuelleLektion2;
  if(!l) return;
  document.getElementById('lektion2-titel-ar').textContent = l.thema.nameAr || '';
  document.getElementById('lektion2-head').textContent = 'Lektion ' + l.nr + ' — ' + l.thema.name;
  document.getElementById('lektion2-unter').textContent = l.vokabeln.length + ' Wörter dieser Lektion';

  var html = '<div class="harakat-list" style="padding:0;">' + l.vokabeln.map(function(v){
    var it = srsData['v:' + v.id];
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
  }).join('') + '</div>';

  var restMs = lek2CooldownRestMs(l.themaId, l.nr);
  var data = loadKapitelState();
  var rec = data[lek2Key(l.themaId, l.nr)];
  var schwach = (rec && rec.schwachePunkte) || [];
  if(restMs > 0 && schwach.length){
    html += '<div style="margin:1rem auto 0; max-width:34rem; padding:1rem; background:rgba(122,46,46,0.15); border:1px solid rgba(227,128,111,0.3); border-radius:8px; text-align:center;">' +
      '<p style="font-family:\'Cormorant Garamond\',serif; font-style:italic; color:rgba(242,232,208,0.8); margin:0 0 .6rem;">Diese Wörter haben dich zuletzt gestolpert:</p>' +
      '<div style="display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center;" lang="ar" dir="rtl">' +
        schwach.map(function(s){ return '<span class="badge badge-soon">' + esc(s) + '</span>'; }).join('') +
      '</div>' +
    '</div>';
  }

  document.getElementById('lektion2-inhalt').innerHTML = html;

  var btn = document.getElementById('lektion2-check-btn');
  if(!btn) return;
  if(restMs > 0){
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
   LEKTION-2-CHECK — 12 Fragen, 10 richtig (≈83%), ~30% Altstoff-Wiederholung
   sobald frühere Lektionen bestanden sind (gleiches Muster wie Stufe 1).
   ============================================================ */
function alleBisherigenVokabIds(themaId, nr){
  var out = [];
  VOKAB_THEMEN.forEach(function(t){
    (t.lektionen || []).forEach(function(l){
      var frueher = (t.id < themaId) || (t.id === themaId && l.nr < nr);
      if(frueher && lek2Bestanden(t.id, l.nr)){
        l.vokIds.forEach(function(id){ out.push(id); });
      }
    });
  });
  return out;
}

function buildLektion2Fragen(lek){
  var n = 12;
  var reviewIds = alleBisherigenVokabIds(lek.themaId, lek.nr);
  var reviewCount = reviewIds.length ? 3 : 0;
  var neuCount = n - reviewCount;

  // Pflicht-Abdeckung: jedes Wort der Lektion kommt mindestens einmal vor.
  var pflicht = lek.vokabeln.map(function(v){ return vokFrage(v); });
  var restCount = Math.max(0, neuCount - pflicht.length);
  var restPool = [];
  lek.vokabeln.forEach(function(v){ restPool.push(vokFrageArDe(v)); restPool.push(vokFrageDeAr(v)); });
  var rest = shuffle(restPool).slice(0, restCount);

  var reviewAuswahl = [];
  if(reviewCount){
    reviewAuswahl = shuffle(reviewIds).slice(0, reviewCount).map(function(id){
      var v = findVokabel(id);
      return v ? vokFrage(v) : null;
    }).filter(Boolean);
  }
  return shuffle(pflicht.concat(rest, reviewAuswahl)).slice(0, n);
}

function lek2Bestehensgrenze(n){ return Math.ceil(n * (10 / 12)); } // 10/12

function startLektion2Check(themaId, nr){
  var lek = lek2Data(themaId, nr);
  if(!lek) return;
  if(lek2CooldownRestMs(themaId, nr) > 0) return; // Schutz, falls UI umgangen wird
  exerciseReturnView = 'lektion2';
  exam.fragen = buildLektion2Fragen(lek);
  exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'lektion2';
  exam.lektion2ThemaId = themaId; exam.lektion2Nr = nr;
  exam.lektionFalsch = [];
  go('exercise');
  renderExamQuestion();
}

// Dedupliziert gescheiterte Fragen auf das eigentliche Vokabel-Item (über
// srsKey 'v:<id>'), damit Hin- und Rückrichtung (ar→de / de→ar) nicht als
// zwei verschiedene "schwache Punkte" gezählt werden — zeigt immer das
// arabische Wort an.
function lektion2SchwacheItems(falschListe){
  var seen = {}, out = [];
  falschListe.forEach(function(q){
    var key = q.srsKey || q.richtig;
    if(seen[key]) return;
    seen[key] = 1;
    var vid = (typeof key === 'string' && key.indexOf('v:') === 0) ? parseInt(key.slice(2), 10) : null;
    var v = (vid !== null) ? findVokabel(vid) : null;
    out.push(v ? v.arabic : key);
  });
  return out;
}

function handleLektion2ExamDone(){
  var themaId = exam.lektion2ThemaId, nr = exam.lektion2Nr;
  var lek = lek2Data(themaId, nr);
  if(!lek) return;
  var n = exam.fragen.length;
  var grenze = lek2Bestehensgrenze(n);
  var bestanden = exam.richtig >= grenze;
  var schwach = lektion2SchwacheItems(exam.lektionFalsch || []);

  var data = loadKapitelState();
  var key = lek2Key(themaId, nr);
  var rec = data[key] || { passed:false, best:0, versuche:0, besucht:true };
  rec.versuche = (rec.versuche || 0) + 1;
  rec.best = Math.max(rec.best || 0, exam.richtig);
  rec.letzterVersuch = Date.now();
  if(bestanden){
    rec.passed = true;
    delete rec.cooldownUntil;
    delete rec.schwachePunkte;
  } else {
    rec.cooldownUntil = Date.now() + LEKTION2_COOLDOWN_MS;
    rec.schwachePunkte = schwach;
  }
  data[key] = rec;
  saveKapitelState(data);

  syncAfterSession();
  if(typeof renderKapitelListe === 'function') renderKapitelListe('kapitel-pfad');

  var body = document.getElementById('exercise-body');
  var naechsteNr = nr + 1;
  var naechsteVorhanden = !!lek2Data(themaId, naechsteNr);
  var naechsteVerfuegbar = naechsteVorhanden && lek2Status(themaId, naechsteNr) === 'offen';

  var weiter;
  if(bestanden && naechsteVerfuegbar){
    weiter = '<button class="btn-gold" onclick="openLektion2(' + themaId + ',' + naechsteNr + ')">Weiter: Lektion ' + naechsteNr + ' ›</button>';
  } else if(bestanden){
    weiter = '<button class="btn-gold" onclick="go(\'stufe2\')">Zur Kapitelübersicht</button>';
  } else {
    weiter = '<button class="btn-ghost" onclick="openLektion2(' + themaId + ',' + nr + ')">Zurück zur Lektion</button>';
  }

  var schwachHtml = '';
  if(!bestanden && schwach.length){
    var minuten = Math.ceil(LEKTION2_COOLDOWN_MS / 60000);
    schwachHtml =
      '<div style="margin:1.2rem auto; max-width:26rem; padding:1rem; background:rgba(122,46,46,0.15); border:1px solid rgba(227,128,111,0.3); border-radius:8px;">' +
        '<p style="font-family:\'Cormorant Garamond\',serif; font-style:italic; color:rgba(242,232,208,0.8); margin:0 0 .6rem;">Diese Wörter haben dich gestolpert:</p>' +
        '<div style="display:flex; gap:.4rem; flex-wrap:wrap; justify-content:center;" lang="ar" dir="rtl">' +
          schwach.map(function(s){ return '<span class="badge badge-soon">' + esc(s) + '</span>'; }).join('') +
        '</div>' +
        '<p style="font-size:.85rem; color:rgba(242,232,208,0.6); font-style:italic; margin:.8rem 0 0;">Nächster Versuch möglich in ' + minuten + ' Minuten.</p>' +
      '</div>';
  }

  body.innerHTML =
    '<div class="ex-done">' +
      '<div class="star"' + (bestanden ? '' : ' style="opacity:.5;"') + '>✦</div>' +
      '<h2>' + exam.richtig + ' von ' + n + ' richtig</h2>' +
      '<p>' + (bestanden
        ? 'Lektion bestanden — „' + esc(lek.thema.name) + ' · Lektion ' + nr + '" sitzt.'
        : 'Du brauchst ' + grenze + ' richtige Antworten.') + '</p>' +
      schwachHtml +
      weiter +
    '</div>';
}
