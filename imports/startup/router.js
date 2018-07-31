import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

const CURRENT_GROUP_ID_SESSION_KEY = 'currentTeamId';

function removeTeamIdFromSession() {
  Session.set(CURRENT_GROUP_ID_SESSION_KEY, null);
}

const adminSection = FlowRouter.team({
  prefix: '/admin',
  triggersEnter:[ AccountsTemplates.ensureSignedIn, removeTeamIdFromSession ],
});

adminSection.route('/teams', {
  name: 'admin-teams',
  action() {
    BlazeLayout.render('defaultLayout', {
      headerBar: 'teamsAdminHeaderBar',
      content: 'teamsAdmin',
    });
  },
});

adminSection.route('/team/:teamId', {
  name: 'edit-team',
  action(params) {
    const teamId = params.teamId;
    Session.set(CURRENT_GROUP_ID_SESSION_KEY, teamId);

    BlazeLayout.render('defaultLayout', {
      headerBar: 'teamsAdminHeaderBar',
      content: 'teamsAdmin',
    });
  },
});
