# Admin Panel / People / E-mail

Outgoing email and two account settings.

- **Enable below email settings** — opt in to configuring outgoing email here.
  When enabled, choose either custom **SMTP** or one of the many built-in
  Nodemailer providers, including Gmail, Gmail Workspace, Outlook 365, Proton,
  SendGrid, Mailgun, Postmark, Resend and AWS SES regions. Enter the selected
  provider's username, password and From address; custom SMTP also asks for
  host, port and TLS. Each provider retains its own configuration.
- When **Enable below email settings** is disabled, WeKan continues to use the
  installation's `MAIL_URL` and `MAIL_FROM` environment settings. This preserves
  existing Snap, Docker, bundle and source configurations until an administrator
  explicitly enables the Admin Panel transport.
- **Email domain allowed to invite people, when self-registration is disabled**
  (`mailDomainName`) — this does **not** limit who may sign in. A **non-admin** whose
  address ends with this domain may send board invitations, and only while
  self-registration is off (admins may always invite). It is a plain suffix match, so
  write it as `@example.com`; `example.com` alone would also match
  `user@notexample.com`.
- **Allow Email Change** — whether a user may change their own e-mail address.

Use the **Save** button directly below the provider fields. **Send SMTP test
email** sends one to your own address using the active transport and reports
what happened.

## Related

- [E-mail troubleshooting](../../Email/Troubleshooting-Mail.md)
- [Domains](Domains.md) — which domains are actually in use.
