// ============================================================================
// Filesystem storage integrity — the runtime half
// (design: docs/Security/Remediation/WeKan.md §13; pure half:
//  models/lib/fileIntegrity.js)
// ----------------------------------------------------------------------------
// Once a day, when the machine is not busy, walk WeKan's storage directories and
// check that every file is still the file WeKan stored: same name, same size,
// same modification time, same md5, sha256 and sha512 - and that the RECORD of
// all that still matches its ed25519 signature.
//
// Anything that does not match is recorded in Admin Panel / Problems /
// Integrity, and the finding an admin is actually being warned about is a change
// WITH NO RECORD SAYING WHY: files change when people use WeKan, and those
// changes are accounted for. A file that changed while WeKan was not looking is
// the interesting one.
//
// About ed25519. Three digests detect a file being CHANGED. They do not detect
// the baseline being changed to match - anybody who can rewrite a file can
// rewrite a row of hashes. So each baseline entry is signed, and the signature is
// verified on every scan. The key:
//
//   * WEKAN_INTEGRITY_PRIVATE_KEY (PKCS#8 PEM) - supplied by the operator and
//     never stored by WeKan. This is the configuration that means something
//     against an attacker who reaches the DATABASE as well as the disk.
//   * otherwise a key generated on first run and kept in the database. That
//     detects filesystem-only tampering, which is the common case (a restore, a
//     sync tool, a container rebuild, a shell on the volume) - and it is honest
//     about not being more than that.
//
// Everything here is best-effort and never throws into its caller: an integrity
// scan that breaks the server it is checking would be a poor trade.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import EventLog from '/models/eventLog';
import FileIntegrity, { IntegrityKeys } from '/models/fileIntegrity';

const fs = Npm.require('fs');
const path = Npm.require('path');
const crypto = Npm.require('crypto');

const {
  DIGESTS,
  PACING,
  manifestLine,
  compareEntry,
  classifyChange,
  nextStep,
  isDue,
} = require('/models/lib/fileIntegrity');
const { computeStoragePaths } = require('/models/lib/attachmentStoragePath');

// ------------------------------------------------------------------ the key

let cachedKeys = null;

async function integrityKeys() {
  if (cachedKeys) return cachedKeys;

  // An operator-supplied key is never written down by WeKan.
  const supplied = process.env.WEKAN_INTEGRITY_PRIVATE_KEY;
  if (supplied) {
    try {
      const privateKey = crypto.createPrivateKey(supplied);
      cachedKeys = { privateKey, publicKey: crypto.createPublicKey(privateKey), source: 'env' };
      return cachedKeys;
    } catch (e) {
      // A malformed key must not silently fall back to a generated one: that
      // would look like it is working while checking nothing the operator meant.
      record({
        severity: 'high',
        category: 'integrity',
        action: 'failed',
        detail: 'WEKAN_INTEGRITY_PRIVATE_KEY is set but could not be read as a private key',
      });
      return null;
    }
  }

  const stored = await IntegrityKeys.findOneAsync({ _id: 'ed25519' });
  if (stored && stored.privateKeyPem) {
    const privateKey = crypto.createPrivateKey(stored.privateKeyPem);
    cachedKeys = { privateKey, publicKey: crypto.createPublicKey(privateKey), source: 'database' };
    return cachedKeys;
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  await IntegrityKeys.upsertAsync(
    { _id: 'ed25519' },
    {
      $set: {
        privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
        publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
        createdAt: new Date(),
      },
    },
  );
  cachedKeys = { privateKey, publicKey, source: 'database' };
  return cachedKeys;
}

function sign(keys, line) {
  if (!keys) return '';
  return crypto.sign(null, Buffer.from(line, 'utf8'), keys.privateKey).toString('base64');
}

function verify(keys, line, signature) {
  if (!keys || !signature) return false;
  try {
    return crypto.verify(null, Buffer.from(line, 'utf8'), keys.publicKey,
      Buffer.from(signature, 'base64'));
  } catch (e) {
    return false;
  }
}

// --------------------------------------------------------------- the digests

/**
 * md5, sha256 and sha512 in ONE pass over the file. Three passes would be three
 * times the disk read for the same bytes, which is the opposite of what a
 * background scan should do.
 */
function digestFile(filePath) {
  return new Promise(resolve => {
    const hashes = {};
    DIGESTS.forEach(name => { hashes[name] = crypto.createHash(name); });

    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => DIGESTS.forEach(name => hashes[name].update(chunk)));
    stream.on('error', () => resolve(null));
    stream.on('end', () => {
      const out = {};
      DIGESTS.forEach(name => { out[name] = hashes[name].digest('hex'); });
      resolve(out);
    });
  });
}

