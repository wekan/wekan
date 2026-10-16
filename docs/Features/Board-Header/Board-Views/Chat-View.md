# Chat view

Board → View → **Chat** shows the board as a chat workspace, laid out like Slack
or Rocket.Chat and drawn in the current WeKan theme and colours. It uses the
board's own data: card comments are the chat messages.

| Pane | What it shows |
| --- | --- |
| Channels | A tree of your **Workspaces** (the ones from All Boards), the boards in each, and inside the open board its **swimlanes**, their **lists** and the **cards**. Each card is a channel (`# title`). Boards in no workspace are listed after the tree. |
| Card | The selected card, with the same card details as everywhere else. |
| Chat | The card's comments as messages, oldest at the top and newest at the bottom. Enter sends; Shift+Enter starts a new line. |

## Layout

- **Left to right**, the panes are Channels | Card | Chat. **Right to left**
  (Arabic, Hebrew, Persian, …) they are mirrored: Chat | Card | Channels.
- Each pane folds to a thin bar, and the bar's button opens it again.
- The two borders between the panes can be dragged. With the keyboard, focus a
  border and use the arrow keys to move it 16 px.
- Widths and folds are saved to **your profile** (`profile.chatViewLayout`),
  so they are the same on every device you log in from. Each width is kept
  between 160 and 1200 px.
- In a narrow window (800 px or less) the panes stack.

## Reordering by drag and drop

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

## Files

| File | |
| --- | --- |
| `client/components/boards/chatView.jade`, `.js`, `.css` | The view |
| `models/lib/chatView.js` | Layout, pane order, resize, the channel tree and drop rules. No Meteor code |
| `server/models/users.js` `setChatViewLayout` | Saves the layout |
| `tests/chatView.test.cjs` | The tests |
