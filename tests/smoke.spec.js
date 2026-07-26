// Smoke-Test für Al-Miftāḥ — prüft, dass die modulare App lädt und die
// Kern-Lernflows ohne JavaScript-Fehler funktionieren.
// Siehe docs/VERIFY.md für die manuelle Checkliste.
const { test, expect } = require('@playwright/test');
const path = require('path');

const APP = 'file://' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

// Externe Ressourcen (Fonts, Supabase-CDN) für Determinismus abschneiden —
// die App muss auch ohne sie sauber laufen.
async function harden(page, errors) {
  await page.route('**://**', route => {
    const u = route.request().url();
    if (u.startsWith('file://')) return route.continue();
    return route.abort();
  });
  page.on('pageerror', e => errors.push(String(e)));
}

async function unlockStufe2(page) {
  await page.evaluate(() => localStorage.setItem('almiftah_exams', JSON.stringify({ stufe1: { passed: true } })));
  await page.reload();
  await page.waitForTimeout(400);
}

test('Module laden, Daten & Init sind vorhanden', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => ({
    esc: typeof esc, go: typeof go, speak: typeof speak, shuffle: typeof shuffle,
    letters: (typeof ALL_LETTERS !== 'undefined') ? ALL_LETTERS.length : -1,
    harakat: (typeof HARAKAT !== 'undefined') ? HARAKAT.length : -1,
    vokabeln: (typeof ALLE_VOKABELN !== 'undefined') ? ALLE_VOKABELN.length : -1,
    themen: (typeof VOKAB_THEMEN !== 'undefined') ? VOKAB_THEMEN.length : -1,
    lettersRendered: document.getElementById('letter-groups').innerHTML.length > 100,
    pathRendered: document.getElementById('intro-path').innerHTML.length > 100
  }));

  expect(state.esc).toBe('function');
  expect(state.go).toBe('function');
  expect(state.letters).toBe(28);
  expect(state.harakat).toBe(11);
  expect(state.vokabeln).toBeGreaterThan(200);
  expect(state.themen).toBe(10);
  expect(state.lettersRendered).toBeTruthy();
  expect(state.pathRendered).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Alle Ansichten sind erreichbar', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);
  await unlockStufe2(page);

  const views = ['intro', 'start', 'letters', 'harakat', 'woerter', 'stufe2', 'schreiben'];
  const results = await page.evaluate((vs) => vs.map(v => {
    go(v);
    const active = document.querySelector('.view.active');
    return active && active.id === 'view-' + v;
  }), views);

  expect(results.every(Boolean)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Buchstaben-Übung: richtige Antworten führen zum Abschluss', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  await page.evaluate(() => { go('letters'); startExercise(); });
  await page.waitForTimeout(300);

  const result = await page.evaluate(async () => {
    for (let step = 0; step < 10; step++) {
      const right = document.querySelector('.ex-option[data-idx="' + exRichtigIdx + '"]');
      if (!right) break;
      right.click();
      await new Promise(r => setTimeout(r, 1500));
    }
    const done = document.querySelector('.ex-done h2');
    return done ? done.textContent : null;
  });

  expect(result).toContain('10 von 10');
  expect(errors).toEqual([]);
});

