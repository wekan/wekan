'use strict';
// Microsoft Teams: Graph chat messages (fetched, a Graph page, or the Teams
// Export API's messages_<user>.json), the personal export's messages.json
// (in its .tar), read as a board for Board View / Chat, and a board written
// as Teams chats (models/lib/chatExportFormats.js parseTeamsExport /
// formatTeams, models/lib/apiImport/teams.js, server/lib/microsoftArchives.js).
// Run: node --test tests/teamsApiImport.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

let chat;
let client;
test.before(async () => {
  chat = await import('../models/lib/chatExportFormats.js');
  client = await import('../models/lib/apiImport/teams.js');
});

const graphMessage = (id, name, html, at, extra = {}) => ({ id, messageType: 'message', createdDateTime: at,
  from: { user: { id: `u-${name}`, displayName: name } }, body: { contentType: 'html', content: html }, ...extra });

test('Graph chat messages: HTML as text, files as links, reactions, system events counted', () => {
  const board = chat.parseTeamsExport({ teams: true, chats: [{ id: 'c1', topic: 'Launch', chatType: 'group', kind: 'chat', messages: [
    graphMessage('2', 'Alex Wilber', '<p>Ship it <b>today</b>&nbsp;&amp; tell me</p>', '2026-11-20T10:05:00Z', {
      attachments: [{ name: 'plan.docx', contentUrl: 'https://contoso.sharepoint.com/plan.docx' }],
      reactions: [{ reactionType: 'like', user: { user: { id: 'u-Megan Bowen', displayName: 'Megan Bowen' } } }] }),
    graphMessage('1', 'Megan Bowen', 'Ready?', '2026-11-20T10:00:00Z', { body: { contentType: 'text', content: 'Ready?' } }),
    { id: '3', messageType: 'systemEventMessage', createdDateTime: '2026-11-20T10:06:00Z' },
    graphMessage('4', 'Alex Wilber', '', '2026-11-20T10:07:00Z', { deletedDateTime: '2026-11-20T10:08:00Z' }),
  ] }] });
  assert.strictEqual(board.board.name, 'Launch');
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Groups']);
  const comments = board.tasks[0].comments;
  assert.deepStrictEqual(comments.map(c => c.text), ['Ready?', 'Ship it today & tell me\nplan.docx: https://contoso.sharepoint.com/plan.docx']);
  assert.strictEqual(comments[1].authorName, 'Alex Wilber');
  assert.deepStrictEqual(comments[1].reactions, [{ emoji: '👍', name: '', authors: ['u-Megan Bowen'], count: 1 }]);
  assert.ok(board.unsupported.some(u => /1 Teams system event/.test(u.reason)));
  assert.ok(board.unsupported.some(u => /1 deleted/.test(u.reason)));
});

test('a channel with replies, and the Export API\'s messages of many chats grouped by chat', () => {
  const channel = chat.parseTeamsExport({ teams: true, chats: [{ id: 'ch', topic: 'General', kind: 'channel', team: 'Mark 8', messages: [
    graphMessage('10', 'Lee Gu', 'Agenda?', '2026-11-20T09:00:00Z', { replies: [graphMessage('11', 'Megan Bowen', 'Posted', '2026-11-20T09:05:00Z')] }),
  ] }] });
  assert.deepStrictEqual([channel.columns[0].title, channel.swimlanes[0].name], ['Channels', 'Mark 8']);
  assert.deepStrictEqual(channel.tasks[0].comments.map(c => [c.text, c.reply_to || '']), [['Agenda?', ''], ['Posted', '10']]);
  const many = chat.parseTeamsExport([
    { ...graphMessage('1', 'A', 'one', '2026-11-20T09:00:00Z'), chatId: 'chat-a' },
    { ...graphMessage('2', 'B', 'two', '2026-11-20T09:01:00Z'), chatId: 'chat-b' },
    { ...graphMessage('3', 'A', 'three', '2026-11-20T09:02:00Z'), chatId: 'chat-a' },
  ]);
  assert.deepStrictEqual(many.tasks.map(t => [t.title, t.comments.length]), [['chat-a', 2], ['chat-b', 1]]);
});

