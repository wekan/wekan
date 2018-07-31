import {Meteor} from 'meteor/meteor';
import {BlazeComponent} from 'meteor/peerlibrary:blaze-components';
import {Teams} from '/imports/model/teams';

class TeamContainer extends BlazeComponent {

  teamId() {
    return this.mixinParent().data().teamId;
  }

  currentTeam() {
    return Teams.findOne(this.teamId());
  }

  isMember() {
    const userId = this.currentData()._id;
    const team = this.currentTeam();
    return team && team.hasMember(userId);
  }

  inviteUser(idNameEmail) {
    const mixinParent = this.mixinParent();
    mixinParent.setLoading(true);
    const teamId = this.teamId();
    Meteor.call('inviteUserToTeam', idNameEmail, teamId, (err, result) => {
      mixinParent.setLoading(false);

      if (err) {
        mixinParent.setError(err.error);
      } else if (result.email) {
        mixinParent.setError('email-sent');
      } else {
        Popup.close();
      }
    });
  }

  addMember(userId) {
    if (!this.isMember()) {
      this.inviteUser(userId);
    }
  }
}

export {TeamContainer};
