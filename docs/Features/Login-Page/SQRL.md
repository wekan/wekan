# SQRL

[#2460](https://github.com/wekan/wekan/issues/2460).

[SQRL](https://www.grc.com/sqrl/sqrl.htm) ("Secure Quick Reliable Login") signs
you in with a SQRL app on your phone or a SQRL client on your computer, instead
of a password. Your SQRL client makes a separate identity for each site from
your one SQRL identity; WeKan keeps only that identity's public key, so there
is nothing at WeKan that would let anybody sign in as you.

## Turning it on

Admin Panel → Settings → Visibility → Features → **Sign in with SQRL**. It is
off by default. WeKan must be at an `https://` address (`ROOT_URL`): SQRL's
identity is per site, and over plain http the challenge could be read on the
way.

SQRL is not offered on Sandstorm, where Sandstorm signs you in.

## Using it

- **Add your identity once:** sign in as usual, then Member Settings → **SQRL**
  → **Add my SQRL identity**. Scan the code with your SQRL app, or press **Open
  SQRL client** on a computer that has one, and confirm in the client.
- **Sign in:** on the sign-in page, **Sign in with SQRL**, then scan the code or
  open your SQRL client. The page signs in by itself once the client has
  answered. When the client is on the same computer it may open WeKan for you
  instead; then that tab is the one that signs in.
- **Remove it** in Member Settings → **SQRL**. Your SQRL client can also disable
  SQRL for your account (and re-enable it with your rescue code), or remove it.

An identity WeKan does not know cannot make an account or sign in: it has to be
added from Member Settings first, by somebody who is already signed in.

## How it works

The sign-in page asks the server for a session, and shows its `sqrl://` link
and QR code. Your SQRL client posts signed requests to `/sqrl`; the page asks
every two seconds whether the session is complete, and then signs in with the
session's secret, which only that page has.

- Every challenge ("nut") is random and used once, and each request must send
  back the server's previous reply unchanged. A session lasts ten minutes.
- Every request is signed with your identity key (Ed25519, checked with
  Node.js's own `crypto`); a forged or altered request changes nothing.
- When the client is on another network than the browser (a phone on mobile
  data), the client says so (`noiptest`); otherwise a request from another
  address than the sign-in page's is refused.
- Re-enabling, removing and replacing an identity need your rescue code's
  unlock key.
- A disabled account cannot sign in with SQRL; the usual sign-in checks apply.
- Your SQRL identity is never sent to other members' browsers, and only the
  server can change it.

The QR code is drawn by
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT),
pinned in `package.json`.

## Locking the account to SQRL

Your SQRL client has two options that it sends to WeKan every time it signs
you in. WeKan follows whatever the latest sign-in sent, so you switch them on
and off in the SQRL client. Member Settings → **SQRL** shows which are on.

- **sqrlonly** (*Request SQRL-only login*): your account signs in with SQRL
  only. Password, OAuth2/OIDC, LDAP, SAML, CAS, passkey, Nextcloud, header
  login and the REST API's `/users/login` all refuse it. Browsers that are
  already signed in stay signed in; sign out everywhere to end them.
- **hardlock** (*Request no recourse identity lock*): your account cannot be
  taken over by recovering it some other way. No password-reset e-mail is
  sent; WeKan answers as if one were, so the answer reveals nothing about the
  account. A reset link sent before the lock does not sign in, and you cannot
  change your e-mail address yourself.

Ways back, on purpose:

- **Disable SQRL from your SQRL client.** It is the emergency stop for a lost
  or compromised identity, and while the identity is disabled, neither lock
  applies. Re-enabling it with your rescue code puts the locks back.
- **The admin turns SQRL off** (Admin Panel → Settings → Visibility →
  Features). Then no account is locked.
- **An admin can still** change your e-mail address, set your password and
  create a token for you; the admin is the last resort.
