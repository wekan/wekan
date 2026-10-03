'use strict';

// Encryption at rest for continuous backup (maintainer decision of 2026-10-03,
// docs/Backup/Continuous-Backup.md "Encryption"). AES-256-GCM from Node's own
// crypto, with a key the administrator holds in a file outside the stream and
// outside everything it reads - never in the database, which the stream itself
// backs up. Every stored file is MAGIC, a 12-byte IV, the ciphertext and the
// 16-byte tag; GCM refuses a changed byte. A blob's name is an HMAC of its
// content's SHA-256, so the name does not confirm a guessed file.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const MAGIC = Buffer.from('WKENC1\n');
const IV = 12, TAG = 16;
const ALGORITHM = 'aes-256-gcm';

function refuse(message) { const error = new Error(message); error.code = 'continuous-backup-key'; throw error; }

// The key file: 64 hexadecimal characters are the key itself; anything else
// of at least 16 characters is a passphrase, stretched with scrypt and the
// stream's own salt.
function deriveKey(secret, salt) {
  const text = String(secret).trim();
  if (/^[0-9a-fA-F]{64}$/.test(text)) return Buffer.from(text, 'hex');
  if (text.length < 16) refuse('The encryption key must be 64 hexadecimal characters or a passphrase of at least 16 characters');
  return crypto.scryptSync(text, Buffer.from(salt, 'hex'), 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}
async function readKeyFile(file) {
  let stat;
  try { stat = await fsp.lstat(file); } catch (error) { refuse('The encryption key file cannot be read'); }
  if (!stat.isFile() || stat.isSymbolicLink()) refuse('The encryption key file is not a plain file');
  return fsp.readFile(file, 'utf8');
}

// What the stream keeps about its key: the salt, and a check value that
// tells a wrong key from a right one without decrypting anything.
function keyCheck(key) { return crypto.createHmac('sha256', key).update('wekan-continuous-backup-key-check').digest('hex'); }
function newEncryptionHeader() { return { algorithm: ALGORITHM, kdf: 'scrypt-or-raw', salt: crypto.randomBytes(16).toString('hex') }; }

function cipherFor(key) {
  const blobName = digest => crypto.createHmac('sha256', key).update(`blob\0${digest}`).digest('hex');
  const encrypt = data => {
    const iv = crypto.randomBytes(IV);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    return Buffer.concat([MAGIC, iv, cipher.update(data), cipher.final(), cipher.getAuthTag()]);
  };
  const decrypt = data => {
    if (data.length < MAGIC.length + IV + TAG || !data.subarray(0, MAGIC.length).equals(MAGIC)) refuse('Not an encrypted backup file');
    const iv = data.subarray(MAGIC.length, MAGIC.length + IV);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(data.subarray(data.length - TAG));
    try { return Buffer.concat([decipher.update(data.subarray(MAGIC.length + IV, data.length - TAG)), decipher.final()]); }
    catch (error) { refuse('An encrypted backup file has changed or the key is wrong'); }
  };
  // A stream that writes MAGIC and the IV first and the tag last.
  const encryptStream = () => {
    const iv = crypto.randomBytes(IV);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let started = false;
    return new Transform({
      transform(chunk, encoding, done) {
        if (!started) { this.push(Buffer.concat([MAGIC, iv])); started = true; }
        done(null, cipher.update(chunk));
      },
      flush(done) {
        if (!started) this.push(Buffer.concat([MAGIC, iv]));
        this.push(cipher.final()); this.push(cipher.getAuthTag()); done();
      },
    });
  };
  // Decrypt a file to another; the tag is read from its end first, and the
  // output is removed when the tag does not match.
  const decryptFile = async (from, to) => {
    const { size } = await fsp.stat(from);
    if (size < MAGIC.length + IV + TAG) refuse('Not an encrypted backup file');
    const handle = await fsp.open(from, 'r');
    const head = Buffer.alloc(MAGIC.length + IV), tag = Buffer.alloc(TAG);
    try { await handle.read(head, 0, head.length, 0); await handle.read(tag, 0, TAG, size - TAG); } finally { await handle.close(); }
    if (!head.subarray(0, MAGIC.length).equals(MAGIC)) refuse('Not an encrypted backup file');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, head.subarray(MAGIC.length));
    decipher.setAuthTag(tag);
    try {
      if (size === head.length + TAG) {
        // Empty contents: only the tag to check.
        decipher.final();
        await fsp.writeFile(to, Buffer.alloc(0), { flag: 'wx', mode: 0o600 });
      } else {
        await pipeline(fs.createReadStream(from, { start: head.length, end: size - TAG - 1 }), decipher, fs.createWriteStream(to, { flags: 'wx', mode: 0o600 }));
      }
    } catch (error) {
      await fsp.rm(to, { force: true });
      if (error.code === 'continuous-backup-key' || /auth/i.test(String(error.message))) refuse('An encrypted backup file has changed or the key is wrong');
      throw error;
    }
  };
  return { encrypted: true, encrypt, decrypt, encryptStream, decryptFile, blobName };
}

// No encryption: the same interface, doing nothing.
const PLAIN = Object.freeze({ encrypted: false, encrypt: data => data, decrypt: data => data, encryptStream: null,
  decryptFile: (from, to) => fsp.copyFile(from, to, fs.constants.COPYFILE_EXCL), blobName: digest => digest });

module.exports = { deriveKey, readKeyFile, keyCheck, newEncryptionHeader, cipherFor, PLAIN, MAGIC };
