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
  vikunja: ['vikunja', 'zip'],
};
// What each tool's file keeps of the card besides its title, as found
// 2026-11-20. A format that keeps less fails the test; one that keeps more
// fails it too, so its line here is raised with it. What a format has no
// place for (todo.txt has no description, an outline no comments) stays out.
// 'dependency': Alpha Card blocks Beta Card; 'label' a board label on it;
// 'due' its due day.
const KEEPS = {
  trello: ['description', 'checklist', 'comment', 'label', 'due'],
  jira: ['description', 'checklist', 'comment', 'dependency', 'label', 'due'],
  kanboard: ['description', 'checklist', 'comment', 'dependency', 'label', 'due'],
  deck: ['description', 'comment', 'label', 'due'],
  openproject: ['description', 'comment', 'dependency', 'due'],
  github: ['description', 'comment', 'label', 'due'],
  gitlab: ['description', 'comment', 'label', 'due'],
  gitea: ['description', 'comment', 'label', 'due'],
  forgejo: ['description', 'comment', 'label', 'due'],
  asana: ['description', 'checklist', 'comment', 'dependency', 'label', 'due'],
  zenkit: ['description', 'checklist', 'comment', 'label', 'due'],
  kanri: ['description', 'checklist', 'label', 'due'],
  tasksorg: ['description', 'comment', 'label', 'due'],
  taiga: ['description', 'comment', 'label', 'due'],
  markdown: ['description'],
  leo: ['description', 'checklist'],
  opml: ['description', 'checklist'],
  orgmode: ['description', 'checklist', 'label', 'due'],
  todotxt: ['label', 'due'],
  taskwarrior: ['description', 'comment', 'dependency', 'label', 'due'],
  focalboard: ['description', 'checklist', 'comment', 'label', 'due'],
  todoist: ['description', 'comment', 'label', 'due'],
  meistertask: ['description', 'label', 'due'],
  obsidian: ['description', 'checklist', 'dependency', 'label', 'due'],
  linear: ['description', 'label', 'due'],
  ticktick: ['description', 'checklist', 'label', 'due'],
  clickup: ['description', 'checklist', 'label', 'due'],
  nullboard: ['description'],
  pivotal: ['description', 'checklist', 'comment', 'label'],
  redmine: ['description', 'dependency', 'label', 'due'],
  superproductivity: ['description', 'label', 'due'],
  quire: ['description', 'label', 'due'],
  notion: ['description', 'label', 'due'],
  mbox: ['description', 'comment', 'label'],
  enex: ['description', 'checklist', 'label', 'due'],
  mattermost: ['comment'],
  planner: ['description', 'checklist', 'label', 'due'],
  monday: ['description', 'label', 'due'],
  wrike: ['description', 'dependency', 'due'],
  teamwork: ['description', 'label', 'due'],
  businessmap: ['description', 'comment', 'label', 'due'],
  vikunja: ['description', 'checklist', 'comment', 'dependency', 'label', 'due'],
};
const DESCRIPTION = 'Round trip description';
const STEP = 'Round trip step';
const COMMENT = 'Round trip comment';

test('every tool WeKan exports to and imports from: the card comes back, and what else its file keeps', async ({ request, board, user }) => {
  test.setTimeout(600000);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  // A label of the board, and a due date.
  const labelId = `rtlabel${db.uniqueSuffix()}`;
  db.updateOne('boards', { _id: board.boardId }, { $push: { labels: { _id: labelId, name: 'Roundtriplabel', color: 'green' } } });
  db.updateOne('cards', { _id: card._id }, { $set: { description: DESCRIPTION, cardDependencies: [{ cardId: beta._id, type: 'blocks' }],
    labelIds: [labelId], dueAt: new Date('2026-12-24T12:00:00Z') } });
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
            : send === 'zip' ? { zipBase64: bytes.toString('base64') }
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
        const betaBack = cards.find(c => String(c.title || '').includes('Beta Card'));
        const backBoard = db.findOne('boards', { _id: boardId }) || {};
        report[format].label = (back.labelIds || []).some(id => (backBoard.labels || []).some(l => l._id === id && /roundtriplabel/i.test(l.name || '')));
        report[format].due = Boolean(back.dueAt) && new Date(back.dueAt).toISOString().slice(0, 10) === '2026-12-24';
        // Stored on either card: "Alpha blocks Beta" is also "Beta is blocked by Alpha".
        report[format].dependency = Boolean(betaBack && ((back.cardDependencies || []).some(dep => dep.cardId === betaBack._id)
          || (betaBack.cardDependencies || []).some(dep => dep.cardId === back._id)));
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
    const keeps = ['description', 'checklist', 'comment', 'dependency', 'label', 'due'].filter(name => r[name]);
    return JSON.stringify(keeps) === JSON.stringify(KEEPS[format]) ? null : `${format}: keeps ${keeps.join(', ') || 'nothing'} - KEEPS says ${KEEPS[format].join(', ') || 'nothing'}`;
  }).filter(Boolean);
  expect(differ, 'each tool keeps what KEEPS says, no less and no more').toEqual([]);
});
