/* auth-sync.js — Supabase-Auth & Cloud-Sync des Lernfortschritts. */

// --- Supabase-Konfiguration (anon/publishable key ist bewusst öffentlich) ---
var SUPABASE_URL = 'https://tbvonsklczjrtgfckptn.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_G6wG6xW5ZwgY8ithsXE63Q_FRXrBoYi';
var supa = null;
var currentUser = null;        // { id, email }
var authMode = 'login';        // 'login' | 'signup'
var authBusy = false;
var lastSyncAt = 0;            // Zeitstempel des letzten erfolgreichen Syncs
var pendingSync = false;       // true, wenn ein Upload offline scheiterte

function initSupabase(){
  try {
    if(window.supabase && window.supabase.createClient){
      supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // bestehende Sitzung wiederherstellen
      supa.auth.getSession().then(function(res){
        if(res && res.data && res.data.session){
          currentUser = { id: res.data.session.user.id, email: res.data.session.user.email };
          onLoggedIn();
        }
        updateAccountUI();
      });
      supa.auth.onAuthStateChange(function(_evt, session){
        currentUser = session ? { id: session.user.id, email: session.user.email } : null;
        updateAccountUI();
      });
    }
  } catch(e){ /* offline oder Lib nicht geladen — App läuft lokal weiter */ }
}

/* ---------- Auth-UI ---------- */
function openAuth(){
  if(currentUser){
    // eingeloggt → Abmelden anbieten
    if(confirm('Als ' + currentUser.email + ' angemeldet.\nMöchtest du dich abmelden?')){ logout(); }
    return;
  }
  document.getElementById('auth-overlay').classList.add('active');
  setAuthError('');
}
function closeAuth(){ document.getElementById('auth-overlay').classList.remove('active'); }
function toggleAuthMode(){
  authMode = (authMode === 'login') ? 'signup' : 'login';
  document.getElementById('auth-title').textContent = (authMode==='login') ? 'Anmelden' : 'Registrieren';
  document.getElementById('auth-submit').textContent = (authMode==='login') ? 'Anmelden' : 'Konto erstellen';
  document.getElementById('auth-switch-text').textContent = (authMode==='login') ? 'Noch kein Konto?' : 'Schon ein Konto?';
  document.getElementById('auth-switch-btn').textContent = (authMode==='login') ? 'Registrieren' : 'Anmelden';
  document.getElementById('auth-intro').textContent = (authMode==='login')
    ? 'Melde dich an, damit dein Fortschritt geräteübergreifend gespeichert wird.'
    : 'Erstelle ein Konto, damit dein Fortschritt sicher in der Cloud liegt.';
  setAuthError('');
}
function setAuthError(msg){ document.getElementById('auth-error').textContent = msg || ''; }

function submitAuth(){
  if(authBusy) return;
  if(!supa){ setAuthError('Keine Verbindung zum Server. Bist du online?'); return; }
  var email = document.getElementById('auth-email').value.trim();
  var pass = document.getElementById('auth-pass').value;
  if(!email || !pass){ setAuthError('Bitte E-Mail und Passwort eingeben.'); return; }
  if(pass.length < 6){ setAuthError('Das Passwort braucht mindestens 6 Zeichen.'); return; }

  authBusy = true;
  var btn = document.getElementById('auth-submit');
  btn.disabled = true; btn.textContent = 'Moment…';

  var op = (authMode === 'login')
    ? supa.auth.signInWithPassword({ email: email, password: pass })
    : supa.auth.signUp({ email: email, password: pass });

  op.then(function(res){
    authBusy = false; btn.disabled = false;
    btn.textContent = (authMode==='login') ? 'Anmelden' : 'Konto erstellen';
    if(res.error){ setAuthError(uebersetzeAuthFehler(res.error.message)); return; }
    if(authMode === 'signup' && res.data && res.data.user && !res.data.session){
      setAuthError('Fast fertig! Bitte bestätige deine E-Mail und melde dich dann an.');
      authMode = 'login';
      return;
    }
    if(res.data && res.data.user){
      currentUser = { id: res.data.user.id, email: res.data.user.email };
      closeAuth();
      onLoggedIn();
      updateAccountUI();
    }
  }, function(){
    authBusy = false; btn.disabled = false;
    btn.textContent = (authMode==='login') ? 'Anmelden' : 'Konto erstellen';
    setAuthError('Etwas ist schiefgelaufen. Versuch es nochmal.');
  });
}

