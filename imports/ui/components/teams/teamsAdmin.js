import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Teams } from '/imports/model/teams';

class TeamAdministration extends BlazeComponent {

  onCreated() {
    super.onCreated();
    this.subscribe('teams');
    this.showOverlay = new ReactiveVar(false);
  }

  teams() {
    const user = Meteor.user();
    return user && user.teams();
  }

  selectedTeamId() {
    return Session.get('currentTeamId');
  }

  teamIsSelected(team) {
    const currentTeamId = this.selectedTeamId();
    return currentTeamId && team && team._id === currentTeamId;
  }

  events() {
    return super.events().concat([{
      'mouseenter .board-overlay'() {
        this.showOverlay.set(false);
      },
      'submit .js-add-team-form'(evt) {
        evt.preventDefault();
        const form = evt.currentTarget;
        const textarea = $(form).find('textarea');
        const teamname = textarea.val().trim();

        if (teamname) {
          // Create team; the creator is the first team member
          Teams.insert({
            name: teamname,
            members: [Meteor.userId()],
          });

          form.reset();
        }
      },
    }]);
  }
}

TeamAdministration.register('teamsAdmin');
