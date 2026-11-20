'use strict';
// On the server ReactiveCache's getters are async (imports/reactiveCache.js,
// ReactiveCacheServer): they return a Promise. A Promise kept in a variable
// and then read as the document - `user.orgs`, `comment.text` - is undefined.
// Two places did that: getMyShareableGroups (server/sharedTemplateTargets.js),
// so All Boards / Templates never offered a group to share a template with,
// and the Sandstorm activity notifier (server/sandstorm.js), where
// `comment.text.match` threw on every comment.
//
// The sweep: in every file under server/, an assignment of an async
// ReactiveCache getter's result must await it or chain .then on it. A Promise
// handed straight to Promise.all, returned, or passed as an argument is fine.
// Run: node --test tests/serverReactiveCacheAwaited.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const cache = read('imports/reactiveCache.js');
const serverStart = cache.indexOf('ReactiveCacheServer = {');
const serverPart = cache.slice(serverStart, cache.indexOf('\n};', serverStart));
const ASYNC = new Set([...serverPart.matchAll(/\n {2}async (\w+)\(/g)].map(m => m[1]));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('_build')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

// Index just past the call's closing parenthesis.
function callEnd(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')' && --depth === 0) return i + 1;
  }
  return src.length;
}

function unawaitedAssignments(src) {
  const found = [];
  const re = /(?:\b(?:const|let|var)\s+[\w$]+|[\w$.]+)\s*=\s*ReactiveCache\.(\w+)\(/g;
  for (const m of src.matchAll(re)) {
    if (!ASYNC.has(m[1])) continue;
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    if (/^\s*(\/\/|\*)/.test(src.slice(lineStart, m.index + 1))) continue;
    const end = callEnd(src, m.index + m[0].length - 1);
    if (/^\s*\.then\(/.test(src.slice(end))) continue;
    found.push(`${src.slice(0, m.index).split('\n').length}: ${m[0]}`);
  }
  return found;
}

test('the server getters are async, so the sweep has something to check', () => {
  for (const name of ['getUser', 'getCard', 'getBoard', 'getCardComment', 'getCurrentSetting']) {
    assert.ok(ASYNC.has(name), name);
  }
});

test('the two fixed places await', () => {
  assert.match(read('server/sharedTemplateTargets.js'), /const user = await ReactiveCache\.getUser\(this\.userId\);/);
  const sandstorm = read('server/sandstorm.js');
  for (const call of ['getCard(doc.cardId)', 'getCardComment(doc.commentId)', 'getBoard(doc.boardId)']) {
    assert.ok(sandstorm.includes(`= await ReactiveCache.${call}`), call);
  }
});

test('negative: no file under server/ keeps an unawaited ReactiveCache Promise', () => {
  const bad = [];
  for (const file of walk(path.join(root, 'server'))) {
    for (const hit of unawaitedAssignments(fs.readFileSync(file, 'utf8'))) {
      bad.push(`${path.relative(root, file)}:${hit}`);
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('negative: the sweep itself catches the shape it is for', () => {
  assert.deepStrictEqual(unawaitedAssignments('const user = ReactiveCache.getUser(id);\nuser.orgs;').length, 1);
  assert.deepStrictEqual(unawaitedAssignments('const user = await ReactiveCache.getUser(id);'), []);
  assert.deepStrictEqual(unawaitedAssignments('ids = ReactiveCache.getCards(sel, opts).then(c => c);'), []);
  assert.deepStrictEqual(unawaitedAssignments('// const x = ReactiveCache.getUser(id)'), []);
});
