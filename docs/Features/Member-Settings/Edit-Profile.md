# Member Settings / Edit Profile

Open the top-right username menu, then **Edit Profile**. The entry is hidden
for accounts that sign in with OAuth2, whose profile comes from the identity
provider.

## Fields

| Field | Editable when |
| --- | --- |
| **Full Name** | always (up to 256 characters) |
| **Username** | **Username Change** is allowed in [Admin Panel / People / Login](../Admin-Panel/People/Login.md); otherwise read-only |
| **Initials** | always (up to 20 characters); shown in the avatar when you have no picture |
| **Email** | **Allow Email Change** is on in [Admin Panel / People / E-mail](../Admin-Panel/People/E-mail.md); otherwise read-only |

## Save

- Full name and initials are always saved.
- A changed e-mail address replaces your address and is marked unverified. It
  is refused when another account already has it (*Email has already been
  taken*), and while your account is [SQRL](SQRL.md)-hardlocked.
- A changed username is refused when another account has it (*This username
  is already taken*).

The popup closes when the save worked, and stays open with the error otherwise.

Note: in the current code the server saves a changed **username**, and a
username and e-mail changed together, only when the caller is an
administrator (`setUsername`, `setUsernameAndEmail` in
`server/models/users.js`). For other members the popup closes without
changing them.

## Delete and Anonymize account

When **Self delete user account** is allowed in
[Admin Panel / People / Login](../Admin-Panel/People/Login.md), two more
buttons appear. Each asks for confirmation and then logs you out.

- **Delete** removes your account.
- **Anonymize account**
  ([#2731](https://github.com/wekan/wekan/issues/2731)) keeps your account's
  history on boards, cards and comments, but replaces your username and full
  name with a `deleted-user-...` placeholder, clears your initials, avatar,
  e-mail address and password, and disables login.

For developers: the popup is `editProfilePopup` in
`client/components/users/userHeader.*`; the methods are `setOwnProfile`,
`setEmail`, `setUsername`, `removeUser` and `anonymizeUser`
(`server/models/users.js`, `models/lib/userAnonymization.js`).
