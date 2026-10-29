# Smaller WeKan .spk: only what a grain runs

A Sandstorm grain has:

- **one login**: Sandstorm's own. `sandstorm-http-bridge` puts the signed-in
  Sandstorm user on every request and `packages/wekan-accounts-sandstorm` turns
  it into the WeKan account;
- **one database**: FerretDB on SQLite in `/var`, started by
  `sandstorm-src/start.js` with `--handler=sqlite`;
- **one mailbox**: the grain's own address. Mail goes out through the session
  context and comes in as Maildir files (`server/sandstormEmail.js`). A grain has
  no network for SMTP or IMAP.

Until now the `.spk` was built from the same Meteor package list as Docker,
Snap and the `.zip` bundles. It carried every login method WeKan has, a FerretDB
with the PostgreSQL, MySQL and SAP HANA handlers, and Admin Panel panes for
settings that do nothing inside a grain. This document covers what the
Sandstorm build now leaves out, how it is built, what stays, and what the change
saves.

## What is removed, and why

### Login methods (Meteor packages)

`releases/sandstorm-slim.mjs` removes these from a **copy** of `.meteor/packages`
for one `meteor build`:

| Package | What it is |
| --- | --- |
| `accounts-password` | password login |
| `accounts-2fa` | TOTP second factor for password login |
| `wekan-accounts-lockout` | brute-force lockout of password logins |
| `accounts-passwordless` | login links sent by e-mail |
| `wekan-oidc`, `wekan-accounts-oidc` | OAuth2 / OpenID Connect |
| `wekan-accounts-cas` | CAS |
| `wekan-ldap` | LDAP login and LDAP sync |
| `wekan-accounts-saml` | SAML (with `@node-saml`, `xml-crypto`, `xmldom`) |
| `accounts-google`, `accounts-github`, `accounts-facebook`, `accounts-twitter`, `accounts-meteor-developer`, `accounts-weibo`, `accounts-meetup` | social OAuth logins |

`oauth`, `oauth1`, `oauth2` and `accounts-oauth` go with them, because only those
packages pull them in. `releases/sandstorm-slim.mjs verify` fails the build if
any of these is still in the bundle, for the server or for the client.

What the profile keeps, and refuses to build without: `wekan-accounts-sandstorm`,
`accounts-express` (which implies `accounts-base`: `Meteor.users`, login tokens,
the REST API), `email` (the grain transport installs into it),
`service-configuration` and `mongo`.

Three app files named one of these packages in a static `import`. A static
import of a package that is not in the build stops the server at its first
line, so they now check `Package[name]` first. Without the package, the feature
is skipped:

- `server/ldapAdminSettingsBridge.js`: `wekan-ldap`;
- `server/accounts-lockout-config.js` and `server/methods/lockoutSettings.js`:
  `wekan-accounts-lockout`.

