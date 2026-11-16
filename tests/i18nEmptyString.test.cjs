'use strict';
// i18next 27 changed `returnEmptyString` to default false: an empty translation
// falls back like a missing one, to the KEY. en.i18n.json keeps some values
// empty on purpose - "comment-placeholder" (the description and comment
// editors have no placeholder) and Blockly's empty suffixes - so after the
// i18next 27 update the editor showed the text "comment-placeholder" (#6921).
// This runs the real __() from imports/i18n/tap.js with the init() options
// read from that same file, so dropping `returnEmptyString: true` fails here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const DATA = path.join(__dirname, '..', 'imports', 'i18n', 'data');
const source = fs.readFileSync(path.join(__dirname, '..', 'imports', 'i18n', 'tap.js'), 'utf8');
const en = JSON.parse(fs.readFileSync(path.join(DATA, 'en.i18n.json'), 'utf8'));
const emptyInEnglish = Object.keys(en).filter(k => en[k] === '');

// The object literal passed to this.i18n.init({...}) in TAPi18n.init().
function initOptions() {
  const start = source.indexOf('await this.i18n.init({');
  assert.ok(start > 0, 'TAPi18n.init() calls this.i18n.init({...})');
  let depth = 0;
  let i = source.indexOf('{', start);
  const from = i;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) break;
  }
  return vm.runInNewContext(`(${source.slice(from, i + 1)})`, {
    DEFAULT_LANGUAGE: 'en', DEFAULT_NAMESPACE: 'translation', process: { env: {} }, languages: {},
  });
}

function makeTap(resources) {
  const method = source.slice(source.indexOf('  __(key, options, language) {'), source.lastIndexOf('\n};'));
  const tap = vm.runInNewContext('({' + method + '})', { DEFAULT_LANGUAGE: 'en' });
  tap.current = { dep: { depend() {} } };
  tap.revision = { get() {} };
  tap.toI18nCode = code => code;
  tap.i18n = i18next.createInstance().use(sprintf);
  tap.i18n.init({ ...initOptions(), supportedLngs: false, initImmediate: false, lng: 'fi', resources });
  return tap;
}

test('the fixture: English really has values that are empty on purpose', () => {
  assert.ok(emptyInEnglish.includes('comment-placeholder'), 'the editor placeholder is empty in English');
  assert.ok(emptyInEnglish.length > 1, 'and it is not the only one (Blockly suffixes)');
});

test('TAPi18n.init() keeps an empty translation empty (i18next 27 default is false)', () => {
  assert.equal(initOptions().returnEmptyString, true);
});

test('an empty translation renders as empty, not as its key (#6921)', () => {
  const fi = Object.fromEntries(emptyInEnglish.map(k => [k, '']));
  const tap = makeTap({ en: { translation: en }, fi: { translation: { ...fi, comments: 'Kommentit' } } });
  for (const key of emptyInEnglish) {
    assert.equal(tap.__(key, { sprintf: [] }), '', `${key} in the user's language`);
    assert.equal(tap.__(key, { sprintf: [] }, 'en'), '', `${key} in English`);
  }
});

test('negative: a missing translation still falls back to English, not to blank or the key', () => {
  const tap = makeTap({ en: { translation: en }, fi: { translation: { comments: 'Kommentit' } } });
  assert.equal(tap.__('comments'), 'Kommentit');
  assert.equal(tap.__('comment'), en.comment, 'a key the language lacks shows English');
  assert.equal(tap.__('no-such-key-6921'), 'no-such-key-6921', 'an unknown key is still the key');
});

test('negative: no language has an empty value where English has text', () => {
  // With returnEmptyString:true such a value would render blank instead of
  // falling back to English, so none may exist.
  const blank = [];
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.i18n.json'))) {
    const strings = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    for (const [key, value] of Object.entries(strings)) {
      if (value === '' && en[key] !== '' && key in en) blank.push(`${file}: ${key}`);
    }
  }
  assert.deepEqual(blank, []);
});

test('every language leaves the editor placeholder empty, as English does', () => {
  // A non-empty value here is not a translation of anything: lb had
  // "Optioun: " and haw "Ma ka ʻōlelo Hawaiʻi: " for an empty English source.
  const filled = [];
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.i18n.json'))) {
    const strings = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    if ('comment-placeholder' in strings && strings['comment-placeholder'] !== '') filled.push(file);
  }
  assert.deepEqual(filled, []);
});
