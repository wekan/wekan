'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const tamazight = read('zgh');
const tokens = value => [...value.matchAll(/__[A-Za-z0-9_]+__/g)]
  .map(([token]) => token).sort();
assert.equal(english['act-withDue'],
  '__list__/__card__ due reminders [__board__]');
assert.equal(tamazight['act-withDue'],
  '__list__/__card__ ⵉⵙⴽⵜⵉⵏ ⵏ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ [__board__]');
assert.deepEqual(tokens(tamazight['act-withDue']),
  tokens(english['act-withDue']));
assert.doesNotMatch(tamazight['act-withDue'],
  /rappel|échéance|[\u0600-\u06ff]/iu,
  'wrong French/Arabic language must not return');
assert.match(tamazight['act-newDue'], /ⴰⵙⴽⵜⵉ ⴰⵎⵣⵡⴰⵔⵓ/u,
  'first-reminder form stays distinct');
assert.notEqual(tamazight['act-withDue'], tamazight['act-newDue']);
const activities = fs.readFileSync(path.join(root,
  'server/models/activities.js'), 'utf8');
assert.match(activities,
  /activity\.timeOldValue \? 'act-withDue' : 'act-newDue'/,
  'source selector is based on prior due date');
(async () => {
  const translator = require('i18next').createInstance()
    .use(require('i18next-sprintf-postprocessor'));
  await translator.init({ lng: 'zgh', fallbackLng: false,
    keySeparator: false, interpolation: { prefix: '__', suffix: '__',
      escapeValue: false }, resources: { zgh: { translation: tamazight } },
    postProcess: ['sprintf'] });
  const rendered = translator.t('act-withDue', {
    list: 'LIST', card: 'CARD', board: 'BOARD',
  });
  assert.equal(rendered,
    'LIST/CARD ⵉⵙⴽⵜⵉⵏ ⵏ ⵓⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ [BOARD]');
  console.log('Tamazight due-reminder translation and runtime slots pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
