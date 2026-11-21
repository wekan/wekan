'use strict';

// No locale holds English behind a label. Aymara had 480 values written as
// "Aymar aruna: <the English>" ("In Aymara: ..."), Setswana 116 as
// "Tshedimosetso: <the English>", Luxembourgish, Sindhi, Northern Sami and
// Hawaiian a few each: a fill that put a word of the language in front of the
// English source and called it a translation. It is English, and the
// translation rules (CLAUDE.md) replace wrong-language text with the
// language the file is for. This guard checks every locale, so the shape
// cannot come back in any of them.
// Run: node tests/prefixedEnglishValues.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en.i18n.json'), 'utf8'));

// "<up to 40 characters>: <the English value>", for English worth translating.
function prefixedEnglish(value, english) {
  if (typeof value !== 'string' || typeof english !== 'string' || english.length < 4) return false;
  const at = value.indexOf(': ');
  return at > 0 && at < 40 && value.slice(at + 2) === english;
}

let checked = 0;
const found = [];
for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.i18n.json') && !/^en([-_.]|\.i18n)/.test(f))) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    checked += 1;
    if (prefixedEnglish(value, en[key])) found.push(`${file} ${key}: ${value.slice(0, 80)}`);
  }
}
assert.ok(checked > 100000, `every locale is read (${checked} values)`);
assert.deepEqual(found, [], 'English behind a prefix is not a translation');

// Negative: the check finds the shape, and leaves a real translation that
// happens to have a colon alone.
assert.equal(prefixedEnglish('Aymar aruna: Actions', 'Actions'), true);
assert.equal(prefixedEnglish('Lurawinaka', 'Actions'), false);
assert.equal(prefixedEnglish('Huomio: Toiminnot', 'Actions'), false);

console.log(`prefixedEnglishValues: ${checked} values checked, none is English behind a prefix`);
