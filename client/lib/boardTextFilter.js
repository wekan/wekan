import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

const matches = new Mongo.Collection('boardTextMatches');
export function boardTextSelector(term) {
  const boardId = Session.get('currentBoard');
  return { _id: { $in: matches.find({ boardId, term }, { fields: { cardId: 1 } }).fetch().map(row => row.cardId) } };
}
export function startBoardTextFilter(filter) {
  Meteor.startup(() => Tracker.autorun(computation => {
    const boardId = Session.get('currentBoard'), term = filter.value();
    if (boardId && term) {
      const handle = Meteor.subscribe('boardTextMatches', boardId, term);
      computation.onInvalidate(() => handle.stop());
    }
  }));
}
