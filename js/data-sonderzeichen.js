/* data-sonderzeichen.js — Lektion 11: Sonderzeichen, die in Stufe 1 sonst
   fehlen würden (Hamza auf allen Trägern, Tāʾ marbūṭa, Alif maqṣūra,
   Alif madda, Lām-Alif-Ligatur, Alif waṣla). Ohne diese kann kein Wort
   zuverlässig gelesen werden — größte fachliche Lücke aus der Analyse. */

var SONDERZEICHEN = [
  { id:'hamza-alif-oben', zeichen:'أ', name:'Hamza auf Alif', tr:'ʾa/ʾu',
    desc:'Ein Hamza-Sitz auf dem Alif — steht meist am Wortanfang mit Fatha oder Damma.',
    hilfe:'Hamza oben = fester Stimmeinsatz, direkt gefolgt von „a" oder „u".',
    beispiele:[
      { ar:'أَسَدٌ', tr:'asadun', de:'ein Löwe', falsch:['sadun','asadan'] },
      { ar:'أُذُنٌ', tr:'udunun', de:'ein Ohr', falsch:['dunun','udunan'] }
    ] },
  { id:'hamza-alif-unten', zeichen:'إ', name:'Hamza unter Alif', tr:'ʾi',
    desc:'Ein Hamza-Sitz unter dem Alif — steht am Wortanfang immer mit Kasra.',
    hilfe:'Hamza unten = derselbe Knacklaut wie oben, aber immer mit „i" danach.',
    beispiele:[
      { ar:'إِنْسَانٌ', tr:'insānun', de:'ein Mensch', falsch:['nsānun','ansānun'] },
      { ar:'إِبْرَةٌ', tr:'ibratun', de:'eine Nadel', falsch:['abratun','ibratan'] }
    ] },
  { id:'hamza-waw', zeichen:'ؤ', name:'Hamza auf Wāw', tr:'ʾ (nach u)',
    desc:'Hamza auf einem kleinen Wāw als Sitz — meist in der Wortmitte nach einer Damma.',
    hilfe:'Kleines و trägt den Knacklaut, wenn davor ein u-Laut steht.',
    beispiele:[
      { ar:'سُؤَالٌ', tr:'suʾālun', de:'eine Frage', falsch:['suwālun','suālun'] },
      { ar:'فُؤَادٌ', tr:'fuʾādun', de:'ein Herz', falsch:['fuwādun','fuādun'] }
    ] },
  { id:'hamza-ya', zeichen:'ئ', name:'Hamza auf Yāʾ', tr:'ʾ (nach i)',
    desc:'Hamza auf einem punktlosen Yāʾ als Sitz — meist in der Wortmitte nach einer Kasra.',
    hilfe:'Kleines ي trägt den Knacklaut, wenn davor ein i-Laut steht.',
    beispiele:[
      { ar:'بِئْرٌ', tr:'biʾrun', de:'ein Brunnen', falsch:['biyrun','birun'] },
      { ar:'قَارِئٌ', tr:'qāriʾun', de:'ein Leser', falsch:['qāriyun','qārian'] }
    ] },
  { id:'hamza-linie', zeichen:'ء', name:'Hamza auf der Linie', tr:'ʾ (frei)',
    desc:'Hamza ganz ohne Sitz, freistehend — meist nach einem langen Vokal oder am Wortende.',
    hilfe:'Kein Buchstabe darunter oder darüber: das Hamza steht ganz für sich allein.',
    beispiele:[
      { ar:'شَيْءٌ', tr:'schayʾun', de:'ein Ding', falsch:['schayun','schaywun'] },
      { ar:'سَمَاءٌ', tr:'samāʾun', de:'ein Himmel', falsch:['samāun','samāwun'] }
    ] },
  { id:'ta-marbuta', zeichen:'ة', name:'Tāʾ marbūṭa', tr:'-a / -at',
    desc:'Das „geschlossene Tāʾ" — steht fast immer am Ende weiblicher Wörter. In der Pause klingt es wie „a", vor einem folgenden Wort (z. B. in Verbindungen) wie „-at".',
    hilfe:'Zwei Punkte über einem ه = sieht aus wie ه, klingt aber wie „a" (oder „-at" mitten im Satz).',
    beispiele:[
      { ar:'مَدْرَسَةٌ', tr:'madrasatun', de:'eine Schule', falsch:['madrasah','madrasatan'] },
      { ar:'سَيَّارَةٌ', tr:'sayyāratun', de:'ein Auto', falsch:['sayyārah','sayyāratan'] }
    ] },
  { id:'alif-maqsura', zeichen:'ى', name:'Alif maqṣūra', tr:'ā (am Ende)',
    desc:'Sieht aus wie ein Yāʾ ohne Punkte, steht aber für ein langes „ā" am Wortende.',
    hilfe:'Kein Punkt unter dem Yāʾ-Ersatz — trotzdem langes „a", nicht „i".',
    beispiele:[
      { ar:'عَلَى', tr:'ʿalā', de:'auf (Präposition)', falsch:['ʿalī','ʿalaya'] },
      { ar:'مُسْتَشْفَى', tr:'mustaschfā', de:'ein Krankenhaus', falsch:['mustaschfī','mustaschfan'] }
    ] },
  { id:'alif-madda', zeichen:'آ', name:'Alif madda', tr:'ʾā',
    desc:'Alif mit dem Madda-Zeichen darüber — verschmilzt Hamza und langes Alif zu einem kräftigen „ā".',
    hilfe:'Die kleine Welle über dem Alif = Hamza und Alif in einem Zeichen zusammen.',
    beispiele:[
      { ar:'قُرْآنٌ', tr:'qurʾānun', de:'ein Koran', falsch:['qurānun','qurʾanun'] },
      { ar:'آخَرُ', tr:'ākharu', de:'ein anderer', falsch:['akharu','āchiru'] }
    ] },
  { id:'lam-alif', zeichen:'لا', name:'Lām-Alif-Ligatur', tr:'lā',
    desc:'Wenn ل direkt von ا gefolgt wird, verschmelzen beide zu dieser Pflicht-Ligatur. Das Wort لا bedeutet für sich allein „nein / nicht".',
    hilfe:'Diese Form MUSS so geschrieben werden — ل und ا stehen nie einzeln nebeneinander.',
    beispiele:[
      { ar:'لا', tr:'lā', de:'nein / nicht', falsch:['la','al'] },
      { ar:'مَلَابِسُ', tr:'malābisu', de:'Kleidung', falsch:['malabisu','malābisun'] }
    ] },
  { id:'alif-wasla', zeichen:'ٱ', name:'Alif waṣla (Verbindungs-Hamza)', tr:'stumm im Satz',
    desc:'Ein Alif, das nur ganz am Satzanfang einen Hamza-Laut trägt. Steht ein Wort davor, wird es stumm — beide Wörter verschmelzen im Sprechfluss.',
    hilfe:'Nach einem Vokal verschwindet dieses Alif einfach — sprich direkt weiter, ohne neuen Knacklaut.',
    beispiele:[
      { ar:'ٱسْمٌ', tr:'ismun', de:'ein Name', falsch:['ʾismun','asmun'] },
      { ar:'ٱبْنٌ', tr:'ibnun', de:'ein Sohn', falsch:['ʾibnun','abnun'] }
    ] }
];

var ALLE_SONDERZEICHEN_WOERTER = [];
SONDERZEICHEN.forEach(function(s){
  s.beispiele.forEach(function(w){ ALLE_SONDERZEICHEN_WOERTER.push(w); });
});

function findSonderzeichen(id){
  for(var i=0;i<SONDERZEICHEN.length;i++){ if(SONDERZEICHEN[i].id === id) return SONDERZEICHEN[i]; }
  return null;
}
