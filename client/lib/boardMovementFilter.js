import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { cardDateRangeSelector } from '/models/lib/cardDateRange';
const matches = new Mongo.Collection('boardMovementMatches');
export function movementBounds(value) {
  const date = cardDateRangeSelector(value)?.createdAt;
  return date ? [date.$gte?.getTime() ?? null, date.$lt?.getTime() ?? null] : null;
}
export function boardMovementSelector(value) {
  const rangeKey = JSON.stringify(movementBounds(value));
  return { _id: { $in: matches.find({ boardId: Session.get('currentBoard'), rangeKey },
    { fields: { cardId: 1 } }).fetch().map(row => row.cardId) } };
}
export function startBoardMovementFilter(filter) {
  Meteor.startup(() => Tracker.autorun(computation => {
    const boardId = Session.get('currentBoard'), bounds = movementBounds(filter.value());
    if (boardId && bounds) {
      const handle = Meteor.subscribe('boardMovementMatches', boardId, ...bounds);
      computation.onInvalidate(() => handle.stop());
    }
  }));
}
