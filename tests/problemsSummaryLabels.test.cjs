'use strict';
// Admin Panel / Problems / Summary (2026-11-19, .tools/log/wekan10): "1 new
// problems" did not agree with its number, Data health's "Last Run: ... - 8/31"
// did not say what 8 and 31 were, and the menu said "Memory Usage" beside
// "CPU usage" and "Disk usage". Each label is now one translated sentence with
// its numbers as placeholders, in every locale.
// Run: node --test tests/problemsSummaryLabels.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'imports/i18n/data');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const locales = fs.readdirSync(DIR).filter(f => f.endsWith('.i18n.json')
  && !fs.lstatSync(path.join(DIR, f)).isSymbolicLink());
const load = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const tokens = s => (s.match(/__[A-Za-z0-9]+__|%\d*\$?[sd]/g) || []).sort();
const en = load('en.i18n.json');

test('the summary counts problems and checks through one sentence each', () => {
  const jade = read('client/components/settings/problemsSummary.jade');
  assert.match(jade, /span\.admin-problem-count \{\{_ 'new-problems-count' count=area\.count\}\}/);
  const js = read('client/components/settings/problemsSummary.js');
  const at = js.indexOf('dataHealthStatus() {');
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.match(body, /TAPi18n\.__\('data-health-checks-found', \{ found: d\.found, checks: d\.checks \}\)/);
  assert.strictEqual(en['new-problems-count'], 'New problems: __count__');
  assert.strictEqual(en['data-health-checks-found'], 'Checks with findings: __found__ / __checks__');
  assert.strictEqual(en['memory-usage'], 'Memory usage');
});

test('negative: no bare number is glued to a label any more', () => {
  const jade = read('client/components/settings/problemsSummary.jade');
  assert.doesNotMatch(jade, /\{\{area\.count\}\} \{\{_ 'new-problems'\}\}/);
  const js = read('client/components/settings/problemsSummary.js');
  assert.doesNotMatch(js, /\$\{d\.found\}\/\$\{d\.checks\}/);
});

test('every locale has both sentences, in order, with exactly the English placeholders', () => {
  assert.ok(locales.length > 200);
  for (const f of locales) {
    const j = load(f);
    const keys = Object.keys(j);
    for (const [key, anchor] of [['new-problems-count', 'new-problems'],
      ['data-health-checks-found', 'data-health-never-run']]) {
      assert.ok(typeof j[key] === 'string' && j[key].trim(), `${f}: ${key}`);
      assert.deepStrictEqual(tokens(j[key]), tokens(en[key]), `${f}: ${key} placeholders`);
      assert.strictEqual(keys.indexOf(key), keys.indexOf(anchor) + 1, `${f}: ${key} after ${anchor}`);
      if (!f.startsWith('en')) assert.notStrictEqual(j[key], en[key], `${f}: ${key} is translated`);
    }
  }
});

test('negative: "Memory usage" is no longer wrong-language or split in these locales', () => {
  const fixed = { lv: 'Atmiņas lietojums', nl: 'Geheugengebruik', fy: 'Unthâldgebrûk',
    tl: 'Paggamit ng memorya', tn: 'Tiriso ya segopotso', yo: 'Lílo ìrántí' };
  for (const [tag, value] of Object.entries(fixed)) {
    assert.strictEqual(load(`${tag}.i18n.json`)['memory-usage'], value, tag);
  }
  assert.doesNotMatch(load('ay.i18n.json')['memory-usage'], /Memory|Aymar aruna/);
  // Latvian had Lithuanian text.
  assert.doesNotMatch(load('lv.i18n.json')['memory-usage'], /Atminties|naudojimas/);
  for (const f of locales.filter(n => n.startsWith('en'))) {
    assert.strictEqual(load(f)['memory-usage'], 'Memory usage', f);
  }
});
