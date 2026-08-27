'use strict';

// Regression coverage for the two 32-bit failures seen in AppImage run
// 89470778656: i686 exhausted its address space during V8 snapshot startup,
// while armhf's outer runtime ran but its inner Node lacked a host loader.
// Run: node tests/appImageRuntime.test.cjs

const assert = require('assert');
const fs = require('fs');

const launcher = fs.readFileSync('releases/ferretdb/start-wekan.sh', 'utf8');
const workflow = fs.readFileSync('.github/workflows/AppImage.yml', 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('appImageRuntime:');

test('32-bit bundled Node gets a safe automatic V8 heap ceiling', () => {
  assert.match(launcher, /file "\$NODE" \| grep -q 'ELF 32-bit'/);
  assert.match(launcher, /\[ "\$_heap_mb" -gt 1024 \] && _heap_mb=1024/);
  assert.ok(launcher.indexOf("grep -q 'ELF 32-bit'") < launcher.indexOf('export NODE_OPTIONS='));
});

test('explicit NODE_OPTIONS still overrides every automatic ceiling', () => {
  assert.match(launcher, /export NODE_OPTIONS="\$\{NODE_OPTIONS:---max-old-space-size=\$_heap_mb\}"/);
});

test('AppImage smoke test probes the bundled runtime, not only its wrapper', () => {
  assert.match(workflow, /AppDir\/usr\/lib\/wekan\/bundle\/node --version/);
  assert.doesNotMatch(workflow, /"\$app" --appimage-help/);
});

test('a runnable inner Node is still followed by the real HTTP smoke test', () => {
  const probe = workflow.indexOf('AppDir/usr/lib/wekan/bundle/node --version');
  const launch = workflow.indexOf('APPIMAGE_EXTRACT_AND_RUN=1 "$app" > smoke.log');
  const curl = workflow.indexOf('http://localhost:8080/sign-in');
  assert.ok(probe >= 0 && probe < launch && launch < curl);
});

console.log(`\nappImageRuntime: ${passed} tests passed`);
