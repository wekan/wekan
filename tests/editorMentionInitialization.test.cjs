'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the real render callback: one widget per editor, including the
// textarea fallback when rich editing is enabled for a different field.
const source = fs.readFileSync('client/components/main/editor.js', 'utf8');
const callbackSource = source.slice(source.indexOf('const specialHandles'), source.indexOf('Template.editor.events'));
for (const [rich, eligible, pluginAvailable] of [
  [false, false, true], [true, false, true], [true, true, true], [true, true, false],
]) {
  let render;
  let plainWidgets = 0;
  let richWidgets = 0;
  let summernotes = 0;
  const input = {};
  const textarea = { escapeableTextComplete() { plainWidgets++; } };
  const inputs = {
    length: eligible ? 1 : 0,
    attr: () => 'Comment',
    index: () => 0,
    each(fn) { if (eligible) fn(0, input); },
  };
  const context = {
    Template: { editor: { onRendered(fn) { render = fn; } } },
    Meteor: { settings: { public: { RICHER_CARD_COMMENT_EDITOR: rich } } },
    Utils: { isMiniScreen: () => false },
    autosize() {},
    $(element) {
      assert.equal(element, input, 'never initialize editors belonging to another template');
      return {
        closest: () => ({ length: eligible ? 1 : 0 }),
        on() {},
        summernote(options) {
          summernotes++;
          options.callbacks.onInit.call(input, {
            editable: { escapeableTextComplete() { richWidgets++; } },
          });
        },
      };
    },
  };
  context.$.fn = pluginAvailable ? { summernote() {} } : {};
  vm.runInNewContext(callbackSource, context);
  render.call({ $(selector) {
    return selector === 'textarea' ? textarea : {
      filter(predicate) {
        assert.equal(predicate(0, input), eligible);
        return inputs;
      },
    };
  } });
  const usesRich = rich && eligible && pluginAvailable;
  assert.equal(plainWidgets, usesRich ? 0 : 1, 'exactly one plain-text initializer, including the missing-plugin fallback');
  assert.equal(richWidgets, usesRich ? 1 : 0);
  assert.equal(summernotes, usesRich ? 1 : 0);
}
console.log('  ok - #6704 initializes each plain or rich mention editor once, within its own template');
