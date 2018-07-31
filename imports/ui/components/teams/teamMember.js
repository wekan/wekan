import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { Teams } from '/imports/model/teams';

import '/imports/ui/components/teams/teamMember.jade';

class TeamMember extends BlazeComponent {
  onCreated() {
    super.onCreated();
    const memberId = this.currentData().memberId;
    this.autorun(() => {
      if(memberId) {
        this.subscribe('user-miniprofile', memberId);
      }
    });
  }

  name() {
    const member = this.member();
    return member && member.getName();
  }

  team() {
    return Teams.findOne(this.currentData().teamId);
  }

  member() {
    return Users.findOne(this.currentData().memberId);
  }

  events() {
    return [{
      ...super.events(),
      'click .js-remove-team-member'(evt) {
        const removeUserFromTeam = function () {
          // !! data-context of the popup !!
          Meteor.call('removeUserFromTeam', this.user._id, this.team._id, () => {
            Popup.close();
          });
        };

        Popup.afterConfirm('removeTeamMember', removeUserFromTeam)
          .call({
            user: this.member(),
            team: this.team(),
          }, evt);
      },
    }];
  }
}

TeamMember.register('teamMember');
