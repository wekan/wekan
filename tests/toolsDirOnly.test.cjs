'use strict';

// Every file WeKan's scripts write stays in .tools/, which git and Meteor
// ignore: temporary files, downloads and release zips in .tools/tmp, Meteor in
// .tools/.meteor, Node.js in .tools/n (Linux) or .tools/nvm (macOS), the npm
// cache, Volta and the Sandstorm toolchain beside them - on Linux, macOS and
// Windows alike (releases/tools-env.sh). They used to write to /tmp, macOS's
// /var/folders, ~/Downloads, ~/Lataukset, ~/.meteor, ~/.nvm, ~/.npm, ~/.volta,
// ~/projects, and PATH lines into ~/.zshrc and ~/.bashrc - which is also what
// a sandboxed editor (Flatpak on Linux, sandbox-exec on macOS) cannot allow.
// Run: node tests/toolsDirOnly.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

function scripts() {
  const out = fs.readdirSync(root).filter(f => f.endsWith('.sh'));
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.sh$/.test(e.name) || rel === 'releases/rel.sh') out.push(rel);
    }
  };
  walk('releases');
  // sandstorm-src/build-deps.sh assembled meteor-spk in ~/projects while the
  // pack step looked in .tools/projects, so the v12.66 .spk did not pack.
  walk('sandstorm-src');
  return [...new Set(out)];
}
const code = src => src.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
// The Linux VM appliance (virtualbox/) has its own fixed /home/wekan layout.
const ELSEWHERE = /^releases\/virtualbox\//;
// A container's /tmp named on the host side - the mount point of .tools/tmp
// (-v ...:/tmp), the TMPDIR given to the container, or the container emptying
// its own /tmp - is .tools/tmp, not the container's own small /tmp.
const containerSide = c => c.split('\n')
  .filter(l => !/:\/tmp"|-e TMPDIR=\/tmp\b|exec "\$1" sh -c 'rm -rf \/tmp\//.test(l)).join('\n');

test('tools-env.sh puts each kind of file in .tools/', () => {
  const env = read('releases/tools-env.sh');
  for (const line of [
    'TMPDIR="$WEKAN_TOOLS_DIR/tmp"', 'TMP="$TMPDIR"', 'TEMP="$TMPDIR"', 'WEKAN_DOWNLOADS="$TMPDIR"',
    'METEOR_WAREHOUSE_DIR="$WEKAN_TOOLS_DIR/.meteor"', 'NVM_DIR="$WEKAN_TOOLS_DIR/nvm"',
    'npm_config_cache="$WEKAN_TOOLS_DIR/npm-cache"', 'VOLTA_HOME="$WEKAN_TOOLS_DIR/volta"',
    'WEKAN_METEOR_SPK_DIR="$WEKAN_TOOLS_DIR/projects/meteor-spk"',
  ]) assert.ok(env.includes(line), line);
  assert.doesNotMatch(code(env), /\bHOME=/, 'HOME is not moved: git needs ~/.gitconfig and ~/.ssh');
});

test('sourced, it replaces a TMPDIR that was already set, and mktemp lands in .tools/tmp', () => {
  const r = spawnSync('bash', ['-c', '. releases/tools-env.sh; printf "%s\\n%s\\n" "$TMPDIR" "$npm_config_cache"; f="$(mktemp "$TMPDIR/wekan-test.XXXXXX")"; echo "$f"; rm -f "$f"'],
    { cwd: root, encoding: 'utf8', env: { ...process.env, TMPDIR: '/var/folders/elsewhere', WEKAN_DIR: '', WEKAN_TOOLS_DIR: '' } });
  assert.strictEqual(r.status, 0, r.stderr);
  const [tmpdir, cache, made] = r.stdout.trim().split('\n');
  assert.strictEqual(tmpdir, path.join(root, '.tools', 'tmp'));
  assert.strictEqual(cache, path.join(root, '.tools', 'npm-cache'));
  assert.ok(made.startsWith(path.join(root, '.tools', 'tmp') + path.sep), made);
});

test('negative: sourcing never stops a script running under set -euo pipefail', () => {
  // With no .tools/projects/meteor-spk, `ls` failed, pipefail made that the
  // substitution's status, and set -e stopped every release script there.
  const r = spawnSync('bash', ['-c', 'set -euo pipefail; WEKAN_METEOR_SPK_DIR=; . releases/tools-env.sh; echo survived'],
    { cwd: root, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout.trim(), 'survived');
});

test('a copy of the source tree without .git gets its own .tools/tmp; scripts mounted alone do not', () => {
  // v12.66: the snap variants build from such a copy (/root/project); with no
  // .tools/tmp there, every fetch.sh stopped at "TMPDIR: unbound variable".
  const base = fs.mkdtempSync(path.join(root, '.tools', 'tmp', 'tools-env-copy-'));
  try {
    const run = dir => spawnSync('env', ['-u', 'TMPDIR', '-u', 'WEKAN_DIR', '-u', 'WEKAN_TOOLS_DIR', 'bash', '-c',
      'set -euo pipefail; . releases/tools-env.sh; echo "$TMPDIR"'], { cwd: dir, encoding: 'utf8' });
    const tree = path.join(base, 'project');
    fs.mkdirSync(path.join(tree, 'releases'), { recursive: true });
    fs.copyFileSync(path.join(root, 'releases/tools-env.sh'), path.join(tree, 'releases/tools-env.sh'));
    fs.writeFileSync(path.join(tree, 'package.json'), '{}\n');
    const r = run(tree);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(r.stdout.trim(), path.join(tree, '.tools', 'tmp'));
    // Negative: releases/ alone, as mounted into a build container, is not a
    // source tree - no .tools/ is made beside it, and no TMPDIR is invented.
    const mounted = path.join(base, 'mounted');
    fs.mkdirSync(path.join(mounted, 'releases'), { recursive: true });
    fs.copyFileSync(path.join(root, 'releases/tools-env.sh'), path.join(mounted, 'releases/tools-env.sh'));
    const m = run(mounted);
    assert.notStrictEqual(m.status, 0);
    assert.match(m.stderr, /cannot be written and no writable TMPDIR is set/);
    assert.ok(!fs.existsSync(path.join(mounted, '.tools')));
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('every script that makes temporary files names .tools/tmp, sourcing tools-env.sh', () => {
  const bad = [];
  for (const rel of scripts().filter(r => !ELSEWHERE.test(r) && r !== 'releases/tools-env.sh')) {
    const c = containerSide(code(read(rel)));
    // macOS's mktemp ignores TMPDIR without a template: one must be named.
    if (/\bmktemp(\s+-d)?\s*\)/.test(c) || /\bmktemp(\s+-d)?\s*$/m.test(c)) bad.push(`${rel}: mktemp with no template`);
    if (/(^|[\s"=(])\/tmp\b/m.test(c)) bad.push(`${rel}: /tmp`);
    // In a container the caller's mounted TMPDIR is required: ${TMPDIR:?...}.
    if (/\bmktemp\b|\$TMPDIR\b/.test(c) && !/tools-env\.sh|WEKAN_TOOLS_DIR\/tmp|WEKAN_DIR\/\.tools\/tmp|\$\{TMPDIR:\?/.test(c)) {
      bad.push(`${rel}: TMPDIR not set to .tools/tmp`);
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('no script writes to a folder in the home directory or edits a shell rc file', () => {
  const HOME_WRITE = /(~|\$HOME|\$\{HOME\})\/(\.meteor|\.npm|\.nvm|\.volta|projects|Downloads|Lataukset|Julkinen|rel\$)|>>\s*(~|\$HOME)\/\.(bash|zsh)rc/;
  const bad = scripts().filter(r => !ELSEWHERE.test(r))
    .filter(rel => HOME_WRITE.test(code(read(rel)).replace(/METEOR_BIN="\$HOME\/\.meteor\/meteor"/g, '')));
  assert.deepStrictEqual(bad, []);
});

test('workflows look for the Sandstorm toolchain where the scripts put it, in .tools', () => {
  // v12.66: the workflows put $HOME/projects/meteor-spk on PATH and zipped it
  // from there, while the scripts had moved it to .tools/projects.
  const dir = path.join(root, '.github/workflows');
  const bad = fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f))
    .filter(f => /(~|\$HOME|\$\{HOME\})\/projects\b/.test(code(read(path.join('.github/workflows', f)))));
  assert.deepStrictEqual(bad, []);
  assert.match('echo "$HOME/projects/meteor-spk/meteor-spk-0.6.0" >> "$GITHUB_PATH"', /(~|\$HOME|\$\{HOME\})\/projects\b/);
});

test('build.sh sources tools-env.sh and installs Node.js and Meteor into .tools', () => {
  const sh = read('build.sh');
  assert.match(sh, /^\. "\$WEKAN_DIR\/releases\/tools-env\.sh"$/m);
  assert.match(sh, /N_PREFIX="\$WEKAN_TOOLS_DIR\/n" npx -y n "\$_wekan_node_version"/);
  assert.match(sh, /HOME="\$WEKAN_TOOLS_DIR" npx -y meteor/);
  assert.match(sh, /install\.sh \| PROFILE=\/dev\/null bash/, 'the nvm installer edits no rc file');
  assert.doesNotMatch(code(sh), /sudo n "|>>\s*"\$rc"/);
});

test('a build container\'s /tmp is this checkout\'s .tools/tmp, never its own', () => {
  const repack = read('releases/repack-bundle-for-arch.sh');
  assert.match(repack, /-v "\$CONTAINER_TMP:\/tmp"/);
  assert.match(repack, /CONTAINER_TMP="\$TMPDIR\/repack-\$ARCH-tmp"/);
  assert.match(read('releases/install-node-for-arch.sh'), /: "\$\{TMPDIR:\?TMPDIR must be the mounted \.tools\/tmp\}"/);
  const conf = read('releases/db-conformance.sh');
  assert.match(conf, /--name "\$CONTAINER" -v "\$CONTAINER_TMP:\/tmp"/, 'every database container');
  assert.match(conf, /-v "\$FERRET2_TMP:\/tmp"/, 'and FerretDB 2');
  const env = read('releases/tools-env.sh');
  assert.doesNotMatch(code(env), /TMPDIR:-\/tmp/, 'never a /tmp fallback');
});

test('the node suites run with TMPDIR in .tools/tmp', () => {
  assert.match(read('tests/run-node-suites.cjs'), /env: SUITE_ENV,/);
  assert.match(read('tests/run-node-suites.cjs'), /TMPDIR: TOOLS_TMP, TMP: TOOLS_TMP, TEMP: TOOLS_TMP/);
});

test('Windows: tools-env.bat puts each kind of file in .tools\\, and the batch files call it', () => {
  const env = read('releases/tools-env.bat');
  for (const line of ['set "TEMP=%WEKAN_TOOLS_DIR%\\tmp"', 'set "TMP=%TEMP%"', 'set "TMPDIR=%TEMP%"',
    'set "npm_config_cache=%WEKAN_TOOLS_DIR%\\npm-cache"', 'set "npm_config_prefix=%WEKAN_TOOLS_DIR%\\npm-global"',
    'set "GOPATH=%WEKAN_TOOLS_DIR%\\gopath"', 'set "METEOR_WAREHOUSE_DIR=%WEKAN_TOOLS_DIR%\\.meteor"']) {
    assert.ok(env.includes(line), line);
  }
  assert.doesNotMatch(env, /^setlocal/im, 'the caller keeps what it sets');
  const bat = read('build.bat');
  assert.match(bat, /^call "%REPO%\\releases\\tools-env\.bat"$/m);
  assert.doesNotMatch(bat, /choco install -y nodejs/, 'Node.js is unpacked into .tools, not installed system-wide');
  assert.match(bat, /tar -xf "%TEMP%\\%WK_NODE_NAME%\.zip" -C "%WEKAN_TOOLS_DIR%"/);
  assert.match(bat, /Get-FileHash -Algorithm SHA256/, 'verified against SHASUMS256.txt first');
  assert.match(bat, /set "LOCALAPPDATA=%WEKAN_TOOLS_DIR%"\s+call npx -y meteor/, 'Meteor into .tools\\.meteor');
  // Every releases\ batch file but the bundle launchers (start-wekan.bat runs a
  // finished bundle on a user's machine, where there is no .tools\).
  for (const f of fs.readdirSync(path.join(root, 'releases')).filter(n => n.endsWith('.bat') && n !== 'tools-env.bat')) {
    assert.match(read(path.join('releases', f)), /call "%~dp0tools-env\.bat"/i, f);
  }
  assert.match(read('releases/build-bundle-win64.bat'), /SET "WORK=%TEMP%\\win64-bundle-%VERSION%"/);
});

test('negative: the checks catch what they are for', () => {
  assert.match('x="$(mktemp)"', /\bmktemp(\s+-d)?\s*\)/);
  assert.match('d="$(mktemp -d)"', /\bmktemp(\s+-d)?\s*\)/);
  assert.doesNotMatch('d="$(mktemp -d "$TMPDIR/x.XXXXXX")"', /\bmktemp(\s+-d)?\s*\)/);
  assert.match('cp a /tmp/b', /(^|[\s"=(])\/tmp\b/m);
  assert.doesNotMatch('cp a "$TMPDIR/b"', /(^|[\s"=(])\/tmp\b/m);
});

console.log(`\n${passed} tests passed`);
