# Default avatar

## What it is

A user who has not uploaded an avatar is shown with their initials. With
`DEFAULT_AVATAR_URL` set, WeKan shows an image from a server you choose
instead (#824) - for example the photos on an intranet server, or a
Gravatar-style service. It is set in the environment only (Docker, snap,
`start-wekan.sh` / `.bat`); there is no Admin Panel field, as the maintainer
asked.

## Read more

- [Avatar (computing)](https://en.wikipedia.org/wiki/Avatar_(computing)) and
  [Gravatar](https://en.wikipedia.org/wiki/Gravatar) on Wikipedia.
- [MD5](https://en.wikipedia.org/wiki/MD5) and
  [SHA-2](https://en.wikipedia.org/wiki/SHA-2) on Wikipedia - the e-mail hashes
  the template can use.
- [URL redirection](https://en.wikipedia.org/wiki/URL_redirection) on
  Wikipedia - how the image is reached.
- [General Data Protection Regulation](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation)
  on Wikipedia, for the privacy note below.
- [Change Avatar](Change-Avatar.md).

## How to use it

1. Decide where the images are, and write the address as a URL template with
   one or more of the placeholders below.
2. Set `DEFAULT_AVATAR_URL` to it in the environment of the WeKan server (or
   `snap set wekan default-avatar-url=...` for the snap).
3. Restart WeKan. Users without an avatar of their own now show the image; a
   user who uploads one keeps theirs.

The value is a URL template:

| Placeholder | Replaced with |
| --- | --- |
| `{username}` | the WeKan username |
| `{userId}` | the WeKan user id |
| `{emailMd5}` | MD5 of the user's first email, trimmed and lower-cased |
| `{emailSha256}` | SHA-256 of it |

```bash
DEFAULT_AVATAR_URL=http://192.168.1.200/avatars/{username}.png
DEFAULT_AVATAR_URL=https://gravatar.example/avatar/{emailSha256}?d=404
snap set wekan default-avatar-url='http://192.168.1.200/avatars/{username}.png'
```

Every value is URL-encoded, and only an `http` or `https` template is used.
The server fetches nothing: `/avatar-default/<userId>` redirects the browser
to the address, so whether that server may be reached - and what it learns -
is the administrator's choice. An avatar a user uploads always wins, and when
the default image does not load the initials are shown again.

Note that an outside avatar service learns which of your users are viewed
when; for GDPR reasons the maintainer recommends a server inside your own
network.

## How the numbers are calculated

- **Hashes:** `{emailMd5}` is the 32-hex-digit MD5 and `{emailSha256}` the
  64-hex-digit SHA-256 of the first e-mail address, after `trim()` and
  `toLowerCase()`; both are empty when the user has no e-mail address
  ([models/lib/defaultAvatarUrl.js](../../../models/lib/defaultAvatarUrl.js)).
- **Cache: one day.** The redirect is a `302` with
  `Cache-Control: private, max-age=86400` (86400 seconds = 24 hours), because
  the target follows the username and e-mail, which rarely change
  ([server/defaultAvatar.js](../../../server/defaultAvatar.js)).
- **User id check:** the route answers only an id of 1 to 64 letters, digits,
  `_` or `-`; anything else, an unknown user or an unusable template gives
  `404`.

## How it works in WeKan

- **Route:** `GET /avatar-default/:userId` in
  [server/defaultAvatar.js](../../../server/defaultAvatar.js) reads the user's
  `username` and `emails`, builds the target with `defaultAvatarUrl()` and
  redirects there with `Referrer-Policy: no-referrer`, so the image server does
  not learn which WeKan page asked. It also publishes
  `Meteor.settings.public.defaultAvatar` (true when the variable is set).
- **Template:** `defaultAvatarUrl(template, user)` in
  [models/lib/defaultAvatarUrl.js](../../../models/lib/defaultAvatarUrl.js)
  returns `null` for a template that is not `http:` or `https:`.
- **Client:** the avatar component asks this route only when the user's
  `profile.avatarUrl` is empty
  ([client/components/users/userAvatar.js](../../../client/components/users/userAvatar.js)),
  and falls back to initials when the image fails to load.
- **Snap:** the key `default-avatar-url` in `snap-src/bin/config`.
- **Tests:** [tests/defaultAvatarUrl.test.cjs](../../../tests/defaultAvatarUrl.test.cjs)
  and the browser test
  [tests/playwright/specs/default-avatar.e2e.js](../../../tests/playwright/specs/default-avatar.e2e.js).

## Commits

 - [DEFAULT_AVATAR_URL on every release platform, with no Admin Panel field](https://github.com/wekan/wekan/commit/718fdb5dacf75d4b9048693cba65c27cf3595434)
 - [a default avatar from DEFAULT_AVATAR_URL for users without one](https://github.com/wekan/wekan/commit/b426f9cfa88f2910dfeb231c1badd2fb16372a07)
