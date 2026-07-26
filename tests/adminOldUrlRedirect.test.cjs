'use strict';

// /information and /translation are panes of Admin Panel / Settings now, and the
// old URLs redirect there.
//
// They redirected with `FlowRouter.go('setting')` called from INSIDE triggersEnter.
// A trigger runs while its own route is still entering, and a go() from there is
// swallowed - so nothing was rendered at all and the browser kept showing whatever
// page it was on. Playwright caught it on every browser: /information showed All
// Boards, so "Reactivity mode" was nowhere on the page.
//
// A trigger redirects with the `redirect` it is HANDED. That is the form the
// redirections table at the bottom of config/router.js has always used.
//
// Run: node tests/adminOldUrlRedirect.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const router = read('config/router.js');

// The body of one FlowRouter.route('<path>', {...}) definition.
function routeBody(routePath) {
  const at = router.indexOf(`FlowRouter.route('${routePath}', {`);
  assert.notStrictEqual(at, -1, `no route for ${routePath}`);
  const end = router.indexOf('\n});', at);
  return router.slice(at, end);
}

console.log('adminOldUrlRedirect:');

test('the old page URLs redirect with the redirect they are given', () => {
  for (const routePath of ['/information', '/translation']) {
    const body = routeBody(routePath);
    assert.ok(/\(context, redirect\) => \{/.test(body),
      `${routePath}: the trigger must take the redirect argument`);
    assert.ok(/redirect\(FlowRouter\.path\('setting'\)\)/.test(body),
      `${routePath}: and use it`);
    assert.ok(!/FlowRouter\.go\(/.test(body),
      `${routePath}: FlowRouter.go() from inside a trigger is swallowed - the page `
      + 'never changes');
  }
});

test('each one asks for the pane it used to be a page of', () => {
  assert.ok(/Session\.set\('settingsOpenPane', 'version-setting'\)/
    .test(routeBody('/information')), '/information is the Version pane');
  assert.ok(/Session\.set\('settingsOpenPane', 'translation-setting'\)/
    .test(routeBody('/translation')), '/translation is the Translation pane');
});

test('Settings opens that pane, once, and then forgets it', () => {
  const src = read('client/components/settings/settingBody.js');
  const created = src.slice(src.indexOf('Template.setting.onCreated'));
  const block = created.slice(created.indexOf("const requestedPane = Session.get('settingsOpenPane')"));
  assert.ok(block.length, 'Template.setting must read the requested pane');
  assert.ok(/Session\.set\('settingsOpenPane', null\)/.test(block.slice(0, 300)),
    'and clear it, so a later visit to /setting opens on the default');
  assert.ok(/this\.translationSetting\.set\(true\)/.test(block.slice(0, 600)));
  assert.ok(/this\.versionSetting\.set\(true\)/.test(block.slice(0, 800)));
  // It must not be overruled a moment later by the site-admin autorun.
  assert.ok(/this\.openPaneDecided = true/.test(block.slice(0, 800)),
    'the pane the URL asked for is the decision - the autorun must not redo it');
});

test('the state it sets exists by the time it runs', () => {
  // Every pane is a ReactiveVar created in onCreated; reading one before its
  // line would be `undefined.set()`, i.e. a blank page on that URL.
  const src = read('client/components/settings/settingBody.js');
  const created = src.slice(src.indexOf('Template.setting.onCreated'));
  const use = created.indexOf("const requestedPane = Session.get('settingsOpenPane')");
  for (const name of ['versionSetting', 'translationSetting']) {
    const declared = created.indexOf(`this.${name} = new ReactiveVar(`);
    assert.ok(declared !== -1 && declared < use,
      `this.${name} must be created before the requested pane is applied`);
  }
});

console.log(`\n${passed} tests passed`);
