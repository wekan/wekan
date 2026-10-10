'use strict';

// Regression coverage for MailTitleBleed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const safetyModulePath = path.join(root, 'models/lib/emailNotificationSafety');
const { escapeEmailHtml, safeEmailSubject } = require(safetyModulePath);
const safetySource = fs.readFileSync(`${safetyModulePath}.js`, 'utf8');
const email = fs.readFileSync(
  path.join(root, 'server/notifications/email.js'),
  'utf8',
);

assert.equal(
  escapeEmailHtml(`<img src=x onerror="alert('x')"> & card`),
  '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; card',
  'HTML-active card, list and board titles must render only as text',
);
assert.equal(
  escapeEmailHtml('ordinary Roadmap title'),
  'ordinary Roadmap title',
  'ordinary notification text must remain readable',
);
assert.equal(
  safeEmailSubject('Roadmap\r\nBcc: attacker@example.test'),
  'Roadmap Bcc: attacker@example.test',
  'titles must not inject additional mail headers',
);
assert.match(
  email,
  // Not `bodyTemplate ? text : ...`: that sent the template's substituted
  // member-written values as HTML (MailTitleBleed regression, 2026-10-02).
  // #5171: the clearly arranged layout comes first when chosen; it is built
  // by models/lib/notificationDelivery.js renderNotificationItem, which
  // escapes every value (tests/notificationDelivery.test.cjs).
  /const html = clear \? clear\.html : bodyTemplate\s*\?[^\n]*\$\{substituteVars\(bodyTemplate, htmlVars\)\}`\s*:\s*buildHtmlNotificationLine\(\{/,
  'the HTML notification body must be built by the shared, escaping-aware helper',
);
assert.match(
  safetySource,
  /escapeEmailHtml\(actorName \|\| ''\)/,
  'the actor name must be escaped before it is placed into the HTML message',
);
assert.match(
  safetySource,
  /escapeEmailHtml\(\s*descriptionText \|\| '',?\s*\)/,
  'the localized description must be escaped before it is placed into the HTML message',
);
assert.match(
  safetySource,
  /escapeEmailHtml\(safeUrl\)/,
  '#3118: the card\\/board URL must be escaped before it is placed into the <a href> link',
);
assert.match(
  safetySource,
  /<a href="\$\{escapeEmailHtml\(safeUrl\)\}">\$\{escapeEmailHtml\(safeUrl\)\}<\/a>/,
  '#3118: an HTML-formatted notification email must wrap the card\\/board URL in a real <a href> link, not plain text',
);
assert.match(
  email,
  // `let`, not `const`: the admin-template override (#2022) below reassigns
  // it through the same safeEmailSubject() guard, so it must stay mutable.
  /let subject = safeEmailSubject\(formatActivityNotificationTitle\(/,
  'notification subjects must use the shared header-safe formatter',
);

// MailTitleBleed regression (2026-10-02): with an admin-defined activity
// body template, the HTML body was the substituted template, and the values
// substituted into it - card, board and list titles, usernames, comments - are
// written by members. Markup in a card title reached other members' mail.
{
  const { substituteVars } = require('../models/lib/ruleVarsSubstitute');
  const { escapeEmailHtml } = require('../models/lib/emailNotificationSafety');
  const vars = { card: '<img src=x onerror=alert(1)>', board: 'B&B "x"', username: 'u' };
  const htmlVars = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, escapeEmailHtml(v)]));
  const out = substituteVars('<p>{username} changed <b>{card}</b> on {board}</p>', htmlVars);
  assert.equal(out, '<p>u changed <b>&lt;img src=x onerror=alert(1)&gt;</b> on B&amp;B &quot;x&quot;</p>',
    'the admin template keeps its HTML; the member-written values are escaped');
  assert.doesNotMatch(email, /const html = bodyTemplate\s*\?\s*text\b/,
    'the HTML body is never the raw substituted text');
  assert.match(email, /const htmlVars = Object\.fromEntries\(Object\.entries\(templateVars\)\.map\(\(\[key, value\]\) => \[key, escapeEmailHtml\(value\)\]\)\);/);
  assert.match(email, /\$\{substituteVars\(bodyTemplate, htmlVars\)\}/);
}

console.log('notificationEmailHtmlSafety: 12 assertions passed');
