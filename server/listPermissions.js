import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Lists from '/models/lists';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';
import { tripCanaryDeny } from '/server/lib/canary';
import { listException } from '/server/lib/listPermissionGate';

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
