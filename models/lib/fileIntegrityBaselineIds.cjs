'use strict';

// #6898: which fileIntegrity baseline ids belong to the files WeKan is about to
// delete or move away. Decided without a database
// (tests/integrityBaselineForgottenOnDelete.test.cjs).
//
// The daily scan (server/lib/fileIntegrityScan.js) keeps one baseline per file,
// keyed by its path, and reports every baseline whose file is gone as a
// StorageBleed. Nothing removed a baseline, so every attachment or avatar WeKan
// deleted itself was reported missing on every run from then on. The deletion
// paths now forget the baselines of the files they delete; a file that vanishes
// any OTHER way keeps its baseline and still alarms, which is the point.

const path = require('path');

// The path as recorded (versions.<v>.path, or the path unlink() resolved) and
// its absolute form: the scan records path.join(<storage root>, ...), and a
// relative recorded path would otherwise never match it.
function baselineIdsFor(paths) {
  const ids = new Set();
  for (const p of [].concat(paths || [])) {
    if (typeof p !== 'string' || p === '') continue;
    ids.add(p);
    ids.add(path.resolve(p));
  }
  return [...ids];
}

// Every version path of the removed file documents.
function versionPathsOf(fileObjs) {
  const out = [];
  for (const fileObj of [].concat(fileObjs || [])) {
    const versions = fileObj && fileObj.versions;
    if (!versions || typeof versions !== 'object') continue;
    for (const name of Object.keys(versions)) {
      const p = versions[name] && versions[name].path;
      if (typeof p === 'string' && p) out.push(p);
    }
  }
  return out;
}

module.exports = { baselineIdsFor, versionPathsOf };
