// #6898: forget the file-integrity baselines of files WeKan itself deletes or
// moves, so the daily scan does not report them as missing forever. See
// models/lib/fileIntegrityBaselineIds.cjs.
const { baselineIdsFor, versionPathsOf } = require('/models/lib/fileIntegrityBaselineIds.cjs');

export async function forgetIntegrityBaselines(paths) {
  const ids = baselineIdsFor(paths);
  if (ids.length === 0) return 0;
  const FileIntegrity = require('/models/fileIntegrity').default;
  return FileIntegrity.removeAsync({ _id: { $in: ids } });
}

// Fire-and-forget: a delete must never fail because its bookkeeping did.
export function forgetIntegrityBaselinesSoon(paths) {
  forgetIntegrityBaselines(paths).catch(() => { /* bookkeeping only */ });
}

export function forgetIntegrityBaselinesOfFiles(fileObjs) {
  forgetIntegrityBaselinesSoon(versionPathsOf(fileObjs));
}
