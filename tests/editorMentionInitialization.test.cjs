'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the real render callback without an editor plugin or public setting.
// Each template must initialize only its own textarea, exactly once.
const source = fs.readFileSync('client/components/main/editor.js', 'utf8');
const callbackSource = source.slice(source.indexOf('const specialHandles'), source.indexOf('Template.editor.events'));
let render;
const sized = [];
const initialized = [];
vm.runInNewContext(callbackSource, {
  Template: { editor: { onRendered(fn) { render = fn; } } },
  autosize(element) { sized.push(element); },
  Utils: { getCurrentBoard: () => ({ activeMembers: () => [{ userId: 'member' }, { userId: 'deleted' }] }) },
  ReactiveCache: { getUser: id => id === 'member' ? { username: 'alice', profile: { fullname: 'Alice Example' } } : null },
  memberMatchesTerm: (user, term) => !!user && user.username.includes(term),
  TAPi18n: { __: key => `translated:${key}` },
});
for (const id of ['first-card', 'second-card']) {
  const textarea = { id, escapeableTextComplete(strategies) { initialized.push({ id, strategies }); } };
  render.call({ $(selector) { assert.equal(selector, 'textarea'); return textarea; } });
}
assert.deepEqual(sized.map(el => el.id), ['first-card', 'second-card']);
assert.deepEqual(initialized.map(el => el.id), ['first-card', 'second-card']);
const mention = initialized[0].strategies[0];
let matches;
mention.search('ali', results => { matches = results; });
assert.equal(matches[0].username, 'alice');
assert.equal(mention.replace(matches[0]), '@alice (Alice Example) ');
assert.equal(mention.template(matches[0]), 'Alice Example (alice)');
mention.search('missing', results => { matches = results; });
assert.equal(matches.some(user => user.username === 'alice'), false);
assert.equal(matches.length, 4, 'group mentions remain available without matching users');
assert.equal(mention.template(matches[0]), `translated:${matches[0].username}`);
console.log('  ok - #6704 initializes each textarea once and preserves user/group mention behavior');