// ---------------------------------------------------------------- reporting

function record(evt) {
  try {
    const p = EventLog.insertAsync({
      stream: 'integrity',
      at: new Date(),
      severity: evt.severity || 'info',
      category: evt.category || 'integrity',
      bleed: evt.bleed || 'StorageBleed',
      action: evt.action || 'detected',
      source: evt.source || 'integrity-scan',
      detail: String(evt.detail || '').slice(0, 500),
      count: evt.count || 1,
    });
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('integrity record failed:', e && e.message);
  }
}

// ----------------------------------------------------------------- the scan

const sleep = ms => new Promise(resolve => Meteor.setTimeout(resolve, ms));

/** Current CPU load, 0-100, or NaN when it cannot be read. */
function cpuPercent() {
  try {
    const { currentCpuPercent } = require('/server/lib/cpuMonitor');
    if (typeof currentCpuPercent === 'function') return Number(currentCpuPercent());
  } catch (e) { /* the monitor is optional */ }
  return NaN;
}

function listFiles(root) {
  const out = [];
  const walk = dir => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    entries.forEach(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(full);
    });
  };
  walk(root);
  return out;
}

/**
 * Did WeKan itself touch this file around when it changed? An attachment that a
 * user replaced has a modified document; one that changed with nothing to show
 * for it is the finding.
 */
async function hasRecentRecord(filePath, observedMtimeMs) {
  try {
    const Attachments = require('/models/attachments').default;
    const Avatars = require('/models/avatars').default;
    const WINDOW_MS = 10 * 60 * 1000;
    const near = new Date(observedMtimeMs - WINDOW_MS);

    for (const collection of [Attachments, Avatars]) {
      const doc = await collection.collection.findOneAsync({
        'versions.original.path': filePath,
      });
      if (!doc) continue;
      const touched = doc.updatedAt || doc.meta?.updatedAt || doc.versions?.original?.updatedAt;
      if (touched && new Date(touched) >= near) return true;
      // A file WeKan knows about, whose document has no timestamp to compare,
      // is treated as explained: the alternative is warning about every file on
      // an instance that never set one.
      if (!touched) return true;
    }
  } catch (e) { /* on any doubt, prefer reporting: an unexplained change is the point */ }
  return false;
}

