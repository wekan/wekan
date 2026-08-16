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

Template.adminPanelTabs.onCreated(function () {
  refreshProblems();
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
  isAttachmentsActive() {
    return FlowRouter.getRouteName() === 'attachments' ? 'active' : '';
  },
});
