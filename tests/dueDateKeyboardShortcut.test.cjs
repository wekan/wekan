'use strict';
// #6750: the `d` keyboard shortcut opens the Due date editor of the opened card.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const keyboard = read('client/lib/keyboard.js');

// A minimal DOM: elements with a class list, children and data contexts.
class Node {
  constructor(classes = [], children = [], data) {
    this.classes = classes;
    this.children = children;
    this.data = data;
  }
  matches(selector) {
    // Only the selectors findDueDateControl uses: '.a', '.a .b' and lists.
    return selector.split(',').some(part => {
      const chain = part.trim().split(/\s+/).map(s => s.replace(/^\./, ''));
      if (!this.classes.includes(chain[chain.length - 1])) return false;
      let node = this.parent;
      for (let i = chain.length - 2; i >= 0; i--) {
        while (node && !node.classes.includes(chain[i])) node = node.parent;
        if (!node) return false;
        node = node.parent;
      }
      return true;
    });
  }
  all() {
    const out = [];
    for (const child of this.children) {
      child.parent = this;
      out.push(child, ...child.all());
    }
    return out;
  }
  querySelectorAll(selector) { return this.all().filter(n => n.matches(selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
const details = (id, control) => new Node(['card-details', 'js-card-details'], [
  new Node(['card-details-item', 'card-details-item-due'], control ? [new Node([control])] : []),
  // Other date fields use the same badge class; they must never be chosen.
  new Node(['card-details-item', 'card-details-item-start'], [new Node(['js-edit-date'])]),
], id && { _id: id });
const dataOf = element => element.data;

test('finds the due date + or badge of the opened card only', async () => {
  const { findDueDateControl, DUE_DATE_CONTROL_SELECTOR } = await import('../client/lib/dueDateHotkey.js');
  assert.match(DUE_DATE_CONTROL_SELECTOR, /card-details-item-due \.js-due-date/);
  assert.match(DUE_DATE_CONTROL_SELECTOR, /card-details-item-due \.js-edit-date/);

  const plus = new Node([], [details('card1', 'js-due-date')]);
  const control = findDueDateControl(plus, { cardId: 'card1', canModifyCard: true, dataOf });
  assert.ok(control && control.classes.includes('js-due-date'));
  assert.ok(control.parent.classes.includes('card-details-item-due'), 'never the start date badge');

  const badge = new Node([], [details('card1', 'js-edit-date')]);
  const edit = findDueDateControl(badge, { cardId: 'card1', canModifyCard: true, dataOf });
  assert.ok(edit && edit.parent.classes.includes('card-details-item-due'));

  // Two card details open: the opened card's, not the first one on the page.
  const two = new Node([], [details('other', 'js-due-date'), details('card1', 'js-edit-date')]);
  const chosen = findDueDateControl(two, { cardId: 'card1', canModifyCard: true, dataOf });
  assert.equal(chosen.parent.parent.data._id, 'card1');

  // A details whose data context wraps the card is still recognised.
  const wrapped = details(null, 'js-due-date');
  wrapped.data = { card: { _id: 'card1' }, cardIndex: 0 };
  assert.ok(findDueDateControl(new Node([], [wrapped]), { cardId: 'card1', canModifyCard: true, dataOf }));
});

test('negative: does nothing without an opened card, permission, control or match', async () => {
  const { findDueDateControl } = await import('../client/lib/dueDateHotkey.js');
  const page = new Node([], [details('card1', 'js-due-date')]);
  assert.equal(findDueDateControl(page, { cardId: null, canModifyCard: true, dataOf }), null, 'no opened card');
  assert.equal(findDueDateControl(page, { cardId: 'card1', canModifyCard: false, dataOf }), null, 'may not modify the card');
  assert.equal(findDueDateControl(page, { cardId: 'card2', canModifyCard: true, dataOf }), null, 'another card is open');
  // The card details render no control (due dates off for the board, a
  // read-only member, or a Worker without a due date): nothing to click.
  const none = new Node([], [details('card1', null)]);
  assert.equal(findDueDateControl(none, { cardId: 'card1', canModifyCard: true, dataOf }), null);
  // An unreadable details is used only when it is the only one on the page.
  const unknown = new Node([], [details(null, 'js-due-date')]);
  assert.ok(findDueDateControl(unknown, { cardId: 'card1', canModifyCard: true, dataOf: () => { throw new Error('x'); } }));
  const ambiguous = new Node([], [details(null, 'js-due-date'), details(null, 'js-due-date')]);
  assert.equal(findDueDateControl(ambiguous, { cardId: 'card1', canModifyCard: true, dataOf }), null);
  assert.equal(findDueDateControl(null, { cardId: 'card1', canModifyCard: true, dataOf }), null);
});

test('d is bound once, through the shared filter, to the opened card with canModifyCard', () => {
  const bindings = [...keyboard.matchAll(/hotkeys\(\s*(['"])([^'"]*)\1/g)].map(m => m[2]);
  const keysOf = binding => binding.split(',').map(k => k.trim().toLowerCase());
  const withD = bindings.filter(b => keysOf(b).some(k => k === 'd' || k === 'shift+d'));
  assert.deepEqual(withD, ['d, shift+d'], 'd and Shift+D belong to the due date shortcut only');
  for (const other of bindings.filter(b => b !== 'd, shift+d')) {
    assert.ok(!keysOf(other).includes('d'), `${other} must not also take d`);
  }
  // Every hotkey runs through hotkeys.filter, which refuses shortcuts when the
  // user turned them off and while typing in an input, textarea or editable.
  const filter = keyboard.slice(keyboard.indexOf('hotkeys.filter ='), keyboard.indexOf('// Handle non-Latin keyboards'));
  assert.match(filter, /isKeyboardShortcuts\(\)\)\s*\n\s*return false/);
  assert.match(filter, /isContentEditable\)\s*\n\s*return false/);
  assert.match(filter, /HTMLInputElement[^\n]*HTMLTextAreaElement/);

  const fn = keyboard.slice(keyboard.indexOf('export function openDueDateEditorOfOpenedCard'), keyboard.indexOf("hotkeys('d, shift+d'"));
  assert.match(fn, /Utils\.getCurrentCardId\(\)/, 'targets the opened card');
  assert.match(fn, /canModifyCard: Utils\.canModifyCard\(card\)/, 'same permission as the due date control');
  assert.match(fn, /findDueDateControl\(document/);
  assert.match(fn, /control\.click\(\)/, 'opens the same popup a click opens');
  assert.doesNotMatch(fn, /Popup\.open/, 'never opens the popup past the rendered control');
});

test('the due date control it clicks is the one card details renders only for editors', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const due = jade.slice(jade.indexOf('if $eq field "dueDate"'), jade.indexOf('if $eq field "endDate"'));
  assert.match(due, /if currentBoard\.allowsDueDate/);
  assert.match(due, /if canModifyCard\s*\n\s*unless currentUser\.isWorker\s*\n\s*a\.card-label\.add-label\.js-due-date/);
  assert.match(due, /\.card-details-item-due/);
  const date = read('client/components/cards/cardDate.jade');
  assert.match(date, /template\(name="dateBadgeBody"\)\s*\n\s*if canModifyCard\s*\n\s*a\.js-edit-date/);
  const details = read('client/components/cards/cardDetails.js');
  assert.match(details, /'click \.js-due-date': Popup\.open\('editCardDueDate'\)/);
  assert.match(read('client/components/cards/cardDate.js'), /Template\.cardDueDate\.events\(\{\s*\n\s*'click \.js-edit-date': openDateEditor\('editCardDueDate'\)/);
});

test('appears in the keyboard shortcuts help list with English text', () => {
  const mapping = keyboard.slice(keyboard.indexOf('Template.keyboardShortcuts.helpers'));
  assert.match(mapping, /keys: \['d'\],\s*\n\s*action: 'shortcut-edit-due-date'/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.equal(typeof en['shortcut-edit-due-date'], 'string');
  assert.ok(en['shortcut-edit-due-date'].trim().length > 0);
});
