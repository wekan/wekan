import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
// ErrorBleed: refusals answer with their real status and a safe message.
const { publicErrorData } = require('/server/lib/apiResponseHelpers');
import {
  DEPENDENCY_TYPE_IDS,
  normalizeDependency,
  normalizeDependencies,
} from '/models/metadata/dependencies';
const { MY_DEPENDENCIES_MAX, canViewBoard, canEditBoardDependencies, canSeeCard, canEditCardDependency,
  lineKey, normalizeMyDependencies, mergeDependencyLines } = require('/models/lib/dependencyAccess');

// #3392: REST API for card-to-card dependencies ("Red Strings").
//
//   GET    /api/boards/:boardId/dependencies
//     -> all dependency lines of the board
//   GET    /api/boards/:boardId/cards/:cardId/dependencies
//     -> one card's dependencies
//   POST   /api/boards/:boardId/cards/:cardId/dependencies
//     body: { "cardId": "<targetCardId>", "type"?, "color"?, "icon"? }
//   PUT    /api/boards/:boardId/cards/:cardId/dependencies/:targetId
//     body: { "type"?, "color"?, "icon"? }
//   DELETE /api/boards/:boardId/cards/:cardId/dependencies/:targetId
//
// type  : one of related-to | blocks | is-blocked-by | fixes | is-fixed-by | duplicates | is-duplicated-by
// color : any CSS color (e.g. "#eb144c")
// icon  : a FontAwesome 4.7 icon name without the "fa-" prefix (e.g. "link")

async function dependencyLine(sourceCard, dep) {
  const target = await ReactiveCache.getCard(dep.cardId);
  return {
    from: sourceCard._id,
    fromTitle: sourceCard.title,
    fromCardNumber: sourceCard.cardNumber,
    to: dep.cardId,
    toTitle: target ? target.title : null,
    toCardNumber: target ? target.cardNumber : null,
    type: dep.type,
    color: dep.color,
    icon: dep.icon,
  };
}

// #6732: dependencies are edited through these methods only, under one rule
// (models/lib/dependencyAccess.js; design in
// docs/Features/Editor/RedStrings/Board-And-My-Dependencies.md):
//   - Board Dependencies, on the board's cards: a role that may edit OR move
//     cards; assigned-only members on the cards assigned to them.
//   - My Dependencies, in the user's profile: every user, their own, between
//     cards they can see.
//   - Showing either is the user's own preference, off by default.
// Cards are matched in imports by _id first, then cardNumber, then exact title
// - so a file exported from one board can be re-applied to a copy of it - and
// an import only ADDS lines that are not there yet.
function forbidden() {
  const error = new Meteor.Error('not-authorized', 'Not authorized');
  error.statusCode = 403;
  return error;
}
async function isSiteAdmin(userId) {
  return !!(userId && await ReactiveCache.getUser({ _id: userId, isAdmin: true }));
}
// A linked card's dependencies live on the card it points at.
async function realCard(cardId) {
  const card = await ReactiveCache.getCard(cardId);
  if (card && card.type === 'cardType-linkedCard' && card.linkedId) return ReactiveCache.getCard(card.linkedId);
  return card;
}
async function boardDependencyContext(userId, sourceCardId, targetCardId) {
  if (!userId) throw forbidden();
  const source = await realCard(sourceCardId);
  const target = targetCardId === undefined ? undefined : await ReactiveCache.getCard(targetCardId);
  const board = source && await ReactiveCache.getBoard(source.boardId);
  if (!board || (target !== undefined && (!target || target.boardId !== source.boardId || target._id === source._id))) {
    throw new Meteor.Error('dependency-invalid', 'Both cards must be different cards of the same board.');
  }
  if (!canEditCardDependency(board, userId, source, target) && !await isSiteAdmin(userId)) throw forbidden();
  return { board, source, target };
}
async function writeBoardDependencies(cardId, next) {
  await Cards.updateAsync(cardId, { $set: { cardDependencies: next } });
}
function resolverFor(cards) {
  const byId = {}, byNumber = {}, byTitle = {};
  cards.forEach(card => {
    byId[card._id] = card;
    if (card.cardNumber !== undefined && card.cardNumber !== null) byNumber[String(card.cardNumber)] = card;
    if (card.title) byTitle[card.title] = card;
  });
  return (id, number, title) => (id && byId[id]) ||
    (number !== undefined && number !== null && byNumber[String(number)]) || (title && byTitle[title]) || null;
}
async function viewableBoard(userId, boardId) {
  const board = await ReactiveCache.getBoard(boardId);
  if (!board) throw new Meteor.Error('board-not-found', 'Board not found');
  if (!canViewBoard(board, userId) && !await isSiteAdmin(userId)) throw forbidden();
  return board;
}
async function myDependencies(userId) {
  const user = await Meteor.users.findOneAsync(userId, { fields: { 'profile.myDependencies': 1 } });
  return normalizeMyDependencies(user && user.profile && user.profile.myDependencies, normalizeDependency);
}
async function saveMyDependencies(userId, list) {
  if (list.length > MY_DEPENDENCIES_MAX) {
    throw new Meteor.Error('dependency-limit', `At most ${MY_DEPENDENCIES_MAX} of your own dependencies can be saved.`);
  }
  await Meteor.users.updateAsync(userId, { $set: { 'profile.myDependencies': list } });
}
const myKey = row => lineKey(row.boardId, row.cardId, row.targetCardId);
const LAYER_FIELDS = { board: 'profile.showBoardDependencies', mine: 'profile.showMyDependencies' };

