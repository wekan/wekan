'use strict';

// Search phrases in plain language (docs/Features/Pages/Search-Phrases.md).
//
// Run: node tests/searchPhrases.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { PHRASES, rewriteSearchPhrases } = require('../models/lib/searchPhrases.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const locale = tag => JSON.parse(read(`imports/i18n/data/${tag}.i18n.json`));
const en = locale('en');
const fi = locale('fi');
const tr = dict => key => dict[key] || en[key] || key;

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('searchPhrases:');

test('the table of the guide, in English', () => {
  const run = q => rewriteSearchPhrases(q, { translate: tr(en), username: 'alice' }).query;
  assert.strictEqual(run('my overdue cards printer'), 'user:alice due:overdue printer');
  assert.strictEqual(run('My Cards'), 'user:alice');
  assert.strictEqual(run('due this week'), 'due:7');
  assert.strictEqual(run('unassigned cards'), 'has:-assignee');
  assert.strictEqual(run('cards without due date'), 'has:-due');
  assert.strictEqual(run('created today'), 'created:1');
  assert.strictEqual(run('changed this week'), 'modified:7');
  assert.strictEqual(run('archived cards'), 'status:archived');
  assert.strictEqual(run('cards with attachments'), 'has:attachment');
});

test('the reader\'s language, its operator names, and English beside it', () => {
  const run = q => rewriteSearchPhrases(q, { translate: tr(fi), username: 'liisa' }).query;
  const expected = `${fi['operator-user']}:liisa ${fi['operator-due']}:${fi['predicate-overdue']} tulostin`;
  assert.strictEqual(run(`${fi['search-phrase-my-overdue-cards']} tulostin`), expected);
  assert.strictEqual(run('my overdue cards tulostin'), expected, 'the English phrase in Finnish');
});

test('operators, unknown words and empty queries are never rewritten (negative)', () => {
  const opts = { translate: tr(en), username: 'alice' };
  assert.deepStrictEqual(rewriteSearchPhrases('user:bob my cards', opts), { query: 'user:bob my cards', matched: false });
  assert.deepStrictEqual(rewriteSearchPhrases('printer toner', opts), { query: 'printer toner', matched: false });
  assert.deepStrictEqual(rewriteSearchPhrases('', opts), { query: '', matched: false });
  assert.strictEqual(rewriteSearchPhrases('cards', opts).matched, false, 'a single word of a phrase is not the phrase');
});

test('every phrase is a key every language has, and keeps no placeholder', () => {
  for (const tag of fs.readdirSync(path.join(ROOT, 'imports/i18n/data')).map(f => f.replace('.i18n.json', ''))) {
    const dict = locale(tag);
    for (const phrase of PHRASES) {
      assert.ok(dict[phrase.key], `${tag} ${phrase.key}`);
      assert.ok(!/__|:/.test(dict[phrase.key]), `${tag} ${phrase.key} is a phrase, not an operator`);
    }
  }
  for (const phrase of PHRASES) assert.strictEqual(en[phrase.key], phrase.en);
});

test('global search uses it behind its Admin Panel / Visibility / Features tick, and says what it ran', () => {
  const js = read('client/components/main/globalSearch.js');
  assert.match(js, /if \(allowFeature\('search-phrases'\)\) \{\n\s+const phrased = rewriteSearchPhrases\(queryText,/);
  assert.match(js, /query\.buildParams\(parsedText\);/);
  assert.match(read('client/components/main/globalSearch.jade'), /if phrasedQuery\n\s+\.global-search-phrased\.js-search-phrased \{\{_ 'search-phrases-searching' query=phrasedQuery\}\}/);
  const { FEATURES } = require('../models/lib/instanceFeatures.js');
  assert.ok(FEATURES.some(f => f.key === 'search-phrases' && f.views.length === 0));
});

console.log(`\nsearchPhrases: ${passed} tests passed`);
