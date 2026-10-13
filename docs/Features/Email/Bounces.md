# Email bounces

Email that WeKan sends sometimes comes back. Without bounce handling these
messages land in the inbox of whoever owns WeKan's From address:

- an invitation sent to a mistyped address;
- a notification sent to a full mailbox;
- an out-of-office reply;
- a spam complaint.

**Admin Panel → E-mail → Bounces** lets WeKan handle them instead. It works like
the bounce settings of established mailing software such as
[listmonk](https://listmonk.app/docs/bounces/) and Discourse: each kind of bounce
has actions, and the actions run once the address has bounced a set number of
times.

| Kind | What it is | Default |
| --- | --- | --- |
| Hard bounce | The address does not exist (SMTP 5.x.x): a typo, a deleted account, an unknown domain | After **1**: stop emailing the address, and tell the person who invited it |
| Soft bounce | Not delivered for now (SMTP 4.x.x): mailbox full, server busy | After **5**: stop emailing the address |
| Automatic reply | Out of office, vacation, or a ticket system's reply. The email *was* delivered | **Ignore** |
| Spam complaint | The recipient marked the email as spam | After **1**: stop emailing the address |

The actions are:

| Action | What it does |
| --- | --- |
| List it | Keeps the bounce in the list of addresses that bounced, and nothing more |
| Stop emailing the address | Removes the address from every email WeKan sends (notifications, invitations, cards sent from the Email view). An email left with no recipient is not sent. An admin clears the address to start emailing it again |
| Tell who invited it | Emails the person who sent the pending invitation: *"Your invitation to … could not be delivered"*, with the reason |
| Delete the invitation | Removes the pending invitation |
| Ignore | Not even listed |

Below the rules is the list of addresses that bounced, newest first. Each row
shows its count per kind, the last error message, and whether WeKan still emails
it. **Clear** forgets an address's bounces.

A bounce or an automatic reply never becomes a card or a comment, even when it
arrives at a [board address](Email-To-Card.md).

## Where bounces come from

### Amazon SES

Amazon SES reports bounces and complaints through Amazon SNS, and can also
*receive* email. Set up both:

1. **SNS topic.** In Amazon SNS, create a topic, for example `wekan-bounces`.
2. **Subscription.** Subscribe the address shown on the Bounces page to the
   topic, using protocol HTTPS:

       https://wekan.example.com/api/inbound-email/ses

   Add the topic's ARN to *SNS topic ARNs to accept* first, and save. WeKan
   then confirms the subscription by itself.
3. **Bounce and complaint notifications.** In Amazon SES → Verified
   identities → your domain → Notifications, send **Bounce** and
   **Complaint** feedback to the topic. Turn off *email feedback
   forwarding*, so those messages stop going to your own mailbox.
4. **Receiving.** To receive email in SES as well (replies, out-of-office
   messages, bounces from servers that send them as email, and email to board
   addresses):
   - in Amazon SES → Email receiving, add a receipt rule for WeKan's From
     address and the board-address domain;
   - give the rule an **SNS** action to the same topic, with encoding
     **Base64**;
   - point the domain's MX record at SES.

WeKan accepts an SNS message only when **both** of these hold:

- its signature verifies against Amazon's certificate, fetched only from
  `sns.<region>.amazonaws.com`;
- its topic is one of the ARNs you listed. A valid signature only proves the
  message came from SNS, not that it came from *your* topic.

A message that fails either check is refused and shows in Admin Panel → Problems
→ Security.

The endpoint works even when the REST API is turned off (`WITH_API`), as the
email-to-card webhook does.

### Any other mail system

Bounces also arrive as email, as delivery status notifications (RFC 3464,
`multipart/report`) from `MAILER-DAEMON`, or as older text-only "failure notice"
messages. Automatic replies are recognised by these headers:

- `Auto-Submitted: auto-replied` (RFC 3834);
- `X-Autoreply`, `X-Autorespond`, `Precedence: auto_reply`;
- *Automatic reply* / *Out of Office* subjects in several languages.

These are recognised wherever email reaches WeKan:

- an IMAP mailbox;
- a provider webhook;
- a Sandstorm grain's address.

So with Gmail, Microsoft 365, Mailgun or Postfix, point WeKan's From address
(or its Return-Path) at a mailbox WeKan reads, and the bounces are handled
the same way.

## When something goes wrong

What goes wrong *sending or receiving* email is listed in **Admin Panel →
Problems → Email**:

- a send the mail server refused, or a mail server that could not be reached;
- an IMAP mailbox that cannot be read, for example a wrong password (the
  password is never shown);
- an email that could not be read;
- an email for a board that no longer takes email.

Attempts are listed in Problems → Security instead: a guessed board address, a
wrong webhook secret, a forged SNS message.

## Files

| File | |
| --- | --- |
| `models/lib/emailBounce.js` | Categories, actions, the rules, and SES/DSN/auto-reply classification. No Meteor code |
| `server/emailBounces.js` | The SES endpoint, recording and actions, the send hook, the Admin Panel methods |
| `client/components/settings/emailBounces.jade`, `.js` | The Admin Panel section |
| `models/lib/mailProblems.js`, `server/lib/mailProblems.js` | Problems → Email |
| `tests/emailBounce.test.cjs` | Node tests |
| `server/lib/tests/emailBounces.tests.js`, `emailSendReceive.tests.js` | Runtime tests: signed SNS over HTTP, local SMTP and IMAP servers, a real Maildir |
