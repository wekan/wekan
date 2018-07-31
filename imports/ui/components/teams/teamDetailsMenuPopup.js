import {BlazeComponent} from 'meteor/peerlibrary:blaze-components';
import {FlowRouter} from 'meteor/kadira:flow-router';

class TeamDetailsMenuPopup extends BlazeComponent {

  events() {
    return [{
      ...super.events(),
      'click .js-delete-team': Popup.afterConfirm('teamDelete', function () {
        Meteor.call('deleteTeam', this.teamId, (err, ret) => {
          if (!err && ret) {
            Popup.close();
            FlowRouter.go('/admin/teams');
          }
        });
      }),
    }];
  }
}

TeamDetailsMenuPopup.register('teamDetailsMenuPopup');
