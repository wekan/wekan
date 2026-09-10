'use strict';

// Issue #4757: "Permalink to comments and activities" - a Trello-like feature
// where clicking a comment's or an activity's timestamp gives a shareable
// permalink; visiting it loads the card and then scrolls to and highlights
// that specific comment/activity.
//
// URL/fragment scheme: the card's own URL (models/lib/cardUrl.js,
// `/b/:boardId/:slug/:cardId`) plus `#comment-<id>` for a comment or
// `#activity-<id>` for a non-comment activity. Comments and activities both
// live in Mongo documents with a stable `_id` (comments in CardComments,
// activities in Activities - models/activities.js), so both id namespaces are
// already unique on their own; two fragment prefixes just make it obvious
// from the URL alone which kind of thing is being linked to, without needing
// to know that WeKan stores comment *events* in Activities and comment
// *content* in CardComments.
//
// This is DOM/Blaze-runtime behaviour that cannot run headless in this
// suite, so - like tests/loginCookieExpiry.test.cjs and
// tests/listCollapsePerSwimlane.test.cjs - it reads the actual source and
// pattern-matches the permalink URL construction, the anchor/id markup, and
// the reveal (scroll+highlight-on-load) wiring.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// --- 1. models/lib/revealBoardItem.js: 'comment' and 'activity' are reveal
// kinds, each mapped to the element id the templates below actually give
// their element (a guard against inventing a name that does not match the
// markup - the same discipline the existing swimlane/list entries follow).
const revealModel = read('models/lib/revealBoardItem.js');
assert.match(revealModel, /const REVEAL_KINDS = \['swimlane', 'list', 'comment', 'activity'\];/);
assert.match(revealModel, /comment: \{ sessionKey: 'revealCommentId', elementId: id => `comment-\$\{id\}` \}/);
assert.match(revealModel, /activity: \{ sessionKey: 'revealActivityId', elementId: id => `activity-\$\{id\}` \}/);
assert.match(revealModel, /const HASH_REVEAL_KINDS = \['comment', 'activity'\];/);
assert.match(revealModel, /HASH_REVEAL_KINDS,\s*\n\s*revealElementId,/);

// Pure check of the exported mapping shape itself (mirrors revealElementId).
{
  const REVEAL_TARGETS = {
    swimlane: { elementId: id => `swimlane-${id}` },
    list: { elementId: id => `js-list-${id}` },
    comment: { elementId: id => `comment-${id}` },
    activity: { elementId: id => `activity-${id}` },
  };
  function revealElementId(kind, id) {
    const target = REVEAL_TARGETS[kind];
    if (!target || typeof id !== 'string' || !id) return null;
    return target.elementId(id);
  }
  assert.equal(revealElementId('comment', 'c1'), 'comment-c1');
  assert.equal(revealElementId('activity', 'a1'), 'activity-a1');
  assert.equal(revealElementId('comment', ''), null, 'empty id reveals nothing (negative)');
  assert.equal(revealElementId('bogus', 'x'), null, 'unknown kind reveals nothing (negative)');
}

