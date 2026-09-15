'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '../releases/docker-build.sh'), 'utf8');
const stage = source.slice(source.indexOf('${DOCKER} buildx build \\', source.indexOf('=== Step 3:')),
  source.indexOf('echo "=== Step 4:'));
assert.match(stage, /-t wekanteam\/wekan:v\$\{VERSION\}/);
assert.match(stage, /-t ghcr\.io\/wekan\/wekan:v\$\{VERSION\}/);
assert.doesNotMatch(stage.match(/\$\{DOCKER\} buildx build[\s\S]*?\n  \./)[0], /-t quay\.io\//);

function run(buildExit, copyExit, copyMessage) {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-local-docker-test-'));
  try {
    const docker = path.join(dir, 'docker');
    fs.writeFileSync(docker, '#!/bin/sh\ncase "$2" in\n  build) exit "$MOCK_BUILD_EXIT" ;;\n  imagetools) printf "%s\\n" "$MOCK_COPY_MESSAGE"; exit "$MOCK_COPY_EXIT" ;;\nesac\nexit 99\n', { mode: 0o755 });
    return spawnSync('bash', ['-euo', 'pipefail', '-c', stage], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, DOCKER: 'docker',
        VERSION: '11.80', MOCK_BUILD_EXIT: String(buildExit),
        MOCK_COPY_EXIT: String(copyExit), MOCK_COPY_MESSAGE: copyMessage },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

assert.equal(run(0, 0, 'copied').status, 0);
assert.equal(run(0, 1, 'denied: System is currently read-only. Pulls will succeed but all write operations are currently suspended.').status, 0);
assert.equal(run(0, 1, 'unauthorized').status, 1);
assert.equal(run(1, 0, 'copied').status, 1);
