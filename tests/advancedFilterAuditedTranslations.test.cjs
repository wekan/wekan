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
  for (const locale of ['ar', 'ar-DZ', 'ar-EG', 'lt', 'mn', 'el', 'el-GR', 'sk']) {
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
  assert.match(read('lt')['advanced-filter-description'], /Išplėstinis filtras/);
  assert.match(read('mn')['advanced-filter-description'], /Нарийвчилсан шүүлтүүр/);
  assert.match(read('el')['advanced-filter-description'], /προηγμένο φίλτρο/);
  console.log('advancedFilterAuditedTranslations: native help texts, exact escaped examples and resolved queues verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
