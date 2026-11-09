'use strict';

// Guard: UnassignedArchiveBleed, GHSA-6xqf-jh8x-4wxc (2026-11-08). The DDP methods archiveSelectedCards
// and createBoardFromCard asked only for the board's `write` capability. The
// normal-assigned-only role has write: true but sees only its own cards, so a
// member with that role archived - and hid - cards not assigned to them, and
// turned any card into a linked-board card. Both now ask the card as well
// (assignedOnlyAllowsCard), as copyCard does, and record a refusal.
// Run: node tests/assignedCardMethods.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { assignedOnlyAllowsCard } = require('../models/lib/boardCardScope');
const { memberCan } = require('../models/lib/boardRoleCapabilities');

const board = {
  _id: 'B',
  members: [
    { userId: 'owner', isActive: true, isAdmin: true },
    { userId: 'member', isActive: true, isNormalAssignedOnly: true },
    { userId: 'normal', isActive: true },
  ],
};

// The decision both methods make now: board write AND the card.
const mayChangeCard = (userId, card) => memberCan(board.members, userId, 'write') && assignedOnlyAllowsCard(board, userId, card);

test('the reported attack: an assigned-only member may not change a card not assigned to them', () => {
  const theirs = { _id: 'C', boardId: 'B', assignees: ['someone-else'] };
  // The old check alone let them through - that was the hole.
  assert.equal(memberCan(board.members, 'member', 'write'), true);
  assert.equal(mayChangeCard('member', theirs), false);
  assert.equal(mayChangeCard('member', { _id: 'D', boardId: 'B' }), false, 'a card with no assignees is not theirs either');
});

test('their own card, and everybody else with write, still may', () => {
  assert.equal(mayChangeCard('member', { _id: 'C', boardId: 'B', assignees: ['member'] }), true);
  for (const userId of ['owner', 'normal']) {
    assert.equal(mayChangeCard(userId, { _id: 'C', boardId: 'B', assignees: [] }), true);
  }
});

function methodBody(src, name) {
  const start = src.indexOf(`async ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const next = src.slice(start + 1).search(/\n  async [\w']+\(/);
  return next < 0 ? src.slice(start) : src.slice(start, start + 1 + next);
}

test('archiveSelectedCards checks every card of the selection before archiving the first', () => {
  const body = methodBody(read('server/models/cards.js'), 'archiveSelectedCards');
  const check = body.indexOf('cards.every(card => assignedOnlyAllowsCard(board, this.userId, card))');
  assert.ok(check > 0, 'every card is checked');
  assert.ok(check < body.indexOf('.archive()'), 'before the first card is archived');
  assert.match(body, /recordUnassignedCardWrite\(this\.userId, 'method:archiveSelectedCards'\);\n\s+throw new Meteor\.Error\('not-authorized'\)/);
});

test('createBoardFromCard checks the card before making a board or changing the card', () => {
  const body = methodBody(read('server/models/cards.js'), 'createBoardFromCard');
  const check = body.indexOf('assignedOnlyAllowsCard(sourceBoard, this.userId, card)');
  assert.ok(check > 0);
  assert.ok(check < body.indexOf('Boards.insertAsync'), 'before the board is made');
  assert.ok(check < body.indexOf('Cards.updateAsync'), 'before the card is changed');
  assert.match(body, /recordUnassignedCardWrite\(this\.userId, 'method:createBoardFromCard'\);\n\s+throw new Meteor\.Error\('not-authorized'\)/);
});

test('a refusal is recorded as UnassignedArchiveBleed, and logging never breaks the guard', () => {
  const src = read('server/models/cards.js');
  const fn = src.slice(src.indexOf('function recordUnassignedCardWrite'), src.indexOf('async function createLinkedCardFor'));
  assert.match(fn, /try \{\n\s+require\('\/server\/lib\/securityLog'\)\.record\(\{\n\s+key: 'authz\.assigned-card-write', action: 'blocked', source, userId,/);
  assert.match(fn, /\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.match(read('models/lib/securityCategories.js'),
    /'authz\.assigned-card-write':\s*\{ category: 'authz', bleed: 'UnassignedArchiveBleed', severity: 'medium', cwe: 'CWE-863' \}/);
});

// The shape, anywhere on the server: a method that takes a card id and decides
// by the write capability of that card's own board alone. Every such method
// must also ask the card (assignedOnlyAllowsCard, mayCopyFromBoard, or
// canEditCardOrLinkedCard, which asks it). A check of a DESTINATION board
// (destBoard, destination, target) is a different question and not counted.
function serverFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...serverFiles(rel));
    else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

test('negative: no method taking a card id decides by board write access alone', () => {
  const offenders = [];
  for (const file of serverFiles('server')) {
    const src = read(file);
    const starts = [...src.matchAll(/\n\s+async '?([\w.]+)'?\(([^)]*)\)\s*\{/g)];
    starts.forEach((m, i) => {
      const params = m[2];
      if (!/\bcardIds?\b/.test(params)) return;
      const body = src.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : undefined);
      const boards = [...body.matchAll(/allowIsBoardMemberWithWriteAccess\(this\.userId, (\w+)\)/g)].map(x => x[1]);
      const own = boards.filter(v => !/dest|destination|target/i.test(v));
      if (!own.length) return;
      if (!/assignedOnlyAllowsCard\(|mayCopyFromBoard\(|canEditCardOrLinkedCard\(/.test(body)) {
        offenders.push(`${file}: ${m[1]}`);
      }
    });
  }
  assert.deepEqual(offenders, [], 'these decide a card write by the board alone');
});
