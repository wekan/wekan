'use strict';

// wekan/wekan#3069: autolink bare "#1234"-style issue/bug-tracker number tokens
// found in card descriptions/comments into clickable links to an EXTERNAL
// tracker (Jira, GitHub, Bugzilla, ...), similar to the Mattermost autolink
// plugin. Admin-configurable via Admin Panel / Settings / Features:
//   externalLinkPatternPrefix - the literal token prefix, e.g. "#"
//   externalLinkPatternUrl    - a URL template containing the literal string
//                               "{number}", e.g.
//                               "https://issues.example.com/browse/PROJ-{number}"
//
// WHY THIS IS SAFE TO ADD EVEN THOUGH "#" IS ALSO WEKAN'S OWN CARD-NUMBER
// PREFIX (models/lib/activityCardLink.js, the `allowsCardNumber` board
// setting): WeKan does NOT autolink bare "#NNNN" tokens in card text to its
// own cards anywhere today - "#NNNN" is only ever DISPLAYED next to a card
// (minicard, sidebar), never scanned for and turned into a link inside
// markdown. So there is no existing internal behaviour this collides with.
// Nonetheless, to keep the two concepts clearly distinguishable and to avoid
// ever creating an ambiguous double-linking situation if internal card-number
// linking is added later, this feature:
//   - is OFF by default (both settings empty => no-op, see isConfigured);
//   - is driven entirely by the admin-chosen prefix/template, so an admin who
//     also wants internal card-number references untouched can pick a prefix
//     other than "#" (e.g. "PROJ-" or "issue#"); and
//   - only replaces a token when it is not already inside an existing link
//     (an "href=" attribute or a markdown link target), so it never rewrites
//     a link another feature already built.
//
// This module is pure - no Meteor, no DOM, no settings lookup - so it can be
// unit tested as arithmetic and reused identically on the server (sanitizing
// before render) and in any future client-side preview.

const NUMBER_PLACEHOLDER = '{number}';

// True when both halves of the pattern are configured. Either missing means
// "feature is off" - the caller treats that as a no-op.
function isConfigured(prefix, urlTemplate) {
  return (
    typeof prefix === 'string' &&
    prefix.length > 0 &&
    typeof urlTemplate === 'string' &&
    urlTemplate.includes(NUMBER_PLACEHOLDER)
  );
}

// Builds the target URL for one matched number.
function buildUrl(urlTemplate, number) {
  return urlTemplate.split(NUMBER_PLACEHOLDER).join(number);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Finds every "<prefix><digits>" token in `text` that is not already part of
// a link, and returns them as { match, number, index } in left-to-right
// order. Exported mainly so tests (and any future caller that wants to
// highlight matches before rewriting) do not have to duplicate the regex.
function findMatches(text, prefix) {
  if (typeof text !== 'string' || !text || !prefix) return [];
  const pattern = new RegExp(`${escapeRegExp(prefix)}(\\d+)`, 'g');
  const results = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    results.push({ match: match[0], number: match[1], index: match.index });
  }
  return results;
}

// True when the token at `index` in `text` sits inside an existing markdown
// link target "](...)" or an HTML "href=...". Kept deliberately simple (no
// full HTML/markdown parsing) - good enough to avoid double-linking obvious
// cases without pulling in a parser for a pure helper.
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

// Replaces every matching, not-already-linked "<prefix><digits>" token in
// `text` with a markdown link "[<prefix><digits>](<url>)". Returns `text`
// unchanged (same reference) when the pattern is not configured or nothing
// matches, so callers can call it unconditionally as a no-op-safe step.
function autolinkExternalIssueReferences(text, prefix, urlTemplate) {
  if (!isConfigured(prefix, urlTemplate)) return text;
  if (typeof text !== 'string' || !text) return text;

  const matches = findMatches(text, prefix);
  if (!matches.length) return text;

  let result = '';
  let lastEnd = 0;
  matches.forEach(({ match, number, index }) => {
    if (isInsideExistingLink(text, index)) return;
    result += text.slice(lastEnd, index);
    result += `[${match}](${buildUrl(urlTemplate, number)})`;
    lastEnd = index + match.length;
  });
  result += text.slice(lastEnd);

  return result === text ? text : result;
}

module.exports = {
  isConfigured,
  buildUrl,
  findMatches,
  isInsideExistingLink,
  autolinkExternalIssueReferences,
};
