'use strict';

// #4434: the clear HTML layout as the default for notifications and for
// account e-mails.
// Run: node tests/accountEmailHtml.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderAccountEmailHtml } = require('../models/lib/accountEmailHtml.js');
const { BUILT_IN } = require('../models/lib/notificationDelivery.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const fill = (key, v) => en[key].replace(/__(\w+)__/g, (m, k) => v[k] ?? '');

// Positive: the real English texts, laid out.
const url = 'https://wekan.example.com/#/reset-password/abc_DEF-123';
const html = renderAccountEmailHtml({ text: fill('email-resetPassword-text', { user: 'Alice', url }), siteName: 'WeKan' });
assert.match(html, /^<div style="font-family:/);
assert.match(html, /<p style="margin:0 0 16px 0">Hello Alice,<\/p>/);
assert.match(html, new RegExp(`<a href="${url.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}" style="display:inline-block;[^"]*">`), 'the link is a button');
assert.match(html, /font-weight:bold;margin:0 0 20px 0">WeKan<\/div>/);
const invite = renderAccountEmailHtml({ text: fill('email-invite-register-text', { user: 'Bob', inviter: 'Carol', url: 'https://w.example/sign-up', icode: 'XYZ' }) });
assert.match(invite, /<a href="https:\/\/w\.example\/sign-up" style="color:#0b6bcb">https:\/\/w\.example\/sign-up<\/a>/, 'a link inside a paragraph is linked');
assert.match(invite, /And your invitation code is: XYZ/);
assert.equal(BUILT_IN.email.layout, 'clear', 'notification e-mails default to the clear layout');
console.log('  ok - account e-mails and notifications in the clear layout');

// Negative: nothing anybody typed becomes markup; only http(s) is linked.
const evil = renderAccountEmailHtml({ text: 'Dear <img src=x onerror=alert(1)>,\n\n"Board" & <b>x</b> invites you\n\njavascript:alert(1)\n\nhttps://ok.example/a?b=1&c="><script>',
  siteName: '<script>alert(1)</script>' });
assert.doesNotMatch(evil, /<img|<script|<b>|onerror=alert\(1\)>/);
assert.match(evil, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(evil, /href="javascript:/);
assert.match(evil, /href="https:\/\/ok\.example\/a\?b=1&amp;c=&quot;&gt;&lt;script&gt;" style=/, 'a quote in an address cannot close the attribute');
assert.equal(renderAccountEmailHtml({ text: '' }).includes('<p'), false);
assert.doesNotMatch(renderAccountEmailHtml({ text: 'ftp://x.example/a' }), /<a /);
console.log('  ok - everything escaped; only http(s) addresses are links');

// Wiring: Meteor's account templates, and WeKan's own e-mail strings.
const accounts = read('config/accounts.js');
assert.match(accounts, /\['resetPassword', 'verifyEmail', 'enrollAccount'\]\.forEach\(templateName => \{\s*Accounts\.emailTemplates\[templateName\]\.html = \(user, url\) => \{\s*try \{/);
assert.match(accounts, /text: Accounts\.emailTemplates\[templateName\]\.text\(user, url\),/, 'the HTML is the same localized text');
const localization = read('server/lib/emailLocalization.js');
assert.match(localization, /if \(options\.html !== undefined\) mail\.html = options\.html;\s*\n(\s*\/\/[^\n]*\n)*\s*else if \(typeof options\.text === 'string' && options\.text\.startsWith\('email-'\) && typeof text === 'string'\) \{/,
  'a caller\'s own HTML wins, and only WeKan\'s e-mail strings get the layout');
assert.match(localization, /text: text\b/, 'the plain-text part is still sent');
console.log('  ok - reset, verify, enroll and invitations get the HTML part; text stays');

console.log('\naccountEmailHtml: all tests passed');
