Template.userAvatar.helpers({
  userData: function() {
    if (! this.user) {
      this.user = Users.findOne(this.userId);
    }
    return this.user;
  },
  memberType: function() {
    var userId = this.userId || this.user._id;
    var user = Users.findOne(userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },
  presenceStatusClassName: function() {
    var userPresence = Presences.findOne({ userId: this.user._id });
    if (! userPresence)
      return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else
      return 'idle';
  }
});