/** One pass. Returns a short summary for the caller and the log. */
export async function runIntegrityScan(options = {}) {
  const started = Date.now();
  const keys = await integrityKeys();
  const paths = computeStoragePaths(process.env.WRITABLE_PATH);
  const roots = [paths.attachments, paths.avatars].filter(Boolean);

  let checked = 0;
  let findings = 0;
  let unexplained = 0;
  let stoppedEarly = '';

  const seen = new Set();

  for (const root of roots) {
    for (const filePath of listFiles(root)) {
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch (e) {
        continue;
      }

      const step = nextStep(
        { cpuPercent: cpuPercent(), elapsedMs: Date.now() - started, fileSize: stat.size },
        options.pacing || PACING,
      );
      if (step.action === 'stop') {
        stoppedEarly = step.reason;
        break;
      }
      await sleep(step.pauseMs);

      seen.add(filePath);
      checked += 1;

      const digests = await digestFile(filePath);
      if (!digests) continue;   // unreadable right now; not a finding on its own

      const observed = { path: filePath, size: stat.size, mtimeMs: stat.mtimeMs, digests };
      const baseline = await FileIntegrity.findOneAsync({ _id: filePath });

      if (!baseline) {
        // First sight of a file: record the baseline rather than warning. A new
        // instance would otherwise report every file it has.
        await storeBaseline(keys, observed);
        continue;
      }

      const signatureValid = verify(keys, manifestLine(baseline), baseline.signature);
      const result = compareEntry(baseline, observed, { signatureValid });
      if (result.length === 0) continue;

      findings += 1;
      const explained = await hasRecentRecord(filePath, stat.mtimeMs);
      const verdict = classifyChange(result, explained);
      if (!verdict.explained) unexplained += 1;

      record({
        severity: verdict.severity,
        action: verdict.explained ? 'detected' : 'blocked',
        // The file's NAME, never its contents, and never the digests
        // themselves - an admin needs to know which file, not to read it here.
        detail: `${path.basename(filePath)}: ${verdict.summary}`,
      });

      // Re-baseline an EXPLAINED change so it is reported once, not every day.
      // An unexplained one is deliberately left, so it keeps showing until
      // somebody looks at it.
      if (verdict.explained) await storeBaseline(keys, observed);
    }
    if (stoppedEarly) break;
  }

  // Files that were recorded and are no longer there. Only when the scan
  // completed: a run that stopped early has not looked everywhere, and
  // reporting the rest as missing would be a lie.
  if (!stoppedEarly) {
    const gone = await FileIntegrity.find(
      { _id: { $nin: [...seen] } },
      { fields: { _id: 1 } },
    ).fetchAsync();
    for (const doc of gone) {
      const verdict = classifyChange(compareEntry({ path: doc._id }, null), false);
      unexplained += 1;
      record({
        severity: verdict.severity,
        action: 'blocked',
        detail: `${path.basename(doc._id)}: ${verdict.summary}`,
      });
      await FileIntegrity.removeAsync({ _id: doc._id });
    }
  }

  const summary = {
    checked,
    findings,
    unexplained,
    ms: Date.now() - started,
    stoppedEarly,
    keySource: keys ? keys.source : 'none',
  };

  record({
    severity: unexplained ? 'high' : 'info',
    action: 'detected',
    source: 'integrity-scan-summary',
    detail:
      `checked ${checked} files in ${Math.round(summary.ms / 1000)}s; ` +
      `${findings} changed, ${unexplained} with no record saying why` +
      (stoppedEarly ? `; stopped early: ${stoppedEarly}` : ''),
  });

  return summary;
}

async function storeBaseline(keys, observed) {
  const entry = {
    path: observed.path,
    size: observed.size,
    mtimeMs: observed.mtimeMs,
    digests: observed.digests,
  };
  await FileIntegrity.upsertAsync(
    { _id: observed.path },
    { $set: { ...entry, signature: sign(keys, manifestLine(entry)), at: new Date() } },
  );
}

// ------------------------------------------------------------- the schedule

const CHECK_EVERY_MS = 60 * 60 * 1000;   // look at the clock hourly; run daily

if (Meteor.isServer && process.env.WEKAN_INTEGRITY_SCAN !== 'false') {
  Meteor.startup(() => {
    Meteor.setInterval(async () => {
      try {
        const last = await IntegrityKeys.findOneAsync({ _id: 'lastRun' });
        if (!isDue(last && last.at && new Date(last.at).getTime(), Date.now())) return;
        if (Number(cpuPercent()) >= PACING.maxCpuPercent) return;  // try again next hour

        await IntegrityKeys.upsertAsync({ _id: 'lastRun' }, { $set: { at: new Date() } });
        await runIntegrityScan();
      } catch (e) {
        if (process.env.DEBUG === 'true') console.warn('integrity scan failed:', e && e.message);
      }
    }, CHECK_EVERY_MS);
  });
}

export default { runIntegrityScan };
