/* data-silben.js — Lektion 9 (Silbenlesen) & Lektion 12 (Lesefluss), AP 1.5.
   Jedes Wort trägt eine manuell geprüfte Silbentrennung (silben) — die
   Konkatenation von silben muss exakt dem Wort (ar) entsprechen; das wird
   im Smoke-Test automatisch geprüft. Enthält die 26 bereits aus
   data-woerter.js bekannten Wörter (Wiedererkennung) plus 20 neue,
   zwei- bis dreisilbige Wörter mit Distraktoren für Schnell-Lesen. */

var SILBEN_WOERTER = [
  // --- bereits bekannte Wörter aus data-woerter.js ---
  { ar:'كَتَبَ',   silben:['كَ','تَ','بَ'],      tr:'kataba',    de:'er schrieb',      falsch:['kutuba','kitaba'] },
  { ar:'جَلَسَ',   silben:['جَ','لَ','سَ'],      tr:'dschalasa', de:'er saß',          falsch:['dschulisa','dschalusa'] },
  { ar:'قَلَم',    silben:['قَ','لَم'],          tr:'qalam',     de:'Stift',           falsch:['qilam','qalum'] },
  { ar:'وَلَد',    silben:['وَ','لَد'],          tr:'walad',     de:'Junge',           falsch:['wulid','walud'] },
  { ar:'بَاب',     silben:['بَاب'],              tr:'bāb',       de:'Tür',             falsch:['bab','būb'] },
  { ar:'كِتَاب',   silben:['كِ','تَاب'],         tr:'kitāb',     de:'Buch',            falsch:['kitab','kutūb'] },
  { ar:'نُور',     silben:['نُور'],              tr:'nūr',       de:'Licht',           falsch:['nur','nār'] },
  { ar:'فِيل',     silben:['فِيل'],              tr:'fīl',       de:'Elefant',         falsch:['fil','fūl'] },
  { ar:'سُوق',     silben:['سُوق'],              tr:'sūq',       de:'Markt',           falsch:['sīq','saq'] },
  { ar:'شَمْس',    silben:['شَمْس'],             tr:'schams',    de:'Sonne',           falsch:['schamis','schamas'] },
  { ar:'كَلْب',    silben:['كَلْب'],             tr:'kalb',      de:'Hund',            falsch:['kalab','kalib'] },
  { ar:'بِنْت',    silben:['بِنْت'],             tr:'bint',      de:'Mädchen',         falsch:['binat','banit'] },
  { ar:'مَكْتَب',  silben:['مَكْ','تَب'],        tr:'maktab',    de:'Schreibtisch',    falsch:['makatab','maktib'] },
  { ar:'يَكْتُبُ', silben:['يَكْ','تُ','بُ'],    tr:'yaktubu',   de:'er schreibt',     falsch:['yakatubu','yaktibu'] },
  { ar:'أُمّ',      silben:['أُمّ'],               tr:'umm',       de:'Mutter',          falsch:['um','amm'] },
  { ar:'مُعَلِّم', silben:['مُ','عَلِّ','م'],    tr:'muallim',   de:'Lehrer',          falsch:['mualim','muallam'] },
  { ar:'تُفَّاح',  silben:['تُ','فَّاح'],        tr:'tuffāh',    de:'Äpfel',           falsch:['tufāh','taffūh'] },
  { ar:'سَيَّارَة', silben:['سَ','يَّا','رَة'],  tr:'sayyāra',   de:'Auto',            falsch:['sayāra','siyyāra'] },
  { ar:'كِتَابٌ',  silben:['كِ','تَا','بٌ'],     tr:'kitābun',   de:'ein Buch',        falsch:['kitāban','kitābin'] },
  { ar:'قَلَمًا',  silben:['قَ','لَ','مًا'],     tr:'qalaman',   de:'einen Stift',     falsch:['qalamun','qalamin'] },
  { ar:'بَيْتٍ',   silben:['بَيْ','تٍ'],         tr:'baitin',    de:'eines Hauses',    falsch:['baitun','baitan'] },
  { ar:'شُكْرًا',  silben:['شُكْ','رًا'],        tr:'schukran',  de:'danke!',          falsch:['schukrun','schukrin'] },
  { ar:'رَجُلٌ',   silben:['رَ','جُ','لٌ'],      tr:'radschulun',de:'ein Mann',        falsch:['radschulin','radschulan'] },
  { ar:'سَلَامٍ',  silben:['سَ','لَا','مٍ'],     tr:'salāmin',   de:'(des) Friedens',  falsch:['salāmun','salāman'] },
  { ar:'أَهْلًا',  silben:['أَهْ','لًا'],        tr:'ahlan',     de:'willkommen!',     falsch:['ahlun','ahlin'] },
  { ar:'بِنْتٌ',   silben:['بِنْ','تٌ'],         tr:'bintun',    de:'ein Mädchen',     falsch:['bintan','bintin'] },

  // --- neu für AP 1.5 (Silbenlesen & Lesefluss) ---
  { ar:'مَدْرَسَةٌ',  silben:['مَدْ','رَ','سَ','ةٌ'],  tr:'madrasatun', de:'eine Schule',       falsch:['madrasah','madrasatan'] },
  { ar:'طَالِبٌ',     silben:['طَا','لِ','بٌ'],        tr:'ṭālibun',    de:'ein Schüler',       falsch:['ṭālibin','ṭāliban'] },
  { ar:'جَمِيلٌ',     silben:['جَ','مِي','لٌ'],        tr:'dschamīlun', de:'schön',             falsch:['dschamīlan','dschamīlin'] },
  { ar:'كَبِيرٌ',     silben:['كَ','بِي','رٌ'],        tr:'kabīrun',    de:'groß',              falsch:['kabīran','kabīrin'] },
  { ar:'صَغِيرٌ',     silben:['صَ','غِي','رٌ'],        tr:'ṣaghīrun',   de:'klein',             falsch:['ṣaghīran','ṣaghīrin'] },
  { ar:'جَدِيدٌ',     silben:['جَ','دِي','دٌ'],        tr:'dschadīdun', de:'neu',               falsch:['dschadīdan','dschadīdin'] },
  { ar:'قَدِيمٌ',     silben:['قَ','دِي','مٌ'],        tr:'qadīmun',    de:'alt',               falsch:['qadīman','qadīmin'] },
  { ar:'طَوِيلٌ',     silben:['طَ','وِي','لٌ'],        tr:'ṭawīlun',    de:'lang',              falsch:['ṭawīlan','ṭawīlin'] },
  { ar:'قَصِيرٌ',     silben:['قَ','صِي','رٌ'],        tr:'qaṣīrun',    de:'kurz',              falsch:['qaṣīran','qaṣīrin'] },
  { ar:'مُمْتَازٌ',   silben:['مُمْ','تَا','زٌ'],      tr:'mumtāzun',   de:'ausgezeichnet',     falsch:['mumtāzan','mumtāzin'] },
  { ar:'مَكْتَبَةٌ',  silben:['مَكْ','تَ','بَ','ةٌ'],  tr:'maktabatun', de:'eine Bibliothek',   falsch:['maktabah','maktabatan'] },
  { ar:'حَقِيبَةٌ',   silben:['حَ','قِي','بَ','ةٌ'],   tr:'ḥaqībatun',  de:'eine Tasche',       falsch:['ḥaqībah','ḥaqībatan'] },
  { ar:'سَرِيعٌ',     silben:['سَ','رِي','عٌ'],        tr:'sarīʿun',    de:'schnell',           falsch:['sarīʿan','sarīʿin'] },
  { ar:'بَطِيءٌ',     silben:['بَ','طِي','ءٌ'],        tr:'baṭīʾun',    de:'langsam',           falsch:['baṭīʾan','baṭīʾin'] },
  { ar:'نَظِيفٌ',     silben:['نَ','ظِي','فٌ'],        tr:'naẓīfun',    de:'sauber',            falsch:['naẓīfan','naẓīfin'] },
  { ar:'صَدِيقٌ',     silben:['صَ','دِي','قٌ'],        tr:'ṣadīqun',    de:'Freund',            falsch:['ṣadīqan','ṣadīqin'] },
  { ar:'فَرِحٌ',      silben:['فَ','رِ','حٌ'],         tr:'fariḥun',    de:'froh',              falsch:['fariḥan','fariḥin'] },
  { ar:'حَزِينٌ',     silben:['حَ','زِي','نٌ'],        tr:'ḥazīnun',    de:'traurig',           falsch:['ḥazīnan','ḥazīnin'] },
  { ar:'غَرِيبٌ',     silben:['غَ','رِي','بٌ'],        tr:'gharībun',   de:'fremd / seltsam',   falsch:['gharīban','gharībin'] },
  { ar:'وَاسِعٌ',     silben:['وَا','سِ','عٌ'],        tr:'wāsiʿun',    de:'geräumig / weit',   falsch:['wāsiʿan','wāsiʿin'] }
];