test('Stufe-2-Übungen starten mit gültigen Optionen', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);
  await unlockStufe2(page);
  await page.evaluate(() => document.body.click()); // Audio entsperren

  // Vokabelübung
  const vok = await page.evaluate(async () => {
    go('stufe2'); openThema(1); startVokabelExercise();
    await new Promise(r => setTimeout(r, 350));
    const btns = document.querySelectorAll('.ex-option');
    const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
    return { opts: btns.length, hasRight: !!right };
  });
  expect(vok.opts).toBeGreaterThanOrEqual(2);
  expect(vok.hasRight).toBeTruthy();
  await page.waitForTimeout(1600);

  // Dialog-Quiz
  const dlg = await page.evaluate(async () => {
    go('stufe2'); openDialog(0); startDialogQuiz();
    await new Promise(r => setTimeout(r, 350));
    const btns = document.querySelectorAll('.ex-option');
    const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
    return { opts: btns.length, hasRight: !!right };
  });
  expect(dlg.opts).toBeGreaterThanOrEqual(2);
  expect(dlg.hasRight).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Barrierefreiheit: Tastatur, arabische Auszeichnung, aria-live', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  // Arabischer Titel ist für Screenreader ausgezeichnet
  const titleAr = await page.evaluate(() => {
    const t = document.querySelector('.app-name-ar');
    return t && t.getAttribute('lang') === 'ar' && t.getAttribute('dir') === 'rtl';
  });
  expect(titleAr).toBeTruthy();

  // Übung per Tastatur (Zahltaste) bedienbar
  await page.evaluate(() => { go('letters'); startExercise(); });
  await page.waitForTimeout(300);
  const kbd = await page.evaluate(async () => {
    const glyphLang = document.querySelector('.ex-glyph').getAttribute('lang');
    const feedbackLive = document.getElementById('ex-feedback').getAttribute('aria-live');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    const answered = document.querySelectorAll('.ex-option[disabled]').length > 0
      && document.querySelectorAll('.ex-option.correct, .ex-option.wrong').length > 0;
    return { glyphLang, feedbackLive, answered };
  });
  expect(kbd.glyphLang).toBe('ar');
  expect(kbd.feedbackLive).toBe('polite');
  expect(kbd.answered).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Lektionspfad: Gating, Bestehen schaltet frei, Reload erhält Zustand', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  // Neuer Nutzer: nur L1 offen
  const initial = await page.evaluate(() => STUFE1_LEKTIONEN.map(l => lektionStatus(l.id)));
  expect(initial[0]).toBe('offen');
  expect(initial.slice(1, 10).every(s => s === 'gesperrt')).toBeTruthy();
  expect(initial[10]).toBe('gesperrt'); // L11 — Sonderzeichen (Inhalt seit AP 1.3 vorhanden)
  expect(initial[11]).toBe('gesperrt'); // L12 — Sonnen-/Mondbuchstaben

  // L1-Check bestehen (immer die richtige Option klicken) → L2 offen
  await page.evaluate(() => { document.body.click(); openLektion(1); startLektionCheck(1); });
  await page.waitForTimeout(350);
  await page.evaluate(async () => {
    for (let i = 0; i < 12 && exam.aktiv; i++) {
      const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
      if (!right) break;
      right.click();
      await new Promise(r => setTimeout(r, 1400));
    }
  });
  await page.waitForTimeout(300);
  const afterPass = await page.evaluate(() => ({ l1: lektionStatus(1), l2: lektionStatus(2), l3: lektionStatus(3) }));
  expect(afterPass).toEqual({ l1: 'bestanden', l2: 'offen', l3: 'gesperrt' });

  // Zustand übersteht Reload
  await page.reload();
  await page.waitForTimeout(400);
  const afterReload = await page.evaluate(() => ({ l1: lektionStatus(1), l2: lektionStatus(2) }));
  expect(afterReload).toEqual({ l1: 'bestanden', l2: 'offen' });
  expect(errors).toEqual([]);
});

test('Harakat-Lektionen (L8-L10) erzeugen gültige Fragen', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => {
    var bad = 0, total = 0;
    [8, 9, 10].forEach(function (id) {
      var lek = lektionData(id);
      for (var i = 0; i < 15; i++) {
        buildLektionFragenHarakat(lek).forEach(function (q) {
          total++;
          if (q.optionen.indexOf(q.richtig) < 0) bad++;
        });
      }
    });
    return { total, bad };
  });
  expect(result.bad).toBe(0);
  expect(result.total).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('L11 (Sonderzeichen) und L12 (Sonnen-/Mondbuchstaben): Inhalt, Checks, Distraktoren', async ({ page }) => {
  test.setTimeout(45000); // zwei komplette 10-Fragen-Durchläufe (L11 + L12) nacheinander
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  // Datenintegrität: 10 Sonderzeichen, 28 Sonnen-/Mondwörter, Alphabet vollständig partitioniert
  const daten = await page.evaluate(() => ({
    sz: SONDERZEICHEN.length,
    szWoerter: ALLE_SONDERZEICHEN_WOERTER.length,
    sm: SONNENMOND_WOERTER.length,
    sonne: SONNENBUCHSTABEN.length,
    mond: MONDBUCHSTABEN.length,
    keineUeberlappung: SONNENBUCHSTABEN.filter(function (c) { return MONDBUCHSTABEN.indexOf(c) >= 0; }).length
  }));
  expect(daten).toEqual({ sz: 10, szWoerter: 20, sm: 28, sonne: 14, mond: 14, keineUeberlappung: 0 });

  // 1000 generierte Fragen: keine doppelten Optionen, richtige Antwort immer dabei
  const qualitaet = await page.evaluate(() => {
    var bad = 0, total = 0;
    for (var i = 0; i < 50; i++) {
      buildLektionFragenSonderzeichen().concat(buildLektionFragenSonnenMond()).forEach(function (q) {
        total++;
        if (q.optionen.indexOf(q.richtig) < 0) bad++;
        if (new Set(q.optionen).size !== q.optionen.length) bad++;
      });
    }
    return { total, bad };
  });
  expect(qualitaet.bad).toBe(0);
  expect(qualitaet.total).toBeGreaterThan(0);

  // Distraktoren testen exakt die al-/assimilierte Verwechslung
  const regel = await page.evaluate(() => {
    var sonne = SONNENMOND_WOERTER.filter(function (w) { return w.art === 'sonne'; })[0];
    var mond = SONNENMOND_WOERTER.filter(function (w) { return w.art === 'mond'; })[0];
    return {
      // Sonne: richtig ist assimiliert (z. B. "asch-schamsu"); ein Distraktor testet den
      // typischen Fehler, das Lām unassimiliert als "al-" zu lesen.
      sonneFalschEnthaeltAl: sonne.falsch.some(function (f) { return f.indexOf('al-') === 0; }),
      // Mond: richtig ist "al-..."; ein Distraktor testet den umgekehrten Fehler,
      // das Lām fälschlich zu assimilieren (bricht das "al-"-Präfix).
      mondFalschEnthaeltAssimiliert: mond.falsch.some(function (f) { return f.indexOf('al-') !== 0; })
    };
  });
  expect(regel.sonneFalschEnthaeltAl).toBeTruthy();
  expect(regel.mondFalschEnthaeltAssimiliert).toBeTruthy();

  // Kompletter Durchlauf: L1-10 bestanden -> L11 offen -> Check bestehen -> L12 offen -> Check bestehen
  await page.evaluate(() => {
    var st = {};
    for (var i = 1; i <= 10; i++) { st[i] = { passed: true, best: 10, versuche: 1 }; }
    localStorage.setItem('almiftah_lektionen', JSON.stringify(st));
  });
  await page.reload();
  await page.waitForTimeout(400);
  await page.evaluate(() => document.body.click());

  const vor = await page.evaluate(() => ({ l11: lektionStatus(11), l12: lektionStatus(12) }));
  expect(vor).toEqual({ l11: 'offen', l12: 'gesperrt' });

  await page.evaluate(() => { openLektion(11); startLektionCheck(11); });
  await page.waitForTimeout(350);
  await page.evaluate(async () => {
    for (let i = 0; i < 12 && exam.aktiv; i++) {
      const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
      if (!right) break;
      right.click();
      await new Promise(r => setTimeout(r, 1400));
    }
  });
  await page.waitForTimeout(300);
  const nachL11 = await page.evaluate(() => ({ l11: lektionStatus(11), l12: lektionStatus(12) }));
  expect(nachL11).toEqual({ l11: 'bestanden', l12: 'offen' });

  const detailL11 = await page.evaluate(async () => {
    openLektion(11);
    await new Promise(r => setTimeout(r, 150));
    var html = document.getElementById('lektion-inhalt').innerHTML;
    return (html.match(/haraka-card/g) || []).length;
  });
  expect(detailL11).toBe(10);

  await page.evaluate(() => { openLektion(12); startLektionCheck(12); });
  await page.waitForTimeout(350);
  await page.evaluate(async () => {
    for (let i = 0; i < 12 && exam.aktiv; i++) {
      const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
      if (!right) break;
      right.click();
      await new Promise(r => setTimeout(r, 1400));
    }
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => lektionStatus(12))).toBe('bestanden');

  expect(errors).toEqual([]);
});

