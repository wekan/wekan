import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Lists from '/models/lists';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';
import { tripCanaryDeny } from '/server/lib/canary';
import Swimlanes from '/models/swimlanes';
import { listException, swimlaneRefusingListIds } from '/server/lib/listPermissionGate';

// #4527 (decided 2026-10-14: per-list exceptions on top of the role matrix).
// models/lib/listPermissions.js decides; these rules apply it to every way a
// card or a comment is written. Meteor runs every allow and every deny rule:
// the allow rules below ADD what a list grants, the deny rules TAKE AWAY what
// a list refuses, and the board's own rules stay as they were for the rest.
const { cleanExceptions } = require('/models/lib/listPermissions');

async function boardOf(boardId) {
  return typeof boardId === 'string' ? await Boards.findOneAsync(boardId) : null;
}

// Only the method below may change a list's exceptions. The client never
// writes the field directly, so a direct write is an attempt to grant oneself
// access and is recorded in Admin Panel -> Problems.
Lists.deny({
  insert(userId, doc) {
    if (!doc || doc.roleExceptions === undefined) return false;
    return tripCanaryDeny('list.role-exceptions-direct', { userId });
  },
  update(userId, doc, fieldNames) {
    if (!fieldNames.includes('roleExceptions')) return false;
    return tripCanaryDeny('list.role-exceptions-direct', { userId });
  },
  fetch: [],
});

// Decided 2026-11-18 (TODO.md): archiving, restoring, deleting or moving a
// list does the same to its cards, so a list that refuses this role a write
// refuses those too. A rename, colour or reorder (sort) is not one of them. A
// board admin is never restricted (exceptionFor). Deny only: the board's own
// Lists rules decide everything else.
const LIST_CARD_FIELDS = ['archived', 'archivedAt', 'deletedAt', 'deletedBy', 'deleteBatchId', 'swimlaneId', 'boardId'];
Lists.deny({
  async update(userId, doc, fieldNames) {
    if (!fieldNames.some(field => LIST_CARD_FIELDS.includes(field))) return false;
    return (await listException(userId, await boardOf(doc.boardId), doc._id, 'write')) === false;
  },
  async remove(userId, doc) {
    return (await listException(userId, await boardOf(doc.boardId), doc._id, 'write')) === false;
  },
  fetch: ['boardId'],
});

// The same for a swimlane: archiving, deleting or moving it does the same to
// the cards in it, so any list holding them - or bound to it - that refuses
// this role refuses the swimlane change.
const SWIMLANE_CARD_FIELDS = ['archived', 'archivedAt', 'boardId'];
Swimlanes.deny({
  async update(userId, doc, fieldNames) {
    if (!fieldNames.some(field => SWIMLANE_CARD_FIELDS.includes(field))) return false;
    return (await swimlaneRefusingListIds(userId, await boardOf(doc.boardId), doc._id)).length > 0;
  },
  async remove(userId, doc) {
    return (await swimlaneRefusingListIds(userId, await boardOf(doc.boardId), doc._id)).length > 0;
  },
  fetch: ['boardId'],
});

Cards.allow({
  async insert(userId, doc) {
    return (await listException(userId, await boardOf(doc.boardId), doc.listId, 'write')) === true;
  },
  async remove(userId, doc) {
    return (await listException(userId, await boardOf(doc.boardId), doc.listId, 'write')) === true;
  },
  fetch: ['boardId', 'listId'],
});

Cards.deny({
  async insert(userId, doc) {
    return (await listException(userId, await boardOf(doc.boardId), doc.listId, 'write')) === false;
  },
  async update(userId, doc, fieldNames, modifier) {
    const board = await boardOf(doc.boardId);
    if ((await listException(userId, board, doc.listId, 'write')) === false) return true;
    // A move into another list needs that list's permission too.
    const destination = modifier && modifier.$set && modifier.$set.listId;
    if (typeof destination === 'string' && destination !== doc.listId) {
      const target = modifier.$set.boardId ? await boardOf(modifier.$set.boardId) : board;
      const rule = await listException(userId, target, destination, 'moveCard');
      if (rule === false) return true;
    }
    return false;
  },
  async remove(userId, doc) {
    return (await listException(userId, await boardOf(doc.boardId), doc.listId, 'write')) === false;
  },
  fetch: ['boardId', 'listId'],
});

async function commentRule(userId, doc) {
  const card = doc && typeof doc.cardId === 'string'
    ? await Cards.findOneAsync(doc.cardId, { fields: { boardId: 1, listId: 1 } })
    : null;
  if (!card) return undefined;
  return await listException(userId, await boardOf(card.boardId), card.listId, 'comment');
}

CardComments.allow({
  async insert(userId, doc) {
    return (await commentRule(userId, doc)) === true;
  },
  fetch: ['cardId'],
});

CardComments.deny({
  async insert(userId, doc) {
    return (await commentRule(userId, doc)) === false;
  },
  fetch: ['cardId'],
});

Meteor.methods({
  // Set (or, with an empty object, clear) a list's exceptions. Board admins
  // only - the same people who choose the roles the exceptions are about.
  async 'lists.setRoleExceptions'(listId, exceptions) {
    check(listId, String);
    check(exceptions, Match.Maybe(Object));
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const list = await Lists.findOneAsync(listId, { fields: { boardId: 1 } });
    const board = list && await boardOf(list.boardId);
    if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) {
      throw new Meteor.Error('error-notAuthorized');
    }
    const clean = cleanExceptions(exceptions);
    const modifier = Object.keys(clean).length
      ? { $set: { roleExceptions: clean } }
      : { $unset: { roleExceptions: '' } };
    await Lists.direct.updateAsync(listId, modifier);
    return clean;
  },
});
