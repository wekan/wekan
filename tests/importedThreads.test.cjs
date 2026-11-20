'use strict';

// Chat thread replies become WeKan comment replies (parentId, one level, as
// models/cardComments.js resolveParentId keeps them). Slack, Mattermost,
// Telegram and Discord all say which message a reply answers; the import made
// every reply a comment of its own, marked "↳ " at best.
// Run: node tests/importedThreads.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { threadImportedComments, planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const chat = await import('../models/lib/chatExportFormats.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a reply goes under the comment it answers; a reply to a reply under that one\'s parent', () => {
    const out = threadImportedComments([
      { text: 'Release today', ref: 'a' },
      { text: 'Ok', ref: 'b', replyTo: 'a' },
      { text: 'Ok too', ref: 'c', replyTo: 'b' },
      { text: 'Unrelated', ref: 'd' },
    ]);
    assert.deepEqual(out.map(c => [c.text, c.parentIndex]), [
      ['Release today', undefined], ['Ok', 0], ['Ok too', 0], ['Unrelated', undefined]]);
    assert.ok(out.every(c => c.ref === undefined && c.replyTo === undefined), 'the keys are the import\'s own, not stored');
  });

  test('negative: a reply to a message that is not on the card stays a comment of its own, marked', () => {
    const out = threadImportedComments([{ text: 'Answer', replyTo: 'gone' }, { text: '↳ Already marked', replyTo: 'gone' },
      { text: 'Self', ref: 's', replyTo: 's' }]);
    assert.deepEqual(out.map(c => [c.text, c.parentIndex]), [['↳ Answer', undefined], ['↳ Already marked', undefined], ['↳ Self', undefined]]);
  });

  test('every chat export gives its replies, through the plan, a parent', () => {
    const threaded = board => planImportedTask(board.tasks[0]).comments.map(c => [c.text, c.parentIndex]);
    const slack = chat.parseSlackExport({ users: [{ id: 'U1', name: 'ann' }], channels: [{ id: 'C1', name: 'g' }], messages: { g: [
      { type: 'message', user: 'U1', ts: '1.1', text: 'Q' }, { type: 'message', user: 'U1', ts: '2.1', thread_ts: '1.1', text: 'A' }] } });
    assert.deepEqual(threaded(slack), [['ann: Q', undefined], ['ann: A', 0]]);
    const mm = chat.parseMattermostBulk([JSON.stringify({ type: 'version', version: 1 }), JSON.stringify({ type: 'post',
      post: { team: 't', channel: 'c', user: 'ann', message: 'Q', create_at: 1, replies: [{ user: 'bob', message: 'A', create_at: 2 }] } })].join('\n'));
    assert.deepEqual(threaded(mm), [['ann: Q', undefined], ['bob: A', 0]]);
    const tg = chat.parseTelegramExport({ name: 'G', type: 'private_group', id: 1, messages: [
      { type: 'message', id: 10, date_unixtime: '1790000000', from: 'Ann', from_id: 'u1', text: 'Q' },
      { type: 'message', id: 11, date_unixtime: '1790000060', from: 'Bob', from_id: 'u2', text: 'A', reply_to_message_id: 10 }] });
    assert.deepEqual(threaded(tg), [['Ann: Q', undefined], ['Bob: A', 0]]);
    const dc = chat.parseDiscordExport({ channel: { id: '1', name: 'g' }, messages: [
      { id: '100', type: 'Default', content: 'Q', timestamp: '2026-10-01T10:00:00Z', author: { name: 'ann' } },
      { id: '101', type: 'Reply', content: 'A', timestamp: '2026-10-01T10:01:00Z', author: { name: 'bob' }, reference: { messageId: '100' } }] });
    assert.deepEqual(threaded(dc), [['ann: Q', undefined], ['bob: A', 0]]);
  });

  test('the writer stores a reply with its parent comment\'s id', () => {
    const children = read('models/lib/importedCardChildren.js');
    assert.match(children, /const parentId = comment\.parentIndex !== undefined \? ids\[comment\.parentIndex\] : undefined;/);
    assert.match(children, /text: comment\.text, userId, \.\.\.\(parentId \? \{ parentId \} : \{\}\)/);
    assert.match(children, /ids\.push\(commentId\);/);
    // Negative: the parsers no longer write the marker themselves.
    assert.doesNotMatch(read('models/lib/chatExportFormats.js'), /'↳ '|`↳ \$\{/);
  });

  console.log(`importedThreads: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
