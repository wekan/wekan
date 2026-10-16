[CAS Issue](https://github.com/wekan/wekan/issues/3204)

[CAS settings commit](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93)

Please send pull requests if CAS login does not work.

## Login style

CAS signs in by full-page redirect: the browser leaves WeKan for the CAS login
form and comes back to the same page, which finishes the login and shows any
error on the sign-in page. To open the CAS form in a popup instead, set
`"popup": true` in both `cas` and `public.cas` of `METEOR_SETTINGS`. A popup is
blocked in iframes and on some phones, and a CAS server's
`Cross-Origin-Opener-Policy` can cut it off from WeKan so the login never
finishes, which is why redirect is the default (before 2026-10-08 it was the
popup, and a redirect login could not finish at all).

Wekan clientside code is at `wekan/client/components/main/layouts.*`

Wekan serverside code is at:
- `wekan/server/authentication.js` at bottom
- `wekan/packages/*cas*/*`

Originally before moving to `wekan/packages/*cas*/*` CAS code was at https://github.com/wekan/meteor-accounts-cas
## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.
