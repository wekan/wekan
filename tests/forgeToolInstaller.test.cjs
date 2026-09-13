'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const build = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const windows = fs.readFileSync(path.join(root, 'build.bat'), 'utf8');
const ps = fs.readFileSync(path.join(root, 'tools/install-forge-tools.ps1'), 'utf8');
const start = build.indexOf('function install_forge_tools(){');
const end = build.indexOf('\nfunction mirror_forge(){', start);
assert.ok(start >= 0 && end > start);
const installer = build.slice(start, end);
const modules = ['github.com/cli/cli/v2/cmd/gh', 'gitlab.com/gitlab-org/cli/cmd/glab',
  'gitea.dev/tea', 'github.com/git-bug/git-bug', 'github.com/git-pkgs/forge/cmd/forge'];
for (const module of modules) { assert.ok(installer.includes(module)); assert.ok(ps.includes(module)); }
assert.match(windows, /powershell.exe.*install-forge-tools\.ps1/);
assert.doesNotMatch(build + windows + ps, /go install code\.gitea\.io\/tea@|go install github\.com\/git-pkgs\/forge@/);
function run({present = '', fail = '', os = 'linux', packages = false} = {}) {
  const shell = `
+command() {
+  if [ "$1" != '-v' ]; then builtin command "$@"; return; fi
+  case " $INSTALLER_PRESENT " in
+    *" $2 "*) echo "/mock/$2"; return 0 ;;
+    *) return 1 ;;
+  esac
+}
+_et_os() { echo "$INSTALLER_OS"; }
+ensure_forge_go() { :; }
+ensure_tools() {
+  echo "PACKAGE $1"
+  case "$1" in
+    gh|glab|tea|git-bug) [ "$INSTALLER_PACKAGES" = yes ] || return 1 ;;
+  esac
+  INSTALLER_PRESENT="$INSTALLER_PRESENT $1"
+}
+go() {
+  echo "GO $*"
+  case "$2" in *"$INSTALLER_FAIL"*) [ -z "$INSTALLER_FAIL" ] || return 1 ;; esac
+  tool=\${2##*/}; tool=\${tool%@*}
+  INSTALLER_PRESENT="$INSTALLER_PRESENT $tool"
+}
+${installer}
+install_forge_tools
+`.replace(/^\+/gm, '');
  return cp.spawnSync('bash', ['-c', shell], {cwd: root, encoding: 'utf8',
    env: {...process.env, WEKAN_TOOLS_DIR: path.join(root, '.tools'), GOBIN: '',
      INSTALLER_PRESENT: present, INSTALLER_FAIL: fail, INSTALLER_OS: os,
      INSTALLER_PACKAGES: packages ? 'yes' : 'no'}});
}
const required = 'git ssh scp sftp curl jq rsync node go gh glab tea git-bug forge';
for (const os of ['linux', 'macos']) {
  const success = run({os});
  assert.equal(success.status, 0, success.stderr);
  for (const module of modules) assert.ok(success.stdout.includes(`GO install ${module}@latest`));
  for (const tool of required.split(' ')) assert.ok(success.stdout.includes(`OK ${tool}:`));
  assert.doesNotMatch(success.stdout, /MISSING/);
}
const skip = run({present: required});
assert.equal(skip.status, 0);
assert.doesNotMatch(skip.stdout, /GO install|PACKAGE/);
const packaged = run({os: 'macos', packages: true});
assert.equal(packaged.status, 0);
assert.doesNotMatch(packaged.stdout, /GO install.*(?:cli\/v2|gitlab-org|gitea.dev|git-bug)/);
for (const fail of ['gitea.dev/tea', 'git-pkgs/forge']) {
  const failure = run({fail});
  assert.equal(failure.status, 1);
  assert.match(failure.stdout, /installation failed/);
  assert.match(failure.stdout, /MISSING/);
  assert.match(failure.stdout, /GO install github\.com\/git-pkgs\/forge\/cmd\/forge@latest/);
}
assert.match(ps, /GoLang.Go/);
assert.match(ps, /Git.Git/);
assert.match(ps, /OpenSSH.Client~~~~0.0.1.0/);
assert.match(ps, /Refresh-ToolPath/);
assert.match(ps, /if \(!\(Has-Tool go\)\)/);
assert.match(ps, /if \(\$missing.Count\) \{ exit 1 \}/);
assert.equal(cp.spawnSync('bash', ['-n', path.join(root, 'build.sh')]).status, 0);
console.log('forgeToolInstaller: all mirror prerequisites, Unix/native Go fallback, Brew packages, skips, complete failure report and Windows source checks passed offline');
