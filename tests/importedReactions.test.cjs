'use strict';

// Reactions on imported chat messages become WeKan comment reactions
// (models/lib/importedReactions.js). Slack, Mattermost, Telegram and Discord
// exports all carry who reacted with what, and every one of them was dropped
// without a word in the import loss report.
// Run: node tests/importedReactions.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { reactionCodepoint, importedReactions, SHORTCODES } = await import('../models/lib/importedReactions.js');
  const chat = await import('../models/lib/chatExportFormats.js');
  const { importedComment } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  // What models/cardCommentReactions.js accepts.
  const valid = code => typeof code === 'string' && code.length <= 9 && /^&#\d{4,6};$/.test(code);

  test('one emoji or a known shortcode is a code point the comment reactions accept', () => {
    assert.equal(reactionCodepoint({ emoji: '👍' }), '&#128077;');
    assert.equal(reactionCodepoint({ emoji: '❤️' }), '&#10084;', 'the variation selector is not a second code point');
    assert.equal(reactionCodepoint({ name: 'thumbsup' }), '&#128077;');
    assert.equal(reactionCodepoint({ name: ':+1:' }), '&#128077;');
    assert.equal(reactionCodepoint({ name: 'tada' }), '&#127881;');
    for (const [name, point] of Object.entries(SHORTCODES)) {
      assert.ok(valid(`&#${point};`), `${name} fits the schema`);
    }
  });

  test('negative: several code points, an unknown shortcode, a custom emoji and junk are no code point', () => {
    for (const reaction of [{ emoji: '👍🏽' }, { emoji: '🇫🇮' }, { emoji: '👨‍👩‍👧' }, { emoji: 'ab' }, { emoji: 'A' },
      { name: 'party_parrot' }, { name: 'custom:blobwave' }, {}, { emoji: 42 }, undefined]) {
      assert.equal(reactionCodepoint(reaction), null, JSON.stringify(reaction));
    }
  });

  test('a reaction is kept by who reacted; unmapped people and unknown emoji are counted', () => {
    const { reactions, unknown, unmapped } = importedReactions([
      { emoji: '👍', authors: ['ann', 'bob', 'cid'], count: 3 },
      { name: 'thumbsup', authors: ['dan'], count: 1 },
      { name: 'party_parrot', authors: ['ann'], count: 1 },
      { emoji: '🎉', authors: [], count: 5 },
      { emoji: '👀', authors: ['ann'], count: 4 },
    ], { ann: 'u1', bob: 'u2', dan: 'u4' });
    assert.deepEqual(reactions, [
      { reactionCodepoint: '&#128077;', userIds: ['u1', 'u2', 'u4'] },
      { reactionCodepoint: '&#128064;', userIds: ['u1'] },
    ]);
    assert.equal(unknown, 1);
    assert.equal(unmapped, 1 + 5 + 3, 'cid, the five 🎉 and three of the four 👀 were not named or not mapped');
    for (const r of reactions) assert.ok(valid(r.reactionCodepoint));
  });

  test('the import plan carries a comment\'s reactions and what was lost of them', () => {
    const comment = importedComment({ text: 'Ship it', author: 'ann', reactions: [
      { emoji: '🚀', authors: ['ann', 'zed'], count: 2 }, { name: 'nope', authors: ['ann'], count: 1 }] }, { ann: 'u1' });
    assert.deepEqual(comment.reactions, [{ reactionCodepoint: '&#128640;', userIds: ['u1'] }]);
    assert.equal(comment.reactionsUnknown, 1);
    assert.equal(comment.reactionsUnmapped, 1);
    const plain = importedComment({ text: 'No reactions', author: 'ann' }, { ann: 'u1' });
    assert.equal(plain.reactions, undefined);
    assert.equal(plain.reactionsUnknown, undefined);
  });

  test('Slack, Mattermost, Telegram and Discord exports carry their reactions to the comment', () => {
    const slack = chat.parseSlackExport({
      users: [{ id: 'U1', name: 'ann' }, { id: 'U2', name: 'bob' }],
      channels: [{ id: 'C1', name: 'general' }],
      messages: { general: [{ type: 'message', user: 'U1', ts: '1790000000.000100', text: 'hi',
        reactions: [{ name: 'thumbsup', users: ['U1', 'U2'], count: 2 }] }] },
    });
    assert.deepEqual(slack.tasks[0].comments[0].reactions, [{ name: 'thumbsup', authors: ['ann', 'bob'], count: 2 }]);

    const mm = chat.parseMattermostBulk([
      JSON.stringify({ type: 'version', version: 1 }),
      JSON.stringify({ type: 'post', post: { team: 't', channel: 'town', user: 'ann', message: 'hi', create_at: 1790000000000,
        reactions: [{ user: 'bob', emoji_name: '+1' }, { user: 'cid', emoji_name: '+1' }, { user: 'bob', emoji_name: 'tada' }],
        replies: [{ user: 'bob', message: 'yo', create_at: 1790000001000, reactions: [{ user: 'ann', emoji_name: 'heart' }] }] } }),
    ].join('\n'));
    const [post, reply] = mm.tasks[0].comments;
    assert.deepEqual(post.reactions, [{ name: '+1', authors: ['bob', 'cid'], count: 2 }, { name: 'tada', authors: ['bob'], count: 1 }]);
    assert.deepEqual(reply.reactions, [{ name: 'heart', authors: ['ann'], count: 1 }]);

    const tg = chat.parseTelegramExport({ name: 'G', type: 'private_group', id: 1, messages: [
      { type: 'message', id: 1, date: '2026-10-01T10:00:00', date_unixtime: '1790000000', from: 'Ann', from_id: 'user1', text: 'hi',
        reactions: [{ type: 'emoji', emoji: '👍', count: 3, recent: [{ from: 'Bob', from_id: 'user2' }] },
          { type: 'custom_emoji', document_id: '55', count: 1 }] }] });
    assert.deepEqual(tg.tasks[0].comments[0].reactions, [
      { emoji: '👍', name: '', authors: ['user2'], count: 3 }, { emoji: '', name: 'custom:55', authors: [], count: 1 }]);

    const dc = chat.parseDiscordExport({ guild: { name: 'G' }, channel: { id: '1', name: 'general', type: 'GuildTextChat' }, messages: [
      { type: 'Default', content: 'hi', timestamp: '2026-10-01T10:00:00Z', author: { id: '9', name: 'ann' },
        reactions: [{ emoji: { id: '', name: '🔥' }, count: 2, users: [{ id: '8', name: 'bob' }] },
          { emoji: { id: '777', name: 'blob' }, count: 1, users: [{ id: '9', name: 'ann' }] }] }] });
    assert.deepEqual(dc.tasks[0].comments[0].reactions, [
      { emoji: '🔥', name: '', authors: ['bob'], count: 2 }, { emoji: '', name: 'custom:blob', authors: ['ann'], count: 1 }]);
    // A message without reactions carries none.
    const quiet = chat.parseDiscordExport({ channel: { id: '1', name: 'g' }, messages: [
      { content: 'hi', timestamp: '2026-10-01T10:00:00Z', author: { name: 'ann' } }] });
    assert.equal(quiet.tasks[0].comments[0].reactions, undefined);
  });

  test('the creator writes the reaction row and reports what it could not keep', () => {
    const children = read('models/lib/importedCardChildren.js');
    assert.match(children, /CardCommentReactions\.insertAsync\(\{\s*boardId, cardId, cardCommentId: commentId, reactions: comment\.reactions,/);
    const creator = read('models/kanboardCreator.js');
    assert.match(creator, /reaction\(s\) with an emoji WeKan cannot store/);
    assert.match(creator, /reaction\(s\) of people not mapped to a WeKan user are not imported/);
  });

  test('negative: no import writes a reaction code point except through the mapper', () => {
    const dir = path.join(__dirname, '..', 'models');
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    for (const file of walk(dir).filter(f => f.endsWith('.js'))) {
      const rel = path.relative(path.join(__dirname, '..'), file);
      if (rel === 'models/lib/importedReactions.js' || rel === 'models/cardCommentReactions.js') continue;
      const source = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(source, /reactionCodepoint:\s*[`'"]&#/, `${rel} builds a reaction code point of its own`);
    }
  });

  console.log(`importedReactions: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
