'use strict';

// Regression coverage for #3118: URLs in HTML-formatted notification emails
// must render as real clickable <a href> links, not as plain text.

const assert = require('node:assert/strict');
const path = require('node:path');

const { buildHtmlNotificationLine } = require(
  path.join(__dirname, '..', 'models/lib/emailNotificationSafety'),
);

const cardUrl = 'https://example.test/b/boardId/board-slug/cardId';

// 1) The HTML body wraps the card URL in a proper <a href="..."> tag, not a
// bare URL sitting as plain text.
const html = buildHtmlNotificationLine({
  existing: false,
  subject: 'a card was added',
  actorName: 'alice',
  descriptionText: 'added the card to the board',
  url: cardUrl,
});
assert.match(
  html,
  new RegExp(`<a href="${cardUrl.replace(/\//g, '\\/')}">${cardUrl.replace(/\//g, '\\/')}</a>`),
  '#3118: the card URL must be wrapped in a real <a href> anchor tag',
);
assert.ok(
  !new RegExp(`[^"]${cardUrl.replace(/\//g, '\\/')}(?!</a>)`).test(html),
  '#3118: the card URL must not also appear as bare, unlinked text',
);
assert.match(html, /^alice added the card to the board<br\/>\n<a href=/,
  'the actor and description remain plain readable text ahead of the link');

// 2) A second buffered notification in the same digest still prefixes the
// repeated subject header, and still links its own URL.
const secondHtml = buildHtmlNotificationLine({
  existing: true,
  subject: 'another card was added',
  actorName: 'bob',
  descriptionText: 'added the card to the board',
  url: cardUrl,
});
assert.match(secondHtml, /^<br\/>\nanother card was added<br\/>\nbob /);
assert.match(secondHtml, /<a href="[^"]+">[^<]+<\/a>$/);

// 3) HTML-active text in the subject/actor/description must never break out
// of the escaped text into real markup (MailTitleBleed-shaped regression).
const unsafeHtml = buildHtmlNotificationLine({
  existing: false,
  actorName: `<img src=x onerror="alert('x')">`,
  descriptionText: 'added "<b>evil</b>" to the board',
  url: cardUrl,
});
assert.ok(
  !unsafeHtml.includes('<img') && !unsafeHtml.includes('<b>'),
  'HTML-active actor names/descriptions must be escaped, not injected as markup',
);
assert.match(unsafeHtml, /&lt;img/);
assert.match(unsafeHtml, /&lt;b&gt;evil&lt;\/b&gt;/);

// 4) A URL value itself is also escaped before being placed into the href
// and link text, so a malicious URL cannot break out of the attribute.
const maliciousUrl = `https://example.test/"><script>alert(1)</script>`;
const maliciousHtml = buildHtmlNotificationLine({
  existing: false,
  actorName: 'alice',
  descriptionText: 'added the card to the board',
  url: maliciousUrl,
});
assert.ok(
  !maliciousHtml.includes('<script>'),
  '#3118: a malicious URL must not be able to break out of the href attribute',
);
assert.match(maliciousHtml, /&quot;&gt;&lt;script&gt;/);

// 5) No URL: no dangling link markup is emitted.
const noUrlHtml = buildHtmlNotificationLine({
  existing: false,
  actorName: 'alice',
  descriptionText: 'did something without a url',
  url: undefined,
});
assert.ok(!noUrlHtml.includes('<a href='));

console.log('notificationEmailUrlLink: 12 assertions passed');
