'use strict';

// ============================================================================
// Filesystem storage integrity — the pure half
// (design: docs/Security/Remediation/WeKan.md §13)
// ----------------------------------------------------------------------------
// WeKan's attachments and avatars live as files under WRITABLE_PATH, and the
// database holds one document per file. Nothing checks that the two still agree.
// A file can be replaced, truncated, back-dated or deleted by anything that
// reaches the filesystem - a bad restore, a sync tool, a container rebuild, or
// somebody who got in - and WeKan would keep serving whatever is there now.
//
// So a BASELINE is recorded per file (name, size, modification time, and three
// digests), signed, and re-checked. What makes a finding worth an admin's
// attention is not that a file changed - files change when people edit
// boards - but that it changed WITH NO RECORD SAYING WHY.
//
// This file is pure: no filesystem, no database, no clock, no crypto. It is
// given what was recorded and what was observed and says what that means, so it
// is unit tested with plain Node (tests/fileIntegrity.test.cjs). The scanning,
// the digests and the signature are server/lib/fileIntegrityScan.js.
// ============================================================================

// The digests kept per file. Three, not one, because they answer different
// questions:
//
//   md5     - fast, and what most other tools print, so an admin can compare
//             against a backup with the tool they already use. Broken for
//             collision RESISTANCE, which is why it is never alone here.
//   sha256  - the working digest.
//   sha512  - a second, different-width digest. Two independent digests
//             disagreeing about the same bytes means something is wrong with
//             the READING (a failing disk, a truncated copy), not merely with
//             the file - and that is a different problem from a substitution.
const DIGESTS = ['md5', 'sha256', 'sha512'];

// What a finding can be. Ordered from "the file is gone" to "somebody re-signed
// the record", which is roughly increasing seriousness.
const FINDINGS = {
  MISSING: 'missing',              // recorded, and not on disk any more
  UNTRACKED: 'untracked',          // on disk, and never recorded
  SIZE: 'size-changed',
  MTIME: 'mtime-changed',
  CONTENT: 'content-changed',      // every digest changed: different bytes
  DIGEST_DISAGREE: 'digests-disagree', // some digests changed and some did not
  SIGNATURE: 'signature-invalid',  // the RECORD was tampered with
};

const SEVERITY = {
  [FINDINGS.MISSING]: 'high',
  [FINDINGS.UNTRACKED]: 'low',
  [FINDINGS.SIZE]: 'medium',
  [FINDINGS.MTIME]: 'low',
  [FINDINGS.CONTENT]: 'high',
  [FINDINGS.DIGEST_DISAGREE]: 'critical',
  [FINDINGS.SIGNATURE]: 'critical',
};

/**
 * The exact bytes that get signed for one baseline entry.
 *
 * Canonical and explicit: a fixed field order, a separator that cannot appear
 * in any field, and no JSON (whose key order and escaping are not guaranteed
 * stable across versions). If this string is not reproducible byte for byte,
 * every signature verification fails a year from now for no reason.
 *
 * @param {object} entry
 * @return {string}
 */
function manifestLine(entry) {
  const e = entry || {};
  const digests = DIGESTS.map(name => `${name}=${(e.digests && e.digests[name]) || ''}`);
  return [
    `path=${e.path || ''}`,
    `size=${Number.isFinite(e.size) ? e.size : ''}`,
    // Milliseconds since the epoch, as an integer: a formatted date is a
    // locale and a timezone away from being unstable.
    `mtime=${Number.isFinite(e.mtimeMs) ? Math.floor(e.mtimeMs) : ''}`,
    ...digests,
  ].join('\n');
}

/**
 * Compare one recorded baseline against what was just observed.
 *
 * @param {object|null} baseline what was recorded (null = never recorded)
 * @param {object|null} observed what is on disk now (null = not there)
 * @param {object} [options]
 * @param {boolean} [options.signatureValid=true] result of verifying the
 *        baseline's own signature; false means the RECORD was edited
 * @return {Array<{finding: string, severity: string, detail: string}>}
 */
