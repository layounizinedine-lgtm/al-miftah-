/* data-dialoge.js — Erste Gespräche (Stufe 2) + Fortschritt. */

/* ============================================================
   DIALOGE — Erste Gespräche mit vollen Harakat (Stufe 2)
   Simpel, alltagsnah, abgestimmt auf den Vokabel-Wortschatz.
   ============================================================ */
var DIALOGE = [
  { id:0, titelAr:'التَّحِيَّة', titel:'Die Begrüßung', unter:'Begrüßen, nach dem Befinden fragen, sich verabschieden',
    zeilen:[
      { s:'A', ar:'السَّلَامُ عَلَيْكُمْ.', tr:'as-salāmu ʿalaikum.', de:'Friede sei mit dir! (Hallo!)' },
      { s:'B', ar:'وَعَلَيْكُمُ السَّلَامُ.', tr:'wa-ʿalaikumu s-salām.', de:'Und mit dir sei Friede!' },
      { s:'A', ar:'كَيْفَ حَالُكَ؟', tr:'kaifa ḥāluka?', de:'Wie geht es dir?' },
      { s:'B', ar:'أَنَا بِخَيْرٍ، الْحَمْدُ لِلَّهِ. وَأَنْتَ؟', tr:'anā bi-chairin, al-ḥamdu lillāh. wa-anta?', de:'Mir geht es gut, Gott sei Dank. Und dir?' },
      { s:'A', ar:'بِخَيْرٍ، شُكْرًا!', tr:'bi-chairin, schukran!', de:'Gut, danke!' },
      { s:'B', ar:'مَعَ السَّلَامَةِ!', tr:'maʿa s-salāma!', de:'Auf Wiedersehen!' }
    ],
    fragen:[
      { typ:'wort', frage:'Was bedeutet dieser Satz?', glyph:'كَيْفَ حَالُكَ؟',
        richtig:'Wie geht es dir?', optionen:['Wie geht es dir?','Wie heißt du?','Woher kommst du?','Auf Wiedersehen!'] },
      { typ:'dear', frage:'Wie antwortest du auf „as-salāmu ʿalaikum"?', glyph:'„Friede sei mit dir!"',
        richtig:'وَعَلَيْكُمُ السَّلَامُ', optionen:['وَعَلَيْكُمُ السَّلَامُ','شُكْرًا','مَعَ السَّلَامَةِ','بِخَيْرٍ'] },
      { typ:'dear', frage:'Wie sagst du „danke"?', glyph:'„danke"',
        richtig:'شُكْرًا', optionen:['شُكْرًا','عَفْوًا','نَعَمْ','مَعَ السَّلَامَةِ'] }
    ]},
  { id:1, titelAr:'مَنْ أَنْتَ؟', titel:'Wer bist du?', unter:'Namen und Herkunft erfragen und nennen',
    zeilen:[
      { s:'A', ar:'مَا اسْمُكَ؟', tr:'mā-smuka?', de:'Wie heißt du?' },
      { s:'B', ar:'اِسْمِي أَحْمَدُ. وَأَنْتَ؟', tr:'ismī aḥmad. wa-anta?', de:'Ich heiße Ahmad. Und du?' },
      { s:'A', ar:'اِسْمِي كَرِيمٌ. مِنْ أَيْنَ أَنْتَ؟', tr:'ismī karīm. min aina anta?', de:'Ich heiße Karim. Woher kommst du?' },
      { s:'B', ar:'أَنَا مِنْ أَلْمَانْيَا. وَأَنْتَ؟', tr:'anā min almāniyā. wa-anta?', de:'Ich komme aus Deutschland. Und du?' },
      { s:'A', ar:'أَنَا مِنْ مِصْرَ.', tr:'anā min miṣr.', de:'Ich komme aus Ägypten.' },
      { s:'B', ar:'تَشَرَّفْنَا!', tr:'tascharrafnā!', de:'Sehr erfreut!' }
    ],
    fragen:[
      { typ:'wort', frage:'Was bedeutet diese Frage?', glyph:'مَا اسْمُكَ؟',
        richtig:'Wie heißt du?', optionen:['Wie heißt du?','Woher kommst du?','Wie geht es dir?','Wer ist das?'] },
      { typ:'wort', frage:'Was bedeutet dieser Satz?', glyph:'أَنَا مِنْ أَلْمَانْيَا.',
        richtig:'Ich komme aus Deutschland.', optionen:['Ich komme aus Deutschland.','Ich komme aus Ägypten.','Ich heiße Ahmad.','Ich bin Schüler.'] },
      { typ:'dear', frage:'Wie fragst du nach der Herkunft?', glyph:'„Woher kommst du?"',
        richtig:'مِنْ أَيْنَ أَنْتَ؟', optionen:['مِنْ أَيْنَ أَنْتَ؟','مَا اسْمُكَ؟','كَيْفَ حَالُكَ؟','مَنْ هَذَا؟'] }
    ]},
  { id:2, titelAr:'فِي الْمَدْرَسَةِ', titel:'In der Schule', unter:'Stift, Buch, Lehrer — dein Wortschatz in Aktion',
    zeilen:[
      { s:'A', ar:'هَلْ عِنْدَكَ قَلَمٌ؟', tr:'hal ʿindaka qalamun?', de:'Hast du einen Stift?' },
      { s:'B', ar:'نَعَمْ، عِنْدِي قَلَمٌ وَكِتَابٌ.', tr:'naʿam, ʿindī qalamun wa-kitābun.', de:'Ja, ich habe einen Stift und ein Buch.' },
      { s:'A', ar:'أَيْنَ الْمُعَلِّمُ؟', tr:'aina l-muʿallimu?', de:'Wo ist der Lehrer?' },
      { s:'B', ar:'هُوَ فِي الصَّفِّ.', tr:'huwa fī ṣ-ṣaff.', de:'Er ist im Klassenzimmer.' },
      { s:'A', ar:'عِنْدِي سُؤَالٌ لِلْمُعَلِّمِ.', tr:'ʿindī suʾālun lil-muʿallim.', de:'Ich habe eine Frage an den Lehrer.' },
      { s:'B', ar:'هَيَّا بِنَا!', tr:'hayyā binā!', de:'Los, gehen wir!' }
    ],
    fragen:[
      { typ:'wort', frage:'Was hat B dabei?', glyph:'عِنْدِي قَلَمٌ وَكِتَابٌ.',
        richtig:'einen Stift und ein Buch', optionen:['einen Stift und ein Buch','einen Schlüssel','ein Auto','ein Telefon und ein Heft'] },
      { typ:'wort', frage:'Was bedeutet diese Frage?', glyph:'أَيْنَ الْمُعَلِّمُ؟',
        richtig:'Wo ist der Lehrer?', optionen:['Wo ist der Lehrer?','Wer ist der Lehrer?','Wie heißt der Lehrer?','Wo ist die Schule?'] },
      { typ:'dear', frage:'Wie sagst du „ja"?', glyph:'„ja"',
        richtig:'نَعَمْ', optionen:['نَعَمْ','لَا','شُكْرًا','هَيَّا'] }
    ]},
  { id:3, titelAr:'الْعَائِلَةُ', titel:'Die Familie', unter:'Bruder, Schwester und das eigene Haus vorstellen',
    zeilen:[
      { s:'A', ar:'مَنْ هَذَا؟', tr:'man hādhā?', de:'Wer ist das?' },
      { s:'B', ar:'هَذَا أَخِي، اِسْمُهُ عُمَرُ.', tr:'hādhā achī, ismuhu ʿumar.', de:'Das ist mein Bruder, er heißt Umar.' },
      { s:'A', ar:'وَمَنْ هَذِهِ؟', tr:'wa-man hādhihi?', de:'Und wer ist das (weiblich)?' },
      { s:'B', ar:'هَذِهِ أُخْتِي، هِيَ طَالِبَةٌ.', tr:'hādhihi uchtī, hiya ṭālibatun.', de:'Das ist meine Schwester, sie ist Schülerin.' },
      { s:'A', ar:'هَلْ هَذَا بَيْتُكُمْ؟', tr:'hal hādhā baitukum?', de:'Ist das euer Haus?' },
      { s:'B', ar:'نَعَمْ، هَذَا بَيْتُنَا الْجَمِيلُ.', tr:'naʿam, hādhā baitunā l-dschamīl.', de:'Ja, das ist unser schönes Haus.' }
    ],
    fragen:[
      { typ:'wort', frage:'Wer ist Umar?', glyph:'هَذَا أَخِي، اِسْمُهُ عُمَرُ.',
        richtig:'der Bruder', optionen:['der Bruder','die Schwester','der Lehrer','der Vater'] },
      { typ:'wort', frage:'Was ist die Schwester?', glyph:'هِيَ طَالِبَةٌ.',
        richtig:'Schülerin', optionen:['Schülerin','Lehrerin','Köchin','Ingenieurin'] },
      { typ:'wort', frage:'Was bedeutet diese Frage?', glyph:'مَنْ هَذَا؟',
        richtig:'Wer ist das?', optionen:['Wer ist das?','Was ist das?','Wo ist das?','Wessen ist das?'] }
    ]},
  { id:4, titelAr:'فِي الْبَيْتِ', titel:'Im Haus', unter:'Der Schlüssel, der Tisch, die Küche — Dinge finden',
    zeilen:[
      { s:'A', ar:'أَيْنَ الْمِفْتَاحُ؟', tr:'aina l-miftāḥu?', de:'Wo ist der Schlüssel?' },
      { s:'B', ar:'الْمِفْتَاحُ عَلَى الطَّاوِلَةِ.', tr:'al-miftāḥu ʿalā ṭ-ṭāwila.', de:'Der Schlüssel ist auf dem Tisch.' },
      { s:'A', ar:'وَأَيْنَ أُمِّي؟', tr:'wa-aina ummī?', de:'Und wo ist meine Mutter?' },
      { s:'B', ar:'هِيَ فِي الْمَطْبَخِ.', tr:'hiya fī l-maṭbach.', de:'Sie ist in der Küche.' },
      { s:'A', ar:'شُكْرًا جَزِيلًا!', tr:'schukran dschazīlan!', de:'Vielen Dank!' },
      { s:'B', ar:'عَفْوًا!', tr:'ʿafwan!', de:'Gern geschehen!' }
    ],
    fragen:[
      { typ:'wort', frage:'Wo ist der Schlüssel?', glyph:'الْمِفْتَاحُ عَلَى الطَّاوِلَةِ.',
        richtig:'auf dem Tisch', optionen:['auf dem Tisch','in der Küche','an der Tür','im Auto'] },
      { typ:'wort', frage:'Wo ist die Mutter?', glyph:'هِيَ فِي الْمَطْبَخِ.',
        richtig:'in der Küche', optionen:['in der Küche','im Klassenzimmer','auf dem Markt','im Garten'] },
      { typ:'dear', frage:'Wie antwortest du auf „schukran"?', glyph:'„Gern geschehen!"',
        richtig:'عَفْوًا', optionen:['عَفْوًا','شُكْرًا','نَعَمْ','أَهْلًا'] }
    ]}
];
/* ============================================================
   WORTABDECKUNG (AP 2.2) — jedes Dialogwort muss entweder im
   Vokabular (ALLE_VOKABELN) oder in dieser bewusst kuratierten
   Funktionswörter-/Eigennamen-Liste stehen. Kein Lemmatisierer:
   exakte Oberflächenformen, wie sie in den Dialogen vorkommen —
   das verhindert unbemerkt "erfundenen" Wortschatz, prüft aber
   keine Grammatik. Neue Dialoge dürfen nur bereits gelistete
   Formen oder maximal 2 neue Vokabeln pro Dialog verwenden; jede
   neue Funktionsform kommt bewusst hierher.
   ============================================================ */
