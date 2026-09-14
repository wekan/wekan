const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const source = fs.readFileSync('build.sh', 'utf8');
const ready = source.slice(source.indexOf('function git_operation_ready(){'), source.indexOf('function git_pull(){'));
for (const state of ['rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'index.lock']) {
  test(`existing ${state} stops the menu before remote operations`, () => {
    const result = spawnSync('bash', ['-c', `${ready}
      git() { case "$*" in "rev-parse --git-path ${state}") echo build.sh;; "rev-parse --git-path "*) echo .tools/tmp/nonexistent-git-menu-state;; *) echo main;; esac; }
      git_operation_ready
    `], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stdout, new RegExp(state));
  });
}
test('clean branch permits operation and cleanup failures cannot claim success', () => {
  const result = spawnSync('bash', ['-c', `${ready}
    git() { case "$*" in "rev-parse --git-path "*) echo .tools/tmp/nonexistent-git-menu-state;; *) echo main;; esac; }
    git_operation_ready
  `], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(source, /merge --no-edit/);
  assert.match(source, /git stash store -m 'Recovered build.sh interrupted pull autostash'/);
  assert.match(source, /git_recover_orphan_autostash \|\| return 1/);
  assert.match(source, /merge.autoStash=true merge --ff-only/);
  assert.doesNotMatch(source, /git fetch origin "\$branch" >\/dev\/null 2>&1 \|\| true/);
});
