# Member Settings / Invite People

Open the top-right username menu, then **Invite People**. It sends an e-mail
with an invitation code to people who do not have an account yet, so they can
register while self-registration is off.

## Who sees the entry

All of these must be true:

- **Self-Registration** is not allowed in
  [Admin Panel / People / Login](../Admin-Panel/People/Login.md);
- **Email domain allowed to invite people, when self-registration is
  disabled** is set in [Admin Panel / People / E-mail](../Admin-Panel/People/E-mail.md);
- one of your e-mail addresses ends with that domain (a plain suffix match).

Administrators can also invite from the box in Admin Panel / People / Login.

## The popup

- **Email Addresses** - one address per line, or several separated by commas.
  Addresses are lowercased; anything that does not look like an e-mail address
  is skipped. With no valid address, nothing is sent.
- **To board(s)** - your boards, each with a checkbox. The invited person joins
  the ticked boards when they register.
- **Invite** sends the invitations. The top of the popup then says *Invitation
  to register sent with success*, or *Error while sending invitation to
  register*. The popup stays open.

## What the server checks

- You must be an administrator, or pass the domain rule above.
- For every ticked board you must be allowed to invite: an administrator may
  invite to any board; anybody else needs a board role that may invite, set in
  [Admin Panel / People / Roles](../Admin-Panel/People/Roles.md) (a custom role
  carries its own setting). If one board fails, nothing is sent at all, and the
  refusal is recorded in [Admin Panel / Problems](../Admin-Panel/Problems/README.md).
- An address that already has an account stops the sending with an error.
- An address that already has an invitation gets a fresh, valid code; a new
  address gets a new code. Each is e-mailed.

For developers: the popup is `invitePeoplePopup` in
`client/components/users/userHeader.*`, the method `sendInvitation` in
`server/models/settings.js`, the board rule `canInviteToBoard()` in
`models/lib/invitationBoardPermission.js`.