test('Lektions-Fragenpools sind für jede spielbare Lektion ≥ 40', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const pools = await page.evaluate(() => {
    var out = {};
    STUFE1_LEKTIONEN.forEach(function (l) {
      if (l.contentPending) return;
      if (l.typ === 'buchstaben') out[l.id] = buildLektionPoolBuchstaben(l).length;
      else if (l.typ === 'sonderzeichen') out[l.id] = buildLektionPoolSonderzeichen().length;
      else if (l.typ === 'sonne-mond') out[l.id] = buildLektionPoolSonnenMondWort().length + buildLektionPoolSonnenMondArt().length;
      else out[l.id] = buildLektionPoolHarakat(l).length;
    });
    return out;
  });
  expect(Object.keys(pools).length).toBe(12); // alle 12 Lektionen haben inzwischen Inhalt
  Object.values(pools).forEach(size => expect(size).toBeGreaterThanOrEqual(40));
  expect(errors).toEqual([]);
});

test('Selbstauskunft entfernt: freie Übung markiert nicht mehr automatisch als gelernt', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const noSelfReport = await page.evaluate(async () => {
    openLetter('ب');
    await new Promise(r => setTimeout(r, 150));
    var htmlHasButton = document.getElementById('letter-detail-sheet').innerHTML.indexOf('Gelernt') >= 0;
    closeLetter();

    go('bibliothek');
    startExercise();
    await new Promise(r => setTimeout(r, 300));
    var target = exQuestions[0].ch;
    var right = document.querySelector('.ex-option[data-idx="' + exRichtigIdx + '"]');
    right.click();
    await new Promise(r => setTimeout(r, 200));
    return { htmlHasButton, markedAfterOneClick: doneLetters.has(target) };
  });
  expect(noSelfReport.htmlHasButton).toBeFalsy();
  expect(noSelfReport.markedAfterOneClick).toBeFalsy();
  expect(errors).toEqual([]);
});

