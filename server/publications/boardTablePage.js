import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { selectorIsInjection } from '/server/lib/selectorGuard';
import { publishBoardMatches } from '/server/lib/publishBoardMatches';
import { boardTablePage, validTablePageOptions } from '/server/lib/boardTablePage';

Meteor.publish('boardTablePage', async function(boardId, key, selector, options) {
  check(boardId, String); check(key, String); check(selector, Object); check(options, Match.Any);
  if (!boardId || !key || key.length > 64 || !validTablePageOptions(options) ||
      selectorIsInjection(selector, 'boardTablePage')) return this.ready();
  return publishBoardMatches({ publication: this, boardId, key, identity: { key },
    collectionName: 'boardTablePages', snapshot: true, cardFields: null, boardFields: { labels: 1 },
    children: [Lists, Swimlanes].map(model => ({ model, fields: { title: 1, sort: 1, archived: 1 } })),
    findMatches: ({ scope, board, stopped }) => boardTablePage({ cards: Cards.rawCollection(),
      lists: Lists.rawCollection(), swimlanes: Swimlanes.rawCollection(), scope, board, selector, options, stopped }),
  });
});
