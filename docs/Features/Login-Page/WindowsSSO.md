# Windows single sign-on (Kerberos / NTLM)

## What it is

Members who are already signed in to their Windows domain account can sign in
to WeKan with **Sign in with Windows**, without typing a password. The browser
proves who they are with Kerberos or NTLM ("Integrated Windows Authentication"),
through [node-expose-sspi](https://github.com/jlguenego/node-expose-sspi).
Added for [\#5758](https://github.com/wekan/wekan/issues/5758).

**Status:** built without a Windows domain to test against. The decisions it
makes (which accounts are allowed, which WeKan account they sign in to) are
tested; the handshake itself has not been run. Reports are welcome in #5758.

## Read more

- [Integrated Windows Authentication at Wikipedia](https://en.wikipedia.org/wiki/Integrated_Windows_Authentication)
- [Kerberos at Wikipedia](https://en.wikipedia.org/wiki/Kerberos_(protocol)),
  [NTLM at Wikipedia](https://en.wikipedia.org/wiki/NTLM) and
  [SPNEGO (Negotiate) at Wikipedia](https://en.wikipedia.org/wiki/SPNEGO)
- [Security Support Provider Interface (SSPI) at Wikipedia](https://en.wikipedia.org/wiki/Security_Support_Provider_Interface)
- [node-expose-sspi](https://github.com/jlguenego/node-expose-sspi)
- [Header login](Header-Login.md) and [LDAP](LDAP.md), the choices off Windows

## How to use it

**Requirements**

- WeKan running **on Windows**, as a member of the domain (the
  [Windows bundle](../../Platforms/Propietary/OS/Windows/Offline.md) with
  `start-wekan.bat`). On Linux, macOS, Docker and Snap this login is never
  offered; use [Header login](Header-Login.md) behind IIS or
  [LDAP](LDAP.md) instead.
- WeKan reached **directly**, without a reverse proxy in between. NTLM
  authenticates the TCP connection, and a proxy that opens its own connections
  to WeKan breaks the handshake. Kerberos through a proxy needs the proxy to
  pass the `Authorization: Negotiate` header unchanged.
- **node-expose-sspi**, installed into the bundle. It is Windows-only, so it is
  not a dependency of WeKan that every platform downloads:

  ```
  cd C:\wekan\bundle\programs\server
  npm install node-expose-sspi@0.1.60
  ```

  WeKan looks for it in `bundle\programs\server` and in the bundle directory.
  Without it, WeKan logs `Windows SSO: ... node-expose-sspi is not installed`
  and does not show the button.

**Settings**

In `start-wekan.bat`:

```
SET WINDOWS_SSO_ENABLED=true
SET WINDOWS_SSO_DOMAINS=CONTOSO
REM optional
SET WINDOWS_SSO_ACTIVE_DIRECTORY=true
SET WINDOWS_SSO_MERGE_EXISTING_USERS=false
```

Each setting below is also in **Admin Panel / People / Login**: a value set
there wins, an empty field falls back to the variable, and a change applies at
once.

| Variable | Meaning |
| --- | --- |
| `WINDOWS_SSO_ENABLED` | `true` turns it on (Windows only). |
| `WINDOWS_SSO_DOMAINS` | **Required.** The domains allowed to sign in, comma separated: short names (`CONTOSO`) or DNS names (`contoso.example.com`). Empty means **nobody**, so that accounts from a trusted domain are not let in by accident. |
| `WINDOWS_SSO_ACTIVE_DIRECTORY` | `true` reads the member's display name and e-mail address from Active Directory. |
| `WINDOWS_SSO_MERGE_EXISTING_USERS` | `true` signs a Windows account in to an existing WeKan account with the same username, or the same e-mail address. Off by default: a local `alice` is not necessarily the domain's alice. |

The browser has to be willing to send Windows credentials to WeKan's address:
add it to the **Local intranet** zone (Internet Options, or the
`Site to Zone Assignment List` group policy) for Edge and Chrome, and to
`network.negotiate-auth.trusted-uris` (and `network.automatic-ntlm-auth.trusted-uris`
for NTLM) in Firefox.

**Sign in**

1. Open WeKan's sign-in page in a browser on a computer signed in to the
   domain.
2. Click **Sign in with Windows**. The browser sends the Windows sign-in
   without asking for a password, and WeKan opens signed in.

## How the numbers are calculated

- **Sign-in token**: random, kept only as its SHA-256, valid for one minute
  (`TOKEN_MS = 60000` in `server/windowsSso.js`) and used once.
- **New usernames**: the Windows username, then `alice-2`, `alice-3` ... up
  to `alice-50`; when all 50 are taken the sign-in is refused
  (`windows-sso-username-taken`, `models/lib/windowsSso.js`).
- **Domains**: an empty `WINDOWS_SSO_DOMAINS` allows nobody.

## How it works in WeKan

1. The sign-in page shows **Sign in with Windows**, a link to `/sso/windows`.
2. There, WeKan answers with `401 WWW-Authenticate: Negotiate`, and the browser
   answers with the Windows sign-in. node-expose-sspi checks it with Windows
   itself (SSPI).
3. WeKan checks the domain against `WINDOWS_SSO_DOMAINS` (a machine account,
   `NAME$`, is never accepted), then finds the member:
   - the WeKan account this Windows account signed in to before
     (`services.windowsSso.id`, e.g. `contoso\alice`);
   - else, with `WINDOWS_SSO_MERGE_EXISTING_USERS=true`, the account with the
     same username, or the same Active Directory e-mail address;
   - else a new account, under the Windows username, or `alice-2`, `alice-3`
     ... when that is taken.
4. WeKan redirects to `/sign-in?windowsSso=<token>`. The token is random, kept
   only as its SHA-256, valid for one minute and used once. The page signs in
   with it through the ordinary login checks: a deactivated account, and an
   account its member locked to [SQRL](SQRL.md) with `sqrlonly`, are refused
   as with any other way of signing in.

If something goes wrong, the sign-in page says "Windows sign-in failed". Set
`DEBUG=true` to see the reason in WeKan's log.

Files:

- [models/lib/windowsSso.js](../../../models/lib/windowsSso.js) - pure: the
  allowed domains, machine accounts, which member a Windows account is
  (`resolveMember`), where node-expose-sspi is looked for.
- [server/windowsSso.js](../../../server/windowsSso.js) - the `/sso/windows`
  route, the `windowsSsoTokens` collection and the `windowsSso` login handler.
- The sign-in page signs in with the token in
  [client/components/main/layouts.js](../../../client/components/main/layouts.js).
- The settings are `windowsSso` in
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js),
  listed for `start-wekan.bat` only.
- Test: [tests/windowsSso.test.cjs](../../../tests/windowsSso.test.cjs).

## Commits

 - [Windows single sign-on with Kerberos or NTLM](https://github.com/wekan/wekan/commit/a594a58117cab01f52fce2da78b78a288c4df3c1)
