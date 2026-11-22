# Adding users

## What it is

WeKan users are added either by letting people register themselves at the
sign-up page, or, when self-registration is turned off, by an administrator
inviting them by email to chosen boards. The very first account registered on
a new WeKan becomes the administrator; everybody after that is a normal user
until an admin makes them admin in the Admin Panel. Users can also come from
LDAP, OAuth2/OIDC, CAS, SAML or header login, which create the account at the
first login.

## Read more

There is no outside article about this; it is WeKan's own account handling.
Related WeKan pages:

- [Admin Panel / People / Login](../Admin-Panel/People/Login.md) (Login:
  Allow, Invite People)
- [Admin Panel / People / People](../Admin-Panel/People/People.md)
- [Troubleshooting Email](../General/Email/Troubleshooting-Mail.md)
- [Forgot password](Forgot-Password.md), [Impersonate user](Impersonate-user.md)

## How to use it

**Standalone WeKan: Snap, (Docker, Source, VirtualBox)**

1. [Install Wekan Snap](https://github.com/wekan/wekan-snap/wiki/Install)
2. Go to your WeKan URL like https://example.com/sign-up (your address +
   /sign-up)
3. Register your username, email address and password. First registered user
   will be admin, and next ones normal users. If you want other admins too,
   you can change their permission to admin at Admin Panel.
4. **Working email is not required. WeKan works without setting up email.**
   Older WeKan versions showed "Internal Server Error" when creating an
   account without email configured, even though the account was created;
   that is fixed (#5672), and the sign-up now completes. If you really want
   email sending, do for example:
   ```
   sudo snap set wekan mail-url='smtps://user:pass@mailserver.example.com:457/'
   sudo snap set wekan mail-from='Example Wekan Support <support@example.com>'
   ```
   For more options see [Troubleshooting Email](../General/Email/Troubleshooting-Mail.md)
5. Login to WeKan at https://example.com/sign-in (your address + /sign-in)
6. Click on top right your username / **Admin Panel**. In **People** →
   **People** you can change permissions, name, email address and password
   (the **Edit** link of a user).

   ![Admin Panel](https://wekan.fi/wekan-admin-panel.png)

7. For registering other users:

   a) Let them self-register, or open webbrowser incognito window, and
      register them at https://example.com/sign-up (your address + /sign-up)

   b) If your email works: **Admin Panel** → **People** → **Login**, and
      under **Login: Allow** untick **Self-Registration** (it used to be
      Admin Panel / Settings / Registration / Disable self-registration).
      An **Invite People** form then appears below: write the **Email
      Addresses**, tick the boards under **To board(s)**, and click
      **Invite**. Each invited person gets an email with an invitation code,
      and signs up with it.

**Deleting users**

1. **Admin Panel** → **People** → **People**.
2. Click **⋯** beside the user's **Edit** link.
3. Use **Delete** (or **Anonymize account**) in the popup and confirm.

