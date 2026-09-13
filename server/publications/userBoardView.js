import { Meteor } from 'meteor/meteor';

// #6691: this also follows this.setUserId() during admin impersonation. The
// preference belongs to the connection's user, not every board member.
Meteor.publish('userBoardView', function() {
  if (!this.userId) return this.ready();
  return Meteor.users.find({ _id: this.userId }, {
    fields: { 'profile.boardView': 1 },
  });
});
