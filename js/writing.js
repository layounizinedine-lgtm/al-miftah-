/* writing.js — Schreibtrainer 2.0 (AP 1.4): drei Modi auf Basis der in
   stroke-extract.js algorithmisch ermittelten Strichpfade.
   - Vormachen: animierter Stift zeichnet jeden Strich in Reihenfolge vor.
   - Nachfahren: Vorlage sichtbar, Fortschritt nur in Strichrichtung
     (Toleranzschlauch 24px); rückwärts oder zu weit daneben zählt nicht.
   - Frei: keine Vorlage, Bewertung gegen den Referenzpfad (Ø-Abstand +
     Richtungstreue) nach Abschluss jedes Strichs.
   Die flächenbasierte Präzisionsmessung aus AP 0.1/1.2 (updateCoverage)
   bleibt in Nachfahren als zweite Verteidigungslinie gegen Vollkritzeln. */

var WSIZE = 320;
var writeIndex = 0;
var writeDrawing = false;
var wLast = null;
var backCanvas, frontCanvas, bctx, fctx;
var letterMaskIdx = [];
var letterMaskFlag = null;
var letterMaskTotal = 0;
var writeReady = false;

var TRACE_TOLERANZ = 24;   // px — wie im Masterplan vorgegeben
var TRACE_MAX_SCHRITT = 8; // erlaubter Indexsprung pro Bewegung entlang des Pfads

var writeMode = 'nachfahren';   // 'nachfahren' | 'vormachen' | 'frei'
var writeStrokes = [];          // extractLetterStrokes(ch) des aktuellen Buchstabens
var writeStrokeIdx = 0;
var writeProgress = 0;          // Fortschritt (Punkt-Index) im aktuellen Strich
var writeExkursion = false;     // während des aktuellen Strichs den Toleranzschlauch verlassen?
var writeFreiPunkte = [];       // gezeichnete Punkte im Frei-Modus (aktueller Strich)
var writeFreiScores = [];
var writeAnimHandle = null;

function setupWriting(){
  if(writeReady) return;
  backCanvas = document.getElementById('write-back');
  frontCanvas = document.getElementById('write-front');
  bctx = backCanvas.getContext('2d');
  fctx = frontCanvas.getContext('2d');
  frontCanvas.addEventListener('pointerdown', wDown);
  frontCanvas.addEventListener('pointermove', wMove);
  window.addEventListener('pointerup', wUp);
  // touch fallback (older Safari)
  frontCanvas.addEventListener('touchstart', function(e){ e.preventDefault(); wDown(tPos(e)); }, {passive:false});
  frontCanvas.addEventListener('touchmove',  function(e){ e.preventDefault(); wMove(tPos(e)); }, {passive:false});
  frontCanvas.addEventListener('touchend',   function(e){ e.preventDefault(); wUp(); }, {passive:false});
  writeReady = true;
}

function tPos(e){
  var t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : null);
  return { clientX: t ? t.clientX : 0, clientY: t ? t.clientY : 0, _touch:true };
}

function wPos(e){
  var rect = frontCanvas.getBoundingClientRect();
  var sx = frontCanvas.width / rect.width;
  var sy = frontCanvas.height / rect.height;
  return { x:(e.clientX - rect.left) * sx, y:(e.clientY - rect.top) * sy };
}

/* ============================================================
   Reine Fortschritts-Logik (bewusst unabhängig von Canvas/DOM,
   damit sie ohne echte Zeigereingaben getestet werden kann)
   ============================================================ */
