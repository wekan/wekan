# Comment replies and comment editing restriction

This document describes two related comment features (initial MVP versions).

## Threaded replies (issue #5907)

Comments on a card can now reply to a specific earlier comment.

- Each card comment has an optional `parentId` field referencing the `_id` of
  the comment it replies to. Top-level comments leave it empty.
- A **Reply** link appears next to each comment (for board members). Clicking it
  opens the new-comment form with an "In reply to ..." banner showing the parent
  comment text; the banner can be cancelled to post a normal top-level comment.
- Replies are rendered indented beneath the thread, and also show an
  "In reply to: <parent text>" quote for context.

### MVP limitations

- Threading is a single visual level of indentation; replies-to-replies are all
  indented the same amount rather than nested arbitrarily deep.
- Ordering still follows comment creation time; replies are not re-grouped
  directly under their parent.
- Deleting a parent comment does not delete or re-parent its replies; the
  "In reply to" quote simply disappears if the parent is gone.

## Restrict comment editing (issue #5906)

A board-level setting controls whether board admins may moderate other users'
comments.

- Board setting: `restrictCommentEditing` (Boolean, default `false`).
  - `false` (default): historical behaviour — board admins may edit/delete any
    comment on the board.
  - `true`: board admins may **not** edit or delete comments authored by other
    users. Only the comment's own author can edit/delete it.
- Enforcement lives on the **server** in `models/cardComments.js` via
  `before.update` / `before.remove` collection hooks, which throw a
  `Meteor.Error` when the action is not allowed. The UI also hides the
  edit/delete links accordingly, using the same decision function.
- The decision is a pure, unit-tested function
  `canEditComment({ isAuthor, isBoardAdmin, restrictCommentEditing })` exported
  from `models/cardComments.js`.

### Getter / setter

`Boards` documents gain:

- `board.getRestrictCommentEditing()` — returns the boolean.
- `board.setRestrictCommentEditing(value)` — updates the setting.

### MVP limitations

- No dedicated Admin Panel / board-settings UI toggle is wired up yet; the
  setting is enforced end to end but is currently set programmatically /
  via the API. A board-settings checkbox can be added later.
