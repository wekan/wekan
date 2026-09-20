'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { ClientImports } = require('../scripts/dev-source/module-access.cjs');
const { options, waitForPortRelease } = require('../scripts/dev-source/start.cjs');
const { parseSync } = require('@swc/core');
const root = path.resolve(__dirname, '..');
const access = new ClientImports(root, parseSync);

assert.deepEqual(options([]), { port: 3000, visualize: false, serverTests: false });
assert.equal(options(['--port', '4000']).port, 4000);
for (const port of ['0', '65535', '-1', 'nan', '3.1']) {
  assert.throws(() => options(['--port', port]), /Dev port/);
}
assert.throws(() => options(['--unknown']), /Unknown/);
console.log('  ok - source server validates application ports and reserves the next MongoDB port');

access.authorize('/client/main.js');
access.register('client/main.js', 'require("../models/cards"); import("ignored"); // require("/server/main")');
access.authorize('../models/cards', 'client/main.js');
assert.throws(() => access.authorize('/server/main', 'client/main.js'));
assert.throws(() => access.authorize('../models/cards', 'invented-parent.js'));
assert.throws(() => access.authorize('/private/settings.json'));
assert.throws(() => access.authorize(null));
console.log('  ok - only declared client imports and registered parents are accepted');

assert.equal(access.file(path.join(root, 'models/cards.js')), 'models/cards.js');
assert.equal(access.file(path.join(root, 'server/lib/cardCopyHelpers.js')), 'server/lib/cardCopyHelpers.js');
for (const file of ['server/main.js', 'models/attachments.server.js', 'package.json', '.meteor/packages']) {
  assert.throws(() => access.file(path.join(root, file)), /outside the client/);
}
const temp = fs.mkdtempSync(path.join(root, '.tools/tmp/source-access-'));
try {
  const outside = path.join(temp, 'secret.js');
  fs.writeFileSync(outside, 'module.exports="private"');
  assert.throws(() => access.file(outside), /outside the client/);
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log('  ok - private, server, generated and outside-client files are rejected');

async function dynamicImports() {
  const { transform } = require('../scripts/dev-source/transform.cjs');
  const source = '\"use strict\"; exports.load = () => import("./locale.json"); exports.strict = function () { return this; };';
  const code = transform(source, 'client/locale.js');
  access.register('client/locale.js', code);
  access.authorize('./locale.json', 'client/locale.js');
  const locale = { default: 'Default translated', title: 'Title translated' };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(() => locale, module, module.exports);
  const namespace = await module.exports.load();
  assert.equal(namespace[Symbol.toStringTag], 'Module');
  assert.equal(namespace.default, locale, 'a JSON default key is not mistaken for the namespace');
  assert.equal(namespace.title, locale.title);
  const strict = module.exports.strict;
  assert.equal(strict(), undefined, 'adding the import helper preserves strict mode');
  const failing = { exports: {} };
  new Function('require', 'module', 'exports', code)(() => { throw new Error('missing locale'); }, failing, failing.exports);
  await assert.rejects(failing.exports.load(), /missing locale/);
  console.log('  ok - dynamic imports preserve namespaces, strict mode and asynchronous errors');
}

{
  const vm = require('node:vm');
  const { transform } = require('../scripts/dev-source/transform.cjs');
  const run = source => {
    const module = { exports: {} };
    const context = { module, exports: module.exports };
    vm.runInNewContext(transform(source, 'dependency.js'), context);
    return context;
  };
  const commonjs = run('exports.click = function () { dragTarget = "button"; }; exports.click();');
  assert.equal(commonjs.dragTarget, 'button', 'CommonJS retains its original execution semantics');
  assert.throws(() => run('"use strict"; exports.click = function () { dragTarget = "button"; }; exports.click();'), /dragTarget is not defined/);
  assert.throws(() => run('export function click() { dragTarget = "button"; } click();'), /dragTarget is not defined/);
  console.log('  ok - CommonJS remains sloppy unless explicit; ES modules remain strict');
}

(async () => {
  await dynamicImports();
  const net = require('node:net');
  const listener = net.createServer(socket => socket.end());
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  try {
    assert.equal(await waitForPortRelease(port, 0), false, 'a live listener times out');
    assert.equal(listener.listening, true, 'waiting never terminates a listener');
    setTimeout(() => listener.close(), 25);
    assert.equal(await waitForPortRelease(port, 2000), true, 'waits through delayed shutdown');
    assert.equal(await waitForPortRelease(port, 0), true, 'already released ports resolve immediately');
  } finally {
    if (listener.listening) await new Promise(resolve => listener.close(resolve));
  }
  console.log('  ok - shutdown waits for port release without disturbing listeners');
})().catch(error => { console.error(error); process.exitCode = 1; });
