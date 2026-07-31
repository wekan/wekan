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

// The body of one FlowRouter.route(<path>, {...}) definition. The path is
// either a literal - the old URLs are - or an EXPRESSION: the panel's own
// routes take their path from `adminRoutePath(page)`, so the route and the
// links cannot disagree about what it is.
function routeBody(routePath) {
  const literal = router.indexOf(`FlowRouter.route('${routePath}', {`);
  const at = literal !== -1 ? literal : router.indexOf(`FlowRouter.route(${routePath}, {`);
  assert.notStrictEqual(at, -1, `no route for ${routePath}`);
  const end = router.indexOf('\n});', at);
  return router.slice(at, end);
}

console.log('adminOldUrlRedirect:');

test('the old page URLs redirect with the redirect they are given', () => {
  for (const routePath of ['/information', '/translation', '/setting']) {
    const body = routeBody(routePath);
    assert.ok(/\(context, redirect\) => \{/.test(body),
      `${routePath}: the trigger must take the redirect argument`);
    assert.ok(/redirect\(/.test(body), `${routePath}: and use it`);
    assert.ok(!/FlowRouter\.go\(/.test(body),
      `${routePath}: FlowRouter.go() from inside a trigger is swallowed - the page `
      + 'never changes');
  }
});

test('each one redirects to the URL of the pane it used to be a page of', () => {
  // They used to hand the pane over in a Session value that the page consumed
  // once. Every pane HAS an address now, so they redirect to it: the pane is in
  // the URL, where it can be linked, bookmarked and gone back to.
  const { adminPath } = require('../models/lib/adminUrls');
  // The default pane is NAMED now, rather than being left implicit in a bare
  // page URL: the address is meant to say where you are, and Version is
  // somewhere too.
  assert.strictEqual(adminPath('settings', 'version-setting'), '/admin/settings/version');
  assert.strictEqual(adminPath('settings', 'translation-setting'), '/admin/settings/translation');

  assert.ok(/redirect\(adminPath\('settings', 'version-setting'\)\)/
    .test(routeBody('/information')), '/information is the Version pane');
  assert.ok(/redirect\(adminPath\('settings', 'translation-setting'\)\)/
    .test(routeBody('/translation')), '/translation is the Translation pane');
  // And the singular page URL, which now names the pane it lands on rather
  // than the page that opens it.
  assert.ok(/redirect\(adminPath\('settings', 'version-setting'\)\)/
    .test(routeBody('/setting')), '/setting redirects to /admin/settings/version');
});

test('the route puts the pane the URL names into the page', () => {
  const body = routeBody("adminRoutePath('settings')");
  assert.ok(/resolvePaneId\('settings', params && params\.pane\)/.test(body),
    'the slug is resolved to a pane id');
  assert.ok(/Session\.set\('settingsOpenPane'/.test(body),
    'and handed to the page');
});

test('Settings opens that pane, and the autorun does not overrule it', () => {
  const src = read('client/components/settings/settingBody.js');
  const created = src.slice(src.indexOf('Template.setting.onCreated'));
  const block = created.slice(created.indexOf("Session.get('settingsOpenPane')"));
  assert.ok(block.length, 'Template.setting must read the requested pane');
  assert.ok(/openSettingsPane\(this, paneId\)/.test(block.slice(0, 400)),
    'through the one function that opens a pane');
  // It must not be overruled a moment later by the site-admin autorun, which
  // decides which pane a NON-site-admin opens on.
  assert.ok(/this\.openPaneDecided = true/.test(block.slice(0, 600)),
    'the pane the URL asked for is the decision - the autorun must not redo it');
  // Reactive, so a link to another pane while the page is already open switches
  // to it: the route action runs again without re-creating the template.
  assert.ok(/this\.autorun\(\(\) => \{[\s\S]{0,200}Session\.get\('settingsOpenPane'\)/.test(created),
    'and it is an autorun, not a one-shot read');
});

test('the state it sets exists by the time it runs', () => {
  // Every pane is a ReactiveVar created in onCreated; reading one before its
  // line would be `undefined.set()`, i.e. a blank page on that URL.
  const src = read('client/components/settings/settingBody.js');
  const created = src.slice(src.indexOf('Template.setting.onCreated'));
  const use = created.indexOf("Session.get('settingsOpenPane')");
  for (const name of ['versionSetting', 'translationSetting', 'webhookSetting',
    'layoutSetting', 'announcementSetting', 'accessibilitySetting',
    'tableVisibilityModeSetting', 'attachmentSettings']) {
    const declared = created.indexOf(`this.${name} = new ReactiveVar(`);
    assert.ok(declared !== -1 && declared < use,
      `this.${name} must be created before the requested pane is applied`);
  }
});

console.log(`\n${passed} tests passed`);