test('Fehlversuch: Cooldown übersteht Reload, gescheiterte Buchstaben in SRS-Box 1', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);
  await page.evaluate(() => document.body.click());

  await page.evaluate(() => { srsGrade('ب', true); srsGrade('ب', true); }); // auf Box 3 bringen
  const vorherBox = await page.evaluate(() => srsItem('ب').box);
  expect(vorherBox).toBeGreaterThanOrEqual(3);

  await page.evaluate(() => { openLektion(1); startLektionCheck(1); });
  await page.waitForTimeout(350);
  await page.evaluate(async () => {
    for (let i = 0; i < 12 && exam.aktiv; i++) {
      const buttons = [...document.querySelectorAll('.ex-option')];
      const wrong = buttons.find(b => parseInt(b.getAttribute('data-idx'), 10) !== exam.richtigIdx);
      if (!wrong) break;
      wrong.click();
      await new Promise(r => setTimeout(r, 1400));
    }
  });
  await page.waitForTimeout(300);

  const nachFehlversuch = await page.evaluate(() => ({
    box: srsItem('ب').box,
    status: lektionStatus(1),
    restMs: lektionCooldownRestMs(1),
    btnDisabled: (function () { openLektion(1); return document.getElementById('lektion-check-btn').disabled; })(),
    guardBlockt: (function () { exam.aktiv = false; startLektionCheck(1); return exam.aktiv === false; })()
  }));
  expect(nachFehlversuch.box).toBe(1);
  expect(nachFehlversuch.status).toBe('offen'); // nicht bestanden, nicht neu gesperrt
  expect(nachFehlversuch.restMs).toBeGreaterThan(0);
  expect(nachFehlversuch.btnDisabled).toBeTruthy();
  expect(nachFehlversuch.guardBlockt).toBeTruthy();

  await page.reload();
  await page.waitForTimeout(400);
  const nachReload = await page.evaluate(() => lektionCooldownRestMs(1));
  expect(nachReload).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Schreibtrainer 2.0: Vollkritzeln bleibt bei 0%, Anti-Schmier greift trotz Pfad-Tracing', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const score = await page.evaluate(async () => {
    startWriting();
    await new Promise(r => setTimeout(r, 500));
    fctx.fillStyle = '#e0bb45';
    fctx.fillRect(0, 0, WSIZE, WSIZE);
    return parseInt(document.getElementById('write-meter-bar').style.width, 10);
  });
  expect(score).toBeLessThan(60);

  // Auch wenn zusätzlich exakt der Referenzpfad nachgefahren wird, darf die
  // großflächige Verschmutzung den Erfolg nicht durchrutschen lassen
  // (zweite Verteidigungslinie aus AP 0.1/1.2).
  const trotzPfad = await page.evaluate(() => {
    var stroke = writeStrokes[0];
    writeDrawing = true;
    stroke.punkte.forEach(function(p){ wTraceCheck(p); });
    writeDrawing = false;
    wNachfahrenStrokeEnde();
    return { strokeIdx: writeStrokeIdx, feedback: document.getElementById('write-feedback').textContent };
  });
  expect(trotzPfad.strokeIdx).toBe(0);
  expect(errors).toEqual([]);
});

test('Schreibtrainer 2.0: Vorwärts-Nachfahren schließt Strich ab, rückwärts nicht', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  async function frisch(ch){
    await page.evaluate((ch) => openWriting(ch), ch);
    await page.waitForTimeout(300);
    await page.evaluate(() => writeSetMode('nachfahren'));
  }

  await frisch('د'); // 1 Strich, keine Punkte — einfachster Fall
  const vorwaerts = await page.evaluate(() => {
    var stroke = writeStrokes[0];
    writeDrawing = true;
    stroke.punkte.forEach(function(p){ wTraceCheck(p); });
    writeDrawing = false;
    wNachfahrenStrokeEnde();
    return writeStrokeIdx;
  });
  expect(vorwaerts).toBe(1); // Strich abgeschlossen, Buchstabe fertig

  await frisch('د');
  const rueckwaerts = await page.evaluate(() => {
    var stroke = writeStrokes[0];
    var rev = stroke.punkte.slice().reverse();
    writeDrawing = true;
    rev.forEach(function(p){ wTraceCheck(p); });
    writeDrawing = false;
    wNachfahrenStrokeEnde();
    return writeStrokeIdx;
  });
  expect(rueckwaerts).toBe(0); // rückwärts zählt nicht

  expect(errors).toEqual([]);
});

test('Schreibtrainer 2.0: Strichpfade für alle 28 Buchstaben korrekt (Punktanzahl stimmt)', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  // Bekannte Punktanzahl je Buchstabe (arabische Orthographie) — harte,
  // objektive Kontrolle der algorithmischen Strichpfad-Extraktion.
  const erwarteteDots = {
    'ا':0,'ب':1,'ت':2,'ث':3,'ج':1,'ح':0,'خ':1,'د':0,'ذ':1,'ر':0,'ز':1,'س':0,
    'ش':3,'ص':0,'ض':1,'ط':0,'ظ':1,'ع':0,'غ':1,'ف':1,'ق':2,'ك':0,'ل':0,'م':0,
    'ن':1,'ه':0,'و':0,'ي':2
  };
  const result = await page.evaluate((erwartete) => {
    var falsch = [];
    Object.keys(erwartete).forEach(function(ch){
      var strokes = extractLetterStrokes(ch);
      var dots = strokes.filter(function(s){ return s.typ === 'punkt'; }).length;
      var leer = strokes.some(function(s){ return s.punkte.length === 0; });
      if(dots !== erwartete[ch] || leer) falsch.push(ch + ':' + dots + '(erwartet ' + erwartete[ch] + ')');
    });
    return falsch;
  }, erwarteteDots);
  expect(result).toEqual([]);
  expect(errors).toEqual([]);
});

