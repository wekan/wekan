'use strict';
// Chat exports for Board View / Chat: a channel is a card, its messages the
// card's comments (models/lib/chatExportFormats.js), and a board written as a
// Mattermost bulk import file. The Slack zip is read by server/lib/chatArchives.js.
// Run: node --test tests/chatExportFormats.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { zipSync, strToU8 } = require('fflate');
const { readSlackExport } = require('../server/lib/chatArchives');
const fs = require('node:fs');
const path = require('node:path');

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
    ['matti', 'Matti M', 'In the thread'],
    ['matti', 'Matti M', 'Second day'],
  ]);
  // A thread reply is a reply to its parent's comment now, not a "↳" line
  // (tests/importedReactions.test.cjs runs the threading).
  assert.strictEqual(general.comments[1].reply_to, '1795338000.000100');
  assert.strictEqual(general.comments[0].ref, '1795338000.000100');
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
  assert.deepStrictEqual(board.tasks[0].comments.map(c => c.text), ['Release today', 'Ok']);
  assert.strictEqual(board.tasks[0].comments[1].reply_to, board.tasks[0].comments[0].ref, 'the reply answers its post');
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

test('a zipped Telegram export folder: the message files beside result.json are attached to the chat card', async () => {
  const { readTelegramExport } = require('../server/lib/chatArchives');
  const data = await readTelegramExport(zipOf({
    'ChatExport_2026-11-20/result.json': JSON.stringify({ name: 'Team', type: 'private_group', id: 1, messages: [
      { type: 'message', id: 1, date_unixtime: '1790000000', from: 'Ann', from_id: 'u1', text: 'Look', photo: 'photos/photo_1.jpg' },
      { type: 'message', id: 2, date_unixtime: '1790000060', from: 'Bob', from_id: 'u2', text: 'Spec', file: 'files/spec.pdf', file_name: 'spec.pdf' },
      { type: 'message', id: 3, date_unixtime: '1790000120', from: 'Bob', from_id: 'u2', text: 'Video', file: '(File not included. Change data exporting settings to download.)' },
    ] }),
    'ChatExport_2026-11-20/photos/photo_1.jpg': 'JPEGDATA',
    'ChatExport_2026-11-20/files/spec.pdf': 'PDFDATA',
    'ChatExport_2026-11-20/files/unused.bin': 'NOT READ',
  }));
  assert.deepStrictEqual(Object.keys(data.attachedFiles).sort(), ['files/spec.pdf', 'photos/photo_1.jpg'], 'only the files the messages name are read');
  const board = chat.parseTelegramExport(data);
  assert.deepStrictEqual(board.tasks[0].attachments.map(a => [a.name, Buffer.from(a.file, 'base64').toString()]),
    [['photo_1.jpg', 'JPEGDATA'], ['spec.pdf', 'PDFDATA']]);
  // Negative: the file the export left out is counted, not guessed.
  assert.ok(board.unsupported.some(u => /1 file\(s\) and image\(s\) in messages are not imported/.test(u.reason)));
  // The JSON alone, as before: every file is counted.
  const plain = chat.parseTelegramExport(JSON.parse(JSON.stringify({ ...data, attachedFiles: undefined })));
  assert.strictEqual(plain.tasks[0].attachments, undefined);
  assert.ok(plain.unsupported.some(u => /3 file\(s\)/.test(u.reason)));
  await assert.rejects(readTelegramExport(zipOf({ 'readme.txt': 'x' })), /no export JSON/);
});

test('a zipped DiscordChatExporter folder with --media: local attachments are attached, linked ones counted', async () => {
  const { readDiscordExport } = require('../server/lib/chatArchives');
  const data = await readDiscordExport(zipOf({
    'general.json': JSON.stringify({ guild: { name: 'G' }, channel: { id: '1', name: 'general' }, messages: [
      { id: '1', type: 'Default', content: 'Here', timestamp: '2026-10-01T10:00:00Z', author: { name: 'ann' },
        attachments: [{ url: 'general.json_Files/shot%20one.png', fileName: 'shot one.png' }, { url: 'https://cdn.discordapp.com/x.png', fileName: 'x.png' }] }] }),
    'general.json_Files/shot one.png': 'PNGDATA',
  }));
  const board = chat.parseDiscordExport(data);
  assert.deepStrictEqual(board.tasks[0].attachments.map(a => a.name), ['shot one.png']);
  assert.ok(board.unsupported.some(u => /1 file\(s\)/.test(u.reason)), 'the linked one is counted');
  // The wiring: both accept a .zip, read on the server.
  const sources = fs.readFileSync(path.join(__dirname, '../models/lib/importSources.js'), 'utf8');
  for (const key of ['telegram', 'discord']) assert.match(sources, new RegExp(`key: '${key}'[^\\n]*files: \\['\\.json', '\\.zip'\\], zipSend: 'zip'`));
  assert.match(fs.readFileSync(path.join(__dirname, '../server/lib/messageImports.js'), 'utf8'), /archives\.readTelegramExport\(value\) : archives\.readDiscordExport\(value\)/);
});

