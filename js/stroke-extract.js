/* stroke-extract.js — Algorithmische Strichpfad-Extraktion (AP 1.4).
   Statt Hunderte Koordinaten pro Buchstabe von Hand zu erfassen (fehler-
   anfällig, kaum verifizierbar), wird der Strichpfad direkt aus dem
   gerenderten Zeichen berechnet: Maske → Skelettierung (Zhang-Suen) →
   Pfad-Verfolgung. Funktioniert automatisch für jeden Buchstaben und
   jedes Sonderzeichen, ohne Datenpflege.

   Einschränkung (bewusst dokumentiert): Startpunkt und Richtung jedes
   Strichs sind eine Heuristik (rechteste/oberste Endpunkt zuerst, passend
   zur Schreibrichtung RTL), keine von einem Kalligraphie-Experten
   geprüfte traditionelle Strichfolge. Für die meisten Buchstaben (ein
   durchgehender Bogen + Punkte) trifft die Heuristik die Praxis gut;
   für mehrdeutige Fälle wäre eine manuelle Korrektur pro Buchstabe der
   nächste Verfeinerungsschritt.

   Ergebnis: extractLetterStrokes(ch) → [{ typ:'linie'|'punkt', punkte:[{x,y},...] }, ...]
   in 320×320-Koordinaten (WSIZE), Reihenfolge: größte Linie(n) zuerst,
   dann Punkte oben-nach-unten, rechts-nach-links. Ergebnisse werden
   pro Zeichen gecacht (STROKE_CACHE). */

var STROKE_GRID = 160;           // Arbeitsauflösung für Skelettierung (schnell, ausreichend präzise)
var STROKE_SCALE = 320 / STROKE_GRID; // Rückskalierung auf die 320×320-Canvas-Welt
// Kalibriert an echten Messwerten: Punkte liegen bei 160er-Auflösung im Bereich
// 169-182 Rohpixel, der kleinste echte Strich (ذ) bei 1265 — großer Sicherheitsabstand.
var STROKE_DOT_MAX_PX = 400;     // Komponenten mit weniger Pixeln bei 160er-Auflösung = Punkt, kein Strich
var STROKE_MIN_PATH_LEN = 6;     // kürzere Skelett-Pfade sind Zhang-Suen-Spornartefakte, kein echter Strich
var STROKE_RESAMPLE_N = 48;      // Punkte pro Linienstrich nach Resampling

var STROKE_CACHE = {};

function extractLetterStrokes(ch){
  if(STROKE_CACHE[ch]) return STROKE_CACHE[ch];
  var grid = renderGlyphGrid(ch, STROKE_GRID);
  var comps = floodFillComponents(grid, STROKE_GRID, STROKE_GRID);

  var body = [], dots = [];
  comps.forEach(function(comp){
    if(comp.length < STROKE_DOT_MAX_PX){ dots.push(comp); }
    else { body.push(comp); }
  });

  // Größte Linienstriche zuerst; bei Gleichstand weiter rechts zuerst (RTL).
  body.sort(function(a, b){
    if(b.length !== a.length) return b.length - a.length;
    return komponentenSchwerpunkt(b, STROKE_GRID).x - komponentenSchwerpunkt(a, STROKE_GRID).x;
  });
  // Punkte: oben zuerst, dann rechts zuerst.
  dots.sort(function(a, b){
    var ca = komponentenSchwerpunkt(a, STROKE_GRID), cb = komponentenSchwerpunkt(b, STROKE_GRID);
    if(Math.abs(ca.y - cb.y) > 3) return ca.y - cb.y;
    return cb.x - ca.x;
  });

  var strokes = [];
  body.forEach(function(comp){
    var bodyGrid = new Uint8Array(STROKE_GRID * STROKE_GRID);
    comp.forEach(function(idx){ bodyGrid[idx] = 1; });
    var skeleton = zhangSuenThin(bodyGrid, STROKE_GRID, STROKE_GRID);
    var skelComps = floodFillComponents(skeleton, STROKE_GRID, STROKE_GRID, 8);
    skelComps.forEach(function(skelComp){
      // Zhang-Suen hinterlässt an Verzweigungen oft 1-3px-„Sporne" — echtes
      // Rauschen, kein eigener Strich. Nur den längsten Pfad je Komponente
      // behalten, kürzere Nebenpfade herausfiltern (Fallback: alles behalten,
      // falls die Filterung eine Komponente komplett leeren würde).
      var alle = pathsFromComponent(skelComp, STROKE_GRID, STROKE_GRID);
      var relevant = alle.filter(function(p){ return p.length >= STROKE_MIN_PATH_LEN; });
      if(!relevant.length) relevant = alle;
      relevant.forEach(function(pixelPath){
        var punkte = pixelPath.map(function(idx){
          return { x: (idx % STROKE_GRID) * STROKE_SCALE, y: Math.floor(idx / STROKE_GRID) * STROKE_SCALE };
        });
        strokes.push({ typ:'linie', punkte: resamplePath(punkte, STROKE_RESAMPLE_N) });
      });
    });
  });
  dots.forEach(function(comp){
    var c = komponentenSchwerpunkt(comp, STROKE_GRID);
    strokes.push({ typ:'punkt', punkte: [{ x: c.x * STROKE_SCALE, y: c.y * STROKE_SCALE }] });
  });

  STROKE_CACHE[ch] = strokes;
  return strokes;
}