test('the personal export\'s messages.json (Skype layout), read from its .tar', async () => {
  const personal = { userId: '8:live:megan', exportDate: '2026-11-20T12:00:00Z', conversations: [{
    id: '19:abc@thread.v2', displayName: 'Family', threadProperties: { members: '["8:live:a","8:live:b","8:live:c"]' },
    MessageList: [
      { id: '1', displayName: 'Megan', originalarrivaltime: '2026-11-19T18:00:00.000Z', messagetype: 'RichText/Html', content: '<p>Dinner at 7?</p>', from: '8:live:megan' },
      { id: '2', displayName: null, originalarrivaltime: '2026-11-19T18:01:00.000Z', messagetype: 'Event/Call', content: '<partlist/>', from: '8:live:a' },
      { id: '3', displayName: 'Alex', originalarrivaltime: '2026-11-19T18:02:00.000Z', messagetype: 'Text', content: 'Yes', from: '8:live:alex' },
    ] }] };
  const board = chat.parseTeamsExport(JSON.stringify(personal));
  assert.deepStrictEqual(board.tasks[0].comments.map(c => c.text), ['Dinner at 7?', 'Yes']);
  assert.strictEqual(board.columns[0].title, 'Groups');
  // A ustar .tar with a media file before messages.json.
  const block = (name, data) => {
    const header = Buffer.alloc(512);
    header.write(name, 0); header.write('0000644\0', 100); header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124);
    header.write('0', 156); header.write('ustar\0', 257); header.write('00', 263);
    return Buffer.concat([header, data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
  };
  const tar = Buffer.concat([block('media/a.jpg', Buffer.alloc(700, 1)), block('export/messages.json', Buffer.from(JSON.stringify(personal))), Buffer.alloc(1024)]);
  const { readTeamsExport } = require('../server/lib/microsoftArchives');
  const fromTar = await readTeamsExport({ binaryBase64: tar.toString('base64') });
  assert.strictEqual(fromTar.conversations[0].displayName, 'Family');
});

test('round trip: the export reads back with its lists, swimlanes, descriptions and comments', () => {
  const doc = chat.formatTeams({ items: [{ title: 'Launch', listTitle: 'Doing', swimlaneTitle: 'Team A', description: 'All about <the> launch',
    createdAt: '2026-11-20T09:00:00.000Z', comments: [{ text: 'Ready?\nSoon.', author: 'megan', date: '2026-11-20T10:00:00.000Z' }] }] });
  assert.strictEqual(doc.chats[0].messages[0].body.content, '<p>Ready?<br>Soon.</p>');
  const back = chat.parseTeamsExport(JSON.parse(JSON.stringify(doc)));
  const card = back.tasks[0];
  assert.deepStrictEqual([card.title, card.column_name, card.swimlane_name, card.description], ['Launch', 'Doing', 'Team A', 'All about <the> launch']);
  assert.deepStrictEqual(card.comments.map(c => [c.text, c.author, c.date]), [['Ready?\nSoon.', 'megan', '2026-11-20T10:00:00.000Z']]);
});

test('the API client lists chats and channels and fetches one, every page, only from Graph', async () => {
  const calls = [];
  const pages = {
    'https://graph.microsoft.com/v1.0/me/chats': { value: [{ id: 'c1', topic: 'Launch', chatType: 'group' }] },
    'https://graph.microsoft.com/v1.0/me/joinedTeams': { value: [{ id: 't1', displayName: 'Mark 8' }] },
    'https://graph.microsoft.com/v1.0/teams/t1/channels': { value: [{ id: 'ch1', displayName: 'General' }] },
    'https://graph.microsoft.com/v1.0/chats/c1': { id: 'c1', topic: 'Launch', chatType: 'group' },
    'https://graph.microsoft.com/v1.0/chats/c1/messages?$top=50': { value: [graphMessage('1', 'A', 'one', '2026-11-20T09:00:00Z')],
      '@odata.nextLink': 'https://graph.microsoft.com/v1.0/chats/c1/messages?$skiptoken=2' },
    'https://graph.microsoft.com/v1.0/chats/c1/messages?$skiptoken=2': { value: [graphMessage('2', 'B', 'two', '2026-11-20T09:01:00Z')] },
  };
  const request = async (url, opts) => { calls.push([url, opts.headers.Authorization]); if (!pages[url]) throw new Error(`no ${url}`); return pages[url]; };
  assert.deepStrictEqual(await client.list({ token: 'T' }, request), [{ id: 'chat:c1', name: 'Launch' }, { id: 'channel:t1:ch1', name: 'Mark 8 / General' }]);
  const fetched = await client.fetch({ token: 'T' }, 'chat:c1', request);
  assert.strictEqual(fetched.chats[0].messages.length, 2);
  assert.ok(calls.every(([url, auth]) => url.startsWith('https://graph.microsoft.com/') && auth === 'Bearer T'));
  assert.strictEqual(chat.parseTeamsExport(fetched).tasks[0].comments.length, 2);
});

test('negative: a next link off Graph, no token, and data that is not Teams\' are refused', async () => {
  const request = async () => ({ value: [], '@odata.nextLink': 'https://evil.example/steal' });
  await assert.rejects(client.list({ token: 'T' }, request), /another host/);
  await assert.rejects(client.list({}, request), /token is required/);
  assert.throws(() => chat.parseTeamsExport({ hello: 'world' }), /Not Microsoft Teams messages/);
  assert.throws(() => chat.parseTeamsExport('not json'), /not valid JSON/);
  const { messagesJsonFromTar } = require('../server/lib/microsoftArchives');
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || require('os').tmpdir(), 'teams-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'x.tar'), Buffer.alloc(1024));
    await assert.rejects(messagesJsonFromTar(path.join(dir, 'x.tar')), /no messages\.json/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