// Rocket.Chat, as its source writes and reads it: "Download my data" as JSON
// (apps/meteor/server/lib/dataExport - channels.json a { roomId, roomName,
// type } line per room, <roomName>.json a { msg, username, ts, attachments,
// type } line per message, assets/<fileId>-<fileName>) and the CSV importer's
// zip (apps/meteor/server/lib/import/csv/CsvImporter.ts).
const jsonl = rows => rows.map(row => JSON.stringify(row)).join('\n') + '\n';

test('Rocket.Chat "Download my data": rooms by type, messages in order, files from assets/ attached', async () => {
  const { readRocketChatExport } = require('../server/lib/chatArchives');
  const data = await readRocketChatExport(zipOf({
    'export/channels.json': jsonl([
      { roomId: 'R1', roomName: 'general', type: 'c' },
      { roomId: 'R2', roomName: 'board-team', type: 'p' },
      { roomId: 'R3R4', roomName: 'R3R4', type: 'd' },
      { roomId: 'R5', roomName: '../escape', type: 'c' },
    ]),
    'export/general.json': jsonl([
      { msg: 'Second', username: 'matti', ts: '2026-11-16T10:05:00.000Z' },
      { msg: 'First', username: 'anna', ts: '2026-11-16T10:00:00.000Z',
        attachments: [{ type: 'file', title: 'plan.pdf', fileId: 'F1', fileName: 'plan.pdf', url: '/file-upload/F1/plan.pdf', remote: false }] },
      { msg: 'User joined the channel', username: 'matti', ts: '2026-11-16T09:59:00.000Z', type: 'uj' },
      { msg: '', username: 'anna', ts: '2026-11-16T10:06:00.000Z', attachments: [{ type: 'file', fileId: 'F2', fileName: 'gone.png' }] },
    ]),
    'export/board-team.json': jsonl([{ msg: 'Private', username: 'anna', ts: '2026-11-16T11:00:00.000Z' }]),
    'export/R3R4.json': jsonl([{ msg: 'Hi', username: 'anna', ts: '2026-11-16T12:00:00.000Z' }, { msg: 'Hello', username: 'matti', ts: '2026-11-16T12:01:00.000Z' }]),
    'export/assets/F1-plan.pdf': '%PDF-1.4',
    'export/user.json': '{"username":"anna"}',
  }));
  const board = chat.parseRocketChatExport(data);
  assert.deepStrictEqual(board.tasks.map(t => [t.title, t.column_name, t.swimlane_name]), [
    ['#general', 'Channels', 'Rocket.Chat'],
    ['#board-team', 'Groups', 'Rocket.Chat'],
    // A direct message room is named by its people, not its id.
    ['anna, matti', 'Direct messages', 'Rocket.Chat'],
  ]);
  const [general] = board.tasks;
  assert.deepStrictEqual(general.comments.map(c => [c.author, c.text, c.date]), [
    ['anna', 'First', '2026-11-16T10:00:00.000Z'],
    ['matti', 'Second', '2026-11-16T10:05:00.000Z'],
  ]);
  assert.deepStrictEqual(general.attachments.map(a => [a.name, Buffer.from(a.file, 'base64').toString()]), [['plan.pdf', '%PDF-1.4']]);
  assert.ok(board.unsupported.some(u => /1 system message/.test(u.reason)), 'the join is reported, not imported');
  assert.ok(board.unsupported.some(u => /1 file\(s\)/.test(u.reason)), 'a file the zip does not hold is counted');
});

test('Rocket.Chat: one room\'s .json pasted, and what is not a Rocket.Chat export', () => {
  const board = chat.parseRocketChatExport(jsonl([{ msg: 'Only room', username: 'anna', ts: '2026-11-16T10:00:00.000Z' }]));
  assert.deepStrictEqual(board.tasks.map(t => [t.title, t.comments.length]), [['#Rocket.Chat', 1]]);
  assert.throws(() => chat.parseRocketChatExport({}), /Not a Rocket.Chat export/);
  assert.throws(() => chat.parseRocketChatExport(jsonl([{ content: 'Discord', author: {} }])), /username and ts/);
});

