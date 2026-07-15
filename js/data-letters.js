/* data-letters.js — Das arabische Alphabet (Formen, Gruppen). */

/* ============================================================
   DATA — Arabic letters grouped by visual similarity
   forms via zero-width joiner render position shapes
   NON_CONNECTING: letters that don't join to the following letter
   ============================================================ */
var TATWEEL = '\u0640'; // ـ  visible connecting stroke (kashida)
var NON_CONNECTING = new Set(['ا','د','ذ','ر','ز','و']);

function forms(ch){
  return {
    isolated: ch,
    init: ch + TATWEEL,            // Anfangsform:  خـ
    med:  TATWEEL + ch + TATWEEL,  // Mittelform:  ـخـ
    fin:  TATWEEL + ch             // Endform:     ـخ
  };
}

var LETTER_GROUPS = [
  { title: "Erste Gruppe", letters: [
    { ch:'ا', name:'Alif', tr:'ʾalif', sound:'langes „a" wie in „Vater" — trägt oft nur den Stimmansatz.' },
    { ch:'ب', name:'Bāʾ',  tr:'bāʾ',   sound:'wie „b" in „Baum". Ein Punkt unter dem Bogen.' },
    { ch:'ت', name:'Tāʾ',  tr:'tāʾ',   sound:'wie „t" in „Tür". Zwei Punkte oben.' },
    { ch:'ث', name:'Thāʾ', tr:'ṯāʾ',   sound:'wie das englische „th" in „think". Drei Punkte oben.' }
  ]},
  { title: "Zweite Gruppe", letters: [
    { ch:'ج', name:'Jīm',  tr:'ǧīm',   sound:'wie „dsch" in „Dschungel". Ein Punkt in der Mitte.' },
    { ch:'ح', name:'Ḥāʾ',  tr:'ḥāʾ',   sound:'ein behauchtes „h" aus der Kehle — stark, ohne Punkt.' },
    { ch:'خ', name:'Khāʾ', tr:'ḫāʾ',   sound:'wie „ch" in „Bach". Ein Punkt oben.' },
    { ch:'د', name:'Dāl',  tr:'dāl',   sound:'wie „d" in „Dach". Verbindet nicht nach links.' },
    { ch:'ذ', name:'Dhāl', tr:'ḏāl',   sound:'wie das englische „th" in „this". Ein Punkt oben.' }
  ]},
  { title: "Dritte Gruppe", letters: [
    { ch:'ر', name:'Rāʾ',  tr:'rāʾ',   sound:'gerolltes „r" wie im Spanischen. Verbindet nicht nach links.' },
    { ch:'ز', name:'Zāy',  tr:'zāy',   sound:'stimmhaftes „s" wie in „Rose". Ein Punkt oben.' },
    { ch:'س', name:'Sīn',  tr:'sīn',   sound:'scharfes „s" wie in „Tasse". Drei Zacken.' },
    { ch:'ش', name:'Shīn', tr:'šīn',   sound:'wie „sch" in „Schule". Drei Zacken, drei Punkte.' }
  ]},
  { title: "Vierte Gruppe", letters: [
    { ch:'ص', name:'Ṣād',  tr:'ṣād',   sound:'nachdrückliches, dunkles „s" — tief hinten gebildet.' },
    { ch:'ض', name:'Ḍād',  tr:'ḍād',   sound:'nachdrückliches, dunkles „d". Der berühmte Laut des Arabischen.' },
    { ch:'ط', name:'Ṭāʾ',  tr:'ṭāʾ',   sound:'nachdrückliches, dunkles „t".' },
    { ch:'ظ', name:'Ẓāʾ',  tr:'ẓāʾ',   sound:'nachdrückliches, dunkles „th"/„z".' }
  ]},
  { title: "Fünfte Gruppe", letters: [
    { ch:'ع', name:'ʿAyn', tr:'ʿayn',  sound:'ein tiefer Kehllaut ohne deutsche Entsprechung — Kehle leicht zusammenziehen.' },
    { ch:'غ', name:'Ghayn',tr:'ġayn',  sound:'wie ein gerolltes Gaumen-„r" (ähnlich dem franz. „r"). Ein Punkt oben.' },
    { ch:'ف', name:'Fāʾ',  tr:'fāʾ',   sound:'wie „f" in „Fisch". Ein Punkt oben.' },
    { ch:'ق', name:'Qāf',  tr:'qāf',   sound:'ein „k" ganz hinten im Gaumen gebildet. Zwei Punkte oben.' }
  ]},
  { title: "Sechste Gruppe", letters: [
    { ch:'ك', name:'Kāf',  tr:'kāf',   sound:'wie „k" in „Kind".' },
    { ch:'ل', name:'Lām',  tr:'lām',   sound:'wie „l" in „Licht".' },
    { ch:'م', name:'Mīm',  tr:'mīm',   sound:'wie „m" in „Mond".' },
    { ch:'ن', name:'Nūn',  tr:'nūn',   sound:'wie „n" in „Nacht". Ein Punkt oben.' }
  ]},
  { title: "Siebte Gruppe", letters: [
    { ch:'ه', name:'Hāʾ',  tr:'hāʾ',   sound:'weiches „h" wie in „Haus".' },
    { ch:'و', name:'Wāw',  tr:'wāw',   sound:'wie „w"/„u" in „Wasser". Verbindet nicht nach links.' },
    { ch:'ي', name:'Yāʾ',  tr:'yāʾ',   sound:'wie „j"/„i" in „ja". Zwei Punkte unten.' }
  ]}
];

// flat list for exercise
var ALL_LETTERS = [];
LETTER_GROUPS.forEach(function(g){ g.letters.forEach(function(l){ ALL_LETTERS.push(l); }); });

