import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { ReactiveCache } from '/imports/reactiveCache';
import { icsToCards } from '/server/lib/icsImport';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

// Shared import logic used by both the Meteor method and the REST endpoint.
// Validates that the target list/swimlane belong to the board (no cross-board
// writes), parses the .ics text into card shapes and inserts them.
async function importIcsCards(userId, boardId, listId, swimlaneId, icsText) {
  const list = await Lists.findOneAsync(listId);
  if (!list || list.boardId !== boardId) {
    throw new Meteor.Error('list-not-found', 'List not found on this board.');
  }
  const swimlane = await Swimlanes.findOneAsync(swimlaneId);
  if (!swimlane || swimlane.boardId !== boardId) {
    throw new Meteor.Error('swimlane-not-found', 'Swimlane not found on this board.');
  }
  const cardShapes = icsToCards(icsText, { boardId, listId, swimlaneId });
  const cardIds = [];
  for (const shape of cardShapes) {
    const doc = {
      title: shape.title,
      description: shape.description,
      boardId,
      listId,
      swimlaneId,
      userId,
      sort: cardIds.length,
    };
    if (shape.startAt) doc.startAt = shape.startAt;
    if (shape.dueAt) doc.dueAt = shape.dueAt;
    // eslint-disable-next-line no-await-in-loop
    const cardId = await Cards.insertAsync(doc);
    cardIds.push(cardId);
  }
  return { created: cardIds.length, cardIds };
}

/**
 * Server-side Meteor method for WeKan issue #6323 (part 1: import only).
 *
 * Parses an uploaded iCalendar (.ics) file and creates WeKan cards on the
 * given board / list / swimlane, populating each card's startAt and dueAt so
 * the imported events appear on the Calendar / Gantt views.
 *
 * This is import-only. Two-way Google Calendar sync is out of scope; for the
 * read-only export direction (WeKan -> iCal feed) see `wekan-ical-server`.
 */
Meteor.methods({
  /**
   * Import an .ics file into a board as cards.
   *
   * @param {string} boardId    target board id
   * @param {string} listId     target list id (cards are created here)
   * @param {string} swimlaneId target swimlane id
   * @param {string} icsText    raw .ics file contents
   * @returns {{ created: number, cardIds: string[] }}
   */
  async importIcsToBoard(boardId, listId, swimlaneId, icsText) {
    check(boardId, String);
    check(listId, String);
    check(swimlaneId, String);
    check(icsText, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    // Only board members (not read-only viewers) may create cards.
    if (typeof board.hasMember === 'function' && !board.hasMember(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You are not a member of this board.');
    }
    if (typeof board.hasReadOnly === 'function' && board.hasReadOnly(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You have read-only access to this board.');
    }

    return importIcsCards(this.userId, boardId, listId, swimlaneId, icsText);
  },
});

/**
 * @operation import_ics
 * @tag Cards
 *
 * @summary Import an iCalendar (.ics) file into a board as cards
 *
 * @description Parses the supplied iCalendar text and creates a card on the
 * given board / list / swimlane for each VEVENT, populating each card's
 * startAt (DTSTART) and dueAt (DTEND, or DTSTART when there is no DTEND) so the
 * imported events appear on the Calendar and Gantt views. Requires write access
 * to the board. See WeKan issue #6323. Import-only; two-way calendar sync is not
 * provided.
 *
 * @param {string} boardId the board ID
 * @param {string} swimlaneId the swimlane ID the cards are created in
 * @param {string} listId the list ID the cards are created in
 * @param {string} ics the raw .ics (iCalendar) file contents
 * @return_type { created: number, cardIds: string[] }
 */
WebApp.handlers.post(
  '/api/boards/:boardId/swimlanes/:swimlaneId/lists/:listId/ics',
  async function(req, res) {
    Authentication.checkLoggedIn(req.userId);
    const { boardId, swimlaneId, listId } = req.params;
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !allowIsBoardMemberWithWriteAccess(req.userId, board)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not-authorized' }));
      return;
    }
    const icsText = (req.body && (req.body.ics || req.body.icsText)) || '';
    if (typeof icsText !== 'string' || icsText.trim() === '') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing-ics', message: 'Provide the .ics file contents in the "ics" field.' }));
      return;
    }
    const result = await importIcsCards(req.userId, boardId, listId, swimlaneId, icsText);
    sendJsonResult(res, { code: 200, data: result });
  },
);
