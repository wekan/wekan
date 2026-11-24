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
| `USERS_ANONYMIZE_INACTIVE_AFTER_DAYS` | `users-anonymize-inactive-after-days` | off | Anonymise an account this many days after it was disabled for inactivity, as Member Settings / Anonymize does: its data elsewhere is erased first. An administrator, an account disabled by hand or by LDAP, and one enabled again are never touched. |
| `REGISTRATION_MINIMUM_AGE` | `registration-minimum-age` | off | The sign-up form asks "I am at least N years old" and the server refuses a password sign-up without it (GDPR Art. 8: 16, or 13 to 16 where a country lowers it; COPPA: 13). Accounts an administrator creates or an identity provider brings are not asked. No birth date is stored. |
| `BACKUP_PASSPHRASE` | `backup-passphrase` | off | Encrypt every Admin Panel backup with this passphrase (AES-256-GCM, the key stretched with scrypt; at least 16 characters, or it is not used), on disk and in cloud storage alike. Restoring an encrypted backup needs the same passphrase; a wrong one or a changed file is refused. An older plain backup still restores. Keep the passphrase somewhere other than the backups. |
| `ATTACHMENTS_PASSPHRASE` | `attachments-passphrase` | off | Shows **Admin Panel / Attachments / Encrypt**: encrypt or decrypt every attachment on this server's disk, and encrypt new ones as they arrive (AES-256-CTR, so a download can start anywhere; the key stretched with scrypt; at least 16 characters, or it is not used). Their addresses stay the same. Without the passphrase, encrypted attachments cannot be read: keep it somewhere other than the server. |
| `LOGIN_ADDRESS_RETENTION_DAYS` | `login-address-retention-days` | `365` | Days a sign-in address is kept on the account and in the login reports after its last use; `0` keeps them. |
| `LOGIN_ADDRESS_RECORDED` | `login-address-recorded` | `true` | `false` records no sign-in address at all: not on the account, not in Admin Panel / People / Login locations or Problems / Offices, not with a short-password sign-in (which is still listed). The lockout still counts failed sign-ins per address, to stop guessing. |

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
