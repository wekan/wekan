const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAuthenticationSubmitHandler } = require('../client/lib/authenticationSubmit');
async function fixture(overrides = {}) {
  const calls = [];
  const form = { id: 'at-pwd-form' };
  const event = () => ({ target: form, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } });
  const handler = createAuthenticationSubmitHandler({
    isSignIn: () => true,
    readCredentials: () => ({ username: 'directory-user', password: 'test-only' }),
    resolveMethod: async () => 'ldap',
    submitPassword: () => calls.push('password'),
    login: (method, username, password, cb) => { calls.push(method); cb(); },
    complete: error => calls.push(error || 'success'),
    setBusy: busy => calls.push(busy),
    ...overrides,
  });
  return { handler, calls, event, form };
}
test('cancels submission synchronously before asynchronous method lookup', async () => {
  let resolve;
  const f = await fixture({ resolveMethod: () => new Promise(r => { resolve = r; }) });
  const event = f.event();
  const pending = f.handler(event);
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
  await f.handler(f.event());
  resolve('ldap');
  await pending;
  assert.deepEqual(f.calls, [true, 'ldap', false, 'success']);
});
test('LDAP failure is delivered without success or a password fallback; retry works', async () => {
  const error = { reason: 'Login denied after directory authentication' };
  const f = await fixture({ login: (m,u,p,cb) => cb(error) });
  await f.handler(f.event());
  await f.handler(f.event());
  assert.deepEqual(f.calls, [true, false, error, true, false, error]);
});
test('lookup rejection and synchronous provider exceptions release the form', async () => {
  for (const key of ['resolveMethod', 'login']) {
    const error = new Error('test failure');
    const f = await fixture({ [key]: () => { throw error; } });
    await f.handler(f.event());
    assert.deepEqual(f.calls, [true, false, error]);
  }
});
test('password replay reaches the original submit handler exactly once', async () => {
  let f;
  f = await fixture({ resolveMethod: async () => 'password', submitPassword: () => {
    const replay = f.event();
    f.handler(replay);
    assert.equal(replay.prevented, false);
    f.calls.push('password');
  } });
  await f.handler(f.event());
  assert.deepEqual(f.calls, [true, false, 'password']);
});
test('empty credentials use original form validation', async () => {
  const f = await fixture({ readCredentials: () => ({}) });
  await f.handler(f.event());
  assert.deepEqual(f.calls, [true, false, 'password']);
});
test('password replay waits beyond microtasks and rejects duplicate submissions while queued', async () => {
  const f = await fixture({ resolveMethod: () => 'password' });
  const pending = f.handler(f.event());
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(f.calls, [true], 'must not replay during the native submit dispatch');
  const duplicate = f.event();
  await f.handler(duplicate);
  assert.equal(duplicate.prevented, true);
  await pending;
  assert.deepEqual(f.calls, [true, false, 'password']);
});
test('registration and unrelated forms are not intercepted', async () => {
  const f = await fixture({ isSignIn: () => false });
  const event = f.event(); await f.handler(event);
  assert.equal(event.prevented, false); assert.deepEqual(f.calls, []);
  const g = await fixture(); const other = g.event(); other.target = { id: 'passwordless' };
  await g.handler(other); assert.equal(other.prevented, false); assert.deepEqual(g.calls, []);
});
test('CAS and SAML use the same single-provider completion path', async () => {
  for (const method of ['cas', 'saml']) {
    const f = await fixture({ resolveMethod: async () => method });
    await f.handler(f.event());
    assert.deepEqual(f.calls, [true, method, false, 'success']);
  }
});