test('Schreibaufgabe im Lektions-Check (ab L2): korrekt bestanden, Kritzeln nicht', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const struktur = await page.evaluate(() => {
    var l1 = buildLektionFragenBuchstaben(lektionData(1));
    var l2 = buildLektionFragenBuchstaben(lektionData(2));
    return {
      l1n: l1.length, l1schreiben: l1.filter(function(q){ return q.typ==='schreiben'; }).length,
      l2n: l2.length, l2schreiben: l2.filter(function(q){ return q.typ==='schreiben'; }).length
    };
  });
  expect(struktur).toEqual({ l1n: 10, l1schreiben: 0, l2n: 10, l2schreiben: 1 });

  await page.evaluate(() => {
    document.body.click();
    exam.fragen = [schreibFrage('د')];
    exam.index = 0; exam.richtig = 0; exam.aktiv = true; exam.mode = 'lektion'; exam.lektionId = 2; exam.lektionFalsch = [];
    go('exercise');
    renderExamQuestion();
  });
  const gut = await page.evaluate(() => {
    var scale = EX_WSIZE / 320;
    extractLetterStrokes('د').forEach(function(s){
      s.punkte.forEach(function(p, i){
        var sp = { x: p.x*scale, y: p.y*scale };
        if(i===0){ exWriteLast = sp; exWDot(sp); } else { exWStroke(exWriteLast, sp); exWriteLast = sp; }
      });
    });
    exSchreibenFertig();
    return document.getElementById('ex-feedback').className;
  });
  expect(gut).toContain('good');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => exam.richtig)).toBe(1);

  await page.evaluate(() => {
    exam.fragen = [schreibFrage('د')]; exam.index = 0; exam.richtig = 0; exam.lektionFalsch = [];
    renderExamQuestion();
  });
  const schlecht = await page.evaluate(() => {
    exWriteCtx.fillStyle = '#e0bb45';
    exWriteCtx.fillRect(0, 0, EX_WSIZE, EX_WSIZE);
    exSchreibenFertig();
    return document.getElementById('ex-feedback').className;
  });
  expect(schlecht).toContain('bad');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => exam.richtig)).toBe(0);

  expect(errors).toEqual([]);
});

test('Stufenprüfung 2.0: Zulassungs-Gate, Skip-Weg, Anti-Wiederholung', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  page.on('dialog', d => d.accept()); // die Gate-/Cooldown-Hinweise nutzen alert()
  await page.goto(APP);
  await page.waitForTimeout(400);

  // Ohne bestandene Lektionen blockiert der normale Einstieg und leitet zurück.
  const blocked = await page.evaluate(() => {
    go('exercise');
    startStufenpruefung();
    return document.querySelector('.view.active').id;
  });
  expect(blocked).toBe('view-letters');

  // Der "Kann ich schon"-Skip funktioniert trotzdem und liefert 27 Fragen.
  const skip = await page.evaluate(() => {
    startStufenpruefungSkip();
    return { aktiv: exam.aktiv, n: exam.fragen.length };
  });
  expect(skip).toEqual({ aktiv: true, n: 27 });

  // Zwei aufeinanderfolgende Versuche teilen < 50% identische Fragen.
  const overlaps = [];
  let prevKeys = null;
  for (let i = 0; i < 5; i++) {
    const keys = await page.evaluate(() => { startStufenpruefungSkip(); return exam.fragen.map(pruefungFrageKey); });
    if (prevKeys) {
      const overlap = keys.filter(k => prevKeys.includes(k)).length / keys.length;
      overlaps.push(overlap);
    }
    prevKeys = keys;
  }
  overlaps.forEach(o => expect(o).toBeLessThan(0.5));
  expect(errors).toEqual([]);
});

test('Stufenprüfung 2.0: Bestehen schaltet Stufe 2 frei, Fehlversuch setzt 30-Min-Cooldown', async ({ page }) => {
  test.setTimeout(120000); // zwei komplette 27-Fragen-Durchläufe nacheinander
  const errors = [];
  await harden(page, errors);
  page.on('dialog', d => d.accept());
  await page.goto(APP);
  await page.waitForTimeout(400);

  const pass = await page.evaluate(async () => {
    startStufenpruefungSkip();
    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 30 && exam.aktiv; i++) {
      const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
      if (!right) break;
      right.click();
      await new Promise(r => setTimeout(r, 1300));
    }
    return { richtig: exam.richtig, bestanden: examData.stufe1.passed, historyLen: examData.stufe1.history.length };
  });
  expect(pass.richtig).toBe(27);
  expect(pass.bestanden).toBeTruthy();
  expect(pass.historyLen).toBeGreaterThan(0);

  await page.evaluate(() => localStorage.removeItem('almiftah_exams'));
  await page.reload();
  await page.waitForTimeout(400);

  const fail = await page.evaluate(async () => {
    startStufenpruefungSkip();
    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 30 && exam.aktiv; i++) {
      const buttons = [...document.querySelectorAll('.ex-option')];
      const wrong = buttons.find(b => parseInt(b.getAttribute('data-idx'), 10) !== exam.richtigIdx);
      if (!wrong) break;
      wrong.click();
      await new Promise(r => setTimeout(r, 1300));
    }
    return { bestanden: examData.stufe1.passed, restMs: pruefungCooldownRestMs() };
  });
  expect(fail.bestanden).toBeFalsy();
  expect(fail.restMs).toBeGreaterThan(0);

  await page.reload();
  await page.waitForTimeout(400);
  const restNachReload = await page.evaluate(() => pruefungCooldownRestMs());
  expect(restNachReload).toBeGreaterThan(0);

  const guard = await page.evaluate(() => { exam.aktiv = false; startStufenpruefungSkip(); return exam.aktiv; });
  expect(guard).toBe(false);
  expect(errors).toEqual([]);
});