function compareEntry(baseline, observed, options = {}) {
  const findings = [];

  if (options.signatureValid === false) {
    findings.push({
      finding: FINDINGS.SIGNATURE,
      severity: SEVERITY[FINDINGS.SIGNATURE],
      detail: 'the recorded baseline does not match its signature',
    });
  }

  if (!baseline && !observed) return findings;

  if (baseline && !observed) {
    findings.push({
      finding: FINDINGS.MISSING,
      severity: SEVERITY[FINDINGS.MISSING],
      detail: 'a recorded file is no longer on disk',
    });
    return findings;
  }

  if (!baseline && observed) {
    findings.push({
      finding: FINDINGS.UNTRACKED,
      severity: SEVERITY[FINDINGS.UNTRACKED],
      detail: 'a file is in the storage directory that WeKan never stored',
    });
    return findings;
  }

  // Digests first: they are what actually decides whether the bytes changed.
  const changed = DIGESTS.filter(name => {
    const was = baseline.digests && baseline.digests[name];
    const now = observed.digests && observed.digests[name];
    // A digest that was never recorded, or was not computed now, says nothing.
    return was && now && was !== now;
  });
  const compared = DIGESTS.filter(name => {
    const was = baseline.digests && baseline.digests[name];
    const now = observed.digests && observed.digests[name];
    return was && now;
  });

  if (changed.length && changed.length === compared.length) {
    findings.push({
      finding: FINDINGS.CONTENT,
      severity: SEVERITY[FINDINGS.CONTENT],
      detail: `the file's contents changed (${changed.join(', ')})`,
    });
  } else if (changed.length) {
    // Two digests over the same bytes cannot disagree. If they do, the bytes
    // were not read the same way twice - a failing disk, a partial write, a
    // truncated copy - or somebody updated one digest and not the others.
    findings.push({
      finding: FINDINGS.DIGEST_DISAGREE,
      severity: SEVERITY[FINDINGS.DIGEST_DISAGREE],
      detail: `digests disagree: ${changed.join(', ')} changed, ` +
        `${compared.filter(n => !changed.includes(n)).join(', ')} did not`,
    });
  }

  if (Number.isFinite(baseline.size) && Number.isFinite(observed.size) &&
      baseline.size !== observed.size) {
    findings.push({
      finding: FINDINGS.SIZE,
      severity: SEVERITY[FINDINGS.SIZE],
      detail: `size ${baseline.size} → ${observed.size} bytes`,
    });
  }

  // A modification time that moved while the contents did not is worth a low
  // note and nothing more: a copy, a restore or a backup tool does it. A time
  // that moved BACKWARDS is different - nothing does that by accident - so it
  // is called out even though it is the same finding.
  if (Number.isFinite(baseline.mtimeMs) && Number.isFinite(observed.mtimeMs) &&
      Math.floor(baseline.mtimeMs) !== Math.floor(observed.mtimeMs)) {
    const backwards = observed.mtimeMs < baseline.mtimeMs;
    findings.push({
      finding: FINDINGS.MTIME,
      severity: backwards ? 'medium' : SEVERITY[FINDINGS.MTIME],
      detail: backwards
        ? 'the modification time moved BACKWARDS'
        : 'the modification time changed',
    });
  }

  return findings;
}

/**
 * Was this change EXPLAINED?
 *
 * A file changing is ordinary; WeKan changes files when people use it. What is
 * not ordinary is a change with nothing in the record to account for it, and
 * that is the finding an admin is actually being warned about.
 *
 * @param {Array} findings from compareEntry
 * @param {boolean} hasRecentRecord did WeKan record an operation on this file
 *        around the time it changed?
 * @return {{explained: boolean, severity: string, summary: string}}
 */
