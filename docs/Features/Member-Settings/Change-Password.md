# Member Settings / Change Password

Open the top-right username menu, then **Change Password**. The entry is
hidden on Sandstorm and for accounts that sign in with OAuth2; it is meant for
accounts with a WeKan password.

The popup is the standard change-password form of the accounts package
(useraccounts, state `changePwd`): your current password, the new password
and the new password again. The cursor starts in the current-password field.

Which new passwords are accepted:

- at least 6 characters, or the minimum length from
  `PASSWORD_MIN_LENGTH` when **Enforce the minimum length**
  (`PASSWORD_MIN_LENGTH_ENFORCE`) is on - see
  [Admin Panel / Problems / Password length](../Admin-Panel/Problems/Password-length.md);
- with `PASSWORD_CHECK_PWNED` on, a password found in known data breaches is
  refused before the form is sent.

Forgotten your current password? See
[Login Page / Forgot Password](../Login-Page/Forgot-Password.md).

For developers: the popup is `changePasswordPopup` in
`client/components/users/userHeader.jade`; the password policy is in
`config/accounts.js` and `models/lib/passwordPolicy.js`.
