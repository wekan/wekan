# Header Login (reverse-proxy SSO)

## What it is

WeKan can delegate authentication to a trusted reverse proxy that performs SSO and
passes the authenticated identity to WeKan in HTTP request headers ("header login",
e.g. SiteMinder). When enabled, a request arriving through the trusted proxy with the
configured identity header is logged in without a password. The account is
created at the first such login.

## Read more

- [Single sign-on on Wikipedia](https://en.wikipedia.org/wiki/Single_sign-on)
- [Reverse proxy on Wikipedia](https://en.wikipedia.org/wiki/Reverse_proxy)
- [X-Forwarded-For on Wikipedia](https://en.wikipedia.org/wiki/X-Forwarded-For)
- [ProxyBleed](https://wekan.fi/hall-of-fame/proxybleed/), the vulnerability
  the source-address check closes
- WeKan: [Disable Password Login](Disable-Password-Login.md),
  [Let's Encrypt and Google Auth](Let's-Encrypt-and-Google-Auth.md),
  [local login protocol tests](Testing.md)

## How to use it

1. Configure the reverse proxy to authenticate the user and to send the
   identity in a header, for example `X-Auth-User`. The proxy must remove
   that header from what clients send.
2. Set the variables below as environment variables (Docker, `start-wekan.sh`,
   `start-wekan.bat`) or snap keys, and restart WeKan. They are
   **environment-only**: **Admin Panel / People / Header login**
   (`/admin/people/header-login`) shows them read-only and refuses a save,
   because a trusted proxy can sign in as anybody it names, so turning it on
   must take access to the host.
3. Open WeKan through the proxy. A page load without a WeKan login cookie is
   signed in as the user the header names.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `HEADER_LOGIN_ID` | yes (enables the feature) | Name of the header carrying the username, e.g. `X-Auth-User` (SiteMinder: `HEADERUID`). |
| `HEADER_LOGIN_EMAIL` | optional | Name of the header carrying the email address. |
| `HEADER_LOGIN_FIRSTNAME` | optional | Name of the header carrying the first name. |
| `HEADER_LOGIN_LASTNAME` | optional | Name of the header carrying the last name. |
| `HEADER_LOGIN_TRUSTED_IPS` | **yes** | Comma-separated allowlist of source IPs allowed to use header login (see below). The older name `HEADER_LOGIN_TRUSTED_IP` is still read. |
| `HEADER_LOGIN_TRUSTED_PROXIES` | optional | Comma-separated intermediate proxy IPs, for multi-hop proxy setups (see below). |

### Single proxy (typical)

WeKan sits directly behind one reverse proxy:

```
client → reverse proxy (10.0.0.2) → WeKan
```

Set the allowlist to the proxy's address (the IP WeKan sees the connection from):

```
HEADER_LOGIN_ID=X-Auth-User
HEADER_LOGIN_TRUSTED_IPS=10.0.0.2
```

### Multiple proxy hops (optional)

If WeKan is behind several proxy hops and you want to allowlist by the **original
client IP**, list the intermediate proxy IPs in `HEADER_LOGIN_TRUSTED_PROXIES`:

```
client (203.0.113.5) → edge proxy (10.0.0.2) → inner proxy (10.0.0.1) → WeKan

HEADER_LOGIN_ID=X-Auth-User
HEADER_LOGIN_TRUSTED_PROXIES=10.0.0.1,10.0.0.2
HEADER_LOGIN_TRUSTED_IPS=203.0.113.5
```

`X-Forwarded-For` is honored **only** when the immediate TCP peer is one of the
trusted proxies, and WeKan then uses the right-most hop that is not itself a trusted
proxy (the real client) for the allowlist check. A client connecting directly to the
port is not a trusted proxy, so its `X-Forwarded-For` is ignored and the request is
rejected.

### Notes

- To make header login the only method, also disable password login
  (`PASSWORD_LOGIN_ENABLED=false`); see [Disable-Password-Login](./Disable-Password-Login.md).
- On Snap, set the same options with, e.g.,
  `snap set wekan header-login-id=X-Auth-User header-login-trusted-ips=10.0.0.2`.
- The matching environment-variable examples are in `docker-compose.yml`,
  `start-wekan.sh` and `start-wekan.bat`.

## How the numbers are calculated

From [server/lib/headerLoginAuth.js](../../../server/lib/headerLoginAuth.js):

- The username is the header value trimmed, with `\` and `/` replaced by `-`,
  runs of whitespace made one space, and cut to the first **64** characters.
- The email is lower-cased and cut to **254** characters; a value without `@`
  or with a space is ignored.
- The full name is `first name + " " + last name`, trimmed; when both are
  empty it is the username.
- IP addresses are compared after removing an `::ffff:` prefix, so an IPv4
  address seen as IPv6-mapped still matches.

## How it works in WeKan

### Security model (GHSA-jggc-qvfc-jr6x)

Header login is only as trustworthy as the network path: any client that can reach
WeKan's HTTP port and set the identity header would otherwise be able to log in as
anyone. To prevent that, WeKan checks the **source IP** of each request against
`HEADER_LOGIN_TRUSTED_IPS`.

- The source IP is taken from the **real TCP connection** (the socket peer) — i.e.
  your reverse proxy. It is **never** taken from the client-supplied `X-Forwarded-For`
  header, which is fully attacker-controlled.
- If `HEADER_LOGIN_TRUSTED_IPS` is **empty or unset, header login fails closed** and
  authenticates no one. You must set it to your reverse proxy's IP address(es). (A
  warning is logged at startup if header login is enabled without it.)

> Before WeKan v9.45 the source IP was read from `X-Forwarded-For` and an empty
> allowlist trusted every source, which allowed an unauthenticated attacker to take
> over any account (including admin) by spoofing a single header. See
> [ProxyBleed](https://wekan.fi/hall-of-fame/proxybleed/).

### Code

- [server/header-login.js](../../../server/header-login.js) is a WebApp
  middleware. It handles only `GET` requests that are not under `/api/` or
  `/sockjs/` and carry no `meteor_login_token` cookie; for those it finds or
  creates the user and sets the `meteor_login_token`, `meteor_user_id` and
  `meteor_login_token_expires` cookies (`HttpOnly`, `SameSite=Lax`, `Secure`
  over HTTPS). An account locked to SQRL is not signed in this way.
- [server/lib/headerLoginAuth.js](../../../server/lib/headerLoginAuth.js)
  finds the user by username first, then by email; a new user gets
  `authenticationMethod: 'header'` and, when an email header is set, that
  email marked verified. Header login is off on Sandstorm.
- The settings are section `headerLogin` (`envOnly: true`) of
  [models/lib/authConfigCatalog.js](../../../models/lib/authConfigCatalog.js).
- Tests: [server/lib/tests/headerLoginAuth.tests.js](../../../server/lib/tests/headerLoginAuth.tests.js),
  [server/lib/tests/proxybleed.security.tests.js](../../../server/lib/tests/proxybleed.security.tests.js),
  [tests/authConfigCatalog.test.cjs](../../../tests/authConfigCatalog.test.cjs).

## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.

## Commits

 - [An account locked to SQRL is not signed in by header login](https://github.com/wekan/wekan/commit/a539429fce594ad3423627a7471a142836a71f8d)
 - [Make header login settings environment-only](https://github.com/wekan/wekan/commit/a7628504f19294d49c249d49b80c7b9388bf2dd2)
 - [Admin Panel / People / Header login shows the settings](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Disabled accounts cannot sign in, and their sessions are revoked](https://github.com/wekan/wekan/commit/c3caf87a13ec3de10cc5fd64e49635453cf91100)
 - [Verify login provider exchanges and fix authentication failures](https://github.com/wekan/wekan/commit/4f7d28637e3c68d20c8c8462dfaea1289210c861)
 - [Keep resume tokens in HttpOnly cookies](https://github.com/wekan/wekan/commit/78a3a21c394018d18b13041f167f9e8e98a86131)
 - [Fix ProxyBleed: the allowlist uses the socket address, and fails closed](https://github.com/wekan/wekan/commit/b181889a565254bc9bf79379a34fc7f617ccda28)
 - [Add Header Login](https://github.com/wekan/wekan/commit/d9f1ecb834326eee03b6d3e36d0bc6010a67d895)
