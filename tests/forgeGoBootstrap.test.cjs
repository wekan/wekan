'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
for (const [input, expected] of [['x86_64','amd64'], ['aarch64','arm64'], ['i686','386'],
  ['armv7l','armv6l'], ['ppc64el','ppc64le'], ['loongarch64','loong64'],
  ['riscv64','riscv64'], ['s390x','s390x']]) {
  const result = cp.spawnSync('bash', ['-c', '. releases/ensure-tools.sh; _forge_go_arch "$TEST_ARCH"'],
    {cwd: root, encoding: 'utf8', env: {...process.env, TEST_ARCH: input}});
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), expected);
}
if (cp.spawnSync('jq', ['--version']).status !== 0) {
  console.log('forgeGoBootstrap: architecture mappings passed; archive fixture SKIP (jq unavailable)');
  process.exit(0);
}
const temp = fs.mkdtempSync(path.join(root, '.tools/tmp/forge-go-test-'));
try {
  fs.mkdirSync(path.join(temp, 'fixture/go/bin'), {recursive:true});
  fs.writeFileSync(path.join(temp, 'fixture/go/bin/go'), '#!/bin/sh\necho "verified Go fixture"\n', {mode:0o755});
  const archive = path.join(temp, 'fixture.tar.gz');
  assert.equal(cp.spawnSync('tar', ['-czf', archive, '-C', path.join(temp, 'fixture'), 'go']).status, 0);
  const checksum = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  for (const bad of [false, true]) {
    const metadata = path.join(temp, `metadata-${bad}.json`);
    fs.writeFileSync(metadata, JSON.stringify([{stable:true,files:[{os:'linux',arch:'arm64',kind:'archive',
      filename:'go1.26.8.linux-arm64.tar.gz',sha256:bad ? '0'.repeat(64) : checksum}]}]));
    const tools = path.join(temp, `tools-${bad}`);
    const shell = `
      . releases/ensure-tools.sh
      _et_os() { echo linux; }
      uname() { echo aarch64; }
      go() { echo go1.20.0; }
      curl() {
        if [ "$1" = -fsSL ]; then cat "$TEST_METADATA";
        else cp "$TEST_ARCHIVE" "$4"; fi
      }
      ensure_forge_go
    `;
    const result = cp.spawnSync('bash', ['-c', shell], {cwd: root, encoding:'utf8',
      env:{...process.env, WEKAN_TOOLS_DIR:tools, TEST_METADATA:metadata, TEST_ARCHIVE:archive,
        TMPDIR:temp}});
    assert.equal(result.status, bad ? 1 : 0, result.stdout+result.stderr);
    const binary = path.join(tools, 'forge-go/go1.26.8.linux-arm64/go/bin/go');
    assert.equal(fs.existsSync(binary), !bad, 'checksum mismatch must prevent extraction');
    if (bad) assert.match(result.stderr, /checksum mismatch/);
    else assert.match(result.stdout, /verified Go fixture/);
  }
  console.log('forgeGoBootstrap: host architectures, old-Go bootstrap, official manifest selection and checksum rejection passed offline');
} finally { fs.rmSync(temp, {recursive:true,force:true}); }
