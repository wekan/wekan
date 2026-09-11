## Passwordless login: a one-time code by email

Meteor's `accounts-passwordless` package lets a user sign in with a code that
WeKan emails them, instead of a password. WeKan wires it in behind one switch:

| Variable | Meaning |
| --- | --- |
| `PASSWORDLESS_ENABLED` | `true` adds "Sign in with a code sent by email" to the login page. Default `false`. |

It needs WeKan to be able to send email, so `MAIL_URL` (or the Admin Panel /
People / Email settings) must work first - test with a "forgot password"
email before enabling this. It can be overridden in Admin Panel / People /
Login, and a value set there wins over the environment variable.

```
  browser                        WeKan                       mail server
    |  email address               |                              |
    |----------------------------->|  6-digit code, valid for a   |
    |                              |  few minutes, sent to that   |
    |                              |  address                     |
    |                              |----------------------------->|
    |  user reads the code         |                              |
    |  in their inbox              |                              |
    |  types the code              |                              |
    |----------------------------->|  code matches and is not     |
    |                              |  expired: log in             |
    |  logged in                   |                              |
    |<-----------------------------|                              |
```

## What it does and does not do

- An existing WeKan user with that email logs in as themselves; no password
  is asked and no password is set or changed.
- An unknown email creates a new user, subject to the registration rules in
  Admin Panel / People / Registration: with invite-only registration the code
  is not sent and the login is refused, exactly like a password sign-up.
- The code is single-use and short-lived. Asking for a new one invalidates the
  old one.
- The email is a login factor, so this is only as strong as the user's mailbox.
  It is a convenience for people who forget passwords, not a second factor;
  for that see [Two-Factor Authentication](Two-Factor-Authentication.md).
- Brute-forcing the code is covered by the same
  [Accounts Lockout](Accounts-Lockout.md) that guards password logins.

## Where it is configured

`PASSWORDLESS_ENABLED` is commented out, with the explanation above, in
`docker-compose.yml` (and the FerretDB / MongoDB variants), `Dockerfile`,
`start-wekan.sh`, `start-wekan.bat`, the Snap
(`snap set wekan passwordless-enabled='true'`) and the Sandstorm package
definition.

To have only passwordless and the social providers, and no password form at
all, also set `PASSWORD_LOGIN_ENABLED=false`
([Disable Password Login](Disable-Password-Login.md)).

## Related

- [OAuth Providers](OAuth-Providers.md): Google, GitHub, Facebook, Twitter,
  Meteor Developer, Weibo, Meetup
- [Forgot Password](Forgot-Password.md), which uses the same outgoing email
