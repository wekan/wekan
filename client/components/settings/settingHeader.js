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

Template.settingHeaderBar.onCreated(function () {
  refreshProblems();
  problemsTimer = Meteor.setInterval(refreshProblems, 30000);
});
Template.settingHeaderBar.onDestroyed(function () {
  if (problemsTimer) Meteor.clearInterval(problemsTimer);
});

Template.settingHeaderBar.helpers({
  isProblemsActive() {
    return FlowRouter.getRouteName() === 'admin-reports' ? 'active' : '';
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
  isFeaturesActive() {
    return FlowRouter.getRouteName() === 'admin-features' ? 'active' : '';
  },
  isAttachmentsActive() {
    return FlowRouter.getRouteName() === 'attachments' ? 'active' : '';
  },
  isTranslationActive() {
    return FlowRouter.getRouteName() === 'translation' ? 'active' : '';
  },
  isInformationActive() {
    return FlowRouter.getRouteName() === 'information' ? 'active' : '';
  },
});
