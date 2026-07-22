#!/usr/bin/env node
/* Syntax-Check: alle JS-Module + vokabeln.js + das Inline-Skript-Rest von index.html. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
let fehler = 0;

function check(file) {
  try {
    cp.execSync(`node --check ${JSON.stringify(file)}`, { stdio: 'pipe' });
    console.log('OK  ' + path.relative(root, file));
  } catch (e) {
    fehler++;
    console.error('FEHLER ' + path.relative(root, file) + '\n' + (e.stderr || e.stdout || e).toString());
  }
}

// alle Module unter js/
const jsDir = path.join(root, 'js');
fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).forEach(f => check(path.join(jsDir, f)));
// Vokabeldaten
check(path.join(root, 'vokabeln.js'));

// Prüfen, dass index.html kein Inline-<script> mit Logik mehr enthält (nur externe Verweise)
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const inlineScripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi) || [];
const nonEmpty = inlineScripts.filter(s => s.replace(/<\/?script[^>]*>/gi, '').trim().length > 0);
if (nonEmpty.length) {
  fehler++;
  console.error('FEHLER index.html enthält ' + nonEmpty.length + ' Inline-<script>-Block/Blöcke mit Code (erwartet: 0).');
} else {
  console.log('OK  index.html (kein Inline-Skript-Code)');
}

if (fehler) { console.error('\n' + fehler + ' Problem(e) gefunden.'); process.exit(1); }
console.log('\nAlle Syntax-Checks bestanden.');
