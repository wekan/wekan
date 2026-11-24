// ATTACHMENTS_PASSPHRASE (docs/Compliance/README.md P3; [GDPR] Art. 32(1)(a),
// [HIPAA] § 164.312(a)(2)(iv)): attachments stored on this server's disk,
// encrypted by WeKan itself. Admin Panel / Attachments / Encrypt - shown only
// while the passphrase is set - encrypts or decrypts the existing ones and
// turns encryption of new uploads on; the URL of every attachment stays the
// same, because they are decrypted as they are read
// (models/lib/fileStoreStrategy.js FileStoreStrategyFilesystem.getReadStream).
//
// AES-256-CTR, so a download can start anywhere in the file (HTTP Range: a
// video, a large PDF): the counter for any byte is the IV plus its block. The
// file is
//
//   WKATT1\n | salt (16) | iv (16) | ciphertext (as long as the plain file)
//
// The key is made from the passphrase with scrypt, once per salt and kept in
// memory, because a key stretched for every read of a video would be a second
// per range request. A file that does not start with the header is plain and
// is read as before, so files written before encryption was turned on - or
// restored from a backup - keep working. Integrity of the stored bytes is the
// filesystem integrity scan's (server/lib/fileIntegrityScan.js), which signs
// what is on the disk; this is confidentiality.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const MAGIC = Buffer.from('WKATT1\n');
const SALT = 16;
const IV = 16;
const HEADER = MAGIC.length + SALT + IV;
const BLOCK = 16;
const MIN_PASSPHRASE = 16;

function attachmentsPassphrase(env = { ATTACHMENTS_PASSPHRASE: process.env.ATTACHMENTS_PASSPHRASE }) {
  const p = String((env && env.ATTACHMENTS_PASSPHRASE) || '');
  return p.length >= MIN_PASSPHRASE ? p : '';
}

const keys = new Map();
function keyFor(passphrase, salt) {
  // Kept in this process's memory only, so the passphrase itself can be part
  // of the key of the cache; it is never hashed or stored.
  const id = `${salt.toString('hex')}\0${passphrase}`;
  if (!keys.has(id)) {
    if (keys.size > 64) keys.clear();
    keys.set(id, crypto.scryptSync(String(passphrase).normalize('NFC'), salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
  }
  return keys.get(id);
}

// One salt per server process for what it encrypts, so its key is made once.
let processSalt = null;
function saltForNewFiles() {
  if (!processSalt) processSalt = crypto.randomBytes(SALT);
  return processSalt;
}

// The IV of the block that holds byte `offset`: CTR counts in 16-byte blocks.
function ivAt(iv, offset) {
  const counter = Buffer.from(iv);
  let carry = BigInt(Math.floor(offset / BLOCK));
  for (let i = counter.length - 1; i >= 0 && carry > 0n; i -= 1) {
    const sum = BigInt(counter[i]) + (carry & 0xffn);
    counter[i] = Number(sum & 0xffn);
    carry = (carry >> 8n) + (sum >> 8n);
  }
  return counter;
}

async function readHeader(file) {
  const handle = await fsp.open(file, 'r');
  try {
    const head = Buffer.alloc(HEADER);
    const { bytesRead } = await handle.read(head, 0, HEADER, 0);
    if (bytesRead < MAGIC.length || !head.subarray(0, MAGIC.length).equals(MAGIC)) return null;
    if (bytesRead < HEADER) throw new Error('attachment-encryption-truncated');
    return { salt: head.subarray(MAGIC.length, MAGIC.length + SALT), iv: head.subarray(MAGIC.length + SALT) };
  } finally {
    await handle.close();
  }
}

function readHeaderSync(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(HEADER);
    const bytesRead = fs.readSync(fd, head, 0, HEADER, 0);
    if (bytesRead < MAGIC.length || !head.subarray(0, MAGIC.length).equals(MAGIC)) return null;
    if (bytesRead < HEADER) throw new Error('attachment-encryption-truncated');
    return { salt: head.subarray(MAGIC.length, MAGIC.length + SALT), iv: head.subarray(MAGIC.length + SALT) };
  } finally {
    fs.closeSync(fd);
  }
}

async function isEncryptedFile(file) {
  try { return !!(await readHeader(file)); } catch (e) { return false; }
}

// The plain bytes of a stored file - all of it, or { start, end } (inclusive,
// as fs.createReadStream takes them) - whether it is encrypted or not.
function createPlainReadStream(file, range) {
  const header = readHeaderSync(file);
  const opts = range && Number.isFinite(range.start) ? { start: range.start, end: range.end } : {};
  if (!header) return fs.createReadStream(file, opts);
  const passphrase = attachmentsPassphrase();
  if (!passphrase) {
    const error = new Error('This attachment is encrypted: set ATTACHMENTS_PASSPHRASE to read it.');
    error.code = 'attachment-encryption-passphrase';
    throw error;
  }
  const start = opts.start || 0;
  const blockStart = start - (start % BLOCK);
  const decipher = crypto.createDecipheriv('aes-256-ctr', keyFor(passphrase, header.salt), ivAt(header.iv, blockStart));
  let skip = start - blockStart;
  const source = fs.createReadStream(file, {
    start: HEADER + blockStart,
    ...(Number.isFinite(opts.end) ? { end: HEADER + opts.end } : {}),
  });
  const out = new Transform({
    transform(chunk, encoding, done) {
      let plain = decipher.update(chunk);
      if (skip) { const s = Math.min(skip, plain.length); plain = plain.subarray(s); skip -= s; }
      done(null, plain);
    },
  });
  source.on('error', error => out.destroy(error));
  return source.pipe(out);
}

// Encrypt a plain stored file in place: written beside it, then renamed over
// it, so a crash leaves either the old file or the new one, never half.
async function encryptFileInPlace(file, passphrase = attachmentsPassphrase()) {
  if (!passphrase) throw new Error('attachment-encryption-no-passphrase');
  if (await readHeader(file)) return false;
  const salt = saltForNewFiles();
  const iv = crypto.randomBytes(IV);
  const cipher = crypto.createCipheriv('aes-256-ctr', keyFor(passphrase, salt), iv);
  const tmp = `${file}.encrypting-${process.pid}`;
  const out = fs.createWriteStream(tmp, { flags: 'wx', mode: 0o600 });
  out.write(Buffer.concat([MAGIC, salt, iv]));
  try {
    await pipeline(fs.createReadStream(file), cipher, out);
    await fsp.rename(tmp, file);
  } catch (error) {
    await fsp.rm(tmp, { force: true });
    throw error;
  }
  return true;
}

async function decryptFileInPlace(file) {
  if (!(await readHeader(file))) return false;
  const tmp = `${file}.decrypting-${process.pid}`;
  try {
    await pipeline(createPlainReadStream(file), fs.createWriteStream(tmp, { flags: 'wx', mode: 0o600 }));
    await fsp.rename(tmp, file);
  } catch (error) {
    await fsp.rm(tmp, { force: true });
    throw error;
  }
  return true;
}

module.exports = {
  MAGIC, HEADER, MIN_PASSPHRASE, attachmentsPassphrase, isEncryptedFile, createPlainReadStream,
  encryptFileInPlace, decryptFileInPlace, ivAt,
};
