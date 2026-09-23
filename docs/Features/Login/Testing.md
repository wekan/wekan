# Testing login with local identity servers

The login integration suite starts a fresh WeKan bundle and FerretDB database,
then uses Chromium to sign in through the real application. Minimal LDAP,
OAuth, SAML, CAS and SMTP servers return dummy identities. Tests inspect the
requests those servers receive, the returned session, and the stored WeKan
user. Login functions and authentication results are not replaced with mocks.

## Run

Prepare a native bundle using the normal local build process. It must contain
`start-wekan.sh`, its runtime dependencies, and the native `ferretdb` executable.
Install the existing root and `tests/playwright` dependencies and Chromium.
OpenSSL must be available to generate a temporary SAML certificate.

From the repository root:

```sh
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
node tests/integration/login-providers/run.cjs .build/bundle
node tests/integration/login-providers/run.cjs .build/bundle --sandstorm
# Select another installed Playwright browser:
WEKAN_PLAYWRIGHT_PROJECT=firefox node tests/integration/login-providers/run.cjs .build/bundle
```

The runner uses random loopback ports and separate writable directories under
`.tools/tmp/login-providers/run-*`. It does not inherit deployment credentials
or `MONGO_URL`. Sandstorm runs separately because its authentication mode is
exclusive. Each invocation stops its own application and fixture servers and
returns a nonzero status on failure. Logs, per-test protocol transcripts and
failure screenshots remain in the printed artifact directory.

To investigate a subset, set `IDENTITY_GREP` to a Playwright title expression.
Ordinary UI runs skip these specs unless the fixture runner supplies their
configuration. These are explicit integration commands, not an enabled GitHub
Actions workflow.

## Coverage

| Login | Real exchange and positive assertions | Negative assertions |
| --- | --- | --- |
| LDAP | LDAPv3 BER service bind, subtree search, user bind; username, email, full name, non-admin role and session after reload | Wrong password creates no account or session |
| LDAP REST | `/users/login` performs LDAP authentication and returns an expiring token that resumes the same browser identity | Wrong password returns 401 without a token |
| OAuth2/OIDC | Authorization code, matching redirect URI, client credentials, requested scope, bearer-authenticated profile; mapped identity and non-admin account | Authorization denied, rejected token exchange, empty profile |
| Google, GitHub, Facebook, Meteor Developer, Weibo, Meetup | Actual Meteor adapters, provider buttons, code/token/profile requests and stored service IDs | Denied authorization produces a visible error and no session |
| Twitter/X | Actual OAuth 1.0a adapter; request token, HMAC-SHA1 signatures, access token and identity request | Denied authorization produces an error and no session |
| SAML | AuthnRequest, signed XML response, audience and recipient, mapped email and full name | Unsigned, tampered and expired responses do not log in |
| CAS | Service URL and single-use ticket validation; mapped username, email and full name | Rejected ticket produces an error and no session |
| Password and TOTP | Registration form, real password hashing/login, activation and six-digit second factor | Wrong password and wrong second factor fail; password alone cannot establish a two-factor session |
| Passwordless | Real SMTP message, emailed code, verified email and account session; consumed code removed | Wrong code and reuse of a consumed code fail |
| Header login | Simulated trusted proxy headers, stored identity and HttpOnly session cookie | An untrusted forwarded client creates no account, cookie or session |
| Sandstorm | HTTP/DDP handshake with proxy identity and permissions; mapped display name | Anonymous access has no user ID; an unmatched token cannot create an identity |

Example directory entry: `uid=alice,dc=example,dc=invalid`, password
`Alice-test-password`, `cn=Alice Directory`, and
`mail=alice.ldap@example.invalid`. OAuth fixtures use client ID
`fixture-client` and secret `fixture-secret`. These are test values only.
The SAML private key and certificate are generated per run and never committed.

