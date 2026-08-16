# Admin Panel / People / E-mail

SMTP and two account settings. One **Save**, below everything it writes.

- **SMTP** — host, port, username, password, TLS and the from address. On most
  installs these are configured by environment variables instead, and the fields are
  commented out of the pane; `MAIL_URL` / `MAIL_FROM` are what WeKan then uses.
- **Email domain allowed to invite people, when self-registration is disabled**
  (`mailDomainName`) — this does **not** limit who may sign in. A **non-admin** whose
  address ends with this domain may send board invitations, and only while
  self-registration is off (admins may always invite). It is a plain suffix match, so
  write it as `@example.com`; `example.com` alone would also match
  `user@notexample.com`.
- **Allow Email Change** — whether a user may change their own e-mail address.

**Send SMTP test email** sends one to your own address and reports what happened.

## Related

- [E-mail troubleshooting](../../Email/Troubleshooting-Mail.md)
- [Domains](Domains.md) — which domains are actually in use.
