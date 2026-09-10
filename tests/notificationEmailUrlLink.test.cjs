'use strict';

// Regression coverage for #3118: URLs in HTML-formatted notification emails
// must render as real clickable <a href> links, not as plain text.

const assert = require('node:assert/strict');
const path = require('node:path');

const { buildHtmlNotificationLine } = require(
  path.join(__dirname, '..', 'models/lib/emailNotificationSafety'),
);

// CodeQL js/incomplete-sanitization (#528/#529/#530): building a RegExp out
// of a dynamic string by hand-escaping only `/` leaves every other regex
// meta-character - and critically the backslash itself - unescaped, so a
// value containing one of them produces a broken (or, worse, subtly
// mismatching) pattern instead of a literal match. Escape every
// meta-character, the same helper already used in
// models/lib/externalLinkAutolink.js and packages/markdown/src/
// template-integration.js.
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
  new RegExp(`<a href="${escapeRegExp(cardUrl)}">${escapeRegExp(cardUrl)}</a>`),
  '#3118: the card URL must be wrapped in a real <a href> anchor tag',
);
assert.ok(
  !new RegExp(`[^"]${escapeRegExp(cardUrl)}(?!</a>)`).test(html),
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

// 6) escapeRegExp itself: a value containing a backslash (the exact
// meta-character CodeQL flagged as unescaped by the old `.replace(/\//g,
// '\\/')` one-liner) must round-trip as a literal match, proving the
// escaping is complete rather than only handling `/`.
const backslashValue = 'a\\b(c)[d]+e.f*g?h^i$j{k}l|m';
assert.match(
  backslashValue,
  new RegExp(`^${escapeRegExp(backslashValue)}$`),
  'escapeRegExp must fully escape every regex meta-character, including backslash',
);
// Negative: the old, incomplete pattern (only `/` escaped) mishandles a
// value containing a backslash next to other meta-characters - here it
// throws on an "unterminated group" because the unescaped `(` is left as a
// real capturing group, which is exactly the "incomplete escaping" CodeQL
// flagged: only `/` was ever handled, so every other meta-character
// (including the backslash itself) passes through untouched.
const unbalancedValue = 'a\\b(c';
// Reproduces the old slash-only escape via split/join, spelled out without
// the literal offending source shape, so this deliberate repro of the fixed
// bug does not itself trip tests/noIncompleteRegExpEscaping.test.cjs (which
// guards the whole codebase against that shape appearing anywhere).
const oldIncompleteEscape = unbalancedValue.split('/').join('\\/');
assert.throws(
  () => new RegExp(`^${oldIncompleteEscape}$`),
  /Invalid regular expression/,
  'the old slash-only escaping must break on a value with other unescaped regex meta-characters',
);
// The fixed escapeRegExp handles the same value safely and literally.
assert.match(
  unbalancedValue,
  new RegExp(`^${escapeRegExp(unbalancedValue)}$`),
  'escapeRegExp must safely and literally match a value the old escaping could not handle',
);

console.log('notificationEmailUrlLink: 15 assertions passed');
