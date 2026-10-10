'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('short prose audit exposes words and preserves indexed source arguments', async () => {
  const { shortProseCandidates } = await import('../releases/translations/audit-short-prose.mjs');
  const source = { condition: 'if', loop: 'do', move: '%1 of %2', end: 'to #', accept: 'OK', negative: 'No', person: 'Me', dailyTime: 'At', quietEnd: 'To' };
  const before = JSON.stringify(source);
  assert.deepEqual(shortProseCandidates(source, { ...source }), source);
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(shortProseCandidates(source, { ...source, condition: '假使' }), Object.fromEntries(Object.entries(source).filter(([key]) => key !== 'condition')));
});

test('short prose audit excludes technical notation and changed or missing values', async () => {
  const { shortProseCandidates } = await import('../releases/translations/audit-short-prose.mjs');
  const source = { os: 'OS', size: 'MB', pi: 'pi', constant: 'e', search: 'a', storage: 'S3', url: 'https://example.com', empty: '', token: '%1', longer: 'do something', word: 'or' };
  assert.deepEqual(shortProseCandidates(source, { ...source, word: '或者' }), {});
  assert.deepEqual(shortProseCandidates(source, {}), {});
  // Same spelling can be native: report it for review, never assert it is wrong.
  assert.deepEqual(shortProseCandidates({ word: 'No' }, { word: 'No' }), { word: 'No' });
});

