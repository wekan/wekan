'use strict';
// Every translated search operator can be typed as the help shows it, in
// every language, and Odia's corrected words keep the old one that worked
// (config/search-const.js, config/query-classes.js; 2026-11-24).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const dir = path.join(root, 'imports/i18n/data');
const locale = tag => JSON.parse(fs.readFileSync(path.join(dir, `${tag}.i18n.json`), 'utf8'));
const SOURCE = read('config/search-const.js').replace(/export /g, '') + '\n' +
  read('config/query-classes.js').replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g, '').replace(/export /g, '') +
  '\nthis.Query = Query; this.rewriteMultiWordOperators = rewriteMultiWordOperators;';

// The production parser, with a language's own words.
function parserFor(labels, language = '') {
  const context = { TAPi18n: { __: key => labels[key] || key, getLanguage: () => language },
    Boards: { colorMap: () => ({}) }, console };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);
  return context;
}
const isOperatorKey = k => /^operator-/.test(k) && !/-(error|expected|invalid|number|abbrev)$/.test(k);
const en = locale('en');

test('a multi-word operator typed as shown works, negated and in any case too', () => {
  const { Query } = parserFor({ ...en, 'operator-board': 'pasgemaakte veld' });
  for (const text of ['pasgemaakte veld:Roadmap', 'Pasgemaakte Veld:Roadmap', 'pasgemaakteveld:Roadmap']) {
    const q = new Query();
    q.buildParams(text);
    assert.equal(q.hasErrors(), false, text);
    assert.equal(q.getQueryParams().getPredicate('board'), 'Roadmap', text);
  }
});

test('negative: a word that only contains the operator is plain text, not the operator', () => {
  const { rewriteMultiWordOperators } = parserFor(en);
  assert.equal(rewriteMultiWordOperators('xpasgemaakte veld:prio', ['pasgemaakte veld']), 'xpasgemaakte veld:prio');
  assert.equal(rewriteMultiWordOperators('pasgemaakte veld', ['pasgemaakte veld']), 'pasgemaakte veld');
});

test('in every language, every operator typed as the help shows it is read by the parser', () => {
  const failures = [];
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.i18n.json'))) {
    const labels = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const { Query } = parserFor(labels);
    for (const [k, v] of Object.entries(labels)) {
      if (!isOperatorKey(k) || k === 'operator-debug') continue;
      const q = new Query();
      q.buildParams(`${v}:abc`);
      // A value this operator rejects ("abc" is no status) is fine here; the
      // fault is the operator itself not being recognised.
      if (q._errors.errors().some(e => e.tag === 'operator-unknown-error')) failures.push(`${f}:${k} "${v}"`);
    }
  }
  assert.deepEqual(failures.slice(0, 20), [], `${failures.length} operators are not read`);
});

test('Odia: every operator is one typable word, and the old swimlane word still works', () => {
  const or = locale('or_IN');
  const bad = Object.entries(or).filter(([k, v]) => isOperatorKey(k) && !/^[\p{Letter}\p{Mark}'’]+$/u.test(v));
  assert.deepEqual(bad, []);
  const { Query } = parserFor(or, 'or_IN');
  for (const word of [or['operator-swimlane'], 'ସନ୍ତରଣ']) {
    const q = new Query();
    q.buildParams(`${word}:Backlog`);
    assert.equal(q.hasErrors(), false, word);
    assert.equal(q.getQueryParams().getPredicate('swimlane'), 'Backlog', word);
  }
  // Negative: in another language the Odia word is no operator.
  const q = new (parserFor(en, 'en').Query)();
  q.buildParams('ସନ୍ତରଣ:Backlog');
  assert.equal(q.hasErrors(), true);
});
