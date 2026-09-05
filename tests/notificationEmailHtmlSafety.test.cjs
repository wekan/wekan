'use strict';

// Regression coverage for MailTitleBleed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { escapeEmailHtml, safeEmailSubject } = require(
  path.join(root, 'models/lib/emailNotificationSafety'),
);
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
  /htmlEnabled \? escapeEmailHtml\(text\)\.replace\(\/\\n\/g, '<br\/>'\) : text/,
  'the completed localized message must be escaped before line breaks become HTML',
);
assert.match(
  email,
  /const subject = safeEmailSubject\(formatActivityNotificationTitle\(/,
  'notification subjects must use the shared header-safe formatter',
);

console.log('notificationEmailHtmlSafety: 5 assertions passed');
