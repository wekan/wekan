'use strict';
// #824: /avatar-default/:userId redirects to DEFAULT_AVATAR_URL when the
// server has it, and answers 404 without it or for an unknown user. The test
// server's environment decides which, so both are accepted - but never a
// redirect to anything other than http(s).
const { test, expect } = require('../fixtures');

test('the default avatar route redirects to an http(s) address or answers 404', async ({ request, user }) => {
  const known = await request.get(`/avatar-default/${user.id}`, { maxRedirects: 0 });
  expect([302, 404]).toContain(known.status());
  if (known.status() === 302) expect(known.headers().location).toMatch(/^https?:\/\//);
  const unknown = await request.get('/avatar-default/no-such-user-x', { maxRedirects: 0 });
  expect(unknown.status()).toBe(404);
  const bad = await request.get('/avatar-default/..%2F..%2Fetc', { maxRedirects: 0 });
  expect(bad.status()).toBe(404);
});
