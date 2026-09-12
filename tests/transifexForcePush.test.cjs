'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
(async () => {
  const { pushTranslations, uploadFile, validateTranslation } = await import('../releases/translations/push-all-translations.mjs');
  const { readConfig, localLanguages, api } = await import('../releases/translations/sync-transifex-languages.mjs');
  const config = readConfig();
  assert.equal(config.sourceLanguage, 'en');
  assert.ok(localLanguages(config).some(row => row.file === 've-PP' && row.code === 'vep'));
  assert.ok(localLanguages(config).some(row => row.file === 'en-GB' && row.code === 'en_GB'));
  assert.ok(!localLanguages(config).some(row => row.file === 'en'));
  const content = JSON.stringify({ title: 'Title __card__', empty: '' });
  const source = JSON.parse(content);
  assert.doesNotThrow(() => validateTranslation(content, source), 'intentional empty source strings are valid');
  assert.throws(() => validateTranslation(JSON.stringify({ title: 'Title __wrong__', empty: '' }), source), /placeholders/);
  assert.throws(() => validateTranslation(JSON.stringify({ title: '' }), source), /keys/);
  const calls = [];
  let poll = 0;
  const request = async (method, url, body) => {
    calls.push({ method, url, body });
    if (url === '/projects/o:wekan:p:wekan/languages') return { data: [{ id: 'l:fi_FI' }], links: { next: '/page2' } };
    if (url === '/page2') return { data: [{ id: 'l:en_GB' }, { id: 'l:ar' }] };
    if (url.endsWith('/relationships/languages')) {
      const code = body.data[0].id;
      if (code === 'l:unknown') throw new Error('Unsupported language code');
      assert.equal(code, 'l:vep');
      return null; // documented 204 relationship addition
    }
    if (method === 'POST' && url === '/resource_strings_async_uploads') {
      assert.equal(body.data.attributes.replace_edited_strings, true);
      assert.equal(body.data.attributes.keep_translations, true);
      assert.equal(body.data.attributes.content, content);
      return { data: { id: 'source', attributes: { status: 'pending' } } };
    }
    if (url === '/resource_strings_async_uploads/source') {
      return { data: { attributes: { status: ++poll === 1 ? 'processing' : 'succeeded' } } };
    }
    if (method === 'POST' && url === '/resource_translations_async_uploads') {
      assert.equal(body.data.attributes.content, content, 'full content is uploaded without a timestamp check');
      assert.equal(body.data.attributes.file_type, 'default');
      const code = body.data.relationships.language.data.id;
      return { data: { attributes: code === 'l:ar' ? { status: 'failed', errors: [{ detail: 'Parser failure' }] } : { status: 'succeeded' } } };
    }
    throw new Error(`Unexpected request ${method} ${url}`);
  };
  const result = await pushTranslations({ config, languages: [
    { file: 'fi', code: 'fi_FI' }, { file: 've-PP', code: 'vep' },
    { file: 'unknown', code: 'unknown' }, { file: 'ar', code: 'ar' }, { file: 'en-GB', code: 'en_GB' },
  ], request, readContent: () => content, sleep: async () => {}, log() {} });
  assert.deepEqual(result.succeeded.map(row => row.code), ['en', 'fi_FI', 'vep', 'en_GB']);
  assert.deepEqual(result.failures.map(row => row.code), ['unknown', 'ar']);
  assert.match(result.failures[0].reason, /Could not add language/);
  assert.match(result.failures[1].reason, /Parser failure/);
  assert.ok(calls.find(row => row.url.endsWith('/relationships/languages') && row.body.data[0].id === 'l:unknown'), 'unsupported catalogue code was attempted');
  const none = await pushTranslations({ config, languages: [{ file: 'fi', code: 'fi_FI' }], request: async () => { throw Error('source failure'); }, readContent: () => content, sleep: async () => {}, log() {} });
  assert.equal(none.failures.length, 2, 'source failure reports every unpushed language');
  await assert.rejects(uploadFile({ request: async () => ({ data: { id: 'pending', attributes: { status: 'pending' } } }), resource: 'r', content, source: true, maxPolls: 2, sleep: async () => {} }), /polling limit/);
  const originalFetch = global.fetch;
  let network = 0;
  global.fetch = async () => { network++; throw Error('unexpected network'); };
  try { await assert.rejects(api('test-token', 'GET', 'https://example.com/page2'), /Unexpected Transifex API URL/); }
  finally { global.fetch = originalFetch; }
  assert.equal(network, 0, 'pagination cannot send credentials to another origin');
  const dry = cp.spawnSync('sh', [path.join(root, 'releases/translations/push-all-translations.sh'), '--dry-run'], { cwd: path.join(root, '.tools/tmp'), env: { ...process.env, NODE_BIN: process.execPath }, encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /245 targets and source en; no network requests/);
  console.log('transifexForcePush: full uploads, polling, mapped languages, additive registration, failure continuation and summary, token origin boundary and offline wrapper passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
