'use strict';

// Regression guard: reported directly - the Frappe Gantt and DHTMLX Gantt
// board views showed English month names in every language. Neither library
// reads WeKan's translations: Frappe takes a `language` tag it hands to
// Intl.DateTimeFormat; DHTMLX takes a locale object and only bundles a fixed
// set of them. client/lib/ganttLocale.js feeds both from Intl so every WeKan
// language gets month/weekday names, and maps WeKan's tags ('ru_RU',
// 'zh-Hans', 'ace', ...) to ones Intl accepts instead of throwing
// RangeError inside a library's render loop.
//
// Run: node tests/ganttLocale.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  const { intlLocaleFor, intlDateNames, dhtmlxLocaleFor } =
    await import('../client/lib/ganttLocale.js');

  console.log('ganttLocale:');

  test('a plain BCP 47 tag passes through', () => {
    assert.strictEqual(intlLocaleFor('fi'), 'fi');
    assert.strictEqual(intlLocaleFor('pt-BR'), 'pt-BR');
  });

  test('WeKan\'s underscore tags are normalised (Intl would throw on them)', () => {
    assert.throws(() => new Intl.DateTimeFormat('ru_RU'), RangeError, 'sanity: the raw tag is rejected');
    assert.strictEqual(intlLocaleFor('ru_RU'), 'ru-RU');
    assert.strictEqual(intlLocaleFor('zh_SG'), 'zh-SG');
  });

  test('an unknown language falls back to its primary subtag, then English (never throws)', () => {
    assert.strictEqual(intlLocaleFor('en-GB'), 'en-GB');
    assert.strictEqual(intlLocaleFor('xx-QQ'), 'en');
    assert.strictEqual(intlLocaleFor(''), 'en');
    assert.strictEqual(intlLocaleFor(undefined), 'en');
    assert.strictEqual(intlLocaleFor('not a tag!'), 'en');
  });

  test('every language WeKan ships resolves without throwing', () => {
    const files = fs.readdirSync(path.join(ROOT, 'imports', 'i18n', 'data'))
      .filter(f => f.endsWith('.i18n.json'));
    assert.ok(files.length > 200);
    for (const f of files) {
      const tag = f.replace('.i18n.json', '');
      const locale = intlLocaleFor(tag);
      assert.doesNotThrow(() => new Intl.DateTimeFormat(locale), `${tag} -> ${locale}`);
    }
  });

  test('month and weekday names come from Intl, in the language asked for', () => {
    const fi = intlDateNames('fi');
    assert.strictEqual(fi.month_full.length, 12);
    assert.strictEqual(fi.month_short.length, 12);
    assert.strictEqual(fi.day_full.length, 7);
    assert.strictEqual(fi.day_short.length, 7);
    assert.strictEqual(fi.month_full[0], 'Tammikuu');
    assert.strictEqual(fi.day_full[0], 'Sunnuntai', 'dhtmlx weekday lists start on Sunday');
    const de = intlDateNames('de');
    assert.strictEqual(de.month_full[2], 'März');
    assert.strictEqual(de.day_full[1], 'Montag');
    assert.strictEqual(intlDateNames('en').month_full[11], 'December');
  });

  test('dhtmlxLocaleFor prefers a locale dhtmlx bundles, else keeps English labels with Intl dates', () => {
    const english = { date: { month_full: ['January'] }, labels: { new_task: 'New task' } };
    const bundledDe = { date: { month_full: ['Januar'] }, labels: { new_task: 'Neue Aufgabe' } };
    const gantt = { i18n: { getLocale: code => (code === 'en' ? english : code === 'de' ? bundledDe : undefined) } };
    assert.strictEqual(dhtmlxLocaleFor(gantt, 'de-AT'), bundledDe);
    const fi = dhtmlxLocaleFor(gantt, 'fi');
    assert.strictEqual(fi.labels, english.labels, 'no bundled Finnish: English labels kept');
    assert.strictEqual(fi.month_full === undefined && fi.date.month_full[0], 'Tammikuu', 'but dates from Intl');
    const en = dhtmlxLocaleFor(gantt, 'en');
    assert.strictEqual(en.labels, english.labels);
    assert.strictEqual(en.date.month_full[0], 'January');
  });

  test('both Gantt views are wired to it', () => {
    const frappe = fs.readFileSync(path.join(ROOT, 'client/components/gantt/frappeGantt.js'), 'utf8');
    assert.ok(/language: intlLocaleFor\(TAPi18n\.getLanguage\(\)\)/.test(frappe));
    const dhtmlx = fs.readFileSync(path.join(ROOT, 'client/components/gantt/dhtmlxGantt.js'), 'utf8');
    assert.ok(/gantt\.i18n\.setLocale\(dhtmlxLocaleFor\(gantt, TAPi18n\.getLanguage\(\)\)\)/.test(dhtmlx));
    assert.ok(dhtmlx.indexOf('gantt.i18n.setLocale(') < dhtmlx.indexOf('gantt.init(container)'),
      'the locale must be set before init');
  });

  console.log(`\nganttLocale: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
