'use strict';
// v13.18: Bun freebsd-x64 died in the VM's `prepare` - "pkgmir.geo.freebsd.org
// ... No route to host", "Error updating repositories!", ssh exited with code 3.
// One unreachable mirror for one moment ended a release target. Every BSD VM
// prepare that installs packages now retries, and this pins it for every
// workflow, so a new one cannot bring the single attempt back.
// Run: node --test tests/vmPrepareRetry.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const wfDir = path.join(root, '.github/workflows');

function prepares() {
  const out = [];
  for (const name of fs.readdirSync(wfDir).filter(f => /\.ya?ml$/.test(f))) {
    const wf = yaml.load(fs.readFileSync(path.join(wfDir, name), 'utf8'));
    for (const [job, def] of Object.entries(wf.jobs || {})) {
      for (const step of def.steps || []) {
        if (step.with && typeof step.with.prepare === 'string') out.push({ where: `${name} ${job}`, script: step.with.prepare });
      }
    }
  }
  return out;
}

test('every VM prepare that installs packages retries them', () => {
  const found = prepares().filter(p => /\b(pkg install|pkg_add|pkgin)\b/.test(p.script));
  assert.ok(found.length >= 4, `FreeBSD, OpenBSD, NetBSD and Bun FreeBSD (found ${found.length})`);
  for (const { where, script } of found) {
    assert.match(script, /for i in 1 2 3 4 5; do[\s\S]*&& break\n[\s\S]*\[ "\$i" = 5 \] && \{ echo "::error::[^"]+"; exit 1; \}[\s\S]*sleep[\s\S]*done/, where);
    // Negative: no install outside the loop, where a failure would still end the job.
    const outside = script.replace(/for i in[\s\S]*?\ndone\n?/g, '');
    assert.doesNotMatch(outside, /\b(pkg install|pkg_add|pkgin)\b/, where);
  }
});

test('the retry loop gives up after the last attempt, and stops at the first success', () => {
  const { script } = prepares().find(p => /pkg install -y bash python3/.test(p.script));
  const run = fails => {
    const fake = `n=0; pkg() { n=$((n+1)); echo "try $n"; [ "$n" -gt ${fails} ]; }; sleep() { :; }\n`;
    return spawnSync('sh', ['-c', fake + script], { encoding: 'utf8' });
  };
  const ok = run(2);
  assert.strictEqual(ok.status, 0, ok.stdout);
  assert.strictEqual((ok.stdout.match(/^try/gm) || []).length, 3);
  const down = run(99);
  assert.strictEqual(down.status, 1, 'a mirror that never comes back still fails the build');
  assert.strictEqual((down.stdout.match(/^try/gm) || []).length, 5);
});
