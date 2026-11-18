# Member Settings / Change Avatar

Open the top-right username menu, then **Change Avatar**. Every signed-in
member sees it.

## The popup

- Your uploaded avatars, one row each. Click a row to use that picture; the one
  in use has a check mark. The trash icon deletes the picture after a
  confirmation. Deleting the picture in use switches you back to initials.
- **Initials** (*Default avatar*) - use no picture. Your initials, from
  [Edit Profile](Edit-Profile.md), are shown instead, or the site's default
  avatar image when one is configured ([Default avatar](Default-Avatar.md)).
- **Upload an avatar** - pick an image file (on a phone, the camera is
  offered). It is added to the list above; click it to use it. Above the
  button the popup shows the maximum size in bytes and the allowed file types,
  when the server sets them, and that an invalid file name cancels the upload.
  An upload error is shown at the top of the popup.

## Settings that affect it

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

For developers: the popup is `changeAvatarPopup` in
`client/components/users/userAvatar.*`; it calls `setAvatarUrl` and
`isAvatarUploadBlocked`.
