'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = locale => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${locale}.i18n.json`), 'utf8'));
const source = read('en')['advanced-filter-description'];
const examples = ['== != <= >= && || ( )', 'Field1 == Value1', "'Field 1' == 'Value 1'", "(' \\/)", "Field1 == I\\'m", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i'];
(async () => {
  const { repairProgress } = await import('../releases/translations/audit-progress.mjs');
  const result = repairProgress();
  for (const locale of ['ar', 'ar-DZ', 'ar-EG', 'lt', 'mn', 'el', 'el-GR', 'sk', 'eo']) {
    const data = read(locale);
    const help = data['advanced-filter-description'];
    assert.notEqual(help, source, locale);
    assert.doesNotMatch(help, /Advanced Filter allows|For Example|For single control characters/, `${locale}: English prose removed`);
    for (const example of examples) {
      assert.ok(source.includes(example), `valid source example: ${example}`);
      assert.ok(help.includes(example), `${locale}: preserve executable example ${example}`);
    }
    assert.equal(result.pendingByLocale[locale], undefined, `${locale}: audit queue resolved`);
    if (locale.startsWith('ar')) {
      assert.match(help, /المرشح المتقدم/);
      assert.match(data['import-board-instruction-trello'], /«Menu»، ثم «More»، ثم «Print and Export»، ثم «Export JSON»/);
      assert.doesNotMatch(data['import-board-instruction-trello'], /In your Trello board/);
    }
  }
  assert.match(read('eo')['advanced-filter-description'], /specialajn signojn.*literalajn signojn/);
  assert.doesNotMatch(read('eo')['advanced-filter-description'], /regsignojn|Kampo1|Valoro1/);
  // Veps prose and the syntax-bearing examples are both repaired.
  const vepsHelp = read('ve-PP')['advanced-filter-description'];
  for (const example of examples) {
    assert.ok(vepsHelp.includes(example), `Veps: exact executable example ${example}`);
  }
  assert.deepEqual(vepsHelp.match(/\\+/g), source.match(/\\+/g),
    'Veps: standalone escape markers match source inventory');
  assert.equal(result.pendingByLocale['ve-PP'], undefined,
    'Veps tracked language queue is resolved');
  assert.ok(!vepsHelp.includes("Field1 = I"), 'Veps: reject malformed comparison');
  assert.match(vepsHelp, /^Levenzoittud puhtastim/,
    'Veps: use the established advanced-filter title');
  assert.match(vepsHelp, /kävutajan märitud pöudod.*nimed da znamoičendad/,
    'Veps: retain custom field names and values');
  assert.match(vepsHelp, /huralpäi oigedale.*suluiden abul/,
    'Veps: retain left-to-right evaluation and bracket ordering');
  assert.doesNotMatch(vepsHelp,
    /Edistynyt|suodatin|mahdollistaa|merkkijonon|seuraavat|välilyöntiä|Esimerkiksi|Huom|Yleensä|vasemmalta|oikealle/,
    'Veps: Finnish prose is removed');
  // Tamazight full prose is repaired; executable syntax stays exact.
  const tamazightHelp = read('zgh')['advanced-filter-description'];
  for (const example of examples) {
    assert.ok(tamazightHelp.includes(example), `Tamazight: exact example ${example}`);
  }
  assert.deepEqual(tamazightHelp.match(/\\+/g), source.match(/\\+/g));
  assert.ok(!tamazightHelp.includes("Field1 == I\\\\'m"), 'reject doubled escape');
  assert.equal(result.rows.find(row => row.locale === 'zgh'
    && row.key === 'advanced-filter-description').status, 'corrected',
    'full help repair is tracked without claiming native fluency');
  assert.doesNotMatch(tamazightHelp, /Advanced Filter allows|For Example|Normally/);
  assert.ok(tamazightHelp.startsWith(read('zgh')['advanced-filter-label']));
  assert.match(tamazightHelp, /ⵜⴰⵙⴽⴰⵔⵉⵏ.*'Field 1'/);
  assert.match(tamazightHelp, /ⵜⵉⵙⴽⵉⵡⵉⵏ.*F1 == V1 &&/);
  assert.doesNotMatch(tamazightHelp, /ⵜⵉⵙⵇⵇⵍⵜⵉⵏ|ⵜⵓⵛⵛⵉⵍ/);
  assert.ok(tamazightHelp.includes("ⵜⴰⵙⴽⴰⵔⵉⵏ ⵙ ⵢⴰⵏ ⵓⵙⴽⴽⵉⵍ '"));
  assert.doesNotMatch(tamazightHelp, /ⵉⵎⵢⵉⵡⵏⵏ/);
  const trelloHelp = read('zgh')['import-board-instruction-trello'];
  assert.deepEqual(trelloHelp.match(/'[^']+'/g),
    ["'Menu'", "'More'", "'Print and Export'", "'Export JSON'"]);
  assert.doesNotMatch(trelloHelp, /In your Trello board|copy the resulting text/);
  assert.match(trelloHelp, /ⵙⵙⵏⵖⵍ ⴰⴹⵕⵉⵚ/);


  assert.match(read('lt')['advanced-filter-description'], /Išplėstinis filtras/);
  assert.match(read('mn')['advanced-filter-description'], /Нарийвчилсан шүүлтүүр/);
  assert.match(read('el')['advanced-filter-description'], /προηγμένο φίλτρο/);
  console.log('advancedFilterAuditedTranslations: native help texts, exact escaped examples and resolved queues verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
