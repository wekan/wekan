'use strict';
// Execute the actual build-menu function with offline command substitutes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const build = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const windows = fs.readFileSync(path.join(root, 'build.bat'), 'utf8');
assert.match(windows, /go install gitea\.dev\/tea@latest/);
assert.match(windows, /go install github\.com\/git-pkgs\/forge\/cmd\/forge@latest/);
assert.doesNotMatch(windows, /go install code\.gitea\.io\/tea@|go install github\.com\/git-pkgs\/forge@/);
const start = build.indexOf('function install_forge_tools(){');
const end = build.indexOf('\nfunction mirror_forge(){', start);
assert.ok(start >= 0 && end > start);
const installer = build.slice(start, end);
function run({ present = 'gh glab git-bug', fail = '' } = {}) {
  const shell = `
command() {
  if [ "$1" != '-v' ]; then return 99; fi
  case "$2" in
    dnf|go) return 0 ;;
    brew|apt|yum|apk|pacman) return 1 ;;
    *) case " $INSTALLER_PRESENT " in *" $2 "*) return 0 ;; *) return 1 ;; esac ;;
  esac
}
ensure_tools() { echo 'UNEXPECTED PACKAGE INSTALL'; return 99; }
go() {
  echo "GO $*"
  [ "$1" = install ] || return 99
  case "$2" in *"$INSTALLER_FAIL"*) [ -z "$INSTALLER_FAIL" ] ;; *) return 0 ;; esac
}
${installer}
install_forge_tools
`;
  return cp.spawnSync('bash', ['-c', shell], {cwd: root, encoding: 'utf8',
    env: {...process.env, TMPDIR: path.join(root, '.tools/tmp'),
      INSTALLER_PRESENT: present, INSTALLER_FAIL: fail}});
}
const success = run();
assert.equal(success.status, 0, success.stderr);
assert.match(success.stdout, /Detected package manager: dnf/);
assert.match(success.stdout, /GO install gitea\.dev\/tea@latest/);
assert.match(success.stdout, /GO install github\.com\/git-pkgs\/forge\/cmd\/forge@latest/);
assert.doesNotMatch(success.stdout, /code\.gitea\.io\/tea@|GO install github\.com\/git-pkgs\/forge@|UNEXPECTED PACKAGE INSTALL/);
const skip = run({present: 'gh glab tea git-bug forge'});
assert.equal(skip.status, 0);
assert.doesNotMatch(skip.stdout, /GO install/);
for (const fail of ['gitea.dev/tea', 'git-pkgs/forge']) {
  const failure = run({fail});
  assert.equal(failure.status, 1, fail);
  assert.match(failure.stdout, /installation failed/);
  assert.match(failure.stdout, /GO install github\.com\/git-pkgs\/forge\/cmd\/forge@latest/,
    'a Tea failure must not prevent attempting Forge');
}
assert.match(success.stdout, /GOBIN/);
assert.equal(cp.spawnSync('bash', ['-n', path.join(root, 'build.sh')]).status, 0);
console.log('forgeToolInstaller: current command paths, Fedora selection, installed-tool skips, failure status and continuation passed offline');
