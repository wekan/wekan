import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { boardTextSearch } from '/server/lib/boardTextSearch';
import { publishBoardMatches } from '/server/lib/publishBoardMatches';

Meteor.publish('boardTextMatches', async function(boardId, term) {
  check(boardId, String); check(term, String);
  if (!boardId || !term.trim() || term.length > 512) return this.ready();
  const sources = [
    { model: CardComments, field: 'text' },
    { model: Checklists, field: 'title' },
    { model: ChecklistItems, field: 'title' },
  ];
  return publishBoardMatches({ publication: this, boardId, key: term, identity: { term },
    collectionName: 'boardTextMatches', cardFields: { title: 1, description: 1 },
    children: sources.map(({ model, field }) => ({ model, fields: { [field]: 1 } })),
    findMatches: ({ scope, stopped }) => boardTextSearch({ cards: Cards.rawCollection(),
      children: sources.map(({ model, field }) => ({ collection: model.rawCollection(), field })),
      scope, term, stopped }),
  });
});
