Template.invitationCode.onRendered(function() {
  Meteor.subscribe('setting', {
    onReady() {
      const setting = Utils.getCurrentSetting();

      if (!setting || !setting.disableRegistration) {
        $('#invitationcode').hide();
      }

      return this.stop();
    },
  });
});
