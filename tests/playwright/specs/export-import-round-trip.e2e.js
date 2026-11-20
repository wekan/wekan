'use strict';
// The import/export coverage review (TODO.md): every tool WeKan both exports
// to and imports from, round-tripped. A board with a described card, a
// checklist, a comment and a label is exported in the tool's format and the
// file imported back through POST /api/boards/import/<tool>; the card must
// come back with its title, and what each tool's file keeps of the rest is
// held to KEEPS below - a format that starts keeping more makes the test say
// so, so the table is raised with it.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const fs = require('node:fs');
const path = require('node:path');

const headers = token => ({ Authorization: `Bearer ${token}` });
// export format -> [import source, what is sent]: the source's `send` of
// models/lib/importSources.js.
const ROUND_TRIPS = {
  trello: ['trello', 'json'], jira: ['jira', 'json'], kanboard: ['kanboard', 'json'], deck: ['deck', 'json'],
  openproject: ['openproject', 'json'], github: ['github', 'json'], gitlab: ['gitlab', 'json'], gitea: ['gitea', 'json'],
  forgejo: ['forgejo', 'json'], asana: ['asana', 'json'], zenkit: ['zenkit', 'json'], kanri: ['kanri', 'json'],
  tasksorg: ['tasksorg', 'json'], taiga: ['taiga', 'json'],
  markdown: ['markdown', 'text'], leo: ['leo', 'text'], opml: ['opml', 'text'], orgmode: ['orgmode', 'text'],
  todotxt: ['todotxt', 'text'], taskwarrior: ['taskwarrior', 'text'], focalboard: ['focalboard', 'text'],
  todoist: ['todoist', 'text'], meistertask: ['meistertask', 'text'], obsidian: ['obsidian', 'text'],
  linear: ['linear', 'text'], ticktick: ['ticktick', 'text'], clickup: ['clickup', 'text'], nullboard: ['nullboard', 'text'],
  pivotal: ['pivotal', 'text'], redmine: ['redmine', 'text'], superproductivity: ['superproductivity', 'text'],
  quire: ['quire', 'text'], notion: ['notion', 'text'], mbox: ['mail', 'text'], enex: ['evernote', 'text'],
  mattermost: ['mattermost', 'text'],
  planner: ['planner', 'excel'], monday: ['monday', 'excel'], wrike: ['wrike', 'excel'], teamwork: ['teamwork', 'excel'],
  businessmap: ['businessmap', 'excel'],
};
// What each tool's file keeps of the card besides its title, as found
// 2026-11-20. A format that keeps less fails the test; one that keeps more
// fails it too, so its line here is raised with it. What a format has no
// place for (todo.txt has no description, an outline no comments) stays out.
const KEEPS = {
  trello: ['description', 'checklist', 'comment'],
  jira: ['description', 'checklist', 'comment'],
  kanboard: ['description', 'checklist', 'comment'],
  deck: ['description', 'comment'],
  openproject: ['description', 'comment'],
  github: ['description', 'comment'],
  gitlab: ['description', 'comment'],
  gitea: ['description', 'comment'],
  forgejo: ['description', 'comment'],
  asana: ['description', 'checklist', 'comment'],
  zenkit: ['description', 'checklist', 'comment'],
  kanri: ['description', 'checklist'],
  tasksorg: ['description', 'comment'],
  taiga: ['description', 'comment'],
  markdown: ['description'],
  leo: ['description', 'checklist'],
  opml: ['description', 'checklist'],
  orgmode: ['description', 'checklist'],
  todotxt: [],
  taskwarrior: ['description', 'comment'],
  focalboard: ['description', 'checklist', 'comment'],
  todoist: ['description', 'comment'],
  meistertask: ['description'],
  obsidian: ['description', 'checklist'],
  linear: ['description'],
  ticktick: ['description', 'checklist'],
  clickup: ['description', 'checklist'],
  nullboard: ['description'],
  pivotal: ['description', 'checklist', 'comment'],
  redmine: ['description'],
  superproductivity: ['description'],
  quire: ['description'],
  notion: ['description'],
  mbox: ['description', 'comment'],
  enex: ['description', 'checklist'],
  mattermost: ['comment'],
  planner: ['description', 'checklist'],
  monday: ['description'],
  wrike: ['description'],
  teamwork: ['description'],
  businessmap: ['description', 'comment'],
};
const DESCRIPTION = 'Round trip description';
const STEP = 'Round trip step';
const COMMENT = 'Round trip comment';

