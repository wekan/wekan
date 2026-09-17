import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Lists from '/models/lists';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';

Meteor.methods({
  async updateWipLimitGroup(boardId, groupId, fields) {
    check(boardId, String);
    check(groupId, String);
    check(fields, {
      listIds: Match.Optional([String]),
      name: Match.Optional(String),
      limit: Match.Optional(Number),
      enabled: Match.Optional(Boolean),
    });
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await Boards.findOneAsync(boardId);
    if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) {
      throw new Meteor.Error('not-authorized');
    }
    if (!board.getWipLimitGroups().some(group => group._id === groupId)) {
      throw new Meteor.Error('group-not-found');
    }
    if (fields.limit !== undefined && (!Number.isFinite(fields.limit) || fields.limit < 1)) {
      throw new Meteor.Error('invalid-limit');
    }
    if (fields.listIds !== undefined) {
      const ids = [...new Set(fields.listIds)];
      if (ids.length < 2 || ids.length !== fields.listIds.length ||
          await Lists.find({ _id: { $in: ids }, boardId, archived: false }).countAsync() !== ids.length) {
        throw new Meteor.Error('invalid-lists');
      }
    }
    const updated = await board.updateWipLimitGroup(groupId, fields);
    if (!updated) throw new Meteor.Error('conflict', 'The group changed. Please retry.');
    return updated;
  },
});
