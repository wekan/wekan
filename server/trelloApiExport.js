import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { Exporter } from '/models/exporter';
import { resolveCreds, trelloSend } from '/server/trelloApiImport';
import { runAsEgressUser } from '/server/sandstormEgress';

const { buildTrelloExportPlan } = require('/models/lib/trelloExportPlan');

// Export a WeKan board to Trello through Trello's REST API: the counterpart of
// the live Trello import in server/trelloApiImport.js, using the same saved
// key/token, the same rate limiting and, on Sandstorm, the same Powerbox grant
// for api.trello.com (server/sandstormEgress.js).
//
// What is sent is the board export (models/exporter.js build()): the same
// access check (canExport), the Admin Panel's export switch, anonymization and
// transfer sanitizing as a JSON export. models/lib/trelloExportPlan.js turns
// it into Trello's shapes.
//
// The work runs detached, as the user who started it; the client polls
// trelloExportStatus. Jobs are kept server-side only and read only by their
// owner.

const TrelloExportJobs = new Mongo.Collection('trello_export_jobs');
const MAX_WARNINGS = 50;

async function progress(jobId, done, extra = {}) {
  await TrelloExportJobs.updateAsync(jobId, { $set: { done, updatedAt: new Date(), ...extra } });
}

// Create the plan in Trello. A failure of one card, checklist, comment or file
// is a warning and the export goes on; a failure to create the board, or a
// rejected key, stops it.
async function runExport(jobId, plan, key, token) {
  let done = 0;
  const warnings = [];
  const warn = async (what, error) => {
    if (warnings.length < MAX_WARNINGS) warnings.push(`${what}: ${(error && (error.reason || error.message)) || error}`);
    await progress(jobId, done, { warnings });
  };
  const step = async () => {
    done += 1;
    if (done % 10 === 0) await progress(jobId, done);
  };
  const send = (method, path, params, body) => trelloSend(method, path, key, token, params, body);

  const board = await send('POST', '/boards/', {
    name: plan.board.name,
    desc: plan.board.desc,
    defaultLists: 'false',
    defaultLabels: 'false',
    prefs_permissionLevel: 'private',
  });
  await step();
  await progress(jobId, done, { trelloBoardUrl: board.url || board.shortUrl || '' });

  const labelIds = new Map();
  for (const label of plan.labels) {
    try {
      const created = await send('POST', '/labels', {
        idBoard: board.id, name: label.name, color: label.color || 'null',
      });
      labelIds.set(label.key, created.id);
    } catch (e) { await warn(`Label "${label.name}"`, e); }
    await step();
  }

  const listIds = new Map();
  for (const list of plan.lists) {
    try {
      const created = await send('POST', '/lists', { idBoard: board.id, name: list.name, pos: 'bottom' });
      listIds.set(list.key, created.id);
    } catch (e) { await warn(`List "${list.name}"`, e); }
    await step();
  }

  const cardIds = new Map();
  for (const card of plan.cards) {
    const idList = listIds.get(card.listKey);
    if (!idList) { await step(); continue; }
    try {
      const params = { idList, name: card.name, desc: card.desc, pos: 'bottom' };
      if (card.due) params.due = card.due;
      if (card.start) params.start = card.start;
      if (card.dueComplete) params.dueComplete = 'true';
      const idLabels = card.labelKeys.map(k => labelIds.get(k)).filter(Boolean);
      if (idLabels.length) params.idLabels = idLabels.join(',');
      const created = await send('POST', '/cards', params);
      cardIds.set(card.key, created.id);
    } catch (e) { await warn(`Card "${card.name}"`, e); }
    await step();
  }

  for (const checklist of plan.checklists) {
    const idCard = cardIds.get(checklist.cardKey);
    if (!idCard) { done += checklist.items.length; await step(); continue; }
    let created = null;
    try {
      created = await send('POST', '/checklists', { idCard, name: checklist.name });
    } catch (e) { await warn(`Checklist "${checklist.name}"`, e); }
    await step();
    for (const item of checklist.items) {
      if (created) {
        try {
          await send('POST', `/checklists/${created.id}/checkItems`, {
            name: item.name, checked: item.checked ? 'true' : 'false', pos: 'bottom',
          });
        } catch (e) { await warn(`Checklist item "${item.name}"`, e); }
      }
      await step();
    }
  }

  for (const comment of plan.comments) {
    const idCard = cardIds.get(comment.cardKey);
    if (idCard) {
      try {
        await send('POST', `/cards/${idCard}/actions/comments`, { text: comment.text });
      } catch (e) { await warn('Comment', e); }
    }
    await step();
  }

  for (const attachment of plan.attachments) {
    const idCard = cardIds.get(attachment.cardKey);
    if (idCard) {
      try {
        const form = new FormData();
        const bytes = Buffer.from(attachment.file, 'base64');
        form.append('file', new Blob([bytes], { type: attachment.mimeType }), attachment.name);
        form.append('name', attachment.name);
        form.append('mimeType', attachment.mimeType);
        await send('POST', `/cards/${idCard}/attachments`, {}, form);
      } catch (e) { await warn(`File "${attachment.name}"`, e); }
    }
    await step();
  }

  // Trello creates lists and cards open; archive the ones that were archived.
  for (const list of plan.lists.filter(l => l.closed)) {
    const id = listIds.get(list.key);
    if (id) {
      try { await send('PUT', `/lists/${id}/closed`, { value: 'true' }); } catch (e) { await warn(`Archiving list "${list.name}"`, e); }
    }
    await step();
  }
  for (const card of plan.cards.filter(c => c.closed)) {
    const id = cardIds.get(card.key);
    if (id) {
      try { await send('PUT', `/cards/${id}`, { closed: 'true' }); } catch (e) { await warn(`Archiving card "${card.name}"`, e); }
    }
    await step();
  }

  await progress(jobId, done, { status: 'done', warnings, finishedAt: new Date() });
}

