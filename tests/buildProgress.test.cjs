'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../build.sh'), 'utf8');
const start = source.indexOf('function build_stage(){');
const helper = source.slice(start, source.indexOf('\n}\n', start) + 3);
function run(command, observe) {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-c', helper + '\n' + command]);
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
      output += chunk;
      if (observe) observe(output);
    });
    child.on('error', reject);
    child.on('close', code => resolve({ code, output }));
  });
}
test('quiet builds announce their stage immediately and report elapsed progress', async () => {
  const started = Date.now(); let first;
  const result = await run('build_stage "Compile fixture" bash -c "sleep 16"', output => {
    if (first === undefined && output.includes('==> Compile fixture')) first = Date.now();
  });
  assert.ok(first - started < 2000, 'stage must appear before the quiet command completes');
  assert.equal(result.code, 0);
  assert.match(result.output, /Compile fixture: still running \(\d+s; PID \d+\)/);
  assert.match(result.output, /finished \(\d+s; exit 0\)/);
});
test('stage failures preserve stderr and prevent subsequent required stages', async () => {
  const result = await run('build_stage "Install fixture" bash -c "echo broken >&2; exit 7" || exit $?; echo SHOULD_NOT_RUN');
  assert.equal(result.code, 7);
  assert.match(result.output, /broken/);
  assert.match(result.output, /exit 7/);
  assert.doesNotMatch(result.output, /SHOULD_NOT_RUN/);
});
test('all expensive build stages share the timestamped log stream', () => {
  const at = source.indexOf('===== wekan build started');
  const flow = source.slice(at, source.indexOf('local rc="${PIPESTATUS[0]}"', at));
  for (const label of ['Remove dependencies and build caches', 'Compile app to resolve Meteor plugin npm dependencies', 'Install npm dependencies', 'Compile Meteor development bundle']) assert.ok(flow.includes(label));
  assert.match(flow, /2>&1 \| tee -a "\$\{buildlogs\[@\]\}"/);
  assert.match(flow, /meteor npm install \|\| return \$\?/);
});

test('build prints exact commands and enables supported npm and Meteor diagnostics', async () => {
  const result = await run('build_stage "Output fixture" bash -c "echo stdout; echo stderr >&2"');
  assert.equal(result.code, 0);
  assert.match(result.output, /Command: bash -c/);
  assert.match(result.output, /stdout/);
  assert.match(result.output, /stderr/);
  assert.match(source, /export npm_config_loglevel=verbose npm_config_foreground_scripts=true/);
  assert.match(source, /export METEOR_PROFILE=/);
  assert.match(source, /meteor build \.build --directory --verbose/);
  assert.doesNotMatch(source, /meteor update --npm --verbose/, 'update has no supported verbose option');
});
