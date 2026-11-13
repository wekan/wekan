# Authenticated fetch destinations

Use for browser fetch integration supplied by `accounts-express`. The
trusted-origin behavior ships in
Meteor 3.5.5 with `accounts-express@1.0.0_1` and 3.6.1 with `1.0.1`.
Inspect `.meteor/versions`; earlier packages do not enforce this boundary,
and the 3.4.4 release does not include `accounts-express`.

`Meteor.fetch` and `fetch` from `meteor/fetch` default to `auth: false`.
The `fetch` exported by `meteor/accounts-express` defaults to `auth: true`.
When `accounts-express` is loaded, its client wrapper also guards the first
two entry points if called with `auth: true`; it is not limited to its own export.
On the patched client, automatic credentials go only to the page origin,
the `Meteor.absoluteUrl()` (`ROOT_URL`) origin, or an explicitly allowed
HTTP(S) origin. An unrelated origin still receives the request, but without
an automatically added Bearer header or `credentials: 'include'`.

## Configure a trusted API

For an application-owned API, list the exact origin in public settings:

```json
{
  "public": {
    "packages": {
      "accounts-express": {
        "authFetchAllowedOrigins": ["https://api.example.com"]
      }
    }
  }
}
```

An origin is scheme, host and port. A different subdomain, scheme or port
does not match. Relative URLs follow the document base URL; an external
`<base>` does not make its origin trusted. Do not allowlist an unknown host
merely because its request is missing authentication.

| Situation | Decision |
|---|---|
| Trusted API returns a browser CORS error | Verify its CORS handling, including `Authorization` and credentialed requests as applicable. This setting does not configure the API server. |
| Explicit `Authorization` header | Preserved even for an untrusted destination. The caller owns that disclosure; the automatic-origin guard is not a universal credential scrubber. |
| `auth: false` | Disables automatic Bearer and cookie-credentials behavior; it does not remove manually supplied headers. |
| Explicit `credentials` option or a `Request` with `credentials: 'omit'` | Respect the caller's choice. Do not override it to repair authentication. |
| HttpOnly cookies | Enable both runtimes and retain browser SameSite policy. The fetch allowlist does not change cookie attributes or grant cross-origin cookie refresh. |
| Server-side fetch | This client allowlist does not establish server destination trust. Verify the server's explicit token, destination and authorization policy separately. |

`httpOnlyCookieAllowedOrigins` is a different server setting for cookie
set/clear endpoints. Do not substitute it for `authFetchAllowedOrigins` or
promise that either defeats `SameSite=Strict`. See
[cookie troubleshooting](http-only-cookies.md).

Test a trusted and an unrelated destination without logging real tokens.
For an earlier constrained package, keep credentials limited to verified
destinations and plan a compatible update before relying on the new guard.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/accounts-express.md