Meteor.methods({
  // Start exporting a board the caller may export. Returns the job id.
  async trelloExportBoard(boardId, key, token, options) {
    check(boardId, String);
    check(key, String);
    check(token, String);
    check(options, Match.Maybe({ includeAttachments: Match.Maybe(Boolean) }));
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    const userId = this.userId;

    const creds = await resolveCreds(userId, key, token);
    if (!creds) throw new Meteor.Error('trello-api-credentials-required');

    const user = await ReactiveCache.getUser(userId);
    const includeAttachments = !options || options.includeAttachments !== false;
    const exporter = new Exporter(boardId, undefined, {
      excludeAttachments: !includeAttachments,
      userLanguage: (user && user.profile && user.profile.language) || 'en',
    });
    if (!(await exporter.canExport(user))) throw new Meteor.Error('error-notAuthorized');
    const plan = buildTrelloExportPlan(await exporter.build(), { includeAttachments });

    const now = new Date();
    const jobId = await TrelloExportJobs.insertAsync({
      userId, boardId, status: 'running', done: 0, total: plan.total,
      trelloBoardUrl: '', warnings: [], error: '', createdAt: now, updatedAt: now,
    });
    runAsEgressUser(userId, () => runExport(jobId, plan, creds.key, creds.token)).catch(async e => {
      await TrelloExportJobs.updateAsync(jobId, {
        $set: { status: 'error', error: (e && (e.reason || e.message)) || String(e), updatedAt: new Date() },
      }).catch(() => {});
    });
    return jobId;
  },

  // Progress of the caller's own export job.
  async trelloExportStatus(jobId) {
    check(jobId, String);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    const job = await TrelloExportJobs.findOneAsync({ _id: jobId, userId: this.userId });
    if (!job) throw new Meteor.Error('not-found');
    const { status, done, total, trelloBoardUrl, warnings, error } = job;
    return { status, done, total, trelloBoardUrl, warnings, error };
  },
});
