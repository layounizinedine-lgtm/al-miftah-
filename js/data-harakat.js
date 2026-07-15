/* data-harakat.js — Vokalzeichen (Harakat, Tanwin, Madd). */

/* ============================================================
   HARAKAT — Vokalzeichen (Daten + Ansicht + Übung)
   ============================================================ */
var HARAKAT = [
  { id:'fatha',  gruppe:'Die kurzen Vokale', zeichen:'\u064E', name:'Fatha',  beispiel:'بَ', tr:'ba',
    desc:'Kurzes „a". Ein kleiner Strich ÜBER dem Buchstaben.',
    hilfe:'Strich oben = Mund weit AUF = „a".' },
  { id:'kasra',  gruppe:'Die kurzen Vokale', zeichen:'\u0650', name:'Kasra',  beispiel:'بِ', tr:'bi',
    desc:'Kurzes „i". Ein kleiner Strich UNTER dem Buchstaben.',
    hilfe:'Strich unten = Stimme geht runter-spitz = „i".' },
  { id:'damma',  gruppe:'Die kurzen Vokale', zeichen:'\u064F', name:'Damma',  beispiel:'بُ', tr:'bu',
    desc:'Kurzes „u". Eine kleine Schleife (wie ein Mini-Waw) über dem Buchstaben.',
    hilfe:'Sieht aus wie ein kleines و (w) = runde Lippen = „u".' },
  { id:'madd-a', gruppe:'Die langen Vokale (Madd)', zeichen:'\u064E\u0627', name:'Langes ā — Fatha + Alif', beispiel:'بَا', tr:'bā',
    desc:'Langes „aa". Nach der Fatha folgt ein Alif — der Vokal wird gedehnt gesprochen.',
    hilfe:'Alif nach Fatha = das „a" in die Länge ziehen: baaa.' },
  { id:'madd-i', gruppe:'Die langen Vokale (Madd)', zeichen:'\u0650\u064A', name:'Langes ī — Kasra + Yāʾ', beispiel:'بِي', tr:'bī',
    desc:'Langes „ii". Nach der Kasra folgt ein Yāʾ ohne eigenen Vokal.',
    hilfe:'Yāʾ nach Kasra = das „i" dehnen: biii.' },
  { id:'madd-u', gruppe:'Die langen Vokale (Madd)', zeichen:'\u064F\u0648', name:'Langes ū — Damma + Wāw', beispiel:'بُو', tr:'bū',
    desc:'Langes „uu". Nach der Damma folgt ein Wāw ohne eigenen Vokal.',
    hilfe:'Wāw nach Damma = das „u" dehnen: buuu.' },
  { id:'fathatan', gruppe:'Tanwin — die Doppelzeichen am Wortende', zeichen:'\u064B', name:'Fathatan — Tanwin „an"', beispiel:'بًا', tr:'ban',
    desc:'DOPPELTE Fatha am Wortende: gesprochen „an". Meist steht dahinter ein stummes Alif als Träger.',
    hilfe:'Zwei Striche oben = a + n hinterher: „an". Wie in شُكْرًا (schukran).' },
  { id:'kasratan', gruppe:'Tanwin — die Doppelzeichen am Wortende', zeichen:'\u064D', name:'Kasratan — Tanwin „in"', beispiel:'بٍ', tr:'bin',
    desc:'DOPPELTE Kasra am Wortende: gesprochen „in". Zwei kleine Striche UNTER dem Buchstaben.',
    hilfe:'Zwei Striche unten = i + n hinterher: „in". Wie in بَيْتٍ (baitin).' },
  { id:'dammatan', gruppe:'Tanwin — die Doppelzeichen am Wortende', zeichen:'\u064C', name:'Dammatan — Tanwin „un"', beispiel:'بٌ', tr:'bun',
    desc:'DOPPELTE Damma am Wortende: gesprochen „un". Sieht aus wie eine Damma mit einem Häkchen.',
    hilfe:'Doppelte Schleife oben = u + n hinterher: „un". Wie in كِتَابٌ (kitābun).' },
  { id:'sukun',  gruppe:'Die Sonderzeichen', zeichen:'\u0652', name:'Sukun',  beispiel:'بْ', tr:'b',
    desc:'KEIN Vokal. Der Buchstabe wird „nackt" gesprochen, der Fluss stoppt kurz.',
    hilfe:'Der kleine Kreis = Stopp-Schild: hier kommt kein Vokal.' },
  { id:'schadda',gruppe:'Die Sonderzeichen', zeichen:'\u0651', name:'Schadda', beispiel:'بّ', tr:'bb',
    desc:'Verdopplung. Der Buchstabe wird doppelt/verstärkt gesprochen.',
    hilfe:'Sieht aus wie ein kleines w = „wiederholen": Buchstabe zählt doppelt.' }
];

