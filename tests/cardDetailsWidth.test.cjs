'use strict';
// #6939: the card details window opens at the width its user dragged it to,
// else at the Admin Panel's default percentage of the browser window (520px at
// least), else 520px - and the card opened as a popup takes the same width,
// while the mobile view and the maximized card do not.
// models/lib/cardDetailsWidth.js decides; the stylesheet, the client module, the
// profile field, the method, the setting and the menu entry carry it.
// Run: node --test tests/cardDetailsWidth.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const w = require('../models/lib/cardDetailsWidth');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the dragged width wins, then the administrator\'s percentage, then the stylesheet\'s 520px', () => {
  assert.equal(w.cardDetailsWidthCss({ userWidth: 900, defaultPercent: 60 }), 'min(900px, calc(100vw - 16px))');
  assert.equal(w.cardDetailsWidthCss({ defaultPercent: 60 }), 'clamp(520px, 60vw, calc(100vw - 16px))');
  assert.equal(w.cardDetailsWidthCss({}), null);
  assert.equal(w.cardDetailsWidthCss(), null);
});

test('a dragged width is rounded and kept usable; anything else is no width', () => {
  assert.equal(w.clampUserWidth(812.6), 813);
  assert.equal(w.clampUserWidth(50), w.MIN_USER_PX);
  assert.equal(w.clampUserWidth(1e9), w.MAX_USER_PX);
  for (const bad of [NaN, Infinity, -5, 0, '900', null, undefined]) assert.equal(w.clampUserWidth(bad), null, String(bad));
});

test('the administrator\'s percentage is a whole number from 30 to 95; empty is none', () => {
  assert.equal(w.clampDefaultPercent('60'), 60);
  assert.equal(w.clampDefaultPercent(60.4), 60);
  assert.equal(w.clampDefaultPercent(5), 30);
  assert.equal(w.clampDefaultPercent(200), 95);
  for (const none of ['', '  ', null, undefined, 'abc', NaN, -1]) assert.equal(w.clampDefaultPercent(none), null, String(none));
});

test('the resize handle is the bottom corner on the inline-end side', () => {
  const rect = { left: 100, right: 620, top: 8, bottom: 800 };
  assert.ok(w.onResizeHandle(rect, 612, 795));
  assert.ok(!w.onResizeHandle(rect, 300, 795), 'the bottom edge elsewhere is content');
  assert.ok(!w.onResizeHandle(rect, 612, 400), 'the end edge higher up is content');
  assert.ok(w.onResizeHandle(rect, 105, 795, true), 'bottom-left in a right-to-left page');
  assert.ok(!w.onResizeHandle(rect, 612, 795, true));
  assert.ok(w.widthChanged(520, 760));
  assert.ok(!w.widthChanged(520, 521), 'rounding is no drag');
});

test('the stylesheet reads the width for the floating window and for the popup, not for mobile or maximized', () => {
  const css = read('client/components/cards/cardDetails.css');
  assert.match(css, /:not\(\[style\*="left"\]\):not\(\[style\*="top"\]\) \{[^}]*width: var\(--wekan-card-details-width, min\(520px, 90vw\)\)/);
  assert.match(css, /width: var\(--wekan-card-details-width, 520px\);\s*max-width: calc\(100vw - 16px\);/,
    'the popup form (min-width 801px rule) takes it, within the viewport');
  // Negative: the maximized card and the mobile view keep their own !important widths.
  assert.match(css, /\.card-details-maximized:not\(\.card-details-popup\):not\(\.card-details-collapsed\) \{[^}]*width: auto !important/);
  assert.match(css, /body\.mobile-mode \.card-details \{[^}]*width: 100vw !important/);
  assert.equal(w.CSS_PROPERTY, '--wekan-card-details-width');
});

test('the width is kept like the left menu\'s: profile, cookie, a clamped method; the default is a published setting', () => {
  const users = read('models/users.js');
  assert.match(users, /'profile\.cardDetailsWidth': \{[^}]*type: Number,\s*optional: true/);
  assert.match(users, /Users\.getPublicCardDetailsWidth = /);
  assert.match(users, /Users\.setPublicCardDetailsWidth = /);
  const method = read('server/models/users.js');
  const at = method.indexOf('async setCardDetailsWidth(width)');
  assert.ok(at > 0);
  const body = method.slice(at, at + 900);
  assert.match(body, /check\(width, Match\.OneOf\(Number, null\)\)/);
  assert.match(body, /clampUserWidth\(width\)/, 'clamped on the server, NaN refused');
  assert.match(body, /\$unset: \{ 'profile\.cardDetailsWidth': '' \}/, 'null forgets it');
  const settings = read('models/settings.js');
  assert.match(settings, /cardDetailsDefaultWidthPercent: \{\s*type: Number,\s*optional: true,\s*min: 30,\s*max: 95/);
  assert.match(read('server/publications/settings.js'), /cardDetailsDefaultWidthPercent: 1/);
});

test('the client remembers a drag of the handle, and the card menu and a double-click reset it', () => {
  const client = read('client/lib/cardDetailsWidthMemory.js');
  assert.match(client, /root\.style\.setProperty\(widths\.CSS_PROPERTY, css\)/);
  assert.match(client, /addEventListener\('pointerdown'/);
  assert.match(client, /addEventListener\('dblclick'/);
  // A resize ending outside the card (every widening one) does not close it.
  assert.match(client, /onResizeHandle\([\s\S]{0,1000}Session\.set\('cardDetailsIsResizing', true\)/);
  assert.match(client, /Meteor\.call\('setCardDetailsWidth', value\)/);
  const details = read('client/components/cards/cardDetails.js');
  assert.match(details, /if \(Session\.get\('cardDetailsIsDragging'\) \|\| Session\.get\('cardDetailsIsResizing'\) \|\| selectingInsideCard\)/);
  assert.match(details, /rememberCardDetailsWidth\(element\);\s*try \{\s*anchorCardDetailsX\(element\)/);
  assert.match(details, /'click \.js-reset-card-details-width'/);
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /if hasCardDetailsWidth\s+ul\.pop-over-list\s+li\s+a\.js-reset-card-details-width/);
  const admin = read('client/components/settings/settingBody.jade');
  assert.match(admin, /input\.wekan-form-control#card-details-default-width-percent\(type="number" min="30" max="95"/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['card-details-reset-width', 'card-details-default-width', 'card-details-default-width-desc', 'card-details-default-width-saved']) {
    assert.ok(en[key], key);
  }
});
