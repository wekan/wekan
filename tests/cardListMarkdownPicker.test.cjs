const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
const block = source.slice(source.indexOf("  async 'click .js-select-card-details-list-option'"), source.indexOf("  'click .js-go-to-linked-card'"));
const context = { Utils: { canModifyCard: () => true } };
const handlers = vm.runInNewContext(`({${block}})`, context);
const jade = fs.readFileSync('client/components/cards/cardDetails.jade', 'utf8');
test('List picker uses the policy-aware viewer for selected and available titles', () => {
  const picker = jade.slice(jade.indexOf('details.card-details-list-picker'), jade.indexOf('//.card-details-items', jade.indexOf('details.card-details-list-picker')));
  assert.match(picker, /summary[\s\S]*?\+viewer\n\s+= title/);
  assert.match(picker, /role="option"[\s\S]*?\+viewer\n\s+= title/);
  assert.doesNotMatch(jade, /select\.js-select-card-details-lists/);
});
test('mouse selection moves the card and refuses unauthorized changes', async () => {
  let moved, focus = 0;
  const picker = { open: true, querySelector: () => ({ focus: () => focus++ }) };
  const event = { preventDefault() {}, stopPropagation() {}, currentTarget: { dataset: { listId: 'next' }, closest: () => picker } };
  const card = { boardId: 'b', swimlaneId: 's', listId: 'old', getMinSort: async () => 7, move: async (...args) => { moved = args; } };
  await handlers['click .js-select-card-details-list-option'](event, { data: card });
  assert.deepEqual(moved, ['b', 's', 'next', 6]);
  assert.equal(picker.open, false); assert.equal(focus, 1);
  moved = null; context.Utils.canModifyCard = () => false;
  await handlers['click .js-select-card-details-list-option'](event, { data: card });
  assert.equal(moved, null);
});
test('keyboard opens, navigates, selects and closes without entering text', () => {
  let focus, clicks = 0;
  const options = [0, 1, 2].map(i => ({ focus: () => { focus = i; }, click: () => clicks++ }));
  const picker = { open: false, querySelectorAll: () => options, querySelector: () => ({ focus: () => { focus = 'summary'; } }) };
  const key = (key, option) => handlers['keydown .card-details-list-picker']({ key, preventDefault() {}, currentTarget: picker, target: { closest: () => option } });
  key('ArrowDown'); assert.equal(picker.open, true); assert.equal(focus, 0);
  key('ArrowUp', options[0]); assert.equal(focus, 2);
  key('Home', options[2]); assert.equal(focus, 0);
  key('End', options[0]); assert.equal(focus, 2);
  key('Enter', options[2]); assert.equal(clicks, 1);
  key('Escape', options[2]); assert.equal(picker.open, false); assert.equal(focus, 'summary');
});
