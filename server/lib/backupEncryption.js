// BACKUP_PASSPHRASE (docs/Compliance/README.md P3; [GDPR] Art. 32(1)(a),
// [HIPAA] § 164.312(a)(2)(iv)): the Admin Panel backup's archive, encrypted
// with a passphrase as it is written - to disk or to cloud storage - and
// decrypted when it is restored. The same cipher and key stretching as the
// continuous backup (server/lib/continuousBackup/encryption.js): AES-256-GCM,
// a key made from the passphrase with scrypt.
//
// The salt and IV travel in the file itself, because a backup in cloud
// storage has no side file:
//
//   WKBAK1\n | salt (16) | iv (12) | ciphertext | GCM tag (16)
//
// A restore recognises the header, so an older plain backup.zip restores as
// before. A wrong passphrase, or a file changed after it was written, is
// refused - GCM checks the whole file - and nothing half-decrypted is kept.
// A passphrase shorter than 16 characters is not used: the backups stay as
// they were, and the server says why.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const MAGIC = Buffer.from('WKBAK1\n');
const SALT = 16;
const IV = 12;
const TAG = 16;
const HEADER = MAGIC.length + SALT + IV;
const MIN_PASSPHRASE = 16;

function backupPassphrase(env = { BACKUP_PASSPHRASE: process.env.BACKUP_PASSPHRASE }) {
  const p = String((env && env.BACKUP_PASSPHRASE) || '');
  return p.length >= MIN_PASSPHRASE ? p : '';
}

function keyFrom(passphrase, salt) {
  return crypto.scryptSync(String(passphrase).normalize('NFC'), salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

function refuse(message) {
  const error = new Error(message);
  error.code = 'backup-passphrase';
  return error;
}

// A stream that writes the header first and the tag last.
function encryptStream(passphrase) {
  const salt = crypto.randomBytes(SALT);
  const iv = crypto.randomBytes(IV);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFrom(passphrase, salt), iv);
  let started = false;
  const header = () => Buffer.concat([MAGIC, salt, iv]);
  return new Transform({
    transform(chunk, encoding, done) {
      if (!started) { this.push(header()); started = true; }
      done(null, cipher.update(chunk));
    },
    flush(done) {
      if (!started) this.push(header());
      this.push(cipher.final());
      this.push(cipher.getAuthTag());
      done();
    },
  });
}

async function isEncryptedBackup(file) {
  const handle = await fsp.open(file, 'r');
  try {
    const head = Buffer.alloc(MAGIC.length);
    const { bytesRead } = await handle.read(head, 0, head.length, 0);
    return bytesRead === MAGIC.length && head.equals(MAGIC);
  } finally {
    await handle.close();
  }
}

// Decrypt `from` into the new file `to`; `to` is removed if anything is wrong.
async function decryptBackup(from, to, passphrase) {
  if (!passphrase) throw refuse('This backup is encrypted: set BACKUP_PASSPHRASE to restore it.');
  const { size } = await fsp.stat(from);
  if (size < HEADER + TAG) throw refuse('Not an encrypted backup file');
  const handle = await fsp.open(from, 'r');
  const head = Buffer.alloc(HEADER);
  const tag = Buffer.alloc(TAG);
  try {
    await handle.read(head, 0, HEADER, 0);
    await handle.read(tag, 0, TAG, size - TAG);
  } finally {
    await handle.close();
  }
  if (!head.subarray(0, MAGIC.length).equals(MAGIC)) throw refuse('Not an encrypted backup file');
  const salt = head.subarray(MAGIC.length, MAGIC.length + SALT);
  const iv = head.subarray(MAGIC.length + SALT);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFrom(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  try {
    if (size === HEADER + TAG) {
      decipher.final();
      await fsp.writeFile(to, Buffer.alloc(0), { flag: 'wx', mode: 0o600 });
    } else {
      await pipeline(fs.createReadStream(from, { start: HEADER, end: size - TAG - 1 }), decipher,
        fs.createWriteStream(to, { flags: 'wx', mode: 0o600 }));
    }
  } catch (error) {
    await fsp.rm(to, { force: true });
    if (error.code === 'ERR_OSSL_BAD_DECRYPT' || /auth/i.test(String(error.message))) {
      throw refuse('The backup passphrase is wrong, or the backup file has changed.');
    }
    throw error;
  }
}

module.exports = { MAGIC, MIN_PASSPHRASE, backupPassphrase, encryptStream, isEncryptedBackup, decryptBackup };
