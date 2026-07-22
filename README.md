# المفتاح — Al-Miftāḥ

**Der Schlüssel zur arabischen Sprache.** Eine App, die Anfänger ohne jede
Vorkenntnis Schritt für Schritt vom ersten Buchstaben bis zum eigenständigen
Lesen führt — strukturiert, mit sofortigem Feedback und ehrlichen
Fortschritts-Nachweisen.

## Stufen

1. **Buchstaben & Schrift** — Alphabet, Formen, Aussprache, Vokalzeichen
   (alle Tanwin-Arten, lange Vokale), Lesen erster Wörter, Schreibtrainer.
2. **Erste Wörter & Sätze** — 219 Vokabeln in 10 Themenfeldern + Gespräche.
3. **Grammatik & Verben** *(in Arbeit)*
4. **Meisterschaft & Übersetzung** *(in Arbeit)*

Der vollständige Ausbauplan steht in [`MASTERPLAN.md`](MASTERPLAN.md).

## Technik

Statische App ohne Build-Schritt: HTML + CSS + Vanilla-JavaScript (ES5-Stil),
Module über `<script defer>`. Fortschritt lokal (localStorage) mit optionalem
Cloud-Sync über Supabase.

```
index.html           Seitengerüst & Ansichten
css/app.css          Styles
js/                   core, data-*, srs, exercises, writing, auth-sync, main
vokabeln.js          Wortschatz-Datenbank (10 Themen)
tests/smoke.spec.js  Playwright-Smoke-Test
```

## Entwicklung

```bash
npm install
npm run verify      # Syntax-Check + Smoke-Test (siehe docs/VERIFY.md)
```

Zum lokalen Ansehen genügt es, `index.html` im Browser zu öffnen.

## Veröffentlichen

Über GitHub Pages (kein Build nötig):
**Settings → Pages → Branch `main`**. Danach erreichbar unter
`https://<user>.github.io/al-miftah-/`.