test('every tool WeKan exports to and imports from: the card comes back, and what else its file keeps', async ({ request, board, user }) => {
  test.setTimeout(600000);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { description: DESCRIPTION } });
  const checklistId = `rtcl${db.uniqueSuffix()}`;
  db.insertOne('checklists', { _id: checklistId, cardId: card._id, boardId: board.boardId, title: 'Round trip list', sort: 0, createdAt: new Date() });
  db.insertOne('checklistItems', { _id: `${checklistId}i`, checklistId, cardId: card._id, boardId: board.boardId, title: STEP, sort: 0, isFinished: true, createdAt: new Date() });
  db.insertOne('card_comments', { _id: `rtco${db.uniqueSuffix()}`, cardId: card._id, boardId: board.boardId, userId: user.id, text: COMMENT, createdAt: new Date() });

  const report = {};
  const imported = [];
  try {
    for (const [format, [source, send]] of Object.entries(ROUND_TRIPS)) {
      await test.step(format, async () => {
        const exportResponse = await request.get(`/api/boards/${board.boardId}/export/${format}?authToken=${encodeURIComponent(user.token)}`);
        expect(exportResponse.status(), `${format} exports`).toBe(200);
        const bytes = await exportResponse.body();
        const payload = send === 'json' ? JSON.parse(bytes.toString('utf8'))
          : send === 'excel' ? { excelBase64: bytes.toString('base64') }
            : bytes.toString('utf8');
        const importResponse = await request.post(`/api/boards/import/${source}`,
          { headers: headers(user.token), data: { board: payload, membersMode: 'me' } });
        const answer = await importResponse.json().catch(() => ({}));
        const boardId = answer && answer._id;
        report[format] = { status: importResponse.status(), error: boardId ? undefined : (answer.reason || answer.error || answer.message) };
        if (!boardId) return;
        imported.push(boardId);
        const cards = db.find('cards', { boardId, archived: { $ne: true } });
        const back = cards.find(c => String(c.title || '').includes('Alpha Card'));
        report[format].title = Boolean(back);
        if (!back) return;
        report[format].description = String(back.description || '').includes(DESCRIPTION);
        report[format].checklist = db.find('checklistItems', { cardId: back._id }).some(item => item.title === STEP);
        report[format].comment = db.find('card_comments', { cardId: back._id }).some(c => String(c.text || '').includes(COMMENT));
      });
    }
  } finally {
    fs.mkdirSync(path.join(__dirname, '../../../.tools/tmp'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../../../.tools/tmp/round-trip-report.json'), JSON.stringify(report, null, 2));
    db.cleanup({ boardIds: imported });
  }
  const lost = Object.entries(report).filter(([, r]) => !r.title).map(([format, r]) => `${format}: ${r.error || `status ${r.status}, no card`}`);
  expect(lost, 'every round trip brings the card back').toEqual([]);
  const differ = Object.entries(report).filter(([, r]) => r.title).map(([format, r]) => {
    const keeps = ['description', 'checklist', 'comment'].filter(name => r[name]);
    return JSON.stringify(keeps) === JSON.stringify(KEEPS[format]) ? null : `${format}: keeps ${keeps.join(', ') || 'nothing'} - KEEPS says ${KEEPS[format].join(', ') || 'nothing'}`;
  }).filter(Boolean);
  expect(differ, 'each tool keeps what KEEPS says, no less and no more').toEqual([]);
});
