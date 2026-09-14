'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/gv.i18n.json')));
assert.equal(data['calendar-system-islamic-civil'], 'Feaillere Hijri (taablagh, dait toshee shivoil)');
assert.equal(data['calendar-system-islamic-tbla'], 'Feaillere Hijri (taablagh, dait toshee rollageagh)');
assert.notEqual(data['calendar-system-islamic-civil'], data['calendar-system-islamic-tbla']);
for (const key of ['calendar-system-islamic-civil', 'calendar-system-islamic-tbla']) assert.doesNotMatch(data[key], /Islamic civil|Islamic tabular/);
console.log('manxCalendarEpochs: tabular variants retain distinct civil and astronomical starting dates');

// Coptic must identify a calendar rather than leave the English-only placeholder.
// Coptagh is provisional terminology, so this verifies the repair, not fluency.
assert.equal(data['calendar-system-coptic'], 'Feaillere Coptagh');
assert.notEqual(data['calendar-system-coptic'], 'Coptic');
