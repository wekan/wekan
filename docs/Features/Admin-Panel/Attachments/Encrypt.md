# Admin Panel / Attachments / Encrypt

## What it is

The attachments stored on this server's disk, encrypted by WeKan itself, at
`/admin/attachments/encrypt`. The pane is in the menu only while the server
has `ATTACHMENTS_PASSPHRASE` set (at least 16 characters), and only for site
administrators. Encrypted attachments keep their addresses: they are decrypted
as they are read, a download that starts in the middle (a video, a large PDF)
included, so links in cards, exports and previews work as before.

## Read more

- [Running WeKan under GDPR, HIPAA, NIS2, ISO 27001 and SOC 2](../../../Security/Compliance/README.md) -
  encryption at rest, and when disk encryption is enough.
- [Security settings](../../../Security/Security-Settings.md) -
  `ATTACHMENTS_PASSPHRASE` and `BACKUP_PASSPHRASE`.
- [Block cipher mode of operation: counter (CTR)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR))
  on Wikipedia.

## How to use it

1. Set `ATTACHMENTS_PASSPHRASE` on the server (Snap: `sudo snap set wekan
   attachments-passphrase='...'`) and restart. Keep the passphrase somewhere
   other than this server: without it, encrypted attachments cannot be read.
2. Open **Admin Panel → Attachments → Encrypt**.
3. Tick **Encrypt new attachments**: each new upload is encrypted once it
   has been checked (file type, virus scanner), and attachments that arrive
   another way - imports, e-mail to card, the REST API - are encrypted by an
   hourly sweep.
4. Click **Encrypt all attachments** to encrypt the ones already there. The
   pane shows how many are done; it can be left while it runs.
5. To go back, click **Decrypt all attachments**, then untick Encrypt new
   attachments, and only then remove the passphrase.

## How the numbers are calculated

- **Encrypted / Not encrypted / File missing**: each attachment's original
  file on the disk, by whether it starts with WeKan's encryption header.
- Only files on this server's disk are encrypted. Attachments in GridFS or
  cloud storage are not touched; cloud storage has its own server-side
  encryption.
- Backups: a backup holds the attachments decrypted, and is encrypted itself
  when `BACKUP_PASSPHRASE` is set. A restored attachment is plain until the
  next sweep or Encrypt all.

## How it works in WeKan

- [server/lib/attachmentEncryption.js](../../../../server/lib/attachmentEncryption.js) -
  AES-256-CTR, the key stretched from the passphrase with scrypt; the header
  `WKATT1`, the salt and the IV are at the start of each file; a plain file is
  read as before.
- [models/lib/fileStoreStrategy.js](../../../../models/lib/fileStoreStrategy.js)
  `FileStoreStrategyFilesystem.getReadStream` decrypts every read, byte ranges
  included.
- [server/lib/attachmentEncryptionRun.js](../../../../server/lib/attachmentEncryptionRun.js) -
  the pane's methods, the background runs, new uploads and the hourly sweep;
  each changed attachment's `meta.updatedAt` is set, so the filesystem
  integrity scan sees the change explained. The runs and the switch are in the
  Audit log.
- Tested by [tests/attachmentEncryption.test.cjs](../../../../tests/attachmentEncryption.test.cjs)
  and [tests/playwright/specs/attachment-encryption.e2e.js](../../../../tests/playwright/specs/attachment-encryption.e2e.js).
