'use strict';

// wekan/wekan#2453: when a card description or comment contains a pasted URL
// that points at ANOTHER WeKan card, render that URL with the target card's
// TITLE as the link text instead of the raw URL, the same way a chat client
// unfurls a link to a known resource.
//
// The URL shape to detect is the one models/lib/cardUrl.js builds and the
// 'card' route matches (config/router.js): '/b/:boardId/:slug/:cardId',
// optionally followed by the #comment-<id> / #activity-<id> fragment added by
// wekan/wekan#4757 (models/lib/revealBoardItem.js). The slug is whatever the
// board's title normalized to at link-creation time and is not needed to find
// the card - only boardId (unused here) and cardId are - so slug is matched
// permissively rather than re-derived.
//
// This module only PARSES: it finds card-URL tokens in free text and reports
// their cardId (and any comment/activity fragment) plus the exact substring
// matched, in document order. It does not look up titles or touch the DOM -
// that happens where a reactive card lookup is possible (see
// packages/markdown/src/template-integration.js and
// client/components/main/editor.js), because Minimongo's client-side
// subscription boundary - not this module - is what keeps an unauthorized
// viewer from ever seeing a private card's title.
//
// Pure, isomorphic, dependency-free: unit-tested directly in
// tests/cardUrlAutolink.test.cjs.

// Matches an absolute or relative WeKan card URL:
//   (scheme://host)? /b/ <boardId> / <slug> / <cardId> (#comment-<id>|#activity-<id>)?
// boardId/slug/cardId are Meteor Mongo.ObjectID-ish opaque strings in
// practice (17-char base64-ish ids), so they are matched as "no slash, no
// whitespace, no '#'" rather than pinned to a specific alphabet - the same
// looseness models/lib/cardUrl.js itself relies on.
const CARD_URL_RE =
  /(?:https?:\/\/[^\s/]+)?\/b\/([^/\s#]+)\/([^/\s#]+)\/([^/\s#?]+)(#(comment|activity)-([^\s"'<>)]+))?/g;

// True when `url` (the FULL matched token) looks like a WeKan card URL at
// all - used by callers that want a boolean without the capture groups.
function isWekanCardUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  CARD_URL_RE.lastIndex = 0;
  const match = CARD_URL_RE.exec(url);
  return !!match && match[0] === url;
}

// Finds every WeKan card-URL token in `text`, left to right. Returns
// { match, index, boardId, slug, cardId, fragmentKind, fragmentId } objects.
// fragmentKind/fragmentId are undefined when the URL has no #comment-/#activity-
// fragment.
function findCardUrlMatches(text) {
  if (typeof text !== 'string' || !text) return [];
  const pattern = new RegExp(CARD_URL_RE.source, 'g');
  const results = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    results.push({
      match: match[0],
      index: match.index,
      boardId: match[1],
      slug: match[2],
      cardId: match[3],
      fragmentKind: match[5],
      fragmentId: match[6],
    });
    // Avoid an infinite loop on a zero-length match (cannot happen with this
    // pattern, but cheap insurance matching findMatches' style elsewhere).
    if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
  }
  return results;
}

// Same "already inside a link" guard used by models/lib/externalLinkAutolink.js
// - kept as a separate, duplicated small function (not imported) so this
// module stays standalone and dependency-free like its sibling.
function isInsideExistingLink(text, index) {
  const before = text.slice(0, index);
  const openParen = before.lastIndexOf('](');
  const closeParen = before.lastIndexOf(')');
  if (openParen !== -1 && openParen > closeParen) return true;

  const hrefIdx = before.lastIndexOf('href="');
  const hrefIdx2 = before.lastIndexOf("href='");
  const lastHref = Math.max(hrefIdx, hrefIdx2);
  if (lastHref !== -1) {
    const quote = lastHref === hrefIdx ? '"' : "'";
    const closingQuote = before.indexOf(quote, lastHref + 6);
    if (closingQuote === -1 || closingQuote > before.length) return true;
  }
  return false;
}

// Replaces every matching, not-already-linked WeKan card URL in `text` with a
// markdown link "[<title>](<match>)", where `resolveTitle(cardId)` returns
// the title string to use, or a falsy value to leave that URL as plain text
// (card not found / not visible to this viewer / lookup unavailable).
// `resolveTitle` is called once per match; this function itself is pure
// beyond that single injected side effect, so it can be unit-tested with a
// mocked resolver instead of a real reactive card lookup.
function autolinkWekanCardUrls(text, resolveTitle) {
  if (typeof text !== 'string' || !text) return text;
  if (typeof resolveTitle !== 'function') return text;

  const matches = findCardUrlMatches(text);
  if (!matches.length) return text;

  let result = '';
  let lastEnd = 0;
  let changed = false;
  matches.forEach(({ match, index, cardId }) => {
    if (isInsideExistingLink(text, index)) return;
    let title;
    try {
      title = resolveTitle(cardId);
    } catch (e) {
      title = undefined;
    }
    if (!title || typeof title !== 'string') return;
    result += text.slice(lastEnd, index);
    // Escape ']' in the title so it cannot prematurely close the markdown
    // link label; markdown-it leaves other characters alone inside a link
    // label and DOMPurify sanitizes the final HTML regardless.
    const safeTitle = title.replace(/]/g, '\\]');
    result += `[${safeTitle}](${match})`;
    lastEnd = index + match.length;
    changed = true;
  });
  result += text.slice(lastEnd);

  return changed ? result : text;
}

module.exports = {
  CARD_URL_RE,
  isWekanCardUrl,
  findCardUrlMatches,
  isInsideExistingLink,
  autolinkWekanCardUrls,
};
