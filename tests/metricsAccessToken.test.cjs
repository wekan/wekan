'use strict';

// Guard: MetricsBleed sibling (2026-10-02). /metrics accepted `token == METRICS_ACCESS_TOKEN`. With
// the variable set but empty, `?access_token=` matched; the loose, early-exit
// comparison also leaked through timing how much of a guess was right.
// Run: node tests/metricsAccessToken.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'models/server/metrics.js'), 'utf8');
const start = src.indexOf('function accessToken(req) {');
const body = src.slice(start, src.indexOf('\n}\n', start) + 2);

function accessToken(env, req) {
  // eslint-disable-next-line no-new-func
  return new Function('process', 'require', `${body}\nreturn accessToken;`)({ env }, require)(req);
}
const bearer = token => ({ headers: { authorization: `Bearer ${token}` } });

test('the reported shape: an empty configured token admits nobody', () => {
  assert.equal(accessToken({ METRICS_ACCESS_TOKEN: '' }, { headers: {}, query: { access_token: '' } }), false);
  assert.equal(accessToken({}, { headers: {}, query: { access_token: '' } }), false);
  assert.equal(accessToken({}, { headers: {}, query: {} }), false);
});

test('only the exact token passes, as a header or a query string', () => {
  const env = { METRICS_ACCESS_TOKEN: 's3cret-token' };
  assert.equal(accessToken(env, bearer('s3cret-token')), true);
  assert.equal(accessToken(env, { headers: {}, query: { access_token: 's3cret-token' } }), true);
  for (const wrong of ['s3cret', 's3cret-token ', 'S3CRET-TOKEN', '']) {
    assert.equal(accessToken(env, bearer(wrong)), false, JSON.stringify(wrong));
  }
  // A repeated query parameter arrives as an array; it is not a token.
  assert.equal(accessToken(env, { headers: {}, query: { access_token: ['s3cret-token'] } }), false);
});

test('negative: the comparison is constant-time and never loose', () => {
  assert.match(body, /timingSafeEqual\(digest\(token\), digest\(valid_token\)\)/);
  assert.doesNotMatch(body, /\btoken\s*==(?!=)|==\s*valid_token/);
});
