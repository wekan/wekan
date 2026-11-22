# Member Settings / Edit Profile

## What it is

**Edit Profile** changes how other people see you in WeKan - your full name and
initials - and, when the site allows it, your username and e-mail address. When
the site allows members to delete themselves, it is also where you delete or
anonymize your own account. The entry is hidden for accounts that sign in with
OAuth2, whose profile comes from the identity provider.

## Read more

- [User profile](https://en.wikipedia.org/wiki/User_profile) on Wikipedia.
- [Data anonymization](https://en.wikipedia.org/wiki/Data_anonymization) and
  [General Data Protection Regulation](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation)
  on Wikipedia - why **Anonymize account** exists next to **Delete**.
- [Admin Panel / People / Login](../Admin-Panel/People/Login.md) and
  [Admin Panel / People / E-mail](../Admin-Panel/People/E-mail.md) - the
  switches that allow the changes.
- [Change Avatar](Change-Avatar.md), [SQRL](SQRL.md).

## How to use it

**Change your name, initials, username or e-mail**

1. Click your username or avatar at the top right, then **Edit Profile**.
2. Change the fields you may change:

   | Field | Editable when |
   | --- | --- |
   | **Full Name** | always (up to 256 characters) |
   | **Username** | **Username Change** is allowed in [Admin Panel / People / Login](../Admin-Panel/People/Login.md); otherwise read-only |
   | **Initials** | always (up to 20 characters); shown in the avatar when you have no picture |
   | **Email** | **Allow Email Change** is on in [Admin Panel / People / E-mail](../Admin-Panel/People/E-mail.md); otherwise read-only |

3. Click **Save**. The popup closes when the save worked, and stays open with
   the error otherwise.

What Save does:

- Full name and initials are always saved.
- A changed e-mail address replaces your address and is marked unverified. It
  is refused when another account already has it (*Email has already been
  taken*), and while your account is [SQRL](SQRL.md)-hardlocked.
- A changed username is refused when another account has it (*This username
  is already taken*).

Earlier versions of this page said that the server saved a changed
**username**, and a username and e-mail changed together, only for an
administrator. That is no longer so (since 2026-11-20): `setUsername`,
`setEmail` and `setUsernameAndEmail` in `server/models/users.js` accept a
member's change to their **own** account when the matching switch is on, and
refuse anything else with *not-authorized*, so the popup no longer closes as if
it had saved.

**Delete or anonymize your account**

When **Self delete user account** is allowed in
[Admin Panel / People / Login](../Admin-Panel/People/Login.md), two more
buttons appear. Each asks for confirmation and then logs you out.

- **Delete** removes your account. There is no undo.
- **Anonymize account**
  ([#2731](https://github.com/wekan/wekan/issues/2731)) keeps your account's
  history on boards, cards and comments, but replaces your username and full
  name with a `deleted-user-...` placeholder, clears your initials, avatar,
  e-mail address and password, and disables login. This cannot be undone.

## How the numbers are calculated

- **Full Name at most 256 characters, Initials at most 20:** `setOwnProfile`
  refuses longer values with *invalid-profile*
  ([server/models/users.js](../../../server/models/users.js)).
- **Placeholder:** `deleted-user-` followed by 8 random lower-case characters
  (`Random.id(8).toLowerCase()` in `anonymizeUser`).
- **Last administrator:** an administrator deleting another account cannot
  delete the last remaining administrator (the count of users with `isAdmin`
  must be more than 1); anonymizing follows the same rule in
  `decideAnonymize()`.
- The e-mail address is saved lower-cased and trimmed.

## How it works in WeKan

- **Popup:** `editProfilePopup`, `userDeletePopup` and `userAnonymizePopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  and [userHeader.js](../../../client/components/users/userHeader.js). Save calls
  `setOwnProfile(fullname, initials)`, then `setUsernameAndEmail`,
  `setUsername` or `setEmail` for what changed.
- **Methods** in [server/models/users.js](../../../server/models/users.js):
  - `setUsername` / `setEmail` - an administrator changes anybody's; a member
    their own when `accounts-allowUserNameChange` /
    `accounts-allowEmailChange` is on. `setEmail` also refuses a
    SQRL-hardlocked account for anybody but an administrator.
  - `setUsernameAndEmail` - for a non-admin, requires both switches and the
    member's own account.
  - `removeUser` - a member may delete themselves; deleting another account
    needs an administrator.
  - `anonymizeUser` - the decision is `decideAnonymize()` and the update
    `buildAnonymizeUpdate()` in
    [models/lib/userAnonymization.js](../../../models/lib/userAnonymization.js);
    it sets `loginDisabled` and keeps every board, card, comment and activity
    reference pointing at the same user id.
- **Tests:** [tests/selfUsernameChange.test.cjs](../../../tests/selfUsernameChange.test.cjs),
  [tests/userAnonymization.test.cjs](../../../tests/userAnonymization.test.cjs),
  [tests/profileEmailMissing.test.cjs](../../../tests/profileEmailMissing.test.cjs)
  and the browser test
  [tests/playwright/specs/45-profile-email.e2e.js](../../../tests/playwright/specs/45-profile-email.e2e.js).

## Commits

 - [Edit Profile saves a member's own new username when allowed](https://github.com/wekan/wekan/commit/42959d02f1ea7b87512439415a9ea8187cd4e19b)
 - [the anonymizeUser method and its tests](https://github.com/wekan/wekan/commit/ac4b7e75fefdf201c671c0ee3702d5ed47b8e3cb)
 - [the Anonymize account button in Edit Profile](https://github.com/wekan/wekan/commit/0eaa97230b601ef8ef716c855bd317ab2f1e4362)
 - [the first e-mail is saved on accounts without one](https://github.com/wekan/wekan/commit/ac0d9a3cd1f514007296814af34b0a59d9866abe)
 - [admin setting to prevent users from deleting their own account](https://github.com/wekan/wekan/commit/98e3b0ce77cc8c7367fc9cf592f4d6698d16e7f0)
 - [change e-mail address](https://github.com/wekan/wekan/commit/6a10257fd7230d08d9a64fc4877e85972375498d)
