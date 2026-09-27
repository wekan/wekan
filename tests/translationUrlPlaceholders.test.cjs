'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '../imports/i18n/data');

test('localized help URLs validate without mistaking percent octets for placeholders', async () => {
  const { validateTranslation } = await import('../releases/translations/push-all-translations.mjs');
  const en = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json')));
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.i18n.json'))) {
    const content = fs.readFileSync(path.join(directory, file), 'utf8');
    assert.doesNotThrow(() => validateTranslation(content, en, { allowMissingKeys: file !== 'en.i18n.json' }), file);
  }
});

test('real interpolation tokens remain checked in URL fields and surrounding prose', async () => {
  const { translationTokens: tokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { validateTranslation } = await import('../releases/translations/push-all-translations.mjs');
  assert.deepEqual(tokens('https://ar.wikipedia.org/wiki/%D8%B9%D8%AF%D8%AF'), []);
  assert.deepEqual(tokens('https://example.org/%e2%82%ac%20x?literal=%25'), []);
  assert.deepEqual(tokens('Text %D8 __card__ %1 %2 %1$s %{BKY_HELP} %%'),
    ['%%', '%1', '%1$s', '%2', '%D', '%{BKY_HELP}', '__card__'].sort());
  const source = { help: 'Read https://example.org/Number?name=%s&id=__card__ then %1 %{BKY_HELP}' };
  const translated = 'اقرأ https://example.org/%D8%B9?name=%s&id=__card__ ثم %1 %{BKY_HELP}';
  assert.doesNotThrow(() => validateTranslation(JSON.stringify({ help: translated }), source));
  for (const damaged of [translated.replace('%s', ''), translated.replace('__card__', '__wrong__'),
    translated.replace('%1', '%2'), translated.replace('%{BKY_HELP}', '%{BKY_OTHER}'),
    translated.replace('%1', '%1 %1')]) {
    assert.throws(() => validateTranslation(JSON.stringify({ help: damaged }), source), /Broken source placeholders/);
  }
  assert.throws(() => validateTranslation(JSON.stringify({ help: 'https://example.org/%D8%B9' }),
    { help: 'https://example.org/?value=%s' }), /Broken source placeholders/);
});
