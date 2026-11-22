# Member Settings / Change Avatar

## What it is

Your avatar is the small picture shown for you on minicards, in member lists,
comments and the header. **Change Avatar** lets you upload pictures, pick which
one is used, delete them, or go back to your initials. Every signed-in member
sees it.

## Read more

- [Avatar (computing)](https://en.wikipedia.org/wiki/Avatar_(computing)) on
  Wikipedia.
- [Default avatar](Default-Avatar.md) - the server-wide image used when you have
  no picture.
- [Edit Profile](Edit-Profile.md) - where your initials are set.
- [Admin Panel / Attachments](../Admin-Panel/Attachments/README.md#limits) -
  where avatar uploads can be blocked.

## How to use it

**Upload and use a picture**

1. Click your username or avatar at the top right, then **Change Avatar**.
2. Click **Upload an avatar** and pick an image file (on a phone, the camera is
   offered).
3. The picture is added to the list in the popup. Click its row to use it; the
   one in use has a check mark.

Above the button the popup shows the maximum size in bytes and the allowed file
types, when the server sets them, and that an invalid file name cancels the
upload. An upload error is shown at the top of the popup.

**Switch back to initials**

1. Open **Change Avatar**.
2. Click **Initials** (*Default avatar*). Your initials, from
   [Edit Profile](Edit-Profile.md), are shown instead, or the site's default
   avatar image when one is configured ([Default avatar](Default-Avatar.md)).

**Delete a picture**

1. Open **Change Avatar**.
2. Click the trash icon of the picture's row and confirm. Deleting the picture
   in use switches you back to initials.

**Settings that affect it**

- **Avatar uploads blocked** in the Limits part of
  [Admin Panel / Attachments](../Admin-Panel/Attachments/README.md#limits)
  hides the upload button, and the server refuses uploads too. Choosing or
  deleting existing avatars still works.
- `AVATARS_UPLOAD_MAX_SIZE` (bytes; the server's default is 72000) and
  `AVATARS_UPLOAD_MIME_TYPES` (comma-separated) limit what may be uploaded.
- **Disable import avatars** in
  [Admin Panel / Settings / Security](../Admin-Panel/Settings/Security.md)
  stops avatars from being imported or synced at login.

Administrators can change another user's avatar from
[Admin Panel / People](../Admin-Panel/People/People.md).

## How the numbers are calculated

- **Maximum size: 72000 bytes by default.** `avatarsUploadSize` starts at 72000
  in [models/avatars.js](../../../models/avatars.js) and
  [models/avatars.server.js](../../../models/avatars.server.js);
  `AVATARS_UPLOAD_MAX_SIZE` replaces it when it parses to a whole number above
  0. A file is accepted before upload only when `file.size <= avatarsUploadSize`
  and its type starts with `image/`; otherwise the error *avatar-too-big* names
  the limit in a human size (the `filesize` library).
- **Allowed types.** `AVATARS_UPLOAD_MIME_TYPES` is split at commas and each
  entry trimmed; with it unset, any `image/*` type passes the browser check, and
  the server's `isFileValid()` (`models/fileValidation.js`) checks the stored
  file against the list and the size again after upload.
- The popup shows the two values exactly as the server publishes them
  (`Meteor.settings.public.avatarsUploadMaxSize` and `avatarsUploadMimeTypes`,
  set in [server/max-size.js](../../../server/max-size.js)).

## How it works in WeKan

- **Popup:** `changeAvatarPopup` (and `deleteAvatarPopup`) in
  [client/components/users/userAvatar.jade](../../../client/components/users/userAvatar.jade)
  and [userAvatar.js](../../../client/components/users/userAvatar.js). Picking
  a row calls the method `setAvatarUrl`; the upload button is hidden when
  `isAvatarUploadBlocked` (in
  [server/models/attachmentStorageSettings.js](../../../server/models/attachmentStorageSettings.js))
  returns true, which reads `limitSettings.avatarsUploadBlocked`.
- **Storage:** the `avatars` files collection (ostrio:files) of
  [models/avatars.js](../../../models/avatars.js) and
  [models/avatars.server.js](../../../models/avatars.server.js); files are kept
  under `WRITABLE_PATH/files/avatars` (or GridFS / S3 by the storage strategy).
  The URL in use is `profile.avatarUrl` of the user.
- **Permissions:** only `setAvatarUrl` may change `profile.avatarUrl`; a direct
  client write that it would refuse is denied and recorded in Admin Panel /
  Problems (`server/permissions/users.js`, `server/models/users.js`).
- **Tests:** [tests/changeAvatarPopup.test.cjs](../../../tests/changeAvatarPopup.test.cjs),
  [tests/avatarUrlSafety.test.cjs](../../../tests/avatarUrlSafety.test.cjs),
  [tests/avatarUrlDirectWrite.test.cjs](../../../tests/avatarUrlDirectWrite.test.cjs),
  [tests/avatarPersistence6656.test.cjs](../../../tests/avatarPersistence6656.test.cjs)
  and the browser test
  [tests/playwright/specs/29-card-settings-avatar.e2e.js](../../../tests/playwright/specs/29-card-settings-avatar.e2e.js).

## Commits

 - [a direct client write of an avatar URL follows the setAvatarUrl rule](https://github.com/wekan/wekan/commit/040d853c8e7c0092db264527497a7dd8878dc248)
 - [the initials row can show the DEFAULT_AVATAR_URL image](https://github.com/wekan/wekan/commit/b426f9cfa88f2910dfeb231c1badd2fb16372a07)
 - [an uploaded avatar is awaited before it is selected](https://github.com/wekan/wekan/commit/18ee579009380a42a6594657b0fadbee6afb2584)
 - [the avatar rows are fixed and every upload is deletable](https://github.com/wekan/wekan/commit/8e58456c447e1df7970dcd20a015b8834cccb980)
 - [Admin Panel setting to block avatar uploads](https://github.com/wekan/wekan/commit/8e2dacd856cef46728f0341eeafcb03fd0f453fa)
 - [administrators show and edit avatars in Admin Panel / People](https://github.com/wekan/wekan/commit/ce3e51b14755b9c0a7c655d7a96c4f01386b4efc)
 - [deleting an avatar works again, Meteor 3 compatible](https://github.com/wekan/wekan/commit/274f1309c389221915b40508faffdfc361d48bbf)
 - [Change Avatar fixed](https://github.com/wekan/wekan/commit/07186e12a93c56555feb3b7332d43a918abe7f20)
