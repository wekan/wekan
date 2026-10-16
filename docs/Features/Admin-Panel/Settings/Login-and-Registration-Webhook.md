# Login and registration webhook

[#2290](https://github.com/wekan/wekan/issues/2290). Admin Panel → Settings →
Global Webhooks → **Login and registration webhook** is one address that
WeKan tells when somebody logs in, when a new account is made, or both.

- **Off by default.** Nothing is sent until **When somebody logs in** or
  **When a new account is made** is ticked and an address is saved.
- **Little by default.** Each message is a JSON POST carrying only what
  happened, the user name and the time:

  ```json
  { "event": "login", "username": "alice", "at": "2026-10-14T12:00:00.000Z" }
  ```

  The email address, the IP address the login came from, the full name and the
  sign-in method (password, LDAP, OIDC, ...) are added only when ticked under
  **Also send**. A password hash, a token or the user's id is never sent.
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

"A new account" is every account WeKan creates: self-registration, an
invitation, an administrator adding a user, or a first LDAP / OAuth2 login.
