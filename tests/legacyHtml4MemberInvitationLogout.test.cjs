'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const settings = read('server/models/settings.js');
const middleware = read('server/legacyHtml4.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const sessions = read('server/lib/legacyHtml4Session.js');
const router = read('config/router.js');
const jade = read('client/components/users/userHeader.jade');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4MemberInvitationLogout:');

test('both renderers expose stable invitation and logout routes', () => {
  for (const route of ['/account/invite', '/account/logout']) {
    assert.ok(router.includes(`FlowRouter.route('${route}'`));
    assert.ok(pages.includes(`path !== '${route}'`));
  }
  assert.ok(jade.includes('href="/account/invite"'));
  assert.ok(jade.includes('href="/account/logout"'));
  assert.ok(jade.includes('form.js-account-logout'));
  assert.ok(pages.includes("legacyOperation: 'send-member-invitations'"));
  assert.ok(pages.includes("legacyOperation: 'logout-member'"));
});

test('one server boundary validates invitation identity, size and board scope', () => {
  assert.ok(settings.includes('export async function invitationChoicesForUser'));
  assert.ok(settings.includes('export async function sendInvitationsForUser'));
  assert.match(settings, /archived: false, members: \{ \$elemMatch: \{[\s\S]*?isActive: true, isAdmin: true/);
  assert.match(settings, /allowedBoards\.length !== uniqueBoards\.length/);
  assert.match(settings, /normalizedEmails\.some\(email => !email/);
  assert.match(settings, /emails\.length > 100 \|\| boards\.length > 500/);
  assert.ok(settings.includes("source: 'memberInvitation'"));
  assert.ok(settings.includes("bleed: 'InvitationBleed'"));
  assert.ok(middleware.includes('sendInvitationsForUser(session.userId'));
});

test('cookieless logout destroys the exact rotated session before rendering sign in', () => {
  assert.match(sessions, /removeAsync\(\{[\s\S]*?_id: session\._id,[\s\S]*?userId: session\.userId/);
  const destroy = middleware.indexOf('await destroyLegacyHtml4Session(session)');
  const redirect = middleware.indexOf("res.setHeader('Location', '/sign-in')", destroy);
  const finish = middleware.indexOf('return;', redirect);
  assert.ok(destroy > 0 && redirect > destroy && finish > redirect);
  assert.ok(middleware.includes("requestFields.legacyOperation === 'logout-member'"));
});

console.log(`\nlegacyHtml4MemberInvitationLogout: ${passed} tests passed`);
