'use strict';

// v12.29's build-win64 died before building anything, in "Install 7-zip":
//
//   Failed to fetch results from V2 feed at 'https://community.chocolatey.org/
//   api/v2/Packages(Id='7zip.install',Version='26.4.0')' ... 504 (Gateway Timeout)
//   '7zip.install 26.3.0' is not compatible with '7zip 26.4.0 constraint'
//
// windows-latest already has 7-Zip, so the three Windows bundle jobs use the
// runner's copy and fall back to Chocolatey, with retries, only when an image
// lacks it. These tests pin that, and that no workflow goes back to depending on
// community.chocolatey.org for a tool the image already has.
// Run: node tests/releaseWindows7zip.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const yaml = require('js-yaml');
const workflow = yaml.load(fs.readFileSync(path.join(ROOT, '.github/workflows/release-all.yml'), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('releaseWindows7zip:');

const JOBS = ['build-win64', 'build-win-arm64', 'build-win32'];

for (const job of JOBS) {
  test(`${job} uses the runner's 7-Zip before anything else`, () => {
    const steps = workflow.jobs[job].steps;
    const step = steps.find((s) => s.name === "Use the runner's 7-Zip");
    assert.ok(step, 'the 7-Zip step is there');
    assert.strictEqual(step.shell, 'pwsh');
    const run = step.run;
    const found = run.indexOf('Get-Command 7z');
    const choco = run.indexOf('choco install');
    assert.ok(found !== -1 && run.includes("C:\\Program Files\\7-Zip\\7z.exe"), 'it looks for 7z first');
    assert.ok(/exit 0/.test(run.slice(found, choco)), 'and stops there when it has one');
    assert.ok(run.includes('GITHUB_PATH'), 'and puts it on PATH for the later 7z steps');
    // The fallback retries instead of failing on the first 504.
    assert.ok(/for \(\$i = 1; \$i -le 5; \$i\+\+\)/.test(run) && /Start-Sleep/.test(run));
    assert.ok(/::error::7-Zip is not on this runner image/.test(run), 'and says why when it gives up');
    // Still before the steps that use it.
    const at = steps.indexOf(step);
    const user = steps.findIndex((s) => typeof s.run === 'string' && /\b7z (x|a) /.test(s.run));
    assert.ok(user > at, 'the step runs before 7z is used');
  });
}

test('no workflow installs a tool from Chocolatey as its only option (negative)', () => {
  const dir = path.join(ROOT, '.github/workflows');
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
    const src = fs.readFileSync(path.join(dir, name), 'utf8');
    const bare = src.split('\n').filter((l) => /^\s*run: choco install /.test(l));
    assert.deepStrictEqual(bare, [], `${name}: a bare choco install fails the job on any feed outage`);
  }
});

console.log(`\nreleaseWindows7zip: ${passed} tests passed`);
