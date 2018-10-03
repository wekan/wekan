Template.invitationCode.onRendered(function() {
  Meteor.subscribe('setting', {
    onReady() {
      const setting = Settings.findOne();

      if (!setting || !setting.disableRegistration) {
        $('#invitationcode').hide();
      }

      return this.stop();
    },
  });
});