Meteor.methods({
  // Show or hide a layer for THIS user only.
  async setDependencyVisibility(layer, show) {
    check(layer, Match.OneOf('board', 'mine'));
    check(show, Boolean);
    if (!this.userId) throw forbidden();
    await Meteor.users.updateAsync(this.userId, { $set: { [LAYER_FIELDS[layer]]: show } });
    return show;
  },

  // Add a Board Dependency, or change the given properties of an existing one.
  async setBoardDependency(sourceCardId, targetCardId, props = {}) {
    check(sourceCardId, String);
    check(targetCardId, String);
    check(props, Match.ObjectIncluding({}));
    const { source } = await boardDependencyContext(this.userId, sourceCardId, targetCardId);
    const deps = normalizeDependencies(source.cardDependencies);
    const existing = deps.find(dep => dep.cardId === targetCardId);
    const pick = key => (typeof props[key] === 'string' && props[key] ? props[key] : existing && existing[key]);
    const entry = normalizeDependency({ cardId: targetCardId, type: pick('type'), color: pick('color'), icon: pick('icon') });
    await writeBoardDependencies(source._id, existing
      ? deps.map(dep => (dep.cardId === targetCardId ? entry : dep)) : [...deps, entry]);
    return entry;
  },

  async removeBoardDependency(sourceCardId, targetCardId) {
    check(sourceCardId, String);
    check(targetCardId, String);
    const { source } = await boardDependencyContext(this.userId, sourceCardId);
    await writeBoardDependencies(source._id,
      normalizeDependencies(source.cardDependencies).filter(dep => dep.cardId !== targetCardId));
    return true;
  },

  // Import into the board: only roles that may edit or move cards; only lines
  // whose cards this user may edit; only lines not already on the board.
  async importBoardDependencies(boardId, lines) {
    check(boardId, String);
    check(lines, [Object]);
    if (!this.userId) throw forbidden();
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) throw new Meteor.Error('board-not-found', 'Board not found');
    const admin = await isSiteAdmin(this.userId);
    if (!canEditBoardDependencies(board, this.userId) && !admin) throw forbidden();
    const cards = await ReactiveCache.getCards({ boardId, archived: false });
    const resolve = resolverFor(cards);
    const additions = new Map();
    let unmatched = 0, skipped = 0;
    for (const line of lines) {
      const from = resolve(line.from, line.fromCardNumber, line.fromTitle);
      const to = resolve(line.to, line.toCardNumber, line.toTitle);
      if (!from || !to || from._id === to._id || (!admin && !canEditCardDependency(board, this.userId, from, to))) {
        unmatched += 1;
        continue;
      }
      const present = normalizeDependencies(from.cardDependencies).some(dep => dep.cardId === to._id) ||
        (additions.get(from._id) || []).some(dep => dep.cardId === to._id);
      if (present) { skipped += 1; continue; }
      additions.set(from._id, [...(additions.get(from._id) || []),
        normalizeDependency({ cardId: to._id, type: line.type, color: line.color, icon: line.icon })]);
    }
    let imported = 0;
    for (const [cardId, added] of additions) {
      const card = await ReactiveCache.getCard(cardId);
      const existing = normalizeDependencies(card && card.cardDependencies);
      const fresh = added.filter(dep => !existing.some(old => old.cardId === dep.cardId));
      skipped += added.length - fresh.length;
      if (!fresh.length) continue;
      await writeBoardDependencies(cardId, [...existing, ...fresh]);
      imported += fresh.length;
    }
    return { imported, skipped, unmatched };
  },

  // My Dependencies: this user's own lines, between cards they can see.
  async setMyDependency(sourceCardId, targetCardId, props = {}) {
    check(sourceCardId, String);
    check(targetCardId, String);
    check(props, Match.ObjectIncluding({}));
    if (!this.userId) throw forbidden();
    const [source, target] = await Promise.all([ReactiveCache.getCard(sourceCardId), ReactiveCache.getCard(targetCardId)]);
    const board = source && await viewableBoard(this.userId, source.boardId);
    if (!board || !target || target.boardId !== source.boardId || source._id === target._id ||
        !canSeeCard(board, this.userId, source) || !canSeeCard(board, this.userId, target)) throw forbidden();
    const list = await myDependencies(this.userId);
    const at = list.findIndex(row => myKey(row) === lineKey(board._id, source._id, target._id));
    const old = at >= 0 ? list[at] : null;
    const pick = key => (typeof props[key] === 'string' && props[key] ? props[key] : old && old[key]);
    const [row] = normalizeMyDependencies([{ boardId: board._id, cardId: source._id, targetCardId: target._id,
      type: pick('type'), color: pick('color'), icon: pick('icon') }], normalizeDependency);
    if (at >= 0) list[at] = row; else list.push(row);
    await saveMyDependencies(this.userId, list);
    return row;
  },

  async removeMyDependency(boardId, sourceCardId, targetCardId) {
    check(boardId, String);
    check(sourceCardId, String);
    check(targetCardId, String);
    if (!this.userId) throw forbidden();
    const key = lineKey(boardId, sourceCardId, targetCardId);
    const list = await myDependencies(this.userId);
    await saveMyDependencies(this.userId, list.filter(row => myKey(row) !== key));
    return true;
  },

  async importMyDependencies(boardId, lines) {
    check(boardId, String);
    check(lines, [Object]);
    if (!this.userId) throw forbidden();
    const board = await viewableBoard(this.userId, boardId);
    const cards = (await ReactiveCache.getCards({ boardId, archived: false }))
      .filter(card => canSeeCard(board, this.userId, card));
    const resolve = resolverFor(cards);
    const incoming = [];
    let unmatched = 0;
    for (const line of lines) {
      const from = resolve(line.from, line.fromCardNumber, line.fromTitle);
      const to = resolve(line.to, line.toCardNumber, line.toTitle);
      if (!from || !to || from._id === to._id) { unmatched += 1; continue; }
      incoming.push({ boardId, cardId: from._id, targetCardId: to._id, type: line.type, color: line.color, icon: line.icon });
    }
    const list = await myDependencies(this.userId);
    // Normalizing drops duplicates within the file itself; those count as skipped too.
    const normalized = normalizeMyDependencies(incoming, normalizeDependency);
    const { added, skipped } = mergeDependencyLines(list, normalized, myKey);
    if (added.length) await saveMyDependencies(this.userId, [...list, ...added]);
    return { imported: added.length, skipped: skipped + incoming.length - normalized.length, unmatched };
  },
});

