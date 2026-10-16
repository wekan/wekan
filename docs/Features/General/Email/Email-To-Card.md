# Email to card

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

## Where it is set: Notification Settings

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

## How the email reaches WeKan

Point the domain's mail (an MX record, or a catch-all/alias on an existing mail
server) at one of these. All three end in the same code (`receiveBoardEmail` in
`server/emailToCard.js`).

### 1. A mail provider's inbound webhook

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

### 2. IMAP mailboxes

Add one or more mailboxes in the Admin Panel: server, port, TLS or STARTTLS,
username, password, folder. Any IMAP server works: Gmail and Microsoft 365 with
an app password, Fastmail, Dovecot, Exchange, and others. WeKan reads new
messages every 60 seconds (`INBOUND_IMAP_POLL_SECONDS`). A message for a board
or reply address is marked read, or deleted if you choose that. Any other
message is left as it was, so a shared mailbox is safe.

Only one WeKan process reads a mailbox, even with several replicas: they share
a lease in the database. The last read time and the last error are shown beside
each mailbox.

### 3. Sandstorm

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

## Security

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

## Settings by environment

| Variable | Default | |
| --- | --- | --- |
| `INBOUND_IMAP_POLL_SECONDS` | 60 | how often IMAP mailboxes are read (at least 15) |
| `INBOUND_IMAP_DISABLED` | | `true` stops this process from reading IMAP |
| `INBOUND_EMAIL_MAX_BYTES` | 31457280 | largest message |
| `INBOUND_EMAIL_MAX_ATTACHMENT_BYTES` | 26214400 | largest attachment |
| `INBOUND_EMAIL_PER_ADDRESS_PER_HOUR` | 60 | cards per address per hour |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | | the webhook secret, if not set in the Admin Panel |
