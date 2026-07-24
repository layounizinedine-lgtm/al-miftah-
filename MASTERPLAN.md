# المفتاح Al-Miftāḥ — Masterplan zur perfekten Lern-App

> **Zweck dieses Dokuments:** Vollständige Profi-Analyse des Ist-Zustands (Bugs, Schwächen, Lücken, Ballast) und ein präziser, phasenweiser Ausbauplan. Jedes Arbeitspaket ist so spezifiziert, dass ein ausführendes KI-Modell (Opus, Sonnet …) es ohne Rückfragen und ohne Interpretationsspielraum umsetzen kann.
>
> **Stand der Analyse:** Commit `5145101` auf `main` (nach Merge von PR #1). Die App besteht aus `index.html` (~2.530 Zeilen, alles inline) und `vokabeln.js` (228 Vokabeln in 5 Themen).

---

## Fortschritt (pro AP pflegen)

| AP | Status | Commit / Notiz |
|---|---|---|
| **0.1 — Bugfixes** | ☑ erledigt | B1b, B2, B3, B4, B5, B6, B8 gefixt & im Browser verifiziert. **B9 bewusst nach AP 3.1 verschoben** (braucht Supabase-Zugang / eigene `exam_data`-Spalte; ohne DB-Zugang kein sinnvoller Fix — Plan sah das bereits als „langfristig AP 3.1" vor). B1a (Daten-Duplikate physisch entfernen) + B7 (SM-2-Altlasten streichen) laufen planmäßig in **AP 0.2**; der Code-seitige Dedupe-Schutz (B1b) verhindert die Doppel-Optionen bereits jetzt. |
| **0.2 — Datenbereinigung** | ☑ erledigt | `vokabeln.js` neu generiert (Skript: `scratchpad/build-vokabeln.js`): 9 Duplikate entfernt (228→**219 Wörter**), alle SM-2-Altlastfelder + `harakat`/`oppHarakat`/`pluralHarakat` gestrichen. Wörter in **10 benannte Themen** umsortiert (je `id, name, nameAr, icon, lektionen`); jedes Thema in Lektionen à **7–9 Wörter** portioniert (verifiziert). `renderThemen`/`openThema` nutzen die neuen Felder. Themen: Begrüßung 14 · Familie 30 · Schule 22 · Haus 18 · Möbel 27 · Wohnungssuche 14 · Stadt 31 · Arbeit 14 · Zeit 21 · Eigenschaften 28. |
| **0.3 — Modularisierung** | ☑ erledigt | `index.html` von 2552 → **383 Zeilen** (<800 ✓). Inline-CSS → `css/app.css`; Inline-JS (verlustfrei, 169/169 Definitionen erhalten) in Module aufgeteilt: `js/core.js` (esc, Speicher, go, speak, shuffle), `data-letters/-harakat/-woerter/-dialoge.js`, `srs.js`, `exercises.js`, `writing.js`, `auth-sync.js`, `main.js` (Init in DOMContentLoaded). Alle via `<script defer>` in Abhängigkeitsreihenfolge; kein Bundler/Framework. Reproduzierbar via `scratchpad/split.js`. Verifiziert: alle Views, alle 8 Übungstypen, Prüfung, Dialog, Schreiben, CSS — identisch, keine JS-Fehler. Abweichung vom Plan-Detail: `shuffle` in core (wie geplant); Übungs-Pools `HA_BASES`/`HOER_GRUPPEN` blieben bei der Übungslogik in `exercises.js` statt in `data-*` (funktional identisch). |
| **0.4 — Test/Deploy-Fundament** | ☑ erledigt (Pages: Betreiber) | `npm run verify` = `check-syntax.js` (node --check aller Module + Prüfung, dass index.html keinen Inline-Code hat) + Playwright-Smoke (`tests/smoke.spec.js`, 5 Tests: Module/Init, alle Views, komplette Buchstaben-Übung, Stufe-2-Übungen, Schreib-Präzision). GitHub Action `.github/workflows/ci.yml` läuft beides bei jedem Push. `docs/VERIFY.md` + README ergänzt. **Offen für Betreiber:** GitHub Pages aktivieren (Settings → Pages → Branch `main`). |
| **0.5 — RTL/A11y** | ☑ erledigt | Sichtbarer `:focus-visible`-Fokus; Antwort-Optionen per Zahltasten 1–9 bedienbar (Übung komplett ohne Maus); `aria-live="polite"`/`role="status"` auf allen Feedback-Feldern; zentrale `markArabic()`-Funktion + MutationObserver zeichnen arabische Inhalte automatisch mit `lang="ar" dir="rtl"` aus (Regex-Guard: lateinische Umschrift bleibt unmarkiert). Neuer Smoke-Test deckt A11y ab (6 Tests grün). |

**→ Phase 0 abgeschlossen.**

| **1.1 — Lektionsstruktur Stufe 1** | ☑ erledigt | `js/data-curriculum.js`: `STUFE1_LEKTIONEN`, 12 Lektionen (L1–L7 Buchstaben in pädagogischer Reihenfolge = alle 28 Buchstaben; L8 kurze Vokale+Sukun; L9 lange Vokale/Madd; L10 Schadda+alle 3 Tanwin; **L11 Sonderzeichen und L12 Sonnen-/Mondbuchstaben bewusst mit `contentPending:true` markiert** — Struktur/Gating-Platz ist da, Inhalt folgt in AP 1.3, damit die Kette nicht unehrlich wirkt). `js/lektionen.js`: Gating (`lektionStatus`), Fortschritt in `localStorage` (`almiftah_lektionen`, Struktur exakt wie geplant: `{passed,best,versuche,letzterVersuch}`), Lektionspfad-UI (wiederverwendet `.path/.stop/.medallion`), Lektions-Detail-Ansicht (neue `view-lektion`), funktionierender Lektions-Check (10 Fragen, 9/10-Grenze, für Buchstaben-Lektionen mit ~30 % kumulativer Wiederholung bereits bestandener Lektionen). Bestehende „alle Buchstaben"-Ansicht als **neue `view-bibliothek`** erhalten (freies Üben/Nachschlagen, unverändert funktional). `exercises.js` um einen `'lektion'`-Modus-Hook in `renderExamDone` erweitert (1 Zeile Delegation). **Bewusst NICHT in AP 1.1 enthalten, folgt in AP 1.2:** Cooldown nach Fehlversuch, SRS-Box-Demotion gescheiterter Items, Pool-Größe ≥40 (aktuell wird pro Aufruf frisch generiert, was ähnlich wirkt, aber ohne persistenten Pool). Verifiziert: neuer Nutzer sieht nur L1 offen (Playwright-Test), Bestehen von L1 (10/10) schaltet L2 sofort frei, Zustand übersteht Reload, L8–L10 liefern 100 % valide Fragen (500 generierte Stichproben), Bibliothek + Buchstaben-Detail-Overlay aus Lektion heraus funktionieren unverändert. Smoke-Suite: 8/8 Tests grün. |

| **1.2 — Mastery-Check härten** | ☑ erledigt | **Fragenpool ≥40** pro Lektion: Buchstaben-Lektionen kombinieren Erkennen/Hören/**neuer Formen-Typ** (zufällige Anfangs-/Mittel-/Endform über `forms()`, testet cursive Formerkennung statt nur der isolierten Grundform) mit Pflicht-Abdeckung jedes Lektionsbuchstabens; Pool-Größen 63–105 (kleinste Lektion L2). Harakat-Lektionen (L8–L10) mit Pool 45–66 plus **kumulativer Cross-Review-Kette** (L9 wiederholt L8-kurz, L10 wiederholt L8+L9). **Cooldown:** 10 Minuten nach Fehlversuch, Zeitstempel in `localStorage` (übersteht Reload, per Test verifiziert), Check-Button zeigt Live-Countdown-Text und ist deaktiviert; `startLektionCheck()` blockt zusätzlich serverseitig-analog auch bei direktem Aufruf. **Schwache-Punkte-Anzeige:** falsch beantwortete Items werden gesammelt, dedupliziert und als Chips auf dem Ergebnis- und dem Lektions-Screen gezeigt (Buchstaben-Chips öffnen das Detail-Overlay). **SRS-Anbindung:** alle Buchstaben-Lektionsfragen tragen `srsKey`, wodurch die bestehende `examAnswer()`-Bewertung gescheiterte Buchstaben automatisch auf SRS-Box 1 zurückstuft (verifiziert: Box 3→1 nach Fehlversuch). **„✓ Gelernt"-Selbstauskunft entfernt** (Button + `markLetterDone` gestrichen); die freie Bibliotheks-Übung markiert nicht mehr automatisch — das ✦-Sternchen kommt jetzt ausschließlich von einer bestandenen Buchstaben-Lektion. Bewusst nicht in AP 1.2: SRS-Anbindung für Harakat-Items (bleibt bekannte Lücke S8, eigenes Thema). Smoke-Suite: 11/11 Tests grün (3 neu für dieses AP). |

| **1.3 — Inhalte L11 (Sonderzeichen) + L12 (Sonnen-/Mondbuchstaben)** | ☑ erledigt | **`js/data-sonderzeichen.js`:** alle 10 Sonderzeichen aus dem Plan — Hamza auf allen 5 Trägern (أ إ ؤ ئ ء), Tāʾ marbūṭa (ة), Alif maqṣūra (ى), Alif madda (آ), Lām-Alif-Ligatur (لا), Alif waṣla (ٱ) — je mit Detailkarte (Erklärung + Eselsbrücke) und 2 echten Beispielwörtern mit gezielten Distraktoren (20 Wörter gesamt, viele verknüpft mit bereits gelerntem Wortschatz, z. B. سُؤَالٌ, شَيْءٌ, سَيَّارَةٌ). **`js/data-sonnenmond.js`:** die 28 Buchstaben exakt in 14 Sonnen- + 14 Mondbuchstaben partitioniert (verifiziert: keine Lücke, keine Überlappung), 28 Beispielwörter (14+14) mit Transliteration, viele an Stufe-2-Vokabular angelehnt (القَمَر, البَيْت, الكِتَاب …) — Distraktoren testen exakt die al-/assimilierte Verwechslung wie im Plan gefordert (asch-schams vs. al-schams). Beide Lektionen: `contentPending` entfernt, echtes Gating (L11 nach L10, L12 nach L11), Detail-Rendering (Zeichenkarten bzw. Regelkarte + Wortlisten), Fragenpools ≥ 40 (70 bzw. 168), Lektions-Check funktioniert über dieselbe Mastery-Engine wie L1–L10 (9/10-Grenze, Cooldown, Schwache-Punkte). `AP 1.6` (Stufenprüfung 2.0) muss diese Inhalte noch in den Prüfungspool aufnehmen — bewusst nicht Teil von AP 1.3. Verifiziert: 1000 generierte Fragen ohne Fehler, kompletter Durchlauf L1→L12 im Test, Detailkarten zeigen alle 10 bzw. 28 Einträge. Smoke-Suite: 12/12 Tests grün (1 neu, 2 an die jetzt echten L11/L12 angepasst). |

**Stufe 1 ist damit inhaltlich vollständig** — alle 12 Lektionen haben echten Inhalt, jedes arabische Schriftphänomen aus der Ist-Analyse (L1) ist abgedeckt.

Nächster Schritt: **AP 1.4/1.5** (Schreibtrainer 2.0 mit Strichfolge, Silbentraining) und/oder **AP 1.6** (Stufenprüfung 2.0 — muss jetzt auch Sonderzeichen/Sonnen-Mond abfragen und cheat-sicher werden, Voraussetzung: alle 12 Lektionen bestanden).

*Ab Phase 1 pro AP eine Zeile ergänzen. Format: ☐ offen / ⧗ in Arbeit / ☑ erledigt + Commit-Hash.*

---

## Teil 1 — Ist-Analyse (Engineering-Review)

### 1.1 Architektur-Überblick

| Komponente | Zustand |
|---|---|
| Frontend | Eine einzige `index.html`: CSS, HTML und ~1.800 Zeilen JS inline. Kein Build, keine Module, keine Tests. |
| Daten | `vokabeln.js` (260 KB, synchron geladen, blockiert Rendering). Buchstaben/Harakat/Wörter/Dialoge hart in `index.html`. |
| Persistenz | `localStorage` (SRS, Prüfungen, gelernte Buchstaben, Dialoge) + optionaler Supabase-Sync (Tabelle `almiftah_progress`). |
| Audio | Browser-Sprachsynthese (`speechSynthesis`, `ar-SA`) — Qualität geräteabhängig, keine eigenen Aufnahmen. |
| Auth | Supabase E-Mail/Passwort. Anon-Key im Client (normal), aber RLS-Policies sind nirgends dokumentiert/versioniert. |
| Lernlogik | Leitner-SRS (5 Boxen) für Buchstaben + Vokabeln. Prüfung (20 Fragen, 80 %) schaltet Stufe 2 frei. Stufen 3+4 existieren nur als Platzhalter. |

**Gesamturteil:** Solides, liebevoll gestaltetes MVP. Für „jeder Schüler kommt zu 100 % durch" fehlen: vollständiger Buchstaben-Lehrplan (Sonderzeichen!), Mastery-Struktur statt Einmal-Prüfung, aktive Produktion (Schreiben/Sprechen/Bauen von Sätzen), Cheat-Resistenz, Backend-Validierung und jegliche KI-Betreuung.

### 1.2 Bugs (verifiziert, priorisiert)

| # | Schwere | Bug | Fundort | Fix |
|---|---|---|---|---|
| B1 | **Hoch** | **9 Duplikate in `vokabeln.js`** (u. a. أُخْتٌ, بِنْتٌ, زَوْجَةٌ, وَلَدٌ, ثَلَّاجَةٌ doppelt; 8 doppelte deutsche Übersetzungen wie „Schwester", „Kühlschrank", „leer", „laut"). Folge: Ein Quiz kann zwei identische Antwortoptionen anzeigen — beide sehen richtig aus, aber nur eine zählt, weil `examAnswer()` per `textContent`-Vergleich arbeitet. Schüler verliert unverschuldet Punkte. | `vokabeln.js`; `vokFrageArDe()`/`vokFrageDeAr()` in `index.html` | (a) Duplikate aus Datei entfernen, (b) Distraktoren-Auswahl zusätzlich nach Übersetzungs-String deduplizieren: Filter `x.translations.de !== v.translations.de` und `x.arabic !== v.arabic`. |
| B2 | **Hoch** | **Schreibtrainer ist cheatbar:** `updateCoverage()` misst nur, wie viel der Buchstaben-Maske übermalt ist. Wer die ganze Fläche vollkritzelt, bekommt 100 % und „Schön nachgezeichnet ✦". Keine Strafe für Malen außerhalb, keine Strichrichtung. | `updateCoverage()` in `index.html` | Präzisions-Score einführen: `score = getroffen/maske − λ·(daneben/gesamt)`, λ ≈ 1. Feedback erst ab z. B. ≥ 60 % Treffer UND ≤ 25 % daneben. (Vollständiger Stroke-Order-Trainer: siehe AP 1.4.) |
| B3 | Mittel | **Zurück-Button der Übungsansicht führt immer zu „Buchstaben"**, auch wenn man aus Stufe 2 (Vokabel-/Dialog-Quiz) kommt. Schüler landet im falschen Kontext. | `view-exercise` Topbar in `index.html` | Rücksprungziel dynamisch setzen: globale Variable `exerciseReturnView`, von jeder `start…()`-Funktion gesetzt; Button ruft `go(exerciseReturnView)`. |
| B4 | Mittel | **Prüfung/Übungen vergleichen Antworten über `btn.textContent`.** Bei jemals identischen Optionstexten (siehe B1) oder späteren HTML-Änderungen bricht die Logik. | `examAnswer()`, `woAnswer()`, `hoAnswer()`, `haAnswer()` | Index-basiert vergleichen: Option-Index als `data-idx` ans Button-Element, Vergleich gegen Index der richtigen Antwort. |
| B5 | Mittel | **Unescapte Interpolation in `onclick`-Strings** (`speak('...')` mit Datenwerten, `openLetter('X')` etc.). Aktuell statische Daten, aber sobald Inhalte aus DB/KI kommen, ist das eine XSS-Tür — an einer Stelle wird bereits notdürftig `replace(/'/g,'')` geflickt (`openVokabel`). | diverse `onclick`-Generatoren | Alle Inline-`onclick` mit Datenparametern durch `addEventListener` + Daten-Attribute oder Index-Lookup ersetzen. `esc()` bleibt für Textknoten. |
| B6 | Niedrig | **Totes Code-Gewicht:** `exMode==='srs'`-Zweige (nie gesetzt, `startDaily` nutzt die Exam-Engine), `dailyCount()` (nie aufgerufen), Kommentar „Supabase-Sync-Haken (kommt als Nächstes)" (längst da). | `index.html` | Entfernen. |
| B7 | Niedrig | **228/228 Vokabeln tragen ungenutzte SM-2-Altlasten** (`status`, `interval`, `easeFactor`, `repetitions`, `failCount`, `nextReview`) — die App nutzt Leitner mit eigenem Store. ~15–20 % der 260 KB sind toter Ballast. | `vokabeln.js` | Felder beim Datenbereinigen (AP 0.2) streichen. |
| B8 | Niedrig | **iOS-Audio:** Hör-Fragen spielen beim Rendern automatisch (`speak(q.audio)`), was iOS ohne User-Geste teils blockiert → erste Frage stumm. | `renderHoQuestion()`, `renderExamQuestion()` | Autoplay nur nach vorheriger Nutzer-Interaktion; sonst Play-Button pulsieren lassen („Tippe zum Anhören"). |
| B9 | Niedrig | **Cloud-Merge kann lokalen Fortschritt „überholen", aber nie zurücksetzen** — gewollt, aber: `_exams` wird in `srs_data` hineingemischt (Schema-Vermischung), und es gibt keine Versionierung/Konfliktbehandlung bei zwei parallel aktiven Geräten. | `mergeCloudIntoLocal()`, `pushProgress()` | Eigene Spalte `exam_data jsonb`; `updated_at`-Vergleich; langfristig AP 3.1 (Server-Wahrheit). |

### 1.3 Schwächen (funktioniert, aber unter Niveau)

| # | Schwäche | Warum es schadet |
|---|---|---|
| S1 | **TTS statt echter Audio-Aufnahmen.** Einzelbuchstaben werden von TTS oft falsch/als Buchstabenname/gar nicht gesprochen; Qualität variiert je Gerät massiv. Für eine Ausspracheschule ist das das schwächste Glied. | Hören ist in Stufe 1 der halbe Lernerfolg. |
| S2 | **Buchstabenname vs. Laut wird nicht getrennt gelehrt.** Die App fragt „Welcher Buchstabe ist das?" → Name (Bāʾ), aber nie isoliert den Laut (b). | Klassische Anfängerverwirrung. |
| S3 | **Keine Lektionsstruktur.** Stufe 1 ist eine Buchstaben-Wand mit 28 Karten + 4 globalen Übungen. Kein „Lektion 1: ا ب ت ث → lernen → üben → bestehen → Lektion 2". Schüler ohne Selbstdisziplin verirren sich. | Struktur = Durchkommen. Kernwunsch! |
| S4 | **„✓ Gelernt" ist ein Selbstauskunfts-Button** — Fortschritt ohne Nachweis. | Lädt zum Selbstbetrug ein; Fortschrittsanzeige lügt. |
| S5 | **Nur passives Erkennen (Multiple Choice) — keinerlei Produktion.** Nirgends tippt/baut/spricht der Schüler selbst Arabisch. | Wiedererkennen ≠ Können. MC allein ist zu 25 % ratbar. |
| S6 | **Themen heißen „Thema 1–5"** und sind inhaltlich unsortiert (52–73 Wörter pro Block). | Kein mentales Modell, keine Lernportionen. |
| S7 | **Prüfung ist clientseitig und wiederholbar im Sekundentakt.** 4 Optionen ⇒ Ratebasis 25 %; wer oft genug neu startet, besteht irgendwann. `localStorage.setItem('almiftah_exams', …)` schaltet Stufe 2 sogar per Konsole frei. | Direkt gegen die Anforderung „nicht durchcheaten". |
| S8 | **SRS deckt nur Buchstaben + Vokabeln ab** — Harakat, Lese-Wörter, Dialogsätze fließen nicht in die Tages-Session ein. | Genau die schweren Dinge werden nicht wiederholt. |
| S9 | **Keine Streaks, kein XP, keine sichtbaren Etappenerfolge** außer ✦-Sternchen. | „Schnell Erfolge sehen" braucht sichtbare Belohnungsschleifen. |
| S10 | **Monolith ohne Tests/CI.** Jede Änderung riskiert Regressionen; genau das Gegenteil von „andere Modelle können fehlerfrei weitermachen". | Fundament zuerst. |
| S11 | **A11y/RTL-Hygiene:** kein `lang="ar"`/`dir="rtl"` an arabischen Textknoten (Screenreader raten), Buttons ohne Fokus-Stile über die Browser-Defaults hinaus. | Barrierefreiheit + korrekte Sprachausgabe. |
| S12 | **`vokabeln.js` blockiert das Rendering** (synchrones `<script src>` im `<head>`). | Spürbar auf Mobilfunk. `defer` + Init nach `DOMContentLoaded`. |

### 1.4 Inhaltliche Lücken (fachlich, Arabisch)

| # | Lücke | Konsequenz |
|---|---|---|
| L1 | **Sonderzeichen fehlen komplett:** Hamza (ء أ إ ؤ ئ), Tāʾ marbūṭa (ة), Alif maqṣūra (ى), Madda (آ), Lām-Alif-Ligatur (لا), Alif waṣla (ٱ). | Ohne diese kann niemand „nach Stufe 1 alles lesen". **Größte fachliche Lücke.** |
| L2 | Sonnen- und Mondbuchstaben (Assimilation von الـ) werden nirgends gelehrt — obwohl die Dialoge sie ständig benutzen (اَلسَّلَامُ, اَلطَّاوِلَةِ). | Schüler liest „al-salām" statt „as-salām". |
| L3 | Silben-/Lesefluss-Training fehlt: vom Einzelzeichen springt die App direkt zu ganzen Wörtern. | Zwischenstufe (بَ + يْ + تٌ → baytun) ist das eigentliche Lesenlernen. |
| L4 | Stufe 3 (Grammatik & Verben) und Stufe 4 (Texte & Übersetzung) sind leere Platzhalter. | Versprochene Reise endet nach Stufe 2. |
| L5 | Keine Zahlen (٠–٩), keine Uhrzeit/Datum, keine Höflichkeitsformeln als eigenes Modul. | Alltagsgrundlagen. |
| L6 | Dialoge: nur 5 Stück à 6 Zeilen, keine Verzweigung, kein Rollentausch, kein Hörverstehen ohne Text. | Nutzerwunsch: **länger und mehr**. |

### 1.5 Unnötiges / zu Entfernendes

1. `exMode`/`startExercise`-SRS-Zweige, `dailyCount()` (tot — B6).
2. SM-2-Felder in allen 228 Vokabeln (B7).
3. Doppelte Vokabeleinträge (B1).
4. Der auskommentierte Sync-Kommentar in `saveSRS()`.
5. `harakat`-Feld dupliziert `arabic` in jeder Vokabel (identischer Wert) — ein Feld reicht.

---

## Teil 2 — Zielbild: die Lernerfahrung

**Leitidee: „Der private Meisterlehrer".** Die App führt wie ein exzellenter Privatlehrer: kleine Lektionen, sofortiges Feedback, ehrliche Meisterschafts-Nachweise, tägliche Wiederholung, persönliche Korrektur der Hausaufgaben durch KI — und sichtbare Erfolge ab Tag 1.

**Die fünf Säulen (gelten für jede Stufe):**

1. **Lektionen statt Wände.** Jede Stufe = Kette kleiner Lektionen (5–10 Min). Eine Lektion = Einführen → geführtes Üben → freies Üben → **Mastery-Check**. Erst der bestandene Check (nicht ein Klick) öffnet die nächste Lektion.
2. **Mastery statt Einmal-Prüfung.** Fortschritt entsteht nur durch nachgewiesenes Können: große Fragenpools, gemischte Aufgabentypen (Erkennen + Produzieren), SRS-Pflichtwiederholungen. Die Stufenprüfung bleibt als Abschluss-Ritual, ist aber cheatresistent (Teil 3, AP 1.6/3.1).
3. **Produktion ab der ersten Woche.** Schreiben (Stroke-Order), Sätze bauen (Wort-Kacheln ordnen), tippen (arabische Bildschirmtastatur), sprechen (später: Aufnahme + KI-Feedback).
4. **Der tägliche Rhythmus.** Eine „Heute lernen"-Session bündelt: fällige SRS-Karten + neue Lektion + 1 Mini-Hausaufgabe (ab Stufe 2). Streak-Zähler, Wochenziel, XP.
5. **KI als Lehrer, nicht als Gimmick.** Hausaufgaben-Korrektur mit Fehlererklärung, Tutor-Chat mit Stufen-Kontext, adaptive Schwierigkeitssteuerung. Alles serverseitig (API-Key nie im Client).

---

## Teil 3 — Roadmap: Phasen & Arbeitspakete

> **Regeln für das ausführende Modell:** Jedes Arbeitspaket (AP) einzeln umsetzen, verifizieren (Abnahmekriterien!), committen. Reihenfolge einhalten — spätere APs setzen frühere voraus. Nach jedem AP: Syntax-Check des Inline-Skripts (`node --check` auf extrahiertem `<script>`) + Headless-Chromium-Smoke-Test (Seite laden, `pageerror`-Listener, Kern-Flows durchklicken) wie in `docs/VERIFY.md` (entsteht in AP 0.4).

### Phase 0 — Fundament & Aufräumen *(Voraussetzung für alles; ~1 Session)*

**AP 0.1 — Bugfixes B1–B9.**
Exakt wie in Tabelle 1.2 beschrieben. Ein Commit pro Bug.
*Abnahme:* Playwright-Test belegt: (a) kein Quiz zeigt je zwei identische Optionen (500 generierte Fragen prüfen), (b) Vollkritzeln des Canvas ergibt < 60 % Score, (c) Zurück-Button aus Vokabel-Quiz führt zu `view-thema`.

**AP 0.2 — Datenbereinigung `vokabeln.js`.**
Duplikate entfernen (B1), Altlast-Felder streichen (B7), `harakat`/`oppHarakat`/`pluralHarakat`-Duplikatfelder entfernen. Danach: Themen kuratieren — die 228 (nach Dedupe ~219) Wörter in **8–10 benannte Themenfelder** à 15–30 Wörter umsortieren: `Begrüßung & Höflichkeit`, `Familie & Menschen`, `Schule & Lernen`, `Haus & Wohnen`, `Essen & Trinken`, `Stadt & Wege`, `Arbeit & Berufe`, `Körper & Gesundheit`, `Zeit & Zahlen`, `Eigenschaften (Adjektive)`. Jedes Thema erhält `id`, `name`, `nameAr`, `icon` (arab. Schlüsselwort), `lektionen`: Unterteilung in Lernportionen à 7–9 Wörter.
*Abnahme:* Ladbar ohne Fehler; keine Duplikate (Skriptprüfung); jede Lektion 7–9 Wörter; Gesamtwortzahl dokumentiert.

**AP 0.3 — Modularisierung ohne Build-Tool.**
`index.html` aufteilen in: `css/app.css`, `js/data-letters.js`, `js/data-harakat.js`, `js/data-woerter.js`, `js/data-dialoge.js`, `js/core.js` (esc, go, speak, shuffle, Storage), `js/srs.js`, `js/exercises.js`, `js/writing.js`, `js/auth-sync.js`, `js/main.js` (Init). Alle mit `defer` laden, Init in `DOMContentLoaded`. **Kein** Bundler/Framework einführen — GitHub-Pages-tauglich bleiben.
*Abnahme:* App verhält sich identisch (Smoke-Test vorher/nachher), `index.html` < 800 Zeilen.

**AP 0.4 — Test- & Deploy-Fundament.**
(1) `docs/VERIFY.md`: dokumentierter Smoke-Test (Playwright-Skript einchecken unter `tests/smoke.spec.js`: alle Views öffnen, je Übungstyp eine Runde spielen, localStorage-Reset-Fall). (2) GitHub Action: bei jedem Push `node --check` aller JS-Dateien + Playwright-Smoke. (3) GitHub Pages auf `main` aktivieren (Settings → Pages), URL in README.
*Abnahme:* Action grün auf main; Pages-URL erreichbar.

**AP 0.5 — RTL/A11y-Hygiene.**
Alle arabischen Textcontainer erhalten `lang="ar" dir="rtl"`; sichtbarer `:focus-visible`-Stil; Antwort-Buttons per Tastatur bedienbar (1–4 als Shortcuts); `aria-live="polite"` auf Feedback-Elementen.
*Abnahme:* Tastatur-Durchlauf einer kompletten Übung ohne Maus möglich.

### Phase 1 — Stufe 1 maximal: „Lesen zu 100 %" *(~2–3 Sessions)*

**AP 1.1 — Lehrplan-Struktur (Lektionen).**
Stufe 1 wird in **12 Lektionen** gegliedert, jede mit festem Ablauf *Kennenlernen → Üben → Mastery-Check*:
L1 ا ب ت ث · L2 ج ح خ · L3 د ذ ر ز · L4 س ش ص ض · L5 ط ظ ع غ · L6 ف ق ك ل · L7 م ن ه و ي · L8 kurze Vokale + Sukun · L9 lange Vokale + Silbenlesen · L10 Schadda + Tanwin (alle 3) · L11 **Sonderzeichen** (L1-Lücke: Hamza-Träger, ة, ى, آ, لا, ٱ) · L12 Sonnen-/Mondbuchstaben + Lesefluss.
Datenmodell: `js/data-curriculum.js` mit `STUFE1_LEKTIONEN = [{id, titel, titelAr, inhalte:[…], checkConfig:{…}}]`. Fortschritt: `almiftah_lektionen` (localStorage, Struktur `{lektionId:{passed:bool, best:int, versuche:int, letzterVersuch:ts}}`), synchronisiert wie SRS.
UI: Der Buchstaben-View zeigt die Lektionskette (vertikaler Pfad im vorhandenen Medaillon-Stil); nur die nächste offene Lektion ist klickbar, abgeschlossene zeigen ✦. Die bestehende „alle Buchstaben"-Ansicht bleibt als Nachschlagewerk („Bibliothek") erreichbar.
*Abnahme:* Neue Nutzer sehen L1 offen, L2+ gesperrt; Bestehen von L1-Check öffnet L2; Reload erhält Zustand.

**AP 1.2 — Mastery-Check pro Lektion (Anti-Cheat Basis).**
Jeder Check: 10 Fragen aus einem Pool ≥ 40 (generiert aus Lektionsinhalt + kumulativ 30 % Altstoff), Mischung: Erkennen (Glyph→Name), Hören (Audio→Glyph), Formen (Anfangs-/Mittel-/Endform zuordnen), ab L8 zusätzlich Vokal-Lesen. Bestehensgrenze 9/10. **Cooldown:** nach Nichtbestehen 10 Minuten Sperre mit gezielter Übungsempfehlung („Diese 3 Buchstaben haben dich gestolpert — übe sie"). Fehlgeschlagene Items landen automatisch in SRS-Box 1.
„✓ Gelernt"-Selbstauskunfts-Button (S4) wird entfernt; `done`-Sternchen vergibt ausschließlich der Check.
*Abnahme:* 9/10-Grenze greift; Cooldown übersteht Reload (Zeitstempel in localStorage); gescheiterte Items nachweislich in SRS-Box 1.

**AP 1.3 — Sonderzeichen-Inhalte (L11) + Sonnen-/Mondbuchstaben (L12).**
Neue Datensätze im Stil von `LETTER_GROUPS`/`HARAKAT`: Hamza auf Trägern (أ إ ؤ ئ ء) mit je 2 Beispielwörtern, ة (inkl. „t bei Verbindung"-Regel), ى, آ, لا, ٱ. L12: Regelkarte + Übung „Wie liest man اَل + X?" mit 14 Sonnen-/14 Mondbuchstaben-Wörtern (اَلشَّمْس → asch-schams …). Alle neuen Wörter erhalten `falsch`-Distraktoren, die exakt die Regel testen (al-schams vs. asch-schams).
*Abnahme:* Jedes neue Zeichen hat Detailkarte + kommt in L11/L12-Checks vor; Prüfungspool (AP 1.6) enthält sie.

**AP 1.4 — Schreibtrainer 2.0 (Stroke-Order).**
Ersetzt die reine Coverage-Messung: Pro Buchstabe eine geordnete Punktfolge je Strich (`STROKES['ب'] = [[{x,y},…],…]`, Koordinaten im 320×320-Raster; für alle 28 Buchstaben + ة, ء, لا erfassen — Fleißarbeit, als eigene Datendatei `js/data-strokes.js`). Trainer-Modi: (1) *Vormachen* — animierter Stift zeichnet den Strich; (2) *Nachfahren* — Schüler folgt, Toleranzschlauch 24 px, Fortschritt nur entlang der Sollrichtung, Verlassen bricht den Strich ab; (3) *Frei* — ohne Vorlage, Bewertung gegen Punktfolge (Ø-Abstand + Richtungstreue). Anti-Schmier aus AP 0.1/B2 bleibt als zweite Verteidigungslinie.
*Abnahme:* Rückwärts-Nachfahren zählt nicht; Kritzeln erzeugt < 30 % Score; jeder Buchstabe der 12 Lektionen im Trainer aufrufbar; L-Checks ab L2 enthalten 1 Schreibaufgabe (bestanden ab 70 %).
*Hinweis an das ausführende Modell:* Die Strichdaten sind der aufwendigste Teil. Vorgehen: Buchstabe in Canvas rendern, Skelett-Punkte halbautomatisch entlang der Maske legen (Hilfsskript beilegen), dann manuell ordnen. Qualität stichprobenartig visuell prüfen (Screenshot je Buchstabe mit eingezeichneter Punktfolge).

**AP 1.5 — Silben- & Lesefluss-Training (L9/L12).**
Neuer Übungstyp „Silben bauen": Anzeige بَ + يْ + تٌ als Kacheln, TTS spricht Zielwort, Schüler ordnet Silben per Tipp-Reihenfolge. Zweiter Typ „Schnell-Lesen": Wort erscheint, 4 Transliterationen, Zeitbonus (3 s = 2 XP, danach 1 XP) — Tempo motiviert, entscheidet aber nicht über Bestehen. Wortpool: die vorhandenen `WOERTER_GRUPPEN` + 30 neue Wörter (zweisilbig → dreisilbig).
*Abnahme:* Beide Typen in L9/L12 und in der Tages-Session; Silben-Reihenfolge wird validiert.

**AP 1.6 — Stufenprüfung 2.0.**
30 Fragen (statt 20): 6 Erkennen · 4 Hören · 5 Vokale/Tanwin · 5 Lesen · 4 Sonderzeichen · 3 Sonne/Mond · 3 Schreiben. Bestehen: 85 %. Zulassung erst, wenn alle 12 Lektionen bestanden sind („Kann ich schon"-Skip bleibt, führt aber durch **dieselbe** Prüfung mit Zulassungs-Ausnahme). Cooldown 30 Min nach Fehlversuch, Fragen je Versuch frisch aus Pools gezogen (Pools ≥ 5× Fragenzahl). Ergebnis wird zusätzlich serverseitig gespeichert (Vorgriff auf AP 3.1: bis dahin localStorage, aber Datenstruktur schon `{passed, best, versuche, history:[{ts, score}]}`).
*Abnahme:* Ohne 12/12 Lektionen keine Prüfung (außer Skip-Weg); zwei aufeinanderfolgende Versuche teilen < 50 % identische Fragen.

### Phase 2 — Stufe 2 maximal: „Verstehen & Sprechen" *(~2–3 Sessions)*

**AP 2.1 — Lektionsstruktur für Stufe 2.**
Analog AP 1.1: Jedes Themenfeld (aus AP 0.2) = Kapitel; Kapitel = 2–4 Lektionen à 7–9 Vokabeln + 1 zugehöriger Dialog + Mastery-Check (12 Fragen, 10 richtig, Cooldown). Reihenfolge der Kapitel folgt den Dialogen (Begrüßung zuerst).
*Abnahme:* Pfadansicht mit Kapiteln/Lektionen; Gating funktioniert; SRS übernimmt alle Lektionswörter nach Erst-Kontakt.

**AP 2.2 — Dialoge 2.0: länger, mehr, gestuft.** *(expliziter Nutzerwunsch)*
Bestehende 5 Dialoge auf **10–14 Zeilen** erweitern (gleiche Szene weiterführen, nur bereits gelernten Wortschatz + max. 2 neue Wörter pro Dialog, neue Wörter werden vorab als „Schlüsselwörter" gezeigt). **7 neue Dialoge** (insgesamt 12): Im Restaurant · Auf dem Markt (Zahlen!) · Beim Arzt · Die Uhrzeit · Am Telefon · Der Weg zur Moschee · Beim Nachbarn. Jeder Dialog erhält drei Modi: *Lesen* (wie jetzt), *Hören* (Text verdeckt, Zeile für Zeile aufdecken), *Rollenspiel* (App spricht Person 1, Schülerzeile wird als 3 Wort-Kacheln zum Ordnen angezeigt, danach Aufdecken + Anhören). Quiz je Dialog: 5 Fragen (statt 3), davon 2 Produktionsfragen (Satz aus Kacheln bauen).
*Abnahme:* 12 Dialoge à 10–14 Zeilen; jede Zeile hat `ar`, `tr`, `de`; Hören-Modus blendet Text erst nach Interaktion ein; Rollenspiel validiert Kachel-Reihenfolge; alle neuen Wörter existieren in `vokabeln.js` (Skript-Check: jedes Dialogwort ∈ Vokabular ∪ erlaubte Funktionswörter-Liste).

**AP 2.3 — Satzbau-Übung („Kachel-Sätze") als eigener Übungstyp.**
Generisch: `{de:'Ich habe eine Frage.', kacheln:['عِنْدِي','سُؤَالٌ'], distraktoren:['كِتَابٌ']}` — Schüler baut den Satz, 1 Distraktor-Kachel pro Satz. 60 Sätze aus den Beispielsätzen der Vokabeln generieren (die `exampleArabic`-Felder sind da!). Fließt in Lektions-Checks + Tages-Session ein.
*Abnahme:* Reihenfolge-Validierung; Distraktor darf nie Teil der Lösung sein (Skript-Check).

**AP 2.4 — Arabische Bildschirmtastatur + Tipp-Übungen.**
Einfache On-Screen-Tastatur (Komponente `js/keyboard.js`, Layout: Buchstaben + Harakat-Leiste, keine OS-Abhängigkeit). Übungstyp „Schreib das Wort": deutsches Wort + Audio → Schüler tippt arabisch. Toleranz: Harakat optional (Vergleich auf entharakatisierter Ebene, Bonus-XP für korrekte Harakat).
*Abnahme:* Wort ohne Harakat gilt als richtig, mit falschen Buchstaben als falsch; Tastatur mobil bedienbar (Touch-Ziele ≥ 44 px).

**AP 2.5 — Tages-Session 2.0.**
`buildDailySession()` erweitert: fällige SRS + neue Lektion anteasern + 2 Kachel-Sätze + 1 Dialog-Wiederholungszeile. Session-Ende-Screen mit XP, Streak, „Morgen wartet: …".
*Abnahme:* Session enthält bei vorhandenem Material alle 4 Quellen; Streak zählt kalendertäglich (lokale Zeitzone), bricht nach 48 h.

### Phase 3 — Backend & KI: Hausaufgaben, Tutor, echte Cheat-Sicherheit *(~2–3 Sessions; erfordert Supabase-Zugang + Anthropic-API-Key als Secret)*

> **Sicherheits-Grundgesetz:** Der Anthropic-API-Key liegt ausschließlich in Supabase Edge Function Secrets. Der Client ruft nur die Edge Function mit Supabase-JWT auf. Niemals KI-Keys, Bewertungslogik oder Freischalt-Entscheidungen im Client.

**AP 3.1 — Datenbank-Schema + RLS (Server als Wahrheit).**
```sql
-- Fortschritt (ersetzt Freitext-JSON schrittweise)
create table progress (
  user_id uuid references auth.users primary key,
  srs_data jsonb not null default '{}',
  lektionen jsonb not null default '{}',
  exam_data jsonb not null default '{}',
  xp int not null default 0,
  streak int not null default 0,
  last_active date,
  updated_at timestamptz default now()
);
create table exam_attempts (        -- Prüfungen: nur via Edge Function beschreibbar
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  stufe int not null,
  fragen jsonb not null,            -- serverseitig gezogene Fragen
  antworten jsonb,
  score int, passed boolean,
  started_at timestamptz default now(), finished_at timestamptz
);
create table homework (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  lektion_id text not null,
  aufgabe jsonb not null,
  abgabe text,
  feedback jsonb,                   -- KI-Korrektur (Schema s. AP 3.3)
  status text not null default 'offen',  -- offen|abgegeben|korrigiert
  created_at timestamptz default now(), submitted_at timestamptz
);
alter table progress enable row level security;
alter table exam_attempts enable row level security;
alter table homework enable row level security;
create policy "own progress" on progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read own attempts" on exam_attempts for select using (auth.uid() = user_id);
-- insert/update auf exam_attempts NUR durch service_role (Edge Function) — keine Client-Policy!
create policy "own homework read" on homework for select using (auth.uid() = user_id);
create policy "own homework submit" on homework for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
*Abnahme:* Anonymer Zugriff scheitert; User A sieht nie Daten von User B (Test mit zwei Testkonten); Client kann `exam_attempts` nicht direkt schreiben.

**AP 3.2 — Cheat-sichere Stufenprüfung.**
Edge Function `exam-start`: zieht Fragen serverseitig aus versioniertem Fragenpool (JSON im Function-Bundle), speichert sie in `exam_attempts`, liefert Fragen ohne Lösungen. `exam-submit`: bewertet serverseitig, schreibt `passed`, aktualisiert `progress`. Client-Fallback: ohne Login funktioniert die lokale Prüfung weiter (Ehrlichkeits-Modus), aber das „Zertifikat"-Badge und der Cloud-Fortschritt entstehen nur über den Server-Weg. Cooldown serverseitig erzwungen (letzter Versuch < 30 Min → 429).
*Abnahme:* Manipulation von localStorage schaltet keinen Cloud-Fortschritt frei; Antworten-Raten per wiederholtem Submit unmöglich (ein Attempt = ein Submit).

**AP 3.3 — Hausaufgaben mit KI-Korrektur (ab Stufe 2).** *(expliziter Nutzerwunsch)*
**Aufgabentypen** (pro Lektion 1 Hausaufgabe, generiert aus Lektionsinhalt): (a) 3 Sätze übersetzen De→Ar (getippt via AP 2.4), (b) Lückentext im Dialog vervollständigen, (c) freie Mini-Antwort („Stell deine Familie in 3 Sätzen vor"), (d) ab Kapitel 4: 5-Satz-Text.
**Flow:** Lektions-Check bestanden → Hausaufgabe erscheint in „Heute lernen" → Abgabe → Edge Function `homework-grade` ruft Claude (Modell: `claude-sonnet-5`; Temperatur 0; max_tokens 1500) → strukturiertes Feedback → Anzeige mit Fehler-Highlights; Note < 70 % ⇒ Überarbeitungsrunde (einmalig) mit den Hinweisen.
**Prompt-Vorlage (in Function versionieren):**
```
System: Du bist ein erfahrener, ermutigender Arabischlehrer für deutschsprachige
Anfänger (Niveau: Stufe 2, Wortschatz siehe Kontext). Korrigiere die Abgabe.
Bewerte NUR, was die Aufgabe verlangt. Harakat-Fehler sind Hinweise, keine
Punktabzüge, außer die Aufgabe verlangt Vokalisierung. Antworte AUSSCHLIESSLICH
mit JSON nach dem Schema, kein Text davor/danach.
Schema: {"score": 0-100, "bestanden": bool, "lob": "1 Satz, konkret",
 "fehler": [{"stelle":"Zitat aus Abgabe","problem":"was falsch ist",
 "korrektur":"richtige Form","regel":"1-Satz-Erklärung"}],
 "musterloesung":"...", "naechster_tipp":"1 Satz"}
User: AUFGABE: {{aufgabe}} | ERLAUBTER WORTSCHATZ: {{lektionswoerter}} |
ABGABE DES SCHÜLERS: {{abgabe}}
```
Robustheit: JSON-Parse mit Retry (1×), bei erneutem Fehlschlag Status `korrigiert` mit Fallback-Feedback „Lehrer schaut später drauf" + Logging. Rate-Limit: max. 10 Korrekturen/Tag/User (Tabelle zählt).
*Abnahme:* End-to-End-Test mit 3 präparierten Abgaben (perfekt / 2 Fehler / leer) liefert sinnvolles, schemakonformes Feedback; leere Abgabe wird ohne KI-Call abgefangen; Key nie im Netzwerk-Trace des Clients.

**AP 3.4 — Tutor-Chat „Frag den Lehrer".**
Edge Function `tutor-chat` (gleiches Sicherheitsmuster). Kontext: aktuelle Lektion + letzte 10 Nachrichten. System-Prompt: nur Arabisch-Lernen-Themen, deutsche Erklärsprache, Beispiele stets mit Harakat + Transliteration, maximal 200 Wörter pro Antwort, niemals ganze Hausaufgaben lösen (stattdessen Hinweise). 20 Nachrichten/Tag/User.
*Abnahme:* Off-Topic-Frage wird freundlich umgelenkt; Hausaufgaben-Lösungsanfrage liefert Hinweise statt Lösung.

### Phase 4 — Stufe 3: Grammatik & Verben *(~2–3 Sessions)*

**AP 4.1 — Curriculum (14 Lektionen):** Nominalsatz (mubtadaʾ/chabar) · Genus & ة · Dual/Plural (gesund) · gebrochene Plurale (häufigste Muster) · Personalpronomen · Possessivsuffixe · Demonstrativa · Idāfa · Adjektiv-Kongruenz · Präpositionen + Genitiv · Verb Perfekt (فَعَلَ, alle Personen) · Verb Präsens (يَفْعَلُ) · Verneinung (لا/ما/لَيْسَ) · Fragen. Jede Lektion: Regelkarte (max. 5 Sätze, 1 Merkbild) + 3 Übungstypen (Umformen per Kacheln, Lücken-Auswahl, Fehler-finden) + Mastery-Check.
**AP 4.2 — Konjugationstrainer:** Tabellen-Drill (Person antippen → Form bauen aus Stamm+Präfix/Suffix-Kacheln), 30 häufigste Verben, SRS-Anbindung pro Verbform.
**AP 4.3 — Hausaufgaben Stufe 3:** Satzbildung nach Muster + kurze freie Texte, Korrektur-Rubrik um Grammatikregeln der bisherigen Lektionen erweitert (Prompt bekommt `gelernteRegeln`-Liste).
*Abnahme je AP:* wie Phase 1/2 (Gating, Pools, Cooldowns, Skript-Checks der Daten).

### Phase 5 — Stufe 4: Meisterschaft & Übersetzung *(~2 Sessions)*

**AP 5.1 — Lese-Bibliothek:** 20 gestufte Texte (80→300 Wörter): adaptierte Geschichten, Alltagstexte, leichte klassische Auszüge; Wort-Antippen zeigt Glosse (aus Vokabular, sonst Kurzeintrag); unbekannte Wörter wandern per Tipp in die eigene SRS-Liste.
**AP 5.2 — Übersetzungswerkstatt:** Satz für Satz Ar→De übersetzen (getippt, KI bewertet Sinntreue statt Wortgleichheit — eigene Rubrik), danach Musterübersetzung + Vergleich.
**AP 5.3 — Abschlussprüfung + Zertifikat:** serverseitig (Muster AP 3.2), generiertes Zertifikat (Name, Datum, Stufen-Historie) als teilbare Seite.

### Phase 6 — Motivation & Retention *(parallel ab Phase 1 möglich, ~1 Session)*

**AP 6.1 — XP & Level:** Jede richtige Antwort 1–3 XP (Produktion > Erkennen), Lektion 20 XP, Hausaufgabe 30 XP. Level-Kurve dokumentieren (`XP_LEVELS`-Tabelle). Anzeige im Topbar-Konto.
**AP 6.2 — Streak & Wochenziel:** Kalender-Streak (AP 2.5), einstellbares Wochenziel (3/5/7 Tage), Wochenrückblick-Karte.
**AP 6.3 — Meilenstein-Momente:** Nach jeder Lektion ein „Das kannst du jetzt"-Screen mit konkretem Können-Satz („Du liest jetzt jedes Wort mit Tanwin"); Kapitelabschluss mit Kalligrafie-Belohnungskarte (SVG, teilbar). Kein Leaderboard (Solo-Lernen, kein Sozialdruck) — bewusste Entscheidung, nicht vergessen zu dokumentieren.

### Phase 7 — Qualität & Feinschliff *(fortlaufend, finale Session)*

**AP 7.1 — Echtes Audio:** Alle Buchstaben (Name + Laut isoliert), Harakat-Silben, Lesewörter und Dialogzeilen als MP3 (ein Sprecher, Studioqualität; Zwischenlösung: hochwertige Cloud-TTS einmalig generieren und als statische Dateien einchecken — dann klingt es auf jedem Gerät gleich). `speak()` bekommt Fallback-Kette: Datei → TTS.
**AP 7.2 — PWA:** Manifest + Service Worker (Offline-Cache aller Assets), „Zum Homescreen"-Hinweis.
**AP 7.3 — Performance:** Daten-Dateien lazy laden (Stufe-2-Daten erst bei Bedarf), Lighthouse ≥ 90 mobil.
**AP 7.4 — Betriebssicherheit:** zentraler `window.onerror`-Reporter (Supabase-Tabelle `client_errors`), Datenexport-Button (DSGVO), Konto-Löschung.

---

## Teil 4 — Arbeitsregeln für ausführende KI-Modelle

1. **Ein AP = ein PR** (oder ein sauberer Commit-Block). AP-Nummer im Commit-Titel. Nie zwei APs mischen.
2. **Vor jedem AP:** dieses Dokument lesen; prüfen, ob Vorgänger-APs wirklich abgeschlossen sind (Abnahmekriterien nachvollziehen, nicht glauben).
3. **Nach jedem AP:** Smoke-Test aus `docs/VERIFY.md` ausführen; alle Abnahmekriterien des AP einzeln abhaken und im PR-Text dokumentieren.
4. **Bestehendes Design-System respektieren:** Farben/Typografie/Ornamentik von `index.html` sind gesetzt (Teal/Gold/Pergament, Cormorant/Lora/Noto Naskh). Keine Frameworks, kein Tailwind, kein React — Vanilla JS + die vorhandenen Klassen.
5. **Arabische Inhalte:** immer voll vokalisiert (Harakat), Transliteration im vorhandenen deutschen Stil (sch, ch, dsch, ā/ī/ū), jede neue Vokabel mit `de`, `falsch`-Distraktoren, Beispielsatz. Distraktoren müssen genau das Lernziel testen (Minimalpaare), nie zufällig sein.
6. **Nichts Clientseitiges ist ein Sicherheits- oder Freischaltmechanismus.** Alles, was „bestanden" bedeutet und dauerhaft zählen soll, läuft ab Phase 3 über Edge Functions.
7. **Keine Secrets in Code oder Commits.** Anthropic-Key nur als Supabase-Secret; Supabase-Anon-Key darf (wie jetzt) im Client bleiben.
8. **Bei Unklarheit:** Nutzer fragen — nicht raten. Insbesondere vor: Löschen von Nutzerdaten-Strukturen, Ändern der Bestehensgrenzen, Kostenrelevantem (KI-Calls, Audio-Produktion).

## Teil 5 — Empfohlene Reihenfolge & Quick Wins

**Sofort (höchster Nutzen pro Aufwand):** AP 0.1 (Bugs) → AP 0.2 (Daten) → AP 1.1 + 1.2 (Lektionen + Mastery = Herz der Lernerfahrung) → AP 2.2 (längere Dialoge).
**Danach:** Rest Phase 0 → Phase 1 komplett → Phase 2 komplett → Phase 3 (Hausaufgaben-KI als erstes sichtbares „Wow") → Phase 6 → Phase 4 → Phase 5 → Phase 7.
**Voraussetzungen, die nur der Betreiber liefern kann:** Supabase-Projektzugang (SQL ausführen, Edge Functions deployen), Anthropic-API-Key (Budget: Hausaufgaben-Korrektur mit `claude-sonnet-5`, grob 1–2 Cent pro Korrektur), Entscheidung über Audio-Produktion (AP 7.1), GitHub Pages aktivieren (Settings → Pages → main).

---

*Ende des Masterplans. Version 1.0 — bei Umsetzungsfortschritt bitte pro AP den Status in dieser Datei pflegen (☐ → ☑ mit Commit-Hash).*
