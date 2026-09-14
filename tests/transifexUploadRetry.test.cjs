'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../releases/translations/push-all-translations.mjs');
test('source status 502 retries the same job and still uploads targets', async () => {
  const { retryingRequest, pushTranslations } = await load();
  const requests = [], sleeps = [], logs = [];
  let polls = 0;
  const request = retryingRequest(async (method, url) => {
    requests.push([method, url]);
    if (url === '/resource_strings_async_uploads') return { data: { id: 'source-job', attributes: { status: 'pending' } } };
    if (url.endsWith('/source-job')) {
      if (++polls === 1) throw Object.assign(Error('Bad Gateway'), { status: 502 });
      return { data: { attributes: { status: 'succeeded' } } };
    }
    if (method === 'GET') return { data: [{ id: 'l:fi' }] };
    return { data: { attributes: { status: 'succeeded' } } };
  }, { sleep: async ms => sleeps.push(ms), log: line => logs.push(line) });
  const result = await pushTranslations({ config: { org: 'wekan', project: 'wekan', resource: 'wekan', sourceFile: 'en', sourceLanguage: 'en' },
    languages: [{ file: 'fi', code: 'fi' }], request, readContent: () => '{"title":"Title"}',
    sleep: async () => {}, log: line => logs.push(line) });
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.succeeded.map(row => row.code), ['en', 'fi']);
  assert.equal(requests.filter(([method, url]) => method === 'POST' && url === '/resource_strings_async_uploads').length, 1);
  assert.equal(polls, 2);
  assert.deepEqual(sleeps, [2000]);
  assert.ok(logs.some(line => line.includes('retry 2/6')));
});
test('throttling honors Retry-After and reports progress during waits', async () => {
  const { retryingRequest } = await load();
  const sleeps = [], logs = [];
  let calls = 0;
  const request = retryingRequest(async () => {
    if (++calls === 1) throw Object.assign(Error('Throttled'), { status: 429, retryAfterMs: 95000 });
    return 'ok';
  }, { sleep: async ms => sleeps.push(ms), log: line => logs.push(line) });
  assert.equal(await request('POST', '/upload'), 'ok');
  assert.equal(sleeps.reduce((a, b) => a + b, 0), 95000);
  assert.ok(sleeps.every(ms => ms <= 30000));
  assert.ok(logs.some(line => line.includes('remaining')));
});
test('permanent errors and uncertain writes are not retried; transient reads have a bound', async () => {
  const { retryingRequest } = await load();
  for (const [method, status, expected] of [['POST', 502, 1], ['GET', 404, 1], ['GET', 401, 1], ['GET', 502, 6]]) {
    let calls = 0;
    const error = Object.assign(Error('Failure'), { status });
    const request = retryingRequest(async () => { calls++; throw error; }, { sleep: async () => {}, log() {} });
    await assert.rejects(request(method, '/job'), candidate => candidate === error);
    assert.equal(calls, expected);
  }
});
test('API errors retain Retry-After seconds and HTTP dates for the retry wrapper', async () => {
  const { api } = await import('../releases/translations/sync-transifex-languages.mjs');
  const originalFetch = global.fetch;
  try {
    for (const [header, expected] of [['95', 95000], ['invalid', undefined]]) {
      global.fetch = async () => new Response('{"errors":[{"detail":"Throttled"}]}', { status: 429, headers: { 'Retry-After': header } });
      await assert.rejects(api('test-token', 'GET', '/languages'), error => error.status === 429 && error.retryAfterMs === expected);
    }
    global.fetch = async () => new Response('', { status: 429, headers: { 'Retry-After': new Date(Date.now() + 120000).toUTCString() } });
    await assert.rejects(api('test-token', 'GET', '/languages'), error => error.retryAfterMs > 118000 && error.retryAfterMs <= 120000);
  } finally { global.fetch = originalFetch; }
});