test('AP 1.5: SILBEN_WOERTER-Daten sind intakt (Silben ergeben exakt das Wort, keine doppelten/falschen Distraktoren)', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);

  const check = await page.evaluate(() => {
    var bad = [];
    SILBEN_WOERTER.forEach(function (w) {
      if (w.silben.join('') !== w.ar) bad.push('concat-mismatch: ' + w.ar);
      var falschSet = {};
      w.falsch.forEach(function (f) {
        if (falschSet[f]) bad.push('duplicate-distraktor: ' + w.ar);
        falschSet[f] = true;
        if (f === w.tr) bad.push('distraktor-equals-correct: ' + w.ar);
      });
    });
    return { total: SILBEN_WOERTER.length, mehrsilbig: silbenPool().length, bad: bad };
  });
  expect(check.bad).toEqual([]);
  expect(check.total).toBeGreaterThanOrEqual(40);
  expect(check.mehrsilbig).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('AP 1.5: Silben bauen — falsche Reihenfolge wird abgelehnt, richtige Reihenfolge schließt ab', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);

  const result = await page.evaluate(async () => {
    var w = silbenPool().find(function (x) { return x.silben.length === 3; }) || silbenPool()[0];
    silbenWoerter = [w];
    silbenIndex = 0; silbenCorrect = 0;
    exerciseReturnView = 'letters';
    go('exercise');
    renderSilbenFrage();
    await new Promise(function (r) { setTimeout(r, 50); });

    var kacheln = Array.prototype.slice.call(document.querySelectorAll('.silben-kachel'));
    var order = kacheln.map(function (el) { return parseInt(el.getAttribute('data-i'), 10); });

    // falscher Versuch: klicke ein Element, das NICHT das nächste erwartete ist (falls vorhanden)
    var wrongIdx = order.find(function (i) { return i !== 0; });
    var rejected = true;
    if (wrongIdx !== undefined) {
      var wrongBtn = kacheln.find(function (el) { return parseInt(el.getAttribute('data-i'), 10) === wrongIdx; });
      wrongBtn.click();
      rejected = silbenAktuelleReihenfolge.length === 0;
    }

    // richtige Reihenfolge: 0..n-1 in genau dieser Reihenfolge antippen
    for (var i = 0; i < w.silben.length; i++) {
      var btn = kacheln.find(function (el) { return parseInt(el.getAttribute('data-i'), 10) === i; });
      btn.click();
    }
    await new Promise(function (r) { setTimeout(r, 50); });
    return { rejected: rejected, done: silbenAktuelleReihenfolge.length === w.silben.length, silbenLen: w.silben.length };
  });
  expect(result.rejected).toBeTruthy();
  expect(result.done).toBeTruthy();
  expect(errors).toEqual([]);
});

test('AP 1.5: Schnell-Lesen — Zeitbonus (schnell=+2, langsam=+1) und Session-Punkte', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);

  const result = await page.evaluate(async () => {
    startSchnellLesen();
    await new Promise(function (r) { setTimeout(r, 50); });
    // schnelle korrekte Antwort simulieren
    schnellStart = Date.now() - 500; // 0.5s "verstrichen"
    var richtigBtn = document.querySelector('.ex-option[data-idx="' + schnellRichtigIdx + '"]');
    var punkteVorher = schnellPunkte;
    richtigBtn.click();
    await new Promise(function (r) { setTimeout(r, 1500); }); // Auto-Advance zur nächsten Frage abwarten
    var bonusSchnell = schnellPunkte - punkteVorher;

    // langsame korrekte Antwort simulieren
    schnellStart = Date.now() - 4000; // 4s "verstrichen"
    var richtigBtn2 = document.querySelector('.ex-option[data-idx="' + schnellRichtigIdx + '"]');
    var punkteVorher2 = schnellPunkte;
    if (richtigBtn2) richtigBtn2.click();
    await new Promise(function (r) { setTimeout(r, 50); });
    var bonusLangsam = schnellPunkte - punkteVorher2;

    return { bonusSchnell: bonusSchnell, bonusLangsam: bonusLangsam };
  });
  expect(result.bonusSchnell).toBe(2);
  expect(result.bonusLangsam).toBe(1);
  expect(errors).toEqual([]);
});

