// #1293: a card from something shared to WeKan on a phone
// (models/lib/shareTarget.js). The same rights as adding a card on the board:
// a member who may write in that list.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { canWriteInList } from '/server/lib/listPermissionGate';

const { sharedCard } = require('/models/lib/shareTarget');

Meteor.methods({
  async shareTargetCreateCard(input) {
    check(input, { boardId: String, listId: String, title: Match.Optional(String), text: Match.Optional(String),
      url: Match.Optional(String) });
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await Boards.findOneAsync(input.boardId);
    const list = board && await Lists.findOneAsync({ _id: input.listId, boardId: board._id, archived: { $ne: true } });
    if (!board || board.archived || !list) throw new Meteor.Error('not-found');
    if (!(await canWriteInList(this.userId, board, list._id))) throw new Meteor.Error('not-authorized');
    const { title, description } = sharedCard(input);
    if (!title) throw new Meteor.Error('share-target-empty');
    const swimlane = await board.getDefaultSwimlineAsync();
    if (!swimlane) throw new Meteor.Error('not-found');
    const last = await Cards.findOneAsync({ listId: list._id, archived: false }, { sort: { sort: -1 }, fields: { sort: 1 } });
    const _id = await Cards.insertAsync({
      title,
      description,
      listId: list._id,
      boardId: board._id,
      swimlaneId: swimlane._id,
      sort: last && Number.isFinite(last.sort) ? last.sort + 1 : 0,
      type: 'cardType-card',
      cardNumber: await board.getNextCardNumber(),
      userId: this.userId,
    });
    return { cardId: _id, boardId: board._id, slug: board.slug };
  },
});
