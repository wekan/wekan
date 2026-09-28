import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Cards from '/models/cards';
import Activities from '/models/activities';
import { cardMovementRange, CARD_MOVEMENT_EVENTS } from '/models/lib/cardMovementRange';
import { boardMovementSearch } from '/server/lib/boardMovementSearch';
import { publishBoardMatches } from '/server/lib/publishBoardMatches';

Meteor.publish('boardMovementMatches', async function(boardId, start, end) {
  check(boardId, String); check(start, Match.OneOf(Number, null)); check(end, Match.OneOf(Number, null));
  if (!boardId || !cardMovementRange(start, end)) return this.ready();
  const rangeKey = JSON.stringify([start, end]);
  return publishBoardMatches({ publication: this, boardId, key: rangeKey, identity: { rangeKey },
    collectionName: 'boardMovementMatches',
    children: [{ model: Activities, fields: { activityType: 1, createdAt: 1 },
      selector: { activityType: { $in: CARD_MOVEMENT_EVENTS } } }],
    findMatches: ({ scope, stopped }) => boardMovementSearch({ cards: Cards.rawCollection(),
      activities: Activities.rawCollection(), scope, start, end, stopped }),
  });
});
