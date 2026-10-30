'use strict';

// Encryption at rest for attachments, avatars and backups in S3: Admin Panel /
// Attachments / S3 / Server-side encryption. S3 encrypts each object as it is
// written and decrypts it for a reader with the right to it, so nothing else
// in WeKan changes - reads, range requests, renames and moves work as before.
//
//   ''        none requested (the bucket's own default encryption still applies)
//   'AES256'  SSE-S3, keys managed by the storage service
//   'aws:kms' SSE-KMS, with the KMS key named by sseKmsKeyId, or the account's
//             default KMS key when it is empty
//
// On the filesystem, WeKan leaves encryption at rest to the disk or volume
// (LUKS, an encrypted cloud volume): every reader of the files - exports, PDF,
// thumbnails, virus scan, backups, WebDAV - reads them directly, and
// encrypting them in WeKan would mean changing all of those and converting
// every file already stored.
//
// Pure: no Meteor. Shared by the storage adapters, the backup and tests.

const MODES = ['', 'AES256', 'aws:kms'];
// A key ID, key ARN, alias name or alias ARN.
const KMS_KEY_ID = /^[A-Za-z0-9:/_+=.@-]{1,2048}$/;

// PutObject / Upload parameters for one S3 configuration: {} when no
// encryption is asked for, or when what is stored is not a valid choice.
function s3EncryptionOptions(cfg) {
  const mode = cfg && typeof cfg.serverSideEncryption === 'string' ? cfg.serverSideEncryption.trim() : '';
  if (mode === 'AES256') return { ServerSideEncryption: 'AES256' };
  if (mode === 'aws:kms') {
    const keyId = typeof cfg.sseKmsKeyId === 'string' ? cfg.sseKmsKeyId.trim() : '';
    if (keyId && !KMS_KEY_ID.test(keyId)) return {};
    return keyId ? { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: keyId } : { ServerSideEncryption: 'aws:kms' };
  }
  return {};
}

module.exports = { s3EncryptionOptions, MODES, KMS_KEY_ID };
