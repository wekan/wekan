'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'playwright/helpers/auth.js'), 'utf8');
async function check({ loaded, resumed }) {
  let id = resumed ? 'expected' : null, cookiePending = !loaded;
  let tokenLogins = 0, cookieWaits = 0;
  const storage = { getItem() { return null; }, removeItem() {}, setItem() {} };
  const context = {
    module: { exports: {} }, exports: {}, require,
    process: { env: { WEKAN_BASE_URL: 'http://localhost:3000' } },
    setTimeout, Date, Promise, window: { localStorage: storage },
    localStorage: storage,
    Meteor: {
      subscribe() {}, loggingIn: () => false, userId: () => id,
      loginWithToken(_token, callback) {
        assert.equal(cookiePending, false, 'never login during asynchronous cookie retrieval');
        tokenLogins++; id = 'expected'; callback();
      },
    },
    history: { pushState() {} }, dispatchEvent() {}, PopStateEvent: class {},
  };
  context.window.history = context.history;
  context.window.dispatchEvent = context.dispatchEvent;
  vm.createContext(context);
  vm.runInContext(source, context);
  const page = {
    url: () => loaded ? 'http://localhost:3000/sign-in' : 'about:blank',
    context: () => ({ async addCookies() {} }),
    async addInitScript() {}, async goto() {},
    async evaluate(fn, arg) { context.arg = arg; return vm.runInContext(`(${fn.toString()})(arg)`, context); },
    async waitForFunction(fn, arg) {
      if (cookiePending && arg === 'expected') { cookieWaits++; cookiePending = false; id = 'expected'; }
      assert.ok(await this.evaluate(fn, arg));
    },
  };
  await context.module.exports.loginWithToken(page, 'expected', 'test-token');
  assert.equal(tokenLogins, loaded && !resumed ? 1 : 0);
  assert.equal(cookieWaits, loaded ? 0 : 1);
}
(async () => {
  await check({ loaded: false, resumed: false });
  await check({ loaded: true, resumed: true });
  await check({ loaded: true, resumed: false });
  console.log('Playwright cookie resume: 3 passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
