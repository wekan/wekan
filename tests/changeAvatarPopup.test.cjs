'use strict';

// Regression guard for the "Change profile image" popup (changeAvatarPopup and
// the admin variant adminChangeAvatarPopup).
//
// The rows used to render the delete link and the file name INSIDE the
// a.js-select-avatar anchor. An <a> inside an <a> is invalid HTML: the parser
// closes the outer anchor, so the file name and the delete link fell out of the
// row's flex layout (they rendered as bold text floating at the right edge) and
// a click on delete also triggered "select this avatar". Delete was also only
// rendered for the avatar currently in use, so other uploads could never be
// removed, and deleting the one in use left profile.avatarUrl pointing at a file
// that no longer existed.
//
// Run: node tests/changeAvatarPopup.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const jade = fs.readFileSync(
  path.join(root, 'client/components/users/userAvatar.jade'), 'utf8');
const js = fs.readFileSync(
  path.join(root, 'client/components/users/userAvatar.js'), 'utf8');
const css = fs.readFileSync(
  path.join(root, 'client/components/users/userAvatar.css'), 'utf8');

function templateBlock(src, name) {
  const start = src.indexOf(`template(name="${name}")`);
  assert.ok(start >= 0, `template ${name} must exist`);
  const after = src.indexOf('\ntemplate(name="', start + 1);
  return src.slice(start, after === -1 ? undefined : after);
}

const indentOf = line => line.length - line.trimStart().length;

// The enclosing lines of the first line matching re, outermost last. Jade nesting
// is indentation, so an ancestor is the nearest preceding line indented less.
// Works for both `a.foo` on its own line and the inline `li: a.foo` form.
function ancestorsOf(block, re) {
  const lines = block.split('\n');
  const index = lines.findIndex(l => re.test(l));
  assert.ok(index >= 0, `${re} must exist`);
  const chain = [];
  let indent = indentOf(lines[index]);
  for (let i = index - 1; i >= 0; i -= 1) {
    if (!lines[i].trim()) continue;
    if (indentOf(lines[i]) < indent) {
      chain.push(lines[i]);
      indent = indentOf(lines[i]);
    }
  }
  return chain;
}

const TEMPLATES = ['changeAvatarPopup', 'adminChangeAvatarPopup'];

console.log('changeAvatarPopup:');

for (const name of TEMPLATES) {
  const tpl = templateBlock(jade, name);

  test(`${name}: delete is a sibling of select, not a nested anchor`, () => {
    const chain = ancestorsOf(tpl, /a\.js-delete-avatar/);
    assert.ok(chain.some(l => /each uploadedAvatars/.test(l)),
      'the delete button must live in the uploaded-avatars loop');
    assert.ok(!chain.some(l => /a\.js-select-avatar/.test(l)),
      'a.js-delete-avatar must be a sibling of a.js-select-avatar, never nested ' +
      'inside it (nested <a> is invalid HTML: the browser closes the outer anchor, ' +
      'which broke the row layout, and the click also selected the avatar)');
  });

  test(`${name}: every uploaded avatar can be deleted, not just the selected one`, () => {
    const chain = ancestorsOf(tpl, /a\.js-delete-avatar/);
    assert.ok(!chain.some(l => /^\s*if isSelected/.test(l)),
      'delete must not be inside `if isSelected` — otherwise only the avatar in ' +
      'use can be deleted');
  });

  test(`${name}: the file name is rendered inside the select anchor`, () => {
    assert.ok(/\.avatar-list-name= name/.test(tpl),
      'the avatar file name must be in its own .avatar-list-name element');
    assert.ok(!/\|\s+-\s*$/m.test(tpl),
      'the bare " -" separator before the file name must be gone');
  });

  test(`${name}: the selected row is marked on the row itself`, () => {
    assert.ok(/li\.avatar-list-item\(class="\{\{#if (isSelected|noAvatarUrl)\}\}selected\{\{\/if\}\}"\)/.test(tpl),
      'the <li> must get a `selected` class so the row can be highlighted');
    assert.ok(/i\.fa\.fa-check\.avatar-list-check/.test(tpl),
      'the in-use avatar must still show a check mark');
  });

  test(`${name}: no empty p.sub-name placeholder is left in the list`, () => {
    assert.ok(!/^\s*p\.sub-name\s*$/m.test(tpl),
      'the empty p.sub-name broke the row layout and must not come back');
  });
}

test('adminChangeAvatarPopup passes a userId to userAvatarInitials', () => {
  const tpl = templateBlock(jade, 'adminChangeAvatarPopup');
  // Template.userAvatarInitials reads this.userId; `userData=userData` left the
  // initials empty in the admin popup.
  assert.ok(/\+userAvatarInitials\(userId=userId\)/.test(tpl),
    'admin popup must pass userId=userId');
  assert.ok(!/\+userAvatarInitials\(userData=/.test(jade),
    'userAvatarInitials never reads a userData argument');
});

test('deleting the avatar in use falls back to the initials', () => {
  // Both popups must clear profile.avatarUrl when the deleted file is the one in
  // use, otherwise the user is left with a broken image everywhere.
  assert.ok(/function normalizeAvatarUrl/.test(js),
    'a shared normalizeAvatarUrl helper must exist');
  assert.ok(/Meteor\.call\('setAvatarUrl', ''\)/.test(js),
    'changeAvatarPopup must reset the avatar url to initials');
  assert.ok(/Meteor\.call\('adminSetAvatarUrl', targetUserId, ''\)/.test(js),
    'adminChangeAvatarPopup must reset the target user avatar url to initials');
  const deleteHandlers = js.match(/Popup\.afterConfirm\('deleteAvatar'/g) || [];
  assert.strictEqual(deleteHandlers.length, 2,
    'both popups keep their delete handler');
});

test('avatar rows have their flex row layout', () => {
  for (const selector of [
    '.avatar-list .avatar-list-item',
    '.avatar-list .avatar-list-select',
    '.avatar-list .avatar-list-info',
    '.avatar-list .avatar-list-name',
    '.avatar-list .avatar-list-delete',
    '.avatar-upload-hints',
  ]) {
    assert.ok(css.includes(selector), `${selector} must be styled`);
  }
  // Long file names must not push the delete button out of the row.
  assert.ok(/\.avatar-list \.avatar-list-name \{[^}]*text-overflow: ellipsis/.test(css),
    'long avatar file names must ellipsis-truncate');
  // The delete button needs to beat .pop-over-list li > a:not(.disabled):hover.
  assert.ok(/\.avatar-list\.pop-over-list li > a\.avatar-list-delete:hover/.test(css),
    'the delete hover rule must outweigh the generic row hover rule');
});

console.log(`\nchangeAvatarPopup: ${passed} tests passed`);
