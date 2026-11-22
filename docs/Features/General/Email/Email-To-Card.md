# Email to card

## What it is

Send an email to your personal board address and it becomes a card on that
board, the way Trello's email-to-board works. The subject is the card title,
the body its description and the attachments its attachments. The email can
reach WeKan through a mail provider's webhook, an IMAP mailbox WeKan reads, or
a Sandstorm grain's own address.

## Read more

- [Trello: creating cards by email](https://support.atlassian.com/trello/docs/creating-cards-by-email/).
- [Internet Message Access Protocol](https://en.wikipedia.org/wiki/Internet_Message_Access_Protocol),
  [MX record](https://en.wikipedia.org/wiki/MX_record) and
  [MIME](https://en.wikipedia.org/wiki/MIME) on Wikipedia.
- Inbound webhooks of [Mailgun](https://documentation.mailgun.com/docs/mailgun/user-manual/receive-forward-store/),
  [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook)
  and [Postmark](https://postmarkapp.com/developer/user-guide/inbound).
- Issues [#794](https://github.com/wekan/wekan/issues/794) and
  [#3948](https://github.com/wekan/wekan/issues/3948).
- WeKan pages: [Reply by email](Reply-By-Email.md), [Bounces](Bounces.md),
  [Troubleshooting mail](Troubleshooting-Mail.md).

## How to use it

1. Admin: Admin Panel → People → Notification Settings → **Email to card**.
   Tick **Receive email into cards**, set the **Domain of board addresses**,
   and either give your mail provider the **Mail provider inbound webhook URL**
   with a **Webhook secret**, or click **Add IMAP mailbox** and fill in the
   server, port, security, username, password and folder.
2. Board admin: Board → hamburger menu → Notification Settings → **Email to
   card**: turn it on for the board and choose the list and swimlane new cards
   go to.
3. Member: in the same board section, copy **your address**,
   `board+<token>@<domain>`, and send email to it.
4. If the address leaks, click **New address (the old one stops working)**.

The details of each level, and which parts of an email are used, follow below.

## How the numbers are calculated

From [server/emailToCard.js](../../../../server/emailToCard.js),
[server/lib/imapInbound.js](../../../../server/lib/imapInbound.js),
[server/lib/inboundEmailRequest.js](../../../../server/lib/inboundEmailRequest.js),
[server/lib/inboundBoardAddress.js](../../../../server/lib/inboundBoardAddress.js)
and [models/lib/emailToCard.js](../../../../models/lib/emailToCard.js):

- **Token:** 22 random characters, about 131 bits.
- **Rate:** 60 cards per address per hour by default
  (`INBOUND_EMAIL_PER_ADDRESS_PER_HOUR`).
- **Size:** a message at most 30 MiB (31457280 bytes); at most 20 attachments
  (`MAX_ATTACHMENTS`), each at most 25 MiB (26214400 bytes). Attachments past
  the twentieth are left out.
- **IMAP:** read every 60 seconds by default, never more often than every 15
  (`max(15, INBOUND_IMAP_POLL_SECONDS)`); at most 20 mailboxes
  (`MAX_ACCOUNTS`).
- **Duplicates:** Message-IDs are kept 30 days (a TTL index of
  `30 * 24 * 3600` seconds), so the same email twice makes one card.
- **Sandstorm:** 20 recipients a message and 50 messages a day per grain owner
  (Sandstorm's limits).

## How it works in WeKan

Tests: [tests/emailToCard.test.cjs](../../../../tests/emailToCard.test.cjs),
[tests/inboundEmailQuoteStrip.test.cjs](../../../../tests/inboundEmailQuoteStrip.test.cjs).

Send an email to your personal board address and it becomes a card on that
board, the way Trello's email-to-board works ([#794](https://github.com/wekan/wekan/issues/794),
[#3948](https://github.com/wekan/wekan/issues/3948)).

    board+<token>@<domain>

- The **subject** becomes the card title.
- The **body** becomes the description. Quoted earlier messages ("On … wrote:",
  `> …`) are left out, and an HTML-only email is turned into plain text; it is
  never shown as HTML.
- **Attachments** become card attachments. SVG files are refused, the same rule
  as for uploads.
- The description starts with a **From:** line naming the sender. The card's
  author is always the member who owns the address, so forwarding an email you
  received keeps who wrote it.

Each member has their own address for each board. Keep it private: anybody who
has it can add cards as you. **New address** in your board's Notification
Settings replaces it, and the old one stops working at once.

### Where it is set: Notification Settings

| Level | Where | What |
| --- | --- | --- |
| Admin Panel | Admin Panel → People → Notification Settings → Email to card | On/off, the domain of board addresses, the mail provider webhook and its secret, and the IMAP mailboxes with their passwords. **Only here**: servers and passwords are never set anywhere else, and are never sent back to a browser. |
| Board | Board → hamburger menu → Notification Settings → Email to card | On/off for this board (off until a board admin turns it on), the list and swimlane new cards go to, which parts of an email are used, and **your address** for this board. |
| Member | Member Settings → Notification Settings → Email to card | Whether your board addresses work, and which parts of an email you want. Overrides the board. |

The Admin Panel switch is a hard gate: a board or a member cannot turn on what
the administrator has off. Parts resolve member → board → default:

| Part | Default |
| --- | --- |
| Body as card description | Text |
| Leave out quoted earlier messages | Yes |
| Attachments | Yes |
| Sender line at the top of the description | Yes |

### How the email reaches WeKan

Point the domain's mail (an MX record, or a catch-all/alias on an existing mail
server) at one of these. All three end in the same code (`receiveBoardEmail` in
`server/emailToCard.js`).

#### 1. A mail provider's inbound webhook

Mailgun Routes, SendGrid Inbound Parse, Postmark inbound, or any relay that can
POST the message:

    POST https://wekan.example.com/api/inbound-email

It accepts JSON, a URL-encoded form, `multipart/form-data` (with attachments),
and the whole raw message: a `message/rfc822` body, or a form field named
`email` (SendGrid's "raw" mode), `raw`, `mime` or `body-mime`. Set a **webhook
secret** in the Admin Panel and give it to the provider as the
`x-wekan-inbound-secret` header (or `?secret=`); without it, anybody can post to
the endpoint, though only a valid board address makes a card.

The same endpoint still takes [replies to notification
emails](Reply-By-Email.md); the recipient address tells the two apart.

#### 2. IMAP mailboxes

Add one or more mailboxes in the Admin Panel: server, port, TLS or STARTTLS,
username, password, folder. Any IMAP server works: Gmail and Microsoft 365 with
an app password, Fastmail, Dovecot, Exchange, and others. WeKan reads new
messages every 60 seconds (`INBOUND_IMAP_POLL_SECONDS`). A message for a board
or reply address is marked read, or deleted if you choose that. Any other
message is left as it was, so a shared mailbox is safe.

Only one WeKan process reads a mailbox, even with several replicas: they share
a lease in the database. The last read time and the last error are shown beside
each mailbox.

#### 3. Sandstorm

A grain has no network, so it cannot use SMTP or IMAP. Sandstorm gives each
grain its own address, `<random>@<your Sandstorm host>`, which the Admin Panel
shows. Mail to it arrives in the grain (`/var/mail`), and WeKan reads it from
there.

A grain has **one** address, so on Sandstorm:

- put your board token in the **subject**, e.g. `board+AbC… Fix the login`.
  Your board's Notification Settings shows the token. The card is yours, as on
  any other platform;
- or choose, in the Admin Panel, the board that all email to the grain goes to.

WeKan also **sends** email through the grain on Sandstorm: notifications,
invitations and password resets. It sends From the grain's address, through
the Sandstorm server's own mail settings, which the Sandstorm administrator sets
up. Sandstorm allows 20 recipients a message and 50 messages a day per grain
owner. The grain gets its address the first time somebody opens it after it
starts, so mail sent before then waits.

### Security

- The token is 22 random characters, about 131 bits.
- The member must still have write access to the board when the email arrives,
  not only when the address was made.
- Each address can make 60 cards an hour (`INBOUND_EMAIL_PER_ADDRESS_PER_HOUR`).
  A message is at most 30 MB (`INBOUND_EMAIL_MAX_BYTES`), with up to 20
  attachments of at most 25 MB each (`INBOUND_EMAIL_MAX_ATTACHMENT_BYTES`).
- The same email delivered twice (a provider retrying, or an IMAP read
  interrupted) makes one card. Message-IDs are remembered for 30 days.
- An email to an address nobody was given, a wrong webhook secret, or an
  address over its hourly limit shows in Admin Panel → Problems under
  *authn.inbound-email*.

### Settings by environment

The limits below (all but `INBOUND_IMAP_DISABLED`) are also in the Admin Panel,
under the Email to card settings: a value set there wins, an empty field falls
back to the variable, and a change applies at once. `INBOUND_IMAP_DISABLED`
stays an environment variable, because it stops IMAP in one server process of
a multi-pod deployment, and an Admin Panel value is shared by all of them.

| Variable | Default | |
| --- | --- | --- |
| `INBOUND_IMAP_POLL_SECONDS` | 60 | how often IMAP mailboxes are read (at least 15) |
| `INBOUND_IMAP_DISABLED` | | `true` stops this process from reading IMAP |
| `INBOUND_EMAIL_MAX_BYTES` | 31457280 | largest message |
| `INBOUND_EMAIL_MAX_ATTACHMENT_BYTES` | 26214400 | largest attachment |
| `INBOUND_EMAIL_PER_ADDRESS_PER_HOUR` | 60 | cards per address per hour |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | | the webhook secret, if not set in the Admin Panel |

## Commits

 - [Bulk and server-side card writes ask the list's role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [Newest features' settings on every platform and in the Admin Panel](https://github.com/wekan/wekan/commit/718fdb5dacf75d4b9048693cba65c27cf3595434)
 - [Turn an email's HTML into text in one pass](https://github.com/wekan/wekan/commit/167ccf9e2d9122e691ca6f9b13ff120127aecf41)
 - [Fix GitHub CodeQL alerts 570-580](https://github.com/wekan/wekan/commit/2352f1f44f3eed6e35057f9f59f2765ebb5d13d3)
 - [Email bounces, Problems -> Email, and runtime tests for sending and receiving](https://github.com/wekan/wekan/commit/79ac3016751a4633f9efb1eda2102dcb798378b4)
 - [Email to card: board addresses, IMAP mailboxes, provider webhooks and Sandstorm](https://github.com/wekan/wekan/commit/988b177e59dd1b0e2e8763900fde69056a14d800)
