# Login and registration webhook

## What it is

[#2290](https://github.com/wekan/wekan/issues/2290). Admin Panel → Settings →
Global Webhooks → **Login and registration webhook** is one address that
WeKan tells when somebody logs in, when a new account is made, or both. A
security system, a directory or a welcome bot can listen there.

"A new account" is every account WeKan creates: self-registration, an
invitation, an administrator adding a user, or a first LDAP / OAuth2 login.

## Read more

- [Webhook](https://en.wikipedia.org/wiki/Webhook) on Wikipedia.
- [Server-side request forgery](https://en.wikipedia.org/wiki/Server-side_request_forgery)
  on Wikipedia - why the address passes WeKan's SSRF guard.
- [Global Webhooks](Global-Webhooks.md) - the pane this sits on, and its
  Internal destinations.

## How to use it

1. Open **Admin Panel / Settings / Global Webhooks**, and scroll to **Login and
   registration webhook**.
2. Write the address in **URL** (`https://...`) and, optionally, a token in
   **Token (Optional for Authentication)**.
3. Tick **When somebody logs in**, **When a new account is made**, or both.
4. Under **Also send:** tick only the extra fields the receiver needs:
   **Email address**, **IP address the login came from**, **Full name**,
   **Sign-in method**.
5. Press **Save**. The ticks are kept only when you press Save.

What it does:

- **Off by default.** Nothing is sent until **When somebody logs in** or
  **When a new account is made** is ticked and an address is saved.
- **Little by default.** Each message is a JSON POST carrying only what
  happened, the user name and the time:

  ```json
  { "event": "login", "username": "alice", "at": "2026-10-14T12:00:00.000Z" }
  ```

  The email address, the IP address the login came from, the full name and the
  sign-in method (password, LDAP, OIDC, ...) are added only when ticked under
  **Also send**. A password hash, a token or the user's id is never sent. A new
  account is sent as `"event": "register"`, and never carries an IP address.
- **A token**, when set, is sent as the `X-Wekan-Token` header, as for board
  webhooks, so the receiver can check the message came from this WeKan.
- **The same safety as every outgoing webhook:** it goes through WeKan's SSRF
  guard, so an address on WeKan's own network is reached only when it is listed
  under **Internal destinations** on the same page. On Sandstorm it leaves
  through the Powerbox.
- **A login never waits for it.** It is sent after the login has succeeded,
  and a receiver that is down or slow only leaves a line in the server log.
- Only site administrators read or change it. It is not published to
  browsers, since the address and token are the administrator's.

## How the numbers are calculated

- **at** is the time of sending, as an ISO 8601 UTC string.
- The **URL** is cut to 2000 characters and must be `http:` or `https:`;
  anything else is refused with `invalid-url`. The **token** is cut to 500
  characters.
- Each POST waits at most **10 seconds** for the receiver.
- The setting is cached for **10 seconds** between logins; saving clears the
  cache.

## How it works in WeKan

- **Pure rules**: [models/lib/accountWebhook.js](../../../../models/lib/accountWebhook.js) -
  `cleanAccountWebhook()` (what is stored), `sends()` (whether an event is
  sent) and `accountWebhookPayload()` (what is in the message; the extra fields
  are `email`, `ip`, `fullname`, `authMethod`).
- **Server**: [server/accountWebhook.js](../../../../server/accountWebhook.js)
  sends on `Accounts.onLogin` and after a user is inserted, with
  `Meteor.defer` so the login never waits, through `webhookFetch()` in
  [server/sandstormEgress.js](../../../../server/sandstormEgress.js). The
  site-admin-only methods `getAccountWebhook` and `saveAccountWebhook` read and
  write `accountWebhook` on the settings document; it is not in the settings
  publication.
- **Pane**: the `.account-webhook` block of template `webhookSettings` in
  [settingBody.jade](../../../../client/components/settings/settingBody.jade),
  handlers in [settingBody.js](../../../../client/components/settings/settingBody.js).
- **Tests**: [tests/accountWebhook.test.cjs](../../../../tests/accountWebhook.test.cjs).

## Commits

 - [A login and registration webhook, off by default (#2290)](https://github.com/wekan/wekan/commit/ea256dd7725562f57e1be69b1bec1eccdaa9914a)
