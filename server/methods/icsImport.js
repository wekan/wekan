import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { ReactiveCache } from '/imports/reactiveCache';
import { icsToCards } from '/server/lib/icsImport';

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

    // Validate that the target list and swimlane actually belong to the board,
    // to avoid cross-board writes.
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
        userId: this.userId,
        sort: cardIds.length,
      };
      if (shape.startAt) {
        doc.startAt = shape.startAt;
      }
      if (shape.dueAt) {
        doc.dueAt = shape.dueAt;
      }
      // eslint-disable-next-line no-await-in-loop
      const cardId = await Cards.insertAsync(doc);
      cardIds.push(cardId);
    }

    return { created: cardIds.length, cardIds };
  },
});
