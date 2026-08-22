'use strict';
const assert = require('assert');
const { heapHealth, diskHealth } = require('../models/lib/runtimeHealth');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
test('healthy heap remains silent', () => assert.strictEqual(heapHealth(50, 100).ok, true));
test('heap at ninety percent is reported', () => assert.strictEqual(heapHealth(90, 100).ok, false));
test('invalid heap statistics fail closed without throwing', () => assert.strictEqual(heapHealth(NaN, 0).ok, false));
test('filesystem with enough free space remains silent', () => assert.strictEqual(diskHealth(1024, 1024 * 1024).ok, true));
test('filesystem nearing full is reported', () => assert.strictEqual(diskHealth(10, 1024 * 1024).ok, false));
test('invalid disk statistics fail closed without throwing', () => assert.strictEqual(diskHealth(NaN, 1).ok, false));
console.log(`runtimeHealth: ${passed} tests passed`);