The application test process redirects the social adapters' fixed HTTPS
endpoints to the local HTTP fixture. Browser authorization is intercepted, and
external DNS is blocked; the Twitter initial redirect is handled explicitly.
This preserves the actual adapters and payloads while avoiding real provider
accounts. It does not test external TLS certificates, Internet mail delivery,
provider availability, app approval, vendor API migrations, LDAP StartTLS or
complex directory group policies. Apple, Azure, Keycloak and other branded
OIDC configurations need their own deployment checks; the generic OIDC round
trip does not certify every vendor configuration.

## Verified run

On 2026-09-23, a rebuilt macOS ARM64 bundle using Meteor 3.6-beta.1 and
Chromium passed all 31 login checks and all 3 Sandstorm checks, with one worker
and no retries. Focused Node tests cover consumed-token races and failures,
TOTP error preservation and lockout limits, and existing provider contracts.
The FerretDB executable reported `v1.80.0-2-g5b3e3402-dirty`; these results do
not claim a separately rebuilt database or validation against MongoDB.

The final local runs are recorded in `.tools/tmp/login-providers/final.log`
and `.tools/tmp/login-providers/sandstorm-final.log`. Their artifact directories
are printed at the beginning of each log. Earlier diagnostic runs are retained
separately and include the failures that led to the fixes below.

## Defects exposed by the tests

### Firefox password submission — 2026-09-23

Firefox 156.0.1 on macOS 27 reproduced successful registration followed by
a password login that stayed on the sign-in page without an error. The login
capture handler replayed `submit` in a Promise continuation while Firefox
was still processing the original native submission. Firefox suppressed that
second event, so the useraccounts password handler never received it.
Deferring the replay to the next event-loop task fixes the ordering while
retaining validation, two-factor handling and duplicate-submission protection.

The credential-free `password-submit-event.e2e.js` regression uses actual
button clicks and Enter presses. Native Firefox tests fail with the old
handler and pass with the fixed handler for both actions. A rebuilt app also
passes real registration, wrong-password rejection, click and Enter login,
and session resume after reload. Chromium passes the event regressions and
the password/TOTP and emailed-code integration tests. Focused Node tests
cover deferred replay, duplicate submissions, provider errors and 2FA states.

On this macOS 27 machine, direct Playwright Firefox startup fails before
loading WeKan with `Could not find profile folder`. Native Firefox was
launched through LaunchServices with a separate disposable profile and
driven through its WebDriver BiDi endpoint using the installed Puppeteer.
The unrelated startup limitation is described in
[Mozilla bug 2062988](https://bugzilla.mozilla.org/show_bug.cgi?id=2062988).
This verification does not claim the entire provider suite ran in Firefox.

### Earlier provider integration repairs

- An unset optional LDAP field map crashed a successful directory login.
- OAuth2 configuration prevented CAS and SAML configuration from loading.
- The installed SAML library requires `idpCert`, not the obsolete `cert` option.
- SAML and Sandstorm display names did not reach WeKan's `profile.fullname`.
- The asynchronous login-settings callback lost its Blaze instance, hiding
  the catalog buttons and passwordless form. Duplicate useraccounts social
  buttons are hidden when using the catalog controls.
- CAS did not report completion through its supplied callback.
- Lockout counting replaced the invalid-TOTP code, breaking the retry form.
  Wrong second factors remain counted, including lockout at the limit.
- In the tested FerretDB build, the positional email-verification update
  matched zero documents despite a successful lookup. The emailed code was
  reusable. WeKan now requires a guarded consumption of any remaining token
  before issuing a session and verifies the email using its numeric index.
  The guard compares the validated generation, refusing a concurrent reuse or
  replacement. This is an application compatibility guard, not a general fix
  for FerretDB positional updates.

See [OAuth providers](OAuth-Providers.md), [LDAP](LDAP.md), [SAML](SAML.md),
[CAS](CAS.md), [passwordless login](Passwordless.md),
[two-factor authentication](Two-Factor-Authentication.md), and
[header login](Header-Login.md) for deployment settings.