test('AP 1.5: Tages-Session enthält genau eine Silben-Frage', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);

  const silbenCount = await page.evaluate(() => {
    var session = buildDailySession();
    return session.filter(function (q) { return q.typ === 'silben'; }).length;
  });
  expect(silbenCount).toBe(1);
  expect(errors).toEqual([]);
});

test('AP 1.5: L9 und L12 zeigen "Silben bauen" und "Schnell-Lesen" Buttons, die die Übungen starten', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);

  const setup = await page.evaluate(() => {
    var st = loadLektionenState();
    for (var i = 1; i <= 11; i++) { st[i] = st[i] || {}; st[i].passed = true; }
    saveLektionenState(st);
    return true;
  });
  expect(setup).toBeTruthy();

  for (const id of [9, 12]) {
    const html = await page.evaluate((lid) => { openLektion(lid); return document.getElementById('lektion-inhalt').innerHTML; }, id);
    expect(html).toContain('startSilbenUebung');
    expect(html).toContain('startSchnellLesen');
  }

  // Silben bauen von L9 aus startet die Übung
  await page.evaluate(() => { openLektion(9); });
  const silbenBtn = await page.locator('button:has-text("Silben bauen")').first();
  await silbenBtn.click();
  await page.waitForTimeout(150);
  const silbenLaunched = await page.evaluate(() => !!document.getElementById('silben-antwort'));
  expect(silbenLaunched).toBeTruthy();

  // Schnell-Lesen von L12 aus startet die Übung
  await page.evaluate(() => { go('letters'); openLektion(12); });
  const schnellBtn = await page.locator('button:has-text("Schnell-Lesen")').first();
  await schnellBtn.click();
  await page.waitForTimeout(150);
  const schnellLaunched = await page.evaluate(() => typeof schnellStart === 'number' && schnellStart > 0);
  expect(schnellLaunched).toBeTruthy();

  expect(errors).toEqual([]);
});

test('AP 2.1: Kapitel-/Lektionsstruktur Stufe 2 — Gating, Erstkontakt-SRS, Bestehen/Cooldown', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);
  await unlockStufe2(page);

  const gate = await page.evaluate(() => {
    go('stufe2');
    return {
      total: document.querySelectorAll('#kapitel-liste .stop').length,
      offen: document.querySelectorAll('#kapitel-liste .stop-clickable').length,
    };
  });
  expect(gate.total).toBe(10); // 10 Themenfelder = 10 Kapitel
  expect(gate.offen).toBe(1); // nur Kapitel 1 zu Beginn offen

  const k0 = await page.evaluate(() => {
    openKapitel(0);
    return {
      total: document.querySelectorAll('#kapitel-pfad .stop').length,
      offen: document.querySelectorAll('#kapitel-pfad .stop-clickable').length,
    };
  });
  expect(k0.total).toBe(2); // Kapitel 0 hat 2 Lektionen
  expect(k0.offen).toBe(1); // nur Lektion 1 offen

  const vorKontakt = await page.evaluate(() => alleSrsItems().filter(function (it) { return it.art === 'v'; }).length);
  expect(vorKontakt).toBe(0); // vor jedem Lektion-2-Besuch: kein Vokabelwort im SRS

  const l1 = await page.evaluate(() => {
    openLektion2(0, 1);
    return {
      karten: document.querySelectorAll('#lektion2-inhalt .haraka-card').length,
      besucht: loadKapitelState()['0_1'] && loadKapitelState()['0_1'].besucht,
    };
  });
  expect(l1.karten).toBe(7); // Kapitel 0 / Lektion 1 hat 7 Vokabeln (Datenmodell aus vokabeln.js)
  expect(l1.besucht).toBeTruthy();

  const nachKontakt = await page.evaluate(() => alleSrsItems().filter(function (it) { return it.art === 'v'; }).length);
  expect(nachKontakt).toBe(7); // SRS übernimmt exakt die Wörter der besuchten Lektion, nicht alle 219

  const pass = await page.evaluate(async () => {
    startLektion2Check(0, 1);
    await new Promise((r) => setTimeout(r, 200));
    for (let i = 0; i < 15 && exam.aktiv; i++) {
      const right = document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]');
      if (!right) break;
      right.click();
      await new Promise((r) => setTimeout(r, 1400));
    }
    return { richtig: exam.richtig, n: exam.fragen.length, bestanden: lek2Bestanden(0, 1) };
  });
  expect(pass.n).toBe(12);
  expect(pass.richtig).toBe(12);
  expect(pass.bestanden).toBeTruthy();

  const nachBestehen = await page.evaluate(() => ({
    lektion2Offen: lek2Status(0, 2),
    kapitel1Gesperrt: kapitelStatus(1),
  }));
  expect(nachBestehen.lektion2Offen).toBe('offen');
  expect(nachBestehen.kapitel1Gesperrt).toBe('gesperrt'); // Kapitel 0 noch nicht komplett (Lektion 2 fehlt)

  const fail = await page.evaluate(async () => {
    openLektion2(0, 2);
    startLektion2Check(0, 2);
    await new Promise((r) => setTimeout(r, 200));
    for (let i = 0; i < 15 && exam.aktiv; i++) {
      const buttons = [...document.querySelectorAll('.ex-option')];
      const wrong = buttons.find((b) => parseInt(b.getAttribute('data-idx'), 10) !== exam.richtigIdx);
      if (!wrong) break;
      wrong.click();
      await new Promise((r) => setTimeout(r, 1400));
    }
    return { bestanden: lek2Bestanden(0, 2), restMs: lek2CooldownRestMs(0, 2) };
  });
  expect(fail.bestanden).toBeFalsy();
  expect(fail.restMs).toBeGreaterThan(0);

  // Alte, freie Wortschatz-Bibliothek bleibt unangetastet erreichbar
  const bib = await page.evaluate(async () => {
    go('woerter-bibliothek');
    const themenCount = document.querySelectorAll('#themen-list button').length;
    openThema(1);
    startVokabelExercise();
    await new Promise((r) => setTimeout(r, 300));
    return { themenCount, opts: document.querySelectorAll('.ex-option').length };
  });
  expect(bib.themenCount).toBe(10);
  expect(bib.opts).toBeGreaterThanOrEqual(2);

  expect(errors).toEqual([]);
});

