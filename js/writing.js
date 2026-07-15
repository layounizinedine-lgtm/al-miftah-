/* writing.js — Schreibtrainer (Canvas, Präzisions-Score). */

/* ============================================================
   WRITING (Schreiben) — trace letter with finger on canvas
   ============================================================ */
var WSIZE = 320;
var writeIndex = 0;
var writeDrawing = false;
var wLast = null;
var backCanvas, frontCanvas, bctx, fctx;
var letterMaskIdx = [];
var letterMaskFlag = null;
var letterMaskTotal = 0;
var writeReady = false;

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
function wDown(e){ if(e.preventDefault) e.preventDefault(); writeDrawing = true; wLast = wPos(e); wDot(wLast); }
function wMove(e){ if(!writeDrawing) return; if(e.preventDefault) e.preventDefault(); var p = wPos(e); wStroke(wLast, p); wLast = p; }
function wUp(){ if(!writeDrawing) return; writeDrawing = false; updateCoverage(); }

function wDot(p){ fctx.fillStyle = '#e0bb45'; fctx.beginPath(); fctx.arc(p.x, p.y, 9, 0, Math.PI*2); fctx.fill(); }
function wStroke(a, b){
  fctx.strokeStyle = '#e0bb45'; fctx.lineWidth = 18; fctx.lineCap = 'round'; fctx.lineJoin = 'round';
  fctx.beginPath(); fctx.moveTo(a.x, a.y); fctx.lineTo(b.x, b.y); fctx.stroke();
}

function drawWritingLetter(){
  var l = ALL_LETTERS[writeIndex];
  bctx.clearRect(0,0,WSIZE,WSIZE);
  bctx.fillStyle = 'rgba(224,187,69,0.18)';
  bctx.font = 'bold 240px "Noto Naskh Arabic", serif';
  bctx.textAlign = 'center'; bctx.textBaseline = 'middle';
  bctx.fillText(l.ch, WSIZE/2, WSIZE/2 + 8);
  computeMask(l.ch);
  fctx.clearRect(0,0,WSIZE,WSIZE);
  document.getElementById('write-name').textContent = l.name;
  document.getElementById('write-tr').textContent = l.tr;
  document.getElementById('write-counter').textContent = (writeIndex+1) + ' / ' + ALL_LETTERS.length;
  setCoverage(0);
  var fb = document.getElementById('write-feedback');
  fb.textContent = '·'; fb.className = 'write-feedback';
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

function updateCoverage(){
  if(!letterMaskTotal || !letterMaskFlag) return;
  var data = fctx.getImageData(0,0,WSIZE,WSIZE).data;
  var paintedTotal = 0, paintedInMask = 0;
  for(var y=0; y<WSIZE; y+=3){
    for(var x=0; x<WSIZE; x+=3){
      var mi = y*WSIZE + x;
      if(data[mi*4 + 3] > 0){ paintedTotal++; if(letterMaskFlag[mi]) paintedInMask++; }
    }
  }
  var hitRatio = paintedInMask / letterMaskTotal;                                  // Anteil der Maske, der getroffen wurde
  var strayRatio = paintedTotal > 0 ? (paintedTotal - paintedInMask) / paintedTotal : 0; // Anteil, der daneben liegt
  var score = Math.max(0, hitRatio - strayRatio);                                  // Präzision (λ=1): Danebenmalen zählt gegen dich
  setCoverage(Math.round(score * 100));
  var fb = document.getElementById('write-feedback');
  if(hitRatio >= 0.6 && strayRatio <= 0.25){ fb.textContent = 'Schön nachgezeichnet ✦'; fb.className = 'write-feedback good'; }
  else if(strayRatio > 0.4){ fb.textContent = 'Bleib auf der Buchstabenform ✦'; fb.className = 'write-feedback'; }
  else { fb.textContent = '·'; fb.className = 'write-feedback'; }
}

function setCoverage(pct){
  document.getElementById('write-meter-bar').style.width = Math.min(pct,100) + '%';
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
  var fb = document.getElementById('write-feedback'); fb.textContent = '·'; fb.className = 'write-feedback';
}
function writeListen(){ speak(ALL_LETTERS[writeIndex].ch); }

