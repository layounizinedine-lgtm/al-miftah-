# Verifikation — Al-Miftāḥ

Diese App ist statisch (HTML + CSS + Vanilla-JS, kein Build-Schritt). Vor jedem
Commit an Produktivcode wird geprüft, dass sie lädt und die Kern-Lernflows ohne
JavaScript-Fehler funktionieren.

## Automatisch

```bash
npm install                # einmalig
npm run verify             # Syntax-Check + Smoke-Test
```

- `npm run check` — `node --check` für alle `js/*.js`, `vokabeln.js`, und die
  Kontrolle, dass `index.html` keinen Inline-Skript-Code mehr enthält.
- `npm test` — Playwright-Smoke-Test (`tests/smoke.spec.js`) in Chromium.

Beides läuft bei jedem Push automatisch über GitHub Actions
(`.github/workflows/ci.yml`).

> Hinweis: Der Smoke-Test schneidet externe Requests (Fonts, Supabase-CDN) ab
> und prüft bewusst, dass die App auch ohne sie sauber startet.

## Was der Smoke-Test abdeckt

1. Alle 10 Module laden; globale Funktionen (`esc`, `go`, `speak`, `shuffle`)
   und Daten (28 Buchstaben, 11 Harakat, >200 Vokabeln, 10 Themen) sind da;
   `DOMContentLoaded`-Init hat Pfad und Buchstaben gerendert.
2. Alle sieben Ansichten sind erreichbar.
3. Eine komplette Buchstaben-Übungsrunde (immer richtig) erreicht den
   Abschluss-Screen „10 von 10".
4. Vokabelübung und Dialog-Quiz starten mit gültigen Optionen inkl. korrekt
   markierter richtiger Antwort.
5. Schreibtrainer: Vollkritzeln ergibt einen Präzisions-Score < 60 %.

Keiner der Tests darf einen `pageerror` auslösen.

## Manuelle Checkliste (bei größeren Änderungen zusätzlich)

- [ ] Stufe 1: Buchstabe antippen → Detail mit Formen, Aussprache-Button hörbar.
- [ ] Vokalzeichen: alle drei Tanwin-Arten + lange Vokale sichtbar; Übung mischt sie.
- [ ] Stufenprüfung ablegen → ab 80 % bestanden → Stufe 2 freigeschaltet.
- [ ] Stufe 2: Thema öffnen, Vokabel-Detail (Beispielsatz), Vokabelübung.
- [ ] Dialog lesen (Übersetzung ein-/ausblenden), Gespräch anhören, Quiz.
- [ ] Schreiben: Buchstabe sauber nachfahren → Belohnung; kritzeln → keine.
- [ ] Ganze Übung nur mit Tastatur bedienbar (Tab + Tasten 1–4).

## Deployment (GitHub Pages)

Die App braucht keinen Build. Zum Veröffentlichen:
**Repo → Settings → Pages → Source: „Deploy from a branch" → Branch `main` / `/root`.**
Danach ist sie unter `https://<user>.github.io/al-miftah-/` erreichbar.