/* ---------- Rendering: Zeichen -> Binärraster ---------- */
function renderGlyphGrid(ch, size){
  var full = 320;
  var c = document.createElement('canvas'); c.width = full; c.height = full;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 240px "Noto Naskh Arabic", serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, full/2, full/2 + 8);
  var data = ctx.getImageData(0,0,full,full).data;
  var scale = full / size;
  var grid = new Uint8Array(size*size);
  for(var y=0;y<size;y++){
    for(var x=0;x<size;x++){
      // 2x2-Block-OR beim Downsampling: irgendein Vollpixel im Block reicht.
      var fx = Math.floor(x*scale), fy = Math.floor(y*scale);
      var hit = 0;
      for(var dy=0; dy<scale && !hit; dy++){
        for(var dx=0; dx<scale && !hit; dx++){
          var px = Math.min(full-1, fx+dx), py = Math.min(full-1, fy+dy);
          var i = (py*full+px)*4;
          if(data[i+3] > 80) hit = 1;
        }
      }
      if(hit) grid[y*size+x] = 1;
    }
  }
  return grid;
}

/* ---------- Connected Components (Flood-Fill, 8er-Nachbarschaft) ---------- */
function floodFillComponents(grid, w, h){
  var visited = new Uint8Array(w*h);
  var comps = [];
  for(var i=0;i<w*h;i++){
    if(grid[i] && !visited[i]){
      var comp = [];
      var stack = [i];
      visited[i] = 1;
      while(stack.length){
        var idx = stack.pop();
        comp.push(idx);
        var nb = neighbors8(idx, w, h);
        for(var k=0;k<nb.length;k++){
          var n = nb[k];
          if(grid[n] && !visited[n]){ visited[n] = 1; stack.push(n); }
        }
      }
      comps.push(comp);
    }
  }
  return comps;
}
function neighbors8(idx, w, h){
  var x = idx % w, y = Math.floor(idx / w);
  var out = [];
  for(var dy=-1; dy<=1; dy++){
    for(var dx=-1; dx<=1; dx++){
      if(dx===0 && dy===0) continue;
      var nx = x+dx, ny = y+dy;
      if(nx>=0 && ny>=0 && nx<w && ny<h) out.push(ny*w+nx);
    }
  }
  return out;
}
function komponentenSchwerpunkt(comp, w){
  var sx=0, sy=0;
  comp.forEach(function(idx){ sx += idx % w; sy += Math.floor(idx / w); });
  return { x: sx / comp.length, y: sy / comp.length };
}

