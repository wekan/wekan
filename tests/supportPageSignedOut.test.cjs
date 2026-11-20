'use strict';
// Member menu / Support. Admin Panel / Settings / Visibility marks the Support
// page Public or not, and support.jade has a case for each, signed in or out -
// but the /support route sent every signed-out visitor to sign-in first, so a
// Public page was never public and the "only for logged-in users" case was never
// reached. Now the route is open and the publication decides: a signed-out
// visitor receives the page's text only when the page is Public. The menu links
// to /support; the old supportPopup it no longer opened is removed.
// Run: node --test tests/supportPageSignedOut.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const router = read('config/router.js');
const publication = read('server/publications/settings.js');

test('the /support route has no sign-in guard; its template handles signed-out visitors', () => {
  const start = router.indexOf("FlowRouter.route('/support', {");
  assert.ok(start > 0);
  const route = router.slice(start, router.indexOf('\n});', start));
  assert.doesNotMatch(route, /triggersEnter|ensureSignedIn/);
  const jade = read('client/components/main/support.jade');
  assert.match(jade, /if isSupportPublic[\s\S]*else[\s\S]*if currentUser[\s\S]*support-info-only-for-logged-in-users/);
  // Negative: the other pages keep theirs - only /support was opened.
  for (const other of ["'/accessibility'", "'/activity'"]) {
    const s = router.indexOf(`FlowRouter.route(${other}, {`);
    assert.match(router.slice(s, router.indexOf('\n});', s)), /ensureSignedInUnlessSandstorm/, other);
  }
});

test('a page that is not Public sends its text to signed-in subscribers only', () => {
  const fn = publication.slice(publication.indexOf("Meteor.publish('setting'"),
    publication.indexOf("Meteor.publish('mailServer'"));
  assert.match(fn, /: \{ \.\.\.SETTING_FIELDS \};/, 'a copy, so one visitor never changes the next one\'s fields');
  assert.match(fn, /if \(!viewer\) \{[\s\S]*supportPagePublic !== true\) delete fields\.supportPageText;/);
  // Negative: the shared constant itself is never edited in place.
  assert.doesNotMatch(publication, /delete SETTING_FIELDS\./);
});

test('negative: the unused support popup and its text are gone from the client', () => {
  const jade = read('client/components/users/userHeader.jade');
  const js = read('client/components/users/userHeader.js');
  assert.doesNotMatch(jade, /template\(name="supportPopup"\)/);
  assert.doesNotMatch(js, /js-support'|Popup\.open\('support'\)/);
  assert.ok(!/supportPopupText: 1/.test(publication), 'nothing reads it, so nothing sends it to every visitor');
  // The menu entry itself is the link to the page.
  assert.match(jade, /href="\/support"|pathFor 'support'|'support'/);
});
