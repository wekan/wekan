# Reply-by-email (#2414)

## What it is

Reply to a WeKan notification email, and the reply becomes a comment on the
card it was about — the same experience Trello and GitHub offer. The reply
address is signed, so a reply is always attributed to the person the email was
sent to, and only when it comes from their own address.

## Read more

- [HMAC](https://en.wikipedia.org/wiki/HMAC) and
  [Email](https://en.wikipedia.org/wiki/Email) on Wikipedia.
- Inbound webhooks of [Mailgun](https://documentation.mailgun.com/docs/mailgun/user-manual/receive-forward-store/),
  [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook)
  and [Postmark](https://postmarkapp.com/developer/user-guide/inbound).
- Issue [#2414](https://github.com/wekan/wekan/issues/2414) and the
  [ReplyBleed](https://wekan.fi/hall-of-fame/replybleed/) security fix.
- WeKan pages: [Email to card](Email-To-Card.md), [Bounces](Bounces.md),
  [Notification delivery](../Notifications/Notification-Delivery.md).

## How to use it

1. Set `INBOUND_EMAIL_HMAC_SECRET` and `INBOUND_EMAIL_DOMAIN` (and, recommended,
   `INBOUND_EMAIL_WEBHOOK_SECRET`), see "Configuration" below.
2. Point your mail provider's inbound webhook at
   `https://your-wekan.example/api/inbound-email` ("Provider-side setup"
   below), or add an IMAP mailbox in Email to card.
3. Restart WeKan. Notification emails now carry a `Reply-To` address.
4. Reply to a notification email; the reply appears as your comment on the card.

## How the numbers are calculated

From [server/lib/inboundEmailReplyToken.js](../../../../server/lib/inboundEmailReplyToken.js):

- **Expiry:** the last valid day, counted in days since 1970-01-01 and written
  in base 36, is the send date plus `INBOUND_EMAIL_REPLY_DAYS` (1 to 365,
  default 30).
- **MAC:** HMAC-SHA256 over the card id, the user id and the expiry, compared
  in constant time.
- **Digest delay:** `EMAIL_NOTIFICATION_TIMEOUT`, default 30 s; a digest's one
  `Reply-To` names the most recently notified card.

## How it works in WeKan

Files: [server/routes/inboundEmail.js](../../../../server/routes/inboundEmail.js)
(the endpoint), [server/lib/inboundEmailReplyToken.js](../../../../server/lib/inboundEmailReplyToken.js),
[server/lib/inboundEmailQuoteStrip.js](../../../../server/lib/inboundEmailQuoteStrip.js).
Tests: [tests/inboundEmailReplyToken.test.cjs](../../../../tests/inboundEmailReplyToken.test.cjs),
[tests/inboundEmailQuoteStrip.test.cjs](../../../../tests/inboundEmailQuoteStrip.test.cjs),
[tests/inboundEmailUserMatch.test.cjs](../../../../tests/inboundEmailUserMatch.test.cjs).

Reply to a WeKan notification email, and the reply becomes a comment on the
card it was about — the same experience Trello and GitHub offer.

### Scope: a webhook receiver, not a mailbox poller

> **Changed since.** The text below was written when WeKan could only send
> email. [Email to card](Email-To-Card.md) has since added IMAP mailboxes,
> read by `server/lib/imapInbound.js`, which hand replies to the same
> `receiveEmail()` as the webhook, so a reply can also arrive through an IMAP
> mailbox set in Admin Panel → People → Notification Settings → Email to card.
> The webhook described here still works the same way.

WeKan only ever **sends** email (`server/notifications/email.js`); it has no
infrastructure to receive it. Building a full inbound mail client — a running
mail server or mailbox, credentials to manage, a polling loop to keep alive —
is real operational complexity that most self-hosted WeKan instances do not
want to take on.

Instead, this feature is a **webhook receiver**: WeKan exposes an HTTP
endpoint, `POST /api/inbound-email`, and you point your mail provider's
*inbound-parse* webhook at it. The provider receives the reply on WeKan's
behalf, parses it, and POSTs the parsed fields (`from`, `to`, `text`, plus
whatever else that provider sends) to WeKan. WeKan never talks to a mailbox
directly.

This means the feature only works if you already route your outbound WeKan
notification mail through a provider that also offers inbound parsing —
Mailgun, SendGrid and Postmark all do (see below). If you send mail some
other way (a plain SMTP relay, your own Postfix), you would need to add one of
these providers, or another one with an equivalent inbound webhook, purely for
the reply-to address's domain.

### How a reply is matched back to its card and its author

Every outbound notification email's `Reply-To` header carries a token that
names the card it is about AND the one user it was sent to, and expires:

```
Reply-To: reply+<cardId>.<userId>.<expiry>.<mac>@<your inbound domain>
```

`<expiry>` is the last valid day (days since 1970-01-01, base 36), 30 days
after sending by default. `<mac>` is an HMAC-SHA256 over the card id, the user
id and the expiry, keyed by a server-only secret
(`server/lib/inboundEmailReplyToken.js`). None of the three can be changed
without the webhook noticing (constant-time comparison,
`crypto.timingSafeEqual`), so two recipients of the same card hold different
addresses and neither can reply as the other.

When a reply arrives at `/api/inbound-email`:

1. if `INBOUND_EMAIL_WEBHOOK_SECRET` is set, the request must carry it, in the
   `X-WeKan-Inbound-Secret` header or as `?secret=` in the webhook URL (`401`);
2. the `to`/recipient field is parsed and its MAC verified — an invalid,
   tampered, expired or missing token is rejected (`403`);
3. the target card is looked up by the id inside the token (`404` if gone);
4. **the author is the user named in the token.** The reply's `from` address
   must be one of that user's own email addresses; a reply from any other
   address — a forged `From`, or a forwarded email somebody else answered —
   is rejected (`403`), never attributed to the sender it claims;
5. that user must still be enabled and allowed to comment on that card now:
   an active member of its board whose role may comment, and, for an
   assigned-only role, assigned to the card (`403`);
6. the plain-text body is stripped of quoted reply text (see below) and, if
   anything is left, inserted as a new `CardComments` document authored by
   that user.

Refusals that only an attempt produces — a forged token, a `from` address
that is not the recipient's, a wrong webhook secret — are logged through
`server/lib/securityLog` under the `authn.inbound-email` catalog key
(`models/lib/securityCategories.js`, ReplyBleed), so they are visible in
**Admin Panel → Problems**. An expired token, a pre-fix token and a member who
has lost access are refused without a log entry: a real person replying to an
old email reaches those.

#### ReplyBleed (GHSA-mc7c-cv99-64h7)

Before this was fixed the token signed only the card (`reply+<cardId>-<hmac>`)
and the author was whichever user owned the reply's `from` address — a field
the sender controls. Anyone holding one card's reply address could post a
comment on that card as any user. Reply addresses in that old form are now
refused; replies to notification emails sent before upgrading will bounce with
`403`, and new notifications carry the new form.

#### A digest email only carries one Reply-To

WeKan batches a user's notifications and sends them as a single digest email
after a short delay (`EMAIL_NOTIFICATION_TIMEOUT`, default 30s). Because one
email can only carry one `Reply-To` address, a digest covering more than one
card's notifications uses the **most recently notified card** for that user —
a reply always lands on the last card mentioned in the digest, not on
whichever one the reply text happens to discuss. This is a known, deliberate
limitation of batching plus a single Reply-To; splitting a digest into
per-card emails would remove the batching this feature otherwise relies on,
so it is left as-is.

#### Reply-quote stripping

The plain-text body is cut at the first line that looks like the start of a
quoted reply (`server/lib/inboundEmailQuoteStrip.js`):

- `On ... wrote:` (Gmail, Apple Mail, most clients' quote header)
- a line starting with `>` (plain-text quoting)
- `-----Original Message-----` (Outlook)
- a `From: ...` header line (Outlook's header-block style)

This is a heuristic, not a full email-quoting parser — the common markers
above cover the large majority of real mail clients. A body with none of
these markers is kept in full, trimmed of surrounding whitespace.

### Configuration

Two environment variables turn the feature on. With either unset, WeKan sends
no `Reply-To` header at all — existing installs are unaffected.

| Variable | Purpose |
| --- | --- |
| `INBOUND_EMAIL_HMAC_SECRET` | Server-only secret used to sign/verify the reply token. Generate a long random value once (e.g. `openssl rand -hex 32`) and never change it, or every previously-sent Reply-To address stops verifying. |
| `INBOUND_EMAIL_DOMAIN` | The domain your inbound-parse provider receives mail for, e.g. `reply.yourwekan.example`. Used as the `@domain` part of the Reply-To address WeKan generates. |
| `INBOUND_EMAIL_REPLY_DAYS` | Optional. How many days a reply address stays valid, 1 to 365; default 30. |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | Optional, recommended. A second random value that only your provider knows: add it to the webhook URL as `?secret=<value>` (or send it as the `X-WeKan-Inbound-Secret` header). With it set, a POST that does not carry it is refused before any token is read. |

The endpoint used to require WeKan's REST API to be enabled
(`WITH_API=true`), since it is served under `/api/`. It no longer does: the
inbound email paths pass the `WITH_API` gate on their own
(`isInboundEmailPath()` in `server/apiMiddleware.js`), because they have gates
of their own (the webhook secret and the reply address's signature).

### Provider-side setup

#### Mailgun Routes

1. Add and verify the domain you will use for `INBOUND_EMAIL_DOMAIN` in
   Mailgun (or a subdomain of a domain you already send from).
2. In **Receiving → Routes**, create a route:
   - **Filter**: `match_recipient("reply+.*@reply.yourwekan.example")`
   - **Action**: `forward("https://your-wekan.example/api/inbound-email")`
3. Mailgun POSTs the parsed message (`sender`, `recipient`, `body-plain`,
   `stripped-text`, …) as `multipart/form-data`; WeKan's inbound handler
   reads `sender`/`recipient`/`stripped-text` (falling back to `body-plain`).

#### SendGrid Inbound Parse

1. Add an MX record for `INBOUND_EMAIL_DOMAIN` pointing at
   `mx.sendgrid.net`.
2. In **Settings → Inbound Parse**, add a host & URL:
   - **Receiving domain**: your `INBOUND_EMAIL_DOMAIN`
   - **Destination URL**: `https://your-wekan.example/api/inbound-email`
3. SendGrid POSTs `from`, `to`, `text` (plus attachments and raw MIME, which
   WeKan's handler ignores) as `multipart/form-data`.

#### Postmark inbound webhook

1. Create (or reuse) a Postmark server with **Inbound** processing enabled,
   using `INBOUND_EMAIL_DOMAIN` as the inbound domain.
2. Set the **Webhook URL** to `https://your-wekan.example/api/inbound-email`.
3. Postmark POSTs JSON with `From`, `To` (and `OriginalRecipient`), and
   `TextBody`, which WeKan's handler reads directly.

### What this does NOT do

- The webhook itself does not poll an IMAP/POP3 mailbox. (Since Email to card,
  an admin can add IMAP mailboxes, and replies found there are handled too; POP3
  is not supported.)
- It does not process HTML email bodies, attachments, or inline images in a
  reply — only the plain-text body.
- It never attributes a reply to anyone but the user the email was sent to,
  and only when the reply comes from one of that user's own account email
  addresses.

## Commits

 - [BounceBleed: a forged bounce report no longer stops email](https://github.com/wekan/wekan/commit/81ca7b868bfc9c06f3246fe988981b0f87158ffe)
 - [Inbound email paths pass the WITH_API gate on their own](https://github.com/wekan/wekan/commit/79ac3016751a4633f9efb1eda2102dcb798378b4)
 - [Email to card, with IMAP mailboxes that also take replies](https://github.com/wekan/wekan/commit/988b177e59dd1b0e2e8763900fde69056a14d800)
 - [ReplyBleed: attribute replies to the recipient the address was sent to](https://github.com/wekan/wekan/commit/3151f8a815b03dde3428bfd827c750300d47e896)
 - [Reply-by-email: replying to a notification comments on the card](https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6)