test('Rocket.Chat CSV importer zip: channels, users\' names, direct messages', async () => {
  const { readRocketChatExport } = require('../server/lib/chatArchives');
  const data = await readRocketChatExport(zipOf({
    'users.csv': 'anna,anna@example.com,Anna A\nmatti,matti@example.com,Matti M\n',
    'channels.csv': 'general,anna,public,anna;matti\nsecret,matti,private,matti\n',
    'general/messages.csv': 'anna,1795338000000,"Hello, ""all""\nsecond line"\nmatti,1795338060000,Reply\n',
    'directmessages/messages.csv': 'matti,anna,1795338120000,Psst\n',
  }));
  const board = chat.parseRocketChatExport(data);
  assert.deepStrictEqual(board.tasks.map(t => [t.title, t.column_name, t.comments.length]), [
    ['#general', 'Channels', 2], ['#secret', 'Groups', 0], ['anna, matti', 'Direct messages', 1],
  ]);
  assert.deepStrictEqual(board.tasks[0].comments.map(c => [c.author, c.authorName, c.text, c.date]), [
    ['anna', 'Anna A', 'Hello, "all"\nsecond line', new Date(1795338000000).toISOString()],
    ['matti', 'Matti M', 'Reply', new Date(1795338060000).toISOString()],
  ]);
  await assert.rejects(readRocketChatExport(zipOf({ 'readme.txt': 'x' })), /no channels\.json and no channels\.csv/);
});

test('Rocket.Chat export: the CSV importer zip, read back the same', async () => {
  const built = chat.formatRocketChat({ board: { title: 'Plant' }, items: [
    { title: 'Valve Ö', description: 'Replace, "soon"', creator: 'Anna', createdAt: '2026-11-16T10:00:00.000Z',
      comments: [{ author: 'matti', text: 'Done\nyesterday', date: '2026-11-16T11:00:00.000Z' }] },
    { title: 'Valve Ö', creator: 'anna', comments: [] },
  ] });
  // Names Rocket.Chat accepts by default, unique, and no header rows.
  assert.deepStrictEqual(built.channels.map(c => c[0]), ['valve-o', 'valve-o-2']);
  assert.ok(built.users.every(u => /^[0-9a-zA-Z._-]+$/.test(u[0]) && u[1].endsWith('@wekan.invalid')));
  const files = chat.rocketChatCsvFiles(built);
  assert.deepStrictEqual(Object.keys(files).sort(), ['channels.csv', 'users.csv', 'valve-o-2/messages.csv', 'valve-o/messages.csv']);
  assert.doesNotMatch(files['users.csv'], /^username/);
  const { readRocketChatExport } = require('../server/lib/chatArchives');
  const back = chat.parseRocketChatExport(await readRocketChatExport(zipOf(files)));
  assert.deepStrictEqual(back.tasks.map(t => t.title), ['#valve-o', '#valve-o-2']);
  assert.deepStrictEqual(back.tasks[0].comments.map(c => [c.author, c.text, c.date]), [
    ['anna', 'Replace, "soon"', '2026-11-16T10:00:00.000Z'],
    ['matti', 'Done\nyesterday', '2026-11-16T11:00:00.000Z'],
  ]);
  // Negative: a name that is not a safe folder is never a path in the zip.
  assert.deepStrictEqual(Object.keys(chat.rocketChatCsvFiles({ messages: { '../x': [['a', '1', 'b']], directmessages: [] } })).sort(), ['channels.csv', 'users.csv']);
});

test('Rocket.Chat is wired into the import page, the server, the export menu and api.py', () => {
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.match(read('models/lib/importSources.js'), /key: 'rocketchat', name: 'Rocket\.Chat'[^\n]*files: \['\.zip', '\.json'\], zipSend: 'zip'/);
  assert.match(read('server/lib/messageImports.js'), /readRocketChatExport\(value\)/);
  assert.match(read('models/import.js'), /case 'rocketchat':/);
  assert.match(read('models/lib/importSourceShape.js'), /case 'rocketchat':/);
  assert.match(read('client/components/boards/exportScope.js'), /key: 'rocketchat'[^\n]*path: 'export\/rocketchat', ext: 'zip'/);
  assert.match(read('server/lib/renderExternalExport.js'), /format === 'rocketchat'[\s\S]*rocketChatCsvFiles\(built\)/);
  assert.match(read('api.py'), /ZIP_IMPORT_SOURCES = \{[^}]*'rocketchat'/);
});
