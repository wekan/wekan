'use strict';

// Email feedback, "problems_snap_upgrading_from_6.09_to_10.85": an admin upgraded
// 6.09 -> 10.85 by the documented route - dump, move the common directory aside,
// refresh, restore - and it worked: the boards were back. Then came the last step
// they took from the upgrade notes, to get their attachments:
//
//   cp -pR /root/common/* /var/snap/wekan/common/
//
// Run: node tests/snapCopyBackDestroysDatabase.test.cjs
//
// That copies the OLD raw database files on top of the ones the RUNNING mongod has
// open. Their log shows what follows, seconds later:
//
//   mongodb-control: line 489: 351018 Aborted   ... $SNAP/bin/mongod --dbpath=...
//   snap.wekan.mongodb.service: Main process exited, code=exited, status=134/n/a
//
// "After that, Wekan was still running, but all the boards were missing."
//
// Step 3 of the procedure moves the whole directory aside, so undoing it with a
// matching `common/*` is the obvious move - and it is the one command in the whole
// upgrade that destroys the database that was just restored. Only `files`
// (attachments and avatars, which are not in the database) may be copied back.
//
// So: the documentation says that in the step where the mistake is made, and the
// snap recognises the abort it produces instead of printing nothing but "Aborted".

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const backupDoc = read('docs/Backup/Backup.md');
const mongodbControl = read('snap-src/bin/mongodb-control');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapCopyBackDestroysDatabase:');

test('the upgrade step copies files/ back, and says what copying the rest costs', () => {
  const at = backupDoc.indexOf('Copy back **only the `files` directory**');
  assert.notStrictEqual(at, -1,
    'the step has to name the ONE directory that may be copied back');
  const step = backupDoc.slice(at, at + 1600);
  assert.ok(/cp -pR \/root\/common\/files \/var\/snap\/wekan\/common\//.test(step),
    'with the command, since that is what gets copied out of the page');
  assert.ok(/Do NOT copy the rest of `\/root\/common` back/.test(step),
    'and the warning must be about the exact wrong command, not a general caution');
  assert.ok(/SIGABRT|134/.test(step),
    'naming what the failure looks like, so somebody who has already done it can ' +
    'recognise their own log');
  assert.ok(/journal\//.test(step) && /storage\.bson/.test(step),
    'and which files those are');
  assert.ok(/STOPPED snap/.test(step),
    'the whole-directory restore IS a real procedure - it just needs the snap stopped ' +
    'and the current contents removed, which is what makes it a different operation');
});

test('the step is above the "going back to 6.09" procedure it must not be confused with', () => {
  const step = backupDoc.indexOf('Copy back **only the `files` directory**');
  const back = backupDoc.indexOf('going back to WeKan Snap Stable 6.09');
  assert.ok(step > -1 && back > step,
    'that procedure moves the whole directory back on purpose, on a stopped snap - ' +
    'a reader who meets it first is the one who copies everything into a running one');
});

test('mongodb-control explains SIGABRT instead of leaving "Aborted" as the whole story', () => {
  const at = mongodbControl.indexOf('"$rc" -eq 134');
  assert.notStrictEqual(at, -1, 'exit 134 needs a case of its own, like 132 (SIGILL) has');
  const branch = mongodbControl.slice(at, at + 1400);
  assert.ok(/data directory being/.test(branch) && /RUNNING mongod/.test(branch),
    'and it has to name the cause: the files were replaced underneath it');
  assert.ok(/cp -pR \/root\/common\/\*/.test(branch),
    'by the command that actually does it in the field');
  assert.ok(/database-restore/.test(branch),
    'and say how to get the data back - the dump is the only way out of this one');
  assert.ok(mongodbControl.indexOf('"$rc" -eq 132') < at,
    'kept beside the other exit-code explanation rather than somewhere new');
});

console.log(`\nsnapCopyBackDestroysDatabase: ${passed} tests passed`);
