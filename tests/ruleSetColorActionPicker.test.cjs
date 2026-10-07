'use strict';

// Regression coverage for #6748: in Rules -> Add action -> card actions, the
// "Set color to" picker was stuck on "green". The swatch click handler of
// setCardActionsColorPopup read the color from Template.currentData(), which
// inside a Blaze event handler is the data context of the template the handler
// is defined on (the popup, opened with the cardActions context
// { ruleName, triggerVar, ruleId }), not the clicked swatch. So every click set
// the selection to undefined and the saved action could never be anything but
// the "green" default.
//
// The test drives the real handler with Blaze's event semantics (Template.
// currentData() returns the template's data, Blaze.getData(element) returns
// the element's data), and a negative test scans every palette click handler
// in client/ so the same mistake cannot live in another color picker.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const jsPath = path.join(root, 'client', 'components', 'rules', 'actions', 'cardActions.js');
const jadePath = path.join(root, 'client', 'components', 'rules', 'actions', 'cardActions.jade');
const jsSource = fs.readFileSync(jsPath, 'utf8');
const jadeSource = fs.readFileSync(jadePath, 'utf8');

// Returns the source of `'<spec>'(event, tpl) { ... }` inside `source`,
// balancing braces from the opening one.
function handlerSource(source, spec, from = 0) {
  const start = source.indexOf(`'${spec}'`, from);
  if (start < 0) return null;
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return { text: source.slice(start, i + 1), end: i + 1 };
    }
  }
  throw new Error(`unbalanced handler ${spec}`);
}

const popupEventsStart = jsSource.indexOf('Template.setCardActionsColorPopup.events(');
assert.ok(popupEventsStart > 0, 'setCardActionsColorPopup has an event map');
const paletteHandler = handlerSource(jsSource, 'click .js-palette-color', popupEventsStart);
const submitHandler = handlerSource(jsSource, 'click .js-submit', popupEventsStart);
assert.ok(paletteHandler && submitHandler, 'popup defines swatch and save handlers');

// Build the two handlers as real functions with Blaze-like globals.
function compile(handler, globals) {
  const body = handler.text.replace(/^'[^']+'/, 'function');
  return vm.runInNewContext(`(${body})`, globals);
}

const CARD_COLORS = ['white', 'green', 'yellow', 'orange', 'red', 'purple', 'blue'];
const popupData = { ruleName: {}, triggerVar: {}, ruleId: 'rule1' };

function reactiveVar(value) {
  return { value, get() { return this.value; }, set(v) { this.value = v; } };
}

function harness() {
  const shared = reactiveVar('green');
  const tpl = { currentColor: reactiveVar(shared.get()), colorButtonValue: shared };
  let backs = 0;
  const globals = {
    cardColors: CARD_COLORS,
    // Blaze semantics: in an event handler Template.currentData() is the
    // handler template's data, Blaze.getData(el) is the element's own data.
    Template: { currentData: () => popupData },
    Blaze: { getData: el => el.data },
    Popup: { back() { backs += 1; } },
  };
  const palette = compile(paletteHandler, globals);
  const submit = compile(submitHandler, globals);
  const event = el => {
    const e = { currentTarget: el, defaultPrevented: false };
    e.preventDefault = () => { e.defaultPrevented = true; };
    return e;
  };
  return {
    shared,
    tpl,
    backs: () => backs,
    click(color) { const e = event({ data: { color, name: '' } }); palette.call({ color, name: '' }, e, tpl); return e; },
    clickRaw(data) { palette.call(data, event({ data }), tpl); },
    save() { const e = event({ data: popupData }); submit.call(popupData, e, tpl); return e; },
  };
}

// 1) Positive: picking any card color other than green and saving stores it -
//    the reporter's scenario, for every color.
for (const color of CARD_COLORS.filter(c => c !== 'green')) {
  const h = harness();
  const clickEvent = h.click(color);
  assert.equal(h.tpl.currentColor.get(), color, `swatch ${color} becomes the selection`);
  const saveEvent = h.save();
  assert.equal(h.shared.get(), color, `saving stores ${color} for the Set color action`);
  assert.equal(h.backs(), 1, 'saving closes the popup once');
  assert.ok(clickEvent.defaultPrevented && saveEvent.defaultPrevented, 'clicks do not fall through');
}

// 2) Negative: a click whose target carries no valid card color (the popup
//    background, a stale node) leaves the current selection alone rather than
//    setting it to undefined, which is what every click did before.
{
  const h = harness();
  h.click('red');
  h.clickRaw(popupData);
  assert.equal(h.tpl.currentColor.get(), 'red', 'a non-swatch target keeps the selection');
  h.clickRaw({ color: 'not-a-color' });
  assert.equal(h.tpl.currentColor.get(), 'red', 'an unknown color is ignored');
  h.save();
  assert.equal(h.shared.get(), 'red');
}

// 3) Without saving, the action keeps its default (green) - nothing else leaks.
{
  const h = harness();
  h.click('blue');
  assert.equal(h.shared.get(), 'green', 'the selection is only applied on Save');
}

// 4) The Save button cannot submit the surrounding form natively.
assert.match(
  jadeSource,
  /template\(name="setCardActionsColorPopup"\)[\s\S]*?button\.primary\.confirm\.js-submit\(type="button"\)/,
  'the color popup Save button is type="button"',
);

// 5) The action still saves the chosen value from the shared ReactiveVar.
assert.match(
  handlerSource(jsSource, 'click .js-set-color-action').text,
  /selectedColor = tpl\.cardColorButtonValue\.get\(\)/,
  'Set color action stores the picked color',
);

// 6) Negative, tree-wide: no palette click handler anywhere under client/ takes
//    the swatch color from Template.currentData() before (or instead of) the
//    clicked element. labels.js may use it only as a fallback AFTER the element.
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}
let handlersSeen = 0;
for (const file of walk(path.join(root, 'client'))) {
  const source = fs.readFileSync(file, 'utf8');
  let from = 0;
  for (;;) {
    const handler = handlerSource(source, 'click .js-palette-color', from);
    if (!handler) break;
    from = handler.end;
    handlersSeen += 1;
    const rel = path.relative(root, file);
    const elementRead = handler.text.indexOf('event.currentTarget');
    assert.ok(elementRead >= 0, `${rel}: palette handler reads the clicked swatch`);
    const templateRead = handler.text.indexOf('Template.currentData()');
    assert.ok(
      templateRead < 0 || templateRead > elementRead,
      `${rel}: palette handler must not take the color from Template.currentData() first (#6748)`,
    );
  }
}
assert.ok(handlersSeen >= 5, `found the palette handlers (${handlersSeen})`);

console.log('ruleSetColorActionPicker: ok');
