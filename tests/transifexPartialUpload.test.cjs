const { test } = require('node:test');
const assert = require('node:assert/strict');
const source = { title: 'Title __card__', recent: 'New feature' };
test('partial targets retain token/value checks and reject unknown or empty catalogs', async () => {
  const { validateTranslation } = await import('../releases/translations/push-all-translations.mjs');
  const valid = JSON.stringify({ title: 'Otsikko __card__' });
  assert.throws(() => validateTranslation(valid, source), /1 missing, 0 unknown/);
  assert.deepEqual(validateTranslation(valid, source, { allowMissingKeys: true }), { title: 'Otsikko __card__' });
  for (const [data, error] of [[{ title: 'Otsikko __wrong__' }, /placeholders/],
    [{ title: '' }, /Empty/], [{ title: 12 }, /non-string/],
    [{ unknown: 'value' }, /unknown/], [{}, /keys differ/]]) {
    assert.throws(() => validateTranslation(JSON.stringify(data), source, { allowMissingKeys: true }), error);
  }
});
test('upload sends only existing target keys, leaves source complete and logs missing count', async () => {
  const { pushTranslations } = await import('../releases/translations/push-all-translations.mjs');
  const calls = [], logs = [];
  const local = JSON.stringify({ title: 'Otsikko __card__' });
  const result = await pushTranslations({
    config: { org: 'o', project: 'p', resource: 'r', sourceLanguage: 'en', sourceFile: 'en.json' },
    languages: [{ file: 'fi', code: 'fi' }],
    readContent: file => file === 'en.json' ? JSON.stringify(source) : local,
    request: async (method, url, body) => {
      calls.push({ method, url, body });
      if (method === 'GET') return { data: [{ id: 'l:fi' }] };
      return { data: { attributes: { status: 'succeeded' } } };
    }, sleep: async () => {}, log: line => logs.push(line),
  });
  assert.equal(result.failures.length, 0);
  assert.equal(result.succeeded.length, 2);
  const sourceUpload = calls.find(call => call.url === '/resource_strings_async_uploads');
  const targetUpload = calls.find(call => call.url === '/resource_translations_async_uploads');
  assert.deepEqual(JSON.parse(sourceUpload.body.data.attributes.content), source);
  assert.equal(targetUpload.body.data.attributes.content, local);
  assert.ok(logs.some(line => line.includes('1 source keys absent locally')));
});
