'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

for (const [name, selector] of [
  ['myCards', 'js-minicard'], ['myAttachments', 'js-my-attachment-card'],
]) {
  const source = fs.readFileSync(`client/components/main/${name}.js`, 'utf8');
  const body = source.match(new RegExp(`'click \\.${selector}'\\(evt\\)\\s*\\{([\\s\\S]*?)\\n  \\},`))[1];
  function run(dataset, overrides = {}) {
    const calls = [];
    let ready;
    const handler = vm.runInNewContext(`(function(evt) {${body}\n})`, {
      // each card in ... does not change the outer data context (#6702).
      Blaze: { getData: () => ({ _id: 'wrong-outer-context' }) },
      Meteor: { subscribe: (name, id, callbacks) => { calls.push([name, id]); ready = callbacks.onReady; } },
      Session: { set: (...args) => calls.push(args) },
      Popup: { isOpen: () => false, open: name => () => calls.push(['open', name]) },
    });
    handler({ button: 0, currentTarget: { dataset }, target: { dataset: {} },
      preventDefault: () => calls.push(['prevent']), ...overrides });
    return { calls, ready: () => ready?.() };
  }
  test(`${name}: opens the clicked card after subscription, ignoring the outer context`, () => {
    const result = run({ cardId: 'chosen-card', boardId: 'chosen-board' });
    assert.deepEqual(result.calls, [['prevent'], ['popupCardData', 'chosen-card']]);
    result.ready();
    assert.deepEqual(result.calls.slice(2), [
      ['popupCardId', 'chosen-card'], ['popupCardBoardId', 'chosen-board'], ['open', 'cardDetails'],
    ]);
  });
  test(`${name}: missing identifiers and modified clicks keep native link behavior`, () => {
    for (const data of [{}, { cardId: 'card' }, { boardId: 'board' }]) {
      assert.deepEqual(run(data).calls, []);
    }
    for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      assert.deepEqual(run({ cardId: 'card', boardId: 'board' }, modifiers).calls, []);
    }
  });
  test(`${name}: the link supplies both identifiers from the lexical card`, () => {
    const jade = fs.readFileSync(`client/components/main/${name}.jade`, 'utf8');
    assert.match(jade, new RegExp(`a[^\\n]*\\.${selector}\\([^\\n]*href=card\\.originRelativeUrl[^\\n]*data-card-id=card\\._id[^\\n]*data-board-id=card\\.boardId`));
  });
}
