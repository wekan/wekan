'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
(async () => {
  const { pushTranslations, uploadFile, validateTranslation, languageSupportReport, printUploadSummary } = await import('../releases/translations/push-all-translations.mjs');
  const { readConfig, localLanguages, api } = await import('../releases/translations/sync-transifex-languages.mjs');
  const config = readConfig();
  assert.equal(config.sourceLanguage, 'en');
  assert.ok(localLanguages(config).some(row => row.file === 've-PP' && row.code === 'vep'));
  assert.ok(localLanguages(config).some(row => row.file === 'en-GB' && row.code === 'en_GB'));
  assert.ok(!localLanguages(config).some(row => row.file === 'en'));
  const colombian = localLanguages(config).filter(row => row.code === 'es_CO');
  assert.equal(colombian.length, 1, 'upload each remote language only once');
  assert.equal(colombian[0].file, 'es-CO', 'explicit mapping chooses canonical local file');
  assert.deepEqual(colombian[0].aliases, ['es_CO']);
  assert.ok(!localLanguages(config).some(row => row.code === 'es-CO'), 'never register an unsupported hyphenated code');
  for (const [file, code] of [['fr-BE','fr_BE'], ['fr-CA','fr_CA'], ['km-KH','km_KH'], ['gn','gug_PY'], ['pt-PT','pt_PT'], ['ru-RU','ru_RU']]) {
    assert.equal(localLanguages(config).find(row => row.file === file).code, code);
    assert.ok(!localLanguages(config).some(row => row.code === file));
  }
  assert.equal(localLanguages(config).find(row => row.file === 'zh-Hans').code, 'zh-Hans');
  assert.ok(!localLanguages(config).some(row => row.code === 'zh_Hans'), 'Chinese script tags retain the supported hyphen');
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
  // A prior unsupported result must never exclude a target from later runs.
  const retryCodes = ['gv', 'lld', 'rup', 'tig', 'wal'];
  const retryLanguages = retryCodes.map(code => ({file: code, code}));
  const registered = new Set();
  let catalogueAvailable = false;
  let additions = [], uploads = [];
  const retryRequest = async (method, url, body) => {
    if (method === 'GET' && url === '/projects/o:wekan:p:wekan/languages') {
      return {data: [...registered].map(code => ({id: `l:${code}`}))};
    }
    if (url.endsWith('/relationships/languages')) {
      const code = body.data[0].id.replace(/^l:/, '');
      additions.push(code);
      if (!catalogueAvailable) throw Object.assign(Error('No Language resource found'), {status: 404});
      registered.add(code);
      return null;
    }
    if (url === '/resource_strings_async_uploads') return {data: {attributes: {status: 'succeeded'}}};
    if (url === '/resource_translations_async_uploads') {
      uploads.push(body.data.relationships.language.data.id.replace(/^l:/, ''));
      assert.equal(body.data.attributes.content, content);
      return {data: {attributes: {status: 'succeeded'}}};
    }
    throw Error(`Unexpected retry request ${method} ${url}`);
  };
  const retryRun = () => pushTranslations({config, languages: retryLanguages,
    request: retryRequest, readContent: () => content, sleep: async () => {}, log() {}});
  const unsupportedRun = await retryRun();
  assert.deepEqual(unsupportedRun.failures.map(row => row.code), retryCodes);
  assert.deepEqual(additions, retryCodes);
  assert.deepEqual(uploads, [], 'failed registration prevents that upload');
  catalogueAvailable = true;
  additions = []; uploads = [];
  const supportedRun = await retryRun();
  assert.deepEqual(supportedRun.failures, []);
  assert.deepEqual(additions, retryCodes, 'retry every formerly unsupported language once support is added');
  assert.deepEqual(uploads, retryCodes, 'newly added targets receive their full local translations');
  assert.deepEqual(supportedRun.succeeded.map(row => row.code), ['en', ...retryCodes]);
  additions = []; uploads = [];
  const existingRun = await retryRun();
  assert.deepEqual(existingRun.failures, []);
  assert.deepEqual(additions, [], 'already registered targets are retained');
  assert.deepEqual(uploads, retryCodes, 'later runs still overwrite all existing targets');
  const none = await pushTranslations({ config, languages: [{ file: 'fi', code: 'fi_FI' }], request: async () => { throw Error('source failure'); }, readContent: () => content, sleep: async () => {}, log() {} });
  assert.equal(none.failures.length, 2, 'source failure reports every unpushed language');
  await assert.rejects(uploadFile({ request: async () => ({ data: { id: 'pending', attributes: { status: 'pending' } } }), resource: 'r', content, source: true, maxPolls: 2, sleep: async () => {} }), /polling limit/);
  const support = await languageSupportReport({ languages: [{file:'tig',code:'tig'}, {file:'ar',code:'ar'}], result,
    request: async (method, url) => {
      assert.equal(method, 'GET', 'support discovery is read-only');
      if (url === '/languages') return { data: [{ id:'l:ar', attributes:{name:'Arabic'} }], links:{next:'/catalogue2'} };
      assert.equal(url, '/catalogue2');
      return { data: [{ id:'l:extra', attributes:{code:'extra',name:'Additional language'} }] };
    } });
  assert.deepEqual(support.supportedFailures.map(row => row.code), ['ar']);
  assert.deepEqual(support.unsupported.map(row => row.code), ['tig']);
  assert.deepEqual(support.additional, [{code:'extra',name:'Additional language'}]);
  const summary = [];
  printUploadSummary({...result, languageSupport:support}, line => summary.push(line));
  assert.ok(summary.some(line => line.includes('Languages successfully pushed')));
  assert.ok(summary.some(line => line.includes('Parser failure')));
  assert.ok(summary.some(line => line.includes('Catalogue support must be requested')));
  assert.ok(summary.some(line => line.includes('local translations and locale mappings must be prepared')));
  assert.ok(summary.some(line => line.includes('tx CLI cannot create unsupported')));
  const unknownSupport = await languageSupportReport({ languages:[],result,request:async () => { throw Error('Catalogue unavailable'); } });
  assert.equal(unknownSupport.catalogueError, 'Catalogue unavailable');
  assert.deepEqual(unknownSupport.unsupported, [], 'listing failure is not proof of unsupported languages');
  const cyclic = await languageSupportReport({languages:[],result,request:async () => ({data:[],links:{next:'/languages'}})});
  assert.match(cyclic.catalogueError, /Repeated catalogue/);
  const originalFetch = global.fetch;
  let network = 0;
  global.fetch = async () => { network++; throw Error('unexpected network'); };
  try { await assert.rejects(api('test-token', 'GET', 'https://example.com/page2'), /Unexpected Transifex API URL/); }
  finally { global.fetch = originalFetch; }
  assert.equal(network, 0, 'pagination cannot send credentials to another origin');
  const dry = cp.spawnSync('sh', [path.join(root, 'releases/translations/push-all-translations.sh'), '--dry-run'], { cwd: path.join(root, '.tools/tmp'), env: { ...process.env, NODE_BIN: process.execPath }, encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /241 targets and source en; no network requests/);
  const statusPath = dry.stdout.match(/\[tx\] status log: (.+)\n/)[1];
  assert.match(path.basename(statusPath), /^push-all-translations_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(?:-\d+)?\.txt$/);
  assert.ok(fs.readFileSync(statusPath, 'utf8').endsWith(dry.stdout), 'terminal status is also saved');
  const failed = cp.spawnSync('sh', [path.join(root, 'releases/translations/push-all-translations.sh'), '--invalid'], { env: { ...process.env, NODE_BIN: process.execPath }, encoding: 'utf8' });
  assert.equal(failed.status, 1, 'logging preserves failed exit status');
  const failedPath = failed.stdout.match(/\[tx\] status log: (.+)\n/)[1];
  assert.ok(fs.readFileSync(failedPath, 'utf8').includes(failed.stderr), 'errors are saved too');
  console.log('transifexForcePush: full uploads, polling, mapped languages, additive registration, failure continuation and summary, token origin boundary and offline wrapper passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