function naechsterPunktIndex(path, punkt){
  var bestIdx = 0, bestDist = Infinity;
  for(var i=0;i<path.length;i++){
    var dx = path[i].x - punkt.x, dy = path[i].y - punkt.y;
    var d = Math.sqrt(dx*dx + dy*dy);
    if(d < bestDist){ bestDist = d; bestIdx = i; }
  }
  return { index: bestIdx, dist: bestDist };
}
// Liefert den neuen Fortschritts-Index für einen Strich. Zählt nur
// Vorwärtsbewegung in kleinen Schritten entlang des Pfads — Rückwärts-
// Nachfahren (hoher Index sofort beim Start) bleibt bei 0 hängen, weil
// der Sprung vom bisherigen Index aus zu groß ist.
function traceFortschritt(path, bisherigerIndex, punkt){
  var near = naechsterPunktIndex(path, punkt);
  if(near.dist > TRACE_TOLERANZ) return { index: bisherigerIndex, exkursion: true };
  if(near.index >= bisherigerIndex && (near.index - bisherigerIndex) <= TRACE_MAX_SCHRITT){
    return { index: near.index, exkursion: false };
  }
  return { index: bisherigerIndex, exkursion: false };
}
// Frei-Modus: Score aus Ø-Abstand zum Referenzpfad + Richtungstreue der
// Zeichenreihenfolge (0-100). Zwei Ebenen: lokale Toleranz für Zittern,
// plus ein globaler Trend-Gate — sonst würde eine komplett rückwärts
// gezeichnete, aber pfadnahe Linie fälschlich hoch bewertet (jeder
// einzelne Schritt wäre nur ein "kleiner" Rückschritt).
function freiScore(path, gezeichnetePunkte){
  if(!gezeichnetePunkte.length) return 0;
  var distSum = 0, indices = [];
  gezeichnetePunkte.forEach(function(p){
    var near = naechsterPunktIndex(path, p);
    distSum += near.dist;
    indices.push(near.index);
  });
  var avgDist = distSum / gezeichnetePunkte.length;
  var proximity = Math.max(0, 1 - avgDist / 60);

  var vorwaerts = 0;
  for(var i=1;i<indices.length;i++){ if(indices[i] >= indices[i-1] - 3) vorwaerts++; }
  var lokal = indices.length > 1 ? vorwaerts / (indices.length - 1) : 1;

  var drittel = Math.max(1, Math.floor(indices.length / 3));
  var anfang = indices.slice(0, drittel).reduce(function(a,b){ return a+b; }, 0) / drittel;
  var ende = indices.slice(-drittel).reduce(function(a,b){ return a+b; }, 0) / drittel;
  var globalTrend = (ende - anfang) >= 0 ? 1 : 0;

  var richtung = lokal * globalTrend;
  return Math.round(Math.max(0, Math.min(1, proximity*0.6 + richtung*0.4)) * 100);
}

/* ============================================================
   Zeichnen (Vorlage, Strich, Punkt)
   ============================================================ */
function wDot(p){ fctx.fillStyle = '#e0bb45'; fctx.beginPath(); fctx.arc(p.x, p.y, 9, 0, Math.PI*2); fctx.fill(); }
function wStroke(a, b){
  fctx.strokeStyle = '#e0bb45'; fctx.lineWidth = 18; fctx.lineCap = 'round'; fctx.lineJoin = 'round';
  fctx.beginPath(); fctx.moveTo(a.x, a.y); fctx.lineTo(b.x, b.y); fctx.stroke();
}
function drawTemplate(ch){
  bctx.clearRect(0,0,WSIZE,WSIZE);
  bctx.fillStyle = 'rgba(224,187,69,0.18)';
  bctx.font = 'bold 240px "Noto Naskh Arabic", serif';
  bctx.textAlign = 'center'; bctx.textBaseline = 'middle';
  bctx.fillText(ch, WSIZE/2, WSIZE/2 + 8);
}

function drawWritingLetter(){
  var l = ALL_LETTERS[writeIndex];
  computeMask(l.ch);
  writeStrokes = extractLetterStrokes(l.ch);
  writeStrokeIdx = 0; writeProgress = 0; writeExkursion = false;
  writeFreiPunkte = []; writeFreiScores = [];
  if(writeAnimHandle){ clearTimeout(writeAnimHandle); writeAnimHandle = null; }

  fctx.clearRect(0,0,WSIZE,WSIZE);
  if(writeMode === 'frei'){ bctx.clearRect(0,0,WSIZE,WSIZE); }
  else { drawTemplate(l.ch); }

  document.getElementById('write-name').textContent = l.name;
  document.getElementById('write-tr').textContent = l.tr;
  document.getElementById('write-counter').textContent = (writeIndex+1) + ' / ' + ALL_LETTERS.length;
  setCoverage(0);
  var fb = document.getElementById('write-feedback');
  fb.textContent = '·'; fb.className = 'write-feedback';
  writeAktualisiereStrichInfo();
}

