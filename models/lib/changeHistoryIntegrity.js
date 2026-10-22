'use strict';

// Synchronous SHA-256 for the isomorphic history model. Importing Node's
// `crypto` here pulled crypto-browserify (and its Node-only `vm` and `stream`
// imports) into the client test bundle. Web Crypto is asynchronous, while a
// history row must be hashed before insert, so keep this small dependency-free
// implementation available on both architectures.
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotateRight(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotateRight(words[i - 15], 7) ^
        rotateRight(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rotateRight(words[i - 2], 17) ^
        rotateRight(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choice + SHA256_K[i] + words[i]) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + temp1) >>> 0, c, b, a,
        (temp1 + temp2) >>> 0];
    }
    const next = [a, b, c, d, e, f, g, h];
    for (let i = 0; i < 8; i += 1) hash[i] = (hash[i] + next[i]) >>> 0;
  }
  return [...hash].map(word => word.toString(16).padStart(8, '0')).join('');
}

const PROTECTED = [
  'boardId', 'swimlaneId', 'listId', 'cardId', 'entityType', 'entityId',
  'group', 'changeType', 'previousContent', 'newContent', 'userId', 'createdAt',
  'batchId', 'restoredFromId', 'restoredByUserId', 'previousHash',
];

function canonical(value) {
  if (value === null) return 'null';
  if (value === undefined) return '{"$undefined":true}';
  if (value instanceof Date) return JSON.stringify({ $date: value.toISOString() });
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('history contains a non-finite number');
    return JSON.stringify(value);
  }
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  throw new TypeError(`unsupported history value: ${typeof value}`);
}

function protectedHistory(row) {
  return Object.fromEntries(PROTECTED.map(key => [key, row && row[key]]));
}

// What the database keeps of a row's content. Meteor connects with
// ignoreUndefined, so an object property that is `undefined` is dropped and an
// undefined array element is stored as null. A row is hashed AS STORED, or a
// row written with `deletedAt: list.deletedAt` (undefined) read back without
// the key and failed its own checksum on every audit: a "critical" tampering
// report for a row nobody touched (Admin Panel / Problems / Security,
// HistoryIntegrity checksum-mismatch, 89472 of them).
function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function storedShape(value) {
  if (Array.isArray(value)) return value.map(item => (item === undefined ? null : storedShape(item)));
  if (!plainObject(value)) return value;
  const out = {};
  for (const key of Object.keys(value)) {
    if (value[key] !== undefined) out[key] = storedShape(value[key]);
  }
  return out;
}

function hashHistoryRow(row) {
  const shaped = protectedHistory(row);
  shaped.previousContent = storedShape(shaped.previousContent);
  shaped.newContent = storedShape(shaped.newContent);
  return sha256(canonical(shaped));
}

// Rows written before the content was hashed as stored: their hash still
// covers `"key":{"$undefined":true}` for every property that was undefined at
// write time, and the stored row has lost those keys. Such a property is one
// the other side of the change has (it was unset before, or unset after), so
// re-adding, as undefined, exactly the keys present in the other content and
// absent here reproduces what was hashed. Nothing else is accepted: a changed
// or removed real value still fails.
function legacyUndefinedVariant(row) {
  const before = row.previousContent;
  const after = row.newContent;
  if (!plainObject(before) || !plainObject(after)) return null;
  const fill = (own, other) => {
    const missing = Object.keys(other).filter(key => !(key in own));
    if (!missing.length) return own;
    const out = { ...own };
    for (const key of missing) out[key] = undefined;
    return out;
  };
  const filledBefore = fill(before, after);
  const filledAfter = fill(after, before);
  if (filledBefore === before && filledAfter === after) return null;
  return sha256(canonical({ ...protectedHistory(row), previousContent: filledBefore, newContent: filledAfter }));
}

// #6797: rows the legacy append stored through collection2's default clean
// (models/lib/historyLegacyAppend.js before HISTORY_INSERT_OPTIONS): a field
// hashed as '' was stored as null (the empty string removed, then the schema's
// defaultValue). Re-hashing with '' in place of that null reproduces what was
// hashed. Only null <-> '' is accepted, and only in these id and label fields -
// neither value is content and neither names anything - so a field that held
// any value, or any other change, still fails.
const CLEANED_EMPTY_FIELDS = ['boardId', 'swimlaneId', 'listId', 'cardId', 'group', 'batchId',
  'restoredFromId', 'restoredByUserId'];
function cleanedEmptyStringMatches(row) {
  const nulls = CLEANED_EMPTY_FIELDS.filter(key => row[key] === null || row[key] === undefined);
  // Every subset, because a field that really was null stays null: at most
  // 2^8 hashes, and only for a row that has already failed the ordinary check.
  for (let mask = 1; mask < (1 << nulls.length); mask += 1) {
    const variant = { ...row };
    nulls.forEach((key, i) => { if (mask & (1 << i)) variant[key] = ''; });
    if (hashHistoryRow(variant) === row.integrityHash) return true;
    if (legacyUndefinedVariant(variant) === row.integrityHash) return true;
  }
  return false;
}

function rowHashIsValid(row) {
  if (!row || !/^[a-f0-9]{64}$/.test(row.integrityHash || '')) return false;
  if (hashHistoryRow(row) === row.integrityHash) return true;
  if (legacyUndefinedVariant(row) === row.integrityHash) return true;
  return cleanedEmptyStringMatches(row);
}

function verifyHistoryRows(rows) {
  const list = Array.isArray(rows) ? rows.filter(row => row && row.integrityHash) : [];
  const hashes = new Map(list.map(row => [`${row.boardId}:${row.integrityHash}`, row]));
  const children = new Map();
  const firstChild = new Map();
  const roots = new Map();
  const failures = [];
  for (const row of list) {
    if (!rowHashIsValid(row)) failures.push({ row, reason: 'checksum-mismatch' });
    if (row.previousHash && !hashes.has(`${row.boardId}:${row.previousHash}`)) {
      failures.push({ row, reason: 'predecessor-missing' });
    }
    if (row.previousHash) {
      const key = `${row.boardId}:${row.previousHash}`;
      const first = firstChild.get(key);
      const count = (children.get(key) || 0) + 1;
      children.set(key, count);
      if (!first) firstChild.set(key, row);
      else failures.push({ row, reason: 'history-fork', sibling: first });
    } else {
      const count = (roots.get(row.boardId) || 0) + 1;
      roots.set(row.boardId, count);
      if (count > 1) failures.push({ row, reason: 'multiple-history-roots' });
    }
  }
  return failures;
}

// A fork whose two rows are both intact and were saved within moments of
// each other is two changes written at once - the legacy append race
// (models/lib/historyLegacyAppend.js) - not a row somebody put there later.
const CONCURRENT_FORK_MS = 60 * 1000;
function isConcurrentFork(failure, windowMs = CONCURRENT_FORK_MS) {
  if (!failure || failure.reason !== 'history-fork' || !failure.sibling) return false;
  const at = row => new Date(row.createdAt).getTime();
  const gap = Math.abs(at(failure.row) - at(failure.sibling));
  return rowHashIsValid(failure.row) && rowHashIsValid(failure.sibling) && Number.isFinite(gap) && gap <= windowMs;
}

module.exports = {
  canonical, sha256, hashHistoryRow, rowHashIsValid, verifyHistoryRows, isConcurrentFork, CONCURRENT_FORK_MS, PROTECTED,
  storedShape,
};
