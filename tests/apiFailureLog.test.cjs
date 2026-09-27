'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const records = [];
const loggerContext = { module: { exports: {} }, require: () => ({ foldEventFireAndForget: doc => records.push(doc) }) };
vm.runInNewContext(fs.readFileSync('server/lib/apiFailureLog.js', 'utf8'), loggerContext);
const { recordApiFailure } = loggerContext.module.exports;
const { summaryIdentity } = require('../models/lib/eventLogSummary');

function wrapper(logger = recordApiFailure) {
  const source = fs.readFileSync('server/apiMiddleware.js', 'utf8');
  const context = { module: { exports: {} }, sendJsonResult() {},
    require: () => ({ recordApiFailure: logger }) };
  vm.runInNewContext(source.slice(source.indexOf('function safeRoute(')), context);
  return context.module.exports.safeRoute;
}
test('API failure logs keep the registered route and discard credentials everywhere in the request and exception', async () => {
  records.length = 0;
  const secret = 'private-session-token';
  const req = { method: 'GET', route: { path: '/api/boards/:boardId/export' },
    url: `/api/boards/${secret}/export?authToken=${secret}`, originalUrl: secret,
    headers: { authorization: `Bearer ${secret}`, cookie: secret }, params: { boardId: secret }, body: secret };
  const error = new Error(secret); error.stack = secret; error.cause = { token: secret }; error.name = secret;
  let status, body;
  const res = { writeHead: value => { status = value; }, end: value => { body = value; } };
  await wrapper()(async () => { throw error; })(req, res);
  assert.equal(status, 500); assert.equal(body, 'Internal server error');
  assert.equal(records.length, 1);
  assert.equal(records[0].api, 'GET /api/boards/:boardId/export (failed)');
  assert.equal(records[0].kind, 'Error');
  assert.ok(!JSON.stringify(records).includes(secret));
  const identity = summaryIdentity(records[0]);
  req.url = '/another-secret'; error.message = 'another-secret';
  recordApiFailure(req, error);
  assert.deepEqual(summaryIdentity(records[1]), identity);
});
test('missing or malformed patterns and arbitrary methods use bounded fallbacks', () => {
  records.length = 0;
  for (const route of [undefined, /secret/, ['secret'], '/path?token=secret', '/path\nsecret']) {
    recordApiFailure({ method: 'secret', route: { path: route } }, { name: 'TypeError', message: 'secret' });
  }
  assert.ok(records.every(doc => doc.api === 'OTHER (route unavailable) (failed)' && doc.kind === 'TypeError'));
  assert.ok(!JSON.stringify(records).includes('secret'));
});
test('exception accessors are read only once before selecting a fixed category', () => {
  records.length = 0;
  let reads = 0;
  recordApiFailure({}, { get name() { return ++reads === 1 ? 'TypeError' : 'private'; } });
  assert.equal(reads, 1);
  assert.equal(records[0].kind, 'TypeError');
  assert.ok(!JSON.stringify(records).includes('private'));
});
test('logger failure and unreadable thrown values cannot escape the route error boundary', async () => {
  records.length = 0;
  const error = { get name() { throw new Error('private'); } };
  let body;
  await wrapper()(async () => { throw error; })({}, { writeHead() {}, end: text => { body = text; } });
  assert.equal(body, 'Internal server error');
  assert.equal(records[0].kind, 'Error');
  await wrapper(() => { throw new Error('logger unavailable'); })(async () => { throw null; })({}, {
    headersSent: true, writeHead() { assert.fail('headers already sent'); }, end() { throw new Error('socket closed'); },
  });
});
