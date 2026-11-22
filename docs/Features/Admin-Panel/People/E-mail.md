# Admin Panel / People / E-mail

## What it is

Outgoing email and two account settings: how WeKan sends mail (its own
`MAIL_URL` environment setting, or a provider configured here), which e-mail
domain may invite people when self-registration is off, and whether users may
change their own address. The same pane also holds what WeKan does with mail
that bounces, and the optional templates of the invite and activity e-mails.
It is the pane Admin Panel / People opens on (`/admin/people/email`).

## Read more

- [Simple Mail Transfer Protocol](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol)
  and [Bounce message](https://en.wikipedia.org/wiki/Bounce_message) on
  Wikipedia.
- [Nodemailer well-known services](https://nodemailer.com/smtp/well-known-services) -
  the provider list the **Email service** choice comes from.
- [E-mail troubleshooting](../../General/Email/Troubleshooting-Mail.md)
- [Bounces](../../General/Email/Bounces.md) - the bounce settings in detail.
- [Domains](Domains.md) — which domains are actually in use.
- [Invite People](../../Member-Settings/Invite-People.md)

## How to use it

**Send mail through a provider configured here**

1. Open **Admin Panel**, **People**, **E-mail**.
2. Tick **Enable below email settings** — opt in to configuring outgoing email
   here.
3. In **Email service**, choose either custom **SMTP** or one of the many
   built-in Nodemailer providers, including Gmail, Gmail Workspace, Outlook
   365, Proton, SendGrid, Mailgun, Postmark, Resend and AWS SES regions.
4. Enter the selected provider's **Username**, **Password** and **From**
   address; custom SMTP also asks for **SMTP Host**, **SMTP Port** and
   **Enable TLS support for SMTP server**. Each provider retains its own
   configuration. A password that is already saved is kept when the field is
   left blank ("A password is saved. Leave blank to keep it.").
5. Use the **Save** button directly below the provider fields.
6. Click **Send a test email to yourself** at the top of the pane. It sends
   one to your own address using the active transport and reports what
   happened.

When **Enable below email settings** is disabled, WeKan continues to use the
installation's `MAIL_URL` and `MAIL_FROM` environment settings. This preserves
existing Snap, Docker, bundle and source configurations until an administrator
explicitly enables the Admin Panel transport.

**Let people of one domain invite, and allow e-mail changes**

1. At the bottom of the pane, fill in **Email domain allowed to invite people,
   when self-registration is disabled** (`mailDomainName`) — this does **not**
   limit who may sign in. A **non-admin** whose address ends with this domain
   may send board invitations, and only while self-registration is off (admins
   may always invite). It is a plain suffix match, so write it as
   `@example.com`; `example.com` alone would also match `user@notexample.com`.
2. Tick or untick **Allow Email Change** — whether a user may change their own
   e-mail address.
3. Click the **Save** under these two settings.

**Bounces and e-mail templates**

1. Under **Bounces**, tick **Handle bounces in WeKan** to act on mail that comes
   back, choose an action per category and **After how many**, and save; see
   [Bounces](../../General/Email/Bounces.md).
2. Under **Email Templates**, fill in **Invite email subject**, **Invite email
   body**, **Activity notification email subject** and **Activity
   notification email body**, and click **Save**. A field left empty keeps the
   built-in e-mail. The invite templates may use `{email} {inviter} {user}
   {icode} {url}`; the activity templates `{board} {card} {list} {username}
   {url} {comment} {action}`.

## How the numbers are calculated

- **Email service choices**: 87 - `SMTP` plus the 86 Nodemailer services in
  [models/lib/mailServices.js](../../../../models/lib/mailServices.js).
- **SMTP Port**: free text; the placeholder suggests `587`.
- **Bounce threshold**: a whole number from 1 to 100 per category - how many
  bounces of that kind before the action is taken (see
  [Bounces](../../General/Email/Bounces.md)).
- The invite domain is not a number: it is an `endsWith` test of each of the
  inviter's addresses (`isNonAdminAllowedToSendMail` in
  [server/models/settings.js](../../../../server/models/settings.js)).

## How it works in WeKan

- The pane is the `email` template in
  [client/components/settings/settingBody.jade](../../../../client/components/settings/settingBody.jade)
  (it moved to People from Settings; Blaze templates are global, so it is
  still defined there) and is drawn by
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade).
- `saveAdminMailSettings` in
  [server/models/settings.js](../../../../server/models/settings.js) is
  admin-only. It checks the service against the list, requires a host for
  SMTP and a From address when the transport is enabled, stores each
  service's configuration under `mailServer.configurations.<service>` and its
  password under `mailServer.passwords.<service>` (never sent back to the
  browser - only `passwordSet`), and then installs the Admin Panel transport,
  or puts the `MAIL_URL` transport back when it is disabled.
- `sendSMTPTestEmail` is admin-only and sends to the administrator's first
  e-mail address.
- The invite domain and **Allow Email Change** are fields of the `settings`
  document (`mailDomainName`) and of the account settings.
- On Sandstorm this pane is not shown: a grain sends its mail through
  Sandstorm.
- Every save is recorded in the [Audit log](Audit-Log.md)
  (`saveAdminMailSettings`, `saveEmailBounceSettings`).
- Pinned by [tests/adminMailSettings.test.cjs](../../../../tests/adminMailSettings.test.cjs),
  [tests/smtpDeadline.test.cjs](../../../../tests/smtpDeadline.test.cjs),
  [tests/emailBounce.test.cjs](../../../../tests/emailBounce.test.cjs),
  [tests/emailTemplatesCustomization.test.cjs](../../../../tests/emailTemplatesCustomization.test.cjs),
  [tests/loginEmailPanesMoved.test.cjs](../../../../tests/loginEmailPanesMoved.test.cjs)
  and the browser test
  [tests/playwright/specs/46-admin-email-services.e2e.js](../../../../tests/playwright/specs/46-admin-email-services.e2e.js).

## Commits

 - [Email bounces from Mailgun, SendGrid, Postmark, Brevo and more](https://github.com/wekan/wekan/commit/57e05c4304ea34a082e88326c8221cc5cc768dee)
 - [Email bounces with Amazon SES](https://github.com/wekan/wekan/commit/79ac3016751a4633f9efb1eda2102dcb798378b4)
 - [Bound SMTP connection phases and idle waits](https://github.com/wekan/wekan/commit/9758886cfaea1ef0463e3bca4c0f4b0a378515f3)
 - [Add the Email Templates settings](https://github.com/wekan/wekan/commit/f6e98f1205e7b9ddeba094f8e5ceb2ac36eb2621)
 - [Add the Nodemailer service settings](https://github.com/wekan/wekan/commit/395f10e030e573ba3362e46a5916f1ea75651501)
 - [Allow Email Change becomes a checkbox](https://github.com/wekan/wekan/commit/362b14c3d9f89a74a29146f4dcee09fa5568e04a)
 - [The Save saves, and the invite domain field says what it does](https://github.com/wekan/wekan/commit/f15b37e4e013814ced8165f905eb6540d61bb90f)
 - [Login and E-mail move from Settings to People](https://github.com/wekan/wekan/commit/47b03ef89404c446dbaf0fc94c7271abaf82e5ef)
 - [Move the e-mail domain field out of Settings / Layout](https://github.com/wekan/wekan/commit/1bedcf9eb000850de6fd74c158fdcd0d36b6ec59)
