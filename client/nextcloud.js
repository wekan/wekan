import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';

Meteor.startup(() => {
  if (!Meteor.settings.public?.nextcloudExApp) return;
  let pending = false;
  let retry;
  const login = () => {
    if (pending || !Meteor.status().connected || Meteor.userId()) return;
    pending = true;
    Accounts.callLoginMethod({
      methodArguments: [{ nextcloud: true }],
      userCallback(error) {
        pending = false;
        if (error) {
          // Bounded frequency, including a denied/disabled Nextcloud account.
          clearTimeout(retry);
          retry = setTimeout(login, 10000);
        }
      },
    });
  };
  Tracker.autorun(() => {
    Meteor.status();
    Meteor.userId();
    if (!pending) Tracker.nonreactive(login);
  });
});