var FUNKTIONSWOERTER = [
  // Pronomen & Demonstrativa
  'أَنَا','أَنْتَ','هُوَ','هِيَ','هَذَا','هَذِهِ','وَأَنْتَ','وَمَنْ',
  // Fragewörter & Partikeln
  'أَيْنَ','وَأَيْنَ','كَيْفَ','مَنْ','مَا','هَلْ','مِنْ','مَعَ','عَلَى','فِي','نَعَمْ',
  // Grußformeln & feste Ausdrücke
  'السَّلَامُ','وَعَلَيْكُمُ','عَلَيْكُمْ','السَّلَامَةِ','الْحَمْدُ','لِلَّهِ','تَشَرَّفْنَا','هَيَّا','بِنَا',
  // Gebundene Formen mit Possessiv-/Präpositionssuffix — echte Vokabeln mit
  // angehängtem Pronomen/Artikel, hier bewusst als Ganzes gelistet, solange
  // es noch keine eigene Grammatik-Lektion für Suffixe gibt.
  'اسْمُكَ','اِسْمِي','اِسْمُهُ','حَالُكَ','بِخَيْرٍ','عِنْدَكَ','بَيْتُكُمْ','بَيْتُنَا','أَخِي','أُخْتِي','أُمِّي',
  'الصَّفِّ','الطَّاوِلَةِ','الْجَمِيلُ','الْمَطْبَخِ','الْمُعَلِّمُ','الْمِفْتَاحُ','لِلْمُعَلِّمِ','وَكِتَابٌ','طَالِبَةٌ','جَزِيلًا',
  // Eigennamen
  'أَحْمَدُ','كَرِيمٌ','عُمَرُ','مِصْرَ','أَلْمَانْيَا'
];

