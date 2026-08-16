'use strict';

// Guard: an avatar in the Admin Panel is drawn at avatar size.
// Run: node tests/adminPanelAvatars.test.cjs
//
// WHAT HAPPENED. Problems / Offices and Problems / Impersonation Report drew a
// user's photograph at its NATURAL size - a 300px portrait in a table row, with
// the login counts scattered around it and the row a screen tall.
//
// The cause is that every avatar rule in client/components/users/userAvatar.css
// is scoped to `.member`:
//
//     .member            { height: 24px; width: 24px; border-radius: 50% }
//     .member .avatar.avatar-image  { height: 100%; width: 100%; object-fit: cover }
//     .member .avatar.avatar-initials { ... }
//
// so `img.avatar.avatar-image` outside a `.member` has NO size at all. The
// board sidebar and the cards have it; the shared table page did not, because
// the markup was written from the inside out - the image and the initials were
// copied, and the box they belong in was not.
//
// The fix is to reuse `.member` rather than to write a fourth private copy of
// "how big is an avatar". There were already three (userAvatar.css for the
// board, peopleBody.css for Admin Panel / People, and the avatar-list), and a
// fourth is how the three that exist came to disagree.
//
// So this pins two things: the shared table page draws its avatars inside a
// `.member`, and no Admin Panel template renders an avatar anywhere else.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('adminPanelAvatars:');

test('the avatar rules really are scoped to .member', () => {
  // The premise of everything below. If these ever stop needing `.member`, the
  // rest of this suite is asking for something that no longer matters - and the
  // failure will say so rather than leaving a mystery.
  const css = read('client/components/users/userAvatar.css');
  assert.ok(/^\.member\s*\{[\s\S]*?height:\s*24px/m.test(css),
    '.member is what gives an avatar its size');
  assert.ok(/\.member \.avatar\.avatar-image\s*\{/.test(css),
    'and the image is sized only inside it');
  assert.ok(/\.member \.avatar\.avatar-initials\s*\{/.test(css),
    'as are the initials');
});

test('the shared table page draws every avatar inside a .member', () => {
  // One markup, used by every paginated admin table - Offices, the Impersonation
  // Report, the event streams, the file and board reports - so this one line is
  // what makes all of them right.
  const jade = read('client/components/settings/tablePage.jade');
  const anchors = [...jade.matchAll(/^\s*a\.([\w.-]*js-table-page-edit-user[\w.-]*)\(/gm)]
    .map(m => m[1]);
  assert.ok(anchors.length >= 2,
    `expected the single-user and multi-user cells, found ${anchors.length}`);
  const unsized = anchors.filter(cls => !cls.split('.').includes('member'));
  assert.deepStrictEqual(unsized, [],
    'these avatar links are not `.member`, so the image has no size and renders '
    + `at whatever the file is: ${unsized.join(', ')}`);
});

test('and no Admin Panel template draws one anywhere else (negative)', () => {
  // The whole class: an avatar added to a new pane, with its own markup and no
  // box. Admin Panel / People is the one deliberate exception - it has its own
  // `.username .avatar` sizing, which predates the shared table page.
  const dir = path.join(ROOT, 'client/components/settings');
  const offenders = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.jade'))) {
    if (file === 'peopleBody.jade') continue;                  // sized by peopleBody.css
    const lines = read(`client/components/settings/${file}`).split('\n');
    lines.forEach((line, i) => {
      if (!/avatar-image|\+userAvatarInitials/.test(line)) return;
      if (/^\s*\/\/-/.test(line)) return;                      // a comment about them
      // Walk OUT to the enclosing element, skipping the `if` / `else` / `each`
      // lines in between - a control line is not the box the avatar sits in.
      let indent = line.length - line.trimStart().length;
      let box = null;
      for (let j = i - 1; j >= 0; j -= 1) {
        const l = lines[j];
        if (!l.trim()) continue;
        const at = l.length - l.trimStart().length;
        if (at >= indent) continue;
        indent = at;
        if (/^\s*(if|else|unless|each|with)\b/.test(l)) continue;   // control, not a box
        box = l;
        break;
      }
      if (!box || !/\.member[.(\s]/.test(box)) {
        offenders.push(`${file}:${i + 1}`);
      }
    });
  }
  assert.deepStrictEqual(offenders, [],
    'these render an avatar outside a `.member`, so it has no size: '
    + offenders.join(', '));
});

test('every Problems pane that names a user goes through that markup', () => {
  // A column spec asks for `userId` and the shared page draws the avatar - so a
  // pane cannot get this wrong without writing its own table, and none does.
  const js = read('client/components/settings/adminProblems.js');
  const withUsers = [...js.matchAll(/userId: \w+ => \w+\.\w+/g)].length;
  assert.ok(withUsers >= 3,
    `expected several columns to name a user, found ${withUsers}`);
  assert.ok(!/avatar-image|userAvatarInitials/.test(js),
    'adminProblems.js must not render avatar markup itself - the shared table '
    + 'page does, once');
});

test('the board-only parts of .member are neutralised in a table (negative)', () => {
  // `.member` floats and carries a 3px margin for the sidebar's grid. Reusing a
  // class means taking what comes with it, so the two declarations that are
  // about the sidebar rather than about avatars are turned off here - otherwise
  // a floated avatar drops out of the row it belongs to.
  const css = read('client/components/settings/tablePage.css');
  const block = /\.table-page \.member,\s*\n\.table-page-people \.member \{([\s\S]*?)\}/.exec(css);
  assert.ok(block, 'tablePage.css must neutralise the board-specific bits');
  assert.ok(/float:\s*none/.test(block[1]), 'the float');
  assert.ok(/margin:\s*0/.test(block[1]), 'and the sidebar margin');
});

console.log(`\nadminPanelAvatars: ${passed} tests passed`);
