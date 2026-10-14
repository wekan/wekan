// #687: CalDAV sync of card due dates (models/lib/caldavSync.js). A board
// admin links the board to a calendar collection - its address, a user and
// an app password - kept in a server-only collection, never published.
// Requests go through webhookFetch: the SSRF guard, so a calendar on WeKan's
// own network (a Nextcloud beside it) is reached only when a site admin lists
// it under Internal destinations.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { allowIsBoardAdmin } from '/server/lib/utils';
import { SyncedCron } from '/server/cron/syncedCron';

const { shouldSync, eventIcs, resourceUrl, eventStart, cleanLink } = require('/models/lib/caldavSync');

// { _id: boardId, url, username, password, enabled } - never published.
export const CalDavLinks = new Mongo.Collection('caldavLinks');
CalDavLinks.deny({ insert: () => true, update: () => true, remove: () => true });
// { _id: cardId, boardId, due } - the due date last pushed, to tell a change
// made in the calendar from one made in WeKan.
export const CalDavState = new Mongo.Collection('caldavState');
CalDavState.deny({ insert: () => true, update: () => true, remove: () => true });

function auth(link) {
  return link.username || link.password
    ? { Authorization: `Basic ${Buffer.from(`${link.username || ''}:${link.password || ''}`).toString('base64')}` } : {};
}

async function request(link, url, options) {
  const { webhookFetch } = require('/server/sandstormEgress');
  return webhookFetch(url, { ...options, headers: { ...auth(link), ...(options.headers || {}) }, totalTimeoutMs: 20000 });
}

async function pushCard(link, card) {
  const url = resourceUrl(link.url, card._id);
  if (!url) return;
  if (!shouldSync(card)) {
    await request(link, url, { method: 'DELETE' }).catch(() => {});
    await CalDavState.removeAsync(card._id);
    return;
  }
  const board = await Boards.findOneAsync(card.boardId, { fields: { slug: 1 } });
  const root = String(process.env.ROOT_URL || Meteor.absoluteUrl()).replace(/\/+$/, '');
  const ics = eventIcs(card, { url: `${root}/b/${card.boardId}/${(board && board.slug) || 'board'}/${card._id}` });
  const res = await request(link, url, { method: 'PUT', headers: { 'Content-Type': 'text/calendar; charset=utf-8' }, body: ics });
  if (res && res.status >= 200 && res.status < 300) {
    await CalDavState.upsertAsync(card._id, { $set: { boardId: card.boardId, due: new Date(card.dueAt) } });
  }
}

async function linkFor(boardId) {
  const link = await CalDavLinks.findOneAsync(boardId);
  return link && link.enabled && link.url ? link : null;
}

// After a card's due date, title or archived state changed.
Cards.after.update(function (userId, doc, fieldNames) {
  if (!(fieldNames || []).some(f => ['dueAt', 'title', 'archived', 'boardId'].includes(f))) return;
  Meteor.defer(async () => {
    try {
      const link = await linkFor(doc.boardId);
      if (link) await pushCard(link, doc);
    } catch (error) {
      console.warn(`CalDAV push skipped: ${error && error.message}`);
    }
  });
}, { fetchPrevious: false });

// A due date moved in the calendar comes back to the card.
async function readBack() {
  const links = await CalDavLinks.find({ enabled: true }, { limit: 200 }).fetchAsync();
  for (const link of links) {
    const states = await CalDavState.find({ boardId: link._id }, { limit: 500 }).fetchAsync();
    for (const state of states) {
      try {
        const res = await request(link, resourceUrl(link.url, state._id), { method: 'GET' });
        if (!res || !res.ok) continue;
        const start = eventStart(await res.text());
        if (!start || Math.abs(start - new Date(state.due)) < 60 * 1000) continue;
        await Cards.updateAsync({ _id: state._id, boardId: link._id, archived: false }, { $set: { dueAt: start } });
        await CalDavState.updateAsync(state._id, { $set: { due: start } });
      } catch (error) { /* the next pass */ }
    }
  }
}

Meteor.startup(() => {
  try {
    SyncedCron.add({ name: 'wekan-caldav-read-back', schedule: parser => parser.text('every 15 minutes'), job: () => readBack() });
  } catch (e) {
    console.error('caldavSync: failed to register cron job', e);
  }
});

async function requireBoardAdmin(userId, boardId) {
  const board = userId && await Boards.findOneAsync(boardId);
  if (!board || !allowIsBoardAdmin(userId, board)) throw new Meteor.Error('not-authorized');
  return board;
}

Meteor.methods({
  async getCalDavLink(boardId) {
    check(boardId, String);
    await requireBoardAdmin(this.userId, boardId);
    const link = await CalDavLinks.findOneAsync(boardId);
    return { url: (link && link.url) || '', username: (link && link.username) || '', enabled: !!(link && link.enabled),
      hasPassword: !!(link && link.password) };
  },
  // A blank password keeps the saved one.
  async saveCalDavLink(boardId, input) {
    check(boardId, String);
    check(input, { url: String, username: String, password: Match.Optional(String), enabled: Boolean });
    await requireBoardAdmin(this.userId, boardId);
    const { value, error } = cleanLink(input);
    if (error) throw new Meteor.Error(error);
    const set = { ...value };
    if (input.password) set.password = input.password.slice(0, 500);
    await CalDavLinks.upsertAsync(boardId, { $set: set });
    return true;
  },
  // Push every card of the board now.
  async syncCalDavNow(boardId) {
    check(boardId, String);
    await requireBoardAdmin(this.userId, boardId);
    const link = await linkFor(boardId);
    if (!link) throw new Meteor.Error('caldav-not-linked');
    const cards = await Cards.find({ boardId, archived: false, dueAt: { $exists: true } }, { limit: 2000 }).fetchAsync();
    let pushed = 0;
    for (const card of cards) {
      try { await pushCard(link, card); pushed += 1; } catch (e) { /* counted as not pushed */ }
    }
    return { pushed, total: cards.length };
  },
});

for (const name of ['getCalDavLink', 'saveCalDavLink', 'syncCalDavNow']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 10, 10000);
}
