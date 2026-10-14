// A single file on Windows runs its bundle from Node's virtual file system,
// mounted at the device path `\\.\NUL\vfs\<layer>` (lib/internal/vfs/router.js:
// every mount lives under os.devNull). Meteor's server converts every path to
// a "standard" `/c/...` form and back (programs/server/mini-files.js), and
// that conversion knows only drive letters: `\\.\NUL\vfs\1\bundle` became
// `/C//./NUL/vfs/1/bundle` and then `C:\\.\NUL\...`, so Npm.require looked in
// the wrong place and the server stopped with "Cannot find module 'denque'"
// (the win64 and win-arm64 single files, v12.41-v12.44). The same conversion
// breaks a bundle run from a UNC share (`\\server\share\wekan`).
//
// The patch keeps a UNC or device path (two leading separators) as `//...`
// in the standard form and turns it back into `\\...`. It changes nothing for
// a drive-letter path, and fails the build if Meteor's code is not the code
// it was written for.

export const MINI_FILES = 'bundle/programs/server/mini-files.js';

const TO_POSIX = `  if (p[0] === "\\\\" && !partialPath) {
    p = process.env.SystemDrive + p;
  }`;
const TO_POSIX_PATCHED = `  // A UNC or device path (\\\\server\\share, \\\\.\\NUL\\vfs) has no drive letter.
  if (p[0] === "\\\\" && p[1] !== "\\\\" && !partialPath) {
    p = process.env.SystemDrive + p;
  }`;

const TO_DOS = `  if (p[0] === '/' && !partialPath) {
    if (!/^\\/[A-Za-z](\\/|$)/.test(p)) throw new Error("Surprising path: " + p);`;
const TO_DOS_PATCHED = `  if (p[0] === '/' && p[1] !== '/' && !partialPath) {
    if (!/^\\/[A-Za-z](\\/|$)/.test(p)) throw new Error("Surprising path: " + p);`;

export function patchMiniFiles(source) {
  if (source.includes(TO_POSIX_PATCHED)) return source;
  for (const [anchor, what] of [[TO_POSIX, 'toPosixPath'], [TO_DOS, 'toDosPath']]) {
    if (source.split(anchor).length !== 2) {
      throw new Error(`mini-files.js: ${what} is not the code this patch was written for; check Meteor's new version (releases/single-file/meteor-device-paths.mjs)`);
    }
  }
  return source.replace(TO_POSIX, TO_POSIX_PATCHED).replace(TO_DOS, TO_DOS_PATCHED);
}
