'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '../imports/i18n/data');
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json')));
const keys = Object.keys(en).filter(key => key.startsWith('flow-') || [
  'board-view-aging-wip', 'board-view-blocker-analysis', 'board-view-monte-carlo',
  'board-view-process-behavior', 'board-view-size-cycle-time',
].includes(key));
const tokens = text => [...text.matchAll(/__[A-Za-z0-9_.]+__|%(?:\d+\$)?[A-Za-z%]/g)].map(x => x[0]).sort();
for (const file of fs.readdirSync(dir).filter(file => file.endsWith('.i18n.json'))) {
  const locale = JSON.parse(fs.readFileSync(path.join(dir, file)));
  assert.deepEqual(Object.keys(locale), Object.keys(en), `${file} key order`);
  for (const key of keys) {
    assert.ok(locale[key]?.trim(), `${file}:${key}`);
    assert.deepEqual(tokens(locale[key]), tokens(en[key]), `${file}:${key} code tokens`);
  }
}
console.log('flowAnalyticsTranslations: report strings and placeholders present in every locale');
