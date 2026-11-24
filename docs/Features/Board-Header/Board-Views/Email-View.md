# Email view

## What it is

Board → View → **Email** shows the board as a mailbox, laid out like Gmail and
drawn in the board's own theme. It uses the board's own data: no second copy
of anything is kept. Cards are the messages, lists are the folders and labels
are the labels, and you can write and answer email from the board's own
address, so the answers come back to the board as cards and comments.

## Read more

- [Email](https://en.wikipedia.org/wiki/Email),
  [Webmail](https://en.wikipedia.org/wiki/Webmail) and
  [Gmail](https://en.wikipedia.org/wiki/Gmail) on Wikipedia - the kind of
  mailbox this view is laid out like.
- [Conversation threading](https://en.wikipedia.org/wiki/Conversation_threading)
  on Wikipedia, and [RFC 5322](https://www.rfc-editor.org/rfc/rfc5322), the
  Internet Message Format whose `Message-ID`, `In-Reply-To` and `References`
  headers keep a reply on the card it answers.
- [Rate limiting](https://en.wikipedia.org/wiki/Rate_limiting) and
  [Pagination](https://en.wikipedia.org/wiki/Pagination) on Wikipedia - the
  hourly send limit and the ten-row pages.
- [Email to card](../../Email/Email-To-Card.md), which gives the board
  its address, and the [table page](../../Table.md).

## How to use it

| Gmail | Email view |
| --- | --- |
| Inbox | The list that [email to card](../../Email/Email-To-Card.md) puts new cards in (Board → Notification Settings → Email to card → List for new cards), or the first list |
| Sent | Emails sent from this view |
| All mail | Every card that arrived or went out as email |
| Folders | The board's lists: each one is a folder |
| Labels | The board's labels, with their colours. They show on each message and filter the table |
| A message | A card. It opens as the card popup, and its comments are the conversation |

The messages are a [table page](../../Table.md), newest first and ten to a
page. The server pages the rows, and the search box searches the subject, the
body and the sender.

**Read the mail.**

1. Open a board, click **Board View** → **Email** (in the **Communication and
   code** group).
2. Click **Inbox**, **Sent**, **All mail**, a list under **Lists** or a label
   under **Labels**.
3. Type in the search box to narrow the rows.
4. Click a row to open the card; its comments are the conversation.

When the board does not receive email yet, the view says so: *This board does
not receive email yet. Turn it on in the board's Notification Settings → Email
to card.*

### Compose and reply

**Compose** writes a new email, and the reply arrow on a row answers one. The
email is sent **From your own board address**,
`board+<token>@<domain>`, the same address that turns email into cards on this
board. So the answer comes back to this board:

- A new email becomes a card in the Inbox list and shows under **Sent**.
- A reply is added as a comment on the card it answers. An answer that comes
  back is matched by its `In-Reply-To` / `References` headers and lands as a
  comment on the same card, the way Gmail keeps a conversation in one thread.

1. Click **Compose**, or **Reply** on a row.
2. Fill in **To** (and **Cc**), separating addresses with commas or
   semicolons, and the **Subject**.
3. Write the message and click **Send**.

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

## How the numbers are calculated

- **Rows per page**: 10 (`TABLE_PAGE_ROWS_PER_PAGE` in
  [models/lib/tablePage.js](../../../../models/lib/tablePage.js)). Page *p* skips
  `(p - 1) × 10` rows; the number of pages is `ceil(total / 10)`, at least 1, and
  a page past the last is shown as the last.
- **Total** = the number of cards matching the folder and the search
  (`emailViewCount` in [server/emailView.js](../../../../server/emailView.js)).
- **Order**: newest first by `createdAt`, then by `_id`.
- **Folders** (`emailFolderSelector` in
  [models/lib/emailView.js](../../../../models/lib/emailView.js)), always only
  cards of this board that are not archived:
  - **Inbox**: cards in the Inbox list that did not go out from this view;
  - **Sent**: cards with `email.direction` `out`;
  - **All mail**: cards with any `email` record;
  - a list or a label: the cards in that list or with that label.
- **The Inbox list**: the board's chosen email-to-card list when it exists and
  is not archived, otherwise the first list by `sort` (`inboxListId`).
- **Search**: the text is trimmed and cut to 200 characters, and matched
  literally, ignoring case, in the title, the description, and the sender's
  address and name.
- **Recipients**: To and Cc together at most 20 (`MAX_RECIPIENTS`); a Cc
  address already in To is dropped; addresses are lowercased and de-duplicated.
  At least one To address and a subject are required.
- **Subject and text**: the subject has line breaks and repeated spaces folded
  and is cut to 255 characters (`MAX_SUBJECT`); the text is cut to 100000
  characters (`MAX_TEXT`).
- **Send limit**: 50 emails per member in any 60 minutes, counted on a sliding
  window (`createRateLimiter` in
  [models/lib/emailToCard.js](../../../../models/lib/emailToCard.js)); the limit is
  read at every send from the Admin Panel, then from the
  `EMAIL_VIEW_SENDS_PER_HOUR` environment variable (default 50, at most
  100000).
- **Threading**: a reply's `In-Reply-To` is the card's last message id, and its
  `References` are the card's last 20 message ids.
- **The preview** of a row is the start of the body without its `From:` line:
  at most 8 lines and 2000 characters, cut at a line end (`previewMarkdown`).
- **A new email's card** goes at the end of the Inbox list (its `sort` is the
  number of cards already there) and gets the board's next card number.

## How it works in WeKan

| File | |
| --- | --- |
| `client/components/boards/emailView.jade`, `.js`, `.css` | The view, its rows and the compose popup |
| `server/emailView.js` | `emailViewPage` (one page of cards and the page index), `emailViewCount`, `sendBoardEmail` |
| `models/lib/emailView.js` | Folders, search and outgoing-email checks. No Meteor code |
| `tests/emailView.test.cjs` | The tests |

- **Reading**: `emailViewPage` is a publication that fetches one page and names
  its card ids in the page index (`models/lib/reportPageIndex.js`), so the
  browser renders exactly that page. Only a member who can see the board gets
  rows, and an assigned-only member sees only the cards assigned to them.
- **Sending**: `sendBoardEmail` requires a signed-in board member with write
  access, email to card turned on for the admin, the board and the member, and
  a list that does not refuse the member's role
  (`server/lib/listPermissionGate.js`). It sends with Meteor's `Email.sendAsync`,
  records a failure in Admin Panel → Problems, and then adds the comment or
  creates the card. A reply by an assigned-only member on a card not assigned
  to them is refused and recorded as a security event.
- **Subjects and previews** render as Markdown through the shared viewer, with
  the Admin Panel's security settings.
- **Turning it off**: a site admin can hide the view in Admin Panel / Settings /
  Features (`views-email`).
- **Tests**: [tests/emailView.test.cjs](../../../../tests/emailView.test.cjs) and
  the browser spec
  [tests/playwright/specs/email-chat-views.e2e.js](../../../../tests/playwright/specs/email-chat-views.e2e.js).

## Commits

 - [Bulk and server-side card writes ask the list's role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [The send limit is set on every release platform and in the Admin Panel](https://github.com/wekan/wekan/commit/718fdb5dacf75d4b9048693cba65c27cf3595434)
 - [Board role permissions apply to every board view](https://github.com/wekan/wekan/commit/5b2ed17e6b31ff8416dbf26d8c178f0b979013f0)
 - [A search shows its own results, never the last one's](https://github.com/wekan/wekan/commit/49344f32f464e494b6a2e4ecbf5694e26ee58383)
 - [The browser spec runs against the production bundle](https://github.com/wekan/wekan/commit/160110d1b3fe4b35243b7a899fdd6a1dc928e6b7)
 - [The email list renders titles as Markdown](https://github.com/wekan/wekan/commit/2cc6b93ed9e9b9bae03927acb627ac2f2e2b7d5d)
 - [Subjects and previews render Markdown](https://github.com/wekan/wekan/commit/5481268558a22c27122c635871fef8afa8ca5762)
 - [Sending and receiving are tested at runtime](https://github.com/wekan/wekan/commit/79ac3016751a4633f9efb1eda2102dcb798378b4)
 - [Add the Email view](https://github.com/wekan/wekan/commit/ddb33d21d05fb6ce47cd9a899407319a82fb6753)
 - [Email to card: board addresses, which the Email view sends from](https://github.com/wekan/wekan/commit/988b177e59dd1b0e2e8763900fde69056a14d800)