/* ---------- Zhang-Suen-Skelettierung ---------- */
function zhangSuenThin(grid, w, h){
  var img = new Uint8Array(grid);
  function get(x,y){ if(x<0||y<0||x>=w||y>=h) return 0; return img[y*w+x]; }
  var changed = true;
  var guard = 0;
  while(changed && guard < 200){
    guard++;
    changed = false;
    var removeA = zsPass(img, w, h, get, true);
    if(removeA.length){ removeA.forEach(function(idx){ img[idx]=0; }); changed = true; }
    var removeB = zsPass(img, w, h, get, false);
    if(removeB.length){ removeB.forEach(function(idx){ img[idx]=0; }); changed = true; }
  }
  return img;
}
function zsPass(img, w, h, get, stepOne){
  var toRemove = [];
  for(var y=1;y<h-1;y++){
    for(var x=1;x<w-1;x++){
      if(!get(x,y)) continue;
      var p2=get(x,y-1), p3=get(x+1,y-1), p4=get(x+1,y), p5=get(x+1,y+1),
          p6=get(x,y+1), p7=get(x-1,y+1), p8=get(x-1,y), p9=get(x-1,y-1);
      var n = [p2,p3,p4,p5,p6,p7,p8,p9];
      var B = n[0]+n[1]+n[2]+n[3]+n[4]+n[5]+n[6]+n[7];
      if(B<2 || B>6) continue;
      var A = 0;
      for(var k=0;k<8;k++){ if(n[k]===0 && n[(k+1)%8]===1) A++; }
      if(A!==1) continue;
      if(stepOne){
        if(p2*p4*p6 !== 0) continue;
        if(p4*p6*p8 !== 0) continue;
      } else {
        if(p2*p4*p8 !== 0) continue;
        if(p2*p6*p8 !== 0) continue;
      }
      toRemove.push(y*w+x);
    }
  }
  return toRemove;
}

/* ---------- Pfad-Verfolgung innerhalb einer Skelett-Komponente ---------- */
function pathsFromComponent(comp, w, h){
  var compSet = {};
  comp.forEach(function(idx){ compSet[idx] = true; });
  var visited = {};
  var paths = [];
  var visitedCount = 0;

  while(visitedCount < comp.length){
    var candidates = comp.filter(function(idx){ return !visited[idx]; });
    var degree = {};
    candidates.forEach(function(idx){
      degree[idx] = neighbors8(idx, w, h).filter(function(n){ return compSet[n] && !visited[n]; }).length;
    });
    var minDeg = candidates.reduce(function(m, idx){ return Math.min(m, degree[idx]); }, 8);
    var endpoints = candidates.filter(function(idx){ return degree[idx] === minDeg; });
    // RTL-Heuristik: am weitesten rechts, dann am weitesten oben zuerst.
    endpoints.sort(function(a, b){
      var ax=a%w, ay=Math.floor(a/w), bx=b%w, by=Math.floor(b/w);
      if(bx !== ax) return bx - ax;
      return ay - by;
    });
    var start = endpoints[0];

    var path = [start];
    visited[start] = true; visitedCount++;
    var current = start, lastDir = null;
    while(true){
      var nbrs = neighbors8(current, w, h).filter(function(n){ return compSet[n] && !visited[n]; });
      if(!nbrs.length) break;
      var next;
      if(nbrs.length === 1 || !lastDir){
        next = nbrs[0];
      } else {
        var cx = current % w, cy = Math.floor(current / w);
        next = nbrs.reduce(function(best, n){
          var nx = n % w, ny = Math.floor(n / w);
          var dot = (nx-cx)*lastDir.x + (ny-cy)*lastDir.y;
          var bx = best % w, by = Math.floor(best / w);
          var bestDot = (bx-cx)*lastDir.x + (by-cy)*lastDir.y;
          return dot > bestDot ? n : best;
        });
      }
      var cx2 = current % w, cy2 = Math.floor(current / w), nx2 = next % w, ny2 = Math.floor(next / w);
      lastDir = { x: nx2-cx2, y: ny2-cy2 };
      path.push(next);
      visited[next] = true; visitedCount++;
      current = next;
    }
    paths.push(path);
  }
  return paths;
}

/* ---------- Resampling: gleichmäßiger Punktabstand entlang des Pfads ---------- */
function resamplePath(points, n){
  if(points.length <= 1) return points.slice();
  var dists = [0];
  for(var i=1;i<points.length;i++){
    var dx = points[i].x-points[i-1].x, dy = points[i].y-points[i-1].y;
    dists.push(dists[i-1] + Math.sqrt(dx*dx+dy*dy));
  }
  var total = dists[dists.length-1];
  if(total === 0) return [points[0]];
  var out = [];
  for(var k=0;k<n;k++){
    var target = total * k/(n-1);
    var idx = 0;
    while(idx < dists.length-2 && dists[idx+1] < target) idx++;
    var segLen = dists[idx+1] - dists[idx];
    var t = segLen > 0 ? (target - dists[idx]) / segLen : 0;
    var a = points[idx], b = points[Math.min(idx+1, points.length-1)];
    out.push({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t });
  }
  return out;
}
