/* data-woerter.js — Lesewörter für Sukun/Schadda/Tanwin/Madd. */

/* ============================================================
   WOERTER — Erste Wörter lesen (Sukun, Schadda, Tanwin in Aktion)
   'falsch' = handgebaute typische Fehl-Lesungen (testen genau das Zeichen)
   ============================================================ */
var WOERTER_GRUPPEN = [
  { titel:'Nur kurze Vokale', hinweis:'Jeder Buchstabe trägt einen Vokal — lies sie der Reihe nach.', woerter:[
    { ar:'كَتَبَ',  tr:'kataba',  de:'er schrieb',   falsch:['kutuba','kitaba'] },
    { ar:'جَلَسَ',  tr:'dschalasa', de:'er saß',     falsch:['dschulisa','dschalusa'] },
    { ar:'قَلَم',   tr:'qalam',   de:'Stift',        falsch:['qilam','qalum'] },
    { ar:'وَلَد',   tr:'walad',   de:'Junge',        falsch:['wulid','walud'] }
  ]},
  { titel:'Lange Vokale (Madd)', hinweis:'Alif, Wāw und Yāʾ dehnen den Vokal davor: ā, ū, ī.', woerter:[
    { ar:'بَاب',    tr:'bāb',     de:'Tür',          falsch:['bab','būb'] },
    { ar:'كِتَاب',  tr:'kitāb',   de:'Buch',         falsch:['kitab','kutūb'] },
    { ar:'نُور',    tr:'nūr',     de:'Licht',        falsch:['nur','nār'] },
    { ar:'فِيل',    tr:'fīl',     de:'Elefant',      falsch:['fil','fūl'] },
    { ar:'سُوق',    tr:'sūq',     de:'Markt',        falsch:['sīq','saq'] }
  ]},
  { titel:'Sukun sehen', hinweis:'Der kleine Kreis ْ heißt: hier KEIN Vokal — zwei Buchstaben prallen aneinander.', woerter:[
    { ar:'شَمْس',   tr:'schams',  de:'Sonne',        falsch:['schamis','schamas'] },
    { ar:'كَلْب',   tr:'kalb',    de:'Hund',         falsch:['kalab','kalib'] },
    { ar:'بِنْت',   tr:'bint',    de:'Mädchen',      falsch:['binat','banit'] },
    { ar:'مَكْتَب', tr:'maktab',  de:'Schreibtisch', falsch:['makatab','maktib'] },
    { ar:'يَكْتُبُ', tr:'yaktubu', de:'er schreibt',  falsch:['yakatubu','yaktibu'] }
  ]},
  { titel:'Schadda sehen', hinweis:'Das kleine ّ verdoppelt den Buchstaben — sprich ihn lang/verstärkt.', woerter:[
    { ar:'أُمّ',     tr:'umm',     de:'Mutter',      falsch:['um','amm'] },
    { ar:'مُعَلِّم', tr:'muallim', de:'Lehrer',      falsch:['mualim','muallam'] },
    { ar:'تُفَّاح',  tr:'tuffāh',  de:'Äpfel',       falsch:['tufāh','taffūh'] },
    { ar:'سَيَّارَة', tr:'sayyāra', de:'Auto',       falsch:['sayāra','siyyāra'] }
  ]},
  { titel:'Tanwin sehen — an · in · un', hinweis:'Doppelzeichen am Wortende = Vokal + n. Achte genau hin: ً = an, ٍ = in, ٌ = un.', woerter:[
    { ar:'كِتَابٌ',  tr:'kitābun', de:'ein Buch',    falsch:['kitāban','kitābin'] },
    { ar:'قَلَمًا',  tr:'qalaman', de:'einen Stift', falsch:['qalamun','qalamin'] },
    { ar:'بَيْتٍ',   tr:'baitin',  de:'eines Hauses', falsch:['baitun','baitan'] },
    { ar:'شُكْرًا',  tr:'schukran', de:'danke!',     falsch:['schukrun','schukrin'] },
    { ar:'رَجُلٌ',   tr:'radschulun', de:'ein Mann', falsch:['radschulin','radschulan'] },
    { ar:'سَلَامٍ',  tr:'salāmin', de:'(des) Friedens', falsch:['salāmun','salāman'] },
    { ar:'أَهْلًا',  tr:'ahlan',   de:'willkommen!', falsch:['ahlun','ahlin'] },
    { ar:'بِنْتٌ',   tr:'bintun',  de:'ein Mädchen', falsch:['bintan','bintin'] }
  ]}
];

var ALLE_WOERTER = [];
WOERTER_GRUPPEN.forEach(function(g){ g.woerter.forEach(function(w){ ALLE_WOERTER.push(w); }); });

