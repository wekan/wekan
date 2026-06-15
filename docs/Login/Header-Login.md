# Header Login (reverse-proxy SSO)

WeKan can delegate authentication to a trusted reverse proxy that performs SSO and
passes the authenticated identity to WeKan in HTTP request headers ("header login",
e.g. SiteMinder). When enabled, a request arriving through the trusted proxy with the
configured identity header is logged in without a password.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `HEADER_LOGIN_ID` | yes (enables the feature) | Name of the header carrying the username, e.g. `X-Auth-User` (SiteMinder: `HEADERUID`). |
| `HEADER_LOGIN_EMAIL` | optional | Name of the header carrying the email address. |
| `HEADER_LOGIN_FIRSTNAME` | optional | Name of the header carrying the first name. |
| `HEADER_LOGIN_LASTNAME` | optional | Name of the header carrying the last name. |
| `HEADER_LOGIN_TRUSTED_IPS` | **yes** | Comma-separated allowlist of source IPs allowed to use header login (see below). |
| `HEADER_LOGIN_TRUSTED_PROXIES` | optional | Comma-separated intermediate proxy IPs, for multi-hop proxy setups (see below). |

## Security model (GHSA-jggc-qvfc-jr6x)

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

## Notes

- To make header login the only method, also disable password login
  (`PASSWORD_LOGIN_ENABLED=false`); see [Disable-Password-Login](Disable-Password-Login.md).
- On Snap, set the same options with, e.g.,
  `snap set wekan header-login-id=X-Auth-User header-login-trusted-ips=10.0.0.2`.
- The matching environment-variable examples are in `docker-compose.yml`,
  `start-wekan.sh` and `start-wekan.bat`.
