'use strict';
// The scripts the Playwright fixture adds to every page of a test's context
// (tests/playwright/fixtures.js): a setLanguage call that resolves once the
// page shows the language, and WebKit not freezing on a push subscription.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { waitForLanguageOnSetLanguage } = require('./playwright/helpers/language.cjs');
const { noPushSubscriptionInWebKit } = require('./playwright/helpers/webkit-push.cjs');

// A page: <html lang>, frames, timers, and a Meteor whose method resolves at once.
function fakePage({ lang = 'en' } = {}) {
  const calls = [];
  const g = {
    document: { documentElement: { lang } },
    requestAnimationFrame: fn => setTimeout(fn, 1),
    setTimeout, setInterval, clearInterval,
    Date,
    Meteor: { callAsync: async (name, ...args) => { calls.push([name, ...args]); return `${name} done`; } },
  };
  g.window = g;
  return { g, calls };
}
function run(fn, g) {
  return new Function('window', 'document', 'requestAnimationFrame', 'setTimeout', 'setInterval', 'clearInterval', 'Date', 'navigator', 'PushManager',
    `(${fn.toString()})()`)(g, g.document, g.requestAnimationFrame, g.setTimeout, g.setInterval, g.clearInterval, g.Date, g.navigator, g.PushManager);
}

test('setLanguage resolves only once <html lang> names the language', async () => {
  const { g, calls } = fakePage();
  run(waitForLanguageOnSetLanguage, g);
  let done = false;
  const pending = g.Meteor.callAsync('setLanguage', 'zh_SG').then(value => { done = true; return value; });
  await new Promise(r => setTimeout(r, 120));
  assert.equal(done, false, 'not while the page still shows the old language');
  g.document.documentElement.lang = 'zh-SG';
  assert.equal(await pending, 'setLanguage done', 'the method result is kept');
  assert.deepEqual(calls, [['setLanguage', 'zh_SG']]);
});

test('other methods are not held, and the wrapper is installed once', async () => {
  const { g } = fakePage();
  run(waitForLanguageOnSetLanguage, g);
  const first = g.Meteor.callAsync;
  run(waitForLanguageOnSetLanguage, g);
  assert.equal(g.Meteor.callAsync, first);
  const started = Date.now();
  assert.equal(await g.Meteor.callAsync('cards.update', 1), 'cards.update done');
  assert.ok(Date.now() - started < 50);
});

test('negative: a language the page never shows does not hang the spec, it waits at most about 10 s', () => {
  const source = waitForLanguageOnSetLanguage.toString();
  assert.match(source, /Date\.now\(\) \+ 10000/);
  assert.match(source, /\|\| Date\.now\(\) > deadline/);
});

test('a page without Meteor yet gets the wrapper when Meteor arrives', async () => {
  const { g } = fakePage();
  const meteor = g.Meteor; delete g.Meteor;
  run(waitForLanguageOnSetLanguage, g);
  g.Meteor = meteor;
  await new Promise(r => setTimeout(r, 60));
  assert.equal(g.Meteor.callAsync.__waitsForLanguage, true);
});

test('WebKit answers a push subscription with none; Chromium and Firefox are left alone', async () => {
  const agents = {
    webkit: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    chromium: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
  };
  for (const [name, userAgent] of Object.entries(agents)) {
    const original = function getSubscription() { return 'real'; };
    function PushManager() {}
    PushManager.prototype.getSubscription = original;
    const g = { navigator: { userAgent }, PushManager };
    run(noPushSubscriptionInWebKit, g);
    if (name === 'webkit') assert.equal(await PushManager.prototype.getSubscription(), null);
    else assert.equal(PushManager.prototype.getSubscription, original, `${name} untouched`);
  }
});

test('the fixture adds both scripts to the test context', () => {
  const fixtures = fs.readFileSync(path.join(__dirname, 'playwright', 'fixtures.js'), 'utf8');
  assert.match(fixtures, /context: async \(\{ context \}, use\) => \{[\s\S]*addInitScript\(waitForLanguageOnSetLanguage\)[\s\S]*addInitScript\(noPushSubscriptionInWebKit\)/);
});