function uebersetzeAuthFehler(msg){
  msg = (msg || '').toLowerCase();
  if(msg.indexOf('invalid login') >= 0) return 'E-Mail oder Passwort stimmt nicht.';
  if(msg.indexOf('already registered') >= 0 || msg.indexOf('already been registered') >= 0) return 'Diese E-Mail ist schon registriert. Melde dich an.';
  if(msg.indexOf('email') >= 0 && msg.indexOf('invalid') >= 0) return 'Diese E-Mail-Adresse sieht ungültig aus.';
  return 'Es gab ein Problem. Versuch es bitte erneut.';
}

function logout(){
  if(supa){ supa.auth.signOut(); }
  currentUser = null;
  updateAccountUI();
}

function updateAccountUI(){
  var btn = document.getElementById('account-btn');
  var sub = document.getElementById('account-sub');
  if(!btn || !sub) return;
  if(currentUser){
    btn.textContent = 'Konto';
    var name = currentUser.email.length > 18 ? currentUser.email.slice(0,16)+'…' : currentUser.email;
    sub.textContent = name;
  } else {
    btn.textContent = 'Anmelden';
    sub.textContent = 'Nicht angemeldet';
  }
}

/* ---------- Cloud-Sync mit Merge (kein blindes Überschreiben!) ---------- */
function onLoggedIn(){
  if(!supa || !currentUser) return;
  supa.from('almiftah_progress').select('*').eq('user_id', currentUser.id).maybeSingle()
    .then(function(res){
      if(res.error){ /* Tabelle evtl. noch nicht angelegt — lokal weiterarbeiten */ return; }
      if(res.data){ mergeCloudIntoLocal(res.data); }
      // nach dem Mergen den zusammengeführten Stand hochladen
      pushProgress();
    }, function(){ /* offline */ });
}

function mergeCloudIntoLocal(row){
  // SRS: pro Schlüssel gewinnt höhere Box bzw. späteres due
  try {
    var cloudSrs = row.srs_data || {};
    for(var key in cloudSrs){
      if(!cloudSrs.hasOwnProperty(key)) continue;
      if(key === '_exams'){
        // Prüfungen: bestanden bleibt bestanden (Vereinigung)
        var ce = cloudSrs[key] || {};
        for(var st in ce){
          if(!ce.hasOwnProperty(st)) continue;
          if(ce[st] && ce[st].passed){
            if(!examData[st] || !examData[st].passed){ examData[st] = ce[st]; }
            else { examData[st].best = Math.max(examData[st].best || 0, ce[st].best || 0); }
          }
        }
        saveExams();
        continue;
      }
      var c = cloudSrs[key], l = srsData[key];
      if(!l){ srsData[key] = c; }
      else {
        srsData[key] = {
          box: Math.max(l.box || 1, c.box || 1),
          due: Math.max(l.due || 0, c.due || 0),
          seen: (l.seen || c.seen) ? true : false
        };
      }
    }
    saveSRS();
  } catch(e){}
  // done-Buchstaben: Vereinigung
  try {
    var cloudDone = row.done_letters || [];
    for(var i=0;i<cloudDone.length;i++){ doneLetters.add(cloudDone[i]); }
    saveDone(doneLetters);
  } catch(e){}
  lastSyncAt = Date.now();
  if(typeof renderLetters === 'function') renderLetters();
  if(typeof updateDaily === 'function') updateDaily();
}

function pushProgress(){
  if(!supa || !currentUser){ return; }
  var srsMitExams = {};
  for(var k in srsData){ if(srsData.hasOwnProperty(k)) srsMitExams[k] = srsData[k]; }
  srsMitExams['_exams'] = examData;
  var payload = {
    user_id: currentUser.id,
    srs_data: srsMitExams,
    done_letters: Array.from(doneLetters),
    updated_at: new Date().toISOString()
  };
  supa.from('almiftah_progress').upsert(payload, { onConflict: 'user_id' })
    .then(function(res){
      if(res.error){ pendingSync = true; }
      else { pendingSync = false; lastSyncAt = Date.now(); }
    }, function(){ pendingSync = true; });
}

// Nach jeder Lern-Session hochladen (nicht nach jeder einzelnen Antwort)
function syncAfterSession(){
  if(currentUser){ pushProgress(); }
}

// Falls ein Upload offline scheiterte: beim nächsten Online-Moment nachholen
window.addEventListener('online', function(){
  if(currentUser && pendingSync){ onLoggedIn(); }
});

