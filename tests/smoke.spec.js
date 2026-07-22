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
