'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${name}.i18n.json`), 'utf8'));
const en = read('en');
const zgh = read('zgh');
const syntax = {
  'operator-assignee': 'assignee',
  'operator-due': 'due',
  'operator-modified': 'modified',
  'operator-has': 'has',
  'operator-debug': 'debug',
  'predicate-quarter': 'quarter',
  'predicate-due': 'due',
  'predicate-modified': 'modified',
  'predicate-assignee': 'assignee',
  'predicate-selector': 'selector',
};
for (const [key, value] of Object.entries(syntax)) {
  assert.equal(zgh[key], value, key);
  assert.equal(zgh[key], en[key], `${key}: portable parser keyword`);
  assert.doesNotMatch(zgh[key], /\s|[\u0600-\u06ff]/u, `${key}: one-word syntax`);
}
const native = {
  'predicate-archived': 'ⴰⵔⵛⵉⴼ',
  'predicate-open': 'ⵔⵥⵎ',
  'predicate-ended': 'ⵜⵉⴳⵉⵔⴰ',
  'predicate-description': 'ⴰⴳⵍⴰⵎ',
  'predicate-private': 'ⵓⵙⵍⵉⴳ',
};
for (const [key, value] of Object.entries(native)) {
  assert.equal(zgh[key], value, key);
  assert.doesNotMatch(zgh[key], /[\u0600-\u06ff]/u, `${key}: Arabic seed removed`);
}
assert.equal(zgh['predicate-description'], zgh['operator-description']);
assert.equal(zgh['predicate-private'], zgh.private);
assert.equal(zgh['predicate-ended'], zgh['predicate-end']);
assert.notEqual(zgh['operator-assignee'], zgh.assignee, 'native display prose remains separate from syntax');
assert.match(zgh.assignee, /ⴰⴼⴳⴰⵏ/);
const parser = fs.readFileSync(path.join(root, 'config/query-classes.js'), 'utf8');
for (const key of Object.keys({...syntax, ...native})) {
  assert.ok(parser.includes(`'${key}':`), `${key}: production search registration`);
}
assert.ok(parser.includes('(?<operator>[') && parser.includes('\\\\p{Letter}'),
  'full operator names start with one Unicode word');
console.log('zghSearchPredicateSyntax: native status terms and portable one-word keywords verified');
