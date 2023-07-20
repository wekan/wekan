import { ReactiveCache } from '/imports/reactiveCache';

Template.invitationCode.onRendered(function() {
  Meteor.subscribe('setting', {
    onReady() {
      const setting = ReactiveCache.getCurrentSetting();

      if (!setting || !setting.disableRegistration) {
        $('#invitationcode').hide();
      }

      return this.stop();
    },
  });
});
