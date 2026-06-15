import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import {
  DEPENDENCY_TYPE_IDS,
  normalizeDependency,
  normalizeDependencies,
} from '/models/metadata/dependencies';

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
// type  : one of related-to | blocks | is-blocked-by | fixes | is-fixed-by
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

// #3392: import dependency lines into an existing board. Lines come from a
// WeKan dependencies JSON/SVG export, or are mapped from another tracker
// (Jira issue links, GitHub "blocked by", etc.). Cards are matched in the
// target board by _id first, then cardNumber, then exact title — so a file
// exported from one board can be re-applied to a copy/import of it.
Meteor.methods({
  async importBoardDependencies(boardId, lines) {
    check(boardId, String);
    check(lines, [Object]);
    await Authentication.checkBoardWriteAccess(this.userId, boardId);

    const cards = await ReactiveCache.getCards({ boardId, archived: false });
    const byId = {};
    const byNumber = {};
    const byTitle = {};
    cards.forEach(card => {
      byId[card._id] = card._id;
      if (card.cardNumber !== undefined && card.cardNumber !== null) {
        byNumber[String(card.cardNumber)] = card._id;
      }
      if (card.title) byTitle[card.title] = card._id;
    });

    const resolve = (id, number, title) => {
      if (id && byId[id]) return byId[id];
      if (number !== undefined && number !== null && byNumber[String(number)]) {
        return byNumber[String(number)];
      }
      if (title && byTitle[title]) return byTitle[title];
      return null;
    };

    let imported = 0;
    let unmatched = 0;
    for (const line of lines) {
      const fromId = resolve(line.from, line.fromCardNumber, line.fromTitle);
      const toId = resolve(line.to, line.toCardNumber, line.toTitle);
      if (!fromId || !toId || fromId === toId) {
        unmatched += 1;
        continue;
      }
      const entry = normalizeDependency({
        cardId: toId,
        type: line.type,
        color: line.color,
        icon: line.icon,
      });
      const source = await ReactiveCache.getCard(fromId);
      const existing = normalizeDependencies(source && source.cardDependencies);
      if (existing.find(d => d.cardId === toId)) {
        // Update the existing line's properties.
        await Cards.updateAsync(
          { _id: fromId, 'cardDependencies.cardId': toId },
          {
            $set: {
              'cardDependencies.$.type': entry.type,
              'cardDependencies.$.color': entry.color,
              'cardDependencies.$.icon': entry.icon,
            },
          },
        );
      } else {
        await Cards.updateAsync(fromId, {
          $push: { cardDependencies: entry },
        });
      }
      imported += 1;
    }
    return { imported, unmatched };
  },
});

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
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
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
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
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
   * @param {string} [type] relation type: related-to | blocks | is-blocked-by | fixes | is-fixed-by
   * @param {string} [color] line/badge color, any CSS color e.g. "#eb144c"
   * @param {string} [icon] FontAwesome icon name without the "fa-" prefix
   * @return_type {_id: string, cardId: string, type: string, color: string, icon: string}
   */
  WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/dependencies', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
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
   * @param {string} [type] relation type: related-to | blocks | is-blocked-by | fixes | is-fixed-by
   * @param {string} [color] line/badge color, any CSS color e.g. "#eb144c"
   * @param {string} [icon] FontAwesome icon name without the "fa-" prefix
   * @return_type {_id: string}
   */
  WebApp.handlers.put('/api/boards/:boardId/cards/:cardId/dependencies/:targetId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramCardId = req.params.cardId;
      const paramTargetId = req.params.targetId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
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
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
    }
  });
}