test('AP 2.2: Dialog-Wortabdeckung lückenlos (jedes Wort ∈ Vokabular ∪ Funktionswörter)', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);

  const luecken = await page.evaluate(() => dialogWortAbdeckungLuecken());
  expect(luecken).toEqual([]);
  expect(errors).toEqual([]);
});

test('AP 2.2: Dialog-Modi (Lesen/Hören/Rollenspiel) funktionieren', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);
  await unlockStufe2(page);
  await page.evaluate(() => document.body.click());

  const lesen = await page.evaluate(() => {
    go('stufe2');
    openDialog(0);
    return { mode: dialogMode, hatQuizButton: document.getElementById('dialog-body').innerHTML.includes('Quiz starten') };
  });
  expect(lesen.mode).toBe('lesen');
  expect(lesen.hatQuizButton).toBeTruthy();

  const hoeren = await page.evaluate(() => {
    setDialogMode('hoeren');
    const verdecktVorher = document.getElementById('dialog-body').innerHTML.includes('verdeckt');
    dialogHoerenAufdecken(0);
    const sichtbareZeilenNachher = document.querySelectorAll('#dialog-body .dlg-ar').length;
    return { verdecktVorher, sichtbareZeilenNachher };
  });
  expect(hoeren.verdecktVorher).toBeTruthy();
  expect(hoeren.sichtbareZeilenNachher).toBe(1); // genau die eine aufgedeckte Zeile

  const rollenspiel = await page.evaluate(async () => {
    setDialogMode('rollenspiel');
    const d = aktuellerDialog;
    const bZeileIdx = d.zeilen.findIndex((z) => z.s === 'B');
    const woerter = dialogZeileWoerter(d.zeilen[bZeileIdx].ar);
    for (let wi = 0; wi < woerter.length; wi++) {
      const btn = document.querySelector('.silben-kachel[onclick*="dlgRollenspielTippe(' + bZeileIdx + ',' + wi + ',"]');
      if (!btn) return { fehler: 'Kachel ' + wi + ' fehlt' };
      btn.click();
    }
    await new Promise((r) => setTimeout(r, 1000));
    return { geloest: document.querySelectorAll('#dialog-body .dlg-ar').length > 0 };
  });
  expect(rollenspiel.geloest).toBeTruthy();

  expect(errors).toEqual([]);
});

test('AP 2.2: Dialog-Quiz mit 5 Fragen inkl. 2 Kachel-Satz-Produktionsfragen', async ({ page }) => {
  test.setTimeout(30000);
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(300);
  await unlockStufe2(page);
  await page.evaluate(() => document.body.click());

  const quiz = await page.evaluate(async () => {
    go('stufe2');
    openDialog(0);
    startDialogQuiz();
    const typen = [];
    for (let i = 0; i < exam.fragen.length; i++) {
      const q = exam.fragen[exam.index];
      typen.push(q.typ);
      if (q.typ === 'kachelsatz') {
        for (let wi = 0; wi < q.woerter.length; wi++) {
          document.querySelector('.silben-kachel[data-i="' + wi + '"]').click();
        }
      } else {
        document.querySelector('.ex-option[data-idx="' + exam.richtigIdx + '"]').click();
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return { typen, richtig: exam.richtig, n: exam.fragen.length };
  });
  expect(quiz.n).toBe(5);
  expect(quiz.typen.filter((t) => t === 'kachelsatz').length).toBe(2);
  expect(quiz.richtig).toBe(5);
  expect(errors).toEqual([]);
});
