/* data-sonnenmond.js — Lektion 12: Sonnen- und Mondbuchstaben.
   Regel: Folgt auf den bestimmten Artikel اَلْ (al-) ein Sonnenbuchstabe,
   verschmilzt das Lām mit ihm (Assimilation, Verdopplung hörbar: asch-schams).
   Folgt ein Mondbuchstabe, bleibt das Lām klar hörbar: al-qamar.
   Viele Beispielwörter greifen bereits gelernten Wortschatz aus Stufe 2 auf. */

var SONNENBUCHSTABEN = ['ت','ث','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ل','ن'];
var MONDBUCHSTABEN   = ['ا','ب','ج','ح','خ','ع','غ','ف','ق','ك','م','ه','و','ي'];

var SONNENMOND_WOERTER = [
  // --- Sonnenbuchstaben: das Lām wird nicht gesprochen, der Folgebuchstabe verdoppelt sich ---
  { ar:'الشَّمْسُ',     tr:'asch-schamsu',   de:'die Sonne',      art:'sonne', falsch:['al-schamsu','asch-schams'] },
  { ar:'التُّفَّاحُ',    tr:'at-tuffāhu',     de:'die Äpfel',      art:'sonne', falsch:['al-tuffāhu','at-tuffāh'] },
  { ar:'الدَّرْسُ',      tr:'ad-darsu',       de:'die Lektion',    art:'sonne', falsch:['al-darsu','ad-dars'] },
  { ar:'الذَّهَبُ',      tr:'adh-dhahabu',    de:'das Gold',       art:'sonne', falsch:['al-dhahabu','adh-dhahab'] },
  { ar:'الرَّجُلُ',      tr:'ar-radschulu',   de:'der Mann',       art:'sonne', falsch:['al-radschulu','ar-radschul'] },
  { ar:'الزَّمِيلُ',     tr:'az-zamīlu',      de:'der Kollege',    art:'sonne', falsch:['al-zamīlu','az-zamīl'] },
  { ar:'السَّيَّارَةُ',   tr:'as-sayyāratu',   de:'das Auto',       art:'sonne', falsch:['al-sayyāratu','as-sayyāra'] },
  { ar:'الشَّاطِئُ',     tr:'asch-schāṭiʾu',  de:'der Strand',     art:'sonne', falsch:['al-schāṭiʾu','asch-schāṭiʾ'] },
  { ar:'الصَّبَاحُ',     tr:'aṣ-ṣabāḥu',      de:'der Morgen',     art:'sonne', falsch:['al-ṣabāḥu','aṣ-ṣabāḥ'] },
  { ar:'الضَّيْفُ',      tr:'aḍ-ḍayfu',       de:'der Gast',       art:'sonne', falsch:['al-ḍayfu','aḍ-ḍayf'] },
  { ar:'الطَّاوِلَةُ',    tr:'aṭ-ṭāwilatu',    de:'der Tisch',      art:'sonne', falsch:['al-ṭāwilatu','aṭ-ṭāwila'] },
  { ar:'الظُّهْرُ',      tr:'aẓ-ẓuhru',       de:'der Mittag',     art:'sonne', falsch:['al-ẓuhru','aẓ-ẓuhr'] },
  { ar:'اللُّغَةُ',      tr:'al-lughatu',     de:'die Sprache',    art:'sonne', falsch:['al-lugha','a-lughatu'] },
  { ar:'النَّظَّارَةُ',   tr:'an-naẓẓāratu',   de:'die Brille',     art:'sonne', falsch:['al-naẓẓāratu','an-naẓẓāra'] },
  // --- Mondbuchstaben: das Lām bleibt klar hörbar ---
  { ar:'القَمَرُ',       tr:'al-qamaru',      de:'der Mond',       art:'mond', falsch:['aq-qamaru','al-qamar'] },
  { ar:'البَيْتُ',       tr:'al-baytu',       de:'das Haus',       art:'mond', falsch:['ab-baytu','al-bayt'] },
  { ar:'الجَامِعَةُ',     tr:'al-dschāmiʿatu', de:'die Universität',art:'mond', falsch:['adsch-dschāmiʿatu','al-dschāmiʿa'] },
  { ar:'الحَدِيقَةُ',     tr:'al-ḥadīqatu',    de:'der Garten',     art:'mond', falsch:['aḥ-ḥadīqatu','al-ḥadīqa'] },
  { ar:'الخُبْزُ',       tr:'al-chubzu',      de:'das Brot',       art:'mond', falsch:['ach-chubzu','al-chubz'] },
  { ar:'العَمَلُ',       tr:'al-ʿamalu',      de:'die Arbeit',     art:'mond', falsch:['aʿ-ʿamalu','al-ʿamal'] },
  { ar:'الغُرْفَةُ',      tr:'al-ghurfatu',    de:'das Zimmer',     art:'mond', falsch:['agh-ghurfatu','al-ghurfa'] },
  { ar:'الفُنْدُقُ',      tr:'al-funduqu',     de:'das Hotel',      art:'mond', falsch:['af-funduqu','al-funduq'] },
  { ar:'القَلَمُ',       tr:'al-qalamu',      de:'der Stift',      art:'mond', falsch:['aq-qalamu','al-qalam'] },
  { ar:'الكِتَابُ',      tr:'al-kitābu',      de:'das Buch',       art:'mond', falsch:['ak-kitābu','al-kitāb'] },
  { ar:'المَكْتَبَةُ',    tr:'al-maktabatu',   de:'die Bibliothek', art:'mond', falsch:['am-maktabatu','al-maktaba'] },
  { ar:'الهَاتِفُ',      tr:'al-hātifu',      de:'das Telefon',    art:'mond', falsch:['ah-hātifu','al-hātif'] },
  { ar:'الوَلَدُ',       tr:'al-waladu',      de:'der Junge',      art:'mond', falsch:['aw-waladu','al-walad'] },
  { ar:'اليَوْمُ',       tr:'al-yawmu',       de:'der Tag',        art:'mond', falsch:['ay-yawmu','al-yawm'] }
];