Users can delete their own account only when **Self delete user account** is
ticked under **Login: Allow**. The old note here said
[there is no delete feature yet](https://github.com/wekan/wekan/issues/1289);
there is one now.

## How the numbers are calculated

- **First user is admin**: when an account is created, WeKan checks whether
  any account exists already; the first one gets `isAdmin: true`
  ([server/models/users.js](../../../server/models/users.js), `onCreateUser`).
  Only existence is checked, not a count of all users.
- **Invitation code**: an invitation carries a 128-bit random code (22 or more
  base64url characters); a shorter, older code is refused at sign-up and
  replaced when the person is invited again
  ([models/lib/invitationCodeEmail.js](../../../models/lib/invitationCodeEmail.js)).
- **Sign-up rate**: at most 10 sign-up attempts (`ATCreateUserServer`) per
  60 seconds per client address, a `DDPRateLimiter` rule in
  [server/models/users.js](../../../server/models/users.js); a refusal is
  recorded by [server/lib/authRateLimitDecision.js](../../../server/lib/authRateLimitDecision.js).

## How it works in WeKan

- The sign-in and sign-up forms are the useraccounts templates in
  `userFormsLayout` ([client/components/main/layouts.jade](../../../client/components/main/layouts.jade));
  the routes `/sign-up`, `/sign-in`, `/forgot-password` are configured in
  [config/accounts.js](../../../config/accounts.js). `/sign-up` is only
  configured while registration is allowed.
- `disableRegistration` in the `settings` collection is the Self-Registration
  checkbox, stored inverted; the client asks `isDisableRegistration` and hides
  the sign-up link with a `registration-disabled` class on `<body>`, which
  survives the form re-rendering after a failed login (#4394).
- With registration off, the server still refuses an account created without
  a valid invitation code, through the sign-up form, DDP or the REST API
  (SignupBleed, InviteBleed), and records the attempt in Admin Panel /
  Problems.
- The Invite People form sends `sendInvitation`, which checks that the admin
  may grant each chosen board before mailing the code.
- Tests: [tests/signupFirstUser.test.cjs](../../../tests/signupFirstUser.test.cjs),
  [tests/registrationInvitationCodeGuard.test.cjs](../../../tests/registrationInvitationCodeGuard.test.cjs),
  [tests/restRegisterRespectsSetting.test.cjs](../../../tests/restRegisterRespectsSetting.test.cjs),
  [tests/signupBleedDdp.test.cjs](../../../tests/signupBleedDdp.test.cjs),
  [tests/playwright/specs/signup-bleed-ddp.e2e.js](../../../tests/playwright/specs/signup-bleed-ddp.e2e.js),
  [tests/playwright/specs/password-min-length-signup-login.e2e.js](../../../tests/playwright/specs/password-min-length-signup-login.e2e.js).

## Commits

 - [InviteBleed: old six-digit invitation codes refused, and sign-up throttled](https://github.com/wekan/wekan/commit/4fad2a9000403ae92069060eb3a4b6b53e67f658)
 - [Invite via Email adds the invited new user, not the first user of the database](https://github.com/wekan/wekan/commit/8556459f977b68f2421b90cf13a9aab5abc9466c)
 - [SignupBleed: guard the sign-up form's own method, and keep ordinary sign-up working](https://github.com/wekan/wekan/commit/433ff5506c237d4520a302d35bf087db0ebfa53c)
 - [A client sign-up cannot claim admin or LDAP creation](https://github.com/wekan/wekan/commit/dd36db36419d88638b5306b85bf2f3201748539f)
 - [Authorize every board grant before sending registration invitations](https://github.com/wekan/wekan/commit/af93621261e6bdc112f4b46b62e8507b7c7764ce)
 - [Registration no longer scans all users](https://github.com/wekan/wekan/commit/0ea301d7ee4a6c033e2d6cd4b233af7c8635146d)
 - [SignupBleed: with registration disabled the REST API no longer creates accounts](https://github.com/wekan/wekan/commit/a3f1b626292cc8cb16d3cfd71ba30009cfc5f935)
 - [Admin Panel / People / Login: one "Login: Allow" group of checkboxes](https://github.com/wekan/wekan/commit/40c1c1e7173edfd0f74f44b0414081c2b6f86ef6)
 - [Login and E-mail move from Admin Panel / Settings to People](https://github.com/wekan/wekan/commit/47b03ef89404c446dbaf0fc94c7271abaf82e5ef)
 - [Register / Forgot Password links stay hidden after a failed login](https://github.com/wekan/wekan/commit/e014d5c8169053805da407facdee98531c6c7d14)
 - [No "Internal Server Error" when signing up without working email](https://github.com/wekan/wekan/commit/b1b414e850c5494dd3849f8dab6db44fecef0196)
 - [Fixed Disable Self-Registration, and added Disable Forgot Password](https://github.com/wekan/wekan/commit/b85db43c4755cf54e550f664311cd95097d68ae1)
