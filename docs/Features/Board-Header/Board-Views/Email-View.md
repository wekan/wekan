# Email view

Board → View → **Email** shows the board as a mailbox, laid out like Gmail and
drawn in the board's own theme. It uses the board's own data: no second copy
of anything is kept.

| Gmail | Email view |
| --- | --- |
| Inbox | The list that [email to card](../../General/Email/Email-To-Card.md) puts new cards in (Board → Notification Settings → Email to card → List for new cards), or the first list |
| Sent | Emails sent from this view |
| All mail | Every card that arrived or went out as email |
| Folders | The board's lists: each one is a folder |
| Labels | The board's labels, with their colours. They show on each message and filter the table |
| A message | A card. It opens as the card popup, and its comments are the conversation |

The messages are a [table page](../../General/Table.md), newest first and ten to a
page. The server pages the rows, and the search box searches the subject, the
body and the sender.

## Compose and reply

**Compose** writes a new email, and the reply arrow on a row answers one. The
email is sent **From your own board address**,
`board+<token>@<domain>`, the same address that turns email into cards on this
board. So the answer comes back to this board:

- A new email becomes a card in the Inbox list and shows under **Sent**.
- A reply is added as a comment on the card it answers. An answer that comes
  back is matched by its `In-Reply-To` / `References` headers and lands as a
  comment on the same card, the way Gmail keeps a conversation in one thread.

Sending needs:

- email to card turned on in the Admin Panel, on the board and for you;
- write access to the board;
- a sending mail server in the Admin Panel. On Sandstorm, the grain sends the
  email itself.

Each email can have up to 20 recipients. Each member can send 50 emails an
hour (`EMAIL_VIEW_SENDS_PER_HOUR`).

On Sandstorm the grain has one address, so the email goes From the grain's
address, and `[board+<token>]` is added to the subject so that the answer
reaches your board.

## Files

| File | |
| --- | --- |
| `client/components/boards/emailView.jade`, `.js`, `.css` | The view, its rows and the compose popup |
| `server/emailView.js` | `emailViewPage` (one page of cards and the page index), `emailViewCount`, `sendBoardEmail` |
| `models/lib/emailView.js` | Folders, search and outgoing-email checks. No Meteor code |
| `tests/emailView.test.cjs` | The tests |
