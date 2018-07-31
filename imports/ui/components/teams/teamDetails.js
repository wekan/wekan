import {BlazeComponent} from 'meteor/peerlibrary:blaze-components';
import 'meteor/verron:autosize';
import '/imports/ui/components/addMemberPopup';
import {Teams} from '/imports/model/teams';

class TeamAdminDetails extends BlazeComponent {
  onCreated() {
    super.onCreated();

    const teamId = this.data().teamId;

    this.autorun(() => {
      if (teamId) {
        this.subscribe('teams', () => {
          const team = Teams.findOne(teamId);
          this.subscribe('team-members', team.members);
        });
      }
    });

    this.parentComponent().showOverlay.set(true);
  }

  onDestroyed() {
    this.parentComponent().showOverlay.set(false);
  }

  team() {
    return Teams.findOne(this.data().teamId);
  }

  name() {
    const team = this.team();
    return team && team.name;
  }

  members() {
    const team = this.team();
    return team && team.memberUsers();
  }

  events() {
    return [{
      ...super.events(),
      'mouseenter .team-details'() {
        this.parentComponent().showOverlay.set(true);
      },
      'submit .js-edit-team-title-form'(evt) {
        evt.preventDefault();
        const teamname = this.currentComponent().getValue().trim();
        if (teamname) {
          this.team().setName(teamname);
        }
      },
      'click .js-manage-team-members': Popup.open('addTeamMember', { teamId: this.data().teamId }),
      'click .js-open-team-details-menu': Popup.open('teamDetailsMenu', { teamId: this.data().teamId }),
    }];
  }
}

TeamAdminDetails.register('teamDetails');

class TeamTitleEditForm extends BlazeComponent {
  onRendered() {
    super.onRendered();
    autosize(this.$('.js-edit-team-title'));
  }
}

TeamTitleEditForm.register('teamTitleEditForm');