function computeMask(ch){
  var m = document.createElement('canvas'); m.width = WSIZE; m.height = WSIZE;
  var mc = m.getContext('2d');
  mc.fillStyle = '#ffffff';
  mc.font = 'bold 240px "Noto Naskh Arabic", serif';
  mc.textAlign = 'center'; mc.textBaseline = 'middle';
  mc.fillText(ch, WSIZE/2, WSIZE/2 + 8);
  var data = mc.getImageData(0,0,WSIZE,WSIZE).data;
  letterMaskIdx = [];
  letterMaskFlag = new Uint8Array(WSIZE*WSIZE);
  for(var y=0; y<WSIZE; y+=3){
    for(var x=0; x<WSIZE; x+=3){
      var i = (y*WSIZE + x)*4;
      if(data[i+3] > 80){ var mi = y*WSIZE + x; letterMaskIdx.push(mi); letterMaskFlag[mi] = 1; }
    }
  }
  letterMaskTotal = letterMaskIdx.length;
}

// Flächenbasierte Präzision (AP 0.1/1.2) — bleibt zweite Verteidigungslinie
// gegen Vollkritzeln, unabhängig vom strichbasierten Fortschritt.
function flaechenPraezision(){
  if(!letterMaskTotal || !letterMaskFlag) return { hitRatio:0, strayRatio:1 };
  var data = fctx.getImageData(0,0,WSIZE,WSIZE).data;
  var paintedTotal = 0, paintedInMask = 0;
  for(var y=0; y<WSIZE; y+=3){
    for(var x=0; x<WSIZE; x+=3){
      var mi = y*WSIZE + x;
      if(data[mi*4 + 3] > 0){ paintedTotal++; if(letterMaskFlag[mi]) paintedInMask++; }
    }
  }
  var hitRatio = paintedInMask / letterMaskTotal;
  var strayRatio = paintedTotal > 0 ? (paintedTotal - paintedInMask) / paintedTotal : 0;
  return { hitRatio: hitRatio, strayRatio: strayRatio };
}

function setCoverage(pct){
  document.getElementById('write-meter-bar').style.width = Math.min(Math.max(pct,0),100) + '%';
}
function writeAktualisiereStrichInfo(){
  var el = document.getElementById('write-stroke-info');
  if(!el) return;
  if(!writeStrokes.length){ el.textContent = ''; return; }
  if(writeMode === 'vormachen'){
    el.textContent = writeStrokes.length + (writeStrokes.length===1 ? ' Strich' : ' Striche');
  } else {
    el.textContent = 'Strich ' + Math.min(writeStrokeIdx+1, writeStrokes.length) + ' von ' + writeStrokes.length;
  }
}
function gesamtFortschritt(){
  if(!writeStrokes.length) return 0;
  var aktuellerAnteil = 0;
  if(writeStrokeIdx < writeStrokes.length){
    var s = writeStrokes[writeStrokeIdx];
    aktuellerAnteil = (s.typ === 'punkt') ? writeProgress : writeProgress / Math.max(1, s.punkte.length-1);
  }
  return (writeStrokeIdx + aktuellerAnteil) / writeStrokes.length;
}

/* ============================================================
   Zeigereingabe — verzweigt je nach Modus
   ============================================================ */
function wDown(e){
  if(writeMode === 'vormachen') return;
  if(e.preventDefault) e.preventDefault();
  writeDrawing = true; wLast = wPos(e);
  if(writeMode === 'frei') writeFreiPunkte = [wLast];
  wDot(wLast);
  wTraceCheck(wLast);
}
function wMove(e){
  if(!writeDrawing) return;
  if(e.preventDefault) e.preventDefault();
  var p = wPos(e);
  wStroke(wLast, p); wLast = p;
  if(writeMode === 'frei') writeFreiPunkte.push(p);
  wTraceCheck(p);
}
function wUp(){
  if(!writeDrawing) return;
  writeDrawing = false;
  if(writeMode === 'frei'){ wFreiStrokeEnde(); }
  else { wNachfahrenStrokeEnde(); }
}

