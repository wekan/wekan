'use strict';

// The attachment API's JSON branches - REST /api/attachment/upload,
// upload-background and copy, and their Meteor-method twins in
// server/attachmentApi.js - created the file with Attachments.insertAsync.
// Meteor-Files (ostrio:files 3) has insertAsync only on the CLIENT; on the
// server it is not a function, so every one of them failed with a 500. They
// store with writeAsync now, whose after-upload hook validates the file and
// moves it to the default (or copy) storage.
// Run: node tests/attachmentApiServerWrite.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
const code = src => src.replace(/\/\/[^\n]*/g, '');

test('upload, background and copy store with writeAsync and run the after-upload hook', () => {
  for (const file of ['server/routes/attachmentApi.js', 'server/attachmentApi.js']) {
    const src = code(read(file));
    const writes = src.match(/await Attachments\.writeAsync\(fileBuffer, \{[^}]*meta,\s*\}, true\);/g) || [];
    assert.strictEqual(writes.length, 3, `${file}: upload, background and copy`);
    for (const w of writes) assert.match(w, /userId/, `${file}: the file records who stored it`);
  }
  // Admin Panel's site logo upload had the same call.
  assert.match(code(read('server/siteLogoUpload.js')),
    /await Attachments\.writeAsync\(bytes, \{fileName:`site-\$\{kind\}-logo\$\{type\[1\]\}`, type:type\[0\], userId:this\.userId, meta:/);
});

test('the hook, not a second deferred move, takes the file to its storage', () => {
  for (const file of ['server/routes/attachmentApi.js', 'server/attachmentApi.js']) {
    const src = code(read(file));
    assert.doesNotMatch(src, /moveToStorage\(uploader,/, `${file}: moved twice`);
  }
  const hook = read('models/attachments.server.js');
  assert.match(hook, /let storageDestination = fileObj\.meta\.copyStorage \|\| defaultStorage;/);
});

test('negative: no server file calls insertAsync on a Meteor-Files collection', () => {
  const collections = ['Attachments', 'Avatars'];
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '_build') continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|cjs|mjs)$/.test(entry.name)) continue;
      const serverSide = rel.startsWith('server/') || /\.server\.js$/.test(rel);
      if (!serverSide) continue;
      const src = code(read(rel));
      for (const name of collections) {
        if (new RegExp(`\\b${name}\\.insertAsync\\(`).test(src)) offenders.push(`${rel}: ${name}.insertAsync`);
      }
    }
  };
  ['server', 'models'].forEach(walk);
  assert.deepStrictEqual(offenders, []);
});

console.log(`\n${passed} tests passed`);
