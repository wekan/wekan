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
  /htmlEnabled\s*\n\s*\? buildHtmlNotificationLine\(\{/,
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

console.log('notificationEmailHtmlSafety: 8 assertions passed');
