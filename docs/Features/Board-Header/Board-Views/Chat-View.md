# Chat view

## What it is

Board → View → **Chat** shows the board as a chat workspace, laid out like Slack
or Rocket.Chat and drawn in the current WeKan theme and colours. It uses the
board's own data: card comments are the chat messages, and each card with a
conversation is a channel. The channel tree covers every board you can see,
with the number of messages you have not read yet.

## Read more

- [Online chat](https://en.wikipedia.org/wiki/Online_chat) on Wikipedia, and the
  two products this view is laid out like:
  [Slack](https://en.wikipedia.org/wiki/Slack_(software)) and
  [Rocket.Chat](https://en.wikipedia.org/wiki/Rocket.Chat).
- [Drag and drop](https://en.wikipedia.org/wiki/Drag_and_drop) and
  [bidirectional text](https://en.wikipedia.org/wiki/Bidirectional_text) on
  Wikipedia - reordering in the tree, and the mirrored layout in right-to-left
  languages.
- The [window splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)
  of the WAI-ARIA Authoring Practices - the keyboard-movable pane borders.
- [Workspaces](../../All-Boards/Workspaces.md) and [Email view](Email-View.md).

## How to use it

| Pane | What it shows |
| --- | --- |
| Channels | A tree of your **Workspaces** (the ones from All Boards), the boards in each, and inside a board its **swimlanes**, their **lists** and the **cards**. Each card is a channel (`# title`). At first only cards that have a conversation are listed; boards in no workspace are listed after the tree, and boards with no conversation at all under **Other boards**. |
| Card | The selected card, with the same card details as everywhere else. |
| Chat | The card's comments as messages, oldest at the top and newest at the bottom. Enter sends; Shift+Enter starts a new line. |

**Chat about a card.**

1. Open a board, click **Board View** → **Chat** (in the **Communication and
   code** group).
2. In **Channels**, open a workspace and a board, and click a card. A number
   beside a row is how many messages under it you have not read.
3. The card opens in the middle pane and its messages on the chat pane.
4. Type in *Write a message* and press **Enter** (or click **Send**). Shift+Enter
   starts a new line.

**Start a conversation on a card that has none.**

1. Click the board's **Show all cards** button in the tree. Every card of that
   board is listed.
2. Pick the card and write the first message. **Show only cards with messages**
   goes back.

**Arrange the panes.**

- **Left to right**, the panes are Channels | Card | Chat. **Right to left**
  (Arabic, Hebrew, Persian, …) they are mirrored: Chat | Card | Channels.
- Each pane folds to a thin bar with **Hide**, and the bar's button (**Show
  channels**, **Show card**, **Show chat**) opens it again.
- The two borders between the panes can be dragged. With the keyboard, focus a
  border and use the arrow keys to move it 16 px.
- Widths and folds are saved to **your profile** (`profile.chatViewLayout`),
  so they are the same on every device you log in from. Each width is kept
  between 160 and 1200 px.
- In a narrow window (800 px or less) the panes stack.

### Reordering by drag and drop

| Drag | Onto | Result |
| --- | --- | --- |
| A card | A card | Placed before or after it, in its list and swimlane |
| A card | A list | Placed at the end of that list |
| A list | A list | Placed before or after it |
| A swimlane | A swimlane | Placed before or after it |
| A workspace | A workspace | Placed before or after it, or inside it (drop on the middle of the row) |
| A board | A workspace | Moved into that workspace |

Every move goes through the same path as on the board itself, so the same
permissions apply:

- swimlane order, as when a swimlane is dragged on the board;
- `updateListSort` for lists;
- `card.move()` for cards;
- `setWorkspacesTree` and `assignBoardToWorkspace` for workspaces and boards.

Drops that mean nothing, such as a card onto a swimlane, are refused.

## How the numbers are calculated

- **Pane widths** (`cleanChatLayout`, `resizePane` in
  [models/lib/chatView.js](../../../../models/lib/chatView.js)): Channels starts
  at 280 px and Chat at 380 px; the Card pane takes the rest. A width is rounded
  to a whole pixel and kept between 160 and 1200 px (`MIN_WIDTH`, `MAX_WIDTH`).
  Dragging a border by *dx* pixels widens Channels by *dx* and Chat by *-dx*
  (the other way round in right-to-left). One arrow key press is 16 px.
- **Message count** of a card = the number of its comments
  (`commentTotals` in [server/chatView.js](../../../../server/chatView.js)).
- **Unread** = the comments by **other** people written after you last opened
  that card; all of them when you have never opened it (your
  `profile.cardLastViews`). A list's, swimlane's, board's and workspace's
  unread number is the sum of the unread numbers under it (`sum` in
  `buildChannelTree`). Above 99 it is shown as `99+`. A message that arrives
  while its card is open counts as read.
- **Order**: boards alphabetically by title; swimlanes, lists and cards by their
  `sort`; messages by `createdAt`, oldest first.
- **Limits**: at most 5000 card channels in the tree (`MAX_CHANNELS`) and 3000
  cards when a board shows all its cards (`MAX_BOARD_CARDS`). The two tree
  methods may be called 30 times in 10 seconds per connection
  (`DDPRateLimiter`). The browser remembers which rows are open for the 500
  most recently toggled rows.

## How it works in WeKan

| File | |
| --- | --- |
| `client/components/boards/chatView.jade`, `.js`, `.css` | The view |
| `models/lib/chatView.js` | Layout, pane order, resize, the channel tree and drop rules. No Meteor code |
| `server/chatView.js` | `chatViewChannels` (the cards with a conversation and their unread counts), `chatViewBoardChannels` (all of one board's cards), the `chatViewCardComments` publication |
| `server/models/users.js` `setChatViewLayout` | Saves the layout |
| `tests/chatView.test.cjs` | The tests |

- **What a member may read**: only boards they see in All Boards
  (`visibleAllBoards`); on a board where their role sees only the cards
  assigned to them, only those cards; on a board where their role reads no
  comments (`isNoComments`), no conversation at all. The card's comments are
  published by `chatViewCardComments` after the same checks, so a card from
  any visible board opens in the middle pane.
- **Sending** inserts a card comment (`CardComments.insert`), the same as
  writing a comment on the card, so the comment permissions apply.
- **Saving the layout**: `setChatViewLayout` stores only the known keys, cleaned
  by `cleanChatLayout`, on `profile.chatViewLayout`.
- **Tests**: [tests/chatView.test.cjs](../../../../tests/chatView.test.cjs) and
  the browser spec
  [tests/playwright/specs/email-chat-views.e2e.js](../../../../tests/playwright/specs/email-chat-views.e2e.js).

## Commits

 - [No publication sends the current user a partial profile](https://github.com/wekan/wekan/commit/b05972c4c88e108526c85ad3598867d781395e98)
 - [Board role permissions apply to every board view](https://github.com/wekan/wekan/commit/5b2ed17e6b31ff8416dbf26d8c178f0b979013f0)
 - [The browser spec runs against the production bundle](https://github.com/wekan/wekan/commit/160110d1b3fe4b35243b7a899fdd6a1dc928e6b7)
 - [A card from any board opens in the middle; folded panes keep their carets](https://github.com/wekan/wekan/commit/230badf48eab244d5c8760e54b684f73b013bf07)
 - [Channels are the cards with a conversation, on every board, with unread counts](https://github.com/wekan/wekan/commit/2ee3e83793f9ab45ac6850077bc9fc3a0111e6e0)
 - [Add the Chat view](https://github.com/wekan/wekan/commit/ddb33d21d05fb6ce47cd9a899407319a82fb6753)
