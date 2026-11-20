'use strict';
// Chat exports for Board View / Chat: a channel is a card, its messages the
// card's comments (models/lib/chatExportFormats.js), and a board written as a
// Mattermost bulk import file. The Slack zip is read by server/lib/chatArchives.js.
// Run: node --test tests/chatExportFormats.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { zipSync, strToU8 } = require('fflate');
const { readSlackExport } = require('../server/lib/chatArchives');

let chat;
test.before(async () => { chat = await import('../models/lib/chatExportFormats.js'); });

const zipOf = files => ({ zipBase64: Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([name, value]) => [name, strToU8(typeof value === 'string' ? value : JSON.stringify(value))])))).toString('base64') });

test('Slack: a channel is a card, its days of messages its comments in order', async () => {
  const data = await readSlackExport(zipOf({
    'users.json': [{ id: 'U1', name: 'anna', profile: { display_name: 'Anna' } }, { id: 'U2', name: 'matti', real_name: 'Matti M' }],
    'channels.json': [{ id: 'C1', name: 'general', created: 1790000000, purpose: { value: 'Company-wide' } }],
    'general/2026-11-17.json': [{ type: 'message', user: 'U2', text: 'Second day', ts: '1795424400.000100' }],
    'general/2026-11-16.json': [
      { type: 'message', user: 'U1', text: 'Hi <@U2>, see <https://wekan.fi|WeKan> &amp; <#C1|general>', ts: '1795338000.000100',
        files: [{ id: 'F1' }] },
      { type: 'message', subtype: 'channel_join', user: 'U2', text: 'joined', ts: '1795338001.000100' },
      { type: 'message', user: 'U2', text: 'In the thread', ts: '1795338100.000100', thread_ts: '1795338000.000100' },
    ],
  }));
  const board = chat.parseSlackExport(data);
  assert.strictEqual(board.tasks.length, 1);
  const [general] = board.tasks;
  assert.strictEqual(general.title, '#general');
  assert.strictEqual(general.description, 'Company-wide');
  assert.deepStrictEqual(general.comments.map(c => [c.author, c.authorName, c.text]), [
    ['anna', 'Anna', 'Hi @Matti M, see WeKan (https://wekan.fi) & #general'],
    ['matti', 'Matti M', '↳ In the thread'],
    ['matti', 'Matti M', 'Second day'],
  ]);
  assert.ok(board.unsupported.some(u => /1 file/.test(u.reason)));
  // Negative: a zip that is not a Slack export is refused.
  await assert.rejects(readSlackExport(zipOf({ 'readme.txt': 'x' })), /no channels\.json/);
  await assert.rejects(readSlackExport({ zipBase64: Buffer.from('not a zip').toString('base64') }), /not a \.zip/);
});

test('Mattermost: channels with posts and replies, and the board exported back', () => {
  const jsonl = [
    { type: 'version', version: 1 },
    { type: 'team', team: { name: 'eng', display_name: 'Engineering' } },
    { type: 'channel', channel: { team: 'eng', name: 'town-square', display_name: 'Town Square', type: 'O', purpose: 'All' } },
    { type: 'post', post: { team: 'eng', channel: 'town-square', user: 'anna', message: 'Release today', create_at: 1795338000000,
      replies: [{ user: 'matti', message: 'Ok', create_at: 1795338060000 }] } },
    { type: 'direct_post', direct_post: { channel_members: ['matti', 'anna'], user: 'anna', message: 'Psst', create_at: 1795338100000 } },
  ].map(l => JSON.stringify(l)).join('\n');
  const board = chat.parseMattermostBulk(jsonl);
  assert.strictEqual(board.board.name, 'Engineering');
  assert.deepStrictEqual(board.tasks.map(t => [t.title, t.column_name, t.swimlane_name]),
    [['Town Square', 'Channels', 'Engineering'], ['anna, matti', 'Direct messages', 'Direct messages']]);
  assert.deepStrictEqual(board.tasks[0].comments.map(c => c.text), ['Release today', '↳ Ok']);
  assert.throws(() => chat.parseMattermostBulk('{"type":"post"}'), /no version line/);
  assert.throws(() => chat.parseMattermostBulk('{"type":"version"}\nnot json'), /Line 2 is not JSON/);

  const out = chat.formatMattermostBulk({ board: { title: 'Plant Ö' }, items: [
    { title: 'Order valves', listTitle: 'To Do', description: 'Two', creator: 'anna', createdAt: '2026-11-16T10:00:00.000Z',
      comments: [{ text: 'Done', author: 'matti', date: '2026-11-16T11:00:00.000Z' }] },
    { title: 'Order valves', listTitle: 'Done', creator: 'anna' },
  ] });
  const lines = out.trim().split('\n').map(l => JSON.parse(l));
  assert.deepStrictEqual(lines[0], { type: 'version', version: 1 });
  assert.strictEqual(lines[1].team.name, 'plant-o');
  assert.deepStrictEqual(lines.filter(l => l.type === 'channel').map(l => l.channel.name), ['order-valves', 'order-valves-2']);
  assert.ok(lines.filter(l => l.type === 'user').every(l => /@wekan\.invalid$/.test(l.user.email)));
  // Round trip: what WeKan writes, WeKan reads as the same channels and posts.
  const back = chat.parseMattermostBulk(out);
  assert.deepStrictEqual(back.tasks[0].comments.map(c => [c.author, c.text]), [['anna', 'Two'], ['matti', 'Done']]);
});