function wTraceCheck(punkt){
  if(writeMode !== 'nachfahren') return;
  if(!writeStrokes.length || writeStrokeIdx >= writeStrokes.length) return;
  var stroke = writeStrokes[writeStrokeIdx];
  if(stroke.typ === 'punkt'){
    var d0 = Math.hypot(stroke.punkte[0].x-punkt.x, stroke.punkte[0].y-punkt.y);
    if(d0 <= TRACE_TOLERANZ) writeProgress = 1;
    return;
  }
  var res = traceFortschritt(stroke.punkte, writeProgress, punkt);
  writeProgress = res.index;
  if(res.exkursion) writeExkursion = true;
  setCoverage(Math.round(gesamtFortschritt() * 100));
}

function wNachfahrenStrokeEnde(){
  if(!writeStrokes.length || writeStrokeIdx >= writeStrokes.length) return;
  var stroke = writeStrokes[writeStrokeIdx];
  var flaeche = flaechenPraezision();
  var pfadFertig = (stroke.typ === 'punkt') ? writeProgress >= 1 : writeProgress >= stroke.punkte.length - 3;
  var fb = document.getElementById('write-feedback');
  // Zweite Verteidigungslinie: trotz Pfad-Fortschritt kein Erfolg, wenn großflächig
  // daneben gemalt wurde (Anti-Schmier aus AP 0.1/1.2).
  var keinSchmier = flaeche.strayRatio <= 0.5;

  if(pfadFertig && !writeExkursion && keinSchmier){
    writeStrokeIdx++;
    writeProgress = 0; writeExkursion = false;
    if(writeStrokeIdx >= writeStrokes.length){
      fb.textContent = 'Buchstabe fertig nachgezeichnet ✦'; fb.className = 'write-feedback good';
    } else {
      fb.textContent = 'Weiter mit Strich ' + (writeStrokeIdx+1) + ' von ' + writeStrokes.length;
      fb.className = 'write-feedback good';
    }
  } else {
    writeProgress = 0; writeExkursion = false;
    fb.textContent = writeExkursion ? 'Bleib auf der Linie — nochmal' : 'Noch nicht ganz — nochmal versuchen';
    fb.className = 'write-feedback';
  }
  setCoverage(Math.round(gesamtFortschritt() * 100));
  writeAktualisiereStrichInfo();
}

function wFreiStrokeEnde(){
  if(!writeStrokes.length || writeStrokeIdx >= writeStrokes.length) return;
  var stroke = writeStrokes[writeStrokeIdx];
  var score;
  if(stroke.typ === 'punkt'){
    var dmin = Infinity;
    writeFreiPunkte.forEach(function(p){ dmin = Math.min(dmin, Math.hypot(p.x-stroke.punkte[0].x, p.y-stroke.punkte[0].y)); });
    score = dmin <= TRACE_TOLERANZ ? 100 : Math.max(0, 100 - dmin);
  } else {
    score = freiScore(stroke.punkte, writeFreiPunkte);
  }
  writeFreiScores.push(score);
  writeStrokeIdx++;
  writeFreiPunkte = [];
  var fb = document.getElementById('write-feedback');
  if(writeStrokeIdx >= writeStrokes.length){
    var gesamt = Math.round(writeFreiScores.reduce(function(a,b){ return a+b; }, 0) / writeFreiScores.length);
    setCoverage(gesamt);
    fb.textContent = (gesamt >= 70 ? 'Sehr gut getroffen ✦ (' : 'Übung macht den Meister (') + gesamt + '%)';
    fb.className = gesamt >= 70 ? 'write-feedback good' : 'write-feedback';
  } else {
    setCoverage(Math.round(gesamtFortschritt() * 100));
    fb.textContent = 'Strich ' + writeStrokeIdx + ' erfasst — weiter mit Strich ' + (writeStrokeIdx+1);
    fb.className = 'write-feedback good';
  }
  writeAktualisiereStrichInfo();
}

