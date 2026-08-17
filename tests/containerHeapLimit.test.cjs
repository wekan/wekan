'use strict';

// #6606: the official chart's 1 GiB WeKan container gave Node 24 an automatic
// ~640 MiB heap and v10.96+ exhausted it during startup, before application logs.
// The image must derive an explicit, bounded heap from its cgroup and must never
// override an administrator's NODE_OPTIONS.
// Run: node tests/containerHeapLimit.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const entry = fs.readFileSync(path.join(ROOT, 'releases/ferretdb/wekan-entrypoint.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('containerHeapLimit:');

test('the image reads both cgroup v2 and v1 memory limits', () => {
  assert.ok(entry.includes('/sys/fs/cgroup/memory.max'));
  assert.ok(entry.includes('/sys/fs/cgroup/memory/memory.limit_in_bytes'));
});

test('three quarters go to V8 and one quarter stays native', () => {
  assert.ok(/_heap_mb=\$\(\( _memory_bytes \/ 1024 \/ 1024 \* 3 \/ 4 \)\)/.test(entry));
  assert.ok(/--max-old-space-size=\$_heap_mb/.test(entry));
});

test('the automatic heap has safe lower and upper bounds', () => {
  assert.ok(/\[ "\$_heap_mb" -lt 768 \] && _heap_mb=768/.test(entry),
    'a 1 GiB pod needs more than the failing ~640 MiB ceiling');
  assert.ok(/\[ "\$_heap_mb" -gt 4096 \] && _heap_mb=4096/.test(entry),
    'large hosts keep the documented 4 GiB ceiling');
});

test('an explicit administrator setting always wins (negative)', () => {
  const at = entry.indexOf('if [ -z "${NODE_OPTIONS:-}" ]; then');
  assert.notStrictEqual(at, -1);
  const block = entry.slice(at, entry.indexOf('\nfi', at) + 3);
  assert.ok(/export NODE_OPTIONS=/.test(block));
  assert.strictEqual((entry.match(/export NODE_OPTIONS=/g) || []).length, 1,
    'NODE_OPTIONS must only be written inside the unset guard');
});

test('heap selection happens before the server exec', () => {
  assert.ok(entry.indexOf('export NODE_OPTIONS=') < entry.indexOf('exec node /build/main.js'));
});

console.log(`\ncontainerHeapLimit: ${passed} tests passed`);
