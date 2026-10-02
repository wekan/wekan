'use strict';

// Guard (2026-10-02): with WITH_API off, the REST API is refused by a gate
// that tested req.url.startsWith('/api') - but Express matches routes
// case-insensitively and on the decoded path, so /API/... and /%61pi/...
// reached every API handler anyway.
// Run: node tests/apiGateCase.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/apiMiddleware.js'), 'utf8');
const fnSrc = src.slice(src.indexOf('function isApiPath(url) {'), src.indexOf('\n}\n', src.indexOf('function isApiPath(url) {')) + 2);
// eslint-disable-next-line no-new-func
const isApiPath = new Function(`${fnSrc}\nreturn isApiPath;`)();

test('every spelling Express routes to the API is gated', () => {
  for (const url of ['/api/boards', '/API/boards', '/Api/user', '/%61pi/boards', '/%41PI/users', '/api', '/api?x=1']) {
    assert.equal(isApiPath(url), true, url);
  }
});

test('nothing else is (negative)', () => {
  for (const url of ['/', '/b/x/board', '/apiary', '/cdn/storage/attachments/x', '/sign-in', '/%zz']) {
    assert.equal(isApiPath(url), false, url);
  }
});

test('the gate uses it', () => {
  assert.match(src, /const api = isApiPath\(req\.url\);/);
  assert.doesNotMatch(src, /req\.url\.startsWith\('\/api'\)/);
});
