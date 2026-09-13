'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'playwright/helpers/auth.js'), 'utf8');
async function check({ loaded, resumed, switched = false }, baseUrl = 'http://localhost:3000') {
  let navigatedPath;
  let id = switched ? 'previous' : resumed ? 'expected' : null, cookiePending = !loaded;
  let tokenLogins = 0, cookieWaits = 0;
  const storage = { getItem() { return null; }, removeItem() {}, setItem() {} };
  const context = {
    module: { exports: {} }, exports: {}, require,
    process: { env: { WEKAN_BASE_URL: baseUrl } },
    setTimeout, Date, Promise, URL, window: { localStorage: storage },
    localStorage: storage,
    Meteor: {
      subscribe() {}, loggingIn: () => false, userId: () => id,
      loginWithToken(_token, callback) {
        assert.equal(cookiePending, false, 'never login during asynchronous cookie retrieval');
        tokenLogins++; id = 'expected'; callback();
      },
    },
    history: { pushState(_state, _title, path) { navigatedPath = path; } }, dispatchEvent() {}, PopStateEvent: class {},
  };
  context.window.history = context.history;
  context.window.dispatchEvent = context.dispatchEvent;
  vm.createContext(context);
  vm.runInContext(source, context);
  const page = {
    url: () => loaded ? `${baseUrl}/sign-in` : 'about:blank',
    context: () => ({ async addCookies() {} }),
    async addInitScript() {}, async goto() {},
    async reload() { id = null; cookiePending = true; },
    async evaluate(fn, arg) { context.arg = arg; return vm.runInContext(`(${fn.toString()})(arg)`, context); },
    async waitForFunction(fn, arg) {
      if (cookiePending && arg === 'expected') { cookieWaits++; cookiePending = false; id = 'expected'; }
      assert.ok(await this.evaluate(fn, arg));
    },
  };
  await context.module.exports.loginWithToken(page, 'expected', 'test-token');
  assert.equal(tokenLogins, loaded && !resumed && !switched ? 1 : 0);
  assert.equal(cookieWaits, !loaded || switched ? 1 : 0);
  const prefix = new URL(baseUrl).pathname.replace(/\/+$/, '');
  assert.equal(navigatedPath, `${prefix}/`);
  for (const [path, expected] of [['/b/id/board', `${prefix}/b/id/board`], [`${prefix}/b/id/board`, `${prefix}/b/id/board`], ['?label=green', '?label=green']]) {
    await context.module.exports.navigateInApp(page, path);
    assert.equal(navigatedPath, expected);
  }
}
(async () => {
  await check({ loaded: false, resumed: false });
  await check({ loaded: true, resumed: true });
  await check({ loaded: true, resumed: false });
  await check({ loaded: false, resumed: false }, 'http://localhost:3000/wekan');
  await check({ loaded: true, resumed: true }, 'http://localhost:3000/nested/boards/');
  await check({ loaded: true, resumed: true, switched: true });
  console.log('Playwright cookie resume: 6 scenarios and prefix navigation passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