test('Finnish, German and French short labels preserve input/context roles and pixel state', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  for (const code of ['fi', 'de', 'de-CH', 'de-AT', 'de_DE', 'fr', 'fr-CH', 'fr-FR', 'fr-BE', 'fr-CA']) {
    const locale = read(code);
    for (const key of ['blockly-ANNOUNCE_MOVE_OF', 'blockly-FIELD_BITMAP_PIXEL_ON']) {
      assert.notEqual(locale[key], source[key], code + ': ' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
    }
    const rendered = locale['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'INPUT').replace('%2', 'BLOCK');
    assert.equal(rendered, code === 'fi' ? 'BLOCK: INPUT' : code.startsWith('de') ? 'INPUT von BLOCK' : 'INPUT de BLOCK', code);
    assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'], locale['blockly-FIELD_BITMAP_PIXEL_OFF'], code);
  }
});

test('Yiddish and Papiamento control labels preserve roles and equivalent forms', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  for (const code of ['yi', 'pap']) {
    const locale = read(code);
    for (const suffix of ['ANNOUNCE_MOVE_OF', 'CONTROLS_IF_MSG_IF', 'CONTROLS_REPEAT_INPUT_DO', 'FIELD_BITMAP_PIXEL_ON', 'LISTS_GET_SUBLIST_END_FROM_START', 'LISTS_SET_INDEX_INPUT_TO', 'LOGIC_OPERATION_OR', 'PROCEDURES_DEFNORETURN_TITLE', 'CONTROLS_FOREACH_INPUT_DO', 'CONTROLS_FOR_INPUT_DO', 'CONTROLS_IF_IF_TITLE_IF', 'CONTROLS_IF_MSG_THEN', 'CONTROLS_WHILEUNTIL_INPUT_DO', 'PROCEDURES_DEFRETURN_TITLE']) {
      const key = 'blockly-' + suffix;
      assert.notEqual(locale[key], source[key], code + ': ' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
    }
    assert.equal(locale['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'INPUT').replace('%2', 'BLOCK'), code === 'yi' ? 'INPUT פֿון BLOCK' : 'INPUT di BLOCK');
    assert.equal(locale['blockly-CONTROLS_IF_MSG_IF'], locale['blockly-CONTROLS_IF_IF_TITLE_IF']);
    assert.equal(locale['blockly-PROCEDURES_DEFNORETURN_TITLE'], locale['blockly-PROCEDURES_DEFRETURN_TITLE']);
    assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'], locale['blockly-FIELD_BITMAP_PIXEL_OFF']);
    assert.notEqual(locale['blockly-LOGIC_OPERATION_OR'], locale['blockly-LOGIC_OPERATION_AND']);
  }
});

test('Czech rule labels distinguish criterion and actor; Chinese preserves context roles', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  for (const code of ['cmn', 'zh', 'zh_SG', 'zh-Hans', 'zh-Hant', 'zh-GB', 'zh-TW', 'zh-HK', 'zh-CN']) {
    const value = read(code)['blockly-ANNOUNCE_MOVE_OF'];
    assert.deepEqual(translationTokens(value), translationTokens(source['blockly-ANNOUNCE_MOVE_OF']), code);
    assert.equal(value.replace('%1', '输入').replace('%2', '积木'), '积木 的 输入', code);
  }
  for (const code of ['cs', 'cs-CZ']) {
    const locale = read(code);
    assert.equal(locale['r-sort-by'], 'podle');
    assert.equal(locale['r-by'], 'uživatel:');
    for (const key of ['r-sort-by', 'r-by']) assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
  }
  assert.equal(read('ja').or, 'または');
});

test('Marathi, Malayalam and Telugu short labels retain indexed roles and control distinctions', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  for (const [code, expected] of [['mr', 'BLOCK मधील INPUT'], ['ml', 'BLOCK ലെ INPUT'], ['te-IN', 'BLOCK లోని INPUT']]) {
    const locale = read(code);
    const keys = ['ANNOUNCE_MOVE_OF', 'FIELD_BITMAP_PIXEL_ON'];
    if (code !== 'te-IN') keys.push('CONTROLS_IF_MSG_IF', 'CONTROLS_REPEAT_INPUT_DO', 'LISTS_GET_SUBLIST_END_FROM_START', 'LISTS_SET_INDEX_INPUT_TO', 'LOGIC_OPERATION_OR', 'PROCEDURES_DEFNORETURN_TITLE', 'CONTROLS_FOREACH_INPUT_DO', 'CONTROLS_FOR_INPUT_DO', 'CONTROLS_IF_IF_TITLE_IF', 'CONTROLS_IF_MSG_THEN', 'CONTROLS_WHILEUNTIL_INPUT_DO', 'PROCEDURES_DEFRETURN_TITLE');
    for (const suffix of keys) {
      const key = 'blockly-' + suffix;
      assert.notEqual(locale[key], source[key], code + ': ' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
    }
    assert.equal(locale['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'INPUT').replace('%2', 'BLOCK'), expected);
    assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'], locale['blockly-FIELD_BITMAP_PIXEL_OFF']);
    if (code !== 'te-IN') {
      assert.equal(locale['blockly-CONTROLS_IF_MSG_IF'], locale['blockly-CONTROLS_IF_IF_TITLE_IF']);
      assert.equal(locale['blockly-PROCEDURES_DEFNORETURN_TITLE'], locale['blockly-PROCEDURES_DEFRETURN_TITLE']);
      assert.notEqual(locale['blockly-LOGIC_OPERATION_OR'], locale['blockly-LOGIC_OPERATION_AND']);
    }
  }
});

test('Punjabi, Swahili and Latin Uzbek labels preserve movement roles and block distinctions', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  for (const code of ['pa', 'sw', 'uz', 'uz-LA', 'uz-UZ']) {
    const locale = read(code);
    const keys = ['ANNOUNCE_MOVE_OF', 'FIELD_BITMAP_PIXEL_ON', 'LISTS_GET_SUBLIST_END_FROM_START', 'LISTS_SET_INDEX_INPUT_TO', 'PROCEDURES_DEFNORETURN_TITLE', 'PROCEDURES_DEFRETURN_TITLE'];
    if (code !== 'pa') keys.push('CONTROLS_IF_MSG_IF', 'CONTROLS_REPEAT_INPUT_DO', 'LOGIC_OPERATION_OR', 'CONTROLS_FOREACH_INPUT_DO', 'CONTROLS_FOR_INPUT_DO', 'CONTROLS_IF_IF_TITLE_IF', 'CONTROLS_IF_MSG_THEN', 'CONTROLS_WHILEUNTIL_INPUT_DO');
    for (const suffix of keys) {
      const key = 'blockly-' + suffix;
      assert.notEqual(locale[key], source[key], code + ': ' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
    }
    const expected = code === 'pa' ? 'BLOCK ਦਾ INPUT' : code === 'sw' ? 'INPUT ya BLOCK' : 'BLOCK ichidagi INPUT';
    assert.equal(locale['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'INPUT').replace('%2', 'BLOCK'), expected, code);
    assert.equal((locale['blockly-LISTS_GET_SUBLIST_END_FROM_START'].match(/#/g) || []).length, 1, code);
    assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'], locale['blockly-FIELD_BITMAP_PIXEL_OFF'], code);
    assert.equal(locale['blockly-PROCEDURES_DEFNORETURN_TITLE'], locale['blockly-PROCEDURES_DEFRETURN_TITLE'], code);
    assert.equal(locale['blockly-CONTROLS_IF_MSG_IF'], locale['blockly-CONTROLS_IF_IF_TITLE_IF'], code);
    assert.notEqual(locale['blockly-LOGIC_OPERATION_OR'], locale['blockly-LOGIC_OPERATION_AND'], code);
  }
});

test('Mongolian short labels preserve argument roles, list positions and control distinctions', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  const locale = read('mn');
  for (const suffix of ['ANNOUNCE_MOVE_OF', 'CONTROLS_IF_MSG_IF', 'CONTROLS_REPEAT_INPUT_DO', 'FIELD_BITMAP_PIXEL_ON', 'LISTS_GET_SUBLIST_END_FROM_START', 'LISTS_SET_INDEX_INPUT_TO', 'LOGIC_OPERATION_OR', 'PROCEDURES_DEFNORETURN_TITLE', 'CONTROLS_FOREACH_INPUT_DO', 'CONTROLS_FOR_INPUT_DO', 'CONTROLS_IF_IF_TITLE_IF', 'CONTROLS_IF_MSG_THEN', 'CONTROLS_WHILEUNTIL_INPUT_DO', 'PROCEDURES_DEFRETURN_TITLE']) {
    const key = 'blockly-' + suffix;
    assert.notEqual(locale[key], source[key], key);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), key);
  }
  assert.equal(locale['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'INPUT').replace('%2', 'BLOCK'), 'BLOCK дахь INPUT');
  assert.equal((locale['blockly-LISTS_GET_SUBLIST_END_FROM_START'].match(/#/g) || []).length, 1);
  assert.equal(locale['blockly-CONTROLS_IF_MSG_IF'], locale['blockly-CONTROLS_IF_IF_TITLE_IF']);
  assert.equal(locale['blockly-PROCEDURES_DEFNORETURN_TITLE'], locale['blockly-PROCEDURES_DEFRETURN_TITLE']);
  assert.notEqual(locale['blockly-LOGIC_OPERATION_OR'], locale['blockly-LOGIC_OPERATION_AND']);
  assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'], locale['blockly-FIELD_BITMAP_PIXEL_OFF']);
  assert.ok(locale['blockly-FIELD_BITMAP_ARIA_VALUE'].includes(locale['blockly-FIELD_BITMAP_PIXEL_ON']));
});

test('Bengali, Kannada and Nepali field labels distinguish criterion, actor and recipient', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  const expected = {
    bn: ['সাজানোর মানদণ্ড:', 'ব্যবহারকারী:', 'প্রাপক', 'আমি'],
    kn: ['ವಿಂಗಡಣೆಯ ಮಾನದಂಡ:', 'ಬಳಕೆದಾರ:', 'ಸ್ವೀಕರಿಸುವವರು', 'ನಾನು'],
    ne: ['क्रमबद्ध गर्ने आधार:', 'प्रयोगकर्ता:', 'प्राप्तकर्ता', 'म'],
  };
  for (const [code, values] of Object.entries(expected)) {
    const locale = read(code);
    const keys = ['r-sort-by', 'r-by', 'r-to', 'dueCardsViewChange-choice-me'];
    assert.deepEqual(keys.map(key => locale[key]), values, code);
    assert.notEqual(locale['r-sort-by'], locale['r-by'], code);
    for (const key of keys) assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
  }
});