// The REST write routes follow the same rule as the methods (#6732): a role
// that may edit or move cards, on cards the caller can see.
async function checkRestDependencyAccess(userId, boardId, cardId, targetId) {
  Authentication.checkLoggedIn(userId);
  const board = await ReactiveCache.getBoard(boardId);
  Authentication.checkBoardExists(board);
  // Board-level first, so a caller without the right cannot probe which cards exist.
  await Authentication.checkAdminOrCondition(userId, canEditBoardDependencies(board, userId));
  const card = await ReactiveCache.getCard({ _id: cardId, boardId });
  const target = typeof targetId === 'string' && targetId ? await ReactiveCache.getCard({ _id: targetId, boardId }) : undefined;
  // A missing card is reported by the route itself as 404 / 400.
  if (!card || target === null) return;
  await Authentication.checkAdminOrCondition(userId,
    canEditCardDependency(board, userId, card, target || undefined));
}

if (Meteor.isServer) {
  /**
   * @operation get_board_dependencies
   * @tag Dependencies
   * @summary Get all card dependency lines ("Red Strings") of a board
   *
   * @param {string} boardId the board ID
   * @return_type [{from: string, fromTitle: string, fromCardNumber: number, to: string, toTitle: string, toCardNumber: number, type: string, color: string, icon: string}]
   */
  WebApp.handlers.get('/api/boards/:boardId/dependencies', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardAccess(req.userId, paramBoardId);
      const cards = await ReactiveCache.getCards({
        boardId: paramBoardId,
        archived: false,
      });
      const data = [];
      for (const card of cards) {
        const deps = normalizeDependencies(card.cardDependencies);
        for (const dep of deps) {
          // eslint-disable-next-line no-await-in-loop
          data.push(await dependencyLine(card, dep));
        }
      }
      sendJsonResult(res, { code: 200, data });
    } catch (error) {
      sendJsonResult(res, publicErrorData(error));
    }
  });

  /**
   * @operation get_card_dependencies
   * @tag Dependencies
   * @summary Get one card's dependencies
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @return_type [{cardId: string, type: string, color: string, icon: string}]
   */
  WebApp.handlers.get('/api/boards/:boardId/cards/:cardId/dependencies', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardAccess(req.userId, paramBoardId);
      const card = await ReactiveCache.getCard({
        _id: req.params.cardId,
        boardId: paramBoardId,
      });
      if (!card) throw new Meteor.Error('not-found', 'Card not found');
      sendJsonResult(res, {
        code: 200,
        data: normalizeDependencies(card.cardDependencies),
      });
    } catch (error) {
      sendJsonResult(res, publicErrorData(error));
    }
  });

  /**
   * @operation new_card_dependency
   * @tag Dependencies
   * @summary Add (or update) a typed dependency line from a card to another card
   *
   * @description The target card must be on the same board. If the dependency
   * already exists, its type/color/icon are updated.
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the source card ID
   * @param {string} cardId_dependency the target card ID (body field "cardId")
   * @param {string} [type] relation type: related-to | blocks | is-blocked-by | fixes | is-fixed-by | duplicates | is-duplicated-by
   * @param {string} [color] line/badge color, any CSS color e.g. "#eb144c"
   * @param {string} [icon] FontAwesome icon name without the "fa-" prefix
   * @return_type {_id: string, cardId: string, type: string, color: string, icon: string}
   */
  WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/dependencies', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      await checkRestDependencyAccess(req.userId, paramBoardId, paramCardId, req.body && (req.body.cardId || req.body.dependsOn));
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) throw new Meteor.Error('not-found', 'Card not found');

      const targetId = req.body.cardId || req.body.dependsOn;
      if (!targetId || targetId === paramCardId) {
        throw new Meteor.Error('bad-request', 'A valid target cardId is required');
      }
      if (req.body.type && !DEPENDENCY_TYPE_IDS.includes(req.body.type)) {
        throw new Meteor.Error('bad-request', `type must be one of: ${DEPENDENCY_TYPE_IDS.join(', ')}`);
      }
      const target = await ReactiveCache.getCard({
        _id: targetId,
        boardId: paramBoardId,
      });
      if (!target) {
        throw new Meteor.Error('bad-request', 'Target card is not on this board');
      }

      const deps = normalizeDependencies(card.cardDependencies);
      const existing = deps.find(d => d.cardId === targetId);
      const entry = normalizeDependency({
        cardId: targetId,
        type: req.body.type || (existing && existing.type),
        color: req.body.color || (existing && existing.color),
        icon: req.body.icon || (existing && existing.icon),
      });
      if (existing) {
        await Cards.updateAsync(
          { _id: paramCardId, 'cardDependencies.cardId': targetId },
          {
            $set: {
              'cardDependencies.$.type': entry.type,
              'cardDependencies.$.color': entry.color,
              'cardDependencies.$.icon': entry.icon,
            },
          },
        );
      } else {
        await Cards.updateAsync(paramCardId, {
          $push: { cardDependencies: entry },
        });
      }
      sendJsonResult(res, { code: 200, data: { _id: paramCardId, ...entry } });
    } catch (error) {
      sendJsonResult(res, publicErrorData(error));
    }
  });

  /**
   * @operation edit_card_dependency
   * @tag Dependencies
   * @summary Edit a dependency line's type, color or icon
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the source card ID
   * @param {string} targetId the target card ID of the dependency
   * @param {string} [type] relation type: related-to | blocks | is-blocked-by | fixes | is-fixed-by | duplicates | is-duplicated-by
   * @param {string} [color] line/badge color, any CSS color e.g. "#eb144c"
   * @param {string} [icon] FontAwesome icon name without the "fa-" prefix
   * @return_type {_id: string}
   */
  WebApp.handlers.put('/api/boards/:boardId/cards/:cardId/dependencies/:targetId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      const paramTargetId = req.params.targetId;
      await checkRestDependencyAccess(req.userId, paramBoardId, paramCardId);
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) throw new Meteor.Error('not-found', 'Card not found');
      if (req.body.type && !DEPENDENCY_TYPE_IDS.includes(req.body.type)) {
        throw new Meteor.Error('bad-request', `type must be one of: ${DEPENDENCY_TYPE_IDS.join(', ')}`);
      }
      const modifier = {};
      ['type', 'color', 'icon'].forEach(key => {
        if (req.body[key] !== undefined) {
          modifier[`cardDependencies.$.${key}`] = req.body[key];
        }
      });
      if (Object.keys(modifier).length === 0) {
        throw new Meteor.Error('bad-request', 'Provide at least one of type, color, icon');
      }
      await Cards.updateAsync(
        { _id: paramCardId, 'cardDependencies.cardId': paramTargetId },
        { $set: modifier },
      );
      sendJsonResult(res, { code: 200, data: { _id: paramCardId } });
    } catch (error) {
      sendJsonResult(res, publicErrorData(error));
    }
  });

  /**
   * @operation delete_card_dependency
   * @tag Dependencies
   * @summary Remove a dependency line from a card
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the source card ID
   * @param {string} targetId the target card ID of the dependency to remove
   * @return_type {_id: string}
   */
  WebApp.handlers.delete('/api/boards/:boardId/cards/:cardId/dependencies/:targetId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      await checkRestDependencyAccess(req.userId, paramBoardId, paramCardId);
      const card = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId: paramBoardId,
      });
      if (!card) throw new Meteor.Error('not-found', 'Card not found');
      await Cards.updateAsync(paramCardId, {
        $pull: { cardDependencies: { cardId: req.params.targetId } },
      });
      sendJsonResult(res, { code: 200, data: { _id: paramCardId } });
    } catch (error) {
      sendJsonResult(res, publicErrorData(error));
    }
  });
}
