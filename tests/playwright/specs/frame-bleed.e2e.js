'use strict';
// FrameBleed: with the browser policy on (the Docker and Snap default, which
// build.sh's test server uses), the app's pages refuse to be framed by
// another site.
const { test, expect } = require('../fixtures');

test('the app page carries the framing policy (FrameBleed)', async ({ request }) => {
  const res = await request.get('/sign-in');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-security-policy'] || '').toContain("frame-ancestors 'self'");
  expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN');
});
