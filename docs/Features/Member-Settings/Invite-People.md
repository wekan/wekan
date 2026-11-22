# Member Settings / Invite People

## What it is

**Invite People** sends an e-mail with an invitation code to people who do not
have an account yet, so they can register while self-registration is off. You
can also pick boards they join when they register. It lets members of an
organization's own e-mail domain bring colleagues in without an administrator.

## Read more

- [Email](https://en.wikipedia.org/wiki/Email) on Wikipedia.
- [Admin Panel / People / Login](../Admin-Panel/People/Login.md) (Self-Registration,
  and the administrators' own invitation box) and
  [Admin Panel / People / E-mail](../Admin-Panel/People/E-mail.md) (the domain
  allowed to invite).
- [Admin Panel / People / Roles](../Admin-Panel/People/Roles.md) - which board
  roles may invite.

## How to use it

**Who sees the entry.** All of these must be true:

- **Self-Registration** is not allowed in
  [Admin Panel / People / Login](../Admin-Panel/People/Login.md);
- **Email domain allowed to invite people, when self-registration is
  disabled** is set in [Admin Panel / People / E-mail](../Admin-Panel/People/E-mail.md);
- one of your e-mail addresses ends with that domain (a plain suffix match).

Administrators can also invite from the box in Admin Panel / People / Login.

**Send invitations**

1. Click your username or avatar at the top right, then **Invite People**.
2. In **Email Addresses**, write one address per line, or several separated by
   commas. Addresses are lowercased; anything that does not look like an
   e-mail address is skipped. With no valid address, nothing is sent.
3. Under **To board(s)**, tick the boards the invited people should join when
   they register. The list shows your boards, each with a checkbox.
4. Click **Invite**. The top of the popup then says *Invitation to register
   sent with success*, or *Error while sending invitation to register*. The
   popup stays open.

**What the server checks**

- You must be an administrator, or pass the domain rule above.
- For every ticked board you must be allowed to invite: an administrator may
  invite to any board; anybody else needs a board role that may invite, set in
  [Admin Panel / People / Roles](../Admin-Panel/People/Roles.md) (a custom role
  carries its own setting). If one board fails, nothing is sent at all, and the
  refusal is recorded in [Admin Panel / Problems](../Admin-Panel/Problems/README.md).
- An address that already has an account stops the sending with an error.
- An address that already has an invitation gets a fresh, valid code; a new
  address gets a new code. Each is e-mailed.

## How the numbers are calculated

- **The invitation code** is 16 random bytes from Node's `crypto.randomBytes`,
  written as base64url: 22 characters (`generateInvitationCode()` in
  [server/models/settings.js](../../../server/models/settings.js)). The
  sign-up form's Invitation Code field needs at least 6 characters
  (`config/accounts.js`).
- **Valid addresses:** the browser splits the text at newlines and commas,
  trims each part and keeps those that match an e-mail pattern
  ([client/components/users/userHeader.js](../../../client/components/users/userHeader.js));
  the server checks each again with `SimpleSchema.RegEx.Email`.
- **Domain match:** a plain `endsWith()` of each of your addresses against the
  configured domain.

## How it works in WeKan

- **Popup:** `invitePeoplePopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade);
  the menu entry is shown by the helper `isSameDomainNameSettingValue`
  (registration disabled, `mailDomainName` set, one of your addresses ending
  with it).
- **Method:** `sendInvitation` in
  [server/models/settings.js](../../../server/models/settings.js) validates
  the whole grant before it changes a code or sends any mail, then for each
  address inserts or refreshes an `InvitationCodes` document
  (`{ code, email, valid: true, boardsToBeInvited }`) and sends the e-mail.
- **Board rule:** `canInviteToBoard()` in
  [models/lib/invitationBoardPermission.js](../../../models/lib/invitationBoardPermission.js).
- **Tests:** [tests/adminInvitePeopleFeedback.test.cjs](../../../tests/adminInvitePeopleFeedback.test.cjs),
  [tests/inviteNewUserByEmail.test.cjs](../../../tests/inviteNewUserByEmail.test.cjs),
  [tests/inviteEmailLanguage.test.cjs](../../../tests/inviteEmailLanguage.test.cjs),
  [tests/invitationProfileGuard.test.cjs](../../../tests/invitationProfileGuard.test.cjs)
  and the browser test
  [tests/playwright/specs/72-invitation-profile.e2e.js](../../../tests/playwright/specs/72-invitation-profile.e2e.js).

## Commits

 - [custom board roles carry their own invite permission](https://github.com/wekan/wekan/commit/50bb989eb8d90ed9bfafbceb3f9f8e68e208116e)
 - [every board grant is authorized before invitations are sent](https://github.com/wekan/wekan/commit/af93621261e6bdc112f4b46b62e8507b7c7764ce)
 - [server-issued invitations are protected from client profile updates](https://github.com/wekan/wekan/commit/055cf42d49a97294a18359aa45082bf1de8b8b4e)
 - [success and failure feedback in the Invite People form](https://github.com/wekan/wekan/commit/b2ca9962ba30a83ea4f831f44ccf05d2c7bb1d24)
 - [regression test for the invitation e-mail language](https://github.com/wekan/wekan/commit/dfa6c78d4f032a698f6feaad189c86da903d27fb)
 - [non-admin users of an allowed e-mail domain may send registration invitations](https://github.com/wekan/wekan/commit/b51152fca4bf6c7d2bc6b30204899b5d5fe361fd)
