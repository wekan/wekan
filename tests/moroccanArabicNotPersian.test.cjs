'use strict';
// Moroccan Arabic (ary) must be Darija, not Persian. 372 values were Persian -
// "افزودن مسیر شنا" for add-swimlane, "برد" for board, "دوشنبه" for Monday - which
// is not a translation for this locale (CLAUDE.md: the locale tag is
// authoritative). This scans every value for words only Persian has, and pins a
// few repaired ones.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const ary = JSON.parse(fs.readFileSync(path.join(dir, 'ary.i18n.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8'));

// Words of Persian that Darija does not use. Whole words, so a Darija loanword
// that happens to contain one of the letters (كپارامتر) is not flagged.
const PERSIAN = ['افزودن', 'است', 'را', 'های', 'برد', 'برای', 'این', 'شده', 'کردن', 'دوشنبه',
  'یکشنبه', 'چهارشنبه', 'سبز', 'قرمز', 'زرد', 'ناشناخته', 'جست', 'ویرایش'];
function persianWords(value) {
  const words = String(value).split(/[\s.,:;!?()"'«»،؛؟/\-]+/);
  return PERSIAN.filter(w => words.includes(w));
}

const offenders = [];
for (const [key, value] of Object.entries(ary)) {
  const found = persianWords(value);
  if (found.length) offenders.push(`${key}: ${found.join(', ')}`);
  // The Persian-only forms of yeh and kaf as a word's whole spelling of a common
  // Persian word are caught above; the Persian "می‌" verb prefix with ZWNJ here.
  if (/(^|\s)می‌/.test(value)) offenders.push(`${key}: می‌`);
}
assert.deepEqual(offenders, [], 'Persian words in ary.i18n.json');

// The repaired values.
assert.equal(ary['add-swimlane'], 'زيد مسار');
assert.equal(ary.board, 'لوحة');
assert.equal(ary.monday, 'الاثنين');
assert.equal(ary['color-green'], 'خضر');

// Negative: the scan does catch the old strings.
for (const old of ['افزودن مسیر شنا', 'برد', 'جست و جو در همه برد ها', 'دوشنبه', 'انتخاب شده']) {
  assert.ok(persianWords(old).length > 0, `the scan misses ${old}`);
}

// Placeholders stay exactly English's.
const tokens = s => (String(s).match(/__[A-Za-z0-9]+__|%(?:\d+\$)?[sd]/g) || []).sort();
for (const key of Object.keys(en)) {
  if (key in ary) assert.deepEqual(tokens(ary[key]), tokens(en[key]), `${key} placeholders`);
}
console.log('Moroccan Arabic: no Persian-only words, repaired values and placeholders pass');
