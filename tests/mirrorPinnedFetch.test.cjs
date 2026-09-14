'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');

test('pinned attachment HTTP adapter rejects invalid responses without uncaught callback errors', async () => {
  const { pinnedFetch } = await import('../tools/mirror-archive.mjs');
  async function run(status, headers = {}) {
    const response = Readable.from([Buffer.from('attachment')]);
    response.statusCode = status;
    response.headers = headers;
    const transport = { request(url, options, callback) {
      const request = new EventEmitter();
      request.end = () => queueMicrotask(() => callback(response));
      return request;
    } };
    const promise = pinnedFetch(new URL('https://example.com/file'), {}, [{ address: '93.184.216.34' }], transport);
    return { promise, response };
  }
  for (const status of [0, 101, 199, 600, 999, undefined]) {
    const { promise, response } = await run(status);
    await assert.rejects(promise, /unsupported HTTP status/);
    assert.equal(response.destroyed, true);
  }
  const malformed = await run(200, { 'bad header': 'value' });
  await assert.rejects(malformed.promise, /invalid header name/i);
  assert.equal(malformed.response.destroyed, true);
  const valid = await run(200, { 'content-type': 'text/plain' });
  assert.equal(await (await valid.promise).text(), 'attachment');
  for (const status of [204, 205, 304]) {
    const { promise } = await run(status);
    assert.equal((await promise).body, null);
  }
});
