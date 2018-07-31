import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {BlazeComponent} from 'meteor/peerlibrary:blaze-components';
// import Users Collection
// Boards Collection

const BoardContainer = BlazeComponent.extendComponent({

  isMember() {
    const userId = this.currentData()._id;
    const user = Users.findOne(userId);
    return user && user.isBoardMember();
  },

  inviteUser(idNameEmail) {
    const boardId = Session.get('currentBoard');
    const mixinParent = this.mixinParent();
    mixinParent.setLoading(true);
    Meteor.call('inviteUserToBoard', idNameEmail, boardId, (err, ret) => {
      mixinParent.setLoading(false);
      if (err) mixinParent.setError(err.error);
      else if (ret.email) mixinParent.setError('email-sent');
      else Popup.close();
    });
  },

  addMember(userId) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (!currentBoard.hasMember(userId)) {
      this.inviteUser(userId);
    }
  },
});

export {BoardContainer};