// Zerlegt eine Dialogzeile in Wörter (Satzzeichen entfernt).
function dialogZeileWoerter(ar){
  return ar.replace(/[؟!.،]/g, '').split(/\s+/).filter(Boolean);
}

// Liefert alle Dialogwörter, die weder im Vokabular noch in der
// Funktionswörter-Liste stehen — leer heißt: vollständige Abdeckung.
function dialogWortAbdeckungLuecken(){
  var vokSet = {};
  (typeof ALLE_VOKABELN !== 'undefined' ? ALLE_VOKABELN : []).forEach(function(v){ vokSet[v.arabic] = 1; });
  var funkSet = {};
  FUNKTIONSWOERTER.forEach(function(w){ funkSet[w] = 1; });
  var luecken = [];
  DIALOGE.forEach(function(d){
    d.zeilen.forEach(function(z){
      dialogZeileWoerter(z.ar).forEach(function(w){
        if(!vokSet[w] && !funkSet[w]) luecken.push({ dialogId:d.id, wort:w });
      });
    });
  });
  return luecken;
}

var aktuellerDialog = null;
var DIALOG_DONE_KEY = 'almiftah_dialoge_done';
function loadDialogeDone(){
  try { return new Set(JSON.parse(localStorage.getItem(DIALOG_DONE_KEY) || '[]')); }
  catch(e){ return new Set(); }
}
function saveDialogeDone(set){
  try { localStorage.setItem(DIALOG_DONE_KEY, JSON.stringify(Array.from(set))); } catch(e){}
}
var dialogeDone = loadDialogeDone();

