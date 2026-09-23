# HttpOnly cookie endpoint troubleshooting

Core HttpOnly cookie storage requires Meteor 3.3+. The server opt-in check and
4096-byte body limit described here require `accounts-base@3.3.1`, shipped in
Meteor 3.5.2. Inspect `.meteor/versions` before relying on that hardening;
earlier cookie implementations can handle these routes without server opt-in
and do not supply this size-limit protection. Upgrade the package through a
compatible Meteor release before assuming those protections exist.

## Configure both runtimes

Set `Accounts.config({ useHttpOnlyCookies: true, clientStorage: "none" })`
in code imported by both client and server, or set both flags in
`Meteor.settings.public.packages.accounts` using a loaded settings file.
The public values are feature flags, not credentials. Client-only configuration
does not enable the server. Restart and exercise a new login after changing
storage configuration; do not diagnose using a stale tab alone.

When opted in, the server handles:

| Method and path | Purpose |
|---|---|
| `POST /_accounts/cookie/set` | Set the login-token cookie from the token payload. |
| `GET /_accounts/cookie/refresh` | Refresh the cookie-based login flow. |
| `POST /_accounts/cookie/clear` | Clear the cookie. |

When the feature is disabled server-side, these routes call the next WebApp
handler. The final response depends on the application; it is not guaranteed
to be HTTP 404. Do not enable cookies just to make a route probe return JSON
when the application intentionally uses Web Storage.

## Meteor 3.6-beta.1 protections

These checks require the beta's `accounts-base@3.4.0-beta360.1`. Inspect
`.meteor/versions`; 3.5.2's server opt-in and size limit alone do not provide
this full behavior.

| Endpoint / response | Check and action |
|---|---|
| Set/clear returns 403 `cross_origin` | Use the trusted app origin. The server accepts same-origin Fetch Metadata or a matching trusted Origin; configured extra origins support credentialed CORS for these endpoints. Inspect `ROOT_URL`, request Host and browser headers. |
| Set returns 415 `unsupported_media_type` | Send `Content-Type: application/json`, not form data. |
| Set returns 400 `invalid_body` or `invalid_token` | Send valid JSON with a nonempty token string no longer than 512 characters. |
| Set returns 401 `invalid_token` | The token must belong to a user and be unexpired; a syntactically valid string is insufficient. Do not log it. |
| Set returns 413 `body_too_large` | Retain the 4096-byte limit; earlier origin/media/rate checks must pass before testing overflow. |
| Refresh returns 204 | No cookie was sent. Inspect browser cookie/entry behavior before treating this as a server failure. |
| Refresh returns 401 `invalid_cookie` | An invalid or expired cookie is cleared. Reauthenticate through the normal Accounts flow. Explicitly cross-site refresh requests are rejected. |
| Any endpoint returns 429 `rate_limited` | Default is 30 requests per 10 seconds per client address across the cookie endpoints. Inspect request loops and proxy addressing before tuning. This is separate from DDP Accounts limits. |

Configure extra trusted origins and any measured rate adjustment on the server:

```javascript
Accounts.config({
  useHttpOnlyCookies: true,
  httpOnlyCookieAllowedOrigins: ["https://app.example.com"],
  httpOnlyCookieRateLimit: { max: 60, windowMs: 10_000 },
});
```

The built-in client calls relative same-origin URLs. An allowlist does not
retarget it to a remote server. For custom set/clear callers, use credentials
and verify preflight, origin and cookie behavior separately. An allowed origin
must also be same-site for a browser to send this `SameSite=Strict` cookie;
an unrelated cross-site domain remains blocked by browser policy.

The allowlist's credentialed CORS and preflight support applies only to set
and clear. Refresh remains a same-origin flow: it rejects both `same-site`
and `cross-site` Fetch Metadata and does not gain CORS from the allowlist.
Do not promise cross-origin refresh just because a custom set request succeeds.

Cookies use `HttpOnly`, `SameSite=Strict`, `Path=/` and `Secure` over HTTPS.
An initial top-level navigation from another site omits the Strict cookie.
Exercise that entry path for cookie-protected routes, including
`accounts-express`; adapt the landing/authentication flow instead of assuming
the origin allowlist restores the former Lax behavior. Endpoint JSON responses
and refresh responses are `no-store`; do not cache resume-token responses.

Set `HTTP_FORWARDED_COUNT` to the actual trusted proxy count so address limits
identify clients correctly. Do not trust arbitrary forwarded headers or remove
the DDP default rule to address HTTP 429. `httpOnlyCookieRateLimit: false`
disables the separate HTTP limit; use only with an intentional replacement.
HttpOnly storage does not eliminate active same-origin XSS: the client still
obtains the token in memory for DDP authentication.

## Diagnose failures on earlier packages

1. Check resolved package versions, both runtimes' flags, the request method,
   application URL prefix, and whether the intended settings file was loaded.
2. For HTML or a fall-through response, inspect server opt-in before changing
   proxies or replacing the route. Never paste real resume tokens into logs.
3. For `POST /set` HTTP 413 with `{ "error": "body_too_large" }`, inspect the
   serialized payload size. The limit is 4096 UTF-8 bytes, not characters or
   token length alone. It applies to chunked requests too; the connection
   closes on overflow. Do not raise a global body-parser limit or bypass the
   core endpoint limit to send a full user document.
4. Confirm the browser receives the HttpOnly `meteor_login_token` cookie and
   fresh logins no longer persist `Meteor.loginToken*` in Web Storage when
   `clientStorage` is `"none"`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/accounts-express.md
