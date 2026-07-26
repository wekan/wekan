'use strict';

// A handler's state must live on the template the handler is registered on.
//
// Blaze hands an event handler the instance of THAT template. When a pane's
// handlers are moved onto their own template - which the Admin Panel did when
// People started rendering the Login and E-mail panes - any state they poke has to
// move with them. It did not, so every one of the Login pane's checkboxes threw
//
//   TypeError: can't access property "set", tpl.loading is undefined
//
// and the click did nothing: the setting was not written, and nothing said so.
//
// This walks the Admin Panel components and fails when an events/helpers block reads
// or writes `tpl.<name>` that its own template never created.
//
// Run: node tests/adminTemplateState.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const DIR = 'client/components/settings';
const files = fs.readdirSync(path.join(ROOT, DIR)).filter(f => f.endsWith('.js'));

console.log('adminTemplateState:');

// Which template a position in the file belongs to, and whether that position is in
// an events/helpers block (where `tpl` is that template's instance).
function blocksOf(src) {
  return [...src.matchAll(/Template\.(\w+)\.(events|helpers|onCreated|onRendered|onDestroyed)/g)]
    .map(m => ({ at: m.index, template: m[1], kind: m[2] }));
}

function ownerAt(blocks, pos) {
  let current = null;
  for (const block of blocks) {
    if (block.at > pos) break;
    current = block;
  }
  return current;
}

// The state a template gives itself, in onCreated or onRendered.
function stateOf(src) {
  const state = {};
  for (const m of src.matchAll(/Template\.(\w+)\.(?:onCreated|onRendered)/g)) {
    const end = src.indexOf('\n});', m.index);
    const body = src.slice(m.index, end === -1 ? src.length : end);
    for (const d of body.matchAll(/this\.(\w+)\s*=/g)) {
      (state[m[1]] = state[m[1]] || new Set()).add(d[1]);
    }
  }
  return state;
}

test('every handler reads state its own template created', () => {
  const broken = [];
  for (const file of files) {
    const src = read(`${DIR}/${file}`);
    const blocks = blocksOf(src);
    if (!blocks.length) continue;
    const state = stateOf(src);
    for (const m of src.matchAll(/\btpl\.(\w+)\.(?:set|get)\(/g)) {
      const owner = ownerAt(blocks, m.index);
      if (!owner || (owner.kind !== 'events' && owner.kind !== 'helpers')) continue;
      if ((state[owner.template] || new Set()).has(m[1])) continue;
      broken.push(`${file}: Template.${owner.template} uses tpl.${m[1]}`);
    }
  }
  assert.deepStrictEqual([...new Set(broken)], [],
    'a handler poking state its template never created throws on the first click, '
    + 'and the click silently does nothing');
});

test('the two panes that were broken by this have their own state', () => {
  // Login and E-mail are rendered by Admin Panel / People, with their handlers on
  // their own templates - so `loading` has to be theirs, not Template.setting's.
  const src = read(`${DIR}/settingBody.js`);
  for (const template of ['general', 'email']) {
    const at = src.indexOf(`Template.${template}.onCreated`);
    assert.ok(at !== -1, `Template.${template} must create its own state`);
    const body = src.slice(at, src.indexOf('\n});', at));
    assert.ok(/this\.loading = new ReactiveVar\(false\)/.test(body),
      `Template.${template}.loading must exist - its handlers set it`);
  }
});

test('a helper that reads it tolerates a template that has none', () => {
  // isLoading is rendered by the page template; a pane that has no loading state
  // must not make it throw either.
  const src = read(`${DIR}/settingBody.js`);
  assert.ok(/inst\.loading && inst\.loading\.get\(\)/.test(src),
    'the helper checks before reading');
});

console.log(`\n${passed} tests passed`);
