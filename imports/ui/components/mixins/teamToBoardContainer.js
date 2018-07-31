import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';

class TeamToBoardContainer extends BlazeComponent {

  isMember() {
    const board = Boards.findOne(Session.get('currentBoard'));
    if(!board) {
      return false;
    }

    const teamId = this.currentData()._id;
    return board.hasMember(teamId);
  }

  addMember(teamId) {
    const boardId = Session.get('currentBoard');
    const mixinParent = this.mixinParent();
    mixinParent.setLoading(true);
    Meteor.call('inviteTeamToBoard', teamId, boardId, (err) => {
      mixinParent.setLoading(false);
      if (err) mixinParent.setError(err.error);
      //else if (ret.email) mixinParent.setError('email-sent');
      else {
        Meteor.subscribe('board-team-members', boardId);
        Popup.close();
      }
    });
  }
}

export { TeamToBoardContainer };
