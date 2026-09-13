'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
test('CSS style injection overrides Meteor native CSS typing on both build modes', () => {
  const factory = require('../rspack.config');
  for (const isRun of [true, false]) {
    const config = factory({ isClient: true, isRun });
    const css = config.module.rules.find(rule => rule.test.test('layout.css'));
    assert.equal(css.type, 'javascript/auto');
    assert.deepEqual(css.use, ['style-loader', 'css-loader']);
  }
  const server = factory({ isClient: false, isRun: false });
  assert.equal(server.module.rules.some(rule => rule.test.test('layout.css')), false);
});
test('2FA prompt uses native hidden before a challenge and toggles after challenge/cancel', () => {
  const jade = fs.readFileSync(path.join(root, 'client/components/main/layouts.jade'), 'utf8');
  assert.match(jade, /form#two-factor-code-container\.hide\(hidden="hidden"\)/);
  assert.doesNotMatch(jade, /hidden=true/);
  const loader = require('../npm-packages/meteor-jade-loader');
  const compiled = loader.call({ resourcePath: path.join(root, 'client/components/main/layouts.jade'), emitError(error) { throw error; } }, jade);
  assert.ok(compiled.includes('two-factor-code-container'));
  const source = fs.readFileSync(path.join(root, 'config/accounts.js'), 'utf8');
  const functions = source.slice(source.indexOf('function showTwoFactorPrompt('), source.indexOf('\nif (Meteor.isClient)', source.indexOf('function showTwoFactorPrompt(')));
  const classes = new Set(['hide']);
  const container = { hidden: true, classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  const context = { Meteor: { isClient: true }, document: { getElementById: id => id === 'two-factor-code-container' ? container : null }, pendingTwoFactorSelector: 'user', pendingTwoFactorPassword: 'secret' };
  vm.createContext(context); vm.runInContext(functions, context);
  assert.equal(container.hidden, true);
  context.showTwoFactorPrompt('need-code');
  assert.equal(container.hidden, false); assert.equal(classes.has('hide'), false);
  context.hideTwoFactorPrompt();
  assert.equal(container.hidden, true); assert.equal(classes.has('hide'), true);
  assert.equal(context.pendingTwoFactorSelector, null); assert.equal(context.pendingTwoFactorPassword, null);
});
