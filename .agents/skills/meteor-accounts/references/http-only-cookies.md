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

## Diagnose failures

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
