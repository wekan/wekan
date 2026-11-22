# Password hashing

## What it is

WeKan never stores a password itself, only a slow one-way hash of it, so a
copy of the database does not reveal the passwords. WeKan's own password
accounts use Meteor's `accounts-password`, which hashes with bcrypt. LDAP,
OAuth2, OIDC, SAML, CAS and Sandstorm accounts have no password in WeKan; their
provider keeps it.

## Read more

- [bcrypt at Wikipedia](https://en.wikipedia.org/wiki/Bcrypt)
- [Argon2 at Wikipedia](https://en.wikipedia.org/wiki/Argon2)
- [Meteor discussion about alternatives for hashing passwords](https://github.com/meteor/meteor/discussions/11812)
- [Meteor accounts documentation](https://docs.meteor.com/api/accounts.html)
- [Brute force protection: accounts lockout](Accounts-Lockout.md) and
  [Forgot password](Forgot-Password.md)

## How to use it

There is nothing to switch on: every password set through WeKan's own forms
is hashed.

1. Signing up, **Change Password** in Member Settings, a password reset, and an
   administrator's **Set password** or **Add user** in Admin Panel / People
   all store a bcrypt hash in the user's `services.password.bcrypt`.
2. To require a minimum length for new passwords, set `PASSWORD_MIN_LENGTH`
   and `PASSWORD_MIN_LENGTH_ENFORCE=true`; to refuse passwords found in
   breaches, `PASSWORD_CHECK_PWNED=true` (both also in Admin Panel / People /
   Login).

## How the numbers are calculated

- **bcrypt cost**: 10, Meteor's default (`Accounts._bcryptRounds()` returns
  `Accounts._options.bcryptRounds || 10`); WeKan does not change it. Each step
  of the cost doubles the hashing time.
- **What is hashed**: the browser sends the password to Meteor as its SHA-256,
  and bcrypt hashes that.
- **Timing**: when a login names no such user, WeKan still runs one dummy
  bcrypt comparison against a fixed cost-10 hash, so the answer takes the same
  time (~50 ms) and does not reveal which usernames exist
  (`server/lib/loginTimingDefense.js`).
- **Password length**: `PASSWORD_MIN_LENGTH` defaults to 8 and is capped at
  256; a password longer than 512 characters is not accepted, because hashing
  costs time in proportion to length (`models/lib/passwordPolicy.js`).
- **Breach check**: only the first 5 hex digits of the password's SHA-1 leave
  WeKan (Have I Been Pwned's k-anonymity range).

## How it works in WeKan

- Meteor `accounts-password` (see `.meteor/versions`) does the hashing and the
  comparison; its user document keeps `services.password.bcrypt` (or
  `services.password.argon2`, when argon2 is enabled).
- [server/lib/loginTimingDefense.js](../../../server/lib/loginTimingDefense.js)
  and [server/loginTimingNormalization.js](../../../server/loginTimingNormalization.js) -
  the dummy comparison against timing attacks (GHSA-2g94-9x3m-hv37); they read
  the hash the same way accounts-password does, argon2 or bcrypt.
- [models/lib/passwordPolicy.js](../../../models/lib/passwordPolicy.js) - the
  length and breach rules for new passwords.
- Tests: [tests/loginTimingDefense.test.cjs](../../../tests/loginTimingDefense.test.cjs),
  [tests/passwordPolicy.test.cjs](../../../tests/passwordPolicy.test.cjs).

## TODO

Meteor 3 has migrations of password hashing to some newer hash: with argon2
enabled in `Accounts.config`, a bcrypt hash is replaced by an argon2 one at the
user's next login. WeKan has not enabled it yet, so passwords are still bcrypt.

## OLD

While [discussing various alternatives in hashing passwords](https://github.com/meteor/meteor/discussions/11812#discussioncomment-1930533):

From @xet7 at 2022-01-08:

Hi,
about Argon2. Today when I was in progress of translating Gitea from English to
Finnish, I noticed this Gitea translation string, related to Argon2:

> Set the password hashing algorithm. Algorithms have differing requirements and strength. `argon2` whilst having good characteristics uses a lot of memory and may be inappropriate for small systems.

## Commits

 - [Admin Panel / Problems / Password length, and a changed password signs every session out](https://github.com/wekan/wekan/commit/c99aa7f845ea41fe3a108d9c55abaa28298cdbf9)
 - [Breached-password check with one Web Crypto lookup digest](https://github.com/wekan/wekan/commit/f406d46fe747752a2dff7a737df619c1a8632977)
 - [Password policy for new passwords](https://github.com/wekan/wekan/commit/d7abe9910a3bbb4871b1bb512d60f232556f8b54)
 - [Dummy bcrypt comparison against user enumeration by timing (LockoutBleed)](https://github.com/wekan/wekan/commit/c3742f2ed7cfeb3dc709997ca9403d3fae5f7188)
