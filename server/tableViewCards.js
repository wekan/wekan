// #864: adding a card from the Table view - title, list and swimlane - with
// the same right as adding one on the board: a member who may write in that
// list (server/lib/listPermissionGate.js).
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { canWriteInList } from '/server/lib/listPermissionGate';

Meteor.methods({
  async tableViewAddCard(input) {
    check(input, { boardId: String, listId: String, swimlaneId: String, title: String });
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const title = input.title.replace(/\s+/g, ' ').trim().slice(0, 1000);
    if (!title) throw new Meteor.Error('table-view-empty-title');
    const board = await Boards.findOneAsync(input.boardId);
    if (!board || board.archived) throw new Meteor.Error('not-found');
    const list = await Lists.findOneAsync({ _id: input.listId, boardId: board._id, archived: { $ne: true } });
    const swimlane = await Swimlanes.findOneAsync({ _id: input.swimlaneId, boardId: board._id, archived: { $ne: true } });
    if (!list || !swimlane) throw new Meteor.Error('not-found');
    if (!(await canWriteInList(this.userId, board, list._id))) throw new Meteor.Error('not-authorized');
    const last = await Cards.findOneAsync({ listId: list._id, swimlaneId: swimlane._id, archived: false },
      { sort: { sort: -1 }, fields: { sort: 1 } });
    return Cards.insertAsync({
      title,
      listId: list._id,
      boardId: board._id,
      swimlaneId: swimlane._id,
      sort: last && Number.isFinite(last.sort) ? last.sort + 1 : 0,
      type: 'cardType-card',
      cardNumber: await board.getNextCardNumber(),
      userId: this.userId,
    });
  },
});