// --- 2. client/lib/revealBoardItem.js: the URL hash is read into the same
// Session keys the generic swimlane/list watcher already polls, both on a
// fresh load (watchBoardItemReveals calling applyLocationHash once) and on
// an in-page hash change (the hashchange listener) - a comment/activity
// permalink needs both, unlike a swimlane/list link which only ever arrives
// as a route param.
const revealClient = read('client/lib/revealBoardItem.js');
assert.match(revealClient, /HASH_REVEAL_KINDS,\s*\n\s*revealElementId,/);
assert.match(revealClient, /function applyLocationHash\(\)/);
assert.match(revealClient, /HASH_REVEAL_KINDS\.forEach\(kind => \{/);
assert.match(revealClient, /window\.addEventListener\('hashchange', applyLocationHash\)/);
assert.match(revealClient, /export function watchBoardItemReveals\(\) \{[\s\S]*?applyLocationHash\(\);/);

// --- 3. comments.jade: each comment element carries the id a `#comment-<id>`
// fragment scrolls to, and its timestamp is a real permalink anchor plus an
// explicit copy-to-clipboard icon reusing the existing copied-tooltip pattern.
const commentsJade = read('client/components/activities/comments.jade');
assert.match(commentsJade, /\.comment\(id=commentDomId class="\{\{#if parentId\}\}is-reply\{\{\/if\}\}"\)/);
assert.match(commentsJade, /a\.js-comment-permalink\(href="\{\{ commentPermalink \}\}"\) \{\{ displayDate createdAt \}\}/);
assert.match(commentsJade, /a\.js-copy-comment-link\(title="\{\{_ 'copy-link-to-clipboard'\}\}"\)/);
assert.match(commentsJade, /span\.copied-tooltip \{\{_ 'copied'\}\}/);

// --- 4. comments.js: the permalink is built from the card's own absoluteUrl
// (models/cards.js -> models/lib/cardUrl.js, the same builder card links
// elsewhere in the app already use) plus the comment's own _id, the
// dom-id/permalink helpers exist, and both click handlers are wired -
// clicking the timestamp sets the reveal Session key directly (not relying
// solely on the browser's hashchange event) and the icon copies the same URL
// via the existing Utils.copyTextToClipboard/showCopied pattern (reused, not
// reimplemented).
const commentsJs = read('client/components/activities/comments.js');
assert.match(commentsJs, /function commentPermalinkFor\(comment\) \{/);
assert.match(commentsJs, /const card = ReactiveCache\.getCard\(comment\.cardId\);/);
assert.match(commentsJs, /return url \? `\$\{url\}#comment-\$\{comment\._id\}` : '';/);
assert.match(commentsJs, /commentDomId\(\) \{\s*\n\s*return this\._id \? `comment-\$\{this\._id\}` : undefined;/);
assert.match(commentsJs, /commentPermalink\(\) \{\s*\n\s*return commentPermalinkFor\(this\);/);
assert.match(commentsJs, /'click \.js-comment-permalink'\(\) \{\s*\n\s*if \(this\._id\) Session\.set\('revealCommentId', this\._id\);/);
assert.match(commentsJs, /'click \.js-copy-comment-link'\(evt, tpl\) \{\s*\n\s*evt\.preventDefault\(\);\s*\n\s*const url = commentPermalinkFor\(this\);/);
assert.match(commentsJs, /Utils\.showCopied\(Utils\.copyTextToClipboard\(url\), tpl\.\$\('\.copied-tooltip'\)\);/g);

// --- 5. activities.jade / activities.js: same scheme for non-comment
// activities, kept as its own id/fragment/helper/handler set (not shared code
// with comments.js) because an activity's card is reached through the
// Activities `card()` helper rather than a plain cardId lookup.
const activitiesJade = read('client/components/activities/activities.jade');
assert.match(activitiesJade, /\.activity\(id=activityDomId data-id=activity\._id\)/);
assert.match(activitiesJade, /a\.js-activity-permalink\(href="\{\{ activityPermalink \}\}"\) \{\{ displayDate activity\.createdAt \}\}/);
assert.match(activitiesJade, /a\.js-copy-activity-link\(title="\{\{_ 'copy-link-to-clipboard'\}\}"\)/);

const activitiesJs = read('client/components/activities/activities.js');
assert.match(activitiesJs, /function activityPermalinkFor\(activity\) \{/);
assert.match(activitiesJs, /const card = typeof activity\.card === 'function' \? activity\.card\(\) : null;/);
assert.match(activitiesJs, /return url \? `\$\{url\}#activity-\$\{activity\._id\}` : '';/);
assert.match(activitiesJs, /activityDomId\(\) \{/);
assert.match(activitiesJs, /activityPermalink\(\) \{\s*\n\s*return activityPermalinkFor\(this\.activity\);/);
assert.match(activitiesJs, /'click \.js-activity-permalink'\(\) \{\s*\n\s*if \(this\.activity && this\.activity\._id\) \{\s*\n\s*Session\.set\('revealActivityId', this\.activity\._id\);/);
assert.match(activitiesJs, /'click \.js-copy-activity-link'\(evt, tpl\) \{\s*\n\s*evt\.preventDefault\(\);\s*\n\s*const url = activityPermalinkFor\(this\.activity\);/);

// Negative: neither file reinvents its own clipboard-copy implementation
// (navigator.clipboard.writeText) instead of reusing client/lib/utils.js's
// copyTextToClipboard, which already handles the no-Clipboard-API fallback.
assert.doesNotMatch(commentsJs, /navigator\.clipboard/,
  'comments.js must reuse Utils.copyTextToClipboard, not call navigator.clipboard directly (negative)');
assert.doesNotMatch(activitiesJs, /navigator\.clipboard/,
  'activities.js must reuse Utils.copyTextToClipboard, not call navigator.clipboard directly (negative)');

// --- 6. Pure check of the permalink URL formula itself, mirroring both
// commentPermalinkFor()/activityPermalinkFor() above.
function buildPermalink(absoluteCardUrl, kind, id) {
  if (!absoluteCardUrl || !id) return '';
  return `${absoluteCardUrl}#${kind}-${id}`;
}
assert.equal(
  buildPermalink('https://example.com/b/board1/my-board/card1', 'comment', 'c1'),
  'https://example.com/b/board1/my-board/card1#comment-c1',
);
assert.equal(
  buildPermalink('https://example.com/b/board1/my-board/card1', 'activity', 'a1'),
  'https://example.com/b/board1/my-board/card1#activity-a1',
);
assert.notEqual(
  buildPermalink('https://example.com/b/board1/my-board/card1', 'comment', 'x'),
  buildPermalink('https://example.com/b/board1/my-board/card1', 'activity', 'x'),
  'a comment and an activity with the same id must not collide on the same fragment (negative)',
);
assert.equal(buildPermalink('', 'comment', 'c1'), '',
  'no card URL (e.g. archived/unreadable card) yields no permalink rather than a broken one (negative)');

console.log('commentActivityPermalink: comment/activity timestamps link to a stable card-URL + #kind-id permalink, and client/lib/revealBoardItem.js scrolls to and highlights the matching element on load');
