import { Meteor } from 'meteor/meteor';

let BoardsRestrictions;

if (Meteor.isServer) {
  BoardsRestrictions = {
    fieldNamesContainStars(userId, board, fieldNames) {
      return _.contains(fieldNames, 'stars');
    },
    denyUserIsLastAdmin(userId, doc, fieldNames, modifier) {
      if (!_.contains(fieldNames, 'members'))
        return false;

      // We only care in case of a $pull operation, ie remove a member
      if (!_.isObject(modifier.$pull && modifier.$pull.members))
        return false;

      // If there is more than one admin, it's ok to remove anyone
      const nbAdmins = _.where(doc.members, { isActive: true, isAdmin: true }).length;
      if (nbAdmins > 1)
        return false;

      // If all the previous conditions were verified, we can't remove
      // a user if it's an admin
      const removedMemberId = modifier.$pull.members.userId;
      return Boolean(_.findWhere(doc.members, {
        userId: removedMemberId,
        isAdmin: true,
      }));
    },
  };
}

export { BoardsRestrictions };