function classifyChange(findings, hasRecentRecord) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return { explained: true, severity: 'info', summary: 'unchanged' };
  }

  const worst = findings.reduce((acc, f) => {
    const order = ['info', 'low', 'medium', 'high', 'critical'];
    return order.indexOf(f.severity) > order.indexOf(acc) ? f.severity : acc;
  }, 'info');

  // A tampered RECORD is never explained by an ordinary operation: WeKan does
  // not rewrite a baseline without re-signing it.
  const signature = findings.some(f => f.finding === FINDINGS.SIGNATURE);

  if (hasRecentRecord && !signature) {
    return {
      explained: true,
      severity: 'info',
      summary: `${findings.map(f => f.finding).join(', ')} — WeKan has a record of this`,
    };
  }

  return {
    explained: false,
    // An unexplained change is at least a medium: the point of the scan is that
    // nobody knows why it happened.
    severity: worst === 'low' || worst === 'info' ? 'medium' : worst,
    summary: `${findings.map(f => f.finding).join(', ')} — with no record saying why`,
  };
}

// ---------------------------------------------------------------- the pacing
//
// The scan reads every stored byte, which on a busy instance is the last thing
// that should compete with users. So it is paced by policy rather than by hope:
// skip entirely while the machine is busy, sleep between files, and stop after
// a budget rather than running to completion at any cost.

const PACING = {
  // Above this, do not start and do not continue. The scan is never urgent.
  maxCpuPercent: 60,
  // Between files. Small, but it is what turns a tight read loop into a
  // background trickle.
  pauseMsPerFile: 50,
  // ...and proportional to the file, so a directory of large files does not
  // become a sustained read.
  pauseMsPerMegabyte: 20,
  // Stop after this long and continue tomorrow. A scan that never finishes is
  // better than a scan that holds a machine down.
  maxRunMs: 15 * 60 * 1000,
  // How long between runs. Once a day.
  intervalMs: 24 * 60 * 60 * 1000,
};

/**
 * What to do before reading the next file.
 * @param {object} state
 * @param {number} state.cpuPercent current CPU load, 0-100
 * @param {number} state.elapsedMs how long this run has been going
 * @param {number} state.fileSize the next file's size in bytes
 * @param {object} [pacing] overrides for the constants above
 * @return {{action: 'stop'|'pause'|'go', pauseMs: number, reason: string}}
 */
function nextStep(state = {}, pacing = PACING) {
  const cpu = Number(state.cpuPercent);
  const elapsed = Number(state.elapsedMs) || 0;
  const size = Number(state.fileSize) || 0;

  if (elapsed >= pacing.maxRunMs) {
    return { action: 'stop', pauseMs: 0, reason: 'this run has used its time; continuing next time' };
  }

  if (Number.isFinite(cpu) && cpu >= pacing.maxCpuPercent) {
    return { action: 'stop', pauseMs: 0, reason: `CPU at ${Math.round(cpu)}%; not competing with users` };
  }

  const megabytes = size / (1024 * 1024);
  const pauseMs = Math.round(pacing.pauseMsPerFile + megabytes * pacing.pauseMsPerMegabyte);
  return { action: 'pause', pauseMs, reason: '' };
}

/** Is it time for another run? */
function isDue(lastRunAtMs, nowMs, pacing = PACING) {
  const last = Number(lastRunAtMs);
  const now = Number(nowMs);
  // `Number(null)` is 0, which is finite - so an unreadable clock would have
  // read as "the epoch" and started a scan. A clock this side of 1970 is not a
  // clock, and a scan is never urgent enough to run on a guess.
  if (!Number.isFinite(now) || now <= 0) return false;
  if (!Number.isFinite(last) || last <= 0) return true;
  return now - last >= pacing.intervalMs;
}

module.exports = {
  DIGESTS,
  FINDINGS,
  SEVERITY,
  PACING,
  manifestLine,
  compareEntry,
  classifyChange,
  nextStep,
  isDue,
};
