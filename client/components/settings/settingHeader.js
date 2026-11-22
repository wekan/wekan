import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Reactive "are there any new problems?" flag, polled from the admin-only
// eventLogProblemAreas method, so the Problems button turns red when there are
// unacknowledged Security/Speed/Tests problems.
const hasProblemsVar = new ReactiveVar(false);
let problemsTimer = null;
function refreshProblems() {
  Meteor.call('eventLogProblemAreas', (err, res) => {
    hasProblemsVar.set(!err && Array.isArray(res) && res.length > 0);
  });
}

// Is the signed-in user a Cloud Admin here? Asked once per page load: false
// on every WeKan without the CLOUD environment variable, which is nearly all.
const cloudAdminVar = new ReactiveVar(false);
let cloudAsked = false;
function askCloud() {
  if (cloudAsked) return;
  cloudAsked = true;
  Meteor.callAsync('cloudPanelWhoAmI')
    .then(info => cloudAdminVar.set(!!(info && info.enabled && info.onCloudHost && info.isCloudAdmin)))
    .catch(() => cloudAdminVar.set(false));
}

Template.adminPanelTabs.onCreated(function () {
  refreshProblems();
  askCloud();
  problemsTimer = Meteor.setInterval(refreshProblems, 30000);
});
Template.adminPanelTabs.onDestroyed(function () {
  if (problemsTimer) Meteor.clearInterval(problemsTimer);
});

Template.adminPanelTabs.helpers({
  isProblemsActive() {
    return FlowRouter.getRouteName() === 'problems' ? 'active' : '';
  },
  // 'has-problems' → red background (see settingHeader.css) when there are new problems.
  problemsClass() {
    return hasProblemsVar.get() ? 'has-problems' : '';
  },
  isSettingsActive() {
    return FlowRouter.getRouteName() === 'setting' ? 'active' : '';
  },
  isPeopleActive() {
    return FlowRouter.getRouteName() === 'people' ? 'active' : '';
  },
  isCloudAdmin() {
    return cloudAdminVar.get();
  },
  isCloudActive() {
    return FlowRouter.getRouteName() === 'cloud-admin' ? 'active' : '';
  },
  isAttachmentsActive() {
    return FlowRouter.getRouteName() === 'attachments' ? 'active' : '';
  },
});
