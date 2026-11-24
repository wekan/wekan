# Comment replies and comment editing restriction

## What it is

This document describes three related comment features. **Threaded
replies** let a comment on a card answer a specific earlier comment, shown
under it. **Restrict comment editing** is a board setting that stops board
admins from editing or deleting other users' comments, so only a comment's
author can. The **comment badge tooltip** shows a card's only comment when
you hover the minicard's comment count.

## Read more

- [Conversation threading](https://en.wikipedia.org/wiki/Conversation_threading)
  and [Internet forum](https://en.wikipedia.org/wiki/Internet_forum) on
  Wikipedia - replies grouped under the message they answer.
- [Content moderation](https://en.wikipedia.org/wiki/Content_moderation) -
  what board admins do when they may edit others' comments.
- [Tooltip](https://en.wikipedia.org/wiki/Tooltip) - the badge's hover text.
- In WeKan: [Action items](Action-Items.md) (cards from a comment's lines)
  and [Cards](README.md).

## How to use it

**Reply to a comment**

1. Open a card. In its comments, click **Reply** next to a comment (shown to
   board members).
2. The new-comment form opens with an **In reply to** banner showing the
   comment you answer. Close the banner to post a normal top-level comment
   instead.
3. Write and post the comment. It is shown indented directly under the
   comment it replies to, with an *In reply to: <parent text>* quote.

**Restrict comment editing**

There is no board-settings checkbox for it yet (see the limitations below):
the setting `restrictCommentEditing` is set programmatically, for example
with `board.setRestrictCommentEditing(true)`, and travels with a board in a
WeKan JSON export and import.

**See a single comment in the badge**

1. Show the comment count on minicards: Board Settings / **Card**, the
   **Comments** section's comment count row (*Show on Minicard*).
2. Hover the minicard's comment badge. With exactly one visible, nonempty
   comment, the tooltip is that comment's text.

## How the numbers are calculated

- **Threading depth is one level.** A reply to a reply is stored as a reply
  to the top-level comment (`resolveParentId` in
  [models/cardComments.js](../../../models/cardComments.js)), so nesting
  never goes deeper than one level however many times **Reply** is clicked.
- **The badge tooltip** ([models/lib/commentBadgeTitle.js](../../../models/lib/commentBadgeTitle.js))
  is the comment's text when the card has exactly one visible, nonempty
  comment. With two or more comments it is the localized comment-count
  message; empty comments fall back to that message; cards without comments
  have no badge.
- The comment features have no other numbers of their own.

## How it works in WeKan

### Threaded replies (issue #5907, #3011)

- Each card comment has an optional `parentId` field referencing the `_id` of
  the comment it replies to. Top-level comments leave it empty.
- A **Reply** link appears next to each comment (for board members). Clicking
  it opens the new-comment form with an "In reply to ..." banner showing the
  parent comment text; the banner can be cancelled to post a normal top-level
  comment.
- Replies are rendered indented under their parent, and also show an
  "In reply to: <parent text>" quote for context.
- `resolveParentId` flattens a reply to a reply onto that reply's parent, both
  on the client when **Reply** is clicked
  ([client/components/activities/comments.js](../../../client/components/activities/comments.js))
  and on the server in a `before.insert` hook, so a caller that sends its own
  `parentId` cannot nest deeper.
- `groupCommentsByThread` ([imports/lib/commentThreading.js](../../../imports/lib/commentThreading.js))
  orders the comments so each reply comes directly under its parent instead of
  interleaved by date with unrelated comments.
- The WeKan JSON import keeps comment replies.

#### Limitations

- Threading is a single visual level of indentation; replies-to-replies are
  attached to the same top-level comment and indented the same amount rather
  than nested arbitrarily deep.
- Deleting a parent comment does not delete or re-parent its replies; the
  "In reply to" quote simply disappears if the parent is gone, and the
  replies are shown as top-level comments.

### Restrict comment editing (issue #5906)

A board-level setting controls whether board admins may moderate other users'
comments.

- Board setting: `restrictCommentEditing` (Boolean, default `false`) in
  [models/boards.js](../../../models/boards.js).
  - `false` (default): historical behaviour — board admins may edit/delete any
    comment on the board.
  - `true`: board admins may **not** edit or delete comments authored by other
    users. Only the comment's own author can edit/delete it.
- The decision is a pure, unit-tested function
  `canEditComment({ isAuthor, isBoardAdmin, restrictCommentEditing })` exported
  from [models/cardComments.js](../../../models/cardComments.js).
- Enforcement lives on the **server**: `assertCanMutateComment` in
  `models/cardComments.js`, called from the `before.update` / `before.remove`
  collection hooks, throws a `Meteor.Error` (`error-comment-edit-not-allowed`,
  HTTP 403) when the action is not allowed. The REST API's comment PUT and
  DELETE handlers in
  [server/models/cardComments.js](../../../server/models/cardComments.js) call
  the same function with the request's user before touching the collection
  (CommentBleed, GHSA-pqr4-rxgp-hv2m: they used to bypass it), and the
  webhook comment sync in
  [server/notifications/storedWebhooks.js](../../../server/notifications/storedWebhooks.js)
  applies `canEditComment` too.
- The UI also hides the edit/delete links accordingly, using the same decision
  function (`canEditThisComment` in `client/components/activities/comments.js`).

#### Getter / setter

`Boards` documents have:

- `board.getRestrictCommentEditing()` — returns the boolean.
- `board.setRestrictCommentEditing(value)` — updates the setting.

#### Limitations

- No dedicated Admin Panel / board-settings UI toggle is wired up yet; the
  setting is enforced end to end but is currently set programmatically /
  via the API. A board-settings checkbox can be added later (its English
  label, *Restrict board admins from editing or deleting other users'
  comments*, is already in the translations).

### Comment badge tooltip (issue #1933)

When the minicard comment-count badge is enabled, hovering over it shows the
comment text if the card has exactly one visible, nonempty comment. With two
or more comments, it shows the localized comment-count message. Empty comments
fall back to that message; cards without comments have no badge.

The tooltip uses the comments already published for the card. It does not fetch
private-board comments or change access permissions. Comment text, including
Markdown and HTML-looking strings, is displayed as plain text rather than
rendered markup. This also works for read-only board members.

### Tests

- [tests/commentReplyFlattening.test.cjs](../../../tests/commentReplyFlattening.test.cjs)
  and [tests/commentThreadGrouping.test.cjs](../../../tests/commentThreadGrouping.test.cjs) -
  one level of threading, replies under their parent.
- [server/lib/tests/comments.permissions.tests.js](../../../server/lib/tests/comments.permissions.tests.js)
  and [tests/restCommentDeleteAcl.test.cjs](../../../tests/restCommentDeleteAcl.test.cjs) -
  `canEditComment` and the REST API's checks.
- [tests/commentBadgeTitle1933.test.cjs](../../../tests/commentBadgeTitle1933.test.cjs)
  and [tests/playwright/specs/comment-badge-tooltip.e2e.js](../../../tests/playwright/specs/comment-badge-tooltip.e2e.js) -
  the badge tooltip.

## Commits

 - [WeKan JSON import keeps comment replies](https://github.com/wekan/wekan/commit/24b6b9b0247bf1cda039faec6dba9298f9115116)
 - [A single comment is shown in the minicard badge tooltip](https://github.com/wekan/wekan/commit/67c5df2535ad6fe03b4a9cc133558cdf47076b2f)
 - [Comment replies capped at one level of threading, grouped under their parent](https://github.com/wekan/wekan/commit/ab1f60d806524ee4b2f3432db9ea343df2ce281b)
 - [A comment's text can be edited over the REST API](https://github.com/wekan/wekan/commit/099ab39dd4b27c01ae80789370a2c6d44aca04db)
 - [Accessible HTML4 comment replies](https://github.com/wekan/wekan/commit/d7022c0093213e2b9f2910ff70cde1bb9536930f)
 - [The REST API no longer lets any board member delete anyone's comment](https://github.com/wekan/wekan/commit/a8fa6cfa3fb6c519245a4425399da3a9838bea95)
 - [Threaded comment replies and the board admin comment-edit restriction](https://github.com/wekan/wekan/commit/bdb8e6254603a7020f838a524f51f408715446e3)
