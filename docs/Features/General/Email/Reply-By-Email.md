# Reply-by-email (#2414)

Reply to a WeKan notification email, and the reply becomes a comment on the
card it was about — the same experience Trello and GitHub offer.

## Scope: a webhook receiver, not a mailbox poller

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

## How a reply is matched back to its card and its author

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

### ReplyBleed (GHSA-mc7c-cv99-64h7)

Before this was fixed the token signed only the card (`reply+<cardId>-<hmac>`)
and the author was whichever user owned the reply's `from` address — a field
the sender controls. Anyone holding one card's reply address could post a
comment on that card as any user. Reply addresses in that old form are now
refused; replies to notification emails sent before upgrading will bounce with
`403`, and new notifications carry the new form.

### A digest email only carries one Reply-To

WeKan batches a user's notifications and sends them as a single digest email
after a short delay (`EMAIL_NOTIFICATION_TIMEOUT`, default 30s). Because one
email can only carry one `Reply-To` address, a digest covering more than one
card's notifications uses the **most recently notified card** for that user —
a reply always lands on the last card mentioned in the digest, not on
whichever one the reply text happens to discuss. This is a known, deliberate
limitation of batching plus a single Reply-To; splitting a digest into
per-card emails would remove the batching this feature otherwise relies on,
so it is left as-is.

### Reply-quote stripping

The plain-text body is cut at the first line that looks like the start of a
quoted reply (`server/lib/inboundEmailQuoteStrip.js`):

- `On ... wrote:` (Gmail, Apple Mail, most clients' quote header)
- a line starting with `>` (plain-text quoting)
- `-----Original Message-----` (Outlook)
- a `From: ...` header line (Outlook's header-block style)

This is a heuristic, not a full email-quoting parser — the common markers
above cover the large majority of real mail clients. A body with none of
these markers is kept in full, trimmed of surrounding whitespace.

## Configuration

Two environment variables turn the feature on. With either unset, WeKan sends
no `Reply-To` header at all — existing installs are unaffected.

| Variable | Purpose |
| --- | --- |
| `INBOUND_EMAIL_HMAC_SECRET` | Server-only secret used to sign/verify the reply token. Generate a long random value once (e.g. `openssl rand -hex 32`) and never change it, or every previously-sent Reply-To address stops verifying. |
| `INBOUND_EMAIL_DOMAIN` | The domain your inbound-parse provider receives mail for, e.g. `reply.yourwekan.example`. Used as the `@domain` part of the Reply-To address WeKan generates. |
| `INBOUND_EMAIL_REPLY_DAYS` | Optional. How many days a reply address stays valid, 1 to 365; default 30. |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | Optional, recommended. A second random value that only your provider knows: add it to the webhook URL as `?secret=<value>` (or send it as the `X-WeKan-Inbound-Secret` header). With it set, a POST that does not carry it is refused before any token is read. |

The endpoint also requires WeKan's REST API to be enabled
(`WITH_API=true`), since it is served under `/api/`.

## Provider-side setup

### Mailgun Routes

1. Add and verify the domain you will use for `INBOUND_EMAIL_DOMAIN` in
   Mailgun (or a subdomain of a domain you already send from).
2. In **Receiving → Routes**, create a route:
   - **Filter**: `match_recipient("reply+.*@reply.yourwekan.example")`
   - **Action**: `forward("https://your-wekan.example/api/inbound-email")`
3. Mailgun POSTs the parsed message (`sender`, `recipient`, `body-plain`,
   `stripped-text`, …) as `multipart/form-data`; WeKan's inbound handler
   reads `sender`/`recipient`/`stripped-text` (falling back to `body-plain`).

### SendGrid Inbound Parse

1. Add an MX record for `INBOUND_EMAIL_DOMAIN` pointing at
   `mx.sendgrid.net`.
2. In **Settings → Inbound Parse**, add a host & URL:
   - **Receiving domain**: your `INBOUND_EMAIL_DOMAIN`
   - **Destination URL**: `https://your-wekan.example/api/inbound-email`
3. SendGrid POSTs `from`, `to`, `text` (plus attachments and raw MIME, which
   WeKan's handler ignores) as `multipart/form-data`.

### Postmark inbound webhook

1. Create (or reuse) a Postmark server with **Inbound** processing enabled,
   using `INBOUND_EMAIL_DOMAIN` as the inbound domain.
2. Set the **Webhook URL** to `https://your-wekan.example/api/inbound-email`.
3. Postmark POSTs JSON with `From`, `To` (and `OriginalRecipient`), and
   `TextBody`, which WeKan's handler reads directly.

## What this does NOT do

- It does not poll an IMAP/POP3 mailbox — there is no mail account for WeKan
  to log into, and none of the credential-management or polling-loop
  complexity that would come with one.
- It does not process HTML email bodies, attachments, or inline images in a
  reply — only the plain-text body.
- It never attributes a reply to anyone but the user the email was sent to,
  and only when the reply comes from one of that user's own account email
  addresses.
