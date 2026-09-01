'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '..', 'client/components/swimlanes/swimlanes.js'),
  'utf8',
);

const renderedBlocks = source.match(
  /Template\.(?:swimlane|listsGroup)\.onRendered[\s\S]*?\n}\);/g,
) || [];

assert.equal(renderedBlocks.length, 2,
  'both list-layout templates must have deferred initialization coverage');
for (const block of renderedBlocks) {
  assert.match(block, /setTimeout\(\(\) => \{[\s\S]*?if \(tpl\.view\.isDestroyed\) return;/,
    'deferred DOM work must stop after its Blaze view is destroyed');
}
assert.doesNotMatch(renderedBlocks[0], /setTimeout\([\s\S]*?tpl\.\$\('\.js-lists'\)/,
  'the deferred swimlane callback must not select through a removed DomRange');

console.log('swimlaneDeferredInit: 4 assertions passed');
