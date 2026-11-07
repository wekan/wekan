// What the Cloud Panel's client may draw (models/lib/cloudPanel.js): whether this
// WeKan has the Cloud feature - Admin Panel / People / Cloud - and whether the
// signed-in user is the SuperAdmin on the Cloud Panel Domain. The server asks the
// same again in every method; this only decides what to show.
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

export const cloudStatus = new ReactiveVar({ enabled: false });

export async function refreshCloudStatus() {
  try {
    cloudStatus.set((await Meteor.callAsync('cloudStatus')) || { enabled: false });
  } catch (e) {
    cloudStatus.set({ enabled: false });
  }
}

Meteor.startup(() => {
  Tracker.autorun(() => {
    Meteor.userId(); // again after every sign-in and sign-out
    refreshCloudStatus();
  });
  // On the Cloud Panel Domain, the SuperAdmin's home is the Cloud Panel.
  Tracker.autorun(() => {
    FlowRouter.watchPathChange();
    if (cloudStatus.get().cloudPanel && FlowRouter.getRouteName() === 'home') FlowRouter.go('/cloud');
  });
});
