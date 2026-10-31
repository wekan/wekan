# Security settings

Settings an administrator can turn on to harden a WeKan site. Every one of them
is an environment variable on every platform (Snap: `sudo snap set wekan
<key>=<value>`, Docker: `docker-compose.yml`, `start-wekan.sh`,
`start-wekan.bat`, the Helm chart's `values.yaml`), and the ones marked
**Admin Panel** can also be set there, where the value wins over the variable.

## Signing in

| Setting | Snap key | Default | What it does |
| --- | --- | --- | --- |
| `PASSWORD_MIN_LENGTH` | `password-min-length` | `8` | Minimum password length, in characters. A sign-in with a shorter password is listed in **Admin Panel / Problems / Password length**; nothing is refused unless `PASSWORD_MIN_LENGTH_ENFORCE` is on. Also set on that page and in **Admin Panel / People / Login**. |
| `PASSWORD_MIN_LENGTH_ENFORCE` | `password-min-length-enforce` | `false` | Refuse a shorter NEW password, and make an account that signs in with an older shorter one change it before anything else; the change signs every session of the account out. Only WeKan's own password accounts: LDAP, OAuth2, OIDC, SAML, CAS and Sandstorm passwords are their provider's. [Password length](../Features/Admin-Panel/Problems/Password-length.md) |
| `PASSWORD_CHECK_PWNED` | `password-check-pwned` | `false` | Refuse a new password that appears in a known data breach. Only the first 5 hex digits of its SHA-1 are sent to `api.pwnedpasswords.com`; if the service cannot be reached, the password is accepted. **Admin Panel / People / Login** |
| `REQUIRE_2FA` | `require-2fa` | `off` | `admins` or `all`: accounts that sign in with a WeKan password must set up two-factor authentication right after signing in, and can do nothing else until they have. LDAP, OAuth2, SAML, CAS and Sandstorm accounts are not covered: their identity provider is where a second factor belongs. **Admin Panel / People / Login** |
| `LOGOUT_IDLE_MINUTES` | `logout-idle-minutes` | off | Sign a browser session out after this many minutes without a key press, click, touch or scroll. REST API tokens are not affected. **Admin Panel / People / Login** |
| `LOGOUT_WITH_TIMER`, `LOGOUT_IN`, `LOGOUT_ON_HOURS`, `LOGOUT_ON_MINUTES` | | off | Sign everybody out at a deadline after signing in, however busy. **Admin Panel / People / Login** |
| `ACCOUNTS_LOCKOUT_*` | | on | Lock an account or an address after failed logins; [Brute force protection](brute-force-protection.md). **Admin Panel / People / Locked Users** |
| `USERS_DISABLE_INACTIVE_AFTER_DAYS` | | off | Disable accounts unused for this many days. **Admin Panel / People / Login** |

Each member can turn on two-factor authentication for themselves in Member
Settings, whatever `REQUIRE_2FA` says, and can add passkeys.

## HTTP

| Setting | Snap key | Default | What it does |
| --- | --- | --- | --- |
| `HSTS_MAX_AGE` | `hsts-max-age` | `15552000` (180 days) | Strict-Transport-Security, sent only when `ROOT_URL` is https. `0` stops it. **Admin Panel / People / Login** |
| `HSTS_INCLUDE_SUBDOMAINS` | `hsts-include-subdomains` | `false` | HSTS for every subdomain too. Only when all of them have HTTPS. |
| `HSTS_PRELOAD` | `hsts-preload` | `false` | The preload token; sent only with includeSubDomains and a max-age of at least a year. |
| `BROWSER_POLICY_ENABLED`, `TRUSTED_URL` | | | Which site may show WeKan in a frame. |

Always on: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, and a cross-site request guard - a POST, PUT,
PATCH or DELETE that logs in only with the cookie must come from WeKan's own
pages. A refused request appears in Admin Panel / Problems as
`csrf.cross-site-cookie`.

## Attachments

- **Admin Panel / Attachments / S3 / Server-side encryption**: SSE-S3 or SSE-KMS
  for every attachment, avatar and backup written to S3.
- On the filesystem, encrypt the disk or volume that holds `WRITABLE_PATH`
  (LUKS, an encrypted cloud volume).
- `ATTACHMENTS_UPLOAD_MAX_SIZE`, `ATTACHMENTS_UPLOAD_MIME_TYPES` and
  `ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM` (a virus scanner, `{file}` is the
  upload) limit and check what can be uploaded; the same exist for avatars.

## Watching

- **Admin Panel / Problems** - attacks WeKan refused, summarised: what, how
  often, since when, from whom.
- **Admin Panel / People / Audit log** - every administrative action of a site
  administrator: who set a password, made somebody an admin, changed a login
  setting, restored a backup. Passwords and secrets are never recorded; kept
  for a year.
