'use strict';

// #6532: "Migrated Images don't show in Card view".
//
// After an upgrade from WeKan 6, an attachment that came through a migration can
// arrive without the flags Meteor-Files writes at upload time - `isImage`,
// `isVideo`, `isPDF` - and sometimes without `extension` or `type` either. The
// card view renders from exactly those flags:
//
//   if(isImage)  img.attachment-thumbnail(src="{{link}}")
//   ...
//   else         span.attachment-thumbnail-text= extension
//
// so a migrated image fell through to the last branch and, with no extension to
// print, drew an empty white box - while the SAME `link` downloaded the file and
// the board view showed it as a cover. That is the report exactly: visible in
// board view, downloadable, invisible in the card view, cannot be maximized, and
// only for cards created BEFORE the upgrade.
//
// The kind of a file is derivable - from its mime type, or from its name. These
// are the rules, and the repair that writes them back to the documents.
//
// Run: node tests/attachmentKind.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

// The module is ESM; load it the way the other ESM tests here do.
let attachmentKind;
let attachmentKindFix;

(async () => {
  ({ attachmentKind, attachmentKindFix } = await import('../models/lib/attachmentKind.js'));

  console.log('attachmentKind:');

  test('the reported case: a migrated image with nothing but a name', () => {
    const migrated = { _id: 'a1', name: 'screenshot.png', meta: { cardId: 'c1' } };
    const kind = attachmentKind(migrated);
    assert.strictEqual(kind.isImage, true, 'this is what drew the white box');
    assert.strictEqual(kind.extension, 'png');
    assert.strictEqual(kind.type, 'image/png', 'derived, so the viewer can open it too');
  });

  test('a document that DOES say is believed, not second-guessed', () => {
    const uploaded = { name: 'photo.jpg', type: 'image/jpeg', extension: 'jpg', isImage: true };
    assert.deepStrictEqual(attachmentKind(uploaded), {
      extension: 'jpg', type: 'image/jpeg',
      isImage: true, isVideo: false, isAudio: false,
      isPDF: false, isJSON: false, isText: false,
    });
    // ...and nothing to repair.
    assert.strictEqual(attachmentKindFix(uploaded), null);
  });

  test('the mime type wins over the name when they disagree', () => {
    // A .txt that is really a PNG is a PNG: the type is the stronger statement.
    const kind = attachmentKind({ name: 'notes.txt', type: 'image/png' });
    assert.strictEqual(kind.isImage, true);
    assert.strictEqual(kind.isText, false);
  });

  test('every kind the card view renders is derivable from a name alone', () => {
    const cases = [
      ['a.png', 'isImage'], ['a.JPG', 'isImage'], ['a.jpeg', 'isImage'],
      ['a.gif', 'isImage'], ['a.webp', 'isImage'], ['a.svg', 'isImage'],
      ['a.heic', 'isImage'], ['a.tiff', 'isImage'],
      ['a.mp4', 'isVideo'], ['a.webm', 'isVideo'], ['a.mov', 'isVideo'],
      ['a.mp3', 'isAudio'], ['a.ogg', 'isAudio'], ['a.flac', 'isAudio'],
      ['a.pdf', 'isPDF'], ['a.json', 'isJSON'], ['a.txt', 'isText'],
    ];
    for (const [name, expected] of cases) {
      const kind = attachmentKind({ name });
      assert.strictEqual(kind[expected], true, `${name} must be ${expected}`);
    }
  });

  test('a file that says nothing and is nothing stays nothing', () => {
    const kind = attachmentKind({ name: 'archive.zip' });
    assert.strictEqual(kind.isImage, false);
    assert.strictEqual(kind.extension, 'zip', 'but the extension still prints in the box');
    const nameless = attachmentKind({ _id: 'x' });
    assert.strictEqual(nameless.isImage, false);
    assert.strictEqual(nameless.extension, '');
    assert.strictEqual(nameless.type, '');
  });

  test('a name is not trusted to be a plain name', () => {
    // Path separators and query strings must not become the "extension".
    assert.strictEqual(attachmentKind({ name: 'a.png/../evil' }).extension, '');
    assert.strictEqual(attachmentKind({ name: 'photo.png?x=1' }).extension, 'png');
    assert.strictEqual(attachmentKind({ name: '.hidden' }).extension, '',
      'a dotfile has no extension');
    assert.strictEqual(attachmentKind({ name: 'trailing.' }).extension, '');
  });

  test('the type is read from wherever the document happens to carry it', () => {
    for (const doc of [
      { name: 'x', mime: 'image/png' },
      { name: 'x', 'mime-type': 'image/png' },
      { name: 'x', contentType: 'image/png' },
      { name: 'x', versions: { original: { type: 'image/png' } } },
    ]) {
      assert.strictEqual(attachmentKind(doc).isImage, true, JSON.stringify(doc));
    }
  });

  test('the repair writes exactly what is missing, and nothing else', () => {
    const fix = attachmentKindFix({ _id: 'a1', name: 'screenshot.png' });
    assert.deepStrictEqual(fix, {
      isImage: true, extension: 'png', ext: 'png', type: 'image/png',
    });
    // An existing (correct) value is never overwritten.
    const partial = attachmentKindFix({ name: 'clip.mp4', type: 'video/mp4', extension: 'mp4' });
    assert.deepStrictEqual(partial, { isVideo: true },
      '`extension` and `ext` are one fact: a document that has either keeps it');
    // Nothing derivable: nothing to write.
    assert.strictEqual(attachmentKindFix({ _id: 'x' }), null);
  });

  test('the card view and the viewer both ask the helper', () => {
    const src = read('client/components/cards/attachments.js');
    assert.ok(/import \{ attachmentKind \} from '\/models\/lib\/attachmentKind';/.test(src));
    assert.ok(/isImage\(\) \{\s*\n\s*return attachmentKind\(this\)\.isImage;/.test(src),
      'the gallery helper - a Blaze helper wins over the data context');
    assert.ok(/extension\(\) \{\s*\n\s*return attachmentKind\(this\)\.extension;/.test(src));
    assert.ok(/const kind = attachmentKind\(attachment\);[\s\S]*?case \(kind\.isImage\)/.test(src),
      'and the viewer, or a thumbnail that renders still would not open');
    assert.ok(!/case \(attachment\.isImage\)/.test(src), 'no raw flag left in the switch');
  });

  test('and the stored documents are repaired on startup', () => {
    const steps = read('server/lib/schemaUpgradeSteps.js');
    assert.ok(/name: 'attachment-kind-flags'/.test(steps), 'the step must exist');
    const step = steps.slice(steps.indexOf("name: 'attachment-kind-flags'"));
    assert.ok(/attachmentKindFix/.test(step.slice(0, 1500)), 'using the same rules');
    assert.ok(/unresolved \+= 1;/.test(step.slice(0, 1800)),
      'a file whose kind cannot be told is counted, not guessed at');
  });

  console.log(`\n${passed} tests passed`);
})();
