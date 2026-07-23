/* data-curriculum.js — Lehrplan Stufe 1: 12 Lektionen vom ersten Buchstaben
   bis zum flüssigen Lesen. Reihenfolge ist pädagogisch (Formähnlichkeit,
   steigende Schwierigkeit), nicht identisch mit der Bibliotheks-Gruppierung
   in data-letters.js. Lektionen 11/12 (Sonderzeichen, Sonnen-/Mondbuchstaben)
   sind als Kapitel bereits sichtbar, ihr Inhalt folgt in AP 1.3. */

var STUFE1_LEKTIONEN = [
  { id:1,  titel:'Erste Formen',            titelAr:'الحروف الأولى',            typ:'buchstaben', letters:['ا','ب','ت','ث'] },
  { id:2,  titel:'Kehllaute',                titelAr:'حروف الحلق',               typ:'buchstaben', letters:['ج','ح','خ'] },
  { id:3,  titel:'Nicht verbindende Laute',  titelAr:'حروف لا تتصل',             typ:'buchstaben', letters:['د','ذ','ر','ز'] },
  { id:4,  titel:'Zischlaute',                titelAr:'حروف الصفير',              typ:'buchstaben', letters:['س','ش','ص','ض'] },
  { id:5,  titel:'Nachdrückliche Laute',     titelAr:'حروف مطبقة',               typ:'buchstaben', letters:['ط','ظ','ع','غ'] },
  { id:6,  titel:'Klare Konsonanten',        titelAr:'حروف واضحة',               typ:'buchstaben', letters:['ف','ق','ك','ل'] },
  { id:7,  titel:'Letzte Formen',            titelAr:'الحروف الأخيرة',           typ:'buchstaben', letters:['م','ن','ه','و','ي'] },
  { id:8,  titel:'Kurze Vokale & Sukun',     titelAr:'الحركات القصيرة والسكون',  typ:'harakat',
    harakatIds:['fatha','kasra','damma','sukun'], woerterTitel:['Sukun sehen'] },
  { id:9,  titel:'Lange Vokale & Silbenlesen', titelAr:'حروف المدّ',              typ:'madd',
    harakatIds:['madd-a','madd-i','madd-u'], woerterTitel:['Lange Vokale (Madd)'] },
  { id:10, titel:'Schadda & Tanwin',         titelAr:'الشدّة والتنوين',          typ:'tanwin',
    harakatIds:['schadda','fathatan','kasratan','dammatan'], woerterTitel:['Schadda sehen','Tanwin sehen — an · in · un'] },
  { id:11, titel:'Sonderzeichen',            titelAr:'حروف خاصة',                typ:'sonderzeichen', contentPending:true },
  { id:12, titel:'Sonnen- & Mondbuchstaben', titelAr:'الحروف الشمسية والقمرية',  typ:'sonne-mond',    contentPending:true }
];