Every other use (`Accounts.createUser`, `_checkPasswordAsync`,
`sendResetPasswordEmail`, ...) sits inside a method or a route that a grain
never calls, or is already wrapped with a `typeof` check. Testing on Sandstorm
found two load-time dependencies on `accounts-password`, and one race that
fewer packages exposed. All three are fixed for every build (see
[Local test on Sandstorm](#local-test-on-sandstorm)):

- `server/lib/accountsEmailTemplates.js` makes `Accounts.emailTemplates` when
  `accounts-password` is not there to make it;
- `config/accounts.js` marks useraccounts initialized without
  `accounts-password`;
- `server/main.js` loads collection2's `attachSchema` before the models.

### Hoisted npm copies of the same libraries

`releases/prune-unreachable-npm.mjs --sandstorm` adds three policy entries, used
only by the Sandstorm build. They cover the hoisted copies of the SAML/CAS
libraries, the passkey (WebAuthn) libraries and the hoisted `nodemailer`. The
reachability graph still vetoes any entry that something in the bundle names.
For example, `meteor/email`'s own `nodemailer` is reachable and is kept.

### FerretDB handlers other than SQLite

wekan/FerretDB releases a SQLite-only binary beside the full one,
`ferretdb-sqlite-amd64`, built with

```
go build -trimpath -ldflags "-s -w" -tags ferretdb_no_postgresql,ferretdb_no_mysql ./cmd/ferretdb
```

and without `ferretdb_hana`. The FerretDB fork already had
`ferretdb_no_postgresql`; `ferretdb_no_mysql` is new in
`internal/handler/registry/mysql.go` and `cmd/ferretdb/main_mysql.go`.

`sandstorm-src/build-deps.sh` downloads that PREBUILT binary by default
(`FERRETDB_SOURCE=download`) through `releases/ferretdb-asset.sh`, the same
choice as every other platform: the newest wekan/FerretDB release that has
`ferretdb-sqlite-amd64`, and the full `ferretdb-amd64` of the newest release
until one does (the log says which). No workflow compiles FerretDB.
`FERRETDB_SOURCE=build` still builds it from source with those tags, for a local
experiment with a FerretDB change. Either way the script checks that the binary
has `--sqlite-url`.

### Admin Panel options a grain cannot use

`models/lib/sandstormSlim.js` holds the list. The menus filter with it, and a
hidden pane's URL (`/admin/people/ldap`) opens the first visible pane instead:

| Where | Hidden on Sandstorm |
| --- | --- |
| Admin Panel / People | E-mail (hidden before), Login, Locked users, SAML, LDAP, OAuth2, CAS, Header login, OAuth providers, Passwordless |
| Admin Panel / Attachments | Database migration (MongoDB <-> FerretDB) |
| Admin Panel / People / People | the "New" user row and the password field of Edit user |
| Notification Settings / Email to card (admin) | domain, provider webhook and IMAP mailboxes: only the grain address is shown, or "no address yet" |

The server refuses these too, so a hidden form cannot be posted anyway:

- `POST /users/login` and `POST /users/register` answer
  `404 {"error":"sandstorm-sso-only"}` before any password work;
- `migrateTextDatabase` throws `not-on-sandstorm`;
- `saveInboundMailSettings` stores no IMAP accounts and no webhook secret.

These refusals are not logged to Admin Panel / Problems. They are not security
fixes, and the request is for a feature the grain does not have.

The member menu already hid Change password, 2FA and Passkeys on Sandstorm, and
`server/sqrl.js`, `server/header-login.js`, `server/windowsSso.js` and
`server/lib/imapInbound.js` already did nothing in a grain.

## How the workflows build

`releases/sandstorm-slim-spk.sh <out.spk>` is used by `sandstorm.yml` and by
`release-all.yml`'s `build-sandstorm` job:

1. `sandstorm-slim.mjs apply` edits `.meteor/packages`. A trap restores it, and
   `.meteor/versions`, when the script exits, also on failure;
2. `meteor build --directory .meteor-spk`, then `npm install` in its
   `programs/server`, the same as `meteor-spk pack` does;
3. the trim that used to run only after a failed pack:
   `bundle-trim.mjs --platform linux --arch x64 --transport sockjs
   --drop-legacy-client --trim-prebuilds`, `prune-unreachable-npm.mjs
   --sandstorm`, `prune-build-only-modules.mjs`;
4. `sandstorm-slim.mjs verify` and `check-telemetry.py --bundle`;
5. `spk pack` packs the trimmed trees with `.meteor-spk/deps` beside them.
   `meteor-spk pack` is no longer used, because it rebuilds the bundle and would
   discard both the profile and the trim.

The deps tree is unchanged apart from FerretDB: Node, the modern
`sandstorm-http-bridge`, `mongod` 3.0 and `niscud`, the `migratemongo` CLIs and
the importer for old grains, `cpu-exec` and `qemu-x86_64` all stay.

Docker, Snap and the `.zip` bundles are not affected. They build from the
unchanged `.meteor/packages`, which still lists every login method, and
`tests/sandstormSlim.test.cjs` fails if it does not.

## Result

Measured on 2026-10-23. The baseline is the newest `.spk` on
<https://github.com/wekan/wekan/releases>, `wekan-12.63-sandstorm.spk` from
[v12.63](https://github.com/wekan/wekan/releases/tag/v12.63). The new `.spk`
was built locally from the same v12.63 source with this change. To compare like
with like, its deps tree carries the same `qemu-x86_64` the release shipped
(the local host had no `qemu-user-static`):

| | v12.63 release | Smaller .spk | Difference |
| --- | ---: | ---: | ---: |
| `.spk` file (xz) | 185,271,476 B (176.7 MiB) | 181,307,364 B (172.9 MiB) | **-3,964,112 B (-3.8 MiB, -2.1 %)** |
| unpacked, apparent size | 913,032,299 B | 885,001,173 B | **-28,031,126 B (-26.7 MiB, -3.1 %)** |
| files in the package | 31,765 | 29,232 | -2,533 |
| `ferretdb` | 41,009,312 B | 35,569,824 B | -5,439,488 B |
| `programs/server/npm/node_modules/meteor` | 55,819,955 B | 43,244,976 B | -12,574,979 B |
| `programs/server/npm/node_modules` (all) | 323,231,962 B | 301,513,873 B | -21,718,089 B |
| `programs/server/packages` | 6,691,833 B | 5,547,536 B | -1,144,297 B |
| `programs/web.browser` | 119,213,833 B | 119,159,114 B | -54,719 B |

Sandstorm's 1 GiB limit applies to the unpacked size, so the 26.7 MiB is extra
headroom under it. The `.spk` file is 2.1 % smaller.

The saving is smaller than the list of removed packages might suggest, for two
reasons. The release `.spk` was already trimmed (its pack failed and the retry
trimmed it), so the source maps, `uWebSockets.js` and the legacy client were
already gone. And the client side of the login methods is small: the app's own
code, which rspack compiles into `programs/server/app` and
`programs/web.browser/app`, still contains the login forms. They are simply never
shown in a grain.

### Local test on Sandstorm

Done on 2026-10-23 on the maintainer's machine: Sandstorm 0.308 at
`http://local.sandstorm.org:6080`, dev accounts, driven with Playwright.

1. `releases/sandstorm-slim-spk.sh` built the bundle with the profile.
   `sandstorm-src/build-deps.sh` (`FERRETDB_SOURCE=build`) built the deps, and
   `spk pack` packed them. For the upload, a copy of the pkgdef had a new test
   app ID and a test key, and no PGP signature, because Sandstorm rejects an
   upload whose author signature does not match the app ID.
2. The `.spk` was uploaded through Apps / Upload app and installed.
3. **First grain: crash-loop.** `config/accounts.js` set
   `Accounts.emailTemplates.resetPassword...`, and `accounts-password` is what
   creates `Accounts.emailTemplates`. The fix is
   `server/lib/accountsEmailTemplates.js`: the same object, with the package's
   defaults, made in `server/main.js` when the package is absent. Every WeKan
   e-mail reads its From address from it.
4. **Locally, with the same bundle on FerretDB SQLite:**
   `AccountsTemplates: You must add at least one account service!` came from
   the useraccounts server `_init()`, which only checks the password form and
   hooks password logins. Without `accounts-password`, `config/accounts.js` now
   marks it initialized.
5. **Second grain: started in 10.9 s, but a new board opened empty.** The
   board's swimlane was stored without `archived`, `sort` and `type`, so the
   `board` publication's `archived: false` query never sent it. Collection2's
   `attachSchema`, which cleans every write, is in its lazy main module, which
   `aldeed:schema-index` loads with an **async** `Collection2.load()`. The
   models attach their schemas with whichever `attachSchema` exists at that
   moment: collection2's, or the bare shim in `imports/collectionHelpers.js`.
   With every package of the full build loading first, collection2 happened to
   win. With fewer packages, the models came first. `server/main.js` now loads
   `meteor/aldeed:collection2/main` synchronously before the models. That race
   existed in every build, so this fix applies to all of them.
6. **Third grain** (the build these numbers are from): started in 10.9 s. The
   Sandstorm user was signed in. A board was created and opened with its
   swimlane, a list was added and a card was added and shown. In the grain,
   Admin Panel / People showed Notifications, Domains, Organizations, Teams,
   People, Roles and Shared templates, with no E-mail, Login, Locked users,
   SAML, LDAP, OAuth2, CAS, Header login, OAuth providers or Passwordless.
   Admin Panel / Attachments showed Backup and no Database migration.

The same bundle was also run outside Sandstorm with its `SANDSTORM=1`
settings, on FerretDB SQLite. `identity-sandstorm.e2e.js` and
`sandstorm-slim.e2e.js` passed against it: 4 + 4 tests, including the board,
list and card test added for step 5.

The `.spk` was **not** signed with the real WeKan key (`SANDSTORM_KEYRING`),
and the GitHub workflows themselves were not run: they need that secret and a
push.

## Risks

- **A login package that becomes a static import again.** If someone adds
  `import ... from 'meteor/wekan-ldap'` (or any excluded package) to app code,
  only the `.spk` breaks, at server start.
  `tests/sandstormSlim.test.cjs` scans the whole app tree for exactly that.
- **Old grains with password accounts.** A grain never had password logins:
  the login form is not drawn there, and `wekan-accounts-sandstorm` creates every
  account. Any `services.password` left in a user document is unused data.
- **Until a wekan/FerretDB release has `ferretdb-sqlite-amd64`**, the grain
  gets the full `ferretdb-amd64` of the newest release, so it is about 5 MB
  larger than it will be. It runs the same SQLite handler either way. (An
  earlier version of this change built FerretDB from source in CI; the
  workflows now only download the prebuilt binary.)
- **The REST password API in a grain** now answers 404. It could never succeed
  there (no account had a password), but a script that expected 401 sees a
  different code.
- **Not removed, and could be next:** the S3, Azure, Google Cloud and WebDAV
  attachment backends (about 40 MB of hoisted npm copies), and the roughly
  115 MiB of hoisted npm packages that `prune-unreachable-npm.mjs` finds
  unreachable but that are not on its policy list. Both need the same proof that
  nothing reaches them, and a grain can reach the network through Powerbox
  (`server/sandstormEgress.js`), so cloud storage is not obviously dead there.

## Files

| File | Role |
| --- | --- |
| `releases/sandstorm-slim.mjs` | the package profile: list, apply/restore, verify |
| `releases/sandstorm-slim-spk.sh` | build, trim, verify, `spk pack` |
| `releases/sandstorm-make-spk.sh` | build.sh Sandstorm -> Make the .spk package, now through the script above |
| `releases/prune-unreachable-npm.mjs` | `--sandstorm` policy entries |
| `sandstorm-src/build-deps.sh` | SQLite-only FerretDB from source |
| `models/lib/sandstormSlim.js` | the Admin Panel panes a grain hides |
| `server/lib/accountsEmailTemplates.js`, `config/accounts.js` | start without `accounts-password` |
| `server/main.js` | collection2 loaded before the models (all builds) |
| `.github/workflows/sandstorm.yml`, `.github/workflows/release-all.yml` | call the script |
| `tests/sandstormSlim.test.cjs` | unit, negative and source guards |
| `tests/playwright/specs/sandstorm-slim.e2e.js` | UI test, run by `tests/integration/login-providers/run.cjs --sandstorm` |
