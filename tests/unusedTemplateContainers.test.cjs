'use strict';

// Email feedback (../log/wekan17/email-feedback/cpu-monster): FerretDB at
// 190-350% CPU on an instance with 14490 boards, of which 13404 are template
// containers, for 9264 accounts of which 478 have ever logged in.
// Run: node tests/unusedTemplateContainers.test.cjs
//
// Before v10.00 every new account got a "Templates" container board at signup
// whether or not the person ever saved a template. That was made lazy in v10.00
// (#2339, #5850), so no NEW account creates one - but nothing ever removed the
// ones already made, and they are not visible enough for anyone to delete by
// hand. They are 13x the boards collection on that instance, and every query
// that touches boards carries it.
//
// THIS DELETES BOARDS, so the rule for what may go is the whole of the risk and
// is deliberately narrow: only a container nobody ever used. Anything at all
// having been done to one - a template saved into it, a list or card added, a
// second member, a rename, a star, a manual archive - keeps it. This suite is
// about the cases that must NOT be removed at least as much as the one that
// should.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const {
  classifyTemplateContainer,
  templateContainersSelector,
  planTemplateContainerCleanup,
} = require(path.join(repoRoot, 'models/lib/unusedTemplateContainers.js'));
const method = fs.readFileSync(
  path.join(repoRoot, 'server/methods/cleanupTemplateContainers.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const container = (over = {}) => ({
  _id: 'b1',
  type: 'template-container',
  title: 'Templates',
  members: [{ userId: 'u1', isAdmin: true }],
  archived: false,
  starred: false,
  ...over,
});
const EMPTY = { templateCount: 0, listCount: 0, swimlaneCount: 0, cardCount: 0 };
const OPTS = { defaultTitles: ['Templates', 'templates', 'Template Container'] };

test('an untouched, empty container is removable', () => {
  const v = classifyTemplateContainer(container(), EMPTY, OPTS);
  assert.strictEqual(v.removable, true, JSON.stringify(v.reasons));
  assert.deepStrictEqual(v.reasons, []);
});

test('anything saved into it keeps it', () => {
  for (const [field, label] of [
    ['templateCount', 'template'],
    ['cardCount', 'card'],
    ['listCount', 'list'],
    ['swimlaneCount', 'swimlane'],
  ]) {
    const v = classifyTemplateContainer(
      container(), { ...EMPTY, [field]: 1 }, OPTS);
    assert.strictEqual(v.removable, false,
      `a container holding a ${label} was used, so it is not ours to delete`);
    assert.ok(v.reasons.some(r => r.includes(label)),
      `and the reason has to say so: ${JSON.stringify(v.reasons)}`);
  }
});

test('a shared, renamed, starred or archived container keeps it', () => {
  const cases = [
    [container({ members: [{ userId: 'u1' }, { userId: 'u2' }] }), 'shared'],
    [container({ title: 'My project templates' }), 'renamed'],
    [container({ starred: true }), 'starred'],
    [container({ archived: true }), 'archived'],
  ];
  for (const [board, why] of cases) {
    const v = classifyTemplateContainer(board, EMPTY, OPTS);
    assert.strictEqual(v.removable, false,
      `a ${why} container is somebody's, whatever is inside it`);
    assert.ok(v.reasons.length > 0);
  }
});

test('a rename is only a rename against the titles the app really used', () => {
  // The default title is translated and has changed, so the caller supplies the
  // set. Without it, nothing is judged on the title at all - better than
  // deleting a board because its default name is in another language.
  const german = container({ title: 'Vorlagen' });
  assert.strictEqual(classifyTemplateContainer(german, EMPTY, OPTS).removable, false,
    'an unknown title counts as renamed when a list is given');
  assert.strictEqual(classifyTemplateContainer(german, EMPTY, {}).removable, true,
    'and is not judged at all when no list is given');
  assert.strictEqual(
    classifyTemplateContainer(container({ title: '  Templates  ' }), EMPTY, OPTS).removable,
    true, 'whitespace is not a rename');
});

test('nothing that is not a template container is ever touched', () => {
  for (const type of ['board', 'template-board', 'template-list', undefined]) {
    const v = classifyTemplateContainer(container({ type }), EMPTY, OPTS);
    assert.strictEqual(v.removable, false, `type ${type} must be left alone`);
  }
  for (const junk of [null, undefined, 'nope', 42]) {
    assert.strictEqual(classifyTemplateContainer(junk, EMPTY, OPTS).removable, false);
  }
});

test('the selector narrows by type only, so the counts decide', () => {
  assert.deepStrictEqual(templateContainersSelector(), { type: 'template-container' },
    'what makes one removable needs counts from four other collections, so the ' +
    'selector cannot express it and must not pretend to');
});

test('the plan separates what would go from what stays, with reasons', () => {
  const plan = planTemplateContainerCleanup([
    { board: container({ _id: 'empty' }), counts: EMPTY, options: OPTS },
    { board: container({ _id: 'used' }), counts: { ...EMPTY, templateCount: 3 }, options: OPTS },
    { board: container({ _id: 'mine', title: 'Renamed' }), counts: EMPTY, options: OPTS },
  ]);
  assert.deepStrictEqual(plan.remove.map(r => r.boardId), ['empty']);
  assert.deepStrictEqual(plan.keep.map(r => r.boardId).sort(), ['mine', 'used']);
  assert.ok(plan.keep.every(k => k.reasons.length > 0),
    'every kept board must say why it was kept - that is what tells an admin the ' +
    'rule is doing what they think');
});

// ── the method around it ────────────────────────────────────────────────────

test('it does nothing unless asked twice', () => {
  assert.ok(/const apply = options\.apply === true;/.test(method),
    'the default must be a dry run: for thirteen thousand boards that is the ' +
    'difference between a cleanup and an accident');
  const dry = method.indexOf('if (!apply)');
  const remove = method.indexOf('Boards.removeAsync');
  assert.ok(dry !== -1 && remove > dry, 'the dry run returns before anything is removed');
  assert.ok(/wouldRemove: plan\.remove\.length/.test(method),
    'and reports what WOULD go');
  assert.ok(/removeSample|keepSample/.test(method),
    'with a sample rather than thirteen thousand rows');
});

test('only an admin can run it', () => {
  assert.ok(/\?\.isAdmin\) \{[\s\S]{0,120}throw new Meteor\.Error\('not-authorized'/.test(method),
    'it deletes boards across every account');
  const guard = method.indexOf("not-authorized");
  // the CALL, not the definition further up the file
  const scan = method.indexOf('await collectContainers(limit)');
  assert.ok(guard !== -1 && guard < scan,
    'and the check must come before it even reads the boards');
});

test('the user pointer is cleared with the board', () => {
  assert.ok(/profile\.templatesBoardId/.test(method) && /\$unset/.test(method),
    'a profile still pointing at a deleted board is what ensureTemplatesBoard ' +
    'would trip over next');
});

test('a failure on one board does not abandon the rest', () => {
  assert.ok(/failed\.push\(/.test(method) && /catch \(error\)/.test(method),
    'thirteen thousand deletions must not stop at the first problem, and the ' +
    'ones that failed have to be reported');
});

test('the method is registered, or it does not exist', () => {
  const imports = fs.readFileSync(path.join(repoRoot, 'server/imports.js'), 'utf8');
  assert.ok(/import '\/server\/methods\/cleanupTemplateContainers';/.test(imports));
});

console.log(`\n${passed} passed`);
