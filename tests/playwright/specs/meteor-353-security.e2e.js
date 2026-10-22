'use strict';
// Meteor 3.5.3's security fixes, carried by WeKan's forks of Meteor's packages
// (packages/allow-deny, ddp-server, dynamic-import, google-oauth,
// facebook-oauth, shell-server) on Meteor 3.6-rc.0. Each attack is sent to the
// running server: the server keeps answering, the request is refused, and the
// attempt is in Admin Panel / Problems (the eventlog security rows).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const problems = bleed => db.findOne('eventlog', { stream: 'security', bleed })?.count || 0;

test('a DDP message named __proto__, toString or a number does not crash the server', async ({ loggedInPage: page }) => {
  const before = problems('Meteor DDP');
  const answers = await page.evaluate(async () => {
    const stream = window.Meteor.connection._stream;
    for (const name of ['__proto__', 'toString', 'constructor', 7]) {
      stream.send(JSON.stringify({ msg: name }));
    }
    // The connection is still served after them.
    return window.Meteor.callAsync('getAuthenticationsEnabled').then(() => 'answered');
  });
  expect(answers).toBe('answered');
  await expect.poll(() => problems('Meteor DDP')).toBeGreaterThan(before);
});

test('an unknown but ordinary DDP message name is refused without a Problems row (negative)', async ({ loggedInPage: page }) => {
  const before = problems('Meteor DDP');
  await page.evaluate(async () => {
    window.Meteor.connection._stream.send(JSON.stringify({ msg: 'not-a-ddp-message' }));
    await window.Meteor.callAsync('getAuthenticationsEnabled');
  });
  expect(problems('Meteor DDP')).toBe(before);
});

test('an update naming a top-level __proto__ field reaches the validators and is recorded', async ({ loggedInPage: page, user }) => {
  const before = problems('Meteor allow-deny');
  // Raw on the socket: the client's own EJSON copy would drop a '__proto__'
  // key before it is sent, and an attacker does not use the client's copy.
  await page.evaluate(id => {
    window.Meteor.connection._stream.send(`{"msg":"method","id":"proto-1","method":"/users/update",` +
      `"params":[{"_id":${JSON.stringify(id)}},{"$set":{"__proto__":{"isAdmin":true}}}]}`);
  }, user.id);
  await expect.poll(() => problems('Meteor allow-deny')).toBeGreaterThan(before);
  expect(db.findOne('users', { _id: user.id })?.isAdmin).not.toBe(true);
  // ...and the server still answers.
  await page.evaluate(() => window.Meteor.callAsync('getAuthenticationsEnabled'));
});

test('dynamic import() refuses a malformed or over-deep request, and the server keeps serving', async ({ page }) => {
  await page.goto('/sign-in');
  const before = problems('Meteor dynamic-import');
  const url = '/__meteor__/dynamic-import/fetch';
  const statuses = await page.evaluate(async target => {
    const post = body => fetch(target, { method: 'POST', body }).then(r => r.status);
    let deep = '{}';
    for (let i = 0; i < 200; i += 1) deep = `{"a":${deep}}`;
    return {
      malformed: await post('{not json'),
      deep: await post(deep),
      oversized: await post('x'.repeat(1024 * 1024 + 1)),
    };
  }, url);
  expect(statuses).toEqual({ malformed: 400, deep: 400, oversized: 413 });
  await expect.poll(() => problems('Meteor dynamic-import')).toBeGreaterThanOrEqual(before + 2);
  // The page still loads its code afterwards.
  await page.reload();
  await expect(page.locator('body')).toBeVisible();
});

test('a Google or Facebook direct-token login without a configured service is refused', async ({ page }) => {
  await page.goto('/sign-in');
  const results = await page.evaluate(async () => {
    const attempt = request => new Promise(resolve => {
      window.Accounts.callLoginMethod({
        methodArguments: [request],
        userCallback: error => resolve(error ? 'refused' : 'logged-in'),
      });
    });
    return {
      google: await attempt({ googleSignIn: true, accessToken: 'token-of-another-app' }),
      facebook: await attempt({ facebookSignIn: true, accessToken: 'token-of-another-app', expirationTime: 60 }),
    };
  });
  expect(results).toEqual({ google: 'refused', facebook: 'refused' });
});