test('Telegram: one chat or the whole account, text entities joined', () => {
  const one = { name: 'Perhe', type: 'private_group', id: 1, messages: [
    { id: 1, type: 'message', date: '2026-11-16T10:00:00', date_unixtime: '1794823200', from: 'Anna', from_id: 'user1',
      text: ['Katso ', { type: 'link', text: 'https://wekan.fi' }, '!'] },
    { id: 2, type: 'service', action: 'create_group', date: '2026-11-16T09:00:00' },
    { id: 3, type: 'message', date: '2026-11-16T10:05:00', from: 'Matti', from_id: 'user2', text: '', photo: 'photos/1.jpg' },
  ] };
  const board = chat.parseTelegramExport(one);
  assert.strictEqual(board.tasks[0].column_name, 'Groups');
  assert.deepStrictEqual(board.tasks[0].comments.map(c => [c.author, c.text, c.date]),
    [['user1', 'Katso https://wekan.fi!', '2026-11-16T10:00:00.000Z']]);
  assert.ok(board.unsupported.some(u => /1 file/.test(u.reason)));
  const all = chat.parseTelegramExport({ personal_information: { first_name: 'Anna' }, chats: { list: [one,
    { name: 'Matti', type: 'personal_chat', messages: [] }] } });
  assert.strictEqual(all.board.name, 'Telegram - Anna');
  assert.deepStrictEqual(all.tasks.map(t => t.column_name), ['Groups', 'Direct messages']);
  assert.throws(() => chat.parseTelegramExport({ foo: 1 }), /no chats\.list/);
});

test('WhatsApp: Android and iOS lines, multi-line messages, system lines and media', () => {
  const android = [
    '16/11/2026, 10:00 - Messages and calls are end-to-end encrypted.',
    '16/11/2026, 10:01 - Anna: Hei',
    'toinen rivi',
    '16/11/2026, 22:15 - Matti: <Media omitted>',
    '17/11/2026, 09:00 - Matti: Huomenta',
  ].join('\n');
  const a = chat.parseWhatsAppChat(android, { name: 'Anna' });
  assert.deepStrictEqual(a.tasks[0].comments.map(c => [c.author, c.text, c.date]), [
    ['Anna', 'Hei\ntoinen rivi', '2026-11-16T10:01:00.000Z'],
    ['Matti', 'Huomenta', '2026-11-17T09:00:00.000Z'],
  ]);
  assert.ok(a.unsupported.some(u => /1 file/.test(u.reason)));
  // US order with AM/PM (a month first is seen from a day over 12), and iOS brackets.
  const us = chat.parseWhatsAppChat('11/16/26, 9:05 PM - Anna: Late\n11/17/26, 12:10 AM - Matti: Later');
  assert.deepStrictEqual(us.tasks[0].comments.map(c => c.date), ['2026-11-16T21:05:00.000Z', '2026-11-17T00:10:00.000Z']);
  const ios = chat.parseWhatsAppChat('[16.11.2026 klo 10.00.00] Anna: Moi\n[16.11.2026 klo 10.01.30] Bea: Hei\n[16.11.2026 klo 10.02.00] Cid: Terve');
  assert.strictEqual(ios.tasks[0].comments[1].date, '2026-11-16T10:01:30.000Z');
  assert.strictEqual(ios.tasks[0].column_name, 'Groups');
  assert.throws(() => chat.parseWhatsAppChat('just some text'), /no dated message lines/);
});

test('Discord (DiscordChatExporter) and Google Chat', () => {
  const discord = chat.parseDiscordExport({ guild: { name: 'Gamers' }, channel: { name: 'general', category: 'Text Channels', type: 'GuildTextChat', topic: 'Talk' },
    messages: [{ type: 'Default', timestamp: '2026-11-16T10:00:00+02:00', content: 'gg', author: { name: 'anna', nickname: 'Anna' }, attachments: [{}] },
      { type: 'ChannelPinnedMessage', timestamp: '2026-11-16T10:01:00Z', content: 'pinned', author: { name: 'bot' } }] });
  assert.deepStrictEqual([discord.tasks[0].title, discord.tasks[0].column_name, discord.tasks[0].swimlane_name], ['#general', 'Text Channels', 'Gamers']);
  assert.deepStrictEqual(discord.tasks[0].comments.map(c => [c.author, c.authorName, c.date]), [['anna', 'Anna', '2026-11-16T08:00:00.000Z']]);
  assert.throws(() => chat.parseDiscordExport({ messages: [] }), /no channel and messages/);

  assert.strictEqual(chat.googleChatDate('Monday, November 16, 2026 at 10:00:00 AM UTC'), '2026-11-16T10:00:00.000Z');
  const google = chat.parseGoogleChat([{ name: 'Project', members: [{ name: 'Anna', email: 'anna@example.com' }],
    messages: [{ creator: { name: 'Anna', email: 'anna@example.com' }, created_date: 'Monday, November 16, 2026 at 10:00:00 AM UTC', text: 'Hello' }] }]);
  assert.deepStrictEqual(google.tasks[0].comments.map(c => [c.author, c.text]), [['anna@example.com', 'Hello']]);
  assert.strictEqual(google.tasks[0].column_name, 'Spaces');
});
