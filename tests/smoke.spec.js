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
  expect(initial[10]).toBe('bald'); // L11 — Inhalt folgt in AP 1.3
  expect(initial[11]).toBe('bald'); // L12

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

test('Lektions-Fragenpools sind für jede spielbare Lektion ≥ 40', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const pools = await page.evaluate(() => {
    var out = {};
    STUFE1_LEKTIONEN.forEach(function (l) {
      if (l.contentPending) return;
      out[l.id] = (l.typ === 'buchstaben') ? buildLektionPoolBuchstaben(l).length : buildLektionPoolHarakat(l).length;
    });
    return out;
  });
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

test('Schreibtrainer: Vollkritzeln gibt niedrigen Präzisions-Score', async ({ page }) => {
  const errors = [];
  await harden(page, errors);
  await page.goto(APP);
  await page.waitForTimeout(400);

  const score = await page.evaluate(async () => {
    startWriting();
    await new Promise(r => setTimeout(r, 500));
    fctx.fillStyle = '#e0bb45';
    fctx.fillRect(0, 0, WSIZE, WSIZE);
    updateCoverage();
    return parseInt(document.getElementById('write-meter-bar').style.width, 10);
  });

  expect(score).toBeLessThan(60);
  expect(errors).toEqual([]);
});
