# Member Settings / Change Password

## What it is

**Change Password** replaces the password you sign in to WeKan with. It is
meant for accounts with a WeKan password: the entry is hidden on Sandstorm and
for accounts that sign in with OAuth2, whose password lives at the identity
provider. After a change, every session of your account is signed out, this
one too, and you sign in again with the new password.

## Read more

- [Password strength](https://en.wikipedia.org/wiki/Password_strength) on
  Wikipedia.
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - the
  guidance behind minimum lengths and breached-password checks.
- [Have I Been Pwned](https://en.wikipedia.org/wiki/Have_I_Been_Pwned%3F) on
  Wikipedia, its [API](https://haveibeenpwned.com/API/v3), and
  [k-anonymity](https://en.wikipedia.org/wiki/K-anonymity), which its range
  lookup uses.
- [Admin Panel / Problems / Password length](../Admin-Panel/Problems/Password-length.md).
- [Login Page / Forgot Password](../Login-Page/Forgot-Password.md), when you have
  forgotten your current password.

## How to use it

1. Click your username or avatar at the top right, then **Change Password**.
2. The popup is the standard change-password form of the accounts package
   (useraccounts, state `changePwd`): your current password, the new password
   and the new password again. The cursor starts in the current-password field.
3. Fill in the three fields and submit.
4. WeKan signs every session of the account out and opens the sign-in page;
   sign in with the new password.

Which new passwords are accepted:

- at least 6 characters, or the minimum length from `PASSWORD_MIN_LENGTH` when
  **Enforce the minimum length** (`PASSWORD_MIN_LENGTH_ENFORCE`) is on - see
  [Admin Panel / Problems / Password length](../Admin-Panel/Problems/Password-length.md);
- with the minimum enforced, also not the same as your username, your e-mail
  address or the part of it before `@` (compared without case, for names of 3
  or more characters);
- with `PASSWORD_CHECK_PWNED` on, a password found in known data breaches is
  refused before the form is sent.

Forgotten your current password? See
[Login Page / Forgot Password](../Login-Page/Forgot-Password.md).

## How the numbers are calculated

From [models/lib/passwordPolicy.js](../../../models/lib/passwordPolicy.js) and
[config/accounts.js](../../../config/accounts.js):

- **6 characters** - the form's own minimum (`minLength: 6` of the password
  fields) while the minimum is not enforced.
- **`PASSWORD_MIN_LENGTH`, default 8** - used when it is a whole number of at
  least 1, capped at 256 (`MAX_MIN_LENGTH`). With `PASSWORD_MIN_LENGTH_ENFORCE`
  set to `true`, the form's minimum becomes this number and the server refuses
  a shorter password (`password-too-short`).
- **512 characters at most** (`MAX_LENGTH`), always (`password-too-long`).
- Lengths are counted in characters (Unicode code points, `[...password].length`),
  the way a person counts them, not in bytes.
- **Breach check:** only the first 5 hex digits of the password's SHA-1 digest
  are sent to the Have I Been Pwned range API; the rest is compared with the
  answer in memory and dropped. This digest is not how WeKan stores passwords
  (accounts-password keeps those with bcrypt).

## How it works in WeKan

- **Popup:** `changePasswordPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  renders `+atForm(state='changePwd')`.
- **Policy:** [config/accounts.js](../../../config/accounts.js) reads the
  server's policy with the method `getPasswordPolicy` and sets the fields'
  minimum when it is enforced; the breached-password check runs before
  useraccounts sees the submit. The rules themselves are
  `passwordProblem()`, `isTooShort()` and `breachLookupDigest()` of
  [models/lib/passwordPolicy.js](../../../models/lib/passwordPolicy.js).
- **After the change:** the server signs every session of the account out
  (`server/passwordChangeRequired.js`), and the `onSubmitHook` in
  `config/accounts.js` logs this browser out and goes to `atSignIn`.
- **Tests:** [tests/passwordPolicy.test.cjs](../../../tests/passwordPolicy.test.cjs),
  [tests/passwordChangeSessions.test.cjs](../../../tests/passwordChangeSessions.test.cjs),
  [tests/passwordChangeRequired.test.cjs](../../../tests/passwordChangeRequired.test.cjs)
  and the browser test
  [tests/playwright/specs/password-change-other-sessions.e2e.js](../../../tests/playwright/specs/password-change-other-sessions.e2e.js).

## Commits

 - [a changed password signs every session out, and Problems / Password length](https://github.com/wekan/wekan/commit/c99aa7f845ea41fe3a108d9c55abaa28298cdbf9)
 - [one Web Crypto digest for the breached-password check in browser and server](https://github.com/wekan/wekan/commit/f406d46fe747752a2dff7a737df619c1a8632977)
 - [password policy for new passwords](https://github.com/wekan/wekan/commit/d7abe9910a3bbb4871b1bb512d60f232556f8b54)
 - [tests: a changed password signs the account out in every other browser](https://github.com/wekan/wekan/commit/dc9a7bb1ac3bb27585a8bce2b929206e612a535d)
