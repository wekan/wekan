'use strict';

// Source-level regression guards for #697. Sandstorm may finish loading a
// grain while its iframe is hidden; resuming it must force every existing
// resize consumer to measure the restored viewport again.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'client/lib/utils.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const start = source.indexOf('function refreshViewportAfterResume()');
const body = source.slice(start, start + 900);

test('visibility, page restoration and focus all refresh the viewport', () => {
  assert.ok(start >= 0, 'the shared resume handler must exist');
  assert.match(source, /document\.addEventListener\('visibilitychange', refreshViewportAfterResume\)/);
  assert.match(source, /window\.addEventListener\('pageshow', refreshViewportAfterResume\)/);
  assert.match(source, /window\.addEventListener\('focus', refreshViewportAfterResume\)/);
});

test('a still-hidden iframe does not publish its zero-sized viewport', () => {
  assert.match(body, /if \(document\.hidden \|\| window\.__wekanViewportResumePending\) return/);
});

test('resume waits for layout and reuses the complete resize path', () => {
  assert.match(body, /window\.setTimeout/);
  assert.match(body, /requestAnimationFrame/);
  assert.match(body, /new CustomEvent\('resize'/);
  assert.match(body, /source: 'wekan-viewport-resume'/);
  assert.match(source, /\$\(window\)\.on\('resize', \(\) => Utils\.windowResizeDep\.changed\(\)\)/);
});

test('multiple resume signals are coalesced into one scheduled refresh', () => {
  assert.match(body, /window\.__wekanViewportResumePending = true/);
  assert.match(body, /window\.__wekanViewportResumePending = false/);
});

test('Meteor hot reload replaces rather than duplicates the listeners', () => {
  assert.match(source, /window\.__wekanViewportResumeHandler/);
  assert.match(source, /document\.removeEventListener\('visibilitychange', previousViewportResume\)/);
  assert.match(source, /window\.removeEventListener\('pageshow', previousViewportResume\)/);
  assert.match(source, /window\.removeEventListener\('focus', previousViewportResume\)/);
});

console.log(`\niframeViewportResume: ${passed} tests passed`);
