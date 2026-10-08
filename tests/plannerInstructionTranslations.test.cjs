'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const key = 'import-board-instruction-planner';
const source = read('en')[key];
for (const code of ['wuu-Hans', 'pap', 'yi']) {
  const value = read(code)[key];
  assert.notEqual(value, source, code);
  assert.deepEqual(translationTokens(value), translationTokens(source), code);
  for (const literal of ['Microsoft Planner', 'Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By']) {
    assert.ok(value.includes(literal), `${code}: ${literal}`);
  }
}
assert.match(read('wuu-Hans')[key], /变成列表.*任务变成卡片.*负责人、日期、标签、清单搭描述/);
assert.match(read('pap')[key], /Gruponan ta bira listanan i tareanan ta bira karchinan/);
assert.match(read('yi')[key], /גרופּעס ווערן רשימות און אויפֿגאַבעס ווערן קאַרטן/);
console.log('Planner instructions: translations, mapping meanings and literals passed');

assert.doesNotMatch(read('wuu-Hans')[key], /存储桶/);