/* ============================================================
   Vormachen — animierter Stift
   ============================================================ */
function writeVormachenAbspielen(){
  if(!writeStrokes.length || writeAnimHandle) return;
  fctx.clearRect(0,0,WSIZE,WSIZE);
  var strokeIdx = 0;
  function naechsterStrich(){
    if(strokeIdx >= writeStrokes.length){ writeAnimHandle = null; return; }
    var stroke = writeStrokes[strokeIdx];
    if(stroke.typ === 'punkt'){
      wDot(stroke.punkte[0]);
      strokeIdx++;
      writeAnimHandle = setTimeout(naechsterStrich, 260);
      return;
    }
    var i = 0;
    (function schritt(){
      if(i >= stroke.punkte.length){ strokeIdx++; writeAnimHandle = setTimeout(naechsterStrich, 220); return; }
      if(i === 0) wDot(stroke.punkte[0]); else wStroke(stroke.punkte[i-1], stroke.punkte[i]);
      i++;
      writeAnimHandle = setTimeout(schritt, 18);
    })();
  }
  naechsterStrich();
}

/* ============================================================
   Modus-Umschaltung & Navigation
   ============================================================ */
function writeSetMode(mode){
  writeMode = mode;
  writeStrokeIdx = 0; writeProgress = 0; writeExkursion = false;
  writeFreiPunkte = []; writeFreiScores = [];
  if(writeAnimHandle){ clearTimeout(writeAnimHandle); writeAnimHandle = null; }

  ['nachfahren','vormachen','frei'].forEach(function(m){
    var btn = document.getElementById('mode-' + m);
    if(btn) btn.classList.toggle('active', m === mode);
  });

  var l = ALL_LETTERS[writeIndex];
  fctx.clearRect(0,0,WSIZE,WSIZE);
  if(mode === 'frei') bctx.clearRect(0,0,WSIZE,WSIZE);
  else drawTemplate(l.ch);

  var vormachenBtn = document.getElementById('write-vormachen-btn');
  if(vormachenBtn) vormachenBtn.style.display = (mode === 'vormachen') ? '' : 'none';
  var hint = document.querySelector('#view-schreiben .write-hint');
  if(hint){
    if(mode === 'nachfahren') hint.textContent = 'Fahre mit dem Finger über die blasse Vorlage — in Strichrichtung.';
    else if(mode === 'vormachen') hint.textContent = 'Tippe „Abspielen", um den Buchstaben vorgezeichnet zu sehen.';
    else hint.textContent = 'Schreibe den Buchstaben ohne Vorlage — aus dem Gedächtnis.';
  }

  setCoverage(0);
  var fb = document.getElementById('write-feedback'); fb.textContent = '·'; fb.className = 'write-feedback';
  writeAktualisiereStrichInfo();
}

function afterFontDraw(){
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(drawWritingLetter); }
  else { drawWritingLetter(); }
}

function startWriting(){ openWriting(ALL_LETTERS[0].ch); }
function openWriting(ch){
  setupWriting();
  var idx = 0;
  for(var i=0;i<ALL_LETTERS.length;i++){ if(ALL_LETTERS[i].ch === ch){ idx = i; break; } }
  writeIndex = idx;
  go('schreiben');
  afterFontDraw();
}
function fromDetailToWriting(ch){ closeLetter(); openWriting(ch); }

function writePrev(){ writeIndex = (writeIndex - 1 + ALL_LETTERS.length) % ALL_LETTERS.length; afterFontDraw(); }
function writeNext(){ writeIndex = (writeIndex + 1) % ALL_LETTERS.length; afterFontDraw(); }
function writeClear(){
  fctx.clearRect(0,0,WSIZE,WSIZE); setCoverage(0);
  writeStrokeIdx = 0; writeProgress = 0; writeExkursion = false; writeFreiPunkte = []; writeFreiScores = [];
  var fb = document.getElementById('write-feedback'); fb.textContent = '·'; fb.className = 'write-feedback';
  writeAktualisiereStrichInfo();
}
function writeListen(){ speak(ALL_LETTERS[writeIndex].ch); }
