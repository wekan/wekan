'use strict';

// Regression coverage for #3575 / #1402. A slow or failing outgoing webhook
// must never delay the database mutation that emitted its activity.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const activities = read('server/models/activities.js');
const guardSource = read('server/lib/webhookGuard.js');

const sandbox = {
  module: { exports: {} },
  console: { error() {} },
  TypeError,
};
vm.runInNewContext(
  `${guardSource.replace('export async function safeDeliver', 'async function safeDeliver')}\n` +
    'module.exports = { safeDeliver };',
  sandbox,
);
const { safeDeliver } = sandbox.module.exports;

async function run() {
  const deliveryBlock = activities.slice(
    activities.indexOf('  if (integrations.length > 0)'),
    activities.indexOf('\n});', activities.indexOf('  if (integrations.length > 0)')),
  );
  assert.match(deliveryBlock, /safeDeliver\(/);
  assert.doesNotMatch(deliveryBlock, /await\s+safeDeliver\(/,
    'activity insertion must not await webhook delivery');
  assert.match(deliveryBlock, /Meteor\.call\('outgoingWebhooks'/);

  let release;
  const hanging = safeDeliver(() => new Promise(resolve => {
    release = resolve;
  }));
  const callerContinued = await Promise.race([
    Promise.resolve('continued'),
    hanging.then(() => 'blocked'),
  ]);
  assert.strictEqual(callerContinued, 'continued',
    'starting a hanging delivery must return control to the caller');
  release();
  assert.strictEqual((await hanging).ok, true);

  const failure = new Error('receiver closed connection');
  const failed = await safeDeliver(async () => {
    throw failure;
  });
  assert.strictEqual(failed.ok, false);
  assert.strictEqual(failed.error, failure);

  console.log('webhookNonBlockingActivity: 3 tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
